import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { staticPageMetadata } from './seo';

describe('staticPageMetadata', () => {
  it('gives the page its own canonical, title, description and share tags', () => {
    const m = staticPageMetadata({ title: 'About Us', description: 'Who we are.', path: '/user/about' });
    expect(m.alternates?.canonical).toBe('/user/about');
    expect(m.title).toBe('About Us');
    expect(m.description).toBe('Who we are.');
    expect(m.openGraph?.url).toMatch(/\/user\/about$/);
    expect(m.robots).toBeUndefined();
  });

  it('keeps account pages out of search when asked', () => {
    const m = staticPageMetadata({ title: 'Sign In', description: 'x', path: '/user/auth/login', index: false });
    expect(m.robots).toEqual({ index: false, follow: false });
  });
});

/** The root layout must never carry a canonical: every page inheriting "/" reads as a duplicate of the homepage. */
describe('site wide canonical', () => {
  it('is not set in the root layout', () => {
    const layout = fs.readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf8');
    expect(layout).not.toMatch(/canonical/);
  });

  it('is set on the homepage wrapper', () => {
    const home = fs.readFileSync(path.join(process.cwd(), 'app/page.tsx'), 'utf8');
    expect(home).toMatch(/canonical:\s*"\/"/);
  });
});
