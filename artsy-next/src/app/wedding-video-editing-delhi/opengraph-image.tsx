import { createOgImage } from '@/lib/seo/og-card';

export const alt = 'Wedding Video Editing Service in Delhi NCR | Artsy Production';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return createOgImage({
    title: 'Wedding Video Editing In Delhi NCR For Studios',
    subtitle: 'From Chattarpur grand farmhouses to royal palace weddings. Multi-cam sync, night phera color balancing, and 7–10 days SLA.',
    badge: 'DELHI NCR // ROYAL WEDDINGS',
    category: 'Delhi Post-Production Studio',
    turnaround: '7–10 Working Days',
    startingPrice: 'From ₹5,000',
    highlightPoints: ['Multi-Cam Farmhouse Sync', 'Night Lighting Color Polish', '100% White-Label (NDA)'],
  });
}
