'use client';
import React, { useState } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { contactUs } from '@/lib/APIs/public';
import { useToast } from '@/lib/notifications/ToastProvider';

const BRAND = '#083A85';
const BRAND_DARK = '#062a63';
const ACCENT = '#ffd28a';

type FieldKey = 'fullName' | 'email' | 'phone' | 'subject' | 'message';

const CHANNELS: Array<{
  key: string;
  icon: string;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}> = [
  { key: 'phone', icon: 'bi-telephone-fill', label: 'Phone', value: '+250 788 437 347', href: 'tel:+250788437347' },
  { key: 'email', icon: 'bi-envelope-fill', label: 'Email', value: 'info@connekyt.com', href: 'mailto:info@connekyt.com' },
  { key: 'whatsapp', icon: 'bi-whatsapp', label: 'WhatsApp', value: '+250 788 437 347', href: 'https://wa.me/250788437347', external: true },
  { key: 'office', icon: 'bi-geo-alt-fill', label: 'Office', value: 'EVA PLAZA, KK 84B St, Kicukiro, Kigali', href: 'https://maps.google.com/?q=EVA+PLAZA+Kigali', external: true },
];

export default function ContactUsPage(): React.JSX.Element {
  const { success: showSuccess, error: showError, warning: showWarning, isOnline } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Phone is optional - required fields drive the submit button state
  const isFormComplete = () =>
    formData.fullName.trim() !== '' &&
    emailRegex.test(formData.email) &&
    formData.subject.trim() !== '' &&
    formData.message.trim() !== '';

  const validateForm = () => {
    if (!formData.fullName.trim()) { setErrorMessage('Please enter your full name'); return false; }
    if (!formData.email.trim()) { setErrorMessage('Please enter your email address'); return false; }
    if (!emailRegex.test(formData.email)) { setErrorMessage('Please enter a valid email address'); return false; }
    if (!formData.subject.trim()) { setErrorMessage('Please give your message a subject'); return false; }
    if (!formData.message.trim()) { setErrorMessage('Please tell us how we can help'); return false; }
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMessage) {
      setErrorMessage('');
      setSubmitStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }
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
        phone: formData.phone.trim() || '-',
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      if (response.success) {
        setSubmitStatus('success');
        showSuccess("Message sent! We'll get back to you within 24 hours.");
        setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        const msg = response.error || 'Failed to send message. Please try again later.';
        setSubmitStatus('error');
        setErrorMessage(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again later.';
      setSubmitStatus('error');
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable - silently ignore */
    }
  };

  return (
    <>
      <Navbar />
      <style>{`
        @keyframes cu-spin { to { transform: rotate(360deg); } }
        @keyframes cu-float-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

        .cu-field { position: relative; }
        .cu-input, .cu-textarea {
          width: 100%;
          padding: 22px 14px 8px;
          border: 1.5px solid rgba(8,58,133,0.12);
          background: #fff;
          border-radius: 12px;
          font-size: 0.92rem;
          color: #0f172a;
          outline: none;
          font-family: inherit;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .cu-textarea { resize: vertical; min-height: 130px; padding-top: 26px; }
        .cu-input:focus, .cu-textarea:focus {
          border-color: ${BRAND};
          box-shadow: 0 0 0 4px rgba(8,58,133,0.08);
        }
        .cu-label {
          position: absolute;
          left: 14px;
          top: 14px;
          font-size: 0.85rem;
          color: #94a3b8;
          pointer-events: none;
          transition: top 0.18s ease, font-size 0.18s ease, color 0.18s ease;
        }
        .cu-field.is-active .cu-label,
        .cu-field.is-filled .cu-label {
          top: 5px;
          font-size: 0.62rem;
          color: ${BRAND};
          font-weight: 700;
          letter-spacing: 0.7px;
          text-transform: uppercase;
        }

        .cu-channel { transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s; }
        .cu-channel:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -12px rgba(8,58,133,0.20);
          border-color: rgba(8,58,133,0.18);
        }

        .cu-script { font-family: 'Alex Brush', cursive; font-weight: 400; }

        @media (max-width: 900px) {
          .cu-grid { grid-template-columns: 1fr !important; }
          .cu-hero-h1 { font-size: 2.4rem !important; }
        }
        @media (max-width: 540px) {
          .cu-hero { padding: 96px 1rem 120px !important; }
          .cu-hero-h1 { font-size: 2rem !important; }
          .cu-card { padding: 1.25rem !important; border-radius: 18px !important; }
          .cu-row { grid-template-columns: 1fr !important; }
          .cu-cta-strip { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>

      <main style={{ background: '#f5f7fb', minHeight: '100vh' }}>
        {/* HERO */}
        <section
          className="cu-hero"
          style={{
            position: 'relative',
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
            color: '#fff',
            padding: 'clamp(110px, 14vh, 150px) 2rem 160px',
            overflow: 'hidden',
          }}
        >
          {/* decorative dot pattern */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1.2px, transparent 1.2px)',
              backgroundSize: '22px 22px',
              WebkitMaskImage: 'radial-gradient(circle at 50% 0%, #000 60%, transparent 90%)',
              maskImage: 'radial-gradient(circle at 50% 0%, #000 60%, transparent 90%)',
              opacity: 0.55,
            }}
          />
          <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.22)',
                fontSize: '0.72rem',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              <i className="bi bi-chat-dots" /> We&apos;re listening
            </span>

            <h1
              className="cu-hero-h1"
              style={{
                fontFamily: "'Pragati Narrow', sans-serif",
                fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
                fontWeight: 800,
                margin: '0 0 12px',
                lineHeight: 1.05,
              }}
            >
              Let&apos;s{' '}
              <span
                className="cu-script"
                style={{ color: ACCENT, fontSize: '1.25em', verticalAlign: '-0.05em' }}
              >
                connect
              </span>
              .
            </h1>

            <p style={{ maxWidth: 620, margin: '0 auto', color: 'rgba(255,255,255,0.82)', fontSize: '1.02rem', lineHeight: 1.6 }}>
              Whether you&apos;re booking a photographer, planning a livestream, or just curious about Connekyt, drop us a line and we&apos;ll be in touch.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', marginTop: '1.6rem' }}>
              {[
                { icon: 'bi-clock-history', text: 'Under 24h response' },
                { icon: 'bi-translate', text: 'EN · FR · ES' },
                { icon: 'bi-shield-check', text: 'Private & secure' },
              ].map(p => (
                <span
                  key={p.text}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <i className={`bi ${p.icon}`} style={{ color: ACCENT }} /> {p.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FLOATING CARD */}
        <section style={{ marginTop: '-90px', padding: '0 1rem 60px', position: 'relative', zIndex: 2 }}>
          <div
            className="cu-card"
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 30px 80px -30px rgba(8,58,133,0.28), 0 6px 16px rgba(8,58,133,0.05)',
              padding: 'clamp(1.5rem, 3vw, 2.25rem)',
              animation: 'cu-float-in 0.45s ease-out',
            }}
          >
            <div
              className="cu-grid"
              style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 'clamp(1.25rem, 2.5vw, 2rem)' }}
            >
              {/* LEFT - form */}
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: BRAND, letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>
                  Send a message
                </p>
                <h2 style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', fontWeight: 800, color: '#0f172a', margin: '4px 0 18px', fontFamily: "'Pragati Narrow', sans-serif" }}>
                  Tell us what you need
                </h2>

                {submitStatus === 'success' && (
                  <div role="status" style={statusBanner('success')}>
                    <i className="bi bi-check-circle-fill" /> Message sent! We&apos;ll be in touch shortly.
                  </div>
                )}
                {submitStatus === 'error' && errorMessage && (
                  <div role="alert" style={statusBanner('error')}>
                    <i className="bi bi-exclamation-circle-fill" /> {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }} noValidate>
                  <div className="cu-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <Field name="fullName" label="Full name *" focused={focused} setFocused={setFocused} value={formData.fullName} onChange={handleInputChange} autoComplete="name" />
                    <Field name="email" type="email" label="Email *" focused={focused} setFocused={setFocused} value={formData.email} onChange={handleInputChange} autoComplete="email" />
                  </div>
                  <div className="cu-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <Field name="phone" type="tel" label="Phone (optional)" focused={focused} setFocused={setFocused} value={formData.phone} onChange={handleInputChange} autoComplete="tel" />
                    <Field name="subject" label="Subject *" focused={focused} setFocused={setFocused} value={formData.subject} onChange={handleInputChange} autoComplete="off" />
                  </div>
                  <Field name="message" label="How can we help? *" textarea focused={focused} setFocused={setFocused} value={formData.message} onChange={handleInputChange} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0, maxWidth: 320 }}>
                      <i className="bi bi-shield-lock" style={{ marginRight: 6, color: BRAND }} />
                      Your details are kept private. See our{' '}
                      <a href="/user/privacy-policy" style={{ color: BRAND, fontWeight: 600 }}>privacy policy</a>.
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting || !isFormComplete()}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 12,
                        border: 'none',
                        background: isFormComplete() ? `linear-gradient(135deg, ${BRAND}, #0a4da3)` : '#e2e8f0',
                        color: isFormComplete() ? '#fff' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: isFormComplete() && !isSubmitting ? 'pointer' : 'not-allowed',
                        transition: 'transform 0.18s, box-shadow 0.18s, opacity 0.18s',
                        opacity: isSubmitting ? 0.75 : 1,
                        boxShadow: isFormComplete() ? '0 10px 24px -10px rgba(8,58,133,0.6)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <span
                            aria-hidden="true"
                            style={{
                              width: 14,
                              height: 14,
                              border: '2px solid rgba(255,255,255,0.35)',
                              borderTopColor: '#fff',
                              borderRadius: '50%',
                              display: 'inline-block',
                              animation: 'cu-spin 0.8s linear infinite',
                            }}
                          />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send message <i className="bi bi-arrow-up-right" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT - channels + map */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: BRAND, letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>
                    Other ways
                  </p>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 12px', fontFamily: "'Pragati Narrow', sans-serif" }}>
                    Reach us your way
                  </h3>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {CHANNELS.map(c => (
                    <li key={c.key}>
                      <a
                        href={c.href}
                        target={c.external ? '_blank' : undefined}
                        rel={c.external ? 'noopener noreferrer' : undefined}
                        className="cu-channel"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 14px',
                          background: '#fff',
                          borderRadius: 14,
                          border: '1px solid rgba(8,58,133,0.08)',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: 'rgba(8,58,133,0.08)',
                            color: BRAND,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 'none',
                          }}
                        >
                          <i className={`bi ${c.icon}`} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', fontWeight: 700 }}>
                            {c.label}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.86rem', color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.value}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); copy(c.label, c.value); }}
                          aria-label={`Copy ${c.label}`}
                          title={`Copy ${c.label}`}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: copied === c.label ? '#16a34a' : '#94a3b8',
                            padding: 6,
                            transition: 'color 0.18s',
                          }}
                        >
                          <i className={`bi ${copied === c.label ? 'bi-check2' : 'bi-clipboard'}`} />
                        </button>
                      </a>
                    </li>
                  ))}
                </ul>

                {/* Map with floating address chip */}
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 14,
                    overflow: 'hidden',
                    height: 200,
                    marginTop: 4,
                    border: '1px solid rgba(8,58,133,0.08)',
                  }}
                >
                  <iframe
                    title="Amoria Connekyt office map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.5!2d30.1687772!3d-1.975773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19db59c4b2591e71%3A0xb0b493858167cb1c!2sEVA+PLAZA!5e0!3m2!1sen!2srw!4v1"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 12,
                      right: 12,
                      bottom: 12,
                      background: 'rgba(255,255,255,0.96)',
                      backdropFilter: 'blur(6px)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
                    }}
                  >
                    <i className="bi bi-geo-alt-fill" style={{ color: BRAND }} />
                    <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      EVA PLAZA · Kicukiro, Kigali
                    </span>
                    <a
                      href="https://maps.google.com/?q=EVA+PLAZA+Kigali"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.74rem', color: BRAND, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      Directions <i className="bi bi-arrow-up-right" />
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* CTA strip */}
          <div
            className="cu-cta-strip"
            style={{
              maxWidth: 1100,
              margin: '1.5rem auto 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 0.5rem',
            }}
          >
            <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem' }}>
              Looking for a quick answer? Browse the{' '}
              <a href="/user/help-center" style={{ color: BRAND, fontWeight: 700 }}>help center</a>.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href="https://wa.me/250788437347"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: '#25D366',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                <i className="bi bi-whatsapp" /> WhatsApp
              </a>
              <a
                href="tel:+250788437347"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: '#fff',
                  color: BRAND,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  border: `1px solid ${BRAND}`,
                }}
              >
                <i className="bi bi-telephone" /> Call us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/* ---------- helpers ---------- */

function statusBanner(kind: 'success' | 'error'): React.CSSProperties {
  const map = {
    success: { bg: '#ecfdf5', border: '#a7f3d0', fg: '#065f46' },
    error: { bg: '#fef2f2', border: '#fecaca', fg: '#991b1b' },
  } as const;
  const c = map[kind];
  return {
    padding: '12px 16px',
    borderRadius: 12,
    background: c.bg,
    border: `1px solid ${c.border}`,
    marginBottom: '1rem',
    fontSize: '0.86rem',
    color: c.fg,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };
}

function Field({
  name,
  label,
  value,
  onChange,
  focused,
  setFocused,
  type = 'text',
  textarea = false,
  autoComplete = 'off',
}: {
  name: FieldKey;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  focused: FieldKey | null;
  setFocused: React.Dispatch<React.SetStateAction<FieldKey | null>>;
  type?: string;
  textarea?: boolean;
  autoComplete?: string;
}) {
  const isActive = focused === name;
  const isFilled = value.trim().length > 0;
  const cls = `cu-field${isActive ? ' is-active' : ''}${isFilled ? ' is-filled' : ''}`;
  const onFocus = () => setFocused(name);
  const onBlur = () => setFocused(prev => (prev === name ? null : prev));
  const id = `cu-${name}`;

  return (
    <div className={cls}>
      <label htmlFor={id} className="cu-label">{label}</label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          className="cu-textarea"
          rows={5}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={autoComplete}
          className="cu-input"
        />
      )}
    </div>
  );
}
