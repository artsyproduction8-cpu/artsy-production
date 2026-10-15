import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import { breadcrumbSchema } from '@/lib/seo/schemas';
import { DEFAULT_PRICING_MATRIX } from '@/lib/pricing/catalog-matrix';

export const metadata: Metadata = {
  title: 'Pricing & Plans — Transparent Post-Production | Artsy',
  description:
    'Transparent video post-production pricing. Explore packages for weddings, brands, and corporate cinema with guaranteed delivery SLAs and instant quotation.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Pricing', url: '/pricing' },
  ]);

  const pricingTiers = [
    {
      name: 'Essential Social Cut',
      category: 'Social & Brand UGC',
      badge: 'High Velocity',
      price: '₹2,500',
      period: 'per cut',
      desc: 'Engineered for high-performing direct response ads, vertical TikTok/Instagram reels, and creator hooks.',
      features: [
        'Up to 60s finished vertical (9:16) video',
        'Kinetic typography & dynamic subtitles',
        'Platform-compliant audio normalization & music',
        '2 rounds of timecode-accurate revisions',
        '3-day standard turnaround (48h rush available)',
      ],
      ctaText: 'Book Social Cut',
      ctaHref: '/book?service=brand&sub=brand_reel',
      popular: false,
    },
    {
      name: 'Cinematic Highlight',
      category: 'Wedding & Narrative',
      badge: 'Most Popular',
      price: '₹8,500',
      period: 'per film',
      desc: 'Our signature narrative film package for luxury wedding ceremonies, destination events, and documentary recaps.',
      features: [
        '3 to 5-minute cinematic highlight film + teaser',
        'Multi-cam audio waveform conform & dialogue polish',
        'DaVinci Wide Gamut / ACES 3D film print LUT grading',
        'Full licensed orchestral / ambient music scoring',
        'ProRes 422 HQ archive + web delivery package',
        '5 to 7-day standard turnaround SLA',
      ],
      ctaText: 'Book Highlight Film',
      ctaHref: '/book?service=wedding&sub=wedding_highlight',
      popular: true,
    },
    {
      name: 'Executive Commercial',
      category: 'Corporate & Brand',
      badge: 'Enterprise Grade',
      price: '₹14,000',
      period: 'per master',
      desc: 'High-polish broadcast commercial spots, keynotes, investor reels, and brand manifesto films.',
      features: [
        'Up to 3-minute widescreen (16:9) master cut',
        'Animated motion graphics & 2D logo branding',
        'Dialogue spectral noise reduction & stem separation',
        'Dual-format deliverable (16:9 widescreen + 9:16 cutdown)',
        'Dedicated senior lead editor & color supervisor',
        '4 to 5-day standard turnaround with priority QA',
      ],
      ctaText: 'Book Commercial Master',
      ctaHref: '/book?service=corporate&sub=corp_brand',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* Structured Data: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-clip flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          {/* Header Strip */}
          <div className="max-w-3xl mb-12 text-center mx-auto">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1D1D1F] leading-tight">
              Post-Production Pricing &amp; Package Matrix
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#86868B] max-w-2xl mx-auto leading-relaxed">
              No nebulous hourly billing. No unexpected revision fees. We publish transparent base unit pricing across all disciplines with guaranteed turnaround SLAs and binding quotation calculations.
            </p>
          </div>

          {/* Pricing Tiers Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingTiers.map((tier, i) => (
              <div
                key={i}
                className={`bg-white rounded-3xl p-7 sm:p-8 border flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${
                  tier.popular
                    ? 'border-[#3B82F6] shadow-[0_8px_30px_rgba(59,130,246,0.12)] relative md:-translate-y-2'
                    : 'border-[#E5E5E7] shadow-xs hover:border-[#1D1D1F]/20'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#3B82F6] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                    {tier.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between text-xs text-[#86868B] mb-2 font-mono">
                    <span>{tier.category}</span>
                    {!tier.popular && <span>{tier.badge}</span>}
                  </div>

                  <h3 className="text-xl font-extrabold text-[#1D1D1F] mb-2">{tier.name}</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed mb-6">{tier.desc}</p>

                  <div className="p-4 rounded-2xl bg-[#F5F5F7] mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#1D1D1F]">
                        {tier.price}
                      </span>
                      <span className="text-xs text-[#86868B] font-medium">{tier.period}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                      Includes 2 revision cycles + color grading
                    </span>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 mb-8">
                    <div className="text-[10px] uppercase font-bold text-[#1D1D1F] tracking-wider">
                      Included Scope:
                    </div>
                    <ul className="space-y-2 text-xs text-[#424245]">
                      {tier.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#3B82F6] font-bold mt-0.5">✓</span>
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href={tier.ctaHref}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-all shadow-xs block ${
                    tier.popular
                      ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white'
                      : 'bg-[#1D1D1F] hover:bg-[#3B82F6] text-white'
                  }`}
                >
                  {tier.ctaText} →
                </Link>
              </div>
            ))}
          </div>

          {/* Detailed Deliverables Matrix */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E5E5E7] shadow-xs space-y-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F]">
                Full Service Suites &amp; Starting Rates
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#86868B] leading-relaxed max-w-3xl">
                Every discipline has calibrated camera count rules, resolution specs, and rush delivery multipliers. Explore our specialized production categories below or test your exact parameters in our configurator.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {DEFAULT_PRICING_MATRIX.map((cat) => (
                <div key={cat.id} className="p-5 rounded-2xl bg-[#F5F5F7] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#3B82F6]">
                    <span>{cat.badge}</span>
                    <span className="text-[#1D1D1F]">{cat.products.length} Formats</span>
                  </div>
                  <h3 className="font-bold text-[#1D1D1F] text-base">{cat.title}</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-[#E5E5E7] text-xs">
                    <span className="text-[#86868B]">Starting from:</span>
                    <span className="font-extrabold text-[#1D1D1F]">
                      ₹{Math.min(...cat.products.map((p) => p.basePrice)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Link
                    href={`/services/${cat.id}`}
                    className="block text-center py-2 px-3 rounded-lg bg-white hover:bg-[#1D1D1F] hover:text-white border border-[#E5E5E7] text-[11px] font-bold uppercase tracking-wider transition-colors"
                  >
                    View Rate Sheet
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
