'use client';

import React from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Link from 'next/link';

const TechnicalSupportHelp: React.FC = () => {
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
            alt="Technical Support Help"
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
              <i className="bi bi-gear" style={{ fontSize: '3.5rem', color: 'white' }}></i>
            </div>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '800',
            color: 'white',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            Technical Support Documentation
          </h1>

          <p style={{
            fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
            color: 'rgba(255, 255, 255, 0.95)',
            maxWidth: '700px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.8',
            fontWeight: '400'
          }}>
            Troubleshoot technical issues and get your account running smoothly
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
            <span style={{ color: 'white' }}>Technical Support</span>
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
                <i className="bi bi-clock text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>24 Hours</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Response</p>
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
                <i className="bi bi-check-circle text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>95%</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Resolution</p>
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
                <i className="bi bi-headset text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>24/7</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Support</p>
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
                  { icon: 'bi-exclamation-triangle', title: 'Common Issues', id: 'issues' },
                  { icon: 'bi-browser-chrome', title: 'Browser Compatibility', id: 'browser' },
                  { icon: 'bi-credit-card-2-back', title: 'Payment Technical', id: 'payment' },
                  { icon: 'bi-images', title: 'Photo Gallery', id: 'gallery' },
                  { icon: 'bi-phone', title: 'Mobile App', id: 'mobile' },
                  { icon: 'bi-envelope', title: 'Contact Support', id: 'contact' }
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

            {/* Section 1: Common Technical Issues */}
            <section id="issues" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }} className="!p-6 md:!p-12">
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
                  <i className="bi bi-exclamation-triangle text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Common Technical Issues
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Most technical issues can be resolved quickly with these troubleshooting steps. If problems persist after trying these solutions, please contact our technical support team for personalized assistance.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Login Problems
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  marginBottom: '2rem'
                }} className="!p-4 md:!p-10">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {[
                      {
                        issue: 'Forgot Password',
                        solutions: [
                          'Click "Forgot Password" on the login page',
                          'Enter your registered email address',
                          'Check your inbox for password reset link (check spam folder if not received)',
                          'Reset link expires in 1 hour - request a new one if expired',
                          'Create a strong new password following our security guidelines'
                        ]
                      },
                      {
                        issue: 'Account Locked',
                        solutions: [
                          'Accounts are temporarily locked after 5 failed login attempts',
                          'Wait 15 minutes before attempting to log in again',
                          'Use "Forgot Password" to reset and unlock your account immediately',
                          'Ensure Caps Lock is off and you\'re entering the correct credentials',
                          'Contact support if you suspect unauthorized access attempts'
                        ]
                      },
                      {
                        issue: 'Email Not Recognized',
                        solutions: [
                          'Verify you\'re using the exact email address used during registration',
                          'Check for typos or extra spaces in the email field',
                          'Try logging in with alternative email addresses you may have used',
                          'Search your email for "Amoria Connekt" to find your registration confirmation',
                          'Create a new account if you cannot locate your original registration'
                        ]
                      }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#083A85', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className="bi bi-tools"></i>
                          {item.issue}
                        </h4>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {item.solutions.map((solution, sIdx) => (
                            <li key={sIdx} style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151' }}>
                              {solution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Page Loading Issues
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }} className="!p-4 md:!p-8">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#059669', marginBottom: '1.25rem' }}>Quick Fixes:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        step: 'Clear Browser Cache',
                        action: 'Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac), select "Cached images and files", and clear data'
                      },
                      {
                        step: 'Disable Browser Extensions',
                        action: 'Ad blockers and privacy extensions may interfere. Temporarily disable them and reload the page'
                      },
                      {
                        step: 'Update Your Browser',
                        action: 'Ensure you\'re using the latest version of Chrome, Firefox, Safari, or Edge for optimal performance'
                      },
                      {
                        step: 'Check Internet Connection',
                        action: 'Test your connection speed. Minimum 3 Mbps required for smooth platform usage'
                      },
                      {
                        step: 'Try Incognito Mode',
                        action: 'Open a private/incognito window to rule out extension or cache issues'
                      },
                      {
                        step: 'Restart Your Device',
                        action: 'A simple device restart can resolve many temporary technical glitches'
                      }
                    ].map((fix, idx) => (
                      <div key={idx} style={{
                        padding: '1.25rem',
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px'
                      }} className="!p-4 md:!p-5">
                        <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                          {idx + 1}. {fix.step}
                        </p>
                        <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>
                          {fix.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Upload & Download Problems
                </h3>
                <div style={{
                  background: '#FEF3C7',
                  border: '2px solid #F59E0B',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <i className="bi bi-info-circle-fill" style={{ fontSize: '1.5rem', color: '#D97706', flexShrink: 0 }}></i>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#92400E', marginBottom: '0.5rem' }}>File Size Limits</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#78350F' }}>
                        Maximum file size: 50MB per image, 500MB per video. Supported formats: JPG, PNG, HEIC for photos; MP4, MOV for videos.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    {
                      problem: 'Upload Fails or Freezes',
                      fixes: 'Check file size and format. Compress large files using tools like TinyPNG or HandBrake. Ensure stable internet connection. Try uploading one file at a time instead of bulk upload. Disable VPN if active.'
                    },
                    {
                      problem: 'Download Not Starting',
                      fixes: 'Check browser download settings and permissions. Disable pop-up blockers temporarily. Ensure sufficient storage space on your device. Try right-click and "Save As" if direct download fails.'
                    },
                    {
                      problem: 'Corrupted Files',
                      fixes: 'Re-download the file using a different browser. Check internet stability during download. Verify antivirus isn\'t blocking or quarantining files. Contact photographer to re-upload if issue persists.'
                    },
                    {
                      problem: 'Slow Upload/Download Speed',
                      fixes: 'Use wired connection instead of WiFi when possible. Close bandwidth-heavy applications. Upload during off-peak hours. Consider upgrading your internet plan if consistently slow.'
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
                        {item.problem}
                      </h4>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151', margin: 0 }}>
                        <strong>Solutions:</strong> {item.fixes}
                      </p>
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
            <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>Still Having Issues?</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto 2rem' }}>
              Our technical support team is standing by to help resolve any platform issues you encounter.
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

export default TechnicalSupportHelp;
