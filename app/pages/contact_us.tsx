'use client';
import React, { useState } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

export default function ContactUsPage(): React.JSX.Element {
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Check if form is complete (all fields filled)
  const isFormComplete = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      emailRegex.test(formData.email) &&
      formData.phone.trim() !== '' &&
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

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Simulate API call (replace with your actual API endpoint)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Here you would typically send the data to your backend
      console.log('Form submitted:', formData);


      setSubmitStatus('success');
      // Clear form after successful submission
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        message: ''
      });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);

    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Failed to send message. Please try again later.');
      console.error('Error submitting form:', error);
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
      <div style={{minHeight: '100vh', backgroundColor: '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'}}>
        {/* --- MODIFIED: Removed marginLeft to allow for true centering --- */}
        <div style={{width: '100%', maxWidth: '1100px'}}>
        
        {/* Main Container */}
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', minHeight: '500px', position: 'relative'}}>

          {/* LEFT PANEL */}
          <div style={{
            width: '40%', // Adjusted width slightly
            position: 'relative',
            // Using the same gradient as login.tsx
            background: 'linear-gradient(180deg, rgba(8, 58, 133, 1) 0%, rgba(8, 58, 133, 0.6) 40%, rgba(217, 217, 217, 1) 55%, rgba(217, 217, 217, 0.8) 70%, rgba(227, 54, 41, 1) 100%)',
            borderRadius: '1.5rem',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            height: 'auto',
            zIndex: 2,
            // --- MODIFIED: Adjusted the negative margin for a better overlap ---
            marginRight: '-10rem'
          }}>
            {/* Overlay gradients (same as login.tsx) */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(63deg, rgba(8, 58, 133, 1) 0%, rgba(8, 58, 133, 0) 100%)',
              pointerEvents: 'none'
            }}></div>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 90% 0%, rgba(137, 89, 0, 1) 0%, rgba(255, 166, 0, 1) 0%, rgba(255, 166, 0, 0) 90%)',
              pointerEvents: 'none'
            }}></div>

            {/* Content Container */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '2rem 1.5rem',
              height: '500px' // Gave a fixed height to ensure consistency
            }}>
              {/* Top Section */}
              <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem' // Increased gap for better spacing
              }}>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Contact Information
                </h2>

                {/* Phone Number */}
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                  <i className="bi bi-telephone" style={{fontSize: '1.2rem', color: '#000000'}}></i>
                  <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#000000'}}>
                    +250 788 437 347
                  </div>
                </div>

                {/* Email */}
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                  <i className="bi bi-envelope" style={{fontSize: '1.2rem', color: '#000000'}}></i>
                  <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#000000'}}>
                    info@amoriaconnekt.com
                  </div>
                </div>

                {/* Address */}
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem'}}>
                  <i className="bi bi-geo-alt" style={{fontSize: '1.2rem', color: '#000000'}}></i>
                  <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#000000', lineHeight: '1.4'}}>
                    Norrsken House Kigali - 1 KN 78 St, Kigali
                  </div>
                </div>

                {/* Business Hours */}
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem'}}>
                  <i className="bi bi-clock" style={{fontSize: '1.2rem', color: '#000000'}}></i>
                  <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#000000', lineHeight: '1.4'}}>
                    <div>Monday - Sunday</div>
                    <div>9:00 AM - 6:00 PM EAT</div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Image */}
              <div style={{width: '100%', display: 'flex', justifyContent: 'flex-start', marginTop: '1rem', position: 'absolute', bottom: '0.1rem', left: '150px'}}>
                <img
                  src="/contakt.png"
                  alt="Contact Us Illustration"
                  style={{width: '120px', height: 'auto'}}
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{
            width: '60%', // Adjusted width slightly
            // --- MODIFIED: Background color changed from white to light grey ---
            backgroundColor: '#D1D1D1', 
            borderRadius: '1.5rem',
            display: 'flex',
            flexDirection: 'row',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            minHeight: '550px', // Increased height
            zIndex: 1,
            overflow: 'hidden'
          }}>
            {/* Form Content Section */}
            <div style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              // --- MODIFIED: Adjusted padding to account for the overlapping left panel ---
              padding: '2rem 2rem 2rem 12rem', 
              justifyContent: 'center'
            }}>
              {/* Heading Section */}
              <div style={{marginBottom: '1.5rem', textAlign: 'left'}}>
                <h1 style={{fontSize: '2rem', fontWeight: '700', color: '#000000', marginBottom: '0.5rem'}}>
                  Send us a message
                </h1>
                <p style={{fontSize: '1rem', color: '#262626'}}>
                  Feel free to ask any question below!
                </p>
              </div>

              {/* Form Area */}
              <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%'}}>
                {/* Success/Error Message */}
                {submitStatus === 'success' && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '1rem',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    ✓ Message sent successfully! We'll get back to you soon.
                  </div>
                )}
                {submitStatus === 'error' && errorMessage && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
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
                  <label htmlFor="fullName" style={{display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem'}}>
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
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      border: '2px solid #C4C4C4',
                      borderRadius: '0.75rem',
                      outline: 'none',
                      backgroundColor: isSubmitting ? '#B0B0B0' : '#FFFFFF',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                      color: '#000000',
                      cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="email" style={{display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem'}}>
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
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      border: '2px solid #C4C4C4',
                      borderRadius: '0.75rem',
                      outline: 'none',
                      backgroundColor: isSubmitting ? '#B0B0B0' : '#FFFFFF',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                      color: '#000',
                      cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="phone" style={{display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem'}}>
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
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      border: '2px solid #C4C4C4',
                      borderRadius: '0.75rem',
                      outline: 'none',
                      backgroundColor: isSubmitting ? '#B0B0B0' : '#FFFFFF',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                      color: '#000',
                      cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="message" style={{display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem'}}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help you..."
                    rows={4}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      border: '2px solid #C4C4C4',
                      borderRadius: '0.75rem',
                      outline: 'none',
                      backgroundColor: isSubmitting ? '#B0B0B0' : '#FFFFFF',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
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
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    borderRadius: '0.75rem',
                    backgroundColor: isSubmitting || !isFormComplete() ? '#6b7280' : '#083A85',
                    color: '#ffffff',
                    border: 'none',
                    cursor: isSubmitting || !isFormComplete() ? 'not-allowed' : 'pointer',
                    marginTop: '0.5rem',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: isSubmitting || !isFormComplete() ? 0.6 : 1
                  }}
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
              width: '5%', // Made this much smaller for a subtle effect
              // --- MODIFIED: Changed to a simple glow effect as seen on the far right of the image ---
              background: 'linear-gradient(to left, #F2C94C, rgba(242, 201, 76, 0))',
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
