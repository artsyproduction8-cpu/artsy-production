import { createOgImage } from '@/lib/seo/og-card';

export const alt = 'White-Label Video Editing for Studios & Agencies | Artsy Production';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return createOgImage({
    title: 'White-Label Video Editing For Studios & Agencies',
    subtitle: 'Outsource your seasonal post-production under strict NDA. Dedicated senior editors, unbranded review links, and monthly volume retainers.',
    badge: 'B2B STUDIO PARTNER // STRICT NDA',
    category: 'Agency White-Label Service',
    turnaround: '5–7 Days / Priority Retainers',
    startingPrice: 'From ₹5,000 / Retainers ₹22.5k',
    highlightPoints: ['100% White-Label', 'Strict Mutual NDA', 'Dedicated Lead Editor'],
  });
}
