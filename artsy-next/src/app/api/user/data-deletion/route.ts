import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

/**
 * DPDP Act (v2.0) Data Erasure / Deletion Request Route (§4.4, §10.2, §10.3)
 * Right to Erasure:
 * 1. Inserts request into data_deletion_requests
 * 2. Anonymizes PII (phone, email, full_name)
 * 3. Preserves statutory financial ledger records with anonymized identifier
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // 1. Authenticate caller identity
    const authUser = getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    // 2. Authorization check: caller must be owner or admin
    const isOwner = authUser.id === userId;
    const isAdmin = authUser.role === 'admin';

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
        .select('id, email, phone')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 2. Check for active uncompleted projects
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('id, status')
        .eq('user_id', userId)
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

      // 4. Anonymize user PII in public.users
      const anonymizedTag = `deleted_${userId.slice(0, 8)}`;
      await supabase
        .from('users')
        .update({
          full_name: 'Anonymized User (DPDP)',
          email: `${anonymizedTag}@deleted.artsyproduction.in`,
          phone: `+910000000000`,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

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
  } catch (err: any) {
    console.error('[DPDP DELETION ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal deletion error' },
      { status: 500 }
    );
  }
}
