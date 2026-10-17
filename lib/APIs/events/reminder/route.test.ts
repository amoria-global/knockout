import { beforeEach, describe, expect, it, vi } from 'vitest';

let signedIn = false;
const get = vi.fn();
const post = vi.fn();
const del = vi.fn();

vi.mock('@/lib/api/client', () => ({
  isAuthenticated: () => signedIn,
  apiClient: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), delete: (...a: unknown[]) => del(...a) },
}));

import { clearEventReminder, getEventReminder, setEventReminder } from './route';

const ID = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  signedIn = false;
  get.mockReset().mockResolvedValue({ success: true, data: { subscribed: false } });
  post.mockReset().mockResolvedValue({ success: true, data: { subscribed: true } });
  del.mockReset().mockResolvedValue({ success: true, data: { subscribed: false } });
});

describe('event reminder API', () => {
  it('a signed-in person uses the customer route with their own token and no email', async () => {
    signedIn = true;
    await setEventReminder(ID);
    expect(post).toHaveBeenCalledWith(`/api/remote/customer/events/${ID}/reminder`, undefined, { skipAuth: false });
    await clearEventReminder(ID);
    expect(del).toHaveBeenCalledWith(`/api/remote/customer/events/${ID}/reminder`, { skipAuth: false });
    await getEventReminder(ID);
    expect(get).toHaveBeenCalledWith(`/api/remote/customer/events/${ID}/reminder`, { skipAuth: false });
  });

  it('a guest uses the public route with an email and no token', async () => {
    await setEventReminder(ID, 'a@b.co');
    expect(post).toHaveBeenCalledWith(`/api/remote/public/events/${ID}/reminder`, { email: 'a@b.co' }, { skipAuth: true });
    await clearEventReminder(ID, 'a+b@b.co');
    expect(del).toHaveBeenCalledWith(`/api/remote/public/events/${ID}/reminder?email=a%2Bb%40b.co`, { skipAuth: true });
  });

  it('a guest with no email is simply not subscribed, without asking the server', async () => {
    const res = await getEventReminder(ID);
    expect(res.data?.subscribed).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });
});
