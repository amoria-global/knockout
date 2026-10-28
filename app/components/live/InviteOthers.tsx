'use client';

import { useEffect, useState } from 'react';
import { downloadQr, qrDataUrl, wishLink } from '@/lib/live/qr';
import { Icon } from './icons';

/**
 * Section 6: copy the wish link and save its QR as a PNG. The link opens the event on its wishes section. Same props on
 * mobile, where Share link opens the native share sheet instead of copying.
 */
export function InviteOthers({ eventId, title, prominent }: { eventId: string; title: string; prominent?: boolean }) {
  const link = wishLink(eventId);
  const [qr, setQr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    qrDataUrl(link, 240).then((u) => live && setQr(u)).catch(() => live && setQr(null));
    return () => {
      live = false;
    };
  }, [link]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote('Link copied.');
    } catch {
      setNote('Could not copy. Select and copy the link from the address bar of that page.');
    }
  };
  const onSave = async () => {
    try {
      await downloadQr(link, eventId);
      setNote('QR saved as a PNG.');
    } catch {
      setNote('Could not save the QR. Please try again.');
    }
  };

  return (
    <section className="lv-card" aria-label={`Invite others to ${title}`}>
      <div>
        <h3>Invite others</h3>
        <p className="lv-sub">{prominent ? 'Share the link so guests can send you wishes.' : 'Share the link or the QR code.'}</p>
      </div>
      <div className="lv-invite">
        <div className="lv-invite-actions">
          <button type="button" className={`lv-btn${prominent ? ' lv-btn--primary' : ''}`} onClick={onCopy}>
            <Icon name="share" size={16} /> Share link
          </button>
          <button type="button" className="lv-btn" onClick={onSave}>
            <Icon name="download" size={16} /> Save QR
          </button>
        </div>
        {/* A data: URL made in the browser; next/image has nothing to optimise here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="lv-qr">{qr ? <img src={qr} alt="QR code for the wish link" /> : null}</div>
      </div>
      <p className="lv-note" role="status" aria-live="polite">
        {note}
      </p>
    </section>
  );
}
