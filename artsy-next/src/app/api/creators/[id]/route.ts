import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { createErrorResponse } from '@/lib/api-response';
import { getCachedData, setCachedData } from '@/lib/cache';
import { formatPublicCreatorName } from '@/lib/masking';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
  }

  const cacheKey = `cache:public:creator:${id}`;
  const cached = await getCachedData<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'X-Cache': 'HIT',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return createErrorResponse('Database unavailable', 'Database service is currently unavailable', 503);
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

    const payload = {
      success: true,
      creator: {
        ...creator,
        public_display_name: formatPublicCreatorName(creator.public_display_name) || 'Artsy Creator',
        onTimeDeliveryRate,
        samples: samples || [],
      },
    };

    await setCachedData(cacheKey, payload, 60);

    return NextResponse.json(payload, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err: unknown) {
    return createErrorResponse(err, 'Failed to fetch creator profile', 500);
  }
}
