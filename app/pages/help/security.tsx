'use client';

import React, { useState } from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Link from 'next/link';

const SecurityHelp: React.FC = () => {
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
              <i className="bi-shield-check" style={{ fontSize: 18, color: '#fff' }}></i>
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em', fontFamily: "'Pragati Narrow', sans-serif" }}>
              Security & Privacy
            </h1>
          </div>
          <p style={{ fontSize: 'clamp(13px, 1.1vw, 15px)', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', lineHeight: 1.5 }}>
            Protect your account, data, and photos with our comprehensive security guidelines
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            <Link href="/user/help-center" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Help Center</Link>
            <i className="bi bi-chevron-right" style={{ fontSize: '11px' }}></i>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Security</span>
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

{/* Section 1: Account Security Best Practices */}
            <section id="best-practices" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleSection('best-practices')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.5rem 3rem',
                  background: openSection === 'best-practices' ? 'rgba(8, 58, 133, 0.03)' : 'transparent',
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
                  <i className="bi bi-shield-lock-fill text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <span style={{ flex: 1, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '700', color: '#111827' }}>
                  Account Security Best Practices
                </span>
                <i className={`bi ${openSection === 'best-practices' ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '1.1rem', color: '#6B7280', transition: 'transform 0.2s' }}></i>
              </button>
              <div style={{
                maxHeight: openSection === 'best-practices' ? '5000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                padding: openSection === 'best-practices' ? '0 3rem 3rem' : '0 3rem',
              }} className={openSection === 'best-practices' ? '!px-6 md:!px-12 !pb-6 md:!pb-12' : '!px-6 md:!px-12'}>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Creating a Strong Password
                </h3>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '1.5rem' }}>
                  Your password is your first line of defense against unauthorized access. A strong password significantly reduces the risk of account compromise and protects your personal information and photography assets.
                </p>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }} className="!p-4 md:!p-8">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#083A85', marginBottom: '1.25rem' }}>Password Guidelines:</h4>
                  <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Length:</strong> Use at least 12 characters. Longer passwords are exponentially harder to crack.
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Complexity:</strong> Combine uppercase letters, lowercase letters, numbers, and special symbols (@, #, $, %, etc.).
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Avoid Common Words:</strong> Don't use dictionary words, common phrases, or easily guessable information like birthdays, names, or "password123".
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Unique Passwords:</strong> Never reuse passwords from other websites or services. Each account should have a unique password.
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Password Manager:</strong> Use a reputable password manager (1Password, LastPass, Bitwarden) to generate and securely store complex passwords.
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Regular Updates:</strong> Change your password every 3-6 months, especially if you suspect any security breach.
                    </li>
                  </ul>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Two-Factor Authentication (2FA)
                </h3>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '1.5rem' }}>
                  Two-factor authentication adds an extra layer of security by requiring a second form of verification beyond just your password. Even if someone obtains your password, they cannot access your account without the second factor.
                </p>
                <div style={{
                  background: '#FEF3C7',
                  border: '2px solid #F59E0B',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <i className="bi bi-shield-fill-exclamation" style={{ fontSize: '1.5rem', color: '#D97706', flexShrink: 0 }}></i>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#92400E', marginBottom: '0.5rem' }}>Highly Recommended</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#78350F' }}>
                        We strongly recommend enabling 2FA on your Amoria connekyt account. Accounts with 2FA enabled are 99.9% less likely to be compromised.
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }} className="!p-4 md:!p-8">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#059669', marginBottom: '1.25rem' }}>How to Enable 2FA:</h4>
                  <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Go to <strong>"Account Settings"</strong> &gt; <strong>"Security"</strong> &gt; <strong>"Enable Two-Factor Authentication"</strong>
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Choose your preferred 2FA method: SMS code, authenticator app (Google Authenticator, Authy, Microsoft Authenticator), or email code
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Follow the setup instructions to link your chosen method to your account
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Save your backup codes</strong> in a secure location (password manager or physical safe) – use these if you lose access to your 2FA device
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Once enabled, you'll be prompted for a verification code every time you log in from a new device or browser
                    </li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Recognizing Suspicious Activity
                </h3>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '1.5rem' }}>
                  Being vigilant about unusual account activity can help you detect unauthorized access early and prevent potential damage. Watch for these warning signs:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {[
                    { icon: 'bi-geo-alt-fill', title: 'Unfamiliar Locations', desc: 'Login notifications from locations or devices you don\'t recognize' },
                    { icon: 'bi-pencil-fill', title: 'Unauthorized Changes', desc: 'Changes to your profile, email, password, or settings you didn\'t make' },
                    { icon: 'bi-calendar-x', title: 'Unknown Bookings', desc: 'Bookings, payments, or transactions you don\'t remember initiating' },
                    { icon: 'bi-chat-dots-fill', title: 'Suspicious Messages', desc: 'Messages, reviews, or comments posted from your account without your knowledge' },
                    { icon: 'bi-key-fill', title: 'Password Reset Alerts', desc: 'Notifications about password reset requests you didn\'t initiate' },
                    { icon: 'bi-exclamation-octagon-fill', title: 'Immediate Action Required', desc: 'If you notice any suspicious activity, immediately change your password and contact support' }
                  ].map((item, idx) => (
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
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <i className={item.icon} style={{ color: 'white', fontSize: '1.25rem' }}></i>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{item.title}</h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </section>

            {/* Section 2: Data Privacy & Protection */}
            <section id="privacy" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleSection('privacy')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.5rem 3rem',
                  background: openSection === 'privacy' ? 'rgba(8, 58, 133, 0.03)' : 'transparent',
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
                  <i className="bi bi-file-lock2-fill text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <span style={{ flex: 1, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '700', color: '#111827' }}>
                  Data Privacy & Protection
                </span>
                <i className={`bi ${openSection === 'privacy' ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '1.1rem', color: '#6B7280', transition: 'transform 0.2s' }}></i>
              </button>
              <div style={{
                maxHeight: openSection === 'privacy' ? '5000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                padding: openSection === 'privacy' ? '0 3rem 3rem' : '0 3rem',
              }} className={openSection === 'privacy' ? '!px-6 md:!px-12 !pb-6 md:!pb-12' : '!px-6 md:!px-12'}>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                We are committed to protecting your personal information and photography assets. Learn about the data we collect, how we use it, and your rights to control your information.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  What Data We Collect
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '16px',
                  padding: '2.5rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {[
                      {
                        category: 'Account Information',
                        items: ['Name, email address, phone number', 'Profile photo and bio', 'Location and service areas', 'Account credentials (encrypted)']
                      },
                      {
                        category: 'Transaction Data',
                        items: ['Booking history and payment records', 'Communication between clients and photographers', 'Reviews and ratings', 'Dispute records']
                      },
                      {
                        category: 'Technical Data',
                        items: ['IP address and device information', 'Browser type and operating system', 'Login timestamps and location data', 'Cookies and site usage analytics']
                      },
                      {
                        category: 'Content Data',
                        items: ['Uploaded photography portfolios', 'Event photos and videos', 'Messages and support tickets', 'User-generated content (posts, comments)']
                      }
                    ].map((data, idx) => (
                      <div key={idx}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#059669', marginBottom: '1rem' }}>
                          <i className="bi bi-database-fill" style={{ marginRight: '8px' }}></i>
                          {data.category}
                        </h4>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {data.items.map((item, iIdx) => (
                            <li key={iIdx} style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151' }}>
                              {item}
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
                  How We Protect Your Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: 'bi-lock-fill', title: 'End-to-End Encryption', desc: 'All data transmissions use 256-bit SSL encryption' },
                    { icon: 'bi-server', title: 'Secure Cloud Storage', desc: 'Data stored in SOC 2 compliant data centers with redundancy' },
                    { icon: 'bi-person-lock', title: 'Access Controls', desc: 'Strict role-based access limitations for our staff' },
                    { icon: 'bi-shield-check', title: 'Regular Audits', desc: 'Third-party security audits conducted quarterly' },
                    { icon: 'bi-fire', title: 'Automated Backups', desc: 'Daily encrypted backups with 30-day retention' },
                    { icon: 'bi-incognito', title: 'Data Anonymization', desc: 'Analytics data is anonymized to protect user identity' }
                  ].map((protection, idx) => (
                    <div key={idx} style={{
                      padding: '1.5rem',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'start'
                    }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <i className={protection.icon} style={{ color: 'white', fontSize: '1.15rem' }}></i>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{protection.title}</h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{protection.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Your Data Rights (GDPR & CCPA Compliant)
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      '<strong>Right to Access:</strong> Request a copy of all personal data we hold about you',
                      '<strong>Right to Rectification:</strong> Correct any inaccurate or incomplete information',
                      '<strong>Right to Erasure:</strong> Request deletion of your data (subject to legal retention requirements)',
                      '<strong>Right to Portability:</strong> Export your data in a machine-readable format',
                      '<strong>Right to Object:</strong> Opt-out of marketing communications and data processing',
                      '<strong>Right to Restriction:</strong> Limit how we process your personal information'
                    ].map((right, idx) => (
                      <li key={idx} style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151' }} dangerouslySetInnerHTML={{ __html: right }}></li>
                    ))}
                  </ul>
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563', margin: 0 }}>
                      <i className="bi bi-envelope-fill" style={{ color: '#083A85', marginRight: '8px' }}></i>
                      To exercise any of these rights, contact our Data Protection Officer at <strong>privacy@amoriaconnekyt.com</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </section>

            {/* Section 3: Safe Transactions */}
            <section id="transactions" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleSection('transactions')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.5rem 3rem',
                  background: openSection === 'transactions' ? 'rgba(8, 58, 133, 0.03)' : 'transparent',
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
                  <i className="bi bi-cash-coin text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <span style={{ flex: 1, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '700', color: '#111827' }}>
                  Safe Transactions
                </span>
                <i className={`bi ${openSection === 'transactions' ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '1.1rem', color: '#6B7280', transition: 'transform 0.2s' }}></i>
              </button>
              <div style={{
                maxHeight: openSection === 'transactions' ? '5000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                padding: openSection === 'transactions' ? '0 3rem 3rem' : '0 3rem',
              }} className={openSection === 'transactions' ? '!px-6 md:!px-12 !pb-6 md:!pb-12' : '!px-6 md:!px-12'}>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Protect yourself from scams and fraudulent activity during bookings and payments. Follow these guidelines to ensure safe transactions on our platform.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Red Flags to Watch For
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(239, 68, 68, 0.08) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '16px',
                  padding: '2.5rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                      {
                        flag: 'Requests for Off-Platform Payment',
                        warning: 'Never send money through wire transfers, gift cards, cryptocurrency, or payment apps outside our platform. All legitimate transactions must go through our escrow system.',
                        severity: 'high'
                      },
                      {
                        flag: 'Too Good to Be True Prices',
                        warning: 'Extremely low prices compared to market rates may indicate a scam. Verify photographer credentials and reviews carefully.',
                        severity: 'medium'
                      },
                      {
                        flag: 'Urgent Pressure Tactics',
                        warning: 'Scammers create urgency ("book now or lose the deal"). Legitimate photographers allow time for consideration.',
                        severity: 'high'
                      },
                      {
                        flag: 'Unverified or New Accounts',
                        warning: 'Be cautious with accounts having no reviews, portfolio, or verification badges. Check their join date and activity.',
                        severity: 'medium'
                      },
                      {
                        flag: 'Requests for Upfront Payment Without Contract',
                        warning: 'All bookings should have clear contracts through our platform before any payment is made.',
                        severity: 'high'
                      }
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '12px',
                        border: `2px solid ${item.severity === 'high' ? '#ef4444' : '#f59e0b'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '0.75rem' }}>
                          <i className="bi bi-exclamation-triangle-fill" style={{
                            fontSize: '1.5rem',
                            color: item.severity === 'high' ? '#ef4444' : '#f59e0b',
                            flexShrink: 0
                          }}></i>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#111827', margin: 0 }}>{item.flag}</h4>
                        </div>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563', margin: 0, paddingLeft: '2.5rem' }}>
                          {item.warning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Safe Transaction Checklist
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Always use our platform\'s escrow payment system',
                    'Verify photographer identity through badges and reviews',
                    'Read and understand the service agreement before booking',
                    'Communicate only through our platform messaging system',
                    'Keep detailed records of all conversations and agreements',
                    'Report suspicious behavior to our security team immediately',
                    'Review photographer portfolio and past client feedback',
                    'Never share sensitive personal information unnecessarily'
                  ].map((tip, idx) => (
                    <div key={idx} style={{
                      padding: '1.25rem',
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'start',
                      gap: '10px'
                    }}>
                      <i className="bi bi-check-circle-fill" style={{ color: '#f59e0b', fontSize: '1.25rem', flexShrink: 0 }}></i>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#374151', margin: 0 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: '#FEF3C7',
                border: '2px solid #F59E0B',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <i className="bi bi-shield-fill-check" style={{ fontSize: '1.5rem', color: '#D97706', flexShrink: 0 }}></i>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#92400E', marginBottom: '0.5rem' }}>Our Fraud Protection Guarantee</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#78350F' }}>
                      If you follow our safe transaction guidelines and are still victimized by fraud on our platform, we offer buyer protection coverage up to the booking amount. Contact support within 48 hours of discovering the fraud with evidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </section>

            {/* Section 4: Managing Privacy Settings */}
            <section id="settings" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleSection('settings')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.5rem 3rem',
                  background: openSection === 'settings' ? 'rgba(8, 58, 133, 0.03)' : 'transparent',
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
                  <i className="bi bi-sliders text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <span style={{ flex: 1, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '700', color: '#111827' }}>
                  Managing Privacy Settings
                </span>
                <i className={`bi ${openSection === 'settings' ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '1.1rem', color: '#6B7280', transition: 'transform 0.2s' }}></i>
              </button>
              <div style={{
                maxHeight: openSection === 'settings' ? '5000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                padding: openSection === 'settings' ? '0 3rem 3rem' : '0 3rem',
              }} className={openSection === 'settings' ? '!px-6 md:!px-12 !pb-6 md:!pb-12' : '!px-6 md:!px-12'}>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Take control of your privacy with our comprehensive settings. Customize what information is visible, who can contact you, and how your data is used across the platform.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Accessing Privacy Settings
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(139, 92, 246, 0.08) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      'Log in to your Amoria connekyt account',
                      'Click on your profile photo in the top right corner',
                      'Select "Account Settings" from the dropdown menu',
                      'Navigate to the "Privacy & Security" tab',
                      'Review and adjust settings according to your preferences',
                      'Click "Save Changes" to apply your new privacy configuration'
                    ].map((step, idx) => (
                      <li key={idx} style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151', paddingLeft: '0.5rem' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Privacy Settings You Can Control
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {[
                    {
                      setting: 'Profile Visibility',
                      options: ['Public (visible to everyone)', 'Private (only visible to connections)', 'Hidden (only visible when you initiate contact)'],
                      icon: 'bi-eye-fill'
                    },
                    {
                      setting: 'Contact Permissions',
                      options: ['Anyone can message me', 'Only verified photographers/clients', 'Only people I\'ve previously interacted with', 'No one (account on hold)'],
                      icon: 'bi-chat-dots-fill'
                    },
                    {
                      setting: 'Portfolio Privacy (Photographers)',
                      options: ['Public portfolio visible to all', 'Portfolio visible only to logged-in users', 'Portfolio visible only upon booking request'],
                      icon: 'bi-images'
                    },
                    {
                      setting: 'Location Sharing',
                      options: ['Share exact location', 'Share city/region only', 'Don\'t share location', 'Share only when booking confirmed'],
                      icon: 'bi-geo-alt-fill'
                    },
                    {
                      setting: 'Search Engine Indexing',
                      options: ['Allow search engines to find my profile', 'Block search engines (profile only visible on platform)'],
                      icon: 'bi-search'
                    },
                    {
                      setting: 'Data Usage for Recommendations',
                      options: ['Allow personalized recommendations', 'Use only basic matching', 'Opt out of recommendation algorithms'],
                      icon: 'bi-graph-up'
                    }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      padding: '2rem',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#8b5cf6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className={item.icon} style={{ color: 'white', fontSize: '1.15rem' }}></i>
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', margin: 0 }}>{item.setting}</h4>
                      </div>
                      <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {item.options.map((option, oIdx) => (
                          <li key={oIdx} style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280' }}>
                            {option}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: '#DBEAFE',
                border: '2px solid #3B82F6',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <i className="bi bi-lightbulb-fill" style={{ fontSize: '1.5rem', color: '#2563EB', flexShrink: 0 }}></i>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1E3A8A', marginBottom: '0.5rem' }}>Privacy Best Practice</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#1E40AF' }}>
                      We recommend using "Verified users only" contact settings and enabling profile visibility restrictions until you've established trust. You can always make your profile more public later as you become more comfortable with the platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </section>

            {/* Section 5: Data Breach Response */}
            <section id="breach" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleSection('breach')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.5rem 3rem',
                  background: openSection === 'breach' ? 'rgba(8, 58, 133, 0.03)' : 'transparent',
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
                  <i className="bi bi-exclamation-triangle-fill text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <span style={{ flex: 1, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '700', color: '#111827' }}>
                  Data Breach Response
                </span>
                <i className={`bi ${openSection === 'breach' ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '1.1rem', color: '#6B7280', transition: 'transform 0.2s' }}></i>
              </button>
              <div style={{
                maxHeight: openSection === 'breach' ? '5000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                padding: openSection === 'breach' ? '0 3rem 3rem' : '0 3rem',
              }} className={openSection === 'breach' ? '!px-6 md:!px-12 !pb-6 md:!pb-12' : '!px-6 md:!px-12'}>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                While we employ stringent security measures, it's important to understand our incident response procedures and what actions you should take if a data breach occurs.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Our Breach Response Commitment
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(239, 68, 68, 0.08) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '16px',
                  padding: '2.5rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {[
                      {
                        title: 'Immediate Detection & Containment',
                        desc: '24/7 security monitoring detects anomalies in real-time. Our incident response team isolates affected systems within minutes to prevent further unauthorized access.'
                      },
                      {
                        title: 'Transparent Communication (72 Hours)',
                        desc: 'In compliance with GDPR and CCPA, we notify affected users within 72 hours of confirming a breach. Notification includes what data was compromised and recommended protective actions.'
                      },
                      {
                        title: 'Law Enforcement Collaboration',
                        desc: 'We work with cybercrime units and regulatory authorities to investigate the breach, identify perpetrators, and prevent future incidents.'
                      },
                      {
                        title: 'Free Credit Monitoring',
                        desc: 'If financial or identity information is compromised, we provide 12 months of free credit monitoring and identity theft protection services to all affected users.'
                      },
                      {
                        title: 'Post-Incident Security Enhancements',
                        desc: 'We conduct thorough security audits after any incident and implement additional safeguards to prevent similar breaches in the future.'
                      }
                    ].map((commitment, idx) => (
                      <div key={idx}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.75rem' }}>
                          <i className="bi bi-shield-fill-check" style={{ marginRight: '8px' }}></i>
                          {commitment.title}
                        </h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563', margin: 0 }}>
                          {commitment.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  What You Should Do If Notified of a Breach
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                      '<strong>Immediate:</strong> Change your password immediately using our password reset process',
                      '<strong>Within 24 Hours:</strong> Enable two-factor authentication if not already active',
                      '<strong>Review Account:</strong> Check recent login activity, bookings, and messages for suspicious behavior',
                      '<strong>Update Other Accounts:</strong> If you reused this password elsewhere, change it on all other sites',
                      '<strong>Monitor Financial Accounts:</strong> Check bank and credit card statements for unauthorized transactions',
                      '<strong>Contact Support:</strong> Reach out to our security team if you notice any unauthorized activity',
                      '<strong>Be Alert for Phishing:</strong> Scammers may use breach data for targeted phishing - verify all communications',
                      '<strong>Consider Credit Freeze:</strong> If financial data was compromised, consider placing a credit freeze'
                    ].map((action, idx) => (
                      <div key={idx} style={{
                        padding: '1rem',
                        background: 'white',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#374151', margin: 0 }} dangerouslySetInnerHTML={{ __html: action }}></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#FEE2E2',
                border: '2px solid #EF4444',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <i className="bi bi-telephone-fill" style={{ fontSize: '1.5rem', color: '#DC2626', flexShrink: 0 }}></i>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#991B1B', marginBottom: '0.5rem' }}>Security Incident Hotline</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#7F1D1D' }}>
                      If you suspect your account has been compromised or notice suspicious activity, contact our 24/7 Security Incident Response Team immediately at <strong>security@amoriaconnekyt.com</strong> or call <strong>1-800-SECURE-AC</strong>. Do not delay - early reporting significantly reduces potential damage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </section>

            {/* Section 6: Content Moderation */}
            <section id="moderation" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleSection('moderation')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.5rem 3rem',
                  background: openSection === 'moderation' ? 'rgba(8, 58, 133, 0.03)' : 'transparent',
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
                  <i className="bi bi-shield-fill-check text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <span style={{ flex: 1, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '700', color: '#111827' }}>
                  Content Moderation
                </span>
                <i className={`bi ${openSection === 'moderation' ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '1.1rem', color: '#6B7280', transition: 'transform 0.2s' }}></i>
              </button>
              <div style={{
                maxHeight: openSection === 'moderation' ? '5000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
                padding: openSection === 'moderation' ? '0 3rem 3rem' : '0 3rem',
              }} className={openSection === 'moderation' ? '!px-6 md:!px-12 !pb-6 md:!pb-12' : '!px-6 md:!px-12'}>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                We maintain a safe, respectful community through proactive content moderation, clear community guidelines, and swift action against violations. Learn about our policies and how to report concerns.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Content Moderation Process
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(59, 130, 246, 0.08) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '2.5rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {[
                      {
                        method: 'AI-Powered Pre-Screening',
                        desc: 'All uploaded images and text content are automatically scanned for prohibited content including explicit material, violence, hate speech, and copyright violations before publication.'
                      },
                      {
                        method: 'Human Review Team',
                        desc: 'Our trained moderation team reviews flagged content within 2 hours during business hours and 6 hours outside business hours. Complex cases are reviewed by senior moderators.'
                      },
                      {
                        method: 'Community Reporting',
                        desc: 'Users can report inappropriate content, profiles, or messages. All reports are taken seriously and investigated promptly with reporter anonymity protected.'
                      },
                      {
                        method: 'Photographer Verification',
                        desc: 'All photographer portfolios undergo manual review to ensure authenticity, professional quality, and compliance with content guidelines before approval.'
                      },
                      {
                        method: 'Progressive Enforcement',
                        desc: 'First offense: Warning and content removal. Second offense: Temporary suspension. Severe or repeated violations: Permanent account termination and potential legal action.'
                      }
                    ].map((process, idx) => (
                      <div key={idx}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#2563EB', marginBottom: '0.75rem' }}>
                          <i className="bi bi-check2-circle" style={{ marginRight: '8px' }}></i>
                          {process.method}
                        </h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563', margin: 0 }}>
                          {process.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Prohibited Content
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: 'bi-x-circle-fill', title: 'Explicit/Adult Content', desc: 'Nudity, sexual content, or adult services' },
                    { icon: 'bi-x-circle-fill', title: 'Violence & Gore', desc: 'Graphic violence, blood, or disturbing imagery' },
                    { icon: 'bi-x-circle-fill', title: 'Hate Speech', desc: 'Discrimination based on race, religion, gender, etc.' },
                    { icon: 'bi-x-circle-fill', title: 'Harassment & Bullying', desc: 'Threatening, abusive, or intimidating behavior' },
                    { icon: 'bi-x-circle-fill', title: 'Spam & Scams', desc: 'Unsolicited advertisements or fraudulent schemes' },
                    { icon: 'bi-x-circle-fill', title: 'Copyright Infringement', desc: 'Unauthorized use of copyrighted images or content' },
                    { icon: 'bi-x-circle-fill', title: 'Illegal Activities', desc: 'Content promoting illegal acts or services' },
                    { icon: 'bi-x-circle-fill', title: 'Misinformation', desc: 'Deliberately false or misleading information' }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      padding: '1.25rem',
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'start',
                      gap: '10px'
                    }}>
                      <i className={item.icon} style={{ color: '#ef4444', fontSize: '1.25rem', flexShrink: 0 }}></i>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>{item.title}</h4>
                        <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  How to Report Violations
                </h3>
                <div style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      'Navigate to the content, profile, or message you want to report',
                      'Click the three-dot menu icon (⋯) and select "Report"',
                      'Choose the violation category that best describes the issue',
                      'Provide additional context or details about the violation (optional but helpful)',
                      'Submit the report - you\'ll receive a confirmation with a reference number',
                      'Our moderation team will review within 2-6 hours and take appropriate action',
                      'You\'ll be notified of the outcome via email (reporter identity remains confidential)'
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
                  <i className="bi bi-people-fill" style={{ fontSize: '1.5rem', color: '#2563EB', flexShrink: 0 }}></i>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1E3A8A', marginBottom: '0.5rem' }}>Community-First Approach</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#1E40AF' }}>
                      We believe in empowering our community to maintain safety standards. Every report is valuable and helps us maintain a professional, respectful environment. False reports are also investigated to prevent abuse of the reporting system. Together, we create a trusted platform for photographers and clients.
                    </p>
                  </div>
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

export default SecurityHelp;
