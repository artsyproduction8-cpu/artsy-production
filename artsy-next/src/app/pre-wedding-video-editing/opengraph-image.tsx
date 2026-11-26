import { createOgImage } from '@/lib/seo/og-card';

export const alt = 'Pre-Wedding & Love Story Video Editing | Artsy Production';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return createOgImage({
    title: 'Pre-Wedding & Love Story Video Editing Service',
    subtitle: 'Turn destination couple shoots into cinematic films. Drone stabilization, golden hour color grading, and ambient Foley sound design.',
    badge: 'DESTINATION ROMANCE // 24FPS',
    category: 'Couple Film Post-Production',
    turnaround: '5 Working Days (10d Suites)',
    startingPrice: 'From ₹2,000',
    highlightPoints: ['Drone Speed Ramping', 'Acoustic Foley Design', '4K ProRes Master'],
  });
}
