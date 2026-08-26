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
 * Public stock-photo browse + buy - "The Print Room".
 *
 * Editorial storefront architecture: serif masthead with a tilted
 * print mosaic, one command-bar search, a category chip rail, a trust
 * strip, then a masonry catalog of caption-strip print cards (photo +
 * credit line + price, hover actions). Cart lives in a floating pill
 * (FAB) that opens a slide-in drawer; clicking a photo opens a split
 * product view (protected preview + detail rail with buy/cart).
 *
 * Image protection is non-negotiable and unchanged: no right-click,
 * no drag, pointer-events off on every <img>, repeating photographer
 * watermark tiles on cards, four 45° frosted bands in the product
 * view, and tab-occlusion blackout. Checkout flow (email modal →
 * XentriPay → success modal) is the same payment-hardened wiring -
 * see docs/PAYMENTS.md before touching it.
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
  // Cart drawer (slide-in panel) - replaces the old bottom action bar.
  const [drawerOpen, setDrawerOpen] = useState(false);
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
        // Defense: only absolute logo URLs render; a bare filename (seen in
        // prod data) would resolve relative to this route and 404 - the
        // gradient monogram avatar takes over instead.
        const rows: BrowseRow[] = (j.data.items || []).map((r: BrowseRow) => ({
          ...r,
          photographerLogo: r.photographerLogo && /^https?:\/\//i.test(r.photographerLogo)
            ? r.photographerLogo : null,
        }));
        setItems(rows);
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
        {/* ═══ "The Print Room" — editorial storefront architecture ═══ */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Bodoni:ital,wght@0,500;0,600;0,700;1,500&display=swap');
          .pr-serif { font-family: 'Libre Bodoni', Georgia, 'Times New Roman', serif; }
          .pr-hero {
            position: relative; overflow: hidden;
            background:
              radial-gradient(1100px 480px at 18% -10%, rgba(8,58,133,0.55), transparent 60%),
              radial-gradient(900px 420px at 88% 8%, rgba(242,12,143,0.16), transparent 55%),
              #040d1f;
          }
          .pr-mosaic { position: relative; min-height: 300px; }
          .pr-print {
            position: absolute; border-radius: 10px; overflow: hidden;
            border: 1px solid rgba(255,255,255,0.14);
            box-shadow: 0 30px 60px -25px rgba(0,0,0,0.8), 0 0 0 6px rgba(255,255,255,0.03);
            transition: transform 400ms ease;
            background: #0a1a36;
          }
          .pr-print img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; user-select: none; }
          .pr-cmd {
            display: flex; align-items: center; gap: 10px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 16px; padding: 6px 6px 6px 18px;
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 24px 60px -24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06);
            transition: border-color 200ms ease, box-shadow 200ms ease;
          }
          .pr-cmd:focus-within { border-color: rgba(242,12,143,0.55); box-shadow: 0 24px 60px -24px rgba(242,12,143,0.35); }
          .pr-cmd input { flex: 1; min-width: 0; background: transparent; border: 0; outline: none; color: #fff; font-size: 15.5px; padding: 12px 0; font-family: inherit; }
          .pr-cmd input::placeholder { color: rgba(255,255,255,0.45); }
          .pr-cmd-btn {
            padding: 12px 22px; border-radius: 12px; border: 0; cursor: pointer;
            background: linear-gradient(135deg, #083A85 0%, #F20C8F 130%);
            color: #fff; font-weight: 800; font-size: 14px; font-family: inherit;
            box-shadow: 0 10px 24px -8px rgba(242,12,143,0.5);
          }
          .pr-cat {
            flex: 0 0 auto; padding: 8px 16px; border-radius: 999px; cursor: pointer;
            font-size: 13px; font-weight: 700; white-space: nowrap; font-family: inherit;
            background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7);
            border: 1px solid rgba(255,255,255,0.12);
            transition: all 180ms ease;
          }
          .pr-cat:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
          .pr-cat:focus-visible { outline: 2px solid #F20C8F; outline-offset: 2px; }
          .pr-cat.active { background: #fff; color: #071634; border-color: #fff; font-weight: 800; }
          .pr-rail { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px; }
          .pr-rail::-webkit-scrollbar { display: none; }
          .pr-select {
            appearance: none; -webkit-appearance: none; font-family: inherit;
            padding: 9px 32px 9px 12px; border-radius: 10px; font-size: 13px; color: #fff;
            background: rgba(255,255,255,0.06) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.6)' fill='none' stroke-width='1.6' stroke-linecap='round'/></svg>") no-repeat right 12px center;
            border: 1px solid rgba(255,255,255,0.14); outline: none; cursor: pointer;
          }
          .pr-select:focus-visible { border-color: #F20C8F; }
          .pr-select option { background: #0a1f44; color: #fff; }
          .pr-catalog { position: relative; }
          .pr-grain {
            position: absolute; inset: 0; pointer-events: none; opacity: 0.05; mix-blend-mode: overlay;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
          }
          .pr-card {
            break-inside: avoid; margin-bottom: 18px; border-radius: 14px; overflow: hidden;
            background: #0b1930; border: 1px solid rgba(255,255,255,0.09);
            transition: transform 250ms ease, border-color 250ms ease, box-shadow 250ms ease;
            cursor: pointer; position: relative;
          }
          .pr-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.22); box-shadow: 0 26px 50px -22px rgba(0,0,0,0.75); }
          .pr-card.selected { border-color: #F20C8F; box-shadow: 0 0 0 2px #F20C8F, 0 26px 50px -22px rgba(242,12,143,0.35); }
          .pr-photo { position: relative; overflow: hidden; }
          .pr-photo .ph { transition: transform 500ms ease, opacity 0.45s ease, filter 0.1s linear; }
          .pr-card:hover .ph { transform: scale(1.05); }
          .pr-actions {
            position: absolute; inset: auto 10px 10px 10px; display: flex; gap: 8px; justify-content: flex-end;
            opacity: 0; transform: translateY(8px); transition: opacity 220ms ease, transform 220ms ease; z-index: 3;
          }
          .pr-card:hover .pr-actions { opacity: 1; transform: translateY(0); }
          @media (hover: none) { .pr-actions { opacity: 1; transform: none; } }
          .pr-caption {
            display: flex; align-items: center; gap: 8px; padding: 10px 12px;
            border-top: 1px solid rgba(255,255,255,0.07);
            background: rgba(255,255,255,0.025);
          }
          .pr-skel { background: linear-gradient(100deg, rgba(255,255,255,0.045) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.045) 60%); background-size: 200% 100%; animation: pr-sh 1.4s ease-in-out infinite; }
          @keyframes pr-sh { 0% { background-position: 120% 0; } 100% { background-position: -80% 0; } }
          .pr-fab {
            position: fixed; right: 22px; bottom: 22px; z-index: 1600;
            display: inline-flex; align-items: center; gap: 10px;
            padding: 14px 20px; border-radius: 999px; border: 0; cursor: pointer;
            background: linear-gradient(135deg, #083A85 0%, #F20C8F 130%); color: #fff;
            font-weight: 800; font-size: 14.5px; font-family: inherit;
            box-shadow: 0 18px 44px -12px rgba(242,12,143,0.6);
            transition: transform 180ms ease;
          }
          .pr-fab:hover { transform: translateY(-2px); }
          .pr-fab:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
          .pr-drawer {
            position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 100vw); z-index: 1700;
            background: linear-gradient(175deg, #0a2148 0%, #060f24 100%);
            border-left: 1px solid rgba(255,255,255,0.1);
            box-shadow: -30px 0 80px rgba(0,0,0,0.6);
            display: flex; flex-direction: column;
            transform: translateX(105%); transition: transform 320ms cubic-bezier(.2,.8,.2,1);
          }
          .pr-drawer.open { transform: translateX(0); }
          .pr-lb-arrow {
            position: fixed; top: 50%; transform: translateY(-50%);
            width: 48px; height: 48px; border-radius: 50%;
            background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22);
            color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(8px); z-index: 2002; transition: background 200ms ease;
          }
          .pr-lb-arrow:hover { background: rgba(255,255,255,0.28); }
          .pr-lb-arrow.prev { left: 18px; }
          .pr-lb-arrow.next { right: 18px; }
          @media (max-width: 720px) {
            .pr-lb-arrow { width: 42px; height: 42px; }
            .pr-lb-arrow.prev { left: 8px; }
            .pr-lb-arrow.next { right: 8px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .pr-print, .pr-card, .ph, .pr-actions, .pr-drawer, .pr-fab { transition: none !important; }
            .pr-skel { animation: none; background: rgba(255,255,255,0.06); }
          }
        `}</style>

        {/* ═══ MASTHEAD + COMMAND BAR + TRUST STRIP (full-bleed) ═══ */}
        <section className="pr-hero">
          <div style={{
            maxWidth: 1280, margin: '0 auto',
            padding: isMobile ? '34px 20px 22px' : '54px 28px 30px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
            gap: 30, alignItems: 'center',
          }}>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.55)', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>
                <span aria-hidden style={{ width: 26, height: 1, background: '#F20C8F' }} /> Connekyt Archive
              </span>
              <h1 className="pr-serif" style={{ margin: 0, color: '#fff', fontSize: 'clamp(40px, 5.6vw, 68px)', lineHeight: 1.02, fontWeight: 600, letterSpacing: '-0.01em' }}>
                Browse<br /><em style={{ color: '#F20C8F', fontStyle: 'italic' }}>Photos.</em>
              </h1>
              <p style={{ margin: '16px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 15.5, lineHeight: 1.65, maxWidth: 480 }}>
                Professional photography by credited creators. Buy the print,
                own the original - delivered to your inbox.
              </p>
            </div>
            {!isMobile && items.length > 0 && (
              <div className="pr-mosaic" aria-hidden onContextMenu={(e) => e.preventDefault()}>
                {items.slice(0, 3).map((it, i) => {
                  const spots = [
                    { width: '46%', aspectRatio: '3/4', top: '4%', left: '6%', transform: 'rotate(-5deg)', zIndex: 2 },
                    { width: '52%', aspectRatio: '4/3', top: '18%', right: '2%', transform: 'rotate(3.5deg)', zIndex: 3 },
                    { width: '38%', aspectRatio: '1', bottom: '0%', left: '28%', transform: 'rotate(-1.5deg)', zIndex: 1 },
                  ] as const;
                  return (
                    <div key={it.imageId} className="pr-print" style={spots[i]}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.thumbnailUrl || it.fileUrl} alt="" draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{ filter: isOccluded ? 'brightness(0)' : undefined }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px 18px' }}>
            <div className="pr-cmd">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setQDebounced(q.trim()); }}
                placeholder="Search the archive - photos, photographers, subjects…"
                aria-label="Search photos"
              />
              <button type="button" className="pr-cmd-btn" onClick={() => setQDebounced(q.trim())}>Search</button>
            </div>
            <div className="pr-rail" style={{ marginTop: 14, justifyContent: isMobile ? 'flex-start' : 'center' }} aria-label="Categories">
              <button type="button" className={`pr-cat ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>All</button>
              {categories.map(c => (
                <button key={c.name} type="button" className={`pr-cat ${category === c.name ? 'active' : ''}`} onClick={() => setCategory(c.name)}>
                  {c.label} <span style={{ opacity: 0.6 }}>({c.count})</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 20px', display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 12.5, fontWeight: 600 }}>
              <span>◈ Every photo credited to its photographer</span>
              <span>◈ Originals emailed straight after checkout</span>
              <span>◈ Mobile money &amp; card</span>
            </div>
          </div>
        </section>

        {/* ═══ CATALOG ═══ */}
        <section className="pr-catalog" style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '24px 16px 140px' : '30px 28px 150px', position: 'relative', zIndex: 1 }}>
          <div className="pr-grain" aria-hidden />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <h2 className="pr-serif" style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 600 }}>Latest prints</h2>
            {!loading && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                {total.toLocaleString()} photo{total === 1 ? '' : 's'}{totalPages > 1 ? ` · page ${page + 1} of ${totalPages}` : ''}
              </span>
            )}
            <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={photographerId} onChange={e => setPhotographerId(e.target.value)} className="pr-select" aria-label="Filter by photographer">
                <option value="">All photographers</option>
                {photographers.map(p => (
                  <option key={p.id} value={p.id}>{p.name || '-'}</option>
                ))}
              </select>
              <input type="number" placeholder="Min $" value={minPrice}
                onChange={e => setMinPrice(e.target.value)} aria-label="Minimum price"
                style={{ ...selectStyle, width: 78 }} />
              <input type="number" placeholder="Max $" value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)} aria-label="Maximum price"
                style={{ ...selectStyle, width: 78 }} />
              {filtersActive && (
                <button type="button"
                  onClick={() => { setQ(''); setCategory(''); setPhotographerId(''); setMinPrice(''); setMaxPrice(''); }}
                  style={{ padding: '8px 10px', fontSize: 12.5, fontWeight: 700, background: 'transparent', color: '#F20C8F', border: 'none', cursor: 'pointer' }}>
                  Clear
                </button>
              )}
              <Link href="/user/browse-photos/recover" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i className="bi bi-arrow-clockwise" /> Recover purchases
              </Link>
            </span>
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
            <div style={{ columnCount: isMobile ? 2 : 3, columnGap: 18 }}>
              {[0.75, 1.35, 1, 0.8, 1.5, 0.7, 1.2, 1, 0.85].map((r, i) => (
                <div key={i} className="pr-card pr-skel" style={{ aspectRatio: `${r}`, marginBottom: 18 }} />
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
            <div style={{ columnCount: isMobile ? 2 : 3, columnGap: 18 }}>
              {items.map((it, itemIndex) => {
                const isSelected = !!cart[it.imageId];
                const priceLabel = fmtListing(it);
                return (
                  <article
                    key={it.imageId}
                    className={`pr-card ${isSelected ? 'selected' : ''}`}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => setPreviewing(it)}
                  >
                    <div
                      className={`pr-photo ${loadedIds.has(it.imageId) ? '' : 'pr-skel'}`}
                      style={{
                        // Hold a neutral ratio until the real one is known so
                        // the masonry column doesn't jump; release to the
                        // photo's own shape as soon as it loads.
                        aspectRatio: photoRatios[it.imageId] ? `${photoRatios[it.imageId]}` : '1',
                      }}
                    >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="ph"
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

                    {/* Top-right: price chip */}
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: isSelected ? '#F20C8F' : 'rgba(4,10,24,0.72)',
                      color: '#fff', fontSize: 11.5, fontWeight: 700,
                      padding: '4px 11px', borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.16)',
                      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                      zIndex: 3,
                    }}>
                      {priceLabel}
                    </div>

                    {/* Hover actions: cart toggle + express Buy. Always
                        visible on touch devices via the media query. */}
                    <div className="pr-actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCart(it); }}
                        aria-label={isSelected ? 'Remove from cart' : 'Add to cart'}
                        style={{
                          padding: '9px 14px', borderRadius: 999,
                          border: '1px solid rgba(255,255,255,0.3)',
                          background: isSelected ? '#F20C8F' : 'rgba(4,10,24,0.7)',
                          color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
                          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        }}
                      >
                        {isSelected ? '✓ In cart' : '+ Cart'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); expressBuy(it); }}
                        aria-label="Buy this photo"
                        style={{
                          padding: '9px 14px', borderRadius: 999,
                          border: 'none', background: '#03969c', color: '#fff',
                          fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
                          boxShadow: '0 6px 16px -4px rgba(0,0,0,0.55)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#026d72'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#03969c'; }}
                      >
                        Buy now
                      </button>
                    </div>
                    </div>

                    {/* Caption strip - print-catalog credit line */}
                    <div className="pr-caption">
                      {it.photographerLogo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={it.photographerLogo} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <span aria-hidden style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', flexShrink: 0 }} />
                      )}
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it.photographerName || 'Photographer'}
                      </span>
                      <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {priceLabel}
                      </span>
                    </div>
                  </article>
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
        </section>
      </main>

      {/* ── Cart FAB + slide-in drawer (replaces the old bottom bar) ── */}
      {cartItems.length > 0 && !drawerOpen && (
        <button className="pr-fab" onClick={() => setDrawerOpen(true)} aria-label={`Open cart, ${cartItems.length} items`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2 3h3l2.6 12.4A2 2 0 0 0 9.6 17h8.8a2 2 0 0 0 2-1.6L22 7H6"/></svg>
          {cartItems.length} · {cartTotalStr}
        </button>
      )}
      {drawerOpen && (
        <div aria-hidden onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.55)', backdropFilter: 'blur(2px)', zIndex: 1650 }} />
      )}
      <aside className={`pr-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen} inert={!drawerOpen} aria-label="Cart">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="pr-serif" style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 600 }}>Your prints</h3>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{cartItems.length} selected</span>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close cart" style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 0, color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cartItems.map(m => (
            <div key={m.imageId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#0a1a36' }} onContextMenu={(e) => e.preventDefault()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.thumbnailUrl || m.fileUrl} alt="" draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none', filter: isOccluded ? 'brightness(0)' : undefined }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.photographerName || 'Photographer'}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{fmtListing(m)}</div>
              </div>
              <button onClick={() => removeFromCart(m.imageId)} aria-label="Remove from cart" style={{ marginLeft: 'auto', background: 'none', border: 0, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16, padding: 6 }}>✕</button>
            </div>
          ))}
          {cartItems.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5, textAlign: 'center', marginTop: 30 }}>
              Your cart is empty - add prints from the catalog.
            </p>
          )}
        </div>
        <div style={{ padding: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 12 }}>
            <span>Total</span><span>{cartTotalStr}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={clearCart}
              style={{ padding: '13px 16px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 13.5 }}>
              Clear
            </button>
            <button
              onClick={() => { setDrawerOpen(false); handleCheckoutClick(); }}
              disabled={cartItems.length === 0}
              style={{ flex: 1, padding: 14, borderRadius: 12, border: 0, cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)', color: '#fff', fontWeight: 800, fontSize: 15, boxShadow: '0 12px 30px -10px rgba(242,12,143,0.5)', opacity: cartItems.length === 0 ? 0.5 : 1 }}>
              Checkout · {cartTotalStr}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Product view ── the Print Room treatment: a split panel with
          the protected preview on the left and a detail rail (photographer,
          price, buy / cart actions) on the right. Same four 45° frosted
          bands, occlusion filter and right-click/drag blocking as before -
          protections are non-negotiable. Arrows, arrow keys and swipe
          step through the page's results. */}
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
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.9)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: isMobile ? 12 : 24, overflowY: 'auto',
          }}
        >
          {/* Preload neighbours so arrow/swipe navigation feels instant */}
          {[items[lightboxIndex - 1], items[lightboxIndex + 1]]
            .filter((p): p is BrowseRow => !!p)
            .map((p) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={`preload-${p.imageId}`} src={p.fileUrl} alt="" aria-hidden style={{ display: 'none' }} />
            ))}

          {lightboxIndex > 0 && (
            <button type="button" className="pr-lb-arrow prev" aria-label="Previous photo"
              onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {lightboxIndex >= 0 && lightboxIndex < items.length - 1 && (
            <button type="button" className="pr-lb-arrow next" aria-label="Next photo"
              onClick={(e) => { e.stopPropagation(); stepLightbox(1); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 300px',
              maxWidth: 1000, width: '100%',
              maxHeight: isMobile ? undefined : '86vh',
              borderRadius: 18, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              background: '#081831',
              boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
              margin: 'auto',
            }}
          >
            {/* Image half - every protection intact */}
            <div style={{ position: 'relative', minHeight: isMobile ? 260 : 380, background: '#050f22', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewing.fileUrl}
                alt=""
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  width: '100%', height: '100%',
                  maxHeight: isMobile ? '48vh' : '86vh',
                  objectFit: 'contain', display: 'block',
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

              {/* Four 45° blurred diagonal bands - the frosted-glass
                  watermark shared with find-my-photos locked photos. */}
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

              <span style={{
                position: 'absolute', top: 12, left: 12,
                padding: '6px 12px', borderRadius: 50,
                background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700,
                fontVariantNumeric: 'tabular-nums', pointerEvents: 'none',
              }}>
                {lightboxIndex + 1} / {items.length}
              </span>

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

            {/* Detail rail */}
            <div style={{
              padding: 22, display: 'flex', flexDirection: 'column', gap: 14,
              borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
              borderTop: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {previewing.photographerLogo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewing.photographerLogo} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <span aria-hidden style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewing.photographerName || 'Photographer'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5 }}>Credited photographer</div>
                </div>
              </div>

              {previewing.categoryLabel && (
                <span style={{ alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontWeight: 700 }}>
                  {previewing.categoryLabel}
                </span>
              )}

              <div className="pr-serif" style={{ color: '#fff', fontSize: 26, fontWeight: 600 }}>{fmtListing(previewing)}</div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: 12.5, lineHeight: 1.6 }}>
                Watermark-free original delivered to your email straight after checkout.
              </p>

              <button
                onClick={() => { const it = previewing; setPreviewing(null); if (it) expressBuy(it); }}
                style={{ padding: 13, borderRadius: 12, border: 0, cursor: 'pointer', background: '#03969c', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                Buy now · {fmtListing(previewing)}
              </button>
              <button
                onClick={() => { if (previewing) toggleCart(previewing); }}
                style={{
                  padding: 13, borderRadius: 12, cursor: 'pointer',
                  background: cart[previewing.imageId] ? 'rgba(242,12,143,0.15)' : 'rgba(255,255,255,0.06)',
                  border: cart[previewing.imageId] ? '1px solid rgba(242,12,143,0.5)' : '1px solid rgba(255,255,255,0.18)',
                  color: cart[previewing.imageId] ? '#ff7ec4' : '#fff', fontWeight: 700, fontSize: 14,
                }}>
                {cart[previewing.imageId] ? '\u2713 In cart \u00b7 tap to remove' : 'Add to cart'}
              </button>
              <button onClick={() => setPreviewing(null)} style={{ marginTop: 'auto', padding: 11, borderRadius: 12, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 13 }}>
                Close
              </button>
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
          darkMode
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

