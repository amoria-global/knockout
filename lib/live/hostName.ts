/**
 * Who the host is, for the viewer: the event creator's name first, then the organizer, then the photographer. Never the
 * word "Organizer". The avatar follows the same order (the organizer is a name only, so it has none).
 *
 * Reads the public event as the backend returns it: `creator` and `photographer` carry name and picture only (contact
 * details are already removed there), `eventOrganizer` is a plain name, `photographerName` the older flat field.
 */

type Person = { firstName?: string | null; lastName?: string | null; profilePicture?: string | null } | null | undefined;

export type PublicEventHost = {
  creator?: Person;
  photographer?: Person;
  eventOrganizer?: string | null;
  photographerName?: string | null;
};

export const HOST_FALLBACK = 'Host';

function clean(s: unknown): string {
  return typeof s === 'string' ? s.trim() : '';
}

function personName(p: Person): string {
  if (!p) return '';
  return `${clean(p.firstName)} ${clean(p.lastName)}`.trim();
}

export function resolveHostName(ev: PublicEventHost | null | undefined): string {
  if (!ev) return HOST_FALLBACK;
  return (
    personName(ev.creator) ||
    clean(ev.eventOrganizer) ||
    clean(ev.photographerName) ||
    personName(ev.photographer) ||
    HOST_FALLBACK
  );
}

export function resolveHostAvatar(ev: PublicEventHost | null | undefined): string | undefined {
  if (!ev) return undefined;
  return clean(ev.creator?.profilePicture) || clean(ev.photographer?.profilePicture) || undefined;
}
