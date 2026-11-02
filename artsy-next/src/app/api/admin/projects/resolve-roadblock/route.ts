import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { projectId } = body;
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const dbClient = supabaseAdmin || anonSupabase;
    if (!dbClient || typeof dbClient.from !== 'function') {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const nowIso = new Date().toISOString();

    // 1. Fetch project and order
    const { data: proj } = await dbClient.from('projects').select('id, order_id').eq('id', projectId).single();
    if (proj?.order_id) {
      const { data: ord } = await dbClient.from('orders').select('requirements_snapshot').eq('id', proj.order_id).single();
      const snap = ord?.requirements_snapshot || {};
      if (snap.creator_issue) {
        snap.creator_issue.flagged = false;
        snap.creator_issue.status = 'resolved';
        snap.creator_issue.resolvedAt = nowIso;
        snap.creator_issue.resolvedBy = authUser.full_name || 'Admin';
      }
      await dbClient.from('orders').update({
        requirements_snapshot: snap,
        updated_at: nowIso,
      }).eq('id', proj.order_id);
    }

    // 2. Clear issue on projects table
    try {
      await dbClient.from('projects').update({
        issue_flagged: false,
        updated_at: nowIso,
      }).eq('id', projectId);
    } catch {}

    // 3. Log in audit_logs
    try {
      await dbClient.from('audit_logs').insert([{
        action: 'admin_roadblock_resolved',
        user_id: authUser.id,
        entity_type: 'project',
        entity_id: projectId,
        new_values: { resolvedBy: authUser.full_name || 'Admin', resolvedAt: nowIso },
      }]);
    } catch {}

    return NextResponse.json({ success: true, message: 'Roadblock marked resolved' });
  } catch (err: any) {
    console.error('[Resolve Roadblock API Exception]', err);
    return NextResponse.json({ error: 'Failed to resolve roadblock' }, { status: 500 });
  }
}

