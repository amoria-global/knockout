import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Stable device identifier for the *user's* browser/device.
 *
 * Closest browser equivalent to `node-machine-id` (which can't run in a
 * web page — `/etc/machine-id`, `IOPlatformUUID`, and the equivalent
 * Windows registry key are off-limits to JS in a sandboxed browser):
 *
 *   1. **Hardware fingerprint** via FingerprintJS — canvas + audio + GPU
 *      + screen + CPU concurrency. Stable across browser restarts on the
 *      same machine.
 *   2. **Persistent UUID** in localStorage — anchors the id to *this
 *      browser profile* so it survives FingerprintJS drift after a
 *      browser/OS update.
 *   3. Both are concatenated, SHA-256 hashed, and truncated to 16 hex
 *      chars (mirrors the node-machine-id snippet on the desktop app
 *      so server-side reasoning is symmetric).
 *
 * Format helpers below match the desktop app's XXXX-XXXX-XXXX-XXXX UI
 * display.
 */

const STORAGE_KEY = 'amoria_device_anchor';
let cachedDeviceId: string | null = null;
let loadPromise: Promise<string> | null = null;

/** SHA-256 of `input` truncated to 16 hex chars (Web Crypto, browser-native). */
async function sha256Trunc16(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 16);
}

/**
 * Get the unique device ID (hashed, 16 hex chars).
 * Equivalent in spirit to node-machine-id's `machineIdSync()` but
 * derived from browser-accessible signals.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    let visitorId = '';
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      visitorId = result.visitorId;
    } catch {
      // FingerprintJS failed - we still proceed with the localStorage
      // anchor alone. The id will be stable per-browser-profile but
      // not cross-profile on the same machine.
    }

    let anchor = '';
    if (typeof window !== 'undefined') {
      anchor = localStorage.getItem(STORAGE_KEY) || '';
      if (!anchor) {
        anchor = crypto.randomUUID();
        try { localStorage.setItem(STORAGE_KEY, anchor); } catch { /* private mode */ }
      }
    } else {
      // SSR safety — should never happen since getDeviceId is only
      // called client-side, but guard against accidental imports.
      anchor = 'ssr-no-anchor';
    }

    const id = await sha256Trunc16(visitorId + '|' + anchor);
    cachedDeviceId = id;
    return id;
  })();

  return loadPromise;
}

/** Format device ID for display: 16 hex chars → XXXX-XXXX-XXXX-XXXX. */
export function formatDeviceId(deviceId: string): string {
  const cleaned = deviceId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const segments = cleaned.match(/.{1,4}/g) || [];
  return segments.join('-');
}

/** Validate a device ID is 16 hex characters (with or without dashes). */
export function isValidDeviceId(deviceId: string): boolean {
  const cleaned = deviceId.replace(/-/g, '');
  return /^[A-Fa-f0-9]{16}$/.test(cleaned);
}
