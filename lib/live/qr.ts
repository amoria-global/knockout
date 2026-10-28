/**
 * The wish link and the QR for it. The link opens the wish page (/wish/<id>); the same link is
 * encoded by the mobile app (features/wishes/qrPng.ts), so a code saved on either platform scans to the same place.
 */
import { brandedQrPngDataUrl } from '@/lib/qr/brandedQr';

export { wishLink } from '@/lib/wishes/wishPage';

/** A PNG data URL of the code: navy on white, with a quiet zone and the Connekyt logo icon in the middle (see lib/qr/brandedQr). */
export function qrDataUrl(link: string, width = 480): Promise<string> {
  return brandedQrPngDataUrl(link, { width });
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
