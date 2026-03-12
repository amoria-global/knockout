'use client';

import { useSearchParams } from 'next/navigation';
import EventStreamPage from '../../../pages/events/event-stream';

export default function LiveStream() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '';
  return <EventStreamPage eventId={eventId} />;
}
