'use client';

import { useState } from 'react';
import type { Identity } from '@/lib/live/composer';
import { MAX_WISH_VIDEO_SECONDS } from '@/lib/live/types';
import { Icon } from './icons';
import { WishComposer } from './WishComposer';

/**
 * Section 5: send a video wish (record or upload, up to 60 seconds) or a text wish. Each opens the composer, where the
 * sender picks public or private before sending. Same props on mobile.
 */
export function SendWishes({
  eventId,
  closed,
  account,
  getFingerprint,
  onSent,
}: {
  eventId: string;
  /** Wishes are closed once the event has ended. */
  closed?: boolean;
  account: Identity | null;
  getFingerprint: () => Promise<string>;
  onSent?: () => void;
}) {
  const [kind, setKind] = useState<'text' | 'video' | null>(null);
  if (closed) {
    return (
      <section className="lv-card" aria-label="Send your wishes">
        <h3>Send your wishes</h3>
        <p className="lv-sub">Wishes are closed for this event.</p>
      </section>
    );
  }
  return (
    <section className="lv-card" aria-label="Send your wishes">
      <h3>Send your wishes</h3>
      <div className="lv-pair">
        <div className="lv-option">
          <div className="lv-option-head">
            <Icon name="video" size={18} /> Video wish
          </div>
          <p className="lv-sub">Up to {MAX_WISH_VIDEO_SECONDS} seconds</p>
          <button type="button" className="lv-btn" onClick={() => setKind('video')}>
            Record / upload
          </button>
        </div>
        <div className="lv-option">
          <div className="lv-option-head">
            <Icon name="message" size={18} /> Text wish
          </div>
          <p className="lv-sub">A short message</p>
          <button type="button" className="lv-btn" onClick={() => setKind('text')}>
            Write a wish
          </button>
        </div>
      </div>
      {kind ? <WishComposer eventId={eventId} kind={kind} account={account} getFingerprint={getFingerprint} onClose={() => setKind(null)} onSent={onSent} /> : null}
    </section>
  );
}
