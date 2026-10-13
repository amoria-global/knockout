'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { FaApple, FaGooglePlay } from 'react-icons/fa6';
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  GET_APP_PAGE_URL,
  detectMobilePlatform,
  type MobilePlatform,
} from '@/lib/qr/eventQr';
import QrCodeSvg from '../components/QrCodeSvg';

export default function GetAppPage(): React.JSX.Element {
  const [platform, setPlatform] = useState<MobilePlatform>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [redirectCancelled, setRedirectCancelled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const p = detectMobilePlatform();
    setPlatform(p);

    // Friendly 3s countdown auto-redirect on mobile devices so user can cancel or read
    if (p === 'ios' || p === 'android') {
      const targetUrl = p === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
      
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      redirectTimerRef.current = setTimeout(() => {
        if (!redirectCancelled) {
          window.location.href = targetUrl;
        }
      }, 3000);

      return () => {
        clearInterval(interval);
        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      };
    }
  }, [redirectCancelled]);

  const handleCancelRedirect = () => {
    setRedirectCancelled(true);
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(GET_APP_PAGE_URL);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      setCopiedLink(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isIos = platform === 'ios';
  const isAndroid = platform === 'android';
  const isMobile = isIos || isAndroid;

  return (
    <>
      {/* Dedicated Print & Screen Stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #083a85 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-qr-card {
            border: 2px solid #083a85 !important;
            padding: 24px !important;
            border-radius: 16px !important;
            text-align: center !important;
            page-break-inside: avoid !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/40 text-slate-900 flex flex-col justify-between selection:bg-[#F20C8F] selection:text-white">
        {/* Top Connekyt Brand Gradient Bar */}
        <div
          className="w-full h-1.5 flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, #083A85 0%, #0F4FB6 45%, #F20C8F 100%)',
          }}
        />

        {/* Minimal Header / Back Navigation */}
        <header className="no-print w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform active:scale-95"
            aria-label="Connekyt Home"
          >
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center p-1.5 border border-[#083A85]/15 transition-shadow group-hover:shadow-md"
              style={{
                boxShadow: '0 4px 14px rgba(8, 58, 133, 0.12)',
              }}
            >
              <img
                src="/logo.png"
                alt="Connekyt Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-[#083A85]">
                Connekyt
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider -mt-1">
                Official App
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#083A85] flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#083A85]/5 transition-all"
          >
            <span>Website</span>
            <i className="bi bi-arrow-right text-xs text-[#083A85]" />
          </Link>
        </header>

        {/* PRINT ONLY FLYER / POSTER CARD */}
        <div className="print-only p-8 text-center print-container">
          <div className="print-qr-card mx-auto max-w-md">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo.png" alt="Connekyt" className="w-14 h-14 object-contain" />
              <div className="text-left">
                <h1 className="text-2xl font-black text-[#083A85] leading-none">Connekyt</h1>
                <p className="text-xs font-bold text-[#F20C8F] uppercase tracking-wider mt-1">
                  Official Mobile App
                </p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Scan with your phone to download
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              Find your event photos instantly with AI face search, stream ceremonies live, and get real-time alerts.
            </p>

            <div className="flex justify-center mb-6">
              <QrCodeSvg value={GET_APP_PAGE_URL} size={220} fgColor="#083A85" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-left text-xs text-slate-700 mb-6 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-[#083A85] font-bold">1.</span> Open phone camera
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#083A85] font-bold">2.</span> Point at QR code
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#083A85] font-bold">3.</span> Tap the store link
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#083A85] font-bold">4.</span> Free install in seconds
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-semibold border-t border-slate-200 pt-3">
              Available Free on Apple App Store & Google Play • connekyt.com
            </div>
          </div>
        </div>

        {/* SCREEN HERO & INTERACTIVE CONTENT */}
        <div className="no-print flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8 flex flex-col justify-center">
          <div
            className="bg-white rounded-3xl shadow-xl overflow-hidden relative"
            style={{
              border: '1px solid rgba(8, 58, 133, 0.16)',
              boxShadow: '0 25px 65px -12px rgba(8, 58, 133, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Ambient Connekyt glow background element */}
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none opacity-40 blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(242, 12, 143, 0.25) 0%, rgba(8, 58, 133, 0.1) 70%, transparent 100%)',
              }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none opacity-30 blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(8, 58, 133, 0.3) 0%, rgba(15, 79, 182, 0.15) 70%, transparent 100%)',
              }}
            />

            <div className="p-6 sm:p-10 relative z-10">
              {/* Badge & Title */}
              <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#083A85] bg-[#083A85]/10 border border-[#083A85]/15 mb-3">
                  <i className="bi bi-stars text-[#F20C8F] text-xs" />
                  <span>
                    {isIos ? 'Connekyt for iOS' : isAndroid ? 'Connekyt for Android' : 'Connekyt Official Mobile App'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-[#083A85] tracking-tight leading-tight sm:leading-snug">
                  Get the Official Connekyt App
                </h1>

                <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
                  Find all your event photos in seconds with AI facial recognition, stream ceremonies live, and never miss a memory.
                </p>
              </div>

              {/* ACTION SECTION BASED ON PLATFORM */}
              <div
                className="max-w-xl mx-auto rounded-2xl p-5 sm:p-7 mb-8 transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.05) 0%, rgba(15, 79, 182, 0.07) 50%, rgba(242, 12, 143, 0.04) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.18)',
                  boxShadow: '0 8px 30px -4px rgba(8, 58, 133, 0.12)',
                }}
              >
                {/* 1. iOS Mobile View */}
                {isIos && (
                  <div className="space-y-4">
                    {/* Countdown Banner if redirecting */}
                    {!redirectCancelled && countdown > 0 && (
                      <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-[#083A85]/15 text-xs text-[#083A85]">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <span className="w-2 h-2 rounded-full bg-[#F20C8F] animate-pulse" />
                          Opening Apple App Store in {countdown}s...
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelRedirect}
                          className="font-bold underline text-slate-500 hover:text-[#083A85] cursor-pointer"
                        >
                          Stay here
                        </button>
                      </div>
                    )}

                    {/* Primary iOS App Store Button */}
                    <a
                      href={APP_STORE_URL}
                      className="flex items-center justify-center gap-3.5 w-full text-white py-3.5 sm:py-4 px-6 rounded-2xl font-bold transition-all duration-200 shadow-md hover:shadow-xl active:scale-[0.99] cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                        boxShadow: '0 8px 24px -4px rgba(8, 58, 133, 0.45)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #062D6B 0%, #083A85 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)';
                      }}
                    >
                      <FaApple className="text-3xl flex-shrink-0" />
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-wider opacity-85 leading-none">
                          Download on the
                        </div>
                        <div className="text-base sm:text-lg font-bold leading-tight">
                          Apple App Store
                        </div>
                      </div>
                    </a>

                    {/* Deep link button if already installed */}
                    <a
                      href="connekt://"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#083A85] bg-white border border-[#083A85]/20 hover:bg-[#083A85]/5 transition-all"
                    >
                      <i className="bi bi-box-arrow-up-right text-xs text-[#F20C8F]" />
                      <span>Already installed? Open Connekyt App</span>
                    </a>

                    {/* Secondary Cross-Platform Link */}
                    <div className="text-center pt-1">
                      <a
                        href={PLAY_STORE_URL}
                        className="text-xs text-slate-500 hover:text-[#083A85] font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FaGooglePlay className="text-[11px] text-[#083A85]" />
                        <span>Looking for Android? Open on Google Play</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* 2. Android Mobile View */}
                {isAndroid && (
                  <div className="space-y-4">
                    {/* Countdown Banner if redirecting */}
                    {!redirectCancelled && countdown > 0 && (
                      <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-[#083A85]/15 text-xs text-[#083A85]">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <span className="w-2 h-2 rounded-full bg-[#F20C8F] animate-pulse" />
                          Opening Google Play Store in {countdown}s...
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelRedirect}
                          className="font-bold underline text-slate-500 hover:text-[#083A85] cursor-pointer"
                        >
                          Stay here
                        </button>
                      </div>
                    )}

                    {/* Primary Google Play Store Button */}
                    <a
                      href={PLAY_STORE_URL}
                      className="flex items-center justify-center gap-3.5 w-full text-white py-3.5 sm:py-4 px-6 rounded-2xl font-bold transition-all duration-200 shadow-md hover:shadow-xl active:scale-[0.99] cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                        boxShadow: '0 8px 24px -4px rgba(8, 58, 133, 0.45)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #062D6B 0%, #083A85 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)';
                      }}
                    >
                      <FaGooglePlay className="text-2xl flex-shrink-0" />
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-wider opacity-85 leading-none">
                          GET IT ON
                        </div>
                        <div className="text-base sm:text-lg font-bold leading-tight">
                          Google Play Store
                        </div>
                      </div>
                    </a>

                    {/* Deep link button if already installed */}
                    <a
                      href="connekt://"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#083A85] bg-white border border-[#083A85]/20 hover:bg-[#083A85]/5 transition-all"
                    >
                      <i className="bi bi-box-arrow-up-right text-xs text-[#F20C8F]" />
                      <span>Already installed? Open Connekyt App</span>
                    </a>

                    {/* Secondary Cross-Platform Link */}
                    <div className="text-center pt-1">
                      <a
                        href={APP_STORE_URL}
                        className="text-xs text-slate-500 hover:text-[#083A85] font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FaApple className="text-sm text-[#083A85]" />
                        <span>Looking for iPhone? Open Apple App Store</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* 3. Desktop / Tablet / Default View (QR Code + Both Stores) */}
                {!isMobile && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                      {/* Left: Vector QR Code with Brand Emblem */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <QrCodeSvg value={GET_APP_PAGE_URL} size={152} fgColor="#083A85" />
                        <span className="text-[11px] font-bold text-[#083A85] mt-2.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#083A85]/10 border border-[#083A85]/15">
                          <i className="bi bi-camera text-xs text-[#F20C8F]" />
                          Scan with phone camera
                        </span>
                      </div>

                      {/* Right: Dual Store Badges */}
                      <div className="flex-1 w-full flex flex-col justify-center gap-3">
                        <div className="text-xs font-bold text-[#083A85] uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F20C8F]" />
                          Available on iOS and Android
                        </div>

                        {/* Apple App Store */}
                        <a
                          href={APP_STORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 w-full text-white py-3 px-4.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                            boxShadow: '0 4px 14px rgba(8, 58, 133, 0.28)',
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
                            <div className="text-sm font-bold leading-tight">Apple App Store</div>
                          </div>
                        </a>

                        {/* Google Play Store */}
                        <a
                          href={PLAY_STORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 w-full text-white py-3 px-4.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                            boxShadow: '0 4px 14px rgba(8, 58, 133, 0.28)',
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

                    {/* Desktop Toolbar: Copy link & Print flyer */}
                    <div className="mt-5 pt-4 border-t border-[#083A85]/12 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#083A85] hover:border-[#083A85]/30 font-medium transition-all cursor-pointer"
                      >
                        <i className={`bi ${copiedLink ? 'bi-check2-circle text-[#F20C8F]' : 'bi-link-45deg'}`} />
                        <span>{copiedLink ? 'Link copied!' : 'Copy download link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#083A85] hover:border-[#083A85]/30 font-medium transition-all cursor-pointer"
                      >
                        <i className="bi bi-printer text-[#083A85]" />
                        <span>Print QR Flyer / Stand</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* FEATURES GRID IN CONNEKYT BRANDING */}
              <div className="max-w-3xl mx-auto mb-8">
                <div className="text-center mb-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#083A85]">
                    Everything You Need in One Place
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Feature 1: AI Face Match */}
                  <div
                    className="flex items-start gap-3.5 p-4 rounded-2xl transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'rgba(8, 58, 133, 0.04)',
                      border: '1px solid rgba(8, 58, 133, 0.14)',
                    }}
                  >
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm"
                      style={{
                        background: 'rgba(8, 58, 133, 0.12)',
                        color: '#083A85',
                      }}
                    >
                      <i className="bi bi-person-bounding-box" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#083A85] leading-tight flex items-center gap-1.5">
                        <span>AI Face Match</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#083A85]/10 text-[#083A85] font-semibold">
                          Smart
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        One selfie scans thousands of event photos and finds yours in milliseconds.
                      </p>
                    </div>
                  </div>

                  {/* Feature 2: Live Streams */}
                  <div
                    className="flex items-start gap-3.5 p-4 rounded-2xl transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'rgba(242, 12, 143, 0.04)',
                      border: '1px solid rgba(242, 12, 143, 0.16)',
                    }}
                  >
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm"
                      style={{
                        background: 'rgba(242, 12, 143, 0.12)',
                        color: '#F20C8F',
                      }}
                    >
                      <i className="bi bi-broadcast" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#083A85] leading-tight flex items-center gap-1.5">
                        <span>Live Ceremonies</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#F20C8F]/10 text-[#F20C8F] font-semibold">
                          Live
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Watch weddings, galas, and graduations anywhere with live chat, reactions, and gifts.
                      </p>
                    </div>
                  </div>

                  {/* Feature 3: Instant Alerts */}
                  <div
                    className="flex items-start gap-3.5 p-4 rounded-2xl transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'rgba(15, 79, 182, 0.04)',
                      border: '1px solid rgba(15, 79, 182, 0.14)',
                    }}
                  >
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm"
                      style={{
                        background: 'rgba(15, 79, 182, 0.12)',
                        color: '#0F4FB6',
                      }}
                    >
                      <i className="bi bi-bell-fill" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#083A85] leading-tight flex items-center gap-1.5">
                        <span>Instant Push Alerts</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#0F4FB6]/10 text-[#0F4FB6] font-semibold">
                          Real-time
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Receive lock-screen notifications the moment your photographer uploads new albums.
                      </p>
                    </div>
                  </div>

                  {/* Feature 4: Lossless Downloads */}
                  <div
                    className="flex items-start gap-3.5 p-4 rounded-2xl transition-transform hover:-translate-y-0.5"
                    style={{
                      background: 'rgba(8, 58, 133, 0.04)',
                      border: '1px solid rgba(8, 58, 133, 0.14)',
                    }}
                  >
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm"
                      style={{
                        background: 'rgba(8, 58, 133, 0.12)',
                        color: '#083A85',
                      }}
                    >
                      <i className="bi bi-cloud-arrow-down-fill" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#083A85] leading-tight flex items-center gap-1.5">
                        <span>Lossless Downloads</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#083A85]/10 text-[#083A85] font-semibold">
                          Original
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Download full-resolution, print-ready photos straight to your device camera roll.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRUST & VERIFICATION STRIP */}
              <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 text-center">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#083A85]">
                  <i className="bi bi-shield-check text-[#F20C8F] text-sm" />
                  Official Connekyt App
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <i className="bi bi-check-circle-fill text-[#083A85] text-xs" />
                  100% Free to Install
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <i className="bi bi-lock-fill text-[#083A85] text-xs" />
                  Private & Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <footer className="no-print w-full py-4 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-4 mb-1">
            <Link href="/" className="hover:text-[#083A85] transition-colors">
              Home
            </Link>
            <span>•</span>
            <Link href="/pages/privacy-policy" className="hover:text-[#083A85] transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/pages/terms" className="hover:text-[#083A85] transition-colors">
              Terms
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Connekyt. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}
