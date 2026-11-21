import { describe, expect, it } from 'vitest';
import raw from '@/contract/referral-copy.json';
import { fmt, policyModel, referralCopy, TIERS } from './copy';

const all = raw as unknown as Record<string, Record<string, string>>;
const LOCALES = ['en', 'sw', 'rw', 'fr', 'es'];
const CHECKED = ['en', 'fr'];

describe('referral copy source', () => {
  it('has the same keys in every language', () => {
    const keys = Object.keys(all.en).sort();
    for (const l of LOCALES) expect(Object.keys(all[l]).sort(), l).toEqual(keys);
  });

  it('keeps every placeholder identical across languages', () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join();
    for (const k of Object.keys(all.en)) {
      for (const l of LOCALES) expect(ph(all[l][k]), `${l}.${k}`).toBe(ph(all.en[k]));
    }
  });

  it('uses no em or en dashes and no empty strings', () => {
    for (const l of LOCALES) {
      for (const [k, v] of Object.entries(all[l])) {
        expect(v.trim(), `${l}.${k}`).not.toBe('');
        expect(v, `${l}.${k}`).not.toMatch(/[–—]/);
      }
    }
  });

  it('falls back to English for an unknown locale', () => {
    expect(referralCopy('xx').policyTitle).toBe(all.en.policyTitle);
    expect(referralCopy(undefined).policyTitle).toBe(all.en.policyTitle);
  });

  it('fills placeholders and leaves unknown ones', () => {
    expect(fmt('{n} of {target}', { n: 11, target: 20 })).toBe('11 of 20');
    expect(fmt('{a} {b}', { a: 1 })).toBe('1 {b}');
  });
});

describe('policy model', () => {
  it('lists every tier from 70 to 90 with the cap last', () => {
    expect(TIERS.map((t) => t.share)).toEqual([70, 75, 80, 85, 90]);
    for (const l of CHECKED) {
      const m = policyModel(l);
      expect(m.tiers.map((t) => t.share)).toEqual(['70%', '75%', '80%', '85%', '90%']);
      expect(m.tiers[0].range).toBe(l === 'en' ? '0-9 referrals' : '0-9 parrainages');
      expect(m.tiers[4].range).toBe(l === 'en' ? '40 referrals' : '40 parrainages');
      expect(m.tiers[4].note).toBe(all[l].tierMax);
    }
  });

  it('renders the three steps worded exactly as the explainer, with USD 5 for guests', () => {
    for (const l of CHECKED) {
      const m = policyModel(l);
      expect(m.steps).toHaveLength(3);
      expect(m.steps[0]).toBe(all[l].step1);
      expect(m.steps[1]).toBe(all[l].step2);
      expect(m.steps[2]).toBe(all[l].step3.replace('{min}', 'USD 5'));
      expect(m.stepsFooter).toBe(all[l].stepsFooter);
    }
    expect(policyModel('en').steps[2]).toBe('They make their first real sale or paid job (from a client, at least USD 5).');
  });

  it('covers scope, fraud review, the cap, permanence, grandfathering and contact', () => {
    for (const l of CHECKED) {
      const m = policyModel(l);
      expect(m.sections.map((s) => s.h)).toEqual([
        all[l].policyScopeTitle, all[l].policyFraudTitle, all[l].policyCapTitle,
        all[l].policyPermanenceTitle, all[l].policyGrandfatherTitle,
      ]);
      expect(m.contact).toContain('support@connekyt.com');
    }
  });

  it('no longer mentions the old 5 to 20 referral fee table', () => {
    for (const l of LOCALES) {
      const text = JSON.stringify(all[l]);
      expect(text).not.toMatch(/ 20 (referral|parrainage|referido)/i);
      expect(text).not.toMatch(/25%|25 %/);
    }
  });
});
