import { describe, expect, it } from "vitest";
import type { ExploreItem } from "./exploreApi";
import { cardTitles, niceName, originalSpec, shortAlbum } from "./exploreTitles";

const item = (id: string, over: Partial<ExploreItem> = {}): ExploreItem => ({
  id, albumId: "a1", mediaType: "PHOTO", title: "Kigali Convention Centre (KCC)", category: null, categoryLabel: null,
  creator: { id: "u1", name: "Sky Edition", logo: null }, thumbnailUrl: null, previewUrl: null, srcset: {}, width: 640, height: 853, aspectRatio: 0.75,
  price: { listing: 5, listingCurrency: "USD", amount: 5, currency: "USD" }, tags: [], licence: "STANDARD",
  titleIsOwn: false, album: { id: "a1", title: "Kigali Convention Centre (KCC)", count: 8, position: 1 }, original: null, ...over,
});

describe("explore card titles", () => {
  it("never repeats the album name on every card: it adds the album position", () => {
    const list = [1, 2, 3].map(n => item(`i${n}`, { album: { id: "a1", title: "Kigali Convention Centre (KCC)", count: 8, position: n } }));
    const t = cardTitles(list, () => "Photo");
    expect([...t.values()]).toEqual(["KCC · 1/8", "KCC · 2/8", "KCC · 3/8"]);
  });

  it("shows an item's own title as it is, in normal case", () => {
    const t = cardTitles([item("a", { title: "Golden hour", titleIsOwn: true })], () => "Photo");
    expect(t.get("a")).toBe("Golden hour");
  });

  it("separates two own titles that are identical, by album position or by creator", () => {
    const a = item("a", { title: "Dusk", titleIsOwn: true, album: { id: "x", title: "Trip", count: 4, position: 2 } });
    const b = item("b", { title: "Dusk", titleIsOwn: true, album: null, creator: { id: "u2", name: "Aline Uwase", logo: null } });
    const c = item("c", { title: "dusk", titleIsOwn: true, album: null, creator: { id: "u3", name: "Kevin Doe", logo: null } });
    const t = cardTitles([a, b, c], () => "Photo");
    expect(new Set([...t.values()].map(v => v.toLowerCase())).size).toBe(3);
  });

  it("falls back to the media type when there is no album and no title", () => {
    const t = cardTitles([item("a", { title: null, album: null })], () => "Clip");
    expect(t.get("a")).toBe("Clip");
  });

  it("shortens an album name only when it carries a short form in brackets", () => {
    expect(shortAlbum("Kigali Convention Centre (KCC)")).toBe("KCC");
    expect(shortAlbum("Lake Kivu orbit")).toBe("Lake Kivu orbit");
  });
});

describe("creator names", () => {
  it("turns a name stored in capitals into a readable one, and leaves mixed case alone", () => {
    expect(niceName("SKY EDITION VISUAL ARTS")).toBe("Sky Edition Visual Arts");
    expect(niceName("O'BRIEN STUDIO")).toBe("O'Brien Studio");
    expect(niceName("Aline Uwase")).toBe("Aline Uwase");
    expect(niceName("DJ Kevin")).toBe("DJ Kevin");
    expect(niceName("")).toBe("");
  });
});

describe("original file spec", () => {
  it("reports the original, never the preview", () => {
    const s = originalSpec(item("a", { width: 640, height: 853, original: { width: 6000, height: 4000, megapixels: 24, format: "JPG", sizeBytes: 8_400_000 } }));
    expect(s).toEqual({ dims: "6000 × 4000 px", mp: "24 MP", format: "JPG" });
  });
  it("says nothing when the original has not been measured, instead of showing the preview size", () => {
    expect(originalSpec(item("a", { original: null }))).toBeNull();
    expect(originalSpec(item("a", { original: { width: 0, height: 0, megapixels: 0, format: null, sizeBytes: null } }))).toBeNull();
  });
});
