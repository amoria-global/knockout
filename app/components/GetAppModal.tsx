'use client';

import React, { useEffect, useCallback } from 'react';
import { GET_APP_PAGE_URL, type MobilePlatform } from '@/lib/qr/eventQr';
import QrCodeSvg from './QrCodeSvg';
import { StoreBadges } from './StoreBadges';

interface GetAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlatform?: MobilePlatform;
}

const FEATURES = [
  { icon: 'bi-person-bounding-box', tone: 'navy', tag: '0.3s match', tagTone: 'green', live: false, title: 'Instant Face Match', body: 'One selfie filters thousands of gallery photos down to only yours.' },
  { icon: 'bi-broadcast', tone: 'pink', tag: 'Live 1080p', tagTone: 'red', live: true, title: 'Ceremony Streaming', body: 'Watch milestones live with zero audio lag, guest chat, and gifts.' },
  { icon: 'bi-bell-fill', tone: 'blue', tag: 'Lock screen', tagTone: 'blue', live: false, title: 'Lock Screen Push', body: 'Instant alerts as photographers upload. No email waiting.' },
];

export default function GetAppModal({
  isOpen,
  onClose,
  userPlatform = null,
}: GetAppModalProps): React.JSX.Element | null {
  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isIos = userPlatform === 'ios';
  const isAndroid = userPlatform === 'android';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="get-app-modal-title"
      className="ga-overlay"
      onClick={onClose}
    >
      <style>{GET_APP_CSS}</style>
      <div className="ga-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ga-bar" />
        <div className="ga-handle" aria-hidden="true"><span /></div>

        <button type="button" onClick={onClose} aria-label="Close modal" className="ga-close">
          <i className="bi bi-x-lg" />
        </button>

        <div className="ga-body">
          <header className="ga-head">
            <div className="ga-logo">
              <img src="/logo.png" alt="Connekyt Logo" />
            </div>
            <div className="ga-head-text">
              <span className="ga-badge">
                <i className="bi bi-stars" /> Mobile App
              </span>
              <h3 id="get-app-modal-title" className="ga-title">Get Connekyt on Mobile</h3>
            </div>
          </header>

          <p className="ga-intro">
            Find your event photos in seconds with AI face scanning, join real-time live ceremonies, and get instant updates straight on your device.
          </p>

          <section className="ga-action">
            {isIos || isAndroid ? (
              <>
                <div className="ga-meta">
                  <span className="ga-chip">
                    <span className="ga-dot" /> {isIos ? 'Best for your iPhone' : 'Best for your Android'}
                  </span>
                  <span className="ga-free">{isIos ? 'Free • App Store' : 'Free • Google Play'}</span>
                </div>
                <StoreBadges size="md" first={isIos ? 'ios' : 'android'} align="center" />
              </>
            ) : (
              <div className="ga-desk">
                <div className="ga-qr">
                  <QrCodeSvg value={GET_APP_PAGE_URL} size={108} fgColor="#083A85" />
                  <span className="ga-chip ga-chip--soft">
                    <i className="bi bi-camera" /> Scan with phone camera
                  </span>
                </div>
                <div className="ga-desk-links">
                  <span className="ga-chip ga-chip--plain">
                    <span className="ga-dot" /> Or download directly
                  </span>
                  <StoreBadges size="md" />
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="ga-meta ga-meta--section">
              <span className="ga-section-label">Core mobile capabilities</span>
              <span className="ga-chip ga-chip--soft">Native iOS &amp; Android</span>
            </div>
            <div className="ga-grid">
              {FEATURES.map((f) => (
                <article key={f.title} className="ga-card">
                  <span className={`ga-icon ga-icon--${f.tone}`}><i className={`bi ${f.icon}`} /></span>
                  <div className="ga-card-main">
                    <div className="ga-card-row">
                      <h4 className="ga-card-title">{f.title}</h4>
                      <span className={`ga-tag ga-tag--${f.tagTone}`}>
                        {f.live ? <span className="ga-live-dot" /> : null}
                        {f.tag}
                      </span>
                    </div>
                    <p className="ga-card-body">{f.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <footer className="ga-trust">
            <span className="ga-trust-item"><i className="bi bi-shield-check" /> Official Connekyt client</span>
            <span className="ga-trust-item"><i className="bi bi-phone" /> Free on iOS &amp; Android</span>
            <span className="ga-trust-item"><i className="bi bi-image" /> Original RAW/JPEG exports</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

/*
 * Scoped styles. The site's global `* { margin: 0; padding: 0 }` is unlayered, so it beats
 * Tailwind v4's layered utilities and zeroed every p-* and m-* this modal used. Plain class
 * rules win over the universal selector, so the spacing lives here and stays put.
 */
const GET_APP_CSS = `
.ga-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-end;justify-content:center;
  background:rgba(5,8,20,.78);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);overflow-y:auto}
.ga-sheet{position:relative;display:flex;flex-direction:column;width:100%;max-width:560px;max-height:92vh;
  background:#fff;border-radius:24px 24px 0 0;overflow:hidden;border:1px solid rgba(8,58,133,.16);
  box-shadow:0 25px 65px -12px rgba(8,58,133,.38)}
@supports (height:1dvh){.ga-sheet{max-height:92dvh}}
.ga-bar{height:6px;flex:none;background:linear-gradient(90deg,#083A85 0%,#0F4FB6 45%,#F20C8F 100%)}
.ga-handle{display:flex;justify-content:center;padding:10px 0 2px;flex:none}
.ga-handle span{width:40px;height:5px;border-radius:999px;background:#cbd5e1}
.ga-close{position:absolute;top:18px;right:14px;z-index:2;width:44px;height:44px;border-radius:50%;border:0;cursor:pointer;
  display:flex;align-items:center;justify-content:center;color:#475569;background:rgba(8,58,133,.07);font-size:15px;transition:background .15s,color .15s}
.ga-close:hover{background:rgba(8,58,133,.14);color:#083A85}
.ga-close:focus-visible{outline:3px solid #F20C8F;outline-offset:2px}
.ga-body{overflow-y:auto;padding:8px 16px calc(16px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px;background:radial-gradient(120% 40% at 0% 0%,rgba(15,79,182,.09),transparent 65%),radial-gradient(80% 30% at 100% 0%,rgba(242,12,143,.06),transparent 70%)}
.ga-head{display:flex;align-items:center;gap:12px;padding-right:50px}
.ga-logo{flex:none;width:50px;height:50px;padding:8px;border-radius:15px;background:#fff;border:1px solid rgba(8,58,133,.14);box-shadow:0 8px 22px rgba(8,58,133,.16);display:flex;align-items:center;justify-content:center}
.ga-logo img{width:100%;height:100%;object-fit:contain}
.ga-head-text{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.ga-badge{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;color:#083A85;background:rgba(8,58,133,.09);border:1px solid rgba(8,58,133,.15)}
.ga-badge .bi{color:#F20C8F;font-size:11px}

.ga-title{font-size:19px;line-height:1.15;font-weight:900;letter-spacing:-.01em;margin:0;background:linear-gradient(90deg,#083A85,#0F4FB6 70%,#6D3FB5);-webkit-background-clip:text;background-clip:text;color:transparent}
.ga-intro{font-size:13.5px;line-height:1.5;color:#475569;margin:0;max-width:46ch}

.ga-action{padding:12px;border-radius:20px;border:1px solid rgba(8,58,133,.14);background:linear-gradient(145deg,rgba(255,255,255,.9),rgba(235,243,255,.85) 55%,rgba(255,240,248,.8));box-shadow:0 10px 30px -12px rgba(8,58,133,.28),inset 0 1px 0 #fff}
.ga-meta{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 10px;margin-bottom:10px}
.ga-meta--section{margin-bottom:10px}
.ga-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;color:#083A85;background:rgba(8,58,133,.09);border:1px solid rgba(8,58,133,.18);line-height:1.2}
.ga-chip--soft{font-size:11px;letter-spacing:.03em;text-transform:none;background:rgba(8,58,133,.07)}
.ga-chip--plain{background:transparent;border-color:transparent;padding-left:0}
.ga-chip .bi{color:#F20C8F}
.ga-dot{width:7px;height:7px;border-radius:50%;background:#F20C8F;flex:none}
.ga-free{font-size:12.5px;font-weight:600;color:#083A85}

.ga-desk{display:flex;flex-direction:column;align-items:center;gap:20px}
.ga-qr{display:flex;flex-direction:column;align-items:center;gap:10px;flex:none}
.ga-desk-links{display:flex;flex-direction:column;gap:10px;width:100%}
.ga-section-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#64748b}
.ga-grid{display:grid;grid-template-columns:1fr;gap:8px}
.ga-card{position:relative;display:grid;grid-template-columns:36px 1fr;column-gap:12px;align-items:start;padding:10px 12px;border-radius:14px;border:1px solid rgba(148,163,184,.4);background:#fff;transition:border-color .2s,box-shadow .2s,transform .2s}
.ga-card:hover{border-color:rgba(8,58,133,.35);box-shadow:0 10px 24px -12px rgba(8,58,133,.3);transform:translateY(-2px)}
.ga-card-main{min-width:0}
.ga-card-row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.ga-icon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:15px;flex:none}
.ga-icon--navy{background:rgba(8,58,133,.1);color:#083A85}
.ga-icon--pink{background:rgba(242,12,143,.1);color:#F20C8F}
.ga-icon--blue{background:rgba(15,79,182,.1);color:#0F4FB6}
.ga-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:7px;font-size:10.5px;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;border:1px solid transparent;line-height:1.2;white-space:nowrap}
.ga-tag--green{color:#047857;background:#ecfdf5;border-color:rgba(167,243,208,.9)}
.ga-tag--red{color:#b91c1c;background:#fef2f2;border-color:rgba(254,202,202,.9)}
.ga-tag--blue{color:#1d4ed8;background:#eff6ff;border-color:rgba(191,219,254,.9)}
.ga-live-dot{width:7px;height:7px;border-radius:50%;background:#dc2626;animation:ga-pulse 1.4s ease-in-out infinite}
@keyframes ga-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.ga-card-title{font-size:14px;font-weight:800;line-height:1.25;color:#0f172a;margin:0}
.ga-card-body{font-size:12.5px;line-height:1.4;color:#475569;margin:2px 0 0}

.ga-trust{display:none;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 14px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b}
.ga-trust-item{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-weight:600;color:#475569}
.ga-trust-item .bi{color:#083A85;font-size:14px}
@keyframes ga-fade{from{opacity:0}to{opacity:1}}
@keyframes ga-rise{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes ga-pop{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:none}}
.ga-overlay{animation:ga-fade .2s ease-out}
.ga-sheet{animation:ga-rise .3s cubic-bezier(.2,.8,.2,1)}
@media (min-width:640px){
  .ga-overlay{align-items:center;padding:16px}
  .ga-sheet{border-radius:24px;max-width:600px;animation-name:ga-pop}
  .ga-handle{display:none}
  .ga-close{top:18px;right:18px}
  .ga-body{padding:20px 28px 22px;gap:16px}
  .ga-logo{width:56px;height:56px}
  .ga-title{font-size:24px}
  .ga-intro{font-size:14.5px;max-width:none}
  .ga-trust{display:flex;padding-top:12px}
  .ga-action{padding:14px 18px}
  .ga-desk{flex-direction:row;gap:22px;align-items:center}
  .ga-desk-links{flex:1}
  .ga-qr{gap:8px}
}
@media (prefers-reduced-motion:reduce){.ga-live-dot,.ga-overlay,.ga-sheet{animation:none}.ga-card{transition:none}.ga-card:hover{transform:none}}
`;
