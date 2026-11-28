import type { Metadata } from "next";
import ExploreClient from "../ExploreClient";
import { BACKEND_BASE, feedUrl, type ExploreItem, type Facets } from "../exploreApi";

/** /explore/<id> is the same page with that item's viewer open. Closing it goes back to /explore. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: "Explore · Connekyt", alternates: { canonical: `/explore/${encodeURIComponent(id)}` } };
}

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

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [initial, facets] = await Promise.all([firstPage(), firstFacets()]);
  return <ExploreClient initial={initial} initialFacets={facets} initialItemId={id} />;
}
