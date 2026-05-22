import type { Metadata } from "next";
import BrowsePhotosAlbum from "../../../pages/browse-photos-album";

/**
 * SSR wrapper for /user/browse-photos/{photographer-album-slug}.
 *
 * Fetches the album server-side so the page ships proper OpenGraph
 * metadata (link previews on WhatsApp / Twitter / FB show the cover
 * + title) AND the client gets initial data without a roundtrip.
 *
 * Slug shape (matches backend ContentBrowseController.slugFor):
 *   {photographerFirst}-{photographerLast}-{albumTitle} (sanitised)
 */

const BACKEND_BASE = (process.env.BACKEND_API_URL
    || process.env.NEXT_PUBLIC_API_URL
    || "https://backend.connekyt.com").replace(/\/$/, "");

type Params = Promise<{ slug: string }>;

interface AlbumData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  category?: string | null;
  categoryLabel?: string | null;
  photographerId?: string | null;
  photographerName?: string;
  photographerLogo?: string | null;
  listingPrice?: number;
  listingCurrency?: string | null;
  buyerPrice?: number;
  buyerCurrency?: string;
  photoCount?: number;
}
interface AlbumPayload {
  album: AlbumData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
}

async function fetchAlbum(slug: string): Promise<AlbumPayload | null> {
  if (!slug) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5_000);
    const res = await fetch(
      `${BACKEND_BASE}/api/public/content/album-by-slug/${encodeURIComponent(slug)}`,
      { signal: ctrl.signal, next: { revalidate: 60 } }
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const j = await res.json();
    if (j?.action !== 1 || !j.data) return null;
    return j.data as AlbumPayload;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchAlbum(slug);
  if (!data) {
    return {
      title: "Album · Connekyt",
      description: "Browse Connekyt photography by category.",
      robots: { index: false, follow: false },
    };
  }
  const a = data.album;
  const title = `${a.title} · Connekyt`;
  const description = a.description
    || `License photos from ${a.title}${a.photographerName ? ` by ${a.photographerName}` : ""}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: a.coverImage ? [{ url: a.coverImage }] : undefined,
    },
    twitter: {
      card: a.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: a.coverImage ? [a.coverImage] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await fetchAlbum(slug);
  return <BrowsePhotosAlbum slug={slug} initial={data} />;
}
