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
    <footer style={{ position: 'relative', width: '100%', marginTop: '2.8rem' }}>
      {/* Subscribe Section */}
      <div
        style={{
          position: 'absolute',
          top: '-1.6rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '40rem',
          paddingLeft: '1.6rem',
          paddingRight: '1.6rem',
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: '#d6d6d6',
            borderRadius: '9999px',
            padding: '0.001rem',
            boxShadow: '0 8px 12px -2.4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <form
            onSubmit={handleSubscribe}
            style={{ display: 'flex', alignItems: 'center', width: '100%' }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              style={{
                width: '100%',
                paddingLeft: '1.2rem',
                paddingRight: '1.2rem',
                paddingTop: '0.44rem',
                paddingBottom: '0.44rem',
                backgroundColor: 'transparent',
                color: '#000000',
                border: 'none',
                outline: 'none',
                fontSize: '0.96rem',
                fontWeight: 500
              }}
              required
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#103E83',
                color: 'white',
                fontWeight: 600,
                borderRadius: '1.6rem',
                letterSpacing: '0.05em',
                fontSize: '0.9rem',
                paddingLeft: '1.6rem',
                paddingRight: '1.6rem',
                paddingTop: '0.6rem',
                paddingBottom: '0.6rem',
                flexShrink: 0,
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0d3268')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#103E83')}
            >
              {t('subscribe')}
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Body */}
      <div
        style={{
          background: 'linear-gradient(to right, #052047, #052047, #103E83)',
          borderTopLeftRadius: '2rem',
          borderTopRightRadius: '2rem',
          color: 'white',
        }}
      >
        <div
          style={{
            maxWidth: '90rem',
            margin: '0 auto',
            paddingLeft: '3rem',
            paddingRight: '3rem',
            paddingTop: '3.2rem',
            paddingBottom: '1.6rem',
          }}
        >
          {/* Main Footer Content Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
              gap: '4rem',
              marginBottom: '4rem',
            }}
          >
            {/* Amoria Connekt Section */}
            <div style={{ paddingRight: '1.6rem' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.9rem', marginLeft: '-1rem', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>             
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginLeft: '16px', marginTop: '-1.9rem' }}>
                  Amoria
                </h3>
                <img src="/fav.png" alt="AmoriaK Logo" style={{ height: '40px', width: '40px', borderRadius: '9999px', marginTop: '-1.9rem', marginLeft: '-5px' }} />
              </Link>
              <p
                style={{
                  color: '#D1D5DB',
                  fontSize: '0.96rem',
                  lineHeight: '1.625',
                  marginBottom: '2rem',
                }}
              >
                {t('description')}
              </p>
              <div style={{ marginTop: '5.4rem', marginBottom: '-2.2rem' }}>
                <span style={{ color: '#D1D5DB', fontSize: '1.04rem', display: 'block', marginBottom: '0.8rem', gap: '2.4rem' }}>
                  {t('followUs')}
                </span>
                <div style={{ display: 'flex', gap: '1.6rem' }}>
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      style={{ color: '#0D99FF', transition: 'color 0.2s' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'white')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#0D99FF')}
                    >
                      <social.icon style={{ height: '1.3rem', width: '1.3rem' }} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Link Sections */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 600, marginBottom: '1.6rem', color: '#A1A1A1' }}>
                  {section.title}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {section.links.map((link, index) => (
                    <li key={index} style={{ marginBottom: '0.8rem' }}>
                      <a
                        href={link.href}
                        onClick={link.onClick}
                        style={{
                          color: '#D1D5DB',
                          fontSize: '0.96rem',
                          textDecoration: 'none',
                          display: 'block',
                          transition: 'color 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = 'white')}
                        onMouseOut={(e) => (e.currentTarget.style.color = '#D1D5DB')}
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
          <div
            style={{
              borderTop: '2.4px solid rgba(255, 255, 255, 0.2)',
              paddingTop: '1.6rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#D1D5DB', fontSize: '0.96rem' }}>
              {t('copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

