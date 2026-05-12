'use client';
import React, { useState, useEffect, useCallback } from 'react';

/**
 * Floating Back-to-Top button.
 *
 * Design highlights:
 *  - Animated SVG progress ring around the button shows how far the user
 *    has scrolled through the page (0 → 100%).
 *  - Brand-blue gradient core with a glassy outer halo and lift-on-hover.
 *  - Arrow icon nudges up + shimmer pulses when the button enters view.
 *  - Honors `prefers-reduced-motion` (removes float/pulse, keeps state changes).
 */
export default function BackToTop(): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0); // 0 → 1

  useEffect(() => {
    const onScroll = () => {
      const scrolled = document.documentElement.scrollTop || document.body.scrollTop;
      const max = Math.max(
        1,
        (document.documentElement.scrollHeight || 0) -
          (document.documentElement.clientHeight || window.innerHeight)
      );
      setIsVisible(scrolled > 220);
      setProgress(Math.min(1, Math.max(0, scrolled / max)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    setIsPressed(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => setIsPressed(false), 700);
  }, []);

  // SVG progress ring math
  const SIZE = 56;
  const STROKE = 2.5;
  const RADIUS = SIZE / 2 - STROKE;
  const CIRC = 2 * Math.PI * RADIUS;
  const dash = CIRC * (1 - progress);

  return (
    <>
      <button
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className={`btt ${isVisible ? 'is-on' : ''} ${isHovered ? 'is-hover' : ''} ${isPressed ? 'is-pressed' : ''}`}
        aria-label={`Back to top, ${Math.round(progress * 100)}% scrolled`}
        title="Back to top"
      >
        {/* Progress ring */}
        <svg
          className="btt-ring"
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bttGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1f6bff" />
            </linearGradient>
          </defs>
          {/* track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={STROKE}
          />
          {/* progress (rotated -90deg so it starts at the top) */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="url(#bttGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dash}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 180ms ease-out' }}
          />
        </svg>

        {/* Glow halo */}
        <span className="btt-halo" aria-hidden="true" />

        {/* Inner core */}
        <span className="btt-core" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="btt-arrow">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </span>
      </button>

      <style jsx>{`
        .btt {
          position: fixed;
          right: 22px;
          bottom: 24px;
          z-index: 1000;
          width: 56px;
          height: 56px;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transform: translateY(18px) scale(0.85);
          transition:
            opacity 240ms ease,
            transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1),
            visibility 240ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .btt.is-on {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }
        .btt.is-hover { transform: translateY(-3px) scale(1.04); }
        .btt.is-pressed { transform: translateY(-2px) scale(0.97); }

        .btt-ring {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }

        .btt-halo {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(31, 107, 255, 0.55) 0%, rgba(31, 107, 255, 0) 70%);
          opacity: 0.55;
          filter: blur(10px);
          transform: scale(1.05);
          transition: opacity 220ms ease, transform 220ms ease;
          z-index: 0;
        }
        .btt.is-hover .btt-halo {
          opacity: 0.95;
          transform: scale(1.25);
        }

        .btt-core {
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background:
            linear-gradient(135deg, #3b82f6 0%, #1f6bff 50%, #083A85 100%);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 6px 18px -4px rgba(8, 58, 133, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.30),
            inset 0 -2px 6px rgba(0, 0, 0, 0.18);
          z-index: 2;
          transition: filter 220ms ease, box-shadow 220ms ease;
        }
        .btt.is-hover .btt-core {
          filter: brightness(1.08);
          box-shadow:
            0 14px 28px -6px rgba(31, 107, 255, 0.65),
            inset 0 1px 0 rgba(255, 255, 255, 0.40),
            inset 0 -2px 6px rgba(0, 0, 0, 0.20);
        }

        .btt-arrow {
          transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .btt.is-hover .btt-arrow { transform: translateY(-2px); }
        .btt.is-pressed .btt-arrow {
          animation: btt-shoot 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes btt-shoot {
          0%   { transform: translateY(0); opacity: 1; }
          45%  { transform: translateY(-22px); opacity: 0; }
          50%  { transform: translateY(22px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        /* Subtle idle breathing on the halo so the button feels "alive" */
        @keyframes btt-breathe {
          0%, 100% { opacity: 0.45; transform: scale(1.03); }
          50%      { opacity: 0.72; transform: scale(1.10); }
        }
        .btt.is-on:not(.is-hover) .btt-halo {
          animation: btt-breathe 2.6s ease-in-out infinite;
        }

        /* Focus ring (a11y) */
        .btt:focus-visible {
          outline: none;
        }
        .btt:focus-visible .btt-core {
          box-shadow:
            0 0 0 3px rgba(31, 107, 255, 0.45),
            0 14px 28px -6px rgba(31, 107, 255, 0.65),
            inset 0 1px 0 rgba(255, 255, 255, 0.40);
        }

        /* Mobile — slightly smaller, hugs the dock.
           - More right offset so the phone's rounded corner doesn't clip
             the outer ring/halo (which extends ~6-8px beyond the core).
           - bottom accounts for both the mobile dock (used on view-event)
             AND the iOS home indicator via env(safe-area-inset-bottom). */
        @media (max-width: 540px) {
          .btt {
            right: 20px;
            bottom: calc(96px + env(safe-area-inset-bottom, 0px));
            width: 48px;
            height: 48px;
          }
        }
        /* Very small phones — pull back further from the edge to clear
           rounded corners on devices like iPhone SE / smaller Androids. */
        @media (max-width: 380px) {
          .btt { right: 22px; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .btt, .btt-arrow, .btt-core, .btt-halo { transition-duration: 0.001ms !important; }
          .btt.is-on:not(.is-hover) .btt-halo { animation: none; }
          .btt.is-pressed .btt-arrow { animation: none; }
        }
      `}</style>
    </>
  );
}
