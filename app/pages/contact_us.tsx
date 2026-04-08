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

  const inputStyle = {
    width: '100%',
    padding: '10px 0',
    border: 'none',
    borderBottom: '1.5px solid rgba(8,58,133,0.15)',
    fontSize: '0.85rem',
    background: 'transparent',
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .ct-in:focus { border-color: #083A85 !important; }
        .ct-in::placeholder { color: #94a3b8; }
        @media (max-width: 768px) {
          .ct-main { flex-direction: column !important; padding: 1rem !important; gap: 1.5rem !important; }
          .ct-form-panel { width: 100% !important; padding: 1.5rem !important; }
          .ct-info-panel { width: 100% !important; }
          .ct-info-grid { grid-template-columns: 1fr !important; }
          .ct-row { flex-direction: column !important; }
        }
      `}</style>
      <Navbar />
      <div style={{ minHeight: '100vh', background: '#f0f4fa', paddingTop: isMobile ? '70px' : '80px' }}>

        {/* Main Content — Two Columns */}
        <div className="ct-main" style={{ display: 'flex', maxWidth: '1000px', margin: '0 auto', padding: 'clamp(1rem, 2vw, 1.5rem)', gap: '1.25rem' }}>

          {/* LEFT — Form Panel */}
          <div className="ct-form-panel" style={{ width: '55%', background: '#fff', borderRadius: '16px', padding: 'clamp(1.25rem, 2.5vw, 1.75rem)', boxShadow: '0 2px 16px rgba(8,58,133,0.05)' }}>
            <p style={{ fontSize: '0.7rem', color: '#083A85', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 2px' }}>Contact Us</p>
            <h2 style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem', fontFamily: "'Pragati Narrow', sans-serif" }}>Get In Touch</h2>

            {submitStatus === 'success' && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', marginBottom: '1rem', fontSize: '0.85rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-check-circle-fill"></i> Message sent successfully!
              </div>
            )}
            {submitStatus === 'error' && errorMessage && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '1rem', fontSize: '0.85rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-exclamation-circle-fill"></i> {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px', letterSpacing: '0.5px' }}>Name <span style={{ color: '#e53e3e' }}>*</span></label>
                <input name="fullName" type="text" value={formData.fullName} onChange={handleInputChange} placeholder="Your Name" required className="ct-in" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px', letterSpacing: '0.5px' }}>Email <span style={{ color: '#e53e3e' }}>*</span></label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="example@email.com" required className="ct-in" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px', letterSpacing: '0.5px' }}>Subject <span style={{ color: '#e53e3e' }}>*</span></label>
                <input name="subject" type="text" value={formData.subject} onChange={handleInputChange} placeholder="Title..." required className="ct-in" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px', letterSpacing: '0.5px' }}>Message <span style={{ color: '#e53e3e' }}>*</span></label>
                <textarea name="message" rows={3} value={formData.message} onChange={handleInputChange} placeholder="Type here..." required className="ct-in" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {/* Hidden phone field — auto-filled or optional */}
              <input name="phone" type="hidden" value={formData.phone || '-'} onChange={handleInputChange} />

              <button type="submit" disabled={isSubmitting || !isFormComplete()}
                style={{
                  width: isMobile ? '100%' : '160px',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isFormComplete() ? 'linear-gradient(135deg, #083A85, #0a4da3)' : '#d1d5db',
                  color: isFormComplete() ? '#fff' : '#9ca3af',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isFormComplete() && !isSubmitting ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s',
                  opacity: isSubmitting ? 0.7 : 1,
                  marginTop: '0.5rem',
                }}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
                    Sending...
                  </span>
                ) : 'Send Now'}
              </button>
            </form>
          </div>

          {/* RIGHT — Info Panel */}
          <div className="ct-info-panel" style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Description */}
            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Have a question or need assistance? Reach out to us through the form or contact details below.
            </p>

            {/* Contact Info Cards */}
            <div className="ct-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { icon: 'bi-telephone', label: 'Phone Number', value: '+250 788 437 347' },
                { icon: 'bi-envelope', label: 'Email Address', value: 'info@amoriaconnekyt.com' },
                { icon: 'bi-whatsapp', label: 'Whatsapp', value: '+250 788 437 347' },
                { icon: 'bi-geo-alt', label: 'Location', value: 'EVA PLAZA, KK 84B St,Kicukiro, Kigali' },
              ].map((item) => (
                <div key={item.icon} style={{ background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 10px rgba(8,58,133,0.05)', textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(8,58,133,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <i className={`bi ${item.icon}`} style={{ fontSize: '0.9rem', color: '#083A85' }}></i>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Map — dark theme */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', height: '140px', boxShadow: '0 1px 6px rgba(8,58,133,0.04)', position: 'relative' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.5!2d30.1687772!3d-1.975773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19db59c4b2591e71%3A0xb0b493858167cb1c!2sEVA+PLAZA!5e0!3m2!1sen!2srw!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
