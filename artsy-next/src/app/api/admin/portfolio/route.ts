import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { extractYouTubeId, youtubeThumbnail, isEmbeddable } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id');

    let query = dbClient
      .from('portfolio_samples')
      .select('id, creator_id, title, description, category, video_url, thumbnail_url, youtube_id, display_order, is_visible, approval_status, created_at, updated_at')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (creatorId === 'company') {
      query = query.is('creator_id', null);
    } else if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    const { data: samples, error } = await query;
    if (error) {
      console.error('[Admin Portfolio GET Error]', error);
      return NextResponse.json({ error: 'Failed to fetch portfolio samples' }, { status: 500 });
    }

    // Enrich with creator names
    const creatorIds = Array.from(new Set((samples || []).map((s: any) => s.creator_id).filter(Boolean)));
    let creatorMap: Record<string, string> = {};

    if (creatorIds.length > 0) {
      const { data: creators } = await dbClient
        .from('creator_profiles')
        .select('id, public_display_name')
        .in('id', creatorIds);

      (creators || []).forEach((c: any) => {
        creatorMap[c.id] = c.public_display_name || 'Creator';
      });

      // Fallback to users table for name
      const { data: usersData } = await dbClient
        .from('users')
        .select('id, full_name')
        .in('id', creatorIds);

      (usersData || []).forEach((u: any) => {
        if (!creatorMap[u.id] && u.full_name) {
          creatorMap[u.id] = u.full_name;
        }
      });
    }

    const enriched = (samples || []).map((s: any) => ({
      ...s,
      creatorName: s.creator_id ? (creatorMap[s.creator_id] || 'Creator') : 'Company (Artsy Official)',
    }));

    return NextResponse.json({ success: true, samples: enriched });
  } catch (err: unknown) {
    console.error('[Admin Portfolio GET Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { youtube_url, title, category, creator_id, description } = body || {};

    if (!youtube_url || typeof youtube_url !== 'string') {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 200) {
      return NextResponse.json({ error: 'Title must be between 2 and 200 characters' }, { status: 400 });
    }

    const youtubeId = extractYouTubeId(youtube_url);
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube video URL' }, { status: 400 });
    }

    // Verify embeddable
    const embeddable = await isEmbeddable(youtubeId);
    if (!embeddable) {
      return NextResponse.json(
        { error: 'Video is private, deleted, or cannot be embedded. Ensure it is Public or Unlisted on YouTube.' },
        { status: 400 }
      );
    }

    // Check unique youtube_id globally in portfolio_samples
    const { data: existingSample } = await dbClient
      .from('portfolio_samples')
      .select('id, title')
      .eq('youtube_id', youtubeId)
      .maybeSingle();

    if (existingSample) {
      return NextResponse.json(
        { error: `This YouTube video is already in the portfolio ("${existingSample.title}").` },
        { status: 409 }
      );
    }

    const thumbnailUrl = youtubeThumbnail(youtubeId);

    // Insert new portfolio sample
    const { data: newSample, error: insertError } = await dbClient
      .from('portfolio_samples')
      .insert([
        {
          creator_id: creator_id || null,
          youtube_id: youtubeId,
          video_url: `https://www.youtube.com/watch?v=${youtubeId}`,
          thumbnail_url: thumbnailUrl,
          title: title.trim(),
          description: description?.trim() || null,
          category: category || 'Commercial',
          approval_status: 'approved',
          is_visible: true,
          approved_by: authUser.id,
          approved_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('[Admin Portfolio Insert Error]', insertError);
      return NextResponse.json({ error: 'Failed to create portfolio video' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sample: newSample }, { status: 201 });
  } catch (err: unknown) {
    console.error('[Admin Portfolio POST Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
