import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getAuthenticatedUser, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';
import { isSuperAdminAccount } from '@/lib/auth-utils';

/**
 * DPDP Act (v2.0) Data Erasure / Deletion Request Route (§4.4, §10.2, §10.3)
 * Right to Erasure:
 * 1. Inserts request into data_deletion_requests
 * 2. Anonymizes PII (phone, email, full_name, avatar_url)
 * 3. Anonymizes creator profile (PAN, bank details, bio, portfolio)
 * 4. Invalidates active sessions and deletes OTP sessions
 * 5. Clears authentication cookie
 * 6. Preserves statutory financial ledger records with anonymized identifier
 */
export async function POST(request: NextRequest) {
  // M9: Safe JSON parsing
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  try {
    const { userId, reason } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 });
    }

    // 1. Authenticate caller identity
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    // 2. Authorization check: caller must be owner or admin
    const isOwner = authUser.id === userId;
    const isAdmin = ['admin', 'super_admin'].includes(authUser.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to request deletion for this user' },
        { status: 403 }
      );
    }

    if (isAdmin && !isOwner) {
      console.log(`[DPDP AUDIT] Admin ${authUser.id} initiated data deletion for user [REDACTED]. Reason: [REDACTED]`);
    }

    if (supabase) {
      // 1. Verify user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, phone, role')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (isSuperAdminAccount(user)) {
        return NextResponse.json({ error: 'Super Admin account cannot be deleted' }, { status: 403 });
      }

      // 2. Check for active uncompleted projects
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('id, status')
        .or(`client_id.eq.${userId},assigned_creator_id.eq.${userId}`)
        .not('status', 'in', '("completed","cancelled","refunded","archived")');

      if (activeProjects && activeProjects.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot erase data while projects are currently active or in-progress. Please complete or cancel them first.'
          },
          { status: 409 }
        );
      }

      // 3. Insert record into data_deletion_requests
      const { data: deletionRequest } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      // 4. Anonymize user PII in public.users with UNIQUE phone & email
      const anonymizedTag = `deleted_${userId.slice(0, 8)}_${Date.now().toString().slice(-4)}`;
      const uniqueAnonymizedPhone = `+9100${Math.floor(10000000 + Math.random() * 90000000)}`;

      await supabase
        .from('users')
        .update({
          full_name: 'Anonymized User (DPDP)',
          email: `${anonymizedTag}@deleted.artsyproduction.in`,
          phone: uniqueAnonymizedPhone,
          avatar_url: null,
          token_version: 999999, // Invalidate all active tokens
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // 5. Cascade anonymization to creator_profiles (wipe PAN, bank details, bio)
      await supabase
        .from('creator_profiles')
        .update({
          pan_number: null,
          bank_account_name: null,
          bank_account_number: null,
          bank_ifsc_code: null,
          bank_account: null,
          ifsc: null,
          upi_id: null,
          bio: 'Anonymized Creator Profile',
          portfolio_url: null,
          sample_links: [],
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .or(`id.eq.${userId},user_id.eq.${userId}`);

      // 6. Delete OTP sessions
      if (user.phone) {
        await supabase
          .from('otp_sessions')
          .delete()
          .eq('phone', user.phone);
      }

      // 7. Anonymize lead inquiries if any exist
      if (user.email) {
        await supabase
          .from('leads')
          .update({
            name: 'Anonymized User',
            email: 'deleted@deleted.artsyproduction.in',
            phone: '0000000000',
            message: '[REDACTED]'
          })
          .eq('email', user.email);
      }

      const response = NextResponse.json({
        success: true,
        message: 'DPDP Data Erasure request processed. Personal data has been securely anonymized.',
        requestId: deletionRequest?.id || 'req_completed'
      });

      if (isOwner) {
        response.cookies.delete(AUTH_COOKIE_NAME);
      }

      return response;
    }

    // Mock Mode Execution
    console.log('[DPDP DELETION] Simulated PII anonymization completed: [REDACTED]');
    const mockResponse = NextResponse.json({
      success: true,
      message: 'DPDP Data Erasure simulated in offline mock mode. PII masked.',
      mockUserId: 'anonymized'
    });

    if (isOwner) {
      mockResponse.cookies.delete(AUTH_COOKIE_NAME);
    }

    return mockResponse;
  } catch (err: unknown) {
    console.error('[INTERNAL] [DPDP DELETION ERROR]:', err);
    return NextResponse.json(
      { error: 'Unable to process data deletion request' },
      { status: 500 }
    );
  }
}
