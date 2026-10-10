'use client';

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    price: number;
    mrp: number;
    delivery: string;
    thumb: string;
    cat: string;
  };
  onAddToCart: (serviceId: string) => void;
  onIncreaseQty: (serviceId: string) => void;
  onDecreaseQty: (serviceId: string) => void;
  onPreviewMedia: (src: string) => void;
  cart: Record<string, number>;
}

export default function ServiceCard({
  service,
  onAddToCart,
  onIncreaseQty,
  onDecreaseQty,
  onPreviewMedia,
  cart
}: ServiceCardProps) {
  const quantity = cart[service.id] || 0;
  const discountPercent = Math.round(((service.mrp - service.price) / service.mrp) * 100);

  return (
    <article className="unjob-service-card">
      {/* Top Ribbon Sale Badge */}
      <span className="ribbon-sale-badge">
        <span className="coupon-shine"></span>
        5k+ sold
      </span>

      {/* 16:9 Thumbnail with Play Button on Hover */}
      <div
        className="service-thumb-wrap"
        onClick={() => onPreviewMedia(service.thumb)}
        role="button"
        tabIndex={0}
        aria-label={`Preview ${service.title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={service.thumb}
          alt={service.title}
          loading="lazy"
        />
        <div className="service-play-hover">
          <span className="play-circle-small">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </span>
        </div>
      </div>

      {/* Delivery Pill & Add / Quantity Stepper */}
      <div className="service-meta-action-row">
        <span className="delivery-pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{service.delivery}</span>
        </span>

        {quantity === 0 ? (
          <button
            type="button"
            className="btn-unjob-add"
            onClick={() => onAddToCart(service.id)}
            aria-label={`Add ${service.title} to cart`}
          >
            Add
          </button>
        ) : (
          <div className="qty-stepper-box active">
            <button
              type="button"
              className="qty-btn"
              onClick={() => onDecreaseQty(service.id)}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="qty-val">{quantity}</span>
            <button
              type="button"
              className="qty-btn"
              onClick={() => onIncreaseQty(service.id)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Subtle Divider */}
      <div className="card-divider"></div>

      {/* Info Block: Title, Jagged Ticket Price, MRP & Rating */}
      <div className="service-info-block">
        <h3 className="service-card-title" title={service.title}>
          {service.title}
        </h3>

        <div className="price-row">
          <span className="coupon-price-badge">
            <span className="coupon-ticket-left"></span>
            <span className="coupon-ticket-center">${service.price}</span>
            <span className="coupon-ticket-right"></span>
          </span>
          <span className="mrp-crossed">${service.mrp}</span>
        </div>

        <span className="discount-text">{discountPercent}% OFF on MRP</span>

        <div className="rating-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#FBBF24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>4.9 (1.2k)</span>
        </div>
      </div>
    </article>
  );
}