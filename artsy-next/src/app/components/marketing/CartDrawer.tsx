'use client';

import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: Record<string, number>;
  rushDelivery: boolean;
  onRushToggle: (checked: boolean) => void;
  cartItems: Array<[string, number]>;
  calculateTotals: () => {
    totalItems: number;
    subtotal: number;
    totalMrp: number;
    rushFee: number;
    savings: number;
    grandTotal: number;
  };
  onIncreaseQty?: (id: string) => void;
  onDecreaseQty?: (id: string) => void;
}

const SERVICES_DATA: Record<string, { title: string; price: number; thumb: string }> = {
  'talking-head-reel': { title: 'Engaging Talking-Head Reel', price: 29, thumb: '/images/portfolio-brand-1.jpg' },
  'wedding-teaser': { title: 'Cinematic Wedding Teaser (60s)', price: 49, thumb: '/images/portfolio-wedding-1.jpg' },
  'ugc-ad-creative': { title: 'UGC Ad Creative (Hook & Callouts)', price: 31, thumb: '/images/portfolio-brand-2.jpg' },
  'product-showcase': { title: 'Product Showcase 3D Cutaway Reel', price: 59, thumb: '/images/portfolio-product-1.jpg' },
  'retention-reel': { title: 'Advanced Retention Viral Reel', price: 47, thumb: '/images/portfolio-brand-1.jpg' },
  'corporate-keynote': { title: 'Corporate Keynote & Summit Recap', price: 89, thumb: '/images/portfolio-corporate-1.jpg' },
  'wedding-documentary': { title: 'Grand Wedding Full Documentary (15-30m)', price: 199, thumb: '/images/portfolio-wedding-2.jpg' },
  'davinci-color': { title: 'DaVinci 4K HDR Color Grade & Foley', price: 39, thumb: '/images/portfolio-product-1.jpg' }
};

export default function CartDrawer({
  open,
  onClose,
  cart,
  rushDelivery,
  onRushToggle,
  cartItems,
  calculateTotals,
  onIncreaseQty,
  onDecreaseQty
}: CartDrawerProps) {
  const router = useRouter();
  const { totalItems, subtotal, savings, grandTotal } = calculateTotals();

  const handleCheckout = () => {
    if (totalItems === 0) {
      alert('Please add at least one edit package before checking out!');
      return;
    }
    onClose();
    router.push('/book/checkout');
  };

  return (
    <>
      {/* Dark overlay with smooth blur fade */}
      <div
        className={`cart-drawer-overlay ${open ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Slide-over panel */}
      <aside
        className={`cart-drawer ${open ? 'active' : ''}`}
        aria-label="Shopping Cart Drawer"
        aria-hidden={!open}
      >
        <div className="cart-drawer-header">
          <h3 className="cart-drawer-title">
            Your Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h3>
          <button
            type="button"
            className="btn-drawer-close"
            onClick={onClose}
            aria-label="Close cart"
          >
            &times;
          </button>
        </div>

        <div className="cart-drawer-body">
          {/* Items Container */}
          <div className="cart-items-list">
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13.5px', margin: '40px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🛒</div>
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Your cart is empty</div>
                <p>Select any video edit service to customize and checkout in seconds!</p>
              </div>
            ) : (
              cartItems.map(([id, qty]) => {
                const item = SERVICES_DATA[id];
                if (!item) return null;

                return (
                  <div key={id} className="cart-item-row">
                    <img
                      src={item.thumb}
                      alt={item.title}
                      className="cart-item-thumb"
                    />
                    <div className="cart-item-details">
                      <div className="cart-item-title">{item.title}</div>
                      <div className="cart-item-price">${item.price * qty} <span style={{ fontSize: '11px', color: '#737373', fontWeight: 400 }}>(${item.price} each)</span></div>
                    </div>
                    <div className="qty-stepper-box active" style={{ display: 'flex' }}>
                      <button
                        type="button"
                        onClick={() => onDecreaseQty && onDecreaseQty(id)}
                        className="qty-btn"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="qty-val">{qty}</span>
                      <button
                        type="button"
                        onClick={() => onIncreaseQty && onIncreaseQty(id)}
                        className="qty-btn"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Raw Footage Link Input */}
          <div className="drawer-input-group">
            <label className="drawer-label" htmlFor="drawer-footage-url">
              Raw Footage Cloud Link (Google Drive / Dropbox)
            </label>
            <input
              type="url"
              id="drawer-footage-url"
              className="drawer-input"
              placeholder="https://drive.google.com/drive/folders/..."
            />
          </div>

          {/* Express Speed Option */}
          <div style={{
            background: 'var(--color-bg-subtle)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>⚡ 12-Hour Priority Rush</div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>Skip queue, instant editor assignment</div>
            </div>
            <input
              type="checkbox"
              id="rush-toggle-drawer"
              checked={rushDelivery}
              onChange={(e) => onRushToggle(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
          </div>

          {/* Bill Summary */}
          <div className="cart-bill-box">
            <div className="bill-row">
              <span>Items Subtotal</span>
              <span>${subtotal}</span>
            </div>
            <div className="bill-row" style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>
              <span>Instant Promo Savings</span>
              <span>-${savings}</span>
            </div>
            <div className="bill-row">
              <span>Platform & QA Inspection Fee</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>FREE ($0)</span>
            </div>
            {rushDelivery && (
              <div className="bill-row" style={{ color: '#D97706', fontWeight: 600 }}>
                <span>12-Hour Priority Rush</span>
                <span>+$15</span>
              </div>
            )}
            <div className="bill-row grand-total">
              <span>To Pay</span>
              <span style={{ color: 'var(--color-primary-dark)', fontSize: '18px' }}>${grandTotal}</span>
            </div>
          </div>
        </div>

        <div className="cart-drawer-footer">
          <button
            type="button"
            className="btn-instant-order"
            onClick={handleCheckout}
            disabled={totalItems === 0}
            style={{ opacity: totalItems === 0 ? 0.6 : 1, cursor: totalItems === 0 ? 'not-allowed' : 'pointer' }}
          >
            <span>Book & Pay in Seconds</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}