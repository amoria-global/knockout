'use client';

import { formatClock } from '@/lib/live/composer';
import type { FeedState, Wish } from '@/lib/live/types';
import { Icon } from './icons';

const statusText = (w: Wish) =>
  w.visibility === 'private'
    ? 'Private, only you see it'
    : w.status === 'approved'
      ? 'Approved, shown in the feed'
      : w.status === 'hidden'
        ? 'Hidden'
        : 'Waiting for your decision';

/**
 * Section 8 (host): every wish for the event with Approve and Hide. A private wish can be read and hidden but not
 * approved, because it never goes to the feed. Same props on mobile.
 */
export function ModerationQueue({
  state,
  wishes,
  busyId,
  onApprove,
  onHide,
  onRetry,
  onPlay,
  limit,
  onSeeAll,
}: {
  state: FeedState;
  wishes: Wish[];
  /** Show only the first few (the sidebar preview) with a See all button. */
  limit?: number;
  onSeeAll?: () => void;
  busyId?: string | null;
  onApprove: (w: Wish) => void;
  onHide: (w: Wish) => void;
  onRetry: () => void;
  onPlay: (w: Wish) => void;
}) {
  const waiting = wishes.filter((w) => w.visibility === 'public' && w.status === 'pending').length;
  return (
    <section className="lv-card" aria-label="Wishes moderation">
      <div>
        <h3>Wishes</h3>
        <p className="lv-sub">{state === 'ready' && waiting > 0 ? `${waiting} waiting for your decision` : 'Approve public wishes to show them in the feed'}</p>
      </div>
      {state === 'loading' ? (
        <div role="status" aria-label="Loading wishes" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1].map((i) => (
            <div key={i} className="lv-skel" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <i style={{ width: '40%', height: 12 }} />
              <i style={{ width: '90%', height: 12 }} />
            </div>
          ))}
        </div>
      ) : state === 'error' ? (
        <div className="lv-state" role="alert">
          <Icon name="cloudOff" size={22} />
          Could not load the wishes.
          <button type="button" className="lv-btn" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : wishes.length === 0 ? (
        <div className="lv-state">
          <Icon name="message" size={22} />
          No wishes yet. Share your invite link to collect some.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(limit ? wishes.slice(0, limit) : wishes).map((w) => (
            <div className="lv-mod" key={w.id}>
              <div className="lv-mod-top">
                <span className="lv-wish-name">{w.authorName}</span>
                <span className="lv-status">{statusText(w)}</span>
              </div>
              <p className="lv-wish-msg">
                {w.type === 'video'
                  ? `Video wish${w.durationSeconds ? ` (${formatClock(w.durationSeconds)})` : ''}${w.message && w.message !== '[Video Wish]' ? `: ${w.message}` : ''}`
                  : w.message}
              </p>
              <div className="lv-btn-row">
                {w.type === 'video' && w.videoUrl ? (
                  <button type="button" className="lv-btn" onClick={() => onPlay(w)}>
                    <Icon name="play" size={16} /> Watch
                  </button>
                ) : null}
                {w.visibility === 'public' && w.status !== 'approved' ? (
                  <button type="button" className="lv-btn lv-btn--primary" disabled={busyId === w.id} onClick={() => onApprove(w)}>
                    <Icon name="check" size={16} /> Approve
                  </button>
                ) : null}
                {w.status !== 'hidden' ? (
                  <button type="button" className="lv-btn" disabled={busyId === w.id} onClick={() => onHide(w)}>
                    <Icon name="eyeOff" size={16} /> Hide
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {limit && wishes.length > limit ? (
            <button type="button" className="lv-btn" onClick={() => onSeeAll?.()}>
              See all <Icon name="arrow" size={16} />
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
