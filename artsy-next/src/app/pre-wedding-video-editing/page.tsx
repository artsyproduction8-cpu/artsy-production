import type { Metadata } from 'next';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import PreWeddingSeoClient from './PreWeddingSeoClient';
import {
  breadcrumbSchema,
  serviceSchema,
  faqPageSchema,
  localBusinessSchema,
} from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Pre-Wedding & Love Story Video Editing Service | Artsy Production',
  description:
    'Cinematic pre-wedding film and love story video editing service for photographers and videographers. Mountain, coastal, and destination drone footage pacing in 5 days.',
  keywords: [
    'pre wedding video editing',
    'pre wedding film editor',
    'destination pre wedding editing',
    'love story video editing',
    'save the date video editor',
    'wedding videography post production',
  ],
  alternates: {
    canonical: '/pre-wedding-video-editing',
  },
  openGraph: {
    title: 'Pre-Wedding & Love Story Video Editing Service | Artsy Production',
    description:
      'Turn destination drone shots and couple footage into emotional, cinematic love stories with Rec.709 color science and speed-ramp pacing.',
    url: 'https://artsyproduction.com/pre-wedding-video-editing',
    siteName: 'Artsy Production',
    images: [
      {
        url: 'https://artsyproduction.com/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Artsy Production — Pre-Wedding Video Editing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const FAQ_ITEMS = [
  {
    question: 'What types of pre-wedding footage can I send?',
    answer:
      'We work with all camera profiles including Sony S-Log3, Canon Log 2/3, Panasonic V-Log, Apple ProRes Log, and DJI drone D-Log/Cinelike footage.',
  },
  {
    question: 'Can you edit both 16:9 widescreen films and vertical reels?',
    answer:
      'Yes. Our packages offer options for full 16:9 narrative story films as well as 9:16 vertical cuts formatted specifically for Instagram Reels and social teasers.',
  },
  {
    question: 'How do you handle audio if the shoot had high wind noise?',
    answer:
      'We isolate vocals using AI speech clarity tools, remove wind and rumble, and layer subtle ambient Foley effects (like ocean waves, rustling leaves, or breeze) under licensed music.',
  },
  {
    question: 'What is the standard turnaround time for pre-wedding edits?',
    answer:
      'Standard turnaround is 5 working days from footage ingest. Express 48-hour rush delivery is also available if your couple needs their film immediately for their invitations.',
  },
  {
    question: 'Do you provide color grading for destination and sunset shoots?',
    answer:
      'Yes. Every edit includes custom DaVinci Wide Gamut color balancing with natural filmic skin tones, rich golden hour highlights, and balanced landscape greens.',
  },
  {
    question: 'How many revisions are included?',
    answer:
      'Every package includes a complimentary revision round. You can leave notes directly on the review draft and your editor will adjust pacing, music timing, or clip selections.',
  },
];

export default function PreWeddingVideoEditingPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'Pre-Wedding Video Editing', url: '/pre-wedding-video-editing' },
  ]);

  const serviceData = serviceSchema({
    name: 'Pre-Wedding Video Editing Service',
    description:
      'Cinematic love story and destination pre-wedding film post-production with 5-day delivery and color grading.',
    category: 'Wedding Video Editing',
    url: '/pre-wedding-video-editing',
    price: 3000,
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
          <PreWeddingSeoClient faqs={FAQ_ITEMS} />
        </main>
        <Footer />
      </div>
    </>
  );
}
