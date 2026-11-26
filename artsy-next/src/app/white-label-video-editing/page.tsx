import type { Metadata } from 'next';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import WhiteLabelSeoClient from './WhiteLabelSeoClient';
import {
  breadcrumbSchema,
  serviceSchema,
  faqPageSchema,
  localBusinessSchema,
} from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'White-Label Video Editing for Photography Studios & Agencies | Artsy Production',
  description:
    'Confidential white-label video post-production for photography studios, production houses, and creative agencies. Strict NDA, unbranded review links, and volume turnaround SLAs.',
  keywords: [
    'white label video editing',
    'outsource video editing for studios',
    'video editing for photographers',
    'white label post production',
    'b2b video editing service',
    'post production agency india',
  ],
  alternates: {
    canonical: '/white-label-video-editing',
  },
  openGraph: {
    title: 'White-Label Video Editing for Photography Studios & Agencies | Artsy Production',
    description:
      'Scale your studio output without full-time payroll. 100% confidential white-label editing under your brand name and strict mutual NDA.',
    url: 'https://artsyproduction.com/white-label-video-editing',
    siteName: 'Artsy Production',
    locale: 'en_US',
    type: 'website',
  },
};

const FAQ_ITEMS = [
  {
    question: 'How does white-label delivery work?',
    answer:
      'We work 100% invisibly in the background. The review player and final download links carry no Artsy branding. Your clients only see your studio logo, typography, and watermarks.',
  },
  {
    question: 'Do we sign a non-disclosure agreement (NDA)?',
    answer:
      'Yes. Every client and agency contract is protected by a legally binding Mutual Non-Disclosure Agreement (NDA). We never post, credit, or publish your client footage without written authorization.',
  },
  {
    question: 'Can you conform to our studio LUTs and custom editing guidelines?',
    answer:
      'Yes. During onboarding, we log your custom DaVinci color LUTs, Premiere Pro/FCP project specs, export bitrates, and storytelling style guides to guarantee seamless brand consistency.',
  },
  {
    question: 'How do you handle high-volume seasonal editing surges?',
    answer:
      'Our studio cluster pairs senior lead editors with dedicated QC supervisors to handle up to 20+ weddings or commercial projects monthly with deterministic turnaround SLAs.',
  },
  {
    question: 'Do you offer monthly volume retainers or per-project billing?',
    answer:
      'We offer both. You can book on-demand per project starting at ₹5,000, or choose our monthly studio volume retainers for discounted per-project rates and dedicated editor priority.',
  },
  {
    question: 'What happens if our studio client requests multiple revision rounds?',
    answer:
      'Every project includes a free revision round. For studio volume retainers, revision turnaround is prioritized within 24 to 48 hours to ensure your delivery deadlines are never missed.',
  },
];

export default function WhiteLabelVideoEditingPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: 'White-Label Video Editing', url: '/white-label-video-editing' },
  ]);

  const serviceData = serviceSchema({
    name: 'White-Label Video Editing Service for Studios',
    description:
      'Confidential white-label post-production for photography studios and agencies under NDA.',
    category: 'Video Editing Agency',
    url: '/white-label-video-editing',
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
        <Navbar />
        <main className="flex-1 w-full max-w-full overflow-x-clip">
          <WhiteLabelSeoClient faqs={FAQ_ITEMS} />
        </main>
        <Footer />
      </div>
    </>
  );
}
