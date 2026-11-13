/**
 * Shared presentation helpers for hybrid offers and candidate pricing
 * (mirroring mobile `offerPresentation.ts`).
 */
import type { ParsedOfferBrief } from './offerBrief';
import type { CandidateSummary } from './hybridBooking';

export function normalizeCurrency(code?: string | null): string {
  const c = (code ?? '').trim().toUpperCase();
  if (!c || c === 'RF' || c === 'RWF') return 'RWF';
  return c;
}

export function formatMoney(amount: number, currency?: string | null): string {
  return `${normalizeCurrency(currency)} ${Math.round(amount).toLocaleString('en-US')}`;
}

export function titleCasePlace(text: string): string {
  return text.replace(/(^|[\s·•,-]+)([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

export type DifferenceTone = 'positive' | 'warning' | 'neutral';

export function packageDifference(
  offer: number | null,
  packagePrice: number | null,
  currency?: string | null,
): { tone: DifferenceTone; text: string } | null {
  if (packagePrice == null) return null;
  if (offer == null) return { tone: 'neutral', text: `${formatMoney(packagePrice, currency)} package rate` };
  const diff = Math.round(offer - packagePrice);
  if (Math.abs(diff) < 500) return { tone: 'neutral', text: "Client's offer matches your package" };
  if (diff > 0) {
    return { tone: 'positive', text: `Client offers ${formatMoney(diff, currency)} more than your package` };
  }
  return { tone: 'warning', text: `Client's offer is ${formatMoney(Math.abs(diff), currency)} below your package` };
}

export type LabelValue = { label: string; value: string };

const isNone = (v: string) => /^(none|no|0|not requested|not required|n\/a|-)?$/i.test(v.trim());
const isNoneStrict = (v: string) => /^(none|no|0|n\/a|-)?$/i.test(v.trim());

export function deliverableRows(brief: ParsedOfferBrief, opts: { liveStream?: boolean; wishes?: boolean } = {}): LabelValue[] {
  const rows: LabelValue[] = [];
  const missing: string[] = [];
  const add = (label: string, value: string, missingName: string) => {
    if (isNoneStrict(value)) missing.push(missingName);
    else rows.push({ label, value });
  };
  rows.push({ label: 'Coverage', value: brief.coverageHoursLabel });
  add('Edited photos', brief.editedPhotosLabel, 'photos');
  add('Short videos', brief.shortVideosLabel, 'short videos');
  add('Long videos', brief.longVideosLabel, 'long video');
  add('Photo book', brief.photoBookLabel, 'book');
  add('Photo album', brief.photoAlbumLabel, 'album');
  add('Wall portraits', brief.wallPortraitsLabel, 'portraits');
  rows.push({ label: 'Instant updates', value: isNone(brief.instantUpdatesLabel) ? 'Not required' : brief.instantUpdatesLabel });
  if (opts.liveStream || !isNone(brief.liveStreamLabel)) {
    rows.push({ label: 'Live stream', value: isNone(brief.liveStreamLabel) ? 'Requested' : brief.liveStreamLabel });
  }
  if (opts.wishes || !isNone(brief.instantWishesLabel)) {
    rows.push({ label: 'Wishes & memories', value: isNone(brief.instantWishesLabel) ? 'Enabled' : brief.instantWishesLabel });
  }
  if (missing.length) {
    const list = missing.join(', ');
    rows.push({ label: 'Not included', value: list.charAt(0).toUpperCase() + list.slice(1) });
  }
  return rows;
}

export function deliveryRows(brief: ParsedOfferBrief): LabelValue[] {
  const hasPrints = ![brief.photoBookLabel, brief.photoAlbumLabel, brief.wallPortraitsLabel].every(isNoneStrict);
  const print = !hasPrints
    ? 'No print products'
    : /^propose/i.test(brief.printDeliveryLabel) || isNoneStrict(brief.printDeliveryLabel)
      ? 'You propose the date'
      : brief.printDeliveryLabel;
  return [
    { label: 'Digital', value: brief.digitalDeliveryLabel },
    { label: 'Print products', value: print },
  ];
}

export type PricedPackageItem = {
  id: string;
  name: string;
  price?: number;
  currency?: string;
  deliveryDays?: number;
  durationHours?: number;
  includedPhotos?: number;
  includedVideos?: number;
  description?: string;
};

export function nearestPackageIdToBudget<T extends { id: string; price?: number }>(
  packages: T[],
  budget?: number | null,
  preferredPackageId?: string | null,
): string | null {
  if (!packages.length) return null;
  if (budget != null && Number.isFinite(budget) && budget > 0) {
    let bestId: string | null = null;
    let bestDiff = Infinity;
    for (const pk of packages) {
      if (typeof pk.price === 'number' && Number.isFinite(pk.price) && pk.price > 0) {
        const diff = Math.abs(pk.price - budget);
        if (diff < bestDiff || (diff === bestDiff && pk.id === preferredPackageId)) {
          bestDiff = diff;
          bestId = pk.id;
        }
      }
    }
    if (bestId) return bestId;
  }
  if (preferredPackageId && packages.some((p) => p.id === preferredPackageId)) {
    return preferredPackageId;
  }
  return packages[0]?.id ?? null;
}

export function sortPackagesByBudget<T extends { id: string; price?: number }>(
  packages: T[],
  budget?: number | null,
  preferredPackageId?: string | null,
): T[] {
  return [...packages].sort((a, b) => {
    if (preferredPackageId) {
      if (a.id === preferredPackageId && b.id !== preferredPackageId) return -1;
      if (b.id === preferredPackageId && a.id !== preferredPackageId) return 1;
    }
    if (budget != null && Number.isFinite(budget) && budget > 0) {
      const da = typeof a.price === 'number' && Number.isFinite(a.price) ? Math.abs(a.price - budget) : Infinity;
      const db = typeof b.price === 'number' && Number.isFinite(b.price) ? Math.abs(b.price - budget) : Infinity;
      if (da !== db) return da - db;
    }
    return (a.price ?? 0) - (b.price ?? 0);
  });
}

export type CandidateChargingSummary = {
  amount: number | null;
  currency: string;
  label: string;
  packageName?: string;
  isSuggestedPackage: boolean;
};

export function candidateChargingSummary(
  c: CandidateSummary,
  clientBudget?: number | null,
  defaultCurrency = 'RWF',
): CandidateChargingSummary {
  const offerAmt = clientBudget != null && Number.isFinite(clientBudget) && clientBudget > 0 ? clientBudget : null;
  if (c.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE') {
    if (c.pricingMode === 'CLIENT_OFFER') {
      const amt = c.proposedPrice ?? offerAmt;
      return {
        amount: amt ?? null,
        currency: normalizeCurrency(c.matchedPackageCurrency || defaultCurrency),
        label: 'Offer price · Package policy',
        isSuggestedPackage: false,
      };
    }
    const pkgPrice = c.proposedPrice ?? c.matchedPackagePrice ?? null;
    if (pkgPrice != null && pkgPrice > 0) {
      return {
        amount: pkgPrice,
        currency: normalizeCurrency(c.matchedPackageCurrency || defaultCurrency),
        label: c.matchedPackageName ? `Suggested: ${c.matchedPackageName}` : 'Suggested package price',
        packageName: c.matchedPackageName,
        isSuggestedPackage: true,
      };
    }
    return {
      amount: offerAmt,
      currency: normalizeCurrency(defaultCurrency),
      label: 'Package delivery policy',
      isSuggestedPackage: false,
    };
  }
  const amt = c.proposedPrice ?? offerAmt ?? c.matchedPackagePrice ?? null;
  return {
    amount: amt,
    currency: normalizeCurrency(defaultCurrency),
    label: 'Accepted offer price',
    isSuggestedPackage: false,
  };
}
