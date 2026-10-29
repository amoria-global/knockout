import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hostRows } from '@/lib/events/hostRows';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/lib/live/qr', () => ({ qrDataUrl: async () => 'data:image/png;base64,AAAA', downloadQr: vi.fn(), wishLink: (id: string) => `https://connekyt.com/wish/${id}` }));
vi.mock('@/lib/fingerprint', () => ({ getDeviceId: async () => 'fp' }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
const fetchEvent = vi.fn();
vi.mock('@/lib/seo/seo', () => ({
  absUrl: (u?: string) => u,
  fetchEventForSeo: (...a: unknown[]) => fetchEvent(...a),
  SITE_NAME: 'Amoria Connekyt',
  SITE_URL: 'https://connekyt.com',
}));

import { WishesMemoriesCard } from './WishesMemoriesCard';
import { EventWhenCard, HostedByCard } from './EventCards';
import WishPage, { generateMetadata } from '@/app/wish/[id]/page';

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const render = (el: React.ReactElement) => act(() => root.render(el));
const tab = (t: string) => [...host.querySelectorAll('[role="tab"]')].find((b) => b.textContent === t) as HTMLButtonElement;

describe('WishesMemoriesCard', () => {
  it('opens on Send my wish with the compact form, then Invite loved ones with the QR, Share link, Copy and Save QR', async () => {
    render(<WishesMemoriesCard eventId="e1" title="Bible Revival" />);
    expect(host.textContent).toContain('Wishes & memories');
    expect(host.textContent).toContain('Shown on screen during the event');
    expect(tab('Send my wish').getAttribute('aria-selected')).toBe('true');
    expect(host.querySelector('input[aria-label="Your name"]')).toBeTruthy();
    expect(host.textContent).toContain('Video · 1 min');
    expect(host.textContent).toContain("Some of the people you love can't be here.");

    await act(async () => tab('Invite loved ones').click());
    expect(tab('Invite loved ones').getAttribute('aria-selected')).toBe('true');
    expect(host.querySelector('img[alt="QR code for wish link"]')).toBeTruthy();
    for (const label of ['Share link', 'Copy', 'Save QR']) expect(host.textContent).toContain(label);
    expect(host.querySelector('input[aria-label="Your name"]')).toBeNull();
  });
});

describe('EventWhenCard', () => {
  it('shows the date, the time with its timezone and an Add to calendar link built from the event date', () => {
    render(<EventWhenCard event={{ eventDate: '2026-11-27', startTime: '16:11' }} title="Bible Revival" location="Kigali" />);
    expect(host.textContent).toContain('Fri, 27 Nov 2026');
    expect(host.textContent).toContain('4:11 PM · Kigali time (CAT)');
    const a = host.querySelector('a') as HTMLAnchorElement;
    expect(a.textContent).toBe('Add to calendar');
    expect(new URL(a.href).searchParams.get('dates')).toBe('20261127T141100Z/20261127T161100Z');
  });
});

describe('HostedByCard', () => {
  it('is one row with both role chips when organizer and photographer are the same user id', () => {
    render(<HostedByCard rows={hostRows({ creator: { id: 'u1', firstName: 'Joseph', lastName: 'Maranatha' }, photographerId: 'u1', photographerName: 'Joseph Maranatha' })} />);
    expect(host.querySelectorAll('.wm-host')).toHaveLength(1);
    expect(host.textContent).toContain('ORGANIZER');
    expect(host.textContent).toContain('PHOTOGRAPHER');
    expect((host.querySelector('a.wm-host') as HTMLAnchorElement).href).toContain('/user/photographers/view-profile?id=u1');
  });

  it('is two rows in one card for different users, even with the same name', () => {
    render(<HostedByCard rows={hostRows({ creator: { id: 'u1', firstName: 'Eric', lastName: 'M' }, photographerId: 'u2', photographerName: 'Eric M' })} />);
    expect(host.querySelectorAll('section')).toHaveLength(1);
    expect(host.querySelectorAll('.wm-host')).toHaveLength(2);
  });
});

describe('the wish page', () => {
  const ev = { id: 'e1', title: 'Bible Revival Conference', eventDate: '2999-11-27', startTime: '16:11', eventStatus: 'PUBLISHED', eventPhoto: 'https://cdn.example/c.jpg' };
  const page = async (from?: string) => renderToStaticMarkup(await WishPage({ params: Promise.resolve({ id: 'e1' }), searchParams: Promise.resolve(from === undefined ? {} : { from }) }));

  it('sets the rich preview: the cover as og:image, "Send a wish · <title>" and the heartfelt line', async () => {
    fetchEvent.mockResolvedValue(ev);
    const m = await generateMetadata({ params: Promise.resolve({ id: 'e1' }) });
    expect(m.title).toBe('Send a wish · Bible Revival Conference');
    expect(m.openGraph?.title).toBe('Send a wish · Bible Revival Conference');
    expect(m.openGraph?.description).toContain("Some of the people you love can't be here.");
    expect(m.openGraph?.images).toEqual([{ url: 'https://cdn.example/c.jpg' }]);
    expect((m.twitter as { card: string }).card).toBe('summary_large_image');
  });

  it('shows the cover, title, date and the form, and the invited line only for a usable name', async () => {
    fetchEvent.mockResolvedValue(ev);
    const html = await page('Grace');
    expect(html).toContain('background-image:url(&quot;https://cdn.example/c.jpg&quot;)');
    expect(html).toContain('Bible Revival Conference');
    expect(html).toContain('WED, 27 NOV 2999 · 4:11 PM');
    expect(html).toContain('Grace invited you to send a wish for this event.');
    expect(html).toContain('Send wish');
    expect(await page('<>')).not.toContain('invited you');
    expect(await page()).not.toContain('invited you');
  });

  it('closes for an ended event, keeping the cover and title, and for an unpublished one, showing nothing about it', async () => {
    fetchEvent.mockResolvedValue({ ...ev, eventDate: '2020-01-01', eventStatus: 'COMPLETED' });
    const ended = await page();
    expect(ended).toContain('Wishes for this event are closed');
    expect(ended).toContain('Bible Revival Conference');
    expect(ended).not.toContain('Send wish');
    expect(ended).toContain('View event');

    fetchEvent.mockResolvedValue(null);
    const gone = await page();
    expect(gone).toContain('Wishes for this event are closed');
    expect(gone).not.toContain('Bible Revival');
    const m = await generateMetadata({ params: Promise.resolve({ id: 'e1' }) });
    expect(m.openGraph?.images).toBeUndefined();
  });
});

import { WishInvitesField } from './WishInvitesField';
import { WishForm } from './WishForm';

const setValue = (el: Element, v: string) => {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

describe('WishInvitesField', () => {
  it('has nothing selected on a new event, and the question, helper and required marker', () => {
    render(<WishInvitesField value={null} onChange={() => {}} />);
    expect(host.textContent).toContain('Wish invites');
    expect(host.textContent).toContain('Allow viewers to invite friends and family to send message and video wishes?');
    expect(host.textContent).toContain("When enabled, viewers can share a link or QR code so loved ones who can't attend can send their wishes too.");
    const radios = [...host.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
    expect(radios).toHaveLength(2);
    expect(radios.some((r) => r.checked)).toBe(false);
    expect(host.querySelector('fieldset')?.getAttribute('aria-required')).toBe('true');
  });

  it('is a radio group, reports the choice, and shows the saved value when editing', () => {
    const onChange = vi.fn();
    render(<WishInvitesField value={false} onChange={onChange} />);
    const [enable, disable] = [...host.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
    expect(disable.checked).toBe(true);
    expect(enable.name).toBe(disable.name);
    act(() => enable.click());
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('links its error to the group so it is announced', () => {
    render(<WishInvitesField value={null} onChange={() => {}} error="Choose whether viewers can invite others" />);
    const group = host.querySelector('fieldset')!;
    const err = host.querySelector('[role="alert"]')!;
    expect(err.textContent).toContain('Choose whether viewers can invite others');
    expect(group.getAttribute('aria-describedby')).toBe(err.id);
    expect(group.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('Wish invites on the event page card', () => {
  it('disabled: only the send form, no switch, no heartfelt line', () => {
    render(<WishesMemoriesCard eventId="e1" title="Bible Revival" invites={false} />);
    expect(host.querySelector('[role="tablist"]')).toBeNull();
    expect(host.textContent).not.toContain('Invite loved ones');
    expect(host.textContent).not.toContain("Some of the people you love can't be here.");
    expect(host.querySelector('input[aria-label="Your name"]')).toBeTruthy();
    expect(host.textContent).toContain('Video · 1 min');
  });
});

describe('wishes are sent with or without the invite marker', () => {
  const send = async (variant: 'card' | 'page') => {
    const fetchMock = vi.fn(async () => ({ json: async () => ({ action: 1 }) }) as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);
    render(<WishForm eventId="e1" variant={variant} />);
    setValue(host.querySelector('input[aria-label="Your name"]')!, 'Grace');
    expect(host.querySelector('input[aria-label="Your email"]')).toBeNull();
    setValue(host.querySelector('textarea')!, 'Congratulations');
    await act(async () => { ([...host.querySelectorAll('button')].find((b) => b.textContent === 'Send wish') as HTMLButtonElement).click(); });
    vi.unstubAllGlobals();
    return JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body) as Record<string, unknown>;
  };

  it("the wish page's form sends via=invite", async () => {
    expect(await send('page')).toMatchObject({ via: 'invite', message: 'Congratulations' });
  });

  it("a viewer's own wish from the event page sends no marker", async () => {
    expect(await send('card')).not.toHaveProperty('via');
  });
});

describe('the wish page when the host turned invites off', () => {
  const ev = { id: 'e1', title: 'Bible Revival Conference', eventDate: '2999-11-27', startTime: '16:11', eventStatus: 'PUBLISHED', eventPhoto: 'https://cdn.example/c.jpg' };
  const page = async () => renderToStaticMarkup(await WishPage({ params: Promise.resolve({ id: 'e1' }), searchParams: Promise.resolve({}) }));

  it('shows the cover, the title, the notice and a View event link, with no form', async () => {
    fetchEvent.mockResolvedValue({ ...ev, allowWishInvites: false });
    const html = await page();
    expect(html).toContain('Bible Revival Conference');
    expect(html).toContain('https://cdn.example/c.jpg');
    expect(html).toContain('The host has turned off wish invites for this event');
    expect(html).toContain('View event');
    expect(html).not.toContain('Send wish');
    expect(html).not.toContain('Invite someone else');
  });

  it('still opens the form when enabled, and when an older server sends no value', async () => {
    fetchEvent.mockResolvedValue({ ...ev, allowWishInvites: true });
    expect(await page()).toContain('Send wish');
    fetchEvent.mockResolvedValue(ev);
    expect(await page()).toContain('Send wish');
  });
});

import QrCodeSvg from '../QrCodeSvg';

describe('QrCodeSvg carries the Connekyt logo', () => {
  it('draws the code with the brand mark in a white badge in the middle', () => {
    const html = renderToStaticMarkup(<QrCodeSvg value="https://connekyt.com/get-app" size={118} />);
    expect(html).toContain('<image');
    expect(html).toContain('data:image/jpeg;base64,');
    expect(html).toContain('aria-label="QR code"');
  });
});
