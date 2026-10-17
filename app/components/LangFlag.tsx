import React from 'react';

/**
 * Flag for a language option, drawn inline. The navbar used to load these from flagcdn.com,
 * so a blocked, slow or ad-blocked request left an empty gap next to the language name.
 * Inline SVG needs no request and cannot be blocked by the page's image policy.
 */
export default function LangFlag({
  code,
  width = 20,
  height = 14,
  style,
}: {
  code: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}): React.JSX.Element | null {
  const common = {
    width,
    height,
    viewBox: '0 0 60 40',
    preserveAspectRatio: 'none' as const,
    'aria-hidden': true,
    focusable: false,
    style: { flex: 'none', borderRadius: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.12)', marginRight: 8, ...style },
  };
  switch (code) {
    case 'en':
      return (
        <svg {...common} data-flag="gb">
          <rect width="60" height="40" fill="#012169" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
          <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="13" />
          <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8" />
        </svg>
      );
    case 'fr':
      return (
        <svg {...common} data-flag="fr">
          <rect width="20" height="40" fill="#0055A4" />
          <rect x="20" width="20" height="40" fill="#fff" />
          <rect x="40" width="20" height="40" fill="#EF4135" />
        </svg>
      );
    case 'es':
      return (
        <svg {...common} data-flag="es">
          <rect width="60" height="40" fill="#AA151B" />
          <rect y="10" width="60" height="20" fill="#F1BF00" />
        </svg>
      );
    default:
      return null;
  }
}
