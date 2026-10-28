'use client';

import { useEffect, useRef, useState } from 'react';
import { formatClock } from '@/lib/live/composer';
import type { FeedState, Wish } from '@/lib/live/types';
import { Icon } from './icons';

function Skeleton() {
  return (
    <div role="status" aria-label="Loading wishes" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div className="lv-skel" key={i}>
          <i style={{ width: 44, height: 44, borderRadius: 22 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <i style={{ width: '40%', height: 12 }} />
            <i style={{ width: '85%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Menu({ wish, canReport, onHideOwn, onReport }: { wish: Wish; canReport: boolean; onHideOwn: (w: Wish) => void; onReport?: (w: Wish) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div className="lv-menu-wrap" ref={ref}>
      <button type="button" className="lv-icon-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`More options for the wish from ${wish.authorName}`} onClick={() => setOpen((o) => !o)}>
        <Icon name="more" size={18} />
      </button>
      {open ? (
        <div className="lv-menu" role="menu">
          {wish.mine ? (
            <button type="button" role="menuitem" onClick={() => (setOpen(false), onHideOwn(wish))}>
              <Icon name="eyeOff" size={16} /> Hide my wish
            </button>
          ) : canReport && onReport ? (
            <button type="button" role="menuitem" onClick={() => (setOpen(false), onReport(wish))}>
              <Icon name="flag" size={16} /> Report
            </button>
          ) : (
            <button type="button" role="menuitem" onClick={() => setOpen(false)}>
              Sign in to report a wish
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Section 8 (viewer): approved public wishes. `variant="preview"` shows the latest three with See all; `"full"` shows the
 * whole feed. Video items show a thumbnail and duration, text items the avatar, name and message, and every item has an
 * overflow menu (report, or hide your own). Loading, empty and error states are built in. Same props on mobile.
 */
export function WishesFeed({
  state,
  wishes,
  variant,
  total,
  hasMore,
  onRetry,
  onSeeAll,
  onLoadMore,
  onPlay,
  onHideOwn,
  onReport,
  canReport = false,
}: {
  state: FeedState;
  wishes: Wish[];
  variant: 'preview' | 'full';
  total?: number;
  hasMore?: boolean;
  onRetry: () => void;
  onSeeAll?: () => void;
  onLoadMore?: () => void;
  onPlay: (w: Wish) => void;
  onHideOwn: (w: Wish) => void;
  onReport?: (w: Wish) => void;
  canReport?: boolean;
}) {
  const shown = variant === 'preview' ? wishes.slice(0, 3) : wishes;
  return (
    <section className={`lv-card lv-feed lv-feed--${variant}`} aria-label="Wishes and memories">
      <div>
        <h3>{variant === 'preview' ? 'Latest wishes' : 'Wishes & Memories'}</h3>
        {variant === 'preview' ? <p className="lv-sub">Approved by the host</p> : null}
      </div>
      {state === 'loading' ? (
        <Skeleton />
      ) : state === 'error' ? (
        <div className="lv-state" role="alert">
          <Icon name="cloudOff" size={22} />
          Could not load the wishes.
          <button type="button" className="lv-btn" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : shown.length === 0 ? (
        <div className="lv-state">
          <Icon name="spark" size={22} />
          No wishes yet. Be the first to send one.
        </div>
      ) : (
        <>
          <ul className="lv-list">
            {shown.map((w) => (
              <li className="lv-wish" key={w.id}>
                {w.type === 'video' ? (
                  <button type="button" className="lv-thumb" onClick={() => onPlay(w)} aria-label={`Play video wish from ${w.authorName}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {w.thumbnailUrl ? <img src={w.thumbnailUrl} alt="" /> : w.videoUrl ? <video src={`${w.videoUrl}#t=0.1`} preload="metadata" muted playsInline /> : null}
                    <Icon name="play" size={22} />
                    {w.durationSeconds ? <span className="lv-dur">{formatClock(w.durationSeconds)}</span> : null}
                  </button>
                ) : (
                  <span className="lv-avatar" aria-hidden="true">
                    {w.authorName.trim().charAt(0).toUpperCase() || 'G'}
                  </span>
                )}
                <div className="lv-wish-body">
                  <span className="lv-wish-name">{w.authorName}</span>
                  <p className="lv-wish-msg">{w.message && w.message !== '[Video Wish]' ? w.message : w.type === 'video' ? 'Video wish' : ''}</p>
                </div>
                <Menu wish={w} canReport={canReport} onHideOwn={onHideOwn} onReport={onReport} />
              </li>
            ))}
          </ul>
          {variant === 'preview' && (total ?? wishes.length) > shown.length ? (
            <button type="button" className="lv-btn" onClick={() => onSeeAll?.()}>
              See all <Icon name="arrow" size={16} />
            </button>
          ) : null}
          {variant === 'full' && hasMore ? (
            <button type="button" className="lv-btn" onClick={() => onLoadMore?.()}>
              Load more
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

/** Plays a video wish in a dialog. Used by the viewer's feed and the host's queue. */
export function WishVideoDialog({ wish, onClose }: { wish: Wish | null; onClose: () => void }) {
  useEffect(() => {
    if (!wish) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [wish, onClose]);
  if (!wish?.videoUrl) return null;
  return (
    <div className="lv lv-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lv-dialog" role="dialog" aria-modal="true" aria-label={`Video wish from ${wish.authorName}`}>
        <div className="lv-dialog-head">
          <h3>{wish.authorName}</h3>
          <button type="button" className="lv-icon-btn" onClick={onClose} aria-label="Close video">
            <Icon name="close" size={18} />
          </button>
        </div>
        <video className="lv-preview" src={wish.videoUrl} controls autoPlay />
      </div>
    </div>
  );
}
