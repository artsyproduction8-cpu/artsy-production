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
  title: 'Wedding Video Editing Service in Bangalore | Artsy Production',
  description:
    'Wedding video editing service for Bangalore cinematographers and studios. Palace grounds, traditional South Indian rituals, aesthetic contemporary cuts, and 7–10 days SLA.',
  keywords: [
    'wedding video editing bangalore',
    'wedding video editor bengaluru',
    'outsource wedding editing bangalore',
    'south indian wedding video editor',
    'bengaluru wedding film editor',
    'wedding video post production bangalore',
  ],
  alternates: {
    canonical: '/wedding-video-editing-bangalore',
  },
  openGraph: {
    title: 'Wedding Video Editing Service in Bangalore | Artsy Production',
    description:
      'Aesthetic wedding post-production for Bangalore studios. Traditional South Indian Muhurtham, contemporary couple narratives, and 4K masters in 7–10 days.',
    url: 'https://artsyproduction.com/wedding-video-editing-bangalore',
    siteName: 'Artsy Production',
    images: [
      {
        url: 'https://artsyproduction.com/wedding-video-editing-bangalore/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Artsy Production — Wedding Video Editing Bangalore',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const CITY_CONFIG: CityWeddingSeoConfig = {
  cityKey: 'bangalore',
  cityName: 'Bangalore',
  cityShort: 'BENGALURU',
  heroHeading: 'Wedding Video Editing In Bangalore',
  heroSub:
    'Outsource your wedding post-production to a dedicated team of senior editors in Bangalore. We handle multi-cam sync, audio leveling, and Rec.709 color grading so you deliver films on time without seasonal burnout.',
  faqs: [
    {
      question: 'How do you grade traditional wedding colors and silk sarees?',
      answer:
        'We take special care with silk fabric tones, jewelry golds, and natural floral colors. In DaVinci Resolve, we preserve rich colors and natural skin tones without digital over-saturation.',
    },
    {
      question: 'Can you edit both traditional acoustic instruments and modern songs?',
      answer:
        'Yes. We sync live instrumental recordings seamlessly with emotional vows, speech tracks, and contemporary wedding soundtracks.',
    },
    {
      question: 'What is the standard delivery timeline for wedding projects?',
      answer:
        'Standard delivery is 7–10 working days from footage receipt. We also provide express 4–5 day priority slots for photographers needing quick previews for couple social sharing.',
    },
    {
      question: 'Do you create wedding Instagram Reels formatted for mobile?',
      answer:
        'Yes. All our multi-format packages include 9:16 vertical cuts formatted specifically for high-retention Instagram Reels with beat-matched cut points.',
    },
    {
      question: 'Can we share our own custom LUTs and style guidelines?',
      answer:
        'Yes. We log your studio profile, custom DaVinci PowerGrades, and project presets so every project conforms seamlessly to your brand aesthetic.',
    },
    {
      question: 'How does revision feedback work for our studio?',
      answer:
        'Every project includes a free revision pass. You review your cut on our timecoded player, leave specific timestamped notes, and your lead editor makes adjustments promptly.',
    },
  ],
};

export default function BangaloreWeddingVideoEditingPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'Wedding Video Editing Bangalore', url: '/wedding-video-editing-bangalore' },
  ]);

  const serviceData = serviceSchema({
    name: 'Wedding Video Editing Service in Bangalore',
    description:
      'Aesthetic wedding post-production and editing service for Bangalore cinematographers with 7–10 day delivery.',
    category: 'Wedding Video Editing',
    url: '/wedding-video-editing-bangalore',
    price: 5000,
    currency: 'INR',
  });

  const faqData = faqPageSchema(CITY_CONFIG.faqs);
  const businessData = localBusinessSchema({
    cityName: 'Bangalore',
    region: 'Karnataka',
    areaServed: 'Bengaluru Urban & Karnataka',
    locality: 'Bengaluru',
    serviceUrl: '/wedding-video-editing-bangalore',
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
