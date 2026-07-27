'use client';

/**
 * Live gift animation overlay (Phase-2 integration of
 * app/_design-sandbox/LiveGifting.preview.html).
 *
 * Renders TikTok-style gift banners (top-left stack with combo counters) and
 * a fullscreen takeover for big gifts. Mount inside the player's relative
 * container; it is pointer-events-none and never intercepts controls.
 *
 * Feed it gift events (already deduped by chat-row id by the caller); it
 * aggregates same sender+gift into combo bumps and self-expires banners.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface LiveGiftEvent {
  /** stream_chats row id — unique per confirmed gift */
  id: string;
  sender: string;
  code: string | null;
  name: string;
  emoji: string;
  amountUsd: number | null;
  big: boolean;
  /** true when this browser sent the gift (larger celebration) */
  mine?: boolean;
}

interface BannerState {
  key: string;
  sender: string;
  name: string;
  emoji: string;
  amountUsd: number | null;
  count: number;
  bumpSeq: number;
  leaving: boolean;
}

const BANNER_TTL_MS = 3600;
const MAX_BANNERS = 3;

export default function GiftOverlay({ events }: { events: LiveGiftEvent[] }) {
  const [banners, setBanners] = useState<BannerState[]>([]);
  const [takeover, setTakeover] = useState<LiveGiftEvent | null>(null);
  const consumed = useRef<Set<string>>(new Set());
  const expiry = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const takeoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    for (const ev of events) {
      if (consumed.current.has(ev.id)) continue;
      consumed.current.add(ev.id);

      const key = `${ev.sender}:${ev.code ?? ev.name}`;
      setBanners((prev) => {
        const existing = prev.find((b) => b.key === key && !b.leaving);
        let next: BannerState[];
        if (existing) {
          next = prev.map((b) =>
            b.key === key && !b.leaving
              ? { ...b, count: b.count + 1, bumpSeq: b.bumpSeq + 1 }
              : b
          );
        } else {
          next = [
            {
              key,
              sender: ev.sender,
              name: ev.name,
              emoji: ev.emoji,
              amountUsd: ev.amountUsd,
              count: 1,
              bumpSeq: 0,
              leaving: false,
            },
            ...prev,
          ].slice(0, MAX_BANNERS);
        }
        return next;
      });

      const oldTimer = expiry.current.get(key);
      if (oldTimer) clearTimeout(oldTimer);
      expiry.current.set(
        key,
        setTimeout(() => {
          setBanners((prev) =>
            prev.map((b) => (b.key === key ? { ...b, leaving: true } : b))
          );
          setTimeout(() => {
            setBanners((prev) => prev.filter((b) => b.key !== key));
            expiry.current.delete(key);
          }, 360);
        }, BANNER_TTL_MS)
      );

      if (ev.big) {
        setTakeover(ev);
        if (takeoverTimer.current) clearTimeout(takeoverTimer.current);
        takeoverTimer.current = setTimeout(() => setTakeover(null), 2600);
      }
    }
  }, [events]);

  useEffect(
    () => () => {
      expiry.current.forEach((t) => clearTimeout(t));
      if (takeoverTimer.current) clearTimeout(takeoverTimer.current);
    },
    []
  );

  return (
    <div className="ckgo-root" aria-live="polite">
      <div className="ckgo-banners">
        {banners.map((b) => (
          <div key={b.key} className={`ckgo-banner${b.leaving ? ' is-leaving' : ''}`}>
            <span className="ckgo-avatar" aria-hidden="true">
              {b.sender.slice(0, 2).toUpperCase()}
            </span>
            <span className="ckgo-who">
              <b>{b.sender}</b>
              <span>
                sent a {b.name}
                {b.amountUsd != null ? ` · $${b.amountUsd}` : ''}
              </span>
            </span>
            <span className="ckgo-emoji" aria-hidden="true">
              {b.emoji}
            </span>
            {/* key on bumpSeq restarts the pop animation on each combo hit */}
            <span key={b.bumpSeq} className="ckgo-combo">
              x{b.count}
            </span>
          </div>
        ))}
      </div>

      {takeover && (
        <div className="ckgo-takeover" key={takeover.id}>
          <div className="ckgo-burst" />
          <div className="ckgo-big" aria-hidden="true">
            {takeover.emoji}
          </div>
          <div className="ckgo-label">
            <b>{takeover.sender}</b>&nbsp;sent a {takeover.name}!
            {takeover.amountUsd != null ? ` · $${takeover.amountUsd}` : ''}
          </div>
        </div>
      )}

      <style jsx>{`
        .ckgo-root {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 30;
          overflow: hidden;
        }
        .ckgo-banners {
          position: absolute;
          top: 14%;
          left: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: min(280px, 78%);
        }
        .ckgo-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(
            90deg,
            rgba(242, 12, 143, 0.92),
            rgba(8, 58, 133, 0.88) 90%
          );
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 999px;
          padding: 6px 14px 6px 6px;
          box-shadow: 0 8px 24px rgba(242, 12, 143, 0.35);
          animation: ckgo-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ckgo-banner.is-leaving {
          animation: ckgo-out 0.35s ease forwards;
        }
        @keyframes ckgo-in {
          from {
            transform: translateX(-120%);
            opacity: 0;
          }
        }
        @keyframes ckgo-out {
          to {
            transform: translateX(-25%) scale(0.9);
            opacity: 0;
          }
        }
        .ckgo-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex: none;
          background: linear-gradient(135deg, #f20c8f, #083a85);
          border: 2px solid rgba(255, 255, 255, 0.5);
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 11px;
          color: #fff;
        }
        .ckgo-who {
          flex: 1;
          min-width: 0;
          line-height: 1.2;
          display: flex;
          flex-direction: column;
          color: #fff;
        }
        .ckgo-who b {
          font-size: 12.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ckgo-who span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.85);
        }
        .ckgo-emoji {
          font-size: 26px;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
        }
        .ckgo-combo {
          font-weight: 900;
          font-style: italic;
          font-size: 18px;
          color: #fff;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
          min-width: 34px;
          text-align: center;
          animation: ckgo-bump 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes ckgo-bump {
          40% {
            transform: scale(1.6) rotate(-6deg);
          }
        }
        .ckgo-takeover {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
        }
        .ckgo-burst {
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(242, 12, 143, 0.5),
            rgba(242, 12, 143, 0) 65%
          );
          animation: ckgo-burst 2.6s ease-out forwards;
        }
        @keyframes ckgo-burst {
          from {
            transform: scale(0.2);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          to {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        .ckgo-big {
          font-size: clamp(72px, 18vw, 120px);
          filter: drop-shadow(0 14px 30px rgba(0, 0, 0, 0.5));
          animation: ckgo-big 2.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes ckgo-big {
          0% {
            transform: scale(0) rotate(-18deg);
            opacity: 0;
          }
          18% {
            transform: scale(1.25) rotate(4deg);
            opacity: 1;
          }
          30% {
            transform: scale(1);
          }
          78% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(0.6) translateY(-60px);
            opacity: 0;
          }
        }
        .ckgo-label {
          position: absolute;
          bottom: 32%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          padding: 8px 18px;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.02em;
          color: #fff;
          animation: ckgo-label 2.6s ease forwards;
        }
        @keyframes ckgo-label {
          0%,
          12% {
            opacity: 0;
            transform: translateY(14px);
          }
          22%,
          80% {
            opacity: 1;
            transform: none;
          }
          100% {
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ckgo-banner,
          .ckgo-combo,
          .ckgo-burst,
          .ckgo-big,
          .ckgo-label {
            animation-duration: 0.01ms;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Parse a stream-chat row into a LiveGiftEvent, tolerating legacy rows and
 * malformed meta. Returns null when the row isn't a renderable gift.
 */
export function parseGiftChatRow(row: {
  id?: string | number;
  chatType?: string;
  viewerUsername?: string;
  message?: string;
  giftMeta?: string | null;
}): LiveGiftEvent | null {
  if ((row.chatType || '').toUpperCase() !== 'GIFT' || row.id == null) return null;
  let meta: Record<string, unknown> = {};
  if (row.giftMeta) {
    try {
      meta = JSON.parse(row.giftMeta) as Record<string, unknown>;
    } catch {
      meta = {};
    }
  }
  const amountRaw = meta.amountUsd;
  const amountUsd =
    typeof amountRaw === 'number'
      ? amountRaw
      : typeof amountRaw === 'string' && amountRaw !== ''
        ? Number(amountRaw)
        : null;
  return {
    id: String(row.id),
    sender:
      (typeof meta.senderName === 'string' && meta.senderName) ||
      row.viewerUsername ||
      'A viewer',
    code: typeof meta.code === 'string' ? meta.code : null,
    name: typeof meta.name === 'string' && meta.name ? meta.name : 'gift',
    emoji: typeof meta.emoji === 'string' && meta.emoji ? meta.emoji : '🎁',
    amountUsd: amountUsd != null && Number.isFinite(amountUsd) ? amountUsd : null,
    big: meta.bigAnimation === true,
  };
}
