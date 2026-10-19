import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim();

    if (!query) {
      return NextResponse.json({
        success: true,
        query: '',
        services: [],
        creators: [],
        portfolio: [],
        total: 0,
      });
    }

    const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : supabase;

    if (!isSupabaseConfigured || !dbClient || typeof dbClient.from !== 'function') {
      return NextResponse.json({
        success: true,
        query,
        services: [],
        creators: [],
        portfolio: [],
        total: 0,
        message: 'Search database unconfigured',
      });
    }

    // Sanitize query to prevent PostgREST syntax injection in or() clauses
    const safeQuery = query.replace(/[,()%"']/g, ' ').trim();
    if (!safeQuery) {
      return NextResponse.json({
        success: true,
        query,
        services: [],
        creators: [],
        portfolio: [],
        total: 0,
      });
    }

    const searchTerm = `%${safeQuery}%`;

    // 1. Search services
    const servicesPromise = dbClient
      .from('services')
      .select('id, name, description, category, sub_category, base_price, standard_delivery_days, duration_label')
      .eq('is_active', true)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm},sub_category.ilike.${searchTerm}`)
      .limit(10);

    // 2. Search creators public view
    const creatorsPromise = dbClient
      .from('creators_public_view')
      .select('id, public_display_name, public_specialty, public_bio, creator_tier, years_of_experience, avg_rating, total_projects_completed, is_accepting_work')
      .or(`public_display_name.ilike.${searchTerm},public_specialty.ilike.${searchTerm},public_bio.ilike.${searchTerm}`)
      .limit(10);

    // 3. Search portfolio samples
    const portfolioPromise = dbClient
      .from('portfolio_samples')
      .select('id, creator_id, title, description, category, video_url, thumbnail_url')
      .eq('approval_status', 'approved')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
      .limit(12);

    const [servicesRes, creatorsRes, portfolioRes] = await Promise.allSettled([
      servicesPromise,
      creatorsPromise,
      portfolioPromise,
    ]);

    const services = servicesRes.status === 'fulfilled' && servicesRes.value.data ? servicesRes.value.data : [];
    const creators = creatorsRes.status === 'fulfilled' && creatorsRes.value.data ? creatorsRes.value.data : [];
    const portfolio = portfolioRes.status === 'fulfilled' && portfolioRes.value.data ? portfolioRes.value.data : [];

    const total = services.length + creators.length + portfolio.length;

    return NextResponse.json(
      {
        success: true,
        query,
        services,
        creators,
        portfolio,
        total,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/search error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Search operation failed',
        services: [],
        creators: [],
        portfolio: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
