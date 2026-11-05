import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const DSN = 'https://abc123publickey@o1.ingest.de.sentry.io/4501';
const body = (dsn: string) => [JSON.stringify({ event_id: 'e', dsn }), JSON.stringify({ type: 'event' }), JSON.stringify({ message: 'x' })].join('\n');
const post = (text: string) => POST(new Request('http://localhost/api/monitoring', { method: 'POST', body: text }));

/** The tunnel is not an open relay: it forwards only this deployment's own DSN, to that DSN's host, and tells nobody anything. */
describe('POST /api/monitoring', () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));

  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    process.env.NEXT_PUBLIC_SENTRY_DSN = DSN;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });

  it('forwards an envelope for the configured DSN to its host and project', async () => {
    const res = await post(body(DSN));
    expect(res.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://o1.ingest.de.sentry.io/api/4501/envelope/');
    expect((init.headers as Record<string, string>)['X-Sentry-Auth']).toContain('sentry_key=abc123publickey');
    expect(init.body).toBe(body(DSN));
  });

  it('drops an envelope for any other DSN, so it cannot be used to reach another project or host', async () => {
    const res = await post(body('https://evil@attacker.example/999'));
    expect(res.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('drops garbage and oversized bodies without throwing', async () => {
    expect((await post('not json')).status).toBe(204);
    expect((await post('x'.repeat(300_000))).status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts and drops everything when no DSN is configured', async () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    expect((await post(body(DSN))).status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers the same way when Sentry is down', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sentry down'));
    const res = await post(body(DSN));
    expect(res.status).toBe(204);
  });
});
