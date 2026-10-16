import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { StoreBadge, StoreBadges } from './StoreBadges';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/qr/eventQr';

let root: Root | null = null;
let host: HTMLElement | null = null;
function mount(el: React.ReactElement) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(el));
  return host;
}
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
});

describe('StoreBadges', () => {
  it('links each badge to its store and labels it for screen readers', () => {
    const h = mount(<StoreBadges />);
    const links = Array.from(h.querySelectorAll('a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([APP_STORE_URL, PLAY_STORE_URL]);
    expect(links.map((a) => a.getAttribute('aria-label'))).toEqual([
      'Download on the App Store',
      'Get it on Google Play',
    ]);
  });

  it('shows the official two-line wording and accepts translated text', () => {
    const h = mount(<StoreBadge kind="ios" kicker="Télécharger sur" name="App Store" />);
    expect(h.textContent).toContain('Télécharger sur');
    expect(h.textContent).toContain('App Store');
  });

  it('keeps spacing out of Tailwind utilities (the global reset zeroes them)', () => {
    const h = mount(<StoreBadges size="lg" direction="column" />);
    const bad = Array.from(h.querySelectorAll('[class]')).filter((el) =>
      /(^|\s)-?(p|m|px|py|gap)-\d/.test(el.getAttribute('class') ?? ''),
    );
    expect(bad).toHaveLength(0);
  });
});
