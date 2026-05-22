"use client";

import { useEffect, useRef, useState } from "react";
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * Minimal row shape the modal needs to render a thumbnail and trigger
 * a per-image download. Other callers pass their own richer shape - we
 * only read these fields. Keeping the surface narrow lets both
 * /user/browse-photos and /user/browse-photos/[slug] share this
 * component without coupling on the full BrowseRow.
 */
export interface PurchasedItem {
  imageId: string;
  fileUrl: string;
}

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL
    || "https://backend.connekyt.com").replace(/\/$/, "");

const POLL_MS = 3000;
const TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Post-payment in-page modal - polls status until COMPLETED, auto-fires
 * a one-time ZIP download, and gives the buyer per-image and batched
 * download. Email delivery happens server-side (ContentZipService,
 * idempotent - one mail per refid).
 */
export default function PurchaseSuccessModal({
  refid, items, email, onClose,
}: {
  refid: string;
  items: PurchasedItem[];
  email: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<'PENDING' | 'COMPLETED' | 'FAILED'>('PENDING');
  const [unlockCode, setUnlockCode] = useState<string | undefined>(undefined);
  const [timedOut, setTimedOut] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map(i => i.imageId)));
  const didAutoDownloadRef = useRef(false);

  // Poll until COMPLETED / FAILED / timeout.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const start = Date.now();

    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/public/content/purchase/${refid}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (j?.action !== 1 || !j.data) throw new Error(j?.message || 'Unknown');
        if (stopped) return;
        setStatus(j.data.status);
        if (j.data.unlockCode) setUnlockCode(j.data.unlockCode);
        if (j.data.status === 'COMPLETED' || j.data.status === 'FAILED') return;
        if (Date.now() - start > TIMEOUT_MS) { setTimedOut(true); return; }
        timer = setTimeout(poll, POLL_MS);
      } catch {
        if (stopped) return;
        timer = setTimeout(poll, POLL_MS * 2);
      }
    };
    void poll();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [refid]);

  // Trigger ZIP auto-download exactly once when COMPLETED.
  useEffect(() => {
    if (status !== 'COMPLETED' || didAutoDownloadRef.current) return;
    didAutoDownloadRef.current = true;
    const a = document.createElement('a');
    a.href = `${BACKEND_BASE}/api/public/content/purchase/${refid}/download`;
    a.download = `connekyt-photos-${refid}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [status, refid]);

  const downloadOne = (it: PurchasedItem) => {
    const a = document.createElement('a');
    a.href = it.fileUrl;
    a.download = '';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadSelected = () => {
    const targets = items.filter(i => selected.has(i.imageId));
    let i = 0;
    const fire = () => {
      if (i >= targets.length) return;
      downloadOne(targets[i++]);
      setTimeout(fire, 200);
    };
    fire();
  };

  const toggleSel = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allChecked = selected.size === items.length && items.length > 0;
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.imageId)));
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 14,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 880,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.40)',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              {status === 'COMPLETED' ? 'Payment confirmed - your photos are ready' :
               status === 'FAILED' ? 'Payment didn\'t go through' :
               'Waiting for payment confirmation…'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#6b7280' }}>
              {status === 'COMPLETED'
                ? <>A ZIP with all your photos was emailed to <strong>{email}</strong>. Your browser is also auto-downloading.</>
                : status === 'PENDING'
                  ? <>Once mobile money confirms, we&apos;ll prep everything. You don&apos;t need to keep this open - we&apos;ll email <strong>{email}</strong>.</>
                  : <>You weren&apos;t charged. Close this and try again from your cart.</>}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6',
            border: 'none', cursor: 'pointer', fontSize: 18, color: '#374151', flexShrink: 0,
          }}>×</button>
        </div>

        <div style={{ padding: 18, overflowY: 'auto' }}>
          {status === 'PENDING' && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #f3f4f6', borderTopColor: '#F20C8F', animation: 'pmspin 0.8s linear infinite' }} />
            </div>
          )}

          {status === 'COMPLETED' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f0f2f5' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                  Select all ({items.length})
                </label>
                <span style={{ fontSize: 12, color: '#6b7280' }}>· {selected.size} selected</span>
                <button onClick={downloadSelected} disabled={selected.size === 0}
                  style={{
                    marginLeft: 'auto',
                    padding: '8px 14px', borderRadius: 8,
                    background: selected.size === 0 ? '#e5e7eb' : '#F20C8F',
                    color: selected.size === 0 ? '#9ca3af' : '#fff',
                    border: 'none', fontWeight: 700, fontSize: 13, cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                  }}>
                  <i className="bi bi-download" style={{ marginRight: 6 }} /> Download selected
                </button>
                <a href={`${BACKEND_BASE}/api/public/content/purchase/${refid}/download`}
                  download={`connekyt-photos-${refid}.zip`}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    background: '#083A85', color: '#fff', textDecoration: 'none',
                    fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                  <i className="bi bi-file-zip" /> Download ZIP again
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {items.map(it => {
                  const isSel = selected.has(it.imageId);
                  return (
                    <div key={it.imageId} style={{
                      position: 'relative', aspectRatio: '1', background: '#0a1a36',
                      border: isSel ? '2px solid #F20C8F' : '2px solid transparent',
                      overflow: 'hidden',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.fileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <input type="checkbox" checked={isSel} onChange={() => toggleSel(it.imageId)}
                        style={{ position: 'absolute', top: 6, left: 6, width: 16, height: 16, accentColor: '#F20C8F', cursor: 'pointer' }} />
                      <button onClick={() => downloadOne(it)} title="Download this photo"
                        style={{
                          position: 'absolute', bottom: 6, right: 6,
                          width: 30, height: 30, borderRadius: 6,
                          background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <i className="bi bi-download" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {unlockCode && (
                <div style={{
                  marginTop: 14, padding: 10, background: '#f9fafb', border: '1px solid #f0f2f5', borderRadius: 8,
                  fontSize: 12, color: '#6b7280',
                }}>
                  Unlock code: <code style={{ background: '#fff', padding: '2px 7px', borderRadius: 4, color: '#054d6f', fontWeight: 700 }}>{unlockCode}</code>
                  &nbsp;- save this to re-download from any device via the recovery page.
                </div>
              )}
            </>
          )}

          {status === 'FAILED' && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>
              Payment failed. Please close this and try again.
            </div>
          )}

          {timedOut && status !== 'COMPLETED' && (
            <div style={{ marginTop: 12, padding: 10, background: '#fffbeb', color: '#92400e', borderRadius: 8, fontSize: 12.5 }}>
              Confirmation is taking longer than usual. We&apos;ll still email everything to <strong>{email}</strong> once it clears.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`@keyframes pmspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
