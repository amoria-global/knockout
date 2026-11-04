import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiClient: { post: (...a: unknown[]) => post(...a) }, setAuthToken: vi.fn() }));

import { verifyOtp } from './route';

/**
 * A code can start with 0. Sent as a JSON number it loses that zero (012345 becomes 12345), so the call always
 * sends a string, and never retries (a repeat would spend one of the 3 tries the server allows).
 */
describe('verifyOtp', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ success: false });
  });

  it('sends a typed code as it was typed', async () => {
    await verifyOtp({ customerId: 'c1', otp: '012345' });
    expect(post.mock.calls[0][1]).toEqual({ customerId: 'c1', otp: '012345' });
  });

  it('pads a number from an older call site back to six digits', async () => {
    await verifyOtp({ customerId: 'c1', otp: 12345 });
    expect(post.mock.calls[0][1]).toEqual({ customerId: 'c1', otp: '012345' });
  });

  it('does not retry', async () => {
    await verifyOtp({ customerId: 'c1', otp: '123456' });
    expect(post.mock.calls[0][2]).toMatchObject({ retries: 0 });
  });
});
