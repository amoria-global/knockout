'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../components/navbar';
import DotGrid from '../components/DotGrid';
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
  type FreeAlbumPhoto,
} from '@/lib/APIs/public/get-free-album/route';
import { API_ENDPOINTS } from '@/lib/api/config';
import { API_CONFIG } from '@/lib/api/config';

// Photo shape used throughout the page, augmented with album-purchase fields
type PhotoItem = {
  id: string;
  url: string;
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
  const [detailsPhone, setDetailsPhone] = useState('');
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
  const [dlPhone, setDlPhone] = useState('');
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
  const [freePendingPay, setFreePendingPay] = useState<{ refid: string; buyerId: string } | null>(null);
  const [freeIsProcessing, setFreeIsProcessing] = useState(false);
  const [freeStatusMsg, setFreeStatusMsg] = useState('');

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
            // If email is in URL (from email link), auto-verify using access code as OTP
            const emailFromUrl = searchParams.get('email');
            if (emailFromUrl) {
              setFreeAlbumEmail(emailFromUrl);
              setFreeAlbumFlow('otp');
              setFreeAlbumLoading(true);
              // Auto-submit: use the access code itself as the OTP (proves email ownership)
              verifyFreeAlbumAccess(codeFromUrl, emailFromUrl, codeFromUrl).then((verifyRes) => {
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
                  }
                } else {
                  // Auto-verify failed - fall back to manual OTP entry
                  setFreeAlbumError('');
                }
                setFreeAlbumLoading(false);
              }).catch(() => { setFreeAlbumLoading(false); });
            } else {
              setFreeAlbumFlow('email');
            }
            return;
          }
          setAlbumEventId(response.data.eventId ?? response.data.albumId);
          if (response.data.pricing?.currencyId) setAlbumCurrencyId(response.data.pricing.currencyId);
          if (response.data.pricing?.currencySymbol) setAlbumCurrencySymbol(response.data.pricing.currencySymbol);
          const perPhotoPrice = response.data.pricing?.pricePerImage ?? response.data.pricePerPhoto;
          const albumCurAbbr = response.data.pricing?.currencyAbbreviation;
          const albumCurId = response.data.pricing?.currencyId;
          const resolvedAlbumId = response.data.albumId;
          const photos = (response.data.photos ?? []).map((p: AlbumPhoto) => ({
            id: p.id,
            url: p.url || p.thumbnailUrl || '',
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
        const parsed = JSON.parse(details) as { name?: string; email?: string; phone?: string };
        if (parsed.name && !detailsName) setDetailsName(parsed.name);
        if (parsed.email && !detailsEmail) setDetailsEmail(parsed.email);
        if (parsed.phone && !detailsPhone) setDetailsPhone(parsed.phone);
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
        // Carry album-level identifiers onto every PhotoItem. Without these the
        // Download button's purchased-photo branch can't fire (it requires
        // photo.albumId), and the buy flow can't resolve a currency/album.
        const albumId = response.data.albumId;
        const albumType = response.data.albumType;
        const currencyId = response.data.pricing?.currencyId;
        const currencyAbbreviation = response.data.pricing?.currencyAbbreviation;
        const photos = (response.data.photos ?? []).map((p: AlbumPhoto) => ({
          id: p.id,
          url: p.url || p.thumbnailUrl || '',
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
            url: p.url || p.thumbnailUrl || '',
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
  };

  /**
   * Download every currently-selected free-album photo.
   *
   * No one-time consumption / link expiry: the access link must stay active
   * across visits so the user can come back and re-download (or pick more
   * photos). The only limits we enforce on the client are:
   *   - max free count per click (freeAlbumMax)
   *   - per-extra-photo fee (freeAlbumPricePerExtra) for overflow
   * Lifetime / quota tracking is the backend's responsibility — we don't
   * call selectFreeAlbumPhotos or consumeFreeAlbumGrant any more because
   * both side-effects locked the link.
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
    setFreeStatusMsg(
      `Downloading ${chosen.length} photo${chosen.length !== 1 ? 's' : ''}. ` +
      `Your access link stays active — come back any time.`
    );
  };

  /**
   * Selection-required free-album download. If the user selects more than the
   * album cap, the overflow is paid for via the existing XentriPay album
   * purchase flow (same payment path used for paid albums). After payment the
   * user clicks "I've paid — download" which calls handleFreeConfirmPaid.
   *
   * Hard rule: the bulk button NEVER downloads more than what's selected, and
   * paid-extras NEVER ship until handleFreeConfirmPaid recorded the purchase.
   */
  const handleFreeCappedDownload = async () => {
    if (!freeAlbumId || freeIsProcessing) return;
    const cap = freeAlbumMax ?? Infinity;
    const price = freeAlbumPricePerExtra || 0;
    const count = selectedFreePhotoIds.size;
    if (count === 0) { setFreeStatusMsg('Select at least one photo to download.'); return; }
    const overflow = Number.isFinite(cap) ? Math.max(0, count - (cap as number)) : 0;

    if (overflow === 0) {
      setFreeIsProcessing(true);
      try { await downloadFreeSelected(); }
      finally { setFreeIsProcessing(false); }
      return;
    }

    if (!(price > 0) || !freeAlbumCurrencyId) {
      setFreeStatusMsg(`You can download at most ${cap} photo(s) from this album.`);
      return;
    }

    // Overflow → kick off payment for the extras only.
    setFreeIsProcessing(true);
    setFreeStatusMsg('Preparing payment for extra photos…');
    try {
      const ident = await identifyAlbumBuyer(freeAlbumId, {
        name: freeAlbumEmail,
        email: freeAlbumEmail,
        phone: '',
        deviceFingerprint: '',
      });
      const bId = ident.data?.buyerId;
      if (!ident.success || !bId) throw new Error(ident.error || 'Could not identify you. Please retry.');

      // First `cap` selected are free; the rest are the paid overflow.
      const selectedList = freeAlbumPhotos.filter(p => selectedFreePhotoIds.has(p.id)).map(p => p.id);
      const overflowIds = selectedList.slice(cap as number);
      const amount = Math.round(price * overflowIds.length);

      const pay = await initiateXentriPayAlbumPurchase({
        albumId: freeAlbumId,
        buyerId: bId,
        photoIds: overflowIds,
        amount,
        currencyId: freeAlbumCurrencyId,
        paymentMethod: 'CARD',
        redirectUrl: typeof window !== 'undefined' ? window.location.href : '',
      });
      if (!pay.success || !pay.data?.paymentUrl || !pay.data?.refid) {
        throw new Error(pay.error || 'Could not start payment. Please try again.');
      }
      window.open(pay.data.paymentUrl, '_blank', 'noopener');
      setFreePendingPay({ refid: pay.data.refid, buyerId: bId });
      setFreeStatusMsg(
        `Opened payment for ${overflowIds.length} extra photo(s) ` +
        `(${freeAlbumCurrencyAbbr || ''} ${amount}). Complete it, then click "I've paid — download".`
      );
    } catch (e) {
      setFreeStatusMsg(e instanceof Error ? e.message : 'Payment could not be started.');
    } finally {
      setFreeIsProcessing(false);
    }
  };

  /**
   * After the user completes the XentriPay popup, record the purchase against
   * the album then ship all selected photos (free quota + paid extras).
   */
  const handleFreeConfirmPaid = async () => {
    if (!freePendingPay || !freeAlbumId || freeIsProcessing) return;
    setFreeIsProcessing(true);
    setFreeStatusMsg('Confirming payment…');
    try {
      const rec = await recordAlbumPurchase(freePendingPay.refid, freePendingPay.buyerId);
      const status = (rec.data?.status || '').toUpperCase();
      if (rec.success && (status === 'COMPLETED' || status === '')) {
        setFreePendingPay(null);
        await downloadFreeSelected();
      } else {
        setFreeStatusMsg('Payment not confirmed yet. Finish it in the payment tab, then try again.');
      }
    } catch (e) {
      setFreeStatusMsg(e instanceof Error ? e.message : 'Could not confirm payment yet. Try again shortly.');
    } finally {
      setFreeIsProcessing(false);
    }
  };

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
    setDlPhone('');
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
        return dlPhone.length >= 10;
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
    const phone = detailsPhone.trim();
    if (!name) { setDetailsError('Please enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setDetailsError('Please enter a valid email.'); return; }
    if (!phone || phone.length < 9) { setDetailsError('Please enter a valid phone number.'); return; }

    const photos = pendingBuyRef.current || [];
    const ctx = getPurchaseContext(photos);
    if (!ctx) { setDetailsError('Missing album info. Please rescan.'); return; }

    setDetailsLoading(true);
    try {
      const fp = await getDeviceId();
      const res = await identifyAlbumBuyer(ctx.albumId, { name, email, phone, deviceFingerprint: fp });
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Could not verify your details.');
      }
      const { buyerId: newBuyerId, purchasedPhotoIds } = res.data;
      setBuyerId(newBuyerId);
      setBuyerAlbumId(ctx.albumId);

      // Persist
      try {
        localStorage.setItem(`album_buyer_id:${ctx.albumId}`, newBuyerId);
        localStorage.setItem('album_buyer_details', JSON.stringify({ name, email, phone }));
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#052047' }}>
      <style>{`
        /* ── Phase stepper (floating, glassmorphism) ── */
        .fmp-stepper {
          position: sticky;
          top: 76px;
          z-index: 30;
          padding: 14px 16px 0;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }
        .fmp-stepper-inner {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(8,12,28,0.55);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 999px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 14px 30px -14px rgba(0,0,0,0.55), 0 4px 10px -2px rgba(0,0,0,0.25);
        }
        .fmp-step {
          appearance: none; background: transparent; border: 0; cursor: pointer;
          color: rgba(255,255,255,0.55);
          padding: 6px 10px;
          border-radius: 999px;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        .fmp-step:hover:not(:disabled) {
          color: rgba(255,255,255,0.92);
          background: rgba(255,255,255,0.06);
        }
        .fmp-step:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
        .fmp-step-num {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .fmp-step-text {
          display: flex; flex-direction: column; align-items: flex-start;
          line-height: 1.1;
        }
        .fmp-step-label { font-size: 12.5px; font-weight: 700; letter-spacing: 0.02em; }
        .fmp-step-sub { font-size: 9.5px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.6; margin-top: 1.5px; }
        .fmp-step.is-active {
          background: linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.18));
          color: #fff;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.18) inset;
        }
        .fmp-step.is-active .fmp-step-num {
          background: linear-gradient(135deg, #C084FC, #EC4899);
          color: #fff;
          box-shadow: 0 0 0 4px rgba(192,132,252,0.18), 0 6px 14px -4px rgba(236,72,153,0.55);
          transform: scale(1.06);
        }
        .fmp-step.is-completed .fmp-step-num {
          background: #10b981; color: #fff;
        }
        .fmp-step.is-completed { color: rgba(255,255,255,0.85); }
        .fmp-step-divider {
          width: 16px; height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.30), rgba(255,255,255,0.10));
          flex-shrink: 0;
        }
        .fmp-step-divider.is-past {
          background: linear-gradient(90deg, rgba(192,132,252,0.45), rgba(236,72,153,0.55));
        }
        @media (max-width: 720px) {
          .fmp-stepper { top: 72px; padding: 10px 8px 0; }
          .fmp-step { padding: 4px 6px; gap: 6px; }
          .fmp-step-text { display: none; }
          .fmp-step.is-active .fmp-step-text { display: flex; }
          .fmp-step-divider { width: 10px; }
        }
      `}</style>

      <Navbar />

      {/* ── Phase Stepper - visible across all phases, click to navigate back ── */}
      <div className="fmp-stepper" aria-label="Phase navigation">
        <nav className="fmp-stepper-inner">
          {phases.map((p, i) => {
            const isActive = i === currentPhaseIndex;
            const isCompleted = i < currentPhaseIndex;
            const canNavigate = i <= currentPhaseIndex; // can go to current or back; not forward
            return (
              <React.Fragment key={p.id}>
                <button
                  type="button"
                  className={`fmp-step ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
                  onClick={() => canNavigate && goToPhase(p.id)}
                  disabled={!canNavigate}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="fmp-step-num">
                    {isCompleted ? <i className="bi bi-check2" style={{ fontSize: 14 }} /> : <i className={`bi ${p.icon}`} style={{ fontSize: 12 }} />}
                  </span>
                  <span className="fmp-step-text">
                    <span className="fmp-step-label">{p.label}</span>
                    <span className="fmp-step-sub">{p.sub}</span>
                  </span>
                </button>
                {i < phases.length - 1 && (
                  <span className={`fmp-step-divider ${i < currentPhaseIndex ? 'is-past' : ''}`} aria-hidden="true" />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {freeAlbumFlow !== 'idle' ? (
        /* ── Free Album Flow ── */
        <div id="phase-connect" style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #052047 0%, #103E83 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '100px 20px 40px' : '80px 20px 40px',
          scrollMarginTop: '120px',
        }}>
          {freeAlbumFlow === 'email' && (
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '24px',
              padding: isMobile ? '36px 24px' : '48px 44px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📸</div>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Free Album Access</h2>
              {freeAlbumTitle && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '4px' }}>{freeAlbumTitle}</p>}
              {freeAlbumPhotographer && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px' }}>by {freeAlbumPhotographer}</p>}
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                This album requires email verification to view.
              </p>
              <input
                type="email"
                placeholder="Enter your email address"
                value={freeAlbumEmail}
                onChange={(e) => { setFreeAlbumEmail(e.target.value); setFreeAlbumError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleFreeAlbumRequestAccess()}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: freeAlbumError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              {freeAlbumError && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{freeAlbumError}</p>
              )}
              <button
                onClick={handleFreeAlbumRequestAccess}
                disabled={freeAlbumLoading || !freeAlbumEmail.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: freeAlbumLoading || !freeAlbumEmail.trim() ? 'rgba(255,255,255,0.1)' : '#fff',
                  color: freeAlbumLoading || !freeAlbumEmail.trim() ? 'rgba(255,255,255,0.4)' : '#052047',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: freeAlbumLoading || !freeAlbumEmail.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {freeAlbumLoading ? 'Sending...' : 'Request Access'}
              </button>
              <button
                onClick={() => { setFreeAlbumFlow('idle'); setFreeAlbumError(''); }}
                style={{ marginTop: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}
              >
                ← Back to invite code
              </button>
            </div>
          )}

          {freeAlbumFlow === 'otp' && (
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '24px',
              padding: isMobile ? '36px 24px' : '48px 44px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
            }}>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Enter Verification Code</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                We sent a 6-digit code to<br />
                <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{maskEmail(freeAlbumEmail)}</span>
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
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
                      width: '44px',
                      height: '52px',
                      borderRadius: '10px',
                      border: freeAlbumError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff',
                      fontSize: '20px',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                ))}
              </div>
              {freeAlbumError && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{freeAlbumError}</p>
              )}
              <button
                onClick={handleFreeAlbumVerify}
                disabled={freeAlbumLoading || freeAlbumOtp.length < 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: freeAlbumLoading || freeAlbumOtp.length < 6 ? 'rgba(255,255,255,0.1)' : '#fff',
                  color: freeAlbumLoading || freeAlbumOtp.length < 6 ? 'rgba(255,255,255,0.4)' : '#052047',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: freeAlbumLoading || freeAlbumOtp.length < 6 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '12px',
                }}
              >
                {freeAlbumLoading ? 'Verifying...' : 'Verify'}
              </button>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                {"Didn't receive? "}
                <button
                  onClick={handleFreeAlbumResendOtp}
                  disabled={freeAlbumLoading}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Resend
                </button>
              </p>
              <button
                onClick={() => { setFreeAlbumFlow('email'); setFreeAlbumOtp(''); setFreeAlbumError(''); }}
                style={{ marginTop: '12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}
              >
                ← Change email
              </button>
            </div>
          )}

          {freeAlbumFlow === 'verified' && (
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: selectedFreePhotoIds.size > 0 ? 100 : 0 }}>
              {/* Album header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                {/* Pink uppercase eyebrow */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginBottom: 10,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: 'rgba(242,12,143,0.14)',
                  border: '1px solid rgba(242,12,143,0.36)',
                  color: '#F20C8F',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  <i className="bi bi-camera-fill" style={{ fontSize: 11 }} />
                  Free Album
                </div>
                <h2 style={{ color: '#fff', fontSize: isMobile ? '26px' : '34px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>{freeAlbumTitle}</h2>
                {freeAlbumPhotographer && (
                  <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '14px', marginBottom: '8px' }}>
                    by <strong style={{ color: '#fff' }}>{freeAlbumPhotographer}</strong>
                  </p>
                )}
                {freeAlbumExpiresAt && (() => {
                  const daysLeft = Math.ceil((new Date(freeAlbumExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  if (daysLeft <= 0) return (
                    <p style={{ color: '#ef4444', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <i className="bi bi-x-octagon-fill" style={{ fontSize: 12 }} />
                      This album has expired and is no longer available
                    </p>
                  );
                  if (daysLeft <= 7) return (
                    <p style={{ color: '#f59e0b', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <i className="bi bi-clock-history" style={{ fontSize: 12 }} />
                      Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                    </p>
                  );
                  return null;
                })()}
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginTop: '8px' }}>
                  <i className="bi bi-images" style={{ marginRight: 5, color: '#F20C8F' }} />
                  {freeAlbumPhotos.length} photo{freeAlbumPhotos.length !== 1 ? 's' : ''}
                </p>
                {/* Per album policy: NO bulk "Download All" — user must pick
                    photos so we can enforce the free cap (and charge for any
                    extras). Keep the convenience "Select all" though; if their
                    pick exceeds the cap, the cart bar will route through the
                    pay-for-extras flow. */}
                {freeAlbumPhotos.length > 1 && selectedFreePhotoIds.size < freeAlbumPhotos.length && (
                  <div style={{ display: 'inline-flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      onClick={() => setSelectedFreePhotoIds(new Set(freeAlbumPhotos.map(p => p.id)))}
                      style={{
                        padding: '11px 18px',
                        borderRadius: 11,
                        border: '1.5px solid rgba(255,255,255,0.22)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        fontSize: 13.5,
                        fontWeight: 700,
                        letterSpacing: '-0.005em',
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(242,12,143,0.12)'; e.currentTarget.style.borderColor = 'rgba(242,12,143,0.42)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
                    >
                      <i className="bi bi-check2-square" style={{ fontSize: 13 }} />
                      Select all
                    </button>
                  </div>
                )}
                {/* Cap / extra-price hint so the user sees what they'll be
                    charged for if they pick more than the free quota. */}
                {(freeAlbumMax !== null || freeAlbumPricePerExtra > 0) && (
                  <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
                    {freeAlbumMax !== null && (
                      <>Free up to <strong style={{ color: '#fff' }}>{freeAlbumMax}</strong> photo{freeAlbumMax === 1 ? '' : 's'}.</>
                    )}
                    {freeAlbumPricePerExtra > 0 && (
                      <> Extras cost <strong style={{ color: '#fff' }}>{freeAlbumCurrencyAbbr || ''} {freeAlbumPricePerExtra}</strong> each.</>
                    )}
                  </p>
                )}
                {freeStatusMsg && (
                  <p style={{ color: '#F20C8F', fontSize: 12.5, marginTop: 8, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                    {freeStatusMsg}
                  </p>
                )}
              </div>

              {/* Photo grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px',
              }}>
                {freeAlbumPhotos.map((photo) => {
                  const isSelected = selectedFreePhotoIds.has(photo.id);
                  return (
                  <div
                    key={photo.id}
                    style={{
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      aspectRatio: '1',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid rgba(242,12,143,0.45)' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: isSelected
                        ? '0 0 0 3px #F20C8F, 0 8px 22px -6px rgba(242,12,143,0.42)'
                        : 'none',
                      transition: 'box-shadow 0.18s, border-color 0.18s',
                    }}
                    onClick={() => setSelectedPhoto({
                      id: photo.id,
                      url: photo.url || photo.thumbnailUrl,
                      alt: photo.caption || 'Free album photo',
                    })}
                  >
                    <img
                      src={stampPreviewUrl(photo.url || photo.thumbnailUrl, viewerId, { buyerId, refid: purchaseRefid })}
                      alt={photo.caption || 'Free album photo'}
                      loading="lazy"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        pointerEvents: 'none',
                        filter: isOccluded ? 'brightness(0)' : undefined,
                        transition: 'filter 0.1s linear',
                      }}
                    />
                    {/* Add-to-cart toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFreePhotoSelected(photo.id); }}
                      aria-label={isSelected ? 'Remove from cart' : 'Add to cart'}
                      title={isSelected ? 'Remove from cart' : 'Add to cart'}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        width: '30px',
                        height: '30px',
                        borderRadius: '9px',
                        background: isSelected ? '#F20C8F' : 'rgba(255,255,255,0.95)',
                        border: isSelected ? '2px solid #F20C8F' : '2px solid rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3,
                        padding: 0,
                        boxShadow: isSelected
                          ? '0 4px 12px -2px rgba(242,12,143,0.50)'
                          : '0 2px 6px rgba(0,0,0,0.30)',
                        transition: 'transform 0.15s, background 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {isSelected ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <i className="bi bi-plus" style={{ fontSize: '16px', color: '#F20C8F', fontWeight: 700, lineHeight: 1 }} />
                      )}
                    </button>
                    {/* Per-card direct-download removed: would bypass the
                        free-album cap and the pay-for-extras flow. Users add
                        photos to the cart with the +/✓ toggle above, then use
                        the bottom action bar to download. */}
                  </div>
                  );
                })}
              </div>

              {/* ── Free-album Cart Action Bar ── */}
              {selectedFreePhotoIds.size > 0 && (
                <div style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(15,15,20,0.97)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  padding: isMobile ? '14px 16px' : '16px 24px',
                  zIndex: 1500,
                  boxShadow: '0 -12px 32px rgba(0,0,0,0.40)',
                }}>
                  {/* Brand top stripe */}
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
                  }} />
                  <div style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'center',
                    gap: 12,
                  }}>
                    <div style={{ flex: isMobile ? 'initial' : 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '6px 12px 6px 8px',
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                        color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '-0.005em',
                        boxShadow: '0 6px 14px -4px rgba(242,12,143,0.36)',
                      }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.22)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="bi bi-bag-check-fill" style={{ fontSize: 11 }} />
                        </span>
                        {selectedFreePhotoIds.size} in cart
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12.5, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <i className="bi bi-download" style={{ fontSize: 11, color: '#F20C8F' }} />
                        Ready to download
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedFreePhotoIds(new Set())}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 11,
                        background: 'transparent',
                        border: '1.5px solid rgba(255,255,255,0.20)',
                        color: 'rgba(255,255,255,0.82)',
                        fontSize: 13.5,
                        fontWeight: 700,
                        letterSpacing: '-0.005em',
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.color = '#F20C8F'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; }}
                    >
                      <i className="bi bi-x-circle" style={{ fontSize: 13 }} />
                      Clear
                    </button>
                    {(() => {
                      const cap = freeAlbumMax ?? Infinity;
                      const count = selectedFreePhotoIds.size;
                      const overflow = Number.isFinite(cap) ? Math.max(0, count - (cap as number)) : 0;
                      const extrasTotal = overflow * (freeAlbumPricePerExtra || 0);
                      const showExtras = overflow > 0 && freeAlbumPricePerExtra > 0;
                      const label = showExtras
                        ? `Pay ${freeAlbumCurrencyAbbr || ''} ${extrasTotal} & download ${count}`
                        : `Download ${count} photo${count !== 1 ? 's' : ''}`;
                      return (
                        <button
                          onClick={handleFreeCappedDownload}
                          disabled={freeIsProcessing || !!freePendingPay}
                          style={{
                            padding: '11px 18px',
                            borderRadius: 11,
                            background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                            border: 'none',
                            color: '#fff',
                            fontSize: 13.5,
                            fontWeight: 700,
                            letterSpacing: '-0.005em',
                            cursor: freeIsProcessing || !!freePendingPay ? 'not-allowed' : 'pointer',
                            opacity: freeIsProcessing || !!freePendingPay ? 0.65 : 1,
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            boxShadow: '0 8px 22px -6px rgba(242,12,143,0.45)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                          }}
                          onMouseEnter={(e) => { if (!freeIsProcessing && !freePendingPay) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; } }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 22px -6px rgba(242,12,143,0.45)'; }}
                        >
                          <i className={showExtras ? 'bi bi-credit-card-2-front' : 'bi bi-download'} style={{ fontSize: 13 }} />
                          {label}
                        </button>
                      );
                    })()}
                    {freePendingPay && (
                      <button
                        onClick={handleFreeConfirmPaid}
                        disabled={freeIsProcessing}
                        style={{
                          padding: '11px 18px',
                          borderRadius: 11,
                          background: '#10B981',
                          border: 'none',
                          color: '#fff',
                          fontSize: 13.5,
                          fontWeight: 700,
                          letterSpacing: '-0.005em',
                          cursor: freeIsProcessing ? 'wait' : 'pointer',
                          opacity: freeIsProcessing ? 0.65 : 1,
                          display: 'inline-flex', alignItems: 'center', gap: 7,
                          boxShadow: '0 8px 22px -6px rgba(16,185,129,0.45)',
                        }}
                      >
                        <i className="bi bi-check2-circle" style={{ fontSize: 13 }} />
                        I&apos;ve paid — download
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : !isCodeSubmitted ? (
        /* ── Phase 1: Connect - Hero + Invite Code ── */
        <div
          id="phase-connect"
          ref={heroSectionRef}
          onMouseMove={handleMouseMove(heroSectionRef, setHeroMousePos)}
          onMouseLeave={() => setHeroMousePos(null)}
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(to right, #052047, #052047, #103E83)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: isMobile ? '100px 20px 40px' : '80px 20px 40px',
            scrollMarginTop: '120px',
          }}
        >
          {/* Interactive DotGrid - same brand-blue palette + sizing as the footer.
              Replaces the old static dot pattern + manual mouse-spotlight overlay. */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
            <DotGrid
              dotSize={2}
              gap={15}
              baseColor="#1E3A78"
              activeColor="#3B82F6"
              proximity={120}
              shockRadius={180}
              shockStrength={4}
              resistance={750}
              returnDuration={1.4}
            />
          </div>

          <div style={{
            maxWidth: '720px',
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
            background: 'linear-gradient(135deg, rgba(5, 32, 71, 0.95) 0%, rgba(16, 62, 131, 0.92) 100%)',
            borderRadius: '28px',
            padding: isMobile ? '48px 28px' : '56px 52px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            {/* Badge */}
            <div style={{
              display: 'inline-block',
              padding: '8px 20px',
              borderRadius: '50px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              marginBottom: '28px',
            }}>
              <span style={{
                color: '#FF6B6B',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>Face Recognition</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: isMobile ? '32px' : '59px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '16px',
              fontFamily: "'Pragati Narrow', sans-serif",
            }}>
              Find <span style={{ color: '#FF6B6B' }}>Your Photos</span>
            </h1>

            <p style={{
              fontSize: isMobile ? '16px' : '18px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.6,
              marginBottom: '36px',
              maxWidth: '520px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Search for your photos across all events on the platform using facial recognition, or use an invite code to access a specific event gallery.
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

            {/* === Facial Recognition Scan Section === */}
            {!isScanning && !isCameraActive && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '6px',
                }}>
                  Facial Recognition Scan
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.5,
                  maxWidth: '420px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: '0',
                }}>
                  {`Don't have an invite code? No problem. Take a selfie or upload your photo and we'll scan all event photos on the platform to find every photo you appear in.`}
                </p>
              </div>
            )}
            {isScanning ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 24px',
                  position: 'relative',
                  border: '4px solid #FF6B6B',
                  boxShadow: '0 0 30px rgba(255,107,107,0.4)',
                }}>
                  {uploadedPreview && (
                    <img
                      src={uploadedPreview}
                      alt="Scanning face"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'blur(4px) brightness(0.7)',
                      }}
                    />
                  )}
                  <div className="scan-line" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent 0%, #FF6B6B 30%, #ffffff 50%, #FF6B6B 70%, transparent 100%)',
                    boxShadow: '0 0 12px rgba(255,107,107,0.8), 0 0 30px rgba(255,107,107,0.4)',
                    zIndex: 2,
                  }} />
                  <div className="scan-pulse-ring" style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    border: '3px solid rgba(255,107,107,0.5)',
                    zIndex: 1,
                  }} />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>Scanning...</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>Matching your face across event photos</p>
              </div>
            ) : isCameraActive ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 20px',
                  border: '4px solid #FF6B6B',
                  boxShadow: '0 4px 20px rgba(255,107,107,0.3)',
                }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)',
                    }}
                  />
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
                  Position your face in the circle
                </p>
                <div style={{ display: 'flex', gap: '12px', maxWidth: '340px', margin: '0 auto' }}>
                  <button
                    onClick={stopCamera}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#FF6B6B',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#ff5252'; }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#FF6B6B'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="4"/>
                    </svg>
                    Capture
                  </button>
                </div>
              </div>
            ) : (
              <>
                {uploadedPreview ? (
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '3px solid #FF6B6B',
                      boxShadow: '0 4px 12px rgba(255,107,107,0.3)',
                      margin: '0 auto 12px',
                    }}>
                      <img
                        src={uploadedPreview}
                        alt="Captured face"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <p style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>Photo ready for scan</p>
                    <button
                      onClick={() => { setUploadedFile(null); setUploadedPreview(null); setScanError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 16px',
                        borderRadius: '8px',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Change photo
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '20px',
                    maxWidth: '340px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}>
                    {/* Take Selfie button */}
                    <div
                      onClick={startCamera}
                      style={{
                        flex: 1,
                        border: '2px dashed rgba(255,255,255,0.2)',
                        borderRadius: '16px',
                        padding: '24px 12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FF6B6B'; e.currentTarget.style.background = 'rgba(255,107,107,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(255,107,107,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Take Selfie</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Use camera</p>
                    </div>

                    {/* Upload Photo button */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1,
                        border: '2px dashed rgba(255,255,255,0.2)',
                        borderRadius: '16px',
                        padding: '24px 12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#83B4FF'; e.currentTarget.style.background = 'rgba(131,180,255,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(131,180,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#83B4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Upload Photo</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>From gallery</p>
                    </div>
                  </div>
                )}

                {/* Find My Photos button */}
                <button
                  onClick={handleStartScan}
                  disabled={!uploadedFile}
                  style={{
                    width: '100%',
                    maxWidth: '340px',
                    display: 'block',
                    margin: '0 auto',
                    padding: '16px',
                    borderRadius: '12px',
                    background: uploadedFile ? '#FF6B6B' : 'rgba(255,255,255,0.08)',
                    color: uploadedFile ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    fontSize: '16px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: uploadedFile ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => { if (uploadedFile) (e.target as HTMLButtonElement).style.background = '#ff5252'; }}
                  onMouseLeave={(e) => { if (uploadedFile) (e.target as HTMLButtonElement).style.background = '#FF6B6B'; }}
                >
                  Find My Photos
                </button>

                {scanError && (
                  <p style={{
                    color: '#FF6B6B',
                    fontSize: '14px',
                    marginTop: '12px',
                    textAlign: 'center',
                  }}>{scanError}</p>
                )}
              </>
            )}

            {/* OR Divider */}
            {!isScanning && !isCameraActive && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '32px 0 28px',
                gap: '16px',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.15)' }} />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600, letterSpacing: '1px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.15)' }} />
              </div>
            )}

            {/* Invite Code Section */}
            {!isScanning && !isCameraActive && (
              <>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '6px',
                }}>
                  Enter Invite Code
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.5,
                  maxWidth: '420px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: '16px',
                }}>
                  Received an invite code from your photographer or event owner? Enter it below to go directly to that specific event gallery.
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '12px',
                  maxWidth: '460px',
                  margin: '0 auto',
                }}>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value); setInviteError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleInviteSubmit()}
                    placeholder="Enter invite code"
                    style={{
                      flex: 1,
                      padding: '16px 20px',
                      borderRadius: '12px',
                      border: inviteError ? '2px solid #FF6B6B' : '2px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#ffffff',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      letterSpacing: '2px',
                      fontWeight: 600,
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#FF6B6B'; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                    onBlur={(e) => { if (!inviteError) { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.06)'; } }}
                  />
                  <button
                    onClick={handleInviteSubmit}
                    disabled={isLoadingAlbum}
                    style={{
                      padding: '16px 32px',
                      borderRadius: '12px',
                      background: isLoadingAlbum ? 'rgba(255,107,107,0.6)' : '#FF6B6B',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: isLoadingAlbum ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { if (!isLoadingAlbum) { (e.target as HTMLButtonElement).style.background = '#ff5252'; (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'; } }}
                    onMouseLeave={(e) => { if (!isLoadingAlbum) { (e.target as HTMLButtonElement).style.background = '#FF6B6B'; (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; } }}
                  >
                    {isLoadingAlbum ? 'Loading...' : 'Access Gallery'}
                  </button>
                </div>

                {inviteError && (
                  <p style={{
                    color: '#FF6B6B',
                    fontSize: '14px',
                    marginTop: '12px',
                  }}>{inviteError}</p>
                )}

                {/* Dashed decorative border */}
                <div style={{
                  marginTop: '40px',
                  borderTop: '1px dashed rgba(255,255,255,0.15)',
                  paddingTop: '24px',
                }}>
                  <p style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '13px',
                  }}>
                    Your photographer or event owner can share the invite code after the event
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Phase 2: Discover - Photo Grid + Scan ── */
        <div id="phase-discover" style={{ scrollMarginTop: '120px' }}>
          {/* Header */}
          <div
            ref={headerSectionRef}
            onMouseMove={handleMouseMove(headerSectionRef, setHeaderMousePos)}
            onMouseLeave={() => setHeaderMousePos(null)}
            style={{
              background: 'linear-gradient(to right, #052047, #052047, #103E83)',
              padding: isMobile ? '100px 20px 40px' : '120px 40px 50px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Back-to-Connect button - top-left corner */}
            <button
              type="button"
              onClick={() => goToPhase('phase-connect')}
              aria-label="Back to invite code"
              style={{
                position: 'absolute',
                top: isMobile ? 14 : 20,
                left: isMobile ? 14 : 24,
                zIndex: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.16)',
                backdropFilter: 'blur(10px)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <i className="bi bi-arrow-left" style={{ fontSize: 13 }} />
              Back to Connect
            </button>
            {/* Interactive DotGrid - matches the footer's pattern */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
              <DotGrid
                dotSize={2}
                gap={15}
                baseColor="#1E3A78"
                activeColor="#3B82F6"
                proximity={120}
                shockRadius={180}
                shockStrength={4}
                resistance={750}
                returnDuration={1.4}
              />
            </div>

            <div style={{
              position: 'relative',
              zIndex: 2,
              background: 'linear-gradient(135deg, rgba(5, 32, 71, 0.95) 0%, rgba(16, 62, 131, 0.92) 100%)',
              borderRadius: '28px',
              padding: isMobile ? '32px 24px' : '40px 48px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              maxWidth: '700px',
              margin: '0 auto',
            }}>
            <h2 style={{
              fontSize: isMobile ? '28px' : '59px',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '8px',
              fontFamily: "'Pragati Narrow', sans-serif",
            }}>
              Event Gallery
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '16px',
              marginBottom: '24px',
            }}>
              {displayedPhotos.length} photo{displayedPhotos.length !== 1 ? 's' : ''}{isFiltered ? ' matched' : ' available'}
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => setIsScanModalOpen(true)}
                className="scan-btn"
                style={{
                  padding: '14px 28px',
                  borderRadius: '50px',
                  background: '#FF6B6B',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#ff5252'; (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#FF6B6B'; (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
                Find Your Photo Using Facial Recognition Scan
              </button>

              {isFiltered && allPhotos.length > 0 && (
                <button
                  onClick={handleShowAll}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '50px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                >
                  Show All Photos
                </button>
              )}

              <button
                onClick={() => { setUnlockError(null); setUnlockOpen(true); }}
                style={{
                  padding: '14px 28px',
                  borderRadius: '50px',
                  background: 'rgba(3,150,156,0.15)',
                  color: '#7be0e5',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '1px solid rgba(3,150,156,0.45)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(3,150,156,0.28)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(3,150,156,0.15)'; }}
                title="Already paid? Unlock with the code we emailed you, or with your email."
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0"/></svg>
                Already paid? Unlock
              </button>
            </div>
            </div>
          </div>

          {/* Photo Grid - also acts as the checkout anchor when items are selected */}
          <div
            id="phase-checkout"
            ref={gridSectionRef}
            onMouseMove={handleMouseMove(gridSectionRef, setGridMousePos)}
            onMouseLeave={() => setGridMousePos(null)}
            style={{
              padding: isMobile ? '24px 16px' : '40px',
              background: 'linear-gradient(to right, #052047, #052047, #103E83)',
              minHeight: '400px',
              position: 'relative',
              overflow: 'hidden',
              scrollMarginTop: '120px',
            }}
          >
            {/* Interactive DotGrid - matches the footer's pattern */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
              <DotGrid
                dotSize={2}
                gap={15}
                baseColor="#1E3A78"
                activeColor="#3B82F6"
                proximity={120}
                shockRadius={180}
                shockStrength={4}
                resistance={750}
                returnDuration={1.4}
              />
            </div>

          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? '12px' : '20px',
            }}>
              {displayedPhotos.map((photo) => {
                const isPaid = (photo.price ?? 0) > 0;
                const isPurchased = !!photo.isPurchased;
                // Any photo the user can act on (download or buy) is now
                // selectable - that unlocks the unified "cart" UX in the
                // bottom action bar. The downstream actions still filter
                // by type: handleBulkBuy only sends paid-unpurchased, and
                // handleBulkDownload only sends free/purchased.
                const isFree = !isPaid;
                const isSelectable = isPurchased || isFree || (isPaid && !!photo.albumId);
                const isSelected = selectedPhotoIds.has(photo.id);
                // Visual identity for the checkbox: free / already-purchased
                // photos show a brand-pink check (these go to the download
                // path), unpurchased-paid photos show a teal check (these go
                // to the buy path - teal is the existing platform purchase
                // colour, preserved per request).
                const selectAccent = (isPurchased || isFree) ? '#F20C8F' : '#03969c';
                const currencyLabel = photo.currencyAbbreviation || albumCurrencySymbol || 'RF';
                const btnLabel = isPurchased
                  ? 'Download'
                  : isPaid
                    ? `Buy (${currencyLabel} ${photo.price?.toLocaleString()})`
                    : 'Download';
                return (
                <div
                  key={photo.id}
                  className="photo-card"
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? `0 0 0 3px ${selectAccent}, 0 4px 20px rgba(0,0,0,0.08)`
                      : '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    background: '#ffffff',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={stampPreviewUrl(photo.url, viewerId, { buyerId, refid: purchaseRefid })}
                      alt={photo.alt}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease, filter 0.1s linear',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        pointerEvents: 'none',
                        filter: isOccluded ? 'brightness(0)' : undefined,
                      }}
                      loading="lazy"
                    />
                    {/* Repeating tile watermark - Shutterstock/Getty style.
                        Small "AMORIA" text dotted diagonally across the whole
                        image at low opacity. Visible enough to mark the photo
                        as a preview without obscuring the subject. */}
                    {isPaid && !isPurchased && (
                      <div
                        aria-hidden
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          backgroundImage:
                            'url("data:image/svg+xml;utf8,' +
                            encodeURIComponent(
                              '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="80" viewBox="0 0 140 80">' +
                                '<text x="70" y="46" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="rgba(255,255,255,0.55)" text-anchor="middle" transform="rotate(-24 70 42)">CONNEKYT</text>' +
                              '</svg>',
                            ) +
                            '")',
                          backgroundRepeat: 'repeat',
                          mixBlendMode: 'overlay',
                        }}
                      />
                    )}
                  </div>
                  {/* Selection checkbox - appears on every actionable photo
                      so the bottom action bar can build a unified cart of
                      free downloads + paid buys. Accent color reflects the
                      intent (pink = download, teal = buy). */}
                  {isSelectable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePhotoSelected(photo.id); }}
                      aria-label={isSelected ? 'Remove from cart' : 'Add to cart'}
                      title={isSelected ? 'Remove from cart' : 'Add to cart'}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isSelected ? selectAccent : 'rgba(255,255,255,0.95)',
                        border: isSelected ? `2px solid ${selectAccent}` : '2px solid rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3,
                        padding: 0,
                        boxShadow: isSelected
                          ? `0 4px 12px -2px ${selectAccent === '#F20C8F' ? 'rgba(242,12,143,0.42)' : 'rgba(3,150,156,0.42)'}`
                          : '0 2px 6px rgba(0,0,0,0.18)',
                        transition: 'transform 0.15s, background 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {isSelected ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <i className="bi bi-plus" style={{ fontSize: '16px', color: selectAccent, fontWeight: 700, lineHeight: 1 }} />
                      )}
                    </button>
                  )}
                  {/* Price / Purchased badge */}
                  {isPaid && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '5px 10px',
                      borderRadius: '50px',
                      background: isPurchased ? '#16a34a' : 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      zIndex: 2,
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}>
                      {isPurchased ? '✓ PURCHASED' : `${currencyLabel} ${photo.price?.toLocaleString()}`}
                    </div>
                  )}
                  {/* Download / Buy button */}
                  <button
                    className="photo-download-btn"
                    onClick={(e) => { e.stopPropagation(); handleDownloadClick(photo); }}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 12px',
                      borderRadius: '50px',
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      zIndex: 2,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#03969c'; e.currentTarget.style.borderColor = '#03969c'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {btnLabel}
                  </button>
                </div>
                );
              })}
            </div>

            {displayedPhotos.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'rgba(255,255,255,0.5)',
              }}>
                <p style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>No photos found</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Try scanning again or show all photos</p>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* ── Image Viewer Modal ── */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          {/* Top bar: close + download */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              zIndex: 2001,
            }}
          >
            {/* When the previewed photo belongs to the current free album,
                the lightbox is preview-only — the user must add it to the
                cart and route through handleFreeCappedDownload so the cap
                and the pay-for-extras flow stay enforced. */}
            {freeAlbumPhotos.some(p => p.id === selectedPhoto.id) ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 16px',
                borderRadius: '50px',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.78)',
                fontSize: 12.5,
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.18)',
              }}>
                <i className="bi bi-info-circle" />
                Use the + button to add this photo, then download from the cart bar
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); handleDownloadClick(selectedPhoto); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '10px 20px',
                  borderRadius: '50px',
                  background: '#03969c',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#026d72'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#03969c'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {selectedPhoto.isPurchased
                  ? 'Download'
                  : (selectedPhoto.price ?? 0) > 0
                    ? `Buy (${selectedPhoto.currencyAbbreviation || albumCurrencySymbol || 'RF'} ${selectedPhoto.price?.toLocaleString()})`
                    : 'Download'}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#ffffff',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              &times;
            </button>
          </div>
          {(() => {
            const isLocked = (selectedPhoto.price ?? 0) > 0 && !selectedPhoto.isPurchased;
            return (
              <div
                className="photo-preview-modal"
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
                style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
              >
                <img
                  src={stampPreviewUrl(selectedPhoto.url, viewerId, { buyerId, refid: purchaseRefid })}
                  alt={selectedPhoto.alt}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    display: 'block',
                    maxWidth: '90vw',
                    maxHeight: '85vh',
                    objectFit: 'contain',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    pointerEvents: 'none',
                    filter: isOccluded ? 'brightness(0)' : undefined,
                    transition: 'filter 0.1s linear',
                  }}
                />
                {/* Transparent overlay - absorbs right-click / drag / selection
                    attempts that slip past the handlers above */}
                <div
                  aria-hidden
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'transparent',
                    userSelect: 'none',
                  }}
                />
                {isLocked && (
                  <>
                    {/* Four 45° blurred diagonal bands - real image shows between them */}
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        aria-hidden
                        style={{
                          position: 'absolute',
                          top: `${-5 + i * 32}%`,
                          left: '-50%',
                          width: '200%',
                          height: '60px',
                          transform: 'rotate(-45deg)',
                          transformOrigin: 'center',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          background: 'rgba(255,255,255,0.18)',
                          borderTop: '1px solid rgba(255,255,255,0.35)',
                          borderBottom: '1px solid rgba(255,255,255,0.35)',
                          pointerEvents: 'none',
                        }}
                      />
                    ))}
                    {/* Corner lock label */}
                    <div
                      aria-hidden
                      style={{
                        position: 'absolute', bottom: '12px', left: '12px',
                        padding: '6px 12px', borderRadius: '50px',
                        background: 'rgba(0,0,0,0.7)', color: '#fff',
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                        border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
                        pointerEvents: 'none',
                      }}
                    >
                      🔒 PREVIEW · BUY TO UNLOCK
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Download Payment Modal ── */}
      {showDownloadModal && downloadTarget && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(4px)',
            padding: '16px',
            overflowY: 'auto',
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) resetDownloadModal(); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#18181b',
              borderRadius: '20px',
              padding: 'clamp(20px, 5vw, 32px)',
              paddingTop: 'clamp(40px, 8vw, 50px)',
              maxWidth: '450px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              margin: 'auto',
            }}
          >
            {/* Close */}
            <button
              onClick={resetDownloadModal}
              style={{
                position: 'absolute',
                top: 'clamp(12px, 3vw, 16px)',
                right: 'clamp(12px, 3vw, 16px)',
                background: 'transparent',
                border: 'none',
                color: '#adadb8',
                cursor: 'pointer',
                fontSize: 'clamp(18px, 4vw, 20px)',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#efeff1'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#adadb8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              ✕
            </button>

            {/* Title */}
            <h2 style={{
              fontSize: 'clamp(18px, 5vw, 22px)',
              fontWeight: 600,
              color: '#efeff1',
              marginBottom: '6px',
              marginTop: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#03969c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Photo
            </h2>
            <p style={{ fontSize: '13px', color: '#adadb8', marginBottom: '24px', lineHeight: 1.5 }}>
              Complete your payment to download this photo
            </p>

            {/* Price display */}
            <div style={{
              padding: '14px 16px',
              backgroundColor: 'rgba(3,150,156,0.12)',
              border: '1px solid rgba(3,150,156,0.3)',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '13px', color: '#adadb8', fontWeight: 500 }}>Photo price</span>
              <span style={{ fontSize: '18px', color: '#03969c', fontWeight: 700 }}>
                {albumCurrencySymbol || 'RF'} {(downloadTarget.price ?? 0).toLocaleString()}
              </span>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#efeff1', marginBottom: '12px' }}>
                Select Payment Method
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setDlPaymentMethod(method.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: dlPaymentMethod === method.id ? 'rgba(3,150,156,0.15)' : '#27272a',
                      border: `2px solid ${dlPaymentMethod === method.id ? '#03969c' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { if (dlPaymentMethod !== method.id) e.currentTarget.style.borderColor = 'rgba(3,150,156,0.5)'; }}
                    onMouseLeave={(e) => { if (dlPaymentMethod !== method.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={method.image} alt={method.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ color: '#efeff1', fontSize: '14px', fontWeight: 500 }}>{method.name}</span>
                    {dlPaymentMethod === method.id && (
                      <span style={{ marginLeft: 'auto', color: '#03969c', fontSize: '20px' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Money phone */}
            {(dlPaymentMethod === 'mtn' || dlPaymentMethod === 'airtel') && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#efeff1', marginBottom: '8px' }}>
                  Your Phone Number *
                </label>
                <input
                  type="tel"
                  value={dlPhone}
                  onChange={(e) => setDlPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder={dlPaymentMethod === 'mtn' ? 'e.g., 0781234567' : 'e.g., 0721234567'}
                  style={{
                    width: '100%', padding: '12px 16px',
                    backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: '#efeff1', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <p style={{ fontSize: '11px', color: '#71717a', marginTop: '6px', marginBottom: 0 }}>
                  You will receive a payment confirmation SMS on this number
                </p>
              </div>
            )}

            {/* Card details */}
            {dlPaymentMethod === 'card' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#efeff1', marginBottom: '8px' }}>Card Holder Name *</label>
                  <input type="text" value={dlCardHolderName} onChange={(e) => setDlCardHolderName(e.target.value)} placeholder="Name on card"
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#efeff1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#efeff1', marginBottom: '8px' }}>Card Number *</label>
                  <input type="text" value={dlCardNumber} onChange={(e) => setDlCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="1234 5678 9012 3456"
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#efeff1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', letterSpacing: '2px' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#efeff1', marginBottom: '8px' }}>Expiry Date *</label>
                    <input type="text" value={dlCardExpiry}
                      onChange={(e) => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2); setDlCardExpiry(v); }}
                      placeholder="MM/YY" maxLength={5}
                      style={{ width: '100%', padding: '12px 16px', backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#efeff1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#efeff1', marginBottom: '8px' }}>CVV *</label>
                    <input type="password" value={dlCardCvv} onChange={(e) => setDlCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="***" maxLength={4}
                      style={{ width: '100%', padding: '12px 16px', backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#efeff1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {dlError && (
              <div style={{ padding: '10px 14px', marginBottom: '12px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: '10px', color: '#EF4444', fontSize: '13px' }}>
                {dlError}
              </div>
            )}

            {/* Success */}
            {dlSuccess && (
              <div style={{ padding: '10px 14px', marginBottom: '12px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '10px', color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ Payment successful! Starting download…
              </div>
            )}

            {/* Pay & Download button */}
            <button
              onClick={handleDownloadPayment}
              disabled={!isDlPaymentValid() || dlLoading || dlSuccess}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: (!isDlPaymentValid() || dlLoading || dlSuccess) ? '#3f3f46' : 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                border: 'none',
                borderRadius: '12px',
                color: (!isDlPaymentValid() || dlLoading || dlSuccess) ? '#71717a' : '#fff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: (!isDlPaymentValid() || dlLoading || dlSuccess) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: (!isDlPaymentValid() || dlLoading || dlSuccess) ? 'none' : '0 4px 15px rgba(3,150,156,0.3)',
              }}
              onMouseEnter={(e) => { if (isDlPaymentValid() && !dlLoading && !dlSuccess) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(3,150,156,0.4)'; } }}
              onMouseLeave={(e) => { if (isDlPaymentValid() && !dlLoading && !dlSuccess) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(3,150,156,0.3)'; } }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {dlLoading ? 'Processing...' : dlSuccess ? 'Downloading…' : `Pay & Download (${albumCurrencySymbol || 'RF'} ${(downloadTarget.price ?? 0).toLocaleString()})`}
            </button>
          </div>
        </div>
      )}

      {/* ── Face Scan Modal ── */}
      {isScanModalOpen && (
        <div
          onClick={() => { if (!isScanning) resetScanModal(); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: isMobile ? '28px 20px' : '36px 32px',
              maxWidth: '500px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Close button */}
            {!isScanning && !isCameraActive && (
              <button
                onClick={resetScanModal}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#e5e7eb'; }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#f3f4f6'; }}
              >
                &times;
              </button>
            )}

            <h3 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              Facial Recognition Scan
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '28px',
              lineHeight: 1.5,
            }}>
              Upload or take a selfie to find your photos in this event gallery
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
              /* Scanning state - blurred photo with overlay */
              <div style={{
                textAlign: 'center',
                padding: '20px 0',
              }}>
                <div style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 24px',
                  position: 'relative',
                  border: '4px solid #FF6B6B',
                  boxShadow: '0 0 30px rgba(255,107,107,0.4)',
                }}>
                  {uploadedPreview && (
                    <img
                      src={uploadedPreview}
                      alt="Scanning face"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'blur(4px) brightness(0.7)',
                      }}
                    />
                  )}
                  {/* Scan line animation overlay */}
                  <div className="scan-line" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent 0%, #FF6B6B 30%, #ffffff 50%, #FF6B6B 70%, transparent 100%)',
                    boxShadow: '0 0 12px rgba(255,107,107,0.8), 0 0 30px rgba(255,107,107,0.4)',
                    zIndex: 2,
                  }} />
                  {/* Pulsing border ring */}
                  <div className="scan-pulse-ring" style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    border: '3px solid rgba(255,107,107,0.5)',
                    zIndex: 1,
                  }} />
                </div>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1f2937',
                }}>Scanning...</p>
                <p style={{
                  fontSize: '13px',
                  color: '#9ca3af',
                  marginTop: '8px',
                }}>Matching your face across event photos</p>
              </div>
            ) : isCameraActive ? (
              /* Live camera view */
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 20px',
                  border: '4px solid #FF6B6B',
                  boxShadow: '0 4px 20px rgba(255,107,107,0.3)',
                }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)',
                    }}
                  />
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                  Position your face in the circle
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={stopCamera}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      fontSize: '15px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#FF6B6B',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#ff5252'; }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#FF6B6B'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="4"/>
                    </svg>
                    Capture
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Preview of captured/uploaded photo */}
                {uploadedPreview ? (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '24px',
                  }}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '3px solid #FF6B6B',
                      boxShadow: '0 4px 12px rgba(255,107,107,0.3)',
                      margin: '0 auto 12px',
                    }}>
                      <img
                        src={uploadedPreview}
                        alt="Captured face"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <p style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>Photo ready for scan</p>
                    <button
                      onClick={() => { setUploadedFile(null); setUploadedPreview(null); setScanError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 16px',
                        borderRadius: '8px',
                        background: 'transparent',
                        color: '#6b7280',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: '1px solid #d1d5db',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Change photo
                    </button>
                  </div>
                ) : (
                  /* Two option buttons: Camera & Upload */
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                  }}>
                    {/* Take Selfie button */}
                    <div
                      onClick={startCamera}
                      style={{
                        flex: 1,
                        border: '2px dashed #d1d5db',
                        borderRadius: '16px',
                        padding: '28px 12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FF6B6B'; e.currentTarget.style.background = 'rgba(255,107,107,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(255,107,107,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Take Selfie</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Use camera</p>
                    </div>

                    {/* Upload Photo button */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1,
                        border: '2px dashed #d1d5db',
                        borderRadius: '16px',
                        padding: '28px 12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.background = 'rgba(8,58,133,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(8,58,133,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Upload Photo</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>From gallery</p>
                    </div>
                  </div>
                )}

                {/* Start Scan button */}
                <button
                  onClick={handleStartScan}
                  disabled={!uploadedFile}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: uploadedFile ? '#FF6B6B' : '#e5e7eb',
                    color: uploadedFile ? '#ffffff' : '#9ca3af',
                    fontSize: '16px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: uploadedFile ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => { if (uploadedFile) (e.target as HTMLButtonElement).style.background = '#ff5252'; }}
                  onMouseLeave={(e) => { if (uploadedFile) (e.target as HTMLButtonElement).style.background = '#FF6B6B'; }}
                >
                  Start Scan
                </button>

                {scanError && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px',
                    color: '#ef4444',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}>
                    {scanError}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Embedded Styles ── */}
      <style>{`
        @keyframes scanLineMove {
          0% { top: 0; }
          100% { top: calc(100% - 3px); }
        }
        @keyframes scanPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        .scan-line {
          animation: scanLineMove 1.5s ease-in-out infinite alternate;
        }
        .scan-pulse-ring {
          animation: scanPulse 1.2s ease-in-out infinite;
        }
        .photo-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.15) !important;
        }
        .photo-card:hover img {
          transform: scale(1.08);
        }
        .scan-btn:hover {
          box-shadow: 0 8px 24px rgba(255,107,107,0.35);
        }
      `}</style>

      {/* ── Cart Action Bar - unified multi-select for downloads + buys ── */}
      {(() => {
        const selectedCount = selectedPhotoIds.size;
        if (selectedCount === 0 && !purchaseNotice) return null;
        const selectedItems = displayedPhotos.filter(p => selectedPhotoIds.has(p.id));
        // Split the selection by intent. Paid-unpurchased flow through the
        // existing handleBulkBuy → XentriPay modal; free or already-purchased
        // photos flow through handleBulkDownload, which reuses the same
        // single-photo download path. Both filters mirror what those
        // handlers do internally, so the action bar can't drift out of sync
        // with the actual backend selection logic.
        const paidItems = selectedItems.filter(p => (p.price ?? 0) > 0 && !p.isPurchased);
        const downloadItems = selectedItems.filter(p => !!p.isPurchased || (p.price ?? 0) === 0);
        const total = paidItems.reduce((s, p) => s + (p.price ?? 0), 0);
        const curLabel = paidItems[0]?.currencyAbbreviation || albumCurrencySymbol || 'RF';
        return (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(15,15,20,0.97)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: isMobile ? '14px 16px' : '16px 24px',
            zIndex: 1500,
            boxShadow: '0 -12px 32px rgba(0,0,0,0.40)',
          }}>
            {/* Brand top stripe */}
            <span aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
            }} />
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {purchaseNotice && (
                <div style={{
                  color: '#fff', fontSize: '13px', fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px',
                  background: 'rgba(242,12,143,0.14)',
                  border: '1px solid rgba(242,12,143,0.32)',
                  borderRadius: 8,
                  alignSelf: 'flex-start',
                }}>
                  <i className="bi bi-info-circle-fill" style={{ fontSize: 13, color: '#F20C8F' }} />
                  {purchaseNotice}
                </div>
              )}
              {selectedCount > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: '12px',
              }}>
                  {/* Cart summary with breakdown chip */}
                  <div style={{ flex: isMobile ? 'initial' : 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '6px 12px 6px 8px',
                      borderRadius: 999,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '-0.005em',
                      boxShadow: '0 6px 14px -4px rgba(242,12,143,0.36)',
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.22)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className="bi bi-bag-check-fill" style={{ fontSize: 11 }} />
                      </span>
                      {selectedCount} in cart
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12.5, fontWeight: 500 }}>
                      {downloadItems.length > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
                          <i className="bi bi-download" style={{ fontSize: 11, color: '#F20C8F' }} />
                          <span><strong style={{ color: '#fff' }}>{downloadItems.length}</strong> to download</span>
                        </span>
                      )}
                      {paidItems.length > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <i className="bi bi-cart-fill" style={{ fontSize: 11, color: '#03969c' }} />
                          <span><strong style={{ color: '#fff' }}>{paidItems.length}</strong> to buy · <strong style={{ color: '#fff' }}>{curLabel} {total.toLocaleString()}</strong></span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPhotoIds(new Set())}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 11,
                      background: 'transparent',
                      border: '1.5px solid rgba(255,255,255,0.20)',
                      color: 'rgba(255,255,255,0.82)',
                      fontSize: 13.5,
                      fontWeight: 700,
                      letterSpacing: '-0.005em',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, color 0.15s',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.color = '#F20C8F'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; }}
                  >
                    <i className="bi bi-x-circle" style={{ fontSize: 13 }} />
                    Clear
                  </button>
                  {downloadItems.length > 0 && (
                    <button
                      onClick={handleBulkDownload}
                      style={{
                        padding: '11px 18px',
                        borderRadius: 11,
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 13.5,
                        fontWeight: 700,
                        letterSpacing: '-0.005em',
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        boxShadow: '0 8px 22px -6px rgba(242,12,143,0.45)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 22px -6px rgba(242,12,143,0.45)'; }}
                    >
                      <i className="bi bi-download" style={{ fontSize: 13 }} />
                      Download {downloadItems.length}
                    </button>
                  )}
                  {paidItems.length > 0 && (
                    <button
                      onClick={handleBulkBuy}
                      style={{
                        padding: '11px 18px',
                        borderRadius: 11,
                        background: 'linear-gradient(135deg, #03969c 0%, #027a7f 100%)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 13.5,
                        fontWeight: 700,
                        letterSpacing: '-0.005em',
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        boxShadow: '0 8px 22px -6px rgba(3,150,156,0.45)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(3,150,156,0.55)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 22px -6px rgba(3,150,156,0.45)'; }}
                    >
                      <i className="bi bi-cart-fill" style={{ fontSize: 13 }} />
                      Buy {paidItems.length} · {curLabel} {total.toLocaleString()}
                    </button>
                  )}
              </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── XentriPay Modal for album purchase ── */}
      {pendingPurchase && (
        <XentriPayModal
          isOpen={xentriModalOpen}
          onClose={() => { setXentriModalOpen(false); setPendingPurchase(null); setPendingDonationAmount(0); }}
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

      {/* ── Your Details Modal (buyer identity) ── */}
      {detailsOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2500, padding: '16px',
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !detailsLoading) setDetailsOpen(false); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)',
              borderRadius: '20px',
              padding: 'clamp(24px, 5vw, 36px)',
              maxWidth: '460px', width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(3,150,156,0.15)',
              position: 'relative',
            }}
          >
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Your Details</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>
              We use these to send your receipt and to recognize you next time so you never pay twice for the same photo.
            </p>

            {(['name', 'email', 'phone'] as const).map((field) => {
              const labels = { name: 'Full Name', email: 'Email', phone: 'Phone Number' };
              const placeholders = { name: 'Jane Doe', email: 'jane@example.com', phone: '0791234567' };
              const value = field === 'name' ? detailsName : field === 'email' ? detailsEmail : detailsPhone;
              const setter = field === 'name' ? setDetailsName : field === 'email' ? setDetailsEmail : setDetailsPhone;
              return (
                <div key={field} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                    {labels[field]}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    value={value}
                    onChange={(e) => setter(field === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 12) : e.target.value)}
                    placeholder={placeholders[field]}
                    disabled={detailsLoading}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px', color: '#fff', fontSize: '14px',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#03969c'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  />
                </div>
              );
            })}

            {detailsError && (
              <div style={{
                padding: '10px 12px', marginBottom: '14px',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: '10px', color: '#ef4444', fontSize: '13px',
              }}>
                {detailsError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => { if (!detailsLoading) { setDetailsOpen(false); pendingBuyRef.current = null; } }}
                disabled={detailsLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#9ca3af', fontSize: '14px', fontWeight: 500, cursor: detailsLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDetailsSubmit}
                disabled={detailsLoading}
                style={{
                  flex: 2, padding: '12px', borderRadius: '12px',
                  background: detailsLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)',
                  border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600,
                  cursor: detailsLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {detailsLoading ? 'Verifying…' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unlock My Photos Modal (returning buyer) ── */}
      {unlockOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2500, padding: '16px',
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !unlockLoading) setUnlockOpen(false); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)',
              borderRadius: '20px',
              padding: 'clamp(24px, 5vw, 36px)',
              maxWidth: '460px', width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(3,150,156,0.15)',
            }}
          >
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
              Unlock My Photos
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 18px' }}>
              Already paid? Use the unlock code we emailed you, or the email you used at checkout.
            </p>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '6px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '16px' }}>
              {(['code', 'email'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setUnlockMode(mode); setUnlockError(null); }}
                  disabled={unlockLoading}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    background: unlockMode === mode ? 'rgba(3,150,156,0.25)' : 'transparent',
                    border: '1px solid ' + (unlockMode === mode ? 'rgba(3,150,156,0.5)' : 'transparent'),
                    color: unlockMode === mode ? '#7be0e5' : '#9ca3af',
                    fontSize: '13px', fontWeight: 600, cursor: unlockLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {mode === 'code' ? 'Use Code' : 'Use Email'}
                </button>
              ))}
            </div>

            {unlockMode === 'code' ? (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                  Unlock Code
                </label>
                <input
                  type="text"
                  value={unlockCodeInput}
                  onChange={(e) => setUnlockCodeInput(e.target.value.toUpperCase())}
                  placeholder="UNLK-XXXX-XXXX"
                  disabled={unlockLoading}
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px', color: '#fff', fontSize: '15px',
                    letterSpacing: '1px', fontFamily: 'monospace',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#03969c'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '6px 0 0' }}>
                  Unlocks only the photos in that purchase.
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={unlockEmailInput}
                  onChange={(e) => setUnlockEmailInput(e.target.value)}
                  placeholder="jane@example.com"
                  disabled={unlockLoading}
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px', color: '#fff', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#03969c'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '6px 0 0' }}>
                  Unlocks every photo this email has purchased in this album.
                </p>
              </div>
            )}

            {unlockError && (
              <div style={{
                padding: '10px 12px', marginBottom: '14px',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: '10px', color: '#ef4444', fontSize: '13px',
              }}>
                {unlockError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => { if (!unlockLoading) { setUnlockOpen(false); setUnlockError(null); } }}
                disabled={unlockLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#9ca3af', fontSize: '14px', fontWeight: 500,
                  cursor: unlockLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUnlockSubmit}
                disabled={unlockLoading}
                style={{
                  flex: 2, padding: '12px', borderRadius: '12px',
                  background: unlockLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)',
                  border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600,
                  cursor: unlockLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {unlockLoading ? 'Unlocking…' : 'Unlock & Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent unlock-code banner (after a fresh purchase) ── */}
      {recentUnlockCode && (
        <div
          style={{
            position: 'fixed',
            top: '90px', right: '20px', maxWidth: '340px',
            background: 'linear-gradient(145deg, #0b3d4a 0%, #0a2d3a 100%)',
            border: '1px solid rgba(3,150,156,0.45)',
            borderRadius: '14px',
            padding: '16px 18px',
            zIndex: 2400,
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            color: '#e5fafa',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Save your unlock code</div>
            <button
              onClick={() => setRecentUnlockCode(null)}
              style={{ background: 'transparent', border: 'none', color: '#7be0e5', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0 }}
              aria-label="Dismiss"
            >×</button>
          </div>
          <div
            style={{
              fontFamily: 'monospace', fontSize: '17px', fontWeight: 700,
              letterSpacing: '1.5px', color: '#fff',
              padding: '10px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              userSelect: 'all',
            }}
          >
            {recentUnlockCode}
          </div>
          <p style={{ fontSize: '12px', color: '#a8d4d8', margin: '8px 0 0' }}>
            We also emailed it to you. Use it (or your email) on this page anytime to re-download these photos.
          </p>
        </div>
      )}
    </div>
  );
};

export default FindMyPhotos;
