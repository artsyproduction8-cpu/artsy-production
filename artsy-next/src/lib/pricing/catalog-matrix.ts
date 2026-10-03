/**
 * ARTSY PRODUCTION — Unified Live Catalog & Dynamic Pricing Matrix
 * ================================================================
 * Single Source of Truth for:
 *  - Main Public Website: /services, /services/[category], /book, marketing components
 *  - Operations & Admin Station: /admin/pricing, /admin unified dashboard
 *
 * When changes are made or deployed in /admin/pricing, they immediately
 * synchronize and reflect across the entire live website application.
 */

export interface ServiceProduct {
  id: string;
  categoryId: string;
  name: string;
  duration: string;
  basePrice: number; // in INR
  slaHours: number; // e.g. 168 (7 days), 96 (4 days), 48 (2 days)
  standardDelivery: string;
  rushOptions: string;
  rushFee: number;
  rushMultiplier: number;
  creatorSharePct: number; // e.g. 70
  description: string;
  deliverables: string[];
  cameraProfiles: string[];
  popular?: boolean;
  tag?: string;
  active: boolean;
}

export interface ServiceCategory {
  id: string;
  title: string;
  badge: string;
  tagline: string;
  icon: string;
  turnaround: string;
  description: string;
  products: ServiceProduct[];
}

export interface CameraAngleRule {
  id: 'single' | 'dual' | 'multicam';
  label: string;
  camerasCount: string;
  costWeddingPersonal: number;
  costBrandCorporate: number;
  description: string;
}

export interface DeliverySlaRule {
  id: 'standard' | 'priority' | 'rush';
  label: string;
  turnaroundDays: string;
  hours: number;
  costWeddingPersonal: number;
  costBrandCorporate: number;
  description: string;
}

export const DEFAULT_PRICING_MATRIX: ServiceCategory[] = [
  {
    id: 'wedding',
    title: 'Wedding',
    badge: 'LUXURY CINEMA',
    tagline: 'Story-driven emotional pacing, multi-angle audio sync, and custom film LUT grading.',
    icon: '💒',
    turnaround: '7–10 Days Standard (Rush: +₹2,000)',
    description:
      'Engineered specifically for luxury celebrations and weddings. Every package includes multi-camera waveform sync, professional audio dialogue mastering, licensed musical scoring, and one complimentary revision pass.',
    products: [
      {
        id: 'highlight-teaser',
        categoryId: 'wedding',
        name: 'Highlight + Teaser',
        duration: '3–5 min + 45–60 sec',
        basePrice: 5000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        rushFee: 2000,
        rushMultiplier: 1.4,
        creatorSharePct: 70,
        description: 'Paced narrative wedding highlight paired with a high-impact cinematic teaser for social premiere.',
        deliverables: ['3–5 Min Narrative Highlight', '45–60s Cinematic Teaser', 'Multi-Cam Waveform Sync', 'Rec.709 Film LUT Grade', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3.Cine', 'Canon Log 2/3', 'Panasonic V-Log'],
        popular: true,
        tag: 'Most Popular',
        active: true,
      },
      {
        id: 'highlight-only',
        categoryId: 'wedding',
        name: 'Highlight Only',
        duration: '3–5 min',
        basePrice: 4000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        rushFee: 2000,
        rushMultiplier: 1.5,
        creatorSharePct: 70,
        description: 'Stand-alone narrative highlight film focusing on emotional speeches, ceremony rituals, and party moments.',
        deliverables: ['3–5 Min Narrative Highlight', 'Speech & Ceremony Audio Sync', 'Custom Color Grade', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'Canon Log 2', 'Nikon N-Log'],
        active: true,
      },
      {
        id: 'teaser-only',
        categoryId: 'wedding',
        name: 'Teaser Only',
        duration: '45–60 sec',
        basePrice: 2000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        rushFee: 2000,
        rushMultiplier: 2.0,
        creatorSharePct: 70,
        description: 'Fast-paced, emotionally charged teaser designed for immediate family and Instagram sharing.',
        deliverables: ['45–60s Cinematic Teaser', 'Vertical (9:16) & Widescreen (16:9)', 'Licensed Soundtrack', '1 Free Revision Pass'],
        cameraProfiles: ['Sony FX3/FX6', 'Apple ProRes Log'],
        active: true,
      },
      {
        id: 'trinity-bundle',
        categoryId: 'wedding',
        name: 'Trinity: Highlight + Teaser + Reel',
        duration: '3–5m + 45–60s + 30–60s',
        basePrice: 8000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        rushFee: 2000,
        rushMultiplier: 1.25,
        creatorSharePct: 70,
        description: 'Complete celebration suite featuring narrative film, teaser cut, and vertical social cutdowns.',
        deliverables: ['3–5 Min Narrative Highlight', '45–60s Cinematic Teaser', '30–60s Social Reel', 'Dual Aspect Ratio Formats', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'Canon Log 2/3', 'RED IPP2'],
        tag: 'Full Suite',
        active: true,
      },
      {
        id: 'reel-only',
        categoryId: 'wedding',
        name: 'Social Reel Only',
        duration: '30–60 sec',
        basePrice: 1500,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        rushFee: 2000,
        rushMultiplier: 2.3,
        creatorSharePct: 70,
        description: 'Dynamic, high-velocity vertical reel optimized specifically for Instagram Reels and TikTok.',
        deliverables: ['30–60s Vertical 9:16 Cut', 'Beat-Synced Transitions', 'Speech Audio Polish', '1 Free Revision Pass'],
        cameraProfiles: ['iPhone 15/16 Pro Log', 'Sony FX3'],
        active: true,
      },
      {
        id: 'cinematic-story',
        categoryId: 'wedding',
        name: 'Cinematic Story',
        duration: '10–15 min',
        basePrice: 8000,
        slaHours: 216,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        rushFee: 2000,
        rushMultiplier: 1.25,
        creatorSharePct: 70,
        description: 'Full documentary cut preserving entire vows, extended speeches, and key cultural rituals in full chronological flow.',
        deliverables: ['10–15 Min Extended Story Film', 'Multi-Cam Dialogue Matching', 'Archival Audio Mastering', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'Canon Cinema RAW', 'ARRI LogC3/4'],
        active: true,
      },
      {
        id: 'master-package',
        categoryId: 'wedding',
        name: 'Cinematic Story + Teaser + Reel',
        duration: '10–15m + 45–60s + 30–60s',
        basePrice: 10000,
        slaHours: 240,
        standardDelivery: '7–10 working days',
        rushOptions: '+₹2,000 (4–5 days)',
        rushFee: 2000,
        rushMultiplier: 1.2,
        creatorSharePct: 72,
        description: 'Comprehensive archival master package with full longform documentary cut plus short social deliverables.',
        deliverables: ['10–15 Min Archival Documentary', '45–60s Teaser Cut', '30–60s Social Reel', 'Master Deliverable Export', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'Canon Log 2/3', 'ARRI LogC'],
        tag: 'Archival Master',
        active: true,
      },
    ],
  },
  {
    id: 'brand',
    title: 'Brand',
    badge: 'GROWTH & DTC',
    tagline: 'High-retention commercial hooks, kinetic typography, and motion sound design.',
    icon: '🎬',
    turnaround: '7–10 Days Standard (48h Rush Available)',
    description:
      'Engineered for DTC brands, paid social performance, and commercial campaigns. High-velocity narrative cuts designed to stop feeds and increase conversion rates.',
    products: [
      {
        id: 'product-video',
        categoryId: 'brand',
        name: 'Product Video',
        duration: 'Max 2 min',
        basePrice: 3000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.66,
        creatorSharePct: 70,
        description: 'Clean product rotation, macro speed ramps, and rhythmic foley sync to showcase premium merchandise.',
        deliverables: ['Up to 2 Min Final Cut', 'Macro Detail Ramps', 'Subtle Graphic Callouts', '1 Free Revision Pass'],
        cameraProfiles: ['RED IPP2 Wide Gamut', 'Sony S-Log3', 'ARRI LogC3/4'],
        popular: true,
        tag: 'DTC Hero',
        active: true,
      },
      {
        id: 'brand-video',
        categoryId: 'brand',
        name: 'Brand Video',
        duration: 'Max 2 min',
        basePrice: 3000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.66,
        creatorSharePct: 70,
        description: 'Core brand manifesto cut engineered for high recall, investor pitches, and website hero banners.',
        deliverables: ['Up to 2 Min Manifesto Cut', 'Cinematic Color Grading', 'Licensed Soundtrack', '1 Free Revision Pass'],
        cameraProfiles: ['Sony FX6/FX9', 'Canon C70 / C300 Mk III'],
        active: true,
      },
      {
        id: 'fashion-apparel',
        categoryId: 'brand',
        name: 'Fashion / Apparel Video',
        duration: 'Max 2 min',
        basePrice: 3000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.66,
        creatorSharePct: 70,
        description: 'Stylized lookbook rhythm, editorial color science, and dynamic fabric texture showcases.',
        deliverables: ['Up to 2 Min Lookbook Cut', 'Bespoke Color Palette Match', 'Dynamic Rhythm Cuts', '1 Free Revision Pass'],
        cameraProfiles: ['Sony A7S III/FX3', 'Canon R5C'],
        active: true,
      },
      {
        id: 'ad-film',
        categoryId: 'brand',
        name: 'Ad Film (Commercial Cut)',
        duration: 'Max 2 min',
        basePrice: 10000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.2,
        creatorSharePct: 72,
        description: 'High-production commercial ad with conversion hooks, full sound design, and variant exports.',
        deliverables: ['Up to 2 Min Commercial Master', '3x Variant Hook Cuts', 'Full Foley Sound Design', 'Multi-Platform Aspect Ratios', '1 Free Revision Pass'],
        cameraProfiles: ['ARRI Alexa 35', 'RED V-Raptor', 'Sony Venice 2'],
        tag: 'High Velocity',
        active: true,
      },
      {
        id: 'explainer-video',
        categoryId: 'brand',
        name: 'Explainer Video',
        duration: 'Max 2 min',
        basePrice: 8000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.25,
        creatorSharePct: 70,
        description: 'Step-by-step kinetic typographic breakdown, graphic callouts, and clean screen conforming.',
        deliverables: ['Up to 2 Min Explainer Cut', 'Dynamic Subtitles & SFX', 'Motion Graphic Callouts', '1 Free Revision Pass'],
        cameraProfiles: ['Vector / Screen Capture Ingest', 'Clean Rec.709'],
        active: true,
      },
    ],
  },
  {
    id: 'corporate',
    title: 'Corporate',
    badge: 'EXECUTIVE',
    tagline: 'Conference summits, keynote presentations, and investor sizzle reels.',
    icon: '🏢',
    turnaround: '7–10 Days Standard (Rush: +₹1,000/2,000)',
    description:
      'Broadcast-grade audio cleanup, slide deck conforming, dynamic lower thirds, and executive storytelling for conferences, summits, and internal communications.',
    products: [
      {
        id: 'event-highlight',
        categoryId: 'corporate',
        name: 'Event Highlight',
        duration: '3–5 min',
        basePrice: 12000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.16,
        creatorSharePct: 70,
        description: 'High-energy summit montage capturing keynote speakers, audience engagement, and VIP moments.',
        deliverables: ['3–5 Min Summit Highlight', 'Multi-Speaker Switching', 'Lower Thirds & Branding', '1 Free Revision Pass'],
        cameraProfiles: ['Sony FX6 / FX3', 'Panasonic Lumix S1H'],
        popular: true,
        tag: 'Summit Recap',
        active: true,
      },
      {
        id: 'corporate-film',
        categoryId: 'corporate',
        name: 'Corporate Film (Full Keynote)',
        duration: 'Comprehensive Cut',
        basePrice: 15000,
        slaHours: 192,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.13,
        creatorSharePct: 72,
        description: 'Flagship corporate film showcasing leadership vision, enterprise scale, and brand values.',
        deliverables: ['Flagship Corporate Film', 'Broadcast EBU R128 Audio Normalization', 'Keynote Slide Conforming', '1 Free Revision Pass'],
        cameraProfiles: ['ARRI Amira / Mini LF', 'Sony FX9', 'Canon C500 Mk II'],
        tag: 'Enterprise',
        active: true,
      },
      {
        id: 'testimonial',
        categoryId: 'corporate',
        name: 'Testimonial Video',
        duration: '2–4 min',
        basePrice: 10000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.2,
        creatorSharePct: 70,
        description: 'Credibility-driven interview cut with b-roll overlay and branded typographic callouts.',
        deliverables: ['Polished Interview Edit', 'B-Roll Cutaways', 'Noise & Reverb Suppression', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'Canon Log 3'],
        active: true,
      },
      {
        id: 'training-video',
        categoryId: 'corporate',
        name: 'Internal Training Video',
        duration: 'Modular Chapter',
        basePrice: 8000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush 48h +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.25,
        creatorSharePct: 70,
        description: 'Educational modules with clear chaptering, split screens, and synchronized slide presentation.',
        deliverables: ['Modular Educational Cut', 'Chapter Markers & Title Cards', 'Clear Speech Mastering', '1 Free Revision Pass'],
        cameraProfiles: ['1080p/4K Presentation Master'],
        tag: 'Modular Chapter',
        active: true,
      },
    ],
  },
  {
    id: 'personal',
    title: 'Personal / Other',
    badge: 'LIFE MILESTONES',
    tagline: 'Birthdays, engagements, baby showers, memorials, and family anniversaries.',
    icon: '🎉',
    turnaround: '7–10 Days Standard (Rush: +₹1,000/2,000)',
    description:
      'Cherished milestone films crafted with emotional pacing, speech alignment, custom musical scoring, and beautiful color grading.',
    products: [
      {
        id: 'birthday-highlight',
        categoryId: 'personal',
        name: 'Birthday Highlight',
        duration: '3–5 min',
        basePrice: 3000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.66,
        creatorSharePct: 70,
        description: 'Heartfelt storytelling cut with high-energy party celebrations and family moments.',
        deliverables: ['3–5 Min Milestone Highlight', 'Music Scoring', 'Color Conform', '1 Free Revision Pass'],
        cameraProfiles: ['Standard Rec.709', 'Sony S-Cinetone'],
        active: true,
      },
      {
        id: 'birthday-highlight-teaser',
        categoryId: 'personal',
        name: 'Birthday Highlight + Teaser',
        duration: '3–5 min + 45–60 sec',
        basePrice: 4000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.5,
        creatorSharePct: 70,
        description: 'Celebration film paired with a cinematic social teaser.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser Cut', 'Color Conform', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'Canon Log'],
        active: true,
      },
      {
        id: 'birthday-triple',
        categoryId: 'personal',
        name: 'Birthday Triple Bundle',
        duration: '3–5m + 45–60s + 30–60s',
        basePrice: 5000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.4,
        creatorSharePct: 70,
        description: 'Triple package with longform highlight, teaser, and vertical reel cutdowns.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser', '30–60s Social Reel', '1 Free Revision Pass'],
        cameraProfiles: ['Sony FX3', 'iPhone ProRes'],
        popular: true,
        tag: 'Popular',
        active: true,
      },
      {
        id: 'birthday-teaser',
        categoryId: 'personal',
        name: 'Birthday Teaser Only',
        duration: '45–60 sec',
        basePrice: 1500,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 2.3,
        creatorSharePct: 70,
        description: 'Fast-paced teaser cut designed for quick WhatsApp and social sharing.',
        deliverables: ['45–60s Teaser Cut', 'Beat Sync Transitions', '1 Free Revision Pass'],
        cameraProfiles: ['Mobile / DSLR'],
        active: true,
      },
      {
        id: 'birthday-reel',
        categoryId: 'personal',
        name: 'Birthday Reel Only',
        duration: '30–60 sec',
        basePrice: 1000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 3.0,
        creatorSharePct: 70,
        description: 'Short vertical reel capturing cake cutting and core highlights.',
        deliverables: ['30–60s Vertical Reel', 'Upbeat Sound Design', '1 Free Revision Pass'],
        cameraProfiles: ['Mobile 9:16'],
        active: true,
      },
      {
        id: 'engagement-highlight',
        categoryId: 'personal',
        name: 'Engagement Highlight',
        duration: '3–5 min',
        basePrice: 3500,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.57,
        creatorSharePct: 70,
        description: 'Romantic couple story with synchronised ring ceremony vows and music.',
        deliverables: ['3–5 Min Engagement Film', 'Speech Audio Sync', 'Film LUT Grade', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'Canon Log 2/3'],
        active: true,
      },
      {
        id: 'engagement-highlight-teaser',
        categoryId: 'personal',
        name: 'Engagement Highlight + Teaser',
        duration: '3–5 min + 45–60 sec',
        basePrice: 4500,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.44,
        creatorSharePct: 70,
        description: 'Romantic couple narrative plus social announcement teaser.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser', 'Speech Audio Sync', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'Canon Log 2/3'],
        active: true,
      },
      {
        id: 'engagement-triple',
        categoryId: 'personal',
        name: 'Engagement Triple Bundle',
        duration: '3–5m + 45–60s + 30–60s',
        basePrice: 5500,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.36,
        creatorSharePct: 70,
        description: 'Complete engagement celebration bundle with highlight, teaser, and vertical reel.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser', '30–60s Vertical Reel', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'Canon Log 2/3'],
        active: true,
      },
      {
        id: 'baby-shower-highlight',
        categoryId: 'personal',
        name: 'Baby Shower Highlight',
        duration: '3–5 min',
        basePrice: 3000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.66,
        creatorSharePct: 70,
        description: 'Family speeches, candid games, and celebration montage with soft emotional grading.',
        deliverables: ['3–5 Min Celebration Cut', 'Speech Polish', 'Warm Color Palette', '1 Free Revision Pass'],
        cameraProfiles: ['Warm Rec.709', 'Sony S-Cinetone'],
        active: true,
      },
      {
        id: 'baby-shower-bundle',
        categoryId: 'personal',
        name: 'Baby Shower Triple Bundle',
        duration: '3–5m + 45–60s + 30–60s',
        basePrice: 5000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.4,
        creatorSharePct: 70,
        description: 'Complete baby shower package preserving candid family moments.',
        deliverables: ['3–5 Min Highlight', '45–60s Teaser', '30–60s Social Reel', '1 Free Revision Pass'],
        cameraProfiles: ['Sony S-Log3', 'iPhone 15/16 Pro'],
        active: true,
      },
      {
        id: 'memorial-film',
        categoryId: 'personal',
        name: 'Memorial & Celebration of Life',
        duration: '3–5 min',
        basePrice: 3000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 1.66,
        creatorSharePct: 70,
        description: 'Tender retrospective film preserving family legacy, tributes, and cherished memories.',
        deliverables: ['3–5 Min Retrospective Cut', 'Audio Restoration & Speech Enhancements', '1 Free Revision Pass'],
        cameraProfiles: ['Archival Audio & Video Ingest'],
        active: true,
      },
      {
        id: 'maternity-reel',
        categoryId: 'personal',
        name: 'Maternity Reel Only',
        duration: '30–60 sec',
        basePrice: 1000,
        slaHours: 168,
        standardDelivery: '7–10 working days',
        rushOptions: 'Priority +₹1,000 / Rush +₹2,000',
        rushFee: 2000,
        rushMultiplier: 3.0,
        creatorSharePct: 70,
        description: 'Intimate poetic reel celebrating motherhood with ethereal color grade.',
        deliverables: ['30–60s Vertical Reel', 'Ethereal Tone Curve', 'Gentle Foley Scoring', '1 Free Revision Pass'],
        cameraProfiles: ['Ethereal Rec.709', 'Sony S-Cinetone'],
        active: true,
      },
    ],
  },
];

export const DEFAULT_CAMERA_ANGLES: CameraAngleRule[] = [
  {
    id: 'single',
    label: 'Single Angle',
    camerasCount: '1 Camera / Solo Shooter',
    costWeddingPersonal: 0,
    costBrandCorporate: 0,
    description: 'Master wide or single-cam continuous timeline track. Baseline package inclusion.',
  },
  {
    id: 'dual',
    label: 'Dual Angles',
    camerasCount: '2 Camera Angles Sync',
    costWeddingPersonal: 800,
    costBrandCorporate: 500,
    description: 'A-Cam & B-Cam multicam clip waveform sync with punch-in cuts.',
  },
  {
    id: 'multicam',
    label: 'Multi-Cam / Drone',
    camerasCount: '3+ Camera Angles & Drone',
    costWeddingPersonal: 1600,
    costBrandCorporate: 1000,
    description: '3+ cameras, drone aerials, ceremony multi-mic switching, and synchronized ISO tracks.',
  },
];

export const DEFAULT_DELIVERY_SLAS: DeliverySlaRule[] = [
  {
    id: 'standard',
    label: 'Standard SLA',
    turnaroundDays: '7–10 Working Days',
    hours: 168,
    costWeddingPersonal: 0,
    costBrandCorporate: 0,
    description: 'Full narrative rhythm, dialogue pacing, and verified senior color conform passes.',
  },
  {
    id: 'priority',
    label: 'Priority SLA',
    turnaroundDays: '4–5 Working Days',
    hours: 96,
    costWeddingPersonal: 2000,
    costBrandCorporate: 1000,
    description: 'Jump the queue with expedited studio timeline review and proxy delivery.',
  },
  {
    id: 'rush',
    label: 'Rush 48h SLA',
    turnaroundDays: '48 Hours Express',
    hours: 48,
    costWeddingPersonal: 2000,
    costBrandCorporate: 2000,
    description: 'Same/next-day overnight timeline assembly for urgent launches and social premieres.',
  },
];

export const LIVE_STORAGE_KEY = 'artsy_live_catalog_v3';
export const ANGLES_STORAGE_KEY = 'artsy_live_angles_v3';
export const SLAS_STORAGE_KEY = 'artsy_live_slas_v3';
export const DEPLOYMENT_TIMESTAMP_KEY = 'artsy_catalog_last_deployed_ts';
export const DEPLOYMENT_VERSION_KEY = 'artsy_catalog_version';

/**
 * Loads the active camera angles matrix.
 */
export function loadCameraAngleRules(): CameraAngleRule[] {
  if (typeof window === 'undefined') return DEFAULT_CAMERA_ANGLES;
  try {
    const saved = localStorage.getItem(ANGLES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CAMERA_ANGLES;
}

/**
 * Saves camera angles matrix into localStorage.
 */
export function saveCameraAngleRules(rules: CameraAngleRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANGLES_STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new CustomEvent('artsy_angles_updated', { detail: rules }));
  } catch {}
}

/**
 * Loads the active delivery SLAs matrix.
 */
export function loadDeliverySlaRules(): DeliverySlaRule[] {
  if (typeof window === 'undefined') return DEFAULT_DELIVERY_SLAS;
  try {
    const saved = localStorage.getItem(SLAS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_DELIVERY_SLAS;
}

/**
 * Saves delivery SLAs matrix into localStorage.
 */
export function saveDeliverySlaRules(rules: DeliverySlaRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SLAS_STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new CustomEvent('artsy_slas_updated', { detail: rules }));
  } catch {}
}

/**
 * Loads the active pricing matrix.
 * Priority:
 *  1. localStorage['artsy_live_catalog_v3'] (if available and valid)
 *  2. DEFAULT_PRICING_MATRIX (authentic website seed)
 */
export function loadPricingMatrix(): ServiceCategory[] {
  if (typeof window === 'undefined') return DEFAULT_PRICING_MATRIX;
  try {
    const saved = localStorage.getItem(LIVE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading live catalog matrix:', err);
  }
  return DEFAULT_PRICING_MATRIX;
}

/**
 * Saves staging matrix into localStorage and broadcasts updates across tabs.
 */
export function savePricingMatrix(matrix: ServiceCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify(matrix));
    window.dispatchEvent(new CustomEvent('artsy_pricing_updated', { detail: matrix }));
  } catch (err) {
    console.error('Error saving pricing matrix:', err);
  }
}

/**
 * Deploys the configuration directly into the live website application.
 * Broadcasts 'artsy_catalog_deployed' so all public routes (/services, /book)
 * re-render immediately with the new prices, turnaround SLAs, and products.
 */
export function deployPricingMatrix(
  matrix: ServiceCategory[],
  angles?: CameraAngleRule[],
  slas?: DeliverySlaRule[]
): { version: number; timestamp: string } {
  if (typeof window === 'undefined') {
    return { version: 1, timestamp: new Date().toISOString() };
  }
  try {
    const currentVer = parseInt(localStorage.getItem(DEPLOYMENT_VERSION_KEY) || '1', 10);
    const nextVer = currentVer + 1;
    const nowIso = new Date().toISOString();

    localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify(matrix));
    localStorage.setItem(DEPLOYMENT_VERSION_KEY, nextVer.toString());
    localStorage.setItem(DEPLOYMENT_TIMESTAMP_KEY, nowIso);

    if (angles && Array.isArray(angles)) {
      saveCameraAngleRules(angles);
    }
    if (slas && Array.isArray(slas)) {
      saveDeliverySlaRules(slas);
    }

    // Broadcast across windows and components
    window.dispatchEvent(
      new CustomEvent('artsy_catalog_deployed', {
        detail: { matrix, angles, slas, version: nextVer, timestamp: nowIso },
      })
    );
    window.dispatchEvent(new CustomEvent('artsy_pricing_updated', { detail: matrix }));

    return { version: nextVer, timestamp: nowIso };
  } catch (err) {
    console.error('Error deploying catalog matrix:', err);
    return { version: 1, timestamp: new Date().toISOString() };
  }
}

/**
 * Retrieves the deployment status metadata.
 */
export function getDeploymentStatus(): { version: number; lastDeployed: string | null } {
  if (typeof window === 'undefined') {
    return { version: 1, lastDeployed: null };
  }
  const version = parseInt(localStorage.getItem(DEPLOYMENT_VERSION_KEY) || '1', 10);
  const lastDeployed = localStorage.getItem(DEPLOYMENT_TIMESTAMP_KEY);
  return { version, lastDeployed };
}

/**
 * Resets the pricing matrix back to default studio catalog seed.
 */
export function resetPricingMatrix(): ServiceCategory[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LIVE_STORAGE_KEY);
      localStorage.removeItem(ANGLES_STORAGE_KEY);
      localStorage.removeItem(SLAS_STORAGE_KEY);
      localStorage.removeItem(DEPLOYMENT_VERSION_KEY);
      localStorage.removeItem(DEPLOYMENT_TIMESTAMP_KEY);
      window.dispatchEvent(new CustomEvent('artsy_catalog_deployed', { detail: { matrix: DEFAULT_PRICING_MATRIX } }));
      window.dispatchEvent(new CustomEvent('artsy_pricing_updated', { detail: DEFAULT_PRICING_MATRIX }));
      window.dispatchEvent(new CustomEvent('artsy_angles_updated', { detail: DEFAULT_CAMERA_ANGLES }));
      window.dispatchEvent(new CustomEvent('artsy_slas_updated', { detail: DEFAULT_DELIVERY_SLAS }));
    } catch {}
  }
  return DEFAULT_PRICING_MATRIX;
}

/**
 * Converts a ServiceCategory array into the exact CategoryDetail structure
 * expected by `/services/[category]`.
 */
export function getCategoryDetailMap(matrix: ServiceCategory[]) {
  const map: Record<string, any> = {};
  for (const cat of matrix) {
    map[cat.id] = {
      id: cat.id,
      badge: cat.badge,
      title: `${cat.title} Post-Production`,
      tagline: cat.tagline,
      description: cat.description,
      subCategories: cat.products
        .filter((p) => p.active)
        .map((p) => ({
          id: p.id,
          name: p.name,
          duration: p.duration,
          basePrice: p.basePrice,
          standardDelivery: p.standardDelivery,
          rushOptions: p.rushOptions,
          description: p.description,
          deliverables: p.deliverables,
          popular: p.popular,
        })),
    };
  }
  return map;
}

/**
 * Converts a ServiceCategory array into the list expected by `/services` overview.
 */
export function getServicesOverview(matrix: ServiceCategory[]) {
  return matrix.map((cat) => {
    const activeProducts = cat.products.filter((p) => p.active);
    const lowestPrice = activeProducts.reduce((min, p) => (p.basePrice < min ? p.basePrice : min), 999999);
    const startingRate = lowestPrice < 999999 ? `₹${lowestPrice.toLocaleString('en-IN')}` : '₹1,000';

    return {
      id: cat.id,
      title: cat.title,
      badge: cat.badge,
      startingRate,
      subCount: `${activeProducts.length} Formats`,
      turnaround: cat.turnaround,
      description: cat.description,
      subHighlights: activeProducts.slice(0, 5).map((p) => ({
        label: `${p.name} (₹${p.basePrice.toLocaleString('en-IN')})`,
        subId: p.id,
      })),
      href: `/services/${cat.id}`,
    };
  });
}

/**
 * Converts a ServiceCategory array into the SUB_CATEGORIES dictionary for `/book`.
 */
export function getBookSubCategories(matrix: ServiceCategory[]) {
  const result: Record<string, any[]> = {};
  for (const cat of matrix) {
    result[cat.id] = cat.products
      .filter((p) => p.active)
      .map((p) => ({
        id: p.id,
        label: p.name,
        base: p.basePrice,
        duration: p.duration,
        tag: p.tag,
      }));
  }
  return result;
}

/**
 * Converts a ServiceCategory array into the CATEGORIES list for `/book`.
 */
export function getBookCategories(matrix: ServiceCategory[]) {
  return matrix.map((cat) => {
    const activeProducts = cat.products.filter((p) => p.active);
    const lowestPrice = activeProducts.reduce((min, p) => (p.basePrice < min ? p.basePrice : min), 999999);
    const startingPrice = lowestPrice < 999999 ? `₹${lowestPrice.toLocaleString('en-IN')}` : '₹1,000';
    return {
      key: cat.id,
      title: cat.title,
      startingPrice,
    };
  });
}
