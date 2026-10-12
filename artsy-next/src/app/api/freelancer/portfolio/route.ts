import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const authUser = getAuthenticatedUser(request);
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, samples: samples || [] });
  } catch (err: any) {
    console.error('[Freelancer Portfolio GET Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUser = getAuthenticatedUser(request);
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

    if (title.length > 100) {
      return NextResponse.json({ error: 'Title cannot exceed 100 characters' }, { status: 400 });
    }

    if (description && description.length > 500) {
      return NextResponse.json({ error: 'Description cannot exceed 500 characters' }, { status: 400 });
    }

    const validCategories = ['Wedding', 'Brand', 'Corporate', 'Personal'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Category must be one of: Wedding, Brand, Corporate, Personal' },
        { status: 400 }
      );
    }

    // Ensure creator profile exists for this user in creator_profiles
    const { data: existingProfile } = await dbClient
      .from('creator_profiles')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!existingProfile) {
      // Upsert profile record if missing
      await dbClient.from('creator_profiles').insert([
        {
          id: authUser.id,
          public_display_name: authUser.name ? authUser.name.split(' ')[0] + ' ' + (authUser.name.split(' ')[1]?.[0] || 'A') + '.' : 'Creator C.',
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
          video_url: video_url.trim(),
          thumbnail_url: thumbnail_url.trim(),
          approval_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('[Freelancer Portfolio Insert Error]', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sample: newSample });
  } catch (err: any) {
    console.error('[Freelancer Portfolio POST Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
