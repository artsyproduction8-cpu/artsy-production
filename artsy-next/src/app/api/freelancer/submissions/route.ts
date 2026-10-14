import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { extractYouTubeId, isEmbeddable } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  if (authUser.role !== 'freelancer' && !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden: Freelancer access required' }, { status: 403 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    const { data: submissions, error } = await dbClient
      .from('creator_submissions')
      .select('*')
      .eq('creator_id', authUser.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('[Freelancer Submissions GET Error]', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    return NextResponse.json({ success: true, submissions: submissions || [] });
  } catch (err: unknown) {
    console.error('[Freelancer Submissions GET Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { youtube_url, title, description } = body || {};

    if (!youtube_url || typeof youtube_url !== 'string') {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 200) {
      return NextResponse.json({ error: 'Title must be between 2 and 200 characters' }, { status: 400 });
    }

    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return NextResponse.json({ error: 'Description cannot exceed 1000 characters' }, { status: 400 });
    }

    const youtubeId = extractYouTubeId(youtube_url);
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube video URL' }, { status: 400 });
    }

    // Embeddability / Privacy verification
    const embeddable = await isEmbeddable(youtubeId);
    if (!embeddable) {
      return NextResponse.json(
        { error: 'Video is private, deleted, or cannot be embedded. Please ensure it is Public or Unlisted.' },
        { status: 400 }
      );
    }

    // Check spam limit: max 10 pending submissions by creator
    const { count: pendingCount, error: countErr } = await dbClient
      .from('creator_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', authUser.id)
      .eq('status', 'pending');

    if (countErr) {
      console.error('[Submissions Count Error]', countErr);
      return NextResponse.json({ error: 'Failed to verify pending count' }, { status: 500 });
    }

    if ((pendingCount || 0) >= 10) {
      return NextResponse.json(
        { error: 'You have 10 pending submissions. Wait for review before submitting more.' },
        { status: 429 }
      );
    }

    // Insert new pending submission
    const { data: newSubmission, error: insertError } = await dbClient
      .from('creator_submissions')
      .insert([
        {
          creator_id: authUser.id,
          youtube_url: youtube_url.trim(),
          youtube_id: youtubeId,
          title: title.trim(),
          description: description?.trim() || null,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      // 23505 is PostgreSQL unique violation code
      if (insertError.code === '23505' || insertError.message?.includes('idx_submissions_unique_pending')) {
        return NextResponse.json(
          { error: 'You already have this video pending review.' },
          { status: 409 }
        );
      }
      console.error('[Freelancer Submissions Insert Error]', insertError);
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission: newSubmission }, { status: 201 });
  } catch (err: unknown) {
    console.error('[Freelancer Submissions POST Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
