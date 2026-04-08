'use client';

import React, { useState } from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Link from 'next/link';

const TechnicalSupportHelp: React.FC = () => {
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
              <i className="bi-gear" style={{ fontSize: 18, color: '#fff' }}></i>
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em', fontFamily: "'Pragati Narrow', sans-serif" }}>
              Technical Support
            </h1>
          </div>
          <p style={{ fontSize: 'clamp(13px, 1.1vw, 15px)', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', lineHeight: 1.5 }}>
            Troubleshoot technical issues and get your account running smoothly
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            <Link href="/user/help-center" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Help Center</Link>
            <i className="bi bi-chevron-right" style={{ fontSize: '11px' }}></i>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Technical Support</span>
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

{/* Section 1: Common Technical Issues */}
            <section id="issues" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleSection('issues')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.5rem 3rem',
                  background: openSection === 'issues' ? 'rgba(8, 58, 133, 0.03)' : 'transparent',
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
                  <i className="bi bi-exclamation-triangle text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <span style={{ flex: 1, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '700', color: '#111827' }}>
                  Common Issues
                </span>
                <i className={`bi ${openSection === 'issues' ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '1.1rem', color: '#6B7280', transition: 'transform 0.2s' }}></i>
              </button>
              <div style={{
                maxHeight: openSection === 'issues' ? '5000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                padding: openSection === 'issues' ? '0 3rem 3rem' : '0 3rem',
              }} className={openSection === 'issues' ? '!px-6 md:!px-12 !pb-6 md:!pb-12' : '!px-6 md:!px-12'}>

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
                          'Search your email for "Amoria connekyt" to find your registration confirmation',
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

export default TechnicalSupportHelp;
