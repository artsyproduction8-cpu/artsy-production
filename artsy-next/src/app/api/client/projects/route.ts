import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { formatPublicCreatorName } from '@/lib/masking';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id);
  if (!isUuid) {
    return NextResponse.json({ success: true, projects: [] });
  }

  const db = supabaseAdmin || supabase;
  if (!db || typeof db.from !== 'function') {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  const { data: projects, error } = await db
    .from('projects')
    .select(`
      id, title, status, created_at, order_id, project_number, current_revision_round, max_free_revisions, client_deadline, assigned_creator_id, final_download_url,
      orders:order_id (
        id, order_number, gross_amount, status, service_key, requirements_snapshot, paid_at,
        preferred_creator_id, preferred_creator_assigned, preferred_creator_rejection_reason
      )
    `)
    .eq('client_id', authUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Client Projects API] Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to load projects', projects: [] }, { status: 500 });
  }

  // Resolve creator names for projects with assigned or preferred creators
  const creatorIds = new Set<string>();
  (projects || []).forEach((p: any) => {
    if (p.assigned_creator_id) creatorIds.add(p.assigned_creator_id);
    if (p.orders?.preferred_creator_id) creatorIds.add(p.orders.preferred_creator_id);
  });

  const creatorNameMap: Record<string, string> = {};
  if (creatorIds.size > 0) {
    const idList = Array.from(creatorIds);
    const { data: creatorProfiles } = await db
      .from('creator_profiles')
      .select('id, public_display_name')
      .in('id', idList);

    const { data: creatorUsers } = await db
      .from('users')
      .select('id, full_name')
      .in('id', idList);

    const userMap: Record<string, string> = {};
    (creatorUsers || []).forEach((u: any) => {
      userMap[u.id] = u.full_name;
    });

    const isGeneric = (n?: string | null) => {
      if (!n) return true;
      const l = n.trim().toLowerCase();
      return l === 'creator partner' || l === 'creator' || l === 'creator member' || l === 'artsy creator';
    };

    (creatorProfiles || []).forEach((c: any) => {
      const pName = c.public_display_name?.trim();
      if (pName && !isGeneric(pName)) {
        creatorNameMap[c.id] = formatPublicCreatorName(pName) || pName;
      } else if (userMap[c.id]) {
        creatorNameMap[c.id] = formatPublicCreatorName(userMap[c.id]);
      }
    });

    idList.forEach((id) => {
      if (!creatorNameMap[id] && userMap[id]) {
        creatorNameMap[id] = formatPublicCreatorName(userMap[id]);
      }
    });
  }

  const POSITIVE_STAGE_INFO: Record<number, { name: string; desc: string }> = {
    1: {
      name: 'Ingest & Selects',
      desc: 'Raw footage verified & best takes organized on timeline',
    },
    2: {
      name: 'Story Assembly',
      desc: 'Story assembly in progress — timeline cut and pacing locked',
    },
    3: {
      name: 'Audio & Color Grade',
      desc: 'Cinematic color grading & audio music sync in progress',
    },
    4: {
      name: 'Master Polish & QA',
      desc: 'Master polish complete — draft rendered for preview',
    },
  };

  const enrichedProjects = (projects || []).map((p: any) => {
    const ord = p.orders || {};
    const snap = ord.requirements_snapshot || {};
    const creatorId = p.assigned_creator_id || ord.preferred_creator_id;
    const creatorName = creatorId ? (creatorNameMap[creatorId] || 'Senior Editor') : null;

    // Strict Client Visibility: Positive progress milestones only (Zero negative flags)
    const progress = snap.editing_progress || {};
    const rawStage = Number(p.current_stage || progress.stage) || 1;
    const stageNumber = Math.min(Math.max(rawStage, 1), 4);
    const progressPct = stageNumber * 25;
    const stageInfo = POSITIVE_STAGE_INFO[stageNumber] || POSITIVE_STAGE_INFO[1];

    return {
      ...p,
      creatorName,
      deliverableUrl: p.final_download_url || snap.deliverable_url || snap.draft_cut_url || null,
      isReviewReady: Boolean(p.status === 'client_review' || p.status === 'review_ready' || p.final_download_url || snap.deliverable_url),
      preferredCreatorName: ord.preferred_creator_id ? (creatorNameMap[ord.preferred_creator_id] || 'Requested Editor') : null,
      isCreatorDeclined: Boolean(ord.preferred_creator_rejection_reason && !ord.preferred_creator_assigned),
      declineReason: ord.preferred_creator_rejection_reason || null,
      editingProgress: {
        stage: stageNumber,
        percentage: progressPct,
        stageName: stageInfo.name,
        stageDescription: stageInfo.desc,
        updatedAt: progress.updatedAt || p.updated_at,
      },
    };
  });

  return NextResponse.json({ success: true, projects: enrichedProjects });
}
