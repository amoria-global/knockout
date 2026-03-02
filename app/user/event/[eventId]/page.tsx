import EventStreamPage from '../../../pages/events/event-stream';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { eventId } = await params;
  return <EventStreamPage eventId={eventId} />;
}
