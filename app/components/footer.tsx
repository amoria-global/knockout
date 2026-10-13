'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React, { useState, useEffect } from 'react';
import {
  FaFacebookF,
  FaLinkedinIn,
  FaXTwitter,
  FaInstagram,
  FaApple,
  FaGooglePlay,
} from 'react-icons/fa6';
import { newsletterSubscribe } from '@/lib/APIs/public';
import { useToast } from '@/lib/notifications/ToastProvider';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/qr/eventQr';
import DotGrid from './DotGrid';

export default function Footer() {
  const t = useTranslations('footer');
  const pathname = usePathname();
  const isLandingPage = pathname === '/' || pathname === '';
  const { success: showSuccess, error: showError, warning: showWarning, isOnline } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubscribing) return;

    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await newsletterSubscribe({ email: email.trim() });
      if (response.success) {
        showSuccess('Subscribed to newsletter successfully!');
        setEmail('');
      } else {
        showError(response.error || 'Failed to subscribe. Please try again.');
      }
    } catch {
      showError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const footerStyles = `
    .footer-container { position: relative; width: 100%; margin-top: 2.8rem; }
    .subscribe-wrapper { position: absolute; top: -1.6rem; left: 50%; transform: translateX(-50%); width: 100%; max-width: 40rem; padding: 0 1.6rem; z-index: 10; }
    .subscribe-container { background-color: #ffffff; border-radius: 14px; padding: 0.001rem; box-shadow: 0 18px 38px -14px rgba(8, 58, 133, 0.45), 0 6px 14px -4px rgba(8, 58, 133, 0.18), 0 0 0 1px rgba(255,255,255,0.6) inset; transition: box-shadow 0.3s ease, transform 0.3s ease; position: relative; overflow: hidden; }
    .subscribe-container::before { content:""; position:absolute; inset:-1px; border-radius:14px; padding:1px; background: linear-gradient(120deg, rgba(15,79,182,0.0), rgba(15,79,182,0.55), rgba(8,58,133,0.55), rgba(15,79,182,0.0)); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0; transition: opacity 0.35s ease; pointer-events:none; }
    .subscribe-container:focus-within { box-shadow: 0 22px 44px -16px rgba(8, 58, 133, 0.55), 0 8px 18px -4px rgba(8, 58, 133, 0.28), 0 0 0 1px rgba(255,255,255,0.7) inset; transform: translateY(-1px); }
    .subscribe-container:focus-within::before { opacity: 1; }
    .subscribe-form { display: flex; align-items: center; width: 100%; }
    .subscribe-input { width: 100%; padding: 0.55rem 1.2rem; background: transparent; color: #0F172A; border: none; outline: none; font-size: 0.96rem; font-weight: 500; }
    .subscribe-input::placeholder { color: #64748B; }
    .subscribe-button { background: linear-gradient(135deg, #0F4FB6 0%, #103E83 55%, #052047 100%); color: white; font-weight: 600; border-radius: 10px; letter-spacing: 0.05em; font-size: 0.9rem; padding: 0.6rem 1.6rem; flex-shrink: 0; cursor: pointer; border: none; transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s; box-shadow: 0 6px 14px -4px rgba(8,58,133,0.45); }
    .subscribe-button:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); box-shadow: 0 10px 20px -6px rgba(8,58,133,0.55), 0 0 0 3px rgba(255,255,255,0.18); }
    .subscribe-button:active:not(:disabled) { transform: translateY(0); }

    .footer-body { background: linear-gradient(to right, #052047, #052047, #103E83); border-radius: 2rem 2rem 0 0; color: white; position: relative; overflow: hidden; }
    .footer-body::before {
      content:""; position:absolute; top:0; left:0; right:0; height:1px;
      background: linear-gradient(90deg, transparent 0%, rgba(15,79,182,0) 8%, rgba(15,79,182,0.7) 32%, rgba(255,255,255,0.95) 50%, rgba(15,79,182,0.7) 68%, rgba(15,79,182,0) 92%, transparent 100%);
      opacity: 0.85; z-index: 4; pointer-events:none;
    }
    .footer-body::after {
      content:""; position:absolute; inset:auto -10% -40% -10%; height: 70%;
      background: radial-gradient(60% 60% at 50% 100%, rgba(8,58,133,0.45), rgba(15,79,182,0.18) 45%, transparent 75%);
      z-index: 0; pointer-events:none; filter: blur(2px);
    }
    .footer-dotgrid { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
    /* Soft fade toward the bottom so the copyright area stays clean */
    .footer-dotgrid { -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0.55) 100%); mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0.55) 100%); }

    /* Ambient drifting particles - pure white + brand-blue, no cyan */
    .footer-particle { position: absolute; width: 4px; height: 4px; border-radius: 50%; pointer-events: none; opacity: 0.55; filter: blur(0.4px); z-index: 1; }
    .footer-particle.p1 { background: rgba(255,255,255,0.7); top: 22%; left: 14%; animation: ftDrift1 14s ease-in-out infinite; }
    .footer-particle.p2 { background: rgba(255,255,255,0.55); top: 68%; left: 8%; animation: ftDrift2 17s ease-in-out infinite; animation-delay: -3s; }
    .footer-particle.p3 { background: rgba(59,130,246,0.7); top: 34%; right: 11%; animation: ftDrift1 16s ease-in-out infinite; animation-delay: -6s; }
    .footer-particle.p4 { background: rgba(255,255,255,0.7); top: 78%; right: 22%; animation: ftDrift2 13s ease-in-out infinite; animation-delay: -2s; }
    .footer-particle.p5 { background: rgba(255,255,255,0.55); top: 50%; left: 48%; animation: ftDrift1 19s ease-in-out infinite; animation-delay: -8s; width:3px; height:3px; }
    @keyframes ftDrift1 { 0%,100% { transform: translate(0,0); opacity:0.45; } 50% { transform: translate(28px,-22px); opacity:0.85; } }
    @keyframes ftDrift2 { 0%,100% { transform: translate(0,0); opacity:0.4; } 50% { transform: translate(-22px,18px); opacity:0.8; } }

    .footer-content { max-width: 90rem; margin: 0 auto; padding: 3.4rem 3rem 1.6rem; position: relative; z-index: 2; }
    .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr; gap: 4rem; margin-bottom: 4rem; }
    .footer-brand { padding-right: 1.6rem; }
    .footer-logo { display: flex; align-items: center; margin: 0 0 1rem 0; cursor: pointer; text-decoration: none; color: inherit; transition: transform 0.3s ease; }
    .footer-logo:hover { transform: translateY(-1px); }
    .footer-logo span { font-weight: 700; }
    .footer-logo img { border-radius: 0; }

    .footer-tagline { font-size: 0.85rem; color: rgba(255,255,255,0.55); margin: 0 0 0.6rem; line-height: 1.5; font-weight: 700; font-family: 'Pragati Narrow', sans-serif; letter-spacing: 0.2px; }
    .footer-tagline-bar { height: 2px; width: 56px; border-radius: 999px; background: linear-gradient(90deg, #083A85 0%, #0F4FB6 50%, #3B82F6 100%); box-shadow: 0 0 14px rgba(15,79,182,0.55); margin-bottom: 1.2rem; }

    .footer-app-section { margin-top: 1.5rem; margin-bottom: 0.5rem; }
    .footer-app-title {
      color: #E2E8F0;
      font-size: 0.96rem;
      font-weight: 700;
      display: block;
      margin-bottom: 0.65rem;
      letter-spacing: 0.3px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
    }
    .footer-app-badges { display: flex; flex-direction: column; gap: 0.6rem; max-width: 200px; }
    .footer-store-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.48rem 0.95rem;
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #ffffff;
      text-decoration: none;
      transition: all 0.25s ease;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .footer-store-badge:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(59, 130, 246, 0.6);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px -4px rgba(15, 79, 182, 0.5), 0 0 12px rgba(59, 130, 246, 0.3);
      color: #ffffff;
    }
    .footer-store-icon { font-size: 1.45rem; flex-shrink: 0; }
    .footer-store-icon.play { font-size: 1.25rem; }
    .footer-store-text { display: flex; flex-direction: column; line-height: 1.15; }
    .footer-store-sub { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8; font-weight: 500; }
    .footer-store-main { font-size: 0.92rem; font-weight: 700; letter-spacing: 0.02em; }

    .social-section { margin: 1.6rem 0 -1rem; }
    .social-title { color: #E2E8F0; font-size: 1.04rem; display: block; margin-bottom: 0.8rem; letter-spacing: 0.3px; text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
    .social-links { display: flex; gap: 1.2rem; }
    .social-link {
      position: relative; display: inline-flex; align-items: center; justify-content: center;
      width: 2.4rem; height: 2.4rem; border-radius: 12px;
      color: rgba(255,255,255,0.72);
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.10);
      transition: color 0.25s ease, transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.3s ease;
      overflow: hidden;
    }
    .social-link::before {
      content:""; position:absolute; inset:-1px; border-radius:12px; padding:1px;
      background: linear-gradient(135deg, #0F4FB6 0%, #3B82F6 50%, #103E83 100%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      opacity: 0; transition: opacity 0.3s ease; pointer-events:none;
    }
    .social-link:hover {
      color: #fff; transform: translateY(-2px);
      background: rgba(255,255,255,0.08);
      border-color: transparent;
      box-shadow: 0 12px 24px -10px rgba(15,79,182,0.45), 0 0 22px -6px rgba(8,58,133,0.45);
    }
    .social-link:hover::before { opacity: 1; }
    .social-icon { height: 1.05rem; width: 1.05rem; position: relative; z-index: 1; }

    .footer-section h4 {
      position: relative;
      font-size: 0.85rem; font-weight: 700; margin-bottom: 1.4rem; color: #CBD5E1;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding-left: 0.85rem;
      text-shadow: 0 1px 2px rgba(0,0,0,0.45);
    }
    .footer-section h4::before {
      content:""; position:absolute; left:0; top:50%; transform: translateY(-50%);
      width: 6px; height: 6px; border-radius: 50%;
      background: linear-gradient(135deg, #0F4FB6, #3B82F6);
      box-shadow: 0 0 8px rgba(15,79,182,0.7);
    }
    .footer-section ul { list-style: none; padding: 0; margin: 0; }
    .footer-section li { margin-bottom: 0.7rem; }
    .footer-link {
      position: relative;
      color: #E2E8F0; font-size: 0.95rem; text-decoration: none;
      display: inline-flex; align-items: center;
      padding: 0.05rem 0;
      transition: color 0.22s ease, transform 0.25s ease, padding-left 0.25s ease;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
    }
    .footer-link::before {
      content:""; position:absolute; left:-0.85rem; top: 50%; transform: translateY(-50%);
      width: 0; height: 1.5px; border-radius: 2px;
      background: linear-gradient(90deg, #0F4FB6, #3B82F6);
      transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 0 8px rgba(15,79,182,0.6);
    }
    .footer-link:hover { color: #fff; padding-left: 0.7rem; }
    .footer-link:hover::before { width: 0.55rem; }

    .footer-copyright {
      position: relative;
      padding-top: 1.6rem; text-align: center;
    }
    .footer-copyright::before {
      content:""; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 100%; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(15,79,182,0.2) 25%, rgba(255,255,255,0.32) 50%, rgba(15,79,182,0.2) 75%, transparent);
    }
    .footer-copyright p { color: #E2E8F0; font-size: 0.95rem; letter-spacing: 0.3px; text-shadow: 0 1px 2px rgba(0,0,0,0.45); }
    .footer-copyright .made-with { color: rgba(255,255,255,0.7); font-size: 0.8rem; margin-top: 0.35rem; display: inline-flex; align-items: center; gap: 0.4rem; text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
    .footer-copyright .made-with .heart { color: #F87171; animation: heartPulse 1.8s ease-in-out infinite; display: inline-block; }
    @keyframes heartPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }

    @media (prefers-reduced-motion: reduce) {
      .footer-particle { animation: none !important; }
      .footer-copyright .made-with .heart { animation: none !important; }
    }

    @media (max-width: 1024px) {
      .footer-grid { grid-template-columns: repeat(2, 1fr); gap: 2.5rem; }
      .footer-brand { grid-column: 1 / -1; padding-right: 0; }
      .footer-content { padding: 3.2rem 2rem 1.6rem; }
      .social-section { margin-top: 2rem; }
    }

    @media (max-width: 768px) {
      .footer-container { margin-top: 4rem; }
      .subscribe-wrapper { top: -1.8rem; padding: 0 1rem; max-width: calc(100% - 2rem); }
      .subscribe-input { font-size: 0.875rem; padding: 0.44rem 1rem 0.44rem 0.5rem; }
      .subscribe-button { font-size: 0.8rem; padding: 0.5rem 1rem; }
      .footer-body { border-radius: 1.5rem 1.5rem 0 0 !important; }
      .footer-content { padding: 3.5rem 1.25rem 1.5rem !important; text-align: center; }
      .footer-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 1.5rem 1rem !important; margin-bottom: 2rem !important; }
      .footer-brand { grid-column: 1 / -1 !important; width: 100% !important; margin-bottom: 1rem !important; padding-top: 0.5rem !important; padding-right: 0 !important; }
      .footer-section { text-align: center; }
      .footer-logo { margin-bottom: 0.75rem !important; justify-content: center !important; margin-left: 0 !important; margin-top: 0 !important; }
      .footer-tagline { font-size: 0.85rem !important; margin-bottom: 0.6rem !important; text-align: center; max-width: 100%; }
      .footer-tagline-bar { margin-left: auto; margin-right: auto; }
      .footer-app-section { margin-top: 1.1rem !important; margin-bottom: 0.5rem !important; text-align: center; }
      .footer-app-title { text-align: center; font-size: 0.9rem !important; }
      .footer-app-badges { flex-direction: row !important; justify-content: center !important; max-width: 100% !important; gap: 0.75rem !important; }
      .footer-store-badge { padding: 0.45rem 0.85rem !important; }
      .social-section { margin: 1rem 0 0 !important; margin-bottom: 0 !important; text-align: center; }
      .social-title { font-size: 0.95rem !important; text-align: center; }
      .social-links { gap: 1rem !important; justify-content: center !important; }
      .social-link { width: 2.2rem !important; height: 2.2rem !important; }
      .social-icon { height: 1rem !important; width: 1rem !important; }
      .footer-section h4 { font-size: 0.85rem !important; margin-bottom: 0.75rem !important; text-align: center; padding-left: 0 !important; }
      .footer-section h4::before { display: none !important; }
      .footer-section ul { text-align: center; }
      .footer-section li { margin-bottom: 0.5rem !important; }
      .footer-link { font-size: 0.875rem !important; text-align: center; padding-left: 0 !important; display: inline; }
      .footer-link::before { display: none !important; }
      .footer-link:hover { padding-left: 0 !important; }
      .footer-copyright { padding-top: 1.25rem !important; margin-top: 0.5rem !important; width: 100% !important; grid-column: 1 / -1 !important; }
      .footer-copyright p { font-size: 0.85rem !important; }
      .footer-particle { display: none !important; }
    }

    @media (max-width: 480px) {
      .footer-container { margin-top: 4.5rem; }
      .subscribe-wrapper { top: -1.5rem; padding: 0 0.75rem; }
      .subscribe-input { font-size: 0.8rem; padding: 0.4rem 0.8rem; }
      .subscribe-button { font-size: 0.75rem; padding: 0.5rem 0.8rem; }
      .footer-content { padding: 3.5rem 1rem 1.5rem !important; }
      .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 1.25rem 0.75rem !important; }
      .footer-brand { padding-top: 1rem !important; margin-bottom: 1rem !important; }
      .footer-logo { justify-content: center !important; }
      .footer-tagline { font-size: 0.78rem !important; line-height: 1.5 !important; padding: 0 0.25rem; }
      .footer-app-badges { flex-direction: row !important; gap: 0.5rem !important; }
      .footer-store-badge { padding: 0.4rem 0.65rem !important; gap: 0.5rem !important; }
      .footer-store-icon { font-size: 1.25rem !important; }
      .footer-store-icon.play { font-size: 1.1rem !important; }
      .footer-store-sub { font-size: 0.52rem !important; }
      .footer-store-main { font-size: 0.8rem !important; }
      .social-section { margin: 1rem 0 0 !important; }
      .social-title { font-size: 0.85rem !important; }
      .social-links { gap: 0.85rem !important; }
      .social-icon { height: 0.95rem !important; width: 0.95rem !important; }
      .footer-section h4 { font-size: 0.8rem !important; margin-bottom: 0.6rem !important; }
      .footer-section li { margin-bottom: 0.4rem !important; }
      .footer-link { font-size: 0.8rem !important; }
      .footer-copyright { padding-top: 1rem !important; }
      .footer-copyright p { font-size: 0.78rem !important; }
    }
  `;

  const footerSections = [
    {
      title: t('forClients'),
      links: [
        { text: t('links.findPhotographer'), href: '/user/photographers' },
        ...(isLandingPage ? [{ text: t('links.howItWorks'), href: '/#how-it-works', onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleScrollToSection(e, 'how-it-works') }] : []),
        { text: t('links.browseEvents'), href: '/user/events' },
        { text: 'Hall of fame', href: '/user/hall-of-fame' },
      ],
    },
    {
      title: t('forPhotographers'),
      links: [
        { text: t('links.joinPhotographer'), href: '/user/auth/signup?userType=Photographer' },
        { text: t('links.photographerGuide'), href: '/user/photographer-guide' },
      ],
    },
    {
      title: t('company'),
      links: [
        { text: t('links.aboutUs'), href: '/user/about' },
        { text: t('links.contact'), href: '/user/contact_us' },
        { text: t('links.blog'), href: 'https://www.amoriaglobal.com/' },
        { text: t('links.donations'), href: '/user/donations' },
      ],
    },
    {
      title: t('support'),
      links: [
        { text: t('links.helpCenter'), href: '/user/help-center' },
        { text: t('links.privacyPolicy'), href: '/user/privacy-policy' },
        { text: t('links.termsOfService'), href: '/user/terms-of-service' },
        { text: t('links.trustSafety'), href: '/user/trust-safety' },
        { text: t('links.deleteAccount'), href: '/user/delete-account' },
      ],
    },
  ];

  const socialLinks = [
    { icon: FaFacebookF, href: 'https://www.facebook.com/search/top?q=amoria%20connekyt', label: 'Facebook' },
    { icon: FaLinkedinIn, href: 'https://www.linkedin.com/in/amoria-connekyt-b73b013b9/', label: 'LinkedIn' },
    { icon: FaXTwitter, href: 'https://x.com/connekyt', label: 'X (Twitter)' },
    { icon: FaInstagram, href: 'https://www.instagram.com/connekyt/', label: 'Instagram' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: footerStyles }} />
      <footer className="footer-container">
        {/* Subscribe Section */}
        <div className="subscribe-wrapper">
          <div className="subscribe-container">
            <form onSubmit={handleSubscribe} className="subscribe-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="subscribe-input"
                required
              />
              <button type="submit" className="subscribe-button" disabled={isSubscribing || !email.trim()} style={{ opacity: isSubscribing || !email.trim() ? 0.6 : 1, cursor: isSubscribing || !email.trim() ? 'not-allowed' : 'pointer' }}>
                {isSubscribing ? 'Subscribing...' : t('subscribe')}
              </button>
            </form>
          </div>
        </div>

      {/* Main Footer Body */}
      <div className="footer-body">
        {/* Interactive DotGrid - 2px dots with 15px gap. Dim brand-blue at rest → bright
            brand-blue on cursor proximity, with GSAP InertiaPlugin push and click shockwave. */}
        <div className="footer-dotgrid" aria-hidden="true">
          <DotGrid
            dotSize={2}
            gap={15}
            baseColor="#1E3A78"
            activeColor="#3B82F6"
            proximity={120}
            shockRadius={180}
            shockStrength={4}
            resistance={750}
            returnDuration={1.4}
          />
        </div>

        {/* Ambient floating particles */}
        <span className="footer-particle p1" aria-hidden="true" />
        <span className="footer-particle p2" aria-hidden="true" />
        <span className="footer-particle p3" aria-hidden="true" />
        <span className="footer-particle p4" aria-hidden="true" />
        <span className="footer-particle p5" aria-hidden="true" />

        <div className="footer-content">
          {/* Main Footer Content Grid */}
          <div className="footer-grid">
            {/* Brand Section */}
            <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <Link href="/" className="footer-logo">
                  <img src="/logo.png" alt="Connekyt Logo" style={{ width: isMobile ? '39px' : '49px', height: isMobile ? '39px' : '49px', objectFit: 'contain', position: 'relative', top: '-1px', left: '-15px', filter: 'drop-shadow(0 0 12px rgba(15,79,182,0.4))' }} />
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: isMobile ? '1.25rem' : '1.3rem', marginLeft: '-20px', letterSpacing: '0.3px' }}>Connekyt</span>
                </Link>
                <p className="footer-tagline">The Smart Way to Capture Life</p>
                <div className="footer-tagline-bar" />

                <div className="footer-app-section">
                  <span className="footer-app-title">{t('getApp')}</span>
                  <div className="footer-app-badges">
                    <a
                      href={APP_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-store-badge"
                      aria-label="Download on Apple App Store"
                    >
                      <FaApple className="footer-store-icon" />
                      <div className="footer-store-text">
                        <span className="footer-store-sub">{t('downloadOn')}</span>
                        <span className="footer-store-main">{t('appStore')}</span>
                      </div>
                    </a>
                    <a
                      href={PLAY_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-store-badge"
                      aria-label="Get it on Google Play"
                    >
                      <FaGooglePlay className="footer-store-icon play" />
                      <div className="footer-store-text">
                        <span className="footer-store-sub">{t('getItOn')}</span>
                        <span className="footer-store-main">{t('googlePlay')}</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
              <div className="social-section">
                <span className="social-title">{t('followUs')}</span>
                <div className="social-links">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="social-link"
                    >
                      <social.icon className="social-icon" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Link Sections */}
            {footerSections.map((section) => (
              <div key={section.title} className="footer-section">
                <h4>{section.title}</h4>
                <ul>
                  {section.links.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        onClick={link.onClick}
                        className="footer-link"
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Copyright Section */}
          <div className="footer-copyright">
            <p>{t('copyright', { year: new Date().getFullYear() })}</p>
            <span className="made-with">
              Crafted by Amoria Global
            </span>
          </div>
        </div>
      </div>
      </footer>
    </>
  );
}
