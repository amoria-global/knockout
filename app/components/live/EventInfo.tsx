'use client';

import type { EventAccess } from '@/lib/live/types';
import { Icon } from './icons';

export const accessLabel = (a: EventAccess) => (a === 'ticket' ? 'Ticket' : 'Free');

/** Text, never colour alone. */
export function AccessChip({ access }: { access: EventAccess }) {
  return (
    <span className="lv-chip" aria-label={`Access: ${accessLabel(access)}`}>
      {accessLabel(access)}
    </span>
  );
}

/** Section 3: title, tagline, location and host. Same props on mobile. */
export function EventInfo({
  title,
  tagline,
  location,
  hostName,
  live,
  viewerCount,
}: {
  title: string;
  tagline?: string;
  location?: string;
  hostName: string;
  live: boolean;
  viewerCount: number | null;
}) {
  return (
    <section className="lv-info" aria-label="Event details">
      <h2>{title}</h2>
      {tagline ? <p className="lv-tagline">{tagline}</p> : null}
      <div className="lv-info-row">
        <span>
          Hosted by <strong>{hostName}</strong>
        </span>
        <span>
          {live ? 'Live now' : 'Not live'}
          {viewerCount != null ? ` · ${viewerCount.toLocaleString('en-US')} watching` : ''}
        </span>
        {location ? (
          <span aria-label={`Location: ${location}`}>
            <Icon name="pin" size={16} />
            {location}
          </span>
        ) : null}
      </div>
    </section>
  );
}
