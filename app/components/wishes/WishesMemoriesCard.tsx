'use client';

import { useEffect, useState } from 'react';
import { downloadQr, qrDataUrl } from '@/lib/live/qr';
import { HEARTFELT_LINE, sanitizeFrom, wishLink } from '@/lib/wishes/wishPage';
import { loadWishIdentity, WishForm } from './WishForm';

type Tab = 'send' | 'invite';

/**
 * The Wishes & memories card: one card, two tabs. "Send my wish" is the existing form; "Invite loved ones" shows the QR for
 * the wish page with Share link (the Web Share API, else it copies), Copy and Save QR. The heartfelt line sits under the card.
 * Same structure on mobile, where Share link opens the native share sheet.
 */
export function WishesMemoriesCard({ eventId, title }: { eventId: string; title: string }) {
  const [tab, setTab] = useState<Tab>('send');
  const [firstName, setFirstName] = useState('');
  useEffect(() => {
    setFirstName((loadWishIdentity().name ?? '').split(' ')[0]);
  }, []);
  return (
    <>
      <section className="wm-card wm" id="wishes" aria-labelledby="wm-title">
        <div className="wm-head">
          <span className="wm-ico wm-ico--pink"><i className="bi bi-heart-fill" aria-hidden="true" /></span>
          <div>
            <h2 className="wm-title" id="wm-title">Wishes &amp; memories</h2>
            <p className="wm-sub">Shown on screen during the event</p>
          </div>
        </div>
        <div className="wm-seg" role="tablist" aria-label="Wishes and memories">
          <button type="button" role="tab" id="wm-tab-send" aria-selected={tab === 'send'} aria-controls="wm-panel" onClick={() => setTab('send')}>Send my wish</button>
          <button type="button" role="tab" id="wm-tab-invite" aria-selected={tab === 'invite'} aria-controls="wm-panel" onClick={() => setTab('invite')}>Invite loved ones</button>
        </div>
        <div id="wm-panel" role="tabpanel" aria-labelledby={tab === 'send' ? 'wm-tab-send' : 'wm-tab-invite'}>
          {tab === 'send' ? <WishForm eventId={eventId} variant="card" onIdentity={(n) => setFirstName(n.split(' ')[0])} /> : <InviteTab eventId={eventId} title={title} from={firstName} />}
        </div>
      </section>
      <p className="wm wm-heart"><i className="bi bi-heart" aria-hidden="true" /><span>{HEARTFELT_LINE}</span></p>
    </>
  );
}

function InviteTab({ eventId, title, from }: { eventId: string; title: string; from: string }) {
  const link = wishLink(eventId, sanitizeFrom(from));
  const [qr, setQr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    qrDataUrl(link, 240).then((u) => live && setQr(u)).catch(() => live && setQr(null));
    return () => {
      live = false;
    };
  }, [link]);

  const copy = async (done: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setNote(done);
    } catch {
      setNote('Could not copy the link. Copy it from the address bar of the wish page.');
    }
  };
  const onShare = async () => {
    setNote(null);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `Send a wish · ${title}`, text: `Send a wish for "${title}"`, url: link });
        return;
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return;
      }
    }
    await copy('Link copied. Paste it anywhere.');
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
    <div className="wm-col">
      <div className="wm-invite">
        <div className="wm-qr">
          {qr ? <img src={qr} alt="QR code for wish link" width={112} height={112} /> : null}
        </div>
        <div className="wm-invite-actions">
          <p className="wm-sub" style={{ margin: 0 }}>They scan or open the link, see this event, and send their wish. No account needed.</p>
          <button type="button" className="wm-btn wm-btn--outline" onClick={onShare}><i className="bi bi-box-arrow-up" aria-hidden="true" /> Share link</button>
          <div className="wm-pair">
            <button type="button" className="wm-btn" onClick={() => copy('Link copied.')}>Copy</button>
            <button type="button" className="wm-btn" onClick={onSave}>Save QR</button>
          </div>
        </div>
      </div>
      {note ? <p className="wm-note" role="status">{note}</p> : null}
    </div>
  );
}
