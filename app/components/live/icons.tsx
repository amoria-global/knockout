import type { ReactNode } from 'react';

/** The few glyphs the live sections need, as inline SVG so the sections carry no icon font. Decorative: the buttons carry labels. */
const PATHS: Record<string, ReactNode> = {
  back: <path d="M15 5l-7 7 7 7" />,
  share: <><circle cx="6" cy="12" r="2.2" /><circle cx="17" cy="6" r="2.2" /><circle cx="17" cy="18" r="2.2" /><path d="M8 11l7-4M8 13l7 4" /></>,
  video: <><rect x="3" y="6" width="12" height="12" rx="2.5" /><path d="M15 10.5l6-3v9l-6-3" /></>,
  message: <path d="M4 5h16v11H9l-5 4z" />,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h3v3h-3zM19 14v6M14 19h3" /></>,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c3 3.2 3 13.8 0 17M12 3.5c-3 3.2-3 13.8 0 17" /></>,
  more: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
  flag: <path d="M6 21V4M6 5h11l-2 4 2 4H6" />,
  eyeOff: <path d="M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 6c5 0 8.5 4.5 9.5 6a15 15 0 01-3.2 3.5M6.2 7.6A15 15 0 002.5 12C3.5 13.5 7 18 12 18c1.5 0 2.8-.4 4-1" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  play: <path d="M8 5.5v13l11-6.5z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  pause: <path d="M8 5v14M16 5v14" />,
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.3" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  cloudOff: <path d="M3 3l18 18M7 17a4 4 0 01-.4-8A6 6 0 0117 8.5M18 17H9" />,
};

export function Icon({ name, size = 18 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name] ?? null}
    </svg>
  );
}
