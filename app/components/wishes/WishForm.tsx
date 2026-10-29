'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getDeviceId } from '@/lib/fingerprint';

const VideoMessageRecorder = dynamic(() => import('../VideoMessageRecorder'), { ssr: false });

const IDENTITY_KEY = 'eventWishIdentity';

/** The cached guest identity, shared with the invite tab so the link can carry the sharer's first name. */
export function loadWishIdentity(): { name?: string; email?: string } {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? (JSON.parse(raw) as { name?: string; email?: string }) : {};
  } catch {
    return {};
  }
}

/**
 * The wish form, moved out of the event page with its behaviour unchanged: the same validation messages, the same
 * text and video endpoints, the same error wording. `variant="card"` is the compact form in the Wishes & memories card
 * (Send wish is a secondary button); `variant="page"` is the shared wish page, where Send wish is the one filled action.
 */
export function WishForm({ eventId, variant = 'card', onIdentity }: { eventId: string; variant?: 'card' | 'page'; onIdentity?: (name: string) => void }) {
  const [wishName, setWishName] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [wishLoading, setWishLoading] = useState(false);
  const [wishError, setWishError] = useState<string | null>(null);
  const [wishSuccess, setWishSuccess] = useState<string | null>(null);
  const [showWishVideoRecorder, setShowWishVideoRecorder] = useState(false);

  // Restore cached wish identity from localStorage
  useEffect(() => {
    const d = loadWishIdentity();
    if (d.name) setWishName(d.name);
  }, []);

  // Only the name is remembered from a wish. An email another form saved under the same key (the event reminder) is kept.
  const cacheWishIdentity = (name: string) => {
    try { localStorage.setItem(IDENTITY_KEY, JSON.stringify({ ...loadWishIdentity(), name })); } catch {}
    onIdentity?.(name);
  };

  const apiBase = () => (typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com'));

  const handleSendTextWish = async () => {
    const name = wishName.trim();
    const message = wishMessage.trim();
    if (!name) { setWishError('Please enter your name.'); return; }
    if (!message) { setWishError('Please write your message.'); return; }
    if (!eventId) return;
    setWishLoading(true);
    setWishError(null);
    setWishSuccess(null);
    try {
      const fp = await getDeviceId();
      const res = await fetch(`${apiBase()}/api/remote/public/events/${eventId}/wishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, deviceFingerprint: fp, ...(variant === 'page' ? { via: 'invite' } : {}) }),
      });
      const data = await res.json();
      if (data.action === 1) {
        setWishSuccess('Your wish was sent to the event organizer!');
        setWishMessage('');
        cacheWishIdentity(name);
        setTimeout(() => setWishSuccess(null), 5000);
      } else {
        const msg = data.message || '';
        if (msg.includes('turned off wish invites')) setWishError(msg);
        else if (msg.includes('closed for this event') || msg.includes('only allowed before')) setWishError('Wishes are closed for this event.');
        else if (msg.includes('rate') || msg.includes('limit')) setWishError('You’re sending wishes too quickly. Please wait a moment.');
        else if (msg.includes('restricted') || msg.includes('blocked')) setWishError('Your message contains restricted content (emails, phone numbers, or links).');
        else setWishError(msg || 'Could not send your wish. Please try again.');
      }
    } catch {
      setWishError('Connection error. Please try again.');
    } finally {
      setWishLoading(false);
    }
  };

  const handleSendVideoWish = async (videoBlob: Blob) => {
    const name = wishName.trim();
    if (!name) { setWishError('Please enter your name first.'); return; }
    if (!eventId) return;
    setWishLoading(true);
    setWishError(null);
    setWishSuccess(null);
    try {
      const fp = await getDeviceId();
      const videoFile = new File([videoBlob], `wish-${Date.now()}.webm`, { type: videoBlob.type || 'video/webm' });
      const formData = new FormData();
      formData.append('name', name);
      formData.append('video', videoFile);
      formData.append('deviceFingerprint', fp);
      if (variant === 'page') formData.append('via', 'invite');
      if (wishMessage.trim()) formData.append('message', wishMessage.trim());
      const res = await fetch(`${apiBase()}/api/remote/public/events/${eventId}/wishes/video`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.action === 1) {
        setWishSuccess('Your video wish was sent to the event organizer!');
        setWishMessage('');
        setShowWishVideoRecorder(false);
        cacheWishIdentity(name);
        setTimeout(() => setWishSuccess(null), 5000);
      } else {
        const msg = data.message || '';
        if (msg.includes('turned off wish invites')) setWishError(msg);
        else if (msg.includes('closed for this event') || msg.includes('only allowed before')) setWishError('Wishes are closed for this event.');
        else if (msg.includes('rate') || msg.includes('limit')) setWishError('You’re sending wishes too quickly. Please wait a moment.');
        else if (msg.includes('size') || msg.includes('large')) setWishError('Video upload failed. Please try a shorter clip.');
        else setWishError(msg || 'Could not send your video wish. Please try again.');
      }
    } catch {
      setWishError('Connection error. Please try again.');
    } finally {
      setWishLoading(false);
    }
  };

  const page = variant === 'page';
  const sendBtn = (
    <button type="button" onClick={handleSendTextWish} disabled={wishLoading || !wishMessage.trim()} className={`wm-btn ${page ? 'wm-btn--fill' : 'wm-btn--outline'}`}>
      {wishLoading ? 'Sending…' : 'Send wish'}
    </button>
  );
  const videoBtn = (
    <button
      type="button"
      onClick={() => {
        if (!wishName.trim()) {
          setWishError('Please enter your name first.');
          return;
        }
        setWishError(null);
        setShowWishVideoRecorder(true);
      }}
      disabled={wishLoading}
      className="wm-btn wm-btn--video"
      aria-label="Record a 1 minute video wish"
    >
      <i className="bi bi-camera-video" aria-hidden="true" />
      {page ? 'Record a 1-minute video wish' : 'Video · 1 min'}
    </button>
  );

  return (
    <div className="wm-form">
      <div className={page ? 'wm-col' : 'wm-row'}>
        <input
          type="text"
          value={wishName}
          onChange={(e) => { setWishName(e.target.value); setWishError(null); }}
          placeholder="Your name"
          aria-label="Your name"
          autoComplete="name"
          disabled={wishLoading}
          className="wm-input"
        />
      </div>
      <textarea
        value={wishMessage}
        onChange={(e) => { setWishMessage(e.target.value); setWishError(null); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && wishMessage.trim()) handleSendTextWish(); }}
        placeholder="Write your message…"
        aria-label="Your message"
        disabled={wishLoading}
        rows={3}
        className="wm-input wm-textarea"
      />
      {wishError && <p className="wm-msg wm-msg--err" role="alert">{wishError}</p>}
      {wishSuccess && <p className="wm-msg wm-msg--ok" role="status">{wishSuccess}</p>}
      {page ? (
        <>
          {sendBtn}
          {videoBtn}
        </>
      ) : (
        <div className="wm-row wm-row--actions">
          {sendBtn}
          {videoBtn}
        </div>
      )}
      <p className="wm-note">{page ? 'With a video, your message becomes its caption. Videos can be up to 1 minute.' : 'With a video, your message becomes its caption.'}</p>
      {showWishVideoRecorder && (
        <VideoMessageRecorder onClose={() => setShowWishVideoRecorder(false)} onSend={handleSendVideoWish} />
      )}
    </div>
  );
}
