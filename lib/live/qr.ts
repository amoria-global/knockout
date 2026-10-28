/**
 * The wish link and the QR for it. The link opens the public event page on its wishes section; the same link is
 * encoded by the mobile app (features/wishes/qrPng.ts), so a code saved on either platform scans to the same place.
 */
import QRCode from 'qrcode';

export function wishLink(eventId: string, origin = 'https://connekyt.com'): string {
  return `${origin}/user/events/view-event?id=${encodeURIComponent(eventId)}&tab=wishes`;
}

/** A PNG data URL of the code: navy on white, with a quiet zone. */
export function qrDataUrl(link: string, width = 480): Promise<string> {
  return QRCode.toDataURL(link, { errorCorrectionLevel: 'M', margin: 2, width, color: { dark: '#083A85', light: '#FFFFFF' } });
}

/** Downloads the QR as a PNG file. */
export async function downloadQr(link: string, eventId: string): Promise<void> {
  const url = await qrDataUrl(link, 720);
  const a = document.createElement('a');
  a.href = url;
  a.download = `connekyt-wish-qr-${eventId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
