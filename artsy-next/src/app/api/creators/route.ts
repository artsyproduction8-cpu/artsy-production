import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { createErrorResponse } from '@/lib/api-response';
import { getCachedData, setCachedData } from '@/lib/cache';
import { formatPublicCreatorName } from '@/lib/masking';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category')?.toLowerCase();
  const tier = searchParams.get('tier')?.toLowerCase();
  const availability = searchParams.get('availability')?.toLowerCase();

  const isDefaultQuery = (!category || category === 'all') && (!tier || tier === 'all') && (!availability || availability === 'all');
  const cacheKey = isDefaultQuery
    ? 'cache:public:creators:list'
    : `cache:public:creators:list:${category || 'all'}:${tier || 'all'}:${availability || 'all'}`;

  // Sub-20ms Cached Edge Fast Path
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
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    let query = dbClient
      .from('creator_profiles')
      .select(`
        id,
        public_display_name,
        public_specialty,
        public_bio,
        years_of_experience,
        avg_rating,
        total_projects_completed,
        is_accepting_work,
        creator_tier,
        users:users!creator_profiles_id_fkey(full_name)
      `)
      .eq('is_public', true)
      .eq('approval_status', 'approved')
      .eq('is_suspended', false);

    if (tier && tier !== 'all') {
      query = query.eq('creator_tier', tier);
    }

    if (availability === 'available' || availability === 'available now') {
      query = query.eq('is_accepting_work', true);
    }

    let { data: creators, error } = await query;

    if (error) {
      // Fallback query to creators_public_view if relationship join fails
      console.warn('[api/creators] creator_profiles join query warning, falling back to public view:', error.message);
      const fallbackQuery = dbClient.from('creators_public_view').select('*');
      const { data: fallbackData } = await fallbackQuery;
      if (fallbackData) {
        creators = fallbackData;
        error = null;
      } else {
        return createErrorResponse(error, 'Failed to retrieve creators catalog', 500);
      }
    }

    const isGenericPlaceholder = (name?: string | null): boolean => {
      if (!name) return true;
      const lower = name.trim().toLowerCase();
      return (
        lower === 'creator partner' ||
        lower === 'creator' ||
        lower === 'creator member' ||
        lower === 'artsy creator'
      );
    };

    let filtered = (creators || []).map((c: any) => {
      const userFullName = Array.isArray(c.users) ? c.users[0]?.full_name : c.users?.full_name;
      const validProfileName = !isGenericPlaceholder(c.public_display_name) ? c.public_display_name?.trim() : null;
      const validUserName = !isGenericPlaceholder(userFullName) ? userFullName?.trim() : null;
      const rawName = validProfileName || validUserName;
      return {
        ...c,
        public_display_name: rawName ? formatPublicCreatorName(rawName) : 'Artsy Creator',
      };
    });

    // Filter by category if requested (matching public_specialty or portfolio category)
    if (category && category !== 'all') {
      filtered = filtered.filter((c: any) =>
        (c.public_specialty || '').toLowerCase().includes(category)
      );
    }

    const payload = {
      success: true,
      creators: filtered,
      total: filtered.length,
    };

    await setCachedData(cacheKey, payload, 60);

    return NextResponse.json(payload, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err: unknown) {
    return createErrorResponse(err, 'Failed to process creators request', 500);
  }
}
