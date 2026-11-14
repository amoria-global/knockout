import { describe, expect, it } from 'vitest';
import type { ErrorEvent } from '@sentry/nextjs';
import { scrubSdkEvent } from './sdkFilter';

/** What the Sentry SDK is allowed to send: nothing nobody can act on, nothing personal, fatal only for a crashed page. */
const event = (over: Partial<ErrorEvent> = {}, message = 'boom', filename = 'https://connekyt.com/_next/static/chunks/app.js'): ErrorEvent =>
  ({
    type: undefined,
    exception: { values: [{ type: 'Error', value: message, stacktrace: { frames: [{ filename }] } }] },
    level: 'error',
    ...over,
  }) as ErrorEvent;

describe('scrubSdkEvent: noise', () => {
  it.each([
    ['an in-app browser script', event({}, 'Error invoking postMessage: Java object is gone', 'iabjs://navigation_performance_logger_android')],
    ['a browser extension', event({}, 'x is not a function', 'chrome-extension://abcdef/content.js')],
    ['a cross-origin script error', event({}, 'Script error.', '')],
    ['a dropped connection', event({}, 'Failed to fetch', 'https://connekyt.com/_next/static/chunks/app.js')],
  ])('drops %s', (_n, e) => {
    expect(scrubSdkEvent(e)).toBeNull();
  });

  it('keeps a real error from our bundle', () => {
    expect(scrubSdkEvent(event({}, "Cannot read properties of undefined (reading 'id')"))).not.toBeNull();
  });
});

describe('scrubSdkEvent: scanner probes', () => {
  const probe = (over: Partial<ErrorEvent> = {}) =>
    event({ request: { method: 'POST', url: 'https://connekyt.com/' }, contexts: { nextjs: { route_type: 'action' } }, ...over }, 'useLanguage must be used within LanguageProvider');

  it('drops a Server Action POST to a page that fails to render', () => {
    expect(scrubSdkEvent(probe())).toBeNull();
  });

  it('keeps the same error on an ordinary page request, which would be a real bug', () => {
    expect(scrubSdkEvent(probe({ request: { method: 'GET', url: 'https://connekyt.com/' } }))).not.toBeNull();
    expect(scrubSdkEvent(probe({ contexts: { nextjs: { route_type: 'render' } } }))).not.toBeNull();
  });

  it('keeps any other error from a Server Action', () => {
    expect(scrubSdkEvent(event({ request: { method: 'POST', url: 'https://connekyt.com/' }, contexts: { nextjs: { route_type: 'action' } } }, 'db is down'))).not.toBeNull();
  });
});

describe('scrubSdkEvent: personal data', () => {
  it('removes the user, cookies, headers and the URL query, and scrubs emails and phone numbers in messages', () => {
    const e = scrubSdkEvent(
      event(
        {
          user: { ip_address: '197.0.0.1', email: 'jo@mail.com' },
          request: { url: 'https://connekyt.com/pay?email=jo@mail.com#x', method: 'GET', headers: { cookie: 'a=b' }, cookies: { a: 'b' } },
          message: 'failed for jo@mail.com on +250 788 123 456',
          breadcrumbs: [{ timestamp: 1, category: 'ui.click', level: 'info', message: 'clicked jo@mail.com', data: { to: '/pay?email=jo@mail.com' } }],
        },
        'bad value for jo@mail.com',
      ),
    )!;
    const text = JSON.stringify(e);
    expect(e.user).toBeUndefined();
    expect(e.request).toEqual({ url: 'https://connekyt.com/pay', method: 'GET' });
    expect(text).not.toContain('jo@mail.com');
    expect(text).not.toContain('788 123 456');
    expect(e.breadcrumbs).toEqual([{ timestamp: 1, category: 'ui.click', level: 'info', type: undefined }]);
  });
});

describe('scrubSdkEvent: severity', () => {
  it('turns an ordinary fatal into error', () => {
    expect(scrubSdkEvent(event({ level: 'fatal' }))!.level).toBe('error');
  });

  it('keeps fatal for a crashed page', () => {
    expect(scrubSdkEvent(event({ level: 'fatal', tags: { kind: 'page.crash' } }))!.level).toBe('fatal');
  });
});
