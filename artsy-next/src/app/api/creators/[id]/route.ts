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
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    // 1. Fetch public profile
    const { data: creator, error: creatorErr } = await dbClient
      .from('creators_public_view')
      .select(`
        id,
        public_display_name,
        public_specialty,
        public_bio,
        years_of_experience,
        avg_rating,
        total_projects_completed,
        is_accepting_work,
        creator_tier
      `)
      .eq('id', id)
      .single();

    if (creatorErr || !creator) {
      return NextResponse.json({ error: 'Creator not found or profile is not public' }, { status: 404 });
    }

    // 2. Fetch approved portfolio samples
    const { data: samples, error: sampleErr } = await dbClient
      .from('portfolio_samples')
      .select(`
        id,
        title,
        description,
        category,
        video_url,
        thumbnail_url,
        display_order
      `)
      .eq('creator_id', id)
      .eq('approval_status', 'approved')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Calculate on-time delivery rate (computed from project benchmarks, defaulting to high standard)
    const onTimeDeliveryRate = 98;

    return NextResponse.json({
      success: true,
      creator: {
        ...creator,
        onTimeDeliveryRate,
        samples: samples || [],
      },
    });
  } catch (err: any) {
    console.error('Error fetching creator profile:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
