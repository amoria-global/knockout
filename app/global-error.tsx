'use client';

import { PageCrash } from './components/errors/PageCrash';

/**
 * Next.js root boundary: the root layout itself crashed, so there is no provider, navbar or stylesheet to lean on. It
 * must render its own html and body. The screen is the same one visitors see for any page crash.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <PageCrash error={error} retry={retry} />
      </body>
    </html>
  );
}
