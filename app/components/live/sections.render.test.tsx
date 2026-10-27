import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventTabs, ModerationQueue, SendWishes, WishesFeed } from './index';
import type { Wish } from '@/lib/live/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const wish = (o: Partial<Wish> = {}): Wish => ({ id: 'w1', type: 'text', authorName: 'Aline', message: 'Congratulations', visibility: 'public', status: 'approved', mine: false, ...o });

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
const btn = (t: string) => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes(t)) as HTMLButtonElement | undefined;

describe('EventTabs', () => {
  it('is a tablist with the selected tab marked, and switches on click', () => {
    const onChange = vi.fn();
    render(<EventTabs value="live" onChange={onChange} wishCount={3} />);
    const tabs = [...host.querySelectorAll('[role="tab"]')];
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(tabs[1].textContent).toContain('3');
    act(() => (tabs[1] as HTMLButtonElement).click());
    expect(onChange).toHaveBeenCalledWith('wishes');
  });
});

describe('WishesFeed', () => {
  const props = { onRetry: vi.fn(), onPlay: vi.fn(), onHideOwn: vi.fn() };

  it('shows a loading state, an error with a retry, and an empty state', () => {
    render(<WishesFeed {...props} state="loading" wishes={[]} variant="full" />);
    expect(host.querySelector('[aria-label="Loading wishes"]')).not.toBeNull();
    render(<WishesFeed {...props} state="error" wishes={[]} variant="full" />);
    act(() => btn('Try again')!.click());
    expect(props.onRetry).toHaveBeenCalled();
    render(<WishesFeed {...props} state="ready" wishes={[]} variant="full" />);
    expect(host.textContent).toContain('No wishes yet');
  });

  it('shows video items with a thumbnail button and duration, and text items with avatar, name and message', () => {
    render(<WishesFeed {...props} state="ready" variant="full" wishes={[wish({ id: 'v', type: 'video', videoUrl: 'https://v/x.webm', durationSeconds: 34, message: '[Video Wish]' }), wish({ id: 't' })]} />);
    expect(host.textContent).toContain('0:34');
    act(() => (host.querySelector('button[aria-label^="Play video wish"]') as HTMLButtonElement).click());
    expect(props.onPlay).toHaveBeenCalled();
    expect(host.textContent).toContain('Congratulations');
    expect(host.textContent).toContain('Aline');
  });

  it('previews three with See all, and offers Hide on your own wish and Report on others', () => {
    const onSeeAll = vi.fn();
    const many = ['a', 'b', 'c', 'd'].map((id) => wish({ id, authorName: id.toUpperCase() }));
    render(<WishesFeed {...props} state="ready" variant="preview" total={4} wishes={many} onSeeAll={onSeeAll} />);
    expect(host.querySelectorAll('li').length).toBe(3);
    act(() => btn('See all')!.click());
    expect(onSeeAll).toHaveBeenCalled();

    const onReport = vi.fn();
    render(<WishesFeed {...props} state="ready" variant="full" wishes={[wish({ id: 'mine', mine: true }), wish({ id: 'theirs' })]} canReport onReport={onReport} />);
    const menus = [...host.querySelectorAll('button[aria-haspopup="menu"]')] as HTMLButtonElement[];
    act(() => menus[0].click());
    expect(btn('Hide my wish')).toBeDefined();
    act(() => btn('Hide my wish')!.click());
    expect(props.onHideOwn).toHaveBeenCalledWith(expect.objectContaining({ id: 'mine' }));
    act(() => menus[1].click());
    act(() => btn('Report')!.click());
    expect(onReport).toHaveBeenCalledWith(expect.objectContaining({ id: 'theirs' }));
  });
});

describe('ModerationQueue', () => {
  const props = { onApprove: vi.fn(), onHide: vi.fn(), onRetry: vi.fn(), onPlay: vi.fn() };

  it('offers Approve and Hide on a pending public wish, and no Approve on a private one', () => {
    render(<ModerationQueue {...props} state="ready" wishes={[wish({ id: 'p', status: 'pending' }), wish({ id: 'q', visibility: 'private', status: 'pending' })]} />);
    expect([...document.querySelectorAll('button')].filter((b) => b.textContent?.includes('Approve')).length).toBe(1);
    act(() => btn('Approve')!.click());
    expect(props.onApprove).toHaveBeenCalledWith(expect.objectContaining({ id: 'p' }));
    expect(host.textContent).toContain('1 waiting for your decision');
  });

  it('shows empty, loading and error states', () => {
    render(<ModerationQueue {...props} state="ready" wishes={[]} />);
    expect(host.textContent).toContain('No wishes yet');
    render(<ModerationQueue {...props} state="loading" wishes={[]} />);
    expect(host.querySelector('[aria-label="Loading wishes"]')).not.toBeNull();
    render(<ModerationQueue {...props} state="error" wishes={[]} />);
    expect(btn('Try again')).toBeDefined();
  });
});

describe('SendWishes', () => {
  it('opens the composer, and Send stays blocked until public or private is chosen', async () => {
    const send = vi.fn();
    render(<SendWishes eventId="e1" account={{ name: 'A', email: 'a@b.co' }} getFingerprint={async () => 'd'} onSent={send} />);
    act(() => btn('Write a wish')!.click());
    const area = document.querySelector('textarea') as HTMLTextAreaElement;
    act(() => {
      const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      set.call(area, 'Happy birthday');
      area.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => btn('Send wish')!.click());
    expect(document.body.textContent).toContain('Choose who can see your wish.');
    expect(send).not.toHaveBeenCalled();
  });

  it('says wishes are closed once the event has ended', () => {
    render(<SendWishes eventId="e1" closed account={null} getFingerprint={async () => 'd'} />);
    expect(host.textContent).toContain('Wishes are closed for this event.');
    expect(btn('Write a wish')).toBeUndefined();
  });
});
