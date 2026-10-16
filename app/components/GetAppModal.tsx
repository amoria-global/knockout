'use client';

import React, { useEffect, useCallback } from 'react';
import { FaApple, FaGooglePlay } from 'react-icons/fa6';
import { APP_STORE_URL, PLAY_STORE_URL, GET_APP_PAGE_URL, type MobilePlatform } from '@/lib/qr/eventQr';
import QrCodeSvg from './QrCodeSvg';

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

function StoreCta({ kind }: { kind: 'ios' | 'android' }) {
  const ios = kind === 'ios';
  return (
    <a href={ios ? APP_STORE_URL : PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="ga-cta">
      {ios ? <FaApple className="ga-cta-icon" /> : <FaGooglePlay className="ga-cta-icon ga-cta-icon--play" />}
      <span className="ga-cta-text">
        <span className="ga-cta-kicker">{ios ? 'Download on the' : 'Get it on'}</span>
        <span className="ga-cta-name">{ios ? 'Apple App Store' : 'Google Play Store'}</span>
      </span>
    </a>
  );
}

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
                <StoreCta kind={isIos ? 'ios' : 'android'} />
                <a
                  href={isIos ? PLAY_STORE_URL : APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ga-alt"
                >
                  {isIos ? <FaGooglePlay className="ga-alt-icon" /> : <FaApple className="ga-alt-icon" />}
                  <span>{isIos ? 'Also available on Google Play' : 'Also available on Apple App Store'}</span>
                </a>
              </>
            ) : (
              <div className="ga-desk">
                <div className="ga-qr">
                  <QrCodeSvg value={GET_APP_PAGE_URL} size={136} fgColor="#083A85" />
                  <span className="ga-chip ga-chip--soft">
                    <i className="bi bi-camera" /> Scan with phone camera
                  </span>
                </div>
                <div className="ga-desk-links">
                  <span className="ga-chip ga-chip--plain">
                    <span className="ga-dot" /> Or download directly
                  </span>
                  <StoreCta kind="ios" />
                  <StoreCta kind="android" />
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
                  <div className="ga-card-top">
                    <span className={`ga-icon ga-icon--${f.tone}`}><i className={`bi ${f.icon}`} /></span>
                    <span className={`ga-tag ga-tag--${f.tagTone}`}>
                      {f.live ? <span className="ga-live-dot" /> : null}
                      {f.tag}
                    </span>
                  </div>
                  <h4 className="ga-card-title">{f.title}</h4>
                  <p className="ga-card-body">{f.body}</p>
                </article>
              ))}
            </div>
          </section>

          <footer className="ga-trust">
            <span className="ga-trust-main"><i className="bi bi-shield-check" /> Official Connekyt Client</span>
            <span>Free on iOS &amp; Android</span>
            <span>Original RAW/JPEG Exports</span>
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
.ga-close{position:absolute;top:18px;right:14px;z-index:2;width:40px;height:40px;border-radius:50%;border:0;cursor:pointer;
  display:flex;align-items:center;justify-content:center;color:#475569;background:rgba(8,58,133,.07);font-size:15px;transition:background .15s,color .15s}
.ga-close:hover{background:rgba(8,58,133,.14);color:#083A85}
.ga-close:focus-visible,.ga-cta:focus-visible,.ga-alt:focus-visible{outline:3px solid #F20C8F;outline-offset:2px}
.ga-body{overflow-y:auto;padding:14px 20px calc(24px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:20px}
.ga-head{display:flex;align-items:center;gap:14px;padding-right:48px}
.ga-logo{flex:none;width:56px;height:56px;padding:8px;border-radius:16px;background:#fff;border:1px solid rgba(8,58,133,.15);
  box-shadow:0 8px 24px rgba(8,58,133,.14);display:flex;align-items:center;justify-content:center}
.ga-logo img{width:100%;height:100%;object-fit:contain}
.ga-head-text{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.ga-badge{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;color:#083A85;background:rgba(8,58,133,.09);border:1px solid rgba(8,58,133,.15)}
.ga-badge .bi{color:#F20C8F;font-size:11px}
.ga-title{font-size:20px;line-height:1.2;font-weight:900;color:#083A85;margin:0}
.ga-intro{font-size:14.5px;line-height:1.55;color:#475569;margin:0}
.ga-action{padding:16px;border-radius:18px;border:1px solid rgba(8,58,133,.16);
  background:linear-gradient(135deg,rgba(8,58,133,.05),rgba(15,79,182,.07) 50%,rgba(242,12,143,.04));
  box-shadow:0 4px 20px -2px rgba(8,58,133,.08)}
.ga-meta{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 10px;margin-bottom:12px}
.ga-meta--section{margin-bottom:10px}
.ga-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;color:#083A85;background:rgba(8,58,133,.09);border:1px solid rgba(8,58,133,.18);line-height:1.2}
.ga-chip--soft{font-size:11px;letter-spacing:.03em;text-transform:none;background:rgba(8,58,133,.07)}
.ga-chip--plain{background:transparent;border-color:transparent;padding-left:0}
.ga-chip .bi{color:#F20C8F}
.ga-dot{width:7px;height:7px;border-radius:50%;background:#F20C8F;flex:none}
.ga-free{font-size:12.5px;font-weight:600;color:#083A85}
.ga-cta{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;padding:14px 20px;border-radius:14px;color:#fff;
  text-decoration:none;background:linear-gradient(135deg,#083A85,#0F4FB6);box-shadow:0 8px 24px -4px rgba(8,58,133,.45);
  transition:transform .15s,box-shadow .15s,background .15s;border:1px solid rgba(255,255,255,.15)}
.ga-cta:hover{background:linear-gradient(135deg,#062D6B,#083A85);transform:translateY(-1px)}
.ga-cta-icon{font-size:26px;flex:none}
.ga-cta-icon--play{font-size:22px}
.ga-cta-text{display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left}
.ga-cta-kicker{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;line-height:1}
.ga-cta-name{font-size:17px;font-weight:700;line-height:1.1}
.ga-alt{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;font-size:13px;font-weight:600;color:#475569;text-decoration:none}
.ga-alt:hover{color:#083A85}
.ga-alt-icon{font-size:13px;color:#083A85}
.ga-desk{display:flex;flex-direction:column;align-items:center;gap:20px}
.ga-qr{display:flex;flex-direction:column;align-items:center;gap:10px;flex:none}
.ga-desk-links{display:flex;flex-direction:column;gap:10px;width:100%}
.ga-desk-links .ga-cta{justify-content:flex-start;padding:11px 16px}
.ga-desk-links .ga-cta-name{font-size:15px}
.ga-desk-links .ga-cta-kicker{font-size:9.5px}
.ga-section-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#64748b}
.ga-grid{display:grid;grid-template-columns:1fr;gap:10px}
.ga-card{padding:14px;border-radius:14px;border:1px solid rgba(148,163,184,.45);background:#fff;transition:border-color .2s,box-shadow .2s}
.ga-card:hover{border-color:rgba(8,58,133,.35);box-shadow:0 2px 10px rgba(8,58,133,.08)}
.ga-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.ga-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;flex:none}
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
.ga-card-title{font-size:14.5px;font-weight:700;line-height:1.25;color:#0f172a;margin:0}
.ga-card-body{font-size:13px;line-height:1.45;color:#475569;margin:4px 0 0}
.ga-trust{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 16px;padding-top:14px;
  border-top:1px solid #e2e8f0;font-size:12px;color:#64748b}
.ga-trust-main{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:#475569}
.ga-trust-main .bi{color:#083A85}
@media (min-width:640px){
  .ga-overlay{align-items:center;padding:16px}
  .ga-sheet{border-radius:24px}
  .ga-handle{display:none}
  .ga-close{top:22px;right:20px}
  .ga-body{padding:26px 32px 32px;gap:22px}
  .ga-logo{width:64px;height:64px}
  .ga-title{font-size:26px}
  .ga-intro{font-size:15.5px}
  .ga-action{padding:20px}
  .ga-desk{flex-direction:row;gap:24px}
  .ga-desk-links{flex:1}
  .ga-grid{grid-template-columns:repeat(3,1fr)}
}
@media (prefers-reduced-motion:reduce){.ga-live-dot{animation:none}.ga-cta{transition:none}}
`;
