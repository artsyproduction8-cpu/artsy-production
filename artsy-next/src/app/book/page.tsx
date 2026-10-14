import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import BookClient from './BookClient';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Book Post-Production — Instant Quote | Artsy',
  description:
    'Configure your video editing project with transparent unit pricing. Select camera profiles, multi-cam angles, delivery SLAs, and instant quotation.',
  alternates: {
    canonical: '/book',
  },
};

export default function BookPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Book', url: '/book' },
  ]);

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans">
      {/* Structured Data: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Navbar />

      <Suspense
        fallback={
          <div className="min-h-screen pt-32 text-center text-xs text-[#86868B]">
            Loading order specifications...
          </div>
        }
      >
        <BookClient />
      </Suspense>

      <Footer />
    </div>
  );
}