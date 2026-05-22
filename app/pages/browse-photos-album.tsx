"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import XentriPayModal from "../components/XentriPayModal";
import PurchaseSuccessModal from "../components/PurchaseSuccessModal";
import type { MultiAlbumPurchaseItem } from "@/lib/APIs/payments/xentripay";

/**
 * Dedicated single-album landing for photographer share links.
 *
 *   https://connekyt.com/user/browse-photos/{photographer-album-slug}
 *
 * Hero with the album cover, title, photographer chip; same edge-to-edge
 * grid + bottom cart + checkout as /user/browse-photos so the buyer's
 * mental model is identical. Reuses the shared PurchaseSuccessModal so
 * the post-payment in-page flow (auto-download + per-image picker)
 * works exactly the same way.
 *
 * Initial album payload comes from the SSR wrapper for OG metadata +
 * zero client-fetch first paint; client re-fetches on currency change.
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
interface AlbumMeta {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  categoryLabel?: string | null;
  photographerName?: string;
  photographerLogo?: string | null;
  listingPrice?: number;
  listingCurrency?: string | null;
  photoCount?: number;
}
interface InitialPayload {
  album: AlbumMeta;
  items: BrowseRow[];
}

export default function BrowsePhotosAlbumPage({
  slug,
  initial,
}: {
  slug: string;
  initial: InitialPayload | null;
}) {
  const [album, setAlbum] = useState<AlbumMeta | null>(initial?.album || null);
  const [items, setItems] = useState<BrowseRow[]>(initial?.items || []);
  const [loading, setLoading] = useState(!initial);
  const [isMobile, setIsMobile] = useState(false);

  // Cart
  const [cart, setCart] = useState<Record<string, BrowseRow>>({});
  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = useMemo(
    () => cartItems.reduce((s, i) => s + Number(i.buyerPrice || 0), 0),
    [cartItems]
  );

  // Lightbox
  const [previewing, setPreviewing] = useState<BrowseRow | null>(null);
  // Checkout / success
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [showXentri, setShowXentri] = useState(false);
  const [purchaseRefid, setPurchaseRefid] = useState<string | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<BrowseRow[]>([]);
  const [purchaseEmail, setPurchaseEmail] = useState('');

  // Tab-occlusion blackout (mirrors /user/browse-photos). When the
  // window loses focus or the tab is hidden, every photo blacks out
  // (filter: brightness(0)) so screen-recording / second-window capture
  // gets nothing. Reveals when the tab comes back.
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

  useEffect(() => {
    const apply = () => setIsMobile(window.innerWidth < 768);
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  // Client refetch if SSR had no data (live link, but album was just
  // approved a moment ago and the Next ISR cache is stale).
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/public/content/album-by-slug/${encodeURIComponent(slug)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      if (j?.action === 1 && j.data) {
        setAlbum(j.data.album);
        setItems(j.data.items || []);
      }
    } catch { /* keep showing initial if any */ }
    finally { setLoading(false); }
  }, [slug]);
  useEffect(() => { if (!initial) void refresh(); }, [initial, refresh]);

  const toggleCart = (row: BrowseRow) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[row.imageId]) delete next[row.imageId];
      else next[row.imageId] = row;
      return next;
    });
  };
  const clearCart = () => setCart({});

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
      currencyId: g.currency,
    }));
  }, [cartItems]);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    setCheckoutOpen(true);
  };
  const expressBuy = (it: BrowseRow) => {
    setCart(prev => ({ ...prev, [it.imageId]: it }));
    setCheckoutOpen(true);
  };
  const fmtListing = (it: BrowseRow) => {
    const code = it.listingCurrency || 'USD';
    const symbol = code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : code;
    const dp = code === 'RWF' ? 0 : 2;
    return `${symbol} ${Number(it.listingPrice || 0).toFixed(dp)}`;
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
    setPurchasedItems(Object.values(cart));
    setPurchaseEmail(email);
    setPurchaseRefid(refid);
    clearCart();
  };

  // Album not found (slug mismatch or no longer live)
  if (!loading && !album) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: '100vh', background: '#f9fafb', paddingTop: 100 }}>
          <div style={{ maxWidth: 520, margin: '0 auto', padding: 24, textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>Album not found</h1>
            <p style={{ color: '#6b7280', marginTop: 8 }}>
              The album you&apos;re looking for isn&apos;t live right now. It may have been removed by the photographer.
            </p>
            <Link href="/user/browse-photos" style={{
              display: 'inline-block', marginTop: 14, padding: '10px 18px',
              background: '#F20C8F', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700,
            }}>Browse all photos</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const listingSym = album?.listingCurrency === 'USD' ? '$'
    : album?.listingCurrency === 'EUR' ? '€'
    : album?.listingCurrency === 'GBP' ? '£'
    : album?.listingCurrency || '';

  return (
    <>
      <Navbar />

      <main
        onContextMenu={(e) => e.preventDefault()}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to right, #052047, #052047, #103E83)',
          position: 'relative',
          paddingTop: 64,
        }}
      >
        {/* Dotted overlay (matches /browse-photos hero) */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at top, black 50%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black 50%, transparent 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: isMobile ? '12px 14px 140px' : '14px 32px 160px' }}>

          {/* Hero: cover thumbnail + album metadata */}
          {album && (
            <div style={{
              display: 'flex', gap: isMobile ? 14 : 22, flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'flex-end',
              marginBottom: 18,
            }}>
              <div style={{
                flexShrink: 0,
                width: isMobile ? '100%' : 220, height: isMobile ? 200 : 220,
                background: '#0a1a36',
                overflow: 'hidden',
                boxShadow: '0 16px 40px -10px rgba(0,0,0,0.55)',
                position: 'relative',
              }}>
                {album.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.coverImage} alt={album.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 40,
                  }}>
                    <i className="bi bi-images" />
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1, paddingBottom: isMobile ? 0 : 4 }}>
                {album.categoryLabel && (
                  <div style={{
                    display: 'inline-block', padding: '3px 10px',
                    fontSize: 10.5, fontWeight: 700, color: '#fff',
                    background: 'rgba(255,255,255,0.16)', borderRadius: 999, letterSpacing: 0.4,
                    textTransform: 'uppercase', marginBottom: 8,
                  }}>{album.categoryLabel}</div>
                )}
                <h1 style={{
                  margin: 0, fontSize: isMobile ? 24 : 34, fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.025em', lineHeight: 1.1,
                }}>{album.title}</h1>
                {album.description && (
                  <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'rgba(255,255,255,0.78)', maxWidth: 720, lineHeight: 1.55 }}>
                    {album.description}
                  </p>
                )}
                <div style={{
                  marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px 6px 6px',
                  background: 'rgba(255,255,255,0.10)', borderRadius: 999,
                }}>
                  {album.photographerLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.photographerLogo} alt=""
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                      {(album.photographerName || '·').trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{album.photographerName || '-'}</span>
                  {album.photoCount != null && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginLeft: 4 }}>
                      · {album.photoCount} photo{album.photoCount === 1 ? '' : 's'}
                    </span>
                  )}
                  {album.listingPrice != null && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginLeft: 4 }}>
                      · {listingSym} {Number(album.listingPrice).toFixed(album.listingCurrency === 'RWF' ? 0 : 2)} / photo
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Edge-to-edge grid */}
          {loading ? (
            <div style={{ padding: 80, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              This album has no photos yet.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
              gap: 0,
            }}>
              {items.map(it => {
                const isSelected = !!cart[it.imageId];
                const sym = it.listingCurrency === 'USD' ? '$' : it.listingCurrency === 'EUR' ? '€' : it.listingCurrency === 'GBP' ? '£' : it.listingCurrency || '';
                const price = `${sym} ${Number(it.listingPrice || 0).toFixed(it.listingCurrency === 'RWF' ? 0 : 2)}`;
                return (
                  <div
                    key={it.imageId}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => setPreviewing(it)}
                    style={{
                      position: 'relative', borderRadius: 0, overflow: 'hidden', aspectRatio: '1',
                      cursor: 'pointer', background: '#0a1a36',
                      outline: isSelected ? '4px solid #F20C8F' : 'none',
                      outlineOffset: isSelected ? -4 : 0,
                      transition: 'outline-color 0.15s',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.fileUrl} alt=""
                      loading="lazy" draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        userSelect: 'none', pointerEvents: 'none',
                        filter: isOccluded ? 'brightness(0)' : undefined,
                        transition: 'filter 0.1s linear',
                      }}
                    />
                    {/* Repeating-tile CONNEKYT watermark - matches the
                        paid-album style on /user/find-my-photos. */}
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      backgroundImage:
                        'url("data:image/svg+xml;utf8,' +
                        encodeURIComponent(
                          '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="80" viewBox="0 0 140 80">' +
                            '<text x="70" y="46" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="rgba(255,255,255,0.55)" text-anchor="middle" transform="rotate(-24 70 42)">CONNEKYT</text>' +
                          '</svg>'
                        ) +
                        '")',
                      backgroundRepeat: 'repeat',
                      mixBlendMode: 'overlay',
                    }} />
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: isSelected ? '#F20C8F' : 'rgba(0,0,0,0.75)',
                      color: '#fff', fontSize: 11.5, fontWeight: 700,
                      padding: '4px 11px', borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.18)',
                    }}>{price}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCart(it); }}
                      aria-label={isSelected ? 'Remove from cart' : 'Add to cart'}
                      style={{
                        position: 'absolute', top: 8, left: 8,
                        width: 36, height: 36, borderRadius: '50%',
                        background: isSelected ? '#F20C8F' : '#ffffff',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 3, padding: 0,
                        boxShadow: '0 4px 12px -2px rgba(0,0,0,0.45)',
                      }}
                    >
                      {isSelected ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <i className="bi bi-plus-lg" style={{ fontSize: 17, color: '#03969c', fontWeight: 700, lineHeight: 1 }} />
                      )}
                    </button>
                    {/* Bottom-right express-buy pill. Adds this single
                        photo to cart and opens checkout immediately. */}
                    <button
                      onClick={(e) => { e.stopPropagation(); expressBuy(it); }}
                      aria-label="Buy this photo"
                      style={{
                        position: 'absolute', bottom: 8, right: 8,
                        padding: '7px 14px', borderRadius: 999,
                        background: '#03969c', color: '#fff',
                        border: 'none', cursor: 'pointer', zIndex: 3,
                        fontSize: 12.5, fontWeight: 700,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 6px 16px -4px rgba(0,0,0,0.55)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#026d72'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#03969c'; }}
                    >
                      <i className="bi bi-download" /> Buy ({price})
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Cart bottom bar */}
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
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
            <div style={{ flex: isMobile ? 'initial' : 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 12px 6px 8px', borderRadius: 999,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: '#fff', fontSize: 13, fontWeight: 700,
              }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-bag-check-fill" style={{ fontSize: 11 }} />
                </span>
                {cartItems.length} photo{cartItems.length === 1 ? '' : 's'} in cart
              </div>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>
                Total: <strong>$ {cartTotal.toFixed(2)}</strong>
              </span>
            </div>
            <button onClick={clearCart}
              style={{
                padding: '10px 16px', borderRadius: 11,
                background: 'transparent', border: '1.5px solid rgba(255,255,255,0.20)',
                color: 'rgba(255,255,255,0.82)', fontSize: 13.5, fontWeight: 700,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}><i className="bi bi-x-circle" style={{ fontSize: 13 }} /> Clear</button>
            <button onClick={handleCheckoutClick}
              style={{
                padding: '11px 18px', borderRadius: 11,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
              }}><i className="bi bi-credit-card-2-front" /> Checkout · $ {cartTotal.toFixed(2)}</button>
          </div>
        </div>
      )}

      {/* Lightbox - find-my-photos paid-album style: four blurred 45°
          diagonal bands as watermark, teal Buy pill + circular close at
          top-right, "🔒 PREVIEW · BUY TO UNLOCK" pill at bottom-left.
          Right-click + drag blocked at every layer; image blacks out
          when the tab is hidden (isOccluded). */}
      {previewing && (
        <div onClick={() => setPreviewing(null)} onContextMenu={(e) => e.preventDefault()}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
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
            <button onClick={(e) => { e.stopPropagation(); setPreviewing(null); }}
              aria-label="Close preview"
              style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >×</button>
          </div>
          <div onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewing!.fileUrl} alt="" draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                display: 'block', maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain',
                userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
                filter: isOccluded ? 'brightness(0)' : undefined,
                transition: 'filter 0.1s linear',
              }}
            />
            <div aria-hidden
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{ position: 'absolute', inset: 0, background: 'transparent', userSelect: 'none' }}
            />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} aria-hidden style={{
                position: 'absolute', top: `${-5 + i * 32}%`, left: '-50%',
                width: '200%', height: 60,
                transform: 'rotate(-45deg)', transformOrigin: 'center',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                background: 'rgba(255,255,255,0.18)',
                borderTop: '1px solid rgba(255,255,255,0.35)',
                borderBottom: '1px solid rgba(255,255,255,0.35)',
                pointerEvents: 'none',
              }} />
            ))}
            <div aria-hidden style={{
              position: 'absolute', bottom: 12, left: 12,
              padding: '6px 12px', borderRadius: 50,
              background: 'rgba(0,0,0,0.7)', color: '#fff',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
              border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
              pointerEvents: 'none',
            }}>🔒 PREVIEW · BUY TO UNLOCK</div>
          </div>
        </div>
      )}

      {/* Email + checkout */}
      {checkoutOpen && (
        <div onClick={() => setCheckoutOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, maxWidth: 440, width: '100%', padding: 22 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>One last step</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>
              We&apos;ll email your downloadable ZIP to this address - recoverable later via the recover page.
            </p>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', marginBottom: 14 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setCheckoutOpen(false)} style={{ padding: '10px 18px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleEmailContinue} style={{ padding: '10px 18px', background: '#F20C8F', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Continue to payment</button>
            </div>
          </div>
        </div>
      )}

      {purchaseRefid && (
        <PurchaseSuccessModal
          refid={purchaseRefid}
          items={purchasedItems.map(p => ({ imageId: p.imageId, fileUrl: p.fileUrl }))}
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
          amount={cartTotal}
          currencyCode="USD"
          currencyId="USD"
          multiAlbumItems={multiAlbumItems}
          viewerEmail={email}
          showDonationPrompt
          title="Connekyt Photos"
          subtitle={album ? `${cartItems.length} photo${cartItems.length === 1 ? '' : 's'} from ${album.title}` : undefined}
        />
      )}

      <Footer />
    </>
  );
}
