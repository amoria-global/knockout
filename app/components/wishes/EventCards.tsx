'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { calendarUrl, eventWhen, type WhenInput } from '@/lib/events/eventWhen';
import type { HostRow } from '@/lib/events/hostRows';

/**
 * Date and time as one card ("Fri, 27 Nov 2026" over "4:11 PM · Kigali time (CAT)") with an Add to calendar link built
 * from the event's own date. Venue and capacity rows sit under them in the same card. Same card on mobile.
 */
export function EventWhenCard({ event, title, location, children }: { event: WhenInput; title: string; location?: string | null; children?: ReactNode }) {
  const when = eventWhen(event);
  const url = calendarUrl({ ...event, title, location });
  if (!when.date && !when.time && !children) return null;
  return (
    <section className="wm-card wm" aria-label="Date and time">
      {when.date || when.time ? (
        <div className="wm-when">
          <span className="wm-ico wm-ico--blue"><i className="bi bi-calendar-event" aria-hidden="true" /></span>
          <div className="wm-when-text">
            <div className="wm-when-date">{when.date}</div>
            {when.time ? <div className="wm-when-time">{when.time}</div> : null}
          </div>
          {url ? (
            <a className="wm-btn wm-btn--outline" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Add ${title} to your calendar`}>Add to calendar</a>
          ) : null}
        </div>
      ) : null}
      {children ? <div className="wm-when-rows">{children}</div> : null}
    </section>
  );
}

/**
 * One "Hosted by" card. The organizer and the photographer share a row with both role chips when they are the same user
 * (compared by id, see lib/events/hostRows.ts), and get a row each when they are not. A row with a photographer id opens
 * that photographer's profile.
 */
export function HostedByCard({ rows }: { rows: HostRow[] }) {
  if (!rows.length) return null;
  return (
    <section className="wm-card wm" aria-label="Hosted by">
      {rows.map((r, i) => {
        const inner = (
          <>
            <span className="wm-host-av">
              <Avatar row={r} />
            </span>
            <span>
              {i === 0 ? <span className="wm-host-label" style={{ display: 'block' }}>Hosted by</span> : null}
              <span className="wm-host-name" style={{ display: 'block' }}>{r.name}</span>
              <span className="wm-chips">
                {r.roles.map((role) => (
                  <span key={role} className={`wm-chip ${role === 'ORGANIZER' ? 'wm-chip--org' : 'wm-chip--pho'}`}>{role}</span>
                ))}
              </span>
            </span>
            {r.photographerId ? <i className="bi bi-chevron-right wm-host-chev" aria-hidden="true" /> : null}
          </>
        );
        return r.photographerId ? (
          <a key={r.key} className="wm-host" href={`/user/photographers/view-profile?id=${encodeURIComponent(r.photographerId)}`} aria-label={`${r.name}, ${r.roles.join(' and ').toLowerCase()}. Open profile`}>{inner}</a>
        ) : (
          <div key={r.key} className="wm-host">{inner}</div>
        );
      })}
    </section>
  );
}

/** The host's picture, or the role icon when there is none or it will not load. */
function Avatar({ row }: { row: HostRow }) {
  const [failed, setFailed] = useState(false);
  return row.image && !failed ? (
    <img src={row.image} alt="" onError={() => setFailed(true)} />
  ) : (
    <i className={`bi ${row.roles.includes('PHOTOGRAPHER') ? 'bi-camera-fill' : 'bi-mic-fill'}`} aria-hidden="true" />
  );
}
