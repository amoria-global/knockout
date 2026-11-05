import { setErrorSink } from './report';
import { createSentrySink, installCrashReporting } from './sentrySink';

let started = false;

/**
 * Turns error reporting on when a DSN is configured: `NEXT_PUBLIC_SENTRY_DSN`, read at build time like every
 * NEXT_PUBLIC value. Without one this does nothing, so it is safe to ship before the Sentry project exists. Events go to
 * this site's own `/api/monitoring` (which forwards them to Sentry), so an ad blocker that blocks sentry.io does not hide
 * errors. Called once from `ErrorHost`; further calls are ignored.
 */
export function startErrorReporting(dsn: string | undefined = process.env.NEXT_PUBLIC_SENTRY_DSN): boolean {
  if (started || typeof window === 'undefined') return false;
  const sink = dsn
    ? createSentrySink({
        dsn,
        endpoint: '/api/monitoring',
        app: 'landing',
        platform: 'web',
        release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      })
    : null;
  if (!sink) return false;
  started = true;
  setErrorSink(sink);
  installCrashReporting(sink);
  return true;
}
