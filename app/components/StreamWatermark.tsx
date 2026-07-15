'use client';

/**
 * Persistent brand watermark burned onto every live-stream video.
 *
 * EVERY viewer sees it — it's part of the player markup, not gated by role,
 * access, or ad state. Two layers make it impossible to miss yet non-intrusive:
 *   1. A faint, large diagonal "AMORIA CONNEKYT" wordmark across the whole
 *      frame (low opacity — a classic anti-piracy screener mark).
 *   2. A small, clearly legible corner bug (logo + wordmark) on a translucent
 *      pill so it reads on bright or dark footage.
 *
 * Both are pointer-events:none + aria-hidden (decorative, never intercept
 * taps). z-indexes sit above the <video> but below the "starting/paused"
 * full-screen states, so they only show once actual video is playing.
 *
 * variant:
 *   • full — both layers, for the main stage.
 *   • mark — logo-only corner bug, for the small multi-view grid tiles.
 */
export function StreamWatermark({
  variant = 'full',
  position = 'top-left',
}: {
  variant?: 'full' | 'mark';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const mark = variant === 'mark';
  const pad = mark ? 6 : 14;
  const vertical = position.startsWith('top') ? { top: pad } : { bottom: pad };
  const horizontal = position.endsWith('left') ? { left: pad } : { right: pad };
  const logoSize = mark ? 18 : 24;

  return (
    <>
      {/* Layer 1 — faint full-frame diagonal wordmark (main stage only). */}
      {!mark && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 6,
          }}
        >
          <span
            style={{
              transform: 'rotate(-22deg)',
              color: '#fff',
              opacity: 0.14,
              fontSize: 'clamp(26px, 6.5vw, 84px)',
              fontWeight: 900,
              letterSpacing: 4,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 14px rgba(0,0,0,0.45)',
            }}
          >
            Amoria Connekyt
          </span>
        </div>
      )}

      {/* Layer 2 — legible corner bug. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          ...vertical,
          ...horizontal,
          display: 'flex',
          alignItems: 'center',
          gap: mark ? 0 : 7,
          padding: mark ? 0 : '5px 10px',
          borderRadius: 999,
          background: mark ? 'transparent' : 'rgba(0,0,0,0.34)',
          backdropFilter: mark ? undefined : 'blur(2px)',
          WebkitBackdropFilter: mark ? undefined : 'blur(2px)',
          opacity: 0.9,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 30,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          width={logoSize}
          height={logoSize}
          style={{ display: 'block', objectFit: 'contain', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }}
        />
        {!mark && (
          <span
            style={{
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              textShadow: '0 1px 4px rgba(0,0,0,0.85)',
              whiteSpace: 'nowrap',
            }}
          >
            Amoria Connekyt
          </span>
        )}
      </div>
    </>
  );
}

export default StreamWatermark;
