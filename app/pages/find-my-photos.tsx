'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../components/navbar';
import XentriPayModal from '../components/XentriPayModal';
import { getAlbumByCode, type AlbumPhoto } from '@/lib/APIs/public/get-album/route';
import { uploadSelfieForRecognition, type MatchedPhoto } from '@/lib/APIs/customer/facial-recognition/route';
import { getCurrencies, type Currency } from '@/lib/APIs/public';
import { getCurrencyRates, type CurrencyRate } from '@/lib/APIs/public/get-currency-rates/route';
import { recordStreamingPayment } from '@/lib/APIs/payments/route';
import { recordAlbumPurchase, initiateXentriPayAlbumPurchase } from '@/lib/APIs/payments/xentripay';
import { identifyAlbumBuyer } from '@/lib/APIs/public/identify-buyer/route';
import { unlockAlbumPhotos } from '@/lib/APIs/public/unlock-photos/route';
import { getDeviceId } from '@/lib/fingerprint';
import { requestFreeAlbumAccess } from '@/lib/APIs/public/request-free-access/route';
import { verifyFreeAlbumAccess } from '@/lib/APIs/public/verify-free-access/route';
import {
  getFreeAlbum,
  logFreeAlbumDownload,
  type FreeAlbumPhoto,
} from '@/lib/APIs/public/get-free-album/route';
import { API_ENDPOINTS } from '@/lib/api/config';
import { API_CONFIG } from '@/lib/api/config';
import InternationalPhoneInput, { type PhoneValue } from '../components/phone/InternationalPhoneInput';

// Photo shape used throughout the page, augmented with album-purchase fields
type PhotoItem = {
  id: string;
  /** Grid-sized image (server thumbnail when one exists). */
  url: string;
  /** Full-resolution image for the lightbox; falls back to url. */
  fullUrl?: string;
  alt: string;
  price?: number;
  albumId?: string;
  albumType?: string;
  currencyAbbreviation?: string;
  currencyId?: string;
  isPurchased?: boolean;
};

// Build a full URL from an API endpoint path (respects proxy in production)
function apiUrl(path: string): string {
  const base = API_CONFIG.baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

// Per-viewer identifier persisted in localStorage. Stamped into every preview
// image the user sees so that any screenshot/leak can be traced back to the
// specific browser that viewed it. Prefers buyerId once we know one, otherwise
// falls back to a per-device random id. This is NOT a security token - the
// server only uses it as watermark text.
function getViewerId(buyerId?: string | null): string {
  if (buyerId) return `B${buyerId.slice(0, 8)}`;
  if (typeof window === 'undefined') return 'anon';
  try {
    let id = window.localStorage.getItem('photoViewerId');
    if (!id) {
      id = 'V' + Math.random().toString(36).slice(2, 10).toUpperCase();
      window.localStorage.setItem('photoViewerId', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

// Append viewer/purchase context to preview URLs so the backend can:
//   - stamp the viewer id into the pixels (traceability)
//   - detect purchase status and serve a CLEAR watermarked preview instead of
//     the pixelated mosaic that unpaid users see
// Leaves non-preview URLs untouched.
function stampPreviewUrl(
  url: string | undefined,
  viewerId: string,
  purchase?: { buyerId?: string | null; refid?: string | null },
): string | undefined {
  if (!url) return url;
  if (!url.includes('/api/photos/') || !url.includes('/preview')) return url;
  const params = new URLSearchParams();
  params.set('v', viewerId);
  if (purchase?.buyerId) params.set('buyerId', purchase.buyerId);
  if (purchase?.refid) params.set('refid', purchase.refid);
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${params.toString()}`;
}

const FindMyPhotos = () => {
  const searchParams = useSearchParams();

  // Responsive
  const [isMobile, setIsMobile] = useState(false);

  // Invite code flow
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isCodeSubmitted, setIsCodeSubmitted] = useState(false);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false);

  // Dot pattern mouse tracking
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const headerSectionRef = useRef<HTMLDivElement>(null);
  const gridSectionRef = useRef<HTMLDivElement>(null);
  const [heroMousePos, setHeroMousePos] = useState<{ x: number; y: number } | null>(null);
  const [headerMousePos, setHeaderMousePos] = useState<{ x: number; y: number } | null>(null);
  const [gridMousePos, setGridMousePos] = useState<{ x: number; y: number } | null>(null);

  // Photo grid
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([]);
  const [displayedPhotos, setDisplayedPhotos] = useState<PhotoItem[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);

  // Multi-select album purchase state
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  // Multi-select state for the verified-free-album view (separate from the
  // main photo grid above because that flow uses a different data shape:
  // FreeAlbumPhoto[] vs PhotoItem[]). Both flows share the same bottom
  // action-bar pattern via inline render checks.
  const [selectedFreePhotoIds, setSelectedFreePhotoIds] = useState<Set<string>>(new Set());
  const [purchaseRefid, setPurchaseRefid] = useState<string | null>(null);
  const [xentriModalOpen, setXentriModalOpen] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{
    // For single-album buys this is the gallery being charged. For multi-album
    // buys this stays as the FIRST item's albumId (used as a fallback for
    // download-loop calls that need *some* albumId; the per-photo download
    // resolves auth via refid which now spans all rows in the multi-album set).
    albumId: string;
    photoIds: string[];
    amount: number;
    currencyId: string;
    currencyCode: string;
    // Populated only when the buyer's selection spans multiple photographers.
    // One item per gallery; backend creates N AlbumPurchase rows sharing one
    // refid so each photographer gets the right slice of revenue.
    multiAlbumItems?: { albumId: string; photoIds: string[]; amount: number; currencyId: string }[];
    // Per-photo lookup so the auto-download loop can pick the right albumId
    // for each photoId without re-grouping (different photos came from
    // different galleries in the multi-album case).
    photoAlbumMap?: Record<string, string>;
  } | null>(null);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);
  const [pendingDonationAmount, setPendingDonationAmount] = useState(0);

  // Persistent buyer identity (one per album) - mirrors anonymous-viewer pattern
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [buyerAlbumId, setBuyerAlbumId] = useState<string | null>(null);
  // "Your Details" modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsName, setDetailsName] = useState('');
  const [detailsEmail, setDetailsEmail] = useState('');
  // Phone is deliberately NOT collected here any more: identity is name +
  // email only, and the payment step asks for the mobile-money number where
  // it is actually charged. Asking twice read as two separate payments.
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  // Pending photos to buy, held while details modal is open
  const pendingBuyRef = useRef<PhotoItem[] | null>(null);

  // "Unlock my photos" modal - for returning buyers who paid before and want
  // to re-download with either the emailed unlock code or their email.
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockMode, setUnlockMode] = useState<'code' | 'email'>('code');
  const [unlockCodeInput, setUnlockCodeInput] = useState('');
  const [unlockEmailInput, setUnlockEmailInput] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  // Most-recent unlock code from a successful purchase (shown in the success
  // banner so the buyer can copy it before navigating away).
  const [recentUnlockCode, setRecentUnlockCode] = useState<string | null>(null);

  // Scan modal
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera selfie
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image viewer modal
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  // Album metadata for payment
  const [albumEventId, setAlbumEventId] = useState('');
  const [albumCurrencyId, setAlbumCurrencyId] = useState('');
  const [albumCurrencySymbol, setAlbumCurrencySymbol] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  // Live "1 USD = X local" rates, keyed by both currency id and abbreviation
  // so any photo field shape can resolve. Loaded once on mount; used to
  // normalize multi-album totals to USD when slices span different currencies.
  const [currencyRates, setCurrencyRates] = useState<Record<string, CurrencyRate>>({});

  // Download payment modal (legacy single-photo path kept for non-album flows)
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<PhotoItem | null>(null);
  const [dlPaymentMethod, setDlPaymentMethod] = useState<string | null>(null);
  const [dlPhoneVal, setDlPhoneVal] = useState<PhoneValue | null>(null);
  const [dlCardNumber, setDlCardNumber] = useState('');
  const [dlCardExpiry, setDlCardExpiry] = useState('');
  const [dlCardCvv, setDlCardCvv] = useState('');
  const [dlCardHolderName, setDlCardHolderName] = useState('');
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);
  const [dlSuccess, setDlSuccess] = useState(false);

  // Free album flow state (DO NOT modify existing state above)
  const [freeAlbumFlow, setFreeAlbumFlow] = useState<'idle' | 'email' | 'otp' | 'verified'>('idle');
  const [freeAlbumEmail, setFreeAlbumEmail] = useState('');
  const [freeAlbumId, setFreeAlbumId] = useState('');
  const [freeAlbumTitle, setFreeAlbumTitle] = useState('');
  const [freeAlbumPhotographer, setFreeAlbumPhotographer] = useState('');
  const [freeAlbumPhotos, setFreeAlbumPhotos] = useState<FreeAlbumPhoto[]>([]);
  const [freeAlbumExpiresAt, setFreeAlbumExpiresAt] = useState('');
  const [freeAlbumError, setFreeAlbumError] = useState('');
  const [freeAlbumLoading, setFreeAlbumLoading] = useState(false);
  const [freeAlbumOtp, setFreeAlbumOtp] = useState('');
  // Cap + pay-for-extras: when an album has maxFreeDownloads set, the first
  // `cap` selected photos are free and the remainder requires payment at
  // `pricePerExtraImage` each (existing paid-album XentriPay flow).
  const [freeAlbumMax, setFreeAlbumMax] = useState<number | null>(null);
  const [freeAlbumPricePerExtra, setFreeAlbumPricePerExtra] = useState<number>(0);
  const [freeAlbumCurrencyId, setFreeAlbumCurrencyId] = useState<string>('');
  const [freeAlbumCurrencyAbbr, setFreeAlbumCurrencyAbbr] = useState<string>('');
  const [freeIsProcessing, setFreeIsProcessing] = useState(false);
  const [freeStatusMsg, setFreeStatusMsg] = useState('');
  // When the XentriPayModal opens for free-album extras (not paid-album
  // photos), this captures the in-flight overflow + full-selection ids so
  // handlePurchaseSuccess can route the post-payment download through the
  // free-album direct-URL path instead of the paid-album backend path.
  // Cleared on modal close or onSuccess.
  const [freeExtrasInFlight, setFreeExtrasInFlight] = useState<{
    overflowIds: string[];
    allSelectedIds: string[];
  } | null>(null);
  // Photos this email has already free-downloaded (cumulative) or purchased
  // on this album. returned by the backend on verify/getFreeAlbum. Renders
  // a ✓ OWNED badge, never counts against the free cap, always free to
  // re-download.
  const [freeAcquiredIds, setFreeAcquiredIds] = useState<Set<string>>(new Set());
  // One-shot "you're about to use a paid extra" warning modal. fires the
  // first time the user's selection (minus OWNED) crosses the free cap.
  const [freeCapWarnShown, setFreeCapWarnShown] = useState(false);
  const [freeCapWarnOpen, setFreeCapWarnOpen] = useState(false);

  // Links sent before this change carry ?email=<recipient>. It is captured
  // once here and then taken off the address bar, because leaving it there
  // keeps a real person's email in browser history, in the referrer of every
  // outbound request, and in whatever the link gets pasted into.
  //
  // The capture is a ref rather than a re-read of the URL: the auto-verify
  // below reads this inside an async callback, long after the scrub has run,
  // and it must not depend on how the framework snapshots search params.
  // replaceState edits the entry in place, so Back does not restore it.
  const legacyEmailRef = useRef<string | null>(
    typeof window === 'undefined'
      ? null
      : new URL(window.location.href).searchParams.get('email'),
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has('email')) return;
    url.searchParams.delete('email');
    window.history.replaceState(null, '', url.toString());
  }, []);

  // Auto-fill invite code from URL param and load album (e.g. /find-my-photos?code=ABC123)
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && !inviteCode) {
      setInviteCode(codeFromUrl);
      setIsLoadingAlbum(true);
      getAlbumByCode(codeFromUrl).then(response => {
        if (response.success && response.data) {
          if (response.data.albumType === 'free') {
            setFreeAlbumId(response.data.albumId || response.data.eventId || '');
            setFreeAlbumTitle(response.data.eventTitle || response.data.title || '');
            setFreeAlbumPhotographer(response.data.photographerName || '');
            // The access code IS the proof of ownership — it was emailed to
            // the recipient, and the server resolves who that is. Invitation
            // links no longer carry an email, so auto-verify runs on the code
            // alone. Links already in inboxes still carry one: it is honoured
            // for this verification and then scrubbed from the address bar
            // below, so a real person's email stops travelling through
            // history, referrers and pasted links.
            const emailFromUrl = legacyEmailRef.current;
            {
              if (emailFromUrl) setFreeAlbumEmail(emailFromUrl);
              setFreeAlbumFlow('otp');
              setFreeAlbumLoading(true);
              // Auto-submit: use the access code itself as the OTP (proves email ownership)
              verifyFreeAlbumAccess(codeFromUrl, emailFromUrl ?? '', codeFromUrl).then((verifyRes) => {
                if (verifyRes.success && verifyRes.data) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const d = verifyRes.data as any;
                  setFreeAlbumId(d.albumId || '');
                  applyFreeAlbumPricing(d);
                  if (d.photos?.length) {
                    setFreeAlbumPhotos(d.photos);
                    if (d.title) setFreeAlbumTitle(d.title);
                    if (d.photographerName) setFreeAlbumPhotographer(d.photographerName);
                    if (d.expiresAt) setFreeAlbumExpiresAt(d.expiresAt);
                    setFreeAlbumFlow('verified');
                    // Pull cap/price authoritatively if verify omitted them.
                    if (d.maxFreeDownloads == null && d.pricePerExtraImage == null) {
                      const aid = d.albumId || '';
                      if (aid) {
                        getFreeAlbum(aid).then(extra => {
                          if (extra.success && extra.data) applyFreeAlbumPricing(extra.data);
                        }).catch(() => {});
                      }
                    }
                  } else {
                    // No photos in response - fall back to OTP screen
                    setFreeAlbumOtp(codeFromUrl);
                    if (!emailFromUrl) setFreeAlbumFlow('email');
                  }
                } else {
                  // Auto-verify failed. With an address in hand the OTP
                  // screen is usable — it can show the masked address and
                  // resend to it. Without one it is a dead end: nothing to
                  // mask, and Resend has nowhere to send. Links no longer
                  // carry an email, so that is now the common case; fall
                  // back to the email-entry screen, which works, and say
                  // what actually went wrong instead of blanking it.
                  if (emailFromUrl) {
                    setFreeAlbumError(verifyRes.error || '');
                  } else {
                    setFreeAlbumFlow('email');
                  }
                }
                setFreeAlbumLoading(false);
              }).catch(() => {
                // Same dead end on a network failure.
                if (!emailFromUrl) setFreeAlbumFlow('email');
                setFreeAlbumLoading(false);
              });
            }
            return;
          }
          setAlbumEventId(response.data.eventId ?? response.data.albumId);
          // The verify response carries the gallery title + photographer for
          // every album type, but only the free flow captured them. The paid
          // path dropped both - so the gallery hero said "Event Gallery" and
          // the preview watermark fell back to "PREVIEW" instead of the
          // photographer's name.
          if (response.data.title) setFreeAlbumTitle(response.data.title);
          if (response.data.photographerName) setFreeAlbumPhotographer(response.data.photographerName);
          if (response.data.pricing?.currencyId) setAlbumCurrencyId(response.data.pricing.currencyId);
          if (response.data.pricing?.currencySymbol) setAlbumCurrencySymbol(response.data.pricing.currencySymbol);
          const perPhotoPrice = response.data.pricing?.pricePerImage ?? response.data.pricePerPhoto;
          const albumCurAbbr = response.data.pricing?.currencyAbbreviation;
          const albumCurId = response.data.pricing?.currencyId;
          const resolvedAlbumId = response.data.albumId;
          const photos = (response.data.photos ?? []).map((p: AlbumPhoto) => ({
            id: p.id,
            // Grid loads the server thumbnail; the lightbox gets the
            // original. Locked paid photos have url=null, so both resolve
            // to the thumb - originals only leave via the purchase path.
            url: p.thumbnailUrl || p.url || '',
            fullUrl: p.url || p.thumbnailUrl || '',
            alt: p.alt || p.eventTitle || 'Event photo',
            price: p.price ?? perPhotoPrice,
            albumId: resolvedAlbumId,
            albumType: response.data?.albumType,
            currencyAbbreviation: albumCurAbbr,
            currencyId: albumCurId,
          }));
          setAllPhotos(photos);
          setDisplayedPhotos(photos);
          setIsCodeSubmitted(true);
        } else {
          setInviteError(response.error || 'Invalid invite code');
        }
      }).catch(() => {
        setInviteError('Failed to load album');
      }).finally(() => {
        setIsLoadingAlbum(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pick up prior purchase refid/buyerId from the URL so purchases persist
  useEffect(() => {
    const refidFromUrl = searchParams.get('refid');
    if (refidFromUrl && !purchaseRefid) {
      setPurchaseRefid(refidFromUrl);
    }
    const buyerFromUrl = searchParams.get('buyerId');
    const albumFromUrl = searchParams.get('albumId');
    if (buyerFromUrl && !buyerId) {
      setBuyerId(buyerFromUrl);
      if (albumFromUrl) setBuyerAlbumId(albumFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // When we know the album (either from invite-code or after a scan), load any
  // saved buyerId for that album from localStorage so returning visitors are recognized.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Derive a candidate albumId from displayed photos if not already set
    let albumIdCandidate = buyerAlbumId;
    if (!albumIdCandidate) {
      const first = displayedPhotos.find(p => p.albumId);
      if (first?.albumId) albumIdCandidate = first.albumId;
    }
    if (!albumIdCandidate || (buyerId && buyerAlbumId === albumIdCandidate)) return;
    try {
      const stored = localStorage.getItem(`album_buyer_id:${albumIdCandidate}`);
      if (stored) {
        setBuyerId(stored);
        setBuyerAlbumId(albumIdCandidate);
      }
    } catch {}
    // Auto-fill saved buyer details for the modal
    try {
      const details = localStorage.getItem('album_buyer_details');
      if (details) {
        // Older saves may carry a phone; it is read-tolerated and ignored.
        const parsed = JSON.parse(details) as { name?: string; email?: string; phone?: string };
        if (parsed.name && !detailsName) setDetailsName(parsed.name);
        if (parsed.email && !detailsEmail) setDetailsEmail(parsed.email);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedPhotos, buyerAlbumId]);

  // Mouse handlers for dot pattern spotlight effect
  const handleMouseMove = (
    ref: React.RefObject<HTMLDivElement | null>,
    setter: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>
  ) => (e: React.MouseEvent<HTMLElement>) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setter({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleInviteSubmit = async () => {
    if (!inviteCode.trim()) {
      setInviteError('Please enter a valid invite code');
      return;
    }
    setInviteError('');
    setIsLoadingAlbum(true);
    try {
      const response = await getAlbumByCode(inviteCode.trim());
      if (response.success && response.data) {
        if (response.data.albumType === 'free') {
          setFreeAlbumId(response.data.albumId || response.data.eventId || '');
          setFreeAlbumTitle(response.data.title || '');
          setFreeAlbumPhotographer(response.data.photographerName || '');
          setFreeAlbumFlow('email');
          return;
        }
        setAlbumEventId(response.data.eventId ?? response.data.albumId);
        if (response.data.pricing?.currencyId) setAlbumCurrencyId(response.data.pricing.currencyId);
        if (response.data.pricing?.currencySymbol) setAlbumCurrencySymbol(response.data.pricing.currencySymbol);
        const perPhotoPrice = response.data.pricing?.pricePerImage ?? response.data.pricePerPhoto;
        // Same capture as the auto-verify path: title + photographer feed the
        // gallery hero and the preview watermark.
        if (response.data.title) setFreeAlbumTitle(response.data.title);
        if (response.data.photographerName) setFreeAlbumPhotographer(response.data.photographerName);
        // Carry album-level identifiers onto every PhotoItem. Without these the
        // Download button's purchased-photo branch can't fire (it requires
        // photo.albumId), and the buy flow can't resolve a currency/album.
        const albumId = response.data.albumId;
        const albumType = response.data.albumType;
        const currencyId = response.data.pricing?.currencyId;
        const currencyAbbreviation = response.data.pricing?.currencyAbbreviation;
        const photos = (response.data.photos ?? []).map((p: AlbumPhoto) => ({
          id: p.id,
          url: p.thumbnailUrl || p.url || '',
          fullUrl: p.url || p.thumbnailUrl || '',
          alt: p.alt || p.eventTitle || 'Event photo',
          price: p.price ?? perPhotoPrice,
          albumId,
          albumType,
          currencyId,
          currencyAbbreviation,
        }));
        setAllPhotos(photos);
        setDisplayedPhotos(photos);
        setIsCodeSubmitted(true);
      } else {
        setInviteError(response.error || 'Invalid invite code');
      }
    } catch {
      setInviteError('Failed to load album. Please try again.');
    } finally {
      setIsLoadingAlbum(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setScanError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartScan = async () => {
    if (!uploadedFile) return;

    setIsScanning(true);
    setScanError(null);
    try {
      const response = await uploadSelfieForRecognition(inviteCode.trim(), uploadedFile, {
        buyerId: buyerId || undefined,
        refid: purchaseRefid || undefined,
      });
      if (response.success && response.data) {
        const rawData = response.data as unknown as Record<string, unknown>;
        const photos: MatchedPhoto[] = rawData?.data
          ? (rawData.data as MatchedPhoto[])
          : Array.isArray(response.data)
            ? (response.data as unknown as MatchedPhoto[])
            : [];

        {
          const mapped: PhotoItem[] = photos.map((p: MatchedPhoto) => ({
            id: p.id,
            url: p.thumbnailUrl || p.url || '',
            fullUrl: p.url || p.thumbnailUrl || '',
            alt: p.alt || p.eventTitle || 'Event photo',
            price: p.pricePerImage,
            albumId: p.albumId,
            albumType: p.albumType,
            currencyAbbreviation: p.currencyAbbreviation,
            currencyId: p.currencyId,
            isPurchased: p.isPurchased,
          }));
          setDisplayedPhotos(mapped);
          setIsFiltered(true);
          setIsCodeSubmitted(true);
          setSelectedPhotoIds(new Set());
          resetScanModal();
        }
      } else {
        const err = response.error || '';
        if (err.toLowerCase().includes('no face detected')) {
          setScanError('NO_FACE');
        } else {
          setScanError(err || 'No matching photos found. Try a clearer photo.');
        }
      }
    } catch {
      setScanError('Scan failed. Please check your connection and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleShowAll = () => {
    setDisplayedPhotos(allPhotos);
    setIsFiltered(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const resetScanModal = () => {
    stopCamera();
    setIsScanModalOpen(false);
    setUploadedFile(null);
    setUploadedPreview(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Free album handlers
  const handleFreeAlbumRequestAccess = async () => {
    if (!freeAlbumEmail.trim() || !inviteCode.trim()) return;
    setFreeAlbumLoading(true);
    setFreeAlbumError('');
    try {
      const response = await requestFreeAlbumAccess(inviteCode.trim(), freeAlbumEmail.trim());
      if (response.success) {
        setFreeAlbumFlow('otp');
      } else {
        const err = response.error || '';
        if (err.toLowerCase().includes('not authorized') || (err.toLowerCase().includes('email') && err.toLowerCase().includes('match'))) {
          setFreeAlbumError('This email was not invited to this album');
        } else {
          setFreeAlbumError(err || 'Failed to request access. Please try again.');
        }
      }
    } catch {
      setFreeAlbumError('Connection error. Please try again.');
    } finally {
      setFreeAlbumLoading(false);
    }
  };

  const handleFreeAlbumVerify = async () => {
    if (!freeAlbumOtp.trim()) return;
    setFreeAlbumLoading(true);
    setFreeAlbumError('');
    try {
      const response = await verifyFreeAlbumAccess(inviteCode.trim(), freeAlbumEmail.trim(), freeAlbumOtp.trim());
      if (response.success && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = response.data as any;
        const albumId = d.albumId || freeAlbumId;
        setFreeAlbumId(albumId);
        if (d.title) setFreeAlbumTitle(d.title);
        if (d.photographerName) setFreeAlbumPhotographer(d.photographerName);
        if (d.expiresAt) setFreeAlbumExpiresAt(d.expiresAt);
        applyFreeAlbumPricing(d);
        if (d.photos?.length) {
          // Photos included in verify response - render directly
          setFreeAlbumPhotos(d.photos);
          setFreeAlbumFlow('verified');
          // Verify response sometimes omits cap/price fields the photographer
          // configured at album-create time. Re-fetch to make sure we enforce
          // the right cap when the user clicks download.
          if (d.maxFreeDownloads == null && d.pricePerExtraImage == null) {
            getFreeAlbum(albumId).then(extra => {
              if (extra.success && extra.data) applyFreeAlbumPricing(extra.data);
            }).catch(() => {});
          }
        } else {
          // Fallback: fetch photos separately
          const albumRes = await getFreeAlbum(albumId);
          if (albumRes.success && albumRes.data) {
            setFreeAlbumPhotos(albumRes.data.photos || []);
            if (albumRes.data.title) setFreeAlbumTitle(albumRes.data.title);
            if (albumRes.data.photographerName) setFreeAlbumPhotographer(albumRes.data.photographerName);
            if (albumRes.data.expiresAt) setFreeAlbumExpiresAt(albumRes.data.expiresAt);
            applyFreeAlbumPricing(albumRes.data);
            setFreeAlbumFlow('verified');
          } else {
            setFreeAlbumError(albumRes.error || 'Failed to load album photos.');
          }
        }
      } else {
        const err = response.error || '';
        if (err.toLowerCase().includes('invalid') && err.toLowerCase().includes('otp')) {
          setFreeAlbumError('Invalid verification code. Please try again.');
        } else if (err.toLowerCase().includes('expired')) {
          setFreeAlbumError('Code expired. Click Resend to get a new code.');
        } else {
          setFreeAlbumError(err || 'Verification failed. Please try again.');
        }
      }
    } catch {
      setFreeAlbumError('Connection error. Please try again.');
    } finally {
      setFreeAlbumLoading(false);
    }
  };

  const handleFreeAlbumResendOtp = async () => {
    setFreeAlbumOtp('');
    setFreeAlbumError('');
    await handleFreeAlbumRequestAccess();
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local[0]}${'*'.repeat(Math.max(local.length - 1, 2))}@${domain}`;
  };

  const handleFreePhotoDownload = async (photo: FreeAlbumPhoto) => {
    // Free-album photos are served directly from the backend's /uploads/
    // static path - photo.url is already the clean full-res JPEG, no
    // separate "/original" endpoint exists. Hitting that path returned a
    // 404 JSON which then got saved as photo-<id>.jpg and refused to open.
    await triggerPhotoDownload(photo.url, `photo-${photo.id}.jpg`);
  };

  /**
   * Pull cap / price / currency out of either a verify response or a
   * getFreeAlbum response into the shared free-album state. Tolerant of
   * field-shape drift (camelCase + snake_case + nested `pricing`).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFreeAlbumPricing = (raw: any) => {
    if (!raw || typeof raw !== 'object') return;
    const maxRaw = raw.maxFreeDownloads ?? raw.max_free_downloads ?? raw.maxFreeImages ?? null;
    if (maxRaw !== null && maxRaw !== undefined) {
      const n = Number(maxRaw);
      if (Number.isFinite(n) && n >= 0) setFreeAlbumMax(n);
    }
    const priceRaw = raw.pricePerExtraImage ?? raw.price_per_extra_image
      ?? raw.pricing?.pricePerExtraImage ?? null;
    if (priceRaw !== null && priceRaw !== undefined) {
      const n = Number(priceRaw);
      if (Number.isFinite(n) && n >= 0) setFreeAlbumPricePerExtra(n);
    }
    const curId = raw.currencyId ?? raw.currency_id ?? raw.pricing?.currencyId;
    if (curId) setFreeAlbumCurrencyId(String(curId));
    const curAbbr = raw.currencyAbbreviation ?? raw.currency_abbreviation
      ?? raw.pricing?.currencyAbbreviation ?? raw.currencySymbol ?? raw.currency_symbol;
    if (curAbbr) setFreeAlbumCurrencyAbbr(String(curAbbr));
    // Returning-viewer OWNED set from the backend (cumulative free downloads
    // + completed purchases by this email). Union with whatever we already
    // have so a re-fetch never shrinks the set.
    const acquiredRaw = raw.alreadyAcquiredPhotoIds ?? raw.acquiredPhotoIds
      ?? raw.already_acquired_photo_ids ?? raw.ownedPhotoIds;
    if (Array.isArray(acquiredRaw)) {
      setFreeAcquiredIds(prev => {
        const next = new Set(prev);
        for (const id of acquiredRaw) {
          if (typeof id === 'string' && id) next.add(id);
        }
        return next;
      });
    }
  };

  /**
   * Memoised partition of the current selection into:
   *   - owned: photos already acquired (free-download log OR purchased)
   *   - newPicks: selected photos NOT yet acquired (these count toward cap)
   * The pay-for-extras flow only ever charges for OVERFLOW within newPicks.
   */
  const getCappedSelectionInfo = () => {
    const owned: string[] = [];
    const newPicks: string[] = [];
    for (const id of selectedFreePhotoIds) {
      if (freeAcquiredIds.has(id)) owned.push(id); else newPicks.push(id);
    }
    const cap = freeAlbumMax ?? Infinity;
    const freeQuotaUsedNew = Number.isFinite(cap) ? Math.min(newPicks.length, cap as number) : newPicks.length;
    const overflow = Number.isFinite(cap) ? Math.max(0, newPicks.length - (cap as number)) : 0;
    return {
      owned, newPicks, cap, freeQuotaUsedNew, overflow,
      total: owned.length + newPicks.length,
    };
  };

  /**
   * Ship every currently-selected photo to the user's disk, then tell the
   * backend so the OWNED set persists across visits.
   *
   * No one-time consumption / link expiry. the access link stays active.
   * The cap is enforced before this fires (in handleFreeCappedDownload or
   * via the XentriPayModal onSuccess branch in handlePurchaseSuccess) so
   * by the time we land here, every selected photo is either OWNED
   * already, in the free quota, or has just been paid for.
   */
  const downloadFreeSelected = async () => {
    if (!freeAlbumId) return;
    const chosen = freeAlbumPhotos.filter(p => selectedFreePhotoIds.has(p.id));
    if (chosen.length === 0) return;
    // Stagger so the browser doesn't collapse parallel save dialogs.
    for (let i = 0; i < chosen.length; i++) {
      const photo = chosen[i];
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      handleFreePhotoDownload(photo);
      await new Promise(r => setTimeout(r, 350));
    }
    // Persist to backend (best-effort) so a return visit recognises these
    // photos as OWNED. Capped albums only; the backend no-ops anyway when
    // there's no grant row for non-capped albums.
    const ids = chosen.map(p => p.id);
    try { await logFreeAlbumDownload(freeAlbumId, ids); } catch { /* best effort */ }
    // Optimistically grow the local OWNED set so the next click already
    // treats these as acquired (won't count against cap).
    setFreeAcquiredIds(prev => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    setFreeStatusMsg(
      `Downloading ${chosen.length} photo${chosen.length !== 1 ? 's' : ''}. ` +
      `Your access link stays active. come back any time.`
    );
  };

  /**
   * The main cart action.
   *
   *   • Pure free-quota selection (no overflow) → just download & log.
   *   • Overflow on a capped+priced album → open the in-page XentriPayModal
   *     for the EXTRAS only (free quota + OWNED never re-paid). The modal's
   *     onSuccess routes back through handlePurchaseSuccess which detects
   *     the free-album flag (freeExtrasInFlight) and ships the photos via
   *     the direct-URL free-album path.
   *   • Overflow on a cap-only album (no extra price) → polite refusal.
   *
   * Hard invariants:
   *   • Never downloads photos the user didn't pay for and aren't OWNED
   *     or in free quota.
   *   • The first time the user's selection crosses the cap with at least
   *     one paid extra, the warning modal fires once and we stop here,
   *     so the user has to confirm by clicking Purchase again to actually pay.
   */
  const handleFreeCappedDownload = async () => {
    if (!freeAlbumId || freeIsProcessing) return;
    const info = getCappedSelectionInfo();
    if (info.total === 0) { setFreeStatusMsg('Select at least one photo to download.'); return; }
    const price = freeAlbumPricePerExtra || 0;

    if (info.overflow === 0) {
      setFreeIsProcessing(true);
      try { await downloadFreeSelected(); }
      finally { setFreeIsProcessing(false); }
      return;
    }

    if (!(price > 0) || !freeAlbumCurrencyId) {
      setFreeStatusMsg(`You can download at most ${info.cap} new photo(s) for free from this album.`);
      return;
    }

    // First-time crossing the cap → confirmation modal.
    if (!freeCapWarnShown) {
      setFreeCapWarnShown(true);
      setFreeCapWarnOpen(true);
      setFreeStatusMsg(
        `${info.overflow} of your selection ${info.overflow === 1 ? 'is' : 'are'} extra photo${info.overflow === 1 ? '' : 's'}. ` +
        `Please confirm to continue.`
      );
      return;
    }

    // Overflow → open the in-page XentriPayModal for the OVERFLOW ids only.
    // Owned + free quota are never charged. We DO NOT use window.open here
    //. popups opened after an `await` are blocked by modern browsers
    // because they're no longer considered part of the user-gesture chain.
    // The shared XentriPayModal handles gateway initiate + status polling
    // entirely inside the page so there's no popup to block.
    setFreeIsProcessing(true);
    setFreeStatusMsg('Identifying you for payment…');
    try {
      const ident = await identifyAlbumBuyer(freeAlbumId, {
        name: freeAlbumEmail,
        email: freeAlbumEmail,
        phone: '',
        deviceFingerprint: '',
      });
      const bId = ident.data?.buyerId;
      if (!ident.success || !bId) throw new Error(ident.error || 'Could not identify you. Please retry.');
      setBuyerId(bId);
      setBuyerAlbumId(freeAlbumId);

      // Out of the NEW (non-owned) picks: first `cap` are free, the rest
      // are the paid overflow.
      const overflowIds = info.newPicks.slice(info.cap as number);
      const amount = Math.round(price * overflowIds.length);

      // Remember the full selection so handlePurchaseSuccess can ship
      // every chosen photo (free quota + overflow) through the
      // direct-URL free-album path after payment lands.
      setFreeExtrasInFlight({
        overflowIds,
        allSelectedIds: Array.from(selectedFreePhotoIds),
      });

      setPendingPurchase({
        albumId: freeAlbumId,
        photoIds: overflowIds,
        amount,
        currencyId: freeAlbumCurrencyId,
        currencyCode: freeAlbumCurrencyAbbr || '',
      });
      setPendingDonationAmount(0);
      setXentriModalOpen(true);
      setFreeStatusMsg(
        `Pay ${freeAlbumCurrencyAbbr || ''} ${amount} for ${overflowIds.length} extra photo${overflowIds.length === 1 ? '' : 's'} ` +
        `to unlock your download.`
      );
    } catch (e) {
      setFreeStatusMsg(e instanceof Error ? e.message : 'Payment could not be started.');
    } finally {
      setFreeIsProcessing(false);
    }
  };

  // handleFreeConfirmPaid + freePendingPay were the manual "I've paid"
  // fallback for the old window.open flow. Removed in favour of the
  // in-page XentriPayModal which handles status polling + onSuccess
  // directly (see handlePurchaseSuccess freeExtrasInFlight branch).

  const toggleFreePhotoSelected = (photoId: string) => {
    setSelectedFreePhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId); else next.add(photoId);
      return next;
    });
  };

  // Load currencies for payment
  useEffect(() => {
    getCurrencies().then(res => {
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setCurrencies(res.data);
      }
    }).catch(() => {});
  }, []);

  // Load live rateToUsd for every currency so multi-album totals can be
  // normalized to USD when a face-scan match spans photographers pricing
  // in different currencies.
  useEffect(() => {
    getCurrencyRates().then(res => {
      if (!res.success || !res.data) return;
      const map: Record<string, CurrencyRate> = {};
      for (const r of Object.values(res.data)) {
        if (r.id) map[r.id] = r;
        if (r.abbreviation) map[r.abbreviation.toUpperCase()] = r;
      }
      setCurrencyRates(map);
    }).catch(() => {});
  }, []);

  // When the window loses focus (user alt-tabs, opens Snipping Tool, switches
  // apps) or the tab becomes hidden, instantly blank every preview image on the
  // page. Restored on focus/visibility. This catches casual snipping-tool usage
  // because Snipping Tool steals focus from the browser before the user drags
  // the selection rectangle - by the time they do, the images are already black.
  //
  // Does NOT stop keyboard-shortcut-invoked captures or determined screen
  // recorders. The real defence remains the baked-in per-viewer watermark.
  const [isOccluded, setIsOccluded] = useState(false);
  useEffect(() => {
    const occlude = () => setIsOccluded(true);
    const reveal = () => setIsOccluded(false);
    const onVis = () => {
      if (document.hidden) occlude();
      else reveal();
    };
    window.addEventListener('blur', occlude);
    window.addEventListener('focus', reveal);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('blur', occlude);
      window.removeEventListener('focus', reveal);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Viewer identifier used for dynamic per-viewer watermarks on preview images.
  // Recomputed when buyerId changes so paying customers get their buyer id
  // stamped instead of the anonymous fallback.
  const viewerId = React.useMemo(() => getViewerId(buyerId), [buyerId]);

  // ── Anti-save hardening ──
  // Every image on this page is a watermarked preview from the backend, so
  // "saving" them only yields a low-res stamped copy - but we still block the
  // casual save paths (context menu, drag, Ctrl+S/P, F12) to remove the
  // friction-free "right-click → save" experience and make it clear the images
  // are protected. This cannot stop determined screen-capture, and it isn't
  // meant to - the server-side watermark is the real defence.
  useEffect(() => {
    const blockContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('img, .photo-card, .photo-preview-modal')) {
        e.preventDefault();
      }
    };
    const blockDrag = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'IMG') {
        e.preventDefault();
      }
    };
    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Ctrl/Cmd + S  → Save page
      // Ctrl/Cmd + P  → Print
      // Ctrl/Cmd + Shift + S → Firefox "Take Screenshot"
      if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'p')) {
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === 's') {
        e.preventDefault();
      }
      // F12 / Ctrl+Shift+I / Ctrl+Shift+J - devtools shortcuts
      if (k === 'f12') e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('dragstart', blockDrag);
    document.addEventListener('keydown', blockKeys);
    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('dragstart', blockDrag);
      document.removeEventListener('keydown', blockKeys);
    };
  }, []);

  // Payment methods
  const paymentMethods = [
    { id: 'mtn', name: 'MTN Mobile Money', image: '/mtn.png' },
    { id: 'airtel', name: 'Airtel Money', image: '/airtel.png' },
    { id: 'card', name: 'VISA & Master Card', image: '/cards.png' },
  ];

  const resetDownloadModal = () => {
    setShowDownloadModal(false);
    setDownloadTarget(null);
    setDlPaymentMethod(null);
    setDlPhoneVal(null);
    setDlCardNumber('');
    setDlCardExpiry('');
    setDlCardCvv('');
    setDlCardHolderName('');
    setDlLoading(false);
    setDlError(null);
    setDlSuccess(false);
  };

  const isDlPaymentValid = () => {
    if (!dlPaymentMethod) return false;
    switch (dlPaymentMethod) {
      case 'mtn':
      case 'airtel':
        return !!dlPhoneVal?.isValid;
      case 'card':
        return dlCardNumber.length >= 16 && dlCardExpiry.length >= 4 && dlCardCvv.length >= 3 && dlCardHolderName.trim() !== '';
      default:
        return false;
    }
  };

  const triggerPhotoDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      // If the server returned a non-OK status, OR a JSON/HTML body instead
      // of an image, don't save it as a .jpg - that's how we ended up with
      // a 403 JSON blob being written to disk with a .jpg extension.
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.startsWith('image/')) {
        window.open(url, '_blank');
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleDownloadPayment = async () => {
    if (!downloadTarget || !dlPaymentMethod) return;
    setDlLoading(true);
    setDlError(null);
    try {
      const amount = String(downloadTarget.price ?? 0);
      const currencyId = albumCurrencyId || (currencies.length > 0 ? currencies[0].id : '');
      if (!currencyId) {
        setDlError('Currency not available. Please try again.');
        setDlLoading(false);
        return;
      }
      const response = await recordStreamingPayment({
        eventId: albumEventId || downloadTarget.id,
        amount,
        currencyId,
        remarks: `Photo download via ${dlPaymentMethod}`,
      });
      if (!response.success) {
        throw new Error(response.error || 'Payment failed');
      }
      setDlSuccess(true);
      setTimeout(() => {
        triggerPhotoDownload(downloadTarget.url, `photo-${downloadTarget.id}.jpg`);
        resetDownloadModal();
      }, 1200);
    } catch (err) {
      setDlError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setDlLoading(false);
    }
  };

  // Download an already-purchased photo.
  //
  // Backend: GET /albums/{albumId}/photo/{photoId}/download verifies buyerId/refid
  // and responds with either a 302 redirect to the image bytes (on success) or
  // a 403 JSON error body (on denial). fetch() follows the redirect transparently
  // so a successful response's body IS the JPEG - we save it as a blob directly.
  const downloadPurchasedPhoto = async (
    albumId: string,
    photoId: string,
    token: { refid?: string; buyerId?: string }
  ) => {
    const url = apiUrl(API_ENDPOINTS.PAYMENTS.ALBUM_PHOTO_DOWNLOAD(albumId, photoId, token));
    // The XentriPay webhook that flips AlbumPurchase → COMPLETED can land a
    // moment after the client sees payment success. Retry 403s briefly so the
    // auto-download after purchase doesn't lose the race.
    const delays = [0, 1000, 2000, 3000];
    try {
      let res: Response | null = null;
      for (const delay of delays) {
        if (delay) await new Promise(r => setTimeout(r, delay));
        res = await fetch(url, { credentials: 'include' });
        if (res.ok) break;
        if (res.status !== 403) break;
      }
      if (!res || !res.ok) {
        let message = `Download authorisation failed (${res?.status ?? 'no response'})`;
        try {
          const errJson = await res?.json();
          if (errJson?.message) message = errJson.message;
        } catch { /* non-JSON error body - keep generic message */ }
        throw new Error(message);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `photo-${photoId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to download purchased photo:', err);
      setPurchaseNotice(err instanceof Error ? err.message : 'Download failed');
      setTimeout(() => setPurchaseNotice(null), 4000);
    }
  };

  const togglePhotoSelected = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId); else next.add(photoId);
      return next;
    });
  };

  // Returns the first photo with the album fields populated. Used as a
  // fallback for currency display when callers don't need the per-album
  // breakdown (e.g. the buyer-details modal opens before grouping matters).
  const getPurchaseContext = (photos: PhotoItem[]): { albumId: string; currencyId: string; currencyCode: string } | null => {
    const first = photos.find(p => p.albumId && p.currencyId);
    if (!first || !first.albumId || !first.currencyId) return null;
    return {
      albumId: first.albumId,
      currencyId: first.currencyId,
      currencyCode: first.currencyAbbreviation || albumCurrencySymbol || 'RF',
    };
  };

  const proceedToPayment = (photos: PhotoItem[]) => {
    const payable = photos.filter(p => !p.isPurchased && p.albumId && p.currencyId);
    if (payable.length === 0) {
      setPurchaseNotice('You already own these photos.');
      setTimeout(() => setPurchaseNotice(null), 3000);
      return;
    }

    // Group payable photos by albumId. A face-scan can match photos across
    // multiple paid albums (different photographers) - each album becomes
    // its own AlbumPurchase row server-side so revenue routes to the right
    // photographer at that gallery's price.
    const groups = new Map<string, { albumId: string; photoIds: string[]; amount: number; currencyId: string }>();
    const photoAlbumMap: Record<string, string> = {};
    for (const p of payable) {
      const albumId = p.albumId!;
      const slot = groups.get(albumId) ?? { albumId, photoIds: [], amount: 0, currencyId: p.currencyId! };
      slot.photoIds.push(p.id);
      slot.amount += p.price ?? 0;
      groups.set(albumId, slot);
      photoAlbumMap[p.id] = albumId;
    }
    const items = Array.from(groups.values());
    const firstItemPhoto = payable.find(p => p.albumId === items[0].albumId)!;
    const firstCurrencyCode = firstItemPhoto.currencyAbbreviation || albumCurrencySymbol || 'RF';

    // If slices span multiple currencies, summing native amounts is
    // meaningless ("8000 RF" when 5000 was UGX and 3000 was RWF). Convert
    // each slice to USD via rateToUsd ("1 USD = X local") and display the
    // USD total. Backend still receives native per-slice amounts in items[]
    // and converts each to RWF server-side for the gateway.
    const slicesSpanCurrencies = new Set(items.map(i => i.currencyId)).size > 1;
    let displayAmount: number;
    let displayCurrencyCode: string;
    let displayCurrencyId: string;

    if (slicesSpanCurrencies) {
      const sliceUsd = (item: { amount: number; currencyId: string }, abbr: string | undefined) => {
        const rate = currencyRates[item.currencyId] || (abbr ? currencyRates[abbr.toUpperCase()] : undefined);
        if (rate?.rateToUsd && rate.rateToUsd > 0) return item.amount / rate.rateToUsd;
        return null;
      };
      let usdSum = 0;
      let allConverted = true;
      for (const it of items) {
        const itAbbr = payable.find(p => p.albumId === it.albumId)?.currencyAbbreviation;
        const usd = sliceUsd(it, itAbbr);
        if (usd === null) { allConverted = false; break; }
        usdSum += usd;
      }
      if (allConverted) {
        displayAmount = Math.round(usdSum * 100) / 100;
        displayCurrencyCode = 'USD';
        // Use the first slice's currencyId so XentriPayModal still has a
        // valid id to pass through; the actual gateway charge is computed
        // per-slice on the backend regardless.
        displayCurrencyId = items[0].currencyId;
      } else {
        // Rates not yet loaded or one currency lacks a rate - fall back to
        // the native sum so the user still sees *some* total. Backend math
        // is unaffected.
        displayAmount = items.reduce((s, i) => s + i.amount, 0);
        displayCurrencyCode = firstCurrencyCode;
        displayCurrencyId = items[0].currencyId;
      }
    } else {
      displayAmount = items.reduce((s, i) => s + i.amount, 0);
      displayCurrencyCode = firstCurrencyCode;
      displayCurrencyId = items[0].currencyId;
    }

    setPendingPurchase({
      // For multi-album buys, the top-level albumId is just the first slice's
      // album - used for currency display only. The per-photo download loop
      // looks up the correct album via photoAlbumMap, and the gateway
      // initiate API uses the items[] breakdown.
      albumId: items[0].albumId,
      photoIds: items.flatMap(i => i.photoIds),
      amount: displayAmount,
      currencyId: displayCurrencyId,
      currencyCode: displayCurrencyCode,
      multiAlbumItems: items.length > 1 ? items : undefined,
      photoAlbumMap,
    });
    setPendingDonationAmount(0);
    setXentriModalOpen(true);
  };

  const openPurchaseModal = (photos: PhotoItem[]) => {
    const ctx = getPurchaseContext(photos);
    if (!ctx) {
      setPurchaseNotice('Missing album info. Please rescan your photos.');
      setTimeout(() => setPurchaseNotice(null), 4000);
      return;
    }
    // If we don't yet have a buyerId for this album, collect buyer details first
    if (!buyerId || buyerAlbumId !== ctx.albumId) {
      pendingBuyRef.current = photos;
      setDetailsError(null);
      setDetailsOpen(true);
      return;
    }
    proceedToPayment(photos);
  };

  const handleBulkBuy = () => {
    const chosen = displayedPhotos.filter(p => selectedPhotoIds.has(p.id) && (p.price ?? 0) > 0 && !p.isPurchased);
    if (chosen.length === 0) return;
    openPurchaseModal(chosen);
  };

  /**
   * Bulk-download every selected photo that's either already purchased OR
   * free (no price). Paid-unpurchased photos in the selection are skipped
   * here - they're handled by handleBulkBuy via a separate button in the
   * action bar. This routes each photo through the SAME handleDownloadClick
   * used by the per-card download button, so the backend selection logic
   * (purchased-via-backend vs free-direct-URL) stays untouched; we're just
   * looping the existing single-photo entrypoint.
   */
  const handleBulkDownload = async () => {
    const chosen = displayedPhotos.filter(p => selectedPhotoIds.has(p.id) && (!!p.isPurchased || (p.price ?? 0) === 0));
    if (chosen.length === 0) return;
    for (const photo of chosen) {
      handleDownloadClick(photo);
      await new Promise(r => setTimeout(r, 150));
    }
  };

  const handleSingleBuy = (photo: PhotoItem) => {
    openPurchaseModal([photo]);
  };

  const handlePurchaseSuccess = async (refid: string) => {
    if (!pendingPurchase) return;
    setPurchaseRefid(refid);
    setPurchaseNotice('Payment confirmed! Recording purchase…');

    // ── Free-album extras short-circuit ──
    // When this modal was opened by the free-album cap+pay flow (not the
    // standard paid-album path), shift to the direct-URL download path
    // used by every other free-album action. The paid-album branch below
    // calls downloadPurchasedPhoto which goes through the protected
    // backend download endpoint. that's wrong for free-album photos
    // whose URLs are already the original-quality JPEGs.
    if (freeExtrasInFlight) {
      const allSelected = freeExtrasInFlight.allSelectedIds;
      const overflowIds = freeExtrasInFlight.overflowIds;
      setXentriModalOpen(false);
      setPendingPurchase(null);
      setPendingDonationAmount(0);
      setFreeExtrasInFlight(null);
      // Optimistically mark every just-paid photo as OWNED so a refresh
      // wouldn't re-charge for them.
      setFreeAcquiredIds(prev => {
        const next = new Set(prev);
        for (const id of allSelected) next.add(id);
        return next;
      });
      // Ship every selected photo via the existing free-album download
      // routine + log to backend so OWNED persists across visits.
      await downloadFreeSelected();
      setPurchaseNotice(
        `Payment confirmed. ${overflowIds.length} extra photo${overflowIds.length === 1 ? '' : 's'} unlocked and downloading.`
      );
      setTimeout(() => setPurchaseNotice(null), 5000);
      return;
    }

    // record-album-purchase has to win before the downloads can succeed:
    // it's what flips each AlbumPurchase row to COMPLETED, links the buyer,
    // and emits the unlock code. The backend confirms the payment via
    // XentriPay inline, and XentriPay's webhook + status endpoint can lag
    // a few seconds behind the user's "I just paid" callback - so we
    // retry with a short backoff before giving up. Without this retry,
    // a fast-clicking buyer hits a race where record-album-purchase 400s
    // ("Purchase not found" / "Payment not successful"), the buyer→photo
    // link never lands, and every subsequent /download call 403s.
    let unlockCodeFromServer: string | null = null;
    let recordOk = false;
    let recordError: string | null = null;
    // Polling window extended to ~120s. Most attempts are cheap (the backend
    // serves them from its status cache + AlbumPurchase row read once the
    // XentriPay webhook lands), so the long tail is fine. Every 5s polls keep
    // bandwidth low while still snapping to SUCCESS quickly.
    const delaysMs = [0, 3000, 5000, 5000, 5000, 10000, 10000, 15000, 15000, 20000, 20000, 20000];
    for (let i = 0; i < delaysMs.length; i++) {
      if (delaysMs[i] > 0) {
        setPurchaseNotice('Waiting for the gateway to confirm your payment - this can take up to a minute…');
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, delaysMs[i]));
      }
      // eslint-disable-next-line no-await-in-loop
      const recordRes = await recordAlbumPurchase(refid, buyerId || undefined);
      if (recordRes.success) {
        recordOk = true;
        if (recordRes.data?.unlockCode) unlockCodeFromServer = recordRes.data.unlockCode;
        break;
      }
      recordError = recordRes.error || null;
      // If the backend definitively says it can't find the refid AND the
      // gateway already reported success once, keep retrying - the
      // initiate-purchase webhook may still be in flight. Permanent
      // errors (anything else) bail early.
      const transient = (recordError || '').toLowerCase();
      const looksTransient = transient.includes('not successful')
        || transient.includes('not found')
        || transient.includes('pending')
        || transient.includes('processing');
      if (!looksTransient) break;
    }

    if (!recordOk) {
      // Surface the real reason so the buyer knows what happened - silent
      // failure here previously left them staring at a frozen "Buy" button
      // with .jpg downloads that 403'd.
      setPurchaseNotice(recordError
        ? `Couldn't finalise purchase: ${recordError}. Your payment is safe - refresh or contact support if this persists.`
        : 'Could not finalise the purchase. Please refresh and try again.');
      setTimeout(() => setPurchaseNotice(null), 9000);
      return;
    }

    // Mark photos as purchased in local state
    const boughtIds = new Set(pendingPurchase.photoIds);
    setDisplayedPhotos(prev => prev.map(p => boughtIds.has(p.id) ? { ...p, isPurchased: true } : p));
    setAllPhotos(prev => prev.map(p => boughtIds.has(p.id) ? { ...p, isPurchased: true } : p));
    setSelectedPhotoIds(new Set());

    // Trigger downloads - prefer persistent buyerId over per-transaction refid.
    // For multi-album purchases, each photo belongs to a different gallery,
    // so look up the right albumId per photoId. Single-album buys have all
    // photos under pendingPurchase.albumId; the map is still safe to consult.
    setPurchaseNotice('Downloading photos…');
    for (const photoId of pendingPurchase.photoIds) {
      const albumIdForPhoto = pendingPurchase.photoAlbumMap?.[photoId] || pendingPurchase.albumId;
      // eslint-disable-next-line no-await-in-loop
      await downloadPurchasedPhoto(albumIdForPhoto, photoId, { refid, buyerId: buyerId || undefined });
    }

    // Surface the unlock code so the buyer can save it before leaving. The
    // same code is also in the receipt email - this just makes it visible
    // immediately for users who don't check email right away.
    if (unlockCodeFromServer) {
      setRecentUnlockCode(unlockCodeFromServer);
      setPurchaseNotice(`Done! Save your unlock code: ${unlockCodeFromServer}`);
    } else {
      setPurchaseNotice('Done!');
    }
    setXentriModalOpen(false);
    setPendingPurchase(null);
    // Keep the unlock-code message visible longer than a generic success.
    setTimeout(() => setPurchaseNotice(null), unlockCodeFromServer ? 12000 : 3000);
  };

  const handleAlreadyPurchased = (alreadyIds: string[]) => {
    const alreadySet = new Set(alreadyIds);
    // Update local state to reflect ownership
    setDisplayedPhotos(prev => prev.map(p => alreadySet.has(p.id) ? { ...p, isPurchased: true } : p));
    setAllPhotos(prev => prev.map(p => alreadySet.has(p.id) ? { ...p, isPurchased: true } : p));

    if (!pendingPurchase) {
      setXentriModalOpen(false);
      return;
    }
    const remaining = pendingPurchase.photoIds.filter(id => !alreadySet.has(id));
    setXentriModalOpen(false);

    if (remaining.length === 0) {
      // All selected photos were already owned - just download them
      setPurchaseNotice('You already own these. Downloading…');
      (async () => {
        for (const photoId of alreadyIds) {
          const albumIdForPhoto = pendingPurchase.photoAlbumMap?.[photoId] || pendingPurchase.albumId;
          // eslint-disable-next-line no-await-in-loop
          await downloadPurchasedPhoto(albumIdForPhoto, photoId, { buyerId: buyerId || undefined });
        }
        setPendingPurchase(null);
        setTimeout(() => setPurchaseNotice(null), 3000);
      })();
      return;
    }

    // Retry initiate with only the remaining photoIds
    setPurchaseNotice(`${alreadyIds.length} already owned. Retrying payment for ${remaining.length} remaining…`);
    const remainingPhotos = displayedPhotos.filter(p => remaining.includes(p.id));
    const amount = remainingPhotos.reduce((s, p) => s + (p.price ?? 0), 0);
    setPendingPurchase({
      ...pendingPurchase,
      photoIds: remaining,
      amount,
    });
    setTimeout(() => { setXentriModalOpen(true); setPurchaseNotice(null); }, 600);
  };

  const handleDetailsSubmit = async () => {
    setDetailsError(null);
    const name = detailsName.trim();
    const email = detailsEmail.trim();
    if (!name) { setDetailsError('Please enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setDetailsError('Please enter a valid email.'); return; }

    const photos = pendingBuyRef.current || [];
    const ctx = getPurchaseContext(photos);
    if (!ctx) { setDetailsError('Missing album info. Please rescan.'); return; }

    setDetailsLoading(true);
    try {
      const fp = await getDeviceId();
      const res = await identifyAlbumBuyer(ctx.albumId, { name, email, deviceFingerprint: fp });
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Could not verify your details.');
      }
      const { buyerId: newBuyerId, purchasedPhotoIds } = res.data;
      setBuyerId(newBuyerId);
      setBuyerAlbumId(ctx.albumId);

      // Persist
      try {
        localStorage.setItem(`album_buyer_id:${ctx.albumId}`, newBuyerId);
        localStorage.setItem('album_buyer_details', JSON.stringify({ name, email }));
        const urlObj = new URL(window.location.href);
        urlObj.searchParams.set('buyerId', newBuyerId);
        urlObj.searchParams.set('albumId', ctx.albumId);
        window.history.replaceState(null, '', urlObj.toString());
      } catch {}

      // Mark any previously-purchased photos in local state
      if (purchasedPhotoIds?.length) {
        const owned = new Set(purchasedPhotoIds);
        setDisplayedPhotos(prev => prev.map(p => owned.has(p.id) ? { ...p, isPurchased: true } : p));
        setAllPhotos(prev => prev.map(p => owned.has(p.id) ? { ...p, isPurchased: true } : p));
      }

      setDetailsOpen(false);
      setDetailsLoading(false);

      // Resume the buy flow - filter out photos the buyer already owns
      const owned = new Set(purchasedPhotoIds || []);
      const freshPhotos = photos.map(p => owned.has(p.id) ? { ...p, isPurchased: true } : p);
      const toPay = freshPhotos.filter(p => !p.isPurchased);
      if (toPay.length === 0) {
        setPurchaseNotice('You already own these photos. Downloading…');
        (async () => {
          for (const photo of freshPhotos) {
            // eslint-disable-next-line no-await-in-loop
            await downloadPurchasedPhoto(ctx.albumId, photo.id, { buyerId: newBuyerId });
          }
          setTimeout(() => setPurchaseNotice(null), 3000);
        })();
      } else {
        proceedToPayment(toPay);
      }
      pendingBuyRef.current = null;
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Could not verify your details. Try again.');
      setDetailsLoading(false);
    }
  };

  // Returning-buyer unlock: redeem an unlock code (per-purchase) or email
  // (per-buyer) to mark previously purchased photos as owned and download them.
  const handleUnlockSubmit = async () => {
    setUnlockError(null);

    // Need an album in scope - pulled from any photo on the page (single-album
    // assumption matches the rest of this page).
    const albumId =
      displayedPhotos.find(p => p.albumId)?.albumId ||
      allPhotos.find(p => p.albumId)?.albumId;
    if (!albumId) {
      setUnlockError('Please load an album first (enter an invite code or scan).');
      return;
    }

    if (unlockMode === 'code') {
      const code = unlockCodeInput.trim().toUpperCase();
      if (!code) { setUnlockError('Enter your unlock code.'); return; }
      setUnlockLoading(true);
      try {
        const res = await unlockAlbumPhotos(albumId, { unlockCode: code });
        if (!res.success || !res.data) throw new Error(res.error || 'Invalid unlock code');
        const { buyerId: bId, purchasedPhotoIds, refid } = res.data;
        if (bId) {
          setBuyerId(bId);
          setBuyerAlbumId(albumId);
          try { localStorage.setItem(`album_buyer_id:${albumId}`, bId); } catch {}
        }
        if (refid) setPurchaseRefid(refid);

        const owned = new Set(purchasedPhotoIds || []);
        setDisplayedPhotos(prev => prev.map(p => owned.has(p.id) ? { ...p, isPurchased: true } : p));
        setAllPhotos(prev => prev.map(p => owned.has(p.id) ? { ...p, isPurchased: true } : p));

        setUnlockOpen(false);
        setUnlockCodeInput('');
        setUnlockLoading(false);

        // Auto-download the unlocked photos
        setPurchaseNotice(`Unlocked ${owned.size} photo${owned.size !== 1 ? 's' : ''}. Downloading…`);
        for (const photoId of purchasedPhotoIds || []) {
          // eslint-disable-next-line no-await-in-loop
          await downloadPurchasedPhoto(albumId, photoId, {
            buyerId: bId || undefined,
            refid: refid || undefined,
          });
        }
        setTimeout(() => setPurchaseNotice(null), 3500);
      } catch (err) {
        setUnlockError(err instanceof Error ? err.message : 'Could not unlock with that code.');
        setUnlockLoading(false);
      }
      return;
    }

    // Email mode
    const email = unlockEmailInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setUnlockError('Enter a valid email.');
      return;
    }
    setUnlockLoading(true);
    try {
      const res = await unlockAlbumPhotos(albumId, { email });
      if (!res.success || !res.data) throw new Error(res.error || 'No purchases found for this email');
      const { buyerId: bId, purchasedPhotoIds } = res.data;
      if (bId) {
        setBuyerId(bId);
        setBuyerAlbumId(albumId);
        try { localStorage.setItem(`album_buyer_id:${albumId}`, bId); } catch {}
      }

      const owned = new Set(purchasedPhotoIds || []);
      setDisplayedPhotos(prev => prev.map(p => owned.has(p.id) ? { ...p, isPurchased: true } : p));
      setAllPhotos(prev => prev.map(p => owned.has(p.id) ? { ...p, isPurchased: true } : p));

      setUnlockOpen(false);
      setUnlockEmailInput('');
      setUnlockLoading(false);

      setPurchaseNotice(`Unlocked ${owned.size} photo${owned.size !== 1 ? 's' : ''}. Downloading…`);
      for (const photoId of purchasedPhotoIds || []) {
        // eslint-disable-next-line no-await-in-loop
        await downloadPurchasedPhoto(albumId, photoId, { buyerId: bId || undefined });
      }
      setTimeout(() => setPurchaseNotice(null), 3500);
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Could not unlock with that email.');
      setUnlockLoading(false);
    }
  };

  const handleDownloadClick = (photo: PhotoItem) => {
    // Already purchased → download via backend (buyerId persistent, refid fallback)
    if (photo.isPurchased && photo.albumId && (buyerId || purchaseRefid)) {
      downloadPurchasedPhoto(photo.albumId, photo.id, { buyerId: buyerId || undefined, refid: purchaseRefid || undefined });
      return;
    }
    // Paid photo with album info → new XentriPayModal album purchase flow
    if ((photo.price ?? 0) > 0 && photo.albumId && photo.currencyId) {
      handleSingleBuy(photo);
      return;
    }
    // Legacy paid photo (invite-code album without albumId/currencyId) → old inline modal
    if ((photo.price ?? 0) > 0) {
      setDownloadTarget(photo);
      setShowDownloadModal(true);
      return;
    }
    // Free photo → photo.url is already the direct backend image URL
    // (/uploads/event_media/... or /uploads/gallery_images/...). No
    // separate /api/photos/{id}/original endpoint exists.
    if (!photo.url) return;
    triggerPhotoDownload(photo.url, `photo-${photo.id}.jpg`);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      // Attach stream after state update via timeout so videoRef is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      // Camera not available or permission denied - fall back silently
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      setUploadedFile(file);
      setUploadedPreview(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  // ─── Photo-first grid: natural aspect ratios + blur-up ────────────
  // The grid used to force every photo into a 4:3 crop. Ratios are captured
  // per image as it loads so the masonry columns can respect portrait and
  // panorama shots, and each image fades in over a shimmer placeholder.
  const [photoRatios, setPhotoRatios] = useState<Record<string, number>>({});
  const [loadedPhotoIds, setLoadedPhotoIds] = useState<Set<string>>(new Set());
  const markPhotoLoaded = (id: string, el: HTMLImageElement | null) => {
    if (!el || !el.complete || el.naturalWidth === 0) return;
    setPhotoRatios(prev => (prev[id] ? prev : { ...prev, [id]: el.naturalWidth / el.naturalHeight }));
    setLoadedPhotoIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // ─── Lightbox navigation ──────────────────────────────────────────
  // The viewer used to be open-one, close, open-the-next. Browse the whole
  // set instead: prev/next arrows, arrow keys, swipe, and a position counter.
  // Navigation walks whichever list the open photo belongs to (the free-album
  // strip or the main gallery).
  const lightboxList: PhotoItem[] = selectedPhoto && freeAlbumPhotos.some(p => p.id === selectedPhoto.id)
    ? (freeAlbumPhotos as unknown as PhotoItem[])
    : displayedPhotos;
  const lightboxIndex = selectedPhoto ? lightboxList.findIndex(p => p.id === selectedPhoto.id) : -1;
  const stepLightbox = (delta: number) => {
    if (lightboxIndex < 0) return;
    const next = lightboxList[lightboxIndex + delta];
    if (next) setSelectedPhoto(next);
  };
  const lightboxTouchX = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
      else if (e.key === 'ArrowRight') stepLightbox(1);
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // stepLightbox closes over lightboxIndex/lightboxList, both derived from
  // these deps, so the listener always sees the current position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhoto, displayedPhotos, freeAlbumPhotos]);

  // ─── Phase navigation ─────────────────────────────────────────────
  // Three logical phases the user moves through. The stepper below makes the
  // current phase visible AND lets the user click prior phases to navigate back.
  const phases: { id: string; label: string; sub: string; icon: string }[] = [
    { id: 'phase-connect',  label: 'Connect',  sub: 'Code or selfie',     icon: 'bi-key-fill' },
    { id: 'phase-discover', label: 'Discover', sub: 'Browse your photos', icon: 'bi-images' },
    { id: 'phase-checkout', label: 'Checkout', sub: 'Save & download',    icon: 'bi-cloud-arrow-down-fill' },
  ];
  const currentPhaseId =
    freeAlbumFlow !== 'idle'
      ? 'phase-connect'
      : !isCodeSubmitted
        ? 'phase-connect'
        : selectedPhotoIds.size > 0 || pendingPurchase
          ? 'phase-checkout'
          : 'phase-discover';
  const currentPhaseIndex = phases.findIndex((p) => p.id === currentPhaseId);

  const goToPhase = (id: string) => {
    if (id === 'phase-connect') {
      // Step back to invite/scan - reset the photo-grid state.
      setIsCodeSubmitted(false);
      setIsFiltered(false);
      setSelectedPhotoIds(new Set());
      setUploadedPreview(null);
      setScanError(null);
      // Smooth scroll to the connect phase (after the conditional flips next render)
      window.setTimeout(() => {
        document.getElementById('phase-connect')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    } else if (id === 'phase-discover') {
      // From checkout state → clear selections to return to browse mode
      setSelectedPhotoIds(new Set());
      window.setTimeout(() => {
        document.getElementById('phase-discover')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    } else if (id === 'phase-checkout') {
      // Forward jump only valid if photos are selected
      window.setTimeout(() => {
        document.getElementById('phase-checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  };

  // The persistent "Already paid? Unlock" pill in the sticky dock. Buyers were
  // scrolling past the gallery header without ever seeing the unlock action,
  // so it now lives in the always-visible dock - but only once an album is in
  // scope, because handleUnlockSubmit resolves the albumId from loaded photos
  // and would otherwise error. Deep links (?code=) auto-verify the album, so
  // paid buyers arriving from their email see the pill immediately.
  const unlockAlbumInScope = Boolean(
    displayedPhotos.find(p => p.albumId) || allPhotos.find(p => p.albumId)
  );

  return (
    <div style={{ minHeight: '100vh', background: '#040d1f' }}>
      {/* ═══ "The Reel" - film / contact-sheet architecture ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Bodoni:ital,wght@0,500;0,600;0,700;1,500&display=swap');
        .fr-serif { font-family: 'Libre Bodoni', Georgia, 'Times New Roman', serif; }
        .fr-gate {
          position: relative; overflow: hidden;
          background:
            radial-gradient(1000px 460px at 14% -8%, rgba(8,58,133,0.55), transparent 60%),
            radial-gradient(820px 400px at 90% 4%, rgba(255,107,107,0.14), transparent 55%),
            #040d1f;
        }
        .fr-sprockets {
          height: 14px; margin: 0 auto; max-width: 1200px;
          background-image: radial-gradient(rgba(255,255,255,0.16) 2.6px, transparent 2.8px);
          background-size: 26px 14px; background-position: center;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
          opacity: 0.85;
        }
        .fr-door {
          position: relative; border-radius: 20px; padding: 26px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.1);
          transition: border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease;
        }
        .fr-door:hover { border-color: rgba(255,255,255,0.24); transform: translateY(-3px); box-shadow: 0 30px 60px -30px rgba(0,0,0,0.8); }
        .fr-door-tag {
          position: absolute; top: -11px; left: 22px; padding: 3px 12px; border-radius: 999px;
          font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
          background: #0a2148;
        }
        .fr-code {
          display: flex; gap: 8px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.16); border-radius: 14px; padding: 6px;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }
        .fr-code:focus-within { border-color: rgba(242,12,143,0.6); box-shadow: 0 0 0 3px rgba(242,12,143,0.14); }
        .fr-code input {
          flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
          color: #fff; font-size: 16px; padding: 11px 12px; letter-spacing: 0.1em;
          font-weight: 700; font-family: inherit;
        }
        .fr-code input::placeholder { color: rgba(255,255,255,0.35); letter-spacing: 0.02em; font-weight: 600; }
        .fr-finder {
          position: relative; border-radius: 14px; overflow: hidden;
          background:
            radial-gradient(220px 120px at 50% 40%, rgba(255,107,107,0.12), transparent 70%),
            rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
        }
        .fr-corner { position: absolute; width: 22px; height: 22px; border: 2.5px solid rgba(255,107,107,0.85); pointer-events: none; z-index: 2; }
        .fr-corner.tl { top: 10px; left: 10px; border-right: 0; border-bottom: 0; border-radius: 6px 0 0 0; }
        .fr-corner.tr { top: 10px; right: 10px; border-left: 0; border-bottom: 0; border-radius: 0 6px 0 0; }
        .fr-corner.bl { bottom: 10px; left: 10px; border-right: 0; border-top: 0; border-radius: 0 0 0 6px; }
        .fr-corner.br { bottom: 10px; right: 10px; border-left: 0; border-top: 0; border-radius: 0 0 6px 0; }
        .fr-btn-ghost {
          padding: 11px 18px; border-radius: 12px; cursor: pointer; font-family: inherit;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18);
          color: #fff; font-weight: 700; font-size: 13.5px; transition: background 180ms ease;
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        }
        .fr-btn-ghost:hover { background: rgba(255,255,255,0.12); }
        .fr-btn-brand {
          padding: 12px 22px; border-radius: 12px; border: 0; cursor: pointer; font-family: inherit;
          background: linear-gradient(135deg, #083A85 0%, #F20C8F 130%); color: #fff;
          font-weight: 800; font-size: 14px; box-shadow: 0 10px 26px -10px rgba(242,12,143,0.55);
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        }
        .fr-btn-brand:disabled { opacity: 0.55; cursor: not-allowed; }
        .fr-btn-coral {
          padding: 12px 22px; border-radius: 12px; border: 0; cursor: pointer; font-family: inherit;
          background: #FF6B6B; color: #fff; font-weight: 800; font-size: 14px;
          box-shadow: 0 10px 26px -10px rgba(255,107,107,0.55); transition: background 160ms ease;
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        }
        .fr-btn-coral:hover:not(:disabled) { background: #ff5252; }
        .fr-btn-coral:disabled { opacity: 0.55; cursor: not-allowed; }
        .fr-marquee {
          position: relative; overflow: hidden; border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.1); min-height: 220px;
          display: flex; align-items: flex-end;
        }
        .fr-marquee .cover { position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(2px) brightness(0.42) saturate(1.05); transform: scale(1.06); }
        .fr-marquee .scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(4,13,31,0.15) 0%, rgba(4,13,31,0.55) 55%, rgba(4,13,31,0.94) 100%); }
        .fr-chip {
          display: inline-flex; align-items: center; gap: 7px; padding: 7px 13px; border-radius: 999px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16);
          color: rgba(255,255,255,0.85); font-size: 12.5px; font-weight: 700; white-space: nowrap;
        }
        .fr-card {
          break-inside: avoid; border-radius: 14px; overflow: hidden;
          background: #0b1930; border: 1px solid rgba(255,255,255,0.09);
          position: relative; cursor: pointer;
          transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }
        .fr-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.22); box-shadow: 0 24px 48px -22px rgba(0,0,0,0.75); }
        .fr-frame-no {
          position: absolute; bottom: 8px; left: 10px; z-index: 3; pointer-events: none;
          font-size: 10.5px; font-weight: 800; letter-spacing: 0.16em;
          color: rgba(255,255,255,0.65); text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }
        .fr-pick {
          position: absolute; top: 10px; left: 10px; z-index: 4;
          width: 30px; height: 30px; border-radius: 999px; border: 2px solid rgba(255,255,255,0.75);
          background: rgba(4,10,24,0.45); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 0;
          color: #fff; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 160ms ease;
        }
        .fr-eye {
          position: absolute; top: 10px; right: 10px; z-index: 4;
          width: 32px; height: 32px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.3);
          background: rgba(4,10,24,0.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer;
          opacity: 0; transform: translateY(-4px); transition: all 200ms ease; padding: 0;
        }
        .fr-card:hover .fr-eye { opacity: 1; transform: translateY(0); }
        .fr-act {
          position: absolute; bottom: 8px; right: 10px; z-index: 4;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 12px; border-radius: 999px; cursor: pointer;
          background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; font-size: 12px; font-weight: 700; font-family: inherit;
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
          opacity: 0; transform: translateY(4px); transition: all 200ms ease;
        }
        .fr-card:hover .fr-act { opacity: 1; transform: translateY(0); }
        .fr-act:hover { background: #03969c; border-color: #03969c; }
        @media (hover: none) {
          .fr-eye, .fr-act { opacity: 1; transform: none; }
        }
        .fr-badge {
          position: absolute; top: 10px; right: 48px; z-index: 3; pointer-events: none;
          padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 800;
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        }
        .fr-tray {
          position: fixed; left: 50%; transform: translateX(-50%); bottom: 18px; z-index: 1500;
          display: flex; flex-direction: column; gap: 8px;
          padding: 12px 14px; border-radius: 18px;
          background: linear-gradient(175deg, rgba(10,33,72,0.97) 0%, rgba(6,15,36,0.97) 100%);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 24px 60px -18px rgba(0,0,0,0.8);
          width: max-content; max-width: min(720px, calc(100vw - 20px));
        }
        .fr-tray-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .fr-tray .thumbs { display: flex; flex-shrink: 0; }
        .fr-tray .thumbs span {
          width: 40px; height: 40px; border-radius: 10px; overflow: hidden;
          border: 2px solid #0a2148; margin-left: -10px; background-size: cover; background-position: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }
        .fr-tray .thumbs span:first-child { margin-left: 0; }
        .fr-cap {
          border-radius: 16px; padding: 14px 18px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
        }
        .fr-cap .bar { height: 8px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; }
        .fr-cap .bar i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #03969c, #7be0e5); transition: width 240ms ease; }
        .fr-lb-arrow {
          position: fixed; top: 50%; transform: translateY(-50%);
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22);
          color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          z-index: 2002; transition: background 200ms ease;
        }
        .fr-lb-arrow:hover { background: rgba(255,255,255,0.28); }
        .fr-lb-arrow:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .fr-lb-arrow.prev { left: 18px; }
        .fr-lb-arrow.next { right: 18px; }
        @media (max-width: 720px) {
          .fr-lb-arrow { width: 42px; height: 42px; }
          .fr-lb-arrow.prev { left: 8px; }
          .fr-lb-arrow.next { right: 8px; }
        }
        .fr-scanline {
          position: absolute; left: 8%; right: 8%; height: 3px; border-radius: 3px;
          background: linear-gradient(90deg, transparent, #FF6B6B, transparent);
          animation: fr-scan 2.2s ease-in-out infinite; box-shadow: 0 0 18px rgba(255,107,107,0.8);
          z-index: 3; pointer-events: none;
        }
        @keyframes fr-scan { 0%, 100% { top: 10%; } 50% { top: 86%; } }
        .fr-tab {
          flex: 1; padding: 10px; border-radius: 10px; cursor: pointer; font-family: inherit;
          background: transparent; border: 1px solid transparent; color: rgba(255,255,255,0.55);
          font-weight: 700; font-size: 13.5px;
        }
        .fr-tab.on { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #fff; }
        .fr-skel {
          background: linear-gradient(100deg, rgba(255,255,255,0.045) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.045) 60%);
          background-size: 200% 100%; animation: fr-sh 1.4s ease-in-out infinite;
        }
        @keyframes fr-sh { 0% { background-position: 120% 0; } 100% { background-position: -80% 0; } }
        .fr-dock {
          position: fixed; top: 76px; left: 50%; transform: translateX(-50%); z-index: 1400;
          display: inline-flex; align-items: center; gap: 4px;
          padding: 7px 10px; border-radius: 999px;
          background: rgba(6,14,32,0.72); border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 14px 30px -14px rgba(0,0,0,0.6);
        }
        .fr-dock button {
          appearance: none; background: transparent; border: 0; font-family: inherit;
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 11px; border-radius: 999px; color: rgba(255,255,255,0.5);
          font-size: 12px; font-weight: 700; cursor: pointer; transition: all 200ms ease;
        }
        .fr-dock button:disabled { cursor: default; }
        .fr-dock button.on { background: rgba(255,107,107,0.16); color: #fff; }
        .fr-dock button.done { color: rgba(255,255,255,0.8); }
        .fr-dock .dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.25); flex-shrink: 0; transition: background 200ms ease; }
        .fr-dock button.on .dot { background: #FF6B6B; box-shadow: 0 0 0 4px rgba(255,107,107,0.2); }
        .fr-dock button.done .dot { background: #03969c; }
        @media (max-width: 720px) {
          .fr-dock { top: 70px; }
          .fr-dock button span.lbl { display: none; }
          .fr-dock button.on span.lbl { display: inline; }
        }
        .fr-unlock-pill {
          position: fixed; top: 76px; right: 16px; z-index: 1400;
          display: inline-flex; align-items: center; gap: 8px;
          min-height: 40px; padding: 8px 15px; border-radius: 999px; cursor: pointer;
          background: rgba(4,42,45,0.75); border: 1px solid rgba(45,212,218,0.55);
          color: #7be0e5; font-size: 12.5px; font-weight: 700; font-family: inherit;
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 10px 26px -12px rgba(0,0,0,0.6);
          transition: background 200ms ease, border-color 200ms ease;
          animation: fr-unlock-pulse 2.4s ease-out 0.6s 2;
        }
        .fr-unlock-pill:hover { background: rgba(6,64,68,0.9); border-color: rgba(45,212,218,0.85); }
        @keyframes fr-unlock-pulse {
          0% { box-shadow: 0 10px 26px -12px rgba(0,0,0,0.6), 0 0 0 0 rgba(45,212,218,0.45); }
          70% { box-shadow: 0 10px 26px -12px rgba(0,0,0,0.6), 0 0 0 12px rgba(45,212,218,0); }
          100% { box-shadow: 0 10px 26px -12px rgba(0,0,0,0.6), 0 0 0 0 rgba(45,212,218,0); }
        }
        @media (max-width: 720px) {
          .fr-unlock-pill { top: 70px; right: 10px; padding: 7px 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fr-door, .fr-card, .fr-eye, .fr-act, .fr-scanline, .fr-unlock-pill { transition: none !important; animation: none !important; }
          .fr-skel { animation: none; background: rgba(255,255,255,0.06); }
        }
      `}</style>

      <Navbar />

      {/* ── Reel dock: minimal three-step progress (Connect → Browse → Save).
          goToPhase keeps the same back-navigation semantics the old stepper had. ── */}
      <nav className="fr-dock" aria-label="Progress">
        {phases.map((p, i) => {
          const isActive = i === currentPhaseIndex;
          const isDone = i < currentPhaseIndex;
          const canNavigate = i <= currentPhaseIndex;
          return (
            <button
              key={p.id}
              type="button"
              className={isActive ? 'on' : isDone ? 'done' : ''}
              onClick={() => canNavigate && goToPhase(p.id)}
              disabled={!canNavigate}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="dot" aria-hidden />
              <span className="lbl">{p.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Persistent unlock pill - visible in every phase once an album is in
          scope (handleUnlockSubmit needs one). docs/PAYMENTS.md rule 6:
          both unlock doors stay reachable. */}
      {unlockAlbumInScope && (
        <button
          type="button"
          className="fr-unlock-pill"
          onClick={() => { setUnlockError(null); setUnlockOpen(true); }}
          title="Already paid? Unlock with the code we emailed you, or with your email."
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
          Already paid? Unlock
        </button>
      )}

      {freeAlbumFlow !== 'idle' ? (
        /* ═══ FREE ALBUM FLOW - claim cards, then the contact sheet ═══ */
        <div id="phase-connect" className="fr-gate" style={{
          minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? '110px 16px 60px' : '120px 20px 60px',
          scrollMarginTop: '120px',
        }}>
          {/* Album cover backdrop - the event's own imagery behind every step */}
          {(freeAlbumPhotos[0]?.thumbnailUrl || freeAlbumPhotos[0]?.url) && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
              <img
                src={stampPreviewUrl(freeAlbumPhotos[0].thumbnailUrl || freeAlbumPhotos[0].url, viewerId, { buyerId, refid: purchaseRefid })}
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(26px) brightness(0.32) saturate(1.1)', transform: 'scale(1.15)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,13,31,0.82) 0%, rgba(4,13,31,0.55) 40%, rgba(4,13,31,0.95) 100%)' }} />
            </div>
          )}

          {freeAlbumFlow === 'email' && (
            <div style={{
              position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, borderRadius: 22,
              padding: isMobile ? '28px 22px' : 30,
              background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
              border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Free album</span>
              <h2 className="fr-serif" style={{ margin: '8px 0 6px', color: '#fff', fontSize: 28, fontWeight: 600 }}>Claim your album.</h2>
              <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600 }}>{freeAlbumTitle}</p>
              {freeAlbumPhotographer && <p style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.45)', fontSize: 12.5 }}>by {freeAlbumPhotographer}</p>}
              <p style={{ margin: '0 0 18px', color: 'rgba(255,255,255,0.6)', fontSize: 13.5, lineHeight: 1.6 }}>
                Enter your email and we&apos;ll send a one-time access code.
              </p>
              <input
                type="email"
                placeholder="you@example.com"
                value={freeAlbumEmail}
                onChange={(e) => { setFreeAlbumEmail(e.target.value); setFreeAlbumError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleFreeAlbumRequestAccess()}
                style={{
                  width: '100%', padding: '13px 14px', borderRadius: 12, boxSizing: 'border-box',
                  border: freeAlbumError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14.5, outline: 'none', marginBottom: 12,
                }}
              />
              {freeAlbumError && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{freeAlbumError}</p>}
              <button
                className="fr-btn-brand"
                style={{ width: '100%', padding: 14 }}
                onClick={handleFreeAlbumRequestAccess}
                disabled={freeAlbumLoading || !freeAlbumEmail.trim()}
              >
                {freeAlbumLoading ? 'Sending…' : 'Send my access code'}
              </button>
              <button
                onClick={() => { setFreeAlbumFlow('idle'); setFreeAlbumError(''); }}
                style={{ width: '100%', marginTop: 12, padding: 10, borderRadius: 12, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 13 }}
              >
                ← Back to the gate
              </button>
            </div>
          )}

          {freeAlbumFlow === 'otp' && (
            <div style={{
              position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, borderRadius: 22,
              padding: isMobile ? '28px 22px' : 30,
              background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
              border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              textAlign: 'center',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Free album</span>
              <h2 className="fr-serif" style={{ margin: '8px 0 6px', color: '#fff', fontSize: 28, fontWeight: 600 }}>Check your inbox.</h2>
              <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.6)', fontSize: 13.5, lineHeight: 1.6 }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: '#fff' }}>{maskEmail(freeAlbumEmail)}</strong>
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={freeAlbumOtp[i] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const arr = freeAlbumOtp.split('');
                      arr[i] = val;
                      setFreeAlbumOtp(arr.join('').slice(0, 6));
                      setFreeAlbumError('');
                      if (val && e.target.nextElementSibling instanceof HTMLInputElement) {
                        e.target.nextElementSibling.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !freeAlbumOtp[i] && e.target instanceof HTMLInputElement && e.target.previousElementSibling instanceof HTMLInputElement) {
                        e.target.previousElementSibling.focus();
                      }
                      if (e.key === 'Enter' && freeAlbumOtp.length === 6) handleFreeAlbumVerify();
                    }}
                    style={{
                      width: 44, height: 52, borderRadius: 10,
                      border: freeAlbumError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.06)', color: '#fff',
                      fontSize: 20, fontWeight: 700, textAlign: 'center', outline: 'none',
                    }}
                  />
                ))}
              </div>
              {freeAlbumError && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{freeAlbumError}</p>}
              <button
                className="fr-btn-brand"
                style={{ width: '100%', padding: 14, marginBottom: 12 }}
                onClick={handleFreeAlbumVerify}
                disabled={freeAlbumLoading || freeAlbumOtp.length < 6}
              >
                {freeAlbumLoading ? 'Verifying…' : 'Open my album'}
              </button>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                {"Didn't receive it? "}
                <button
                  onClick={handleFreeAlbumResendOtp}
                  disabled={freeAlbumLoading}
                  style={{ background: 'none', border: 'none', color: '#7be0e5', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  Resend
                </button>
              </p>
              <button
                onClick={() => { setFreeAlbumFlow('email'); setFreeAlbumOtp(''); setFreeAlbumError(''); }}
                style={{ marginTop: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}
              >
                ← Change email
              </button>
            </div>
          )}

          {freeAlbumFlow === 'verified' && (
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', paddingBottom: selectedFreePhotoIds.size > 0 ? 120 : 0, alignSelf: 'flex-start' }}>
              {/* Marquee header - the event as a letterboxed title card */}
              <div className="fr-marquee">
                {(freeAlbumPhotos[0]?.thumbnailUrl || freeAlbumPhotos[0]?.url) && (
                  <div className="cover" style={{ backgroundImage: `url(${stampPreviewUrl(freeAlbumPhotos[0].thumbnailUrl || freeAlbumPhotos[0].url, viewerId, { buyerId, refid: purchaseRefid })})` }} aria-hidden />
                )}
                <div className="scrim" aria-hidden />
                <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '22px 18px 18px' : '26px 26px 22px', width: '100%' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Free album · Yours to claim
                  </span>
                  <h1 className="fr-serif" style={{ margin: '6px 0 10px', color: '#fff', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 600, lineHeight: 1.05 }}>
                    {freeAlbumTitle || 'Your album.'}
                  </h1>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {freeAlbumPhotographer && (
                      <span className="fr-chip">
                        <span aria-hidden style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', flexShrink: 0 }} />
                        by {freeAlbumPhotographer}
                      </span>
                    )}
                    <span className="fr-chip">{freeAlbumPhotos.length} frame{freeAlbumPhotos.length !== 1 ? 's' : ''}</span>
                    {freeAlbumExpiresAt && (() => {
                      const daysLeft = Math.ceil((new Date(freeAlbumExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      if (daysLeft <= 0) return (
                        <span className="fr-chip" style={{ borderColor: 'rgba(239,68,68,0.5)', color: '#fca5a5' }}>Expired</span>
                      );
                      if (daysLeft <= 7) return (
                        <span className="fr-chip" style={{ borderColor: 'rgba(245,158,11,0.5)', color: '#fcd34d' }}>Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
                      );
                      return null;
                    })()}
                    {!(freeAlbumMax !== null || freeAlbumPricePerExtra > 0)
                      && freeAlbumPhotos.length > 1
                      && selectedFreePhotoIds.size < freeAlbumPhotos.length && (
                      <button
                        className="fr-btn-ghost"
                        style={{ marginLeft: 'auto', padding: '9px 15px', fontSize: 12.5 }}
                        onClick={() => setSelectedFreePhotoIds(new Set(freeAlbumPhotos.map(p => p.id)))}
                      >
                        Select all
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="fr-sprockets" style={{ margin: '16px auto' }} aria-hidden />

              {/* Cap meter - live view of the current selection against the
                  free quota. Counts NEW picks only; OWNED never re-counts. */}
              {(freeAlbumMax !== null || freeAlbumPricePerExtra > 0) && (() => {
                const info = getCappedSelectionInfo();
                const capLabel = info.cap === Infinity ? '∞' : info.cap;
                const pct = info.cap === Infinity || info.cap === 0
                  ? 0
                  : Math.min(100, (info.freeQuotaUsedNew / (info.cap as number)) * 100);
                return (
                  <div className="fr-cap" style={{ marginBottom: 16, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>Free frames</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12.5, fontWeight: 700 }}>{info.freeQuotaUsedNew} of {capLabel} picked</span>
                      </div>
                      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                    </div>
                    {freeAlbumPricePerExtra > 0 && (
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5 }}>
                        Extras · {freeAlbumCurrencyAbbr || ''} {freeAlbumPricePerExtra} each
                      </span>
                    )}
                    {info.overflow > 0 && (
                      <span className="fr-chip" style={{ borderColor: 'rgba(245,158,11,0.5)', color: '#fcd34d' }}>
                        {info.overflow} extra{info.overflow !== 1 ? 's' : ''} in selection
                      </span>
                    )}
                    {freeAcquiredIds.size > 0 && (
                      <span className="fr-chip" style={{ borderColor: 'rgba(3,150,156,0.5)', color: '#7be0e5' }}>
                        ✓ {freeAcquiredIds.size} already yours
                      </span>
                    )}
                  </div>
                );
              })()}
              {freeStatusMsg && (
                <p style={{ color: '#ff9c9c', fontSize: 12.5, margin: '0 0 14px', lineHeight: 1.5, textAlign: 'center' }}>{freeStatusMsg}</p>
              )}

              {/* Contact-sheet masonry */}
              <div style={{ columnCount: isMobile ? 2 : 3, columnGap: isMobile ? 12 : 18 }}>
                {freeAlbumPhotos.map((photo, freeIndex) => {
                  const isSelected = selectedFreePhotoIds.has(photo.id);
                  const isOwned = freeAcquiredIds.has(photo.id);
                  const isCappedAlbum = freeAlbumMax !== null || freeAlbumPricePerExtra > 0;
                  const pickOrder = isSelected ? Array.from(selectedFreePhotoIds).indexOf(photo.id) + 1 : 0;
                  return (
                    <div
                      key={photo.id}
                      className="fr-card"
                      onContextMenu={(e) => { if (isCappedAlbum) e.preventDefault(); }}
                      onClick={() => toggleFreePhotoSelected(photo.id)}
                      style={{
                        marginBottom: isMobile ? 12 : 18,
                        borderColor: isOwned ? 'rgba(16,185,129,0.55)' : isSelected ? '#FF6B6B' : undefined,
                        boxShadow: isOwned
                          ? '0 0 0 2px rgba(16,185,129,0.55)'
                          : isSelected ? '0 0 0 2px #FF6B6B, 0 24px 48px -22px rgba(255,107,107,0.35)' : undefined,
                      }}
                    >
                      <div
                        className={loadedPhotoIds.has(photo.id) ? undefined : 'fr-skel'}
                        style={{ aspectRatio: photoRatios[photo.id] ? `${photoRatios[photo.id]}` : '1', position: 'relative', overflow: 'hidden' }}
                      >
                        <img
                          src={stampPreviewUrl(photo.thumbnailUrl || photo.url, viewerId, { buyerId, refid: purchaseRefid })}
                          alt={photo.caption || 'Free album photo'}
                          loading={freeIndex < 6 ? 'eager' : 'lazy'}
                          fetchPriority={freeIndex < 3 ? 'high' : undefined}
                          decoding="async"
                          draggable={false}
                          ref={(el) => markPhotoLoaded(photo.id, el)}
                          onLoad={(e) => markPhotoLoaded(photo.id, e.currentTarget)}
                          onDragStart={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            opacity: loadedPhotoIds.has(photo.id) ? 1 : 0,
                            userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
                            filter: isOccluded ? 'brightness(0)' : undefined,
                            transition: 'opacity 0.45s ease, filter 0.1s linear',
                          }}
                        />
                        {/* Watermark on capped/priced albums - deters screenshot reuse */}
                        {isCappedAlbum && !isOwned && (
                          <div aria-hidden onContextMenu={(e) => e.preventDefault()} style={{
                            position: 'absolute', inset: 0, pointerEvents: 'none',
                            backgroundImage: 'repeating-linear-gradient(-30deg, transparent 0 40px, rgba(255,255,255,0.06) 40px 41px)',
                            mixBlendMode: 'overlay',
                          }} />
                        )}
                        {isCappedAlbum && !isOwned && (
                          <div aria-hidden style={{
                            position: 'absolute', inset: 0, pointerEvents: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transform: 'rotate(-22deg)', color: 'rgba(255,255,255,0.30)',
                            fontWeight: 800, fontSize: 'clamp(11px, 2.5vw, 18px)', letterSpacing: 4,
                            textShadow: '0 1px 4px rgba(0,0,0,0.45)', whiteSpace: 'nowrap',
                          }}>
                            PREVIEW · {(freeAlbumPhotographer || 'PHOTOGRAPHER').toUpperCase()}
                          </div>
                        )}
                        <button
                          type="button"
                          className="fr-pick"
                          aria-label={isSelected ? 'Remove from selection' : 'Add to selection'}
                          onClick={(e) => { e.stopPropagation(); toggleFreePhotoSelected(photo.id); }}
                          style={isSelected ? { background: '#FF6B6B', borderColor: '#FF6B6B' } : undefined}
                        >
                          {isSelected ? pickOrder : ''}
                        </button>
                        <button
                          type="button"
                          className="fr-eye"
                          aria-label="Quick view"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoto({
                              id: photo.id,
                              url: photo.thumbnailUrl || photo.url,
                              fullUrl: photo.url || photo.thumbnailUrl,
                              alt: photo.caption || 'Free album photo',
                            });
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <span className="fr-frame-no">№ {String(freeIndex + 1).padStart(2, '0')}</span>
                        {isOwned && (
                          <span className="fr-badge" style={{ background: 'rgba(16,185,129,0.9)', color: '#fff', right: 10, top: 'auto', bottom: 8 }}>
                            ✓ YOURS
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Free selection tray */}
              {selectedFreePhotoIds.size > 0 && (
                <div className="fr-tray">
                  <div className="fr-tray-row">
                    <div className="thumbs" aria-hidden>
                      {freeAlbumPhotos.filter(p => selectedFreePhotoIds.has(p.id)).slice(0, 4).map(p => (
                        <span key={p.id} style={{ backgroundImage: `url(${stampPreviewUrl(p.thumbnailUrl || p.url, viewerId, { buyerId, refid: purchaseRefid })})`, filter: isOccluded ? 'brightness(0)' : undefined }} />
                      ))}
                    </div>
                    {(() => {
                      const info = getCappedSelectionInfo();
                      const extrasTotal = info.overflow * (freeAlbumPricePerExtra || 0);
                      const showPurchase = info.overflow > 0 && freeAlbumPricePerExtra > 0;
                      return (
                        <>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 800 }}>
                              {info.total} frame{info.total !== 1 ? 's' : ''} selected
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                              {showPurchase
                                ? `${info.overflow} extra${info.overflow !== 1 ? 's' : ''} · ${freeAlbumCurrencyAbbr || ''} ${extrasTotal}`
                                : 'Free · within your album quota'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                            <button className="fr-btn-ghost" style={{ padding: '10px 14px', fontSize: 13 }} onClick={() => setSelectedFreePhotoIds(new Set())}>
                              Clear
                            </button>
                            <button
                              className="fr-btn-brand"
                              style={{ padding: '11px 18px', background: showPurchase ? 'linear-gradient(135deg, #f59e0b 0%, #f20c8f 130%)' : undefined }}
                              onClick={handleFreeCappedDownload}
                              disabled={freeIsProcessing}
                            >
                              {showPurchase
                                ? `Purchase ${info.overflow} extra${info.overflow !== 1 ? 's' : ''} · ${freeAlbumCurrencyAbbr || ''} ${extrasTotal}`
                                : `Download ${info.total}`}
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : !isCodeSubmitted ? (
        /* ═══ THE GATE - cinematic arrival with two entry doors ═══ */
        <section id="phase-connect" className="fr-gate" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', scrollMarginTop: 120 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '120px 18px 48px' : '130px 24px 56px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.55)', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                <span aria-hidden style={{ width: 26, height: 1, background: '#FF6B6B' }} />
                Your event · Your frames
                <span aria-hidden style={{ width: 26, height: 1, background: '#FF6B6B' }} />
              </span>
              <h1 className="fr-serif" style={{ margin: '14px 0 0', color: '#fff', fontSize: 'clamp(40px, 6vw, 70px)', lineHeight: 1.02, fontWeight: 600 }}>
                Find my <em style={{ color: '#FF6B6B', fontStyle: 'italic' }}>photos.</em>
              </h1>
              <p style={{ margin: '16px auto 0', color: 'rgba(255,255,255,0.6)', fontSize: 15.5, lineHeight: 1.65, maxWidth: 520 }}>
                Your photographer captured the moment. Enter your event code,
                or let your face find every frame you appear in.
              </p>
            </div>

            <div className="fr-sprockets" aria-hidden />

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginTop: 32 }}>
              {/* Ticket door - event access code */}
              <div className="fr-door">
                <span className="fr-door-tag" style={{ border: '1px solid rgba(242,12,143,0.5)', color: '#ff7ec4' }}>Ticket</span>
                <h2 className="fr-serif" style={{ margin: '6px 0 6px', color: '#fff', fontSize: 24, fontWeight: 600 }}>I have a code</h2>
                <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.55)', fontSize: 13.5, lineHeight: 1.6 }}>
                  It came with the email or QR card from your photographer.
                </p>
                <div className="fr-code" style={inviteError ? { borderColor: 'rgba(239,68,68,0.7)' } : undefined}>
                  <input
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value); setInviteError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleInviteSubmit()}
                    placeholder="Enter invite code"
                    aria-label="Event access code"
                    disabled={isLoadingAlbum}
                  />
                  <button className="fr-btn-brand" onClick={handleInviteSubmit} disabled={isLoadingAlbum}>
                    {isLoadingAlbum ? 'Loading…' : 'Open album'}
                  </button>
                </div>
                {inviteError && <p style={{ color: '#ef4444', fontSize: 13, margin: '10px 0 0' }}>{inviteError}</p>}
              </div>

              {/* Mirror door - face match */}
              <div className="fr-door">
                <span className="fr-door-tag" style={{ border: '1px solid rgba(255,107,107,0.5)', color: '#ff9c9c' }}>Mirror</span>
                <h2 className="fr-serif" style={{ margin: '6px 0 6px', color: '#fff', fontSize: 24, fontWeight: 600 }}>Match my face</h2>
                <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.55)', fontSize: 13.5, lineHeight: 1.6 }}>
                  One selfie finds every frame you appear in. Your selfie is
                  matched, then discarded. never stored.
                </p>
                <div className="fr-finder" style={{ minHeight: 120, padding: 16 }}>
                  <span className="fr-corner tl" aria-hidden /><span className="fr-corner tr" aria-hidden />
                  <span className="fr-corner bl" aria-hidden /><span className="fr-corner br" aria-hidden />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="fr-btn-coral" onClick={() => setIsScanModalOpen(true)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      Take a selfie
                    </button>
                    <button className="fr-btn-ghost" onClick={() => setIsScanModalOpen(true)}>Upload a photo</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
              <a href="/user/browse-photos" style={{ display: 'inline-flex', alignItems: 'center', padding: '11px 20px', borderRadius: 999, color: 'rgba(255,255,255,0.6)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
                Just browsing? Visit the print shop →
              </a>
            </div>

            <div style={{ display: 'flex', gap: 22, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap', color: 'rgba(255,255,255,0.45)', fontSize: 12.5, fontWeight: 600 }}>
              <span>◈ Albums stay private to your event</span>
              <span>◈ Pay per photo, or claim free frames</span>
              <span>◈ Originals delivered by email</span>
            </div>
          </div>
        </section>
      ) : (
        /* ═══ THE CONTACT SHEET - paid album ═══ */
        <section id="phase-discover" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '118px 16px 160px' : '128px 24px 170px', scrollMarginTop: 120 }}>
          {/* Marquee header */}
          <div className="fr-marquee">
            {displayedPhotos[0]?.url && (
              <div className="cover" style={{ backgroundImage: `url(${stampPreviewUrl(displayedPhotos[0].url, viewerId, { buyerId, refid: purchaseRefid })})` }} aria-hidden />
            )}
            <div className="scrim" aria-hidden />
            <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '22px 18px 18px' : '26px 26px 22px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Event album</span>
                <button
                  onClick={() => goToPhase('phase-connect')}
                  style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.65)', padding: '6px 13px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  ← Different event
                </button>
              </div>
              <h1 className="fr-serif" style={{ margin: '6px 0 10px', color: '#fff', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 600, lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {freeAlbumTitle || 'Event Gallery'}
              </h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {freeAlbumPhotographer && (
                  <span className="fr-chip">
                    <span aria-hidden style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', flexShrink: 0 }} />
                    by {freeAlbumPhotographer}
                  </span>
                )}
                <span className="fr-chip">{displayedPhotos.length} frame{displayedPhotos.length !== 1 ? 's' : ''}</span>
                {isFiltered && (
                  <span className="fr-chip" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ff9c9c' }}>✦ matched to you</span>
                )}
                {(() => {
                  // Uniform-price chip: only when every priced photo agrees on
                  // price and currency, so the chip can never misquote.
                  const priced = displayedPhotos.filter(p => typeof p.price === 'number' && p.price > 0);
                  if (priced.length === 0) return null;
                  const first = priced[0];
                  const uniform = priced.every(p => p.price === first.price
                    && (p.currencyAbbreviation || '') === (first.currencyAbbreviation || ''));
                  if (!uniform) return null;
                  return (
                    <span className="fr-chip">
                      {first.currencyAbbreviation ? `${first.currencyAbbreviation} ` : ''}{first.price} / frame
                    </span>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                <button className="fr-btn-coral" style={{ padding: '10px 16px', fontSize: 13 }} onClick={() => setIsScanModalOpen(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
                  Find my frames with a selfie
                </button>
                <button
                  className="fr-btn-ghost"
                  style={{ padding: '10px 16px', fontSize: 13, borderColor: 'rgba(3,150,156,0.55)', color: '#7be0e5', background: 'rgba(3,150,156,0.14)' }}
                  onClick={() => { setUnlockError(null); setUnlockOpen(true); }}
                  title="Already paid? Unlock with the code we emailed you, or with your email."
                >
                  Already paid? Unlock
                </button>
                {isFiltered && allPhotos.length > 0 && (
                  <button className="fr-btn-ghost" style={{ padding: '10px 16px', fontSize: 13 }} onClick={handleShowAll}>
                    Show all frames
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="fr-sprockets" style={{ margin: '16px auto' }} aria-hidden />

          {/* Contact-sheet masonry - the checkout anchor when items are selected */}
          <div id="phase-checkout" style={{ scrollMarginTop: 120 }}>
            <div style={{ columnCount: isMobile ? 2 : 3, columnGap: isMobile ? 12 : 18 }}>
              {displayedPhotos.map((photo, photoIndex) => {
                const isPaid = (photo.price ?? 0) > 0;
                const isPurchased = !!photo.isPurchased;
                // Any photo the user can act on (download or buy) is
                // selectable - downstream actions still filter by type:
                // handleBulkBuy sends paid-unpurchased, handleBulkDownload
                // sends free/purchased.
                const isFree = !isPaid;
                const isSelectable = isPurchased || isFree || (isPaid && !!photo.albumId);
                const isSelected = selectedPhotoIds.has(photo.id);
                // Pink = download intent (free/purchased), teal = buy intent.
                const selectAccent = (isPurchased || isFree) ? '#F20C8F' : '#03969c';
                const currencyLabel = photo.currencyAbbreviation || albumCurrencySymbol || 'RF';
                const btnLabel = isPurchased
                  ? 'Download'
                  : isPaid
                    ? `Buy · ${currencyLabel} ${photo.price?.toLocaleString()}`
                    : 'Download';
                const pickOrder = isSelected ? Array.from(selectedPhotoIds).indexOf(photo.id) + 1 : 0;
                return (
                  <div
                    key={photo.id}
                    className="fr-card"
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => { if (isSelectable) togglePhotoSelected(photo.id); else setSelectedPhoto(photo); }}
                    style={{
                      marginBottom: isMobile ? 12 : 18,
                      borderColor: isSelected ? selectAccent : undefined,
                      boxShadow: isSelected ? `0 0 0 2px ${selectAccent}, 0 24px 48px -22px rgba(0,0,0,0.6)` : undefined,
                    }}
                  >
                    <div
                      className={loadedPhotoIds.has(photo.id) ? undefined : 'fr-skel'}
                      style={{ aspectRatio: photoRatios[photo.id] ? `${photoRatios[photo.id]}` : '4/3', position: 'relative', overflow: 'hidden' }}
                    >
                      <img
                        src={stampPreviewUrl(photo.url, viewerId, { buyerId, refid: purchaseRefid })}
                        alt={photo.alt}
                        draggable={false}
                        ref={(el) => markPhotoLoaded(photo.id, el)}
                        onLoad={(e) => markPhotoLoaded(photo.id, e.currentTarget)}
                        onDragStart={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          opacity: loadedPhotoIds.has(photo.id) ? 1 : 0,
                          userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
                          filter: isOccluded ? 'brightness(0)' : undefined,
                          transition: 'opacity 0.45s ease, filter 0.1s linear',
                        }}
                        loading={photoIndex < 6 ? 'eager' : 'lazy'}
                        fetchPriority={photoIndex < 3 ? 'high' : undefined}
                        decoding="async"
                      />
                      {/* Repeating tile watermark - the album photographer's name */}
                      {isPaid && !isPurchased && (() => {
                        const raw = (freeAlbumPhotographer || 'PREVIEW').toUpperCase();
                        const safe = raw
                          .replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;');
                        return (
                          <div aria-hidden style={{
                            position: 'absolute', inset: 0, pointerEvents: 'none',
                            backgroundImage:
                              'url("data:image/svg+xml;utf8,' +
                              encodeURIComponent(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="80" viewBox="0 0 140 80">' +
                                  '<text x="70" y="46" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="rgba(255,255,255,0.55)" text-anchor="middle" transform="rotate(-24 70 42)">' + safe + '</text>' +
                                '</svg>',
                              ) +
                              '")',
                            backgroundRepeat: 'repeat',
                            mixBlendMode: 'overlay',
                          }} />
                        );
                      })()}
                      {isSelectable && (
                        <button
                          type="button"
                          className="fr-pick"
                          aria-label={isSelected ? 'Remove from selection' : 'Add to selection'}
                          onClick={(e) => { e.stopPropagation(); togglePhotoSelected(photo.id); }}
                          style={isSelected ? { background: selectAccent, borderColor: selectAccent } : undefined}
                        >
                          {isSelected ? pickOrder : ''}
                        </button>
                      )}
                      <button
                        type="button"
                        className="fr-eye"
                        aria-label="Quick view"
                        onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo); }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <span className="fr-frame-no">№ {String(photoIndex + 1).padStart(2, '0')}</span>
                      {isPaid && (
                        <span className="fr-badge" style={{
                          background: isPurchased ? 'rgba(3,150,156,0.9)' : 'rgba(4,10,24,0.72)',
                          border: '1px solid rgba(255,255,255,0.16)', color: '#fff',
                        }}>
                          {isPurchased ? '✓ PURCHASED' : `${currencyLabel} ${photo.price?.toLocaleString()}`}
                        </span>
                      )}
                      <button
                        type="button"
                        className="fr-act"
                        onClick={(e) => { e.stopPropagation(); handleDownloadClick(photo); }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {btnLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {displayedPhotos.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '64px 24px', maxWidth: 440, margin: '0 auto',
                background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.16)',
                borderRadius: 20, color: 'rgba(255,255,255,0.5)',
              }}>
                <span style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(255,107,107,0.12)', color: '#FF6B6B',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </span>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>No frames matched</p>
                <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
                  Try another selfie, or show all frames to browse the whole album.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Paid selection tray - unified downloads + buys ── */}
      {(() => {
        const selectedCount = selectedPhotoIds.size;
        if (freeAlbumFlow !== 'idle') return null;
        if (selectedCount === 0 && !purchaseNotice) return null;
        const selectedItems = displayedPhotos.filter(p => selectedPhotoIds.has(p.id));
        // Split by intent - mirrors what handleBulkBuy / handleBulkDownload
        // filter internally, so the tray can't drift out of sync.
        const paidItems = selectedItems.filter(p => (p.price ?? 0) > 0 && !p.isPurchased);
        const downloadItems = selectedItems.filter(p => !!p.isPurchased || (p.price ?? 0) === 0);
        const total = paidItems.reduce((s, p) => s + (p.price ?? 0), 0);
        const curLabel = paidItems[0]?.currencyAbbreviation || albumCurrencySymbol || 'RF';
        return (
          <div className="fr-tray">
            {purchaseNotice && (
              <div style={{
                color: '#fff', fontSize: 12.5, fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', background: 'rgba(242,12,143,0.14)',
                border: '1px solid rgba(242,12,143,0.32)', borderRadius: 8,
              }}>
                <i className="bi bi-info-circle-fill" style={{ fontSize: 13, color: '#F20C8F' }} />
                {purchaseNotice}
              </div>
            )}
            {selectedCount > 0 && (
              <div className="fr-tray-row">
                <div className="thumbs" aria-hidden>
                  {selectedItems.slice(0, 4).map(p => (
                    <span key={p.id} style={{ backgroundImage: `url(${stampPreviewUrl(p.url, viewerId, { buyerId, refid: purchaseRefid })})`, filter: isOccluded ? 'brightness(0)' : undefined }} />
                  ))}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 800 }}>
                    {selectedCount} frame{selectedCount !== 1 ? 's' : ''} selected
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                    {downloadItems.length > 0 && <span>{downloadItems.length} to download</span>}
                    {downloadItems.length > 0 && paidItems.length > 0 && <span> · </span>}
                    {paidItems.length > 0 && <span>{paidItems.length} to buy · {curLabel} {total.toLocaleString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
                  <button className="fr-btn-ghost" style={{ padding: '10px 14px', fontSize: 13 }} onClick={() => setSelectedPhotoIds(new Set())}>
                    Clear
                  </button>
                  {downloadItems.length > 0 && (
                    <button className="fr-btn-brand" style={{ padding: '11px 16px', fontSize: 13 }} onClick={handleBulkDownload}>
                      <i className="bi bi-download" style={{ fontSize: 13 }} />
                      Download {downloadItems.length}
                    </button>
                  )}
                  {paidItems.length > 0 && (
                    <button
                      className="fr-btn-brand"
                      style={{ padding: '11px 16px', fontSize: 13, background: 'linear-gradient(135deg, #03969c 0%, #027a7f 100%)', boxShadow: '0 8px 22px -6px rgba(3,150,156,0.45)' }}
                      onClick={handleBulkBuy}
                    >
                      <i className="bi bi-cart-fill" style={{ fontSize: 13 }} />
                      Buy {paidItems.length} · {curLabel} {total.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Free-album cap-cross warning ── */}
      {freeCapWarnOpen && (() => {
        const info = getCappedSelectionInfo();
        const extrasTotal = info.overflow * (freeAlbumPricePerExtra || 0);
        return (
          <div
            onClick={() => setFreeCapWarnOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.85)', backdropFilter: 'blur(6px)',
              zIndex: 3500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cap-warn-title"
              style={{
                width: 'min(440px, 100%)',
                background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 26,
                color: '#fff', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.65)',
              }}
            >
              <span style={{ color: '#fcd34d', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Heads up</span>
              <h3 id="cap-warn-title" className="fr-serif" style={{ margin: '8px 0 10px', fontSize: 23, fontWeight: 600 }}>
                You&apos;re about to pay for extras.
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55 }}>
                The first <strong>{info.cap === Infinity ? freeAlbumPhotos.length : info.cap}</strong> new frame{info.cap === 1 ? '' : 's'} {info.cap === 1 ? 'is' : 'are'} free.
                You picked <strong>{info.overflow}</strong> beyond that. each costs{' '}
                <strong>{freeAlbumCurrencyAbbr || ''} {freeAlbumPricePerExtra}</strong>.
              </p>
              <div style={{
                marginTop: 16, padding: '12px 14px', borderRadius: 12,
                background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'rgba(255,255,255,0.72)' }}>Free quota used</span>
                  <strong>{info.freeQuotaUsedNew} / {info.cap === Infinity ? '∞' : info.cap}</strong>
                </div>
                {info.owned.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6, color: '#10B981' }}>
                    <span>Already owned (free)</span>
                    <strong>{info.owned.length}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,0.72)' }}>Paid extras</span>
                  <strong>{info.overflow} × {freeAlbumCurrencyAbbr || ''} {freeAlbumPricePerExtra}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                  <span style={{ fontWeight: 700 }}>Total to pay</span>
                  <span style={{ fontWeight: 800, color: '#f59e0b' }}>{freeAlbumCurrencyAbbr || ''} {extrasTotal}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  onClick={() => setFreeCapWarnOpen(false)}
                  className="fr-btn-ghost"
                  style={{ flex: 1 }}
                >
                  Adjust selection
                </button>
                <button
                  onClick={() => { setFreeCapWarnOpen(false); void handleFreeCappedDownload(); }}
                  className="fr-btn-brand"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #f59e0b 0%, #f20c8f 130%)' }}
                >
                  Continue to payment
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Quick view - split product panel (protected preview + rail) ── */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { lightboxTouchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const startX = lightboxTouchX.current;
            lightboxTouchX.current = null;
            if (startX == null) return;
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 48) stepLightbox(dx < 0 ? 1 : -1);
          }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.9)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: isMobile ? 12 : 24, overflowY: 'auto',
          }}
        >
          {/* Preload neighbours so arrow/swipe navigation feels instant */}
          {[lightboxList[lightboxIndex - 1], lightboxList[lightboxIndex + 1]]
            .filter((p): p is PhotoItem => !!p)
            .map((p) => (
              <img
                key={`preload-${p.id}`}
                src={stampPreviewUrl(p.fullUrl || p.url, viewerId, { buyerId, refid: purchaseRefid })}
                alt=""
                aria-hidden
                style={{ display: 'none' }}
              />
            ))}

          {lightboxIndex > 0 && (
            <button type="button" className="fr-lb-arrow prev" aria-label="Previous photo"
              onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {lightboxIndex >= 0 && lightboxIndex < lightboxList.length - 1 && (
            <button type="button" className="fr-lb-arrow next" aria-label="Next photo"
              onClick={(e) => { e.stopPropagation(); stepLightbox(1); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}

          {(() => {
            const isFreeAlbumPhoto = freeAlbumPhotos.some(p => p.id === selectedPhoto.id);
            const isLocked = !isFreeAlbumPhoto && (selectedPhoto.price ?? 0) > 0 && !selectedPhoto.isPurchased;
            const qvSelectable = !isFreeAlbumPhoto && (
              !!selectedPhoto.isPurchased || (selectedPhoto.price ?? 0) === 0
              || ((selectedPhoto.price ?? 0) > 0 && !!selectedPhoto.albumId)
            );
            const qvSelected = isFreeAlbumPhoto
              ? selectedFreePhotoIds.has(selectedPhoto.id)
              : selectedPhotoIds.has(selectedPhoto.id);
            const priceLabel = `${selectedPhoto.currencyAbbreviation || albumCurrencySymbol || 'RF'} ${(selectedPhoto.price ?? 0).toLocaleString()}`;
            return (
              <div
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 300px',
                  maxWidth: 1000, width: '100%',
                  maxHeight: isMobile ? undefined : '86vh',
                  borderRadius: 18, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#081831',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
                  margin: 'auto',
                }}
              >
                {/* Image half - all protections intact */}
                <div style={{ position: 'relative', minHeight: isMobile ? 260 : 380, background: '#050f22', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img
                    src={stampPreviewUrl(selectedPhoto.fullUrl || selectedPhoto.url, viewerId, { buyerId, refid: purchaseRefid })}
                    alt={selectedPhoto.alt}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                      width: '100%', height: '100%',
                      maxHeight: isMobile ? '48vh' : '86vh',
                      objectFit: 'contain', display: 'block',
                      userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
                      filter: isOccluded ? 'brightness(0)' : undefined,
                      transition: 'filter 0.1s linear',
                    }}
                  />
                  {/* Right-click / drag absorber */}
                  <div aria-hidden
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ position: 'absolute', inset: 0, background: 'transparent', userSelect: 'none' }}
                  />
                  {isLocked && (
                    <>
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} aria-hidden style={{
                          position: 'absolute',
                          top: `${-5 + i * 32}%`, left: '-50%', width: '200%', height: 60,
                          transform: 'rotate(-45deg)', transformOrigin: 'center',
                          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                          background: 'rgba(255,255,255,0.18)',
                          borderTop: '1px solid rgba(255,255,255,0.35)',
                          borderBottom: '1px solid rgba(255,255,255,0.35)',
                          pointerEvents: 'none',
                        }} />
                      ))}
                      <div aria-hidden style={{
                        position: 'absolute', bottom: 12, left: 12,
                        padding: '6px 12px', borderRadius: 50,
                        background: 'rgba(0,0,0,0.7)', color: '#fff',
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
                        border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
                        pointerEvents: 'none',
                      }}>
                        🔒 PREVIEW · BUY TO UNLOCK
                      </div>
                    </>
                  )}
                  <span style={{
                    position: 'absolute', top: 12, left: 12,
                    padding: '6px 12px', borderRadius: 50,
                    background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums', pointerEvents: 'none',
                  }}>
                    {lightboxIndex + 1} / {lightboxList.length}
                  </span>
                </div>

                {/* Rail half */}
                <div style={{
                  padding: 22, display: 'flex', flexDirection: 'column', gap: 14,
                  borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  borderTop: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span aria-hidden style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#083A85,#F20C8F)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{freeAlbumPhotographer || 'Photographer'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5 }}>Frame № {String(lightboxIndex + 1).padStart(2, '0')}</div>
                    </div>
                  </div>

                  {isFreeAlbumPhoto ? (
                    <>
                      <div className="fr-serif" style={{ color: '#7be0e5', fontSize: 24, fontWeight: 600 }}>Free frame</div>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: 12.5, lineHeight: 1.6 }}>
                        Select the frames you want, then download from the tray.
                        Your album quota is applied there.
                      </p>
                      <button
                        className={qvSelected ? 'fr-btn-ghost' : 'fr-btn-brand'}
                        onClick={() => toggleFreePhotoSelected(selectedPhoto.id)}
                      >
                        {qvSelected ? '✓ Selected · tap to remove' : 'Add to selection'}
                      </button>
                    </>
                  ) : selectedPhoto.isPurchased ? (
                    <>
                      <div className="fr-serif" style={{ color: '#7be0e5', fontSize: 24, fontWeight: 600 }}>Purchased ✓</div>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: 12.5, lineHeight: 1.6 }}>
                        This frame is yours. Download the original any time.
                      </p>
                      <button className="fr-btn-brand" onClick={() => handleDownloadClick(selectedPhoto)}>
                        Download original
                      </button>
                      {qvSelectable && (
                        <button className="fr-btn-ghost" onClick={() => togglePhotoSelected(selectedPhoto.id)}>
                          {qvSelected ? '✓ Selected · tap to remove' : 'Add to selection'}
                        </button>
                      )}
                    </>
                  ) : (selectedPhoto.price ?? 0) > 0 ? (
                    <>
                      <div className="fr-serif" style={{ color: '#fff', fontSize: 26, fontWeight: 600 }}>{priceLabel}</div>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: 12.5, lineHeight: 1.6 }}>
                        Watermark-free original, emailed the moment payment lands.
                      </p>
                      <button className="fr-btn-brand" style={{ background: 'linear-gradient(135deg, #03969c 0%, #027a7f 100%)', boxShadow: '0 8px 22px -6px rgba(3,150,156,0.45)' }} onClick={() => handleDownloadClick(selectedPhoto)}>
                        Buy this frame
                      </button>
                      {qvSelectable && (
                        <button className="fr-btn-ghost" onClick={() => togglePhotoSelected(selectedPhoto.id)}>
                          {qvSelected ? '✓ Selected · tap to remove' : 'Add to selection'}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="fr-serif" style={{ color: '#7be0e5', fontSize: 24, fontWeight: 600 }}>Free frame</div>
                      <button className="fr-btn-brand" onClick={() => handleDownloadClick(selectedPhoto)}>
                        Download
                      </button>
                      {qvSelectable && (
                        <button className="fr-btn-ghost" onClick={() => togglePhotoSelected(selectedPhoto.id)}>
                          {qvSelected ? '✓ Selected · tap to remove' : 'Add to selection'}
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => setSelectedPhoto(null)} style={{ marginTop: 'auto', padding: 11, borderRadius: 12, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 13 }}>
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Download payment modal (legacy single-photo path) ── */}
      {showDownloadModal && downloadTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, backdropFilter: 'blur(5px)', padding: 16, overflowY: 'auto',
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) resetDownloadModal(); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
              borderRadius: 20, padding: 'clamp(22px, 5vw, 30px)',
              maxWidth: 450, width: '100%', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.1)', position: 'relative', margin: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Checkout</span>
              <button
                onClick={resetDownloadModal}
                aria-label="Close"
                style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 0, color: '#fff', fontSize: 18, cursor: 'pointer' }}
              >×</button>
            </div>
            <h2 className="fr-serif" style={{ fontSize: 24, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>
              Pay &amp; download.
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Complete your payment to download this frame.
            </p>

            <div style={{
              padding: '14px 16px', background: 'rgba(3,150,156,0.12)',
              border: '1px solid rgba(3,150,156,0.3)', borderRadius: 12, marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Frame price</span>
              <span className="fr-serif" style={{ fontSize: 20, color: '#7be0e5', fontWeight: 600 }}>
                {albumCurrencySymbol || 'RF'} {(downloadTarget.price ?? 0).toLocaleString()}
              </span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                Select payment method
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setDlPaymentMethod(method.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: dlPaymentMethod === method.id ? 'rgba(3,150,156,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${dlPaymentMethod === method.id ? '#03969c' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 12, cursor: 'pointer', width: '100%', textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <img src={method.image} alt={method.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{method.name}</span>
                    {dlPaymentMethod === method.id && (
                      <span style={{ marginLeft: 'auto', color: '#03969c', fontSize: 20 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {(dlPaymentMethod === 'mtn' || dlPaymentMethod === 'airtel') && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                  Your phone number *
                </label>
                <InternationalPhoneInput
                  dark
                  onChange={setDlPhoneVal}
                  disabled={dlLoading}
                  ariaLabel="Mobile money phone number"
                />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, marginBottom: 0 }}>
                  You will receive a payment confirmation SMS on this number
                </p>
              </div>
            )}

            {dlPaymentMethod === 'card' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Card holder name *</label>
                  <input type="text" value={dlCardHolderName} onChange={(e) => setDlCardHolderName(e.target.value)} placeholder="Name on card"
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Card number *</label>
                  <input type="text" value={dlCardNumber} onChange={(e) => setDlCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="1234 5678 9012 3456"
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', letterSpacing: 2 }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Expiry *</label>
                    <input type="text" value={dlCardExpiry}
                      onChange={(e) => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2); setDlCardExpiry(v); }}
                      placeholder="MM/YY" maxLength={5}
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>CVV *</label>
                    <input type="password" value={dlCardCvv} onChange={(e) => setDlCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="***" maxLength={4}
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            )}

            {dlError && (
              <div style={{ padding: '10px 14px', marginBottom: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 10, color: '#fca5a5', fontSize: 13 }}>
                {dlError}
              </div>
            )}
            {dlSuccess && (
              <div style={{ padding: '10px 14px', marginBottom: 12, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.5)', borderRadius: 10, color: '#6ee7b7', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✓ Payment successful! Starting download…
              </div>
            )}

            <button
              onClick={handleDownloadPayment}
              disabled={!isDlPaymentValid() || dlLoading || dlSuccess}
              className="fr-btn-brand"
              style={{
                width: '100%', padding: 14,
                background: (!isDlPaymentValid() || dlLoading || dlSuccess) ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                boxShadow: (!isDlPaymentValid() || dlLoading || dlSuccess) ? 'none' : '0 8px 22px -6px rgba(3,150,156,0.45)',
              }}
            >
              {dlLoading ? 'Processing…' : dlSuccess ? 'Downloading…' : `Pay & download · ${albumCurrencySymbol || 'RF'} ${(downloadTarget.price ?? 0).toLocaleString()}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Face scan modal - the viewfinder ── */}
      {isScanModalOpen && (
        <div
          onClick={() => { if (!isScanning) resetScanModal(); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.88)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 18, overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
              borderRadius: 22, padding: isMobile ? '24px 20px' : 28,
              maxWidth: 480, width: '100%', position: 'relative',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)', margin: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Face match</span>
              {!isScanning && !isCameraActive && (
                <button
                  onClick={resetScanModal}
                  aria-label="Close"
                  style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 0, color: '#fff', fontSize: 18, cursor: 'pointer' }}
                >×</button>
              )}
            </div>
            <h3 className="fr-serif" style={{ margin: '0 0 6px', color: '#fff', fontSize: 24, fontWeight: 600 }}>Show us your face.</h3>
            <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>
              We compare your selfie against this event&apos;s frames, return your
              matches, and discard the selfie. Nothing is stored.
            </p>

            {/* Hidden canvas for camera capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {isScanning ? (
              /* Scanning - viewfinder sweep over the selfie */
              <div style={{ textAlign: 'center' }}>
                <div className="fr-finder" style={{ minHeight: 230, marginBottom: 16 }}>
                  <span className="fr-corner tl" aria-hidden /><span className="fr-corner tr" aria-hidden />
                  <span className="fr-corner bl" aria-hidden /><span className="fr-corner br" aria-hidden />
                  <div className="fr-scanline" aria-hidden />
                  {uploadedPreview && (
                    <img
                      src={uploadedPreview}
                      alt="Scanning face"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(4px) brightness(0.6)' }}
                    />
                  )}
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Scanning…</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>Matching your face across the event&apos;s frames</p>
              </div>
            ) : isCameraActive ? (
              /* Live camera in the viewfinder */
              <div style={{ textAlign: 'center' }}>
                <div className="fr-finder" style={{ minHeight: 250, marginBottom: 16 }}>
                  <span className="fr-corner tl" aria-hidden /><span className="fr-corner tr" aria-hidden />
                  <span className="fr-corner bl" aria-hidden /><span className="fr-corner br" aria-hidden />
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
                  Line your face up inside the brackets
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="fr-btn-ghost" style={{ flex: 1, padding: 14 }} onClick={stopCamera}>Cancel</button>
                  <button className="fr-btn-coral" style={{ flex: 1, padding: 14 }} onClick={capturePhoto}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                    Capture
                  </button>
                </div>
              </div>
            ) : (
              <>
                {uploadedPreview ? (
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div className="fr-finder" style={{ minHeight: 210, marginBottom: 12 }}>
                      <span className="fr-corner tl" aria-hidden /><span className="fr-corner tr" aria-hidden />
                      <span className="fr-corner bl" aria-hidden /><span className="fr-corner br" aria-hidden />
                      <img
                        src={uploadedPreview}
                        alt="Captured face"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <p style={{ fontSize: 13, color: '#6ee7b7', fontWeight: 700, margin: 0 }}>Photo ready for the match</p>
                    <button
                      onClick={() => { setUploadedFile(null); setUploadedPreview(null); setScanError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      style={{ marginTop: 10, padding: '7px 16px', borderRadius: 9, background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.22)', cursor: 'pointer' }}
                    >
                      Change photo
                    </button>
                  </div>
                ) : (
                  <div className="fr-finder" style={{ minHeight: 190, marginBottom: 16, padding: 18 }}>
                    <span className="fr-corner tl" aria-hidden /><span className="fr-corner tr" aria-hidden />
                    <span className="fr-corner bl" aria-hidden /><span className="fr-corner br" aria-hidden />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button className="fr-btn-coral" onClick={startCamera}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        Take a selfie
                      </button>
                      <button className="fr-btn-ghost" onClick={() => fileInputRef.current?.click()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Upload a photo
                      </button>
                    </div>
                  </div>
                )}

                <button
                  className="fr-btn-brand"
                  style={{ width: '100%', padding: 15 }}
                  onClick={handleStartScan}
                  disabled={!uploadedFile}
                >
                  Find my frames
                </button>

                <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>
                  Just browsing?{' '}
                  <a href="/user/browse-photos" style={{ color: '#ff7ec4', fontWeight: 700, textDecoration: 'none' }}>
                    Visit the print shop →
                  </a>
                </p>

                {scanError && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>
                    {scanError}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── XentriPay Modal for album purchase ── */}
      {pendingPurchase && (
        <XentriPayModal
          isOpen={xentriModalOpen}
          onClose={() => {
            setXentriModalOpen(false);
            setPendingPurchase(null);
            setPendingDonationAmount(0);
            // Free-album case: if the user dismisses the modal without
            // paying, drop the in-flight context so the next Purchase
            // click starts a fresh flow with the current selection.
            if (freeExtrasInFlight) {
              setFreeExtrasInFlight(null);
              setFreeStatusMsg('Payment cancelled. Your selection is unchanged.');
            }
          }}
          onSuccess={handlePurchaseSuccess}
          onError={(e) => setPurchaseNotice(e)}
          amount={pendingPurchase.amount}
          currencyCode={pendingPurchase.currencyCode}
          currencyId={pendingPurchase.currencyId}
          paymentType={pendingPurchase.multiAlbumItems && pendingPurchase.multiAlbumItems.length > 1 ? 'multi_album_purchase' : 'album_purchase'}
          albumId={pendingPurchase.albumId}
          photoIds={pendingPurchase.photoIds}
          multiAlbumItems={pendingPurchase.multiAlbumItems}
          buyerId={buyerId || undefined}
          onAlreadyPurchased={handleAlreadyPurchased}
          title={`Buy ${pendingPurchase.photoIds.length} photo${pendingPurchase.photoIds.length > 1 ? 's' : ''}`}
          donationAmount={pendingDonationAmount > 0 ? pendingDonationAmount : undefined}
          showDonationPrompt
          onDonationAmountChange={(amt) => setPendingDonationAmount(amt)}
          darkMode
        />
      )}

      {/* ── Your details modal (buyer identity) ── */}
      {detailsOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 16,
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !detailsLoading) setDetailsOpen(false); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
              borderRadius: 20, padding: 'clamp(24px, 5vw, 32px)',
              maxWidth: 460, width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Before you pay</span>
            <h2 className="fr-serif" style={{ fontSize: 24, fontWeight: 600, color: '#fff', margin: '8px 0 6px' }}>Your details.</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 20px', lineHeight: 1.55 }}>
              We use these to send your receipt and to recognize you next time
              so you never pay twice for the same frame.
            </p>

            {(['name', 'email'] as const).map((field) => {
              const labels = { name: 'Full name', email: 'Email' };
              const placeholders = { name: 'Jane Doe', email: 'jane@example.com' };
              const value = field === 'name' ? detailsName : detailsEmail;
              const setter = field === 'name' ? setDetailsName : setDetailsEmail;
              return (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
                    {labels[field]}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholders[field]}
                    disabled={detailsLoading}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: 12, color: '#fff', fontSize: 14,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              );
            })}

            {detailsError && (
              <div style={{ padding: '10px 12px', marginBottom: 14, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, color: '#fca5a5', fontSize: 13 }}>
                {detailsError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                className="fr-btn-ghost"
                onClick={() => { if (!detailsLoading) { setDetailsOpen(false); pendingBuyRef.current = null; } }}
                disabled={detailsLoading}
                style={{ flex: 1, padding: 12 }}
              >
                Cancel
              </button>
              <button
                className="fr-btn-brand"
                onClick={handleDetailsSubmit}
                disabled={detailsLoading}
                style={{ flex: 2, padding: 12, background: detailsLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)', boxShadow: detailsLoading ? 'none' : '0 8px 22px -6px rgba(3,150,156,0.45)' }}
              >
                {detailsLoading ? 'Verifying…' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unlock modal (returning buyer) - both doors, per PAYMENTS.md ── */}
      {unlockOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 16,
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !unlockLoading) setUnlockOpen(false); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
              borderRadius: 20, padding: 'clamp(24px, 5vw, 32px)',
              maxWidth: 440, width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Returning buyer</span>
            <h2 className="fr-serif" style={{ fontSize: 24, fontWeight: 600, color: '#fff', margin: '8px 0 6px' }}>
              Unlock your photos.
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 16px', lineHeight: 1.55 }}>
              Use the unlock code from your receipt email, or the email you paid with.
            </p>

            <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(0,0,0,0.25)', borderRadius: 12, marginBottom: 16 }}>
              {(['code', 'email'] as const).map(mode => (
                <button
                  key={mode}
                  className={`fr-tab ${unlockMode === mode ? 'on' : ''}`}
                  onClick={() => { setUnlockMode(mode); setUnlockError(null); }}
                  disabled={unlockLoading}
                >
                  {mode === 'code' ? 'I have a code' : 'Use my email'}
                </button>
              ))}
            </div>

            {unlockMode === 'code' ? (
              <div style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  value={unlockCodeInput}
                  onChange={(e) => setUnlockCodeInput(e.target.value.toUpperCase())}
                  placeholder="UNLK-XXXX-XXXX"
                  disabled={unlockLoading}
                  autoFocus
                  style={{
                    width: '100%', padding: 14, borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.06)', color: '#fff',
                    fontSize: 16, fontWeight: 800, letterSpacing: '0.2em', textAlign: 'center',
                    fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '8px 0 0' }}>
                  Unlocks only the photos in that purchase.
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <input
                  type="email"
                  value={unlockEmailInput}
                  onChange={(e) => setUnlockEmailInput(e.target.value)}
                  placeholder="jane@example.com"
                  disabled={unlockLoading}
                  autoFocus
                  style={{
                    width: '100%', padding: '13px 14px', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14.5,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '8px 0 0' }}>
                  Unlocks every photo this email has purchased in this album.
                </p>
              </div>
            )}

            {unlockError && (
              <div style={{ padding: '10px 12px', marginBottom: 14, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, color: '#fca5a5', fontSize: 13 }}>
                {unlockError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                className="fr-btn-ghost"
                onClick={() => { if (!unlockLoading) { setUnlockOpen(false); setUnlockError(null); } }}
                disabled={unlockLoading}
                style={{ flex: 1, padding: 12 }}
              >
                Cancel
              </button>
              <button
                className="fr-btn-brand"
                onClick={handleUnlockSubmit}
                disabled={unlockLoading}
                style={{ flex: 2, padding: 12, background: unlockLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)', boxShadow: unlockLoading ? 'none' : '0 8px 22px -6px rgba(3,150,156,0.45)' }}
              >
                {unlockLoading ? 'Unlocking…' : 'Unlock & download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent unlock-code banner (after a fresh purchase) ── */}
      {recentUnlockCode && (
        <div
          style={{
            position: 'fixed', top: 120, right: 20, maxWidth: 340,
            background: 'linear-gradient(145deg, #0b3d4a 0%, #0a2d3a 100%)',
            border: '1px solid rgba(3,150,156,0.45)',
            borderRadius: 14, padding: '16px 18px', zIndex: 2400,
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)', color: '#e5fafa',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Save your unlock code</div>
            <button
              onClick={() => setRecentUnlockCode(null)}
              style={{ background: 'transparent', border: 'none', color: '#7be0e5', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
              aria-label="Dismiss"
            >×</button>
          </div>
          <div
            style={{
              fontFamily: 'monospace', fontSize: 17, fontWeight: 700,
              letterSpacing: 1.5, color: '#fff',
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              userSelect: 'all',
            }}
          >
            {recentUnlockCode}
          </div>
          <p style={{ fontSize: 12, color: '#a8d4d8', margin: '8px 0 0' }}>
            We also emailed it to you. Use it (or your email) on this page
            anytime to re-download these photos.
          </p>
        </div>
      )}
    </div>
  );
};

export default FindMyPhotos;
