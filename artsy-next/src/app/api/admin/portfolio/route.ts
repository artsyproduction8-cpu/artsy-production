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

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'pending';

    let query = dbClient
      .from('portfolio_samples')
      .select('id, creator_id, title, description, category, video_url, thumbnail_url, display_order, approval_status, rejection_reason, approved_at, created_at')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('approval_status', statusFilter);
    }

    const { data: samples, error } = await query;
    if (error) {
      console.error('[Admin Portfolio GET Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with creator names
    const creatorIds = Array.from(new Set((samples || []).map((s: any) => s.creator_id)));
    let creatorMap: Record<string, string> = {};

    if (creatorIds.length > 0) {
      const { data: creators } = await dbClient
        .from('creator_profiles')
        .select('id, public_display_name')
        .in('id', creatorIds);

      (creators || []).forEach((c: any) => {
        creatorMap[c.id] = c.public_display_name || 'Creator';
      });
    }

    const enriched = (samples || []).map((s: any) => ({
      ...s,
      creatorName: creatorMap[s.creator_id] || 'Creator',
    }));

    return NextResponse.json({ success: true, samples: enriched });
  } catch (err: any) {
    console.error('[Admin Portfolio GET Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { id, action, rejection_reason } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Sample ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updatePayload.approval_status = 'approved';
      updatePayload.approved_by = authUser.id;
      updatePayload.approved_at = new Date().toISOString();
      updatePayload.rejection_reason = null;
    } else {
      updatePayload.approval_status = 'rejected';
      updatePayload.rejection_reason = rejection_reason || 'Reel does not meet studio quality criteria';
    }

    const { error: updateError } = await dbClient
      .from('portfolio_samples')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) {
      console.error('[Admin Portfolio Update Error]', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Sample ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      action,
    });
  } catch (err: any) {
    console.error('[Admin Portfolio Action Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
