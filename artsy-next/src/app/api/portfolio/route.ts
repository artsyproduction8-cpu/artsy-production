import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    let { data: samples, error } = await dbClient
      .from('portfolio_samples')
      .select('id, title, description, category, video_url, thumbnail_url, youtube_id, display_order, created_at')
      .is('creator_id', null)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error && dbClient !== anonSupabase && anonSupabase) {
      console.warn('[Public Portfolio GET Warning] Primary dbClient failed, falling back to anon client:', error.message);
      const fb = await anonSupabase
        .from('portfolio_samples')
        .select('id, title, description, category, video_url, thumbnail_url, youtube_id, display_order, created_at')
        .is('creator_id', null)
        .eq('is_visible', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!fb.error && fb.data) {
        samples = fb.data;
        error = null;
      }
    }

    if (error) {
      console.error('[Public Portfolio GET Error]', error);
      return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }

    return NextResponse.json({ success: true, samples: samples || [] });
  } catch (err) {
    console.error('[Public Portfolio GET Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
