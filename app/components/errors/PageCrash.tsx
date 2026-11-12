'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { FullScreenError } from './FullScreenError';
import { makeSupportCode, type Presentation } from '@/lib/errorSystem/presentError';
import { reportPageCrash } from '@/lib/errorSystem/report';

/**
 * What a visitor sees when a whole page crashed: the shared full-screen error, with "Try again" and "Go to Home" and a
 * short support code to read out. The same code goes to Sentry with the crash (level fatal), so support can find it.
 * Used by the route boundary (`app/error.tsx`), the root boundary (`app/global-error.tsx`) and the layout's
 * `ErrorBoundary`.
 */
export function crashPresentation(supportCode: string): Presentation {
  return {
    kind: 'fullscreen',
    tone: 'danger',
    title: 'Something went wrong on this page',
    message: 'We have been told about it. Try again, or go back to Home.',
    actions: [
      { id: 'retry', label: 'Try again' },
      { id: 'home', label: 'Go to Home' },
    ],
    supportCode,
  };
}

/** What a boundary hands over can be any thrown value; only an Error has a message and, from the server, a digest. */
function digestOf(error: unknown): string | undefined {
  const d = (error as { digest?: unknown } | null | undefined)?.digest;
  return typeof d === 'string' ? d : undefined;
}

export function PageCrash({ error, retry }: { error: unknown; retry: () => void }) {
  const supportCode = useMemo(() => makeSupportCode(), []);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    reportPageCrash(error, supportCode, digestOf(error));
  }, [error, supportCode]);

  return (
    <FullScreenError
      presentation={crashPresentation(supportCode)}
      onAction={(id) => {
        if (id === 'retry') retry();
        else if (typeof window !== 'undefined') window.location.assign('/');
      }}
    />
  );
}
