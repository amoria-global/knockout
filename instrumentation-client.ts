import * as Sentry from '@sentry/nextjs';
import { scrubSdkEvent } from './lib/errorSystem/sdkFilter';

/**
 * Browser error reporting through the Sentry SDK, so uncaught errors carry real stack frames that the uploaded source
 * maps turn into file and line. Reports go to this site's own `/api/monitoring` (which forwards them to Sentry), so an ad
 * blocker that blocks sentry.io does not hide them. Nothing is sent unless a DSN is configured.
 *
 * The release is set by the build (the git commit), see next.config.ts. No tracing or replay, and the SDK sends no personal data by default.
 * Handled failures that show a support code still go through `lib/errorSystem/sentrySink.ts`.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tunnel: '/api/monitoring',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    tracesSampleRate: 0,
    beforeSend: scrubSdkEvent,
    initialScope: { tags: { app: 'landing', platform: 'web' } },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
