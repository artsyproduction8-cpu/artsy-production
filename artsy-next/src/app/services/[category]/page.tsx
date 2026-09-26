'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

export interface SubCategoryItem {
  id: string;
  name: string;
  duration: string;
  basePrice: number;
  standardDelivery: string;
  rushOptions: string;
  description: string;
  deliverables: string[];
  popular?: boolean;
}

export interface CategoryDetail {
  id: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  subCategories: SubCategoryItem[];
}

const CATEGORY_MAP: Record<string, CategoryDetail> = {
  wedding: {
    id: 'wedding',
    badge: 'LUXURY CINEMA',
    title: 'Wedding Post-Production',
    tagline: 'Story-driven emotional pacing, multi-angle audio sync, and custom film LUT grading.',
    description:
      'Engineered specifically for luxury celebrations and weddings. Every package includes multi-camera waveform sync, professional audio dialogue mastering, licensed musical scoring, and one complimentary revision pass.',
    subCategories: [
      {
        id: 'highlight-teaser',
        name: 'Highlight + Teaser',
        duration: '3–5 min + 45–60 sec',
        basePrice: 5000,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        description: 'Paced narrative wedding highlight paired with a high-impact cinematic teaser for social premiere.',
        deliverables: ['3–5 Min Narrative Highlight', '45–60s Cinematic Teaser', 'Multi-Cam Waveform Sync', 'Rec.709 Film LUT Grade', '1 Free Revision Pass'],
        popular: true,
      },
      {
        id: 'highlight-only',
        name: 'Highlight Only',
        duration: '3–5 min',
        basePrice: 4000,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        description: 'Stand-alone narrative highlight film focusing on emotional speeches, ceremony rituals, and party moments.',
        deliverables: ['3–5 Min Narrative Highlight', 'Speech & Ceremony Audio Sync', 'Custom Color Grade', '1 Free Revision Pass'],
      },
      {
        id: 'teaser-only',
        name: 'Teaser Only',
        duration: '45–60 sec',
        basePrice: 2000,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        description: 'Fast-paced, emotionally charged teaser designed for immediate family and Instagram sharing.',
        deliverables: ['45–60s Cinematic Teaser', 'Vertical (9:16) & Widescreen (16:9)', 'Licensed Soundtrack', '1 Free Revision Pass'],
      },
      {
        id: 'trinity-bundle',
        name: 'Highlight + Teaser + Reel',
        duration: '3–5m + 45–60s + 30–60s',
        basePrice: 8000,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        description: 'Complete celebration suite featuring narrative film, teaser cut, and vertical social cutdowns.',
        deliverables: ['3–5 Min Narrative Highlight', '45–60s Cinematic Teaser', '30–60s Social Reel', 'Dual Aspect Ratio Formats', '1 Free Revision Pass'],
      },
      {
        id: 'reel-only',
        name: 'Social Reel Only',
        duration: '30–60 sec',
        basePrice: 1500,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        description: 'Dynamic, high-velocity vertical reel optimized specifically for Instagram Reels and TikTok.',
        deliverables: ['30–60s Vertical 9:16 Cut', 'Beat-Synced Transitions', 'Speech Audio Polish', '1 Free Revision Pass'],
      },
      {
        id: 'cinematic-story',
        name: 'Cinematic Story',
        duration: '10–15 min',
        basePrice: 8000,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        description: 'Full documentary cut preserving entire vows, extended speeches, and key cultural rituals in full chronological flow.',
        deliverables: ['10–15 Min Extended Story Film', 'Multi-Cam Dialogue Matching', 'Archival Audio Mastering', '1 Free Revision Pass'],
      },
      {
        id: 'master-package',
        name: 'Cinematic Story + Teaser + Reel',
        duration: '10–15m + 45–60s + 30–60s',
        basePrice: 10000,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        description: 'Comprehensive archival master package with full longform documentary cut plus short social deliverables.',
        deliverables: ['10–15 Min Archival Documentary', '45–60s Teaser Cut', '30–60s Social Reel', 'Master Deliverable Export', '1 Free Revision Pass'],
      },
    ],
  },
  brand: {
    id: 'brand',
    badge: 'GROWTH & DTC',
    title: 'Brand & Performance Video',
    tagline: 'High-retention commercial hooks, kinetic typography, and motion sound design.',
    description:
      'Engineered for DTC brands, paid social performance, and commercial campaigns. High-velocity narrative cuts designed to stop feeds and increase conversion rates.',
    subCategories: [
      {
        id: 'product-video',
        name: 'Product Video',
        duration: 'Max 2 min',
        basePrice: 3000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        description: 'Clean product rotation, macro speed ramps, and rhythmic foley sync to showcase premium merchandise.',
        deliverables: ['Up to 2 Min Final Cut', 'Macro Detail Ramps', 'Subtle Graphic Callouts', '1 Free Revision Pass'],
        popular: true,
      },
      {
        id: 'brand-video',
        name: 'Brand Video',
        duration: 'Max 2 min',
        basePrice: 3000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        description: 'Core brand manifesto cut engineered for high recall, investor pitches, and website hero banners.',
        deliverables: ['Up to 2 Min Manifesto Cut', 'Cinematic Color Grading', 'Licensed Soundtrack', '1 Free Revision Pass'],
      },
      {
        id: 'fashion-apparel',
        name: 'Fashion / Apparel Video',
        duration: 'Max 2 min',
        basePrice: 3000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        description: 'Stylized lookbook rhythm, editorial color science, and dynamic fabric texture showcases.',
        deliverables: ['Up to 2 Min Lookbook Cut', 'Bespoke Color Palette Match', 'Dynamic Rhythm Cuts', '1 Free Revision Pass'],
      },
      {
        id: 'ad-film',
        name: 'Ad Film',
        duration: 'Max 2 min',
        basePrice: 10000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        description: 'High-production commercial ad with conversion hooks, full sound design, and variant exports.',
        deliverables: ['Up to 2 Min Commercial Master', '3x Variant Hook Cuts', 'Full Foley Sound Design', 'Multi-Platform Aspect Ratios', '1 Free Revision Pass'],
      },
      {
        id: 'explainer-video',
        name: 'Explainer Video',
        duration: 'Max 2 min',
        basePrice: 8000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        description: 'Step-by-step kinetic typographic breakdown, graphic callouts, and clean screen conforming.',
        deliverables: ['Up to 2 Min Explainer Cut', 'Dynamic Subtitles & SFX', 'Motion Graphic Callouts', '1 Free Revision Pass'],
      },
    ],
  },
  corporate: {
    id: 'corporate',
    badge: 'EXECUTIVE',
    title: 'Corporate & Event Post-Production',
    tagline: 'Conference summits, keynote presentations, and investor sizzle reels.',
    description:
      'Broadcast-grade audio cleanup, slide deck conforming, dynamic lower thirds, and executive storytelling for conferences, summits, and internal communications.',
    subCategories: [
      {
        id: 'event-highlight',
        name: 'Event Highlight',
        duration: '3–5 min',
        basePrice: 12000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        description: 'High-energy summit montage capturing keynote speakers, audience engagement, and VIP moments.',
        deliverables: ['3–5 Min Summit Highlight', 'Multi-Speaker Switching', 'Lower Thirds & Branding', '1 Free Revision Pass'],
        popular: true,
      },
      {
        id: 'corporate-film',
        name: 'Corporate Film',
        duration: 'Comprehensive Cut',
        basePrice: 15000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        description: 'Flagship corporate film showcasing leadership vision, enterprise scale, and brand values.',
        deliverables: ['Flagship Corporate Film', 'Broadcast EBU R128 Audio Normalization', 'Keynote Slide Conforming', '1 Free Revision Pass'],
      },
      {
        id: 'testimonial',
        name: 'Testimonial Video',
        duration: '2–4 min',
        basePrice: 10000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        description: 'Credibility-driven interview cut with b-roll overlay and branded typographic callouts.',
        deliverables: ['Polished Interview Edit', 'B-Roll Cutaways', 'Noise & Reverb Suppression', '1 Free Revision Pass'],
      },
      {
        id: 'training-video',
        name: 'Internal Training Video',
        duration: 'Modular Cut',
        basePrice: 8000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        description: 'Educational modules with clear chaptering, split screens, and synchronized slide presentation.',
        deliverables: ['Modular Educational Cut', 'Chapter Markers & Title Cards', 'Clear Speech Mastering', '1 Free Revision Pass'],
      },
    ],
  },
  personal: {
    id: 'personal',
    badge: 'LIFE MILESTONES',
    title: 'Personal & Milestone Cinema',
    tagline: 'Birthdays, engagements, baby showers, memorials, and family anniversaries.',
    description:
      'Cherished milestone films crafted with emotional pacing, speech alignment, custom musical scoring, and beautiful color grading.',
    subCategories: [
      {
        id: 'birthday-highlight',
        name: 'Birthday Highlight',
        duration: '3–5 min',
        basePrice: 3000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Heartfelt storytelling cut with high-energy party celebrations and family moments.',
        deliverables: ['3–5 Min Milestone Highlight', 'Music Scoring', 'Color Conform', '1 Free Revision Pass'],
      },
      {
        id: 'birthday-highlight-teaser',
        name: 'Birthday Highlight + Teaser',
        duration: '3–5 min + 45–60 sec',
        basePrice: 4000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Celebration film paired with a cinematic social teaser.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser Cut', 'Color Conform', '1 Free Revision Pass'],
      },
      {
        id: 'birthday-triple',
        name: 'Birthday Highlight + Teaser + Reel',
        duration: '3–5m + 45–60s + 30–60s',
        basePrice: 5000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Triple package with longform highlight, teaser, and vertical reel cutdowns.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser', '30–60s Social Reel', '1 Free Revision Pass'],
        popular: true,
      },
      {
        id: 'birthday-teaser',
        name: 'Birthday Teaser Only',
        duration: '45–60 sec',
        basePrice: 1500,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Fast-paced teaser cut designed for quick WhatsApp and social sharing.',
        deliverables: ['45–60s Teaser Cut', 'Beat Sync Transitions', '1 Free Revision Pass'],
      },
      {
        id: 'birthday-reel',
        name: 'Birthday Reel Only',
        duration: '30–60 sec',
        basePrice: 1000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Short vertical reel capturing cake cutting and core highlights.',
        deliverables: ['30–60s Vertical Reel', 'Upbeat Sound Design', '1 Free Revision Pass'],
      },
      {
        id: 'engagement-highlight',
        name: 'Engagement Highlight',
        duration: '3–5 min',
        basePrice: 3500,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Romantic couple story with synchronised ring ceremony vows and music.',
        deliverables: ['3–5 Min Engagement Film', 'Speech Audio Sync', 'Film LUT Grade', '1 Free Revision Pass'],
      },
      {
        id: 'engagement-highlight-teaser',
        name: 'Engagement Highlight + Teaser',
        duration: '3–5 min + 45–60 sec',
        basePrice: 4500,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Romantic couple narrative plus social announcement teaser.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser', 'Speech Audio Sync', '1 Free Revision Pass'],
      },
      {
        id: 'engagement-triple',
        name: 'Engagement Highlight + Teaser + Reel',
        duration: '3–5m + 45–60s + 30–60s',
        basePrice: 5500,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Complete engagement celebration bundle with highlight, teaser, and vertical reel.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser', '30–60s Vertical Reel', '1 Free Revision Pass'],
      },
      {
        id: 'baby-shower-highlight',
        name: 'Baby Shower Highlight',
        duration: '3–5 min',
        basePrice: 3000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Family speeches, candid games, and celebration montage with soft emotional grading.',
        deliverables: ['3–5 Min Celebration Cut', 'Speech Polish', 'Warm Color Palette', '1 Free Revision Pass'],
      },
      {
        id: 'baby-shower-bundle',
        name: 'Baby Shower Highlight + Teaser + Reel',
        duration: '3–5m + 45–60s + 30–60s',
        basePrice: 5000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Complete baby shower package preserving candid family moments.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser', '30–60s Social Reel', '1 Free Revision Pass'],
      },
      {
        id: 'memorial-film',
        name: 'Memorial & Celebration of Life',
        duration: '3–5 min',
        basePrice: 3000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Tender retrospective film preserving family legacy, tributes, and cherished memories.',
        deliverables: ['3–5 Min Retrospective Cut', 'Audio Restoration & Speech Enhancements', '1 Free Revision Pass'],
      },
      {
        id: 'maternity-reel',
        name: 'Maternity Reel',
        duration: '30–60 sec',
        basePrice: 1000,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        description: 'Intimate poetic reel celebrating motherhood with ethereal color grade.',
        deliverables: ['30–60s Vertical Reel', 'Ethereal Tone Curve', 'Gentle Foley Scoring', '1 Free Revision Pass'],
      },
    ],
  },
};

const CATEGORY_TABS = [
  { id: 'wedding', label: 'Wedding' },
  { id: 'brand', label: 'Brand' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'personal', label: 'Personal / Other' },
];

export default function ServiceCategoryDetailPage() {
  const params = useParams<{ category: string }>();
  const rawKey = (params?.category || 'wedding').toLowerCase();
  const categoryKey = rawKey === 'ugc' || rawKey === 'brand_ugc' ? 'brand' : rawKey in CATEGORY_MAP ? rawKey : 'wedding';
  const category = CATEGORY_MAP[categoryKey] || CATEGORY_MAP.wedding;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-hidden flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          
          {/* Top Breadcrumb & Switcher Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors uppercase tracking-wider"
            >
              <span>←</span>
              <span>Home</span>
            </Link>

            {/* Category Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E5E5E7]">
              {CATEGORY_TABS.map((tab) => {
                const isActive = tab.id === categoryKey;
                return (
                  <Link
                    key={tab.id}
                    href={`/services/${tab.id}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#1D1D1F] text-white shadow-xs'
                        : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Category Hero Banner */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E5E5E7] shadow-[0_4px_24px_rgba(0,0,0,0.04)] mb-10">
            <div className="inline-block text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              {category.badge}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              {category.title}
            </h1>
            <p className="mt-3 text-base sm:text-lg font-semibold text-[#1D1D1F]/90">
              {category.tagline}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-[#86868B] max-w-3xl leading-relaxed">
              {category.description}
            </p>
          </div>

          {/* Sub-Category Catalog Grid */}
          <div className="mb-14">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                {category.title} Packages
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.subCategories.map((sub) => (
                <div
                  key={sub.id}
                  className={`bg-white rounded-2xl p-6 sm:p-7 border flex flex-col justify-between transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] ${
                    sub.popular
                      ? 'border-[#3B82F6] shadow-[0_4px_20px_rgba(59,130,246,0.08)] relative'
                      : 'border-[#E5E5E7]'
                  }`}
                >
                  {sub.popular && (
                    <span className="absolute -top-3 right-6 bg-[#3B82F6] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                      Popular
                    </span>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
                        {sub.name}
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#F5F5F7] text-[#86868B] shrink-0">
                        {sub.duration}
                      </span>
                    </div>

                    <p className="text-xs text-[#86868B] leading-relaxed mb-4">
                      {sub.description}
                    </p>

                    {/* Price Block */}
                    <div className="bg-[#F5F5F7] rounded-xl p-4 mb-5">
                      <div className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                        ₹{sub.basePrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-[#86868B] mt-1.5 flex justify-between">
                        <span>SLA: {sub.standardDelivery}</span>
                        <span>{sub.rushOptions}</span>
                      </div>
                    </div>

                    {/* Deliverables Checklist */}
                    <div className="space-y-2 mb-6">
                      <div className="text-[11px] uppercase font-bold text-[#1D1D1F] tracking-wider">
                        Deliverable Scope
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#424245]">
                        {sub.deliverables.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="text-[#3B82F6] font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Direct Book Action */}
                  <Link
                    href={`/book?service=${categoryKey}&sub=${sub.id}&basePrice=${sub.basePrice}&subName=${encodeURIComponent(sub.name)}`}
                    className="w-full py-3 px-4 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Configure &amp; Book</span>
                    <span>→</span>
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