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
  const [redirectCancelled, setRedirectCancelled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = detectMobilePlatform();
    setPlatform(p);

    // 3s countdown auto-redirect on mobile devices so user can cancel or read
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
            padding: 32px !important;
            border-radius: 20px !important;
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

      <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#F20C8F] selection:text-white relative">
        {/* Top Brand Accent Bar */}
        <div
          className="w-full h-1.5 flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, #083A85 0%, #0F4FB6 45%, #F20C8F 100%)',
          }}
        />

        {/* Minimalist Top Navigation */}
        <header className="no-print w-full max-w-6xl mx-auto px-4 sm:px-8 pt-5 pb-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform active:scale-98"
            aria-label="Connekyt Home"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 border border-slate-200/80 shadow-sm transition-shadow group-hover:shadow-md">
              <img
                src="/logo.png"
                alt="Connekyt Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#083A85] leading-none">
                Connekyt
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Official Client
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#083A85] flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white border border-transparent hover:border-slate-200/70 transition-all"
          >
            <span>Visit Web Platform</span>
            <i className="bi bi-arrow-right text-xs text-[#083A85]" />
          </Link>
        </header>

        {/* PRINT ONLY FLYER */}
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
              Scan with your smartphone camera
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              Instant AI face search across event albums, real-time ceremony streaming, and lock-screen photo alerts.
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
                <span className="text-[#083A85] font-bold">3.</span> Tap the store banner
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

        {/* SCREEN CONTENT */}
        <div className="no-print max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-12">
          {/* 1. HERO & DOWNLOAD STATION */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden relative">
            {/* Subtle top ambient bar */}
            <div
              className="h-1 w-full"
              style={{
                background: 'linear-gradient(90deg, #083A85 0%, #0F4FB6 50%, #F20C8F 100%)',
              }}
            />

            <div className="p-6 sm:p-12">
              <div className="max-w-2xl mx-auto text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#083A85] bg-[#083A85]/8 border border-[#083A85]/15 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#F20C8F]" />
                  <span>
                    {isIos
                      ? 'Connekyt for iOS'
                      : isAndroid
                      ? 'Connekyt for Android'
                      : 'Native iOS & Android Client'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                  Your event moments.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#083A85] via-[#0F4FB6] to-[#F20C8F]">
                    Delivered in real time.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed max-w-xl mx-auto">
                  Powered by on-device biometric search, sub-second ceremony broadcasting, and instant lock-screen photo delivery.
                </p>
              </div>

              {/* ACTION CARD */}
              <div
                className="max-w-xl mx-auto rounded-2xl p-5 sm:p-6 mb-4 border border-slate-200/90 bg-slate-50/70"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 20px -2px rgba(8, 58, 133, 0.06)',
                }}
              >
                {/* 1.1 iOS View */}
                {isIos && (
                  <div className="space-y-3.5">
                    {!redirectCancelled && countdown > 0 && (
                      <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs text-[#083A85] shadow-xs">
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

                    <a
                      href={APP_STORE_URL}
                      className="flex items-center justify-center gap-3.5 w-full text-white py-3.5 sm:py-4 px-6 rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-xl active:scale-[0.99] cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                        boxShadow: '0 6px 20px -2px rgba(8, 58, 133, 0.35)',
                      }}
                    >
                      <FaApple className="text-2xl sm:text-3xl flex-shrink-0" />
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-wider opacity-85 leading-none">
                          Download on the
                        </div>
                        <div className="text-base sm:text-lg font-bold leading-tight">
                          Apple App Store
                        </div>
                      </div>
                    </a>

                    <a
                      href="connekt://"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#083A85] bg-white border border-slate-200 hover:border-[#083A85]/30 hover:bg-slate-50 transition-all"
                    >
                      <i className="bi bi-box-arrow-up-right text-xs text-[#F20C8F]" />
                      <span>Already installed? Open Connekyt App</span>
                    </a>

                    <div className="text-center pt-0.5">
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

                {/* 1.2 Android View */}
                {isAndroid && (
                  <div className="space-y-3.5">
                    {!redirectCancelled && countdown > 0 && (
                      <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs text-[#083A85] shadow-xs">
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

                    <a
                      href={PLAY_STORE_URL}
                      className="flex items-center justify-center gap-3.5 w-full text-white py-3.5 sm:py-4 px-6 rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-xl active:scale-[0.99] cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
                        boxShadow: '0 6px 20px -2px rgba(8, 58, 133, 0.35)',
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

                    <a
                      href="connekt://"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#083A85] bg-white border border-slate-200 hover:border-[#083A85]/30 hover:bg-slate-50 transition-all"
                    >
                      <i className="bi bi-box-arrow-up-right text-xs text-[#F20C8F]" />
                      <span>Already installed? Open Connekyt App</span>
                    </a>

                    <div className="text-center pt-0.5">
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

                {/* 1.3 Desktop / Tablet View */}
                {!isMobile && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                      {/* Left: Vector QR Code */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <QrCodeSvg value={GET_APP_PAGE_URL} size={152} fgColor="#083A85" />
                        <span className="text-[11px] font-bold text-[#083A85] mt-2.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-slate-200 shadow-xs">
                          <i className="bi bi-camera text-xs text-[#F20C8F]" />
                          Scan with phone camera
                        </span>
                      </div>

                      {/* Right: Dual Store Badges */}
                      <div className="flex-1 w-full flex flex-col justify-center gap-2.5">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F20C8F]" />
                          Install directly to your device
                        </div>

                        <a
                          href={APP_STORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 w-full text-white py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
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

                        <a
                          href={PLAY_STORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 w-full text-white py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)',
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

                    <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#083A85] hover:border-[#083A85]/30 font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        <i className={`bi ${copiedLink ? 'bi-check2-circle text-[#F20C8F]' : 'bi-link-45deg'}`} />
                        <span>{copiedLink ? 'Link copied!' : 'Copy download link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#083A85] hover:border-[#083A85]/30 font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        <i className="bi bi-printer text-[#083A85]" />
                        <span>Print venue flyer / stand</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Spec Strip */}
              <div className="text-center">
                <span className="text-xs text-slate-500 font-medium">
                  Compatible with iOS 15.0+ and Android 8.0+ • Free native client
                </span>
              </div>
            </div>
          </div>

          {/* 2. SENIOR-CRAFTED CORE CAPABILITIES BENTO GRID */}
          <section className="space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#083A85] bg-[#083A85]/8 px-3 py-1 rounded-full border border-[#083A85]/15">
                FLAGSHIP CAPABILITIES
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                Built to eliminate gallery fatigue
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                Four dedicated technologies designed to find, stream, and preserve your milestone moments.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* BENTO CARD 1: AI FACIAL RECOGNITION */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#083A85]/30 hover:shadow-md transition-all duration-300">
                {/* Visual Viewfinder Mockup */}
                <div className="relative h-56 sm:h-64 bg-slate-900 overflow-hidden">
                  <img
                    src="/scan.png"
                    alt="AI Facial Recognition Scan Preview"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Scanner HUD Elements */}
                  <div className="absolute inset-4 sm:inset-5 flex flex-col justify-between pointer-events-none">
                    <div className="flex items-center justify-between text-[11px] text-white/90">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 font-mono text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        BIOMETRIC SCAN ACTIVE
                      </span>
                      <span className="font-mono text-[10px] text-white/70 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded">
                        LATENCY 0.28s
                      </span>
                    </div>

                    {/* Viewfinder Target Reticle */}
                    <div className="self-center w-28 h-28 border-2 border-dashed border-white/50 rounded-2xl relative flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
                      <i className="bi bi-crosshair text-white/40 text-xl" />
                    </div>

                    {/* Match confirmation pill */}
                    <div className="self-center bg-white/95 backdrop-blur-md text-slate-900 px-3.5 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-2 text-xs font-bold">
                      <i className="bi bi-check-circle-fill text-emerald-600 text-sm" />
                      <span>18 Photos Matched • 99.8% Precision</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-md bg-[#083A85]/10 text-[#083A85] flex items-center justify-center text-xs">
                      <i className="bi bi-person-bounding-box" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#083A85]">
                      On-Device Facial Search
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Instant Face Match
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Never sift through 3,000+ mixed event photos again. One reference selfie prompts our neural engine to isolate every photo of you across all photographers in milliseconds.
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Sub-400ms Match</span>
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Multi-Angle Tolerance</span>
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Zero Cloud Selling</span>
                  </div>
                </div>
              </div>

              {/* BENTO CARD 2: REAL-TIME LIVE STREAMING */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#F20C8F]/30 hover:shadow-md transition-all duration-300">
                {/* Visual Live Stream Mockup */}
                <div className="relative h-56 sm:h-64 bg-slate-900 overflow-hidden">
                  <img
                    src="/live.png"
                    alt="Live Stream Player Preview"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Broadcast HUD */}
                  <div className="absolute inset-4 sm:inset-5 flex flex-col justify-between pointer-events-none">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white font-bold text-[10px] tracking-wider uppercase shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE • 1080p
                      </span>
                      <span className="font-mono text-[10px] text-white/80 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1">
                        <i className="bi bi-eye-fill text-[9px]" /> 1,420 Watching
                      </span>
                    </div>

                    {/* Chat Bubble & Floating Gift */}
                    <div className="space-y-2 max-w-[85%]">
                      <div className="bg-black/60 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-xl border border-white/10 inline-flex items-center gap-2">
                        <span className="font-bold text-[#F20C8F]">Claire M.:</span>
                        <span className="opacity-90">Congratulations to the newlyweds! 💍</span>
                      </div>
                      <div className="bg-linear-to-r from-[#F20C8F]/80 to-[#0F4FB6]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-sm">
                        <span>✨ Gift: Golden Bouquet (500 Credits)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-md bg-[#F20C8F]/10 text-[#F20C8F] flex items-center justify-center text-xs">
                      <i className="bi bi-broadcast" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#F20C8F]">
                      Sub-Second WHEP Engine
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Ceremony Live Streaming
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Distance shouldn't keep loved ones from celebrating. Family across the world can join weddings, galas, and milestones in broadcast quality with live audio, chat, and virtual gifting.
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Sub-Second Delay</span>
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Interactive Chat</span>
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Virtual Gifting</span>
                  </div>
                </div>
              </div>

              {/* BENTO CARD 3: LOCK SCREEN PUSH ALERTS */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#0F4FB6]/30 hover:shadow-md transition-all duration-300">
                {/* Visual Lock Screen Notification Mockup */}
                <div className="relative h-48 sm:h-52 bg-slate-950 p-5 flex flex-col justify-center items-center">
                  <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 shadow-2xl">
                    <div className="flex items-center justify-between text-[10px] text-white/70 mb-1.5 font-medium">
                      <div className="flex items-center gap-1.5">
                        <img src="/logo.png" alt="Connekyt" className="w-3.5 h-3.5 object-contain" />
                        <span className="font-bold text-white uppercase tracking-wider text-[9px]">CONNEKYT</span>
                      </div>
                      <span>Just now</span>
                    </div>
                    <div className="text-xs font-bold text-white">Sarah & Alex's Wedding</div>
                    <div className="text-[11px] text-white/80 mt-0.5 leading-snug">
                      Photographer David published 8 new photos of you.
                    </div>
                    <div className="mt-2 text-[10px] font-semibold text-[#F20C8F] inline-flex items-center gap-1">
                      <span>View in Camera Roll</span>
                      <i className="bi bi-arrow-right" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-md bg-[#0F4FB6]/10 text-[#0F4FB6] flex items-center justify-center text-xs">
                      <i className="bi bi-bell-fill" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F4FB6]">
                      Lock Screen Push
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Instant Photo Alerts
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Forget waiting weeks for an email link. The minute your event photographer finishes grading and uploads a batch, your phone notifies you immediately with full-resolution access.
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Direct APNs/FCM</span>
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Background Sync</span>
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">No Email Clutter</span>
                  </div>
                </div>
              </div>

              {/* BENTO CARD 4: LOSSLESS CAMERA ORIGINALS */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#083A85]/30 hover:shadow-md transition-all duration-300">
                {/* Visual Asset Inspector Mockup */}
                <div className="relative h-48 sm:h-52 bg-slate-900 overflow-hidden flex items-center justify-center p-5">
                  <img
                    src="/gallery.png"
                    alt="Original Photo Asset Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  <div className="relative z-10 bg-black/60 backdrop-blur-md border border-white/15 rounded-xl p-3 text-white max-w-xs w-full space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
                      <span>FILE INSPECTOR</span>
                      <span className="text-emerald-400 font-bold">LOSSLESS RAW</span>
                    </div>
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Resolution: 6000 × 4000</span>
                      <span className="text-[11px] font-mono text-white/90">48.2 MP</span>
                    </div>
                    <div className="text-[10px] text-white/70">Color: Adobe RGB (1998) • 14-Bit</div>
                    <div className="pt-1 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                      <i className="bi bi-check2" /> Ready for Large-Format Fine Art Print
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-md bg-[#083A85]/10 text-[#083A85] flex items-center justify-center text-xs">
                      <i className="bi bi-cloud-arrow-down-fill" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#083A85]">
                      Studio Quality Exports
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Lossless Camera Originals
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Messaging apps aggressively compress pictures down to blurry previews. Connekyt transfers original studio camera files straight to your device camera roll with full EXIF data.
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Zero Compression</span>
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Original EXIF</span>
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">Direct Camera Roll</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. SENIOR COMPARISON TABLE: WEB VS. MOBILE APP */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-10">
            <div className="max-w-xl mx-auto text-center mb-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#083A85]">
                WHY INSTALL THE APP?
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                Web Gallery vs. Connekyt Mobile
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                The web platform is great for discovery, but the native app is engineered for speed and quality.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4">Standard Web View</th>
                    <th className="py-3 px-4 text-[#083A85] font-bold">Connekyt Mobile App</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Finding Your Photos</td>
                    <td className="py-3 px-4 text-slate-500">Manual scrolling through 2,000+ photos</td>
                    <td className="py-3 px-4 text-[#083A85] font-semibold flex items-center gap-1.5">
                      <i className="bi bi-check-circle-fill text-emerald-600 text-xs" />
                      1-Tap Instant AI Face Match (0.3s)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">New Photo Updates</td>
                    <td className="py-3 px-4 text-slate-500">Periodic email check / manual refresh</td>
                    <td className="py-3 px-4 text-[#083A85] font-semibold flex items-center gap-1.5">
                      <i className="bi bi-check-circle-fill text-emerald-600 text-xs" />
                      Instant Lock-Screen Push Notifications
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Live Ceremonies</td>
                    <td className="py-3 px-4 text-slate-500">Standard latency player</td>
                    <td className="py-3 px-4 text-[#083A85] font-semibold flex items-center gap-1.5">
                      <i className="bi bi-check-circle-fill text-emerald-600 text-xs" />
                      Sub-second WHEP, live reactions & gifting
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Download Quality</td>
                    <td className="py-3 px-4 text-slate-500">Web-compressed resolution</td>
                    <td className="py-3 px-4 text-[#083A85] font-semibold flex items-center gap-1.5">
                      <i className="bi bi-check-circle-fill text-emerald-600 text-xs" />
                      Print-ready 48MP original camera files
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. PRIVACY & SECURITY BY DESIGN */}
          <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-mono mb-4 border border-white/15">
                <i className="bi bi-shield-lock-fill text-[#F20C8F]" />
                <span>BIOMETRIC PRIVACY ARCHITECTURE</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Your face data stays yours. Always.
              </h3>
              <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
                Connekyt uses mathematical facial vectors computed directly on your device. Your reference selfie is never shared, never sold to advertisers, and never used to train third-party generative models.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <i className="bi bi-check2 text-emerald-400 text-base flex-shrink-0" />
                  <span>On-device facial vectorization</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="bi bi-check2 text-emerald-400 text-base flex-shrink-0" />
                  <span>TLS 1.3 encrypted transmission</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="bi bi-check2 text-emerald-400 text-base flex-shrink-0" />
                  <span>Apple & Google Store notarized</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Minimal Footer */}
        <footer className="no-print w-full py-6 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white mt-12">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link href="/" className="hover:text-[#083A85] transition-colors font-medium">
              Home
            </Link>
            <span>•</span>
            <Link href="/pages/privacy-policy" className="hover:text-[#083A85] transition-colors font-medium">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/pages/terms" className="hover:text-[#083A85] transition-colors font-medium">
              Terms of Service
            </Link>
          </div>
          <p className="text-slate-400">© {new Date().getFullYear()} Connekyt. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}
