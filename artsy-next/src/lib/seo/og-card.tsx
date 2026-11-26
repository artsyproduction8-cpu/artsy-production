import { ImageResponse } from 'next/og';

export interface OgCardProps {
  title: string;
  subtitle: string;
  badge: string;
  category: string;
  turnaround: string;
  startingPrice: string;
  highlightPoints?: string[];
}

export function createOgImage({
  title,
  subtitle,
  badge,
  category,
  turnaround,
  startingPrice,
  highlightPoints = ['4K Master Deliverable', 'Rec.709 Color Grade', '100% White-Label (NDA Safe)'],
}: OgCardProps) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#08080A',
          backgroundImage:
            'radial-gradient(circle at 90% 10%, rgba(37, 99, 235, 0.32), transparent 50%), radial-gradient(circle at 10% 90%, rgba(99, 102, 241, 0.22), transparent 50%)',
          padding: '56px 64px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Brand Mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '20px',
              }}
            >
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                ARTSY PRODUCTION
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: '#94A3B8', textTransform: 'uppercase' }}>
                Cinematic Editorial Studio
              </span>
            </div>
          </div>

          {/* Category Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#60A5FA',
            }}
          >
            <span>{badge}</span>
          </div>
        </div>

        {/* Main Center Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxWidth: '1000px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#38BDF8',
            }}
          >
            {category}
          </div>

          <h1
            style={{
              fontSize: '52px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: '20px',
              lineHeight: 1.4,
              color: '#CBD5E1',
              margin: 0,
              maxWidth: '920px',
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Bottom Feature Badges & Pricing Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            width: '100%',
          }}
        >
          {/* Highlights */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {highlightPoints.map((pt, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#E2E8F0',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{pt}</span>
              </div>
            ))}
          </div>

          {/* Pricing & SLA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Turnaround SLA
              </span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#38BDF8' }}>
                {turnaround}
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#2563EB',
                padding: '8px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
              }}
            >
              {startingPrice}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
