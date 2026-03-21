'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { contactUs } from '@/lib/APIs/public';
import { useToast } from '@/lib/notifications/ToastProvider';

export default function ContactUsPage(): React.JSX.Element {
  const { success: showSuccess, error: showError, warning: showWarning, isOnline } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if form is complete (all fields filled)
  const isFormComplete = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      emailRegex.test(formData.email) &&
      formData.phone.trim() !== '' &&
      formData.subject.trim() !== '' &&
      formData.message.trim() !== ''
    );
  };

  // Form validation
  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Please enter your phone number');
      return false;
    }
    if (!formData.subject.trim()) {
      setErrorMessage('Please enter a subject');
      return false;
    }
    if (!formData.message.trim()) {
      setErrorMessage('Please tell us how we can help you');
      return false;
    }
    return true;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('');
      setSubmitStatus('idle');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    // Check online status
    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await contactUs({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      if (response.success) {
        setSubmitStatus('success');
        showSuccess('Message sent successfully! We\'ll get back to you soon.');
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });

        setTimeout(() => {
          setSubmitStatus('idle');
        }, 5000);
      } else {
        const errorMsg = response.error || 'Failed to send message. Please try again later.';
        setSubmitStatus('error');
        setErrorMessage(errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message. Please try again later.';
      setSubmitStatus('error');
      setErrorMessage(errorMsg);
      showError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <Navbar />
      {/* --- MODIFIED: Changed main background color to better match the image --- */}
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '70px 1rem 1.5rem' : '72px 2rem 2rem'
      }}>
        {/* --- MODIFIED: Removed marginLeft to allow for true centering --- */}
        <div style={{width: '100%', maxWidth: isMobile ? '100%' : '1100px'}}>

        {/* Main Container */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          width: '100%',
          minHeight: isMobile ? 'auto' : 'auto',
          position: 'relative',
          gap: isMobile ? '1rem' : '0'
        }}>

          {/* LEFT PANEL */}
          <div style={{
            width: isMobile ? '100%' : '40%',
            position: 'relative',
            background: 'linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #083A85 100%)',
            borderRadius: isMobile ? '1rem' : '1.25rem',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(8, 58, 133, 0.1)',
            zIndex: isMobile ? 1 : 2,
            // --- MODIFIED: Adjusted the negative margin for a better overlap ---
            marginRight: isMobile ? '0' : '-10rem'
          }}>
            {/* Subtle overlay for depth */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.1) 100%)',
              pointerEvents: 'none'
            }}></div>

            {/* Content Container */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: isMobile ? '1.25rem 1rem' : '1.25rem 1.25rem',
              height: '100%',
              gap: '0.5rem'
            }}>
              {/* Top Section */}
              <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <h2 style={{
                  fontSize: isMobile ? '1.25rem' : '1.4rem',
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: '0.3rem',
                  textAlign: 'center',
                  fontFamily: "'Pragati Narrow', sans-serif",
                }}>
                  Contact Information
                </h2>

                {/* Phone Number */}
                <div style={{display: 'flex', alignItems: 'center', gap: '0.6rem'}}>
                  <i className="bi bi-telephone" style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)'}}></i>
                  <div style={{fontSize: '0.85rem', fontWeight: '600', color: '#ffffff'}}>
                    +250 788 437 347
                  </div>
                </div>

                {/* Email */}
                <div style={{display: 'flex', alignItems: 'center', gap: '0.6rem'}}>
                  <i className="bi bi-envelope" style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)'}}></i>
                  <div style={{fontSize: '0.85rem', fontWeight: '600', color: '#ffffff'}}>
                    info@amoriaconnekyt.com
                  </div>
                </div>

                {/* Address */}
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '0.6rem'}}>
                  <i className="bi bi-geo-alt" style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', flexShrink: 0}}></i>
                  <div style={{fontSize: '0.85rem', fontWeight: '600', color: '#ffffff', lineHeight: '1.4'}}>
                    KK 84B St, EVA PLAZA, Kanombe 3rd Floor, Left Wing, Kicukiro, Kigali
                  </div>
                </div>

                {/* Business Hours */}
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '0.6rem'}}>
                  <i className="bi bi-clock" style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', flexShrink: 0}}></i>
                  <div style={{fontSize: '0.85rem', fontWeight: '600', color: '#ffffff', lineHeight: '1.4'}}>
                    <div>Monday - Sunday</div>
                    <div>9:00 AM - 6:00 PM EAT</div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Image */}
              <div style={{
                width: '100%',
                display: isMobile ? 'none' : 'flex',
                justifyContent: 'center',
                marginTop: '0.5rem',
              }}>
                <img
                  src="/contakt.png"
                  alt="Contact Us Illustration"
                  style={{width: '75px', height: 'auto'}}
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{
            width: isMobile ? '100%' : '60%',
            // --- MODIFIED: Background color changed from white to light grey ---
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '1rem' : '1.25rem',
            display: 'flex',
            flexDirection: 'row',
            boxShadow: '0 4px 20px rgba(8, 58, 133, 0.1)',
            minHeight: isMobile ? 'auto' : 'auto',
            zIndex: 1,
            overflow: 'hidden'
          }}>
            {/* Form Content Section */}
            <div style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              // --- MODIFIED: Adjusted padding to account for the overlapping left panel ---
              padding: isMobile
                ? '1rem 1rem'
                : '1rem 1.5rem 1rem 11rem',
              justifyContent: 'center'
            }}>
              {/* Heading Section */}
              <div style={{marginBottom: '0.3rem', textAlign: 'left'}}>
                <h1 style={{
                  fontSize: isMobile ? '1.25rem' : '1.4rem',
                  fontWeight: '700',
                  color: '#083A85',
                  marginBottom: '0.25rem',
                  fontFamily: "'Pragati Narrow', sans-serif",
                }}>
                  Send us a message
                </h1>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#6b7280'
                }}>
                  Feel free to ask any question below!
                </p>
              </div>

              {/* Form Area */}
              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                width: '100%'
              }}>
                {/* Success/Error Message */}
                {submitStatus === 'success' && (
                  <div style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    ✓ Message sent successfully! We'll get back to you soon.
                  </div>
                )}
                {submitStatus === 'error' && errorMessage && (
                  <div style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    ✕ {errorMessage}
                  </div>
                )}

                <div>
                  <label htmlFor="fullName" style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '0.2rem'
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Moise Caicedo"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(8, 58, 133, 0.15)',
                      borderRadius: '0.6rem',
                      outline: 'none',
                      backgroundColor: isSubmitting ? '#f3f4f6' : '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      color: '#000000',
                      cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="email" style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '0.2rem'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="moisecaicedo25@gmail.com"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(8, 58, 133, 0.15)',
                      borderRadius: '0.6rem',
                      outline: 'none',
                      backgroundColor: isSubmitting ? '#f3f4f6' : '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      color: '#000',
                      cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="phone" style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '0.2rem'
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+250 XXX XXX XXX"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(8, 58, 133, 0.15)',
                      borderRadius: '0.6rem',
                      outline: 'none',
                      backgroundColor: isSubmitting ? '#f3f4f6' : '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      color: '#000',
                      cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="subject" style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '0.2rem'
                  }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="How can we help you?"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(8, 58, 133, 0.15)',
                      borderRadius: '0.6rem',
                      outline: 'none',
                      backgroundColor: isSubmitting ? '#f3f4f6' : '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      color: '#000000',
                      cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="message" style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '0.2rem'
                  }}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help you..."
                    rows={2}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(8, 58, 133, 0.15)',
                      borderRadius: '0.6rem',
                      outline: 'none',
                      backgroundColor: isSubmitting ? '#f3f4f6' : '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      resize: 'none',
                      fontFamily: 'inherit',
                      color: '#000',
                      cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormComplete()}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    borderRadius: '0.5rem',
                    backgroundColor: isSubmitting || !isFormComplete() ? '#6b7280' : '#083A85',
                    color: '#ffffff',
                    border: 'none',
                    cursor: isSubmitting || !isFormComplete() ? 'not-allowed' : 'pointer',
                    marginTop: '0.15rem',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    opacity: isSubmitting || !isFormComplete() ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => { if (!(isSubmitting || !isFormComplete())) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { if (!(isSubmitting || !isFormComplete())) e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {isSubmitting ? (
                    <>
                      <span style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}></span>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>

            {/* Right Decorative Section */}
            <div style={{
              width: isMobile ? '0%' : '5%',
              display: isMobile ? 'none' : 'block',
              background: 'linear-gradient(to left, #083A85, rgba(8, 58, 133, 0))',
            }}>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
