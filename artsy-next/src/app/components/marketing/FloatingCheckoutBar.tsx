'use client';

interface FloatingCheckoutBarProps {
  active: boolean;
  totalItems: number;
  grandTotal: number;
  onOpenCart: () => void;
  rushDelivery?: boolean;
  onRushToggle?: (checked: boolean) => void;
}

export default function FloatingCheckoutBar({
  active,
  totalItems,
  grandTotal,
  onOpenCart
}: FloatingCheckoutBarProps) {
  if (!active || totalItems === 0) {
    return null;
  }

  return (
    <div
      className="floating-checkout-bar animate-bounce-subtle"
      style={{
        display: 'flex',
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '580px',
        background: '#111827',
        color: '#ffffff',
        borderRadius: '9999px',
        padding: '10px 14px 10px 20px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
        zIndex: 2000,
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}
    >
      <div className="bar-cart-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(0, 191, 99, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px'
        }}>
          🛒
        </div>
        <div>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            {totalItems} {totalItems === 1 ? 'service' : 'services'} • <span style={{ color: '#00BF63' }}>${grandTotal}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00BF63' }}></span>
            <span>⚡ 24h Guaranteed Turnaround</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenCart}
        className="bar-checkout-btn"
        style={{
          background: 'var(--color-primary, #00BF63)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '13.5px',
          padding: '10px 20px',
          borderRadius: '9999px',
          border: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 10px rgba(0, 191, 99, 0.35)'
        }}
      >
        <span>Review & Checkout</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/>
          <path d="m12 5 7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}