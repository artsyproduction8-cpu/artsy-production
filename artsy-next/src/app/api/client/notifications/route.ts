import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, notifications: [] });
    }

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (authUser.id && !authUser.id.startsWith('mock-')) {
      query = query.eq('user_id', authUser.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[API /client/notifications] Error loading notifications:', error);
      return NextResponse.json({ success: true, notifications: [] });
    }

    const mapped = (data || []).map((n: any) => {
      const ev = n.event_number || 0;
      const isPayment = [1, 2, 4, 18, 29, 31].includes(ev);
      return {
        ...n,
        category: isPayment ? 'payments' : 'projects',
      };
    });

    return NextResponse.json({ success: true, notifications: mapped });
  } catch (err: any) {
    console.error('[API /client/notifications] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true });
    }

    const body = await request.json().catch(() => ({}));
    const { id, ids, all } = body;

    let updateQuery = supabaseAdmin
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() });

    if (authUser.id && !authUser.id.startsWith('mock-')) {
      updateQuery = updateQuery.eq('user_id', authUser.id);
    }

    if (id) {
      updateQuery = updateQuery.eq('id', id);
    } else if (Array.isArray(ids) && ids.length > 0) {
      updateQuery = updateQuery.in('id', ids);
    } else if (!all) {
      return NextResponse.json({ error: 'Missing notification id or ids' }, { status: 400 });
    }

    const { error } = await updateQuery;
    if (error) {
      console.error('[API /client/notifications PATCH] Error marking read:', error);
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /client/notifications PATCH] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
