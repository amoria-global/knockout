'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../components/navbar';
import { getAlbumByCode, type AlbumPhoto, type AlbumPricing } from '@/lib/APIs/public/get-album/route';
import { uploadSelfieForRecognition, type MatchedPhoto } from '@/lib/APIs/customer/facial-recognition/route';
import { getCurrencies, type Currency } from '@/lib/APIs/public';
import XentriPayModal from '../components/XentriPayModal';

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
  const [allPhotos, setAllPhotos] = useState<{ id: string; url: string; alt: string; price?: number; eventId?: string }[]>([]);
  const [displayedPhotos, setDisplayedPhotos] = useState<{ id: string; url: string; alt: string; price?: number; eventId?: string }[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);

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
  const [selectedPhoto, setSelectedPhoto] = useState<{ id: string; url: string; alt: string; price?: number; eventId?: string } | null>(null);

  // Album metadata
  const [albumEventId, setAlbumEventId] = useState('');
  const [albumPhotographerName, setAlbumPhotographerName] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumPricing, setAlbumPricing] = useState<AlbumPricing | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Download payment modal
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<{ id: string; url: string; alt: string; price?: number; eventId?: string } | null>(null);
  // XentriPay modal state for photo purchases
  const [showXentriPayModal, setShowXentriPayModal] = useState(false);
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBulkPaying, setIsBulkPaying] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedPhotosArr = displayedPhotos.filter(p => selectedIds.has(p.id));
  const selectionTotal = selectedPhotosArr.reduce((sum, p) => sum + (p.price ?? albumPricing?.pricePerImage ?? 0), 0);
  const selectionAllFree = selectedPhotosArr.every(p => (p.price ?? albumPricing?.pricePerImage ?? 0) <= 0);

  const handleBulkDownload = () => {
    if (selectionAllFree) {
      selectedPhotosArr.forEach(p => triggerPhotoDownload(p.url, `photo-${p.id}.jpg`));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } else {
      setIsBulkPaying(true);
      setShowXentriPayModal(true);
    }
  };

  const handleBulkPaymentSuccess = () => {
    setShowXentriPayModal(false);
    setIsBulkPaying(false);
    selectedPhotosArr.forEach(p => triggerPhotoDownload(p.url, `photo-${p.id}.jpg`));
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  // Auto-fill invite code from URL param and load album (e.g. /find-my-photos?code=ABC123)
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && !inviteCode) {
      setInviteCode(codeFromUrl);
      setIsLoadingAlbum(true);
      getAlbumByCode(codeFromUrl).then(response => {
        if (response.success && response.data) {
          const albumData = response.data;
          setAlbumEventId(albumData.eventId || '');
          setAlbumPhotographerName(albumData.photographerName || '');
          setAlbumTitle(albumData.eventTitle || '');
          setAlbumPricing(albumData.pricing || null);
          const pricePerImg = albumData.pricing?.pricePerImage;
          const photos = (albumData.photos ?? []).map((p: AlbumPhoto) => ({
            id: p.id,
            url: p.imageUrl || p.url || p.thumbnailUrl || '',
            alt: p.alt || albumData.eventTitle || 'Event photo',
            price: pricePerImg,
          }));
          setAllPhotos(photos);
          setDisplayedPhotos(photos);
          setIsCodeSubmitted(true);
        } else {
          setInviteError(response.error || 'This invite code is invalid or has expired. Please check and try again.');
        }
      }).catch(() => {
        setInviteError('Unable to load album. Please check your internet connection and try again.');
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
      setInviteError('Please enter your album invite code.');
      return;
    }
    setInviteError('');
    setIsLoadingAlbum(true);
    try {
      const response = await getAlbumByCode(inviteCode.trim());
      if (response.success && response.data) {
        const albumData = response.data;
        setAlbumEventId(albumData.eventId || '');
        setAlbumPhotographerName(albumData.photographerName || '');
        setAlbumTitle(albumData.eventTitle || '');
        setAlbumPricing(albumData.pricing || null);
        const pricePerImg = albumData.pricing?.pricePerImage;
        const photos = (albumData.photos ?? []).map((p: AlbumPhoto) => ({
          id: p.id,
          url: p.imageUrl || p.url || p.thumbnailUrl || '',
          alt: p.alt || albumData.eventTitle || 'Event photo',
          price: pricePerImg,
        }));
        setAllPhotos(photos);
        setDisplayedPhotos(photos);
        setIsCodeSubmitted(true);
      } else {
        setInviteError(response.error || 'This invite code is invalid or has expired. Please check and try again.');
      }
    } catch {
      setInviteError('Unable to load album. Please check your internet connection and try again.');
    } finally {
      setIsLoadingAlbum(false);
    }
  };

  /**
   * Normalize an uploaded image to JPEG with max 1280px dimension.
   * This matches what the camera capture produces and avoids backend
   * issues with HEIC, PNG, large files, or missing EXIF orientation.
   */
  const normalizeImageFile = (file: File): Promise<{ file: File; preview: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1280;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const scale = MAX / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const preview = canvas.toDataURL('image/jpeg', 0.9);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Failed to convert image')); return; }
          const normalized = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
          resolve({ file: normalized, preview });
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(null);
    try {
      const { file: normalized, preview } = await normalizeImageFile(file);
      setUploadedFile(normalized);
      setUploadedPreview(preview);
    } catch {
      // Fallback: use original file if normalization fails
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartScan = async () => {
    if (!uploadedFile) return;

    setIsScanning(true);
    setScanError(null);
    try {
      const response = await uploadSelfieForRecognition(inviteCode.trim(), uploadedFile);
      if (response.success) {
        // response.data is the unwrapped array of matched photos
        const photos: MatchedPhoto[] = Array.isArray(response.data)
          ? (response.data as unknown as MatchedPhoto[])
          : (response.data as unknown as Record<string, unknown>)?.data
            ? ((response.data as unknown as Record<string, unknown>).data as MatchedPhoto[])
            : [];

        if (photos.length === 0) {
          setScanError('NO_MATCHES');
          return;
        }

        const mapped = photos.map((p: MatchedPhoto) => ({
          id: p.id,
          url: p.url || p.thumbnailUrl || '',
          alt: p.alt || p.eventTitle || 'Event photo',
          price: p.pricePerImage ?? albumPricing?.pricePerImage,
          eventId: p.eventId,
        }));
        setDisplayedPhotos(mapped);
        setIsFiltered(true);
        setIsCodeSubmitted(true);
        resetScanModal();
      } else {
        const err = response.error || '';
        if (err.includes('code') && err.includes('missing')) {
          setScanError('Please enter an event invite code to search for your photos.');
        } else if (err.toLowerCase().includes('no face detected')) {
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

  // Load currencies for payment
  useEffect(() => {
    getCurrencies().then(res => {
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setCurrencies(res.data);
      }
    }).catch(() => {});
  }, []);

  const resetDownloadModal = () => {
    setShowDownloadModal(false);
    setDownloadTarget(null);
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

  // Open XentriPay modal for photo purchase payment
  const handleDownloadPayment = async () => {
    if (!downloadTarget) return;
    setShowDownloadModal(false);
    setShowXentriPayModal(true);
  };

  // Handle XentriPay payment success for photo purchase
  const handlePhotoPaymentSuccess = () => {
    setShowXentriPayModal(false);
    if (downloadTarget) {
      triggerPhotoDownload(downloadTarget.url, `photo-${downloadTarget.id}.jpg`);
    }
    resetDownloadModal();
  };

  const handleDownloadClick = (photo: { id: string; url: string; alt: string; price?: number; eventId?: string }) => {
    const photoPrice = photo.price ?? albumPricing?.pricePerImage ?? 0;
    if (photoPrice <= 0) {
      // Free photo — allow direct download
      triggerPhotoDownload(photo.url, `photo-${photo.id}.jpg`);
      return;
    }
    // Paid photo — show payment modal
    setDownloadTarget(photo);
    setShowDownloadModal(true);
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
    <div style={{ minHeight: '100vh', backgroundColor: '#083A85' }}>
      <Navbar />

      {!isCodeSubmitted ? (
        /* ── Phase 1: Hero + Invite Code ── */
        <div
          ref={heroSectionRef}
          onMouseMove={handleMouseMove(heroSectionRef, setHeroMousePos)}
          onMouseLeave={() => setHeroMousePos(null)}
          style={{
            minHeight: 'auto',
            background: 'linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #083A85 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: isMobile ? '90px 20px 30px' : '80px 20px 30px',
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
            background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.95) 0%, rgba(10, 77, 163, 0.92) 100%)',
            borderRadius: '28px',
            padding: isMobile ? '32px 24px' : '30px 44px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            {/* Badge */}
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '50px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              marginBottom: '12px',
            }}>
              <span style={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>Face Recognition</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '8px',
              letterSpacing: '-0.02em',
              fontFamily: "'Pragati Narrow', sans-serif",
            }}>
              Find Your Photos
            </h1>

            <p style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.5,
              marginBottom: '16px',
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
              <div style={{ marginBottom: '10px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '2px',
                }}>
                  Facial Recognition Scan
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.4,
                  maxWidth: '420px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: '0',
                }}>
                  Take a selfie or upload your photo to find every photo you appear in.
                </p>
              </div>
            )}
            {isScanning ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 16px',
                  position: 'relative',
                  border: '3px solid rgba(255,255,255,0.6)',
                  boxShadow: '0 0 20px rgba(255,255,255,0.2)',
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
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 30%, #ffffff 50%, rgba(255,255,255,0.8) 70%, transparent 100%)',
                    boxShadow: '0 0 12px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.3)',
                    zIndex: 2,
                  }} />
                  <div className="scan-pulse-ring" style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.4)',
                    zIndex: 1,
                  }} />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>Scanning...</p>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginTop: '8px' }}>Matching your face across event photos</p>
              </div>
            ) : isCameraActive ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 14px',
                  border: '3px solid rgba(255,255,255,0.6)',
                  boxShadow: '0 4px 20px rgba(255,255,255,0.15)',
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
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '16px' }}>
                  Position your face in the circle
                </p>
                <div style={{ display: 'flex', gap: '12px', maxWidth: '340px', margin: '0 auto' }}>
                  <button
                    onClick={stopCamera}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'transparent',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 600,
                      border: '2px solid rgba(255,255,255,0.35)',
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
                      background: '#fff',
                      color: '#083A85',
                      fontSize: '15px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.target as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; (e.target as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'; }}
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
                  <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '3px solid rgba(255,255,255,0.6)',
                      boxShadow: '0 4px 12px rgba(255,255,255,0.15)',
                      margin: '0 auto 12px',
                    }}>
                      <img
                        src={uploadedPreview}
                        alt="Captured face"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <p style={{ fontSize: '14px', color: '#10b981', fontWeight: 600 }}>Photo ready for scan</p>
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
                    gap: '10px',
                    marginBottom: '10px',
                    maxWidth: '320px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}>
                    {/* Take Selfie button */}
                    <div
                      onClick={startCamera}
                      style={{
                        flex: 1,
                        border: '2px dashed rgba(255,255,255,0.2)',
                        borderRadius: '14px',
                        padding: '14px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Take Selfie</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Use camera</p>
                    </div>

                    {/* Upload Photo button */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1,
                        border: '2px dashed rgba(255,255,255,0.2)',
                        borderRadius: '14px',
                        padding: '14px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Upload Photo</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>From gallery</p>
                    </div>
                  </div>
                )}

                {/* Selfie guidance hint */}
                {!uploadedPreview && (
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                    marginBottom: '12px',
                    lineHeight: 1.4,
                  }}>
                    Use a close-up selfie where your face fills most of the frame for best results
                  </p>
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
                    padding: '14px',
                    borderRadius: '12px',
                    background: uploadedFile ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: uploadedFile ? '#083A85' : 'rgba(255,255,255,0.3)',
                    fontSize: '15px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: uploadedFile ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: uploadedFile ? '0 4px 14px rgba(0, 0, 0, 0.15)' : 'none',
                  }}
                  onMouseEnter={(e) => { if (uploadedFile) { (e.target as HTMLButtonElement).style.transform = 'translateY(-3px)'; (e.target as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; } }}
                  onMouseLeave={(e) => { if (uploadedFile) { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; (e.target as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'; } }}
                >
                  Find My Photos
                </button>

                {scanError && (
                  (scanError === 'NO_MATCHES' || scanError === 'NO_FACE') ? (
                    <div style={{
                      marginTop: '16px',
                      padding: '20px',
                      backgroundColor: scanError === 'NO_FACE' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(251, 191, 36, 0.08)',
                      border: `1px solid ${scanError === 'NO_FACE' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(251, 191, 36, 0.25)'}`,
                      borderRadius: '14px',
                      textAlign: 'center',
                    }}>
                      <i className={scanError === 'NO_FACE' ? 'bi bi-person-bounding-box' : 'bi bi-camera'} style={{ fontSize: '28px', color: scanError === 'NO_FACE' ? '#06b6d4' : '#f59e0b', display: 'block', marginBottom: '8px' }}></i>
                      <p style={{ color: scanError === 'NO_FACE' ? '#06b6d4' : '#f59e0b', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
                        {scanError === 'NO_FACE' ? 'No face detected in your photo' : 'No matching photos found'}
                      </p>
                      <p style={{ color: scanError === 'NO_FACE' ? '#0891b2' : '#fbbf24', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                        {scanError === 'NO_FACE'
                          ? 'Upload a close-up selfie where your face is clearly visible and takes up most of the frame.'
                          : 'Try a well-lit, front-facing photo with your face clearly visible. Group or distant shots may not match.'}
                      </p>
                    </div>
                  ) : (
                    <p style={{
                      color: '#FF6B6B',
                      fontSize: '14px',
                      marginTop: '12px',
                      textAlign: 'center',
                    }}>{scanError}</p>
                  )
                )}
              </>
            )}

            {/* OR Divider */}
            {!isScanning && !isCameraActive && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '14px 0 12px',
                gap: '14px',
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
                  marginBottom: '2px',
                }}>
                  Enter Invite Code
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.4,
                  maxWidth: '420px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: '10px',
                }}>
                  Enter the code from your photographer or event owner to access the gallery.
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
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: inviteError ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#ffffff',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      letterSpacing: '2px',
                      fontWeight: 600,
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                    onBlur={(e) => { if (!inviteError) { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.06)'; } }}
                  />
                  <button
                    onClick={handleInviteSubmit}
                    disabled={isLoadingAlbum}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      background: isLoadingAlbum ? 'rgba(255,255,255,0.6)' : '#fff',
                      color: '#083A85',
                      fontSize: '15px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: isLoadingAlbum ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                    }}
                    onMouseEnter={(e) => { if (!isLoadingAlbum) { (e.target as HTMLButtonElement).style.transform = 'translateY(-3px)'; (e.target as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; } }}
                    onMouseLeave={(e) => { if (!isLoadingAlbum) { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; (e.target as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'; } }}
                  >
                    {isLoadingAlbum ? 'Loading...' : 'Access Gallery'}
                  </button>
                </div>

                {inviteError && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginTop: '12px',
                  }}>{inviteError}</p>
                )}

                {/* Dashed decorative border */}
                <div style={{
                  marginTop: '14px',
                  borderTop: '1px dashed rgba(255,255,255,0.15)',
                  paddingTop: '10px',
                }}>
                  <p style={{
                    color: 'rgba(255,255,255,0.7)',
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
              background: 'linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #083A85 100%)',
              padding: isMobile ? '90px 20px 30px' : '100px 40px 36px',
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
              backgroundSize: '20px 20px',
              opacity: 0.3,
              zIndex: 0,
              pointerEvents: 'none',
            }} />
            {/* Spotlight layer - reveals brighter dots where cursor is */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.85) 1.5px, transparent 0.5px)',
              backgroundSize: '20px 20px',
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
              background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.95) 0%, rgba(10, 77, 163, 0.92) 100%)',
              borderRadius: '28px',
              padding: isMobile ? '24px 20px' : '30px 40px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              maxWidth: '700px',
              margin: '0 auto',
            }}>
            <h2 style={{
              fontSize: isMobile ? '24px' : '40px',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '6px',
              fontFamily: "'Pragati Narrow', sans-serif",
            }}>
              Event Gallery
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              marginBottom: '16px',
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
                  background: '#fff',
                  color: '#083A85',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.transform = 'translateY(-3px)'; (e.target as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; (e.target as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'; }}
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
              padding: isMobile ? '20px 16px' : '30px 40px',
              background: 'linear-gradient(180deg, #fff 0%, #f8fafc 100%)',
              minHeight: '400px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Removed dot pattern — light background section */}

          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
          }}>
            {/* Photographer credit & album info */}
            {(albumPhotographerName || albumTitle) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {albumTitle && (
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#083A85', margin: 0 }}>
                    {albumTitle}
                  </h3>
                )}
                {albumPhotographerName && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500',
                  }}>
                    <i className="bi bi-camera-fill" style={{ fontSize: '14px' }}></i>
                    Photos by {albumPhotographerName}
                  </div>
                )}
              </div>
            )}
            {/* Select mode toggle */}
            {displayedPhotos.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '10px', alignItems: 'center' }}>
                {isSelectMode && selectedIds.size > 0 && (
                  <button
                    onClick={() => {
                      if (selectedIds.size === displayedPhotos.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(displayedPhotos.map(p => p.id)));
                      }
                    }}
                    style={{
                      padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.8)', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {selectedIds.size === displayedPhotos.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
                <button
                  onClick={() => { setIsSelectMode(!isSelectMode); if (isSelectMode) setSelectedIds(new Set()); }}
                  style={{
                    padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                    background: isSelectMode ? 'rgba(3,150,156,0.2)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${isSelectMode ? 'rgba(3,150,156,0.5)' : 'rgba(255,255,255,0.15)'}`,
                    color: isSelectMode ? '#5eead4' : 'rgba(255,255,255,0.8)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <i className={isSelectMode ? 'bi bi-x-lg' : 'bi bi-check2-square'} style={{ fontSize: '14px' }}></i>
                  {isSelectMode ? 'Cancel' : 'Select'}
                </button>
              </div>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? '12px' : '20px',
            }}>
              {displayedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="photo-card"
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    background: '#ffffff',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}
                    onClick={() => isSelectMode ? toggleSelect(photo.id) : setSelectedPhoto(photo)}
                  >
                    {/* Selection checkbox */}
                    {isSelectMode && (
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleSelect(photo.id); }}
                        style={{
                          position: 'absolute', top: '8px', right: '8px', zIndex: 3,
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: selectedIds.has(photo.id) ? '#03969c' : 'rgba(0,0,0,0.4)',
                          border: selectedIds.has(photo.id) ? '2px solid #03969c' : '2px solid rgba(255,255,255,0.6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {selectedIds.has(photo.id) && (
                          <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: '14px' }}></i>
                        )}
                      </div>
                    )}
                    {/* Selected overlay tint */}
                    {isSelectMode && selectedIds.has(photo.id) && (
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 2,
                        backgroundColor: 'rgba(3,150,156,0.15)',
                        border: '3px solid #03969c',
                        borderRadius: '0',
                        pointerEvents: 'none',
                      }} />
                    )}
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
                    {/* Price badge */}
                    {(() => {
                      const photoPrice = photo.price ?? albumPricing?.pricePerImage ?? 0;
                      const symbol = albumPricing?.currencySymbol || 'RF';
                      return (
                        <span style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          background: photoPrice > 0 ? 'rgba(0,0,0,0.7)' : 'rgba(3,150,156,0.85)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)',
                          letterSpacing: '0.3px',
                        }}>
                          {photoPrice > 0 ? `${symbol}${photoPrice.toLocaleString()}` : 'Free'}
                        </span>
                      );
                    })()}
                  </div>
                  {/* Download button */}
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
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#083A85'; e.currentTarget.style.borderColor = '#083A85'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {(photo.price ?? albumPricing?.pricePerImage ?? 0) > 0
                      ? `Buy (${albumPricing?.currencySymbol || 'RF'}${(photo.price ?? albumPricing?.pricePerImage ?? 0).toLocaleString()})`
                      : 'Download'}
                  </button>
                </div>
              ))}
            </div>

            {displayedPhotos.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6b7280',
              }}>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#083A85' }}>No photos found</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Try scanning again or show all photos</p>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* ── Image Viewer Modal ── */}
      {selectedPhoto && (() => {
        const currentIdx = displayedPhotos.findIndex(p => p.id === selectedPhoto.id);
        const hasPrev = currentIdx > 0;
        const hasNext = currentIdx < displayedPhotos.length - 1;
        const goTo = (idx: number) => { if (idx >= 0 && idx < displayedPhotos.length) setSelectedPhoto(displayedPhotos[idx]); };
        const photoPrice = selectedPhoto.price ?? albumPricing?.pricePerImage ?? 0;

        return (
          <div
            onClick={() => setSelectedPhoto(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 2000 }}
          >
            {/* Cinematic blurred background — uses same photo */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url("${selectedPhoto.url}")`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.3) saturate(1.4)',
              transform: 'scale(1.2)',
            }} />

            {/* Centered image */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <img
                src={selectedPhoto.url.replace('w=600&h=400', 'w=1200&h=800')}
                alt={selectedPhoto.alt}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100% - 1rem)',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  transition: 'opacity 0.3s ease',
                }}
              />
            </div>

            {/* Top gradient overlay — title bar + actions */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                padding: '1.25rem 1.5rem 2.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}
            >
              {/* Left — counter + event info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {albumTitle && (
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 500 }}>
                    {albumTitle}
                  </span>
                )}
                <span style={{
                  color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 500,
                  padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '20px',
                }}>
                  {currentIdx + 1} / {displayedPhotos.length}
                </span>
              </div>

              {/* Right — buy/download + close */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadClick(selectedPhoto); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 22px', borderRadius: '50px',
                    background: photoPrice > 0 ? 'linear-gradient(135deg, #03969c, #026d72)' : 'rgba(255,255,255,0.12)',
                    border: photoPrice > 0 ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', fontSize: '14px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.25s ease',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(3,150,156,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {photoPrice > 0 ? `Buy (${albumPricing?.currencySymbol || 'RF'}${photoPrice.toLocaleString()})` : 'Download'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                    fontSize: '20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                >
                  <i className="bi bi-x-lg" style={{ fontSize: '16px' }}></i>
                </button>
              </div>
            </div>

            {/* Navigation arrows */}
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIdx - 1); }}
                style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 10, width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
                  fontSize: '20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            )}
            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIdx + 1); }}
                style={{
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 10, width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
                  fontSize: '20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            )}

            {/* Bottom gradient — price badge + photo info */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                padding: '2.5rem 1.5rem 1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {photoPrice > 0 && (
                  <span style={{
                    padding: '5px 14px', borderRadius: '20px',
                    background: 'rgba(3,150,156,0.2)', border: '1px solid rgba(3,150,156,0.4)',
                    color: '#5eead4', fontSize: '13px', fontWeight: 700,
                  }}>
                    {albumPricing?.currencySymbol || 'RF'}{photoPrice.toLocaleString()} {albumPricing?.currencyAbbreviation || ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedPhoto.alt && (
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 400 }}>
                    {selectedPhoto.alt}
                  </span>
                )}
                <button
                  onClick={() => { toggleSelect(selectedPhoto.id); if (!isSelectMode) setIsSelectMode(true); }}
                  style={{
                    padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                    background: selectedIds.has(selectedPhoto.id) ? 'rgba(3,150,156,0.3)' : 'rgba(255,255,255,0.1)',
                    border: `1px solid ${selectedIds.has(selectedPhoto.id) ? 'rgba(3,150,156,0.6)' : 'rgba(255,255,255,0.2)'}`,
                    color: selectedIds.has(selectedPhoto.id) ? '#5eead4' : 'rgba(255,255,255,0.8)',
                    cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <i className={selectedIds.has(selectedPhoto.id) ? 'bi bi-check-circle-fill' : 'bi bi-circle'} style={{ fontSize: '14px' }}></i>
                  {selectedIds.has(selectedPhoto.id) ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              backgroundColor: 'rgba(8,58,133,0.08)',
              border: '1px solid rgba(8,58,133,0.2)',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '13px', color: '#adadb8', fontWeight: 500 }}>Photo price</span>
              <span style={{ fontSize: '18px', color: '#03969c', fontWeight: 700 }}>
                {albumPricing?.currencySymbol || 'RF'}{(downloadTarget.price ?? albumPricing?.pricePerImage ?? 0).toLocaleString()} {albumPricing?.currencyAbbreviation || 'RWF'}
              </span>
            </div>

            {/* Proceed to Payment button */}
            <button
              onClick={handleDownloadPayment}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: '#083A85',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(8,58,133,0.3)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(8,58,133,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(8,58,133,0.3)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Proceed to Payment
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
              padding: isMobile ? '24px 18px' : '28px 28px',
              maxWidth: '460px',
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
              fontSize: '20px',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '6px',
              textAlign: 'center',
            }}>
              Facial Recognition Scan
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '20px',
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
                padding: '12px 0',
              }}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 16px',
                  position: 'relative',
                  border: '4px solid #083A85',
                  boxShadow: '0 0 30px rgba(8,58,133,0.3)',
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
                    background: 'linear-gradient(90deg, transparent 0%, #083A85 30%, #ffffff 50%, #083A85 70%, transparent 100%)',
                    boxShadow: '0 0 12px rgba(8,58,133,0.6), 0 0 30px rgba(8,58,133,0.3)',
                    zIndex: 2,
                  }} />
                  {/* Pulsing border ring */}
                  <div className="scan-pulse-ring" style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    border: '3px solid rgba(8,58,133,0.4)',
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
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 14px',
                  border: '3px solid #083A85',
                  boxShadow: '0 4px 20px rgba(8,58,133,0.2)',
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
                      background: '#083A85',
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
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#062d6b'; }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#083A85'; }}
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
                    marginBottom: '16px',
                  }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '3px solid #083A85',
                      boxShadow: '0 4px 12px rgba(8,58,133,0.2)',
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
                    gap: '10px',
                    marginBottom: '16px',
                  }}>
                    {/* Take Selfie button */}
                    <div
                      onClick={startCamera}
                      style={{
                        flex: 1,
                        border: '2px dashed #d1d5db',
                        borderRadius: '14px',
                        padding: '18px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.background = 'rgba(8,58,133,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(8,58,133,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Take Selfie</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Use camera</p>
                    </div>

                    {/* Upload Photo button */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1,
                        border: '2px dashed #d1d5db',
                        borderRadius: '14px',
                        padding: '18px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.background = 'rgba(8,58,133,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(8,58,133,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Upload Photo</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>From gallery</p>
                    </div>
                  </div>
                )}

                {!uploadedPreview && (
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    textAlign: 'center',
                    marginBottom: '12px',
                    lineHeight: 1.4,
                  }}>
                    Use a close-up selfie where your face fills most of the frame for best results
                  </p>
                )}

                {/* Start Scan button */}
                <button
                  onClick={handleStartScan}
                  disabled={!uploadedFile}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: uploadedFile ? '#083A85' : '#e5e7eb',
                    color: uploadedFile ? '#ffffff' : '#9ca3af',
                    fontSize: '15px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: uploadedFile ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => { if (uploadedFile) (e.target as HTMLButtonElement).style.background = '#062d6b'; }}
                  onMouseLeave={(e) => { if (uploadedFile) (e.target as HTMLButtonElement).style.background = '#083A85'; }}
                >
                  Start Scan
                </button>

                {scanError && (
                  (scanError === 'NO_MATCHES' || scanError === 'NO_FACE') ? (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      backgroundColor: scanError === 'NO_FACE' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                      border: `1px solid ${scanError === 'NO_FACE' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                      borderRadius: '12px',
                      textAlign: 'center',
                    }}>
                      <i className={scanError === 'NO_FACE' ? 'bi bi-person-bounding-box' : 'bi bi-camera'} style={{ fontSize: '24px', color: scanError === 'NO_FACE' ? '#06b6d4' : '#f59e0b', display: 'block', marginBottom: '6px' }}></i>
                      <p style={{ color: scanError === 'NO_FACE' ? '#06b6d4' : '#f59e0b', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
                        {scanError === 'NO_FACE' ? 'No face detected in your photo' : 'No matching photos found'}
                      </p>
                      <p style={{ color: scanError === 'NO_FACE' ? '#0891b2' : '#fbbf24', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
                        {scanError === 'NO_FACE'
                          ? 'Upload a close-up selfie where your face is clearly visible.'
                          : 'Try a well-lit, front-facing photo with your face clearly visible.'}
                      </p>
                    </div>
                  ) : (
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
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Floating Selection Bar ── */}
      {isSelectMode && selectedIds.size > 0 && !selectedPhoto && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1500,
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.6) 100%)',
          backdropFilter: 'blur(16px)',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(3,150,156,0.2)', border: '1px solid rgba(3,150,156,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#5eead4', fontSize: '14px', fontWeight: 700 }}>{selectedIds.size}</span>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''} selected
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                {selectionAllFree
                  ? 'Free download'
                  : `Total: ${albumPricing?.currencySymbol || 'RF'}${selectionTotal.toLocaleString()} ${albumPricing?.currencyAbbreviation || 'RWF'}`
                }
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { setSelectedIds(new Set()); setIsSelectMode(false); }}
              style={{
                padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Clear
            </button>
            <button
              onClick={handleBulkDownload}
              style={{
                padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                background: 'linear-gradient(135deg, #03969c, #026d72)',
                border: 'none', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {selectionAllFree ? `Download (${selectedIds.size})` : `Buy All (${albumPricing?.currencySymbol || 'RF'}${selectionTotal.toLocaleString()})`}
            </button>
          </div>
        </div>
      )}

      {/* ── XentriPay Payment Modal ── */}
      <XentriPayModal
        isOpen={showXentriPayModal}
        onClose={() => { setShowXentriPayModal(false); setIsBulkPaying(false); resetDownloadModal(); }}
        onSuccess={isBulkPaying ? handleBulkPaymentSuccess : handlePhotoPaymentSuccess}
        amount={isBulkPaying ? selectionTotal : (downloadTarget?.price ?? albumPricing?.pricePerImage ?? 0)}
        currencyCode={albumPricing?.currencyAbbreviation ?? 'RWF'}
        currencyId={albumPricing?.currencyId ?? ''}
        paymentType="photo_purchase"
        eventId={albumEventId || (isBulkPaying ? selectedPhotosArr[0]?.eventId : downloadTarget?.eventId) || ''}
        title={isBulkPaying ? `Buy ${selectedIds.size} Photos` : 'Pay for Photo'}
        subtitle={isBulkPaying
          ? `Download ${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''} for ${albumPricing?.currencySymbol ?? 'RF'}${selectionTotal.toLocaleString()}`
          : `Download this photo for ${albumPricing?.currencySymbol ?? 'RF'}${(downloadTarget?.price ?? albumPricing?.pricePerImage ?? 0).toLocaleString()}`
        }
      />

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
          box-shadow: 0 8px 24px rgba(8,58,133,0.25);
        }
      `}</style>
    </div>
  );
};

export default FindMyPhotos;
