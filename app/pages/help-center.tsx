'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import DotGrid from '../components/DotGrid';
import { useRouter } from 'next/navigation';
import { contactUs } from '@/lib/APIs/public/contact-us/route';
import { getFAQs as fetchFAQsFromApi } from '@/lib/APIs/public/get-faqs/route';

// Local types (no backend imports)
type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: string;
  helpful: number;
  notHelpful: number;
  userVote: 'yes' | 'no' | null;
  lastUpdated: Date;
  tags: string[];
};



const categories = [
  {
    id: 'account',
    name: 'My Account',
    icon: 'bi-person-circle',
    articles: 12,
    description: 'Manage your account settings',
    gradient: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 50%, #3B82F6 100%)',
    glow: 'rgba(59,130,246,0.45)',
    tint: '#3B82F6',
    tagline: 'Profile & Identity',
  },
  {
    id: 'payment',
    name: 'Payment',
    icon: 'bi-credit-card',
    articles: 8,
    description: 'Payment and billing information',
    gradient: 'linear-gradient(135deg, #047857 0%, #10B981 60%, #34D399 100%)',
    glow: 'rgba(16,185,129,0.45)',
    tint: '#10B981',
    tagline: 'Billing & Earnings',
  },
  {
    id: 'security',
    name: 'Security',
    icon: 'bi-shield-check',
    articles: 6,
    description: 'Keep your account secure',
    gradient: 'linear-gradient(135deg, #7C2D12 0%, #DC2626 60%, #EF4444 100%)',
    glow: 'rgba(239,68,68,0.45)',
    tint: '#EF4444',
    tagline: 'Trust & Safety',
  },
  {
    id: 'payment-methods',
    name: 'Payment Methods',
    icon: 'bi-wallet2',
    articles: 5,
    description: 'Available payment options',
    gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 60%, #FBBF24 100%)',
    glow: 'rgba(245,158,11,0.45)',
    tint: '#F59E0B',
    tagline: 'Wallets & Cards',
  },
  {
    id: 'booking',
    name: 'Booking',
    icon: 'bi-calendar-check',
    articles: 10,
    description: 'Book and manage photographers',
    gradient: 'linear-gradient(135deg, #6B21A8 0%, #B83AB6 50%, #EC4899 100%)',
    glow: 'rgba(184,58,182,0.45)',
    tint: '#B83AB6',
    tagline: 'Sessions & Events',
  },
  {
    id: 'technical',
    name: 'Technical Support',
    icon: 'bi-gear',
    articles: 7,
    description: 'Technical help and support',
    gradient: 'linear-gradient(135deg, #1E3A8A 0%, #4F46E5 60%, #818CF8 100%)',
    glow: 'rgba(99,102,241,0.45)',
    tint: '#6366F1',
    tagline: 'Bugs & Performance',
  },
];


const HelpSupportCenter: React.FC = () => {
  const router = useRouter();

  // Hero ref kept for any future scroll/measure use; mouse-spotlight state removed
  // since the new DotGrid component handles cursor tracking internally.
  const heroRef = React.useRef<HTMLDivElement>(null);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Data states
  const [FAQS, setFAQS] = useState<FAQ[]>([]);

  // Fetch FAQs from API (fallback to mockFAQs)
  useEffect(() => {
    fetchFAQsFromApi().then(response => {
      if (response.success && response.data) {
        const rawData = response.data as unknown as Record<string, unknown>;
        const faqs = rawData?.data
          ? (rawData.data as FAQ[])
          : Array.isArray(response.data)
            ? (response.data as unknown as FAQ[])
            : [];
        if (faqs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFAQS(faqs.map((f: any) => ({
            id: f.id || '',
            question: f.question || '',
            answer: f.answer || '',
            category: f.category || 'General',
            // Backend sends priority as number (1=high, 2=medium, 3=low)
            priority: f.priority === 1 ? 'high' : f.priority === 2 ? 'medium' : f.priority === 3 ? 'low' : (f.priority || 'medium'),
            helpful: f.helpfulCount ?? f.helpful ?? 0,
            notHelpful: f.notHelpfulCount ?? 0,
            userVote: f.userVote ?? null,
            lastUpdated: f.updatedAt ? new Date(f.updatedAt) : f.lastUpdated ? new Date(f.lastUpdated) : new Date(),
            tags: f.tags || [],
          })));
        }
      }
    }).catch(() => {});
  }, []);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    loading: false
  });

  // Filter FAQs
  const filteredFAQs = useMemo(() => {
    let filtered = [...FAQS];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(faq =>
        faq.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory
      );
    }

    return filtered;
  }, [FAQS, searchTerm, selectedCategory]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by filteredFAQs
  };

  const handleFAQClick = (faqId: string) => {
    setOpenFAQs(prev => {
      const next = new Set(prev);
      if (next.has(faqId)) next.delete(faqId);
      else next.add(faqId);
      return next;
    });
  };

  const handleFAQVote = async (faqId: string, vote: 'yes' | 'no') => {
    const faq = FAQS.find(f => f.id === faqId);
    if (!faq || faq.userVote) return; // already voted

    // Optimistic update
    setFAQS(prev => prev.map(f =>
      f.id === faqId
        ? {
            ...f,
            userVote: vote,
            helpful: vote === 'yes' ? f.helpful + 1 : f.helpful,
            notHelpful: vote === 'no' ? f.notHelpful + 1 : f.notHelpful,
          }
        : f
    ));

    try {
      const res = await fetch(`/api/remote/public/faqs/${faqId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      });
      const result = await res.json();
      if (result?.data) {
        // Sync with backend response
        setFAQS(prev => prev.map(f =>
          f.id === faqId
            ? {
                ...f,
                helpful: result.data.helpfulCount ?? f.helpful,
                notHelpful: result.data.notHelpfulCount ?? f.notHelpful,
                userVote: result.data.vote ?? vote,
              }
            : f
        ));
      }
    } catch {
      // Revert on failure
      setFAQS(prev => prev.map(f =>
        f.id === faqId
          ? {
              ...f,
              userVote: null,
              helpful: vote === 'yes' ? Math.max(0, f.helpful - 1) : f.helpful,
              notHelpful: vote === 'no' ? Math.max(0, f.notHelpful - 1) : f.notHelpful,
            }
          : f
      ));
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;

    setContactForm(prev => ({ ...prev, loading: true }));

    try {
      const response = await contactUs({
        fullName: contactForm.name,
        email: contactForm.email,
        phone: '',
        subject: contactForm.subject,
        message: contactForm.message,
      });

      if (response.success) {
        setContactForm({ name: '', email: '', subject: '', message: '', loading: false });
        setSuccessMessage('Message sent successfully! We\'ll get back to you soon.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setContactForm(prev => ({ ...prev, loading: false }));
        setSuccessMessage(response.error || 'Failed to send message. Please try again.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch {
      setContactForm(prev => ({ ...prev, loading: false }));
      setSuccessMessage('Failed to send message. Please try again.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    // Map category IDs to help page routes
    const routeMap: Record<string, string> = {
      'account': '/user/help/my-account',
      'payment': '/user/help/payment',
      'security': '/user/help/security',
      'payment-methods': '/user/help/payment-methods',
      'booking': '/user/help/booking',
      'technical': '/user/help/technical-support'
    };

    const route = routeMap[categoryId];
    if (route) {
      router.push(route);
    }
  };


  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />

      {/* Hero Section with Search - premium redesign */}
      <style>{`
        @keyframes hcStarTwinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes hcDotPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.85); } }
        @keyframes hcAuroraDrift {
          0%,100% { transform: translateX(0) skewX(-6deg); opacity: 0.7; }
          50%     { transform: translateX(20px) skewX(-3deg); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hc-star, .hc-aurora, .hc-dot-pulse { animation: none !important; }
        }
      `}</style>
      <div
        ref={heroRef}
        style={{
          position: 'relative',
          paddingTop: isMobile ? 'clamp(5rem, 12vw, 7rem)' : '7rem',
          paddingBottom: isMobile ? 'clamp(3rem, 6vw, 4rem)' : '4rem',
          paddingLeft: isMobile ? 'clamp(1rem, 4vw, 1.5rem)' : '1rem',
          paddingRight: isMobile ? 'clamp(1rem, 4vw, 1.5rem)' : '1rem',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #03152F 0%, #052047 30%, #083A85 70%, #0F4FB6 100%)',
        }}
      >
        {/* Interactive DotGrid - same brand pattern as the rest of the site */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
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

        {/* Aurora ribbon */}
        <div className="hc-aurora" aria-hidden="true" style={{
          position: 'absolute',
          top: '20%', left: '-10%', right: '-10%', height: '14%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(125,211,252,0.18) 25%, rgba(168,85,247,0.20) 50%, rgba(236,72,153,0.18) 75%, transparent 100%)',
          filter: 'blur(40px)',
          pointerEvents: 'none', zIndex: 1,
          animation: 'hcAuroraDrift 18s ease-in-out infinite',
        }} />

        {/* Soft brand orbs */}
        <div aria-hidden="true" style={{ position: 'absolute', top: '8%', left: '6%', width: 280, height: 280, background: 'radial-gradient(circle, rgba(96,165,250,0.22) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(48px)', pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: '8%', right: '6%', width: 320, height: 320, background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />

        {/* Twinkling stars */}
        {[
          { l: '12%', t: '14%', d: 0,    big: false },
          { l: '32%', t: '8%',  d: 1.2,  big: true  },
          { l: '58%', t: '18%', d: 2.4,  big: false },
          { l: '78%', t: '12%', d: 0.8,  big: true  },
          { l: '20%', t: '34%', d: 1.6,  big: false },
          { l: '82%', t: '38%', d: 2.8,  big: false },
          { l: '8%',  t: '60%', d: 0.4,  big: false },
          { l: '46%', t: '76%', d: 1.1,  big: true  },
          { l: '64%', t: '88%', d: 2.6,  big: false },
          { l: '94%', t: '60%', d: 1.9,  big: false },
        ].map((s, i) => (
          <span
            key={i}
            className={`hc-star${s.big ? ' lg' : ''}`}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: s.l, top: s.t,
              width: s.big ? 3 : 2,
              height: s.big ? 3 : 2,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: s.big ? '0 0 8px rgba(255,255,255,0.95)' : '0 0 4px rgba(255,255,255,0.85)',
              opacity: 0.5,
              animation: `hcStarTwinkle 4.2s ease-in-out ${s.d}s infinite`,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        ))}

        <div style={{
          position: 'relative',
          maxWidth: '56rem',
          margin: '0 auto',
          padding: isMobile ? '0 0.5rem' : '0 1rem',
          textAlign: 'center',
          zIndex: 2,
        }}>
          {/* Eyebrow pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '7px 16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 999,
            backdropFilter: 'blur(12px)',
            marginBottom: 18,
          }}>
            <span className="hc-dot-pulse" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'linear-gradient(135deg, #C084FC, #EC4899)',
              boxShadow: '0 0 10px rgba(236,72,153,0.7)',
              animation: 'hcDotPulse 1.6s ease-in-out infinite',
            }} />
            <span style={{ color: '#F5EBFF', fontSize: 11, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase' }}>
              Connekyt Help Center
            </span>
            <span style={{ color: '#EC4899', fontSize: 12 }}>✦</span>
          </div>

          <h1 style={{
            fontSize: isMobile ? 'clamp(1.75rem, 7vw, 2.6rem)' : 'clamp(2.4rem, 5.4vw, 3.6rem)',
            fontWeight: 300,
            color: 'white',
            marginBottom: '10px',
            lineHeight: '1.05',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            letterSpacing: '-0.02em',
            textShadow: '0 4px 30px rgba(0,0,0,0.45), 0 0 40px rgba(168,85,247,0.20)',
          }}>
            How can we{' '}
            <span style={{
              fontWeight: 600, fontStyle: 'italic',
              background: 'linear-gradient(90deg, #ffffff 0%, #C084FC 55%, #EC4899 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              paddingRight: '0.12em',
            }}>help you</span> today?
          </h1>
          <p style={{
            fontSize: 'clamp(13px, 1.3vw, 16px)',
            color: 'rgba(255,255,255,0.65)',
            marginBottom: isMobile ? 'clamp(1.25rem, 5vw, 2rem)' : '2rem',
            maxWidth: 540,
            margin: isMobile ? '0 auto clamp(1.25rem, 5vw, 2rem)' : '0 auto 2rem',
            lineHeight: 1.7,
          }}>
            Search 50+ articles, get answers from our team, or jump straight into a live conversation.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ maxWidth: '42rem', margin: '0 auto', width: '100%' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={isMobile ? "Search..." : "Search for articles..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile
                    ? '0.75rem 2.5rem 0.75rem 1rem'
                    : '0.8rem 3rem 0.8rem 1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: isMobile ? '0.75rem' : '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(calc(-50% - 2px))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%)'; }}
              >
                <i className="bi bi-search"></i>
              </button>

              {/* Live search dropdown */}
              {searchTerm.trim() && filteredFAQs.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(8, 58, 133, 0.1)',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  zIndex: 10,
                  textAlign: 'left',
                }}>
                  {filteredFAQs.slice(0, 6).map((faq) => (
                    <div
                      key={faq.id}
                      onClick={() => {
                        setOpenFAQs(prev => new Set(prev).add(faq.id));
                        setSearchTerm('');
                        document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f4f8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                    >
                      <i className="bi bi-question-circle" style={{ fontSize: '16px', color: '#083A85', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', lineHeight: 1.4 }}>
                          {faq.question}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {faq.category}
                        </div>
                      </div>
                      <i className="bi bi-arrow-right" style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }} />
                    </div>
                  ))}
                  {filteredFAQs.length > 6 && (
                    <div style={{
                      padding: '10px 16px',
                      textAlign: 'center',
                      fontSize: '13px',
                      color: '#083A85',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                      onClick={() => {
                        document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f4f8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                    >
                      View all {filteredFAQs.length} results
                    </div>
                  )}
                </div>
              )}

              {/* No results message */}
              {searchTerm.trim() && filteredFAQs.length === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                  padding: '20px 16px',
                  textAlign: 'center',
                  zIndex: 10,
                }}>
                  <i className="bi bi-search" style={{ fontSize: '20px', color: '#9ca3af', marginBottom: '8px', display: 'block' }} />
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>No results found for "<strong>{searchTerm}</strong>"</div>
                </div>
              )}
            </div>
          </form>

          {/* Quick stats strip - adds credibility under the search */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: isMobile ? '14px' : '32px',
            marginTop: isMobile ? '20px' : '28px',
            padding: isMobile ? '12px 14px' : '14px 22px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            backdropFilter: 'blur(12px)',
            maxWidth: 580,
            margin: isMobile ? '20px auto 0' : '28px auto 0',
          }}>
            {[
              { num: '48', sup: '+', label: 'Articles', icon: 'bi-journal-text', tint: '#93C5FD' },
              { num: '24', sup: '/7', label: 'Live Support', icon: 'bi-headset', tint: '#86EFAC' },
              { num: '< 2', sup: 'h', label: 'Avg Response', icon: 'bi-lightning-charge-fill', tint: '#FBBF24' },
              { num: '98', sup: '%', label: 'Resolved', icon: 'bi-patch-check-fill', tint: '#F472B6' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 96 }}>
                <i className={`bi ${s.icon}`} style={{ fontSize: 18, color: s.tint, filter: `drop-shadow(0 0 6px ${s.tint}66)` }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1,
                  }}>
                    {s.num}<sup style={{ fontSize: '0.55em', color: s.tint, verticalAlign: 'super', marginLeft: 1 }}>{s.sup}</sup>
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: isMobile ? '0.5rem' : '1rem', marginRight: isMobile ? '0.5rem' : '1rem' }}>
        <div className="max-w-7xl mx-auto -mt-16 pb-16" style={{ paddingLeft: isMobile ? '0.5rem' : '1rem', paddingRight: isMobile ? '0.5rem' : '1rem' }}>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center">
              <i className="bi bi-check-circle text-green-500 mr-2"></i>
              <span className="text-green-700">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-500 hover:text-green-700"
                style={{ transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        )}

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-16" style={{
          gap: isMobile ? '1rem' : '2rem',
          marginBottom: isMobile ? '2.5rem' : '4rem',
          paddingTop: isMobile ? '2rem' : '3rem'
        }}>
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              style={{
                background: '#ffffff',
                borderRadius: isMobile ? '18px' : '22px',
                boxShadow: `0 4px 16px ${category.glow.replace('0.45', '0.10')}, 0 1px 3px rgba(0,0,0,0.04)`,
                border: `1px solid ${category.tint}1F`,
                padding: isMobile ? '1.5rem 1.25rem' : '2rem 1.75rem',
                textAlign: 'left',
                cursor: 'pointer',
                minHeight: isMobile ? 'auto' : '230px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 24px 44px -12px ${category.glow}, 0 8px 18px -6px rgba(15,23,42,0.08)`;
                  e.currentTarget.style.borderColor = `${category.tint}66`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${category.glow.replace('0.45', '0.10')}, 0 1px 3px rgba(0,0,0,0.04)`;
                  e.currentTarget.style.borderColor = `${category.tint}1F`;
                }
              }}
            >
              {/* Top accent stripe */}
              <div aria-hidden="true" style={{
                position: 'absolute', top: 0, left: '15%', right: '15%', height: 3,
                borderRadius: '0 0 3px 3px',
                background: `linear-gradient(90deg, transparent, ${category.tint}, transparent)`,
                opacity: 0.85,
              }} />
              {/* Background bloom */}
              <div aria-hidden="true" style={{
                position: 'absolute', top: -30, right: -30, width: 160, height: 160,
                background: `radial-gradient(circle, ${category.tint}15 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* Tagline + icon row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: category.tint,
                }}>
                  {category.tagline}
                </span>
                <div style={{
                  width: isMobile ? 48 : 56,
                  height: isMobile ? 48 : 56,
                  borderRadius: 14,
                  background: category.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 18px -6px ${category.glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                  flexShrink: 0,
                }}>
                  <i className={category.icon} style={{ fontSize: isMobile ? 22 : 26, color: '#fff' }}></i>
                </div>
              </div>

              {/* Title + description */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: 600,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.15,
                  letterSpacing: '-0.005em',
                }}>
                  {category.name}
                </h3>
                <p style={{
                  fontSize: isMobile ? 13 : 14,
                  color: '#64748b',
                  margin: '8px 0 0',
                  lineHeight: 1.55,
                }}>
                  {category.description}
                </p>
              </div>

              {/* Footer: article count + arrow */}
              <div style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: `1px dashed ${category.tint}33`,
                position: 'relative', zIndex: 2,
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: category.tint,
                  letterSpacing: '0.04em',
                }}>
                  {category.articles} articles
                </span>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${category.tint}14`,
                  color: category.tint,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-arrow-right" style={{ fontSize: 12 }}></i>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Clear Filter Button */}
        {(searchTerm || selectedCategory) && (
          <div className="mb-8 text-center">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              style={{ borderRadius: '10px', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="bi bi-x-circle"></i>
              Clear filters
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredFAQs.length} {filteredFAQs.length === 1 ? 'article' : 'articles'}
            </p>
          </div>
        )}

        {/* Popular Topics / FAQs */}
        <div
          id="faq-section"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: isMobile ? '20px' : '24px',
            boxShadow: '0 12px 48px rgba(8, 58, 133, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(8, 58, 133, 0.1)',
            padding: isMobile ? '2rem 1rem' : '3rem 2.5rem',
            marginTop: isMobile ? '2.5rem' : '4rem',
            marginBottom: '1rem'
          }}
        >
          <div className="text-center" style={{ marginBottom: isMobile ? '2rem' : '3rem' }}>
            <div className="inline-block" style={{ marginBottom: isMobile ? '1rem' : '1.25rem' }}>
              <div
                style={{
                  width: isMobile ? '48px' : '64px',
                  height: isMobile ? '48px' : '64px',
                  background: 'linear-gradient(135deg, #083A85 0%, #062d65 100%)',
                  borderRadius: isMobile ? '16px' : '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  boxShadow: '0 8px 24px rgba(8, 58, 133, 0.35)',
                  transform: 'rotate(-5deg)'
                }}
              >
                <i className="bi bi-question-circle text-white" style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', transform: 'rotate(5deg)' }}></i>
              </div>
            </div>
            <h2
              style={{
                fontSize: isMobile ? '1.5rem' : 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: isMobile ? '0.75rem' : '1rem',
                letterSpacing: '-0.02em'
              }}
            >
              {selectedCategory ? 'Related Topics' : 'Popular Topics'}
            </h2>
            <p
              style={{
                color: '#6B7280',
                fontSize: isMobile ? '0.9375rem' : '1.125rem',
                lineHeight: '1.7',
                maxWidth: '600px',
                margin: '0 auto',
                padding: isMobile ? '0 0.5rem' : '0'
              }}
            >
              {selectedCategory
                ? `Browse topics in ${categories.find(c => c.id === selectedCategory)?.name}`
                : 'Find quick answers to the most common questions'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <i className="bi bi-search text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    boxShadow: openFAQs.has(faq.id)
                      ? '0 12px 40px rgba(8, 58, 133, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)'
                      : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: openFAQs.has(faq.id)
                      ? '2px solid rgba(8, 58, 133, 0.3)'
                      : '1px solid rgba(8, 58, 133, 0.1)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <button
                    onClick={() => handleFAQClick(faq.id)}
                    className="w-full text-left flex items-center justify-between gap-4 hover:bg-blue-50/30 transition-all duration-200"
                    style={{
                      cursor: 'pointer',
                      padding: isMobile ? '1rem 1rem' : '1.25rem 1.75rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div className="flex items-start flex-1" style={{ gap: isMobile ? '0.75rem' : '1rem' }}>
                      <div
                        style={{
                          flexShrink: 0,
                          width: isMobile ? '32px' : '36px',
                          height: isMobile ? '32px' : '36px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          backgroundColor: openFAQs.has(faq.id) ? '#083A85' : 'rgba(8, 58, 133, 0.1)',
                          color: openFAQs.has(faq.id) ? '#ffffff' : '#083A85',
                          boxShadow: openFAQs.has(faq.id) ? '0 4px 12px rgba(8, 58, 133, 0.3)' : 'none'
                        }}
                      >
                        <i className={`bi bi-chevron-${openFAQs.has(faq.id) ? 'down' : 'right'}`} style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}></i>
                      </div>
                      <span className="text-gray-900 font-semibold" style={{ fontSize: isMobile ? '0.9375rem' : '1.125rem', lineHeight: '1.5' }}>{faq.question}</span>
                    </div>
                    <span
                      style={{
                        fontSize: isMobile ? '0.6875rem' : '0.75rem',
                        fontWeight: '600',
                        color: '#083A85',
                        backgroundColor: 'rgba(8, 58, 133, 0.1)',
                        padding: isMobile ? '4px 10px' : '6px 14px',
                        borderRadius: '20px',
                        border: '1px solid rgba(8, 58, 133, 0.2)',
                        whiteSpace: 'nowrap',
                        display: isMobile ? 'none' : 'block'
                      }}
                    >
                      {faq.category}
                    </span>
                  </button>

                  {openFAQs.has(faq.id) && (
                    <div
                      style={{
                        padding: isMobile ? '0 1rem 1.25rem 1rem' : '0 1.75rem 1.5rem 1.75rem',
                        background: 'linear-gradient(to bottom, rgba(8, 58, 133, 0.02) 0%, rgba(8, 58, 133, 0.05) 100%)',
                        borderTop: '1px solid rgba(8, 58, 133, 0.1)'
                      }}
                    >
                      <div style={{ paddingTop: isMobile ? '1rem' : '1.25rem' }}>
                        <p className="text-gray-700 leading-relaxed" style={{ lineHeight: '1.7', fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
                          {faq.answer}
                        </p>
                        <div className="flex flex-wrap" style={{ gap: isMobile ? '0.5rem' : '0.5rem', marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
                          {faq.tags.map(tag => (
                            <span
                              key={tag}
                              style={{
                                padding: isMobile ? '6px 12px' : '8px 14px',
                                background: 'rgba(8, 58, 133, 0.08)',
                                color: '#083A85',
                                fontSize: isMobile ? '0.75rem' : '0.8125rem',
                                fontWeight: '600',
                                borderRadius: '20px',
                                border: '1px solid rgba(8, 58, 133, 0.15)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '8px' : '12px',
                            paddingTop: isMobile ? '0.75rem' : '1rem',
                            borderTop: '1px solid rgba(8, 58, 133, 0.1)',
                            flexWrap: 'wrap'
                          }}
                        >
                          <span className="text-gray-700 font-semibold" style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem' }}>Was this helpful?</span>
                          {faq.userVote ? (
                            <span style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', color: faq.userVote === 'yes' ? '#083A85' : '#6B7280', fontWeight: 600 }}>
                              <i className={`bi ${faq.userVote === 'yes' ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-down-fill'}`} style={{ marginRight: 6 }}></i>
                              {faq.userVote === 'yes' ? 'Thanks for your feedback!' : 'Sorry to hear that. We\'ll improve this.'}
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleFAQVote(faq.id, 'yes'); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px',
                                  padding: isMobile ? '8px 14px' : '10px 18px',
                                  color: '#083A85', backgroundColor: 'rgba(8, 58, 133, 0.08)',
                                  border: '1px solid rgba(8, 58, 133, 0.2)', borderRadius: '10px',
                                  transition: 'all 0.2s ease', fontWeight: '600',
                                  fontSize: isMobile ? '0.8125rem' : '0.875rem', cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#083A85'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#083A85'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.08)'; e.currentTarget.style.color = '#083A85'; e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.2)'; }}
                              >
                                <i className="bi bi-hand-thumbs-up"></i>
                                <span>Yes ({faq.helpful})</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleFAQVote(faq.id, 'no'); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px',
                                  padding: isMobile ? '8px 14px' : '10px 18px',
                                  color: '#6B7280', backgroundColor: 'rgba(107, 114, 128, 0.08)',
                                  border: '1px solid rgba(107, 114, 128, 0.2)', borderRadius: '10px',
                                  transition: 'all 0.2s ease', fontWeight: '600',
                                  fontSize: isMobile ? '0.8125rem' : '0.875rem', cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.15)'; e.currentTarget.style.color = '#374151'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.08)'; e.currentTarget.style.color = '#6B7280'; }}
                              >
                                <i className="bi bi-hand-thumbs-down"></i>
                                <span>No</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contact & Support Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 mb-16" style={{
          marginTop: isMobile ? '2.5rem' : '4rem',
          gap: isMobile ? '1.5rem' : '2.5rem'
        }}>
          {/* Contact Form */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: isMobile ? '20px' : '24px',
              boxShadow: '0 10px 40px rgba(8, 58, 133, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(8, 58, 133, 0.1)',
              padding: isMobile ? '1.5rem 1rem' : '2.5rem',
              transition: 'all 0.3s ease'
            }}
            className="hover:shadow-2xl"
          >
            <div style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
              <div
                style={{
                  width: isMobile ? '48px' : '56px',
                  height: isMobile ? '48px' : '56px',
                  background: 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
                  borderRadius: isMobile ? '14px' : '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: isMobile ? '1rem' : '1.25rem',
                  boxShadow: '0 8px 20px rgba(8, 58, 133, 0.25)'
                }}
              >
                <i className="bi bi-envelope-fill text-white" style={{ fontSize: isMobile ? '1.125rem' : '1.25rem' }}></i>
              </div>
              <h2 className="font-bold text-gray-900" style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', marginBottom: '0.75rem' }}>Contact Support</h2>
              <p className="text-gray-600 leading-relaxed" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.</p>
            </div>

            <form onSubmit={handleContactSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '1.25rem' : '1.75rem'
            }}>
              <div>
                <label className="block font-semibold text-gray-700" style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', marginBottom: isMobile ? '0.5rem' : '0.75rem' }}>Name *</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    border: '2px solid rgba(8, 58, 133, 0.15)',
                    borderRadius: isMobile ? '10px' : '12px',
                    fontSize: isMobile ? '0.875rem' : '0.9375rem',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'rgba(8, 58, 133, 0.02)'
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-[#083A85] focus:border-transparent hover:border-[#083A85]"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700" style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', marginBottom: isMobile ? '0.5rem' : '0.75rem' }}>Email *</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    border: '2px solid rgba(8, 58, 133, 0.15)',
                    borderRadius: isMobile ? '10px' : '12px',
                    fontSize: isMobile ? '0.875rem' : '0.9375rem',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'rgba(8, 58, 133, 0.02)'
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-[#083A85] focus:border-transparent hover:border-[#083A85]"
                  placeholder="john.doe@example.com"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700" style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', marginBottom: isMobile ? '0.5rem' : '0.75rem' }}>Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    border: '2px solid rgba(8, 58, 133, 0.15)',
                    borderRadius: isMobile ? '10px' : '12px',
                    fontSize: isMobile ? '0.875rem' : '0.9375rem',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'rgba(8, 58, 133, 0.02)'
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-[#083A85] focus:border-transparent hover:border-[#083A85]"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700" style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', marginBottom: isMobile ? '0.5rem' : '0.75rem' }}>Message *</label>
                <textarea
                  rows={isMobile ? 4 : 5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    border: '2px solid rgba(8, 58, 133, 0.15)',
                    borderRadius: isMobile ? '10px' : '12px',
                    fontSize: isMobile ? '0.875rem' : '0.9375rem',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'rgba(8, 58, 133, 0.02)',
                    resize: 'none'
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-[#083A85] focus:border-transparent hover:border-[#083A85]"
                  placeholder="Describe your issue in detail..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={contactForm.loading || !contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 20px' : '16px 24px',
                  background: (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim())
                    ? '#9ca3af'
                    : 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
                  color: '#ffffff',
                  fontWeight: '600',
                  borderRadius: isMobile ? '10px' : '12px',
                  border: 'none',
                  fontSize: isMobile ? '0.9375rem' : '1rem',
                  cursor: (contactForm.loading || !contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim())
                    ? 'none'
                    : '0 4px 16px rgba(8, 58, 133, 0.3)',
                  opacity: contactForm.loading ? 0.6 : 1
                }}
                className={(!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) ? '' : 'hover:shadow-xl hover:scale-[1.02]'}
                onMouseEnter={(e) => { if (!contactForm.loading && contactForm.name.trim() && contactForm.email.trim() && contactForm.message.trim()) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {contactForm.loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-arrow-clockwise animate-spin"></i>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-send-fill"></i>
                    Send Message
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Support Options */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: isMobile ? '20px' : '24px',
              boxShadow: '0 10px 40px rgba(8, 58, 133, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(8, 58, 133, 0.1)',
              padding: isMobile ? '1.5rem 1rem' : '2.5rem',
              transition: 'all 0.3s ease'
            }}
            className="hover:shadow-2xl"
          >
            <div style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
              <div
                style={{
                  width: isMobile ? '48px' : '56px',
                  height: isMobile ? '48px' : '56px',
                  background: 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
                  borderRadius: isMobile ? '14px' : '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: isMobile ? '1rem' : '1.25rem',
                  boxShadow: '0 8px 20px rgba(8, 58, 133, 0.25)'
                }}
              >
                <i className="bi bi-headset text-white" style={{ fontSize: isMobile ? '1.125rem' : '1.25rem' }}></i>
              </div>
              <h2 className="font-bold text-gray-900" style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', marginBottom: '0.75rem' }}>Get in Touch</h2>
              <p className="text-gray-600 leading-relaxed" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>Multiple ways to reach our dedicated support team</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '0.75rem' : '1rem',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  borderRadius: isMobile ? '14px' : '16px',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  transition: 'all 0.2s ease'
                }}
                className="hover:shadow-md"
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: isMobile ? '40px' : '48px',
                    height: isMobile ? '40px' : '48px',
                    background: 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
                    borderRadius: isMobile ? '10px' : '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(8, 58, 133, 0.3)'
                  }}
                >
                  <i className="bi bi-envelope-fill text-white" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Email Support</h3>
                  <p className="text-base text-[#083A85] font-semibold mb-2">support@amoriaconnekyt.com</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="bi bi-clock-fill"></i>
                    <span>Response within 24 hours</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '0.75rem' : '1rem',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  borderRadius: isMobile ? '14px' : '16px',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  transition: 'all 0.2s ease'
                }}
                className="hover:shadow-md"
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: isMobile ? '40px' : '48px',
                    height: isMobile ? '40px' : '48px',
                    background: 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
                    borderRadius: isMobile ? '10px' : '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(8, 58, 133, 0.3)'
                  }}
                >
                  <i className="bi bi-telephone-fill text-white" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: isMobile ? '1rem' : '1.125rem' }}>Phone Support</h3>
                  <p className="text-[#083A85] font-semibold mb-2" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>+250 788 437 347</p>
                  <div className="flex items-center gap-2 text-gray-600" style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem' }}>
                    <i className="bi bi-clock-fill"></i>
                    <span>Mon-Fri, 9 AM - 6 PM EAT</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '0.75rem' : '1rem',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  borderRadius: isMobile ? '14px' : '16px',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  transition: 'all 0.2s ease'
                }}
                className="hover:shadow-md"
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: isMobile ? '40px' : '48px',
                    height: isMobile ? '40px' : '48px',
                    background: 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
                    borderRadius: isMobile ? '10px' : '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(8, 58, 133, 0.3)'
                  }}
                >
                  <i className="bi bi-chat-dots-fill text-white" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: isMobile ? '1rem' : '1.125rem' }}>Live Chat</h3>
                  <p className="text-[#083A85] font-semibold mb-2" style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>Available on website</p>
                  <div className="flex items-center gap-2 text-gray-600" style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem' }}>
                    <i className="bi bi-clock-fill"></i>
                    <span>Mon-Fri, 9 AM - 6 PM EAT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
};

export default HelpSupportCenter;
