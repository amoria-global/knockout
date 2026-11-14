import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const listTvDevices = vi.fn();
const sendEventToTv = vi.fn();
vi.mock('@/lib/APIs/tv/cast/route', async (orig) => {
  const real = await orig<typeof import('@/lib/APIs/tv/cast/route')>();
  return { ...real, listTvDevices: (...a: unknown[]) => listTvDevices(...a), sendEventToTv: (...a: unknown[]) => sendEventToTv(...a) };
});
vi.mock('next/link', () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }));

import { WatchOnTv } from './WatchOnTv';
import { LAST_TV_KEY, isTvOnline, pickDefaultTv, type TvDevice } from '@/lib/APIs/tv/cast/route';

const tv = (id: string, label: string, lastSeenAt?: string): TvDevice => ({ id, deviceLabel: label, pairedAt: '2026-11-01T10:00:00Z', lastSeenAt });

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  listTvDevices.mockReset();
  sendEventToTv.mockReset().mockResolvedValue({ success: true });
  window.localStorage.clear();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const render = (el: React.ReactElement) => act(() => root.render(el));
const btn = (t: string) => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes(t) || b.getAttribute('aria-label') === t) as HTMLButtonElement | undefined;
const click = async (b: HTMLElement | undefined) => {
  await act(async () => {
    b!.click();
  });
};

describe('pickDefaultTv and isTvOnline', () => {
  it('picks the only TV, else the remembered one, else none', () => {
    expect(pickDefaultTv([tv('a', 'Lounge')], null)?.id).toBe('a');
    expect(pickDefaultTv([tv('a', 'Lounge'), tv('b', 'Bedroom')], 'b')?.id).toBe('b');
    expect(pickDefaultTv([tv('a', 'Lounge'), tv('b', 'Bedroom')], 'gone')).toBeNull();
    expect(pickDefaultTv([tv('a', 'Lounge'), tv('b', 'Bedroom')], null)).toBeNull();
    expect(pickDefaultTv([], 'a')).toBeNull();
  });

  it('calls a TV on when it checked in within two minutes', () => {
    const now = Date.parse('2026-11-14T12:00:00Z');
    expect(isTvOnline({ lastSeenAt: '2026-11-14T11:59:00Z' }, now)).toBe(true);
    expect(isTvOnline({ lastSeenAt: '2026-11-14T11:50:00Z' }, now)).toBe(false);
    expect(isTvOnline({ lastSeenAt: null }, now)).toBe(false);
  });
});

describe('WatchOnTv', () => {
  it('is not shown to a signed-out viewer or without an event', () => {
    render(<WatchOnTv eventId="e1" enabled={false} />);
    expect(btn('Watch on TV')).toBeUndefined();
    render(<WatchOnTv eventId="" enabled />);
    expect(btn('Watch on TV')).toBeUndefined();
  });

  it('sends in one tap to the only TV and remembers it', async () => {
    listTvDevices.mockResolvedValue({ success: true, data: [tv('a', 'Lounge TV')] });
    render(<WatchOnTv eventId="e1" enabled />);
    await click(btn('Watch on TV'));
    expect(sendEventToTv).toHaveBeenCalledWith('a', 'e1');
    expect(host.textContent).toContain('Opening on Lounge TV');
    expect(window.localStorage.getItem(LAST_TV_KEY)).toBe('a');
  });

  it('lists several TVs, marks the one that is on, and sends the one picked', async () => {
    const recent = new Date(Date.now() - 30_000).toISOString();
    listTvDevices.mockResolvedValue({ success: true, data: [tv('a', 'Lounge TV', recent), tv('b', 'Bedroom TV')] });
    render(<WatchOnTv eventId="e1" enabled />);
    await click(btn('Watch on TV'));
    expect(sendEventToTv).not.toHaveBeenCalled();
    expect(host.textContent).toContain('On');
    expect(host.textContent).toContain('Not seen lately');
    await click(btn('Bedroom TV'));
    expect(sendEventToTv).toHaveBeenCalledWith('b', 'e1');
  });

  it('with no TVs, links to Connect a TV', async () => {
    listTvDevices.mockResolvedValue({ success: true, data: [] });
    render(<WatchOnTv eventId="e1" enabled />);
    await click(btn('Watch on TV'));
    const link = host.querySelector('a[href="/user/connect-tv"]');
    expect(link?.textContent).toContain('Connect a TV');
  });

  it('shows the server message on a failed send and offers Try again', async () => {
    listTvDevices.mockResolvedValue({ success: true, data: [tv('a', 'Lounge TV')] });
    sendEventToTv.mockResolvedValue({ success: false, error: 'This TV is no longer connected.' });
    render(<WatchOnTv eventId="e1" enabled />);
    await click(btn('Watch on TV'));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('This TV is no longer connected.');
    expect(btn('Try again')).toBeDefined();
  });
});
