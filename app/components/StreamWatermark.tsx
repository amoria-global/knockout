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
// High z-index so the mark always sits ON TOP of the video, ad banners and
// state overlays. It's still scoped to the video-stage stacking context, so it
// never escapes over unrelated page-level modals.
const WM_Z = 999999;

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
      {/* Layer 1 — faint full-frame diagonal wordmark (main stage only).
          Burned into the frame at very low opacity; always ON TOP (zIndex
          beats ad banners + state overlays) so it's never covered. */}
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
            zIndex: WM_Z,
          }}
        >
          <span
            style={{
              transform: 'rotate(-22deg)',
              color: '#fff',
              opacity: 0.08,
              fontSize: 'clamp(26px, 6.5vw, 84px)',
              fontWeight: 900,
              letterSpacing: 4,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 14px rgba(0,0,0,0.35)',
            }}
          >
            Amoria Connekyt
          </span>
        </div>
      )}

      {/* Layer 2 — corner bug, burned-in (no pill) so it reads as part of the
          video. Low opacity, always on top. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          ...vertical,
          ...horizontal,
          display: 'flex',
          alignItems: 'center',
          gap: mark ? 0 : 7,
          opacity: mark ? 0.4 : 0.5,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: WM_Z,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          width={logoSize}
          height={logoSize}
          style={{ display: 'block', objectFit: 'contain', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
        />
        {!mark && (
          <span
            style={{
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              textShadow: '0 1px 5px rgba(0,0,0,0.95)',
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
