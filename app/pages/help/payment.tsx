'use client';

import React from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Link from 'next/link';

const PaymentHelp: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)' }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{
        position: 'relative',
        paddingTop: '8rem',
        paddingBottom: '6rem',
        overflow: 'hidden'
      }} className="!pt-24 md:!pt-32">
        <div style={{
          position: 'absolute',
          inset: 0
        }}>
          <img
            src="https://i.pinimg.com/736x/9c/df/a9/9cdfa9455775771fb2bc020c10329698.jpg"
            alt="Payment Help"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(8, 58, 133, 0.92)',
            backdropFilter: 'blur(2px)'
          }}></div>
        </div>

        <div style={{
          position: 'relative',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          textAlign: 'center'
        }} className="!px-4 md:!px-8">
          <div style={{
            display: 'inline-block',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }}>
              <i className="bi bi-credit-card" style={{ fontSize: '3.5rem', color: 'white' }}></i>
            </div>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '800',
            color: 'white',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            Payment & Billing Documentation
          </h1>

          <p style={{
            fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
            color: 'rgba(255, 255, 255, 0.95)',
            maxWidth: '700px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.8',
            fontWeight: '400'
          }}>
            Complete guide to our secure escrow system, payment methods, and billing processes
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.85)',
            fontWeight: '500'
          }}>
            <Link href="/user/help-center" style={{ color: 'rgba(255, 255, 255, 0.85)', textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-white">
              Help Center
            </Link>
            <i className="bi bi-chevron-right" style={{ fontSize: '12px' }}></i>
            <span style={{ color: 'white' }}>Payment</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }} className="!px-4 md:!px-8">
        <div style={{ paddingTop: '4rem', paddingBottom: '6rem' }} className="!pt-8 !pb-12 md:!pt-16 md:!pb-24">

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8" style={{ marginBottom: '3rem' }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(8, 58, 133, 0.08)',
              border: '1px solid rgba(8, 58, 133, 0.08)'
            }} className="!p-6 md:!p-10">
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
              }}>
                <i className="bi bi-shield-check text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>100%</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Secure Transactions</p>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(8, 58, 133, 0.08)',
              border: '1px solid rgba(8, 58, 133, 0.08)'
            }} className="!p-6 md:!p-10">
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 20px rgba(8, 58, 133, 0.25)'
              }}>
                <i className="bi bi-cash-stack text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>$2.5M+</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Processed Safely</p>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(8, 58, 133, 0.08)',
              border: '1px solid rgba(8, 58, 133, 0.08)'
            }} className="!p-6 md:!p-10">
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)'
              }}>
                <i className="bi bi-clock-history text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>5-7 Days</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Refund Processing</p>
            </div>
          </div>

          {/* Documentation Content */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(8, 58, 133, 0.08)',
            border: '1px solid rgba(8, 58, 133, 0.08)',
            overflow: 'hidden'
          }}>

            {/* Table of Contents */}
            <div style={{
              padding: '3rem',
              borderBottom: '1px solid #E5E7EB'
            }} className="!p-6 md:!p-12">
              <h2 style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '1.5rem',
                letterSpacing: '-0.01em'
              }}>
                Table of Contents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: 'bi-shield-check', title: 'How Escrow Works', id: 'escrow' },
                  { icon: 'bi-credit-card-fill', title: 'Making Payments', id: 'making' },
                  { icon: 'bi-clock-history', title: 'Payment History', id: 'history' },
                  { icon: 'bi-arrow-counterclockwise', title: 'Refunds & Cancellations', id: 'refunds' },
                  { icon: 'bi-wallet2', title: 'Photographer Earnings', id: 'earnings' },
                  { icon: 'bi-shield-lock-fill', title: 'Payment Security', id: 'security' }
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={`#${item.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '1rem 1.25rem',
                      background: 'rgba(8, 58, 133, 0.04)',
                      border: '1px solid rgba(8, 58, 133, 0.1)',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      color: '#083A85',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease'
                    }}
                    className="hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
                  >
                    <i className={item.icon} style={{ fontSize: '1.25rem' }}></i>
                    {item.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Section 1: How Escrow Works */}
            <section id="escrow" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }} className="!p-6 md:!p-12">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(8, 58, 133, 0.25)'
                }}>
                  <i className="bi bi-shield-check text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  How Our Escrow System Works
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Our escrow system ensures both clients and photographers are protected throughout every transaction. Payment is held securely until the service is completed and approved, providing peace of mind for all parties involved.
              </p>

              <div style={{
                background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                border: '1px solid rgba(8, 58, 133, 0.15)',
                borderRadius: '16px',
                padding: '2.5rem',
                marginBottom: '2rem'
              }} className="!p-4 md:!p-10">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#083A85', marginBottom: '1.5rem' }}>
                  The Escrow Process
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {[
                    {
                      title: 'Client Makes Payment',
                      desc: 'When you book a photographer, your payment is securely held in escrow. Funds are not immediately released to the photographer, ensuring you\'re protected until service completion.'
                    },
                    {
                      title: 'Service is Delivered',
                      desc: 'The photographer completes the photoshoot according to your booking agreement and delivers the edited photos through our secure platform.'
                    },
                    {
                      title: 'Client Reviews Work',
                      desc: 'You have 7 days to review the delivered photos. During this time, you can request reasonable revisions or approve the final deliverables.'
                    },
                    {
                      title: 'Funds Are Released',
                      desc: 'Once you approve the work, funds are automatically released from escrow to the photographer. If no response is received after 7 days, funds are automatically released.'
                    },
                    {
                      title: 'Dispute Resolution (If Needed)',
                      desc: 'If issues arise that cannot be resolved directly, our support team mediates to ensure a fair outcome for both parties based on the booking terms and evidence provided.'
                    }
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#083A85',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        flexShrink: 0
                      }}>{idx + 1}</div>
                      <div>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{step.title}</p>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                Benefits of Escrow Protection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {[
                  { icon: 'bi-person-check', title: 'Client Protection', desc: 'Pay with confidence knowing funds are held until you\'re satisfied with the photos' },
                  { icon: 'bi-camera-fill', title: 'Photographer Security', desc: 'Guaranteed payment once work is delivered and approved by the client' },
                  { icon: 'bi-shield-fill-x', title: 'Fraud Prevention', desc: 'Prevents scams and ensures both parties fulfill their obligations' },
                  { icon: 'bi-graph-up', title: 'Transparent Process', desc: 'Track payment status in real-time from your dashboard' },
                  { icon: 'bi-arrow-repeat', title: 'Refund Protection', desc: 'Clear refund policies based on cancellation timing and dispute outcomes' },
                  { icon: 'bi-eye-fill', title: 'No Hidden Fees', desc: 'All escrow handling fees are clearly displayed before payment confirmation' }
                ].map((benefit, idx) => (
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
                      <i className={benefit.icon} style={{ color: 'white', fontSize: '1.25rem' }}></i>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{benefit.title}</h4>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Making Payments */}
            <section id="making" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }} className="!p-6 md:!p-12">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)'
                }}>
                  <i className="bi bi-credit-card-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Making Payments
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Learn how to complete secure payments for your photography bookings. We accept multiple payment methods and use industry-standard encryption to protect your financial information.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Accepted Payment Methods
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {[
                    {
                      icon: 'bi-credit-card',
                      title: 'Credit/Debit Cards',
                      desc: 'We accept Visa, Mastercard, American Express, and Discover',
                      fee: 'No extra fees'
                    },
                    {
                      icon: 'bi-paypal',
                      title: 'PayPal',
                      desc: 'Fast and secure payments using your PayPal account',
                      fee: 'Standard PayPal rates apply'
                    }
                  ].map((method, idx) => (
                    <div key={idx} style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '16px',
                      textAlign: 'center'
                    }} className="!p-4 md:!p-8">
                      <i className={method.icon} style={{ fontSize: '2.5rem', color: '#059669', marginBottom: '1rem' }}></i>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>{method.title}</h4>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#4B5563', marginBottom: '1rem' }}>{method.desc}</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#059669' }}>{method.fee}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Step-by-Step Payment Process
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  borderRadius: '16px',
                  padding: '2.5rem'
                }} className="!p-4 md:!p-10">
                  <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                      'Select your preferred photographer and review their portfolio and pricing',
                      'Choose your booking package and customize any add-on services',
                      'Review the total cost breakdown including service fees and taxes',
                      'Select your payment method and enter payment details securely',
                      'Review and accept our Terms of Service and booking agreement',
                      'Confirm payment - funds are held in escrow until service completion',
                      'Receive booking confirmation via email with all event details'
                    ].map((step, idx) => (
                      <li key={idx} style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151', paddingLeft: '0.5rem' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div style={{
                background: '#DBEAFE',
                border: '2px solid #3B82F6',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <i className="bi bi-info-circle-fill" style={{ fontSize: '1.5rem', color: '#2563EB', flexShrink: 0 }}></i>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1E3A8A', marginBottom: '0.5rem' }}>Important Payment Notes</p>
                    <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[
                        'All payments are processed in USD. Currency conversion rates apply for international transactions.',
                        'A 3.5% platform service fee is added to all bookings to cover escrow protection and support.',
                        'Full payment is required at time of booking unless photographer offers installment plans.',
                        'You will receive email confirmations for all payment activities on your account.'
                      ].map((note, idx) => (
                        <li key={idx} style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#1E40AF' }}>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Payment History */}
            <section id="history" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }} className="!p-6 md:!p-12">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(245, 158, 11, 0.25)'
                }}>
                  <i className="bi bi-clock-history text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Payment History & Tracking
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Track all your payment activities, download invoices, and monitor transaction status from your account dashboard. Complete transparency for all financial transactions.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Accessing Your Payment History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      step: 'Navigate to Dashboard',
                      desc: 'Log in to your account and click on "My Bookings" in the main navigation menu'
                    },
                    {
                      step: 'View Transaction List',
                      desc: 'See all past and pending payments with date, photographer name, and amount'
                    },
                    {
                      step: 'Check Payment Status',
                      desc: 'Monitor real-time status: Pending, In Escrow, Released, Refunded, or Failed'
                    },
                    {
                      step: 'Download Invoices',
                      desc: 'Click on any transaction to download detailed PDF invoices for your records'
                    },
                    {
                      step: 'Filter & Search',
                      desc: 'Use filters to find specific transactions by date range, photographer, or status'
                    },
                    {
                      step: 'Export Reports',
                      desc: 'Download CSV reports of all transactions for accounting and tax purposes'
                    }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      padding: '1.5rem',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#f59e0b',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>{idx + 1}</div>
                        <div>
                          <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{item.step}</p>
                          <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Understanding Payment Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { status: 'Pending', color: '#6B7280', desc: 'Payment is being processed by your payment provider' },
                    { status: 'In Escrow', color: '#3B82F6', desc: 'Payment successfully held in escrow until service completion' },
                    { status: 'Released', color: '#10b981', desc: 'Funds released to photographer after successful completion' },
                    { status: 'Refunded', color: '#f59e0b', desc: 'Payment refunded to your original payment method' },
                    { status: 'Failed', color: '#ef4444', desc: 'Payment was declined - please try another method' }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      padding: '1.25rem',
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}40`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: item.color,
                        flexShrink: 0
                      }}></div>
                      <div>
                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827', marginRight: '8px' }}>{item.status}:</span>
                        <span style={{ fontSize: '0.95rem', color: '#4B5563' }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 4: Refunds & Cancellations */}
            <section id="refunds" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }} className="!p-6 md:!p-12">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(239, 68, 68, 0.25)'
                }}>
                  <i className="bi bi-arrow-counterclockwise text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Refunds & Cancellations
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Understand our refund policies, cancellation procedures, and timelines. We strive to be fair to both clients and photographers while maintaining clear guidelines for all scenarios.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Cancellation Policy
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(239, 68, 68, 0.08) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '16px',
                  padding: '2.5rem'
                }} className="!p-4 md:!p-10">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {[
                      {
                        timeframe: '48+ Hours Before Event',
                        refund: '100% Full Refund',
                        details: 'Cancel without penalty. Full refund processed to original payment method within 5-7 business days.'
                      },
                      {
                        timeframe: '24-48 Hours Before Event',
                        refund: '50% Refund',
                        details: 'Photographer retains 50% as compensation for blocked calendar and preparation time.'
                      },
                      {
                        timeframe: 'Less Than 24 Hours',
                        refund: 'No Refund',
                        details: 'No refund available. Photographer has already committed resources and declined other bookings.'
                      },
                      {
                        timeframe: 'Photographer Cancels',
                        refund: '100% Full Refund + Credit',
                        details: 'Immediate full refund plus $50 platform credit for the inconvenience.'
                      }
                    ].map((policy, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#dc2626', margin: 0 }}>
                            <i className="bi bi-calendar-x" style={{ marginRight: '8px' }}></i>
                            {policy.timeframe}
                          </h4>
                          <span style={{
                            padding: '0.5rem 1rem',
                            background: idx === 0 || idx === 3 ? '#10b981' : idx === 1 ? '#f59e0b' : '#6B7280',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            {policy.refund}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563', margin: 0 }}>
                          {policy.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  How to Request a Refund
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      'Go to "My Bookings" and locate the booking you want to cancel',
                      'Click on the booking to view details and select "Request Cancellation"',
                      'Provide a brief reason for cancellation (helps us improve our service)',
                      'Review the refund amount based on our cancellation policy',
                      'Confirm cancellation request - photographer will be notified immediately',
                      'Refund is automatically processed based on cancellation timeframe',
                      'Receive confirmation email with refund details and timeline'
                    ].map((step, idx) => (
                      <li key={idx} style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151', paddingLeft: '0.5rem' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div style={{
                background: '#FEF3C7',
                border: '2px solid #F59E0B',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.5rem', color: '#D97706', flexShrink: 0 }}></i>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#92400E', marginBottom: '0.5rem' }}>Weather & Emergency Exceptions</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#78350F' }}>
                      In cases of severe weather, natural disasters, or documented emergencies, our support team can override standard cancellation policies. Contact support with documentation (weather alerts, medical certificates, etc.) for case-by-case review and potential full refund regardless of timing.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Photographer Earnings */}
            <section id="earnings" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }} className="!p-6 md:!p-12">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(139, 92, 246, 0.25)'
                }}>
                  <i className="bi bi-wallet2 text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Photographer Earnings & Payouts
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Information for photographers on how earnings are calculated, when payouts occur, and how to track your income through the platform.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Earnings Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {[
                    {
                      title: 'Your Listing Price',
                      amount: '$500',
                      color: '#10b981',
                      desc: 'The price you set for your services'
                    },
                    {
                      title: 'Platform Fee (15%)',
                      amount: '-$75',
                      color: '#ef4444',
                      desc: 'Covers escrow, payment processing, and support'
                    },
                    {
                      title: 'Your Net Earnings',
                      amount: '$425',
                      color: '#083A85',
                      desc: 'Amount deposited to your account'
                    }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      padding: '2rem',
                      background: 'white',
                      border: `2px solid ${item.color}`,
                      borderRadius: '16px',
                      textAlign: 'center'
                    }} className="!p-4 md:!p-8">
                      <h4 style={{ fontSize: '3rem', fontWeight: '700', color: item.color, marginBottom: '0.5rem' }}>{item.amount}</h4>
                      <p style={{ fontSize: '1.05rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>{item.title}</p>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Payout Schedule & Methods
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(139, 92, 246, 0.08) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '2.5rem'
                }} className="!p-4 md:!p-10">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#7c3aed', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="bi bi-calendar-check"></i>
                        When You Get Paid
                      </h4>
                      <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          'Funds released from escrow 7 days after final delivery (or immediately upon client approval)',
                          'Automatic weekly payouts every Friday for all released earnings from previous week',
                          'Minimum payout threshold: $50 (earnings below this carry over to next payout)',
                          'First payout may take 10-14 days for account verification purposes'
                        ].map((point, idx) => (
                          <li key={idx} style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151' }}>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#7c3aed', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="bi bi-bank"></i>
                        Payout Methods
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { method: 'PayPal Transfer', time: 'Instant', fee: '$1.50 per transfer' },
                          { method: 'Wire Transfer (International)', time: '3-5 business days', fee: '$25 per transfer' },
                          { method: 'Check by Mail', time: '7-10 business days', fee: '$5 per check' }
                        ].map((option, idx) => (
                          <div key={idx} style={{
                            padding: '1.25rem',
                            background: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px'
                          }}>
                            <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{option.method}</p>
                            <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Processing: {option.time}</p>
                            <p style={{ fontSize: '0.85rem', color: option.fee === 'Free' ? '#10b981' : '#6B7280', fontWeight: '600' }}>{option.fee}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Tracking Your Earnings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'View real-time earnings dashboard with pending, available, and paid amounts',
                    'Download detailed earning statements for tax reporting purposes',
                    'Track individual booking earnings with client names and service dates',
                    'Receive automatic 1099 tax forms at year-end for US-based photographers',
                    'Set up earning goals and monitor your monthly performance metrics',
                    'Export earnings data to CSV for integration with accounting software'
                  ].map((feature, idx) => (
                    <div key={idx} style={{
                      padding: '1.25rem',
                      background: 'rgba(139, 92, 246, 0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.15)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'start',
                      gap: '10px'
                    }}>
                      <i className="bi bi-check-circle-fill" style={{ color: '#8b5cf6', fontSize: '1.25rem', flexShrink: 0 }}></i>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#374151', margin: 0 }}>{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 6: Payment Security */}
            <section id="security" style={{ padding: '4rem 3rem' }} className="!p-6 md:!p-12">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(220, 38, 38, 0.25)'
                }}>
                  <i className="bi bi-shield-lock-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Payment Security & Protection
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Your financial security is our top priority. We employ industry-leading security measures, encryption standards, and compliance protocols to protect every transaction on our platform.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Security Measures We Implement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: 'bi-lock-fill',
                      title: 'SSL/TLS Encryption',
                      desc: '256-bit encryption for all data transmission. Your payment information is never stored in plain text.',
                      color: '#dc2626'
                    },
                    {
                      icon: 'bi-shield-check',
                      title: 'PCI-DSS Compliance',
                      desc: 'Fully certified Payment Card Industry Data Security Standard compliance for secure card processing.',
                      color: '#10b981'
                    },
                    {
                      icon: 'bi-fingerprint',
                      title: 'Two-Factor Authentication',
                      desc: 'Optional 2FA adds an extra layer of security for high-value transactions and account access.',
                      color: '#3B82F6'
                    },
                    {
                      icon: 'bi-eye-slash',
                      title: 'Tokenization',
                      desc: 'Card details are converted to secure tokens. We never see or store your full card number.',
                      color: '#8b5cf6'
                    },
                    {
                      icon: 'bi-graph-up',
                      title: 'Fraud Detection',
                      desc: 'AI-powered monitoring detects and prevents fraudulent transactions in real-time.',
                      color: '#f59e0b'
                    },
                    {
                      icon: 'bi-file-earmark-lock',
                      title: 'Regular Security Audits',
                      desc: 'Third-party penetration testing and security audits conducted quarterly.',
                      color: '#6B7280'
                    }
                  ].map((measure, idx) => (
                    <div key={idx} style={{
                      padding: '2rem',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }} className="!p-4 md:!p-8">
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: measure.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                      }}>
                        <i className={measure.icon} style={{ color: 'white', fontSize: '1.5rem' }}></i>
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>{measure.title}</h4>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{measure.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Your Role in Payment Security
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.04) 0%, rgba(220, 38, 38, 0.08) 100%)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  borderRadius: '16px',
                  padding: '2.5rem'
                }} className="!p-4 md:!p-10">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                      {
                        icon: 'bi-key-fill',
                        title: 'Use Strong Passwords',
                        desc: 'Create unique passwords with uppercase, lowercase, numbers, and special characters. Never reuse passwords from other sites.'
                      },
                      {
                        icon: 'bi-envelope-exclamation',
                        title: 'Beware of Phishing',
                        desc: 'We will never ask for your password or full card number via email. Always verify URLs before entering sensitive information.'
                      },
                      {
                        icon: 'bi-wifi-off',
                        title: 'Avoid Public WiFi',
                        desc: 'Don\'t make payments over unsecured public networks. Use your mobile data or a trusted VPN if necessary.'
                      },
                      {
                        icon: 'bi-bell',
                        title: 'Enable Notifications',
                        desc: 'Turn on transaction alerts to immediately detect any unauthorized activity on your account.'
                      },
                      {
                        icon: 'bi-arrow-clockwise',
                        title: 'Keep Software Updated',
                        desc: 'Regularly update your browser, operating system, and antivirus software to patch security vulnerabilities.'
                      },
                      {
                        icon: 'bi-exclamation-triangle',
                        title: 'Report Suspicious Activity',
                        desc: 'Contact our security team immediately if you notice unauthorized charges or suspicious account behavior.'
                      }
                    ].map((tip, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <i className={tip.icon} style={{ color: 'white', fontSize: '1.1rem' }}></i>
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{tip.title}</h4>
                          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#4B5563', margin: 0 }}>{tip.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#DBEAFE',
                border: '2px solid #3B82F6',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <i className="bi bi-shield-fill-check" style={{ fontSize: '1.5rem', color: '#2563EB', flexShrink: 0 }}></i>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1E3A8A', marginBottom: '0.5rem' }}>Our Security Guarantee</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#1E40AF' }}>
                      If unauthorized charges occur due to a security breach on our platform (not due to compromised user credentials), we provide 100% protection and immediate refund. We maintain $5M cyber insurance coverage and work with leading payment security providers to ensure your transactions are always protected.
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Back to Help Center CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #083A85 0%, #0a4aa3 100%)',
            borderRadius: '24px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(8, 58, 133, 0.25)',
            marginTop: '4rem'
          }} className="!p-6 md:!p-12 !mt-8 md:!mt-16">
            <div style={{
              width: '72px',
              height: '72px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)'
            }}>
              <i className="bi bi-headset" style={{ fontSize: '2.25rem', color: 'white' }}></i>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>Payment Questions?</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto 2rem' }}>
              Our payment support team is available to help with billing inquiries, transaction issues, and refund requests.
            </p>
            <Link
              href="/user/help-center"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 36px',
                backgroundColor: 'white',
                color: '#083A85',
                fontWeight: '600',
                fontSize: '1.05rem',
                borderRadius: '12px',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease'
              }}
              className="hover:scale-105 hover:shadow-xl"
            >
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

export default PaymentHelp;
