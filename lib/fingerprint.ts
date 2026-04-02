import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedVisitorId: string | null = null;
let loadPromise: Promise<string> | null = null;

/**
 * Get a stable, hardware-derived device identifier using FingerprintJS.
 * Reads GPU, CPU cores, canvas, audio, screen to create a unique device fingerprint.
 * The result is cached for the lifetime of the page.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedVisitorId) return cachedVisitorId;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      cachedVisitorId = result.visitorId;
      return cachedVisitorId;
    } catch {
      // Fallback: generate a random ID and persist in localStorage
      const stored = typeof window !== 'undefined' ? localStorage.getItem('deviceFingerprint') : null;
      if (stored) {
        cachedVisitorId = stored;
        return stored;
      }
      const fallback = crypto.randomUUID();
      if (typeof window !== 'undefined') {
        localStorage.setItem('deviceFingerprint', fallback);
      }
      cachedVisitorId = fallback;
      return fallback;
    }
  })();

  return loadPromise;
}
