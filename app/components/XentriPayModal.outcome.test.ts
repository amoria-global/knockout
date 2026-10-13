import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * docs/PAYMENTS.md rule 2: never offer a retry after a charge may have landed.
 *
 * The failed step has two faces: 'declined' (gateway said FAILED, Retry
 * offered) and 'unknown' (timeout or status error, no Retry, check phone and
 * email). failureKind defaulted to 'declined' and only one path set it, so a
 * five-minute poll timeout told a buyer "Payment declined. You were not
 * charged." beside a button that charges them again.
 *
 * There is no component harness in this repo yet (see vitest.config.ts), so
 * this pins the rule at the source: one helper owns the failed step, it
 * defaults to unknown, and only explicit gateway FAILED branches say declined.
 */
const SRC = readFileSync(path.join(__dirname, 'XentriPayModal.tsx'), 'utf8');

describe('XentriPayModal failure outcome', () => {
    it('defaults to unknown so a forgotten path offers no Retry', () => {
        expect(SRC).toMatch(/useState<'declined' \| 'unknown'>\('unknown'\)/);
    });

    it('enters the failed step only through fail(kind, message)', () => {
        const direct = SRC.match(/setStep\('failed'\)/g) ?? [];
        expect(direct).toHaveLength(1); // the one inside fail()
        expect(SRC).toMatch(/const fail = \(kind: 'declined' \| 'unknown', message: string\) => \{\s*setFailureKind\(kind\);\s*setError\(message\);\s*setStep\('failed'\);/);
    });

    it('says declined only where the gateway reported FAILED', () => {
        const lines = SRC.split('\n');
        const declined = lines
            .map((l, i) => ({ l, i }))
            .filter(({ l }) => l.includes("fail('declined'"));
        expect(declined.length).toBeGreaterThan(0);
        for (const { i } of declined) {
            const context = lines.slice(Math.max(0, i - 8), i + 1).join('\n');
            expect(context, `line ${i + 1}`).toMatch(/status === 'FAILED'|onFailure:/);
        }
    });

    it('treats every timeout and status error as unknown', () => {
        for (const m of SRC.matchAll(/fail\('(declined|unknown)', '([^']*)'/g)) {
            if (/longer than expected|Unable to check|timed out/i.test(m[2])) {
                expect(m[1], m[2]).toBe('unknown');
            }
        }
        expect(SRC).toMatch(/onError: \(errorMsg: string\) => \{\s*fail\('unknown'/);
    });

    it('treats a dropped connection while initiating as unknown', () => {
        expect(SRC).toMatch(/lower\.includes\('network'\) \|\| lower\.includes\('fetch'\)\) \{[\s\S]{0,400}?fail\('unknown'/);
    });
});
