import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { BADGE_SHARE, buildBrandedQr, brandedQrSvg } from './brandedQr';

const payloads = [
  'https://connekyt.com/get-app',
  'https://connekyt.com/user/events/view-event?id=8bcd3a91-89da-424e-beb6-a6761c308c0a&src=qr',
  'https://connekyt.com/wish/8bcd3a91-89da-424e-beb6-a6761c308c0a?from=Grace',
  `https://connekyt.com/wish/8bcd3a91-89da-424e-beb6-a6761c308c0a?from=Jean-Luc%20Mukamana-Uwase&x=${'y'.repeat(80)}`,
  'otpauth://totp/Connekyt:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Connekyt',
];

describe('branded QR keeps its function', () => {
  it('uses error correction H and covers under 6% of the modules with the logo badge', () => {
    for (const p of payloads) {
      const q = buildBrandedQr(p);
      expect(q.covered).toBeLessThan(0.06);
      expect(q.badge.side / q.n).toBeGreaterThan(BADGE_SHARE - 0.06);
      expect(q.badge.side / q.n).toBeLessThan(0.3);
    }
  });

  it('leaves every module outside the badge exactly as the plain code has it, so the finder patterns and timing lines are whole', () => {
    const p = payloads[1];
    const plain = QRCode.create(p, { errorCorrectionLevel: 'H' }).modules;
    const q = buildBrandedQr(p, 0);
    const drawn = new Set<string>();
    for (const m of q.path.matchAll(/M(\d+) (\d+)h(\d+)v1/g)) for (let i = 0; i < +m[3]; i++) drawn.add(`${+m[2]},${+m[1] + i}`);
    const lo = q.badge.x;
    const hi = lo + q.badge.side - 1;
    for (let r = 0; r < plain.size; r++) {
      for (let c = 0; c < plain.size; c++) {
        const inside = r >= lo && r <= hi && c >= lo && c <= hi;
        expect(drawn.has(`${r},${c}`)).toBe(inside ? false : !!plain.get(r, c));
      }
    }
  });

  it('embeds the logo in the SVG, so a saved or printed code carries it', () => {
    const svg = brandedQrSvg(payloads[0]);
    expect(svg).toContain('<image');
    expect(svg).toContain('data:image/jpeg;base64,');
    expect(svg).toContain('viewBox=');
  });

  for (const p of payloads) {
    for (const px of [220, 480, 900]) {
      it(`a real decoder reads it back: ${p.length} characters at ${px}px`, async () => {
        const { data, info } = await sharp(Buffer.from(brandedQrSvg(p)), { density: 300 }).resize(px, px).flatten({ background: '#ffffff' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        expect(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data).toBe(p);
      });
    }
  }
});
