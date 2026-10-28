'use client';

import { useState } from 'react';
import { wishLink } from '@/lib/wishes/wishPage';

/** "Invite someone else": the Web Share API where there is one, else the link is copied. */
export function InviteSomeone({ eventId, title }: { eventId: string; title: string }) {
  const [note, setNote] = useState<string | null>(null);
  const onClick = async () => {
    const url = wishLink(eventId);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `Send a wish · ${title}`, url });
        return;
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote('Link copied.');
    } catch {
      setNote('Could not copy the link.');
    }
  };
  return (
    <button type="button" onClick={onClick} aria-live="polite">
      {note ?? 'Invite someone else'}
    </button>
  );
}
