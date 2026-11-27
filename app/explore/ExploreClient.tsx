"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./explore.css";
import Navbar from "../components/navbar";
import XentriPayModal from "../components/XentriPayModal";
import PurchaseSuccessModal from "../components/PurchaseSuccessModal";
import type { MultiAlbumPurchaseItem } from "@/lib/APIs/payments/xentripay";
import {
  clock, fetchFacets, fetchFeed, fetchItem, fetchQuote, money, recoverByEmail, unlockByCode,
  type ExploreItem, type Facets, type FeedQuery, type Quote, type Unlocked,
} from "./exploreApi";
import { columnsFor, layoutColumns } from "./masonry";

const CURRENCIES = ["USD", "EUR", "GBP", "RWF", "KES"];
const PREVIEW_CCYS = ["USD", "RWF", "EUR", "KES", "UGX", "TZS"];
const CART_KEY = "connekyt:explore:cart:v1";
const SAVES_KEY = "connekyt:explore:saves:v1";
const GAP_DESKTOP = 16;
const GAP_PHONE = 10;
const CAPTION_PX = 36;

type CartSnap = { id: string; title: string | null; thumbnailUrl: string | null; mediaType: string };
type T = ReturnType<typeof useTranslations>;

function readJson<T>(key: string, fallback: T): T {
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function writeJson(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: the page still works */ }
}

const ratioOf = (it: ExploreItem) => Math.min(2.2, Math.max(0.5, it.aspectRatio || (it.width && it.height ? it.width / it.height : 4 / 3)));
const initialOf = (name: string) => (name.trim()[0] || "C").toUpperCase();

export default function ExploreClient({ initial = null, initialFacets = null }: { initial?: { items: ExploreItem[]; nextCursor: string | null } | null; initialFacets?: Facets | null }) {
  const t = useTranslations("explore");
  const rootRef = useRef<HTMLElement | null>(null);

  // ── layout: navbar height and column count ──────────────────────────
  const [ready, setReady] = useState(false);
  const [cols, setCols] = useState(4);
  const [colW, setColW] = useState(280);
  const [phone, setPhone] = useState(false);
  const [compact, setCompact] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    document.body.classList.add("xp-page");
    const measure = () => {
      const bar = Array.from(document.querySelectorAll<HTMLElement>(".fixed")).find(e => {
        const r = e.getBoundingClientRect();
        return r.top <= 1 && r.height > 30 && r.height < 140 && r.width >= window.innerWidth * 0.9;
      });
      if (bar && rootRef.current) {
        const hgt = `${Math.round(bar.getBoundingClientRect().height)}px`;
        if (window.scrollY < 4) rootRef.current.style.setProperty("--xp-nav", hgt);
        rootRef.current.style.setProperty("--xp-sticky", hgt);
      }
      const n = columnsFor(window.innerWidth);
      setCols(n);
      setPhone(window.innerWidth < 640);
      setCompact(window.innerWidth < 1100);
      const w = feedRef.current?.clientWidth || window.innerWidth - 24;
      const gap = window.innerWidth < 640 ? GAP_PHONE : GAP_DESKTOP;
      setColW(Math.max(80, (w - gap * (n - 1)) / n));
      setReady(true);
    };
    measure();
    const late = setTimeout(measure, 400);
    let raf = 0;
    let settle: ReturnType<typeof setTimeout> | null = null;
    // The header shrinks with a transition after the scroll, so measure again once it has settled.
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; measure(); });
      if (settle) clearTimeout(settle);
      settle = setTimeout(measure, 350);
    };
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(late); window.removeEventListener("resize", measure); window.removeEventListener("scroll", onScroll); document.body.classList.remove("xp-page"); };
  }, []);

  // ── filters ─────────────────────────────────────────────────────────
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"" | "PHOTO" | "VIDEO">("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<NonNullable<FeedQuery["sort"]>>("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number }>({ top: 120, right: 20 });
  useEffect(() => { const h = setTimeout(() => setQDebounced(q.trim()), 300); return () => clearTimeout(h); }, [q]);

  // ── feed ────────────────────────────────────────────────────────────
  const [items, setItems] = useState<ExploreItem[]>(initial?.items ?? []);
  const [cursor, setCursor] = useState<string | null>(initial?.nextCursor ?? null);
  const [loading, setLoading] = useState(!initial);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(initial ? !initial.nextCursor : false);
  const [facets, setFacets] = useState<Facets | null>(initialFacets);
  const firstRun = useRef(!!initial);
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

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; } // the server already sent this first page
    setItems([]); setCursor(null); setDone(false); void load(true, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);
  const facetsRun = useRef(!!initialFacets);
  useEffect(() => {
    if (facetsRun.current) { facetsRun.current = false; return; }
    fetchFacets(currency).then(setFacets).catch(() => setFacets(null));
  }, [currency]);

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

  // ── saved view ──────────────────────────────────────────────────────
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedItems, setSavedItems] = useState<ExploreItem[]>([]);
  const [savedBusy, setSavedBusy] = useState(false);
  useEffect(() => {
    if (!savedOnly) return;
    let live = true;
    setSavedBusy(true);
    Promise.all(saves.slice(0, 60).map(id => fetchItem(id, currency).catch(() => null)))
      .then(rows => { if (live) setSavedItems(rows.filter((r): r is ExploreItem => !!r)); })
      .finally(() => { if (live) setSavedBusy(false); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedOnly, currency, saves.length]);

  const list = savedOnly ? savedItems : items;
  const listLoading = savedOnly ? savedBusy : loading;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || savedOnly) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && !done && !failed && cursor) void load(false, cursor);
    }, { rootMargin: "700px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loading, done, failed, load, savedOnly]);

  // ── viewer ──────────────────────────────────────────────────────────
  const [openId, setOpenId] = useState<string | null>(null);
  const [extras, setExtras] = useState<ExploreItem[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openIndex = openId ? list.findIndex(i => i.id === openId) : -1;
  const openItem = openId ? (list.find(i => i.id === openId) || extras.find(i => i.id === openId) || null) : null;
  const step = useCallback((d: number) => { const n = list[openIndex + d]; if (n) setOpenId(n.id); }, [list, openIndex]);
  const openAny = (it: ExploreItem) => { setExtras(prev => (prev.some(p => p.id === it.id) ? prev : [...prev, it])); setOpenId(it.id); };
  const closeViewer = () => { setOpenId(null); opener.current?.focus(); };
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
  useEffect(() => {
    const lock = !!openItem || filtersOpen;
    if (!lock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [openItem, filtersOpen]);

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
      fetchItem(shared, "USD").then(it => { openAny(it); }).catch(() => { /* gone: show the feed */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const activeCount = (category ? 1 : 0) + (type ? 1 : 0) + (tag ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (sort !== "newest" ? 1 : 0) + (currency !== "USD" ? 1 : 0);
  const filtersActive = !!(qDebounced || activeCount);
  const resetFilters = () => { setCategory(""); setType(""); setTag(""); setMinPrice(""); setMaxPrice(""); setSort("newest"); setCurrency("USD"); };
  const clearFilters = () => { setQ(""); resetFilters(); };
  const cartCount = cart.length;
  const openFilters = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setAnchor({ top: Math.round(r.bottom + 8), right: Math.max(12, Math.round(window.innerWidth - r.right)) });
    setFiltersOpen(true);
  };
  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  // ── masonry ─────────────────────────────────────────────────────────
  const gap = phone ? GAP_PHONE : GAP_DESKTOP;
  const showSkeleton = listLoading && !failed;
  const skeletonCount = list.length === 0 ? cols * 3 : cols;
  const skeletonHeights = useMemo(() => Array.from({ length: skeletonCount }, (_, i) => Math.round(colW * (0.7 + ((i * 37) % 80) / 100))), [skeletonCount, colW]);
  const entries = useMemo(() => {
    const real = list.map(it => colW / ratioOf(it) + (phone ? CAPTION_PX : 0));
    return showSkeleton ? [...real, ...skeletonHeights] : real;
  }, [list, colW, phone, showSkeleton, skeletonHeights]);
  const columns = useMemo(() => layoutColumns(entries, cols, gap), [entries, cols, gap]);
  const sizes = `${Math.round(100 / cols)}vw`;

  const resultsLabel = `${list.length}${!savedOnly && !done ? "+" : ""}`;
  const emptyShown = !failed && !listLoading && list.length === 0;

  const renderTile = (it: ExploreItem, order: number) => {
    const video = it.mediaType === "VIDEO";
    const isSaved = saves.includes(it.id);
    return (
      <article key={it.id} className="xp-card" onMouseEnter={() => onEnter(it)} onMouseLeave={onLeave}>
        <div className="xp-media" style={{ aspectRatio: String(ratioOf(it)) }}
          role="button" tabIndex={0} aria-label={`${t("openItem")}: ${it.title || it.creator.name}`}
          onClick={e => { opener.current = e.currentTarget; setOpenId(it.id); }}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opener.current = e.currentTarget as HTMLElement; setOpenId(it.id); } }}>
          {it.thumbnailUrl && (
            <img src={it.thumbnailUrl} alt={it.title || ""} loading={order < 6 ? "eager" : "lazy"} fetchPriority={order < 2 ? "high" : undefined} decoding="async"
              srcSet={it.srcset?.["640"] && it.srcset?.["1600"] ? `${it.srcset["640"]} 640w, ${it.srcset["1600"]} 1600w` : undefined} sizes="(min-width: 1440px) 17vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" />
          )}
          {video && hoverId === it.id && it.previewIframeUrl && (
            <iframe title={it.title || t("clip")} src={`${it.previewIframeUrl}?autoplay=true&muted=true&loop=true&controls=false`} allow="autoplay" tabIndex={-1} />
          )}
          {video && <span className="xp-badge"><i className="bi bi-play-fill" aria-hidden /> {clock(it.durationSeconds) || t("clip")}</span>}
          <div className="xp-info">
            <div><b>{it.title || (video ? t("clip") : t("photo"))}</b><small>{it.creator.name}</small></div>
            <span className="xp-pricechip">{money(it.price.amount, it.price.currency)}</span>
          </div>
        </div>
        <div className="xp-tileacts">
          <button className="xp-round on-media" aria-pressed={isSaved} aria-label={isSaved ? t("saved") : t("save")} onClick={() => toggleSave(it.id)}>
            <i className={`bi ${isSaved ? "bi-heart-fill" : "bi-heart"}`} aria-hidden />
          </button>
          <button className="xp-round on-media cartbtn" aria-pressed={inCart(it.id)} aria-label={inCart(it.id) ? t("removeFromCart") : t("addToCart")} onClick={() => toggleCart(it)}>
            <i className={`bi ${inCart(it.id) ? "bi-check-lg" : "bi-plus-lg"}`} aria-hidden />
          </button>
        </div>
        <div className="xp-cap">
          <span><span className="xp-av" aria-hidden>{initialOf(it.creator.name)}</span>{it.creator.name}</span>
          <b>{money(it.price.amount, it.price.currency)}</b>
        </div>
      </article>
    );
  };

  const actions = (
    <>
      <button className="xp-pill" aria-pressed={savedOnly} onClick={() => setSavedOnly(v => !v)}><i className="bi bi-bookmark" aria-hidden /> {t("saved")}{saves.length > 0 ? ` · ${saves.length}` : ""}</button>
      <button className="xp-pill" onClick={() => setOwnOpen(true)}><i className="bi bi-key" aria-hidden /> {phone ? t("boughtShort") : t("alreadyBought")}</button>
      <button className="xp-pill primary" onClick={() => setDrawer(true)} aria-label={cartCount > 0 ? t("cartCount", { n: cartCount }) : t("cart")}>
        <i className="bi bi-bag" aria-hidden /> {cartCount > 0 ? t("cartCount", { n: cartCount }) : t("cart")}
      </button>
    </>
  );

  const searchBox = (id: string) => (
    <label className="xp-search" role="search">
      <i className="bi bi-search" aria-hidden />
      <span className="xp-sr">{t("searchPlaceholder")}</span>
      <input id={id} value={q} onChange={e => setQ(e.target.value)} placeholder={compact ? t("searchShort") : t("searchPlaceholder")} />
    </label>
  );

  return (
    <>
      <Navbar />
      <main className="xp" ref={rootRef}>
        <div className="xp-wrap xp-top">
          <div className="xp-head">
            <h1>{t("title")}</h1>
            <p>{phone ? t("subtitleShort") : t("subtitle2")}</p>
          </div>
          {!phone && searchBox("xp-q-desktop")}
          {!phone && <div className="xp-acts">{actions}</div>}
        </div>

        {phone && (
          <div className="xp-mbar">
            {searchBox("xp-q-phone")}
            <button className="xp-round" aria-label={activeCount ? t("filtersWith", { n: activeCount }) : t("filters")} onClick={openFilters}><i className="bi bi-sliders" aria-hidden /></button>
          </div>
        )}

        <div className="xp-stripwrap">
          <div className="xp-wrap xp-strip">
            <div className="xp-chips" role="group" aria-label={t("filters")}>
              <button className="xp-chip" aria-pressed={type === "" && !category && !tag} onClick={() => { setType(""); setCategory(""); setTag(""); setSavedOnly(false); }}>{t("all")}</button>
              <button className="xp-chip" aria-pressed={type === "PHOTO"} onClick={() => { setSavedOnly(false); setType(type === "PHOTO" ? "" : "PHOTO"); }}>{t("photos")}</button>
              <button className="xp-chip" aria-pressed={type === "VIDEO"} onClick={() => { setSavedOnly(false); setType(type === "VIDEO" ? "" : "VIDEO"); }}>
                {t("clips")}{facets && facets.clips > 0 && <small>{facets.clips}</small>}
              </button>
              {facets?.categories.map(c => (
                <button key={c.name} className="xp-chip" aria-pressed={category === c.name} onClick={() => { setSavedOnly(false); setCategory(category === c.name ? "" : c.name); }}>
                  {c.label}<small>{c.count}</small>
                </button>
              ))}
              {facets?.tags.slice(0, 8).map(g => (
                <button key={g.name} className="xp-chip" aria-pressed={tag === g.name} onClick={() => { setSavedOnly(false); setTag(tag === g.name ? "" : g.name); }}>#{g.name}</button>
              ))}
            </div>
            <button className="xp-btn fbtn" style={{ borderRadius: 999, minHeight: 40 }} aria-haspopup="dialog" aria-expanded={filtersOpen} onClick={openFilters}>
              <i className="bi bi-sliders" aria-hidden /> {activeCount ? t("filtersWith", { n: activeCount }) : t("filters")}
            </button>
          </div>
        </div>

        <div className={`xp-wrap xp-feed${ready ? "" : " xp-prep"}`} aria-live="polite">
          {failed && (
            <div className="xp-state" role="alert">
              <h2>{t("errorTitle")}</h2>
              <p>{t("errorBody")}</p>
              <button className="xp-btn xp-primary" onClick={() => void load(items.length === 0, cursor)}>{t("retry")}</button>
            </div>
          )}
          {emptyShown && (
            <div className="xp-state">
              <h2>{savedOnly ? t("saved") : t("emptyTitle")}</h2>
              <p>{savedOnly ? t("savedEmpty") : t("emptyBody")}</p>
              {savedOnly && <button className="xp-btn" onClick={() => setSavedOnly(false)}>{t("seeAll")}</button>}
              {!savedOnly && filtersActive && <button className="xp-btn" onClick={clearFilters}>{t("clearFilters")}</button>}
            </div>
          )}
          <div className="xp-masonry" ref={feedRef} style={{ gap }}>
            {columns.map((idxs, c) => (
              <div className="xp-col" key={c} style={{ gap }}>
                {idxs.map(i => (i < list.length
                  ? renderTile(list[i], i)
                  : <div key={`s${i}`} className="xp-skel" style={{ height: entries[i] }} aria-hidden />))}
              </div>
            ))}
          </div>
          <div ref={sentinelRef} style={{ height: 1 }} />
          {!listLoading && !failed && (savedOnly || done) && list.length > 0 && <p className="xp-end">{t("endOfList")}</p>}
        </div>

        {phone && <div className="xp-dock" role="group" aria-label={t("cart")}>{actions}</div>}

        {filtersOpen && (
          <>
            <div className="xp-fscrim" onClick={() => setFiltersOpen(false)} aria-hidden />
            <div className="xp-filters" role="dialog" aria-label={t("filters")} style={phone ? undefined : { top: anchor.top, right: anchor.right }}>
              <div className="xp-fhead">
                <h2>{t("filters")}</h2>
                <button className="xp-linkbtn" onClick={resetFilters}>{t("reset")}</button>
              </div>
              <div className="xp-fgroup">
                <div className="xp-flabel">{t("sortLabel")}</div>
                <div className="xp-fchips">
                  {([["newest", t("sortNewest")], ["popular", t("sortPopular")], ["price_asc", t("priceUpShort")], ["price_desc", t("priceDownShort")]] as const).map(([v, l]) => (
                    <button key={v} className="xp-chip" aria-pressed={sort === v} onClick={() => setSort(v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="xp-fgroup xp-ftype">
                <div className="xp-flabel">{t("type")}</div>
                <div className="xp-fchips">
                  <button className="xp-chip" aria-pressed={type === ""} onClick={() => setType("")}>{t("all")}</button>
                  <button className="xp-chip" aria-pressed={type === "PHOTO"} onClick={() => setType("PHOTO")}>{t("photos")}</button>
                  <button className="xp-chip" aria-pressed={type === "VIDEO"} onClick={() => setType("VIDEO")}>{t("clips")}</button>
                </div>
              </div>
              <div className="xp-fgroup">
                <div className="xp-flabel">{t("priceLabel")}</div>
                <div className="xp-prices">
                  <label className="xp-pin"><span>{currency}</span><input inputMode="decimal" aria-label={t("minPrice")} placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value.replace(/[^\d.]/g, ""))} /></label>
                  <label className="xp-pin"><span>{currency}</span><input inputMode="decimal" aria-label={t("maxPrice")} placeholder={facets?.maxPrice ? String(Math.round(facets.maxPrice)) : "50"} value={maxPrice} onChange={e => setMaxPrice(e.target.value.replace(/[^\d.]/g, ""))} /></label>
                </div>
              </div>
              <div className="xp-fgroup">
                <div className="xp-flabel">{t("currency")}</div>
                <div className="xp-fchips">
                  {CURRENCIES.map(c => <button key={c} className="xp-chip" aria-pressed={currency === c} onClick={() => setCurrency(c)}>{c}</button>)}
                </div>
              </div>
              <div className="xp-ffoot">
                <button className="xp-btn" onClick={resetFilters}>{t("reset")}</button>
                <button className="xp-btn xp-primary" onClick={() => setFiltersOpen(false)}>{t("showResults", { n: resultsLabel })}</button>
              </div>
            </div>
          </>
        )}

        {openItem && (
          <div className="xp-modal" role="dialog" aria-modal="true" aria-label={openItem.title || t("preview")} onClick={closeViewer}>
            <div className="xp-sheet viewer" onClick={e => e.stopPropagation()}>
              <Viewer item={openItem} t={t} currency={currency} onClose={closeViewer}
                onPrev={openIndex > 0 ? () => step(-1) : undefined} onNext={openIndex >= 0 && openIndex < list.length - 1 ? () => step(1) : undefined}
                inCart={inCart(openItem.id)} onCart={() => toggleCart(openItem)} onBuy={() => { if (!inCart(openItem.id)) toggleCart(openItem); setOpenId(null); setDrawer(true); }}
                saved={saves.includes(openItem.id)} onSave={() => toggleSave(openItem.id)}
                onOpen={openAny} onMore={cat => { setSavedOnly(false); setCategory(cat); closeViewer(); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
            </div>
          </div>
        )}

        {drawer && (
          <>
            <div className="xp-modal" style={{ justifyContent: "flex-end" }} onClick={() => setDrawer(false)} aria-hidden />
            <aside className="xp-drawer" role="dialog" aria-modal="true" aria-label={t("cart")}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>{t("cart")}</h2>
                <button className="xp-round" onClick={() => setDrawer(false)} aria-label={t("close")}><i className="bi bi-x-lg" aria-hidden /></button>
              </div>
              {removedNote > 0 && <p role="status" className="xp-licence">{t("unavailableRemoved", { n: removedNote })}</p>}
              {cart.length === 0 && <p className="xp-state">{t("cartEmpty")}</p>}
              {cart.map(c => {
                const line = quote?.lines.find(l => l.id === c.id);
                return (
                  <div className="xp-line" key={c.id}>
                    {c.thumbnailUrl && <img src={c.thumbnailUrl} alt="" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title || t("clip")}</div>
                      <div className="xp-meta">{c.mediaType === "VIDEO" ? t("clip") : t("photo")}{line ? ` · ${money(line.price, quote!.currency || currency)}` : ""}</div>
                    </div>
                    <button className="xp-round" aria-label={t("removeFromCart")}
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
                  {emailError && <p role="alert" className="xp-err">{t("emailInvalid")}</p>}
                  <button className="xp-btn xp-primary" disabled={quoteBusy || !quote} onClick={() => void startCheckout()}>{t("continuePay")}</button>
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
          <div className="xp-modal dlg" role="dialog" aria-modal="true" aria-label={t("alreadyBought")} onClick={() => setOwnOpen(false)}>
            <div className="xp-sheet dialog" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>{t("alreadyBought")}</h2>
                <button className="xp-round" onClick={() => setOwnOpen(false)} aria-label={t("close")}><i className="bi bi-x-lg" aria-hidden /></button>
              </div>
              {!unlocked && (
                <>
                  <label className="xp-meta" htmlFor="xp-code">{t("codeHint")}</label>
                  <input id="xp-code" className="xp-input" value={code} onChange={e => { setCode(e.target.value); setOwnError(""); }} placeholder="ABCD1234" autoCapitalize="characters" />
                  <button className="xp-btn xp-primary" disabled={ownBusy || code.trim().length < 4} onClick={() => void submitCode()}>{t("unlock")}</button>
                  <hr style={{ border: 0, borderTop: "1px solid var(--xp-line)", width: "100%" }} />
                  <h3 style={{ margin: 0, fontSize: 18 }}>{t("recoverTitle")}</h3>
                  <p className="xp-meta" style={{ margin: 0 }}>{t("recoverBody")}</p>
                  <input className="xp-input" type="email" value={recoverEmail} onChange={e => { setRecoverEmail(e.target.value); setOwnError(""); }} placeholder="you@example.com" aria-label="Email" />
                  <button className="xp-btn" disabled={ownBusy} onClick={() => void submitRecover()}>{t("sendLink")}</button>
                  {recoverSent && <p role="status" className="xp-meta">{t("recoverSent")}</p>}
                  {ownError && <p role="alert" className="xp-err">{ownError}</p>}
                </>
              )}
              {unlocked && (
                <>
                  <a className="xp-btn xp-primary" href={unlocked.zipUrl}>{t("zip")}</a>
                  <div className="xp-grid2">
                    {unlocked.items.map(u => (
                      <div key={u.id} className="xp-line" style={{ flexDirection: "column", alignItems: "stretch" }}>
                        {u.thumbnailUrl && <img src={u.thumbnailUrl} alt="" style={{ width: "100%", height: 110 }} />}
                        <span className="xp-meta">{u.title || (u.mediaType === "VIDEO" ? t("clip") : t("photo"))}</span>
                        <a className="xp-btn" href={u.viewUrl || u.downloadUrl} download>{t("download")}</a>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function Viewer({ item, t, currency, onClose, onPrev, onNext, inCart, onCart, onBuy, saved, onSave, onOpen, onMore }: {
  item: ExploreItem; t: T; currency: string; onClose: () => void; onPrev?: () => void; onNext?: () => void;
  inCart: boolean; onCart: () => void; onBuy: () => void; saved: boolean; onSave: () => void;
  onOpen: (it: ExploreItem) => void; onMore: (category: string) => void;
}) {
  const video = item.mediaType === "VIDEO";
  const [ended, setEnded] = useState(false);
  const [local, setLocal] = useState<string>("");
  const [more, setMore] = useState<ExploreItem[]>([]);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const share = () => {
    const url = `${window.location.origin}/explore?item=${item.id}`;
    if (navigator.share) void navigator.share({ title: item.title || "Connekyt", url }).catch(() => { /* cancelled */ });
    else void navigator.clipboard?.writeText(url).catch(() => { /* blocked */ });
  };
  useEffect(() => {
    setEnded(false);
    if (!video) return;
    const h = setTimeout(() => setEnded(true), ((item.previewClipSeconds || 15) + 1) * 1000);
    return () => clearTimeout(h);
  }, [item.id, video, item.previewClipSeconds]);
  useEffect(() => { closeRef.current?.focus(); }, [item.id]);
  // The same price in a second currency, so "USD 5.00" reads with "≈ RWF 6,500".
  useEffect(() => {
    let live = true;
    const alt = item.price.currency === "RWF" ? "USD" : "RWF";
    setLocal("");
    fetchItem(item.id, alt).then(o => { if (live && o.price.amount != null) setLocal(money(o.price.amount, o.price.currency)); }).catch(() => { /* optional line */ });
    return () => { live = false; };
  }, [item.id, item.price.currency]);
  useEffect(() => {
    let live = true;
    setMore([]);
    fetchFeed({ category: item.category || "", currency, size: 12 })
      .then(p => { if (live) setMore(p.items.filter(i => i.id !== item.id).slice(0, 3)); }).catch(() => { /* optional row */ });
    return () => { live = false; };
  }, [item.id, item.category, currency]);

  return (
    <>
      <div className="xp-stage">
        <div className="xp-mtop">
          <button className="xp-round on-media" onClick={onClose} aria-label={t("close")}><i className="bi bi-chevron-left" aria-hidden /></button>
          <div>
            <button className="xp-round on-media" onClick={share} aria-label={t("share")}><i className="bi bi-share" aria-hidden /></button>
            <button className="xp-round on-media" onClick={onSave} aria-pressed={saved} aria-label={saved ? t("saved") : t("save")}><i className={`bi ${saved ? "bi-heart-fill" : "bi-heart"}`} aria-hidden /></button>
          </div>
        </div>
        {onPrev && <button className="xp-round xp-stagenav prev" onClick={onPrev} aria-label={t("previous")}><i className="bi bi-chevron-left" aria-hidden /></button>}
        {onNext && <button className="xp-round xp-stagenav next" onClick={onNext} aria-label={t("next")}><i className="bi bi-chevron-right" aria-hidden /></button>}
        {video && item.previewIframeUrl ? (
          <iframe key={item.id} title={item.title || t("clip")} src={`${item.previewIframeUrl}?autoplay=true&muted=true&controls=true`} allow="autoplay; fullscreen" />
        ) : (
          item.previewUrl && <img src={item.previewUrl} alt={item.title || ""} srcSet={item.srcset?.["640"] && item.srcset?.["1600"] ? `${item.srcset["640"]} 640w, ${item.srcset["1600"]} 1600w` : undefined} sizes="(min-width: 860px) 60vw, 100vw" />
        )}
        {video && ended && (
          <div className="xp-endcard" role="status">
            <h3>{t("previewEnds")}</h3>
            <p>{t("buyFullHint", { s: item.durationSeconds ? clock(item.durationSeconds) : "" })}</p>
            <button className="xp-btn xp-primary" onClick={onBuy}>{t("buyFull")}</button>
          </div>
        )}
      </div>
      <button ref={closeRef} className="xp-round xp-close" onClick={onClose} aria-label={t("close")}><i className="bi bi-x-lg" aria-hidden /></button>
      <div className="xp-side">
        <div className="xp-who">
          <span className="xp-av" aria-hidden>{item.creator.logo ? <img src={item.creator.logo} alt="" /> : initialOf(item.creator.name)}</span>
          <div><b>{item.creator.name}</b><small>{item.categoryLabel || (video ? t("clip") : t("photo"))}</small></div>
          <Link className="xp-btn" style={{ minHeight: 38, borderRadius: 999 }} href={`/user/photographers/view-profile?id=${encodeURIComponent(item.creator.id)}`}>{t("viewProfile")}</Link>
        </div>
        <h2>{item.title || (video ? t("clip") : t("photo"))}</h2>
        <div className="xp-meta">
          {video && item.durationSeconds ? `${clock(item.durationSeconds)} · ` : ""}
          {item.width && item.height ? t("dims", { w: item.width, h: item.height }) : (video ? t("clip") : t("photo"))}
        </div>
        <div className="xp-price"><b>{money(item.price.amount, item.price.currency)}</b>{local && <span>{t("approx", { amount: local })}</span>}</div>
        <button className="xp-btn xp-primary xp-buy" onClick={onBuy}>{video ? t("buyFull") : t("buyNow")}</button>
        <div className="xp-sidebtns">
          <button className="xp-btn" onClick={onCart}><i className={`bi ${inCart ? "bi-bag-check" : "bi-bag-plus"}`} aria-hidden /> {inCart ? t("removeFromCart") : t("addToCart")}</button>
          <button className="xp-round desk" onClick={onSave} aria-pressed={saved} aria-label={saved ? t("saved") : t("save")}><i className={`bi ${saved ? "bi-heart-fill" : "bi-heart"}`} aria-hidden /></button>
          <button className="xp-round desk" aria-label={t("share")} onClick={share}><i className="bi bi-share" aria-hidden /></button>
        </div>
        <p className="xp-licence">{t("licenceLine")} <Link href="/explore/license">{t("viewLicence")}</Link></p>
        {more.length > 0 && (
          <div className="xp-more">
            <h3>{t("moreLikeThis")}</h3>
            <div className="xp-morerow">
              {more.map(m => (
                <button key={m.id} onClick={() => onOpen(m)} aria-label={m.title || m.creator.name}>{m.thumbnailUrl && <img src={m.thumbnailUrl} alt="" loading="lazy" />}</button>
              ))}
            </div>
            {item.category && <button className="xp-linkbtn" onClick={() => onMore(item.category as string)}>{t("seeAll")}</button>}
          </div>
        )}
      </div>
    </>
  );
}
