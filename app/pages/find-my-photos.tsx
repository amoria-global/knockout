'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/navbar';

// Mock event photos — replace with API data in production
const MOCK_PHOTOS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop', alt: 'Event photo 1' },
  { id: '2', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=400&fit=crop', alt: 'Event photo 2' },
  { id: '3', url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop', alt: 'Event photo 3' },
  { id: '4', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop', alt: 'Event photo 4' },
  { id: '5', url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop', alt: 'Event photo 5' },
  { id: '6', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop', alt: 'Event photo 6' },
  { id: '7', url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&h=400&fit=crop', alt: 'Event photo 7' },
  { id: '8', url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&h=400&fit=crop', alt: 'Event photo 8' },
  { id: '9', url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop', alt: 'Event photo 9' },
  { id: '10', url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&h=400&fit=crop', alt: 'Event photo 10' },
  { id: '11', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop', alt: 'Event photo 11' },
  { id: '12', url: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=600&h=400&fit=crop', alt: 'Event photo 12' },
];

const FindMyPhotos = () => {
  // Responsive
  const [isMobile, setIsMobile] = useState(false);

  // Invite code flow
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isCodeSubmitted, setIsCodeSubmitted] = useState(false);

  // Dot pattern mouse tracking
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const headerSectionRef = useRef<HTMLDivElement>(null);
  const gridSectionRef = useRef<HTMLDivElement>(null);
  const [heroMousePos, setHeroMousePos] = useState<{ x: number; y: number } | null>(null);
  const [headerMousePos, setHeaderMousePos] = useState<{ x: number; y: number } | null>(null);
  const [gridMousePos, setGridMousePos] = useState<{ x: number; y: number } | null>(null);

  // Photo grid
  const [allPhotos] = useState(MOCK_PHOTOS);
  const [displayedPhotos, setDisplayedPhotos] = useState(MOCK_PHOTOS);
  const [isFiltered, setIsFiltered] = useState(false);

  // Scan modal
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera selfie
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image viewer modal
  const [selectedPhoto, setSelectedPhoto] = useState<{ id: string; url: string; alt: string } | null>(null);

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

  const handleInviteSubmit = () => {
    if (!inviteCode.trim()) {
      setInviteError('Please enter a valid invite code');
      return;
    }
    setInviteError('');
    setIsCodeSubmitted(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartScan = () => {
    if (!uploadedFile) return;
    setIsScanning(true);
    // Simulate face recognition scan
    const scanDuration = 2000 + Math.random() * 1000;
    setTimeout(() => {
      // Return random subset of 4-6 photos
      const count = 4 + Math.floor(Math.random() * 3);
      const shuffled = [...allPhotos].sort(() => 0.5 - Math.random());
      const matched = shuffled.slice(0, count);
      setDisplayedPhotos(matched);
      setIsFiltered(true);
      setIsScanning(false);
      resetScanModal();
    }, scanDuration);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div style={{ ...(isCodeSubmitted ? { minHeight: '100vh' } : { height: '100vh', overflow: 'hidden' }), backgroundColor: '#052047' }}>
      <Navbar />

      {!isCodeSubmitted ? (
        /* ── Phase 1: Hero + Invite Code ── */
        <div
          ref={heroSectionRef}
          onMouseMove={handleMouseMove(heroSectionRef, setHeroMousePos)}
          onMouseLeave={() => setHeroMousePos(null)}
          style={{
            height: '100vh',
            background: 'linear-gradient(to right, #052047, #052047, #103E83)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: isMobile ? '80px 20px 20px' : '60px 20px 20px',
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
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
            background: 'linear-gradient(135deg, rgba(5, 32, 71, 0.95) 0%, rgba(16, 62, 131, 0.92) 100%)',
            borderRadius: '28px',
            padding: isMobile ? '40px 24px' : '48px 40px',
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
              marginBottom: '40px',
              maxWidth: '480px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Enter the invite code shared by your photographer or event owner to access the event gallery and find your photos using facial recognition.
            </p>

            {/* Invite code input */}
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
                style={{
                  padding: '16px 32px',
                  borderRadius: '12px',
                  background: '#FF6B6B',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#ff5252'; (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#FF6B6B'; (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; }}
              >
                Access Gallery
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
              marginTop: '50px',
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

              {isFiltered && (
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
              {displayedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="photo-card"
                  onClick={() => setSelectedPhoto(photo)}
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    background: '#ffffff',
                  }}
                >
                  <div style={{
                    aspectRatio: '4/3',
                    overflow: 'hidden',
                  }}>
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
                </div>
              ))}
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
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
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
              zIndex: 2001,
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
          >
            &times;
          </button>
          <img
            src={selectedPhoto.url.replace('w=600&h=400', 'w=1200&h=800')}
            alt={selectedPhoto.alt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '12px',
              objectFit: 'contain',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          />
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
                      onClick={() => { setUploadedFile(null); setUploadedPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
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
    </div>
  );
};

export default FindMyPhotos;
