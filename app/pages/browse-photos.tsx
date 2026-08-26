"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import XentriPayModal from "../components/XentriPayModal";
import PurchaseSuccessModal from "../components/PurchaseSuccessModal";
import type { MultiAlbumPurchaseItem } from "@/lib/APIs/payments/xentripay";

/**
 * Public stock-photo browse + buy.
 *
 * Design mirrors find-my-photos.tsx - dark navy gradient, dotted
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
  /** Grid-sized variant from the thumbnail pipeline; falls back to fileUrl. */
  thumbnailUrl?: string;
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
  const router = useRouter();
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
  // find-my-photos flow - XentriPay charges USD-equivalent in RWF
  // server-side and the per-item revenue split stays in each
  // photographer's listing currency for accurate payouts).
  const buyerCurrency = 'USD';
  const buyerCurrencyId = 'USD';

  // Cart (map keyed by imageId so toggle is O(1))
  const [cart, setCart] = useState<Record<string, BrowseRow>>({});
  const cartItems = useMemo(() => Object.values(cart), [cart]);

  // When every cart item shares one listing currency (the common case) we show
  // AND charge the EXACT listing total in that currency. Summing per-item
  // buyerPrice (USD, rounded to 2dp) loses precision and round-trips back to a
  // wrong figure (e.g. 3000 RWF -> 2.04 USD -> RF 2,994), which mismatched the
  // photographer's real price. Only mixed-currency carts fall back to the
  // USD-summed total. The actual charge is per-item (multiAlbumItems carry the
  // listing price + currency), so this keeps the displayed amount aligned with
  // what the buyer is really charged.
  // Only currencies the checkout modal's preview panel can render natively.
  // Single-currency carts in these show the exact listing total; anything
  // else (mixed carts, or exotic listing currencies) keeps the USD total.
  const PREVIEW_CCYS = ['USD', 'RWF', 'EUR', 'KES', 'UGX', 'TZS'];
  const cartSingleCurrency = useMemo(
    () => new Set(cartItems.map(i => i.listingCurrency || 'USD')).size <= 1,
    [cartItems]
  );
  const cartListingCcy = cartSingleCurrency && cartItems.length > 0 ? (cartItems[0].listingCurrency || 'USD') : 'USD';
  const cartNative = cartSingleCurrency && PREVIEW_CCYS.includes(cartListingCcy);
  const cartCurrency = cartNative ? cartListingCcy : 'USD';
  const cartDisplayTotal = useMemo(
    () => cartNative
      ? cartItems.reduce((s, i) => s + Number(i.listingPrice || 0), 0)
      : cartItems.reduce((s, i) => s + Number(i.buyerPrice || 0), 0),
    [cartItems, cartNative]
  );
  const cartSym = cartCurrency === 'USD' ? '$' : cartCurrency === 'EUR' ? '€' : cartCurrency === 'GBP' ? '£' : `${cartCurrency} `;
  const cartDp = (cartCurrency === 'USD' || cartCurrency === 'EUR' || cartCurrency === 'GBP') ? 2 : 0;
  const cartTotalStr = `${cartSym}${cartDisplayTotal.toLocaleString('en-US', { minimumFractionDigits: cartDp, maximumFractionDigits: cartDp })}`;

  // Lightbox + checkout
  const [previewing, setPreviewing] = useState<BrowseRow | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [showXentri, setShowXentri] = useState(false);

  // In-page purchase-success modal (no redirect away from /browse-photos).
  // Snapshots cart contents on payment success so the buyer sees exactly
  // what they paid for, plus polls the status endpoint and auto-fires
  // the ZIP download when the gateway confirms.
  const [purchaseRefid, setPurchaseRefid] = useState<string | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<BrowseRow[]>([]);
  const [purchaseEmail, setPurchaseEmail] = useState('');

  // Tab-occlusion: when the buyer switches tabs or the window loses
  // focus, blank every photo (filter: brightness(0)) so screen recorders
  // / second-window capture get only black. Mirrors find-my-photos's
  // anti-piracy deterrent - doesn't stop a determined attacker but
  // raises the bar on casual stealing.
  const [isOccluded, setIsOccluded] = useState(false);
  useEffect(() => {
    const occlude = () => setIsOccluded(true);
    const reveal = () => setIsOccluded(false);
    const onVis = () => { if (document.hidden) occlude(); else reveal(); };
    window.addEventListener('blur', occlude);
    window.addEventListener('focus', reveal);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('blur', occlude);
      window.removeEventListener('focus', reveal);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // ── Photo-first grid: natural ratios + blur-up (same pattern as
  // find-my-photos). Ratios captured per image on load so the masonry
  // respects portraits/panoramas; each image fades in over a shimmer.
  const [photoRatios, setPhotoRatios] = useState<Record<string, number>>({});
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const markLoaded = (id: string, el: HTMLImageElement | null) => {
    if (!el || !el.complete || el.naturalWidth === 0) return;
    setPhotoRatios(prev => (prev[id] ? prev : { ...prev, [id]: el.naturalWidth / el.naturalHeight }));
    setLoadedIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // ── Lightbox navigation: browse the whole page of results without
  // closing the viewer - arrows, arrow keys, swipe, position counter.
  const lightboxIndex = previewing ? items.findIndex(i => i.imageId === previewing.imageId) : -1;
  const stepLightbox = (delta: number) => {
    if (lightboxIndex < 0) return;
    const next = items[lightboxIndex + delta];
    if (next) setPreviewing(next);
  };
  const lightboxTouchX = useRef<number | null>(null);
  useEffect(() => {
    if (!previewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewing(null);
      else if (e.key === 'ArrowRight') stepLightbox(1);
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // stepLightbox derives from these deps; the listener re-registers per photo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewing, items]);

  // First-visit welcome modal - localStorage-gated so it only opens
  // once per browser. Pure flavour copy to orient the visitor before
  // they dive into the grid. OK or X dismisses + remembers.
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (!window.localStorage.getItem('connekyt:browse:welcomed')) setShowWelcome(true);
    } catch { /* incognito / disabled - silent */ }
  }, []);
  const dismissWelcome = () => {
    setShowWelcome(false);
    try { window.localStorage.setItem('connekyt:browse:welcomed', '1'); } catch {}
  };

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
      } catch { /* silent - feed still loads */ }
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

  // Express-buy from a card / the lightbox: ensure the photo is in the
  // cart, then immediately open the email-collection step → XentriPay.
  // The cart accumulation flow (+ button + bottom bar) stays available
  // for batch buys; this is just the one-tap shortcut.
  const expressBuy = (it: BrowseRow) => {
    setCart(prev => ({ ...prev, [it.imageId]: it }));
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
    // No redirect - snapshot the cart so the success modal can display
    // the bought items, then open the modal in-place. Cart is cleared
    // AFTER the snapshot so the bottom action bar disappears but the
    // modal still has everything it needs.
    setShowXentri(false);
    setPurchasedItems(Object.values(cart));
    setPurchaseEmail(email);
    setPurchaseRefid(refid);
    clearCart();
  };

  const totalPages = Math.max(1, Math.ceil(total / size));
  const filtersActive = !!(q || category || photographerId || minPrice || maxPrice);

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <Navbar />

      <main
        onContextMenu={(e) => e.preventDefault()}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to right, #052047, #052047, #103E83)',
          position: 'relative',
          // Just enough to clear the fixed navbar (~64px). The page's own
          // top padding handles the breathing room around the heading.
          paddingTop: 64,
        }}
      >
        {/* Dotted background - same vibe as find-my-photos hero */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at top, black 50%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black 50%, transparent 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: isMobile ? '12px 14px 140px' : '14px 32px 160px' }}>

          {/* Marketplace styling: chip rail, hover-reveal cards, shimmer */}
          <style>{`
            .bp-chip-rail { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px; }
            .bp-chip-rail::-webkit-scrollbar { display: none; }
            .bp-cat {
              flex: 0 0 auto; padding: 8px 16px; border-radius: 999px; cursor: pointer;
              font-size: 13px; font-weight: 700; white-space: nowrap; font-family: inherit;
              background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.75);
              border: 1px solid rgba(255,255,255,0.12);
              transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
            }
            .bp-cat:hover { background: rgba(255,255,255,0.12); color: #fff; }
            .bp-cat:focus-visible { outline: 2px solid #F20C8F; outline-offset: 2px; }
            .bp-cat.active {
              background: linear-gradient(135deg, #083A85 0%, #F20C8F 130%);
              color: #fff; border-color: transparent;
              box-shadow: 0 6px 16px -6px rgba(242,12,143,0.5);
            }
            .bp-card {
              position: relative; border-radius: 14px; overflow: hidden;
              break-inside: avoid; cursor: pointer;
              background: #0a1a36; border: 1px solid rgba(255,255,255,0.08);
              transition: border-color 200ms ease, box-shadow 200ms ease;
            }
            .bp-card:hover { border-color: rgba(255,255,255,0.22); box-shadow: 0 18px 40px -18px rgba(0,0,0,0.6); }
            .bp-card .bp-img { transition: transform 350ms ease, opacity 0.45s ease, filter 0.1s linear; }
            .bp-card:hover .bp-img { transform: scale(1.04); }
            .bp-scrim {
              position: absolute; inset: 0; pointer-events: none;
              background: linear-gradient(180deg, transparent 45%, rgba(3,10,26,0.85) 100%);
              opacity: 0; transition: opacity 220ms ease;
            }
            .bp-card:hover .bp-scrim { opacity: 1; }
            .bp-reveal { position: absolute; left: 10px; right: 10px; bottom: 10px;
              display: flex; align-items: flex-end; justify-content: space-between; gap: 8px;
              opacity: 0; transform: translateY(6px);
              transition: opacity 220ms ease, transform 220ms ease; z-index: 3; }
            .bp-card:hover .bp-reveal { opacity: 1; transform: translateY(0); }
            @media (hover: none) { .bp-reveal { opacity: 1; transform: none; } .bp-scrim { opacity: 1; } }
            .bp-skel { background: linear-gradient(100deg, rgba(255,255,255,0.045) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.045) 60%); background-size: 200% 100%; animation: bp-sh 1.4s ease-in-out infinite; }
            @keyframes bp-sh { 0% { background-position: 120% 0; } 100% { background-position: -80% 0; } }
            @media (prefers-reduced-motion: reduce) {
              .bp-skel { animation: none; background: rgba(255,255,255,0.06); }
              .bp-card .bp-img, .bp-reveal, .bp-scrim { transition: none; }
            }
            .bp-select {
              appearance: none; -webkit-appearance: none; font-family: inherit;
              padding: 9px 32px 9px 12px; border-radius: 10px; font-size: 13px; color: #fff;
              background: rgba(255,255,255,0.06) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.6)' fill='none' stroke-width='1.6' stroke-linecap='round'/></svg>") no-repeat right 12px center;
              border: 1px solid rgba(255,255,255,0.14); outline: none; cursor: pointer;
            }
            .bp-select:focus-visible { border-color: #F20C8F; }
            .bp-select option { background: #0a1f44; color: #fff; }
            .bp-lb-arrow {
              position: fixed; top: 50%; transform: translateY(-50%);
              width: 48px; height: 48px; border-radius: 50%;
              background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22);
              color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
              backdrop-filter: blur(8px); z-index: 2002; transition: background 200ms ease;
            }
            .bp-lb-arrow:hover { background: rgba(255,255,255,0.28); }
            .bp-lb-arrow.prev { left: 18px; }
            .bp-lb-arrow.next { right: 18px; }
            @media (max-width: 720px) {
              .bp-lb-arrow { width: 42px; height: 42px; }
              .bp-lb-arrow.prev { left: 8px; }
              .bp-lb-arrow.next { right: 8px; }
            }
          `}</style>

          {/* ── Hero strip: identity + live stats ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
            <div style={{ marginRight: 'auto', minWidth: 0 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 999, background: 'rgba(242,12,143,0.13)', border: '1px solid rgba(242,12,143,0.35)', color: '#ff7ec4', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                Stock library
              </span>
              <h1 style={{ margin: 0, fontSize: isMobile ? 26 : 'clamp(26px, 3.4vw, 38px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Browse <span style={{ color: '#F20C8F' }}>Photos</span>
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.65)', maxWidth: 620, lineHeight: 1.55 }}>
                Professional photography by credited creators - press, nature, sport,
                luxury, fashion and more. Pay per photo; originals land in your inbox.
              </p>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  [total.toLocaleString(), 'photos'],
                  [String(photographers.length), 'photographers'],
                  [String(categories.length), 'categories'],
                ].map(([n, l]) => (
                  <div key={l} style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{n}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Sticky glass toolbar: search + filters + category rail ── */}
          <div style={{
            position: 'sticky', top: 76, zIndex: 30,
            background: 'rgba(6,18,42,0.82)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: 12,
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            marginBottom: 18,
            boxShadow: '0 14px 34px -18px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.55)' }} />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search photos, photographers, keywords…"
                  style={searchInput}
                />
              </div>
              <select value={photographerId} onChange={e => setPhotographerId(e.target.value)} className="bp-select" aria-label="Filter by photographer">
                <option value="">All photographers</option>
                {photographers.map(p => (
                  <option key={p.id} value={p.id}>{p.name || '-'}</option>
                ))}
              </select>
              <input type="number" placeholder="Min $" value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                aria-label="Minimum price"
                style={{ ...selectStyle, width: 84 }} />
              <input type="number" placeholder="Max $" value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                aria-label="Maximum price"
                style={{ ...selectStyle, width: 84 }} />
              {filtersActive && (
                <button type="button"
                  onClick={() => { setQ(''); setCategory(''); setPhotographerId(''); setMinPrice(''); setMaxPrice(''); }}
                  style={{ padding: '8px 12px', fontSize: 12.5, fontWeight: 700, background: 'transparent', color: '#F20C8F', border: 'none', cursor: 'pointer' }}>
                  Clear
                </button>
              )}
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 14 }}>
                {!loading && (
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                    {total.toLocaleString()} photo{total === 1 ? '' : 's'}
                  </span>
                )}
                <Link href="/user/browse-photos/recover" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-arrow-clockwise" /> Recover past purchases
                </Link>
              </span>
            </div>
            <div className="bp-chip-rail" role="tablist" aria-label="Categories">
              <button type="button" className={`bp-cat ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>
                All
              </button>
              {categories.map(c => (
                <button key={c.name} type="button" className={`bp-cat ${category === c.name ? 'active' : ''}`} onClick={() => setCategory(c.name)}>
                  {c.label} <span style={{ opacity: 0.65, fontWeight: 600 }}>({c.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {error && (
            <div style={{ padding: 16, color: '#fecaca', background: 'rgba(220,38,38,0.15)', borderRadius: 12, marginBottom: 14 }}>
              {error}.{' '}
              <button type="button" onClick={() => load()} style={{ background: 'none', border: 'none', color: '#F20C8F', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
            </div>
          )}

          {loading ? (
            /* Skeleton masonry - the grid's own shape, shimmering */
            <div style={{ columnCount: isMobile ? 2 : 4, columnGap: 14 }}>
              {[0.75, 1.35, 1, 0.8, 1.5, 0.7, 1.2, 1, 0.85, 1.4].map((r, i) => (
                <div key={i} className="bp-card bp-skel" style={{ aspectRatio: `${r}`, marginBottom: 14 }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '64px 24px', maxWidth: 440, margin: '24px auto',
              background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.16)',
              borderRadius: 20, color: 'rgba(255,255,255,0.55)',
            }}>
              <span style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(242,12,143,0.12)', color: '#F20C8F',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              </span>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                {filtersActive ? 'No photos match your filters' : 'No photos yet'}
              </p>
              <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
                {filtersActive ? (
                  <>Try a different search, or{' '}
                    <button type="button"
                      onClick={() => { setQ(''); setCategory(''); setPhotographerId(''); setMinPrice(''); setMaxPrice(''); }}
                      style={{ background: 'none', border: 'none', color: '#F20C8F', cursor: 'pointer', fontWeight: 700, padding: 0, fontSize: 14 }}>
                      clear all filters
                    </button>.
                  </>
                ) : (
                  <>The library is being stocked. Check back soon.</>
                )}
              </p>
            </div>
          ) : (
            <div style={{ columnCount: isMobile ? 2 : 4, columnGap: 14 }}>
              {items.map((it, itemIndex) => {
                const isSelected = !!cart[it.imageId];
                const priceLabel = fmtListing(it);
                return (
                  <div
                    key={it.imageId}
                    className={`bp-card ${loadedIds.has(it.imageId) ? '' : 'bp-skel'}`}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => setPreviewing(it)}
                    style={{
                      marginBottom: 14,
                      // Hold a neutral ratio until the real one is known so
                      // the masonry column doesn't jump; release to the
                      // photo's own shape as soon as it loads.
                      aspectRatio: photoRatios[it.imageId] ? `${photoRatios[it.imageId]}` : '1',
                      outline: isSelected ? '3px solid #F20C8F' : 'none',
                      outlineOffset: isSelected ? -3 : 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="bp-img"
                      src={it.thumbnailUrl || it.fileUrl}
                      alt=""
                      loading={itemIndex < 8 ? 'eager' : 'lazy'}
                      fetchPriority={itemIndex < 4 ? 'high' : undefined}
                      decoding="async"
                      draggable={false}
                      ref={(el) => markLoaded(it.imageId, el)}
                      onLoad={(e) => markLoaded(it.imageId, e.currentTarget)}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        opacity: loadedIds.has(it.imageId) ? 1 : 0,
                        userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
                        // Tab-occlusion blackout for screen-capture deterrence.
                        filter: isOccluded ? 'brightness(0)' : undefined,
                      }}
                    />

                    {/* Repeating tile watermark - same Shutterstock/Getty
                        pattern, but the label is the OWNER PHOTOGRAPHER'S
                        NAME instead of the platform brand. Falls back to
                        "PREVIEW" only when the photographer name hasn't
                        loaded yet (server fields are async). XML-escape
                        the name before embedding so the SVG stays valid
                        for unusual characters like "&". */}
                    {(() => {
                      const raw = (it.photographerName || 'PREVIEW').toUpperCase();
                      const safe = raw
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                      return (
                        <div aria-hidden style={{
                          position: 'absolute', inset: 0, pointerEvents: 'none',
                          backgroundImage:
                            'url("data:image/svg+xml;utf8,' +
                            encodeURIComponent(
                              '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="80" viewBox="0 0 140 80">' +
                                '<text x="70" y="46" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="rgba(255,255,255,0.55)" text-anchor="middle" transform="rotate(-24 70 42)">' + safe + '</text>' +
                              '</svg>'
                            ) +
                            '")',
                          backgroundRepeat: 'repeat',
                          mixBlendMode: 'overlay',
                        }} />
                      );
                    })()}

                    {/* Hover scrim so the reveal layer reads over any photo */}
                    <div className="bp-scrim" aria-hidden />

                    {/* Top-right: price chip - pill to match find-my-photos. */}
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: isSelected ? '#F20C8F' : 'rgba(0,0,0,0.75)',
                      color: '#fff', fontSize: 11.5, fontWeight: 700,
                      padding: '4px 11px', borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.18)',
                      zIndex: 3,
                    }}>
                      {priceLabel}
                    </div>

                    {/* Top-left: Add-to-cart toggle. Round teal pill matches
                        find-my-photos paid-album affordance. */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCart(it); }}
                      aria-label={isSelected ? 'Remove from cart' : 'Add to cart'}
                      title={isSelected ? 'Remove from cart' : 'Add to cart'}
                      style={{
                        position: 'absolute', top: 8, left: 8,
                        width: 36, height: 36, borderRadius: '50%',
                        background: isSelected ? '#F20C8F' : '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 3, padding: 0,
                        boxShadow: '0 4px 12px -2px rgba(0,0,0,0.45)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {isSelected ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <i className="bi bi-plus-lg" style={{ fontSize: 17, color: '#03969c', fontWeight: 700, lineHeight: 1 }} />
                      )}
                    </button>

                    {/* Hover-reveal: photographer identity + express Buy.
                        Always visible on touch devices via the media query. */}
                    <div className="bp-reveal">
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)',
                        color: '#fff', fontSize: 11.5, fontWeight: 600,
                        padding: '5px 10px', borderRadius: 999,
                        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                        maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {it.photographerLogo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={it.photographerLogo} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <span aria-hidden style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', flexShrink: 0 }} />
                        )}
                        {it.photographerName || 'Photographer'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); expressBuy(it); }}
                        aria-label="Buy this photo"
                        style={{
                          padding: '8px 14px', borderRadius: 999,
                          background: '#03969c', color: '#fff',
                          border: 'none', cursor: 'pointer',
                          fontSize: 12.5, fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 6px 16px -4px rgba(0,0,0,0.55)',
                          transition: 'background 0.15s',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#026d72'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#03969c'; }}
                      >
                        <i className="bi bi-download" /> Buy ({priceLabel})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '30px 0 0', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginRight: 6 }}>
                Showing {page * size + 1}–{Math.min((page + 1) * size, total)} of {total.toLocaleString()}
              </span>
              <button type="button" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
                style={pagerBtn(page === 0)}>← Prev</button>
              <span style={{
                padding: '9px 14px', borderRadius: 999,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: '#fff', fontSize: 13, fontWeight: 800,
              }}>{page + 1} / {totalPages}</span>
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
                Total: <strong>{cartTotalStr}</strong>
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
              <i className="bi bi-credit-card-2-front" /> Checkout · {cartTotalStr}
            </button>
          </div>
        </div>
      )}

      {/* ── Lightbox preview ── matches find-my-photos paid-album style:
          four 45° blurred-glass diagonal bands as the watermark, teal
          "Buy (price)" pill + circular close at top-right, "🔒 PREVIEW ·
          BUY TO UNLOCK" pill at bottom-left. No photographer chip
          (kept clean per spec). Right-click + drag blocked at every
          layer. */}
      {previewing && (
        <div
          onClick={() => setPreviewing(null)}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { lightboxTouchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const startX = lightboxTouchX.current;
            lightboxTouchX.current = null;
            if (startX == null) return;
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 48) stepLightbox(dx < 0 ? 1 : -1);
          }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          {/* Preload neighbours so arrow/swipe navigation feels instant */}
          {[items[lightboxIndex - 1], items[lightboxIndex + 1]]
            .filter((p): p is BrowseRow => !!p)
            .map((p) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={`preload-${p.imageId}`} src={p.fileUrl} alt="" aria-hidden style={{ display: 'none' }} />
            ))}

          {/* Prev / next - arrow keys and swipe work too */}
          {lightboxIndex > 0 && (
            <button type="button" className="bp-lb-arrow prev" aria-label="Previous photo"
              onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {lightboxIndex >= 0 && lightboxIndex < items.length - 1 && (
            <button type="button" className="bp-lb-arrow next" aria-label="Next photo"
              onClick={(e) => { e.stopPropagation(); stepLightbox(1); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}

          {/* Top-left: position counter + photographer credit */}
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2001 }}>
            <span style={{
              padding: '8px 14px', borderRadius: 50,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {lightboxIndex + 1} / {items.length}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 50,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              maxWidth: '40vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {previewing.photographerLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewing.photographerLogo} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <span aria-hidden style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', flexShrink: 0 }} />
              )}
              {previewing.photographerName || 'Photographer'}
            </span>
          </div>

          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 10, zIndex: 2001 }}>
            <button
              onClick={(e) => { e.stopPropagation(); expressBuy(previewing!); setPreviewing(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', borderRadius: 50,
                background: '#03969c', border: 'none', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#026d72'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#03969c'; }}
            >
              <i className="bi bi-download" /> Buy ({fmtListing(previewing!)})
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewing(null); }}
              aria-label="Close preview"
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: 24, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >×</button>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewing!.fileUrl}
              alt=""
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                display: 'block', maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain',
                userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
                filter: isOccluded ? 'brightness(0)' : undefined,
                transition: 'filter 0.1s linear',
              }}
            />

            {/* Right-click / drag absorber */}
            <div aria-hidden
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{ position: 'absolute', inset: 0, background: 'transparent', userSelect: 'none' }}
            />

            {/* Four 45° blurred diagonal bands - real image shows
                between them, white frosted-glass stripes obscure parts.
                Same shape find-my-photos uses on locked paid photos. */}
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                aria-hidden
                style={{
                  position: 'absolute',
                  top: `${-5 + i * 32}%`,
                  left: '-50%',
                  width: '200%',
                  height: '60px',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  background: 'rgba(255,255,255,0.18)',
                  borderTop: '1px solid rgba(255,255,255,0.35)',
                  borderBottom: '1px solid rgba(255,255,255,0.35)',
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Bottom-left lock label */}
            <div
              aria-hidden
              style={{
                position: 'absolute', bottom: 12, left: 12,
                padding: '6px 12px', borderRadius: 50,
                background: 'rgba(0,0,0,0.7)', color: '#fff',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
                border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
                pointerEvents: 'none',
              }}
            >
              🔒 PREVIEW · BUY TO UNLOCK
            </div>
          </div>
        </div>
      )}

      {/* Email-collection step before launching XentriPay */}
      {checkoutOpen && (
        <div onClick={() => setCheckoutOpen(false)} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={modalCard}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#fff' }}>One last step</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
              We&apos;ll email your downloadable ZIP and a re-download link to this address.
              You can recover past purchases anytime from the recover page.
            </p>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>Email address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '11px 12px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.06)', color: '#fff',
                fontSize: 14, outline: 'none', marginBottom: 14,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setCheckoutOpen(false)} style={btnSecondary}>Cancel</button>
              <button type="button" onClick={handleEmailContinue} style={btnPrimary}>Continue to payment</button>
            </div>
          </div>
        </div>
      )}

      {/* First-visit welcome modal - pure flavour. */}
      {showWelcome && (
        <div onClick={dismissWelcome} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9998, padding: 18,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 18, width: '100%', maxWidth: 460,
            padding: 26, boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
              color: '#fff', margin: '0 auto 12px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
              boxShadow: '0 10px 24px -8px rgba(242,12,143,0.5)',
            }}>
              <i className="bi bi-stars" />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#fff' }}>
              Welcome to Connekyt
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              You&apos;re inside a library of professional photography art -
              curated for press, newspapers, luxury venues, magazine covers
              and more. Every image is the work of a credited photographer.
              Pick what you love, pay per photo, get the originals in your inbox.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button onClick={dismissWelcome} style={{
                padding: '10px 22px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
              }}>Close</button>
              <button onClick={dismissWelcome} style={{
                padding: '10px 22px', background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)', color: '#fff',
                border: 'none', borderRadius: 10, fontWeight: 700,
                fontSize: 14, cursor: 'pointer',
                boxShadow: '0 8px 22px -6px rgba(242,12,143,0.45)',
              }}>OK, let me browse</button>
            </div>
          </div>
        </div>
      )}

      {/* In-page purchase confirmation. Stays on the browse page; polls
          status; auto-downloads the ZIP on COMPLETED; gives a grid of
          purchased photos with per-image + select-all download. */}
      {purchaseRefid && (
        <PurchaseSuccessModal
          refid={purchaseRefid}
          items={purchasedItems}
          email={purchaseEmail}
          onClose={() => { setPurchaseRefid(null); setPurchasedItems([]); setPurchaseEmail(''); }}
        />
      )}

      {showXentri && cartItems.length > 0 && (
        <XentriPayModal
          isOpen={showXentri}
          onClose={() => setShowXentri(false)}
          onSuccess={handlePurchaseSuccess}
          paymentType="multi_album_purchase"
          amount={cartDisplayTotal}
          currencyCode={cartCurrency}
          currencyId={cartCurrency}
          multiAlbumItems={multiAlbumItems}
          viewerEmail={email}
          // Show the donation step between method-select and pay so the
          // buyer can optionally tack a platform donation onto the same
          // gateway invoice. Backend splits it out at finalisation and
          // saves to the Donation table - never mixed into any
          // photographer's 70/30 payout.
          showDonationPrompt
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
  background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 18, maxWidth: 440, width: '100%',
  padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 18px',
  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)', color: '#fff',
  border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
  boxShadow: '0 8px 22px -6px rgba(242,12,143,0.45)',
};
const btnSecondary: React.CSSProperties = {
  padding: '10px 18px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};

