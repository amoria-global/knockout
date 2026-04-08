'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../components/navbar';
import XentriPayModal from '../components/XentriPayModal';
import { getAlbumByCode, type AlbumPhoto } from '@/lib/APIs/public/get-album/route';
import { uploadSelfieForRecognition, type MatchedPhoto } from '@/lib/APIs/customer/facial-recognition/route';
import { getCurrencies, type Currency } from '@/lib/APIs/public';
import { recordStreamingPayment } from '@/lib/APIs/payments/route';
import { recordAlbumPurchase } from '@/lib/APIs/payments/xentripay';
import { identifyAlbumBuyer } from '@/lib/APIs/public/identify-buyer/route';
import { getDeviceId } from '@/lib/fingerprint';
import { requestFreeAlbumAccess } from '@/lib/APIs/public/request-free-access/route';
import { verifyFreeAlbumAccess } from '@/lib/APIs/public/verify-free-access/route';
import { getFreeAlbum, type FreeAlbumPhoto } from '@/lib/APIs/public/get-free-album/route';
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
  const [purchaseRefid, setPurchaseRefid] = useState<string | null>(null);
  const [xentriModalOpen, setXentriModalOpen] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{
    albumId: string;
    photoIds: string[];
    amount: number;
    currencyId: string;
    currencyCode: string;
  } | null>(null);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);

  // Persistent buyer identity (one per album) — mirrors anonymous-viewer pattern
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
                  if (d.photos?.length) {
                    setFreeAlbumPhotos(d.photos);
                    if (d.title) setFreeAlbumTitle(d.title);
                    if (d.photographerName) setFreeAlbumPhotographer(d.photographerName);
                    if (d.expiresAt) setFreeAlbumExpiresAt(d.expiresAt);
                    setFreeAlbumFlow('verified');
                  } else {
                    // No photos in response — fall back to OTP screen
                    setFreeAlbumOtp(codeFromUrl);
                  }
                } else {
                  // Auto-verify failed — fall back to manual OTP entry
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
        const photos = (response.data.photos ?? []).map((p: AlbumPhoto) => ({
          id: p.id,
          url: p.url || p.thumbnailUrl || '',
          alt: p.alt || p.eventTitle || 'Event photo',
          price: p.price ?? perPhotoPrice,
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
        if (d.photos?.length) {
          // Photos included in verify response — render directly
          setFreeAlbumPhotos(d.photos);
          setFreeAlbumFlow('verified');
        } else {
          // Fallback: fetch photos separately
          const albumRes = await getFreeAlbum(albumId);
          if (albumRes.success && albumRes.data) {
            setFreeAlbumPhotos(albumRes.data.photos || []);
            if (albumRes.data.title) setFreeAlbumTitle(albumRes.data.title);
            if (albumRes.data.photographerName) setFreeAlbumPhotographer(albumRes.data.photographerName);
            if (albumRes.data.expiresAt) setFreeAlbumExpiresAt(albumRes.data.expiresAt);
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
    const url = photo.url || photo.thumbnailUrl;
    if (!url) return;
    await triggerPhotoDownload(url, `photo-${photo.id}.jpg`);
  };

  const handleFreeDownloadAll = async () => {
    for (const photo of freeAlbumPhotos) {
      await handleFreePhotoDownload(photo);
    }
  };

  // Load currencies for payment
  useEffect(() => {
    getCurrencies().then(res => {
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setCurrencies(res.data);
      }
    }).catch(() => {});
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
      const currencyId = albumCurrencyId || (currencies.length > 0 ? currencies[0].id : undefined);
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

  // Download an already-purchased photo via the backend download endpoint.
  // Prefers persistent buyerId over per-transaction refid.
  const downloadPurchasedPhoto = async (
    albumId: string,
    photoId: string,
    token: { refid?: string; buyerId?: string }
  ) => {
    const url = apiUrl(API_ENDPOINTS.PAYMENTS.ALBUM_PHOTO_DOWNLOAD(albumId, photoId, token));
    await triggerPhotoDownload(url, `photo-${photoId}.jpg`);
  };

  const togglePhotoSelected = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId); else next.add(photoId);
      return next;
    });
  };

  // Find shared album/currency context from selected paid photos (assumes one album per search)
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
    const ctx = getPurchaseContext(photos);
    if (!ctx) {
      setPurchaseNotice('Missing album info — please rescan your photos.');
      setTimeout(() => setPurchaseNotice(null), 4000);
      return;
    }
    const payable = photos.filter(p => !p.isPurchased);
    if (payable.length === 0) {
      setPurchaseNotice('You already own these photos.');
      setTimeout(() => setPurchaseNotice(null), 3000);
      return;
    }
    const amount = payable.reduce((sum, p) => sum + (p.price ?? 0), 0);
    setPendingPurchase({
      albumId: ctx.albumId,
      photoIds: payable.map(p => p.id),
      amount,
      currencyId: ctx.currencyId,
      currencyCode: ctx.currencyCode,
    });
    setXentriModalOpen(true);
  };

  const openPurchaseModal = (photos: PhotoItem[]) => {
    const ctx = getPurchaseContext(photos);
    if (!ctx) {
      setPurchaseNotice('Missing album info — please rescan your photos.');
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

  const handleSingleBuy = (photo: PhotoItem) => {
    openPurchaseModal([photo]);
  };

  const handlePurchaseSuccess = async (refid: string) => {
    if (!pendingPurchase) return;
    setPurchaseRefid(refid);
    setPurchaseNotice('Payment confirmed! Recording purchase…');

    // Record the purchase (credits photographer, sends receipt, marks photos purchased)
    try {
      await recordAlbumPurchase(refid, buyerId || undefined);
    } catch {
      // non-fatal — downloads below still work with buyerId/refid
    }

    // Mark photos as purchased in local state
    const boughtIds = new Set(pendingPurchase.photoIds);
    setDisplayedPhotos(prev => prev.map(p => boughtIds.has(p.id) ? { ...p, isPurchased: true } : p));
    setAllPhotos(prev => prev.map(p => boughtIds.has(p.id) ? { ...p, isPurchased: true } : p));
    setSelectedPhotoIds(new Set());

    // Trigger downloads — prefer persistent buyerId over per-transaction refid
    setPurchaseNotice('Downloading photos…');
    for (const photoId of pendingPurchase.photoIds) {
      // eslint-disable-next-line no-await-in-loop
      await downloadPurchasedPhoto(pendingPurchase.albumId, photoId, { refid, buyerId: buyerId || undefined });
    }

    setPurchaseNotice('Done!');
    setXentriModalOpen(false);
    setPendingPurchase(null);
    setTimeout(() => setPurchaseNotice(null), 3000);
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
      // All selected photos were already owned — just download them
      setPurchaseNotice('You already own these. Downloading…');
      (async () => {
        for (const photoId of alreadyIds) {
          // eslint-disable-next-line no-await-in-loop
          await downloadPurchasedPhoto(pendingPurchase.albumId, photoId, { buyerId: buyerId || undefined });
        }
        setPendingPurchase(null);
        setTimeout(() => setPurchaseNotice(null), 3000);
      })();
      return;
    }

    // Retry initiate with only the remaining photoIds
    setPurchaseNotice(`${alreadyIds.length} already owned — retrying payment for ${remaining.length} remaining…`);
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
    if (!ctx) { setDetailsError('Missing album info — please rescan.'); return; }

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

      // Resume the buy flow — filter out photos the buyer already owns
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
    // Free photo → direct download
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
      // Camera not available or permission denied — fall back silently
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#052047' }}>
      <Navbar />

      {freeAlbumFlow !== 'idle' ? (
        /* ── Free Album Flow ── */
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #052047 0%, #103E83 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '100px 20px 40px' : '80px 20px 40px',
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
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
              {/* Album header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  letterSpacing: '0.05em',
                }}>FREE</div>
                <h2 style={{ color: '#fff', fontSize: isMobile ? '24px' : '32px', fontWeight: 700, marginBottom: '6px' }}>{freeAlbumTitle}</h2>
                {freeAlbumPhotographer && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '8px' }}>by {freeAlbumPhotographer}</p>}
                {freeAlbumExpiresAt && (() => {
                  const daysLeft = Math.ceil((new Date(freeAlbumExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  if (daysLeft <= 0) return <p style={{ color: '#ef4444', fontSize: '13px' }}>This album has expired and is no longer available</p>;
                  if (daysLeft <= 7) return <p style={{ color: '#f59e0b', fontSize: '13px' }}>⚠ Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>;
                  return null;
                })()}
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '8px' }}>{freeAlbumPhotos.length} photo{freeAlbumPhotos.length !== 1 ? 's' : ''}</p>
                {freeAlbumPhotos.length > 1 && (
                  <button
                    onClick={handleFreeDownloadAll}
                    style={{
                      marginTop: '16px',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                  >
                    <i className="bi bi-download" style={{ marginRight: '6px' }}></i>
                    Download All
                  </button>
                )}
              </div>

              {/* Photo grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px',
              }}>
                {freeAlbumPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      aspectRatio: '1',
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onClick={() => setSelectedPhoto({
                      id: photo.id,
                      url: photo.url || photo.thumbnailUrl,
                      alt: photo.caption || 'Free album photo',
                    })}
                  >
                    <img
                      src={photo.url || photo.thumbnailUrl}
                      alt={photo.caption || 'Free album photo'}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* FREE badge */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.85)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                    }}>FREE</div>
                    {/* Download button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFreePhotoDownload(photo); }}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(0,0,0,0.5)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <i className="bi bi-download" style={{ fontSize: '14px' }}></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !isCodeSubmitted ? (
        /* ── Phase 1: Hero + Invite Code ── */
        <div
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
          }}
        >
          {/* Dotted pattern background - base layer (dim) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
            opacity: 0.2,
            zIndex: 0,
            pointerEvents: 'none',
          }} />
          {/* Spotlight layer - reveals brighter dots where cursor is */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.85) 1.5px, transparent 0.5px)',
            backgroundSize: '10px 10px',
            opacity: heroMousePos ? 0.5 : 0,
            zIndex: 1,
            pointerEvents: 'none',
            maskImage: heroMousePos
              ? `radial-gradient(circle 60px at ${heroMousePos.x}px ${heroMousePos.y}px, black 0%, black 50%, transparent 80%)`
              : 'none',
            WebkitMaskImage: heroMousePos
              ? `radial-gradient(circle 60px at ${heroMousePos.x}px ${heroMousePos.y}px, black 0%, black 50%, transparent 80%)`
              : 'none',
            transition: 'opacity 0s ease',
          }} />

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
        /* ── Phase 2: Photo Grid + Scan ── */
        <div>
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
            {/* Dotted pattern background - base layer (dim) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
              backgroundSize: '10px 10px',
              opacity: 0.3,
              zIndex: 0,
              pointerEvents: 'none',
            }} />
            {/* Spotlight layer - reveals brighter dots where cursor is */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.85) 1.5px, transparent 0.5px)',
              backgroundSize: '10px 10px',
              opacity: headerMousePos ? 0.7 : 0,
              zIndex: 1,
              pointerEvents: 'none',
              maskImage: headerMousePos
                ? `radial-gradient(circle 80px at ${headerMousePos.x}px ${headerMousePos.y}px, black 0%, black 50%, transparent 80%)`
                : 'none',
              WebkitMaskImage: headerMousePos
                ? `radial-gradient(circle 80px at ${headerMousePos.x}px ${headerMousePos.y}px, black 0%, black 50%, transparent 80%)`
                : 'none',
              transition: 'opacity 0s ease',
            }} />

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
            </div>
            </div>
          </div>

          {/* Photo Grid */}
          <div
            ref={gridSectionRef}
            onMouseMove={handleMouseMove(gridSectionRef, setGridMousePos)}
            onMouseLeave={() => setGridMousePos(null)}
            style={{
              padding: isMobile ? '24px 16px' : '40px',
              background: 'linear-gradient(to right, #052047, #052047, #103E83)',
              minHeight: '400px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Dotted pattern background - base layer (dim) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
              backgroundSize: '10px 10px',
              opacity: 0.3,
              zIndex: 0,
              pointerEvents: 'none',
            }} />
            {/* Spotlight layer - reveals brighter dots where cursor is */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.85) 1.5px, transparent 0.5px)',
              backgroundSize: '10px 10px',
              opacity: gridMousePos ? 0.7 : 0,
              zIndex: 1,
              pointerEvents: 'none',
              maskImage: gridMousePos
                ? `radial-gradient(circle 80px at ${gridMousePos.x}px ${gridMousePos.y}px, black 0%, black 50%, transparent 80%)`
                : 'none',
              WebkitMaskImage: gridMousePos
                ? `radial-gradient(circle 80px at ${gridMousePos.x}px ${gridMousePos.y}px, black 0%, black 50%, transparent 80%)`
                : 'none',
              transition: 'opacity 0s ease',
            }} />

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
                const isSelectable = isPaid && !isPurchased && !!photo.albumId;
                const isSelected = selectedPhotoIds.has(photo.id);
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
                    boxShadow: isSelected ? '0 0 0 3px #03969c, 0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    background: '#ffffff',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{ aspectRatio: '4/3', overflow: 'hidden' }}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                      loading="lazy"
                    />
                  </div>
                  {/* Selection checkbox (only for purchasable paid photos) */}
                  {isSelectable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePhotoSelected(photo.id); }}
                      aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: isSelected ? '#03969c' : 'rgba(255,255,255,0.9)',
                        border: isSelected ? '2px solid #03969c' : '2px solid rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3,
                        padding: 0,
                      }}
                    >
                      {isSelected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
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
                onClick={(e) => e.stopPropagation()}
                onContextMenu={isLocked ? (e) => e.preventDefault() : undefined}
                style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
              >
                <img
                  src={selectedPhoto.url.replace('w=600&h=400', 'w=1200&h=800')}
                  alt={selectedPhoto.alt}
                  draggable={!isLocked}
                  style={{
                    display: 'block',
                    maxWidth: '90vw',
                    maxHeight: '85vh',
                    objectFit: 'contain',
                    userSelect: isLocked ? 'none' : 'auto',
                    pointerEvents: isLocked ? 'none' : 'auto',
                  }}
                />
                {isLocked && (
                  <>
                    {/* Four 45° blurred diagonal bands — real image shows between them */}
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
                      🔒 PREVIEW — BUY TO UNLOCK
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
              /* Scanning state — blurred photo with overlay */
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

      {/* ── Multi-select Purchase Action Bar ── */}
      {(() => {
        const selectedCount = selectedPhotoIds.size;
        if (selectedCount === 0 && !purchaseNotice) return null;
        const selectedItems = displayedPhotos.filter(p => selectedPhotoIds.has(p.id));
        const total = selectedItems.reduce((s, p) => s + (p.price ?? 0), 0);
        const curLabel = selectedItems[0]?.currencyAbbreviation || albumCurrencySymbol || 'RF';
        return (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(20,20,24,0.97)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: isMobile ? '12px 16px' : '16px 24px',
            zIndex: 1500,
            boxShadow: '0 -8px 24px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {purchaseNotice && (
                <div style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
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
                  <div style={{ color: '#fff', fontSize: '14px', flex: isMobile ? 'initial' : 1 }}>
                    <strong>{selectedCount}</strong> photo{selectedCount > 1 ? 's' : ''} selected · Total: <strong>{curLabel} {total.toLocaleString()}</strong>
                  </div>
                  <button
                    onClick={() => setSelectedPhotoIds(new Set())}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#adadb8',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleBulkBuy}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #03969c, #027a7f)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Buy {selectedCount} photo{selectedCount > 1 ? 's' : ''} ({curLabel} {total.toLocaleString()})
                  </button>
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
          onClose={() => { setXentriModalOpen(false); setPendingPurchase(null); }}
          onSuccess={handlePurchaseSuccess}
          onError={(e) => setPurchaseNotice(e)}
          amount={pendingPurchase.amount}
          currencyCode={pendingPurchase.currencyCode}
          currencyId={pendingPurchase.currencyId}
          paymentType="album_purchase"
          albumId={pendingPurchase.albumId}
          photoIds={pendingPurchase.photoIds}
          buyerId={buyerId || undefined}
          onAlreadyPurchased={handleAlreadyPurchased}
          title={`Buy ${pendingPurchase.photoIds.length} photo${pendingPurchase.photoIds.length > 1 ? 's' : ''}`}
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
    </div>
  );
};

export default FindMyPhotos;
