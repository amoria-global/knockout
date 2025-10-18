'use client';

import React from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Link from 'next/link';

const MyAccountHelp: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)' }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{
        position: 'relative',
        paddingTop: '8rem',
        paddingBottom: '6rem',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0
        }}>
          <img
            src="https://i.pinimg.com/736x/9c/df/a9/9cdfa9455775771fb2bc020c10329698.jpg"
            alt="My Account Help"
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
        }}>
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
              <i className="bi bi-person-circle" style={{ fontSize: '3.5rem', color: 'white' }}></i>
            </div>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '800',
            color: 'white',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            My Account Documentation
          </h1>

          <p style={{
            fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
            color: 'rgba(255, 255, 255, 0.95)',
            maxWidth: '700px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.8',
            fontWeight: '400'
          }}>
            Complete guide to creating, managing, and optimizing your Amoria Connekt account
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
            <span style={{ color: 'white' }}>My Account</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ marginBottom: '3rem' }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(8, 58, 133, 0.08)',
              border: '1px solid rgba(8, 58, 133, 0.08)'
            }}>
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
                <i className="bi bi-people-fill text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>12,500+</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Active Users</p>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(8, 58, 133, 0.08)',
              border: '1px solid rgba(8, 58, 133, 0.08)'
            }}>
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
                <i className="bi bi-patch-check-fill text-white" style={{ fontSize: '1.75rem' }}></i>
              </div>
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>3,200+</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Verified Photographers</p>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(8, 58, 133, 0.08)',
              border: '1px solid rgba(8, 58, 133, 0.08)'
            }}>
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
              <h3 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>3-5 Days</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', fontWeight: '500' }}>Avg. Verification Time</p>
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
            }}>
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
                  { icon: 'bi-person-plus-fill', title: 'Creating Your Account', id: 'create' },
                  { icon: 'bi-person-gear', title: 'Managing Your Profile', id: 'manage' },
                  { icon: 'bi-patch-check-fill', title: 'Account Verification', id: 'verify' },
                  { icon: 'bi-bell-fill', title: 'Notification Preferences', id: 'notifications' },
                  { icon: 'bi-shield-lock-fill', title: 'Account Settings & Privacy', id: 'settings' },
                  { icon: 'bi-tools', title: 'Common Account Issues', id: 'issues' }
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

            {/* Section 1: Creating Your Account */}
            <section id="create" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }}>
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
                  <i className="bi bi-person-plus-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Creating Your Account
                </h2>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Getting Started
                </h3>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '1.5rem' }}>
                  Create your Amoria Connekt account in minutes and join our vibrant photography community. Our streamlined registration process ensures you can start booking photographers or accepting bookings quickly and securely.
                </p>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.04) 0%, rgba(8, 58, 133, 0.08) 100%)',
                  border: '1px solid rgba(8, 58, 133, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem',
                  marginTop: '1.5rem'
                }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#083A85', marginBottom: '1.25rem' }}>Registration Steps:</h4>
                  <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Navigate to Sign Up:</strong> Click the "Sign Up" button located in the top-right corner of the homepage. This will direct you to our registration page.
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Choose Account Type:</strong> Select whether you're registering as a Photographer (to offer services) or a Client (to book photographers).
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Enter Personal Information:</strong> Provide your full name, valid email address, and create a secure password (minimum 8 characters, including uppercase, lowercase, and numbers).
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Email Verification:</strong> Check your inbox for a verification email from Amoria Connekt. Click the verification link to confirm your email address within 24 hours.
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Complete Your Profile:</strong> Upload a professional profile picture, write a compelling bio, and add relevant information about your photography interests or services.
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      <strong>Start Using Platform:</strong> Once your profile is complete, you can immediately start exploring photographers or accepting booking requests.
                    </li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Account Types
                </h3>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '1.5rem' }}>
                  Amoria Connekt offers two distinct account types, each tailored to specific user needs. You can switch between account types at any time from your account settings without losing your data.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div style={{
                    background: 'white',
                    border: '2px solid #083A85',
                    borderRadius: '16px',
                    padding: '2rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                      <i className="bi bi-person-circle" style={{ fontSize: '2rem', color: '#083A85' }}></i>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#083A85', margin: 0 }}>Client Account</h4>
                    </div>
                    <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#4B5563', marginBottom: '1rem' }}>
                      Perfect for individuals and businesses looking to hire professional photographers.
                    </p>
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Browse and book verified photographers</li>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Manage multiple event bookings</li>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Access live streams of your events</li>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Download high-resolution photos</li>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Secure payment via escrow system</li>
                    </ul>
                  </div>
                  <div style={{
                    background: 'white',
                    border: '2px solid #10b981',
                    borderRadius: '16px',
                    padding: '2rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                      <i className="bi bi-camera-fill" style={{ fontSize: '2rem', color: '#10b981' }}></i>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#10b981', margin: 0 }}>Photographer Account</h4>
                    </div>
                    <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#4B5563', marginBottom: '1rem' }}>
                      Designed for professional photographers to showcase work and earn income.
                    </p>
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Create stunning portfolio galleries</li>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Accept and manage bookings</li>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Live stream events in real-time</li>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Receive payments through secure escrow</li>
                      <li style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>Build client reviews and ratings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Managing Your Profile */}
            <section id="manage" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }}>
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
                  <i className="bi bi-person-gear text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Managing Your Profile
                </h2>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Profile Settings
                </h3>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '1.5rem' }}>
                  Your profile is your digital identity on Amoria Connekt. Keeping it up-to-date ensures you make the best impression on potential clients or photographers. A complete, professional profile increases trust and engagement on the platform.
                </p>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#059669', marginBottom: '1.25rem' }}>Updating Your Profile:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>1. Access Profile Settings</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Navigate to "My Account" from the dropdown menu in the navbar (top-right corner). Click "Edit Profile" to access all editable fields.
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>2. Update Personal Information</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Modify your name, email address, phone number, location, and other contact details. Ensure all information is accurate for smooth communication.
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>3. Upload Profile Picture</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Use a professional, high-quality headshot (JPG, PNG, max 5MB). Photos with clear lighting and neutral backgrounds work best. Avoid group photos or heavily filtered images.
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>4. Write a Compelling Bio</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Add a bio that highlights your experience, photography style (for photographers), or event needs (for clients). Keep it concise (150-300 words) and engaging.
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>5. Save Changes</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Click "Save Changes" to publish your updated profile. Changes appear immediately across the platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Photographer Portfolio Management
                </h3>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '1.5rem' }}>
                  For photographers, your portfolio is your most powerful marketing tool. It showcases your style, skill level, and versatility to potential clients. A well-curated portfolio can increase booking requests by up to 300%.
                </p>
                <div style={{
                  background: '#FEF3C7',
                  border: '2px solid #F59E0B',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <i className="bi bi-lightbulb-fill" style={{ fontSize: '1.5rem', color: '#D97706', flexShrink: 0 }}></i>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#92400E', marginBottom: '0.5rem' }}>Pro Tip</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#78350F' }}>
                        Upload your best 20-30 photos rather than hundreds of mediocre ones. Quality always trumps quantity. Organize photos by event type (weddings, corporate, portraits) to help clients find relevant work quickly.
                      </p>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563' }}>
                  To manage your portfolio, go to "My Portfolio" in your photographer dashboard. Upload high-resolution images (minimum 2000px width), organize them into categories (Weddings, Corporate Events, Portraits, Landscapes, etc.), and add detailed descriptions including camera settings, location, and context. Feature your top 5-10 photos on your profile homepage to immediately capture visitor attention.
                </p>
              </div>
            </section>

            {/* Section 3: Account Verification */}
            <section id="verify" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(59, 130, 246, 0.25)'
                }}>
                  <i className="bi bi-patch-check-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Account Verification
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Becoming a verified photographer on Amoria Connekt significantly increases your credibility, visibility, and booking rates. Verified accounts are prioritized in search results and receive exclusive benefits. Our verification process ensures clients can trust they're booking legitimate, professional photographers.
              </p>

              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(59, 130, 246, 0.08) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '16px',
                padding: '2.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1E40AF', marginBottom: '1.5rem' }}>
                  Verification Requirements
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#3B82F6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}>1</div>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Complete Profile</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Ensure all required fields in your profile are filled out, including name, bio, location, contact information, and a professional profile picture.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#3B82F6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}>2</div>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Submit Government ID</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Upload a clear, legible photo of your government-issued ID (National ID, Passport, or Driver's License). Ensure all text is readable and the photo is not expired.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#3B82F6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}>3</div>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Portfolio Samples</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Upload 5-10 high-quality portfolio samples that demonstrate your professional photography skills across different scenarios (weddings, events, portraits, etc.).
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#3B82F6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}>4</div>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Professional Credentials</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Provide proof of professional credentials such as business registration documents, photography certificates, awards, or testimonials from past clients.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#3B82F6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}>5</div>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Wait for Review</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                        Our verification team will review your application within 3-5 business days. You'll receive an email notification with the verification decision.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                Verification Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: 'bi-search', title: 'Higher Search Ranking', desc: 'Verified profiles appear at the top of search results with a blue badge' },
                  { icon: 'bi-star-fill', title: 'Premium Features', desc: 'Access advanced booking tools, analytics, and priority customer support' },
                  { icon: 'bi-graph-up-arrow', title: 'Increased Visibility', desc: 'Featured in "Verified Photographers" showcase and recommendations' },
                  { icon: 'bi-currency-dollar', title: 'Premium Pricing', desc: 'Ability to set higher rates and offer exclusive premium packages' },
                  { icon: 'bi-trophy-fill', title: 'Trust & Credibility', desc: 'Clients are 3x more likely to book verified photographers' },
                  { icon: 'bi-percent', title: 'Lower Platform Fees', desc: 'Reduced commission rates on bookings (12% vs standard 15%)' }
                ].map((benefit, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '1.5rem',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
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

            {/* Section 4: Notification Preferences */}
            <section id="notifications" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(139, 92, 246, 0.25)'
                }}>
                  <i className="bi bi-bell-fill text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Notification Preferences
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Customize how and when you receive notifications to stay informed about bookings, messages, and important account updates without being overwhelmed. Our flexible notification system lets you control every aspect of your communication preferences.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Notification Channels
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(139, 92, 246, 0.08) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem',
                  marginBottom: '2rem'
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { icon: 'bi-envelope-fill', title: 'Email Notifications', desc: 'Receive detailed updates and summaries directly to your inbox. Best for non-urgent information and daily digests.' },
                      { icon: 'bi-phone-fill', title: 'SMS Alerts', desc: 'Get instant text notifications for time-sensitive events like booking confirmations, payment updates, and urgent messages.' },
                      { icon: 'bi-app-indicator', title: 'Push Notifications', desc: 'Real-time alerts through our mobile app and browser. Ideal for staying connected while on the go.' },
                      { icon: 'bi-bell-fill', title: 'In-App Notifications', desc: 'See notifications within the platform dashboard. Perfect for when you\'re actively using Amoria Connekt.' }
                    ].map((channel, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '1.5rem',
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <i className={channel.icon} style={{ color: 'white', fontSize: '1.25rem' }}></i>
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{channel.title}</h4>
                          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{channel.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Customizing Your Preferences
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#059669', marginBottom: '1.25rem' }}>How to Manage Notifications:</h4>
                  <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Navigate to <strong>Account Settings</strong> from the dropdown menu in the top-right corner
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Select <strong>Notifications</strong> from the settings menu
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Choose which notification types you want to receive (Bookings, Messages, Payments, Marketing, etc.)
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Select your preferred delivery method for each notification type (email, SMS, push, or multiple)
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Set notification frequency: Real-time, Daily digest, or Weekly summary
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Configure quiet hours to pause non-urgent notifications during specific time periods
                    </li>
                    <li style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
                      Save your preferences - changes take effect immediately
                    </li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Section 5: Account Settings & Privacy */}
            <section id="settings" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(239, 68, 68, 0.25)'
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
                  Account Settings & Privacy
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Take full control of your account security, privacy settings, and data preferences. Understanding and managing these settings ensures your personal information remains protected and your account operates according to your preferences.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Privacy Controls
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(239, 68, 68, 0.08) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {[
                      {
                        title: 'Profile Visibility',
                        desc: 'Control who can view your profile. Options include: Public (anyone), Registered Users Only, or Private (hidden from search). Photographers typically keep profiles public to attract clients.'
                      },
                      {
                        title: 'Contact Information',
                        desc: 'Choose whether to display your email, phone number, and social media links publicly. You can hide these and communicate only through our secure platform messaging.'
                      },
                      {
                        title: 'Portfolio Privacy',
                        desc: 'Make your portfolio public for maximum exposure or restrict it to logged-in users only. Individual galleries can also be password-protected for client-only access.'
                      },
                      {
                        title: 'Booking Availability',
                        desc: 'Show or hide your calendar availability. Hidden calendars still allow bookings but don\'t reveal your schedule to competitors or casual browsers.'
                      },
                      {
                        title: 'Review Visibility',
                        desc: 'Display client reviews and ratings publicly to build trust, or keep them private. Note: Verified photographers must display reviews to maintain verification status.'
                      }
                    ].map((control, idx) => (
                      <div key={idx}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#DC2626', marginBottom: '0.75rem' }}>
                          {control.title}
                        </h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#4B5563' }}>
                          {control.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Data Management
                </h3>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '1.5rem' }}>
                  You have complete control over your personal data stored on Amoria Connekt. Access these features from Account Settings - Privacy & Data:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: 'bi-download', title: 'Download Your Data', desc: 'Request a complete export of all your account data, photos, messages, and transaction history in standard formats' },
                    { icon: 'bi-trash', title: 'Delete Account', desc: 'Permanently delete your account and all associated data. This action is irreversible after 30-day grace period' },
                    { icon: 'bi-eye-slash', title: 'Marketing Opt-Out', desc: 'Unsubscribe from promotional emails, newsletters, and marketing communications while keeping essential notifications' },
                    { icon: 'bi-shield-check', title: 'Cookie Preferences', desc: 'Manage cookie settings to control tracking, analytics, and personalization features across the platform' },
                    { icon: 'bi-lock', title: 'Third-Party Access', desc: 'Review and revoke access for any third-party apps or services connected to your Amoria Connekt account' },
                    { icon: 'bi-file-earmark-text', title: 'Privacy Policy', desc: 'Review our complete privacy policy detailing how we collect, use, store, and protect your personal information' }
                  ].map((feature, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '1.5rem',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <i className={feature.icon} style={{ color: 'white', fontSize: '1.25rem' }}></i>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{feature.title}</h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#6B7280', margin: 0 }}>{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 6: Common Account Issues */}
            <section id="issues" style={{ padding: '4rem 3rem', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(245, 158, 11, 0.25)'
                }}>
                  <i className="bi bi-tools text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Common Account Issues
                </h2>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#4B5563', marginBottom: '2rem' }}>
                Troubleshoot common account problems quickly with these solutions. Most issues can be resolved in minutes without contacting support. If you continue experiencing problems after trying these fixes, our support team is ready to assist.
              </p>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                  Frequent Issues & Solutions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {[
                    {
                      issue: 'Cannot Log In',
                      icon: 'bi-key-fill',
                      solutions: [
                        'Verify you\'re using the correct email and password',
                        'Check if Caps Lock is enabled',
                        'Clear browser cookies and cache',
                        'Try using "Forgot Password" to reset credentials',
                        'Ensure your account hasn\'t been suspended (check email for notifications)',
                        'Try a different browser or device'
                      ]
                    },
                    {
                      issue: 'Email Verification Not Received',
                      icon: 'bi-envelope-x',
                      solutions: [
                        'Check your spam/junk folder',
                        'Add noreply@amoriaconnekt.com to your contacts',
                        'Wait 5 minutes, then request a new verification email',
                        'Verify the email address in your account settings is correct',
                        'Try adding a backup email address',
                        'Contact support if verification emails continue failing'
                      ]
                    },
                    {
                      issue: 'Profile Changes Not Saving',
                      icon: 'bi-exclamation-triangle',
                      solutions: [
                        'Ensure all required fields are completed',
                        'Check that uploaded images meet size requirements (max 5MB)',
                        'Disable browser extensions that might interfere',
                        'Try using a different browser',
                        'Wait for page to fully load before clicking Save',
                        'Contact support if specific fields consistently fail'
                      ]
                    },
                    {
                      issue: 'Account Suspended or Restricted',
                      icon: 'bi-shield-exclamation',
                      solutions: [
                        'Check your email for suspension notification with reason',
                        'Review our Terms of Service to identify potential violations',
                        'Submit an appeal through the Account Status page',
                        'Provide requested documentation to verify your identity',
                        'Remove any content that violates community guidelines',
                        'Contact support for clarification on suspension reasons'
                      ]
                    },
                    {
                      issue: 'Two-Factor Authentication Problems',
                      icon: 'bi-phone-vibrate',
                      solutions: [
                        'Ensure your device time is synchronized correctly',
                        'Use backup codes saved during 2FA setup',
                        'Try regenerating codes in your authenticator app',
                        'Verify your phone number is correct in settings',
                        'Contact support to temporarily disable 2FA if locked out',
                        'Consider switching to app-based 2FA instead of SMS'
                      ]
                    },
                    {
                      issue: 'Password Reset Link Expired',
                      icon: 'bi-clock-history',
                      solutions: [
                        'Password reset links expire after 1 hour',
                        'Request a new reset link from the login page',
                        'Check that you\'re clicking the most recent link',
                        'Clear browser cache before requesting new link',
                        'Ensure email filters aren\'t delaying delivery',
                        'Use the link within 60 minutes of receiving it'
                      ]
                    }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(245, 158, 11, 0.08) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '16px',
                      padding: '2rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <i className={item.icon} style={{ color: 'white', fontSize: '1.1rem' }}></i>
                        </div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#92400E', margin: 0 }}>
                          {item.issue}
                        </h4>
                      </div>
                      <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: 0 }}>
                        {item.solutions.map((solution, sIdx) => (
                          <li key={sIdx} style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#78350F' }}>
                            {solution}
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
                  <i className="bi bi-info-circle-fill" style={{ fontSize: '1.5rem', color: '#1E40AF', flexShrink: 0 }}></i>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1E3A8A', marginBottom: '0.5rem' }}>Need Further Assistance?</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#1E40AF', margin: 0 }}>
                      If you've tried these solutions and still experience issues, contact our support team via live chat, email at support@amoriaconnekt.com, or submit a ticket through your account dashboard. Include screenshots and detailed error messages for faster resolution.
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
          }}>
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
            <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>Still Need Help?</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.95)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto 2rem' }}>
              Our support team is available 24/7 to assist you with any account-related questions or issues.
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

export default MyAccountHelp;
