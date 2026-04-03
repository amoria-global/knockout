'use client';

import React, { useState, useEffect, useCallback } from 'react';

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
  type: 'glass_bottom' | 'corner_card' | 'side_panel' | 'top_ribbon';
  duration?: number; // seconds to display (0 = until dismissed)
}

interface AdBannerProps {
  ad: StreamAd;
  onClose: () => void;
  onCtaClick?: (ad: StreamAd) => void;
  isMobile?: boolean;
}

// ─── 1. Smart Bottom Glass Banner ──────────────────────────────────
// Premium frosted glass overlay at bottom of video (max 15% height)

export const GlassBottomBanner: React.FC<AdBannerProps> = ({ ad, onClose, onCtaClick, isMobile }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (ad.duration && ad.duration > 0) {
      const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 400); }, ad.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.duration, onClose]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: '15%',
      zIndex: 40,
      transform: visible ? 'translateY(0)' : 'translateY(100%)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.75) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: isMobile ? '0' : '12px 12px 0 0',
        padding: isMobile ? '8px 12px' : '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '10px' : '16px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: 'none',
      }}>
        {/* Logo */}
        {ad.logoUrl && (
          <img src={ad.logoUrl} alt="" style={{
            width: isMobile ? '28px' : '36px',
            height: isMobile ? '28px' : '36px',
            borderRadius: '8px',
            objectFit: 'cover',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.15)',
          }} />
        )}

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: '#fff',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 600,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{ad.title}</p>
          {ad.subtitle && (
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? '10px' : '12px',
              margin: '2px 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{ad.subtitle}</p>
          )}
        </div>

        {/* CTA Button */}
        {ad.ctaText && (
          <button
            onClick={() => onCtaClick?.(ad)}
            style={{
              padding: isMobile ? '6px 14px' : '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: ad.brandColor || '#03969c',
              color: '#fff',
              fontSize: isMobile ? '11px' : '13px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            {ad.ctaText}
          </button>
        )}

        {/* Close */}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
          style={{
            width: isMobile ? '22px' : '26px',
            height: isMobile ? '22px' : '26px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: isMobile ? '12px' : '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
};


// ─── 2. Corner Spotlight Card ──────────────────────────────────────
// Compact card in bottom-right corner (like YouTube cards)

export const CornerCard: React.FC<AdBannerProps> = ({ ad, onClose, onCtaClick, isMobile }) => {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (ad.duration && ad.duration > 0) {
      const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 400); }, ad.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.duration, onClose]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: 'absolute',
          bottom: isMobile ? '12px' : '16px',
          right: isMobile ? '12px' : '16px',
          zIndex: 40,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="bi bi-megaphone-fill"></i>
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: isMobile ? '12px' : '16px',
      right: isMobile ? '12px' : '16px',
      zIndex: 40,
      width: isMobile ? '180px' : '220px',
      transform: visible ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.95)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Image */}
        {ad.imageUrl && (
          <div style={{ position: 'relative', width: '100%', paddingTop: '50%' }}>
            <img src={ad.imageUrl} alt="" style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '10px 12px' }}>
          <p style={{
            color: '#fff',
            fontSize: isMobile ? '11px' : '13px',
            fontWeight: 600,
            margin: '0 0 4px',
            lineHeight: 1.3,
          }}>{ad.title}</p>
          {ad.subtitle && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', margin: '0 0 8px' }}>{ad.subtitle}</p>
          )}
          {ad.ctaText && (
            <button
              onClick={() => onCtaClick?.(ad)}
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: ad.brandColor || '#03969c',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              {ad.ctaText} <i className="bi bi-arrow-right" style={{ fontSize: '10px' }}></i>
            </button>
          )}
        </div>

        {/* Close + Collapse */}
        <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', border: 'none', color: 'rgba(255,255,255,0.7)',
              fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="bi bi-dash"></i>
          </button>
          <button
            onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
            style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', border: 'none', color: 'rgba(255,255,255,0.7)',
              fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── 3. Side Companion Panel ───────────────────────────────────────
// Right side panel (desktop) or below video (mobile)

export const SidePanel: React.FC<AdBannerProps & { position?: 'right' | 'below' }> = ({ ad, onClose, onCtaClick, isMobile, position = 'right' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const isBelow = isMobile || position === 'below';

  return (
    <div style={{
      width: isBelow ? '100%' : '280px',
      maxHeight: isBelow ? '200px' : '100%',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'all 0.4s ease',
      pointerEvents: 'auto',
    }}>
      <div style={{
        background: '#111118',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}>
        {/* Image */}
        {ad.imageUrl && (
          <div style={{ position: 'relative', width: '100%', paddingTop: isBelow ? '35%' : '55%' }}>
            <img src={ad.imageUrl} alt="" style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }} />
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(transparent, #111118)',
            }} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '14px 16px' }}>
          <p style={{
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            margin: '0 0 6px',
            lineHeight: 1.3,
          }}>{ad.title}</p>
          {ad.subtitle && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 12px', lineHeight: 1.4 }}>{ad.subtitle}</p>
          )}
          {ad.ctaText && (
            <button
              onClick={() => onCtaClick?.(ad)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: ad.brandColor || '#03969c',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {ad.ctaText}
            </button>
          )}
        </div>

        {/* Close */}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
};


// ─── 4. Top Ribbon Sponsor Bar ─────────────────────────────────────
// Thin strip at top of video (5-8% height)

export const TopRibbon: React.FC<AdBannerProps> = ({ ad, onClose, isMobile }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (ad.duration && ad.duration > 0) {
      const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 400); }, ad.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.duration, onClose]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      maxHeight: '8%',
      zIndex: 40,
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
    }}>
      <div style={{
        background: ad.brandColor || 'linear-gradient(90deg, #083A85 0%, #0a5dc2 50%, #083A85 100%)',
        padding: isMobile ? '4px 12px' : '6px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '8px' : '12px',
        borderRadius: isMobile ? '0' : '0 0 10px 10px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        {ad.logoUrl && (
          <img src={ad.logoUrl} alt="" style={{
            height: isMobile ? '16px' : '20px',
            objectFit: 'contain',
            flexShrink: 0,
          }} />
        )}

        {/* Text */}
        <p style={{
          color: '#fff',
          fontSize: isMobile ? '10px' : '12px',
          fontWeight: 700,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {ad.title}
        </p>

        {/* Close */}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'absolute',
            right: isMobile ? '8px' : '12px',
          }}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
};


// ─── Ad Manager ────────────────────────────────────────────────────
// Manages ad scheduling, rotation, and display

interface StreamAdManagerProps {
  ads: StreamAd[];
  intervalSeconds?: number;
  enabled?: boolean;
  isMobile?: boolean;
  onAdClick?: (ad: StreamAd) => void;
}

export const StreamAdManager: React.FC<StreamAdManagerProps> = ({
  ads,
  intervalSeconds = 300, // default 5 minutes
  enabled = true,
  isMobile = false,
  onAdClick,
}) => {
  const [activeAd, setActiveAd] = useState<StreamAd | null>(null);
  const [adIndex, setAdIndex] = useState(0);

  const showNextAd = useCallback(() => {
    if (!enabled || ads.length === 0) return;
    const ad = ads[adIndex % ads.length];
    setActiveAd(ad);
    setAdIndex(prev => prev + 1);
  }, [enabled, ads, adIndex]);

  // Auto-timer: show ads at interval
  useEffect(() => {
    if (!enabled || ads.length === 0 || intervalSeconds <= 0) return;

    // Show first ad after a short delay (30s)
    const initialTimer = setTimeout(showNextAd, 30000);

    const interval = setInterval(showNextAd, intervalSeconds * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, ads.length, intervalSeconds, showNextAd]);

  const handleClose = useCallback(() => {
    setActiveAd(null);
  }, []);

  const handleCtaClick = useCallback((ad: StreamAd) => {
    if (ad.ctaUrl) {
      window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
    }
    onAdClick?.(ad);
  }, [onAdClick]);

  if (!activeAd) return null;

  switch (activeAd.type) {
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

// Expose a way to manually trigger an ad from outside
export const useAdTrigger = () => {
  const [triggeredAd, setTriggeredAd] = useState<StreamAd | null>(null);
  const triggerAd = useCallback((ad: StreamAd) => setTriggeredAd(ad), []);
  const clearAd = useCallback(() => setTriggeredAd(null), []);
  return { triggeredAd, triggerAd, clearAd };
};

export default StreamAdManager;
