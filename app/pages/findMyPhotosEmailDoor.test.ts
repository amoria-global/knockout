import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * docs/PAYMENTS.md rule 6 keeps two unlock doors, code and email. Since
 * 2026-10-11 the email door proves control of the inbox: the backend emails
 * the codes and returns no buyerId (the buyerId alone downloads paid photos,
 * so returning it to whoever typed an address handed out other people's
 * purchases). find-my-photos must not store or use a null buyerId, and must
 * continue a purchase as a guest when identify answers VERIFY_EMAIL.
 */
const SRC = readFileSync(path.join(__dirname, 'find-my-photos.tsx'), 'utf8').replace(/\r\n/g, '\n');

describe('find-my-photos email door', () => {
    it('handles VERIFY_EMAIL as a guest checkout without storing a buyerId', () => {
        const start = SRC.indexOf("if (status === 'VERIFY_EMAIL' || !newBuyerId) {");
        expect(start).toBeGreaterThan(-1);
        const branch = SRC.slice(start, SRC.indexOf('return;', start));
        expect(branch).toContain('setGuestCheckoutAlbumId(ctx.albumId)');
        expect(branch).toContain('proceedToPayment(photos)');
        expect(branch).not.toContain('setBuyerId(');
        expect(branch).not.toContain('album_buyer_id:');
    });

    it('treats the email unlock as "codes sent", never as an unlock', () => {
        const start = SRC.indexOf('if (res.data.emailSent || !res.data.buyerId) {');
        expect(start).toBeGreaterThan(-1);
        const branch = SRC.slice(start, SRC.indexOf('return;', start));
        expect(branch).toMatch(/we sent the unlock code/);
        expect(branch).not.toContain('downloadPurchasedPhoto');
    });

    it('does not ask for details again during a guest checkout', () => {
        expect(SRC).toMatch(/&& guestCheckoutAlbumId !== ctx\.albumId\)/);
    });
});
