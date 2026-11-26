import type { Metadata } from 'next';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import CityWeddingSeoClient, { CityWeddingSeoConfig } from '../components/marketing/CityWeddingSeoClient';
import {
  breadcrumbSchema,
  serviceSchema,
  faqPageSchema,
  localBusinessSchema,
} from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Destination Wedding Video Editing Service in Goa | Artsy Production',
  description:
    'Destination wedding video editing service for Goa videographers and destination cinematographers. Beachside golden hour color grading, drone speed ramping, and 7–10 days SLA.',
  keywords: [
    'destination wedding video editing goa',
    'wedding video editor goa',
    'beach wedding video editing',
    'outsource wedding editing goa',
    'goa destination wedding film editor',
    'drone wedding editing goa',
  ],
  alternates: {
    canonical: '/wedding-video-editing-goa',
  },
  openGraph: {
    title: 'Destination Wedding Video Editing Service in Goa | Artsy Production',
    description:
      'Beachside luxury destination wedding post-production. Sunset color grading, drone speed ramps, oceanic sound design, and 4K exports in 7–10 days.',
    url: 'https://artsyproduction.com/wedding-video-editing-goa',
    siteName: 'Artsy Production',
    images: [
      {
        url: 'https://artsyproduction.com/wedding-video-editing-goa/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Artsy Production — Destination Wedding Video Editing Goa',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const CITY_CONFIG: CityWeddingSeoConfig = {
  cityKey: 'goa',
  cityName: 'Goa',
  cityShort: 'GOA',
  heroHeading: 'Destination Wedding Video Editing In Goa',
  heroSub:
    'Outsource your destination wedding post-production to a dedicated team of senior editors in Goa. We handle drone stabilization, audio cleanup, and Rec.709 color grading so you deliver films on time without seasonal burnout.',
  faqs: [
    {
      question: 'How do you grade beach weddings with harsh direct sunlight?',
      answer:
        'Midday beach weddings often suffer from extreme dynamic range and washed-out skies. In DaVinci Resolve, we balance harsh highlights, rich ocean blues, and warm natural skin tones.',
    },
    {
      question: 'How do you handle heavy wind noise on beach vows and outdoor audio?',
      answer:
        'We use AI dialogue isolation to remove ocean surf rumble and wind distortion, keeping vows and speeches clear and natural over your soundtrack.',
    },
    {
      question: 'Can you conform both 4K drone sweeps and ground camera clips smoothly?',
      answer:
        'Yes. We stabilize aerial drone footage, color-match drone logs with ground camera profiles, and use smooth speed ramps to keep transitions fluid.',
    },
    {
      question: 'What turnaround options do you offer for destination wedding edits?',
      answer:
        'Standard delivery is 7–10 working days. If the couple needs a fast 48-hour social reel or 5-day priority teaser for an upcoming reception, expedited delivery is available.',
    },
    {
      question: 'Can we send high-bitrate ProRes and RAW clips from our shoots?',
      answer:
        'Yes. We accept all professional codecs: Apple ProRes 422/4444, Sony XAVC, and Canon Log files via Google Drive, Dropbox, or high-speed cloud transfer.',
    },
    {
      question: 'Will our clients know Artsy edited their film?',
      answer:
        'Never. We work 100% white-label under strict NDA. All review player links, project files, and final exports carry zero Artsy branding, protecting your studio identity.',
    },
  ],
};

export default function GoaWeddingVideoEditingPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'Destination Wedding Video Editing Goa', url: '/wedding-video-editing-goa' },
  ]);

  const serviceData = serviceSchema({
    name: 'Destination Wedding Video Editing Service in Goa',
    description:
      'Beachside destination wedding post-production and film editing for Goa cinematographers with 7–10 day delivery.',
    category: 'Wedding Video Editing',
    url: '/wedding-video-editing-goa',
    price: 5000,
    currency: 'INR',
  });

  const faqData = faqPageSchema(CITY_CONFIG.faqs);
  const businessData = localBusinessSchema({
    cityName: 'Goa',
    region: 'Goa',
    areaServed: 'Goa & Western Coastal Destination Wedding Hubs',
    locality: 'Panaji',
    serviceUrl: '/wedding-video-editing-goa',
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessData) }}
      />

      <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white w-full max-w-full overflow-x-clip">
        <Navbar />
        <main className="w-full pt-[60px] sm:pt-16 bg-white min-h-screen max-w-full overflow-x-clip flex flex-col">
          <CityWeddingSeoClient config={CITY_CONFIG} />
        </main>
        <Footer />
      </div>
    </>
  );
}
