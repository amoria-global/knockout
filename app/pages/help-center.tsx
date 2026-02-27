'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { useRouter } from 'next/navigation';
import { contactUs } from '@/lib/APIs/public/contact-us/route';
import { getFAQs } from '@/lib/APIs/public/get-faqs/route';

// Local types (no backend imports)
type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: string;
  helpful: number;
  lastUpdated: Date;
  tags: string[];
};


// Mock Data
const mockFAQs: FAQ[] = [
  {
    id: '1',
    question: 'How do I book a photographer on Amoria connekyt?',
    answer: 'To book a photographer, browse through our verified photographers, view their portfolios, check availability, and send a booking request. Once the photographer accepts, you can proceed with payment through our secure escrow system.',
    category: 'Booking',
    priority: 'high',
    helpful: 45,
    lastUpdated: new Date('2025-01-15'),
    tags: ['booking', 'getting-started', 'payment']
  },
  {
    id: '2',
    question: 'How does the payment system work?',
    answer: 'Payments are held securely in escrow until project completion. Once you approve the delivered photos, the funds are released to the photographer. This ensures both parties are protected throughout the transaction.',
    category: 'Payment',
    priority: 'high',
    helpful: 38,
    lastUpdated: new Date('2025-01-10'),
    tags: ['payment', 'escrow', 'security']
  },
  {
    id: '3',
    question: 'Can I cancel a booking?',
    answer: 'Yes, you can cancel a booking according to our cancellation policy. Cancellations made 48 hours or more before the event receive a full refund. Cancellations within 48 hours may incur a fee depending on the photographer\'s policy.',
    category: 'Booking',
    priority: 'medium',
    helpful: 29,
    lastUpdated: new Date('2025-01-08'),
    tags: ['cancellation', 'refund', 'policy']
  },
  {
    id: '4',
    question: 'How do I become a verified photographer?',
    answer: 'To become verified, submit your application with valid ID, portfolio samples, and professional credentials. Our team reviews applications within 3-5 business days. Once approved, you can start accepting bookings.',
    category: 'Account',
    priority: 'high',
    helpful: 52,
    lastUpdated: new Date('2025-01-12'),
    tags: ['verification', 'photographer', 'registration']
  },
  {
    id: '5',
    question: 'What if I\'m not satisfied with the photos?',
    answer: 'If you\'re not satisfied, first communicate with the photographer to resolve the issue. If no resolution is reached, contact our support team within 7 days of delivery. We\'ll review the case and mediate a fair solution, which may include revisions or refunds.',
    category: 'General',
    priority: 'medium',
    helpful: 33,
    lastUpdated: new Date('2025-01-05'),
    tags: ['dispute', 'quality', 'refund']
  },
  {
    id: '6',
    question: 'How can I view my payment history?',
    answer: 'You can view your complete payment history in your account dashboard. Navigate to "My Account" > "Payment History" to see all your transactions, receipts, and payment details.',
    category: 'Payment',
    priority: 'medium',
    helpful: 28,
    lastUpdated: new Date('2025-01-09'),
    tags: ['payment', 'history', 'account']
  },
  {
    id: '7',
    question: 'Is my personal information secure?',
    answer: 'Yes, we use industry-standard encryption and security measures to protect your data. We comply with Rwanda\'s Data Protection Law No. 058/2021 and international security standards.',
    category: 'Security',
    priority: 'high',
    helpful: 41,
    lastUpdated: new Date('2025-01-11'),
    tags: ['security', 'privacy', 'data-protection']
  },
  {
    id: '8',
    question: 'What payment methods do you accept?',
    answer: 'We accept various payment methods including credit/debit cards, mobile money (MTN Mobile Money, Airtel Money), and bank transfers. All payments are processed securely through our escrow system.',
    category: 'Payment Methods',
    priority: 'medium',
    helpful: 35,
    lastUpdated: new Date('2025-01-07'),
    tags: ['payment', 'methods', 'mobile-money']
  }
];

const categories = [
  {
    id: 'account',
    name: 'My Account',
    icon: 'bi-person-circle',
    articles: 12,
    description: 'Manage your account settings'
  },
  {
    id: 'payment',
    name: 'Payment',
    icon: 'bi-credit-card',
    articles: 8,
    description: 'Payment and billing information'
  },
  {
    id: 'security',
    name: 'Security',
    icon: 'bi-shield-check',
    articles: 6,
    description: 'Keep your account secure'
  },
  {
    id: 'payment-methods',
    name: 'Payment Methods',
    icon: 'bi-wallet2',
    articles: 5,
    description: 'Available payment options'
  },
  {
    id: 'booking',
    name: 'Booking',
    icon: 'bi-calendar-check',
    articles: 10,
    description: 'Book and manage photographers'
  },
  {
    id: 'technical',
    name: 'Technical Support',
    icon: 'bi-gear',
    articles: 7,
    description: 'Technical help and support'
  }
];


const HelpSupportCenter: React.FC = () => {
  const router = useRouter();

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Data states
  const [FAQS, setFAQS] = useState<FAQ[]>(mockFAQs);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch FAQs from API
  useEffect(() => {
    const loadFAQs = async () => {
      try {
        const response = await getFAQs();
        if (response.success && response.data) {
          const apiData = response.data as unknown as Record<string, unknown>;
          const faqData = (apiData?.data || []) as Array<Record<string, unknown>>;
          if (faqData.length > 0) {
            const apiFAQs: FAQ[] = faqData.map((faq) => ({
              id: faq.id as string,
              question: faq.question as string,
              answer: faq.answer as string,
              category: (faq.category as string) || 'General',
              priority: (faq.priority as string) || 'medium',
              helpful: (faq.helpfulCount as number) || 0,
              lastUpdated: new Date((faq.createdAt as string) || Date.now()),
              tags: ((faq.category as string) || 'general').toLowerCase().split(/[\s,]+/),
            }));
            setFAQS(apiFAQs);
          }
        }
      } catch {
        // Keep mock FAQs as fallback
      }
    };
    loadFAQs();
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
    setOpenFAQ(openFAQ === faqId ? null : faqId);
  };

  const handleFAQHelpful = (faqId: string) => {
    setFAQS(prev => prev.map(faq =>
      faq.id === faqId
        ? { ...faq, helpful: faq.helpful + 1 }
        : faq
    ));
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)' }}>
      <Navbar />

      {/* Hero Section with Search */}
      <div style={{
        position: 'relative',
        paddingTop: isMobile ? 'clamp(3rem, 8vw, 6rem)' : '6rem',
        paddingBottom: isMobile ? 'clamp(4rem, 10vw, 8rem)' : '8rem',
        paddingLeft: isMobile ? 'clamp(1rem, 4vw, 1.5rem)' : '1rem',
        paddingRight: isMobile ? 'clamp(1rem, 4vw, 1.5rem)' : '1rem',
        overflow: 'hidden',
        marginLeft: '0',
        marginRight: '0',
        marginTop: '0rem'
      }}>
        {/* Background Image with Blur Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0
        }}>
          <img src="https://i.pinimg.com/736x/9c/df/a9/9cdfa9455775771fb2bc020c10329698.jpg" alt="Photography Background"style={{width: '100%',height: '100%',objectFit: 'cover'}}/>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(8, 58, 133, 0.9)',
            backdropFilter: 'blur(1px)'
          }}></div>
        </div>

        <div style={{
          position: 'relative',
          maxWidth: '56rem',
          margin: '0 auto',
          padding: isMobile ? '0 0.5rem' : '0 1rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: isMobile ? 'clamp(1.5rem, 7vw, 2.5rem)' : 'clamp(1.875rem, 5vw, 3rem)',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: isMobile ? 'clamp(1.25rem, 5vw, 2rem)' : '2rem',
            lineHeight: '1.2'
          }}>
            How can we help you?
          </h1>

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
                  borderRadius: isMobile ? '0.5rem' : '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  outline: 'none',
                  backgroundColor: '#d4d4d4',
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
            </div>
          </form>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-16" style={{
          gap: isMobile ? '1rem' : '2rem',
          marginBottom: isMobile ? '2.5rem' : '4rem',
          paddingTop: isMobile ? '2rem' : '3rem'
        }}>
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: isMobile ? '16px' : '20px',
                boxShadow: '0 6px 24px rgba(8, 58, 133, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(8, 58, 133, 0.1)',
                padding: isMobile ? '1.5rem 1rem' : '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                minHeight: isMobile ? 'auto' : '240px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="group"
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(8, 58, 133, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(8, 58, 133, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.1)';
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? '56px' : '72px',
                  height: isMobile ? '56px' : '72px',
                  borderRadius: isMobile ? '14px' : '18px',
                  marginBottom: isMobile ? '1rem' : '1.5rem',
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.1) 0%, rgba(8, 58, 133, 0.05) 100%)',
                  color: '#083A85',
                  transition: 'all 0.3s ease'
                }}
                className="group-hover:bg-gradient-to-br group-hover:from-[#083A85] group-hover:to-[#062d65] group-hover:text-white group-hover:shadow-lg"
              >
                <i className={`${category.icon}`} style={{ fontSize: isMobile ? '1.75rem' : '1.875rem' }}></i>
              </div>
              <h3 className="font-bold text-gray-900 mb-2" style={{ letterSpacing: '-0.01em', fontSize: isMobile ? '1rem' : '1.25rem' }}>
                {category.name}
              </h3>
              <p className="text-gray-600 mb-3 leading-relaxed" style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem' }}>
                {category.description}
              </p>
              <p
                style={{
                  fontSize: isMobile ? '0.8125rem' : '0.875rem',
                  color: '#083A85',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {category.articles} articles
                <i className="bi bi-arrow-right" style={{ transition: 'transform 0.3s ease', fontSize: isMobile ? '0.75rem' : '0.875rem' }}></i>
              </p>
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              style={{ transition: 'all 0.3s ease' }}
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
                    boxShadow: openFAQ === faq.id
                      ? '0 12px 40px rgba(8, 58, 133, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)'
                      : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: openFAQ === faq.id
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
                          backgroundColor: openFAQ === faq.id ? '#083A85' : 'rgba(8, 58, 133, 0.1)',
                          color: openFAQ === faq.id ? '#ffffff' : '#083A85',
                          boxShadow: openFAQ === faq.id ? '0 4px 12px rgba(8, 58, 133, 0.3)' : 'none'
                        }}
                      >
                        <i className={`bi bi-chevron-${openFAQ === faq.id ? 'down' : 'right'}`} style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}></i>
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

                  {openFAQ === faq.id && (
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFAQHelpful(faq.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: isMobile ? '6px' : '8px',
                              padding: isMobile ? '8px 14px' : '10px 18px',
                              color: '#083A85',
                              backgroundColor: 'rgba(8, 58, 133, 0.08)',
                              border: '1px solid rgba(8, 58, 133, 0.2)',
                              borderRadius: '10px',
                              transition: 'all 0.2s ease',
                              fontWeight: '600',
                              fontSize: isMobile ? '0.8125rem' : '0.875rem',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#083A85';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.borderColor = '#083A85';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.08)';
                              e.currentTarget.style.color = '#083A85';
                              e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.2)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <i className="bi bi-hand-thumbs-up"></i>
                            <span>Yes ({faq.helpful})</span>
                          </button>
                          <button
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: isMobile ? '6px' : '8px',
                              padding: isMobile ? '8px 14px' : '10px 18px',
                              color: '#6B7280',
                              backgroundColor: 'rgba(107, 114, 128, 0.08)',
                              border: '1px solid rgba(107, 114, 128, 0.2)',
                              borderRadius: '10px',
                              transition: 'all 0.2s ease',
                              fontWeight: '600',
                              fontSize: isMobile ? '0.8125rem' : '0.875rem',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.15)';
                              e.currentTarget.style.color = '#374151';
                              e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.3)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.08)';
                              e.currentTarget.style.color = '#6B7280';
                              e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.2)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <i className="bi bi-hand-thumbs-down"></i>
                            <span>No</span>
                          </button>
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
