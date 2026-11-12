import * as Sentry from '@sentry/nextjs';
import { scrubSdkEvent } from './lib/errorSystem/sdkFilter';

/**
 * Server-side reporting for the Node runtime: an error thrown while rendering a page or handling a request reaches
 * Sentry with its stack, scrubbed the same way as the browser's. Nothing is sent unless a DSN is configured.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    tracesSampleRate: 0,
    beforeSend: scrubSdkEvent,
    initialScope: { tags: { app: 'landing', platform: 'server' } },
  });
}

export const onRequestError = Sentry.captureRequestError;
