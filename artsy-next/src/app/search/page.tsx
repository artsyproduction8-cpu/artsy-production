import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import SearchClient from './SearchClient';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Search Services, Creators & Portfolio | Artsy',
  description:
    'Search across Artsy’s curated film editing services, vetted creator network, and cinematic video portfolio.',
  alternates: {
    canonical: '/search',
  },
};

function SearchFallback() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-zinc-400 text-sm">Loading search...</p>
    </div>
  );
}

export default function SearchPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Search', url: '/search' },
  ]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#1D1D1F] selection:text-white">
      {/* Structured Data: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Navbar />

      <main className="flex-1 w-full pt-24 pb-20">
        <Suspense fallback={<SearchFallback />}>
          <SearchClient />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
