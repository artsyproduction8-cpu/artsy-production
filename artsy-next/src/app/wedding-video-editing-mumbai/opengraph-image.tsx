import { createOgImage } from '@/lib/seo/og-card';

export const alt = 'Wedding Video Editing Service in Mumbai | Artsy Production';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return createOgImage({
    title: 'Wedding Video Editing In Mumbai For Studios',
    subtitle: 'From Bollywood sangeets to South Bombay luxury weddings. Multi-cam audio sync, DaVinci color grading, and 7–10 days SLA.',
    badge: 'MUMBAI // WEDDING CINEMA',
    category: 'Mumbai Post-Production Studio',
    turnaround: '7–10 Working Days',
    startingPrice: 'From ₹5,000',
    highlightPoints: ['Multi-Cam Waveform Sync', 'Bollywood Sangeet Pacing', '100% White-Label (NDA)'],
  });
}
