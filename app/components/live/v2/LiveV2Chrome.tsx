'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InviteOthers } from '../InviteOthers';
import { WatchOnTv } from '../WatchOnTv';
import { downloadQr, qrDataUrl } from '@/lib/live/qr';

type View = null | 'more' | 'qr' | 'invite';

/**
 * Everything the new layout draws over and around the player: the top bar (back, LIVE, viewer count, Watch on TV, more),
 * the labelled action chips for wide screens, the more sheet, and the share card with its QR code. It calls the page's
 * existing handlers and the existing Watch on TV and invite components and adds no stream, payment, gift or wish logic.
 *
 * Quality and Report are not offered: the stream exposes no quality levels and there is no stream-level report yet.
 */
export function LiveV2Chrome({
  eventId,
  title,
  live,
  viewers,
  isAuthenticated,
  invitesOn,
  userHasRated,
  onBack,
  onRate,
}: {
  eventId: string;
  title: string;
  live: boolean;
  viewers: number | null;
  isAuthenticated: boolean;
  invitesOn: boolean;
  userHasRated: boolean;
  onBack: () => void;
  onRate: () => void;
}) {
  const [view, setView] = useState<View>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const tvSlot = useRef<HTMLSpanElement>(null);
  const [barHost, setBarHost] = useState<HTMLElement | null>(null);
  const pageUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const canPip = typeof document !== 'undefined' && !!document.pictureInPictureEnabled;

  // The top bar sits over the player itself, so it is drawn into the player's element. The player mounts a moment after
  // the page, so look for it a few times.
  useEffect(() => {
    let tries = 0;
    let t: ReturnType<typeof setTimeout>;
    const find = () => {
      const el = document.getElementById('main-video-player');
      if (el) setBarHost(el);
      else if (tries++ < 40) t = setTimeout(find, 250);
    };
    find();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (view !== 'qr' || !pageUrl) return;
    let alive = true;
    qrDataUrl(pageUrl, 440).then((u) => alive && setQr(u)).catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [view, pageUrl]);

  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setView(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view]);

  const close = useCallback(() => {
    setView(null);
    setNote(null);
  }, []);

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, url: pageUrl });
      else {
        await navigator.clipboard.writeText(pageUrl);
        setNote('Link copied.');
      }
    } catch {
      /* dismissed */
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setNote('Link copied.');
    } catch {
      setNote('Could not copy. Copy the link from the address bar.');
    }
  };
  const saveQr = async () => {
    try {
      await downloadQr(pageUrl, eventId);
      setNote('QR saved as a PNG.');
    } catch {
      setNote('Could not save the QR. Please try again.');
    }
  };
  const pip = async () => {
    close();
    try {
      const v = document.querySelector<HTMLVideoElement>('#main-video-player video');
      if (v && document.pictureInPictureElement !== v) await v.requestPictureInPicture();
    } catch {
      /* the browser refused; nothing to undo */
    }
  };
  const openTv = () => {
    close();
    tvSlot.current?.querySelector<HTMLButtonElement>('button')?.click();
  };
  const signInHref = `/user/auth/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')}`;
  const tvAvailable = live;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} is live: ${pageUrl}`)}`;

  return (
    <>
      {barHost ? createPortal(
      <div className="ls-v2-bar">
        <div className="ls-v2-bar-l">
          <button type="button" className="ls-v2-btn" onClick={onBack} aria-label="Back">
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
          {live ? (
            <span className="ls-v2-pill ls-v2-pill--live">
              <span className="ls-v2-dot" aria-hidden="true" />
              LIVE
            </span>
          ) : null}
          {viewers && viewers > 0 ? (
            <span className="ls-v2-pill">
              <i className="bi bi-eye" aria-hidden="true" />
              {viewers.toLocaleString()}
            </span>
          ) : null}
        </div>
        <div className="ls-v2-bar-r">
          {tvAvailable ? (
            isAuthenticated ? (
              <span className="ls-v2-tvslot" ref={tvSlot}>
                <WatchOnTv eventId={eventId} enabled />
              </span>
            ) : (
              <a className="ls-v2-btn" href={signInHref} aria-label="Sign in to pair a TV" title="Sign in to pair a TV">
                <i className="bi bi-cast" aria-hidden="true" />
              </a>
            )
          ) : null}
          <button type="button" className="ls-v2-btn" onClick={() => setView('more')} aria-label="More" aria-haspopup="dialog">
            <i className="bi bi-three-dots" aria-hidden="true" />
          </button>
        </div>
      </div>,
        barHost,
      ) : null}

      {view ? <div className="ls-v2-scrim" onClick={close} aria-hidden="true" /> : null}

      {view === 'more' ? (
        <div className="ls-v2-sheet" role="dialog" aria-label="More">
          <div className="ls-v2-grab" />
          <h3>More</h3>
          {tvAvailable ? (
            isAuthenticated ? (
              <button type="button" className="ls-v2-row" onClick={openTv}>
                <span className="ls-v2-ico"><i className="bi bi-cast" /></span>
                <span>Watch on TV<small>Send this live to your paired TV</small></span>
              </button>
            ) : (
              <a className="ls-v2-row" href={signInHref}>
                <span className="ls-v2-ico"><i className="bi bi-cast" /></span>
                <span>Watch on TV<small>Sign in to pair a TV</small></span>
              </a>
            )
          ) : null}
          <button type="button" className="ls-v2-row" onClick={() => { setNote(null); setView('qr'); }}>
            <span className="ls-v2-ico"><i className="bi bi-qr-code" /></span>
            <span>Share with QR code<small>Link, QR, WhatsApp</small></span>
          </button>
          {invitesOn ? (
            <button type="button" className="ls-v2-row" onClick={() => setView('invite')}>
              <span className="ls-v2-ico"><i className="bi bi-person-plus" /></span>
              <span>Invite viewers<small>Allowed by the host</small></span>
            </button>
          ) : null}
          {canPip ? (
            <button type="button" className="ls-v2-row" onClick={pip}>
              <span className="ls-v2-ico"><i className="bi bi-pip" /></span>
              <span>Picture in picture<small>Keep watching while you browse</small></span>
            </button>
          ) : null}
          <button type="button" className="ls-v2-row" onClick={() => { close(); if (!userHasRated) onRate(); }} disabled={userHasRated}>
            <span className="ls-v2-ico"><i className="bi bi-star" /></span>
            <span>{userHasRated ? 'Rated, thank you' : 'Rate this live'}<small>Tell the host how it went</small></span>
          </button>
        </div>
      ) : null}

      {view === 'qr' ? (
        <div className="ls-v2-sheet ls-v2-qr" role="dialog" aria-label="Share this live">
          <div className="ls-v2-grab" />
          <h3>Share this live</h3>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ls-v2-qr-img" src={qr} alt={`QR code for ${title}`} />
          ) : (
            <p className="ls-v2-note" aria-live="polite">Making the QR code…</p>
          )}
          <div className="ls-v2-qr-link">
            <span>{pageUrl.replace(/^https?:\/\//, '')}</span>
            <button type="button" className="ls-v2-chip" onClick={copy}>Copy</button>
          </div>
          <div className="ls-v2-qr-actions">
            <a className="ls-v2-chip" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <button type="button" className="ls-v2-chip" onClick={share}>More apps</button>
            <button type="button" className="ls-v2-chip" onClick={saveQr}>Save QR</button>
          </div>
          {note ? <p className="ls-v2-note" role="status">{note}</p> : null}
        </div>
      ) : null}

      {view === 'invite' ? (
        <div className="ls-v2-sheet" role="dialog" aria-label="Invite viewers">
          <div className="ls-v2-grab" />
          <InviteOthers eventId={eventId} title={title} />
        </div>
      ) : null}

      <div className="ls-v2-chips" aria-label="Actions">
        <button type="button" className="ls-v2-chip" onClick={share}><i className="bi bi-share" aria-hidden="true" /> Share</button>
        <button type="button" className="ls-v2-chip" onClick={() => { setNote(null); setView('qr'); }}><i className="bi bi-qr-code" aria-hidden="true" /> QR code</button>
        {tvAvailable ? (
          isAuthenticated ? (
            <button type="button" className="ls-v2-chip" onClick={openTv}><i className="bi bi-cast" aria-hidden="true" /> Watch on TV</button>
          ) : (
            <a className="ls-v2-chip" href={signInHref}><i className="bi bi-cast" aria-hidden="true" /> Watch on TV</a>
          )
        ) : null}
        {invitesOn ? (
          <button type="button" className="ls-v2-chip" onClick={() => setView('invite')}><i className="bi bi-person-plus" aria-hidden="true" /> Invite</button>
        ) : null}
        <button type="button" className="ls-v2-chip" onClick={() => setView('more')} aria-label="More"><i className="bi bi-three-dots" aria-hidden="true" /></button>
      </div>
    </>
  );
}
