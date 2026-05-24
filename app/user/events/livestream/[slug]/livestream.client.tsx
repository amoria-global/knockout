'use client';

import LiveStreamApp from '../../../../pages/events/live-stream';

/**
 * Thin client wrapper for the live-stream page. Receives the resolved
 * event id as a prop (the slug page does the slug->id translation in
 * its server loader) and passes it through, so the URL stays at the
 * slug-based canonical path.
 *
 * The optional viewerId prop is set by the
 * /user/events/livestream/{slug}/{viewerId} route - it's the paid
 * anonymous viewer's "watch id" (UUID anchoring access + device +
 * payment + name/email/phone in anonymous_stream_viewers).
 */
export default function LivestreamClient({
  eventId,
  viewerId,
}: { eventId: string; viewerId?: string }) {
  return <LiveStreamApp eventIdProp={eventId} viewerIdProp={viewerId} />;
}
