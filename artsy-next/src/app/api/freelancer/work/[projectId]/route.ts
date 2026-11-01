import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = supabaseAdmin || supabase;
    if (!db || typeof db.from !== 'function') {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Fetch project
    const { data: project, error: projectError } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ success: true, project: null });
    }

    // 2. Fetch associated order & client details if order_id exists
    let order: any = null;
    let clientUser: any = null;

    if (project.order_id) {
      const { data: orderData } = await db
        .from('orders')
        .select('*')
        .eq('id', project.order_id)
        .maybeSingle();

      if (orderData) {
        order = orderData;
        if (orderData.client_id) {
          const { data: clientData } = await db
            .from('users')
            .select('id, full_name, email, phone, studio_details')
            .eq('id', orderData.client_id)
            .maybeSingle();
          clientUser = clientData;
        }
      }
    }

    // 3. Check creator agreement & NDA signing status
    let creatorAgreementSigned = false;
    const { data: profileData } = await db
      .from('creator_profiles')
      .select('id, agreement_signed_at, agreement_accepted, agreement_accepted_at, approval_status, public_display_name')
      .or(`id.eq.${authUser.id},user_id.eq.${authUser.id}`)
      .maybeSingle();

    if (profileData) {
      creatorAgreementSigned = Boolean(
        profileData.agreement_signed_at ||
        profileData.agreement_accepted ||
        profileData.agreement_accepted_at
      );
    }

    // 4. Calculate Authoritative Financial Waterfall (paise integer precision)
    const grossPaise = order?.gross_amount || 100000;
    const waterfall = calculateFinancialWaterfall(grossPaise);
    const payoutPaise = waterfall.creatorAmount;
    const payoutAmount = Math.round(payoutPaise / 100); // ₹496 for ₹1,000 package
    const tdsPaise = Math.round(payoutPaise * 0.02); // 2% under Section 194J-Tech
    const tdsAmount = Math.round(tdsPaise / 100);
    const netPayout = payoutAmount - tdsAmount;

    // 5. Authoritatively Resolve the Client's Raw Footage Link
    const snap = order?.requirements_snapshot || {};
    const sd = clientUser?.studio_details || {};
    const rawFootageUrl =
      snap.rawFootageUrl ||
      snap.footageUrl ||
      snap.driveUrl ||
      snap.raw_footage_url ||
      project.raw_footage_b2_prefix ||
      project.raw_footage_url ||
      order?.raw_footage_url ||
      sd.ingestLink ||
      sd.rawFootageUrl ||
      sd.footageUrl ||
      '';

    // 6. Resolve Project & Delivery Specifications
    const turnaround = snap.turnaround || 'standard';
    const clientTurnaroundLabel =
      turnaround === 'rush' || turnaround === 'express'
        ? '48 Hours Express'
        : turnaround === 'priority'
        ? '4–5 Working Days'
        : '7–10 Working Days Standard';

    // Creator Delivery SLA:
    // - Standard (Client 7-10d) -> strictly 5 Working Days
    // - Priority (Client 4-5d) -> strictly 2-3 Working Days
    // - Rush (Client 48h) -> strictly 24 Hours
    const creatorTurnaroundLabel =
      turnaround === 'rush' || turnaround === 'express'
        ? '24 Hours'
        : turnaround === 'priority'
        ? '2–3 Working Days'
        : '5 Working Days';

    const rawSub = snap.subCategory || snap.serviceId;
    let displayTitle = project.title || 'Cinematic Edit';
    if (rawSub) {
      const cleanSub = String(rawSub).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const rawCat = snap.category || order?.service_key || '';
      const cleanCat = rawCat ? String(rawCat).replace(/\b\w/g, (c: string) => c.toUpperCase()) : '';
      displayTitle = cleanCat ? `${cleanCat} • ${cleanSub}` : cleanSub;
    }

    const isReel = (snap.subCategory && String(snap.subCategory).toLowerCase().includes('reel')) ||
      (snap.category && String(snap.category).toLowerCase() === 'personal');
    const aspectRatios = snap.aspectRatios || snap.aspectRatio || (
      isReel ? '9:16 Vertical Reel' : '16:9 Master + 9:16 Reel'
    );

    const cameraAnglesCount = snap.angles === 'multi' ? 3 : 1;
    const cameraAnglesLabel = snap.angles === 'multi' ? 'Multi-Camera Editing (3 Angles)' : 'Single Camera Edit (1 Angle)';

    // 7. Resolve Editing Progress & Creator Roadblock Status
    const editingProgress = snap.editing_progress || {
      stage: (project as any).current_stage || 1,
      percentage: (project as any).progress_percentage || 25,
      stageName: 'Ingest & Selects (25%)',
      notes: (project as any).stage_notes || 'Raw footage verified & best takes organized',
      updatedAt: project.updated_at,
    };

    const creatorIssue = (project as any).issue_details || snap.creator_issue || null;
    const issueFlagged = Boolean((project as any).issue_flagged ?? creatorIssue?.flagged);

    const enrichedProject = {
      ...project,
      title: displayTitle,
      payoutAmount,
      payoutPaise,
      tdsAmount,
      netPayout,
      grossAmount: Math.round(grossPaise / 100),
      raw_footage_url: rawFootageUrl,
      cameraAnglesCount,
      cameraAnglesLabel,
      aspectRatios,
      turnaroundLabel: creatorTurnaroundLabel,
      creatorTurnaroundLabel,
      clientTurnaroundLabel,
      musicReferenceUrl: snap.musicReferenceUrl || null,
      clientNotes: snap.notes || null,
      scopeSummary: `${aspectRatios}, ${cameraAnglesLabel}. Delivery SLA: ${creatorTurnaroundLabel} for studio QA review.`,
      creatorAgreementSigned,
      editingProgress,
      currentStage: editingProgress.stage,
      progressPercentage: editingProgress.percentage,
      stageNotes: editingProgress.notes,
      issueFlagged,
      issueDetails: creatorIssue,
      client: {
        full_name: clientUser?.full_name || order?.client_name || 'Verified Client',
        email: clientUser?.email || order?.client_email || '',
        phone: clientUser?.phone || order?.client_phone || '',
        studioName: sd.studioName || null,
      },
      orders: order
        ? {
            ...order,
            clients: {
              full_name: clientUser?.full_name || order?.client_name || 'Verified Client',
              email: clientUser?.email || order?.client_email || '',
              phone: clientUser?.phone || order?.client_phone || '',
            },
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      project: enrichedProject,
      order,
      creatorAgreementSigned,
    });
  } catch (err: any) {
    console.error('[API /freelancer/work/[projectId]] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, checkin_status, notes, deliverableUrl } = body;

    const db = supabaseAdmin || supabase;
    if (!db || typeof db.from !== 'function') {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const STAGE_NAMES: Record<number, string> = {
      1: 'Ingest & Selects',
      2: 'Story Assembly',
      3: 'Audio & Color Grade',
      4: 'Final Polish & QA',
    };

    const STAGE_PERCENTAGES: Record<number, number> = {
      1: 25,
      2: 50,
      3: 75,
      4: 100,
    };

    if (action === 'update_progress') {
      const rawStage = Number(body.stage) || 1;
      const validStage = Math.min(Math.max(rawStage, 1), 4);
      const percentage = STAGE_PERCENTAGES[validStage] || 25;
      const stageNotes = typeof body.notes === 'string' ? body.notes.trim() : '';
      const nowIso = new Date().toISOString();

      // 1. Fetch current order requirements snapshot
      const { data: currentProj } = await db.from('projects').select('id, order_id').eq('id', projectId).single();
      if (currentProj?.order_id) {
        const { data: ord } = await db.from('orders').select('requirements_snapshot').eq('id', currentProj.order_id).single();
        const snap = ord?.requirements_snapshot || {};
        snap.editing_progress = {
          stage: validStage,
          percentage,
          stageName: STAGE_NAMES[validStage],
          notes: stageNotes,
          updatedAt: nowIso,
          updatedBy: authUser.full_name || authUser.id,
        };
        await db.from('orders').update({
          requirements_snapshot: snap,
          updated_at: nowIso,
        }).eq('id', currentProj.order_id);
      }

      // Try updating projects table if columns exist
      try {
        await db.from('projects').update({
          current_stage: validStage,
          progress_percentage: percentage,
          stage_notes: stageNotes,
          updated_at: nowIso,
        }).eq('id', projectId);
      } catch {}

      // Log in audit_logs
      try {
        await db.from('audit_logs').insert([{
          action: 'creator_milestone_progress',
          user_id: authUser.id,
          entity_type: 'project',
          entity_id: projectId,
          new_values: {
            stage: validStage,
            percentage,
            stageName: STAGE_NAMES[validStage],
            notes: stageNotes,
            recorded_at: nowIso,
          },
        }]);
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Editing progress saved',
        progress: {
          stage: validStage,
          percentage,
          stageName: STAGE_NAMES[validStage],
          notes: stageNotes,
          updatedAt: nowIso,
        },
      });
    }

    if (action === 'raise_issue') {
      const category = body.category || 'other_roadblock';
      const title = (body.title || 'Missing Project Details').trim();
      const missingDetails = (body.missingDetails || body.notes || '').trim();
      const urgency = body.urgency === 'blocker' ? 'blocker' : 'normal';
      const creatorName = authUser.full_name || 'Creator';
      const nowIso = new Date().toISOString();

      const issueObj = {
        flagged: true,
        category,
        title,
        missingDetails,
        urgency,
        creatorId: authUser.id,
        creatorName,
        raisedAt: nowIso,
        status: 'open',
      };

      const { data: currentProj } = await db.from('projects').select('id, order_id, project_number').eq('id', projectId).single();
      if (currentProj?.order_id) {
        const { data: ord } = await db.from('orders').select('requirements_snapshot').eq('id', currentProj.order_id).single();
        const snap = ord?.requirements_snapshot || {};
        snap.creator_issue = issueObj;
        await db.from('orders').update({
          requirements_snapshot: snap,
          updated_at: nowIso,
        }).eq('id', currentProj.order_id);
      }

      try {
        await db.from('projects').update({
          issue_flagged: true,
          issue_details: issueObj,
          updated_at: nowIso,
        }).eq('id', projectId);
      } catch {}

      // Audit log
      try {
        await db.from('audit_logs').insert([{
          action: 'creator_roadblock_raised',
          user_id: authUser.id,
          entity_type: 'project',
          entity_id: projectId,
          new_values: issueObj,
        }]);
      } catch {}

      // In-app studio alert for admin
      try {
        await db.from('notifications').insert([{
          user_id: authUser.id,
          event_number: 99,
          title: `⚠️ Creator Roadblock: ${title}`,
          message: `${creatorName} reported missing details on ${currentProj?.project_number || 'Project'}: "${title}". What is needed: ${missingDetails.slice(0, 100)}`,
          action_url: '/admin',
          read: false,
          created_at: nowIso,
        }]);
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Roadblock submitted to Studio Lead',
        issue: issueObj,
      });
    }

    if (action === 'resolve_issue') {
      const nowIso = new Date().toISOString();
      const { data: currentProj } = await db.from('projects').select('id, order_id').eq('id', projectId).single();
      if (currentProj?.order_id) {
        const { data: ord } = await db.from('orders').select('requirements_snapshot').eq('id', currentProj.order_id).single();
        const snap = ord?.requirements_snapshot || {};
        if (snap.creator_issue) {
          snap.creator_issue.flagged = false;
          snap.creator_issue.status = 'resolved';
          snap.creator_issue.resolvedAt = nowIso;
        }
        await db.from('orders').update({
          requirements_snapshot: snap,
          updated_at: nowIso,
        }).eq('id', currentProj.order_id);
      }

      try {
        await db.from('projects').update({
          issue_flagged: false,
          updated_at: nowIso,
        }).eq('id', projectId);
      } catch {}

      // Audit log
      try {
        await db.from('audit_logs').insert([{
          action: 'creator_roadblock_resolved',
          user_id: authUser.id,
          entity_type: 'project',
          entity_id: projectId,
          new_values: { resolvedAt: nowIso },
        }]);
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Roadblock cleared',
      });
    }

    if (action === 'checkin') {
      // 1. Record immutable audit log entry
      try {
        await db.from('audit_logs').insert([{
          action: 'creator_daily_checkin',
          user_id: authUser.id,
          entity_type: 'project',
          entity_id: projectId,
          new_values: {
            checkin_status,
            notes: notes || '',
            recorded_at: new Date().toISOString(),
          },
        }]);
      } catch (logErr) {
        console.warn('[Checkin Log Warning]:', logErr);
      }

      return NextResponse.json({ success: true, message: 'Check-in recorded' });
    }

    if (action === 'deliverable') {
      if (!deliverableUrl || typeof deliverableUrl !== 'string') {
        return NextResponse.json({ error: 'Deliverable URL is required' }, { status: 400 });
      }

      // 1. Update project status and final_download_url
      const { data: updatedProject } = await db
        .from('projects')
        .update({
          status: 'review_ready',
          final_download_url: deliverableUrl.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select('*')
        .maybeSingle();

      // 2. Also update associated order work_status
      if (updatedProject?.order_id) {
        await db
          .from('orders')
          .update({
            work_status: 'review_ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', updatedProject.order_id);
      }

      // 3. Record audit log
      try {
        await db.from('audit_logs').insert([{
          action: 'creator_deliverable_submitted',
          user_id: authUser.id,
          entity_type: 'project',
          entity_id: projectId,
          new_values: {
            deliverable_url: deliverableUrl.trim(),
            submitted_at: new Date().toISOString(),
          },
        }]);
      } catch {}

      // 4. Dispatch multi-channel notification to client (In-App, WhatsApp, Email)
      try {
        const { dispatchNotification } = await import('@/lib/whatsapp/dispatcher');
        if (updatedProject?.client_id) {
          const { data: clientUser } = await db
            .from('users')
            .select('id, full_name, email, phone')
            .eq('id', updatedProject.client_id)
            .maybeSingle();

          if (clientUser) {
            await dispatchNotification({
              eventNumber: 15, // DRAFT_READY
              userId: clientUser.id,
              recipientPhone: clientUser.phone || undefined,
              recipientEmail: clientUser.email || undefined,
              variables: {
                name: clientUser.full_name || 'Client Partner',
                projectId: updatedProject.project_number || projectId,
                title: updatedProject.title || 'Master Cut Draft',
              },
              actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/client/projects`,
            });
          }
        }
      } catch (notifErr) {
        console.warn('[Deliverable Client Notification Warning]:', notifErr);
      }

      return NextResponse.json({ success: true, message: 'Deliverable submitted for QA' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /freelancer/work/[projectId] PATCH] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
