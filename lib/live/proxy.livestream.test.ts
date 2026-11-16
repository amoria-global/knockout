// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../../proxy';

const get = (path: string, cookie?: string) =>
  proxy(new NextRequest(`https://connekyt.com${path}`, { headers: cookie ? { cookie } : {} }));

afterEach(() => vi.unstubAllEnvs());

describe('proxy livestream switch', () => {
  it('issues no cookie while the switch is off or unset', async () => {
    const res = await get('/user/events/livestream/violin-conference');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('issues the lv_ui cookie to everyone when the switch is all, read at request time', async () => {
    vi.stubEnv('LIVESTREAM_V2', 'all');
    const res = await get('/user/events/livestream/violin-conference');
    expect(res.headers.get('set-cookie')).toContain('lv_ui=v2');
  });

  it('turns an allowlist browser on with the QA key and no one else', async () => {
    vi.stubEnv('LIVESTREAM_V2', 'allowlist');
    vi.stubEnv('LIVESTREAM_V2_KEY', 'qa-secret-key');
    expect((await get('/user/events/livestream/x')).headers.get('set-cookie')).toBeNull();
    expect((await get('/user/events/livestream/x?lv2=qa-secret-key')).headers.get('set-cookie')).toContain('lv_ui=v2');
  });

  it('clears the cookie when the switch goes back to off', async () => {
    const res = await get('/user/events/livestream/violin-conference', 'lv_ui=v2');
    expect(res.headers.get('set-cookie') ?? '').toMatch(/lv_ui=;|Max-Age=0|expires=/i);
  });

  it('leaves other pages alone', async () => {
    vi.stubEnv('LIVESTREAM_V2', 'all');
    const res = await get('/user/events/view-event');
    expect(res.headers.get('set-cookie')).toBeNull();
  });
});
