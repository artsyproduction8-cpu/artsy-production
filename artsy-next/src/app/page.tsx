import type { Metadata } from 'next';
import Navbar from './components/marketing/Navbar';
import Hero from './components/marketing/Hero';
import Services from './components/marketing/Services';
import CoverflowReels from './components/marketing/CoverflowReels';
import ProductionArchive from './components/marketing/ProductionArchive';
import FAQ from './components/marketing/FAQ';
import Footer from './components/marketing/Footer';
import { organizationSchema, websiteSchema, localBusinessSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Artsy Production — Cinematic Video Post-Production Studio',
  description: 'High-contrast post-production studio and creative network. Elite film editors, color grading, and cloud workflows for weddings, brands, and cinema.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  const orgJsonLd = organizationSchema();
  const webJsonLd = websiteSchema();
  const localBizJsonLd = localBusinessSchema();

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white w-full max-w-full overflow-x-clip">
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBizJsonLd) }}
      />

      {/* 00. Top Navigation */}
      <Navbar />

      <main className="w-full pt-16 bg-white min-h-screen max-w-full overflow-x-clip flex flex-col">
        {/* 01. Hero Section (White Background) */}
        <Hero />

        {/* 02. Productized Service Catalog (Athens Gray #F5F5F7 Background) */}
        <Services />

        {/* 03. 3D Coverflow Interactive Carousel (White Background) */}
        <CoverflowReels />

        {/* 04. Verified Production Archive (Athens Gray #F5F5F7 Background) */}
        <ProductionArchive />

        {/* 05. FAQ & Compliance Section (Athens Gray #F5F5F7 Background) */}
        <FAQ />
      </main>

      {/* 06. Studio Footer (Athens Gray #F5F5F7 Background) */}
      <Footer />
    </div>
  );
}