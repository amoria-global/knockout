import { beforeEach, describe, expect, it, vi } from 'vitest';

let signedIn = false;
const post = vi.fn();

vi.mock('@/lib/api/client', () => ({
  isAuthenticated: () => signedIn,
  apiClient: { get: vi.fn(), post: (...a: unknown[]) => post(...a), delete: vi.fn() },
}));

import { sendStreamChat } from './route';

const ID = '22222222-2222-2222-2222-222222222222';

beforeEach(() => {
  signedIn = false;
  post.mockReset().mockResolvedValue({ success: true, data: { action: 1 } });
});

describe('sendStreamChat (a signed-in viewer posting to the live chat)', () => {
  it('posts the message in the body to the customer chat route, not the owner-only coordinator route', async () => {
    signedIn = true;
    await sendStreamChat(ID, 'hello everyone');
    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe(`/api/remote/customer/events/${ID}/chats`);
    expect(url).not.toContain('coordinator');
    expect(url).not.toContain('content=');
    expect(body).toEqual({ message: 'hello everyone' });
  });

  it('sends nothing when signed out', async () => {
    const res = await sendStreamChat(ID, 'hi');
    expect(res.success).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });
});
