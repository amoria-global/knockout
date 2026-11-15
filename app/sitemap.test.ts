import { afterEach, describe, expect, it, vi } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists the public static pages even when the data feed is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    const urls = (await sitemap()).map(e => e.url);
    for (const p of ['/', '/user/events', '/user/photographers', '/user/about', '/user/help-center', '/get-app']) {
      expect(urls.some(u => u.endsWith(p === '/' ? '.com/' : p) || u.endsWith(p))).toBe(true);
    }
  });

  it('does not stamp a made-up lastModified on every url', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    expect((await sitemap()).every(e => e.lastModified === undefined)).toBe(true);
  });
});
