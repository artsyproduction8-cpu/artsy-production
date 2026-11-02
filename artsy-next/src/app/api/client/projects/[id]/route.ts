import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rawId } = await params;
    const cleanId = (rawId || '').trim();

    const db = supabaseAdmin || supabase;
    if (!db || typeof db.from !== 'function') {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Fetch project with order and client verification
    let query = db
      .from('projects')
      .select(`
        id,
        project_number,
        title,
        status,
        client_id,
        order_id,
        assigned_creator_id,
        raw_footage_b2_prefix,
        final_download_url,
        current_revision_round,
        max_free_revisions,
        created_at,
        updated_at,
        orders:order_id (
          id,
          order_number,
          gross_amount,
          status,
          service_key,
          requirements_snapshot,
          client_name,
          client_phone,
          client_email,
          paid_at
        )
      `);

    // Match by UUID or project_number
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    let project: any = null;

    if (isUuid) {
      const { data, error } = await query.eq('id', cleanId).maybeSingle();
      if (!error && data) project = data;
    }

    if (!project) {
      const { data } = await query.eq('project_number', cleanId).maybeSingle();
      if (data) project = data;
    }

    // If still not found and user is client, fallback to user's latest active project
    if (!project && authUser.role === 'client') {
      const { data: latestProj } = await query
        .eq('client_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestProj) project = latestProj;
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Security check: verify project belongs to authenticated client or admin/creator
    if (
      authUser.role === 'client' &&
      project.client_id !== authUser.id &&
      authUser.email !== project.orders?.client_email
    ) {
      return NextResponse.json({ error: 'Forbidden: Access restricted to project owner' }, { status: 403 });
    }

    const ord = project.orders || {};
    const snap = ord.requirements_snapshot || {};

    // Dynamic title
    let displayTitle = project.title || 'Cinematic Edit';
    const rawSub = snap.subCategory || snap.serviceId;
    if (rawSub) {
      const cleanSub = String(rawSub).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const rawCat = snap.category || ord.service_key || '';
      const cleanCat = rawCat ? String(rawCat).replace(/\b\w/g, (c: string) => c.toUpperCase()) : '';
      displayTitle = cleanCat ? `${cleanCat} • ${cleanSub}` : cleanSub;
    }

    // Resolve creator name
    let creatorName: string | null = null;
    const creatorId = project.assigned_creator_id || ord.preferred_creator_id;
    if (creatorId) {
      const { data: creatorUser } = await db
        .from('users')
        .select('full_name')
        .eq('id', creatorId)
        .maybeSingle();
      if (creatorUser?.full_name) {
        creatorName = creatorUser.full_name;
      }
    }

    // Dynamic SLA turnaround
    const turnaround = snap.turnaround || 'standard';
    const turnaroundLabel =
      turnaround === 'rush' || turnaround === 'express'
        ? '48 Hours Express'
        : turnaround === 'priority'
        ? '4–5 Working Days Priority'
        : '7–10 Working Days Standard';

    // Resolving deliverable URL (Check projects.final_download_url, snap.deliverable_url, snap.draft_cut_url)
    const deliverableUrl =
      project.final_download_url ||
      snap.deliverable_url ||
      snap.draft_cut_url ||
      null;

    // Fetch revisions / timeline review notes
    const reviewNotes: any[] = [];

    // 1. From database public.revisions table
    try {
      const { data: dbRevs } = await db
        .from('revisions')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      (dbRevs || []).forEach((r: any) => {
        let tag = 'GENERAL';
        let text = r.comment || '';
        const match = text.match(/^\[(.*?)\]\s*(.*)$/);
        if (match) {
          tag = match[1].toUpperCase();
          text = match[2];
        }

        const secs = Number(r.timecode_seconds) || 0;
        const h = String(Math.floor(secs / 3600)).padStart(2, '0');
        const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
        const s = String(Math.floor(secs % 60)).padStart(2, '0');
        const formattedTc = `${h}:${m}:${s}`;

        reviewNotes.push({
          id: r.id,
          timecode: formattedTc,
          timecodeSeconds: secs,
          tag,
          tagBg: tag === 'COLOR' ? 'bg-[#3B82F6]' : tag === 'AUDIO' ? 'bg-[#1D1D1F]' : 'bg-emerald-600',
          author: 'Client',
          timeAgo: new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          text,
          status: r.status === 'addressed' ? 'Addressed' : 'Queued for editor',
          statusColor: r.status === 'addressed' ? 'text-emerald-600' : 'text-[#3B82F6]',
        });
      });
    } catch {}

    // 2. Also merge snapshot client_review_notes (resilience)
    const snapNotes = Array.isArray(snap.client_review_notes) ? snap.client_review_notes : [];
    snapNotes.forEach((sn: any) => {
      if (!reviewNotes.some((rn) => rn.id === sn.id)) {
        reviewNotes.push({
          id: sn.id || String(Date.now()),
          timecode: sn.timecode || '00:00:00',
          timecodeSeconds: sn.timecodeSeconds || 0,
          tag: sn.tag || sn.category || 'GENERAL',
          tagBg: (sn.tag || sn.category) === 'COLOR' ? 'bg-[#3B82F6]' : (sn.tag || sn.category) === 'AUDIO' ? 'bg-[#1D1D1F]' : 'bg-emerald-600',
          author: sn.author || 'Client',
          timeAgo: sn.createdAt ? new Date(sn.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently',
          text: sn.text || sn.comment || '',
          status: sn.status === 'addressed' ? 'Addressed' : 'Queued for editor',
          statusColor: sn.status === 'addressed' ? 'text-emerald-600' : 'text-[#3B82F6]',
        });
      }
    });

    const isApproved =
      project.status === 'approved' ||
      project.status === 'completed' ||
      Boolean(snap.client_approval?.approvedAt);

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        projectNumber: project.project_number,
        orderNumber: ord.order_number || project.project_number,
        title: displayTitle,
        category: snap.category || ord.service_key || 'Personal',
        status: project.status,
        deliverableUrl,
        rawFootageUrl: project.raw_footage_b2_prefix || snap.rawFootageUrl || null,
        creatorName: creatorName || 'Senior Editor',
        currentRound: project.current_revision_round || 1,
        includedRounds: project.max_free_revisions || 1,
        turnaround: turnaroundLabel,
        isApproved,
        reviewNotes,
        editingProgress: snap.editing_progress || null,
      },
    });
  } catch (err: any) {
    console.error('[API /client/projects/[id] GET] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rawId } = await params;
    const cleanId = (rawId || '').trim();
    const body = await request.json().catch(() => ({}));
    const { action, timecode, timecodeSeconds, category, text } = body;

    const db = supabaseAdmin || supabase;
    if (!db || typeof db.from !== 'function') {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Fetch project and verify ownership
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    let project: any = null;

    if (isUuid) {
      const { data } = await db.from('projects').select('*, orders(*)').eq('id', cleanId).maybeSingle();
      if (data) project = data;
    }

    if (!project) {
      const { data } = await db.from('projects').select('*, orders(*)').eq('project_number', cleanId).maybeSingle();
      if (data) project = data;
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (authUser.role === 'client' && project.client_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nowIso = new Date().toISOString();
    const ord = project.orders || {};
    const snap = ord.requirements_snapshot || {};

    if (action === 'add_note') {
      if (!text || !text.trim()) {
        return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
      }

      const cleanCategory = (category || 'GENERAL').toUpperCase();
      const cleanTimecode = timecode || '00:00:00';
      const cleanSeconds = Number(timecodeSeconds) || 0;
      const noteId = `note_${Date.now()}`;

      // 1. Insert into public.revisions table
      try {
        await db.from('revisions').insert([{
          project_id: project.id,
          round_number: project.current_revision_round || 1,
          author_id: authUser.id,
          timecode_seconds: cleanSeconds,
          comment: `[${cleanCategory}] ${text.trim()}`,
          status: 'requested',
          created_at: nowIso,
        }]);
      } catch (revErr) {
        console.warn('[Revisions Table Insert Warning]:', revErr);
      }

      // 2. Persist to orders.requirements_snapshot.client_review_notes
      const existingNotes = Array.isArray(snap.client_review_notes) ? snap.client_review_notes : [];
      const newNoteObj = {
        id: noteId,
        timecode: cleanTimecode,
        timecodeSeconds: cleanSeconds,
        category: cleanCategory,
        text: text.trim(),
        author: authUser.full_name || 'Client',
        createdAt: nowIso,
        status: 'queued',
      };
      snap.client_review_notes = [newNoteObj, ...existingNotes];

      await db.from('orders').update({
        requirements_snapshot: snap,
        updated_at: nowIso,
      }).eq('id', project.order_id);

      // 3. Update project status to client_review
      try {
        await db.from('projects').update({
          status: 'client_review',
          updated_at: nowIso,
        }).eq('id', project.id);
      } catch {}

      // 4. Log in audit_logs
      try {
        await db.from('audit_logs').insert([{
          action: 'client_review_note_added',
          user_id: authUser.id,
          entity_type: 'project',
          entity_id: project.id,
          new_values: newNoteObj,
        }]);
      } catch {}

      // 5. In-app notification for assigned creator
      if (project.assigned_creator_id) {
        try {
          await db.from('notifications').insert([{
            user_id: project.assigned_creator_id,
            event_number: 16,
            title: `💬 New Client Feedback at ${cleanTimecode}`,
            message: `${authUser.full_name || 'Client'} left a note on ${project.title}: "${text.trim().slice(0, 80)}"`,
            action_url: `/freelancer/work/${project.id}`,
            read: false,
            created_at: nowIso,
          }]);
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: 'Review note saved for editor',
        note: {
          id: noteId,
          timecode: cleanTimecode,
          timecodeSeconds: cleanSeconds,
          tag: cleanCategory,
          tagBg: cleanCategory === 'COLOR' ? 'bg-[#3B82F6]' : cleanCategory === 'AUDIO' ? 'bg-[#1D1D1F]' : 'bg-emerald-600',
          author: authUser.full_name ? `${authUser.full_name} (YOU)` : 'CLIENT (YOU)',
          timeAgo: 'Just now',
          text: text.trim(),
          status: 'Queued for editor',
          statusColor: 'text-[#3B82F6]',
        },
      });
    }

    if (action === 'approve_cut') {
      // 1. Update project status to approved
      await db.from('projects').update({
        status: 'approved',
        updated_at: nowIso,
      }).eq('id', project.id);

      // 2. Update order work_status and snapshot
      snap.client_approval = {
        approvedAt: nowIso,
        approvedBy: authUser.full_name || 'Client',
      };

      await db.from('orders').update({
        work_status: 'approved',
        requirements_snapshot: snap,
        updated_at: nowIso,
      }).eq('id', project.order_id);

      // 3. Log in audit_logs
      try {
        await db.from('audit_logs').insert([{
          action: 'client_project_approved',
          user_id: authUser.id,
          entity_type: 'project',
          entity_id: project.id,
          new_values: { approvedAt: nowIso, approvedBy: authUser.full_name },
        }]);
      } catch {}

      // 4. In-app notification for creator & studio lead
      if (project.assigned_creator_id) {
        try {
          await db.from('notifications').insert([{
            user_id: project.assigned_creator_id,
            event_number: 17,
            title: '🎉 Video Cut Approved by Client!',
            message: `Congratulations! ${authUser.full_name || 'Client'} has approved the final cut for ${project.title}. Payout milestone unlocked.`,
            action_url: `/freelancer/work/${project.id}`,
            read: false,
            created_at: nowIso,
          }]);
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: 'Video cut approved successfully',
      });
    }

    if (action === 'request_revision') {
      const nextRound = (project.current_revision_round || 0) + 1;

      await db.from('projects').update({
        status: 'client_revision_requested',
        current_revision_round: nextRound,
        updated_at: nowIso,
      }).eq('id', project.id);

      snap.last_revision_requested_at = nowIso;
      snap.current_revision_round = nextRound;

      await db.from('orders').update({
        work_status: 'revision_needed',
        requirements_snapshot: snap,
        updated_at: nowIso,
      }).eq('id', project.order_id);

      // Log in audit_logs
      try {
        await db.from('audit_logs').insert([{
          action: 'client_revision_requested',
          user_id: authUser.id,
          entity_type: 'project',
          entity_id: project.id,
          new_values: { round: nextRound, requestedAt: nowIso },
        }]);
      } catch {}

      // Notify creator
      if (project.assigned_creator_id) {
        try {
          await db.from('notifications').insert([{
            user_id: project.assigned_creator_id,
            event_number: 18,
            title: `🎬 Client Requested Revision Round ${nextRound}`,
            message: `${authUser.full_name || 'Client'} has submitted review notes and requested Revision Round ${nextRound} for ${project.title}.`,
            action_url: `/freelancer/work/${project.id}`,
            read: false,
            created_at: nowIso,
          }]);
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: `Revision Round ${nextRound} requested`,
        currentRound: nextRound,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /client/projects/[id] POST] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
