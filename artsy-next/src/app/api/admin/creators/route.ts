import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const authUser = getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('id');

  try {
    // If specific creator detail requested
    if (creatorId) {
      const { data: creatorUser } = await dbClient
        .from('users')
        .select('*')
        .eq('id', creatorId)
        .single();

      const { data: profile } = await dbClient
        .from('creator_profiles')
        .select('*')
        .eq('id', creatorId)
        .maybeSingle();

      if (!creatorUser && !profile) {
        return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
      }

      // Fetch creator assignments
      const { data: assignments } = await dbClient
        .from('assignments')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      // Fetch creator payouts with TDS breakdown
      const { data: payouts } = await dbClient
        .from('creator_payouts')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      // Fetch revisions submitted / assigned
      const { data: revisions } = await dbClient
        .from('revisions')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      // Active projects count
      const { count: activeWorkload } = await dbClient
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_creator_id', creatorId)
        .in('status', ['creator_assigned', 'in_production', 'review_ready', 'revision_requested']);

      return NextResponse.json({
        success: true,
        creator: {
          id: creatorId,
          display_name: creatorUser?.full_name || 'Creator',
          phone: creatorUser?.phone || '',
          email: creatorUser?.email || '',
          status: creatorUser?.status || 'active',
          profile: profile || {},
          assignments: assignments || [],
          payouts: payouts || [],
          revisions: revisions || [],
          metrics: {
            activeWorkload: activeWorkload || 0,
            totalProjectsCompleted: profile?.total_projects_completed || (assignments || []).filter((a: any) => a.status === 'completed').length,
            rating: 4.9, // Studio average rating benchmark
          },
        },
      });
    }

    // Default: List all creators
    const { data: creatorUsers } = await dbClient
      .from('users')
      .select('id, full_name, phone, email, role, status, created_at')
      .eq('role', 'freelancer')
      .order('created_at', { ascending: false });

    const { data: profiles } = await dbClient
      .from('creator_profiles')
      .select('*');

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = p;
    });

    // Payout stats for total_earned
    const { data: payouts } = await dbClient
      .from('creator_payouts')
      .select('creator_id, gross_amount, net_payout, status');

    const earnedMap: Record<string, number> = {};
    (payouts || []).forEach((pay: any) => {
      if (pay.creator_id && pay.status === 'processed') {
        earnedMap[pay.creator_id] = (earnedMap[pay.creator_id] || 0) + (pay.net_payout || 0);
      }
    });

    const creators = (creatorUsers || []).map((u: any) => {
      const p = profileMap[u.id] || {};
      return {
        id: u.id,
        display_name: u.full_name || 'Creator Member',
        phone: u.phone || '',
        email: u.email || '',
        skills: p.skills || ['Video Editing', 'Color Grading'],
        approval_status: p.approval_status || 'pending',
        is_suspended: p.is_suspended || u.status === 'suspended',
        rating: 4.9,
        total_jobs: p.total_projects_completed || 0,
        total_earned: earnedMap[u.id] || 0,
        created_at: u.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      creators,
    });
  } catch (err: any) {
    console.error('Error fetching creators:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authUser = getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id, action, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Creator ID and action required' }, { status: 400 });
    }

    if (!['approve', 'reject', 'suspend', 'reactivate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let profileUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
    let userUpdate: Record<string, any> = { updated_at: new Date().toISOString() };

    if (action === 'approve') {
      profileUpdate.approval_status = 'approved';
      profileUpdate.approved_by = authUser.id;
      profileUpdate.approved_at = new Date().toISOString();
      userUpdate.status = 'active';
    } else if (action === 'reject') {
      profileUpdate.approval_status = 'rejected';
      profileUpdate.rejection_reason = reason || 'Portfolio review criteria not met';
      userUpdate.status = 'inactive';
    } else if (action === 'suspend') {
      profileUpdate.is_suspended = true;
      profileUpdate.suspended_reason = reason || 'Administrative suspension';
      profileUpdate.suspended_at = new Date().toISOString();
      userUpdate.status = 'suspended';
    } else if (action === 'reactivate') {
      profileUpdate.is_suspended = false;
      profileUpdate.suspended_reason = null;
      userUpdate.status = 'active';
    }

    // Update profile
    await dbClient.from('creator_profiles').update(profileUpdate).eq('id', id);
    // Update user
    await dbClient.from('users').update(userUpdate).eq('id', id);

    // Record audit log
    await dbClient.from('audit_logs').insert([
      {
        admin_id: authUser.id,
        admin_email: authUser.email || 'admin@artsyproduction.com',
        action: `CREATOR_${action.toUpperCase()}`,
        target_table: 'creator_profiles',
        target_id: id,
        new_values: { action, reason: reason || null },
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, creatorId: id, action });
  } catch (err: any) {
    console.error('Error updating creator:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
