import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * docs/PAYMENTS.md rules 2 and 3 on the two checkouts outside XentriPayModal.
 *
 * complete-payment (the app's booking handoff page) sent a poll timeout or a
 * status error back to the form with its Pay button live, and the live-stream
 * gift flow showed "Payment Failed" with Try Again for the same cases and for
 * a dropped connection while initiating. In each, the buyer's money may
 * already have left, and paying again opens a second collection.
 *
 * Read at the source; there is no component harness yet (vitest.config.ts).
 */
function code(file: string): string {
    return readFileSync(path.join(__dirname, file), 'utf8')
        .replace(/\r\n/g, '\n')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
}

describe('complete-payment outcome', () => {
    const src = code('complete-payment.tsx');

    it('sends a poll timeout or status error to unconfirmed, not the form', () => {
        expect(src).toMatch(/onError: \(\) => setStep\('unconfirmed'\)/);
    });

    it('treats a request that got no answer as unconfirmed', () => {
        expect(src).toMatch(/answered = true;/);
        expect(src).toMatch(/catch \(e\) \{\s*if \(!answered\) \{[\s\S]{0,200}?setStep\('unconfirmed'\)/);
    });

    it('shows no Pay button on the unconfirmed step', () => {
        const start = src.indexOf("{step === 'unconfirmed' && (");
        const end = src.indexOf("{(step === 'form' || step === 'initiating')", start);
        expect(start).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(start);
        expect(src.slice(start, end)).not.toMatch(/<button|startPay/);
    });
});

describe('live-stream gift outcome', () => {
    const src = code('events/live-stream.tsx');

    it('sends a poll timeout or status error to unconfirmed', () => {
        expect(src).toMatch(/onError: \(\) => setGiftStep\('unconfirmed'\)/);
    });

    it('treats a dropped connection while initiating as unconfirmed', () => {
        expect(src).toMatch(/lower\.includes\('timeout'\)\) \{\s*setGiftStep\('unconfirmed'\);\s*return;/);
    });

    it('offers no Try Again on the unconfirmed step', () => {
        const start = src.indexOf("{giftStep === 'unconfirmed' && (");
        const end = src.indexOf("{giftStep === 'failed' && (", start);
        expect(start).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(start);
        expect(src.slice(start, end)).not.toMatch(/Try Again|setGiftStep\('form'\)/);
    });
});

describe('no checkout calls a timeout a decline', () => {
    it('the old "declined or timed out" wording is gone', () => {
        for (const f of ['complete-payment.tsx', 'events/live-stream.tsx']) {
            expect(code(f), f).not.toMatch(/declined or timed out/);
        }
    });
});
