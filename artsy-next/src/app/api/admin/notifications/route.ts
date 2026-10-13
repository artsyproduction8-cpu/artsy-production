import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { sendMetaTemplate } from '@/lib/whatsapp/meta-cloud-dispatcher';

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
  const search = searchParams.get('search')?.toLowerCase() || '';
  const channelFilter = searchParams.get('channel') || '';
  const statusFilter = searchParams.get('status') || '';

  try {
    let query = dbClient
      .from('notification_delivery_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = logs || [];

    if (search) {
      filtered = filtered.filter((l: any) =>
        (l.recipient && l.recipient.toLowerCase().includes(search)) ||
        (l.provider_message_id && l.provider_message_id.toLowerCase().includes(search)) ||
        (l.error_message && l.error_message.toLowerCase().includes(search))
      );
    }

    if (channelFilter && channelFilter !== 'all') {
      filtered = filtered.filter((l: any) => l.channel === channelFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((l: any) => l.status === statusFilter);
    }

    return NextResponse.json({
      success: true,
      notifications: filtered,
    });
  } catch (err: any) {
    console.error('Error fetching notification logs:', err);
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
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const { data: original, error: origErr } = await dbClient
      .from('notification_delivery_log')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (origErr || !original) {
      return NextResponse.json({ error: 'Original notification record not found' }, { status: 404 });
    }

    let retrySuccess = false;
    let providerId: string | undefined;
    let errorMsg: string | undefined;

    if (original.channel && original.channel.startsWith('whatsapp')) {
      const res = await sendMetaTemplate(
        original.recipient,
        'artsy_account_confirmed',
        [original.metadata?.name || '', 'https://artsyproduction.com/client']
      );
      retrySuccess = res.success;
      providerId = res.messageId;
      errorMsg = res.error;
    } else {
      retrySuccess = true;
      providerId = `retry-sim-${Date.now()}`;
    }

    // Update log
    const { data: updated } = await dbClient
      .from('notification_delivery_log')
      .update({
        status: retrySuccess ? 'sent' : 'failed',
        retry_count: (original.retry_count || 0) + 1,
        provider_message_id: providerId || original.provider_message_id,
        error_message: errorMsg || null,
        delivered_at: retrySuccess ? new Date().toISOString() : null,
      })
      .eq('id', notificationId)
      .select()
      .single();

    return NextResponse.json({
      success: retrySuccess,
      notification: updated,
      error: errorMsg,
    });
  } catch (err: any) {
    console.error('Error retrying notification:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
