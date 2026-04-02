import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Zikuk — Real-time geopolitical intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#060a14',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top: Logo + tag */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                borderRadius: '12px',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              ⚡
            </div>
            <span style={{ color: '#f1f5f9', fontSize: '36px', fontWeight: 700 }}>
              Zikuk
            </span>
          </div>
          <span
            style={{
              color: '#6366f1',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            Geopolitical Intelligence Platform
          </span>
        </div>

        {/* Center: Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              color: '#f1f5f9',
              fontSize: '54px',
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: '820px',
            }}
          >
            Know what&apos;s{' '}
            <span style={{ color: '#22c55e' }}>likely</span> next.
          </div>
          <div style={{ color: '#94a3b8', fontSize: '22px', maxWidth: '700px', lineHeight: 1.5 }}>
            Real-time signals, shock detection, Polymarket comparison — across 38+ sources.
          </div>
        </div>

        {/* Bottom: Stats pills */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { label: '38+ מקורות', color: '#4f46e5', bg: '#1e1b4b' },
            { label: 'Shock Detection', color: '#d97706', bg: '#1c1007' },
            { label: 'Signal vs Market', color: '#16a34a', bg: '#052e16' },
            { label: 'Media Bias AI', color: '#9333ea', bg: '#1a0533' },
          ].map(p => (
            <div
              key={p.label}
              style={{
                background: p.bg,
                border: `1px solid ${p.color}33`,
                color: p.color,
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              {p.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
