import { afterEach, describe, expect, it, vi } from 'vitest';
import { photographerUnavailableReason } from './seo';

/** A pending profile must tell search engines not to index it; an outage must not. */
describe('photographerUnavailableReason', () => {
  afterEach(() => vi.unstubAllGlobals());
  const reply = (status: number, body: unknown = {}) =>
    vi.stubGlobal('fetch', vi.fn(async () => ({ status, json: async () => body }) as unknown as Response));

  it('is pending for a 403 that names PROFILE_PENDING', async () => {
    reply(403, { action: 0, errorCode: 'PROFILE_PENDING' });
    expect(await photographerUnavailableReason('p1')).toBe('pending');
  });

  it('is missing for a 404', async () => {
    reply(404);
    expect(await photographerUnavailableReason('p1')).toBe('missing');
  });

  it.each([
    ['a 403 for another reason', 403, { action: 0 }],
    ['a server error', 500, {}],
    ['a gateway timeout', 504, {}],
  ])('is null for %s, so a passing outage never drops a page from search', async (_n, status, body) => {
    reply(status, body);
    expect(await photographerUnavailableReason('p1')).toBeNull();
  });

  it('is null when the backend cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await photographerUnavailableReason('p1')).toBeNull();
  });
});
