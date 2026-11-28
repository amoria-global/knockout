import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { IntlMessageFormat } from 'intl-messageformat';
import { LanguageProvider, useLanguage } from './LanguageProvider';

import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';
import rw from '../../messages/rw.json';
import sw from '../../messages/sw.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LOCALES = { en, es, fr, rw, sw } as const;
const COUNTS = [0, 1, 2, 5, 83];
// "83 Photographersec found", "0 reviewsec", "10 photosec": a one letter plural node read back as the French and Spanish "s" for seconds.
const ARTEFACT = /\b(item|photo|photographer|review|clip|result|album|creator)s?ec\b/i;

function flatten(obj: Record<string, unknown>, prefix = ''): [string, string][] {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === 'string' ? [[`${prefix}${k}`, v] as [string, string]] : v && typeof v === 'object' ? flatten(v as Record<string, unknown>, `${prefix}${k}.`) : []));
}

describe('plural messages read right at 0, 1 and n in every language', () => {
  for (const [locale, messages] of Object.entries(LOCALES)) {
    it(`${locale}: every ICU plural message formats, keeps its number and has no "ec" artefact`, () => {
      const plurals = flatten(messages as Record<string, unknown>).filter(([, v]) => /\{\w+, plural,/.test(v));
      expect(plurals.length).toBeGreaterThan(0);
      for (const [key, text] of plurals) {
        for (const n of COUNTS) {
          const out = new IntlMessageFormat(text, locale === 'rw' || locale === 'sw' ? 'en' : locale).format({ n, count: n }) as string;
          expect(out, `${locale} ${key} n=${n}`).toContain(String(n));
          expect(out, `${locale} ${key} n=${n}`).not.toMatch(ARTEFACT);
          expect(out).not.toMatch(/undefined|NaN|\{/);
        }
      }
    });
  }
});

function Counts({ n }: { n: number }) {
  const { setLocale } = useLanguage();
  return (
    <div>
      {(['en', 'fr', 'es', 'rw', 'sw'] as const).map(l => <button key={l} id={`go-${l}`} onClick={() => setLocale(l)}>{l}</button>)}
      <p id="ph">{n} Photographer{n === 1 ? '' : 's'} found</p>
      <p id="rv">{n} review{n === 1 ? '' : 's'}</p>
      <p id="pc">{n} photo{n === 1 ? '' : 's'}</p>
    </div>
  );
}

describe('the page translator never turns a plural "s" into "ec"', () => {
  for (const n of [0, 1, 10, 83]) {
    it(`n=${n} in every locale`, async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = createRoot(host);
      await act(async () => { root.render(<LanguageProvider><Counts n={n} /></LanguageProvider>); });
      for (const l of ['en', 'fr', 'es', 'rw', 'sw']) {
        await act(async () => { (host.querySelector(`#go-${l}`) as HTMLButtonElement).click(); });
        for (const id of ['#ph', '#rv', '#pc']) {
          const text = host.querySelector(id)?.textContent || '';
          expect(text, `${l} ${id} n=${n}`).not.toMatch(ARTEFACT);
          expect(text).toContain(String(n));
        }
      }
      await act(async () => { root.unmount(); });
      host.remove();
    });
  }
});
