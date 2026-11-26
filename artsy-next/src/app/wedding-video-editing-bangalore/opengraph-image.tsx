import { createOgImage } from '@/lib/seo/og-card';

export const alt = 'Wedding Video Editing Service in Bangalore | Artsy Production';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return createOgImage({
    title: 'Wedding Video Editing In Bangalore For Studios',
    subtitle: 'From Palace Grounds celebrations to heritage temple Muhurthams. Natural skin tones, acoustic audio balance, and 7–10 days SLA.',
    badge: 'BANGALORE // AESTHETIC CINEMA',
    category: 'Bengaluru Post-Production Studio',
    turnaround: '7–10 Working Days',
    startingPrice: 'From ₹5,000',
    highlightPoints: ['Traditional Muhurtham Audio Sync', 'Silk & Gold Zari Color Polish', '100% White-Label (NDA)'],
  });
}
