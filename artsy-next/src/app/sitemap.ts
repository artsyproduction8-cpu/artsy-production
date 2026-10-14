import { MetadataRoute } from 'next';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { DEFAULT_PRICING_MATRIX } from '@/lib/pricing/catalog-matrix';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com';
  const now = new Date();

  // 1. Static and new marketing pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/creators`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/work`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/grievance`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Service category pages (/services/[category])
  const categoryRoutes: MetadataRoute.Sitemap = DEFAULT_PRICING_MATRIX.map((cat) => ({
    url: `${baseUrl}/services/${cat.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. Dynamic Creator Profiles from DB
  let creatorRoutes: MetadataRoute.Sitemap = [];
  try {
    const dbClient = supabaseAdmin || anonSupabase;
    if (dbClient && typeof dbClient.from === 'function') {
      const { data: creators } = await dbClient
        .from('creators_public_view')
        .select('id')
        .limit(100);

      if (creators && creators.length > 0) {
        creatorRoutes = creators.map((c: { id: string }) => ({
          url: `${baseUrl}/creators/${c.id}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
      }
    }
  } catch (err) {
    console.error('Error populating sitemap creators:', err);
  }

  // Fallback creators if DB returned empty during build
  if (creatorRoutes.length === 0) {
    creatorRoutes = [
      {
        url: `${baseUrl}/creators/f0000000-0000-0000-0000-000000000001`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/creators/f0000000-0000-0000-0000-000000000002`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
    ];
  }

  return [...staticRoutes, ...categoryRoutes, ...creatorRoutes];
}
