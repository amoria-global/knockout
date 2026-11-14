'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';
import {
  LAST_TV_KEY,
  isTvOnline,
  listTvDevices,
  pickDefaultTv,
  sendEventToTv,
  type TvDevice,
} from '@/lib/APIs/tv/cast/route';

type Phase = 'idle' | 'loading' | 'list' | 'sending' | 'sent' | 'error';

function readLastTv(): string | null {
  try {
    return window.localStorage.getItem(LAST_TV_KEY);
  } catch {
    return null;
  }
}
function rememberTv(id: string) {
  try {
    window.localStorage.setItem(LAST_TV_KEY, id);
  } catch {
    // Private mode or blocked storage: the next send just asks again.
  }
}

/**
 * "Watch on TV" for a signed-in viewer, next to Share in the live header. Mirrors the phone's WatchOnTv sheet.
 *
 * One tap when there is an obvious TV (the only one, or the one used last time): it sends straight away and says so, with
 * "Choose another TV" to change. Otherwise it lists the TVs, marks the ones that checked in recently as on, and sends the
 * one picked. Every state has a way forward: no TVs links to Connect a TV, an error offers Try again.
 */
export function WatchOnTv({ eventId, enabled }: { eventId: string; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [devices, setDevices] = useState<TvDevice[]>([]);
  const [sentTo, setSentTo] = useState<TvDevice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const send = useCallback(
    async (tv: TvDevice) => {
      setPhase('sending');
      setError(null);
      const res = await sendEventToTv(tv.id, eventId);
      if (res.success) {
        rememberTv(tv.id);
        setSentTo(tv);
        setPhase('sent');
      } else {
        setError(res.error || res.message || 'Could not send it to your TV.');
        setPhase('error');
      }
    },
    [eventId],
  );

  const load = useCallback(
    async (autoSend: boolean) => {
      setPhase('loading');
      setError(null);
      const res = await listTvDevices();
      if (!res.success) {
        setError(res.error || 'Could not load your TVs.');
        setPhase('error');
        return;
      }
      const list = Array.isArray(res.data) ? res.data : [];
      setDevices(list);
      const pick = autoSend ? pickDefaultTv(list, readLastTv()) : null;
      if (pick) await send(pick);
      else setPhase('list');
    },
    [send],
  );

  const onOpen = () => {
    setOpen(true);
    void load(true);
  };

  // Close on Escape or a click outside the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  if (!enabled || !eventId) return null;

  return (
    <div className="lv-tv" ref={panelRef}>
      <button type="button" className="lv-icon-btn" onClick={onOpen} aria-label="Watch on TV" aria-expanded={open} aria-haspopup="dialog">
        <Icon name="tv" size={18} />
        <span className="lv-label">Watch on TV</span>
      </button>
      {open ? (
        <div className="lv-tv-panel" role="dialog" aria-label="Watch on TV">
          <div className="lv-tv-head">
            <strong>Watch on TV</strong>
            <button type="button" className="lv-tv-x" onClick={() => setOpen(false)} aria-label="Close">
              <Icon name="close" size={16} />
            </button>
          </div>

          {phase === 'loading' || phase === 'sending' ? (
            <p className="lv-tv-note" aria-live="polite">{phase === 'sending' ? 'Sending to your TV…' : 'Finding your TVs…'}</p>
          ) : null}

          {phase === 'sent' && sentTo ? (
            <div aria-live="polite">
              <p className="lv-tv-ok">Opening on {sentTo.deviceLabel}. Keep the Connekyt TV app open; it starts in a couple of seconds.</p>
              {devices.length > 1 ? (
                <button type="button" className="lv-tv-link" onClick={() => setPhase('list')}>Choose another TV</button>
              ) : null}
            </div>
          ) : null}

          {phase === 'error' ? (
            <div role="alert">
              <p className="lv-tv-err">{error}</p>
              <button type="button" className="lv-tv-link" onClick={() => void load(false)}>Try again</button>
            </div>
          ) : null}

          {phase === 'list' && devices.length === 0 ? (
            <div>
              <p className="lv-tv-note">No TV is connected to your account yet. Open Connekyt TV, then enter the code it shows.</p>
              <Link className="lv-tv-link" href="/user/connect-tv">Connect a TV</Link>
            </div>
          ) : null}

          {phase === 'list' && devices.length > 0 ? (
            <ul className="lv-tv-list">
              {devices.map((d) => {
                const on = isTvOnline(d);
                return (
                  <li key={d.id}>
                    <button type="button" className="lv-tv-row" onClick={() => void send(d)}>
                      <Icon name="tv" size={18} />
                      <span className="lv-tv-name">{d.deviceLabel || 'Smart TV'}</span>
                      <span className={on ? 'lv-tv-on' : 'lv-tv-off'}>{on ? 'On' : 'Not seen lately'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
