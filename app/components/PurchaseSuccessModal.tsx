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

  /**
   * Originals of sold-per-photo albums are gated server-side
   * (PaidMediaAccessGuard), so every request for one has to carry this
   * purchase's refid. Without it the buyer's own photos come back 403.
   */
  const withRefid = (url: string) =>
    !url || url.includes('refid=') ? url : `${url}${url.includes('?') ? '&' : '?'}refid=${encodeURIComponent(refid)}`;

  const downloadOne = (it: PurchasedItem) => {
    const a = document.createElement('a');
    a.href = withRefid(it.fileUrl);
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
      position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.75)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 14,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 22, width: '100%', maxWidth: 880,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6)', overflow: 'hidden', position: 'relative',
      }}>
        <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85, #F20C8F 60%, #03969C)', opacity: 0.9 }} />
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: status === 'COMPLETED' ? 'rgba(16,185,129,0.14)' : status === 'FAILED' ? 'rgba(239,68,68,0.12)' : 'rgba(3,150,156,0.14)',
            border: `1px solid ${status === 'COMPLETED' ? 'rgba(16,185,129,0.5)' : status === 'FAILED' ? 'rgba(239,68,68,0.5)' : 'rgba(3,150,156,0.4)'}`,
          }}>
            {status === 'COMPLETED' ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            ) : status === 'FAILED' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(3,150,156,0.3)', borderTopColor: '#03969c', animation: 'pmspin 0.8s linear infinite' }} />
            )}
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 className="pm-serif" style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#fff' }}>
              {status === 'COMPLETED' ? 'Your photos are ready.' :
               status === 'FAILED' ? "Payment didn't go through." :
               'Waiting for confirmation…'}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              {status === 'COMPLETED'
                ? <>ZIP emailed to <strong style={{ color: '#fff' }}>{email}</strong> · also auto-downloading here</>
                : status === 'PENDING'
                  ? <>You don&apos;t need to keep this open, everything also goes to <strong style={{ color: '#fff' }}>{email}</strong>.</>
                  : <>You weren&apos;t charged. Close this and try again from your cart.</>}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            marginLeft: 'auto', width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
            cursor: 'pointer', fontSize: 17, color: 'rgba(255,255,255,0.6)', flexShrink: 0,
          }}>×</button>
        </div>

        <div style={{ padding: '14px 24px 20px', overflowY: 'auto' }}>
          {status === 'PENDING' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '34px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#F20C8F', animation: 'pmspin 0.8s linear infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, fontWeight: 600 }}>Watching for the gateway&apos;s confirmation…</span>
            </div>
          )}

          {status === 'COMPLETED' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: '#F20C8F' }} />
                  All ({items.length})
                </label>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>· {selected.size} selected</span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={downloadSelected} disabled={selected.size === 0}
                    style={{
                      padding: '8px 14px', borderRadius: 10, border: 0,
                      background: selected.size === 0 ? 'rgba(255,255,255,0.08)' : '#F20C8F',
                      color: selected.size === 0 ? 'rgba(255,255,255,0.35)' : '#fff',
                      fontWeight: 800, fontSize: 12.5, cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                    }}>
                    <i className="bi bi-download" style={{ marginRight: 6 }} /> Download selected
                  </button>
                  <a href={`${BACKEND_BASE}/api/public/content/purchase/${refid}/download`}
                    download={`connekyt-photos-${refid}.zip`}
                    style={{
                      padding: '8px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.16)',
                      color: '#fff', textDecoration: 'none',
                      fontWeight: 700, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                    <i className="bi bi-file-zip" /> ZIP again
                  </a>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {items.map(it => {
                  const isSel = selected.has(it.imageId);
                  return (
                    <div key={it.imageId} style={{
                      position: 'relative', aspectRatio: '1', background: '#0b1930',
                      border: isSel ? '2px solid #F20C8F' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, overflow: 'hidden',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={withRefid(it.fileUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <input type="checkbox" checked={isSel} onChange={() => toggleSel(it.imageId)}
                        style={{ position: 'absolute', top: 7, left: 7, width: 16, height: 16, accentColor: '#F20C8F', cursor: 'pointer' }} />
                      <button onClick={() => downloadOne(it)} title="Download this photo"
                        style={{
                          position: 'absolute', bottom: 7, right: 7,
                          width: 30, height: 30, borderRadius: 8,
                          background: 'rgba(0,0,0,0.65)', color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
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
                  marginTop: 14, padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.18)',
                  fontSize: 12, color: 'rgba(255,255,255,0.55)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                }}>
                  <span>Unlock code, save it to re-download from any device:</span>
                  <code style={{ color: '#7be0e5', fontWeight: 800, letterSpacing: '0.08em' }}>{unlockCode}</code>
                </div>
              )}
            </>
          )}

          {status === 'FAILED' && (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#fca5a5', fontWeight: 600, fontSize: 13.5 }}>
              Payment failed. You weren&apos;t charged, close this and try again from your cart.
            </div>
          )}

          {timedOut && status !== 'COMPLETED' && (
            <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: 'rgba(255,255,255,0.75)', fontSize: 12.5, lineHeight: 1.55 }}>
              Confirmation is taking longer than usual. We&apos;ll still email everything to <strong style={{ color: '#fcd34d' }}>{email}</strong> once it clears, you can close this safely.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Bodoni:ital,wght@0,500;0,600;0,700;1,500&display=swap');
        .pm-serif { font-family: 'Libre Bodoni', Georgia, 'Times New Roman', serif; }
        @keyframes pmspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
