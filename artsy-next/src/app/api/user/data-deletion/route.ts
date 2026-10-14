import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

/**
 * DPDP Act (v2.0) Data Erasure / Deletion Request Route (§4.4, §10.2, §10.3)
 * Right to Erasure:
 * 1. Inserts request into data_deletion_requests
 * 2. Anonymizes PII (phone, email, full_name)
 * 3. Anonymizes creator profile (PAN, bank details)
 * 4. Invalidates active sessions and deletes OTP sessions
 * 5. Preserves statutory financial ledger records with anonymized identifier
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

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
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
      console.log(`[DPDP AUDIT] Admin ${authUser.id} initiated data deletion for user ${userId}. Reason: ${reason || 'Admin action'}`);
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

      const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE;
      const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

      const isSuperAdminAccount =
        user.role === 'super_admin' ||
        (SUPER_ADMIN_PHONE && user.phone === SUPER_ADMIN_PHONE) ||
        (SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL);

      if (isSuperAdminAccount) {
        return NextResponse.json({ error: 'Super Admin account cannot be deleted' }, { status: 403 });
      }

      // 2. Check for active uncompleted projects
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('id, status')
        .eq('client_id', userId)
        .not('status', 'in', '("completed","cancelled","refunded","archived")');

      if (activeProjects && activeProjects.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot erase data while projects are currently active/in-progress. Please cancel or complete them first.'
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

      // 4. Fix I: Anonymize user PII in public.users with UNIQUE phone & email
      const anonymizedTag = `deleted_${userId.slice(0, 8)}_${Date.now().toString().slice(-4)}`;
      const uniqueAnonymizedPhone = `+9100${Math.floor(10000000 + Math.random() * 90000000)}`;

      await supabase
        .from('users')
        .update({
          full_name: 'Anonymized User (DPDP)',
          email: `${anonymizedTag}@deleted.artsyproduction.in`,
          phone: uniqueAnonymizedPhone,
          token_version: 999999, // Invalidate all active tokens
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // 5. Cascade anonymization to creator_profiles (wipe PAN, bank details)
      await supabase
        .from('creator_profiles')
        .update({
          pan_number: null,
          bank_account: null,
          ifsc: null,
          upi_id: null,
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // 6. Delete OTP sessions
      if (user.phone) {
        await supabase
          .from('otp_sessions')
          .delete()
          .eq('phone', user.phone);
      }

      return NextResponse.json({
        success: true,
        message: 'DPDP Data Erasure request processed. PII has been securely anonymized.',
        requestId: deletionRequest?.id || 'req_completed'
      });
    }

    // Mock Mode Execution
    console.log(`[DPDP DELETION] Simulated PII anonymization for userId: ${userId}`);
    return NextResponse.json({
      success: true,
      message: 'DPDP Data Erasure simulated in offline mock mode. PII masked.',
      mockUserId: userId
    });
  } catch (err: unknown) {
    console.error('[INTERNAL] [DPDP DELETION ERROR]:', err);
    return NextResponse.json(
      { error: 'Unable to process data deletion request' },
      { status: 500 }
    );
  }
}
