import type { ExploreItem } from "./exploreApi";

/** "Kigali Convention Centre (KCC)" reads "KCC" on a card; an album with no short form keeps its name. */
export function shortAlbum(title: string | null | undefined): string {
  const t = (title || "").trim();
  const m = /\(([^)]{2,12})\)\s*$/.exec(t);
  return m ? m[1].trim() : t;
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * The text under or over each card. An item's own title is shown as it is. An item that has none falls back to its album
 * name, so it reads "KCC · 3/8" (album, position) instead of the same album name on every card. Whatever still repeats
 * another card in the list gets its album position, or its creator, so no two cards say the same thing.
 */
export function cardTitles(items: ExploreItem[], fallback: (it: ExploreItem) => string): Map<string, string> {
  const out = new Map<string, string>();
  for (const it of items) {
    const own = it.titleIsOwn !== false && it.title && !(it.album && norm(it.title) === norm(it.album.title || ""));
    if (own) { out.set(it.id, it.title as string); continue; }
    const name = shortAlbum(it.album?.title || it.title) || fallback(it);
    out.set(it.id, it.album && it.album.count > 1 ? `${name} · ${it.album.position}/${it.album.count}` : name);
  }
  const seen = new Map<string, number>();
  for (const v of out.values()) seen.set(norm(v), (seen.get(norm(v)) || 0) + 1);
  for (const it of items) {
    const v = out.get(it.id) as string;
    if ((seen.get(norm(v)) || 0) < 2) continue;
    if (it.album && it.album.count > 1 && !v.endsWith(`${it.album.position}/${it.album.count}`)) out.set(it.id, `${v} · ${it.album.position}/${it.album.count}`);
    else if (it.creator.name) out.set(it.id, `${v} · ${it.creator.name}`);
  }
  // Last resort, when nothing else tells two cards apart: a running number, so no two cards say the same thing.
  const again = new Map<string, number>();
  const left = new Map<string, number>();
  for (const v of out.values()) left.set(norm(v), (left.get(norm(v)) || 0) + 1);
  for (const it of items) {
    const v = out.get(it.id) as string;
    if ((left.get(norm(v)) || 0) < 2) continue;
    const n = (again.get(norm(v)) || 0) + 1;
    again.set(norm(v), n);
    if (n > 1) out.set(it.id, `${v} (${n})`);
  }
  return out;
}

/** "6000 × 4000 px" and "24 MP" for the ORIGINAL file, or nulls when the backend has not measured it. */
export function originalSpec(it: ExploreItem): { dims: string; mp: string; format: string | null } | null {
  const o = it.original;
  if (!o || !(o.width > 0) || !(o.height > 0)) return null;
  const mp = o.megapixels >= 10 ? Math.round(o.megapixels) : Math.round(o.megapixels * 10) / 10;
  return { dims: `${o.width} × ${o.height} px`, mp: `${mp} MP`, format: o.format };
}

/** A creator name stored in capitals ("SKY EDITION VISUAL ARTS") reads as "Sky Edition Visual Arts"; a name with any lower case letter is left alone. */
export function niceName(name: string): string {
  const t = (name || "").trim();
  if (!t || t !== t.toUpperCase() || t === t.toLowerCase()) return t;
  return t.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase());
}

/** The same item with a readable creator name. Applied once, where items come in. */
export function normalizeItem(it: ExploreItem): ExploreItem {
  const n = niceName(it.creator.name);
  return n === it.creator.name ? it : { ...it, creator: { ...it.creator, name: n } };
}
