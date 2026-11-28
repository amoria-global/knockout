"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { clock, fetchFeed, fetchItem, money, type ExploreItem } from "./exploreApi";
import { originalSpec, shortAlbum } from "./exploreTitles";

type T = ReturnType<typeof useTranslations>;
const initialOf = (name: string) => (name.trim()[0] || "C").toUpperCase();

/**
 * One item in detail. On a laptop it is a dark image panel with a 350px details column and fits 1366 x 768 with no page
 * scroll; on a phone it is a full page. The size shown is the ORIGINAL file's (item.original), never the preview's.
 */
export default function ExploreViewer({ item, title, t, currency, onClose, onPrev, onNext, inCart, onCart, onBuy, saved, onSave, onOpen, index, total }: {
  item: ExploreItem; title: string; t: T; currency: string; onClose: () => void; onPrev?: () => void; onNext?: () => void;
  inCart: boolean; onCart: () => void; onBuy: () => void; saved: boolean; onSave: () => void; onOpen: (it: ExploreItem) => void;
  index: number; total: number;
}) {
  const video = item.mediaType === "VIDEO";
  const [ended, setEnded] = useState(false);
  const [local, setLocal] = useState("");
  const [more, setMore] = useState<ExploreItem[]>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const spec = originalSpec(item);

  const share = () => {
    const url = `${window.location.origin}/explore/${item.id}`;
    if (navigator.share) void navigator.share({ title, url }).catch(() => { /* cancelled */ });
    else void navigator.clipboard?.writeText(url).catch(() => { /* blocked */ });
  };
  const fullscreen = () => { void stageRef.current?.requestFullscreen?.().catch(() => { /* not allowed */ }); };

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

  const sub = [item.categoryLabel, item.album ? t("albumLine", { name: shortAlbum(item.album.title), pos: item.album.position, count: item.album.count }) : ""].filter(Boolean).join(" · ");
  const line = [spec ? t("originalLine", { dims: spec.dims }) : "", spec?.format || (video ? t("clip") : ""), t("licenseName")].filter(Boolean).join(" · ");

  return (
    <>
      <div className="xp-stage" ref={stageRef}>
        <div className="xp-mtop">
          <button className="xp-round on-media" onClick={onClose} aria-label={t("back")}><i className="bi bi-chevron-left" aria-hidden /></button>
          <div>
            <button className="xp-round on-media" onClick={share} aria-label={t("share")}><i className="bi bi-share" aria-hidden /></button>
            <button className="xp-round on-media" onClick={onSave} aria-pressed={saved} aria-label={saved ? t("saved") : t("save")}><i className={`bi ${saved ? "bi-heart-fill" : "bi-heart"}`} aria-hidden /></button>
          </div>
        </div>
        {onPrev && <button className="xp-round xp-stagenav prev" onClick={onPrev} aria-label={t("previous")}><i className="bi bi-chevron-left" aria-hidden /></button>}
        {onNext && <button className="xp-round xp-stagenav next" onClick={onNext} aria-label={t("next")}><i className="bi bi-chevron-right" aria-hidden /></button>}
        <div className="xp-frame xp-wm">
          {video && item.previewIframeUrl ? (
            <iframe key={item.id} title={title} src={`${item.previewIframeUrl}?autoplay=true&muted=true&controls=true`} allow="autoplay; fullscreen" />
          ) : (
            item.previewUrl && <img src={item.previewUrl} alt={title} width={item.width || undefined} height={item.height || undefined}
              srcSet={item.srcset?.["640"] && item.srcset?.["1600"] ? `${item.srcset["640"]} 640w, ${item.srcset["1600"]} 1600w` : undefined} sizes="(min-width: 860px) 60vw, 100vw" />
          )}
        </div>
        {video && ended && (
          <div className="xp-endcard" role="status">
            <h3>{t("previewEnds")}</h3>
            <p>{t("buyFullHint", { s: item.durationSeconds ? clock(item.durationSeconds) : "" })}</p>
            <button className="xp-btn xp-primary" onClick={onBuy}>{t("buyFull")}</button>
          </div>
        )}
        {!video && <button className="xp-fsbtn" onClick={fullscreen} aria-label={t("fullScreen")}><i className="bi bi-arrows-fullscreen" aria-hidden /> <span>{t("fullScreen")}</span></button>}
        {total > 1 && <span className="xp-pos" aria-hidden>{index + 1} / {total}</span>}
      </div>
      <div className="xp-side">
        <div className="xp-who">
          <span className="xp-av" aria-hidden>{item.creator.logo ? <img src={item.creator.logo} alt="" /> : initialOf(item.creator.name)}</span>
          <div><b>{item.creator.name}</b><small>{item.categoryLabel || (video ? t("clip") : t("photo"))}</small></div>
          <Link className="xp-btn xp-profile" href={`/user/photographers/view-profile?id=${encodeURIComponent(item.creator.id)}`}>{t("viewProfile")}</Link>
          <button ref={closeRef} className="xp-round xp-close" onClick={onClose} aria-label={t("close")}><i className="bi bi-x-lg" aria-hidden /></button>
        </div>
        <h2>{title}</h2>
        {sub && <div className="xp-meta xp-sub">{sub}</div>}
        <div className="xp-meta xp-line1">{line}</div>
        <dl className="xp-spec">
          {spec && <div><dt>{t("original")}</dt><dd>{spec.dims}</dd></div>}
          {(spec || video) && <div><dt>{t("format")}</dt><dd>{[spec?.format || (video ? t("clip") : ""), spec?.mp, video && item.durationSeconds ? clock(item.durationSeconds) : ""].filter(Boolean).join(" · ") || "—"}</dd></div>}
          <div><dt>{t("license")}</dt><dd>{t("licenseName")}</dd></div>
        </dl>
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
                <button key={m.id} data-ck-shape="card" onClick={() => onOpen(m)} aria-label={m.title || m.creator.name}>{m.thumbnailUrl && <img src={m.thumbnailUrl} alt="" loading="lazy" width={200} height={200} />}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
