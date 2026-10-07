import { describe, it, expect, afterEach, vi } from 'vitest';
import { appDeepLink, detectMobilePlatform, PLAY_STORE_URL } from './eventQr';

/**
 * Pins the rules of the event QR gate:
 *  - the deep link carries the scanned event id to the installed app
 *  - phones and tablets are detected, desktops are exempt
 *  - the Play link points at the shipped Android package
 */
function stubNavigator(userAgent: string, maxTouchPoints = 0) {
  vi.stubGlobal('navigator', { userAgent, maxTouchPoints });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('appDeepLink', () => {
  it('targets the scan route with the event id', () => {
    expect(appDeepLink('abc-123')).toBe('connekt://scan/abc-123');
  });

  it('encodes ids that are not url safe', () => {
    expect(appDeepLink('a/b c')).toBe('connekt://scan/a%2Fb%20c');
  });
});

describe('detectMobilePlatform', () => {
  it('detects Android phones', () => {
    stubNavigator('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126 Mobile Safari/537.36');
    expect(detectMobilePlatform()).toBe('android');
  });

  it('detects iPhones', () => {
    stubNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15');
    expect(detectMobilePlatform()).toBe('ios');
  });

  it('detects iPadOS, which reports itself as a Mac with touch', () => {
    stubNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 5);
    expect(detectMobilePlatform()).toBe('ios');
  });

  it('exempts desktop browsers, including a real Mac', () => {
    stubNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126 Safari/537.36');
    expect(detectMobilePlatform()).toBeNull();
    stubNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 0);
    expect(detectMobilePlatform()).toBeNull();
  });
});

describe('PLAY_STORE_URL', () => {
  it('points at the shipped Android package', () => {
    expect(PLAY_STORE_URL).toContain('id=com.amoria.connekyt.app');
  });
});
