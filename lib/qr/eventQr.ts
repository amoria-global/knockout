/**
 * Event QR helpers shared by the scan gate.
 *
 * The QR code printed by the dashboards encodes
 *   https://connekyt.com/user/events/view-event?id=<eventId>&src=qr
 * proxy.ts 301s that to the canonical slug page and keeps `src`, so a scan
 * lands on the same page as any other event link, flagged as a QR visit.
 */

export const QR_SOURCE_PARAM = 'src';
export const QR_SOURCE_VALUE = 'qr';

export const ANDROID_PACKAGE = 'com.amoria.connekyt.app';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

/** Deep link the installed app handles (src/app/(public)/scan/[id].tsx in connekt-mobile). */
export function appDeepLink(eventId: string): string {
  return `connekt://scan/${encodeURIComponent(eventId)}`;
}

export type MobilePlatform = 'android' | 'ios' | null;

/** Phones and tablets only. Desktop browsers return null and skip the gate. */
export function detectMobilePlatform(): MobilePlatform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  // iPadOS 13+ reports itself as a Mac but has a touch screen.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  return null;
}
