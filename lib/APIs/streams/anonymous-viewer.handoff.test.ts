import { describe, expect, it, vi } from 'vitest';

const post = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiClient: { post: (...a: unknown[]) => post(...a) } }));

import { handAnonymousAccessToTv } from './anonymous-viewer';

/** Moving a guest purchase between this browser and a TV: one call, from the device that holds it, never retried. */
describe('handAnonymousAccessToTv', () => {
  it('posts both devices to the hand-to-tv endpoint as a guest call without retries', async () => {
    post.mockResolvedValue({ success: true });
    await handAnonymousAccessToTv('evt-1', 'viewer-1', 'phone-fp', 'tv-fp');
    expect(post).toHaveBeenCalledWith(
      '/api/remote/public/anonymous-viewer/evt-1/hand-to-tv',
      { viewerId: 'viewer-1', deviceFingerprint: 'phone-fp', tvFingerprint: 'tv-fp' },
      { skipAuth: true, retries: 0 },
    );
  });
});
