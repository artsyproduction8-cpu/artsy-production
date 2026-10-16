import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { validateVideoUrl, validateImageUrl } from '@/lib/validation/urls';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    const { data: samples, error } = await dbClient
      .from('portfolio_samples')
      .select('*')
      .eq('creator_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Freelancer Portfolio GET Error]', error);
      return NextResponse.json({ error: 'Failed to fetch portfolio samples' }, { status: 500 });
    }

    return NextResponse.json({ success: true, samples: samples || [] });
  } catch (err: unknown) {
    console.error('[Freelancer Portfolio GET Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { title, description, category, video_url, thumbnail_url } = body;

    if (!title || !category || !video_url || !thumbnail_url) {
      return NextResponse.json(
        { error: 'Title, category, video URL, and thumbnail URL are required' },
        { status: 400 }
      );
    }

    const validVideoUrl = validateVideoUrl(video_url);
    if (!validVideoUrl) {
      return NextResponse.json(
        { error: 'Invalid video URL. Must be a valid YouTube or Vimeo HTTPS link.' },
        { status: 400 }
      );
    }

    const validThumbnailUrl = validateImageUrl(thumbnail_url);
    if (!validThumbnailUrl) {
      return NextResponse.json(
        { error: 'Invalid thumbnail URL. Must be a valid HTTPS image URL.' },
        { status: 400 }
      );
    }

    // Ensure creator profile exists
    const { data: existingProfile } = await dbClient
      .from('creator_profiles')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!existingProfile) {
      const displayName = authUser.full_name
        ? authUser.full_name.split(' ')[0] + ' ' + (authUser.full_name.split(' ')[1]?.[0] || 'A') + '.'
        : 'Creator C.';

      // Upsert profile record if missing
      await dbClient.from('creator_profiles').insert([
        {
          id: authUser.id,
          public_display_name: displayName,
          approval_status: 'pending',
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }

    const { data: newSample, error: insertError } = await dbClient
      .from('portfolio_samples')
      .insert([
        {
          creator_id: authUser.id,
          title: title.trim(),
          description: description?.trim() || null,
          category,
          video_url: validVideoUrl,
          thumbnail_url: validThumbnailUrl,
          approval_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('[Freelancer Portfolio Insert Error]', insertError);
      return NextResponse.json({ error: 'Failed to save sample' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sample: newSample });
  } catch (err: unknown) {
    console.error('[Freelancer Portfolio POST Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
