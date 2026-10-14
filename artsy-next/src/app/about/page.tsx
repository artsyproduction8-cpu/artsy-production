import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'About Us — Cinematic Post-Production Studio | Artsy',
  description:
    'Discover Artsy Production\'s story, mission, and curated network of film editors and colorists delivering high-contrast cinema for weddings and global brands.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
  ]);

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* Structured Data: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-clip flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          {/* Hero Header */}
          <section className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-bold uppercase tracking-wider mb-4">
              Our Heritage &amp; Vision
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1D1D1F] leading-tight">
              About Artsy Production — Cinematic Post-Production Studio
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[#86868B] leading-relaxed">
              Artsy Production is a specialized post-production studio and technological platform founded to bridge the gap between world-class cinematic editorial craft and predictable, engineering-grade turnaround execution.
            </p>
          </section>

          {/* Company Story & Genesis */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 border-t border-[#F5F5F7]">
            <div className="lg:col-span-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3B82F6]">
                01 // The Origin
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] mt-2">
                Why We Built Artsy Production
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-6 text-sm sm:text-base text-[#424245] leading-relaxed">
              <p>
                For decades, video creators and production houses faced an unresolvable trade-off: traditional boutique post-production houses were slow, prohibitively expensive, and opaque in their billing, while unvetted freelance marketplaces suffered from inconsistent color grading, poor audio cleanup, and missed release dates.
              </p>
              <p>
                We established Artsy Production with a radical premise: treat video post-production as a precision craft backed by deterministic cloud infrastructure. By uniting elite film editors, DaVinci-certified colorists, and acoustic sound engineers under a unified quality assurance framework, we deliver cinema-grade masters with guaranteed delivery timelines and upfront unit pricing.
              </p>
              <p>
                Today, Artsy operates across Mumbai, Dubai, London, and New York, delivering multi-camera wedding epics, high-velocity direct-to-consumer brand commercials, and high-stakes corporate keynote packages for forward-thinking clients worldwide.
              </p>
            </div>
          </section>

          {/* Core Mission & Philosophy */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 border-t border-[#F5F5F7]">
            <div className="lg:col-span-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3B82F6]">
                02 // Core Philosophy
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] mt-2">
                Deterministic Color Science &amp; Narrative Flow
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-6 text-sm sm:text-base text-[#424245] leading-relaxed">
              <p>
                Great cinema is born from contrast, restraint, and rhythm. Our editorial team does not simply cut clips together; we construct narrative arcs that command audience attention and trigger emotional resonance.
              </p>
              <p>
                Every frame passing through our studio adheres to rigorous color management standards. Whether your camera operators capture in Sony S-Log3, ARRI LogC4, Canon Log2, or RED IPP2, we transform and conform footage within calibrated ACES and DaVinci Wide Gamut spaces. We preserve dynamic range highlights, isolate natural skin tones with volumetric masks, and master acoustic speech stems using spectral repair tools to ensure broadcast-level audio clarity.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="p-6 bg-[#F5F5F7] rounded-2xl space-y-2">
                  <h3 className="font-bold text-[#1D1D1F] text-base">Uncompromising Craftsmanship</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed">
                    We reject generic template transitions and algorithmic auto-cuts. Every cut is hand-placed by seasoned editors who understand visual rhythm, eyeline matching, and dramatic tension.
                  </p>
                </div>
                <div className="p-6 bg-[#F5F5F7] rounded-2xl space-y-2">
                  <h3 className="font-bold text-[#1D1D1F] text-base">Deterministic Accountability</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed">
                    Deadlines are contractual commitments. Our proprietary operations dashboard monitors real-time task progression to guarantee your master cuts arrive on schedule every time.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Curated Collective */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 border-t border-[#F5F5F7]">
            <div className="lg:col-span-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3B82F6]">
                03 // The Talent Roster
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] mt-2">
                The Top 3% Creative Collective
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-6 text-sm sm:text-base text-[#424245] leading-relaxed">
              <p>
                Unlike generic freelancer platforms that crowd thousands of unvetted profiles, Artsy maintains an exclusive, handpicked roster. Our recruitment process includes blind technical challenges, multi-camera audio conform tests, and strict verification of hardware and monitoring environments.
              </p>
              <p>
                Our creators are specialists, not generalists. We pair wedding filmmakers with editors who specialize in emotional storytelling and cultural wedding rituals. We assign commercial campaigns to editors skilled in high-retention vertical pacing, kinetic typography, and direct-response performance hooks.
              </p>
              <div className="pt-2">
                <Link
                  href="/creators"
                  className="text-xs font-bold text-[#3B82F6] hover:underline inline-flex items-center gap-1"
                >
                  <span>Explore our vetted creator roster</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Studio CTAs */}
          <section className="mt-16 p-8 sm:p-12 rounded-3xl bg-[#1D1D1F] text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ready to elevate your film production?
              </h2>
              <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
                Review our completed works in the cinematic portfolio or configure your project in our instant quotation calculator.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <Link
                href="/work"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/20 hover:border-white text-white text-xs font-bold uppercase tracking-wider text-center transition-colors"
              >
                View Portfolio Reels
              </Link>
              <Link
                href="/book"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-sm"
              >
                Book Instant Quote →
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
