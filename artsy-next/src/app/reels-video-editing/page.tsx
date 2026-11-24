import type { Metadata } from 'next';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import ReelsSeoClient from './ReelsSeoClient';
import {
  breadcrumbSchema,
  serviceSchema,
  faqPageSchema,
  localBusinessSchema,
} from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Instagram Reels & Social Video Editing Service | Artsy Production',
  description:
    'Fast 48-hour Instagram Reels, YouTube Shorts, and TikTok video editing service for creators, brands, and videographers. Rhythmic audio cuts and viral hooks.',
  keywords: [
    'instagram reels video editing',
    'reels editing service',
    'tiktok video editor',
    'youtube shorts editing service',
    'vertical video editing',
    'wedding reels editor',
    'social media video editing service',
  ],
  alternates: {
    canonical: '/reels-video-editing',
  },
  openGraph: {
    title: 'Instagram Reels & Social Video Editing Service | Artsy Production',
    description:
      'High-retention 9:16 vertical cuts conformed to music rhythm, motion hooks, sound design, and color grading in 48 hours.',
    url: 'https://artsyproduction.com/reels-video-editing',
    siteName: 'Artsy Production',
    images: [
      {
        url: 'https://artsyproduction.com/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Artsy Production — Instagram Reels Video Editing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const FAQ_ITEMS = [
  {
    question: 'How fast do you deliver completed reels?',
    answer:
      'Standard turnaround for individual reels is 48 hours. If you have urgent rush deadlines or live event turnarounds, same-day delivery is also available upon request.',
  },
  {
    question: 'Can you edit both wedding reels and brand/product reels?',
    answer:
      'Yes. Our team specializes in emotional couple portraits, high-energy party and haldi reels, as well as brand promotional reels with speed ramps and sound design.',
  },
  {
    question: 'What video aspect ratios and formats do you deliver?',
    answer:
      'All reels are exported in native vertical 9:16 (1080x1920) optimized for Instagram, TikTok, and YouTube Shorts. We can also provide a 1:1 or 4:5 crop on request.',
  },
  {
    question: 'Can I provide trending audio or songs?',
    answer:
      'Absolutely. You can share an Instagram audio link, MP3, or specific song name. We synchronize the video cuts strictly to the rhythm and beat drops of your track.',
  },
  {
    question: 'Do you add captions, subtitles, and motion graphics?',
    answer:
      'Yes. Dynamic animated captions, kinetic text hooks, and custom font styles matching your brand are supported across all bundle packages.',
  },
  {
    question: 'How do revision requests work?',
    answer:
      'Every reel includes a free revision pass. You can watch your draft on our review link, leave timecoded feedback, and we will update your cut within 24 hours.',
  },
];

export default function ReelsVideoEditingPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'Reels Video Editing', url: '/reels-video-editing' },
  ]);

  const serviceData = serviceSchema({
    name: 'Instagram Reels & Social Video Editing Service',
    description:
      'High-retention vertical 9:16 video editing for Instagram, YouTube Shorts, and TikTok with 48h turnaround.',
    category: 'Social Media Video Editing',
    url: '/reels-video-editing',
    price: 2000,
    currency: 'INR',
  });

  const faqData = faqPageSchema(FAQ_ITEMS);
  const businessData = localBusinessSchema();

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
        <main className="flex-1 w-full max-w-full overflow-x-clip">
          <ReelsSeoClient faqs={FAQ_ITEMS} />
        </main>
        <Footer />
      </div>
    </>
  );
}
