"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import XentriPayModal from "../components/XentriPayModal";
import type { MultiAlbumPurchaseItem } from "@/lib/APIs/payments/xentripay";

/**
 * Public stock-photo browse + buy.
 *
 * Layout intent (per spec):
 *   - 4 photos per row, no gaps, no border-radius (just edge-to-edge browsing)
 *   - Each card overlays bottom-left with photographer logo + name only
 *   - No captions, no descriptions, no titles on the image itself
 *   - Click toggles add/remove from cart (selection highlight)
 *
 * Filters across the top bar:
 *   - Search by keyword
 *   - Category dropdown (only categories that have live photos)
 *   - Photographer dropdown (only photographers with live photos)
 *   - Min/Max price (in the buyer's chosen currency)
 *   - Buyer currency picker (drives the price display + cart total)
 *
 * Cart is a sticky right-side drawer with checkout button.
 *
 * Auth: NONE. Buyer identifies via email at checkout. The post-purchase
 * email contains a ZIP attachment + a re-download link; the recovery
 * flow (/user/browse-photos/recover) lets them re-issue from any device.
 */

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL
    || "https://backend.connekyt.com").replace(/\/$/, "");

interface BrowseRow {
  imageId: string;
  galleryId: string;
  title: string;
  category: string | null;
  categoryLabel: string | null;
  fileUrl: string;
  photographerId: string | null;
  photographerName: string;
  photographerLogo: string | null;
  listingPrice: number;
  listingCurrency: string | null;
  buyerPrice: number;
  buyerCurrency: string;
}
interface CategoryOption { name: string; label: string; count: number; }
interface PhotographerOption { id: string; name: string; logo: string | null; }
interface CurrencyOption { id: string; code: string; symbol: string; }

const CURRENCIES: CurrencyOption[] = [
  { id: 'USD', code: 'USD', symbol: '$' },
  { id: 'EUR', code: 'EUR', symbol: '€' },
  { id: 'GBP', code: 'GBP', symbol: '£' },
  { id: 'RWF', code: 'RWF', symbol: 'RWF' },
  { id: 'KES', code: 'KES', symbol: 'KSh' },
];

export default function BrowsePhotosPage() {
  // ── State ────────────────────────────────────────────────────
  const [items, setItems] = useState<BrowseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(48);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [photographers, setPhotographers] = useState<PhotographerOption[]>([]);

  // Filters
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [photographerId, setPhotographerId] = useState('');
  const [buyerCurrency, setBuyerCurrency] = useState('USD');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Cart (map keyed by imageId so toggle is O(1))
  const [cart, setCart] = useState<Record<string, BrowseRow>>({});
  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = useMemo(
    () => cartItems.reduce((s, i) => s + Number(i.buyerPrice || 0), 0),
    [cartItems]
  );

  // Checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [showXentri, setShowXentri] = useState(false);

  // ── Debounce search input ──
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // ── Load filter dropdowns once on mount ──
  useEffect(() => {
    (async () => {
      try {
        const [catRes, pgRes] = await Promise.all([
          fetch(`${BACKEND_BASE}/api/public/content/categories`, { cache: 'no-store' }),
          fetch(`${BACKEND_BASE}/api/public/content/photographers`, { cache: 'no-store' }),
        ]);
        if (catRes.ok) {
          const j = await catRes.json();
          setCategories(j?.data?.categories ?? []);
        }
        if (pgRes.ok) {
          const j = await pgRes.json();
          setPhotographers(j?.data?.photographers ?? []);
        }
      } catch { /* silent — feed still loads */ }
    })();
  }, []);

  // ── Browse load (reacts to filters + page) ──
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${BACKEND_BASE}/api/public/content/browse`);
      if (qDebounced) url.searchParams.set('q', qDebounced);
      if (category) url.searchParams.set('category', category);
      if (photographerId) url.searchParams.set('photographerId', photographerId);
      if (minPrice) url.searchParams.set('minPrice', minPrice);
      if (maxPrice) url.searchParams.set('maxPrice', maxPrice);
      url.searchParams.set('currency', buyerCurrency);
      url.searchParams.set('page', String(page));
      url.searchParams.set('size', String(size));
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      if (j?.action === 1 && j.data) {
        setItems(j.data.items || []);
        setTotal(j.data.total || 0);
      } else {
        setItems([]); setTotal(0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load photos');
      setItems([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [qDebounced, category, photographerId, minPrice, maxPrice, buyerCurrency, page, size]);
  useEffect(() => { void load(); }, [load]);

  // Reset to page 0 when any filter (other than the page itself) changes.
  // Without this, applying a tighter filter on a deep page would show
  // "no photos" until the user manually paged back.
  const filtersKey = `${qDebounced}|${category}|${photographerId}|${minPrice}|${maxPrice}|${buyerCurrency}`;
  const lastFiltersKey = useRef(filtersKey);
  useEffect(() => {
    if (lastFiltersKey.current !== filtersKey) {
      lastFiltersKey.current = filtersKey;
      setPage(0);
    }
  }, [filtersKey]);

  const toggleCart = (row: BrowseRow) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[row.imageId]) delete next[row.imageId];
      else next[row.imageId] = row;
      return next;
    });
  };
  const removeFromCart = (imageId: string) => {
    setCart(prev => { const n = { ...prev }; delete n[imageId]; return n; });
  };
  const clearCart = () => setCart({});

  const sym = useMemo(
    () => CURRENCIES.find(c => c.code === buyerCurrency)?.symbol || buyerCurrency,
    [buyerCurrency]
  );

  // Build the multi-album items payload for XentriPay. Grouped by gallery
  // so each row in album_purchases lands under the right photographer for
  // the revenue split. Amount is sent in the GALLERY's listing currency
  // (the backend converts each row to RWF for the gateway charge — same
  // contract as the existing face-scan multi-album flow).
  const multiAlbumItems: MultiAlbumPurchaseItem[] = useMemo(() => {
    const groups = new Map<string, { items: BrowseRow[], totalListing: number, currency: string }>();
    for (const it of cartItems) {
      const g = groups.get(it.galleryId) || { items: [], totalListing: 0, currency: it.listingCurrency || 'USD' };
      g.items.push(it);
      g.totalListing += Number(it.listingPrice || 0);
      groups.set(it.galleryId, g);
    }
    return Array.from(groups.entries()).map(([galleryId, g]) => ({
      albumId: galleryId,
      photoIds: g.items.map(i => i.imageId),
      amount: g.totalListing,
      currencyId: g.currency, // backend resolves UUID or abbreviation
    }));
  }, [cartItems]);

  const buyerCurrencyId = useMemo(
    () => CURRENCIES.find(c => c.code === buyerCurrency)?.id || 'USD',
    [buyerCurrency]
  );

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    setCheckoutOpen(true);
  };
  const handleEmailContinue = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }
    setCheckoutOpen(false);
    setShowXentri(true);
  };
  const handlePurchaseSuccess = (refid: string) => {
    setShowXentri(false);
    clearCart();
    if (typeof window !== 'undefined') {
      window.location.href = `/user/browse-photos/purchase/${refid}`;
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / size));

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <Navbar />

      <main style={{ minHeight: '100vh', background: '#f9fafb', paddingTop: 80 }}>
        {/* Filter bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search photos, photographers, keywords…"
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none' }}
              />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.label} ({c.count})</option>
              ))}
            </select>
            <select value={photographerId} onChange={e => setPhotographerId(e.target.value)} style={selectStyle}>
              <option value="">All photographers</option>
              {photographers.map(p => (
                <option key={p.id} value={p.id}>{p.name || '—'}</option>
              ))}
            </select>
            <select value={buyerCurrency} onChange={e => setBuyerCurrency(e.target.value)} style={{ ...selectStyle, width: 90 }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
            <input
              type="number" placeholder="Min" value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              style={{ ...selectStyle, width: 85 }}
            />
            <input
              type="number" placeholder="Max" value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              style={{ ...selectStyle, width: 85 }}
            />
            {(q || category || photographerId || minPrice || maxPrice) && (
              <button type="button" onClick={() => { setQ(''); setCategory(''); setPhotographerId(''); setMinPrice(''); setMaxPrice(''); }}
                style={{ padding: '8px 12px', fontSize: 12.5, fontWeight: 600, background: 'transparent', color: '#F20C8F', border: 'none', cursor: 'pointer' }}>
                Clear
              </button>
            )}
            <Link href="/user/browse-photos/recover" style={{ marginLeft: 'auto', fontSize: 12.5, color: '#054d6f', textDecoration: 'none', fontWeight: 600 }}>
              <i className="bi bi-arrow-clockwise" /> Recover past purchases
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 0, maxWidth: 1400, margin: '0 auto', minHeight: 'calc(100vh - 200px)' }}>
          {/* ── Grid ── */}
          <section>
            {error && (
              <div style={{ padding: 16, color: '#991b1b', background: '#fef2f2' }}>
                {error}. <button type="button" onClick={() => load()} style={{ background: 'none', border: 'none', color: '#F20C8F', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
              </div>
            )}
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Loading photos…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>
                No photos match your filters. <button type="button" onClick={() => { setQ(''); setCategory(''); setPhotographerId(''); setMinPrice(''); setMaxPrice(''); }} style={{ background: 'none', border: 'none', color: '#F20C8F', cursor: 'pointer', fontWeight: 600 }}>Clear filters</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
                {items.map(it => {
                  const selected = !!cart[it.imageId];
                  return (
                    <div
                      key={it.imageId}
                      onClick={() => toggleCart(it)}
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        aspectRatio: '1 / 1',
                        background: '#000',
                        overflow: 'hidden',
                        outline: selected ? '4px solid #F20C8F' : 'none',
                        outlineOffset: -4,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.fileUrl}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none', pointerEvents: 'none' }}
                      />
                      {/* Light watermark to discourage right-click steal even though we already block it */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0) 0 80px, rgba(255,255,255,0.06) 80px 81px)',
                        pointerEvents: 'none',
                      }} />

                      {/* Bottom-left: photographer logo + name */}
                      <div style={{
                        position: 'absolute', left: 8, bottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 8px 4px 4px',
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        maxWidth: 'calc(100% - 16px)',
                      }}>
                        {it.photographerLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.photographerLogo} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                            {(it.photographerName || '·').trim().charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {it.photographerName || '—'}
                        </span>
                      </div>

                      {/* Top-right: price chip */}
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        background: selected ? '#F20C8F' : 'rgba(0,0,0,0.55)',
                        color: '#fff', fontSize: 11.5, fontWeight: 700,
                        padding: '3px 7px',
                      }}>
                        {sym} {Number(it.buyerPrice || 0).toFixed(buyerCurrency === 'RWF' ? 0 : 2)}
                      </div>

                      {/* Selection check */}
                      {selected && (
                        <div style={{ position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: '50%', background: '#F20C8F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          <i className="bi bi-check-lg" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 24 }}>
                <button type="button" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
                  style={pagerBtn(page === 0)}>← Prev</button>
                <span style={{ alignSelf: 'center', fontSize: 13, color: '#6b7280' }}>Page {page + 1} / {totalPages}</span>
                <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
                  style={pagerBtn(page + 1 >= totalPages)}>Next →</button>
              </div>
            )}
          </section>

          {/* ── Cart drawer (sticky right) ── */}
          <aside style={{ position: 'sticky', top: 80, height: 'calc(100vh - 80px)', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 14 }}>Cart ({cartItems.length})</strong>
              {cartItems.length > 0 && (
                <button type="button" onClick={clearCart} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Clear</button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {cartItems.length === 0 ? (
                <div style={{ padding: '24px 8px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                  Click any photo to add it to your cart.
                </div>
              ) : (
                cartItems.map(it => (
                  <div key={it.imageId} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid #f9fafb' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.fileUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
                      <div style={{ color: '#1f2937', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.photographerName || '—'}</div>
                      <div style={{ color: '#6b7280', fontSize: 11 }}>{it.categoryLabel || ''}</div>
                      <div style={{ color: '#054d6f', fontWeight: 700 }}>{sym} {Number(it.buyerPrice || 0).toFixed(buyerCurrency === 'RWF' ? 0 : 2)}</div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(it.imageId)} aria-label="Remove"
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, alignSelf: 'flex-start' }}>×</button>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: 14, borderTop: '1px solid #f0f2f5', background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: '#6b7280' }}>Total</span>
                <strong style={{ color: '#111' }}>{sym} {cartTotal.toFixed(buyerCurrency === 'RWF' ? 0 : 2)}</strong>
              </div>
              <button type="button" onClick={handleCheckoutClick} disabled={cartItems.length === 0}
                style={{ width: '100%', padding: '12px 14px', background: cartItems.length === 0 ? '#e5e7eb' : '#F20C8F', color: cartItems.length === 0 ? '#9ca3af' : '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer' }}>
                Checkout
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Email-collection step before launching XentriPay */}
      {checkoutOpen && (
        <div onClick={() => setCheckoutOpen(false)} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={modalCard}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>One last step</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>
              We&apos;ll email your downloadable ZIP and a re-download link to this address.
              You can recover past purchases anytime from the recover page.
            </p>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', marginBottom: 14 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setCheckoutOpen(false)} style={btnSecondary}>Cancel</button>
              <button type="button" onClick={handleEmailContinue} style={btnPrimary}>Continue to payment</button>
            </div>
          </div>
        </div>
      )}

      {/* XentriPay payment modal — handles method/phone/polling, fires
          onSuccess(refid) which we route to the purchase status page. */}
      {showXentri && cartItems.length > 0 && (
        <XentriPayModal
          isOpen={showXentri}
          onClose={() => setShowXentri(false)}
          onSuccess={handlePurchaseSuccess}
          paymentType="multi_album_purchase"
          amount={cartTotal}
          currencyCode={buyerCurrency}
          currencyId={buyerCurrencyId}
          multiAlbumItems={multiAlbumItems}
          viewerEmail={email}
          title="Connekyt Photos"
          subtitle={`${cartItems.length} photo${cartItems.length === 1 ? '' : 's'} from ${multiAlbumItems.length} photographer${multiAlbumItems.length === 1 ? '' : 's'}`}
        />
      )}

      <Footer />
    </>
  );
}

// ─── styles ───────────────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
  padding: '10px 10px', borderRadius: 8, border: '1px solid #e5e7eb',
  fontSize: 13, outline: 'none', background: '#fff',
};
const pagerBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
  background: disabled ? '#f3f4f6' : '#fff', color: disabled ? '#9ca3af' : '#1f2937',
  fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
});
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16,
};
const modalCard: React.CSSProperties = {
  background: '#fff', borderRadius: 12, maxWidth: 440, width: '100%',
  padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 18px', background: '#F20C8F', color: '#fff',
  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '10px 18px', background: '#fff', color: '#374151',
  border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
