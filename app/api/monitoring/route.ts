import { NextResponse } from 'next/server';

/**
 * Forwards error reports from this site's pages to Sentry, so the browser only ever talks to its own origin and an ad
 * blocker that blocks sentry.io does not hide errors.
 *
 * It is not an open relay: it forwards only an envelope whose DSN is the one this deployment is configured with
 * (`NEXT_PUBLIC_SENTRY_DSN`), to the host and project in that DSN, and caps the size. It always answers the same way,
 * so it tells a caller nothing about Sentry. With no DSN configured it accepts and drops everything.
 */
const MAX_BYTES = 200_000;

export async function POST(req: Request) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const m = dsn ? /^(https?):\/\/([A-Za-z0-9]+)(?::[^@]*)?@([^/]+)\/(\d+)\/?$/.exec(dsn.trim()) : null;
  if (!m) return new NextResponse(null, { status: 204 });
  const [, protocol, key, host, projectId] = m;

  try {
    const text = await req.text();
    if (text.length > MAX_BYTES) return new NextResponse(null, { status: 204 });
    const header = JSON.parse(text.split('\n', 1)[0] || '{}') as { dsn?: string };
    if (header.dsn !== dsn) return new NextResponse(null, { status: 204 });
    await fetch(`${protocol}://${host}/api/${projectId}/envelope/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=connekyt-tunnel/1.0, sentry_key=${key}`,
      },
      body: text,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* a reporting failure must never surface to the page */
  }
  return new NextResponse(null, { status: 204 });
}
