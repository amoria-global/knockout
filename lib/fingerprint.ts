import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Cross-browser stable device identifier.
 *
 * Goal: same machine = same id, even when the user switches between
 * Chrome / Firefox / Safari / Edge. Browser-level signals (canvas,
 * fonts, userAgent, localStorage anchors) are intentionally excluded
 * because they differ across browsers on the same OS.
 *
 * Signals used (all OS / hardware-bound, identical across browsers):
 *   • navigator.hardwareConcurrency  — CPU logical cores
 *   • navigator.deviceMemory         — RAM bucket (when exposed)
 *   • screen resolution + colorDepth — display hardware
 *   • Intl timezone                  — OS locale
 *   • WebGL UNMASKED_RENDERER + VENDOR — GPU
 *   • FingerprintJS audio component  — AudioContext fingerprint (OS audio stack)
 *
 * Notably NOT used: canvas (browser-specific rendering), fonts
 * (browser-specific font list), userAgent, languages, localStorage
 * UUIDs - all of which would break cross-browser stability.
 *
 * Hashed with SHA-256, truncated to 16 hex chars to mirror the
 * desktop app's node-machine-id format (XXXX-XXXX-XXXX-XXXX via
 * formatDeviceId helper).
 *
 * Caveats:
 *   • Two devices with literally identical hardware + locale collide.
 *     Acceptable for this use case - the viewerId is the identity;
 *     the device id only answers "is this the same device coming back?"
 *   • Browsers with strict anti-fingerprinting (Tor Browser, Firefox
 *     resistFingerprinting=true) return spoofed signals - same machine
 *     will look like a different device. Acceptable; those users opt
 *     into being unidentifiable.
 */

let cachedDeviceId: string | null = null;
let loadPromise: Promise<string> | null = null;

/** SHA-256 → first 16 hex chars (Web Crypto, browser-native). */
async function sha256Trunc16(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 16);
}

/** WebGL GPU vendor + renderer. Same hardware → same string regardless
 *  of browser. Returns empty if WebGL isn't available or the debug ext
 *  is blocked. */
function readGpu(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';
    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) as string;
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
    return `${vendor || ''}|${renderer || ''}`;
  } catch {
    return '';
  }
}

/**
 * Get the cross-browser stable device ID (16 hex chars).
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // FingerprintJS gives us the audio component (the only browser
    // signal we want - it's derived from the OS audio stack and
    // matches across browsers). We discard its overall visitorId.
    let audioSig = '';
    try {
      const fp = await FingerprintJS.load();
      const r = await fp.get();
      const audioComp = (r.components as Record<string, { value?: unknown }>).audio;
      const v = audioComp?.value;
      if (typeof v === 'number') audioSig = String(v.toFixed(6));
      else if (typeof v === 'string') audioSig = v;
      else if (v != null) audioSig = JSON.stringify(v);
    } catch { /* OS audio API blocked; degrade gracefully */ }

    const hardwareSig = JSON.stringify({
      cpu: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 0 : 0,
      mem: (typeof navigator !== 'undefined' && 'deviceMemory' in navigator)
            ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0 : 0,
      scr: typeof screen !== 'undefined'
            ? `${screen.width}x${screen.height}@${screen.colorDepth}` : '',
      tz: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
      gpu: typeof document !== 'undefined' ? readGpu() : '',
      audio: audioSig,
    });

    const id = await sha256Trunc16(hardwareSig);
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
