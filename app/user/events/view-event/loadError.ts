/**
 * What the event page shows when the event cannot be loaded. The backend answers
 * 404 for both a missing event and an event that is not open to the public yet;
 * only the message tells them apart, so it is matched here in one place.
 */
export const EVENT_NOT_OPEN_MESSAGE = 'This event is not open to the public yet.';

export type EventLoadFailure = 'not-open' | 'not-found' | 'offline';

export interface EventLoadFailureCopy {
  kind: EventLoadFailure;
  icon: string;
  title: string;
  body: string;
  /** Offer a retry button (the cause may be temporary). */
  canRetry: boolean;
}

export function classifyEventLoadError(error: string | null | undefined, networkFailure = false): EventLoadFailureCopy {
  if (networkFailure) {
    return {
      kind: 'offline',
      icon: 'bi-wifi-off',
      title: 'We could not load this event',
      body: 'Check your internet connection and try again.',
      canRetry: true,
    };
  }
  if ((error || '').trim() === EVENT_NOT_OPEN_MESSAGE) {
    return {
      kind: 'not-open',
      icon: 'bi-hourglass-split',
      title: 'This event is not open yet',
      body: 'The organiser has not opened this event to guests. Please check back soon, or ask them to confirm the link.',
      canRetry: true,
    };
  }
  return {
    kind: 'not-found',
    icon: 'bi-exclamation-triangle',
    title: 'Event not found',
    body: 'The event may have been removed, or the link may be incorrect.',
    canRetry: false,
  };
}
