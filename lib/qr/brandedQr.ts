/**
 * Every QR code the platform draws is made here: navy modules on white with the Connekyt logo icon in the middle.
 *
 * It still scans because of three rules, which tests pin:
 *   1. Error correction is always H (a third of the code can be lost).
 *   2. The white badge behind the logo covers about 21% of the code's width, under 5% of its modules, far inside what H
 *      repairs. Nothing outside the badge is touched, so the corner finder patterns and the timing lines stay whole.
 *   3. The code keeps a white margin (the quiet zone) around it.
 * The same maths is used by the mobile app (src/features/qr) and the backend (QrLogo) so a code looks the same everywhere.
 */
import QRCode from 'qrcode';
import { BRAND_MARK_DATA_URI } from './brandMark';

export const NAVY = '#083A85';
/** The badge's share of the code's width; the mark fills most of it. */
export const BADGE_SHARE = 0.21;
export const MARK_FILL = 0.84;

export type BrandedQr = {
  /** Modules per side (no margin). */
  n: number;
  /** Side of the drawing in module units, margin included. */
  size: number;
  /** SVG path of the dark modules, with the badge area left empty. */
  path: string;
  /** The badge square and the mark inside it, in module units. */
  badge: { x: number; y: number; side: number };
  mark: { x: number; y: number; side: number };
  /** Modules covered by the badge as a share of all modules. */
  covered: number;
};

export function buildBrandedQr(value: string, margin = 2): BrandedQr {
  const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  let side = Math.max(5, Math.round(n * BADGE_SHARE));
  if ((n - side) % 2 !== 0) side += 1; // centred on the module grid
  const start = (n - side) / 2;
  const end = start + side - 1;
  const inBadge = (r: number, c: number) => r >= start && r <= end && c >= start && c <= end;

  let path = '';
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (qr.modules.get(r, c) && !inBadge(r, c)) {
        const from = c;
        while (c < n && qr.modules.get(r, c) && !inBadge(r, c)) c++;
        path += `M${from + margin} ${r + margin}h${c - from}v1h-${c - from}z`;
      } else {
        c++;
      }
    }
  }
  const markSide = side * MARK_FILL;
  const markOff = start + (side - markSide) / 2;
  return {
    n,
    size: n + margin * 2,
    path,
    badge: { x: start + margin, y: start + margin, side },
    mark: { x: markOff + margin, y: markOff + margin, side: markSide },
    covered: (side * side) / (n * n),
  };
}

const round = (v: number) => Math.round(v * 1000) / 1000;

/** The finished code as an SVG string (the logo is embedded, so it survives being saved or printed on its own). */
export function brandedQrSvg(value: string, { fg = NAVY, bg = '#FFFFFF', margin = 2 }: { fg?: string; bg?: string; margin?: number } = {}): string {
  const q = buildBrandedQr(value, margin);
  const b = q.badge;
  const m = q.mark;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${q.size} ${q.size}" shape-rendering="crispEdges" role="img" aria-label="QR code">` +
    `<rect width="${q.size}" height="${q.size}" fill="${bg}"/>` +
    `<path d="${q.path}" fill="${fg}"/>` +
    `<rect x="${round(b.x)}" y="${round(b.y)}" width="${b.side}" height="${b.side}" rx="${round(b.side * 0.22)}" fill="${bg}"/>` +
    `<image href="${BRAND_MARK_DATA_URI}" xlink:href="${BRAND_MARK_DATA_URI}" x="${round(m.x)}" y="${round(m.y)}" width="${round(m.side)}" height="${round(m.side)}" preserveAspectRatio="xMidYMid meet" shape-rendering="auto"/>` +
    `</svg>`
  );
}

let markImage: Promise<HTMLImageElement> | null = null;
function loadMark(): Promise<HTMLImageElement> {
  markImage ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The logo could not be loaded'));
    img.src = BRAND_MARK_DATA_URI;
  });
  return markImage;
}

/** The finished code as a PNG data URL (browser only), `width` pixels wide. */
export async function brandedQrPngDataUrl(value: string, { width = 480, fg = NAVY, bg = '#FFFFFF', margin = 2 }: { width?: number; fg?: string; bg?: string; margin?: number } = {}): Promise<string> {
  const q = buildBrandedQr(value, margin);
  const scale = Math.max(1, Math.round(width / q.size));
  const px = q.size * scale;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  ctx.scale(scale, scale);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, q.size, q.size);
  ctx.fillStyle = fg;
  ctx.fill(new Path2D(q.path));
  const b = q.badge;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.side, b.side, b.side * 0.22);
  ctx.fill();
  const img = await loadMark();
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, q.mark.x, q.mark.y, q.mark.side, q.mark.side);
  return canvas.toDataURL('image/png');
}
