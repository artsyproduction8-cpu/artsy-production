import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export const revalidate = 60;

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

    const BLOCKED_PATTERNS = ['dQw4w9WgXcQ', 'test087694', 'youtube.com', 'test.com', 'pub-test.r2.dev'];
    const seenUrls = new Set<string>();
    const cleanSamples: any[] = [];

    for (const s of samples || []) {
      if (!s.video_url) continue;
      if (BLOCKED_PATTERNS.some((p) => s.video_url.includes(p) || (s.youtube_id || '').includes(p))) continue;
      if (s.approval_status !== undefined && s.approval_status !== 'approved') continue;
      if (seenUrls.has(s.video_url)) continue;

      seenUrls.add(s.video_url);
      cleanSamples.push(s);
    }

    return NextResponse.json(
      { success: true, samples: cleanSamples },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('[Public Portfolio GET Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

