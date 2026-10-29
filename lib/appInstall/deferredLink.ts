/**
 * Saves where the visitor was going before they are sent to the store, so the installed app can take them there after
 * sign-up (see the backend's DeferredLinkService). It calls the backend directly, not through /api/proxy: the proxy hides
 * the visitor's address behind the website's own, and the iPhone best-guess match depends on seeing the real one.
 * Best effort: a slow or failed save must never keep anyone from the store, so it gives up after a moment and returns null.
 */
import type { MobilePlatform } from '@/lib/qr/eventQr';

const SAVE_TIMEOUT_MS = 1500;

function backendBase(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com/';
  return url.endsWith('/') ? url : `${url}/`;
}

export async function saveDeferredLink(destination: string, platform: Exclude<MobilePlatform, null>): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS);
  try {
    const res = await fetch(`${backendBase()}api/remote/public/deferred-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, platform }),
      signal: controller.signal,
    });
    const json = (await res.json()) as { action?: number; data?: { code?: unknown } };
    const code = json?.action === 1 ? json.data?.code : null;
    return typeof code === 'string' && /^[A-Z0-9]{6,12}$/.test(code) ? code : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
