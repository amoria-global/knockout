"use client";

import { useState, useEffect, useRef } from "react";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { getCurrencies, createPublicDonation, getDonationTiers, getCurrencyRates, type Currency as APICurrency, type ExchangeRate } from '@/lib/APIs/public';
import XentriPayModal from '../components/XentriPayModal';
import RotatingGlobe from '../components/RotatingGlobe';

// Hook for counting animation
const useCountUp = (end: number, duration: number = 2000, startCounting: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startCounting) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startCounting]);

  return count;
};

// Format number with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Currency type — accepts any string code from the API
type Currency = string;

// Static fallback used before the API responds
const FALLBACK_CURRENCY_CONFIG: Record<string, { symbol: string; rate: number; name: string }> = {
  RWF: { symbol: 'RWF', rate: 1, name: 'Rwandan Franc' },
  USD: { symbol: '$', rate: 0.000769, name: 'US Dollar' },
};

const FALLBACK_TIER_AMOUNTS = [1000, 2000, 5000, 10000];

// Impact Counter Component
const ImpactCounter = ({
  targetNumber,
  label,
  suffix = "",
  icon,
  color = '#083A85',
  isVisible = false
}: {
  targetNumber: number;
  label: string;
  suffix?: string;
  icon: string;
  color?: string;
  isVisible?: boolean;
}) => {
  const count = useCountUp(targetNumber, 2500, isVisible);

  return (
    <div style={{
      textAlign: 'center',
      padding: '32px 20px',
      backgroundColor: '#fff',
      borderRadius: '20px',
      transition: 'all 0.35s ease',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '170px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0',
    }}
    className="impact-card"
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${color}20`; e.currentTarget.style.borderColor = `${color}40`; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      {/* Subtle background glow */}
      <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '120px', background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Icon */}
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '14px',
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 14px',
        position: 'relative',
        zIndex: 2,
        boxShadow: `0 4px 12px ${color}30`,
      }}>
        <i className={icon} style={{ fontSize: '22px', color: '#fff' }} />
      </div>

      {/* Number with gradient */}
      <div style={{
        fontSize: '40px',
        fontWeight: 800,
        lineHeight: 1.1,
        marginBottom: '6px',
        position: 'relative',
        zIndex: 2,
        background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {formatNumber(count)}{suffix}
      </div>

      <div style={{
        fontSize: '13px',
        color: '#64748b',
        fontWeight: 600,
        letterSpacing: '0.3px',
        position: 'relative',
        zIndex: 2,
      }}>
        {label}
      </div>
    </div>
  );
};

// Donation Category Card
const DonationCard = ({
  icon,
  title,
  description,
  isActive,
  onClick
}: {
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: isActive ? '#083A85' : '#fff',
      borderRadius: '20px',
      padding: '30px 25px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: isActive
        ? '0 10px 40px rgba(8, 58, 133, 0.3)'
        : '0 6px 24px rgba(0, 0, 0, 0.08)',
      border: isActive ? '2px solid #083A85' : '2px solid #e2e8f0',
      transform: isActive ? 'translateY(-5px)' : 'translateY(0)',
    }}
  >
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : '#083A85',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
    }}>
      <i className={icon} style={{
        fontSize: '24px',
        color: '#fff',
      }} />
    </div>
    <h3 style={{
      fontSize: '20px',
      fontWeight: 700,
      color: isActive ? '#fff' : '#1a1a2e',
      marginBottom: '12px',
    }}>
      {title}
    </h3>
    <p style={{
      fontSize: '14px',
      lineHeight: 1.6,
      color: isActive ? 'rgba(255,255,255,0.85)' : '#64748b',
      margin: 0,
    }}>
      {description}
    </p>
  </div>
);

// Donation Amount Button
const AmountButton = ({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '15px 20px',
      fontSize: '16px',
      fontWeight: 600,
      borderRadius: '12px',
      border: isSelected ? '2px solid #083A85' : '2px solid #e2e8f0',
      backgroundColor: isSelected ? '#083A85' : '#fff',
      color: isSelected ? '#fff' : '#1a1a2e',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '100px',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    {label}
  </button>
);


const Donations = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [tierAmounts, setTierAmounts] = useState<number[]>(FALLBACK_TIER_AMOUNTS);
  const [exchangeRateMap, setExchangeRateMap] = useState<Record<string, ExchangeRate>>({});
  const [apiBaseCurrency, setApiBaseCurrency] = useState('RWF');
  const [selectedAmount, setSelectedAmount] = useState<number>(FALLBACK_TIER_AMOUNTS[2]);
  const [customAmount, setCustomAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('RWF');
  const [apiCurrencies, setApiCurrencies] = useState<APICurrency[]>([]);

  // Build currency config from API exchange rates, falling back to static config.
  const getCurrencyConfig = (code: string): { symbol: string; rate: number; name: string } => {
    const base = exchangeRateMap[apiBaseCurrency];
    const target = exchangeRateMap[code];
    if (
      base && target &&
      base.rateToUsd != null && base.rateToUsd !== 0 &&
      target.rateToUsd != null
    ) {
      return { symbol: target.symbol || code, rate: target.rateToUsd / base.rateToUsd, name: code };
    }
    return FALLBACK_CURRENCY_CONFIG[code] || { symbol: code, rate: 1, name: code };
  };

  const convertFromRWF = (amountRWF: number, curr: Currency): number => {
    const config = getCurrencyConfig(curr);
    const converted = amountRWF * config.rate;
    return config.rate === 1 ? Math.round(converted) : Math.round(converted * 100) / 100;
  };

  const formatCurrency = (amount: number, curr: Currency): string => {
    const config = getCurrencyConfig(curr);
    return config.rate === 1
      ? `${formatNumber(Math.round(amount))} ${config.symbol}`
      : `${config.symbol}${formatNumber(amount)}`;
  };
  const [impactVisible, setImpactVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const impactSectionRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);

  const [showBanner, setShowBanner] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [donorFirstName, setDonorFirstName] = useState('');
  const [donorLastName, setDonorLastName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationSuccess, setDonationSuccess] = useState(false);

  // XentriPay modal state
  const [showXentriPayModal, setShowXentriPayModal] = useState(false);
  const [pendingDonationId, setPendingDonationId] = useState<string | null>(null);
  const [donationFrequency, setDonationFrequency] = useState<'one-time' | 'monthly'>('one-time');

  // Reset payment modal state
  const resetPaymentModal = () => {
    setShowPaymentModal(false);
    setDonationError(null);
  };

  // Handle donation - record donation then open XentriPay for payment
  const handleDonation = async () => {
    const amount = getDisplayAmount();
    if (!amount || amount <= 0) {
      setDonationError('Please select a donation amount before proceeding.');
      return;
    }

    if (!isAnonymous) {
      if (!donorFirstName.trim()) {
        setDonationError('Please enter your first name.');
        return;
      }
      if (!donorLastName.trim()) {
        setDonationError('Please enter your last name.');
        return;
      }
      if (!donorEmail.trim()) {
        setDonationError('Please enter your email address.');
        return;
      }
    }

    setDonationLoading(true);
    setDonationError(null);
    setDonationSuccess(false);

    try {
      const matchedCurrency = apiCurrencies.find(c => c.code === currency);
      const currencyId = matchedCurrency?.id || '';

      const message = donorMessage || `${categories[activeCategory].title} donation`;
      const donorFullName = isAnonymous ? undefined : `${donorFirstName} ${donorLastName}`.trim() || undefined;

      const response = await createPublicDonation({
        amount: amount.toString(),
        currencyId,
        donorName: donorFullName,
        donorEmail: isAnonymous ? undefined : donorEmail || undefined,
        message,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Could not process your donation. Please try again.');
      }

      // Capture donationId from response, then open XentriPay for actual payment
      setPendingDonationId(response.data.id);
      setShowPaymentModal(false);
      setShowXentriPayModal(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      setDonationError(raw || 'Unable to process your donation. Please check your connection and try again.');
    } finally {
      setDonationLoading(false);
    }
  };

  // Handle XentriPay payment success
  const handleXentriPaySuccess = () => {
    setShowXentriPayModal(false);
    setDonationSuccess(true);
    setTimeout(() => {
      setDonationSuccess(false);
    }, 3000);
  };

  // Get display amounts based on selected currency
  const displayAmounts = tierAmounts.map(amount => convertFromRWF(amount, currency));

  // Get the display value for selected amount
  const getDisplayAmount = (): number => {
    if (customAmount) {
      return parseFloat(customAmount) || 0;
    }
    return convertFromRWF(selectedAmount, currency);
  };

  // Check if donation form has all required fields filled
  const isDonationFormValid = (): boolean => {
    if (getDisplayAmount() <= 0) return false;
    if (!isAnonymous) {
      if (!donorFirstName.trim() || !donorLastName.trim() || !donorEmail.trim()) return false;
    }
    return true;
  };

  // Lock body scroll when payment modal is open
  useEffect(() => {
    if (showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPaymentModal]);

  // Fetch donation tiers (amounts + base currency)
  useEffect(() => {
    getDonationTiers()
      .then(res => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.tiers?.length > 0) {
            const amounts = d.tiers.map(t => t.amount);
            setTierAmounts(amounts);
            setSelectedAmount(amounts[2] ?? amounts[0]);
          }
          if (d.baseCurrency) {
            setApiBaseCurrency(d.baseCurrency);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live exchange rates from the dedicated rates endpoint
  useEffect(() => {
    getCurrencyRates()
      .then(res => {
        if (res.success && res.data && Object.keys(res.data).length > 0) {
          const normalized: Record<string, ExchangeRate> = {};
          for (const [code, r] of Object.entries(res.data)) {
            normalized[code] = { symbol: r.symbol, rateToUsd: r.rateToUsd, rateUpdatedAt: r.rateUpdatedAt ?? undefined };
          }
          setExchangeRateMap(normalized);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch available currencies from API
  useEffect(() => {
    getCurrencies()
      .then(res => {
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setApiCurrencies(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Build currency toggle list
  const baseRateKnown =
    exchangeRateMap[apiBaseCurrency]?.rateToUsd != null ||
    FALLBACK_CURRENCY_CONFIG[apiBaseCurrency] != null;

  const currencyToggleList: Currency[] = (() => {
    if (!baseRateKnown) return [apiBaseCurrency];
    if (Object.keys(exchangeRateMap).length > 0) {
      const codes = Object.keys(exchangeRateMap);
      if (!codes.includes(apiBaseCurrency)) codes.unshift(apiBaseCurrency);
      return codes;
    }
    if (apiCurrencies.length > 0) {
      return apiCurrencies.map(c => c.code as Currency).filter(Boolean);
    }
    return Object.keys(FALLBACK_CURRENCY_CONFIG);
  })();

  // Intersection Observer for hero counting animation
  useEffect(() => {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !heroVisible) {
            setHeroVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (heroSectionRef.current) {
      heroObserver.observe(heroSectionRef.current);
    }

    return () => heroObserver.disconnect();
  }, [heroVisible]);

  // Intersection Observer for impact section counting animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impactVisible) {
            setImpactVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (impactSectionRef.current) {
      observer.observe(impactSectionRef.current);
    }

    return () => observer.disconnect();
  }, [impactVisible]);

  const categories = [
    {
      icon: "bi bi-people-fill",
      title: "Family Support",
      description: "Help families access healthcare, housing assistance, and essential living needs."
    },
    {
      icon: "bi bi-book-fill",
      title: "Education",
      description: "Provide books, school supplies, and educational resources to children in need."
    },
    {
      icon: "bi bi-basket3-fill",
      title: "Food Programs",
      description: "Ensure nutritious meals reach those facing food insecurity in our communities."
    },
    {
      icon: "bi bi-heart-pulse-fill",
      title: "Disability Support",
      description: "Provide assistive devices and care for individuals with disabilities."
    },
  ];

  return (
    <div className="donations-page">
      <style>{`
        .donation-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 15px 45px rgba(8, 58, 133, 0.15) !important;
        }
        .amount-btn:hover {
          border-color: #083A85 !important;
          background-color: #f0f4f8 !important;
          transform: translateY(-2px) !important;
        }
        .donate-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 30px rgba(8, 58, 133, 0.4) !important;
        }
        .impact-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1) !important;
        }

        @media (max-width: 768px) {
          /* Hero Section */
          .donations-page > section:first-of-type { min-height: auto !important; }
          .hero-content { padding: 50px 15px 40px !important; }
          .hero-title { font-size: 32px !important; line-height: 1.15 !important; }
          .hero-content p { font-size: 15px !important; }
          .hero-stats { gap: 20px !important; }
          .hero-stat-item { padding: 12px 16px !important; }
          .hero-buttons { justify-content: center !important; }

          /* Impact Statistics Section */
          .impact-section { padding: 60px 15px !important; }
          .section-title { font-size: 30px !important; }
          .section-subtitle { font-size: 15px !important; }
          .section-img { min-width: unset !important; min-height: unset !important; }
          .impact-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 15px !important; }
          .impact-card { padding: 25px 15px !important; min-height: 140px !important; }
          .impact-card > div:nth-child(2) { font-size: 36px !important; }
          .impact-card > div:nth-child(3) { font-size: 13px !important; }

          /* Education Section */
          .education-bg-curve { border-radius: 200px 200px 0 0 !important; left: -15% !important; width: 130% !important; }
          .education-curve-overlay { height: 60px !important; }
          .mission-content { flex-direction: column !important; padding: 60px 15px 50px !important; gap: 30px !important; text-align: center !important; }
          .mission-left, .mission-right { width: 100% !important; max-width: 100% !important; }
          .mission-left h2 { font-size: 30px !important; text-align: center !important; }
          .mission-left p { font-size: 15px !important; text-align: center !important; }
          .mission-left button { margin: 0 auto !important; display: block !important; }
          .mission-right > div { margin-right: 0 !important; padding: 20px !important; border-radius: 20px !important; }
          .mission-right > div > div { border-radius: 16px !important; }
          .mission-right img { min-width: unset !important; min-height: unset !important; width: 100% !important; border-radius: 16px !important; }

          /* Donation Categories */
          .categories-grid { grid-template-columns: 1fr 1fr !important; gap: 15px !important; }
          .categories-title { font-size: 30px !important; }

          /* Donation Form */
          .donation-form-card { padding: 25px 15px !important; border-radius: 20px !important; }
          .donation-form-container { flex-direction: column !important; gap: 30px !important; }
          .form-left, .form-right { width: 100% !important; }
          .form-amount-header { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .amounts-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .donor-name-row { flex-direction: column !important; }
          .trust-badges { flex-direction: column !important; gap: 12px !important; }

          /* Call to Action */
          .cta-title { font-size: 28px !important; }

          /* Family Support */
          .family-section { padding: 50px 15px !important; }
          .family-section .mission-content { flex-direction: column !important; }
          .feature-list { align-items: center !important; }
          .feature-list span { font-size: 15px !important; }
        }

        @media (max-width: 480px) {
          .hero-title { font-size: 26px !important; }
          .hero-stats { flex-direction: column !important; align-items: center !important; }
          .hero-stat-item { width: 100% !important; max-width: 280px !important; }
          .impact-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .impact-card { padding: 20px 10px !important; min-height: 120px !important; }
          .impact-card > div:nth-child(2) { font-size: 28px !important; }
          .categories-grid { grid-template-columns: 1fr !important; }
          .categories-title { font-size: 24px !important; }
          .mission-left h2 { font-size: 26px !important; }
          .cta-title { font-size: 24px !important; }
          .amounts-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <Navbar />

      {/* CTA Banner Strip */}
      {showBanner && (
        <div style={{
          padding: '0.65rem 1.5rem',
          background: '#083A85',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.875rem',
          cursor: 'pointer',
          position: 'fixed',
          top: '68px',
          left: 0,
          right: 0,
          zIndex: 49,
        }}
          onClick={() => setShowDonationModal(true)}
        >
          <i className="bi bi-heart-fill" style={{ fontSize: '1rem', color: '#ffffff' }} />
          <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            Every Contribution Matters
          </span>
          <span style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.25)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffffff' }}>
            Transform lives with your generosity!
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDonationModal(true); }}
            style={{
              background: '#fff',
              color: '#083A85',
              border: 'none',
              padding: '0.35rem 1rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginLeft: '0.25rem',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Donate Now
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowBanner(false); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '0 0.25rem',
              marginLeft: '0.5rem',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'; }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.8rem' }} />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section
        ref={heroSectionRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
        }}
      >
        {/* Background image with overlay — same pattern as events page */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src="/students.png"
            alt="Donations Background"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'blur(6px)',
              transform: 'scale(1.05)',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #083A85 100%)',
            opacity: 0.78,
          }} />
        </div>

        {/* Rotating Globe — background decoration */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          opacity: 0.3,
          pointerEvents: 'none',
        }}>
          <RotatingGlobe
            size={500}
            rotationSpeed={0.15}
            landColor="rgba(255, 255, 255, 0.12)"
            oceanColor="rgba(255, 255, 255, 0.03)"
            borderColor="rgba(255, 255, 255, 0.2)"
            graticuleColor="rgba(255, 255, 255, 0.08)"
            glowColor="rgba(139, 92, 246, 0.2)"
          />
        </div>

        <div className="hero-content" style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px) clamp(15px, 4vw, 40px)',
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 110px)',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255,255,255,0.12)',
            padding: '8px 18px',
            borderRadius: '50px',
            marginBottom: '14px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <i className="bi bi-heart-fill" style={{ fontSize: '12px', color: '#fff' }} />
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>Making a Difference Together</span>
          </div>

          <h1 className="hero-title" style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.15,
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            fontFamily: "'Pragati Narrow', sans-serif",
          }}>
            Transform Lives Through
            <br />
            Your Generosity
          </h1>

          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto 22px',
          }}>
            At Amoria Connekyt, we believe in the power of community. Every donation helps us support vulnerable families, educate children, feed the hungry, and empower those with disabilities.
          </p>

          {/* Buttons */}
          <div className="hero-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
            <button
              onClick={() => setShowDonationModal(true)}
              style={{
                backgroundColor: '#fff',
                color: '#083A85',
                padding: '12px 32px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'; }}
            >
              Donate Now
            </button>
            <button
              onClick={() => document.getElementById('impact-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                padding: '12px 32px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.35)',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
            >
              See Our Impact
            </button>
          </div>

        </div>
      </section>

      {/* Impact Statistics Section */}
      <section
        id="impact-section"
        ref={impactSectionRef}
        className="impact-section"
        style={{
          background: '#f0f4f8',
          padding: '80px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background accents */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-80px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8, 58, 133, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '-60px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8, 58, 133, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(8, 58, 133, 0.08)',
              padding: '8px 20px',
              borderRadius: '50px',
              marginBottom: '18px',
            }}>
              <i className="bi bi-bar-chart-fill" style={{ fontSize: '14px', color: '#083A85' }} />
              <span style={{ color: '#083A85', fontSize: '14px', fontWeight: 600 }}>Making Real Difference</span>
            </div>

            <h2 className="section-title" style={{
              fontSize: 'clamp(30px, 5vw, 48px)',
              fontWeight: 700,
              marginBottom: '14px',
              lineHeight: 1.1,
            }}>
              <span style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Our Impact</span>{' '}
              <span style={{ color: '#1a1a2e' }}>in Numbers</span>
            </h2>
            <p className="section-subtitle" style={{
              fontSize: '17px',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}>
              Every contribution creates ripples of change. Here's how your generosity has transformed lives in our community.
            </p>
          </div>

          <div className="impact-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '25px',
          }}>
            <ImpactCounter
              targetNumber={120}
              label="Children Educated"
              suffix="+"
              icon="bi bi-mortarboard-fill"
              color="#8B5CF6"
              isVisible={impactVisible}
            />
            <ImpactCounter
              targetNumber={50}
              label="Families Supported"
              suffix="+"
              icon="bi bi-people-fill"
              color="#083A85"
              isVisible={impactVisible}
            />
            <ImpactCounter
              targetNumber={300}
              label="Meals Provided"
              suffix="+"
              icon="bi bi-basket3-fill"
              color="#10b981"
              isVisible={impactVisible}
            />
            <ImpactCounter
              targetNumber={15}
              label="Disabilities Aided"
              suffix="+"
              icon="bi bi-heart-pulse-fill"
              color="#FF6B6B"
              isVisible={impactVisible}
            />
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="education-section" style={{
        backgroundColor: '#fff',
        padding: '80px 20px',
        position: 'relative',
      }}>
        <div className="mission-content" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '60px',
          position: 'relative',
        }}>
          <div className="mission-left" style={{ flex: 1, maxWidth: '550px' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(8, 58, 133, 0.08)',
              padding: '8px 18px',
              borderRadius: '50px',
              marginBottom: '18px',
            }}>
              <i className="bi bi-mortarboard-fill" style={{ fontSize: '13px', color: '#083A85' }} />
              <span style={{ color: '#083A85', fontSize: '13px', fontWeight: 600 }}>Education</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(30px, 5vw, 48px)',
              fontWeight: 700,
              color: '#1a1a2e',
              marginBottom: '20px',
              lineHeight: 1.2,
            }}>
              Education for{' '}
              <span style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Every Child</span>
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#1a1a2e',
              lineHeight: 1.8,
              marginBottom: '16px',
            }}>
              Through donations collected on Amoria Connekyt, we provide essential educational resources to underprivileged children. Books, school supplies, and learning materials open doors to brighter futures.
            </p>
            <p style={{
              fontSize: '16px',
              color: '#1a1a2e',
              lineHeight: 1.8,
              marginBottom: '28px',
            }}>
              Your contribution directly impacts a child's ability to learn, grow, and dream. Together, we're building a foundation for the next generation of leaders, thinkers, and changemakers.
            </p>
            <button
              onClick={() => setShowDonationModal(true)}
              style={{
                background: 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)',
                color: '#fff',
                padding: '12px 32px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(8, 58, 133, 0.3)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(90deg, #052559 0%, #083A85 100%)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(8,58,133,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(8,58,133,0.3)'; }}
            >
              Support Education
            </button>
          </div>

          <div className="mission-right" style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}>
            <div style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
            }}>
              <img
                className="section-img"
                src="/students.png"
                alt="Children receiving educational support"
                style={{
                  width: '100%',
                  maxWidth: '550px',
                  minWidth: '450px',
                  minHeight: '360px',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Family Support Section */}
      <section className="family-section" style={{
        backgroundColor: '#f0f4f8',
        padding: '80px 20px',
        position: 'relative',
      }}>
        <div className="mission-content" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '60px',
          flexDirection: 'row-reverse',
        }}>
          <div className="mission-left" style={{ flex: 1, maxWidth: '550px' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(8, 58, 133, 0.08)',
              padding: '8px 18px',
              borderRadius: '50px',
              marginBottom: '18px',
            }}>
              <i className="bi bi-people-fill" style={{ fontSize: '13px', color: '#083A85' }} />
              <span style={{ color: '#083A85', fontSize: '13px', fontWeight: 600 }}>Family Support</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(30px, 5vw, 48px)',
              fontWeight: 700,
              color: '#1a1a2e',
              marginBottom: '20px',
              lineHeight: 1.2,
            }}>
              Supporting Families{' '}
              <span style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>In Times of Need</span>
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#1a1a2e',
              lineHeight: 1.8,
              marginBottom: '16px',
            }}>
              Healthcare costs shouldn't force families to choose between medicine and meals. Amoria Connekyt channels your donations to provide medical bill assistance, insurance support, and essential healthcare access.
            </p>
            <p style={{
              fontSize: '16px',
              color: '#1a1a2e',
              lineHeight: 1.8,
              marginBottom: '28px',
            }}>
              From emergency medical needs to ongoing care, your generosity ensures no family faces health challenges alone. Together, we create a safety net of compassion and support.
            </p>

            {/* Feature list */}
            <div className="feature-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Medical Bills Assistance', 'Health Insurance Support', 'Emergency Care Fund'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '16px', color: '#083A85' }} />
                  <span style={{ fontSize: '16px', color: '#1a1a2e', fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mission-right" style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <div style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
            }}>
              <img
                className="section-img"
                src="/family.png"
                alt="Family receiving healthcare support"
                style={{
                  width: '100%',
                  maxWidth: '550px',
                  minWidth: '450px',
                  minHeight: '360px',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Donation Categories Section */}
      <section style={{
        backgroundColor: '#fff',
        padding: '80px 20px',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(8, 58, 133, 0.08)',
              padding: '8px 18px',
              borderRadius: '50px',
              marginBottom: '18px',
            }}>
              <i className="bi bi-grid-fill" style={{ fontSize: '13px', color: '#083A85' }} />
              <span style={{ color: '#083A85', fontSize: '13px', fontWeight: 600 }}>Categories</span>
            </div>

            <h2 className="categories-title" style={{
              fontSize: 'clamp(30px, 5vw, 48px)',
              fontWeight: 700,
              marginBottom: '14px',
              lineHeight: 1.1,
            }}>
              <span style={{ color: '#1a1a2e' }}>Choose Where Your</span>{' '}
              <span style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Donation Goes</span>
            </h2>
            <p className="section-subtitle" style={{
              fontSize: '17px',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Direct your contribution to the cause closest to your heart. Every category represents lives waiting to be transformed.
            </p>
          </div>

          <div className="categories-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '25px',
          }}>
            {categories.map((cat, index) => (
              <DonationCard
                key={index}
                icon={cat.icon}
                title={cat.title}
                description={cat.description}
                isActive={activeCategory === index}
                onClick={() => { setActiveCategory(index); setShowDonationModal(true); }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Donation Form Modal */}
      {showDonationModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDonationModal(false); }}
        >
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        }}>
          {/* Modal header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px 0' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                <span style={{ color: '#1a1a2e' }}>Make Your </span>
                <span style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Donation</span>
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                Contributing to <strong style={{ color: '#083A85' }}>{categories[activeCategory]?.title}</strong>
              </p>
            </div>
            <button onClick={() => setShowDonationModal(false)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '16px', flexShrink: 0 }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div style={{ padding: '18px 28px 24px' }}>
            {/* Category selector */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              {categories.map((cat, i) => (
                <button key={i} onClick={() => setActiveCategory(i)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 6px', borderRadius: '10px', border: activeCategory === i ? '1.5px solid #083A85' : '1.5px solid #e2e8f0', backgroundColor: activeCategory === i ? 'rgba(8,58,133,0.06)' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <i className={cat.icon} style={{ fontSize: '16px', color: activeCategory === i ? '#083A85' : '#94a3b8' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: activeCategory === i ? '#083A85' : '#64748b', textAlign: 'center', lineHeight: 1.2 }}>{cat.title}</span>
                </button>
              ))}
            </div>

            {/* Amount + Currency row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>Select Amount</h3>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', padding: '3px', borderRadius: '8px' }}>
                {currencyToggleList.map((curr) => (
                  <button key={curr} onClick={() => { setCurrency(curr); setCustomAmount(''); }}
                    style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', border: 'none', backgroundColor: currency === curr ? '#083A85' : 'transparent', color: currency === curr ? '#fff' : '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {tierAmounts.map((amountRWF, index) => (
                <AmountButton key={amountRWF} label={formatCurrency(displayAmounts[index], currency)}
                  isSelected={selectedAmount === amountRWF && !customAmount}
                  onClick={() => { setSelectedAmount(amountRWF); setCustomAmount(''); }} />
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0 12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 600, marginRight: '4px' }}>
                {currency === 'RWF' ? '' : getCurrencyConfig(currency).symbol}
              </span>
              <input type="number" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                placeholder="Custom amount" style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 8px', fontSize: '15px', fontWeight: 500 }} />
              {currency === 'RWF' && <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>RWF</span>}
            </div>

            {/* Frequency */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['one-time', 'monthly'] as const).map((freq) => (
                <button key={freq} onClick={() => setDonationFrequency(freq)}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: donationFrequency === freq ? '1.5px solid #083A85' : '1.5px solid #e2e8f0', backgroundColor: donationFrequency === freq ? '#083A85' : '#fff', color: donationFrequency === freq ? '#fff' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {freq === 'one-time' ? 'One-time' : 'Monthly'}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #e2e8f0', margin: '0 0 14px' }} />

            {/* Donor info */}
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 10px' }}>Your Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder={isAnonymous ? 'First Name' : 'First Name *'} value={donorFirstName} onChange={(e) => setDonorFirstName(e.target.value)}
                  style={{ flex: 1, padding: '11px 12px', borderRadius: '10px', border: `1.5px solid ${!isAnonymous && !donorFirstName.trim() ? '#f0a0a0' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
                <input type="text" placeholder={isAnonymous ? 'Last Name' : 'Last Name *'} value={donorLastName} onChange={(e) => setDonorLastName(e.target.value)}
                  style={{ flex: 1, padding: '11px 12px', borderRadius: '10px', border: `1.5px solid ${!isAnonymous && !donorLastName.trim() ? '#f0a0a0' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
              </div>
              <input type="email" placeholder={isAnonymous ? 'Email Address' : 'Email Address *'} value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)}
                style={{ padding: '11px 12px', borderRadius: '10px', border: `1.5px solid ${!isAnonymous && !donorEmail.trim() ? '#f0a0a0' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
              <textarea placeholder="Message (optional)" rows={2} value={donorMessage} onChange={(e) => setDonorMessage(e.target.value)}
                style={{ padding: '11px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                Donate anonymously
              </label>
            </div>

            {/* Submit */}
            <button className="donate-btn" onClick={() => { if (isDonationFormValid()) { setShowDonationModal(false); handleDonation(); } }} disabled={!isDonationFormValid()}
              style={{ width: '100%', marginTop: '16px', background: isDonationFormValid() ? 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)' : '#b0b0b0', color: '#fff', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: 600, cursor: isDonationFormValid() ? 'pointer' : 'not-allowed', transition: 'all 0.3s', boxShadow: isDonationFormValid() ? '0 4px 14px rgba(8,58,133,0.3)' : 'none', opacity: isDonationFormValid() ? 1 : 0.7 }}
              onMouseEnter={(e) => { if (isDonationFormValid()) { e.currentTarget.style.background = 'linear-gradient(90deg, #052559 0%, #083A85 100%)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { if (isDonationFormValid()) { e.currentTarget.style.background = 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)'; e.currentTarget.style.transform = 'translateY(0)'; } }}>
              Donate {formatCurrency(getDisplayAmount(), currency)} Now
            </button>

            {/* Trust badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '11px' }}><i className="bi bi-lock-fill" style={{ fontSize: '12px' }} />Secure</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '11px' }}><i className="bi bi-shield-check" style={{ fontSize: '12px' }} />Tax Deductible</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '11px' }}><i className="bi bi-check-circle-fill" style={{ fontSize: '12px' }} />Verified</div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Call to Action Section */}
      <section style={{
        backgroundColor: '#f8fafc',
        padding: '80px 20px',
        position: 'relative',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <h2 className="cta-title" style={{
            fontSize: 'clamp(30px, 5vw, 48px)',
            fontWeight: 700,
            marginBottom: '18px',
            lineHeight: 1.1,
          }}>
            <span style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Together, We Can Create</span>
            <br />
            <span style={{ color: '#1a1a2e' }}>Lasting Change</span>
          </h2>

          <p style={{
            fontSize: '18px',
            color: '#1a1a2e',
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto 35px',
          }}>
            Join thousands of donors who have already made a difference. Your contribution, no matter the size, helps us continue our mission of supporting those in need.
          </p>

          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setShowDonationModal(true)}
              style={{
                background: 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)',
                color: '#fff',
                padding: '12px 32px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(8, 58, 133, 0.3)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(90deg, #052559 0%, #083A85 100%)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(8,58,133,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(90deg, #083A85 0%, #0a4da3 100%)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(8,58,133,0.3)'; }}
            >
              Start Donating
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)',
            padding: '16px',
            overflowY: 'auto'
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              resetPaymentModal();
            }
          }}
        >
          <div
            className="payment-modal"
            style={{
              backgroundColor: '#fff',
              borderRadius: '24px',
              padding: 'clamp(24px, 5vw, 40px)',
              paddingTop: 'clamp(50px, 8vw, 60px)',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              margin: 'auto',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => resetPaymentModal()}
              style={{
                position: 'absolute',
                top: 'clamp(12px, 3vw, 20px)',
                right: 'clamp(12px, 3vw, 20px)',
                background: '#f3f4f6',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '10px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: '16px' }} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: 'clamp(20px, 5vw, 26px)',
                fontWeight: 700,
                color: '#083A85',
                marginBottom: '8px',
                marginTop: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <i className="bi bi-heart-fill" style={{ fontSize: '24px', color: '#083A85' }} />
                Complete Your Donation
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0,
              }}>
                You're donating <strong style={{ color: '#083A85' }}>{formatCurrency(getDisplayAmount(), currency)}</strong> to <strong>{categories[activeCategory].title}</strong>
              </p>
            </div>

            {/* Error message */}
            {donationError && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '16px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #EF4444',
                borderRadius: '12px',
                color: '#EF4444',
                fontSize: '14px',
              }}>
                {donationError}
              </div>
            )}

            {/* Proceed to Payment Button */}
            <button
              onClick={handleDonation}
              disabled={donationLoading || getDisplayAmount() <= 0}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: (donationLoading || getDisplayAmount() <= 0)
                  ? '#e2e8f0'
                  : 'linear-gradient(135deg, #083A85 0%, #0a4da3 100%)',
                border: 'none',
                borderRadius: '14px',
                color: (donationLoading || getDisplayAmount() <= 0) ? '#9ca3af' : '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: (donationLoading || getDisplayAmount() <= 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: (donationLoading || getDisplayAmount() <= 0) ? 'none' : '0 4px 15px rgba(8, 58, 133, 0.3)',
              }}
              onMouseEnter={(e) => { if (!donationLoading && getDisplayAmount() > 0) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="bi bi-heart-fill" style={{ fontSize: '16px' }} />
              {donationLoading ? 'Processing...' : `Proceed to Payment ${formatCurrency(getDisplayAmount(), currency)}`}
            </button>

            {/* Security Note */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
              color: '#9ca3af',
              fontSize: '13px',
            }}>
              <i className="bi bi-lock-fill" style={{ fontSize: '12px' }} />
              Your payment is secure and encrypted
            </div>
          </div>
        </div>
      )}

      {/* XentriPay Payment Modal */}
      <XentriPayModal
        isOpen={showXentriPayModal}
        onClose={() => { setShowXentriPayModal(false); setPendingDonationId(null); }}
        onSuccess={handleXentriPaySuccess}
        amount={getDisplayAmount()}
        currencyCode={currency}
        currencyId={apiCurrencies.find(c => c.code === currency)?.id || ''}
        paymentType="donation"
        donationId={pendingDonationId || undefined}
        title="Complete Your Donation"
        subtitle={`Donating ${formatCurrency(getDisplayAmount(), currency)} to ${categories[activeCategory].title}`}
      />

      {/* Success Toast */}
      {donationSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 28px',
          backgroundColor: '#059669',
          color: '#fff',
          borderRadius: '14px',
          fontSize: '15px',
          fontWeight: 600,
          zIndex: 3000,
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <i className="bi bi-check-circle-fill" style={{ fontSize: '18px' }} />
          Donation successful! Thank you for your generosity.
        </div>
      )}

    </div>
  );
};

export default Donations;
