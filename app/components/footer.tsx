'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import {
  FaFacebookF,
  FaLinkedinIn,
  FaXTwitter,
  FaInstagram,
} from 'react-icons/fa6';

export default function Footer() {
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Subscribing email:', email);
    setEmail('');
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
    .subscribe-container { background-color: #d6d6d6; border-radius: 9999px; padding: 0.001rem; box-shadow: 0 8px 12px -2.4px rgba(0, 0, 0, 0.1); }
    .subscribe-form { display: flex; align-items: center; width: 100%; }
    .subscribe-input { width: 100%; padding: 0.44rem 1.2rem; background: transparent; color: #000; border: none; outline: none; font-size: 0.96rem; font-weight: 500; }
    .subscribe-button { background: #103E83; color: white; font-weight: 600; border-radius: 1.6rem; letter-spacing: 0.05em; font-size: 0.9rem; padding: 0.6rem 1.6rem; flex-shrink: 0; cursor: pointer; border: none; transition: background-color 0.2s; }
    .subscribe-button:hover { background-color: #0d3268; }
    .footer-body { background: linear-gradient(to right, #052047, #052047, #103E83); border-radius: 2rem 2rem 0 0; color: white; }
    .footer-content { max-width: 90rem; margin: 0 auto; padding: 3.2rem 3rem 1.6rem; }
    .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr; gap: 4rem; margin-bottom: 4rem; }
    .footer-brand { padding-right: 1.6rem; }
    .footer-logo { display: flex; align-items: center; margin: -1.9rem 0 1.9rem -1rem; cursor: pointer; text-decoration: none; color: inherit; }
    .footer-logo h3 { font-size: 1.6rem; font-weight: 700; margin: -1.9rem 0 0 16px; }
    .footer-logo img { height: 40px; width: 40px; border-radius: 50%; margin: -1.9rem 0 0 -5px; }
    .footer-description { color: #D1D5DB; font-size: 0.96rem; line-height: 1.625; margin-bottom: 2rem; }
    .social-section { margin: 5.4rem 0 -2.2rem; }
    .social-title { color: #D1D5DB; font-size: 1.04rem; display: block; margin-bottom: 0.8rem; }
    .social-links { display: flex; gap: 1.6rem; }
    .social-link { color: #0D99FF; transition: color 0.2s; }
    .social-link:hover { color: white; }
    .social-icon { height: 1.3rem; width: 1.3rem; }
    .footer-section h4 { font-size: 0.96rem; font-weight: 600; margin-bottom: 1.6rem; color: #A1A1A1; }
    .footer-section ul { list-style: none; padding: 0; margin: 0; }
    .footer-section li { margin-bottom: 0.8rem; }
    .footer-link { color: #D1D5DB; font-size: 0.96rem; text-decoration: none; display: block; transition: color 0.2s; }
    .footer-link:hover { color: white; }
    .footer-copyright { border-top: 2.4px solid rgba(255, 255, 255, 0.2); padding-top: 1.6rem; text-align: center; }
    .footer-copyright p { color: #D1D5DB; font-size: 0.96rem; }

    @media (max-width: 1024px) {
      .footer-grid { grid-template-columns: repeat(2, 1fr); gap: 2.5rem; }
      .footer-brand { grid-column: 1 / -1; padding-right: 0; }
      .footer-content { padding: 3.2rem 2rem 1.6rem; }
      .social-section { margin-top: 2rem; }
    }

    @media (max-width: 768px) {
      .footer-container { margin-top: 5rem; }
      .subscribe-wrapper { top: -1.8rem; padding: 0 1rem; max-width: calc(100% - 2rem); }
      .subscribe-input { font-size: 0.875rem; padding: 0.44rem 1rem 0.44rem 0.5rem; }
      .subscribe-button { font-size: 0.8rem; padding: 0.5rem 1rem; }
      .footer-body { border-radius: 1.5rem 1.5rem 0 0; }
      .footer-content { padding: 4rem 1.5rem 1.5rem; }
      .footer-grid { grid-template-columns: 1fr; gap: 2rem; margin-bottom: 2.5rem; }
      .footer-brand { margin-bottom: 1rem; padding-top: 1rem; }
      .footer-logo { margin-bottom: 1rem; }
      .footer-logo h3 { font-size: 1.4rem; }
      .footer-logo img { height: 35px; width: 35px; }
      .footer-description { font-size: 0.875rem; margin-bottom: 1.5rem; }
      .social-section { margin: 1.5rem 0 0; }
      .social-title { font-size: 0.95rem; }
      .social-links { gap: 1.2rem; }
      .social-icon { height: 1.2rem; width: 1.2rem; }
      .footer-section h4 { font-size: 0.9rem; margin-bottom: 1rem; }
      .footer-link { font-size: 0.875rem; }
      .footer-copyright { padding-top: 1.2rem; }
      .footer-copyright p { font-size: 0.875rem; }
    }

    @media (max-width: 480px) {
      .footer-container { margin-top: 5.5rem; }
      .subscribe-wrapper { top: -1.5rem; }
      .subscribe-input { font-size: 0.8rem; padding-left: 0.8rem; }
      .subscribe-button { font-size: 0.75rem; padding: 0.5rem 0.8rem; }
      .footer-content { padding: 4.5rem 1rem 1.5rem; }
      .footer-grid { gap: 1.5rem; }
      .footer-brand { padding-top: 1.5rem; }
      .footer-logo h3 { font-size: 1.25rem; }
      .footer-logo img { height: 30px; width: 30px; }
    }
  `;

  const footerSections = [
    {
      title: t('forClients'),
      links: [
        { text: t('links.findPhotographer'), href: '/user/photographers' },
        { text: t('links.howItWorks'), href: '/#how-it-works', onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleScrollToSection(e, 'how-it-works') },
        { text: t('links.browseEvents'), href: '/user/events' },
      ],
    },
    {
      title: t('forPhotographers'),
      links: [
        { text: t('links.joinPhotographer'), href: '/user/auth/signup-type?type=photographer' },
        { text: t('links.photographerGuide'), href: '/photographer-guide' },
        { text: t('links.portfolioTips'), href: '/portfolio-tips' },
      ],
    },
    {
      title: t('company'),
      links: [
        { text: t('links.aboutUs'), href: '/user/about' },
        { text: t('links.contact'), href: '/user/contact_us' },
        { text: t('links.blog'), href: 'https://www.amoriaglobal.com/' },
      ],
    },
    {
      title: t('support'),
      links: [
        { text: t('links.helpCenter'), href: '/user/help-center' },
        { text: t('links.privacyPolicy'), href: '/user/privacy-policy' },
        { text: t('links.termsOfService'), href: '/user/terms-of-service' },
        { text: t('links.trustSafety'), href: '/user/trust-safety' },
      ],
    },
  ];

  const socialLinks = [
    { icon: FaFacebookF, href: 'https://facebook.com', label: 'Facebook' },
    { icon: FaLinkedinIn, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: FaXTwitter, href: 'https://x.com', label: 'X (Twitter)' },
    { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
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
              <button type="submit" className="subscribe-button">
                {t('subscribe')}
              </button>
            </form>
          </div>
        </div>

        {/* Main Footer Body */}
        <div className="footer-body">
          <div className="footer-content">
            {/* Main Footer Content Grid */}
            <div className="footer-grid">
              {/* Amoria Connekt Section */}
              <div className="footer-brand">
                <Link href="/" className="footer-logo">
                  <h3>Amoria</h3>
                  <img src="/fav.png" alt="AmoriaK Logo" />
                </Link>
                <p className="footer-description">{t('description')}</p>
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
              <p>{t('copyright')}</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
