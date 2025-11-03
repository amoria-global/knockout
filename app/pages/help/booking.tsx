'use client';

import React from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Link from 'next/link';

const BookingHelp: React.FC = () => {
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
            alt="Booking Help"
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
              <i className="bi bi-calendar-check" style={{ fontSize: '3.5rem', color: 'white' }}></i>
            </div>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '800',
            color: 'white',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            Booking & Management Documentation
          </h1>

          <p style={{
            fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
            color: 'rgba(255, 255, 255, 0.95)',
            maxWidth: '700px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.8',
            fontWeight: '400'
          }}>
            Everything you need to know about booking photographers and managing your sessions
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
            <span style={{ color: 'white' }}>Booking</span>
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
                <i className="bi bi-calendar-check text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>50,000+</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Bookings</p>
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
                <i className="bi bi-star-fill text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>4.8/5</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Rating</p>
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
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>14-21 Days</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Delivery</p>
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
                  { icon: 'bi-search', title: 'How to Book', id: 'booking' },
                  { icon: 'bi-sliders', title: 'Managing Bookings', id: 'managing' },
                  { icon: 'bi-x-circle', title: 'Cancellations', id: 'cancellations' },
                  { icon: 'bi-images', title: 'Photo Delivery', id: 'delivery' },
                  { icon: 'bi-star-fill', title: 'Reviews', id: 'reviews' },
                  { icon: 'bi-shield-exclamation', title: 'Disputes', id: 'disputes' }
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

            {/* Section 1: How to Book a Photographer */}
            <section id="booking" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }} className="!p-6 md:!p-12">
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
                  <i className="bi bi-search text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  How to Book a Photographer
                </h2>
              </div>

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
            <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>Booking Questions?</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto 2rem' }}>
              Need help with your booking? Our support team is available to assist with photographer selection, booking issues, and event planning.
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

export default BookingHelp;
