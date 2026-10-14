import type { Metadata } from 'next';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import CategoryDetailClient from './CategoryDetailClient';
import { breadcrumbSchema, serviceSchema } from '@/lib/seo/schemas';
import {
  DEFAULT_PRICING_MATRIX,
  getCategoryDetailMap,
} from '@/lib/pricing/catalog-matrix';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const rawKey = (rawCategory || 'wedding').toLowerCase();
  const categoryKey = rawKey === 'ugc' || rawKey === 'brand_ugc' ? 'brand' : rawKey;

  const categoryMap = getCategoryDetailMap(DEFAULT_PRICING_MATRIX);
  const category = categoryMap[categoryKey] || categoryMap['wedding'];

  const title = category
    ? `${category.title} Services | Artsy Production`
    : 'Video Post-Production Services | Artsy Production';
  const description = category
    ? category.description.slice(0, 155)
    : 'Explore high-fidelity post-production services with deterministic turnaround SLAs by Artsy Production.';

  return {
    title,
    description,
    alternates: {
      canonical: `/services/${categoryKey}`,
    },
  };
}

export default async function ServiceCategoryDetailPage({ params }: PageProps) {
  const { category: rawCategory } = await params;
  const rawKey = (rawCategory || 'wedding').toLowerCase();
  const categoryKey = rawKey === 'ugc' || rawKey === 'brand_ugc' ? 'brand' : rawKey;

  const categoryMap = getCategoryDetailMap(DEFAULT_PRICING_MATRIX);
  const category = categoryMap[categoryKey] || categoryMap['wedding'];

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: category ? category.title : 'Category', url: `/services/${categoryKey}` },
  ]);

  const categorySchema = category
    ? serviceSchema({
        name: `${category.title} Post-Production`,
        description: category.description,
        category: categoryKey,
        url: `/services/${categoryKey}`,
      })
    : null;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      {/* Structured Data: BreadcrumbList + Service */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {categorySchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }}
        />
      )}

      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-hidden flex-1">
        <CategoryDetailClient initialCategoryKey={categoryKey} />
      </main>

      <Footer />
    </div>
  );
}