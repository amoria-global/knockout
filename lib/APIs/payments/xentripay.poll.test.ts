import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('@/lib/api/client', () => ({
  apiClient: { get: (...a: unknown[]) => get(...a) },
  isAuthenticated: () => false,
}));
vi.mock('@/lib/api/config', () => ({
  API_ENDPOINTS: { PAYMENTS: { XENTRIPAY_PUBLIC_STATUS: (r: string) => `/public/${r}`, XENTRIPAY_STATUS: (r: string) => `/auth/${r}` } },
}));

import { pollXentriPayStatus } from './xentripay';

/**
 * What the buyer is told after each kind of provider outcome. The poller is where "paid",
 * "failed" and "we do not know" are decided, so a timeout or a malformed answer must never
 * reach onSuccess, and an unknown outcome must never reach onFailure (which is what lets the
 * modal offer a retry that charges the buyer a second time).
 */
const ok = (status: string) => ({ success: true, data: { status } });
const refused = { success: false, message: 'Payment not found' }; // an envelope with action 0, mapped by the client

function run(opts: { maxAttempts?: number; grace?: number; usePublic?: boolean } = {}) {
  const cb = { onSuccess: vi.fn(), onFailure: vi.fn(), onError: vi.fn() };
  const stop = pollXentriPayStatus('REF-1', cb, 2000, opts.maxAttempts ?? 150, opts.usePublic ?? true, opts.grace ?? 0);
  return { cb, stop };
}
const tick = (ms = 2000) => vi.advanceTimersByTimeAsync(ms);

beforeEach(() => { vi.useFakeTimers(); get.mockReset(); });
afterEach(() => vi.useRealTimers());

describe('successful payment', () => {
  it('reports success once, and only on an exact SUCCESS', async () => {
    get.mockResolvedValue(ok('SUCCESS'));
    const { cb } = run();
    await tick();
    expect(cb.onSuccess).toHaveBeenCalledTimes(1);
    expect(cb.onFailure).not.toHaveBeenCalled();
    expect(cb.onError).not.toHaveBeenCalled();
    await tick(10_000);
    expect(get).toHaveBeenCalledTimes(1); // stopped polling
  });

  it('keeps waiting while pending, then succeeds', async () => {
    get.mockResolvedValueOnce(ok('PENDING')).mockResolvedValueOnce(ok('PENDING')).mockResolvedValue(ok('SUCCESS'));
    const { cb } = run();
    await tick(); await tick(); await tick();
    expect(cb.onSuccess).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(3);
  });
});

describe('statuses that are not a success', () => {
  it.each(['success', 'Success ', 'SUCCESSFUL', 'COMPLETED', 'HELD', 'ON_HOLD', 'MISMATCH', '', undefined])(
    '%j never counts as paid',
    async (status) => {
      get.mockResolvedValue(ok(status as string));
      const { cb } = run({ maxAttempts: 5 });
      for (let i = 0; i < 6; i++) await tick();
      expect(cb.onSuccess).not.toHaveBeenCalled();
      expect(cb.onFailure).not.toHaveBeenCalled(); // not a decline either: it is unknown
      expect(cb.onError).toHaveBeenCalledTimes(1);
    }
  );

  it('a payment the backend holds for review (reported PENDING) ends as unknown, not paid and not failed', async () => {
    get.mockResolvedValue(ok('PENDING'));
    const { cb } = run({ maxAttempts: 150 });
    for (let i = 0; i < 151; i++) await tick();
    expect(cb.onSuccess).not.toHaveBeenCalled();
    expect(cb.onFailure).not.toHaveBeenCalled();
    expect(cb.onError).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(150);
  });
});

describe('a declined payment', () => {
  it('mobile money: FAILED is honoured at once', async () => {
    get.mockResolvedValue(ok('FAILED'));
    const { cb } = run({ grace: 0 });
    await tick();
    expect(cb.onFailure).toHaveBeenCalledTimes(1);
    expect(cb.onSuccess).not.toHaveBeenCalled();
  });

  it('card: an early FAILED is ignored for the grace window, and a later SUCCESS still wins', async () => {
    get.mockResolvedValueOnce(ok('FAILED')).mockResolvedValueOnce(ok('FAILED')).mockResolvedValue(ok('SUCCESS'));
    const { cb } = run({ grace: 180_000 });
    await tick(); await tick(); await tick();
    expect(cb.onFailure).not.toHaveBeenCalled();
    expect(cb.onSuccess).toHaveBeenCalledTimes(1);
  });

  it('card: FAILED after the grace window is final', async () => {
    get.mockResolvedValue(ok('FAILED'));
    const { cb } = run({ grace: 10_000 });
    await tick();
    expect(cb.onFailure).not.toHaveBeenCalled();
    await tick(12_000);
    expect(cb.onFailure).toHaveBeenCalledTimes(1);
  });
});

describe('delay, timeout and unreadable answers never produce success', () => {
  it('a delayed provider that only answers on the last attempt still ends as success exactly once', async () => {
    get.mockResolvedValue(ok('PENDING'));
    const { cb } = run({ maxAttempts: 4 });
    await tick(); await tick(); await tick();
    get.mockResolvedValue(ok('SUCCESS'));
    await tick();
    expect(cb.onSuccess).toHaveBeenCalledTimes(1);
    expect(cb.onError).not.toHaveBeenCalled();
  });

  it('a backend that refuses every check (action 0) ends as unknown after the last attempt', async () => {
    get.mockResolvedValue(refused);
    const { cb } = run({ maxAttempts: 3 });
    for (let i = 0; i < 4; i++) await tick();
    expect(cb.onError).toHaveBeenCalledTimes(1);
    expect(cb.onSuccess).not.toHaveBeenCalled();
    expect(cb.onFailure).not.toHaveBeenCalled();
  });

  it('network errors are retried, and only an exhausted budget is reported (as unknown)', async () => {
    get.mockRejectedValue(new Error('offline'));
    const { cb } = run({ maxAttempts: 3 });
    for (let i = 0; i < 4; i++) await tick();
    expect(cb.onError).toHaveBeenCalledTimes(1);
    expect(cb.onSuccess).not.toHaveBeenCalled();
    expect(cb.onFailure).not.toHaveBeenCalled();
  });

  it('an incomplete provider response (success flag but no data) is not a success', async () => {
    get.mockResolvedValue({ success: true });
    const { cb } = run({ maxAttempts: 3 });
    for (let i = 0; i < 4; i++) await tick();
    expect(cb.onSuccess).not.toHaveBeenCalled();
    expect(cb.onError).toHaveBeenCalledTimes(1);
  });

  it('a flaky network that recovers into SUCCESS is reported as paid once', async () => {
    get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(refused).mockResolvedValue(ok('SUCCESS'));
    const { cb } = run();
    await tick(); await tick(); await tick();
    expect(cb.onSuccess).toHaveBeenCalledTimes(1);
    expect(cb.onError).not.toHaveBeenCalled();
  });
});

describe('stopping', () => {
  it('a cancelled poll reports nothing, even if the answer was already in flight', async () => {
    let release: (v: unknown) => void = () => {};
    get.mockReturnValue(new Promise((r) => { release = r; }));
    const { cb, stop } = run();
    await tick();
    stop();
    release(ok('SUCCESS'));
    await tick(5000);
    expect(cb.onSuccess).not.toHaveBeenCalled();
    expect(cb.onFailure).not.toHaveBeenCalled();
    expect(cb.onError).not.toHaveBeenCalled();
  });
});

describe('which endpoint is asked', () => {
  it('an anonymous buyer is always sent to the public status route, even when the caller did not ask for it', async () => {
    get.mockResolvedValue(ok('SUCCESS'));
    run({ usePublic: false });
    await tick();
    expect(get.mock.calls[0][0]).toBe('/public/REF-1');
  });
});
