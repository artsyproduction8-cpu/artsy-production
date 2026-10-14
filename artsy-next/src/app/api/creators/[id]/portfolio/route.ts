import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    const { data: samples, error } = await dbClient
      .from('portfolio_samples')
      .select('id, title, description, category, video_url, thumbnail_url, youtube_id, display_order, created_at')
      .eq('creator_id', id)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Creator Portfolio GET Error]', error);
      return NextResponse.json({ error: 'Failed to fetch creator portfolio' }, { status: 500 });
    }

    return NextResponse.json({ success: true, samples: samples || [] });
  } catch (err) {
    console.error('[Creator Portfolio GET Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
