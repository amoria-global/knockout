"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Navbar from "../components/navbar";
import Footer from "../components/footer";

/**
 * /user/browse-photos/purchase/[refid]
 *
 * Polls the public purchase-status endpoint until status flips to
 * COMPLETED, then auto-triggers a download from the same URL the
 * "Download again" button uses. Buyer also receives the ZIP attached
 * to the receipt email — this page is the auto-download + recovery
 * fallback for the same session.
 *
 * Edge cases:
 *   • Polling timeout (~10 min): show a "still processing" notice with
 *     a contact-support link.
 *   • FAILED status: show a retry-payment CTA back to /user/browse-photos.
 *   • Buyer reloads after PAID: state restores from the same poll;
 *     auto-download is a no-op the second time (we set a flag in
 *     sessionStorage to avoid re-triggering on every refresh).
 */

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL
    || "https://backend.connekyt.com").replace(/\/$/, "");

interface PurchaseStatusData {
  refid: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  email?: string;
  photoCount: number;
  unlockCode?: string;
  downloadUrl?: string;
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

export default function BrowsePhotosSuccessPage({ refid }: { refid: string }) {
  const [data, setData] = useState<PurchaseStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [didAutoDownload, setDidAutoDownload] = useState(false);

  // Poll loop
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const start = Date.now();

    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/public/content/purchase/${refid}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (j?.action !== 1 || !j.data) throw new Error(j?.message || 'Unknown response');
        if (stopped) return;
        setData(j.data);
        if (j.data.status === 'COMPLETED' || j.data.status === 'FAILED') return;
        if (Date.now() - start > POLL_TIMEOUT_MS) { setTimedOut(true); return; }
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (e) {
        if (stopped) return;
        setError(e instanceof Error ? e.message : 'Failed to load purchase');
        // Keep polling — transient backend hiccups shouldn't kill the page.
        timer = setTimeout(poll, POLL_INTERVAL_MS * 2);
      }
    };
    void poll();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [refid]);

  // Auto-download once on first COMPLETED (per browser session)
  useEffect(() => {
    if (!data || data.status !== 'COMPLETED' || !data.downloadUrl) return;
    if (didAutoDownload) return;
    const key = `connekyt:dl:${refid}`;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(key)) {
      setDidAutoDownload(true);
      return;
    }
    if (typeof window !== 'undefined') window.sessionStorage.setItem(key, '1');
    setDidAutoDownload(true);
    // Trigger via a hidden anchor so download attribute is honoured
    // and we don't lose the page context (an inline window.location.href
    // would navigate the tab to the ZIP).
    const a = document.createElement('a');
    a.href = data.downloadUrl;
    a.download = `connekyt-photos-${refid}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [data, didAutoDownload, refid]);

  const status = data?.status;

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#f9fafb', paddingTop: 100 }}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.06)', padding: '36px 28px', textAlign: 'center' }}>
            {!data && !error && (
              <>
                <div style={spinnerWrap}><div style={spinner} /></div>
                <h2 style={titleStyle}>Confirming your payment…</h2>
                <p style={textStyle}>This usually takes a few seconds.</p>
              </>
            )}

            {status === 'PENDING' && data && (
              <>
                <div style={spinnerWrap}><div style={spinner} /></div>
                <h2 style={titleStyle}>Waiting for payment confirmation…</h2>
                <p style={textStyle}>
                  Hang tight — once mobile money confirms, we&apos;ll prep your photos and email them to{' '}
                  <strong>{data.email}</strong>. You don&apos;t need to keep this page open.
                </p>
              </>
            )}

            {status === 'COMPLETED' && data && (
              <>
                <div style={{ ...iconCircle, background: '#dcfce7', color: '#15803d' }}>
                  <i className="bi bi-check-lg" style={{ fontSize: 36 }} />
                </div>
                <h2 style={titleStyle}>Thanks — your photos are on the way</h2>
                <p style={textStyle}>
                  Your {data.photoCount} photo{data.photoCount === 1 ? '' : 's'} were emailed to{' '}
                  <strong>{data.email}</strong> as a ZIP attachment.{' '}
                  {didAutoDownload && 'Your browser is downloading them right now.'}
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
                  {data.downloadUrl && (
                    <a href={data.downloadUrl} download={`connekyt-photos-${refid}.zip`} style={btnPrimary}>
                      <i className="bi bi-cloud-download" style={{ marginRight: 6 }} /> Download again
                    </a>
                  )}
                  <Link href="/user/browse-photos" style={btnSecondary}>
                    Continue browsing
                  </Link>
                </div>

                {data.unlockCode && (
                  <div style={{ marginTop: 20, padding: 12, background: '#f9fafb', border: '1px solid #f0f2f5', borderRadius: 8, fontSize: 12.5, color: '#6b7280' }}>
                    Your unlock code: <code style={codeChip}>{data.unlockCode}</code><br/>
                    Save this — it re-unlocks these exact photos via the recovery flow
                    if your email gets lost.
                  </div>
                )}
              </>
            )}

            {status === 'FAILED' && (
              <>
                <div style={{ ...iconCircle, background: '#fee2e2', color: '#b91c1c' }}>
                  <i className="bi bi-x-lg" style={{ fontSize: 32 }} />
                </div>
                <h2 style={titleStyle}>Payment didn&apos;t go through</h2>
                <p style={textStyle}>You weren&apos;t charged. Head back to your cart and try again.</p>
                <Link href="/user/browse-photos" style={btnPrimary}>Back to browse</Link>
              </>
            )}

            {timedOut && status !== 'COMPLETED' && (
              <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', color: '#92400e', borderRadius: 8, fontSize: 13 }}>
                Payment is taking longer than usual to confirm. Your receipt email will
                still arrive once it clears — you can also{' '}
                <Link href="/user/browse-photos/recover" style={{ color: '#92400e', fontWeight: 700 }}>recover by email</Link>.
              </div>
            )}

            {error && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: '#dc2626' }}>{error}</div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ─── styles ───────────────────────────────────────────────────────
const titleStyle: React.CSSProperties = { margin: '14px 0 6px', fontSize: 22, fontWeight: 700, color: '#111' };
const textStyle: React.CSSProperties = { margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.55 };
const iconCircle: React.CSSProperties = {
  width: 72, height: 72, borderRadius: '50%',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};
const spinnerWrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', marginBottom: 8 };
const spinner: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%',
  border: '3px solid #f3f4f6', borderTopColor: '#F20C8F',
  animation: 'spin 0.8s linear infinite',
};
const btnPrimary: React.CSSProperties = {
  display: 'inline-block', padding: '10px 18px', background: '#F20C8F',
  color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
};
const btnSecondary: React.CSSProperties = {
  display: 'inline-block', padding: '10px 18px', background: '#fff',
  color: '#374151', textDecoration: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14,
  border: '1px solid #d1d5db',
};
const codeChip: React.CSSProperties = {
  background: '#fff', padding: '3px 8px', borderRadius: 5, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
  fontSize: 12, color: '#054d6f', fontWeight: 700, border: '1px solid #e5e7eb',
};
