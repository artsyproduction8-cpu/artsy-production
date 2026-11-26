import { createOgImage } from '@/lib/seo/og-card';

export const alt = 'Instagram Reels & Social Video Editing Service | Artsy Production';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return createOgImage({
    title: 'Instagram Reels & Short-Form Video Editing',
    subtitle: 'High-impact 9:16 vertical video edits conformed to trending audio beats, kinetic typography hooks, and rapid delivery.',
    badge: 'REELS & TIKTOK // 9:16',
    category: 'Social Media Video Editing',
    turnaround: '48h Per Reel (Scaled for Bundles)',
    startingPrice: 'From ₹1,500',
    highlightPoints: ['Beat Drop Sync', 'Kinetic Title Hooks', 'Full HD Mobile Master'],
  });
}
