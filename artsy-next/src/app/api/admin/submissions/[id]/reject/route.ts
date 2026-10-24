import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
  }

  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const limit = await checkRateLimit(`admin_sub_reject_${authUser.id}`, 'admin', 15, 600);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { reason } = body || {};
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5 || reason.trim().length > 500) {
      return NextResponse.json(
        { error: 'Rejection reason must be between 5 and 500 characters' },
        { status: 400 }
      );
    }

    // 1. Fetch submission
    const { data: submission, error: fetchErr } = await dbClient
      .from('creator_submissions')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // 2. Verify status === 'pending'
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot reject submission with status "${submission.status}". Only pending submissions can be rejected.` },
        { status: 409 }
      );
    }

    // 3. Mark as rejected (frozen)
    const { data: updated, error: updateErr } = await dbClient
      .from('creator_submissions')
      .update({
        status: 'rejected',
        rejection_reason: reason.trim(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: authUser.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('[Admin Reject Submission Error]', updateErr);
      return NextResponse.json({ error: 'Failed to reject submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (err: unknown) {
    console.error('[Admin Reject Submission Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
