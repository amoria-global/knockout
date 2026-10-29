import { describe, expect, it, vi } from 'vitest';
import { canSend, formatClock, remainingChars, sentNotice, validateDraft, wishErrorMessage, type ComposerDraft } from './composer';
import { hideOwnWish, listHostWishes, listWishes, mapWish, moderateWish, sendTextWish, sendVideoWish } from './api';
import { wishLink } from './qr';

const json = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;
const base: ComposerDraft = { kind: 'text', name: 'Aline', message: 'Congratulations', visibility: 'public', durationSeconds: null, hasVideo: false };
const account = { name: 'Aline M', email: 'a@b.co' };

describe('composer rules (same as the mobile app)', () => {
  it('accepts a complete text wish and makes the sender choose visibility, with no default', () => {
    expect(canSend(validateDraft(base, null))).toBe(true);
    expect(validateDraft({ ...base, visibility: null }, null).visibility).toBeDefined();
  });

  it('asks a guest for a name only, never a signed-in person', () => {
    const e = validateDraft({ ...base, name: ' ' }, null);
    expect(e.name).toBeDefined();
    expect(Object.keys(e)).toEqual(['name']);
    expect(canSend(validateDraft({ ...base, name: '' }, account))).toBe(true);
  });

  it('needs no email: a guest with a name and a message can send', () => {
    expect(canSend(validateDraft({ ...base, name: 'Aline' }, null))).toBe(true);
  });

  it('caps text at 500 characters and a video at 60 seconds, and the caption is optional', () => {
    expect(validateDraft({ ...base, message: 'x'.repeat(501) }, null).message).toContain('500');
    expect(canSend(validateDraft({ ...base, message: 'x'.repeat(500) }, null))).toBe(true);
    const v: ComposerDraft = { ...base, kind: 'video', message: '', hasVideo: true, durationSeconds: 42 };
    expect(canSend(validateDraft(v, null))).toBe(true);
    expect(validateDraft({ ...v, hasVideo: false }, null).video).toBeDefined();
    expect(validateDraft({ ...v, durationSeconds: 61 }, null).video).toContain('60');
    expect(canSend(validateDraft({ ...v, durationSeconds: 60 }, null))).toBe(true);
  });

  it('words the counters, the notice and the refusals', () => {
    expect(formatClock(7)).toBe('0:07');
    expect(formatClock(60)).toBe('1:00');
    expect(remainingChars('abc')).toBe(497);
    expect(sentNotice('public')).toContain('approves');
    expect(sentNotice('private')).toContain('privately');
    expect(wishErrorMessage('Wishes are closed for this event', 'text')).toBe('Wishes are closed for this event.');
    expect(wishErrorMessage('rate limit', 'text')).toContain('too quickly');
    expect(wishErrorMessage('file too large', 'video')).toContain('shorter clip');
  });
});

describe('wish API', () => {
  it('maps a backend wish, defaulting to a private pending text wish', () => {
    expect(mapWish({ id: 'w1' })).toMatchObject({ type: 'text', visibility: 'private', status: 'pending', mine: false, authorName: 'Guest' });
    expect(mapWish({ id: 'w2', type: 'VIDEO', duration: '41', visibility: 'PUBLIC', status: 'APPROVED', mine: true })).toMatchObject({ type: 'video', durationSeconds: 41, visibility: 'public', status: 'approved', mine: true });
  });

  it('lists the public feed with the device, drops rows without an id, and treats action 0 as an error', async () => {
    const f = vi.fn().mockResolvedValue(json({ action: 1, data: { items: [{ id: 'w1', message: 'Hi' }, { message: 'no id' }], page: 0, totalPages: 2, total: 7 } }));
    const page = await listWishes('e1', 'dev-1', 0, 20, f);
    expect(page.items.map((w) => w.id)).toEqual(['w1']);
    expect(page).toMatchObject({ totalPages: 2, total: 7 });
    expect(f.mock.calls[0][0]).toContain('/api/remote/public/events/e1/wishes?page=0&size=20&deviceFingerprint=dev-1');
    await expect(listWishes('e1', 'd', 0, 20, vi.fn().mockResolvedValue(json({ action: 0, message: 'Nope' })))).rejects.toThrow('Nope');
  });

  it('sends visibility with a text wish and refuses with the shared wording', async () => {
    const f = vi.fn().mockResolvedValue(json({ action: 1 }));
    await sendTextWish('e1', { name: 'A', message: 'Hi', visibility: 'public', fingerprint: 'd' }, f);
    expect(JSON.parse(f.mock.calls[0][1].body as string)).toMatchObject({ visibility: 'public', deviceFingerprint: 'd', message: 'Hi' });
    expect(JSON.parse(f.mock.calls[0][1].body as string)).not.toHaveProperty('email');
    const closed = vi.fn().mockResolvedValue(json({ action: 0, message: 'Wishes are closed for this event' }));
    await expect(sendTextWish('e1', { name: 'A', message: 'Hi', visibility: 'private', fingerprint: 'd' }, closed)).rejects.toThrow('Wishes are closed for this event.');
  });

  it('posts a video wish as multipart with visibility and the length rounded up', async () => {
    const f = vi.fn().mockResolvedValue(json({ action: 1 }));
    await sendVideoWish('e1', { name: 'A', visibility: 'private', durationSeconds: 41.2, video: new Blob(['x'], { type: 'video/webm' }), fingerprint: 'd' }, f);
    const form = f.mock.calls[0][1].body as FormData;
    expect(f.mock.calls[0][0]).toContain('/wishes/video');
    expect(form.get('visibility')).toBe('private');
    expect(form.get('duration')).toBe('42');
    expect(form.get('deviceFingerprint')).toBe('d');
    expect(form.has('email')).toBe(false);
    expect(form.has('message')).toBe(false);
  });

  it('hides a wish by device and moderates through the host routes', async () => {
    const f = vi.fn().mockResolvedValue(json({ action: 1 }));
    await hideOwnWish('e1', 'w1', 'dev-1', f);
    expect(f.mock.calls[0][0]).toContain('/public/events/e1/wishes/w1/hide');
    expect(JSON.parse(f.mock.calls[0][1].body as string)).toEqual({ deviceFingerprint: 'dev-1' });

    const host = vi.fn().mockResolvedValue(json({ action: 1, data: [{ id: 'w1', status: 'PENDING', visibility: 'PUBLIC' }] }));
    expect((await listHostWishes('e1', host))[0]).toMatchObject({ status: 'pending', visibility: 'public' });
    const mod = vi.fn().mockResolvedValue(json({ action: 1, data: { id: 'w1', status: 'APPROVED', visibility: 'PUBLIC' } }));
    expect((await moderateWish('e1', 'w1', 'approved', mod)).status).toBe('approved');
    expect(mod.mock.calls[0][0]).toContain('/photographer/events/e1/wishes/w1/moderation');
    expect(JSON.parse(mod.mock.calls[0][1].body as string)).toEqual({ status: 'APPROVED' });
  });
});

describe('wish link', () => {
  it('opens the wish page, the same link the mobile QR encodes', () => {
    expect(wishLink('ev 1')).toBe('https://connekyt.com/wish/ev%201');
  });
});

describe('the wishes feed and Wish invites', () => {
  it('carries the current setting so a live viewer sees a change on the refresh they already do', async () => {
    const f = async () => json({ action: 1, data: { items: [], page: 0, totalPages: 0, total: 0, allowWishInvites: false } });
    expect((await listWishes('e1', 'fp', 0, 20, f as unknown as typeof fetch)).allowWishInvites).toBe(false);
    const older = async () => json({ action: 1, data: { items: [], page: 0, totalPages: 0, total: 0 } });
    expect((await listWishes('e1', 'fp', 0, 20, older as unknown as typeof fetch)).allowWishInvites).toBeUndefined();
  });
});
