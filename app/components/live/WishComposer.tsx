'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sendTextWish, sendVideoWish } from '@/lib/live/api';
import { canSend, formatClock, isEmail, remainingChars, sentNotice, validateDraft, type ComposerDraft, type Identity } from '@/lib/live/composer';
import { MAX_WISH_TEXT, MAX_WISH_VIDEO_SECONDS, type WishVisibility } from '@/lib/live/types';
import { Icon } from './icons';

const IDENTITY_KEY = 'eventWishIdentity';

function loadIdentity(): Partial<Identity> {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? (JSON.parse(raw) as Partial<Identity>) : {};
  } catch {
    return {};
  }
}
function saveIdentity(id: Identity) {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
  } catch {
    /* private mode: ask again next time */
  }
}

/**
 * The wish composer for a text or a video wish, as a dialog. A signed-in person is sent as their account (`account`);
 * a guest is asked for a name and email once and remembered. Visibility has no default and Send waits for the choice.
 * A video is recorded (up to 60 seconds) or uploaded, and previewed before it is sent. Same rules as the mobile composer.
 */
export function WishComposer({
  eventId,
  kind,
  account,
  getFingerprint,
  onClose,
  onSent,
}: {
  eventId: string;
  kind: 'text' | 'video';
  account: Identity | null;
  getFingerprint: () => Promise<string>;
  onClose: () => void;
  onSent?: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState<WishVisibility | null>(null);
  const [clip, setClip] = useState<{ blob: Blob; url: string; seconds: number | null } | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<{ rec: MediaRecorder; stream: MediaStream; timer: number } | null>(null);
  const lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    const id = loadIdentity();
    if (id.name) setName(id.name);
    if (id.email) setEmail(id.email);
    lastFocus.current = document.activeElement;
    dialogRef.current?.querySelector<HTMLElement>('input,textarea,button')?.focus();
    return () => {
      (lastFocus.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  // Free the camera and the preview URL when the dialog goes away.
  useEffect(
    () => () => {
      const r = recRef.current;
      if (r) {
        window.clearInterval(r.timer);
        r.stream.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );
  useEffect(() => () => void (clip && URL.revokeObjectURL(clip.url)), [clip]);

  const draft: ComposerDraft = { kind, name, email, message, visibility, durationSeconds: clip?.seconds ?? null, hasVideo: !!clip };
  const errors = validateDraft(draft, account);
  const shown = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  const setBlob = useCallback((blob: Blob, knownSeconds?: number) => {
    const url = URL.createObjectURL(blob);
    setClip((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return { blob, url, seconds: knownSeconds ?? null };
    });
    if (knownSeconds == null) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        const d = Number.isFinite(v.duration) ? Math.round(v.duration) : null;
        setClip((c) => (c && c.url === url ? { ...c, seconds: d } : c));
        if (d != null && d > MAX_WISH_VIDEO_SECONDS) setError(`That clip is ${formatClock(d)}. A video wish can be at most ${MAX_WISH_VIDEO_SECONDS} seconds.`);
      };
      v.src = url;
    }
  }, []);

  const stopRecording = useCallback(() => {
    const r = recRef.current;
    if (r && r.rec.state !== 'inactive') r.rec.stop();
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      const startedAt = Date.now();
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        window.clearInterval(timer);
        stream.getTracks().forEach((t) => t.stop());
        recRef.current = null;
        setRecording(false);
        setBlob(new Blob(chunks, { type: rec.mimeType || 'video/webm' }), Math.min(MAX_WISH_VIDEO_SECONDS, Math.max(1, Math.round((Date.now() - startedAt) / 1000))));
      };
      const timer = window.setInterval(() => {
        const s = Math.floor((Date.now() - startedAt) / 1000);
        setElapsed(s);
        if (s >= MAX_WISH_VIDEO_SECONDS) rec.stop();
      }, 250);
      recRef.current = { rec, stream, timer };
      setElapsed(0);
      setRecording(true);
      rec.start();
    } catch {
      setError('We could not open your camera. You can upload a video instead.');
    }
  };

  const send = async () => {
    setTried(true);
    if (!canSend(errors) || !visibility) return;
    const who = account ?? { name: name.trim(), email: email.trim() };
    setBusy(true);
    setError(null);
    try {
      const fingerprint = await getFingerprint();
      if (kind === 'text') await sendTextWish(eventId, { ...who, message: message.trim(), visibility, fingerprint });
      else await sendVideoWish(eventId, { ...who, message, visibility, durationSeconds: clip?.seconds ?? undefined, video: clip!.blob, fingerprint });
      if (!account && isEmail(who.email)) saveIdentity(who);
      setSent(sentNotice(visibility));
      onSent?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your wish. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !busy) onClose();
  };

  return (
    <div className="lv lv-overlay" onKeyDown={onKey} onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="lv-dialog" role="dialog" aria-modal="true" aria-labelledby="lv-wish-title" ref={dialogRef}>
        <div className="lv-dialog-head">
          <div>
            <h3 id="lv-wish-title">{sent ? 'Wish sent' : kind === 'video' ? 'Video wish' : 'Text wish'}</h3>
            {kind === 'video' && !sent ? <p className="lv-sub">Record or upload up to {MAX_WISH_VIDEO_SECONDS} seconds.</p> : null}
          </div>
          <button type="button" className="lv-icon-btn" onClick={onClose} disabled={busy} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>

        {sent ? (
          <>
            <p className="lv-note" role="status">
              {sent}
            </p>
            <button type="button" className="lv-btn lv-btn--primary" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            {kind === 'video' ? (
              <div className="lv-field">
                {clip ? <video className="lv-preview" src={clip.url} controls aria-label="Preview of your video wish" /> : null}
                {recording ? (
                  <div className="lv-rec" role="status">
                    <i /> Recording {formatClock(elapsed)} of {formatClock(MAX_WISH_VIDEO_SECONDS)}
                  </div>
                ) : null}
                <div className="lv-btn-row">
                  {recording ? (
                    <button type="button" className="lv-btn lv-btn--danger" onClick={stopRecording}>
                      <Icon name="stop" size={16} /> Stop recording
                    </button>
                  ) : (
                    <>
                      <button type="button" className="lv-btn" onClick={startRecording}>
                        <Icon name="video" size={16} /> {clip ? 'Record again' : 'Record'}
                      </button>
                      <label className="lv-btn" style={{ cursor: 'pointer' }}>
                        <Icon name="download" size={16} /> Upload
                        <input
                          type="file"
                          accept="video/*"
                          className="lv-sr"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setError(null);
                              setBlob(f);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </>
                  )}
                  {clip?.seconds ? <span className="lv-status" style={{ alignSelf: 'center' }}>{formatClock(clip.seconds)}</span> : null}
                </div>
                {shown('video') ? <p className="lv-err">{shown('video')}</p> : null}
              </div>
            ) : null}

            {!account ? (
              <>
                <div className="lv-field">
                  <label htmlFor="lv-name">Your name</label>
                  <input id="lv-name" className="lv-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={!!shown('name')} />
                  {shown('name') ? <p className="lv-err">{shown('name')}</p> : null}
                </div>
                <div className="lv-field">
                  <label htmlFor="lv-email">Your email</label>
                  <input id="lv-email" className="lv-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!shown('email')} />
                  {shown('email') ? <p className="lv-err">{shown('email')}</p> : null}
                </div>
              </>
            ) : null}

            <div className="lv-field">
              <label htmlFor="lv-msg">{kind === 'video' ? 'Caption (optional)' : 'Your wish'}</label>
              <textarea id="lv-msg" className="lv-textarea" value={message} maxLength={MAX_WISH_TEXT} onChange={(e) => setMessage(e.target.value)} aria-invalid={!!shown('message')} />
              <span className="lv-count" aria-live="polite">
                {remainingChars(message)} left
              </span>
              {shown('message') ? <p className="lv-err">{shown('message')}</p> : null}
            </div>

            <fieldset className="lv-field lv-radios" aria-describedby="lv-vis-note">
              <legend className="lv-legend" style={{ gridColumn: '1 / -1' }}>
                Who can see this wish?
              </legend>
              <label className="lv-radio">
                <input type="radio" name="lv-vis" checked={visibility === 'public'} onChange={() => setVisibility('public')} />
                <b>
                  <Icon name="globe" size={16} /> Public
                </b>
                <small>Shown in the feed after the host approves it</small>
              </label>
              <label className="lv-radio">
                <input type="radio" name="lv-vis" checked={visibility === 'private'} onChange={() => setVisibility('private')} />
                <b>
                  <Icon name="lock" size={16} /> Private
                </b>
                <small>Only the host sees it</small>
              </label>
              <span id="lv-vis-note" className="lv-sr">
                You must choose before sending.
              </span>
            </fieldset>
            {shown('visibility') ? <p className="lv-err">{shown('visibility')}</p> : null}

            {error ? (
              <p className="lv-err" role="alert">
                {error}
              </p>
            ) : null}
            <button type="button" className="lv-btn lv-btn--primary" onClick={send} disabled={busy || recording || (tried && !canSend(errors))}>
              {busy ? 'Sending…' : 'Send wish'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
