'use client';

/**
 * Persistent brand watermark burned onto every live-stream video.
 *
 * Renders a low-opacity "AMORIA CONNEKYT" bug (logo + wordmark) in a
 * corner of the video stage so EVERY viewer sees it — it's part of the
 * player markup, not gated by role, access, or ad state.
 *
 * It is purely attributive/anti-piracy chrome:
 *   • pointer-events: none  → never intercepts taps on the player
 *   • aria-hidden           → invisible to assistive tech (decorative)
 *   • zIndex 8              → above the <video>, below interactive
 *                             overlays (controls, ad banners, modals)
 *
 * Two footprints:
 *   • full  — logo + wordmark, for the main stage.
 *   • mark  — logo only, for the small multi-view grid tiles where a
 *             wordmark would be illegible.
 */
export function StreamWatermark({
  variant = 'full',
  position = 'top-left',
}: {
  variant?: 'full' | 'mark';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const mark = variant === 'mark';
  const pad = mark ? 6 : 12;
  const vertical = position.startsWith('top') ? { top: pad } : { bottom: pad };
  const horizontal = position.endsWith('left') ? { left: pad } : { right: pad };
  const logoSize = mark ? 18 : 26;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        ...vertical,
        ...horizontal,
        display: 'flex',
        alignItems: 'center',
        gap: mark ? 0 : 8,
        // Low opacity so it reads as a watermark, not UI chrome.
        opacity: mark ? 0.5 : 0.55,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 8,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        width={logoSize}
        height={logoSize}
        style={{
          display: 'block',
          objectFit: 'contain',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.75))',
        }}
      />
      {!mark && (
        <span
          style={{
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            textShadow: '0 1px 4px rgba(0,0,0,0.85)',
            whiteSpace: 'nowrap',
          }}
        >
          Amoria Connekyt
        </span>
      )}
    </div>
  );
}

export default StreamWatermark;
