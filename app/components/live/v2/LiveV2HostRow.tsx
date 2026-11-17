'use client';

import { useEffect, useState } from 'react';
import { getPublicEventById } from '@/lib/APIs/public/get-events/route';
import { resolveHostAvatar, resolveHostName, type PublicEventHost } from '@/lib/live/hostName';

/**
 * The host row under the player in the new layout: avatar with a live ring, event title, the host's real name, then Gift
 * (magenta) and Like. The name and picture come from the public event itself (creator, then organizer, then
 * photographer), read once here so the page's own data code is not touched. The line under the title reads
 * "Host name · Live 42 min · 128 watching". The minutes come from the event's liveForSeconds (counted on the server
 * from the go-live time) plus the time since it was read, so the row needs no time zone and stays right without another
 * request. Nothing is shown for the minutes until the server sends it.
 *
 * Gift and Like only call the page's existing handlers.
 */
export function LiveV2HostRow({
  eventId,
  title,
  live,
  showGift,
  viewers,
  onGift,
  onLike,
}: {
  eventId: string;
  title: string;
  live: boolean;
  showGift: boolean;
  viewers?: number | null;
  onGift: () => void;
  onLike: () => void;
}) {
  const [host, setHost] = useState<PublicEventHost | null>(null);
  // Seconds the event had been live when it was read, and when that was. Null until the server says.
  const [liveBase, setLiveBase] = useState<{ seconds: number; readAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    getPublicEventById(eventId)
      .then((res) => {
        if (!alive || !res?.success || !res.data) return;
        setHost(res.data as unknown as PublicEventHost);
        const secs = (res.data as unknown as { liveForSeconds?: unknown }).liveForSeconds;
        if (typeof secs === 'number' && secs >= 0) setLiveBase({ seconds: secs, readAt: Date.now() });
      })
      .catch(() => {
        /* the row simply keeps its fallback name */
      });
    return () => {
      alive = false;
    };
  }, [eventId]);

  // Keep the minutes moving while the event is live.
  useEffect(() => {
    if (!live || !liveBase) return;
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, [live, liveBase]);

  const avatar = resolveHostAvatar(host);
  const name = host ? resolveHostName(host) : '';
  const minutes = live && liveBase ? Math.max(0, Math.floor((liveBase.seconds + (now - liveBase.readAt) / 1000) / 60)) : null;
  const subParts = [
    name,
    minutes !== null ? `Live ${minutes < 1 ? 'just now' : `${minutes} min`}` : null,
    live && typeof viewers === 'number' && viewers > 0 ? `${viewers.toLocaleString()} watching` : null,
  ].filter(Boolean) as string[];

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
        <p className="ls-v2-sub">{subParts.length ? subParts.map((part, i) => (
          <span key={i}>{i > 0 ? ' · ' : ''}{part.startsWith('Live') ? <b className="ls-v2-livetime">{part}</b> : part}</span>
        )) : ' '}</p>
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
