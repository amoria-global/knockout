/**
 * Geo-pricing client (public web).
 *
 * Returns the stream price a visitor should see for their location. The
 * visitor's country is resolved server-side from their IP (the /api/remote
 * proxy forwards X-Forwarded-For), so listings and detail pages localize
 * automatically. When an event has no geo-pricing rules the default price is
 * returned unchanged.
 */

export type EffectivePrice = {
  eventId: string;
  price: number | null;
  currencyId?: string;
  currencyAbbreviation?: string;
  currencySymbol?: string;
  source?: 'COUNTRY' | 'CONTINENT' | 'DEFAULT';
  country?: string;
};

type Raw = Record<string, unknown>;
const num = (v: unknown): number | null =>
  typeof v === 'number' ? v : v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null;
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

function toEffective(d: Raw, fallbackId: string): EffectivePrice {
  return {
    eventId: str(d.eventId) ?? fallbackId,
    price: num(d.price),
    currencyId: str(d.currencyId),
    currencyAbbreviation: str(d.currencyAbbreviation),
    currencySymbol: str(d.currencySymbol),
    source: str(d.source) as EffectivePrice['source'],
    country: str(d.country),
  };
}

/** Localized effective price for one event. Returns null on any failure (caller falls back to the default price). */
export async function getEffectivePrice(eventId: string): Promise<EffectivePrice | null> {
  try {
    const res = await fetch(`/api/remote/public/events/${encodeURIComponent(eventId)}/effective-price`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Raw };
    return toEffective(json?.data ?? {}, eventId);
  } catch {
    return null;
  }
}

/** Batch effective prices for a listing grid, keyed by eventId. Missing ids simply won't appear. */
export async function getEffectivePrices(eventIds: string[]): Promise<Record<string, EffectivePrice>> {
  const out: Record<string, EffectivePrice> = {};
  if (eventIds.length === 0) return out;
  try {
    const res = await fetch(`/api/remote/public/events/effective-prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eventIds }),
    });
    if (!res.ok) return out;
    const json = (await res.json()) as { data?: Raw[] };
    for (const row of json?.data ?? []) {
      const e = toEffective(row, '');
      if (e.eventId) out[e.eventId] = e;
    }
  } catch {
    /* fall back to default prices */
  }
  return out;
}
