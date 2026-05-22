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
 * Design mirrors find-my-photos.tsx — dark navy gradient, dotted
 * background, rounded photo cards, lightbox preview, sticky bottom
 * cart action bar. Same image-protection wiring (no right-click, no
 * drag, no pointer events on the <img>) and same diagonal "PREVIEW
 * · {photographer}" watermark band.
 *
 * Layout: 5 photos per row on desktop, 2 on mobile, with page padding.
 * Click a photo opens the watermarked lightbox; the + button adds it
 * to the cart.
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
  const [size] = useState(50); // 5 cols × 10 rows
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [photographers, setPhotographers] = useState<PhotographerOption[]>([]);

  // Filters
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [photographerId, setPhotographerId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  // Price display = photographer's listing currency, native. Buyer
  // currency = always USD for the cart total + checkout (matches the
  // find-my-photos flow — XentriPay charges USD-equivalent in RWF
  // server-side and the per-item revenue split stays in each
  // photographer's listing currency for accurate payouts).
  const buyerCurrency = 'USD';
  const buyerCurrencyId = 'USD';

  // Cart (map keyed by imageId so toggle is O(1))
  const [cart, setCart] = useState<Record<string, BrowseRow>>({});
  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = useMemo(
    () => cartItems.reduce((s, i) => s + Number(i.buyerPrice || 0), 0),
    [cartItems]
  );

  // Lightbox + checkout
  const [previewing, setPreviewing] = useState<BrowseRow | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [showXentri, setShowXentri] = useState(false);

  // Mobile breakpoint watcher
  useEffect(() => {
    const apply = () => setIsMobile(window.innerWidth < 768);
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

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

  // ── Browse load ──
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
      } else { setItems([]); setTotal(0); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load photos');
      setItems([]); setTotal(0);
    } finally { setLoading(false); }
  }, [qDebounced, category, photographerId, minPrice, maxPrice, buyerCurrency, page, size]);
  useEffect(() => { void load(); }, [load]);

  // Reset to page 0 when filters change.
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

  const sym = '$'; // USD only for the cart total (display only)

  const fmtListing = (it: BrowseRow) => {
    const code = it.listingCurrency || 'USD';
    const symbol = code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : code;
    const dp = code === 'RWF' ? 0 : 2;
    return `${symbol} ${Number(it.listingPrice || 0).toFixed(dp)}`;
  };

  // Each per-photographer slice keeps its NATIVE listing currency so
  // the photographer is credited the exact amount they set (the backend
  // converts each slice to RWF for the gateway charge). This mirrors
  // the find-my-photos multi-album flow.
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
      // Backend resolves either UUID or abbreviation (USD/RWF/EUR/…).
      currencyId: g.currency,
    }));
  }, [cartItems]);

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
  const filtersActive = !!(q || category || photographerId || minPrice || maxPrice);

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <Navbar />

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, #052047, #052047, #103E83)',
        position: 'relative',
        paddingTop: 80,
      }}>
        {/* Dotted background — same vibe as find-my-photos hero */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at top, black 50%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black 50%, transparent 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: isMobile ? '20px 14px 140px' : '32px 32px 160px' }}>

          {/* Heading */}
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Browse photos</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.72)', maxWidth: 720 }}>
              Curated photography by category — press, nature, sport, luxury, diplomatic, more.
              Per-photo paid download. Photos are emailed to you after purchase.
            </p>
          </div>

          {/* Filter row */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 14,
            padding: isMobile ? 10 : 12,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 18,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}>
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.55)' }} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search photos, photographers, keywords…"
                style={searchInput}
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
            <input type="number" placeholder="Min $" value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              style={{ ...selectStyle, width: 90 }} />
            <input type="number" placeholder="Max $" value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              style={{ ...selectStyle, width: 90 }} />
            {filtersActive && (
              <button type="button"
                onClick={() => { setQ(''); setCategory(''); setPhotographerId(''); setMinPrice(''); setMaxPrice(''); }}
                style={{ padding: '8px 12px', fontSize: 12.5, fontWeight: 700, background: 'transparent', color: '#F20C8F', border: 'none', cursor: 'pointer' }}>
                Clear
              </button>
            )}
            <Link href="/user/browse-photos/recover" style={{ marginLeft: 'auto', fontSize: 12.5, color: 'rgba(255,255,255,0.78)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-arrow-clockwise" /> Recover past purchases
            </Link>
          </div>

          {/* Grid */}
          {error && (
            <div style={{ padding: 16, color: '#fecaca', background: 'rgba(220,38,38,0.15)', borderRadius: 12, marginBottom: 14 }}>
              {error}.{' '}
              <button type="button" onClick={() => load()} style={{ background: 'none', border: 'none', color: '#F20C8F', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 80, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>Loading photos…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              {filtersActive ? (
                <>No photos match your filters.{' '}
                  <button type="button"
                    onClick={() => { setQ(''); setCategory(''); setPhotographerId(''); setMinPrice(''); setMaxPrice(''); }}
                    style={{ background: 'none', border: 'none', color: '#F20C8F', cursor: 'pointer', fontWeight: 600 }}>
                    Clear filters
                  </button>
                </>
              ) : (
                <>No photos are available right now. Check back soon.</>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
              gap: isMobile ? 10 : 14,
            }}>
              {items.map(it => {
                const isSelected = !!cart[it.imageId];
                const priceLabel = fmtListing(it);
                return (
                  <div
                    key={it.imageId}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => setPreviewing(it)}
                    style={{
                      position: 'relative',
                      borderRadius: 14,
                      overflow: 'hidden',
                      aspectRatio: '1',
                      cursor: 'pointer',
                      background: '#0a1a36',
                      border: isSelected ? '1px solid rgba(242,12,143,0.45)' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: isSelected
                        ? '0 0 0 3px #F20C8F, 0 8px 22px -6px rgba(242,12,143,0.42)'
                        : '0 4px 14px -6px rgba(0,0,0,0.35)',
                      transition: 'box-shadow 0.18s, border-color 0.18s',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.fileUrl}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
                      }}
                    />

                    {/* Diagonal sheen (cheap deterrent) */}
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      backgroundImage: 'repeating-linear-gradient(-30deg, transparent 0 40px, rgba(255,255,255,0.06) 40px 41px)',
                      mixBlendMode: 'overlay',
                    }} />

                    {/* Visible PREVIEW · photographer watermark */}
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: 'rotate(-22deg)',
                      color: 'rgba(255,255,255,0.32)',
                      fontWeight: 800,
                      fontSize: 'clamp(11px, 2vw, 16px)',
                      letterSpacing: '4px',
                      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      whiteSpace: 'nowrap',
                    }}>
                      PREVIEW · {(it.photographerName || 'CONNEKYT').toUpperCase()}
                    </div>

                    {/* Bottom-left: photographer logo + name */}
                    <div style={{
                      position: 'absolute', left: 8, bottom: 8,
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 8px 4px 4px',
                      background: 'rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      borderRadius: 999,
                      maxWidth: 'calc(100% - 16px)',
                    }}>
                      {it.photographerLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.photographerLogo} alt=""
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
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
                      position: 'absolute', top: 8, right: 8,
                      background: isSelected ? '#F20C8F' : 'rgba(0,0,0,0.55)',
                      color: '#fff', fontSize: 11.5, fontWeight: 700,
                      padding: '3px 9px', borderRadius: 999,
                    }}>
                      {priceLabel}
                    </div>

                    {/* Top-left: add-to-cart toggle (find-my-photos style) */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCart(it); }}
                      aria-label={isSelected ? 'Remove from cart' : 'Add to cart'}
                      title={isSelected ? 'Remove from cart' : 'Add to cart'}
                      style={{
                        position: 'absolute', top: 8, left: 8,
                        width: 30, height: 30, borderRadius: 9,
                        background: isSelected ? '#F20C8F' : 'rgba(255,255,255,0.95)',
                        border: isSelected ? '2px solid #F20C8F' : '2px solid rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 3, padding: 0,
                        boxShadow: isSelected
                          ? '0 4px 12px -2px rgba(242,12,143,0.50)'
                          : '0 2px 6px rgba(0,0,0,0.30)',
                        transition: 'transform 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {isSelected ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <i className="bi bi-plus" style={{ fontSize: 16, color: '#F20C8F', fontWeight: 700, lineHeight: 1 }} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '32px 0 0' }}>
              <button type="button" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
                style={pagerBtn(page === 0)}>← Prev</button>
              <span style={{ alignSelf: 'center', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Page {page + 1} / {totalPages}</span>
              <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
                style={pagerBtn(page + 1 >= totalPages)}>Next →</button>
            </div>
          )}
        </div>
      </main>

      {/* ── Cart action bar (sticky bottom, matches find-my-photos) ── */}
      {cartItems.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(15,15,20,0.97)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: isMobile ? '14px 16px' : '16px 24px',
          zIndex: 1500,
          boxShadow: '0 -12px 32px rgba(0,0,0,0.40)',
        }}>
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
          }} />
          <div style={{
            maxWidth: 1400, margin: '0 auto',
            display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center', gap: 12,
          }}>
            <div style={{ flex: isMobile ? 'initial' : 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 12px 6px 8px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                boxShadow: '0 6px 14px -4px rgba(242,12,143,0.36)',
              }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-bag-check-fill" style={{ fontSize: 11 }} />
                </span>
                {cartItems.length} photo{cartItems.length === 1 ? '' : 's'} in cart
              </div>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>
                Total: <strong>{sym} {cartTotal.toFixed(2)}</strong>
              </span>
            </div>
            <button onClick={clearCart}
              style={{
                padding: '10px 16px', borderRadius: 11,
                background: 'transparent', border: '1.5px solid rgba(255,255,255,0.20)',
                color: 'rgba(255,255,255,0.82)', fontSize: 13.5, fontWeight: 700,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.color = '#F20C8F'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; }}
            >
              <i className="bi bi-x-circle" style={{ fontSize: 13 }} /> Clear
            </button>
            <button onClick={handleCheckoutClick}
              style={{
                padding: '11px 18px', borderRadius: 11,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
                boxShadow: '0 8px 22px -6px rgba(242,12,143,0.45)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 22px -6px rgba(242,12,143,0.45)'; }}
            >
              <i className="bi bi-credit-card-2-front" /> Checkout · {sym} {cartTotal.toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* ── Lightbox preview ── */}
      {previewing && (
        <div
          onClick={() => setPreviewing(null)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleCart(previewing!); }}
              style={{
                padding: '10px 18px', borderRadius: 50,
                background: cart[previewing!.imageId] ? '#F20C8F' : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {cart[previewing!.imageId] ? (
                <><i className="bi bi-check2-circle" /> In cart</>
              ) : (
                <><i className="bi bi-plus-lg" /> Add · {fmtListing(previewing!)}</>
              )}
            </button>
            <button onClick={() => setPreviewing(null)}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.10)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer', fontSize: 18,
              }}
              aria-label="Close preview"
            >×</button>
          </div>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }} onContextMenu={(e) => e.preventDefault()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewing!.fileUrl}
              alt=""
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain',
                userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
                borderRadius: 8,
              }}
            />
            {/* Lightbox watermark — bigger because the image is bigger */}
            <div aria-hidden style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: 'rotate(-22deg)',
              color: 'rgba(255,255,255,0.30)', fontWeight: 800,
              fontSize: 'clamp(20px, 4vw, 48px)', letterSpacing: '8px',
              textShadow: '0 2px 8px rgba(0,0,0,0.65)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap',
            }}>
              PREVIEW · {(previewing!.photographerName || 'CONNEKYT').toUpperCase()}
            </div>
            <div style={{
              position: 'absolute', left: 14, bottom: 14, display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px 6px 6px',
              background: 'rgba(0,0,0,0.65)', borderRadius: 999, backdropFilter: 'blur(6px)',
            }}>
              {previewing!.photographerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewing!.photographerLogo} alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>
                  {(previewing!.photographerName || '·').trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>
                {previewing!.photographerName || '—'}
              </span>
              {previewing!.categoryLabel && (
                <span style={{ marginLeft: 4, fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  · {previewing!.categoryLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

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
              type="email" value={email} onChange={e => setEmail(e.target.value)}
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
const searchInput: React.CSSProperties = {
  width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff', fontSize: 13.5, outline: 'none',
};
const selectStyle: React.CSSProperties = {
  padding: '10px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)',
  fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff',
};
const pagerBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.14)',
  background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
  color: disabled ? 'rgba(255,255,255,0.35)' : '#fff',
  fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
});
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16,
};
const modalCard: React.CSSProperties = {
  background: '#fff', borderRadius: 14, maxWidth: 440, width: '100%',
  padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 18px', background: '#F20C8F', color: '#fff',
  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '10px 18px', background: '#fff', color: '#374151',
  border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
