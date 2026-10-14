import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
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

    const { portfolio_sample_id } = body || {};
    if (!portfolio_sample_id || typeof portfolio_sample_id !== 'string') {
      return NextResponse.json({ error: 'portfolio_sample_id is required' }, { status: 400 });
    }

    // 1. Fetch submission
    const { data: submission, error: fetchErr } = await dbClient
      .from('creator_submissions')
      .select('id, status, creator_id')
      .eq('id', id)
      .single();

    if (fetchErr || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // 2. Verify status === 'pending'
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot convert submission with status "${submission.status}". Only pending submissions can be converted.` },
        { status: 409 }
      );
    }

    // 3. Verify portfolio sample exists
    const { data: sample, error: sampleErr } = await dbClient
      .from('portfolio_samples')
      .select('id, creator_id')
      .eq('id', portfolio_sample_id)
      .single();

    if (sampleErr || !sample) {
      return NextResponse.json({ error: 'Referenced portfolio sample not found' }, { status: 404 });
    }

    // 4. Update submission to converted
    const { data: updated, error: updateErr } = await dbClient
      .from('creator_submissions')
      .update({
        status: 'converted',
        converted_sample_id: portfolio_sample_id,
        reviewed_at: new Date().toISOString(),
        reviewed_by: authUser.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('[Admin Convert Submission Error]', updateErr);
      return NextResponse.json({ error: 'Failed to convert submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (err: unknown) {
    console.error('[Admin Convert Submission Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
