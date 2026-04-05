'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────

export interface StreamAd {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  logoUrl?: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  brandColor?: string;
  type?: 'glass_bottom' | 'corner_card' | 'side_panel' | 'top_ribbon';
  adType?: 'glass_bottom' | 'corner_card' | 'side_panel' | 'top_ribbon';
  duration?: number;
}

interface AdBannerProps {
  ad: StreamAd;
  onClose: () => void;
  onCtaClick?: (ad: StreamAd) => void;
  isMobile?: boolean;
}

// ─── 1. Smart Bottom Glass Banner ──────────────────────────────────

export const GlassBottomBanner: React.FC<AdBannerProps> = ({ ad, onClose, onCtaClick, isMobile }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (ad.duration && ad.duration > 0) {
      const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 500); }, ad.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.duration, onClose]);

  if (!ad.imageUrl && !ad.videoUrl) return null;

  const mediaHeight = isMobile ? '35px' : '50px';

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 40,
      transform: visible ? 'translateY(0)' : 'translateY(110%)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
    }}>
      <div
        onClick={() => ad.ctaUrl && onCtaClick?.(ad)}
        style={{ position: 'relative', cursor: ad.ctaUrl ? 'pointer' : 'default' }}
      >
        {ad.videoUrl ? (
          <video
            src={ad.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{ display: 'block', width: '100%', height: mediaHeight, objectFit: 'cover' }}
          />
        ) : (
          <img
            src={ad.imageUrl}
            alt={ad.title || 'Sponsor'}
            style={{ display: 'block', width: '100%', height: mediaHeight, objectFit: 'cover' }}
          />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 500); }}
          style={{
            position: 'absolute',
            top: '50%',
            right: isMobile ? '6px' : '10px',
            transform: 'translateY(-50%)',
            width: isMobile ? '20px' : '24px',
            height: isMobile ? '20px' : '24px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: isMobile ? '12px' : '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
};


// ─── 2. Corner Spotlight Card ──────────────────────────────────────

export const CornerCard: React.FC<AdBannerProps> = ({ ad, onClose, onCtaClick, isMobile }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (ad.duration && ad.duration > 0) {
      const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 500); }, ad.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.duration, onClose]);

  if (!ad.imageUrl) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: isMobile ? '14px' : '18px',
      right: isMobile ? '14px' : '18px',
      zIndex: 40,
      width: isMobile ? '200px' : '280px',
      height: isMobile ? '60px' : '80px',
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.92)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    }}>
      <div
        onClick={() => ad.ctaUrl && onCtaClick?.(ad)}
        style={{ position: 'relative', cursor: ad.ctaUrl ? 'pointer' : 'default' }}
      >
        <img
          src={ad.imageUrl}
          alt={ad.title || 'Sponsor'}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 500); }}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.85)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
};


// ─── 3. Side Companion Panel ───────────────────────────────────────

export const SidePanel: React.FC<AdBannerProps & { position?: 'right' | 'below' }> = ({ ad, onClose, onCtaClick, isMobile, position = 'right' }) => {
  const [visible, setVisible] = useState(false);
  const isBelow = isMobile || position === 'below';

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  if (!ad.imageUrl) return null;

  return (
    <div style={{
      width: isBelow ? '100%' : '300px',
      height: isBelow ? '60px' : '90px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s ease',
      pointerEvents: 'auto',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div
        onClick={() => ad.ctaUrl && onCtaClick?.(ad)}
        style={{ position: 'relative', cursor: ad.ctaUrl ? 'pointer' : 'default' }}
      >
        <img
          src={ad.imageUrl}
          alt={ad.title || 'Sponsor'}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 500); }}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.85)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
};


// ─── 4. Top Ribbon Sponsor Bar ─────────────────────────────────────

export const TopRibbon: React.FC<AdBannerProps> = ({ ad, onClose, onCtaClick, isMobile }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (ad.duration && ad.duration > 0) {
      const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 500); }, ad.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.duration, onClose]);

  if (!ad.imageUrl && !ad.videoUrl) return null;

  const mediaHeight = isMobile ? '30px' : '45px';

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 40,
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
    }}>
      <div
        onClick={() => ad.ctaUrl && onCtaClick?.(ad)}
        style={{ position: 'relative', cursor: ad.ctaUrl ? 'pointer' : 'default' }}
      >
        {ad.videoUrl ? (
          <video
            src={ad.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{ display: 'block', width: '100%', height: mediaHeight, objectFit: 'cover' }}
          />
        ) : (
          <img
            src={ad.imageUrl}
            alt={ad.title || 'Sponsor'}
            style={{ display: 'block', width: '100%', height: mediaHeight, objectFit: 'cover' }}
          />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 500); }}
          style={{
            position: 'absolute',
            top: '50%',
            right: isMobile ? '6px' : '10px',
            transform: 'translateY(-50%)',
            width: isMobile ? '18px' : '22px',
            height: isMobile ? '18px' : '22px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: isMobile ? '12px' : '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
};


// ─── Ad Manager ────────────────────────────────────────────────────

interface StreamAdManagerProps {
  ads: StreamAd[];
  intervalSeconds?: number;
  enabled?: boolean;
  isMobile?: boolean;
  onAdClick?: (ad: StreamAd) => void;
}

export const StreamAdManager: React.FC<StreamAdManagerProps> = ({
  ads,
  intervalSeconds = 300,
  enabled = true,
  isMobile = false,
  onAdClick,
}) => {
  const [activeAd, setActiveAd] = useState<StreamAd | null>(null);
  const adIndexRef = useRef(0);
  const adsRef = useRef(ads);
  adsRef.current = ads;

  useEffect(() => {
    if (!enabled || ads.length === 0 || intervalSeconds <= 0) return;

    const showNext = () => {
      if (adsRef.current.length === 0) return;
      const ad = adsRef.current[adIndexRef.current % adsRef.current.length];
      setActiveAd(ad);
      adIndexRef.current += 1;
    };

    const initialTimer = setTimeout(showNext, 30000);
    const interval = setInterval(showNext, intervalSeconds * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, ads.length, intervalSeconds]);

  const handleClose = useCallback(() => { setActiveAd(null); }, []);

  const handleCtaClick = useCallback((ad: StreamAd) => {
    onAdClick?.(ad);
  }, [onAdClick]);

  if (!activeAd) return null;

  const adType = activeAd.adType || activeAd.type;
  switch (adType) {
    case 'glass_bottom':
      return <GlassBottomBanner ad={activeAd} onClose={handleClose} onCtaClick={handleCtaClick} isMobile={isMobile} />;
    case 'corner_card':
      return <CornerCard ad={activeAd} onClose={handleClose} onCtaClick={handleCtaClick} isMobile={isMobile} />;
    case 'top_ribbon':
      return <TopRibbon ad={activeAd} onClose={handleClose} isMobile={isMobile} />;
    case 'side_panel':
      return <SidePanel ad={activeAd} onClose={handleClose} onCtaClick={handleCtaClick} isMobile={isMobile} />;
    default:
      return null;
  }
};

export const useAdTrigger = () => {
  const [triggeredAd, setTriggeredAd] = useState<StreamAd | null>(null);
  const triggerAd = useCallback((ad: StreamAd) => setTriggeredAd(ad), []);
  const clearAd = useCallback(() => setTriggeredAd(null), []);
  return { triggeredAd, triggerAd, clearAd };
};

export default StreamAdManager;
