'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hls from 'hls.js';
import AmoriaKNavbar from '../../components/navbar';
import { useAuth } from '../../providers/AuthProvider';
import { getEventDetails } from '@/lib/APIs/events/get-event-details/route';
import { getStreamChats, sendStreamChat, getStreamViewerCount, getStreamVideo } from '@/lib/APIs/streams/route';
import { recordStreamingPayment } from '@/lib/APIs/payments/route';
import { getCurrencies, type Currency } from '@/lib/APIs/public';
import { joinEvent } from '@/lib/APIs/events/join-event/route';
import { validateInviteCode } from '@/lib/APIs/customer/validate-invite-code/route';
import type { Event } from '@/lib/APIs/events/get-events/route';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResolvedStatus = 'LIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  text: string;
  time: string;
}

interface GiftState {
  show: boolean;
  amount: string;
  message: string;
  paymentMethod: 'mtn' | 'airtel' | 'card' | null;
  phone: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardHolder: string;
  loading: boolean;
  error: string | null;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapStatus(s: string): ResolvedStatus {
  switch ((s || '').toLowerCase()) {
    case 'ongoing':
    case 'live':
      return 'LIVE';
    case 'upcoming':
      return 'UPCOMING';
    case 'completed':
    case 'published':
      return 'COMPLETED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'UPCOMING';
  }
}

function formatCountdown(ms: number): Countdown {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EventStreamPageProps {
  eventId: string;
}

export default function EventStreamPage({ eventId }: EventStreamPageProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // -- Mobile
  const [isMobile, setIsMobile] = useState(false);

  // -- Host ID / Event Stream Link validation
  const [hostIdInput, setHostIdInput] = useState('');
  const [hostIdValidated, setHostIdValidated] = useState(false);
  const [hostIdValidating, setHostIdValidating] = useState(false);
  const [hostIdError, setHostIdError] = useState<string | null>(null);

  // -- Event data
  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvedStatus, setResolvedStatus] = useState<ResolvedStatus>('UPCOMING');

  // -- Stream video (replay + viewer count)
  const [replayUrl, setReplayUrl] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);

  // -- Live chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // -- HLS player
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True only when the HLS stream is confirmed transmitting data in this player
  const [isStreamActuallyLive, setIsStreamActuallyLive] = useState(false);

  // -- Countdown
  const [countdown, setCountdown] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // -- RSVP
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // -- Currencies
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // -- Gift modal
  const [gift, setGift] = useState<GiftState>({
    show: false, amount: '', message: '', paymentMethod: null,
    phone: '', cardNumber: '', cardExpiry: '', cardCvv: '', cardHolder: '',
    loading: false, error: null,
  });

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Mobile detection
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 640);
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Auto-validate hostId from URL on mount (e.g., ?hostId=STREAM-abc-XYZ)
  useEffect(() => {
    const urlHostId = searchParams.get('hostId');
    if (!urlHostId) return;
    setHostIdInput(urlHostId);
    setHostIdValidating(true);
    validateInviteCode(urlHostId)
      .then(res => {
        if (res.success && (res.data as { valid?: boolean })?.valid) {
          setHostIdValidated(true);
        } else {
          setHostIdError('The Host ID in this link is invalid or has expired.');
        }
      })
      .catch(() => setHostIdError('Could not validate the Host ID. Please try again.'))
      .finally(() => setHostIdValidating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch event details
  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await getEventDetails(eventId);
        if (res.success && res.data) {
          const ev = (res.data as unknown as { event?: Event }).event ?? (res.data as unknown as Event);
          setEvent(ev);
          setIsRegistered(!!(res.data as { isRegistered?: boolean }).isRegistered);
          setResolvedStatus(mapStatus(ev.status));
        } else {
          setLoadError(res.error || 'Failed to load event details.');
        }
      } catch {
        setLoadError('An error occurred loading the event.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [eventId]);

  // Fetch stream video data (replay URL + stats) — silent fail
  useEffect(() => {
    if (!event) return;
    const fetch = async () => {
      try {
        const res = await getStreamVideo(eventId);
        if (res.success && res.data) {
          const d = (res.data as unknown as { data?: { replayUrl?: string | null; viewerCount?: number; peakViewers?: number } }).data ?? (res.data as unknown as { replayUrl?: string | null; viewerCount?: number; peakViewers?: number });
          if (d?.replayUrl) setReplayUrl(d.replayUrl);
          if (d?.viewerCount) setViewerCount(d.viewerCount);
          if (d?.peakViewers) setPeakViewers(d.peakViewers);
        }
      } catch { /* silent */ }
    };
    fetch();
  }, [event, eventId]);

  // HLS player init / teardown
  useEffect(() => {
    if (resolvedStatus !== 'LIVE') return;
    const hlsUrl = event?.hlsManifestUrl;
    if (!hlsUrl) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Video element listeners — most reliable cross-browser signal
    const onPlaying = () => setIsStreamActuallyLive(true);
    const onStall = () => setIsStreamActuallyLive(false);
    videoEl.addEventListener('playing', onPlaying);
    videoEl.addEventListener('pause', onStall);
    videoEl.addEventListener('ended', onStall);
    videoEl.addEventListener('emptied', onStall);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoEl);
      // FRAG_BUFFERED fires when the first segment is ready — stream is truly live
      hls.on(Hls.Events.FRAG_BUFFERED, () => setIsStreamActuallyLive(true));
      hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) setIsStreamActuallyLive(false); });
      hlsRef.current = hls;
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = hlsUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoEl.removeEventListener('playing', onPlaying);
      videoEl.removeEventListener('pause', onStall);
      videoEl.removeEventListener('ended', onStall);
      videoEl.removeEventListener('emptied', onStall);
      setIsStreamActuallyLive(false);
    };
  }, [resolvedStatus, event?.hlsManifestUrl]);

  // Chat polling every 5s
  useEffect(() => {
    if (resolvedStatus !== 'LIVE') return;
    const streamId = event?.liveInputId;
    if (!streamId) return;

    const poll = async () => {
      try {
        const res = await getStreamChats(streamId, 0, 50);
        if (res.success && res.data) {
          const raw = res.data as unknown as { data?: { content?: unknown[] } | unknown[] };
          let msgs: Record<string, unknown>[] = [];
          if (raw?.data && !Array.isArray(raw.data) && (raw.data as { content?: unknown[] }).content) {
            msgs = (raw.data as { content: Record<string, unknown>[] }).content;
          } else if (Array.isArray(raw?.data)) {
            msgs = raw.data as Record<string, unknown>[];
          }
          if (msgs.length > 0) {
            const mapped: ChatMessage[] = msgs.map(m => ({
              id: String(m.id ?? Math.random()),
              sender: String(m.senderName ?? m.sender ?? 'Anonymous'),
              senderAvatar: String(m.senderAvatar ?? `https://i.pravatar.cc/150?u=${m.senderName ?? m.id}`),
              text: String(m.content ?? m.message ?? ''),
              time: new Date(String(m.timestamp ?? m.createdAt ?? new Date())).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }));
            setChatMessages(mapped);
          }
        }
      } catch { /* silent */ }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [resolvedStatus, event?.liveInputId]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Viewer count poll every 15s
  useEffect(() => {
    if (resolvedStatus !== 'LIVE') return;
    const streamId = event?.liveInputId;
    if (!streamId) return;

    const poll = async () => {
      try {
        const res = await getStreamViewerCount(streamId);
        if (res.success && res.data) {
          const d = res.data as unknown as { data?: { viewerCount?: number }; viewerCount?: number };
          const vc = d?.data?.viewerCount ?? d?.viewerCount ?? 0;
          if (vc) setViewerCount(vc);
        }
      } catch { /* silent */ }
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [resolvedStatus, event?.liveInputId]);

  // Countdown timer
  useEffect(() => {
    if (resolvedStatus !== 'UPCOMING' || !event?.date) return;
    const tick = () => {
      const timeStr = (event.time ?? '').split(' - ')[0].trim();
      const dt = new Date(`${event.date}T${timeStr.length >= 5 ? timeStr : '00:00'}`);
      setCountdown(formatCountdown(dt.getTime() - Date.now()));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [resolvedStatus, event?.date, event?.time]);

  // Load currencies for gift modal
  useEffect(() => {
    getCurrencies()
      .then(res => {
        if (res.success && Array.isArray(res.data)) setCurrencies(res.data as Currency[]);
      })
      .catch(() => {});
  }, []);

  // Auto-hide controls after 3s inactivity on player
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // -------------------------------------------------------------------------
  // Action handlers
  // -------------------------------------------------------------------------

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      router.push(`/user/auth/login?returnUrl=/user/event/${eventId}`);
      return;
    }
    action();
  };

  // Extract hostId from a pasted value — accepts bare code or full URL
  const extractHostId = (value: string): string => {
    try {
      const url = new URL(value.trim());
      return url.searchParams.get('hostId') || value.trim();
    } catch {
      return value.trim();
    }
  };

  const handleValidateHostId = async () => {
    const code = extractHostId(hostIdInput);
    if (!code) { setHostIdError('Please enter an Event Stream Link or Host ID.'); return; }
    setHostIdValidating(true);
    setHostIdError(null);
    try {
      const res = await validateInviteCode(code);
      if (res.success && (res.data as { valid?: boolean })?.valid) {
        setHostIdValidated(true);
        setHostIdInput(code);
      } else {
        setHostIdError('Invalid Host ID or Event Stream Link. Please check and try again.');
      }
    } catch {
      setHostIdError('Validation failed. Please check your connection and try again.');
    } finally {
      setHostIdValidating(false);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const handleSendChat = async () => {
    if (!newChatText.trim() || !event?.liveInputId) return;
    if (!isAuthenticated) {
      router.push(`/user/auth/login?returnUrl=/user/event/${eventId}`);
      return;
    }
    setChatLoading(true);
    try {
      await sendStreamChat(event.liveInputId, newChatText.trim());
      setNewChatText('');
    } catch { /* silent */ } finally {
      setChatLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (!isAuthenticated) {
      router.push(`/user/auth/login?returnUrl=/user/event/${eventId}`);
      return;
    }
    setRsvpLoading(true);
    setRsvpError(null);
    try {
      const res = await joinEvent({ eventId });
      if (res.success) { setRsvpSuccess(true); setIsRegistered(true); }
      else setRsvpError(res.error || 'Failed to register. Please try again.');
    } catch {
      setRsvpError('An error occurred. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleSendGift = async () => {
    if (!gift.paymentMethod || !gift.amount) return;
    setGift(prev => ({ ...prev, loading: true, error: null }));
    try {
      const currencyId = currencies[0]?.id;
      const res = await recordStreamingPayment({
        eventId,
        amount: gift.amount,
        currencyId,
        remarks: gift.message || `Gift via ${gift.paymentMethod}`,
      });
      if (!res.success) throw new Error(res.error || 'Gift payment failed.');
      setGift({ show: false, amount: '', message: '', paymentMethod: null, phone: '', cardNumber: '', cardExpiry: '', cardCvv: '', cardHolder: '', loading: false, error: null });
    } catch (err) {
      setGift(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Gift failed.' }));
    }
  };

  const isGiftValid = () => {
    if (!gift.amount || !gift.paymentMethod) return false;
    if (gift.paymentMethod === 'mtn' || gift.paymentMethod === 'airtel') return gift.phone.length >= 10;
    if (gift.paymentMethod === 'card') return gift.cardNumber.length >= 16 && gift.cardExpiry.length >= 4 && gift.cardCvv.length >= 3 && gift.cardHolder.trim().length > 0;
    return false;
  };

  const eventPrice = typeof event?.price === 'string' ? parseFloat(event.price) : (event?.price ?? 0);
  const isPaid = eventPrice > 0;
  const locationStr = event?.location
    ? (typeof event.location === 'string' ? event.location : `${(event.location as { address?: string }).address ?? ''}`)
    : '';

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderStatusBadge = (inline = false) => {
    const styles: React.CSSProperties = inline
      ? { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }
      : { position: 'absolute', top: 16, left: 16, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 };

    if (resolvedStatus === 'LIVE') return (
      <span style={{ ...styles, background: '#e53e3e', color: '#fff' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'blink 1s infinite' }} />
        LIVE
      </span>
    );
    if (resolvedStatus === 'UPCOMING') return (
      <span style={{ ...styles, background: '#3182ce', color: '#fff' }}>UPCOMING</span>
    );
    if (resolvedStatus === 'COMPLETED') return (
      <span style={{ ...styles, background: '#718096', color: '#fff' }}>COMPLETED</span>
    );
    return <span style={{ ...styles, background: '#4a5568', color: '#fff' }}>CANCELLED</span>;
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <>
      <AmoriaKNavbar />

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .event-stream-chat::-webkit-scrollbar { width: 4px; }
        .event-stream-chat::-webkit-scrollbar-track { background: transparent; }
        .event-stream-chat::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 2px; }
        .event-stream-content { animation: fadeIn 0.3s ease; }
      `}</style>

      <div style={{ backgroundColor: '#0e0e10', minHeight: '100vh', color: '#efeff1', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16 }}>
            <div style={{ width: 44, height: 44, border: '4px solid #2d3748', borderTopColor: '#03969c', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <p style={{ color: '#718096', fontSize: 14 }}>Loading event...</p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {!isLoading && loadError && (
          <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Event not found</h2>
            <p style={{ color: '#a0aec0', marginBottom: 24 }}>{loadError}</p>
            <button onClick={() => router.push('/user/events')} style={{ background: '#03969c', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Browse Events
            </button>
          </div>
        )}

        {/* ── Main content ────────────────────────────────────────────── */}
        {!isLoading && !loadError && event && (
          <div className="event-stream-content">

            {/* Banner */}
            <div style={{ width: '100%', height: isMobile ? 200 : 340, position: 'relative', overflow: 'hidden' }}>
              <img
                src={event.bannerImage || event.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80'}
                alt={event.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 30%, #0e0e10 100%)' }} />
              {renderStatusBadge()}
            </div>

            {/* Event info header */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px 0' : '28px 48px 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, margin: 0 }}>{event.title}</h1>
                    {renderStatusBadge(true)}
                  </div>
                  <p style={{ color: '#a0aec0', fontSize: 14, margin: 0, maxWidth: 700 }}>{event.description}</p>
                </div>
                {isPaid && (
                  <div style={{ background: 'rgba(246,173,85,0.1)', border: '1.5px solid #f6ad55', borderRadius: 10, padding: '8px 18px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f6ad55' }}>{eventPrice.toLocaleString()} RWF</div>
                    <div style={{ fontSize: 11, color: '#a0aec0' }}>Entry fee</div>
                  </div>
                )}
                {!isPaid && (
                  <div style={{ background: 'rgba(104,211,145,0.1)', border: '1.5px solid #68d391', borderRadius: 10, padding: '8px 18px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#68d391' }}>Free</div>
                  </div>
                )}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#a0aec0', marginBottom: 14 }}>
                {event.date && <span>📅 {event.date}</span>}
                {event.time && <span>🕐 {event.time}</span>}
                {locationStr && <span>📍 {locationStr}</span>}
                {event.organizerName && <span>👤 {event.organizerName}</span>}
                {(event.category || event.eventType) && <span>🏷️ {event.category || event.eventType}</span>}
                {event.maxGuests && <span>👥 {event.currentAttendees ?? 0} / {event.maxGuests} guests</span>}
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                  {event.tags.map(tag => (
                    <span key={tag} style={{ background: 'rgba(3,150,156,0.12)', color: '#03969c', border: '1px solid rgba(3,150,156,0.3)', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── LIVE branch ─────────────────────────────────────────── */}

            {/* Paid but not yet registered → redirect to payment flow */}
            {resolvedStatus === 'LIVE' && isPaid && !isRegistered && (
              <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '8px 16px 60px' : '8px 48px 60px' }}>
                <div style={{ background: '#1a1a1d', borderRadius: 16, padding: isMobile ? '24px 20px' : '36px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
                  <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 8 }}>Purchase access to watch this stream</h2>
                  <p style={{ color: '#a0aec0', fontSize: 14, marginBottom: 10, lineHeight: 1.6 }}>
                    This is a paid event. Complete your payment to get instant access to the live stream.
                  </p>
                  <p style={{ color: '#f6ad55', fontWeight: 800, fontSize: 22, margin: '16px 0 24px' }}>
                    {eventPrice.toLocaleString()} RWF
                  </p>
                  <button
                    onClick={() => router.push(`/user/events/join-package?id=${eventId}`)}
                    style={{
                      width: '100%', background: '#03969c', color: '#fff', border: 'none',
                      padding: '15px', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🎬</span>
                    Buy Access — {eventPrice.toLocaleString()} RWF
                  </button>
                </div>
              </div>
            )}

            {/* Free event — Host ID / Event Stream Link validation gate */}
            {resolvedStatus === 'LIVE' && !isPaid && !hostIdValidated && (
              <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '8px 16px 60px' : '8px 48px 60px' }}>
                <div style={{ background: '#1a1a1d', borderRadius: 16, padding: isMobile ? '24px 20px' : '36px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 16 }}>🔑</div>
                  <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 8 }}>Enter your Event Stream Link or Host ID</h2>
                  <p style={{ color: '#a0aec0', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                    The organizer shared a unique <strong style={{ color: '#efeff1' }}>Event Stream Link</strong> or <strong style={{ color: '#efeff1' }}>Host ID</strong> with you.
                    Paste it below to access the live stream.
                  </p>

                  {/* Input */}
                  <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row', marginBottom: 12 }}>
                    <input
                      value={hostIdInput}
                      onChange={e => { setHostIdInput(e.target.value); setHostIdError(null); }}
                      onKeyDown={e => e.key === 'Enter' && handleValidateHostId()}
                      placeholder="Paste Event Stream Link or Host ID..."
                      style={{
                        flex: 1, background: '#2d3748', border: `1.5px solid ${hostIdError ? '#fc8181' : '#4a5568'}`,
                        borderRadius: 8, padding: '12px 14px', color: '#efeff1', fontSize: 14, outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleValidateHostId}
                      disabled={hostIdValidating || !hostIdInput.trim()}
                      style={{
                        background: '#03969c', color: '#fff', border: 'none', padding: '12px 22px',
                        borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
                        opacity: (hostIdValidating || !hostIdInput.trim()) ? 0.65 : 1,
                        display: 'flex', alignItems: 'center', gap: 7,
                      }}
                    >
                      {hostIdValidating
                        ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Validating…</>
                        : '✓ Validate'
                      }
                    </button>
                  </div>

                  {hostIdError && (
                    <p style={{ color: '#fc8181', fontSize: 13, marginBottom: 16 }}>{hostIdError}</p>
                  )}
                </div>
              </div>
            )}

            {resolvedStatus === 'LIVE' && (hostIdValidated || (isPaid && isRegistered)) && (
              <div style={{
                maxWidth: 1200, margin: '0 auto',
                padding: isMobile ? '0 16px 60px' : '0 48px 48px',
                display: isMobile ? 'block' : 'flex',
                gap: 24, alignItems: 'flex-start',
              }}>
                {/* Player column */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* HLS player */}
                  <div
                    style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '16/9', cursor: 'pointer' }}
                    onMouseMove={resetControlsTimer}
                    onMouseLeave={() => setShowControls(false)}
                    onClick={togglePlay}
                  >
                      <video
                        ref={videoRef}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        muted={isMuted}
                        playsInline
                        autoPlay
                      />

                      {/* LIVE + viewers overlay — only shown when stream is confirmed playing */}
                      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, pointerEvents: 'none' }}>
                        {isStreamActuallyLive ? (
                          <span style={{ background: '#e53e3e', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'blink 1s infinite' }} />
                            LIVE
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#a0aec0', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                            Waiting for stream…
                          </span>
                        )}
                        {isStreamActuallyLive && (
                          <span style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 11 }}>
                            👁 {viewerCount.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Controls */}
                      {showControls && (
                        <div
                          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', padding: '28px 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>
                            {isPlaying ? '⏸' : '▶'}
                          </button>
                          <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>
                            {isMuted ? '🔇' : '🔊'}
                          </button>
                          <span style={{ marginLeft: 'auto', color: '#a0aec0', fontSize: 12 }}>
                            {event.title}
                          </span>
                        </div>
                      )}

                      {/* No manifest fallback */}
                      {!event.hlsManifestUrl && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 40 }}>📡</div>
                          <p style={{ color: '#a0aec0', fontSize: 14 }}>Stream starting soon...</p>
                        </div>
                      )}
                    </div>

                  {/* Gift button */}
                  <button
                    onClick={() => requireAuth(() => setGift(prev => ({ ...prev, show: true })))}
                    style={{ marginTop: 12, background: 'linear-gradient(135deg, #f6ad55, #ed8936)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}
                  >
                    🎁 Send a Gift
                  </button>
                </div>

                {/* Chat column */}
                <div style={{
                  width: isMobile ? '100%' : 310,
                  marginTop: isMobile ? 20 : 0,
                  background: '#1a1a1d',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  height: isMobile ? 360 : 480,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #2d3748', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    💬 Live Chat
                    {chatMessages.length > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#718096' }}>{chatMessages.length} messages</span>
                    )}
                  </div>

                  <div
                    className="event-stream-chat"
                    style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {chatMessages.length === 0 && (
                      <p style={{ color: '#4a5568', fontSize: 13, textAlign: 'center', marginTop: 20 }}>No messages yet. Be the first!</p>
                    )}
                    {chatMessages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <img src={msg.senderAvatar} alt={msg.sender} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                            <span style={{ color: '#03969c', fontSize: 12, fontWeight: 600 }}>{msg.sender}</span>
                            <span style={{ color: '#4a5568', fontSize: 10 }}>{msg.time}</span>
                          </div>
                          <p style={{ fontSize: 13, margin: '2px 0 0', color: '#e2e8f0', wordBreak: 'break-word' }}>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  <div style={{ padding: '10px 12px', borderTop: '1px solid #2d3748', display: 'flex', gap: 8 }}>
                    {isAuthenticated ? (
                      <>
                        <input
                          value={newChatText}
                          onChange={e => setNewChatText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                          placeholder="Say something..."
                          maxLength={200}
                          style={{ flex: 1, background: '#2d3748', border: '1px solid #4a5568', borderRadius: 6, padding: '8px 10px', color: '#efeff1', fontSize: 13, outline: 'none' }}
                        />
                        <button
                          onClick={handleSendChat}
                          disabled={chatLoading || !newChatText.trim()}
                          style={{ background: '#03969c', border: 'none', borderRadius: 6, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: chatLoading ? 0.7 : 1 }}
                        >
                          {chatLoading ? '…' : 'Send'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => router.push(`/user/auth/login?returnUrl=/user/event/${eventId}`)}
                        style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 6, padding: 10, color: '#a0aec0', cursor: 'pointer', fontSize: 13 }}
                      >
                        Log in to chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── UPCOMING branch ─────────────────────────────────────── */}
            {resolvedStatus === 'UPCOMING' && (
              <div style={{ maxWidth: 700, margin: '0 auto', padding: isMobile ? '0 16px 60px' : '0 48px 60px' }}>
                {/* Countdown */}
                <div style={{ background: 'linear-gradient(135deg, #1a1a1d, #2d3748)', borderRadius: 16, padding: isMobile ? '24px 16px' : '36px 32px', textAlign: 'center', marginBottom: 28 }}>
                  <p style={{ color: '#718096', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Event starts in</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 16 : 28 }}>
                    {[
                      { label: 'Days', value: countdown.days },
                      { label: 'Hours', value: countdown.hours },
                      { label: 'Min', value: countdown.minutes },
                      { label: 'Sec', value: countdown.seconds },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: isMobile ? 38 : 56, fontWeight: 800, color: '#03969c', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                          {pad(value)}
                        </div>
                        <div style={{ fontSize: 11, color: '#718096', marginTop: 5, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price card (if paid) */}
                {isPaid && (
                  <div style={{ background: '#1a1a1d', borderRadius: 12, padding: '18px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 4px' }}>Stream Access</p>
                      <p style={{ color: '#a0aec0', fontSize: 12, margin: 0 }}>Purchase now to secure your spot</p>
                    </div>
                    <span style={{ color: '#f6ad55', fontWeight: 800, fontSize: 18 }}>{eventPrice.toLocaleString()} RWF</span>
                  </div>
                )}

                {/* CTA */}
                {isPaid ? (
                  <button
                    onClick={() => router.push(`/user/events/join-package?id=${eventId}`)}
                    style={{ width: '100%', background: '#03969c', color: '#fff', border: 'none', padding: 16, borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}
                  >
                    Purchase Access — {eventPrice.toLocaleString()} RWF
                  </button>
                ) : (
                  <button
                    onClick={handleRSVP}
                    disabled={rsvpLoading || rsvpSuccess || isRegistered}
                    style={{
                      width: '100%', border: 'none', padding: 16, borderRadius: 12, fontSize: 16, fontWeight: 700,
                      cursor: (rsvpLoading || rsvpSuccess || isRegistered) ? 'default' : 'pointer',
                      background: (rsvpSuccess || isRegistered) ? '#38a169' : '#3182ce',
                      color: '#fff', marginBottom: 12,
                      opacity: rsvpLoading ? 0.75 : 1,
                    }}
                  >
                    {rsvpLoading ? 'Registering…' : (rsvpSuccess || isRegistered) ? '✓ You\'re registered!' : 'RSVP — Free'}
                  </button>
                )}
                {rsvpError && <p style={{ color: '#fc8181', fontSize: 13, marginTop: -4 }}>{rsvpError}</p>}
              </div>
            )}

            {/* ── COMPLETED / CANCELLED branch ───────────────────────── */}
            {(resolvedStatus === 'COMPLETED' || resolvedStatus === 'CANCELLED') && (
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px 60px' : '0 48px 60px' }}>
                {resolvedStatus === 'CANCELLED' && (
                  <div style={{ background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.3)', borderRadius: 10, padding: '14px 20px', marginBottom: 24, color: '#fc8181', fontSize: 14 }}>
                    ⚠️ This event has been cancelled.
                  </div>
                )}

                {/* Replay video */}
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>
                  {resolvedStatus === 'COMPLETED' ? 'Event Replay' : 'Stream Recording'}
                </h2>
                {replayUrl ? (
                  <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '16/9', marginBottom: 28 }}>
                    <video src={replayUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ background: '#1a1a1d', borderRadius: 12, padding: '40px 24px', textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
                    <p style={{ color: '#a0aec0', fontSize: 14 }}>Replay is not yet available for this event.</p>
                  </div>
                )}

                {/* Stats row */}
                {(viewerCount > 0 || peakViewers > 0) && (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
                    {viewerCount > 0 && (
                      <div style={{ background: '#1a1a1d', borderRadius: 10, padding: '14px 22px', flex: '1 1 140px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#03969c' }}>{viewerCount.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: '#718096', marginTop: 3 }}>Total Viewers</div>
                      </div>
                    )}
                    {peakViewers > 0 && (
                      <div style={{ background: '#1a1a1d', borderRadius: 10, padding: '14px 22px', flex: '1 1 140px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#f6ad55' }}>{peakViewers.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: '#718096', marginTop: 3 }}>Peak Viewers</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo album link */}
                <div style={{ background: '#1a1a1d', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 4px' }}>Event Photo Album</p>
                    <p style={{ color: '#a0aec0', fontSize: 12, margin: 0 }}>View photos captured during this event</p>
                  </div>
                  <button
                    onClick={() => router.push(`/user/find-my-photos`)}
                    style={{ background: '#03969c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}
                  >
                    View Photos
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Gift Modal ───────────────────────────────────────────────── */}
        {gift.show && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#1a1a1d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🎁 Send a Gift</h2>
                <button onClick={() => setGift(prev => ({ ...prev, show: false }))} style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>

              <p style={{ color: '#a0aec0', fontSize: 13, marginBottom: 16 }}>
                Sending a gift to <strong style={{ color: '#efeff1' }}>{event?.organizerName}</strong>
              </p>

              {/* Amount */}
              <input
                type="number"
                placeholder="Amount (RWF)"
                value={gift.amount}
                onChange={e => setGift(prev => ({ ...prev, amount: e.target.value }))}
                style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }}
              />

              {/* Message */}
              <input
                type="text"
                placeholder="Message (optional)"
                value={gift.message}
                onChange={e => setGift(prev => ({ ...prev, message: e.target.value }))}
                style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, marginBottom: 14, boxSizing: 'border-box', outline: 'none' }}
              />

              {/* Payment method */}
              <p style={{ fontSize: 12, color: '#718096', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Payment method</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {([{ id: 'mtn', label: 'MTN MoMo' }, { id: 'airtel', label: 'Airtel Money' }, { id: 'card', label: 'Card' }] as { id: 'mtn' | 'airtel' | 'card'; label: string }[]).map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setGift(prev => ({ ...prev, paymentMethod: pm.id }))}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      border: `2px solid ${gift.paymentMethod === pm.id ? '#03969c' : '#4a5568'}`,
                      background: gift.paymentMethod === pm.id ? 'rgba(3,150,156,0.15)' : '#2d3748',
                      color: gift.paymentMethod === pm.id ? '#03969c' : '#a0aec0',
                    }}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Phone field */}
              {(gift.paymentMethod === 'mtn' || gift.paymentMethod === 'airtel') && (
                <input
                  type="tel"
                  placeholder="Phone number (e.g. 078...)"
                  value={gift.phone}
                  onChange={e => setGift(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, marginBottom: 14, boxSizing: 'border-box', outline: 'none' }}
                />
              )}

              {/* Card fields */}
              {gift.paymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  <input type="text" placeholder="Card number" value={gift.cardNumber} onChange={e => setGift(prev => ({ ...prev, cardNumber: e.target.value }))} maxLength={19}
                    style={{ background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, outline: 'none' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" placeholder="MM/YY" value={gift.cardExpiry} onChange={e => setGift(prev => ({ ...prev, cardExpiry: e.target.value }))} maxLength={5}
                      style={{ flex: 1, background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, outline: 'none' }} />
                    <input type="text" placeholder="CVV" value={gift.cardCvv} onChange={e => setGift(prev => ({ ...prev, cardCvv: e.target.value }))} maxLength={4}
                      style={{ flex: 1, background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, outline: 'none' }} />
                  </div>
                  <input type="text" placeholder="Cardholder name" value={gift.cardHolder} onChange={e => setGift(prev => ({ ...prev, cardHolder: e.target.value }))}
                    style={{ background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, outline: 'none' }} />
                </div>
              )}

              {gift.error && <p style={{ color: '#fc8181', fontSize: 13, marginBottom: 10 }}>{gift.error}</p>}

              <button
                onClick={handleSendGift}
                disabled={gift.loading || !isGiftValid()}
                style={{
                  width: '100%', background: '#03969c', color: '#fff', border: 'none',
                  padding: '13px', borderRadius: 9, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  opacity: (gift.loading || !isGiftValid()) ? 0.65 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {gift.loading
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Processing…</>
                  : '🎁 Send Gift'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
