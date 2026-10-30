import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';

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
      id, title, status, created_at, order_id, project_number, current_revision_round, max_free_revisions, client_deadline, assigned_creator_id,
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
    const { data: creatorProfiles } = await db
      .from('creator_profiles')
      .select('id, public_display_name')
      .in('id', Array.from(creatorIds));

    (creatorProfiles || []).forEach((c: any) => {
      creatorNameMap[c.id] = c.public_display_name;
    });
  }

  const enrichedProjects = (projects || []).map((p: any) => {
    const ord = p.orders || {};
    const creatorId = p.assigned_creator_id || ord.preferred_creator_id;
    const creatorName = creatorId ? (creatorNameMap[creatorId] || 'Senior Editor') : null;

    return {
      ...p,
      creatorName,
      preferredCreatorName: ord.preferred_creator_id ? (creatorNameMap[ord.preferred_creator_id] || 'Requested Editor') : null,
      isCreatorDeclined: Boolean(ord.preferred_creator_rejection_reason && !ord.preferred_creator_assigned),
      declineReason: ord.preferred_creator_rejection_reason || null,
    };
  });

  return NextResponse.json({ success: true, projects: enrichedProjects });
}
