'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

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
    question: 'How do I book a photographer on Amoria Connekt?',
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
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data states
  const [FAQS, setFAQS] = useState<FAQ[]>(mockFAQs);

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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;

    setContactForm(prev => ({ ...prev, loading: true }));

    // Simulate API call
    setTimeout(() => {
      setContactForm({ name: '', email: '', subject: '', message: '', loading: false });
      setSuccessMessage('Message sent successfully! We\'ll get back to you soon.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 1000);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section with Search */}
      <div style={{
        position: 'relative',
        paddingTop: '6rem',
        paddingBottom: '8rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
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
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.875rem, 5vw, 3rem)',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '2rem'
          }}>
            How can we help you?
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ maxWidth: '42rem', margin: '0 auto' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search for articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 3rem 1rem 1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: '#cacacaff',
                  color: '#000000'
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                <i className="bi bi-search"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '1rem', marginRight: '1rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-16">

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center">
              <i className="bi bi-check-circle text-green-500 mr-2"></i>
              <span className="text-green-700">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        )}

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-16" style={{ gap: '2rem', marginBottom: '4rem' }}>
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-8 text-center group cursor-pointer min-h-[220px] flex flex-col justify-center items-center"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full mb-5 bg-blue-50 text-[#083A85] group-hover:bg-[#083A85] group-hover:text-white transition-colors">
                <i className={`${category.icon} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{category.description}</p>
              <p className="text-sm text-[#083A85] font-medium">
                {category.articles} articles →
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
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 border border-gray-100" style={{ marginTop: '4rem', marginBottom: '1rem' }}>
          <div className="text-center mb-10">
            <div className="inline-block mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#083A85] to-[#062d65] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <i className="bi bi-question-circle text-xl text-white"></i>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {selectedCategory ? 'Related Topics' : 'Popular Topics'}
            </h2>
            <p className="text-gray-600 text-lg">
              {selectedCategory
                ? `Browse topics in ${categories.find(c => c.id === selectedCategory)?.name}`
                : 'Find quick answers to the most common questions'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                <div key={faq.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => handleFAQClick(faq.id)}
                    className="w-full text-left flex items-center justify-between gap-4"
                    style={{ cursor: 'pointer', padding: '0.75rem 1.5rem' }}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        openFAQ === faq.id
                          ? 'bg-[#083A85] text-white'
                          : 'bg-blue-50 text-[#083A85]'
                      }`}>
                        <i className={`bi bi-chevron-${openFAQ === faq.id ? 'down' : 'right'} text-sm`}></i>
                      </div>
                      <span className="text-gray-800 font-semibold text-base sm:text-lg">{faq.question}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full hidden sm:block">{faq.category}</span>
                  </button>

                  {openFAQ === faq.id && (
                    <div className="px-8 pb-6 pt-4 bg-gradient-to-br from-blue-50/30 to-transparent border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed mb-5 text-base">
                        {faq.answer}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {faq.tags.map(tag => (
                          <span key={tag} className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 text-[#083A85] text-xs font-medium rounded-full border border-blue-200/50">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <span className="text-gray-700 font-medium text-sm">Was this helpful?</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFAQHelpful(faq.id);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-[#083A85] hover:bg-[#083A85] hover:text-white rounded-lg transition-all duration-200 font-medium text-sm border border-[#083A85]/20 hover:border-[#083A85]"
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-hand-thumbs-up"></i>
                          <span>Yes ({faq.helpful})</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-all duration-200 font-medium text-sm border border-gray-200" style={{ cursor: 'pointer' }}>
                          <i className="bi bi-hand-thumbs-down"></i>
                          <span>No</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contact & Support Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16" style={{ marginTop: '2rem' }}>
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
            <div className="mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#083A85] to-[#0a4aa3] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <i className="bi bi-envelope-fill text-lg text-white"></i>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Contact Support</h2>
              <p className="text-gray-600 text-base leading-relaxed">Can't find what you're looking for? Send us a message and we'll get back to you soon.</p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="john.doe@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                <textarea
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] focus:border-transparent transition-all duration-200 hover:border-gray-300 resize-none"
                  placeholder="Describe your issue in detail..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={contactForm.loading}
                className="w-full px-6 py-3 bg-[#083A85] hover:bg-[#062d65] text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-[1.02]"
                style={{ cursor: contactForm.loading ? 'not-allowed' : 'pointer' }}
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
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
            <div className="mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#083A85] to-[#0a4aa3] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <i className="bi bi-headset text-lg text-white"></i>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Get in Touch</h2>
              <p className="text-gray-600 text-base leading-relaxed">Multiple ways to reach our support team</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-50/30 rounded-xl border-2 border-blue-100">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#083A85] to-[#0a4aa3] rounded-xl flex items-center justify-center shadow-md">
                  <i className="bi bi-envelope-fill text-white text-sm"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-1">Email Support</h3>
                  <p className="text-sm text-[#083A85] font-semibold mb-1">support@amoriaconnekt.com</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <i className="bi bi-clock-fill"></i>
                    <span>Response within 24 hours</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-50/30 rounded-xl border-2 border-blue-100">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#083A85] to-[#0a4aa3] rounded-xl flex items-center justify-center shadow-md">
                  <i className="bi bi-telephone-fill text-white text-sm"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-1">Phone Support</h3>
                  <p className="text-sm text-[#083A85] font-semibold mb-1">+250 788 437 347</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <i className="bi bi-clock-fill"></i>
                    <span>Mon-Fri, 9 AM - 6 PM EAT</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-50/30 rounded-xl border-2 border-blue-100">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#083A85] to-[#0a4aa3] rounded-xl flex items-center justify-center shadow-md">
                  <i className="bi bi-chat-dots-fill text-white text-sm"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-1">Live Chat</h3>
                  <p className="text-sm text-[#083A85] font-semibold mb-1">Available on website</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
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
