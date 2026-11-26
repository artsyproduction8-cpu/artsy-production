import { createOgImage } from '@/lib/seo/og-card';

export const alt = 'Destination Wedding Video Editing Service in Goa | Artsy Production';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return createOgImage({
    title: 'Destination Wedding Video Editing In Goa',
    subtitle: 'From beachside sunset vows to sundowner celebrations. Coastline drone speed ramps, golden hour color grading, and 7–10 days SLA.',
    badge: 'GOA // DESTINATION WEDDING',
    category: 'Goa Post-Production Studio',
    turnaround: '7–10 Working Days',
    startingPrice: 'From ₹5,000',
    highlightPoints: ['Beach Sunset Color Polish', 'Drone Coastline Speed Ramping', '100% White-Label (NDA)'],
  });
}
