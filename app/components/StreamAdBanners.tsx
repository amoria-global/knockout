'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────

export interface StreamAd {
  id: string;
  imageUrl?: string;
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
  const brandColor = ad.brandColor || '#03969c';

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (ad.duration && ad.duration > 0) {
      const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 500); }, ad.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.duration, onClose]);

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
      <div style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `2px solid ${brandColor}40`,
        padding: isMobile ? '10px 14px' : '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '12px' : '16px',
      }}>
        {/* Accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)` }} />

        {/* Logo */}
        {ad.logoUrl && (
          <div style={{
            width: isMobile ? '36px' : '44px',
            height: isMobile ? '36px' : '44px',
            borderRadius: '10px',
            overflow: 'hidden',
            flexShrink: 0,
            border: `1.5px solid ${brandColor}50`,
            boxShadow: `0 0 12px ${brandColor}30`,
          }}>
            <img src={ad.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: '#fff',
            fontSize: isMobile ? '13px' : '15px',
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}>{ad.title}</p>
          {ad.subtitle && (
            <p style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: isMobile ? '10px' : '12px',
              margin: '2px 0 0',
              lineHeight: 1.3,
            }}>{ad.subtitle}</p>
          )}
        </div>

        {/* CTA */}
        {ad.ctaText && (
          <button
            onClick={() => onCtaClick?.(ad)}
            style={{
              padding: isMobile ? '7px 16px' : '9px 22px',
              borderRadius: '8px',
              border: 'none',
              background: brandColor,
              color: '#fff',
              fontSize: isMobile ? '11px' : '13px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: `0 2px 12px ${brandColor}60`,
              transition: 'all 0.2s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {ad.ctaText}
          </button>
        )}

        {/* Close */}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 500); }}
          style={{
            width: isMobile ? '24px' : '28px',
            height: isMobile ? '24px' : '28px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: isMobile ? '13px' : '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
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
  const [collapsed, setCollapsed] = useState(false);
  const brandColor = ad.brandColor || '#03969c';

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (ad.duration && ad.duration > 0) {
      const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 500); }, ad.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.duration, onClose]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: 'absolute',
          bottom: isMobile ? '14px' : '18px',
          right: isMobile ? '14px' : '18px',
          zIndex: 40,
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(10px)',
          border: `1.5px solid ${brandColor}50`,
          color: brandColor,
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 8px ${brandColor}20`,
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <i className="bi bi-megaphone-fill"></i>
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: isMobile ? '14px' : '18px',
      right: isMobile ? '14px' : '18px',
      zIndex: 40,
      width: isMobile ? '200px' : '240px',
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.92)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
    }}>
      <div style={{
        background: 'rgba(10,10,18,0.92)',
        backdropFilter: 'blur(16px)',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${brandColor}15`,
      }}>
        {/* Image */}
        {ad.imageUrl && (
          <div style={{ position: 'relative', width: '100%', paddingTop: '52%' }}>
            <img src={ad.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(transparent, rgba(10,10,18,0.95))' }} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '12px 14px' }}>
          <p style={{ color: '#fff', fontSize: isMobile ? '12px' : '14px', fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3 }}>{ad.title}</p>
          {ad.subtitle && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', margin: '0 0 10px' }}>{ad.subtitle}</p>}
          {ad.ctaText && (
            <button
              onClick={() => onCtaClick?.(ad)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`,
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: `0 2px 10px ${brandColor}40`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {ad.ctaText} <i className="bi bi-arrow-right" style={{ fontSize: '11px' }}></i>
            </button>
          )}
        </div>

        {/* Controls */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
          <button onClick={() => setCollapsed(true)} style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-dash"></i>
          </button>
          <button onClick={() => { setVisible(false); setTimeout(onClose, 500); }} style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-x"></i>
          </button>
        </div>

        {/* Sponsored tag */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Sponsored
        </div>
      </div>
    </div>
  );
};


// ─── 3. Side Companion Panel ───────────────────────────────────────

export const SidePanel: React.FC<AdBannerProps & { position?: 'right' | 'below' }> = ({ ad, onClose, onCtaClick, isMobile, position = 'right' }) => {
  const [visible, setVisible] = useState(false);
  const brandColor = ad.brandColor || '#03969c';
  const isBelow = isMobile || position === 'below';

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  return (
    <div style={{
      width: isBelow ? '100%' : '280px',
      maxHeight: isBelow ? '200px' : '100%',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s ease',
      pointerEvents: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #111118 0%, #0d0d14 100%)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        position: 'relative',
      }}>
        {/* Image */}
        {ad.imageUrl && (
          <div style={{ position: 'relative', width: '100%', paddingTop: isBelow ? '35%' : '55%' }}>
            <img src={ad.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(transparent, #111118)' }} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '16px 18px' }}>
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.3 }}>{ad.title}</p>
          {ad.subtitle && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '0 0 14px', lineHeight: 1.4 }}>{ad.subtitle}</p>}
          {ad.ctaText && (
            <button
              onClick={() => onCtaClick?.(ad)}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                background: `linear-gradient(135deg, ${brandColor}, ${brandColor}bb)`,
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${brandColor}40`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${brandColor}60`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 16px ${brandColor}40`; }}
            >
              {ad.ctaText}
            </button>
          )}
        </div>

        {/* Sponsored + Close */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '3px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Sponsored
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 500); }}
          style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
};


// ─── 4. Top Ribbon Sponsor Bar ─────────────────────────────────────

export const TopRibbon: React.FC<AdBannerProps> = ({ ad, onClose, isMobile }) => {
  const [visible, setVisible] = useState(false);
  const brandColor = ad.brandColor || '#083A85';

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (ad.duration && ad.duration > 0) {
      const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 500); }, ad.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.duration, onClose]);

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
      {/* Main ribbon */}
      <div style={{
        background: `linear-gradient(90deg, ${brandColor}ee 0%, ${brandColor} 50%, ${brandColor}ee 100%)`,
        backdropFilter: 'blur(12px)',
        padding: isMobile ? '6px 14px' : '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '10px' : '14px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle shine effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Bottom edge glow */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
        }} />

        {/* Sponsored label */}
        <span style={{
          fontSize: isMobile ? '8px' : '9px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}>
          Sponsor
        </span>

        {/* Logo */}
        {ad.logoUrl && (
          <div style={{
            width: isMobile ? '20px' : '24px',
            height: isMobile ? '20px' : '24px',
            borderRadius: '6px',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <img src={ad.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Text */}
        <p style={{
          color: '#fff',
          fontSize: isMobile ? '11px' : '13px',
          fontWeight: 700,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}>
          {ad.title}
        </p>

        {/* CTA if available */}
        {ad.ctaText && (
          <span style={{
            fontSize: isMobile ? '9px' : '10px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.7)',
            padding: '3px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}>
            {ad.ctaText}
          </span>
        )}

        {/* Close */}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 500); }}
          style={{
            position: 'absolute',
            right: isMobile ? '6px' : '10px',
            width: isMobile ? '20px' : '22px',
            height: isMobile ? '20px' : '22px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(0,0,0,0.2)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: isMobile ? '11px' : '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
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
    if (ad.ctaUrl) window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
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
