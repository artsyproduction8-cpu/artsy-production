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
  title: 'Wedding Video Editing Service in Mumbai | Artsy Production',
  description:
    'Wedding video editing service for Mumbai videographers and photography studios. Multi-cam speech sync, Bollywood sangeet pacing, and Rec.709 color grading in 7–10 days.',
  keywords: [
    'wedding video editing mumbai',
    'wedding video editor mumbai',
    'outsource wedding editing mumbai',
    'wedding cinematographers mumbai',
    'video editing studio mumbai',
    'mumbai wedding film editor',
  ],
  alternates: {
    canonical: '/wedding-video-editing-mumbai',
  },
  openGraph: {
    title: 'Wedding Video Editing Service in Mumbai | Artsy Production',
    description:
      'Professional wedding post-production for Mumbai studios. Multi-cam audio sync, vibrant sangeet pacing, and cinematic 4K exports in 7–10 days.',
    url: 'https://artsyproduction.com/wedding-video-editing-mumbai',
    siteName: 'Artsy Production',
    images: [
      {
        url: 'https://artsyproduction.com/wedding-video-editing-mumbai/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Artsy Production — Wedding Video Editing Mumbai',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const CITY_CONFIG: CityWeddingSeoConfig = {
  cityKey: 'mumbai',
  cityName: 'Mumbai',
  cityShort: 'MUMBAI',
  heroHeading: 'Wedding Video Editing In Mumbai',
  heroSub:
    'Outsource your wedding post-production to a dedicated team of senior editors in Mumbai. We handle multi-cam sync, audio leveling, and Rec.709 color grading so you deliver films on time without seasonal burnout.',
  faqs: [
    {
      question: 'How do you handle multi-camera sangeets and ceremonies?',
      answer:
        'We sync all camera angles using audio waveforms. We cut smoothly between bride, groom, family moments, and dance performances on beat.',
    },
    {
      question: 'How fast can our studio get completed wedding highlights?',
      answer:
        'Our standard delivery is 7–10 working days. If you have an urgent client premiere date, expedited 4–5 day priority delivery is also available.',
    },
    {
      question: 'Can you match our studio’s signature color grading style?',
      answer:
        'Yes. Share your past videos, LUTs, or reference links. We match your style in DaVinci Resolve so skin tones and lighting remain consistent.',
    },
    {
      question: 'Will our clients know Artsy edited their wedding film?',
      answer:
        'Never. We work 100% white-label under a strict Non-Disclosure Agreement (NDA). All review links and final deliverables are unbranded.',
    },
    {
      question: 'How do we send raw wedding footage from Mumbai?',
      answer:
        'You can share Google Drive, Dropbox, OneDrive, or cloud storage links. Our high-speed cloud servers make file transfer quick and easy.',
    },
    {
      question: 'Do you offer revisions if the couple wants changes?',
      answer:
        'Yes. Every project includes a free revision round. You can share timestamped notes and our editors will adjust the cut promptly.',
    },
  ],
};

export default function MumbaiWeddingVideoEditingPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'Wedding Video Editing Mumbai', url: '/wedding-video-editing-mumbai' },
  ]);

  const serviceData = serviceSchema({
    name: 'Wedding Video Editing Service in Mumbai',
    description:
      'Professional post-production and wedding video editing for Mumbai videographers with 7–10 day delivery.',
    category: 'Wedding Video Editing',
    url: '/wedding-video-editing-mumbai',
    price: 5000,
    currency: 'INR',
  });

  const faqData = faqPageSchema(CITY_CONFIG.faqs);
  const businessData = localBusinessSchema({
    cityName: 'Mumbai',
    region: 'Maharashtra',
    areaServed: 'Mumbai Metropolitan Region',
    locality: 'Mumbai',
    serviceUrl: '/wedding-video-editing-mumbai',
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
