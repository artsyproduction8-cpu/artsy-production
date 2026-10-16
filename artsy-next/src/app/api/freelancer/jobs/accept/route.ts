import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';

/**
 * POST /api/freelancer/jobs/accept
 * Body: { projectId: string }
 *
 * 1. Verifies freelancer authentication via signed cookie
 * 2. Inserts row into assignments table: { project_id, creator_id, status: 'accepted', ... }
 * 3. Updates projects.status to 'creator_assigned' and sets assigned_creator_id
 * 4. Sends notification to admin (Event 11: CREATOR_ASSIGNED)
 * 5. Returns { success: true, assignment_id }
 */
export async function POST(request: NextRequest) {
  try {
    // Security Fix #5: Strict freelancer authentication; remove silent demo fallback
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['freelancer', 'admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Freelancer access required' }, { status: 401 });
    }

    const creatorId = authUser.id;
    const isAdmin = ['admin', 'super_admin'].includes(authUser.role);

    const body = await request.json().catch(() => ({}));
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Creator vetting verification: Non-admin freelancers must be approved and active
    if (!isAdmin) {
      const { data: creatorProfile, error: profileErr } = await supabaseAdmin
        .from('creator_profiles')
        .select('approval_status, is_suspended')
        .eq('id', creatorId)
        .maybeSingle();

      if (profileErr || !creatorProfile || creatorProfile.approval_status !== 'approved' || creatorProfile.is_suspended) {
        return NextResponse.json(
          { error: 'Forbidden: Your creator profile must be approved and active to accept projects.' },
          { status: 403 }
        );
      }
    }

    // 2. Resolve Project Record in Supabase
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
    
    let resolvedProjectId: string = '';
    let projectNumber: string = projectId;
    let targetProject: any = null;

    if (isUUID) {
      const { data: existingProj } = await supabaseAdmin
        .from('projects')
        .select('id, project_number, status, assigned_creator_id')
        .eq('id', projectId)
        .maybeSingle();

      if (existingProj) {
        resolvedProjectId = existingProj.id;
        projectNumber = existingProj.project_number || projectId;
        targetProject = existingProj;
      }
    } else {
      const { data: existingProj } = await supabaseAdmin
        .from('projects')
        .select('id, project_number, status, assigned_creator_id')
        .eq('project_number', projectId)
        .maybeSingle();

      if (existingProj) {
        resolvedProjectId = existingProj.id;
        projectNumber = existingProj.project_number;
        targetProject = existingProj;
      }
    }

    // Fail closed: Project must exist
    if (!resolvedProjectId || !targetProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 3. Ownership & State Verification (Anti-IDOR / Anti-Hijacking)
    // Check if project is already assigned to a DIFFERENT creator
    if (targetProject.assigned_creator_id && targetProject.assigned_creator_id !== creatorId && !isAdmin) {
      return NextResponse.json(
        { error: 'Conflict: This project has already been assigned to another creator.' },
        { status: 409 }
      );
    }

    // Check project status eligibility
    const nonAssignableStatuses = [
      'in_progress',
      'submitted',
      'qa_review',
      'client_review',
      'approved',
      'final_delivery',
      'completed',
      'cancelled',
      'refunded',
      'archived',
      'disputed'
    ];
    if (nonAssignableStatuses.includes(targetProject.status) && targetProject.assigned_creator_id !== creatorId) {
      return NextResponse.json(
        { error: `Conflict: Project is currently in status "${targetProject.status}" and cannot be accepted.` },
        { status: 409 }
      );
    }

    // 4. Verify assignment offers
    const { data: existingAssignments } = await supabaseAdmin
      .from('assignments')
      .select('id, creator_id, status')
      .eq('project_id', resolvedProjectId)
      .in('status', ['offered', 'accepted'])
      .order('created_at', { ascending: false });

    // If an assignment offer was explicitly made to another creator and is pending, reject unauthorized claim
    const offerForOther = existingAssignments?.find(
      (a: any) => a.status === 'offered' && a.creator_id !== creatorId
    );
    if (offerForOther && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: This project was offered to another creator and is awaiting their response.' },
        { status: 403 }
      );
    }

    // 5. Update projects.status to 'creator_assigned' atomically
    const { error: updateProjErr } = await supabaseAdmin
      .from('projects')
      .update({
        status: 'creator_assigned',
        assigned_creator_id: creatorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resolvedProjectId);

    if (updateProjErr) {
      console.error('[ACCEPT JOB] Error updating project status:', updateProjErr);
      return NextResponse.json(
        { error: 'Failed to update project status' },
        { status: 500 }
      );
    }

    // 6. Update existing assignment or insert row into assignments table
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const existingOfferForMe = existingAssignments?.find(
      (a: any) => a.creator_id === creatorId && a.status === 'offered'
    );

    let assignmentId: string | undefined;

    if (existingOfferForMe) {
      await supabaseAdmin
        .from('assignments')
        .update({
          status: 'accepted',
          responded_at: now.toISOString(),
        })
        .eq('id', existingOfferForMe.id);
      assignmentId = existingOfferForMe.id;
    } else {
      const { data: assignment, error: assignErr } = await supabaseAdmin
        .from('assignments')
        .insert({
          project_id: resolvedProjectId,
          creator_id: creatorId,
          status: 'accepted',
          offered_at: now.toISOString(),
          expires_at: expires.toISOString(),
          responded_at: now.toISOString(),
          created_at: now.toISOString(),
        })
        .select('id')
        .single();

      if (assignErr) {
        console.error('[ACCEPT JOB] Error inserting assignment:', assignErr);
        return NextResponse.json(
          { error: 'Failed to persist assignment' },
          { status: 500 }
        );
      }
      assignmentId = assignment?.id;
    }

    // 4. Send Notification to Admin (Event 11: CREATOR_ASSIGNED)
    try {
      const { data: adminUser } = await supabaseAdmin
        .from('users')
        .select('id, phone, email')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      const adminPhone = adminUser?.phone || process.env.ADMIN_PHONE;
      const adminEmail = adminUser?.email || process.env.ADMIN_EMAIL;

      await dispatchNotification({
        eventNumber: 11,
        userId: adminUser?.id || 'admin',
        recipientPhone: adminPhone,
        recipientEmail: adminEmail,
        variables: { projectId: projectNumber },
      });
    } catch (notifErr) {
      console.warn('[ACCEPT JOB] Notification dispatch non-fatal error:', notifErr);
    }

    return NextResponse.json({
      success: true,
      assignment_id: assignmentId || null,
      project_id: resolvedProjectId,
      status: 'creator_assigned',
    });
  } catch (err: any) {
    console.error('[ACCEPT JOB ROUTE ERROR]:', err);
    return NextResponse.json(
      { error: 'Internal error accepting job' },
      { status: 500 }
    );
  }
}
