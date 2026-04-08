'use client';

import React, { useState } from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Link from 'next/link';

const BookingHelp: React.FC = () => {
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
              <i className="bi-calendar-check" style={{ fontSize: 18, color: '#fff' }}></i>
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em', fontFamily: "'Pragati Narrow', sans-serif" }}>
              Booking & Management
            </h1>
          </div>
          <p style={{ fontSize: 'clamp(13px, 1.1vw, 15px)', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', lineHeight: 1.5 }}>
            Everything you need to know about booking photographers and managing your sessions
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            <Link href="/user/help-center" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Help Center</Link>
            <i className="bi bi-chevron-right" style={{ fontSize: '11px' }}></i>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Booking</span>
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

{/* Section 1: How to Book a Photographer */}
            <section id="booking" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleSection('booking')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.5rem 3rem',
                  background: openSection === 'booking' ? 'rgba(8, 58, 133, 0.03)' : 'transparent',
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
                  <i className="bi bi-search text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <span style={{ flex: 1, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '700', color: '#111827' }}>
                  How to Book
                </span>
                <i className={`bi ${openSection === 'booking' ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '1.1rem', color: '#6B7280', transition: 'transform 0.2s' }}></i>
              </button>
              <div style={{
                maxHeight: openSection === 'booking' ? '5000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                padding: openSection === 'booking' ? '0 3rem 3rem' : '0 3rem',
              }} className={openSection === 'booking' ? '!px-6 md:!px-12 !pb-6 md:!pb-12' : '!px-6 md:!px-12'}>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Booking a photographer on Amoria connekyt is simple and secure. Our platform connects you with professional photographers who match your specific needs, budget, and style preferences. Follow these steps to find and book your perfect photographer.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Finding Your Photographer
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  marginBottom: '2rem'
                }} className="!p-4 md:!p-10">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#083A85', marginBottom: '1.25rem' }}>Search & Filter Options:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                      {
                        title: 'Location & Availability',
                        desc: 'Use the location filter to find photographers in your area. Check their calendar for available dates that match your event schedule.'
                      },
                      {
                        title: 'Photography Style',
                        desc: 'Browse portfolios to find photographers whose style matches your vision - whether you need wedding, portrait, event, product, or lifestyle photography.'
                      },
                      {
                        title: 'Budget Range',
                        desc: 'Set your budget using the price filter to view photographers within your price range. Prices vary based on experience, package inclusions, and session duration.'
                      },
                      {
                        title: 'Reviews & Ratings',
                        desc: 'Read reviews from previous clients to assess quality, professionalism, and reliability. Look for photographers with high ratings and consistent positive feedback.'
                      },
                      {
                        title: 'Package Comparison',
                        desc: 'Compare different photography packages including hours of coverage, number of edited photos, turnaround time, and additional services like albums or prints.'
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
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Making Your Booking
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }} className="!p-4 md:!p-8">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#059669', marginBottom: '1.25rem' }}>Booking Steps:</h4>
                  <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Click <strong>"Book Now"</strong> on your chosen photographer's profile
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Select your preferred date, time, and photography package
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Provide event details: location, type of event, special requirements, shot list, and any specific requests
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Review the total cost including package price, any add-ons, service fees, and applicable taxes
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Complete secure payment through escrow - funds held until service completion
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Receive instant booking confirmation via email with photographer contact details and booking summary
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Communicate directly with your photographer through our secure messaging platform to finalize shoot details
                    </li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Booking Tips for Best Results
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {[
                    { icon: 'bi-calendar3', title: 'Book Early', desc: 'Reserve popular photographers 4-8 weeks in advance, especially for weddings and peak seasons' },
                    { icon: 'bi-chat-text', title: 'Clear Communication', desc: 'Discuss your vision, must-have shots, and expectations upfront to ensure alignment' },
                    { icon: 'bi-clock', title: 'Realistic Timeline', desc: 'Allow 14-21 days for photo editing and delivery. Rush delivery may incur additional fees' },
                    { icon: 'bi-file-text', title: 'Written Agreement', desc: 'Review the booking terms carefully including cancellation policy, usage rights, and deliverables' },
                    { icon: 'bi-geo-alt', title: 'Location Details', desc: 'Provide exact venue address, parking information, and contact person for the event day' },
                    { icon: 'bi-people', title: 'Shot List', desc: 'Share a list of important people to photograph and specific moments you want captured' }
                  ].map((tip, idx) => (
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
                        <i className={tip.icon} style={{ color: 'white', fontSize: '1.25rem' }}></i>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{tip.title}</h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{tip.desc}</p>
                      </div>
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

export default BookingHelp;
