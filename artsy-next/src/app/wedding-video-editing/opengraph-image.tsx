import { createOgImage } from '@/lib/seo/og-card';

export const alt = 'Wedding Video Editing Service | Artsy Production';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return createOgImage({
    title: 'Wedding Video Editing For Videographers & Studios',
    subtitle: 'Send us your raw footage. Multi-cam audio sync, Rec.709 color grade, and delivered in 7–10 working days.',
    badge: 'WEDDING CINEMA // 24FPS',
    category: 'Post-Production Studio Service',
    turnaround: '7–10 Working Days',
    startingPrice: 'From ₹5,000',
    highlightPoints: ['Multi-Cam Sync', 'Rec.709 Film LUT Grade', '100% White-Label (NDA)'],
  });
}
