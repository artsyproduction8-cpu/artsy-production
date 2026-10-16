import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { createErrorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category')?.toLowerCase();
  const tier = searchParams.get('tier')?.toLowerCase();
  const availability = searchParams.get('availability')?.toLowerCase();

  try {
    let query = dbClient
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
      `);

    if (tier && tier !== 'all') {
      query = query.eq('creator_tier', tier);
    }

    if (availability === 'available' || availability === 'available now') {
      query = query.eq('is_accepting_work', true);
    }

    const { data: creators, error } = await query;

    if (error) {
      return createErrorResponse(error, 'Failed to retrieve creators catalog', 500);
    }

    let filtered = creators || [];

    // Filter by category if requested (matching public_specialty or portfolio category)
    if (category && category !== 'all') {
      filtered = filtered.filter((c: any) =>
        (c.public_specialty || '').toLowerCase().includes(category)
      );
    }

    return NextResponse.json({
      success: true,
      creators: filtered,
      total: filtered.length,
    });
  } catch (err: unknown) {
    return createErrorResponse(err, 'Failed to process creators request', 500);
  }
}
