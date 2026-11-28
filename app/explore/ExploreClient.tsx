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
import { cardTitles, normalizeItem, shortAlbum } from "./exploreTitles";
import ExploreViewer from "./ExploreViewer";

const CURRENCIES = ["USD", "EUR", "GBP", "RWF", "KES"];
const PREVIEW_CCYS = ["USD", "RWF", "EUR", "KES", "UGX", "TZS"];
const CART_KEY = "connekyt:explore:cart:v1";
const SAVES_KEY = "connekyt:explore:saves:v1";
const GAP_DESKTOP = 14;
const GAP_PHONE = 10;
const CAPTION_PHONE = 62; // phone tile caption: title, creator and price (fixed so the masonry can be computed)

type CartSnap = { id: string; title: string | null; thumbnailUrl: string | null; mediaType: string };
type T = ReturnType<typeof useTranslations>;
type Sort = NonNullable<FeedQuery["sort"]>;
type Orient = "" | "landscape" | "portrait" | "square";

/** Everything the viewer can choose. All of it lives in the URL query, so a result can be shared and Back works. */
interface F {
  q: string; type: "" | "PHOTO" | "VIDEO"; category: string; tag: string; sort: Sort; min: string; max: string; cur: string;
  orient: Orient; creator: string; album: string; view: "" | "collections"; saved: boolean;
}
const DEFAULTS: F = { q: "", type: "", category: "", tag: "", sort: "newest", min: "", max: "", cur: "USD", orient: "", creator: "", album: "", view: "", saved: false };

function parseQuery(search: string): F {
  const p = new URLSearchParams(search);
  const pick = <K extends keyof F>(k: K, key: string, ok?: (v: string) => boolean): F[K] => {
    const v = p.get(key);
    return (v && (!ok || ok(v)) ? v : DEFAULTS[k]) as F[K];
  };
  return {
    q: pick("q", "q"), type: pick("type", "type", v => v === "PHOTO" || v === "VIDEO"), category: pick("category", "category"), tag: pick("tag", "tag"),
    sort: pick("sort", "sort", v => ["newest", "popular", "price_asc", "price_desc"].includes(v)), min: pick("min", "min", v => /^[\d.]+$/.test(v)),
    max: pick("max", "max", v => /^[\d.]+$/.test(v)), cur: pick("cur", "cur", v => CURRENCIES.includes(v)),
    orient: pick("orient", "orient", v => ["landscape", "portrait", "square"].includes(v)), creator: pick("creator", "creator"), album: pick("album", "album"),
    view: pick("view", "view", v => v === "collections"), saved: p.get("saved") === "1",
  };
}
function toQuery(f: F): string {
  const p = new URLSearchParams();
  (Object.keys(DEFAULTS) as (keyof F)[]).forEach(k => {
    const v = f[k];
    if (v === DEFAULTS[k] || v === "" || v === false) return;
    p.set(k, v === true ? "1" : String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

function readJson<V>(key: string, fallback: V): V {
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as V) : fallback; } catch { return fallback; }
}
function writeJson(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: the page still works */ }
}

const ratioOf = (it: ExploreItem) => Math.min(2.2, Math.max(0.5, it.aspectRatio || (it.width && it.height ? it.width / it.height : 4 / 3)));
const initialOf = (name: string) => (name.trim()[0] || "C").toUpperCase();
const orientOf = (it: ExploreItem): Orient => { const r = ratioOf(it); return r > 1.15 ? "landscape" : r < 0.87 ? "portrait" : "square"; };
const SIZES = "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";
const srcsetOf = (it: ExploreItem) => (it.srcset?.["640"] && it.srcset?.["1600"] ? `${it.srcset["640"]} 640w, ${it.srcset["1600"]} 1600w` : undefined);

export default function ExploreClient({ initial = null, initialFacets = null, initialItemId = null }: {
  initial?: { items: ExploreItem[]; nextCursor: string | null } | null; initialFacets?: Facets | null; initialItemId?: string | null;
}) {
  const t = useTranslations("explore");
  const rootRef = useRef<HTMLElement | null>(null);

  // ── layout: navbar height and column count ──────────────────────────
  const [ready, setReady] = useState(false);
  const [cols, setCols] = useState(4);
  const [colW, setColW] = useState(280);
  const [phone, setPhone] = useState(false);
  const [stuck, setStuck] = useState(false); // phone: the hero has scrolled away, so only the slim search bar stays
  const feedRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
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
      const w = feedRef.current?.clientWidth || window.innerWidth - 24;
      const gap = window.innerWidth < 640 ? GAP_PHONE : GAP_DESKTOP;
      setColW(Math.max(80, (w - gap * (n - 1)) / n));
      const hero = heroRef.current;
      setStuck(!!hero && hero.getBoundingClientRect().bottom < ((bar?.getBoundingClientRect().height) || 64) + 4);
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

  // ── filters, kept in the URL ────────────────────────────────────────
  const [f, setF] = useState<F>(DEFAULTS);
  const [qLive, setQLive] = useState("");
  const [urlReady, setUrlReady] = useState(false);
  const fRef = useRef(f);
  fRef.current = f;
  const basePath = useRef("/explore");
  const patch = useCallback((p: Partial<F>) => setF(prev => ({ ...prev, ...p })), []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<F>(DEFAULTS);
  const [sortOpen, setSortOpen] = useState(false);
  const [showAllCreators, setShowAllCreators] = useState(false);

  // ── feed ────────────────────────────────────────────────────────────
  const [items, setItems] = useState<ExploreItem[]>(() => (initial?.items ?? []).map(normalizeItem));
  const [cursor, setCursor] = useState<string | null>(initial?.nextCursor ?? null);
  const [loading, setLoading] = useState(!initial);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(initial ? !initial.nextCursor : false);
  const [facets, setFacets] = useState<Facets | null>(initialFacets);
  const skipFirst = useRef(!!initial);
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const heroItems = useRef<ExploreItem[]>((initial?.items ?? []).map(normalizeItem));
  const queryKey = [f.q, f.category, f.type, f.tag, f.sort, f.min, f.max, f.cur].join("|");

  const baseQuery = useCallback((): FeedQuery => ({
    q: f.q, category: f.category, type: f.type, tag: f.tag, sort: f.sort, minPrice: f.min, maxPrice: f.max, currency: f.cur,
  }), [f.q, f.category, f.type, f.tag, f.sort, f.min, f.max, f.cur]);

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

  // The search box is debounced into the filters; everything else applies at once.
  useEffect(() => { const h = setTimeout(() => { if (qLive.trim() !== fRef.current.q) patch({ q: qLive.trim() }); }, 300); return () => clearTimeout(h); }, [qLive, patch]);

  useEffect(() => {
    if (!urlReady) return;
    if (skipFirst.current) { skipFirst.current = false; return; } // the server already sent this first page
    setItems([]); setCursor(null); setDone(false); void load(true, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, urlReady]);
  const facetsRun = useRef(!!initialFacets);
  useEffect(() => {
    if (facetsRun.current) { facetsRun.current = false; return; }
    fetchFacets(f.cur).then(setFacets).catch(() => setFacets(null));
  }, [f.cur]);

  // ── URL <-> state ───────────────────────────────────────────────────
  const [openId, setOpenId] = useState<string | null>(null);
  const [extras, setExtras] = useState<ExploreItem[]>([]);
  const pushedViewer = useRef(false);
  useEffect(() => {
    const m = /^(.*\/explore)(?:\/([^/]+))?\/?$/.exec(window.location.pathname);
    basePath.current = m ? m[1] : "/explore";
    const parsed = parseQuery(window.location.search);
    // `?item=` is the older share link; it opens the same viewer.
    const shared = initialItemId || new URLSearchParams(window.location.search).get("item");
    if (parsed.q) setQLive(parsed.q);
    const dflt = toQuery(parsed) === "";
    if (!dflt) { skipFirst.current = false; setF(parsed); }
    if (shared) fetchItem(shared, parsed.cur).then(it => { setExtras(prev => [...prev, it]); setOpenId(it.id); }).catch(() => { /* gone: show the feed */ });
    const params = new URLSearchParams(window.location.search);
    if (params.get("recover") === "1") setOwnOpen(true);
    setUrlReady(true);
    const onPop = () => {
      setF(parseQuery(window.location.search));
      const mm = /^.*\/explore\/([^/]+)\/?$/.exec(window.location.pathname);
      setOpenId(mm && mm[1] !== "license" ? mm[1] : null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const prevQuery = useRef("");
  useEffect(() => {
    if (!urlReady) return;
    const next = toQuery(f);
    if (next === window.location.search || next === prevQuery.current) { prevQuery.current = next; return; }
    const onlyQ = toQuery({ ...f, q: "" }) === toQuery({ ...parseQuery(prevQuery.current), q: "" });
    prevQuery.current = next;
    const path = window.location.pathname;
    (onlyQ ? window.history.replaceState : window.history.pushState).call(window.history, { xp: 1 }, "", `${path}${next}`);
  }, [f, urlReady]);

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
  const [savedItems, setSavedItems] = useState<ExploreItem[]>([]);
  const [savedBusy, setSavedBusy] = useState(false);
  useEffect(() => {
    if (!f.saved) return;
    let live = true;
    setSavedBusy(true);
    Promise.all(saves.slice(0, 60).map(id => fetchItem(id, f.cur).catch(() => null)))
      .then(rows => { if (live) setSavedItems(rows.filter((r): r is ExploreItem => !!r)); })
      .finally(() => { if (live) setSavedBusy(false); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.saved, f.cur, saves.length]);

  // The part of the filters the feed API does not do is applied here, to what is loaded.
  const base = f.saved ? savedItems : items;
  const list = useMemo(() => base.filter(it => (!f.orient || orientOf(it) === f.orient) && (!f.creator || it.creator.id === f.creator) && (!f.album || it.album?.id === f.album || it.albumId === f.album)), [base, f.orient, f.creator, f.album]);
  const listLoading = f.saved ? savedBusy : loading;
  const localFilters = !!(f.orient || f.creator || f.album);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || f.saved) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && !done && !failed && cursor) void load(false, cursor);
    }, { rootMargin: "700px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loading, done, failed, load, f.saved, list.length]);

  // ── viewer ──────────────────────────────────────────────────────────
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const openIndex = openId ? list.findIndex(i => i.id === openId) : -1;
  const openItem = openId ? (list.find(i => i.id === openId) || extras.find(i => i.id === openId) || null) : null;
  const showItem = useCallback((id: string, replace: boolean) => {
    setOpenId(id);
    const url = `${basePath.current}/${id}${window.location.search}`;
    if (replace || !pushedViewer.current && window.location.pathname.replace(/\/$/, "") !== basePath.current) window.history.replaceState({ xp: 1 }, "", url);
    else window.history.pushState({ xp: 1 }, "", url);
    pushedViewer.current = true;
  }, []);
  const step = useCallback((d: number) => { const n = list[openIndex + d]; if (n) showItem(n.id, true); }, [list, openIndex, showItem]);
  const openAny = (it: ExploreItem) => { setExtras(prev => (prev.some(p => p.id === it.id) ? prev : [...prev, it])); showItem(it.id, true); };
  const closeViewer = useCallback(() => {
    setOpenId(null);
    if (window.history.state?.xp && pushedViewer.current && window.location.pathname.replace(/\/$/, "") !== basePath.current) window.history.back();
    else window.history.replaceState({ xp: 1 }, "", `${basePath.current}${window.location.search}`);
    pushedViewer.current = false;
    opener.current?.focus();
  }, []);
  useEffect(() => {
    if (!openItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab" && sheetRef.current) {
        // keep Tab inside the viewer
        const nodes = Array.from(sheetRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), iframe, input, [tabindex]:not([tabindex='-1'])")).filter(n => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openItem, step, closeViewer]);
  const locked = !!openItem || filtersOpen;
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [locked]);

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
    fetchQuote(cart.map(c => c.id), f.cur).then(qt => {
      if (!live) return;
      setQuote(qt);
      if (qt.unavailable.length) {
        setRemovedNote(qt.unavailable.length);
        setCart(prev => { const next = prev.filter(c => !qt.unavailable.includes(c.id)); writeJson(CART_KEY, next); return next; });
      }
    }).catch(() => { if (live) setQuote(null); }).finally(() => { if (live) setQuoteBusy(false); });
    return () => { live = false; };
  }, [drawer, cart.length, f.cur]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── what is shown ───────────────────────────────────────────────────
  const activeCount = (f.category ? 1 : 0) + (f.type ? 1 : 0) + (f.tag ? 1 : 0) + (f.min || f.max ? 1 : 0) + (f.cur !== "USD" ? 1 : 0) + (f.orient ? 1 : 0) + (f.creator ? 1 : 0) + (f.sort !== "newest" ? 1 : 0);
  const filtersActive = !!(f.q || activeCount || f.album);
  const clearFilters = () => { setQLive(""); setF(DEFAULTS); };
  const cartCount = cart.length;
  const openFilters = () => { setDraft(f); setFiltersOpen(true); };
  const labelFor = useCallback((it: ExploreItem) => (it.mediaType === "VIDEO" ? t("clip") : t("photo")), [t]);
  const titles = useMemo(() => cardTitles(list, labelFor), [list, labelFor]);
  const titleOf = (it: ExploreItem) => titles.get(it.id) || it.title || labelFor(it);

  useEffect(() => {
    if (!filtersOpen && !sortOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setFiltersOpen(false); setSortOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen, sortOpen]);

  // Featured creators and collections come from what is loaded.
  const creators = useMemo(() => {
    const by = new Map<string, ExploreItem[]>();
    for (const it of items) by.set(it.creator.id, [...(by.get(it.creator.id) ?? []), it]);
    return [...by.entries()].map(([id, rows]) => ({ id, name: rows[0].creator.name, logo: rows[0].creator.logo, rows })).sort((a, b) => b.rows.length - a.rows.length);
  }, [items]);
  const albums = useMemo(() => {
    const by = new Map<string, ExploreItem[]>();
    for (const it of items) { const k = it.album?.id || it.albumId; by.set(k, [...(by.get(k) ?? []), it]); }
    return [...by.entries()].map(([id, rows]) => {
      const prices = rows.map(r => r.price.amount).filter((x): x is number => x != null);
      return { id, title: shortAlbum(rows[0].album?.title || rows[0].title), rows, count: rows[0].album?.count ?? rows.length, creator: rows[0].creator.name, ccy: rows[0].price.currency, lo: prices.length ? Math.min(...prices) : null, hi: prices.length ? Math.max(...prices) : null };
    });
  }, [items]);
  const albumName = f.album ? (albums.find(a => a.id === f.album)?.title || "") : "";

  // ── masonry ─────────────────────────────────────────────────────────
  const gap = phone ? GAP_PHONE : GAP_DESKTOP;
  const showSkeleton = listLoading && !failed && f.view === "";
  const skeletonCount = list.length === 0 ? cols * 3 : cols;
  const skeletonHeights = useMemo(() => Array.from({ length: skeletonCount }, (_, i) => Math.round(colW * (0.7 + ((i * 37) % 80) / 100))), [skeletonCount, colW]);
  const entries = useMemo(() => {
    const real = list.map(it => colW / ratioOf(it) + (phone ? CAPTION_PHONE : 0));
    return showSkeleton ? [...real, ...skeletonHeights] : real;
  }, [list, colW, phone, showSkeleton, skeletonHeights]);
  const columns = useMemo(() => layoutColumns(entries, cols, gap), [entries, cols, gap]);

  const found = (() => {
    if (f.saved) return list.length;
    const plain = !f.q && !f.tag && !f.min && !f.max && !localFilters;
    if (plain && facets) {
      const cat = f.category ? facets.categories.find(c => c.name === f.category) : null;
      if (!f.category) return f.type === "VIDEO" ? facets.clips : f.type === "PHOTO" ? facets.total - facets.clips : facets.total;
      if (cat) return f.type === "VIDEO" ? cat.clips : f.type === "PHOTO" ? cat.count - cat.clips : cat.count;
    }
    return done ? list.length : null;
  })();
  const emptyShown = !failed && !listLoading && list.length === 0 && f.view === "";

  // the hero picture: the first landscape item of the first page, else the first item
  const hero = useMemo(() => heroItems.current.find(i => i.previewUrl && (i.aspectRatio || 1) >= 1.2 && i.mediaType === "PHOTO") || heroItems.current.find(i => i.previewUrl) || null, []);
  const trending = (facets?.tags.slice(0, 4).map(g => ({ key: g.name, label: g.name, tag: g.name })) ?? []);
  const trendingShown = trending.length ? trending : (facets?.categories.slice(0, 4).map(c => ({ key: c.name, label: c.label, tag: "", category: c.name })) ?? []);

  const sorts: [Sort, string][] = [["newest", t("sortNewest")], ["popular", t("sortPopular")], ["price_asc", t("sortPriceAsc")], ["price_desc", t("sortPriceDesc")]];
  const sortLabel = sorts.find(s => s[0] === f.sort)?.[1] || t("sortNewest");
  const goGallery = () => feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const openTile = (e: { currentTarget: HTMLElement }, it: ExploreItem) => { opener.current = e.currentTarget; showItem(it.id, false); };

  const renderTile = (it: ExploreItem, order: number) => {
    const video = it.mediaType === "VIDEO";
    const isSaved = saves.includes(it.id);
    const title = titleOf(it);
    return (
      <article key={it.id} className="xp-card" onMouseEnter={() => onEnter(it)} onMouseLeave={onLeave}>
        <div className="xp-media xp-wm" style={{ aspectRatio: String(ratioOf(it)) }}
          role="button" tabIndex={0} aria-label={`${t("openItem")}: ${title}, ${it.creator.name}`}
          onClick={e => openTile(e, it)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTile(e, it); } }}>
          {it.thumbnailUrl && (
            <img src={it.thumbnailUrl} alt="" width={640} height={Math.round(640 / ratioOf(it))} loading={order < 6 ? "eager" : "lazy"} fetchPriority={order < 2 ? "high" : undefined} decoding="async"
              srcSet={srcsetOf(it)} sizes={SIZES} />
          )}
          {video && hoverId === it.id && it.previewIframeUrl && (
            <iframe title={title} src={`${it.previewIframeUrl}?autoplay=true&muted=true&loop=true&controls=false`} allow="autoplay" tabIndex={-1} />
          )}
          {video && <span className="xp-badge"><i className="bi bi-play-fill" aria-hidden /> {clock(it.durationSeconds) || t("clip")}</span>}
          <div className="xp-ov" aria-hidden>
            <b>{title}</b>
            <span><span className="xp-ovn">{it.creator.name}</span><span className="xp-ovp">{money(it.price.amount, it.price.currency)}</span></span>
          </div>
        </div>
        <div className="xp-tileacts">
          <button className="xp-round on-media cartbtn" aria-pressed={inCart(it.id)} aria-label={inCart(it.id) ? t("removeFromCart") : t("addToCart")} onClick={() => toggleCart(it)}>
            <i className={`bi ${inCart(it.id) ? "bi-check-lg" : "bi-bag-plus"}`} aria-hidden />
          </button>
          <button className="xp-round on-media" aria-pressed={isSaved} aria-label={isSaved ? t("saved") : t("save")} onClick={() => toggleSave(it.id)}>
            <i className={`bi ${isSaved ? "bi-heart-fill" : "bi-heart"}`} aria-hidden />
          </button>
        </div>
        <div className="xp-cap">
          <b className="xp-title">{title}</b>
          <div className="xp-caprow"><span className="xp-cname">{it.creator.name}</span><b className="xp-cprice">{money(it.price.amount, it.price.currency)}</b></div>
        </div>
      </article>
    );
  };

  const chips = (
    <div className="xp-chips" role="group" aria-label={t("filters")}>
      <button className="xp-chip" aria-pressed={!f.type && !f.category && !f.tag && !f.saved && f.view === ""} onClick={() => patch({ type: "", category: "", tag: "", saved: false, view: "", album: "" })}>{t("all")}</button>
      <button className="xp-chip" aria-pressed={f.type === "PHOTO" && f.view === ""} onClick={() => patch({ saved: false, view: "", type: f.type === "PHOTO" ? "" : "PHOTO" })}>{t("photos")}</button>
      <button className="xp-chip" aria-pressed={f.type === "VIDEO" && f.view === ""} onClick={() => patch({ saved: false, view: "", type: f.type === "VIDEO" ? "" : "VIDEO" })}>{t("clips")}</button>
      <button className="xp-chip" aria-pressed={f.view === "collections"} onClick={() => patch({ saved: false, album: "", view: f.view === "collections" ? "" : "collections" })}>{t("collections")}</button>
      {facets?.categories.map(c => (
        <button key={c.name} className="xp-chip" aria-pressed={f.category === c.name} onClick={() => patch({ saved: false, view: "", category: f.category === c.name ? "" : c.name })}>
          {c.label}<small>{c.count}</small>
        </button>
      ))}
    </div>
  );

  const savedBtn = <button className="xp-pill" aria-pressed={f.saved} onClick={() => patch({ saved: !f.saved, view: "" })}><i className="bi bi-bookmark" aria-hidden /> {t("saved")}{saves.length > 0 ? ` · ${saves.length}` : ""}</button>;
  const cartBtn = (
    <button className="xp-pill primary" onClick={() => setDrawer(true)} aria-label={cartCount > 0 ? t("cartCount", { n: cartCount }) : t("cart")}>
      <i className="bi bi-bag" aria-hidden /> {cartCount > 0 ? t("cartCount", { n: cartCount }) : t("cart")}
    </button>
  );
  const filtersBtn = (
    <button className="xp-pill" onClick={openFilters} aria-haspopup="dialog" aria-label={activeCount ? t("filtersWith", { n: activeCount }) : t("filters")}>
      <i className="bi bi-sliders" aria-hidden /> {activeCount ? t("filtersWith", { n: activeCount }) : t("filters")}
    </button>
  );

  const creatorCard = (c: (typeof creators)[number]) => (
    <article className="xp-creator" key={c.id}>
      <button className="xp-mosaic" data-ck-shape="card" onClick={() => { patch({ creator: c.id, view: "", saved: false }); goGallery(); }} aria-label={`${c.name}, ${t("itemsCount", { n: c.rows.length })}`}>
        <span className="m0">{c.rows[0]?.thumbnailUrl && <img src={c.rows[0].thumbnailUrl} alt="" loading="lazy" width={320} height={240} />}</span>
        <span className="m1">{c.rows[1]?.thumbnailUrl && <img src={c.rows[1].thumbnailUrl} alt="" loading="lazy" width={160} height={120} />}</span>
        <span className="m2">{c.rows[2]?.thumbnailUrl && <img src={c.rows[2].thumbnailUrl} alt="" loading="lazy" width={160} height={120} />}</span>
      </button>
      <div className="xp-cfoot">
        <span className="xp-av" aria-hidden>{c.logo ? <img src={c.logo} alt="" /> : initialOf(c.name)}</span>
        <div><b>{c.name}</b><small>{t("itemsCount", { n: c.rows.length })}</small></div>
        <button className="xp-btn xp-view" onClick={() => { patch({ creator: c.id, view: "", saved: false }); goGallery(); }}>{t("viewCreator")}</button>
      </div>
    </article>
  );

  const searchField = (id: string, withBtn: boolean) => (
    <form className="xp-hsearch" role="search" onSubmit={e => { e.preventDefault(); patch({ q: qLive.trim() }); goGallery(); }}>
      <i className="bi bi-search" aria-hidden />
      <input id={id} type="search" value={qLive} onChange={e => setQLive(e.target.value)} aria-label={t("searchPlaceholder")} placeholder={phone ? t("searchShort") : t("searchPlaceholder")} enterKeyHint="search" />
      {qLive && <button type="button" className="xp-x" aria-label={t("clearAll")} onClick={() => { setQLive(""); patch({ q: "" }); }}><i className="bi bi-x-lg" aria-hidden /></button>}
      {withBtn && <button type="submit" className="xp-go">{t("searchBtn")}</button>}
      {phone && <button type="button" className="xp-fcircle" aria-label={activeCount ? t("filtersWith", { n: activeCount }) : t("filters")} aria-haspopup="dialog" onClick={openFilters}><i className="bi bi-sliders" aria-hidden />{activeCount > 0 && <span>{activeCount}</span>}</button>}
    </form>
  );

  const creatorsBlock = !f.saved && !f.q && f.view === "" && creators.length > 0 && (
    <section className="xp-sec xp-creators" aria-labelledby="xp-ct">
      <div className="xp-sechead"><h2 id="xp-ct">{t("featured")}</h2><button className="xp-linkbtn" aria-expanded={showAllCreators} onClick={() => setShowAllCreators(v => !v)}>{phone ? t("seeAll") : `${t("seeAllCreators")} →`}</button></div>
      <div className={`xp-crow${showAllCreators ? " all" : ""}`}>{(showAllCreators ? creators : creators.slice(0, phone ? 8 : 4)).map(creatorCard)}</div>
    </section>
  );

  return (
    <>
      <Navbar />
      <main className="xp" ref={rootRef}>
        <section className="xp-hero" ref={heroRef} aria-labelledby="xp-title">
          {hero?.previewUrl && (
            <img className="xp-heroimg" src={hero.previewUrl} alt="" width={hero.width || 1600} height={hero.height || 1067} fetchPriority="high" decoding="async"
              srcSet={srcsetOf(hero)} sizes="100vw" />
          )}
          <div className="xp-herofade" aria-hidden />
          <div className="xp-herobody">
            <h1 id="xp-title">{phone ? t("heroTitleShort") : t("heroTitle")}</h1>
            <p>{phone ? t("heroSubShort") : t("heroSub")}</p>
            {searchField("xp-q", !phone)}
            {!phone && trendingShown.length > 0 && (
              <div className="xp-trend"><span>{t("trending")}:</span>
                {trendingShown.map(g => <button key={g.key} onClick={() => { patch({ tag: g.tag, category: "category" in g ? (g.category as string) : "", saved: false, view: "" }); goGallery(); }}>{g.label}</button>)}
              </div>
            )}
          </div>
          {!phone && (
            <div className="xp-heroacts">
              <button className="xp-hbtn white" onClick={() => setOwnOpen(true)}><i className="bi bi-key" aria-hidden /> {t("alreadyBought")}</button>
              <Link className="xp-hbtn pink" href="/user/auth/signup?userType=Photographer"><i className="bi bi-camera" aria-hidden /> {t("sellCta")}</Link>
            </div>
          )}
          {hero && <span className="xp-credit">{t("photoBy", { name: hero.creator.name })}{hero.categoryLabel ? ` · ${hero.categoryLabel}` : ""}</span>}
        </section>

        {phone && <div className="xp-chiprow">{chips}</div>}

        {phone && stuck && (
          <div className="xp-slim" role="search">{searchField("xp-q2", false)}</div>
        )}

        {!phone && (
          <div className="xp-resbar">
            <div className="xp-wrap xp-resin">
              {chips}
              <div className="xp-resacts">
                <div className="xp-sortwrap">
                  <button className="xp-pill" aria-haspopup="listbox" aria-expanded={sortOpen} aria-label={`${t("sortMenu")}: ${sortLabel}`} onClick={() => setSortOpen(v => !v)}>
                    {sortLabel} <i className={`bi ${sortOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden />
                  </button>
                  {sortOpen && (
                    <ul className="xp-sortlist" role="listbox" aria-label={t("sortMenu")}>
                      {sorts.map(([v, l]) => (
                        <li key={v} role="option" aria-selected={f.sort === v}><button onClick={() => { patch({ sort: v }); setSortOpen(false); }}>{l}{f.sort === v && <i className="bi bi-check-lg" aria-hidden />}</button></li>
                      ))}
                    </ul>
                  )}
                </div>
                {filtersBtn}
                {savedBtn}
                {cartBtn}
              </div>
            </div>
          </div>
        )}

        <div className="xp-wrap">
          {creatorsBlock}

          <div className="xp-sechead xp-latest">
            <h2>{f.view === "collections" ? t("collections") : f.saved ? t("saved") : t("latest")}
              <small role="status">{f.view === "collections" ? t("itemsCount", { n: albums.length }) : found !== null ? t("itemsFound", { n: found }) : t("itemsFoundMore", { n: list.length })}</small>
            </h2>
            <div className="xp-active">
              {f.album && <button className="xp-chip" onClick={() => patch({ album: "" })}>{t("collectionFilter", { name: albumName })} <i className="bi bi-x-lg" aria-hidden /></button>}
              {f.creator && <button className="xp-chip" onClick={() => patch({ creator: "" })}>{creators.find(c => c.id === f.creator)?.name || t("creatorLabel")} <i className="bi bi-x-lg" aria-hidden /></button>}
              {filtersActive && <button className="xp-linkbtn" onClick={clearFilters}>{t("clearFilters")}</button>}
            </div>
          </div>

          {f.view === "collections" ? (
            <div className="xp-albums">
              {albums.map(a => (
                <article className="xp-album" key={a.id}>
                  <button className="xp-mosaic" data-ck-shape="card" onClick={() => patch({ album: a.id, view: "" })} aria-label={`${a.title}, ${t("itemsCount", { n: a.count })}`}>
                    <span className="m0">{a.rows[0]?.thumbnailUrl && <img src={a.rows[0].thumbnailUrl} alt="" loading="lazy" width={320} height={240} />}</span>
                    <span className="m1">{a.rows[1]?.thumbnailUrl && <img src={a.rows[1].thumbnailUrl} alt="" loading="lazy" width={160} height={120} />}</span>
                    <span className="m2">{a.rows[2]?.thumbnailUrl && <img src={a.rows[2].thumbnailUrl} alt="" loading="lazy" width={160} height={120} />}</span>
                  </button>
                  <div className="xp-afoot"><b>{a.title}</b><small>{a.creator} · {t("itemsCount", { n: a.count })}{a.lo != null && a.hi != null ? ` · ${a.lo === a.hi ? money(a.lo, a.ccy) : t("priceRangeOf", { min: money(a.lo, a.ccy), max: money(a.hi, a.ccy) })}` : ""}</small></div>
                </article>
              ))}
              {albums.length === 0 && !loading && <div className="xp-state"><h2>{t("emptyTitle")}</h2><p>{t("emptyBody")}</p></div>}
            </div>
          ) : (
            <div className={`xp-feed${ready ? "" : " xp-prep"}`} aria-live="polite">
              {failed && (
                <div className="xp-state" role="alert">
                  <h2>{t("errorTitle")}</h2>
                  <p>{t("errorBody")}</p>
                  <button className="xp-btn xp-primary" onClick={() => void load(items.length === 0, cursor)}>{t("retry")}</button>
                </div>
              )}
              {emptyShown && (
                <div className="xp-state">
                  <h2>{f.saved ? t("saved") : t("emptyTitle")}</h2>
                  <p>{f.saved ? t("savedEmpty") : t("emptyBody")}</p>
                  {f.saved && <button className="xp-btn" onClick={() => patch({ saved: false })}>{t("seeAll")}</button>}
                  {!f.saved && filtersActive && <button className="xp-btn" onClick={clearFilters}>{t("clearFilters")}</button>}
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
              {!listLoading && !failed && (f.saved || done) && list.length > 0 && <p className="xp-end">{t("endOfList")}</p>}
            </div>
          )}
        </div>

        {phone && (
          <div className="xp-dock" role="group" aria-label={t("cart")}>
            {savedBtn}
            <button className="xp-pill" onClick={() => setOwnOpen(true)}><i className="bi bi-key" aria-hidden /> {t("boughtShort")}</button>
            {cartBtn}
          </div>
        )}

        {filtersOpen && (
          <>
            <div className="xp-fscrim" onClick={() => setFiltersOpen(false)} aria-hidden />
            <aside className="xp-filters" role="dialog" aria-modal="true" aria-label={t("filtersTitle")}>
              <div className="xp-fhead">
                <h2>{t("filtersTitle")}</h2>
                <button className="xp-round" onClick={() => setFiltersOpen(false)} aria-label={t("close")}><i className="bi bi-x-lg" aria-hidden /></button>
              </div>
              <div className="xp-fbody">
                <div className="xp-fgroup">
                  <div className="xp-flabel">{t("type")}</div>
                  <div className="xp-fchips">
                    {([["", t("all")], ["PHOTO", t("photos")], ["VIDEO", t("clips")]] as const).map(([v, l]) => (
                      <button key={v} className="xp-chip" aria-pressed={draft.type === v} onClick={() => setDraft({ ...draft, type: v })}>{l}</button>
                    ))}
                  </div>
                </div>
                <label className="xp-fgroup"><span className="xp-flabel">{t("allCategories")}</span>
                  <select className="xp-select" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>
                    <option value="">{t("allCategories")}</option>
                    {facets?.categories.map(c => <option key={c.name} value={c.name}>{c.label} ({c.count})</option>)}
                  </select>
                </label>
                <div className="xp-fgroup">
                  <div className="xp-flabel">{t("priceLabel")}</div>
                  <div className="xp-prices">
                    <label className="xp-pin"><span>{draft.cur}</span><input inputMode="decimal" aria-label={t("minPrice")} placeholder="0" value={draft.min} onChange={e => setDraft({ ...draft, min: e.target.value.replace(/[^\d.]/g, "") })} /></label>
                    <label className="xp-pin"><span>{draft.cur}</span><input inputMode="decimal" aria-label={t("maxPrice")} placeholder={facets?.maxPrice ? String(Math.round(facets.maxPrice)) : "50"} value={draft.max} onChange={e => setDraft({ ...draft, max: e.target.value.replace(/[^\d.]/g, "") })} /></label>
                  </div>
                </div>
                <label className="xp-fgroup"><span className="xp-flabel">{t("currency")}</span>
                  <select className="xp-select" value={draft.cur} onChange={e => setDraft({ ...draft, cur: e.target.value })}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </label>
                <div className="xp-fgroup">
                  <div className="xp-flabel">{t("orientation")}</div>
                  <div className="xp-fchips">
                    {([["", t("any")], ["landscape", t("landscape")], ["portrait", t("portrait")], ["square", t("square")]] as const).map(([v, l]) => (
                      <button key={v} className="xp-chip" aria-pressed={draft.orient === v} onClick={() => setDraft({ ...draft, orient: v })}>{l}</button>
                    ))}
                  </div>
                </div>
                {creators.length > 0 && (
                  <label className="xp-fgroup"><span className="xp-flabel">{t("creatorLabel")}</span>
                    <select className="xp-select" value={draft.creator} onChange={e => setDraft({ ...draft, creator: e.target.value })}>
                      <option value="">{t("allCreators")}</option>
                      {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                )}
                <div className="xp-fgroup xp-fsort">
                  <div className="xp-flabel">{t("sortLabel")}</div>
                  <div className="xp-fchips">
                    {sorts.map(([v, l]) => <button key={v} className="xp-chip" aria-pressed={draft.sort === v} onClick={() => setDraft({ ...draft, sort: v })}>{l}</button>)}
                  </div>
                </div>
              </div>
              <div className="xp-ffoot">
                <button className="xp-btn" onClick={() => setDraft({ ...DEFAULTS, q: draft.q, saved: draft.saved, view: draft.view, album: draft.album, tag: draft.tag })}>{t("clearAll")}</button>
                <button className="xp-btn xp-primary" onClick={() => { setF({ ...draft }); setFiltersOpen(false); }}>{t("apply")}</button>
              </div>
            </aside>
          </>
        )}

        {openItem && (
          <div className="xp-modal" role="dialog" aria-modal="true" aria-label={titleOf(openItem)} onClick={closeViewer}>
            <div className="xp-sheet viewer" ref={sheetRef} onClick={e => e.stopPropagation()}>
              <ExploreViewer item={openItem} title={titleOf(openItem)} t={t} currency={f.cur} onClose={closeViewer} index={openIndex} total={list.length}
                onPrev={openIndex > 0 ? () => step(-1) : undefined} onNext={openIndex >= 0 && openIndex < list.length - 1 ? () => step(1) : undefined}
                inCart={inCart(openItem.id)} onCart={() => toggleCart(openItem)} onBuy={() => { if (!inCart(openItem.id)) toggleCart(openItem); closeViewer(); setDrawer(true); }}
                saved={saves.includes(openItem.id)} onSave={() => toggleSave(openItem.id)} onOpen={openAny} />
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
                    {c.thumbnailUrl && <img src={c.thumbnailUrl} alt="" width={56} height={56} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title || t("clip")}</div>
                      <div className="xp-meta">{c.mediaType === "VIDEO" ? t("clip") : t("photo")}{line ? ` · ${money(line.price, quote!.currency || f.cur)}` : ""}</div>
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
                  <div className="xp-total"><span>{t("total")}</span><span>{quoteBusy || !quote ? "…" : money(quote.total, quote.currency || f.cur)}</span></div>
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
                        {u.thumbnailUrl && <img src={u.thumbnailUrl} alt="" width={150} height={110} style={{ width: "100%", height: 110 }} />}
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
