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

    const body = await request.json().catch(() => ({}));
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Resolve Project Record in Supabase
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
    
    let resolvedProjectId: string = '';
    let projectNumber: string = projectId;

    if (isUUID) {
      const { data: existingProj } = await supabaseAdmin
        .from('projects')
        .select('id, project_number')
        .eq('id', projectId)
        .maybeSingle();

      if (existingProj) {
        resolvedProjectId = existingProj.id;
        projectNumber = existingProj.project_number || projectId;
      }
    } else {
      const { data: existingProj } = await supabaseAdmin
        .from('projects')
        .select('id, project_number')
        .eq('project_number', projectId)
        .maybeSingle();

      if (existingProj) {
        resolvedProjectId = existingProj.id;
        projectNumber = existingProj.project_number;
      }
    }

    // Fail closed: Project must exist
    if (!resolvedProjectId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Update projects.status to 'creator_assigned'
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

    // 3. Insert row into assignments table
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

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
      assignment_id: assignment?.id,
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
