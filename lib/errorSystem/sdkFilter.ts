import type { ErrorEvent } from '@sentry/nextjs';
import { scrubString } from './report';
import { isNoise } from './sentrySink';

/**
 * The Sentry SDK's last stop before an event leaves: drops what nobody can act on, strips anything personal, and keeps
 * `fatal` for a crashed page. It applies the same rules as the plain sender in `sentrySink.ts`, so an event looks the
 * same whichever path carried it.
 *
 * - Noise: a script injected by an in-app browser or extension, a stackless "Script error.", a bare network drop
 *   (`isNoise`). Judged on what the event says, never on who sent it.
 * - Personal data: the user block, cookies, request headers, the query string of the page URL and anything that looks
 *   like an email, phone number or token inside a message or an exception value (`scrubString`).
 * - Severity: only `tags.kind === 'page.crash'` stays `fatal`; any other fatal from the SDK (an uncaught error on a page
 *   that keeps running) becomes `error`.
 */
export function scrubSdkEvent<T extends ErrorEvent>(event: T): T | null {
  const values = event.exception?.values ?? [];
  const first = values[0];
  const message = typeof first?.value === 'string' ? first.value : typeof event.message === 'string' ? event.message : '';
  const stack = (first?.stacktrace?.frames ?? []).map((f) => f.filename ?? f.abs_path ?? '').join('\n');
  if (isNoise({ kind: 'crash', where: 'window.error', detail: { message, stack } })) return null;

  event.user = undefined;
  if (event.request) {
    const url = typeof event.request.url === 'string' ? event.request.url.split(/[?#]/, 1)[0] : undefined;
    event.request = { ...(url ? { url } : {}), ...(event.request.method ? { method: event.request.method } : {}) };
  }
  if (typeof event.message === 'string') event.message = scrubString(event.message);
  for (const v of values) {
    if (typeof v.value === 'string') v.value = scrubString(v.value);
  }
  // Breadcrumbs carry URLs, click targets and console text. Keep the category and level, drop the content.
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => ({ timestamp: b.timestamp, category: b.category, level: b.level, type: b.type }));
  }
  if (event.level === 'fatal' && event.tags?.kind !== 'page.crash') event.level = 'error';
  return event;
}
