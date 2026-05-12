import type { Metadata } from "next";
import React from "react";
import FindMyPhotos from "../../pages/find-my-photos";

// generateMetadata runs server-side at request time and lets us return
// per-link OpenGraph tags. Crawlers (WhatsApp, Telegram, FB, etc.) GET
// the page, parse <meta property="og:*">, and render the rich preview.
// Without this, every shared invite link showed the Amoria logo because
// the only metadata in scope was the default from app/layout.tsx.

const BACKEND_BASE = (process.env.BACKEND_API_URL
    || process.env.NEXT_PUBLIC_API_URL
    || "https://backend.connekyt.com/").replace(/\/$/, "");

const DEFAULT_TITLE = "Amoria Connekyt";
const DEFAULT_DESC = "Connecting moments, creating memories. Your trusted platform for connekyt.com";

type AlbumMeta = {
    type?: string;
    title?: string;
    description?: string;
    photographerName?: string;
    imageUrl?: string;
};

async function fetchAlbumMeta(code: string): Promise<AlbumMeta | null> {
    if (!code) return null;
    try {
        const url = `${BACKEND_BASE}/api/remote/public/albums/meta?code=${encodeURIComponent(code)}`;
        // 5 s timeout — crawlers hate slow OG responses; default to logo if
        // the backend is unreachable. Cache for 5 min so re-shares of the
        // same link don't hammer the API.
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5_000);
        const res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 300 } });
        clearTimeout(t);
        if (!res.ok) return null;
        const json = await res.json();
        if (!json || json.action !== 1 || !json.data) return null;
        return json.data as AlbumMeta;
    } catch {
        return null;
    }
}

type SearchParams = Promise<{ code?: string | string[] }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams;
    const codeParam = sp.code;
    const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
    const meta = code ? await fetchAlbumMeta(code) : null;

    if (!meta) {
        return {
            title: DEFAULT_TITLE,
            description: DEFAULT_DESC,
            openGraph: {
                title: DEFAULT_TITLE,
                description: DEFAULT_DESC,
                url: `https://connekyt.com/user/find-my-photos${code ? `?code=${encodeURIComponent(code)}` : ""}`,
                siteName: "Connekyt",
                type: "website",
            },
        };
    }

    const title = meta.title
        ? `${meta.title} — Connekyt`
        : DEFAULT_TITLE;
    const description = meta.description
        || (meta.photographerName
            ? `Photos by ${meta.photographerName}. Open the link to find your photos.`
            : "Open the link to find your photos.");
    const images = meta.imageUrl ? [{ url: meta.imageUrl }] : undefined;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://connekyt.com/user/find-my-photos?code=${encodeURIComponent(code || "")}`,
            siteName: "Connekyt",
            type: "website",
            images,
        },
        twitter: {
            card: images ? "summary_large_image" : "summary",
            title,
            description,
            images: meta.imageUrl ? [meta.imageUrl] : undefined,
        },
    };
}

const FindMyPhotosPage = () => {
    return (
        <div>
            <FindMyPhotos />
        </div>
    );
};

export default FindMyPhotosPage;
