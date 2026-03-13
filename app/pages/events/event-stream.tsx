'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hls from 'hls.js';
import AmoriaKNavbar from '../../components/navbar';
import { useAuth } from '../../providers/AuthProvider';
import { getEventDetails } from '@/lib/APIs/events/get-event-details/route';
import { getStreamChats, sendStreamChat, getStreamViewerCount, getStreamVideo, validateStreamToken, getStreamAccess } from '@/lib/APIs/streams/route';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { recordStreamingPayment } from '@/lib/APIs/payments/route';
import { getCurrencies, type Currency } from '@/lib/APIs/public';
import { joinEvent } from '@/lib/APIs/events/join-event/route';
import type { Event } from '@/lib/APIs/events/get-events/route';
import { getPublicEventById } from '@/lib/APIs/public/get-events/route';
import { contactUs } from '@/lib/APIs/public/contact-us/route';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import XentriPayModal from '../../components/XentriPayModal';

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
  replyTo?: { id: string; sender: string };
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

// Multi-event entry (supports up to 3 simultaneous streams)
interface EventEntry {
  id: string;         // unique key for this entry
  eventId: string;    // actual event ID from the API
  title: string;
  hlsManifestUrl?: string;
  liveInputId?: string;
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

  // -- Invite token validation
  const [hostIdInput, setHostIdInput] = useState('');
  const [hostIdValidated, setHostIdValidated] = useState(false);
  const [hostIdValidating, setHostIdValidating] = useState(false);
  const [hostIdError, setHostIdError] = useState<string | null>(null);
  const [validatedHlsUrl, setValidatedHlsUrl] = useState<string | null>(null);
  const [tokenRequiresPayment, setTokenRequiresPayment] = useState(false);
  const [tokenStreamFee, setTokenStreamFee] = useState(0);
  const [tokenStreamFeeCurrency, setTokenStreamFeeCurrency] = useState('');
  const [savedInviteToken, setSavedInviteToken] = useState('');
  const [buyAccessClicked, setBuyAccessClicked] = useState(false);

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

  // -- HLS player (primary)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // ── MULTI-EVENT SUPPORT ────────────────────────────────────────────────────
  // Per-event video/HLS refs
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const hlsInstancesRef = useRef<Record<string, Hls | null>>({});

  const [events, setEvents] = useState<EventEntry[]>([]);
  const [mainEventIndex, setMainEventIndex] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventIdInput, setNewEventIdInput] = useState('');
  const [addEventLoading, setAddEventLoading] = useState(false);

  // ── ADVANCED CHAT ──────────────────────────────────────────────────────────
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [openMessageMenu, setOpenMessageMenu] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; sender: string; text: string } | null>(null);
  const [participants, setParticipants] = useState<{ name: string; avatar: string }[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);

  // ── ADVANCED VIDEO CONTROLS ────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('es-volume');
      return saved ? parseInt(saved, 10) : 100;
    }
    return 100;
  });
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoQuality, setVideoQuality] = useState<'auto' | '1080p' | '720p' | '480p'>('auto');

  // ── EMOJI REACTIONS ────────────────────────────────────────────────────────
  const [activeReactions, setActiveReactions] = useState<Array<{ id: number; emoji: string }>>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ── RATING / REVIEW ────────────────────────────────────────────────────────
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // ── SETTINGS / CAPTIONS / REPORT ──────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [showReportIssues, setShowReportIssues] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);

  // ── COPY STREAM ID ─────────────────────────────────────────────────────────
  const [isCopied, setIsCopied] = useState(false);

  // ── XENTRIPAY INTEGRATION ──────────────────────────────────────────────────
  const [showXentriPayModal, setShowXentriPayModal] = useState(false);
  const [xentriPayAmount, setXentriPayAmount] = useState(0);
  const [xentriPayType, setXentriPayType] = useState<'tip' | 'streaming' | 'donation'>('streaming');
  const [xentriPayEventId, setXentriPayEventId] = useState('');
  const [xentriPayCurrencyId, setXentriPayCurrencyId] = useState('');
  const [xentriPayCurrencyCode, setXentriPayCurrencyCode] = useState('USD');

  // ── DONATION ──────────────────────────────────────────────────────────────
  const [showDonationPrompt, setShowDonationPrompt] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');

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

  // Auto-validate invite token from URL on mount
  useEffect(() => {
    const token = searchParams.get('inviteToken') || searchParams.get('hostId');
    const paymentId = searchParams.get('paymentId');
    if (!token || !eventId) return;
    setHostIdInput(token);
    setSavedInviteToken(token);
    setHostIdValidating(true);

    const run = async () => {
      try {
        if (paymentId) {
          const res = await getStreamAccess(eventId, token, paymentId);
          if (res.success && res.data?.hlsManifestUrl) {
            setValidatedHlsUrl(res.data.hlsManifestUrl);
            setHostIdValidated(true);
          } else {
            setHostIdError('Could not retrieve stream access. Please contact the organizer.');
          }
        } else {
          const res = await validateStreamToken(eventId, token);
          if (res.success && res.data?.valid) {
            if (res.data.requiresPayment) {
              setTokenRequiresPayment(true);
              setTokenStreamFee(res.data.streamFee ?? 0);
              setTokenStreamFeeCurrency(res.data.currencyAbbreviation ?? '');
            } else {
              setHostIdValidated(true);
              if (res.data.hlsManifestUrl) setValidatedHlsUrl(res.data.hlsManifestUrl);
            }
          } else {
            setHostIdError('The invite token in this link is invalid or has expired.');
          }
        }
      } catch {
        setHostIdError('Could not validate the invite token. Please try again.');
      } finally {
        setHostIdValidating(false);
      }
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch event details
  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        // Always use the public endpoint first — works without auth (free events)
        const pubRes = await getPublicEventById(eventId);
        if (pubRes.success && pubRes.data) {
          const ev = pubRes.data as unknown as Event;
          setEvent(ev);
          // PublicEvent uses `eventStatus`/`completionStatus`; authed Event uses `status`
          const rawStatus = (ev as unknown as { eventStatus?: string }).eventStatus
            ?? (ev as unknown as { completionStatus?: string }).completionStatus
            ?? ev.status
            ?? '';
          setResolvedStatus(mapStatus(rawStatus));
          setEvents([{
            id: `entry-${eventId}`,
            eventId,
            title: ev.title ?? 'Live Stream',
            hlsManifestUrl: (ev as unknown as { hlsManifestUrl?: string }).hlsManifestUrl ?? undefined,
            liveInputId: ev.liveInputId ?? undefined,
          }]);

          // If authenticated, also fetch registration status
          if (isAuthenticated) {
            try {
              const authRes = await getEventDetails(eventId);
              if (authRes.success && authRes.data) {
                setIsRegistered(!!(authRes.data as { isRegistered?: boolean }).isRegistered);
              }
            } catch { /* ignore — registration check is optional */ }
          }
        } else {
          setLoadError(pubRes.error || 'Failed to load event details.');
        }
      } catch {
        setLoadError('An error occurred loading the event.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Fetch stream video data (replay URL + stats)
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
    const hlsUrl = validatedHlsUrl || event?.hlsManifestUrl;
    if (!hlsUrl) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

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
  }, [resolvedStatus, event?.hlsManifestUrl, validatedHlsUrl]);

  // Chat polling every 5s (with deduplication + participant tracking)
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
            const mapped: ChatMessage[] = msgs
              .filter(m => !blockedUsers.has(String(m.senderName ?? m.sender ?? '')))
              .map(m => ({
                id: String(m.id ?? Math.random()),
                sender: String(m.senderName ?? m.sender ?? 'Anonymous'),
                senderAvatar: String(m.senderAvatar ?? `https://i.pravatar.cc/150?u=${m.senderName ?? m.id}`),
                text: String(m.content ?? m.message ?? ''),
                time: new Date(String(m.timestamp ?? m.createdAt ?? new Date())).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }));
            // Deduplication
            setChatMessages(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const fresh = mapped.filter(m => !existingIds.has(m.id));
              if (fresh.length === 0) return prev;
              return [...prev, ...fresh];
            });
            // Update participants from senders
            const senderMap = new Map<string, string>();
            msgs.forEach(m => {
              const name = String(m.senderName ?? m.sender ?? '');
              if (name && !senderMap.has(name)) {
                senderMap.set(name, String(m.senderAvatar ?? `https://i.pravatar.cc/150?u=${name}`));
              }
            });
            setParticipants(Array.from(senderMap.entries()).map(([name, avatar]) => ({ name, avatar })));
          }
        }
      } catch { /* silent */ }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [resolvedStatus, event?.liveInputId, blockedUsers]);

  // Auto-scroll chat to bottom
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

  // Persist volume to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('es-volume', volume.toString());
    }
  }, [volume]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFSChange = () => {
      const isFS = !!(
        document.fullscreenElement ||
        (document as unknown as Record<string, unknown>).webkitFullscreenElement ||
        (document as unknown as Record<string, unknown>).mozFullScreenElement
      );
      setIsFullscreen(isFS);
      setShowControls(true);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    document.addEventListener('mozfullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
      document.removeEventListener('mozfullscreenchange', handleFSChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const mainVideo = videoRef.current;
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(v => {
            const nv = Math.min(v + 10, 100);
            if (mainVideo) mainVideo.volume = nv / 100;
            return nv;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(v => {
            const nv = Math.max(v - 10, 0);
            if (mainVideo) mainVideo.volume = nv / 100;
            return nv;
          });
          break;
        case 'arrowleft':
          e.preventDefault();
          if (mainVideo) mainVideo.currentTime = Math.max(mainVideo.currentTime - 5, 0);
          break;
        case 'arrowright':
          e.preventDefault();
          if (mainVideo && mainVideo.duration) mainVideo.currentTime = Math.min(mainVideo.currentTime + 5, mainVideo.duration);
          break;
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.es-settings-menu') && !t.closest('.es-settings-btn')) setShowSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  // Close message menu when clicking outside
  useEffect(() => {
    if (openMessageMenu === null) return;
    const handler = () => setOpenMessageMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMessageMenu]);

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

  // Extract token from a pasted value
  const extractHostId = (value: string): string => {
    try {
      const url = new URL(value.trim());
      return url.searchParams.get('inviteToken') || url.searchParams.get('hostId') || value.trim();
    } catch {
      return value.trim();
    }
  };

  const handleValidateHostId = async () => {
    const token = extractHostId(hostIdInput);
    if (!token) { setHostIdError('Please enter an invite token or Event Stream Link.'); return; }
    setHostIdValidating(true);
    setHostIdError(null);
    setTokenRequiresPayment(false);
    try {
      const res = await validateStreamToken(eventId, token);
      if (res.success && res.data?.valid) {
        if (res.data.requiresPayment) {
          setSavedInviteToken(token);
          setTokenRequiresPayment(true);
          setTokenStreamFee(res.data.streamFee ?? 0);
          setTokenStreamFeeCurrency(res.data.currencyAbbreviation ?? '');
        } else {
          setHostIdValidated(true);
          if (res.data.hlsManifestUrl) setValidatedHlsUrl(res.data.hlsManifestUrl);
        }
      } else {
        setHostIdError('Invalid invite token or Event Stream Link. Please check and try again.');
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

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (!isFullscreen) {
      if (container.requestFullscreen) container.requestFullscreen();
      else if ((container as unknown as Record<string, () => void>).webkitRequestFullscreen) (container as unknown as Record<string, () => void>).webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as unknown as Record<string, () => void>).webkitExitFullscreen) (document as unknown as Record<string, () => void>).webkitExitFullscreen();
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    const v = videoRef.current;
    if (v) {
      v.volume = val / 100;
      v.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    v.currentTime = pos * v.duration;
    setVideoProgress(pos * 100);
  };

  const handleSendChat = async () => {
    if (!newChatText.trim() || !event?.liveInputId) return;
    if (!isAuthenticated) {
      router.push(`/user/auth/login?returnUrl=/user/event/${eventId}`);
      return;
    }
    const textToSend = replyingTo ? `@${replyingTo.sender} ${newChatText.trim()}` : newChatText.trim();
    setChatLoading(true);
    // Optimistic update
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: (user as unknown as { firstName?: string })?.firstName ?? 'You',
      senderAvatar: `https://i.pravatar.cc/150?u=me`,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender } : undefined,
    };
    setChatMessages(prev => [...prev, tempMsg]);
    setNewChatText('');
    setReplyingTo(null);
    try {
      await sendStreamChat(event.liveInputId, textToSend);
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

  // Gift — opens XentriPay modal
  const handleSendGift = () => {
    if (!gift.amount || parseInt(gift.amount) <= 0) return;
    const selectedCurrency = currencies.find(c => c.id === (currencies[0]?.id ?? ''));
    setXentriPayEventId(eventId);
    setXentriPayAmount(parseInt(gift.amount));
    setXentriPayType('streaming');
    setXentriPayCurrencyId(currencies[0]?.id ?? '');
    setXentriPayCurrencyCode(selectedCurrency?.code ?? currencies[0]?.code ?? 'USD');
    setGift(prev => ({ ...prev, show: false }));
    setShowXentriPayModal(true);
  };

  const handleXentriPaySuccess = () => {
    setShowXentriPayModal(false);
  };

  const isGiftValid = () => {
    return !!(gift.amount && parseInt(gift.amount) > 0);
  };

  // ── ADVANCED CHAT HANDLERS ─────────────────────────────────────────────────

  const handleDeleteMessage = (id: string) => {
    setChatMessages(prev => prev.filter(m => m.id !== id));
    setOpenMessageMenu(null);
  };

  const handleEditMessage = (id: string, text: string) => {
    setEditingMessageId(id);
    setEditingMessageText(text);
    setOpenMessageMenu(null);
  };

  const handleSaveEditedMessage = (id: string) => {
    if (editingMessageText.trim()) {
      setChatMessages(prev => prev.map(m => m.id === id ? { ...m, text: editingMessageText.trim() } : m));
    }
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleBlockUser = (sender: string) => {
    setBlockedUsers(prev => new Set(prev).add(sender));
    setChatMessages(prev => prev.filter(m => m.sender !== sender));
    setOpenMessageMenu(null);
  };

  const handleReplyToMessage = (msg: ChatMessage) => {
    setReplyingTo({ id: msg.id, sender: msg.sender, text: msg.text });
    setOpenMessageMenu(null);
  };

  // ── MULTI-EVENT HANDLERS ───────────────────────────────────────────────────

  const handleAddEvent = async (idToAdd: string) => {
    if (!idToAdd.trim() || events.length >= 3) return;
    setAddEventLoading(true);
    try {
      const res = await getPublicEventById(idToAdd.trim());
      if (res.success && res.data) {
        const ev = res.data;
        const newEntry: EventEntry = {
          id: `entry-${idToAdd.trim()}-${Date.now()}`,
          eventId: idToAdd.trim(),
          title: ev.title ?? 'Live Stream',
          hlsManifestUrl: ev.hlsManifestUrl ?? undefined,
          liveInputId: ev.liveInputId ?? undefined,
        };
        setEvents(prev => [...prev, newEntry]);
        // Init HLS for new mini-entry after mount
        setTimeout(() => {
          const hlsUrl = newEntry.hlsManifestUrl;
          const videoEl = videoRefs.current[newEntry.id];
          if (hlsUrl && videoEl) {
            if (Hls.isSupported()) {
              const hls = new Hls({ enableWorker: false });
              hls.loadSource(hlsUrl);
              hls.attachMedia(videoEl);
              hlsInstancesRef.current[newEntry.id] = hls;
              videoEl.muted = true;
              videoEl.volume = 0;
              videoEl.play().catch(() => {});
            } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
              videoEl.src = hlsUrl;
              videoEl.muted = true;
            }
          }
        }, 300);
      }
    } catch { /* silent */ }
    setAddEventLoading(false);
    setShowAddEventModal(false);
    setNewEventIdInput('');
  };

  const switchToMainEvent = (index: number) => {
    if (index === mainEventIndex || isSwapping) return;
    setIsSwapping(true);

    const oldMain = events[mainEventIndex];
    const newMain = events[index];

    // Pause and mute all
    events.forEach(e => {
      const v = videoRefs.current[e.id];
      if (v) { v.pause(); v.muted = true; v.volume = 0; }
    });
    // Also pause primary video
    if (videoRef.current) { videoRef.current.pause(); }

    setTimeout(() => {
      setMainEventIndex(index);
      setTimeout(() => {
        // Play new main with volume
        const newV = videoRefs.current[newMain.id];
        if (newV) {
          newV.muted = false;
          newV.volume = volume / 100;
          newV.play().catch(() => {});
        }
        // Keep old main as mini — muted & playing
        const oldV = videoRefs.current[oldMain.id];
        if (oldV) {
          oldV.muted = true;
          oldV.volume = 0;
          oldV.play().catch(() => {});
        }
        setIsSwapping(false);
      }, 50);
    }, 300);
  };

  const handleLeaveStream = (index: number) => {
    const entry = events[index];
    const inst = hlsInstancesRef.current[entry.id];
    if (inst) { inst.destroy(); delete hlsInstancesRef.current[entry.id]; }
    const v = videoRefs.current[entry.id];
    if (v) { v.pause(); delete videoRefs.current[entry.id]; }

    if (events.length === 1) {
      window.history.back();
    } else {
      setEvents(prev => prev.filter((_, i) => i !== index));
      setMainEventIndex(prev => (prev >= index && prev > 0) ? prev - 1 : 0);
    }
  };

  // ── EMOJI REACTIONS ────────────────────────────────────────────────────────

  const handleEmojiReaction = (emoji: string) => {
    const id = Math.floor(Date.now() + Math.random() * 1000);
    setActiveReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => setActiveReactions(prev => prev.filter(r => r.id !== id)), 3000);
    setShowEmojiPicker(false);
  };

  // ── RATING ─────────────────────────────────────────────────────────────────

  const handleSubmitRating = async () => {
    if (rating === 0) return;
    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('rating', rating.toString());
      formData.append('comment', ratingComment);
      await apiClient.post(API_ENDPOINTS.PUBLIC.SUBMIT_REVIEW, formData);
    } catch { /* silent */ }
    setShowRatingModal(false);
    setRating(0);
    setRatingComment('');
  };

  // ── REPORT ISSUE ───────────────────────────────────────────────────────────

  const handleReportIssue = async (issueType: string) => {
    setShowSettings(false);
    setShowReportIssues(false);
    try {
      await contactUs({
        fullName: 'Stream Viewer',
        email: 'stream-report@amoria.com',
        phone: '',
        subject: `Stream Report: ${issueType}`,
        message: `Issue reported on event "${event?.title ?? ''}" (ID: ${eventId}): ${issueType}`,
      });
    } catch { /* silent */ }
  };

  // ── COPY STREAM ID ─────────────────────────────────────────────────────────

  const handleCopyStreamId = async () => {
    try {
      await navigator.clipboard.writeText(eventId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch { /* silent */ }
  };

  // ── DONATION ──────────────────────────────────────────────────────────────

  const handleSendDonation = () => {
    if (!donationAmount || parseInt(donationAmount) <= 0) return;
    setXentriPayEventId(eventId);
    setXentriPayAmount(parseInt(donationAmount));
    setXentriPayType('tip');
    setXentriPayCurrencyId(currencies[0]?.id ?? '');
    setXentriPayCurrencyCode(currencies[0]?.code ?? 'USD');
    setShowDonationModal(false);
    setShowDonationPrompt(false);
    setShowXentriPayModal(true);
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const eventPrice = typeof event?.price === 'string' ? parseFloat(event.price) : (event?.price ?? 0);
  const isPaid = eventPrice > 0;
  const locationStr = event?.location
    ? (typeof event.location === 'string' ? event.location : `${(event.location as { address?: string }).address ?? ''}`)
    : '';

  const miniEvents = events.filter((_, i) => i !== mainEventIndex);
  const emojiList = ['🔥','😂','❤️','👍','👏','😍','🎉','😮','💯','🥳'];

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
        @keyframes floatUp { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-300px) scale(0.8);opacity:0} }
        .event-stream-chat::-webkit-scrollbar { width: 4px; }
        .event-stream-chat::-webkit-scrollbar-track { background: transparent; }
        .event-stream-chat::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 2px; }
        .event-stream-content { animation: fadeIn 0.3s ease; }
        .es-settings-menu { position:absolute; bottom:calc(100% + 6px); right:0; background:#1a1a1d; border:1px solid #2d3748; border-radius:10px; min-width:200px; overflow:hidden; z-index:50; box-shadow:0 4px 20px rgba(0,0,0,0.5); }
        .es-settings-item { padding:10px 16px; cursor:pointer; font-size:13px; color:#a0aec0; display:flex; align-items:center; gap:8px; }
        .es-settings-item:hover { background:#2d3748; color:#efeff1; }
        .es-emoji-picker { display:flex; gap:6px; flex-wrap:wrap; background:rgba(0,0,0,0.85); border-radius:12px; padding:8px; position:absolute; bottom:56px; left:16px; z-index:30; backdrop-filter:blur(10px); }
        .es-mini-player { border-radius:8px; overflow:hidden; background:#000; cursor:pointer; position:relative; border:2px solid transparent; transition:border-color 0.2s; }
        .es-mini-player:hover { border-color:#03969c; }
        .es-msg-menu { position:absolute; right:0; top:100%; background:#2d3748; border:1px solid #4a5568; border-radius:8px; z-index:20; overflow:hidden; min-width:140px; box-shadow:0 4px 16px rgba(0,0,0,0.4); }
        .es-msg-menu-item { padding:8px 14px; cursor:pointer; font-size:12px; color:#a0aec0; white-space:nowrap; }
        .es-msg-menu-item:hover { background:#4a5568; color:#efeff1; }
        input[type="range"].es-volume-slider { -webkit-appearance:none; appearance:none; background:transparent; cursor:pointer; width:80px; }
        input[type="range"].es-volume-slider::-webkit-slider-track { height:3px; border-radius:2px; background:rgba(255,255,255,0.3); }
        input[type="range"].es-volume-slider::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:#fff; cursor:pointer; margin-top:-4.5px; }
        input[type="range"].es-volume-slider::-moz-range-track { height:3px; border-radius:2px; background:rgba(255,255,255,0.3); }
        input[type="range"].es-volume-slider::-moz-range-thumb { width:12px; height:12px; border-radius:50%; background:#fff; cursor:pointer; border:none; }
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
                src={event.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80'}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
                  {/* Copy Stream ID */}
                  <button
                    onClick={handleCopyStreamId}
                    style={{ background: isCopied ? 'rgba(104,211,145,0.1)' : '#2d3748', color: isCopied ? '#68d391' : '#a0aec0', border: `1px solid ${isCopied ? '#68d391' : '#4a5568'}`, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    {isCopied ? '✓ Copied!' : '📋 Copy ID'}
                  </button>
                  {isPaid && (
                    <div style={{ background: 'rgba(246,173,85,0.1)', border: '1.5px solid #f6ad55', borderRadius: 10, padding: '8px 18px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#f6ad55' }}>{eventPrice.toLocaleString()} RWF</div>
                      <div style={{ fontSize: 11, color: '#a0aec0' }}>Entry fee</div>
                    </div>
                  )}
                  {!isPaid && (
                    <div style={{ background: 'rgba(104,211,145,0.1)', border: '1.5px solid #68d391', borderRadius: 10, padding: '8px 18px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#68d391' }}>Free</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#a0aec0', marginBottom: 14 }}>
                {event.date && <span>📅 {event.date}</span>}
                {event.time && <span>🕐 {event.time}</span>}
                {locationStr && <span>📍 {locationStr}</span>}
                {event.organizerName && <span>👤 {event.organizerName}</span>}
                {event.eventType && <span>🏷️ {event.eventType}</span>}
                {event.maxAttendees && <span>👥 {event.currentAttendees ?? 0} / {event.maxAttendees} guests</span>}
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

            {/* Invite token gate — shown when not yet validated */}
            {resolvedStatus === 'LIVE' && !hostIdValidated && (
              <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '8px 16px 60px' : '8px 48px 60px' }}>
                <div style={{ background: '#1a1a1d', borderRadius: 16, padding: isMobile ? '24px 20px' : '36px 32px', textAlign: 'center' }}>

                  {tokenRequiresPayment ? (
                    <>
                      <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
                      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 8 }}>Payment required to access this stream</h2>
                      <p style={{ color: '#a0aec0', fontSize: 14, marginBottom: 10, lineHeight: 1.6 }}>
                        Your invite token is valid, but this stream requires payment to watch.
                      </p>
                      <p style={{ color: '#f6ad55', fontWeight: 800, fontSize: 22, margin: '16px 0 24px' }}>
                        {tokenStreamFee.toLocaleString()} {tokenStreamFeeCurrency || 'RWF'}
                      </p>
                      <button
                        disabled={buyAccessClicked}
                        onClick={() => { setBuyAccessClicked(true); router.push(`/user/events/join-package?id=${eventId}&inviteToken=${encodeURIComponent(savedInviteToken)}`); }}
                        style={{
                          width: '100%', background: '#03969c', color: '#fff', border: 'none',
                          padding: '15px', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: buyAccessClicked ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          opacity: buyAccessClicked ? 0.65 : 1,
                        }}
                      >
                        <span style={{ fontSize: 18 }}>🎬</span>
                        Buy Access — {tokenStreamFee.toLocaleString()} {tokenStreamFeeCurrency || 'RWF'}
                      </button>
                      <button
                        onClick={() => { setTokenRequiresPayment(false); setHostIdInput(''); setBuyAccessClicked(false); }}
                        style={{ marginTop: 12, background: 'transparent', color: '#a0aec0', border: 'none', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Use a different token
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 44, marginBottom: 16 }}>🔑</div>
                      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 8 }}>Enter your Invite Token</h2>
                      <p style={{ color: '#a0aec0', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                        The organizer shared a unique <strong style={{ color: '#efeff1' }}>Invite Token</strong> or <strong style={{ color: '#efeff1' }}>Event Stream Link</strong> with you.
                        Paste it below to access the live stream.
                      </p>

                      <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row', marginBottom: 12 }}>
                        <input
                          value={hostIdInput}
                          onChange={e => { setHostIdInput(e.target.value); setHostIdError(null); }}
                          onKeyDown={e => e.key === 'Enter' && handleValidateHostId()}
                          placeholder="Paste invite token or Event Stream Link..."
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
                    </>
                  )}
                </div>
              </div>
            )}

            {resolvedStatus === 'LIVE' && hostIdValidated && (
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
                      onTimeUpdate={() => {
                        const v = videoRef.current;
                        if (v && v.duration) setVideoProgress((v.currentTime / v.duration) * 100);
                      }}
                    />

                    {/* LIVE + viewers overlay */}
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

                    {/* Floating emoji reactions */}
                    {activeReactions.map(r => (
                      <div
                        key={r.id}
                        style={{ position: 'absolute', bottom: 70, right: `${10 + (r.id % 30)}%`, fontSize: '2.2rem', animation: 'floatUp 3s ease-out forwards', pointerEvents: 'none', zIndex: 20 }}
                      >
                        {r.emoji}
                      </div>
                    ))}

                    {/* Emoji picker */}
                    {showEmojiPicker && (
                      <div className="es-emoji-picker" onClick={e => e.stopPropagation()}>
                        {emojiList.map(em => (
                          <button key={em} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '2px' }} onClick={() => handleEmojiReaction(em)}>{em}</button>
                        ))}
                      </div>
                    )}

                    {/* Controls */}
                    {showControls && (
                      <div
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '36px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Progress bar */}
                        <div
                          style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 4, cursor: 'pointer', position: 'relative' }}
                          onClick={handleProgressChange}
                        >
                          <div style={{ height: '100%', width: `${videoProgress}%`, background: '#03969c', borderRadius: 4, pointerEvents: 'none' }} />
                        </div>

                        {/* Button row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>
                            {isPlaying ? '⏸' : '▶'}
                          </button>

                          {/* Volume */}
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}
                            onMouseEnter={() => setShowVolumeSlider(true)}
                            onMouseLeave={() => setShowVolumeSlider(false)}
                          >
                            <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>
                              {isMuted || volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
                            </button>
                            {showVolumeSlider && (
                              <input
                                type="range"
                                className="es-volume-slider"
                                min={0} max={100} value={volume}
                                onChange={e => handleVolumeChange(Number(e.target.value))}
                                onClick={e => e.stopPropagation()}
                              />
                            )}
                          </div>

                          {/* Emoji reactions toggle */}
                          <button
                            onClick={() => setShowEmojiPicker(v => !v)}
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                            title="Emoji reactions"
                          >
                            😊
                          </button>

                          {/* Participants */}
                          <button
                            onClick={() => setShowParticipants(v => !v)}
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
                            title="Participants"
                          >
                            👥
                          </button>

                          {/* Rate */}
                          <button
                            onClick={() => setShowRatingModal(true)}
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
                            title="Rate stream"
                          >
                            ⭐
                          </button>

                          <span style={{ marginLeft: 'auto', color: '#a0aec0', fontSize: 12 }}>
                            {event.title}
                          </span>

                          {/* Fullscreen */}
                          <button
                            onClick={toggleFullscreen}
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                            title="Fullscreen"
                          >
                            {isFullscreen ? '⛶' : '⛶'}
                          </button>

                          {/* Settings */}
                          <div style={{ position: 'relative' }}>
                            <button
                              className="es-settings-btn"
                              onClick={e => { e.stopPropagation(); setShowSettings(v => !v); }}
                              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                              title="Settings"
                            >
                              ⚙️
                            </button>
                            {showSettings && (
                              <div className="es-settings-menu">
                                <div className="es-settings-item" onClick={() => { setVideoQuality('auto'); setShowSettings(false); }}>
                                  {videoQuality === 'auto' ? '✓ ' : ''}Quality: Auto
                                </div>
                                {(['1080p','720p','480p'] as const).map(q => (
                                  <div key={q} className="es-settings-item" onClick={() => { setVideoQuality(q); setShowSettings(false); }}>
                                    {videoQuality === q ? '✓ ' : ''}{q}
                                  </div>
                                ))}
                                <div style={{ borderTop: '1px solid #2d3748' }} />
                                <div className="es-settings-item" onClick={() => { setCaptionsEnabled(v => !v); setShowSettings(false); }}>
                                  {captionsEnabled ? '✓ ' : ''}Captions
                                </div>
                                <div className="es-settings-item" onClick={() => { setShowSettings(false); setShowReportIssues(true); }}>
                                  🚩 Report Issue
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No manifest fallback */}
                    {!validatedHlsUrl && !event.hlsManifestUrl && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 40 }}>📡</div>
                        <p style={{ color: '#a0aec0', fontSize: 14 }}>Stream starting soon...</p>
                      </div>
                    )}
                  </div>

                  {/* Mini-players sidebar for additional streams */}
                  {miniEvents.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                      {miniEvents.map(entry => {
                        const absIdx = events.findIndex(e => e.id === entry.id);
                        return (
                          <div
                            key={entry.id}
                            className="es-mini-player"
                            style={{ width: 160, height: 90 }}
                            onClick={() => switchToMainEvent(absIdx)}
                            title={`Switch to: ${entry.title}`}
                          >
                            <video
                              ref={el => { videoRefs.current[entry.id] = el; }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              muted playsInline
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 6 }}>
                              <div style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {entry.title}
                              </div>
                              <button
                                style={{ background: 'rgba(229,62,62,0.8)', border: 'none', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: '0.6rem', cursor: 'pointer', alignSelf: 'flex-end' }}
                                onClick={e => { e.stopPropagation(); handleLeaveStream(absIdx); }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {events.length < 3 && (
                        <div
                          style={{ width: 160, height: 90, background: '#1a1a1d', borderRadius: 8, border: '2px dashed #2d3748', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 4 }}
                          onClick={() => setShowAddEventModal(true)}
                        >
                          <span style={{ fontSize: '1.4rem', color: '#03969c' }}>+</span>
                          <span style={{ fontSize: '0.65rem', color: '#718096' }}>Add Stream</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => requireAuth(() => setGift(prev => ({ ...prev, show: true })))}
                      style={{ background: 'linear-gradient(135deg, #f6ad55, #ed8936)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}
                    >
                      🎁 Send a Gift
                    </button>
                    <button
                      onClick={() => setShowDonationPrompt(true)}
                      style={{ background: 'rgba(159,122,234,0.15)', color: '#b794f4', border: '1px solid #b794f4', padding: '10px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}
                    >
                      💝 Donate
                    </button>
                    {events.length < 3 && miniEvents.length === 0 && (
                      <button
                        onClick={() => setShowAddEventModal(true)}
                        style={{ background: '#2d3748', color: '#a0aec0', border: '1px solid #4a5568', padding: '10px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}
                      >
                        ➕ Add Stream
                      </button>
                    )}
                  </div>

                  {/* Donation prompt banner */}
                  {showDonationPrompt && (
                    <div style={{ background: 'rgba(159,122,234,0.08)', border: '1px solid rgba(159,122,234,0.3)', borderRadius: 10, padding: '12px 16px', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <span style={{ color: '#a0aec0', fontSize: 14 }}>💝 Support the streamer?</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ background: '#b794f4', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={() => { setShowDonationPrompt(false); setShowDonationModal(true); }}>Yes!</button>
                        <button style={{ background: 'transparent', color: '#718096', border: '1px solid #4a5568', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }} onClick={() => setShowDonationPrompt(false)}>Not now</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat column */}
                <div style={{
                  width: isMobile ? '100%' : 310,
                  marginTop: isMobile ? 20 : 0,
                  background: '#1a1a1d',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  height: isMobile ? 360 : 520,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #2d3748', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    💬 Live Chat
                    {chatMessages.length > 0 && (
                      <span style={{ fontSize: 11, color: '#718096' }}>{chatMessages.length} msgs</span>
                    )}
                    {/* Participants toggle */}
                    <button
                      onClick={() => setShowParticipants(v => !v)}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                      title="Toggle participants"
                    >
                      👥 {participants.length}
                    </button>
                  </div>

                  {/* Participants panel */}
                  {showParticipants && participants.length > 0 && (
                    <div style={{ padding: '8px 14px', borderBottom: '1px solid #2d3748', background: '#111', maxHeight: 110, overflowY: 'auto' }}>
                      <div style={{ fontSize: 11, color: '#718096', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Participants</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {participants.map(p => (
                          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1a1a1d', borderRadius: 20, padding: '3px 8px 3px 4px' }}>
                            <img src={p.avatar} alt={p.name} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                            <span style={{ fontSize: 11, color: '#a0aec0' }}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className="event-stream-chat"
                    style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {chatMessages.length === 0 && (
                      <p style={{ color: '#4a5568', fontSize: 13, textAlign: 'center', marginTop: 20 }}>No messages yet. Be the first!</p>
                    )}
                    {chatMessages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', position: 'relative' }}>
                        <img src={msg.senderAvatar} alt={msg.sender} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                            <span style={{ color: '#03969c', fontSize: 12, fontWeight: 600 }}>{msg.sender}</span>
                            <span style={{ color: '#4a5568', fontSize: 10 }}>{msg.time}</span>
                          </div>
                          {msg.replyTo && (
                            <div style={{ fontSize: 11, color: '#718096', background: '#2d3748', borderRadius: 4, padding: '2px 8px', marginTop: 2, borderLeft: '2px solid #03969c' }}>
                              ↩ {msg.replyTo.sender}
                            </div>
                          )}
                          {editingMessageId === msg.id ? (
                            <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                              <input
                                value={editingMessageText}
                                onChange={e => setEditingMessageText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveEditedMessage(msg.id); if (e.key === 'Escape') setEditingMessageId(null); }}
                                style={{ flex: 1, background: '#2d3748', border: '1px solid #4a5568', borderRadius: 5, padding: '4px 8px', color: '#efeff1', fontSize: 12, outline: 'none' }}
                                autoFocus
                              />
                              <button style={{ background: '#03969c', border: 'none', color: '#fff', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }} onClick={() => handleSaveEditedMessage(msg.id)}>✓</button>
                            </div>
                          ) : (
                            <p style={{ fontSize: 13, margin: '2px 0 0', color: '#e2e8f0', wordBreak: 'break-word' }}>{msg.text}</p>
                          )}
                        </div>
                        {/* Message menu */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <button
                            style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', padding: '2px 4px', fontSize: 12, borderRadius: 4, lineHeight: 1 }}
                            onClick={e => { e.stopPropagation(); setOpenMessageMenu(prev => prev === msg.id ? null : msg.id); }}
                          >⋮</button>
                          {openMessageMenu === msg.id && (
                            <div className="es-msg-menu">
                              <div className="es-msg-menu-item" onClick={() => handleReplyToMessage(msg)}>↩ Reply</div>
                              <div className="es-msg-menu-item" onClick={() => handleEditMessage(msg.id, msg.text)}>✏️ Edit</div>
                              <div className="es-msg-menu-item" onClick={() => handleDeleteMessage(msg.id)}>🗑️ Delete</div>
                              <div className="es-msg-menu-item" style={{ color: '#fc8181' }} onClick={() => handleBlockUser(msg.sender)}>🚫 Block</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Reply indicator */}
                  {replyingTo && (
                    <div style={{ padding: '6px 12px', background: '#2d3748', borderTop: '1px solid #4a5568', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#718096' }}>↩ Replying to <strong style={{ color: '#03969c' }}>{replyingTo.sender}</strong></span>
                      <button style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: 12 }} onClick={() => setReplyingTo(null)}>✕</button>
                    </div>
                  )}

                  <div style={{ padding: '10px 12px', borderTop: '1px solid #2d3748', display: 'flex', gap: 8 }}>
                    {isAuthenticated ? (
                      <>
                        <input
                          value={newChatText}
                          onChange={e => setNewChatText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                          placeholder={replyingTo ? `Reply to ${replyingTo.sender}...` : 'Say something...'}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {resolvedStatus === 'COMPLETED' ? 'Event Replay' : 'Stream Recording'}
                  </h2>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    style={{ background: 'rgba(246,173,85,0.1)', color: '#f6ad55', border: '1px solid #f6ad55', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    ⭐ Rate this Stream
                  </button>
                </div>

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
                placeholder="Amount"
                value={gift.amount}
                onChange={e => setGift(prev => ({ ...prev, amount: e.target.value }))}
                style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }}
              />

              {/* Currency selector */}
              {currencies.length > 0 && (
                <select
                  style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                  onChange={e => {
                    const c = currencies.find(c => c.id === e.target.value);
                    if (c) {
                      setXentriPayCurrencyId(c.id);
                      setXentriPayCurrencyCode(c.code);
                    }
                  }}
                >
                  {currencies.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              )}

              {/* Message */}
              <input
                type="text"
                placeholder="Message (optional)"
                value={gift.message}
                onChange={e => setGift(prev => ({ ...prev, message: e.target.value }))}
                style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, marginBottom: 20, boxSizing: 'border-box', outline: 'none' }}
              />

              {gift.error && <p style={{ color: '#fc8181', fontSize: 13, marginBottom: 10 }}>{gift.error}</p>}

              <button
                onClick={handleSendGift}
                disabled={gift.loading || !isGiftValid()}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #f6ad55, #ed8936)', color: '#fff', border: 'none',
                  padding: '13px', borderRadius: 9, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  opacity: (gift.loading || !isGiftValid()) ? 0.65 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {gift.loading
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Processing…</>
                  : '🎁 Continue to Payment'
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Donation Modal ───────────────────────────────────────────── */}
        {showDonationModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowDonationModal(false); }}>
            <div style={{ background: '#1a1a1d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>💝 Support the Streamer</h2>
                <button onClick={() => setShowDonationModal(false)} style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
              <input
                type="number" min="1"
                placeholder="Donation amount"
                value={donationAmount}
                onChange={e => setDonationAmount(e.target.value)}
                style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 15, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }}
              />
              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {['5','10','20','50'].map(amt => (
                  <button key={amt} style={{ background: donationAmount === amt ? '#b794f4' : '#2d3748', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={() => setDonationAmount(amt)}>${amt}</button>
                ))}
              </div>
              <button
                onClick={handleSendDonation}
                disabled={!donationAmount || parseInt(donationAmount) <= 0}
                style={{ width: '100%', background: '#b794f4', color: '#fff', border: 'none', padding: 13, borderRadius: 9, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: (!donationAmount || parseInt(donationAmount) <= 0) ? 0.65 : 1 }}
              >
                Donate
              </button>
            </div>
          </div>
        )}

        {/* ── Add Stream Modal ─────────────────────────────────────────── */}
        {showAddEventModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowAddEventModal(false); }}>
            <div style={{ background: '#1a1a1d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>➕ Add Stream</h2>
                <button onClick={() => setShowAddEventModal(false)} style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
              <p style={{ color: '#a0aec0', fontSize: 13, marginBottom: 16 }}>
                Enter the Event ID of another live stream to watch simultaneously (max 3 streams).
              </p>
              <input
                placeholder="Paste event ID here…"
                value={newEventIdInput}
                onChange={e => setNewEventIdInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddEvent(newEventIdInput); }}
                style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', outline: 'none' }}
              />
              <button
                onClick={() => handleAddEvent(newEventIdInput)}
                disabled={!newEventIdInput.trim() || addEventLoading || events.length >= 3}
                style={{ width: '100%', background: '#03969c', color: '#fff', border: 'none', padding: 13, borderRadius: 9, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: (!newEventIdInput.trim() || addEventLoading || events.length >= 3) ? 0.65 : 1 }}
              >
                {addEventLoading ? 'Loading…' : 'Add Stream'}
              </button>
            </div>
          </div>
        )}

        {/* ── Rating Modal ─────────────────────────────────────────────── */}
        {showRatingModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowRatingModal(false); }}>
            <div style={{ background: '#1a1a1d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>⭐ Rate this Stream</h2>
                <button onClick={() => setShowRatingModal(false)} style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    style={{ background: 'none', border: 'none', fontSize: '2.2rem', cursor: 'pointer', color: star <= (hoverRating || rating) ? '#f6ad55' : '#4a5568', lineHeight: 1 }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >★</button>
                ))}
              </div>
              <textarea
                rows={3}
                placeholder="Share your thoughts… (optional)"
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 12px', color: '#efeff1', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
              />
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0}
                style={{ width: '100%', background: '#03969c', color: '#fff', border: 'none', padding: 13, borderRadius: 9, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: rating === 0 ? 0.65 : 1 }}
              >
                Submit Rating
              </button>
            </div>
          </div>
        )}

        {/* ── Report Issues Modal ───────────────────────────────────────── */}
        {showReportIssues && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowReportIssues(false); }}>
            <div style={{ background: '#1a1a1d', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🚩 Report an Issue</h2>
                <button onClick={() => setShowReportIssues(false)} style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
              <p style={{ color: '#a0aec0', fontSize: 13, marginBottom: 16 }}>Select the type of issue you&apos;re experiencing:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Video not loading','Poor video quality','Audio issues','Stream buffering','Other technical issue'].map(issue => (
                  <button
                    key={issue}
                    onClick={() => handleReportIssue(issue)}
                    style={{ background: '#2d3748', color: '#a0aec0', border: '1px solid #4a5568', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}
                  >
                    {issue}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── XentriPay Modal ──────────────────────────────────────────── */}
        {showXentriPayModal && (
          <XentriPayModal
            isOpen={showXentriPayModal}
            onClose={() => setShowXentriPayModal(false)}
            onSuccess={handleXentriPaySuccess}
            amount={xentriPayAmount}
            currencyCode={xentriPayCurrencyCode}
            currencyId={xentriPayCurrencyId}
            paymentType={xentriPayType === 'tip' ? 'donation' : 'streaming'}
            eventId={xentriPayEventId}
            title={xentriPayType === 'tip' ? 'Complete Your Donation' : 'Send a Gift'}
          />
        )}

      </div>
    </>
  );
}
