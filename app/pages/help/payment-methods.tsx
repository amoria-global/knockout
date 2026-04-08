'use client';

import React, { useState } from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Link from 'next/link';

const PaymentMethodsHelp: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggleSection = (id: string) => setOpenSection(prev => prev === id ? null : id);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)' }}>
      <Navbar />

                  {/* Hero Section */}
      <div style={{
        position: 'relative',
        paddingTop: 'clamp(5rem, 8vw, 6rem)',
        paddingBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #052047 0%, #083A85 40%, #0a4da3 70%, #103E83 100%)',
      }}>
        <div style={{ position: 'absolute', inset: '-80px', backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', zIndex: 2 }} className="!px-4 md:!px-8">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <i className="bi-wallet2" style={{ fontSize: 18, color: '#fff' }}></i>
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em', fontFamily: "'Pragati Narrow', sans-serif" }}>
              Payment Methods
            </h1>
          </div>
          <p style={{ fontSize: 'clamp(13px, 1.1vw, 15px)', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', lineHeight: 1.5 }}>
            Complete guide to all accepted payment methods and how to use them securely
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            <Link href="/user/help-center" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Help Center</Link>
            <i className="bi bi-chevron-right" style={{ fontSize: '11px' }}></i>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Payment Methods</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }} className="!px-4 md:!px-8">
        <div style={{ paddingTop: '2rem', paddingBottom: '3rem' }} className="!pt-4 !pb-8 md:!pt-8 md:!pb-12">

          {/* Documentation Content */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(8, 58, 133, 0.08)',
            border: '1px solid rgba(8, 58, 133, 0.08)',
            overflow: 'hidden'
          }}>

                        {/* Section Guide */}
            <div style={{ padding: '2rem 3rem 1rem', borderBottom: '1px solid #E5E7EB' }} className="!px-6 !py-4 md:!px-12 md:!pt-8 md:!pb-4">
              <p style={{ fontSize: '0.95rem', color: '#6B7280', margin: 0 }}>
                <i className="bi bi-info-circle" style={{ marginRight: 8, color: '#083A85' }}></i>
                Click on any topic below to expand and read the details
              </p>
            </div>

{/* Section 1: Credit & Debit Cards */}
            <section id="cards" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleSection('cards')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.5rem 3rem',
                  background: openSection === 'cards' ? 'rgba(8, 58, 133, 0.03)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                className="!px-6 md:!px-12 !py-4 md:!py-6 hover:bg-gray-50"
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  background: 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-credit-card-fill text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <span style={{ flex: 1, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '700', color: '#111827' }}>
                  Credit & Debit Cards
                </span>
                <i className={`bi ${openSection === 'cards' ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '1.1rem', color: '#6B7280', transition: 'transform 0.2s' }}></i>
              </button>
              <div style={{
                maxHeight: openSection === 'cards' ? '5000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                padding: openSection === 'cards' ? '0 3rem 3rem' : '0 3rem',
              }} className={openSection === 'cards' ? '!px-6 md:!px-12 !pb-6 md:!pb-12' : '!px-6 md:!px-12'}>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                We accept all major credit and debit cards for fast and secure payments. Your card information is encrypted and processed through industry-leading payment gateways, ensuring maximum security for every transaction.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Accepted Card Types
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  marginBottom: '2rem'
                }} className="!p-4 md:!p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {[
                      { icon: 'bi-credit-card-2-front', name: 'Visa', desc: 'All Visa credit and debit cards globally' },
                      { icon: 'bi-credit-card-2-back', name: 'Mastercard', desc: 'Mastercard credit and debit cards worldwide' },
                      { icon: 'bi-wallet2', name: 'American Express', desc: 'Amex cards accepted in supported regions' },
                      { icon: 'bi-bank2', name: 'Discover', desc: 'Discover cards for US-based customers' },
                      { icon: 'bi-credit-card', name: 'Local Cards', desc: 'Region-specific debit cards (Interac, Maestro)' },
                      { icon: 'bi-shield-check', name: '3D Secure', desc: 'Enhanced security verification for all cards' }
                    ].map((card, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '1.5rem',
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px'
                      }} className="!p-4 md:!p-6">
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <i className={card.icon} style={{ color: 'white', fontSize: '1.25rem' }}></i>
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{card.name}</h4>
                          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  How to Pay with Card
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }} className="!p-4 md:!p-8">
                  <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Select your photographer and proceed to checkout after confirming booking details
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Choose <strong>"Credit/Debit Card"</strong> as your payment method
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Enter your card number, expiration date, CVV code, and cardholder name
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Provide your billing address (must match the address on file with your card issuer)
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Complete 3D Secure verification if prompted (bank authentication via SMS or app)
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Review total amount and confirm payment - your booking will be confirmed instantly
                    </li>
                  </ol>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Card Security
                </h3>
                <div style={{
                  background: '#FEF3C7',
                  border: '2px solid #F59E0B',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <i className="bi bi-shield-lock-fill" style={{ fontSize: '1.5rem', color: '#D97706', flexShrink: 0 }}></i>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#92400E', marginBottom: '0.5rem' }}>Your Card is Safe</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#78350F' }}>
                        We never store your complete card details on our servers. All card data is tokenized and encrypted using PCI-DSS compliant payment processors.
                      </p>
                    </div>
                  </div>
                </div>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                    <strong>PCI-DSS Level 1 Compliance:</strong> Highest security standard for card processing
                  </li>
                  <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                    <strong>256-bit SSL Encryption:</strong> All card data transmitted through encrypted connections
                  </li>
                  <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                    <strong>Tokenization:</strong> Card numbers replaced with secure tokens after first use
                  </li>
                  <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                    <strong>Fraud Detection:</strong> Real-time monitoring for suspicious transactions
                  </li>
                  <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                    <strong>3D Secure 2.0:</strong> Additional authentication layer for verified transactions
                  </li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Troubleshooting Card Issues
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    {
                      issue: 'Card Declined',
                      solution: 'Contact your bank to ensure international/online transactions are enabled. Verify sufficient funds and correct billing address. Try a different card if issue persists.'
                    },
                    {
                      issue: 'CVV Verification Failed',
                      solution: 'Double-check the 3-digit CVV code on the back of your card (4 digits on front for Amex). Clear browser cache and try again.'
                    },
                    {
                      issue: '3D Secure Authentication Failed',
                      solution: 'Ensure your mobile number is registered with your bank for SMS codes. Check your banking app for push notifications. Contact your bank to enable 3D Secure.'
                    },
                    {
                      issue: 'Payment Processing Error',
                      solution: 'Wait a few minutes and try again. Clear cookies and cache, or try a different browser. If error continues, use an alternative payment method.'
                    }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      padding: '1.5rem',
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px'
                    }} className="!p-4 md:!p-6">
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.75rem' }}>
                        <i className="bi bi-exclamation-circle-fill" style={{ marginRight: '8px' }}></i>
                        {item.issue}
                      </h4>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151', margin: 0 }}>
                        <strong>Solution:</strong> {item.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </section>

          </div>

                                        {/* Back to Help Center */}
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
            <Link href="/user/help-center" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#083A85', fontWeight: '600', fontSize: '0.95rem', textDecoration: 'none' }} className="hover:opacity-70">
              <i className="bi bi-arrow-left"></i>
              Back to Help Center
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentMethodsHelp;
