'use client';

import { PageCrash } from './components/errors/PageCrash';

/** Next.js route-level boundary: a page below the root layout crashed. */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <PageCrash error={error} retry={retry} />;
}
