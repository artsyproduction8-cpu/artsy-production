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
  title: 'Wedding Video Editing Service in Delhi NCR | Artsy Production',
  description:
    'Wedding video editing service for Delhi NCR cinematographers and studios. Grand farmhouse wedding multi-cam editing, night pheras color grading, and 7–10 days SLA.',
  keywords: [
    'wedding video editing delhi',
    'wedding video editor delhi ncr',
    'wedding film editor chattarpur gurgaon',
    'outsource wedding editing delhi',
    'wedding video editor noida',
    'delhi wedding post production',
  ],
  alternates: {
    canonical: '/wedding-video-editing-delhi',
  },
  openGraph: {
    title: 'Wedding Video Editing Service in Delhi NCR | Artsy Production',
    description:
      'Grand royal wedding post-production for Delhi NCR studios. Multi-cam farmhouse celebrations, rich night color grading, and 4K exports in 7–10 days.',
    url: 'https://artsyproduction.com/wedding-video-editing-delhi',
    siteName: 'Artsy Production',
    images: [
      {
        url: 'https://artsyproduction.com/wedding-video-editing-delhi/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Artsy Production — Wedding Video Editing Delhi NCR',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const CITY_CONFIG: CityWeddingSeoConfig = {
  cityKey: 'delhi',
  cityName: 'Delhi NCR',
  cityShort: 'DELHI NCR',
  heroHeading: 'Wedding Video Editing In Delhi NCR',
  heroSub:
    'Outsource your wedding post-production to a dedicated team of senior editors in Delhi NCR. We handle multi-cam sync, audio leveling, and Rec.709 color grading so you deliver films on time without seasonal burnout.',
  faqs: [
    {
      question: 'How do you edit 3 to 4 camera angles from big weddings?',
      answer:
        'We synchronize all camera angles using waveform audio alignment. We cut smoothly between bride, groom, family moments, and wide venue shots without missing key rituals.',
    },
    {
      question: 'Can you handle night pheras with challenging artificial lighting?',
      answer:
        'Yes. Night ceremonies often suffer from mixed halogen and LED lighting. In DaVinci Resolve, we balance skin tones naturally and restore crisp shadow details.',
    },
    {
      question: 'How fast can our studio deliver wedding films during peak season?',
      answer:
        'Our standard turnaround is 7–10 working days. For urgent dates during peak wedding season, expedited 4–5 day priority delivery is also available.',
    },
    {
      question: 'Do you create both full wedding highlight films and Instagram reels?',
      answer:
        'Yes. Our packages include full 16:9 cinematic highlights, 60-second teasers, and vertical 9:16 reels optimized for Instagram and mobile sharing.',
    },
    {
      question: 'Can you edit longform documentary ceremonies along with highlights?',
      answer:
        'Yes. Our Master Archival Package includes full-length ceremony cuts covering all rituals and vows chronologically with clean audio polishing.',
    },
    {
      question: 'Are our clients and footage protected under NDA?',
      answer:
        '100%. We sign a legally binding Non-Disclosure Agreement (NDA). We work completely invisibly as your back-office editorial department—your clients never see Artsy branding.',
    },
  ],
};

export default function DelhiWeddingVideoEditingPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'Wedding Video Editing Delhi NCR', url: '/wedding-video-editing-delhi' },
  ]);

  const serviceData = serviceSchema({
    name: 'Wedding Video Editing Service in Delhi NCR',
    description:
      'Grand wedding post-production and film editing for Delhi NCR videographers with 7–10 day delivery.',
    category: 'Wedding Video Editing',
    url: '/wedding-video-editing-delhi',
    price: 5000,
    currency: 'INR',
  });

  const faqData = faqPageSchema(CITY_CONFIG.faqs);
  const businessData = localBusinessSchema({
    cityName: 'Delhi NCR',
    region: 'Delhi',
    areaServed: 'Delhi National Capital Region, Gurgaon, Noida',
    locality: 'New Delhi',
    serviceUrl: '/wedding-video-editing-delhi',
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
