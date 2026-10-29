/**
 * The rules of the "get the app" wizard: which pages show it, what the app opens, where the store link points and how long
 * a dismissal lasts. Pure, so the component is only layout. The pages it covers are the ones people reach from a shared
 * link or a scanned QR code (an event, a live stream, an album, a photographer, a wish, Find My Photos); sign-in,
 * checkout, help and legal pages never show it.
 */
import { APP_STORE_URL, PLAY_STORE_URL, type MobilePlatform } from '@/lib/qr/eventQr';

export const DISMISS_KEY = 'connekyt.appWizard.dismissedUntil';
export const SESSION_DISMISS_KEY = 'connekyt.appWizard.dismissedSession';
export const PENDING_INSTALL_KEY = 'connekyt.appWizard.pendingInstall';
/** A plain "continue on the web" hides the wizard this long. A QR scan is asked again on the next scan. */
export const DISMISS_DAYS = 3;
/** After the store was opened, "did you install it?" is offered for this long. */
export const PENDING_INSTALL_HOURS = 24;

const WIZARD_ROUTES: RegExp[] = [
  /^\/user\/events\/view-event\/?$/,
  /^\/user\/events\/(?!join-event|join-package|live-stream|livestream|view-event)[^/]+\/?$/,
  /^\/user\/events\/livestream\/[^/]+(\/[^/]+)?\/?$/,
  /^\/user\/events\/join-event\/?$/,
  /^\/user\/events\/live-stream\/?$/,
  /^\/user\/events\/photobooks\/[^/]+\/?$/,
  /^\/user\/gallery\/album\/?$/,
  /^\/pay-to-watch\/?$/,
  /^\/user\/find-my-photos\/?$/,
  /^\/user\/browse-photos\/(?!purchase|recover)[^/]+\/?$/,
  /^\/user\/albums\/free\/[^/]+\/?$/,
  /^\/photographers\/[^/]+\/?$/,
  /^\/user\/photographers\/view-profile\/?$/,
  /^\/wish\/[^/]+\/?$/,
];

export function isWizardRoute(pathname: string): boolean {
  return WIZARD_ROUTES.some((re) => re.test(pathname));
}

/** Whether the visit came from a scanned QR code (?src=qr). */
export function isQrVisit(search: URLSearchParams): boolean {
  return search.get('src') === 'qr';
}

/**
 * The custom-scheme link that opens the app on this content. A page that knows its own app route registers it (`target`,
 * for example "scan/<eventId>"); a wish link carries its own; anything else opens the app's home screen.
 */
export function appDeepLinkFor(pathname: string, search: URLSearchParams, target: string | null): string {
  if (target) return `connekt://${target}`;
  const wish = pathname.match(/^\/wish\/([^/]+)/);
  if (wish) {
    const from = search.get('from');
    return `connekt://wish/${wish[1]}${from ? `?from=${encodeURIComponent(from)}` : ''}`;
  }
  // The pages whose content the installed app can open by id (the id comes from the link, so it is checked first).
  const id = (v: string | null) => (v && /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : null);
  const photobook = pathname.match(/^\/user\/events\/photobooks\/([^/]+)/);
  if (photobook && id(photobook[1])) return `connekt://photobook/${photobook[1]}`;
  if (pathname === '/user/gallery/album' && id(search.get('id'))) return `connekt://album/${search.get('id')}`;
  const eventId = id(search.get('eventId')) ?? id(search.get('id'));
  if (pathname === '/user/events/view-event' && eventId) return `connekt://scan/${eventId}`;
  if ((pathname === '/user/events/live-stream' || pathname === '/pay-to-watch') && eventId) return `connekt://event/${eventId}`;
  return 'connekt://';
}

/**
 * The store listing for the phone. Google Play carries a referrer back to the installed app, so it is tagged to tell wizard
 * installs apart and, when the destination was saved, carries its code (`dl`) so the app can open exactly that page.
 */
export function storeUrlFor(platform: Exclude<MobilePlatform, null>, fromQr: boolean, code: string | null = null): string {
  if (platform === 'ios') return APP_STORE_URL;
  const referrer = `utm_source=connekyt_web&utm_medium=${fromQr ? 'qr' : 'share_link'}&utm_campaign=app_install_wizard${code ? `&dl=${code}` : ''}`;
  return `${PLAY_STORE_URL}&referrer=${encodeURIComponent(referrer)}`;
}

/**
 * The page the visitor was going to, as a path the backend accepts. An event page registers its app route
 * (scan/<eventId>); that becomes the id form of the event link, which the app can open, where a slug cannot be resolved
 * there. The wizard's own switches are dropped.
 */
export function destinationFor(pathname: string, search: URLSearchParams, target: string | null): string {
  const scan = target?.match(/^scan\/([^/?#]+)$/);
  if (scan) {
    const id = decodeURIComponent(scan[1]);
    return `/user/events/view-event?id=${encodeURIComponent(id)}${isQrVisit(search) ? '&src=qr' : ''}`;
  }
  const kept = new URLSearchParams(search);
  ['app', 'noapp'].forEach((k) => kept.delete(k));
  const q = kept.toString();
  return `${pathname}${q ? `?${q}` : ''}`;
}

export function shouldShowWizard(input: {
  platform: MobilePlatform;
  pathname: string;
  search: URLSearchParams;
  now: number;
  /** Epoch ms until which a "continue on the web" hides the wizard, or null. */
  dismissedUntil: number | null;
  /** True once the visitor dismissed it during this browser session (the QR case). */
  dismissedThisSession: boolean;
  /** Already running as an installed web app. */
  standalone: boolean;
}): boolean {
  const { platform, pathname, search, now, dismissedUntil, dismissedThisSession, standalone } = input;
  if (!platform || standalone) return false;
  if (!isWizardRoute(pathname)) return false;
  if (search.get('noapp') === '1' || search.get('app') === '0') return false;
  if (search.get('app') === '1') return true;
  // The app opens its own checkout pages in its in-app browser and always adds lang=; a link someone shares never has it.
  // That keeps people already in the app, including those on a version before the noapp marker, out of the prompt.
  if (search.has('lang') || search.has('locale')) return false;
  if (isQrVisit(search)) return !dismissedThisSession;
  return !(dismissedUntil !== null && dismissedUntil > now);
}

export function dismissUntil(now: number): number {
  return now + DISMISS_DAYS * 24 * 3600 * 1000;
}

export function isPendingInstall(at: number | null, now: number): boolean {
  return at !== null && now - at < PENDING_INSTALL_HOURS * 3600 * 1000;
}
