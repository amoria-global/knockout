'use client';

import LiveStreamApp from '../../../../pages/events/live-stream';

/**
 * Thin client wrapper for the live-stream page. Receives the resolved
 * event id as a prop (the slug page does the slug->id translation in
 * its server loader) and passes it through, so the URL stays at the
 * slug-based canonical path.
 */
export default function LivestreamClient({ eventId }: { eventId: string }) {
  return <LiveStreamApp eventIdProp={eventId} />;
}
