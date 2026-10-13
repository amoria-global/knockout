'use client';

import React, { useEffect, useCallback } from 'react';
import { FaApple, FaGooglePlay } from 'react-icons/fa6';
import { APP_STORE_URL, PLAY_STORE_URL, GET_APP_PAGE_URL, type MobilePlatform } from '@/lib/qr/eventQr';
import QrCodeSvg from './QrCodeSvg';

interface GetAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlatform?: MobilePlatform;
}

export default function GetAppModal({
  isOpen,
  onClose,
  userPlatform = null,
}: GetAppModalProps): React.JSX.Element | null {
  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isIos = userPlatform === 'ios';
  const isAndroid = userPlatform === 'android';
  const isMobileDevice = isIos || isAndroid;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="get-app-modal-title"
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(5, 8, 20, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 relative"
        style={{
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(8, 58, 133, 0.16)',
          boxShadow: '0 25px 65px -12px rgba(8, 58, 133, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Connekyt Brand Gradient Bar */}
        <div
          className="w-full h-1 sm:h-1.5 flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, #083A85 0%, #0F4FB6 45%, #F20C8F 100%)',
          }}
        />

        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-[#083A85] hover:bg-[#083A85]/10 transition-colors cursor-pointer z-10"
          style={{ background: 'rgba(8, 58, 133, 0.06)' }}
        >
          <i className="bi bi-x-lg text-sm sm:text-base" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 sm:px-8 pt-2 sm:pt-6 pb-6 sm:pb-8">
          {/* Header with Official Logo & Brand Badge */}
          <div className="flex items-center gap-3.5 sm:gap-4 mb-4">
            <div
              className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white border border-[#083A85]/15 p-2"
              style={{
                boxShadow: '0 8px 24px rgba(8, 58, 133, 0.14)',
              }}
            >
              <img
                src="/logo.png"
                alt="Connekyt Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#083A85] bg-[#083A85]/10 border border-[#083A85]/15 mb-1">
                <i className="bi bi-stars text-[#F20C8F] text-[10px]" /> Mobile App
              </div>
              <h3
                id="get-app-modal-title"
                className="text-lg sm:text-2xl font-black text-[#083A85] leading-tight"
              >
                Get Connekyt on Mobile
              </h3>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 mb-5 leading-relaxed">
            Find your event photos in seconds with AI face scanning, join real-time live ceremonies, and get instant updates straight on your device.
          </p>

          {/* Action Area: Platform Aware with Connekyt Branding */}
          <div
            className="rounded-2xl p-4 sm:p-5 mb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.05) 0%, rgba(15, 79, 182, 0.07) 50%, rgba(242, 12, 143, 0.04) 100%)',
              border: '1px solid rgba(8, 58, 133, 0.16)',
              boxShadow: '0 4px 20px -2px rgba(8, 58, 133, 0.08)',
            }}
          >
            {isIos ? (
              /* Primary iOS CTA */
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#083A85] bg-[#083A85]/10 border border-[#083A85]/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F20C8F]" /> Best for your iPhone
                  </span>
                  <span className="text-xs text-[#083A85] font-semibold">Free • App Store</span>
                </div>
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full text-white py-3.5 px-5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-center cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                    boxShadow: '0 8px 24px -4px rgba(8, 58, 133, 0.45)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #062D6B 0%, #083A85 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <FaApple className="text-2xl flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider opacity-85 leading-none">
                      Download on the
                    </div>
                    <div className="text-base sm:text-lg font-bold leading-tight">
                      Apple App Store
                    </div>
                  </div>
                </a>
                <div className="mt-3 text-center">
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-600 hover:text-[#083A85] font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <FaGooglePlay className="text-[11px] text-[#083A85]" />
                    <span>Also available on Google Play</span>
                  </a>
                </div>
              </div>
            ) : isAndroid ? (
              /* Primary Android CTA */
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#083A85] bg-[#083A85]/10 border border-[#083A85]/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F20C8F]" /> Best for your Android
                  </span>
                  <span className="text-xs text-[#083A85] font-semibold">Free • Google Play</span>
                </div>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full text-white py-3.5 px-5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-center cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                    boxShadow: '0 8px 24px -4px rgba(8, 58, 133, 0.45)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #062D6B 0%, #083A85 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <FaGooglePlay className="text-xl flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider opacity-85 leading-none">
                      GET IT ON
                    </div>
                    <div className="text-base sm:text-lg font-bold leading-tight">
                      Google Play Store
                    </div>
                  </div>
                </a>
                <div className="mt-3 text-center">
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-600 hover:text-[#083A85] font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <FaApple className="text-sm text-[#083A85]" />
                    <span>Also available on Apple App Store</span>
                  </a>
                </div>
              </div>
            ) : (
              /* Desktop / Tablet: QR Code + Dual Store Badges */
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
                <div className="flex flex-col items-center flex-shrink-0">
                  <QrCodeSvg value={GET_APP_PAGE_URL} size={136} fgColor="#083A85" />
                  <span className="text-[11px] font-bold text-[#083A85] mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#083A85]/8 border border-[#083A85]/15">
                    <i className="bi bi-camera text-xs text-[#F20C8F]" />
                    Scan with phone camera
                  </span>
                </div>

                <div className="flex-1 w-full flex flex-col justify-center gap-2.5">
                  <div className="text-xs font-bold text-[#083A85] uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F20C8F]" />
                    Or download directly
                  </div>
                  {/* Apple App Store */}
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full text-white py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                      boxShadow: '0 4px 12px rgba(8, 58, 133, 0.28)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #062D6B 0%, #083A85 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaApple className="text-2xl flex-shrink-0" />
                    <div className="text-left">
                      <div className="text-[9px] uppercase tracking-wider opacity-85 leading-none">
                        Download on the
                      </div>
                      <div className="text-sm font-bold leading-tight">App Store</div>
                    </div>
                  </a>

                  {/* Google Play */}
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full text-white py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                      boxShadow: '0 4px 12px rgba(8, 58, 133, 0.28)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #062D6B 0%, #083A85 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaGooglePlay className="text-lg flex-shrink-0" />
                    <div className="text-left">
                      <div className="text-[9px] uppercase tracking-wider opacity-85 leading-none">
                        GET IT ON
                      </div>
                      <div className="text-sm font-bold leading-tight">Google Play</div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Feature Highlights Grid in Connekyt Branding */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div
              className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{
                background: 'rgba(8, 58, 133, 0.04)',
                border: '1px solid rgba(8, 58, 133, 0.14)',
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                style={{
                  background: 'rgba(8, 58, 133, 0.12)',
                  color: '#083A85',
                }}
              >
                <i className="bi bi-person-bounding-box" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#083A85] leading-tight">
                  AI Face Match
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  One selfie finds all your photos instantly.
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{
                background: 'rgba(242, 12, 143, 0.04)',
                border: '1px solid rgba(242, 12, 143, 0.16)',
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                style={{
                  background: 'rgba(242, 12, 143, 0.12)',
                  color: '#F20C8F',
                }}
              >
                <i className="bi bi-broadcast" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#083A85] leading-tight">
                  Live Streams
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Stream & watch ceremonies anywhere.
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{
                background: 'rgba(15, 79, 182, 0.04)',
                border: '1px solid rgba(15, 79, 182, 0.14)',
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                style={{
                  background: 'rgba(15, 79, 182, 0.12)',
                  color: '#0F4FB6',
                }}
              >
                <i className="bi bi-bell-fill" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#083A85] leading-tight">
                  Instant Alerts
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Real-time photo notifications on lock screen.
                </p>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-[#083A85]">
              <i className="bi bi-shield-check text-[#F20C8F]" /> Official App
            </span>
            <span>•</span>
            <span>100% Free</span>
            <span>•</span>
            <span>Secure & Private</span>
          </div>
        </div>
      </div>
    </div>
  );
}
