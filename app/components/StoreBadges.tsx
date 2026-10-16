'use client';

import React from 'react';
import { FaApple } from 'react-icons/fa6';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/qr/eventQr';

/**
 * Black App Store and Google Play badges, one look for the navbar, the Get App modal and
 * the footer. Built from text and icons (not a downloaded image) so they stay sharp at any
 * size and follow the page language.
 *
 * Styles are plain scoped classes on purpose: the site's global `* { margin: 0; padding: 0 }`
 * is unlayered and zeroes Tailwind v4 spacing utilities.
 */
export type StoreBadgeSize = 'sm' | 'md' | 'lg';

function PlayGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <polygon points="3.4,1.6 13.6,12 3.4,22.4" fill="#00B8F0" />
      <polygon points="3.4,1.6 17,8.9 13.6,12" fill="#00E27A" />
      <polygon points="3.4,22.4 17,15.1 13.6,12" fill="#FF3A5C" />
      <polygon points="17,8.9 21.4,12 17,15.1 13.6,12" fill="#FFC72C" />
    </svg>
  );
}

export function StoreBadge({
  kind,
  size = 'md',
  block = false,
  kicker,
  name,
  className = '',
}: {
  kind: 'ios' | 'android';
  size?: StoreBadgeSize;
  /** Fill the width of its container. */
  block?: boolean;
  /** Override the small first line (for a translated page). */
  kicker?: string;
  /** Override the store name (for a translated page). */
  name?: string;
  className?: string;
}) {
  const ios = kind === 'ios';
  const icon = size === 'lg' ? 28 : size === 'md' ? 24 : 20;
  const k = kicker ?? (ios ? 'Download on the' : 'GET IT ON');
  const n = name ?? (ios ? 'App Store' : 'Google Play');
  return (
    <a
      href={ios ? APP_STORE_URL : PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`sb-badge sb-${size}${block ? ' sb-block' : ''} ${className}`.trim()}
      aria-label={ios ? 'Download on the App Store' : 'Get it on Google Play'}
    >
      <span className="sb-icon">{ios ? <FaApple size={icon} /> : <PlayGlyph size={icon} />}</span>
      <span className="sb-text">
        <span className="sb-kicker">{k}</span>
        <span className="sb-name">{n}</span>
      </span>
      <style>{STORE_BADGE_CSS}</style>
    </a>
  );
}

/** Both badges in a row (wraps on a narrow screen) or a column. */
export function StoreBadges({
  size = 'md',
  direction = 'row',
  align = 'start',
  className = '',
}: {
  size?: StoreBadgeSize;
  direction?: 'row' | 'column';
  align?: 'start' | 'center';
  className?: string;
}) {
  return (
    <div
      className={`sb-group sb-${direction} sb-align-${align} ${className}`.trim()}
    >
      <StoreBadge kind="ios" size={size} block={direction === 'column'} />
      <StoreBadge kind="android" size={size} block={direction === 'column'} />
    </div>
  );
}

const STORE_BADGE_CSS = `
.sb-badge{display:inline-flex;align-items:center;gap:10px;box-sizing:border-box;color:#fff;text-decoration:none;
  background:#000;border:1px solid #a6a6a6;border-radius:12px;white-space:nowrap;
  box-shadow:0 6px 16px -6px rgba(0,0,0,.55);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.sb-badge:hover{transform:translateY(-2px);border-color:#fff;box-shadow:0 12px 24px -8px rgba(8,58,133,.55)}
.sb-badge:active{transform:translateY(0)}
.sb-badge:focus-visible{outline:3px solid #F20C8F;outline-offset:2px}
.sb-icon{display:flex;align-items:center;justify-content:center;flex:none}
.sb-text{display:flex;flex-direction:column;align-items:flex-start;min-width:0;line-height:1}
.sb-kicker{opacity:.92;font-weight:500;letter-spacing:.02em}
.sb-name{font-weight:600;letter-spacing:-.01em}
.sb-sm{height:40px;padding:0 12px;border-radius:10px;gap:8px}
.sb-sm .sb-kicker{font-size:8.5px;margin-bottom:2px}
.sb-sm .sb-name{font-size:15px}
.sb-md{height:48px;padding:0 16px}
.sb-md .sb-kicker{font-size:9.5px;margin-bottom:3px}
.sb-md .sb-name{font-size:18px}
.sb-lg{height:56px;padding:0 22px;border-radius:14px;gap:12px}
.sb-lg .sb-kicker{font-size:10.5px;margin-bottom:3px}
.sb-lg .sb-name{font-size:21px}
.sb-block{display:flex;width:100%;justify-content:flex-start}
.sb-group{display:flex;gap:10px;flex-wrap:wrap}
.sb-column{flex-direction:column;align-items:stretch}
.sb-align-center{justify-content:center}
@media (prefers-reduced-motion:reduce){.sb-badge{transition:none}.sb-badge:hover{transform:none}}
`;
