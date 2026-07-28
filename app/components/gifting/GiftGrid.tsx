'use client';

/**
 * TikTok-style gift picker grid (Phase-2 integration of
 * app/_design-sandbox/LiveGifting.preview.html).
 *
 * Pure selection UI: renders the catalog as tappable tiles with exact prices,
 * grouped in Popular/Premium tabs. Payment method + phone collection stay in
 * the surrounding gift modal — this component only decides WHICH gift.
 */

import React, { useMemo, useState } from 'react';
import type { GiftCatalogItem } from '@/lib/APIs/public';

export interface GiftDisplayCurrency {
  abbreviation: string;
  symbol: string;
  /** units of this currency per 1 USD (null → show USD only) */
  perUsd: number | null;
}

interface GiftGridProps {
  gifts: GiftCatalogItem[];
  loading: boolean;
  error: string | null;
  selectedCode: string | null;
  onSelect: (gift: GiftCatalogItem) => void;
  displayCurrency?: GiftDisplayCurrency | null;
  onRetry?: () => void;
}

export function formatGiftLocalAmount(
  amountUsd: number,
  cur: GiftDisplayCurrency | null | undefined
): string | null {
  if (!cur || !cur.perUsd || cur.abbreviation === 'USD') return null;
  const local = Math.round(amountUsd * cur.perUsd);
  return `≈ ${cur.symbol}${local.toLocaleString()}`;
}

/** Whole-unit converted amount in the display currency, null when N/A. */
export function convertGiftAmount(
  amountUsd: number,
  cur: GiftDisplayCurrency | null | undefined
): number | null {
  if (!cur || !cur.perUsd || cur.abbreviation === 'USD') return null;
  return Math.round(amountUsd * cur.perUsd);
}

export default function GiftGrid({
  gifts,
  loading,
  error,
  selectedCode,
  onSelect,
  displayCurrency,
  onRetry,
}: GiftGridProps) {
  const [tab, setTab] = useState<'POPULAR' | 'PREMIUM'>('POPULAR');

  const visible = useMemo(
    () =>
      gifts
        .filter((g) => (g.tier === 'PREMIUM' ? tab === 'PREMIUM' : tab === 'POPULAR'))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [gifts, tab]
  );

  if (loading) {
    return (
      <div className="ckgift-state" role="status" aria-live="polite">
        <div className="ckgift-spinner" aria-hidden="true" />
        <span>Loading gifts…</span>
        <style jsx>{stateCss}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ckgift-state ckgift-state--error" role="alert">
        <span>{error}</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="ckgift-retry">
            Try again
          </button>
        )}
        <style jsx>{stateCss}</style>
      </div>
    );
  }

  if (!gifts.length) {
    return (
      <div className="ckgift-state">
        <span>Gifting isn&apos;t available right now.</span>
        <style jsx>{stateCss}</style>
      </div>
    );
  }

  return (
    <div className="ckgift-root">
      <div className="ckgift-tabs" role="tablist" aria-label="Gift categories">
        {(['POPULAR', 'PREMIUM'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`ckgift-tab${tab === t ? ' is-on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'POPULAR' ? 'Popular' : 'Premium'}
          </button>
        ))}
      </div>

      <div className="ckgift-grid" role="listbox" aria-label="Gifts">
        {visible.map((g) => {
          const isSel = selectedCode === g.code;
          // When a non-USD display currency is active, the CONVERTED amount
          // is the primary price and USD drops to the secondary line —
          // switching currency must visibly convert the cards, not just
          // annotate them. (Charging stays exact USD server-side.)
          const converted = convertGiftAmount(g.amountUsd, displayCurrency);
          const primary = converted != null && displayCurrency
            ? `${displayCurrency.symbol}${converted.toLocaleString()}`
            : `$${g.amountUsd}`;
          const secondary = converted != null ? `$${g.amountUsd} USD` : null;
          return (
            <button
              key={g.code}
              type="button"
              role="option"
              aria-selected={isSel}
              aria-label={`${g.name}, ${primary}`}
              className={`ckgift-tile${isSel ? ' is-selected' : ''}`}
              onClick={() => onSelect(g)}
            >
              <span className="ckgift-emoji" aria-hidden="true">
                {g.emoji}
              </span>
              <span className="ckgift-name">{g.name}</span>
              <span className="ckgift-price">{primary}</span>
              {secondary && <span className="ckgift-local">{secondary}</span>}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .ckgift-root {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ckgift-tabs {
          display: flex;
          gap: 6px;
        }
        .ckgift-tab {
          border: 1px solid transparent;
          background: transparent;
          color: rgba(255, 255, 255, 0.65);
          font-size: 12.5px;
          font-weight: 700;
          padding: 7px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ckgift-tab.is-on {
          color: #fff;
          background: rgba(242, 12, 143, 0.16);
          border-color: rgba(242, 12, 143, 0.5);
        }
        .ckgift-tab:focus-visible {
          outline: 2px solid #ff3da0;
          outline-offset: 2px;
        }
        .ckgift-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          max-height: 264px;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 2px;
        }
        @media (max-width: 380px) {
          .ckgift-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .ckgift-tile {
          position: relative;
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          border-radius: 14px;
          padding: 12px 6px 10px;
          cursor: pointer;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
            border-color 0.2s, background 0.2s;
        }
        .ckgift-tile:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.1);
        }
        .ckgift-tile:focus-visible {
          outline: 2px solid #ff3da0;
          outline-offset: 2px;
        }
        .ckgift-tile.is-selected {
          border-color: #f20c8f;
          background: rgba(242, 12, 143, 0.14);
          box-shadow: 0 0 0 1px #f20c8f inset, 0 8px 22px rgba(242, 12, 143, 0.25);
        }
        .ckgift-emoji {
          font-size: 30px;
          line-height: 1;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ckgift-tile:hover .ckgift-emoji,
        .ckgift-tile.is-selected .ckgift-emoji {
          transform: scale(1.18);
        }
        .ckgift-name {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.72);
        }
        .ckgift-price {
          font-size: 12px;
          font-weight: 800;
          color: #ffd166;
          font-variant-numeric: tabular-nums;
        }
        .ckgift-local {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          font-variant-numeric: tabular-nums;
        }
        @media (prefers-reduced-motion: reduce) {
          .ckgift-tile,
          .ckgift-emoji {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

const stateCss = `
  .ckgift-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 28px 16px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    text-align: center;
  }
  .ckgift-state--error {
    color: #ffb4b4;
  }
  .ckgift-retry {
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border-radius: 999px;
    padding: 7px 16px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .ckgift-spinner {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2.5px solid rgba(255, 255, 255, 0.25);
    border-top-color: #f20c8f;
    animation: ckgift-spin 0.8s linear infinite;
  }
  @keyframes ckgift-spin {
    to { transform: rotate(360deg); }
  }
`;
