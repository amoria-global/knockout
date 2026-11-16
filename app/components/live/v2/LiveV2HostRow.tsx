'use client';

import { useEffect, useState } from 'react';
import { getPublicEventById } from '@/lib/APIs/public/get-events/route';
import { resolveHostAvatar, resolveHostName, type PublicEventHost } from '@/lib/live/hostName';

/**
 * The host row under the player in the new layout: avatar with a live ring, event title, the host's real name, then Gift
 * (magenta) and Like. The name and picture come from the public event itself (creator, then organizer, then
 * photographer), read once here so the page's own data code is not touched. The live duration is left out on purpose:
 * the actual go-live time is not part of what the public event returns, and a scheduled start would be a guess.
 *
 * Gift and Like only call the page's existing handlers.
 */
export function LiveV2HostRow({
  eventId,
  title,
  live,
  showGift,
  onGift,
  onLike,
}: {
  eventId: string;
  title: string;
  live: boolean;
  showGift: boolean;
  onGift: () => void;
  onLike: () => void;
}) {
  const [host, setHost] = useState<PublicEventHost | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    getPublicEventById(eventId)
      .then((res) => {
        if (alive && res?.success && res.data) setHost(res.data as unknown as PublicEventHost);
      })
      .catch(() => {
        /* the row simply keeps its fallback name */
      });
    return () => {
      alive = false;
    };
  }, [eventId]);

  const avatar = resolveHostAvatar(host);
  const name = host ? resolveHostName(host) : '';

  return (
    <div className="ls-v2-host">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={`ls-v2-avatar${live ? ' ls-v2-avatar--live' : ''}`} src={avatar} alt="" />
      ) : (
        <span className={`ls-v2-avatar${live ? ' ls-v2-avatar--live' : ''}`} aria-hidden="true">
          <i className="bi bi-person-fill" />
        </span>
      )}
      <div className="ls-v2-host-meta">
        <h1 className="ls-v2-title">{title}</h1>
        <p className="ls-v2-sub">{name || ' '}</p>
      </div>
      {showGift ? (
        <button type="button" className="ls-v2-gift" onClick={onGift} aria-label="Send a gift">
          <i className="bi bi-gift-fill" aria-hidden="true" />
          Gift
        </button>
      ) : null}
      <button type="button" className="ls-v2-like" onClick={onLike} aria-label="Like">
        <i className="bi bi-heart" aria-hidden="true" />
      </button>
    </div>
  );
}
