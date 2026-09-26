'use client';

import Link from 'next/link';

interface ServiceCategoryCardProps {
  title: string;
  description: string;
  category: string; // e.g., 'wedding', 'brand_ugc', 'store_product', 'corporate_event'
  icon: string; // emoji or SVG icon
  basePrice: number; // in INR
  deliverables: string[];
}

export default function ServiceCategoryCard({
  title,
  description,
  category,
  icon,
  basePrice,
  deliverables,
}: ServiceCategoryCardProps) {
  const categoryToPath = {
    wedding: 'wedding-films',
    brand_ugc: 'brand-ugc-reels',
    store_product: 'store-product-reels',
    corporate_event: 'corporate-event-videos',
  }[category] || category;

  return (
    <Link
      href={`/services/${categoryToPath}`}
      className="group block hover:shadow-lg transition-shadow duration-300"
    >
      <article
        className="relative flex h-[280px] w-full border border-[--border-default] rounded-[--radius-lg] overflow-hidden bg-[--bg-card] transition-all duration-300 hover:bg-[--bg-card]/95"
      >
        {/* Icon */}
        <div className="flex h-[60px] w-[60px] items-center justify-center bg-[--accent-blue]/10 rounded-[--radius-md] mb-4">
          <span className="text-[--text-headline] text-2xl">{icon}</span>
        </div>

        {/* Title */}
        <h3 className="text-[--text-headline] font-bold mb-2 px-4">
          {title}
        </h3>

        {/* Description */}
        <p className="text-[--text-body] text-[--text-muted] flex-1 px-4 pb-4">
          {description}
        </p>

        {/* Price and Deliverables */}
        <div className="px-4 pb-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-[--text-accent-blue] font-bold text-[--text-lg]">
              ₹{basePrice.toLocaleString()}
            </span>
            <span className="text-[--text-muted] text-[--text-sm]">
              starting price
            </span>
          </div>
          <div className="text-[--text-sm] text-[--text-muted]">
            <strong>Deliverables:</strong> {deliverables.join(', ')}
          </div>
        </div>
      </article>
    </Link>
  );
}