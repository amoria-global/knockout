"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./explore.css";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import XentriPayModal from "../components/XentriPayModal";
import PurchaseSuccessModal from "../components/PurchaseSuccessModal";
import type { MultiAlbumPurchaseItem } from "@/lib/APIs/payments/xentripay";
import {
  clock, fetchFacets, fetchFeed, fetchItem, fetchQuote, money, recoverByEmail, unlockByCode,
  type ExploreItem, type Facets, type FeedQuery, type Quote, type Unlocked,
} from "./exploreApi";

const CURRENCIES = ["USD", "EUR", "GBP", "RWF", "KES"];
const PREVIEW_CCYS = ["USD", "RWF", "EUR", "KES", "UGX", "TZS"];
const CART_KEY = "connekyt:explore:cart:v1";
const SAVES_KEY = "connekyt:explore:saves:v1";

type CartSnap = { id: string; title: string | null; thumbnailUrl: string | null; mediaType: string };

function readJson<T>(key: string, fallback: T): T {
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function writeJson(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: the page still works */ }
}

export default function ExploreClient() {
  const t = useTranslations("explore");

  // ── filters ─────────────────────────────────────────────────────────
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"" | "PHOTO" | "VIDEO">("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<FeedQuery["sort"]>("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  useEffect(() => { const h = setTimeout(() => setQDebounced(q.trim()), 300); return () => clearTimeout(h); }, [q]);

  // ── feed ────────────────────────────────────────────────────────────
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const [facets, setFacets] = useState<Facets | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const queryKey = [qDebounced, category, type, tag, sort, minPrice, maxPrice, currency].join("|");

  const baseQuery = useCallback((): FeedQuery => ({
    q: qDebounced, category, type, tag, sort, minPrice, maxPrice, currency,
  }), [qDebounced, category, type, tag, sort, minPrice, maxPrice, currency]);

  const load = useCallback(async (reset: boolean, from: string | null) => {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setLoading(true);
    setFailed(false);
    try {
      const page = await fetchFeed({ ...baseQuery(), cursor: reset ? null : from }, ctl.signal);
      setItems(prev => (reset ? page.items : [...prev, ...page.items.filter(n => !prev.some(p => p.id === n.id))]));
      setCursor(page.nextCursor);
      setDone(!page.nextCursor);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setFailed(true);
    } finally {
      if (abortRef.current === ctl) setLoading(false);
    }
  }, [baseQuery]);

  useEffect(() => { setItems([]); setCursor(null); setDone(false); void load(true, null); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [queryKey]);
  useEffect(() => { fetchFacets(currency).then(setFacets).catch(() => setFacets(null)); }, [currency]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && !done && !failed && cursor) void load(false, cursor);
    }, { rootMargin: "700px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loading, done, failed, load]);

  // ── cart + saves (kept in this browser) ─────────────────────────────
  const [cart, setCart] = useState<CartSnap[]>([]);
  const [saves, setSaves] = useState<string[]>([]);
  useEffect(() => { setCart(readJson<CartSnap[]>(CART_KEY, [])); setSaves(readJson<string[]>(SAVES_KEY, [])); }, []);
  const inCart = (id: string) => cart.some(c => c.id === id);
  const toggleCart = (it: ExploreItem) => {
    setCart(prev => {
      const next = prev.some(c => c.id === it.id) ? prev.filter(c => c.id !== it.id)
        : [...prev, { id: it.id, title: it.title, thumbnailUrl: it.thumbnailUrl, mediaType: it.mediaType }];
      writeJson(CART_KEY, next);
      return next;
    });
  };
  const toggleSave = (id: string) => {
    setSaves(prev => { const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]; writeJson(SAVES_KEY, next); return next; });
  };

  // ── viewer ──────────────────────────────────────────────────────────
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openIndex = openId ? items.findIndex(i => i.id === openId) : -1;
  const openItem = openIndex >= 0 ? items[openIndex] : null;
  const step = useCallback((d: number) => { const n = items[openIndex + d]; if (n) setOpenId(n.id); }, [items, openIndex]);
  useEffect(() => {
    if (!openItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openItem, step]);
  const closeViewer = () => { setOpenId(null); opener.current?.focus(); };

  // ── cart drawer, checkout ───────────────────────────────────────────
  const [drawer, setDrawer] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [payItems, setPayItems] = useState<MultiAlbumPurchaseItem[]>([]);
  const [payCurrency, setPayCurrency] = useState("USD");
  const [payAmount, setPayAmount] = useState(0);
  const [refid, setRefid] = useState<string | null>(null);
  const [bought, setBought] = useState<CartSnap[]>([]);
  const [removedNote, setRemovedNote] = useState(0);

  useEffect(() => {
    if (!drawer || cart.length === 0) { setQuote(null); return; }
    let live = true;
    setQuoteBusy(true);
    fetchQuote(cart.map(c => c.id), currency).then(qt => {
      if (!live) return;
      setQuote(qt);
      if (qt.unavailable.length) {
        setRemovedNote(qt.unavailable.length);
        setCart(prev => { const next = prev.filter(c => !qt.unavailable.includes(c.id)); writeJson(CART_KEY, next); return next; });
      }
    }).catch(() => { if (live) setQuote(null); }).finally(() => { if (live) setQuoteBusy(false); });
    return () => { live = false; };
  }, [drawer, cart.length, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCheckout = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError(true); return; }
    setEmailError(false);
    let qt = quote;
    if (!qt) return;
    const groupCcy = new Set(qt.groups.map(g => g.currencyId));
    let single = groupCcy.size === 1 && PREVIEW_CCYS.includes([...groupCcy][0]);
    let amount: number;
    let ccy: string;
    if (single) {
      ccy = [...groupCcy][0];
      amount = qt.groups.reduce((s, g) => s + g.amount, 0);
    } else {
      if (qt.currency !== "USD") { try { qt = await fetchQuote(cart.map(c => c.id), "USD"); } catch { return; } }
      ccy = "USD";
      amount = qt.total;
      single = false;
    }
    setPayItems(qt.groups.map(g => ({ albumId: g.albumId, photoIds: g.photoIds, amount: g.amount, currencyId: g.currencyId })));
    setPayCurrency(ccy);
    setPayAmount(amount);
    setDrawer(false);
    setShowPay(true);
  };
  const onPaid = (id: string) => {
    setShowPay(false);
    setBought(cart);
    setRefid(id);
    setCart([]);
    writeJson(CART_KEY, []);
  };

  // ── "I already bought this" and recovery ────────────────────────────
  const [ownOpen, setOwnOpen] = useState(false);
  const [code, setCode] = useState("");
  const [ownBusy, setOwnBusy] = useState(false);
  const [ownError, setOwnError] = useState("");
  const [unlocked, setUnlocked] = useState<Unlocked | null>(null);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverSent, setRecoverSent] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("recover") === "1") setOwnOpen(true);
    const shared = params.get("item");
    if (shared) {
      // A shared link opens that item even when it is not on the first page of the feed.
      fetchItem(shared, "USD").then(it => { setItems(prev => (prev.some(p => p.id === it.id) ? prev : [it, ...prev])); setOpenId(it.id); }).catch(() => { /* gone: show the feed */ });
    }
  }, []);
  const submitCode = async () => {
    setOwnBusy(true); setOwnError("");
    try { setUnlocked(await unlockByCode(code)); }
    catch (e) { setOwnError((e as { status?: number }).status === 429 ? t("tooMany") : t("codeInvalid")); }
    finally { setOwnBusy(false); }
  };
  const submitRecover = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoverEmail.trim())) { setOwnError(t("emailInvalid")); return; }
    setOwnBusy(true); setOwnError("");
    try { await recoverByEmail(recoverEmail.trim()); setRecoverSent(true); } catch { setOwnError(t("errorBody")); }
    finally { setOwnBusy(false); }
  };

  // ── card hover preview (one clip at a time, fine pointers only) ─────
  const onEnter = (it: ExploreItem) => {
    if (it.mediaType !== "VIDEO" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverId(it.id), 280);
  };
  const onLeave = () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoverId(null); };

  const filtersActive = !!(qDebounced || category || type || tag || minPrice || maxPrice);
  const clearFilters = () => { setQ(""); setCategory(""); setType(""); setTag(""); setMinPrice(""); setMaxPrice(""); setSort("newest"); };
  const cartCount = cart.length;

  const skeletons = useMemo(() => Array.from({ length: 10 }, (_, i) => 160 + ((i * 53) % 140)), []);

  return (
    <>
      <Navbar />
      <main className="xp">
        <div className="xp-wrap">
          <header className="xp-hero">
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </header>
        </div>

        <div className="xp-bar" role="search">
          <div className="xp-wrap">
            <div className="xp-row">
              <label className="xp-search">
                <i className="bi bi-search" aria-hidden />
                <span className="xp-sr">{t("searchPlaceholder")}</span>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder={t("searchPlaceholder")} />
              </label>
              <select className="xp-select" aria-label={t("sort")} value={sort} onChange={e => setSort(e.target.value as FeedQuery["sort"])}>
                <option value="newest">{t("sortNewest")}</option>
                <option value="popular">{t("sortPopular")}</option>
                <option value="price_asc">{t("sortPriceAsc")}</option>
                <option value="price_desc">{t("sortPriceDesc")}</option>
              </select>
              <div className="xp-price">
                <input inputMode="decimal" aria-label={t("minPrice")} placeholder={t("minPrice")} value={minPrice} onChange={e => setMinPrice(e.target.value.replace(/[^\d.]/g, ""))} />
                <input inputMode="decimal" aria-label={t("maxPrice")} placeholder={t("maxPrice")} value={maxPrice} onChange={e => setMaxPrice(e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
              <select className="xp-select" aria-label={t("currency")} value={currency} onChange={e => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="xp-chips" role="group" aria-label={t("filters")}>
              <button className="xp-chip" aria-pressed={type === "" && !category} onClick={() => { setType(""); setCategory(""); }}>{t("all")}</button>
              <button className="xp-chip" aria-pressed={type === "PHOTO"} onClick={() => setType(type === "PHOTO" ? "" : "PHOTO")}>{t("photos")}</button>
              <button className="xp-chip" aria-pressed={type === "VIDEO"} onClick={() => setType(type === "VIDEO" ? "" : "VIDEO")}>
                {t("clips")}{facets && facets.clips > 0 && <small>{facets.clips}</small>}
              </button>
              {facets?.categories.map(c => (
                <button key={c.name} className="xp-chip" aria-pressed={category === c.name} onClick={() => setCategory(category === c.name ? "" : c.name)}>
                  {c.label}<small>{c.count}</small>
                </button>
              ))}
              {facets?.tags.slice(0, 8).map(g => (
                <button key={g.name} className="xp-chip" aria-pressed={tag === g.name} onClick={() => setTag(tag === g.name ? "" : g.name)}>#{g.name}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="xp-wrap" aria-live="polite">
          {failed && (
            <div className="xp-state" role="alert">
              <h2>{t("errorTitle")}</h2>
              <p>{t("errorBody")}</p>
              <button className="xp-btn" onClick={() => void load(items.length === 0, cursor)}>{t("retry")}</button>
            </div>
          )}

          {!failed && !loading && items.length === 0 && (
            <div className="xp-state">
              <h2>{t("emptyTitle")}</h2>
              <p>{t("emptyBody")}</p>
              {filtersActive && <button className="xp-btn ghost" onClick={clearFilters}>{t("clearFilters")}</button>}
            </div>
          )}

          <div className="xp-grid">
            {items.map(it => {
              const ratio = it.aspectRatio || (it.width && it.height ? it.width / it.height : 4 / 3);
              const video = it.mediaType === "VIDEO";
              return (
                <article key={it.id} className="xp-card" onMouseEnter={() => onEnter(it)} onMouseLeave={onLeave}>
                  <div className="xp-media" style={{ aspectRatio: String(ratio) }}
                    role="button" tabIndex={0} aria-label={`${t("openItem")}: ${it.title || ""}`}
                    onClick={e => { opener.current = e.currentTarget; setOpenId(it.id); }}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opener.current = e.currentTarget as HTMLElement; setOpenId(it.id); } }}>
                    {it.thumbnailUrl && (
                      <img src={it.thumbnailUrl} alt={it.title || ""} loading="lazy" decoding="async"
                        srcSet={it.srcset?.["640"] && it.srcset?.["1600"] ? `${it.srcset["640"]} 640w, ${it.srcset["1600"]} 1600w` : undefined}
                        sizes="(min-width: 1620px) 16vw, (min-width: 1280px) 20vw, (min-width: 980px) 25vw, (min-width: 640px) 33vw, 50vw" />
                    )}
                    {video && hoverId === it.id && it.previewIframeUrl && (
                      <iframe title={it.title || t("clip")} src={`${it.previewIframeUrl}?autoplay=true&muted=true&loop=true&controls=false`} allow="autoplay" tabIndex={-1} />
                    )}
                    {video && <span className="xp-badge"><i className="bi bi-play-fill" aria-hidden /> {clock(it.durationSeconds) || t("clip")}</span>}
                    <div className="xp-info">
                      <div><b>{it.title}</b><span>{it.creator.name}</span></div>
                      <span>{money(it.price.amount, it.price.currency)}</span>
                    </div>
                  </div>
                  <div style={{ position: "absolute", right: 8, top: 8, display: "flex", gap: 6 }}>
                    <button className="xp-icon-btn" aria-pressed={saves.includes(it.id)} aria-label={saves.includes(it.id) ? t("saved") : t("save")} onClick={() => toggleSave(it.id)}>
                      <i className={`bi ${saves.includes(it.id) ? "bi-heart-fill" : "bi-heart"}`} aria-hidden />
                    </button>
                    <button className="xp-icon-btn" aria-pressed={inCart(it.id)} aria-label={inCart(it.id) ? t("removeFromCart") : t("addToCart")} onClick={() => toggleCart(it)}>
                      <i className={`bi ${inCart(it.id) ? "bi-check-lg" : "bi-plus-lg"}`} aria-hidden />
                    </button>
                  </div>
                </article>
              );
            })}
            {loading && skeletons.map((h, i) => <div key={`s${i}`} className="xp-card xp-skel xp-media" style={{ height: h }} aria-hidden />)}
          </div>
          <div ref={sentinelRef} style={{ height: 1 }} />
          {!loading && !failed && done && items.length > 0 && <p className="xp-state" style={{ padding: 24 }}>{t("endOfList")}</p>}
        </div>

        <div className="xp-pill">
          <button className="xp-btn ghost" onClick={() => setOwnOpen(true)}><i className="bi bi-unlock" aria-hidden /> {t("alreadyBought")}</button>
          <button className="xp-btn" onClick={() => setDrawer(true)} aria-label={t("cart")}>
            <i className="bi bi-bag" aria-hidden /> {t("cart")}{cartCount > 0 ? ` (${cartCount})` : ""}
          </button>
        </div>

        {openItem && (
          <div className="xp-modal" role="dialog" aria-modal="true" aria-label={openItem.title || t("preview")} onClick={closeViewer}>
            <div className={`xp-sheet viewer`} onClick={e => e.stopPropagation()}>
              <Viewer item={openItem} t={t} onClose={closeViewer}
                onPrev={openIndex > 0 ? () => step(-1) : undefined} onNext={openIndex < items.length - 1 ? () => step(1) : undefined}
                inCart={inCart(openItem.id)} onCart={() => toggleCart(openItem)} onBuy={() => { if (!inCart(openItem.id)) toggleCart(openItem); setOpenId(null); setDrawer(true); }}
                saved={saves.includes(openItem.id)} onSave={() => toggleSave(openItem.id)} onTag={g => { setTag(g); closeViewer(); }} />
            </div>
          </div>
        )}

        {drawer && (
          <>
            <div className="xp-modal" style={{ justifyContent: "flex-end" }} onClick={() => setDrawer(false)} aria-hidden />
            <aside className="xp-drawer" role="dialog" aria-modal="true" aria-label={t("cart")}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>{t("cart")}</h2>
                <button className="xp-icon-btn" onClick={() => setDrawer(false)} aria-label={t("close")}><i className="bi bi-x-lg" aria-hidden /></button>
              </div>
              {removedNote > 0 && <p role="status" className="xp-licence">{t("unavailableRemoved", { n: removedNote })}</p>}
              {cart.length === 0 && <p className="xp-state">{t("cartEmpty")}</p>}
              {cart.map(c => {
                const line = quote?.lines.find(l => l.id === c.id);
                return (
                  <div className="xp-line" key={c.id}>
                    {c.thumbnailUrl && <img src={c.thumbnailUrl} alt="" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title || t("clip")}</div>
                      <div className="xp-meta">{c.mediaType === "VIDEO" ? t("clip") : t("photo")}{line ? ` · ${money(line.price, quote!.currency || currency)}` : ""}</div>
                    </div>
                    <button className="xp-icon-btn" style={{ color: "var(--xp-text)", borderColor: "var(--xp-line)" }} aria-label={t("removeFromCart")}
                      onClick={() => setCart(prev => { const next = prev.filter(x => x.id !== c.id); writeJson(CART_KEY, next); return next; })}>
                      <i className="bi bi-trash" aria-hidden />
                    </button>
                  </div>
                );
              })}
              {cart.length > 0 && (
                <>
                  <div className="xp-total"><span>{t("total")}</span><span>{quoteBusy || !quote ? "…" : money(quote.total, quote.currency || currency)}</span></div>
                  <label className="xp-meta" htmlFor="xp-email">{t("emailHint")}</label>
                  <input id="xp-email" className="xp-input" type="email" inputMode="email" autoComplete="email" value={email}
                    aria-invalid={emailError} onChange={e => { setEmail(e.target.value); setEmailError(false); }} placeholder="you@example.com" />
                  {emailError && <p role="alert" style={{ color: "var(--xp-pink-text)", margin: 0 }}>{t("emailInvalid")}</p>}
                  <button className="xp-btn" disabled={quoteBusy || !quote} onClick={() => void startCheckout()}>{t("continuePay")}</button>
                  <p className="xp-licence">{t("licenceLine")} <Link href="/explore/license">{t("viewLicence")}</Link></p>
                </>
              )}
            </aside>
          </>
        )}

        {showPay && payItems.length > 0 && (
          <XentriPayModal
            isOpen={showPay} onClose={() => setShowPay(false)} onSuccess={onPaid}
            paymentType="multi_album_purchase" amount={payAmount} currencyCode={payCurrency} currencyId={payCurrency}
            multiAlbumItems={payItems} viewerEmail={email} showDonationPrompt darkMode title="Connekyt Explore"
            subtitle={t("payingFor", { n: payItems.reduce((s, g) => s + g.photoIds.length, 0) })} />
        )}

        {refid && (
          <PurchaseSuccessModal refid={refid} email={email}
            items={bought.map(b => ({ imageId: b.id, fileUrl: b.thumbnailUrl || "" }))}
            onClose={() => { setRefid(null); setBought([]); }} />
        )}

        {ownOpen && (
          <div className="xp-modal" role="dialog" aria-modal="true" aria-label={t("alreadyBought")} onClick={() => setOwnOpen(false)}>
            <div className="xp-sheet" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
              <div className="xp-side">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <h2>{t("alreadyBought")}</h2>
                  <button className="xp-icon-btn" style={{ color: "var(--xp-text)", borderColor: "var(--xp-line)" }} onClick={() => setOwnOpen(false)} aria-label={t("close")}><i className="bi bi-x-lg" aria-hidden /></button>
                </div>
                {!unlocked && (
                  <>
                    <label className="xp-meta" htmlFor="xp-code">{t("codeHint")}</label>
                    <input id="xp-code" className="xp-input" value={code} onChange={e => { setCode(e.target.value); setOwnError(""); }} placeholder="ABCD1234" autoCapitalize="characters" />
                    <button className="xp-btn" disabled={ownBusy || code.trim().length < 4} onClick={() => void submitCode()}>{t("unlock")}</button>
                    <hr style={{ border: 0, borderTop: "1px solid var(--xp-line)", width: "100%" }} />
                    <h3 style={{ margin: 0 }}>{t("recoverTitle")}</h3>
                    <p className="xp-meta" style={{ margin: 0 }}>{t("recoverBody")}</p>
                    <input className="xp-input" type="email" value={recoverEmail} onChange={e => { setRecoverEmail(e.target.value); setOwnError(""); }} placeholder="you@example.com" aria-label="Email" />
                    <button className="xp-btn ghost" disabled={ownBusy} onClick={() => void submitRecover()}>{t("sendLink")}</button>
                    {recoverSent && <p role="status" className="xp-meta">{t("recoverSent")}</p>}
                    {ownError && <p role="alert" style={{ color: "var(--xp-pink-text)", margin: 0 }}>{ownError}</p>}
                  </>
                )}
                {unlocked && (
                  <>
                    <a className="xp-btn" style={{ textAlign: "center", textDecoration: "none", lineHeight: "44px" }} href={unlocked.zipUrl}>{t("zip")}</a>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                      {unlocked.items.map(u => (
                        <div key={u.id} className="xp-line" style={{ flexDirection: "column", alignItems: "stretch" }}>
                          {u.thumbnailUrl && <img src={u.thumbnailUrl} alt="" style={{ width: "100%", height: 110 }} />}
                          <span className="xp-meta">{u.title || (u.mediaType === "VIDEO" ? t("clip") : t("photo"))}</span>
                          <a className="xp-btn ghost" style={{ textAlign: "center", textDecoration: "none", lineHeight: "44px" }} href={u.viewUrl || u.downloadUrl} download>{t("download")}</a>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function Viewer({ item, t, onClose, onPrev, onNext, inCart, onCart, onBuy, saved, onSave, onTag }: {
  item: ExploreItem; t: ReturnType<typeof useTranslations>; onClose: () => void; onPrev?: () => void; onNext?: () => void;
  inCart: boolean; onCart: () => void; onBuy: () => void; saved: boolean; onSave: () => void; onTag: (tag: string) => void;
}) {
  const video = item.mediaType === "VIDEO";
  const [ended, setEnded] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    setEnded(false);
    if (!video) return;
    const h = setTimeout(() => setEnded(true), ((item.previewClipSeconds || 15) + 1) * 1000);
    return () => clearTimeout(h);
  }, [item.id, video, item.previewClipSeconds]);
  useEffect(() => { closeRef.current?.focus(); }, [item.id]);
  return (
    <>
      <div className="xp-stage">
        <button ref={closeRef} className="xp-icon-btn xp-close" onClick={onClose} aria-label={t("close")}><i className="bi bi-x-lg" aria-hidden /></button>
        {onPrev && <button className="xp-icon-btn xp-nav" style={{ left: 10 }} onClick={onPrev} aria-label={t("previous")}><i className="bi bi-chevron-left" aria-hidden /></button>}
        {onNext && <button className="xp-icon-btn xp-nav" style={{ right: 10 }} onClick={onNext} aria-label={t("next")}><i className="bi bi-chevron-right" aria-hidden /></button>}
        {video && item.previewIframeUrl ? (
          <iframe key={item.id} title={item.title || t("clip")} src={`${item.previewIframeUrl}?autoplay=true&muted=true&controls=true`} allow="autoplay; fullscreen" />
        ) : (
          item.previewUrl && <img src={item.previewUrl} alt={item.title || ""} srcSet={item.srcset?.["640"] && item.srcset?.["1600"] ? `${item.srcset["640"]} 640w, ${item.srcset["1600"]} 1600w` : undefined} sizes="(min-width: 860px) 60vw, 100vw" />
        )}
        {video && ended && (
          <div className="xp-end" role="status">
            <h3 style={{ margin: 0, fontSize: 22 }}>{t("previewEnds")}</h3>
            <p style={{ margin: 0, opacity: 0.85 }}>{t("buyFullHint", { s: item.durationSeconds ? clock(item.durationSeconds) : "" })}</p>
            <button className="xp-btn" onClick={onBuy}>{t("buyFull")}</button>
          </div>
        )}
      </div>
      <div className="xp-side">
        <h2>{item.title || (video ? t("clip") : t("photo"))}</h2>
        <div className="xp-meta">{t("by", { name: item.creator.name })}{item.categoryLabel ? ` · ${item.categoryLabel}` : ""}{video && item.durationSeconds ? ` · ${clock(item.durationSeconds)}` : ""}</div>
        <div className="xp-price-big">{money(item.price.amount, item.price.currency)}</div>
        {item.tags.length > 0 && <div className="xp-tags">{item.tags.map(g => <button key={g} className="xp-tag" onClick={() => onTag(g)}>#{g}</button>)}</div>}
        <button className="xp-btn" onClick={onBuy}>{video ? t("buyFull") : t("buyNow")}</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="xp-btn ghost" style={{ flex: 1 }} onClick={onCart}>{inCart ? t("removeFromCart") : t("addToCart")}</button>
          <button className="xp-btn ghost" onClick={onSave} aria-pressed={saved}><i className={`bi ${saved ? "bi-heart-fill" : "bi-heart"}`} aria-hidden /> {saved ? t("saved") : t("save")}</button>
          <button className="xp-btn ghost" aria-label={t("share")} onClick={() => { const url = `${window.location.origin}/explore?item=${item.id}`; if (navigator.share) void navigator.share({ title: item.title || "Connekyt", url }).catch(() => {}); else void navigator.clipboard?.writeText(url); }}><i className="bi bi-share" aria-hidden /></button>
        </div>
        <p className="xp-licence">{t("licenceLine")} <Link href="/explore/license">{t("viewLicence")}</Link></p>
      </div>
    </>
  );
}
