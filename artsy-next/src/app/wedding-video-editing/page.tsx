import type { Metadata } from 'next';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import WeddingSeoClient from './WeddingSeoClient';
import {
  breadcrumbSchema,
  serviceSchema,
  faqPageSchema,
  localBusinessSchema,
} from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Wedding Video Editing Service for Videographers | Artsy Production',
  description:
    'Wedding video editing service for photographers and videographers. We sync your audio, balance your colors, and deliver your wedding films on time in 7–10 working days.',
  keywords: [
    'wedding video editing service',
    'outsource wedding video editing',
    'wedding film editor',
    'wedding video editor india',
    'wedding highlight editor',
  ],
  alternates: {
    canonical: '/wedding-video-editing',
  },
  openGraph: {
    title: 'Wedding Video Editing Service for Videographers | Artsy Production',
    description:
      'Send us your raw footage. We sync your audio, balance your colors, and deliver your wedding films on time in 7–10 working days.',
    url: 'https://artsyproduction.com/wedding-video-editing',
    siteName: 'Artsy Production',
    locale: 'en_US',
    type: 'website',
  },
};

const FAQ_ITEMS = [
  {
    question: 'How do I send my raw footage?',
    answer:
      'You can share a Google Drive, Dropbox, or OneDrive link with your files. We accept footage from any camera (Sony, Canon, Panasonic, Blackmagic, etc.).',
  },
  {
    question: 'Can I choose the music for the video?',
    answer:
      'Yes. You can send the exact songs you want us to use. If you do not have music, we can select good copyright-free songs that fit the wedding.',
  },
  {
    question: 'Can you match my color and editing style?',
    answer:
      'Yes. If you have past videos, LUTs, or examples of how you like your videos to look, just share them with us and we will follow your style.',
  },
  {
    question: 'Will my clients know Artsy edited the video?',
    answer:
      'No. We work 100% white-label in the background. Your clients will only see your studio name, and all final files belong to you.',
  },
  {
    question: 'How do revisions work if I need changes?',
    answer:
      'Every project includes a free revision. You watch the draft, tell us what you want to change (like swapping a clip or adjusting music), and we update it quickly.',
  },
  {
    question: 'What if I only have camera audio and no drone footage?',
    answer:
      'That is completely fine. We only edit what you provide. We will clean your camera audio as much as possible and make your footage look clean and natural.',
  },
];

export default function WeddingVideoEditingPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'Wedding Video Editing', url: '/wedding-video-editing' },
  ]);

  const serviceData = serviceSchema({
    name: 'Wedding Video Editing Service',
    description:
      'Wedding video editing service for photographers and videographers with 7-10 day delivery and color balancing.',
    category: 'Wedding Video Editing',
    url: '/wedding-video-editing',
    price: 5000,
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
        {/* 00. Top Navigation */}
        <Navbar />

        <main className="w-full pt-[60px] sm:pt-16 bg-white min-h-screen max-w-full overflow-x-clip flex flex-col">
          <WeddingSeoClient faqs={FAQ_ITEMS} />
        </main>

        {/* 06. Studio Footer */}
        <Footer />
      </div>
    </>
  );
}
