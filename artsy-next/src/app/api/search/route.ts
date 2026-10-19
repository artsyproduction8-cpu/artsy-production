import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_PRICING_MATRIX } from '@/lib/pricing/catalog-matrix';

export const dynamic = 'force-dynamic';

const BLOCKED_YOUTUBE_IDS = ['dQw4w9WgXcQ', 'test087694'];

export interface FormattedSearchService {
  id: string;
  name: string;
  category: string;
  categoryTitle: string;
  description: string;
  duration_label: string;
  base_price: number; // In INR Rupees
  base_price_formatted: string;
  standard_delivery_days: number;
  standard_delivery: string;
  deliverables: string[];
  book_url: string;
  service_url: string;
  popular?: boolean;
}

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

    // Sanitize query to prevent syntax injection
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

    const lowerQuery = safeQuery.toLowerCase();
    const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);

    // ─────────────────────────────────────────────────────────────
    // 1. CANONICAL SERVICES SEARCH
    // Matches exclusively against actual services on /services and /book
    // Single source of truth: DEFAULT_PRICING_MATRIX
    // ─────────────────────────────────────────────────────────────
    const matchingServices: FormattedSearchService[] = [];

    for (const cat of DEFAULT_PRICING_MATRIX) {
      for (const prod of cat.products) {
        if (!prod.active) continue;

        const searchableText = [
          prod.name,
          prod.description,
          cat.title,
          cat.id,
          cat.tagline,
          cat.description,
          prod.duration,
          prod.tag || '',
          ...(prod.deliverables || []),
          ...(prod.cameraProfiles || []),
        ]
          .join(' ')
          .toLowerCase();

        // Check if query matches or all tokens are present
        const matchesWhole = searchableText.includes(lowerQuery);
        const matchesAllTokens = queryTokens.every((token) => searchableText.includes(token));

        if (matchesWhole || matchesAllTokens) {
          matchingServices.push({
            id: prod.id,
            name: prod.name,
            category: cat.id,
            categoryTitle: cat.title,
            description: prod.description,
            duration_label: prod.duration,
            base_price: prod.basePrice, // Exact INR Rupee matching /services & /book
            base_price_formatted: `₹${prod.basePrice.toLocaleString('en-IN')}`,
            standard_delivery_days: 7,
            standard_delivery: prod.standardDelivery,
            deliverables: prod.deliverables || [],
            book_url: `/book?category=${cat.id}&sub=${prod.id}`,
            service_url: `/services/${cat.id}`,
            popular: prod.popular,
          });
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. CREATORS & PORTFOLIO SEARCH (From Database)
    // ─────────────────────────────────────────────────────────────
    const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : supabase;
    let dbCreators: any[] = [];
    let dbPortfolio: any[] = [];

    if (isSupabaseConfigured && dbClient && typeof dbClient.from === 'function') {
      const searchTerm = `%${safeQuery}%`;

      // Search creators public view (only approved, non-suspended creators)
      const creatorsPromise = dbClient
        .from('creators_public_view')
        .select('id, public_display_name, public_specialty, public_bio, creator_tier, years_of_experience, avg_rating, total_projects_completed, is_accepting_work')
        .or(`public_display_name.ilike.${searchTerm},public_specialty.ilike.${searchTerm},public_bio.ilike.${searchTerm}`)
        .limit(10);

      // Search portfolio samples (approved, visible, excluding test/demo items)
      const portfolioPromise = dbClient
        .from('portfolio_samples')
        .select('id, creator_id, title, description, category, video_url, thumbnail_url, youtube_id')
        .eq('approval_status', 'approved')
        .eq('is_visible', true)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .limit(12);

      const [creatorsRes, portfolioRes] = await Promise.allSettled([
        creatorsPromise,
        portfolioPromise,
      ]);

      if (creatorsRes.status === 'fulfilled' && creatorsRes.value.data) {
        dbCreators = creatorsRes.value.data;
      }

      if (portfolioRes.status === 'fulfilled' && portfolioRes.value.data) {
        dbPortfolio = portfolioRes.value.data.filter(
          (s: any) => s.youtube_id && !BLOCKED_YOUTUBE_IDS.includes(s.youtube_id)
        );
      }
    }

    const total = matchingServices.length + dbCreators.length + dbPortfolio.length;

    return NextResponse.json(
      {
        success: true,
        query,
        services: matchingServices,
        creators: dbCreators,
        portfolio: dbPortfolio,
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
