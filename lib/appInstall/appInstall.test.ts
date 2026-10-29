import { describe, expect, it } from 'vitest';
import { PLAY_STORE_URL, APP_STORE_URL } from '@/lib/qr/eventQr';
import { appDeepLinkFor, destinationFor, dismissUntil, isPendingInstall, isWizardRoute, shouldShowWizard, storeUrlFor } from './appInstall';

const q = (s = '') => new URLSearchParams(s);
const base = { platform: 'android' as const, pathname: '/user/events/my-event', search: q(), now: 1_000_000, dismissedUntil: null, dismissedThisSession: false, standalone: false };

describe('which pages show the wizard', () => {
  it.each([
    '/user/events/view-event', '/user/events/bible-revival-conference', '/user/events/livestream/some-slug', '/user/events/livestream/some-slug/viewer1',
    '/user/events/join-event', '/user/find-my-photos', '/user/browse-photos/an-album', '/user/albums/free/ABC123', '/photographers/jane-doe',
    '/user/photographers/view-profile', '/wish/event-1',
  ])('shows on %s', (p) => expect(isWizardRoute(p)).toBe(true));

  it.each([
    '/', '/user/auth/login', '/user/complete-payment', '/user/events/join-package', '/user/events/live-stream', '/user/events', '/pay-to-watch',
    '/user/browse-photos/purchase/ref1', '/user/browse-photos/recover', '/user/help-center', '/user/terms-of-service', '/get-app',
  ])('does not show on %s', (p) => expect(isWizardRoute(p)).toBe(false));
});

describe('shouldShowWizard', () => {
  it('shows to a phone on a share page', () => expect(shouldShowWizard(base)).toBe(true));
  it('never shows on a desktop or an installed web app', () => {
    expect(shouldShowWizard({ ...base, platform: null })).toBe(false);
    expect(shouldShowWizard({ ...base, standalone: true })).toBe(false);
  });
  it('can be switched off or forced from the link', () => {
    expect(shouldShowWizard({ ...base, search: q('noapp=1') })).toBe(false);
    expect(shouldShowWizard({ ...base, search: q('app=0') })).toBe(false);
    expect(shouldShowWizard({ ...base, search: q('app=1'), dismissedUntil: base.now + 1e9 })).toBe(true);
  });
  it('stays hidden after "continue on the web" until the dismissal runs out', () => {
    expect(shouldShowWizard({ ...base, dismissedUntil: dismissUntil(base.now) })).toBe(false);
    expect(shouldShowWizard({ ...base, dismissedUntil: base.now - 1 })).toBe(true);
  });
  it('asks again on the next QR scan, and only skips within the same session', () => {
    const qr = { ...base, search: q('src=qr'), dismissedUntil: dismissUntil(base.now) };
    expect(shouldShowWizard(qr)).toBe(true);
    expect(shouldShowWizard({ ...qr, dismissedThisSession: true })).toBe(false);
  });
});

describe('the app link', () => {
  it('uses the route the page registered', () => expect(appDeepLinkFor('/user/events/x', q(), 'scan/e1')).toBe('connekt://scan/e1'));
  it('opens a wish page in the app with who invited you', () => {
    expect(appDeepLinkFor('/wish/e1', q('from=Amina'), null)).toBe('connekt://wish/e1?from=Amina');
    expect(appDeepLinkFor('/wish/e1', q(), null)).toBe('connekt://wish/e1');
  });
  it('opens the home screen when nothing more is known', () => expect(appDeepLinkFor('/user/find-my-photos', q('code=A'), null)).toBe('connekt://'));
});

describe('the store link', () => {
  it('tags Google Play and leaves the App Store listing plain', () => {
    expect(storeUrlFor('android', true)).toContain(PLAY_STORE_URL);
    expect(decodeURIComponent(storeUrlFor('android', true))).toContain('utm_medium=qr');
    expect(decodeURIComponent(storeUrlFor('android', false))).toContain('utm_medium=share_link');
    expect(storeUrlFor('ios', true)).toBe(APP_STORE_URL);
  });
});

describe('a pending install', () => {
  it('is offered for a day after the store was opened', () => {
    expect(isPendingInstall(1000, 1000 + 3600_000)).toBe(true);
    expect(isPendingInstall(1000, 1000 + 25 * 3600_000)).toBe(false);
    expect(isPendingInstall(null, 5)).toBe(false);
  });
});

describe('the destination saved for the app', () => {
  it('keeps the page and its query, without the wizard switches', () => {
    expect(destinationFor('/wish/e1', q('from=Amina&app=1'), null)).toBe('/wish/e1?from=Amina');
    expect(destinationFor('/user/find-my-photos', q('code=A1&noapp=1'), null)).toBe('/user/find-my-photos?code=A1');
    expect(destinationFor('/photographers/jane', q(), null)).toBe('/photographers/jane');
  });
  it('turns an event page into the id form the app can open', () => {
    expect(destinationFor('/user/events/bible-revival', q('src=qr'), 'scan/e1')).toBe('/user/events/view-event?id=e1&src=qr');
    expect(destinationFor('/user/events/bible-revival', q(), 'scan/e1')).toBe('/user/events/view-event?id=e1');
  });
  it('puts the link code in the Google Play referrer, and leaves the App Store alone', () => {
    expect(decodeURIComponent(storeUrlFor('android', false, 'ABCDEFGHJK'))).toContain('&dl=ABCDEFGHJK');
    expect(decodeURIComponent(storeUrlFor('android', false))).not.toContain('dl=');
    expect(storeUrlFor('ios', false, 'ABCDEFGHJK')).toBe(APP_STORE_URL);
  });
});
