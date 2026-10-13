'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaApple, FaGooglePlay } from 'react-icons/fa6';
import { APP_STORE_URL, PLAY_STORE_URL, GET_APP_PAGE_URL, detectMobilePlatform } from '@/lib/qr/eventQr';
import QrCodeSvg from '../components/QrCodeSvg';

export default function GetAppPage(): React.JSX.Element {
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null);

  useEffect(() => {
    const p = detectMobilePlatform();
    setPlatform(p);
    // Instant redirect on mobile devices to the respective store
    if (p === 'ios') {
      window.location.href = APP_STORE_URL;
    } else if (p === 'android') {
      window.location.href = PLAY_STORE_URL;
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center">
        {/* Brand Logo */}
        <div className="flex justify-center mb-5">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 60%, #F20C8F 100%)',
              boxShadow: '0 12px 30px rgba(8, 58, 133, 0.35)',
            }}
          >
            C
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          Get Connekyt App
        </h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          The smart way to find event photos, stream live ceremonies, and get instant updates.
        </p>

        {platform === 'ios' ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium">Redirecting to Apple App Store...</p>
            <a
              href={APP_STORE_URL}
              className="flex items-center justify-center gap-3 w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-3.5 px-6 rounded-2xl font-bold transition-all shadow-md"
            >
              <FaApple className="text-2xl" />
              <span>Open in App Store</span>
            </a>
          </div>
        ) : platform === 'android' ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium">Redirecting to Google Play...</p>
            <a
              href={PLAY_STORE_URL}
              className="flex items-center justify-center gap-3 w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-3.5 px-6 rounded-2xl font-bold transition-all shadow-md"
            >
              <FaGooglePlay className="text-xl" />
              <span>Open in Google Play</span>
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <QrCodeSvg value={GET_APP_PAGE_URL} size={160} />
              <span className="text-xs font-semibold text-slate-600 mt-2.5 inline-flex items-center gap-1.5">
                <i className="bi bi-camera text-sm text-[#083A85]" />
                Scan with your phone to download
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white py-3 px-4 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <FaApple className="text-lg" />
                <span>App Store</span>
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white py-3 px-4 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <FaGooglePlay className="text-base" />
                <span>Google Play</span>
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 pt-5 border-t border-slate-100">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-[#083A85] font-semibold transition-colors"
          >
            ← Return to Connekyt Home
          </Link>
        </div>
      </div>
    </main>
  );
}
