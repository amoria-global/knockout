'use client';

import { useEffect, useState } from 'react';
import { LIVE_V2_COOKIE, LIVE_V2_VALUE } from './viewerV2';

/**
 * Whether the new livestream layout is on for this browser. The server decides (proxy.ts) and leaves the `lv_ui`
 * cookie; this only reads it, after mount so the server render and the first client render agree. Reads no account
 * data and calls nothing: with the switch off it is always false.
 */
export function useLiveV2(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      const has = document.cookie.split('; ').some((c) => c === `${LIVE_V2_COOKIE}=${LIVE_V2_VALUE}`);
      setOn(has);
    } catch {
      setOn(false);
    }
  }, []);
  return on;
}
