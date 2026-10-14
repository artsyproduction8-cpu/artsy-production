import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
  }

  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  if (authUser.role !== 'freelancer' && !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden: Freelancer role required' }, { status: 403 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    // 1. Fetch submission
    const { data: submission, error: fetchErr } = await dbClient
      .from('creator_submissions')
      .select('id, creator_id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // 2. Verify ownership (unless admin)
    if (submission.creator_id !== authUser.id && !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden: You do not own this submission' }, { status: 403 });
    }

    // 3. Verify status === 'pending'
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'You cannot withdraw a reviewed submission.' },
        { status: 403 }
      );
    }

    // 4. Soft delete to 'withdrawn' for complete auditability
    const { error: updateErr } = await dbClient
      .from('creator_submissions')
      .update({
        status: 'withdrawn',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) {
      console.error('[Withdraw Submission Error]', updateErr);
      return NextResponse.json({ error: 'Failed to withdraw submission' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    console.error('[Withdraw Submission Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Submissions are strictly immutable after insert
export async function PATCH() {
  return NextResponse.json(
    { error: 'Method Not Allowed: Creator submissions are immutable after insert.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method Not Allowed: Creator submissions are immutable after insert.' },
    { status: 405 }
  );
}
