import type { Metadata } from "next";
import { preload } from "react-dom";
import ExploreClient from "./ExploreClient";
import { BACKEND_BASE, feedUrl, type ExploreItem, type Facets } from "./exploreApi";

export const metadata: Metadata = {
  title: "Explore · Connekyt",
  alternates: { canonical: "/explore" },
  description: "Photos and short video clips from Connekyt creators. Watch a preview, pick what you love and get the original in your inbox.",
  openGraph: {
    title: "Explore · Connekyt",
    description: "Photos and video clips from creators across Africa and beyond.",
    type: "website",
  },
};

/** The first page of the feed and the filter counts are fetched on the server, so the first photos are in the HTML and start loading at once. */
async function firstPage(): Promise<{ items: ExploreItem[]; nextCursor: string | null } | null> {
  try {
    const res = await fetch(feedUrl({ currency: "USD", sort: "newest", size: 24 }), { next: { revalidate: 30 } });
    const body = await res.json();
    if (!res.ok || body?.action !== 1) return null;
    return { items: body.data.items, nextCursor: body.data.nextCursor ?? null };
  } catch { return null; }
}
async function firstFacets(): Promise<Facets | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/public/explore/facets?currency=USD`, { next: { revalidate: 30 } });
    const body = await res.json();
    return res.ok && body?.action === 1 ? (body.data as Facets) : null;
  } catch { return null; }
}

export default async function Page() {
  const [initial, facets] = await Promise.all([firstPage(), firstFacets()]);
  const lead = initial?.items[0];
  if (lead?.thumbnailUrl) {
    // The first photo is the largest paint on the page, so the browser is told about it before any script runs.
    const s640 = lead.srcset?.["640"]; const s1600 = lead.srcset?.["1600"];
    preload(lead.thumbnailUrl, {
      as: "image", fetchPriority: "high",
      ...(s640 && s1600 ? { imageSrcSet: `${s640} 640w, ${s1600} 1600w`, imageSizes: "(min-width: 1440px) 17vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" } : {}),
    });
  }
  return <ExploreClient initial={initial} initialFacets={facets} />;
}
