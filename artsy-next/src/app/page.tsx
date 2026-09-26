'use client';

import Navbar from './components/marketing/Navbar';
import Hero from './components/marketing/Hero';
import Services from './components/marketing/Services';
import CoverflowReels from './components/marketing/CoverflowReels';
import ProductionArchive from './components/marketing/ProductionArchive';
import FAQ from './components/marketing/FAQ';
import Footer from './components/marketing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white w-full max-w-full overflow-x-hidden">
      {/* 00. Top Navigation */}
      <Navbar />

      <main className="w-full pt-16 bg-white min-h-screen max-w-full overflow-x-hidden flex flex-col">
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