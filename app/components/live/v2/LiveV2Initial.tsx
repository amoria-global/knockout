'use client';

import { nameColor, nameInitial } from '@/lib/live/nameColor';

/** A coloured initial in place of the grey default picture, in the new layout only. Purely presentational. */
export function LiveV2Initial({ name }: { name: string }) {
  const { fill } = nameColor(name);
  return (
    <span className="ls-v2-initial" style={{ background: fill }} aria-hidden="true">
      {nameInitial(name)}
    </span>
  );
}
