"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

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

// Currency types and exchange rates (approximate rates - RWF as base)
type Currency = 'RWF' | 'USD' | 'EUR';

const currencyConfig: Record<Currency, { symbol: string; rate: number; name: string }> = {
  RWF: { symbol: 'RWF', rate: 1, name: 'Rwandan Franc' },
  USD: { symbol: '$', rate: 0.00075, name: 'US Dollar' }, // 1 RWF ≈ 0.00075 USD
  EUR: { symbol: '€', rate: 0.00069, name: 'Euro' }, // 1 RWF ≈ 0.00069 EUR
};

// Base amounts in RWF
const baseAmountsRWF = [1000, 2000, 5000, 10000, 25000, 50000];

// Convert amount from RWF to target currency
const convertFromRWF = (amountRWF: number, currency: Currency): number => {
  const converted = amountRWF * currencyConfig[currency].rate;
  // Round appropriately based on currency
  if (currency === 'RWF') return Math.round(converted);
  return Math.round(converted * 100) / 100; // 2 decimal places for USD/EUR
};

// Format currency amount with symbol
const formatCurrency = (amount: number, currency: Currency): string => {
  const config = currencyConfig[currency];
  if (currency === 'RWF') {
    return `${formatNumber(Math.round(amount))} ${config.symbol}`;
  }
  return `${config.symbol}${formatNumber(amount)}`;
};

// Get background color for impact cards based on main color
const getImpactCardBg = (color: string): string => {
  const colorMap: Record<string, string> = {
    '#083A85': '#e8f4ff', // Blue -> Light blue
    '#8B5CF6': '#f0e8ff', // Purple -> Light purple
    '#FF6B6B': '#ffe8e8', // Red/coral -> Light pink
    '#10B981': '#e8fff4', // Green -> Light green
  };
  return colorMap[color] || '#f5f5f5';
};

// Impact Counter Component
const ImpactCounter = ({
  targetNumber,
  label,
  suffix = "",
  color = '#083A85',
  isVisible = false
}: {
  targetNumber: number;
  label: string;
  suffix?: string;
  color?: string;
  isVisible?: boolean;
}) => {
  const count = useCountUp(targetNumber, 2500, isVisible);
  const bgColor = getImpactCardBg(color);

  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 25px',
      backgroundColor: bgColor,
      borderRadius: '20px',
      transition: 'all 0.3s ease',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '180px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
    className="impact-card"
    >
      {/* Grid Pattern Background */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Row 1 */}
        {/* Top left - Circle */}
        <circle cx="25" cy="25" r="18" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Top left-center - Triangle */}
        <polygon points="70,8 85,38 55,38" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Top center - Rounded square */}
        <rect x="105" y="10" width="30" height="30" rx="6" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Top right - Small circle with dot */}
        <circle cx="170" cy="25" r="15" fill="none" stroke={color} strokeWidth="1.2" />
        <circle cx="170" cy="25" r="3" fill={color} fillOpacity="0.4" />

        {/* Row 2 */}
        {/* Left - Rounded rectangle */}
        <rect x="8" y="60" width="32" height="42" rx="8" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Left-center - Circle */}
        <circle cx="70" cy="80" r="16" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Center - Diamond/Rotated square */}
        <rect x="110" y="65" width="24" height="24" rx="4" fill="none" stroke={color} strokeWidth="1.2" transform="rotate(45, 122, 77)" />

        {/* Right - Tall rounded rectangle */}
        <rect x="158" y="55" width="28" height="45" rx="8" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Row 3 */}
        {/* Bottom left - Triangle pointing down */}
        <polygon points="30,130 45,160 15,160" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Bottom left-center - Rounded square */}
        <rect x="55" y="135" width="35" height="35" rx="10" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Bottom center - Circle */}
        <circle cx="125" cy="155" r="20" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Bottom right - Cone/Triangle */}
        <polygon points="170,130 185,175 155,175" fill="none" stroke={color} strokeWidth="1.2" />

        {/* Extra small shapes for density */}
        {/* Small circle top */}
        <circle cx="145" cy="45" r="8" fill="none" stroke={color} strokeWidth="1" />

        {/* Small square middle */}
        <rect x="42" y="115" width="16" height="16" rx="3" fill="none" stroke={color} strokeWidth="1" />

        {/* Small triangle */}
        <polygon points="95,115 103,130 87,130" fill="none" stroke={color} strokeWidth="1" />

        {/* Small circle bottom right */}
        <circle cx="145" cy="125" r="10" fill="none" stroke={color} strokeWidth="1" />
      </svg>

      {/* Number */}
      <div style={{
        fontSize: '48px',
        fontWeight: 800,
        color: color,
        lineHeight: 1.1,
        marginBottom: '10px',
        position: 'relative',
        zIndex: 2,
      }}>
        {formatNumber(count)}{suffix}
      </div>

      {/* Label */}
      <div style={{
        fontSize: '15px',
        color: '#555',
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
  icon: React.ReactNode;
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
        : '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: isActive ? '2px solid #083A85' : '2px solid transparent',
      transform: isActive ? 'translateY(-5px)' : 'translateY(0)',
    }}
  >
    <div style={{
      width: '60px',
      height: '60px',
      borderRadius: '15px',
      backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : '#E8F4F8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      color: isActive ? '#fff' : '#083A85',
    }}>
      {icon}
    </div>
    <h3 style={{
      fontSize: '20px',
      fontWeight: 700,
      color: isActive ? '#fff' : '#000',
      marginBottom: '12px',
    }}>
      {title}
    </h3>
    <p style={{
      fontSize: '14px',
      lineHeight: 1.6,
      color: isActive ? 'rgba(255,255,255,0.85)' : '#666',
      margin: 0,
    }}>
      {description}
    </p>
  </div>
);

// Donation Amount Button
const AmountButton = ({
  amount,
  isSelected,
  onClick,
  currency
}: {
  amount: number;
  isSelected: boolean;
  onClick: () => void;
  currency: Currency;
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '15px 20px',
      fontSize: '16px',
      fontWeight: 600,
      borderRadius: '12px',
      border: isSelected ? '2px solid #083A85' : '2px solid #e0e0e0',
      backgroundColor: isSelected ? '#083A85' : '#fff',
      color: isSelected ? '#fff' : '#1f1d1d',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '100px',
    }}
  >
    {formatCurrency(amount, currency)}
  </button>
);

// Hero Stat Card Component with counting animation
const HeroStatCard = ({
  targetNumber,
  label,
  prefix = "",
  suffix = "",
  color,
  isVisible
}: {
  targetNumber: number;
  label: string;
  prefix?: string;
  suffix?: string;
  color: string;
  isVisible: boolean;
}) => {
  const count = useCountUp(targetNumber, 2000, isVisible);

  return (
    <>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>
        {prefix}{formatNumber(count)}{suffix}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>{label}</div>
    </>
  );
};

// Payment methods for donations
const paymentMethods = [
  { id: 'mtn', name: 'MTN Mobile Money', image: '/mtn.png' },
  { id: 'airtel', name: 'Airtel Money', image: '/airtel.png' },
  { id: 'bank', name: 'Bank Transfer', image: '/bank.png' },
  { id: 'card', name: 'VISA & Master Card', image: '/cards.png' }
];

const Donations = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState<number>(baseAmountsRWF[2]); // Default 3,000 RWF
  const [customAmount, setCustomAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('RWF');
  const [donationFrequency, setDonationFrequency] = useState<'one-time' | 'monthly'>('one-time');
  const [impactVisible, setImpactVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const impactSectionRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [donorFirstName, setDonorFirstName] = useState('');
  const [donorLastName, setDonorLastName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Reset payment modal state
  const resetPaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setPaymentPhone('');
    setBankName('');
    setBankAccountName('');
    setBankAccountNumber('');
    setCardHolderName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
  };

  // Validate payment details
  const isPaymentDetailsValid = (): boolean => {
    if (!selectedPaymentMethod) return false;

    const amount = getDisplayAmount();
    if (!amount || amount <= 0) return false;

    switch (selectedPaymentMethod) {
      case 'mtn':
      case 'airtel':
        return paymentPhone.length >= 10;
      case 'bank':
        return bankName.trim() !== '' && bankAccountName.trim() !== '' && bankAccountNumber.trim() !== '';
      case 'card':
        return cardHolderName.trim() !== '' && cardNumber.length >= 13 && cardExpiry.length === 5 && cardCvv.length >= 3;
      default:
        return false;
    }
  };

  // Handle donation submission
  const handleDonation = () => {
    if (!isPaymentDetailsValid()) {
      alert('Please fill in all required payment details');
      return;
    }

    const donationData = {
      amount: getDisplayAmount(),
      currency,
      frequency: donationFrequency,
      category: categories[activeCategory].title,
      paymentMethod: selectedPaymentMethod,
      donor: isAnonymous ? 'Anonymous' : { firstName: donorFirstName, lastName: donorLastName, email: donorEmail },
      message: donorMessage,
    };

    console.log('Processing donation:', donationData);

    const methodName = paymentMethods.find(m => m.id === selectedPaymentMethod)?.name || selectedPaymentMethod;
    alert(`Thank you for your donation of ${formatCurrency(getDisplayAmount(), currency)}!\n\nPayment method: ${methodName}\nFrequency: ${donationFrequency === 'monthly' ? 'Monthly' : 'One-time'}`);

    resetPaymentModal();
  };

  // Get display amounts based on selected currency
  const displayAmounts = baseAmountsRWF.map(amount => convertFromRWF(amount, currency));

  // Get the display value for selected amount
  const getDisplayAmount = (): number => {
    if (customAmount) {
      return parseFloat(customAmount) || 0;
    }
    return convertFromRWF(selectedAmount, currency);
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
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: "Family Support",
      description: "Help families access healthcare, housing assistance, and essential living needs."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      title: "Education",
      description: "Provide books, school supplies, and educational resources to children in need."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
          <path d="M8.5 8.5v.01"/>
          <path d="M16 15.5v.01"/>
          <path d="M12 12v.01"/>
          <path d="M11 17v.01"/>
          <path d="M7 14v.01"/>
        </svg>
      ),
      title: "Food Programs",
      description: "Ensure nutritious meals reach those facing food insecurity in our communities."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      ),
      title: "Disability Support",
      description: "Provide assistive devices and care for individuals with disabilities."
    },
  ];

  return (
    <div className="donations-page">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .donation-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 15px 45px rgba(8, 58, 133, 0.2) !important;
        }
        .amount-btn:hover {
          border-color: #083A85 !important;
          background-color: #f0f4f8 !important;
        }
        .donate-btn:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 30px rgba(8, 58, 133, 0.4) !important;
        }
        .impact-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.12) !important;
        }

        @media (max-width: 768px) {
          .hero-content { flex-direction: column !important; text-align: center !important; padding: 40px 20px !important; }
          .hero-left, .hero-right { width: 100% !important; max-width: 100% !important; }
          .hero-title { font-size: 36px !important; }
          .hero-right { margin-top: 30px !important; }
          .impact-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 30px !important; }
          .categories-grid { grid-template-columns: 1fr !important; }
          .mission-content { flex-direction: column !important; }
          .mission-left, .mission-right { width: 100% !important; }
          .donation-form-container { flex-direction: column !important; }
          .form-left, .form-right { width: 100% !important; }
          .amounts-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .cta-title { font-size: 32px !important; }
        }
      `}</style>

      <Navbar />

      {/* Hero Section - Inspired by CLP design with dark gradient */}
      <section
        ref={heroSectionRef}
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #0d2847 100%)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '500px',
        }}
      >
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(8, 58, 133, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          animation: 'pulse 5s ease-in-out infinite',
        }} />

        {/* Dashed border box decoration */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60%',
          height: '70%',
          border: '2px dashed rgba(255,255,255,0.15)',
          borderRadius: '30px',
          pointerEvents: 'none',
        }} />

        <div className="hero-content" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2,
        }}>
          <div className="hero-left" style={{ maxWidth: '550px' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '10px 20px',
              borderRadius: '50px',
              marginBottom: '25px',
              backdropFilter: 'blur(10px)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF6B6B">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>Making a Difference Together</span>
            </div>

            <h1 className="hero-title" style={{
              fontSize: '52px',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.1,
              marginBottom: '20px',
              letterSpacing: '-0.02em',
            }}>
              <span style={{ color: '#FF6B6B' }}>Transform Lives</span>
              <br />
              Through Your Generosity
            </h1>

            <p style={{
              fontSize: '17px',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.7,
              marginBottom: '30px',
            }}>
              At Amoria Connekyt, we believe in the power of community. Every donation helps us support vulnerable families, educate children, feed the hungry, and empower those with disabilities.
            </p>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button
                onClick={() => document.getElementById('donate-section')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  backgroundColor: '#FF6B6B',
                  color: '#fff',
                  padding: '14px 32px',
                  borderRadius: '50px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
                }}
              >
                Donate Now
              </button>
              <button
                onClick={() => document.getElementById('impact-section')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  padding: '14px 32px',
                  borderRadius: '50px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                See Our Impact
              </button>
            </div>
          </div>

          {/* Right side - Decorative elements */}
          <div className="hero-right" style={{
            position: 'relative',
            width: '400px',
            height: '400px',
          }}>
            {/* Central icon/graphic */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              background: 'linear-gradient(135deg, #083A85 0%, #FF6B6B 100%)',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'float 3s ease-in-out infinite',
            }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                <path d="M12 5v14M5 12h14" strokeOpacity="0.5"/>
              </svg>
            </div>

            {/* Floating cards */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              backgroundColor: '#fff',
              padding: '15px 20px',
              borderRadius: '15px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              animation: 'float 4s ease-in-out infinite',
              animationDelay: '0.5s',
            }}>
              <HeroStatCard
                targetNumber={50}
                label="Families Helped"
                suffix="+"
                color="#083A85"
                isVisible={heroVisible}
              />
            </div>

            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '20px',
              backgroundColor: '#fff',
              padding: '15px 20px',
              borderRadius: '15px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              animation: 'float 4s ease-in-out infinite',
              animationDelay: '1s',
            }}>
              <HeroStatCard
                targetNumber={2}
                label="Donated"
                prefix="$"
                suffix="K+"
                color="#FF6B6B"
                isVisible={heroVisible}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statistics Section */}
      <section
        id="impact-section"
        ref={impactSectionRef}
        style={{
          background: 'linear-gradient(180deg, #fff 0%, #f0f4f8 100%)',
          padding: '100px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '-5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8, 58, 133, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(8, 58, 133, 0.08)',
              padding: '8px 20px',
              borderRadius: '50px',
              marginBottom: '20px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span style={{ color: '#083A85', fontSize: '14px', fontWeight: 600 }}>Making Real Difference</span>
            </div>

            <h2 style={{
              fontSize: '50px',
              fontWeight: 700,
              marginBottom: '18px',
              lineHeight: 1.1,
            }}>
              <span style={{
                background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Our Impact
              </span>{' '}
              <span style={{ color: '#000' }}>in Numbers</span>
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#666',
              maxWidth: '650px',
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
              color="#083A85"
              isVisible={impactVisible}
            />
            <ImpactCounter
              targetNumber={50}
              label="Families Supported"
              suffix="+"
              color="#8B5CF6"
              isVisible={impactVisible}
            />
            <ImpactCounter
              targetNumber={300}
              label="Meals Provided"
              suffix="+"
              color="#FF6B6B"
              isVisible={impactVisible}
            />
            <ImpactCounter
              targetNumber={15}
              label="Disabilities Aided"
              suffix="+"
              color="#10B981"
              isVisible={impactVisible}
            />
          </div>
        </div>
      </section>

      {/* Education Section - Curved design inspired by BRD */}
      <section className="education-section" style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '0',
        marginTop: '-1px',
      }}>
        {/* Curved top background shape */}
        <div className="education-bg-curve" style={{
          position: 'absolute',
          top: 0,
          left: '-10%',
          width: '120%',
          height: '100%',
          backgroundColor: '#083A85',
          borderRadius: '500px 500px 0 0',
          zIndex: 0,
        }} />

        {/* Inner curved container for the content */}
        <div className="education-inner" style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: '30px',
        }}>
          {/* Top curved edge overlay */}
          <div className="education-curve-overlay" style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120%',
            height: '100px',
            backgroundColor: '#fff',
            borderRadius: '0 0 50% 50%',
          }} />

          <div className="mission-content" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '100px 40px 80px',
            display: 'flex',
            alignItems: 'center',
            gap: '60px',
            position: 'relative',
            zIndex: 2,
          }}>
            <div className="mission-left" style={{ flex: 1, maxWidth: '550px' }}>
              <h2 style={{
                fontSize: '50px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '25px',
                lineHeight: 1.2,
              }}>
                Education for Every Child
              </h2>
              <p style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.8,
                marginBottom: '20px',
              }}>
                Through donations collected on Amoria Connekyt, we provide essential educational resources to underprivileged children. Books, school supplies, and learning materials open doors to brighter futures.
              </p>
              <p style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.8,
                marginBottom: '30px',
              }}>
                Your contribution directly impacts a child's ability to learn, grow, and dream. Together, we're building a foundation for the next generation of leaders, thinkers, and changemakers.
              </p>
              <button
                onClick={() => document.getElementById('donate-section')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  backgroundColor: '#fff',
                  color: '#083A85',
                  padding: '14px 32px',
                  borderRadius: '50px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
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
              {/* Large rounded container matching BRD style */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '550px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '0 200px 200px 0',
                padding: '50px 50px 50px 0',
                marginRight: '-50px',
              }}>
                <div style={{
                  position: 'relative',
                  borderRadius: '30px 180px 180px 30px',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                }}>
                  <img
                    src="/students.png"
                    alt="Children receiving educational support"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      minHeight: '380px',
                      minWidth: '450px',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Family Support Section */}
      <section style={{
        backgroundColor: '#f8f9fa',
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
            <h2 style={{
              fontSize: '50px',
              fontWeight: 700,
              color: '#000',
              marginBottom: '25px',
              lineHeight: 1.2,
            }}>
              <span style={{
                background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Supporting Families
              </span>
              <br />
              In Times of Need
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#1f1d1d',
              lineHeight: 1.8,
              marginBottom: '20px',
            }}>
              Healthcare costs shouldn't force families to choose between medicine and meals. Amoria Connekyt channels your donations to provide medical bill assistance, insurance support, and essential healthcare access.
            </p>
            <p style={{
              fontSize: '18px',
              color: '#1f1d1d',
              lineHeight: 1.8,
              marginBottom: '30px',
            }}>
              From emergency medical needs to ongoing care, your generosity ensures no family faces health challenges alone. Together, we create a safety net of compassion and support.
            </p>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {['Medical Bills Assistance', 'Health Insurance Support', 'Emergency Care Fund'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#083A85',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: '18px', color: '#1f1d1d', fontWeight: 500 }}>{item}</span>
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
              borderRadius: '25px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
            }}>
              <img
                src="/family.png"
                alt="Family receiving healthcare support"
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  minWidth: '500px',
                  minHeight: '350px',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Donation Categories Section - Card design inspired */}
      <section style={{
        backgroundColor: '#fff',
        padding: '80px 20px',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 className="categories-title" style={{
              fontSize: '50px',
              fontWeight: 700,
              marginBottom: '15px',
              lineHeight: 1.1,
            }}>
              <span style={{ color: '#000' }}>Choose Where Your</span>{' '}
              <span style={{
                background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Donation Goes
              </span>
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#666',
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
                onClick={() => setActiveCategory(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Donation Form Section */}
      <section id="donate-section" style={{
        background: 'linear-gradient(135deg, #E8F4F8 0%, #f0f4f8 100%)',
        padding: '80px 20px',
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{
              fontSize: '50px',
              fontWeight: 700,
              marginBottom: '15px',
              lineHeight: 1.1,
            }}>
              <span style={{
                background: 'linear-gradient(90deg, #083A85 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Make Your Donation
              </span>
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#666',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Every contribution counts. Choose an amount or enter your own to start making a difference today.
            </p>
          </div>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '30px',
            padding: '50px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          }}>
            <div className="donation-form-container" style={{
              display: 'flex',
              gap: '50px',
            }}>
              {/* Left - Amount Selection */}
              <div className="form-left" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#000',
                    margin: 0,
                  }}>
                    Select Donation Amount
                  </h3>

                  {/* Currency Selector */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    backgroundColor: '#f5f5f5',
                    padding: '4px',
                    borderRadius: '10px',
                  }}>
                    {(['RWF', 'USD', 'EUR'] as Currency[]).map((curr) => (
                      <button
                        key={curr}
                        onClick={() => {
                          setCurrency(curr);
                          setCustomAmount('');
                        }}
                        style={{
                          padding: '8px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: currency === curr ? '#083A85' : 'transparent',
                          color: currency === curr ? '#fff' : '#666',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="amounts-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '15px',
                  marginBottom: '25px',
                }}>
                  {baseAmountsRWF.map((amountRWF, index) => (
                    <AmountButton
                      key={amountRWF}
                      amount={displayAmounts[index]}
                      currency={currency}
                      isSelected={selectedAmount === amountRWF && !customAmount}
                      onClick={() => {
                        setSelectedAmount(amountRWF);
                        setCustomAmount('');
                      }}
                    />
                  ))}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#666',
                    marginBottom: '10px',
                  }}>
                    Or enter custom amount ({currencyConfig[currency].name})
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '0 15px',
                    transition: 'all 0.3s ease',
                  }}>
                    <span style={{ fontSize: '18px', color: '#666', fontWeight: 600, marginRight: '5px' }}>
                      {currency === 'RWF' ? '' : currencyConfig[currency].symbol}
                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(0);
                      }}
                      placeholder="Enter amount"
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        padding: '15px 10px',
                        fontSize: '18px',
                        fontWeight: 500,
                      }}
                    />
                    {currency === 'RWF' && (
                      <span style={{ fontSize: '16px', color: '#666', fontWeight: 600 }}>RWF</span>
                    )}
                  </div>
                </div>

                {/* Donation frequency */}
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    onClick={() => setDonationFrequency('one-time')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: donationFrequency === 'one-time' ? '2px solid #083A85' : '2px solid #e0e0e0',
                      backgroundColor: donationFrequency === 'one-time' ? '#083A85' : '#fff',
                      color: donationFrequency === 'one-time' ? '#fff' : '#666',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    One-time
                  </button>
                  <button
                    onClick={() => setDonationFrequency('monthly')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: donationFrequency === 'monthly' ? '2px solid #083A85' : '2px solid #e0e0e0',
                      backgroundColor: donationFrequency === 'monthly' ? '#083A85' : '#fff',
                      color: donationFrequency === 'monthly' ? '#fff' : '#666',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Right - Donor Info */}
              <div className="form-right" style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#000',
                  marginBottom: '25px',
                }}>
                  Your Information
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={donorFirstName}
                      onChange={(e) => setDonorFirstName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '15px',
                        borderRadius: '12px',
                        border: '2px solid #e0e0e0',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={donorLastName}
                      onChange={(e) => setDonorLastName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '15px',
                        borderRadius: '12px',
                        border: '2px solid #e0e0e0',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    style={{
                      padding: '15px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  />
                  <textarea
                    placeholder="Leave a message (optional)"
                    rows={3}
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    style={{
                      padding: '15px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      fontSize: '15px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                    }}
                  />

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    color: '#666',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Make my donation anonymous
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="donate-btn"
              onClick={() => setShowPaymentModal(true)}
              style={{
                width: '100%',
                marginTop: '30px',
                backgroundColor: '#083A85',
                color: '#fff',
                padding: '18px',
                borderRadius: '15px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 5px 20px rgba(8, 58, 133, 0.3)',
              }}
            >
              Donate {formatCurrency(getDisplayAmount(), currency)} {donationFrequency === 'monthly' ? 'Monthly' : 'Now'}
            </button>

            {/* Trust badges */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '30px',
              marginTop: '25px',
              paddingTop: '25px',
              borderTop: '1px solid #e0e0e0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '13px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Secure Payment
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '13px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                100% Tax Deductible
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '13px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Verified Nonprofit
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={{
        backgroundColor: '#DBDBDB',
        padding: '80px 20px',
        position: 'relative',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <h2 className="cta-title" style={{
            fontSize: '50px',
            fontWeight: 700,
            marginBottom: '20px',
            lineHeight: 1.1,
          }}>
            <span style={{
              background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Together, We Can Create
            </span>
            <br />
            <span style={{ color: '#000' }}>Lasting Change</span>
          </h2>

          <p style={{
            fontSize: '18px',
            color: '#1f1d1d',
            lineHeight: 1.7,
            marginBottom: '35px',
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
              onClick={() => document.getElementById('donate-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                backgroundColor: '#083A85',
                color: '#fff',
                padding: '15px 35px',
                borderRadius: '50px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(8, 58, 133, 0.3)',
              }}
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
                background: '#f5f5f5',
                border: 'none',
                color: '#666',
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
                e.currentTarget.style.backgroundColor = '#e0e0e0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
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
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF6B6B" stroke="#FF6B6B" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                Complete Your Donation
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: 0,
              }}>
                You're donating <strong style={{ color: '#083A85' }}>{formatCurrency(getDisplayAmount(), currency)}</strong>
                {donationFrequency === 'monthly' ? ' monthly' : ''} to <strong>{categories[activeCategory].title}</strong>
              </p>
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#333',
                marginBottom: '12px'
              }}>Select Payment Method</label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      backgroundColor: selectedPaymentMethod === method.id ? 'rgba(8, 58, 133, 0.08)' : '#f8f9fa',
                      border: '2px solid',
                      borderColor: selectedPaymentMethod === method.id ? '#083A85' : '#e0e0e0',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e0e0e0'
                    }}>
                      <img
                        src={method.image}
                        alt={method.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <span style={{
                      color: '#333',
                      fontSize: '15px',
                      fontWeight: 500
                    }}>{method.name}</span>
                    {selectedPaymentMethod === method.id && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#083A85" style={{ marginLeft: 'auto' }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* MTN/Airtel Mobile Money Input */}
            {(selectedPaymentMethod === 'mtn' || selectedPaymentMethod === 'airtel') && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '8px'
                }}>Phone Number *</label>
                <input
                  type="tel"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder={selectedPaymentMethod === 'mtn' ? "e.g., 078XXXXXXX" : "e.g., 073XXXXXXX"}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: '#f8f9fa',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    color: '#333',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#083A85'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#888',
                  marginTop: '6px',
                  marginBottom: 0
                }}>You will receive a payment prompt on this number</p>
              </div>
            )}

            {/* Bank Transfer Input */}
            {selectedPaymentMethod === 'bank' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '8px'
                  }}>Bank Name *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Bank of Kigali, Equity Bank"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      color: '#333',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#083A85'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '8px'
                  }}>Account Holder Name *</label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder="Enter account holder name"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      color: '#333',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#083A85'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '8px'
                  }}>Account Number *</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter account number"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      color: '#333',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#083A85'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
              </div>
            )}

            {/* Card Payment Input */}
            {selectedPaymentMethod === 'card' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '8px'
                  }}>Card Holder Name *</label>
                  <input
                    type="text"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    placeholder="Name on card"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      color: '#333',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#083A85'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '8px'
                  }}>Card Number *</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="1234 5678 9012 3456"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      color: '#333',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      letterSpacing: '2px'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#083A85'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#333',
                      marginBottom: '8px'
                    }}>Expiry Date *</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2);
                        }
                        setCardExpiry(value);
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        backgroundColor: '#f8f9fa',
                        border: '2px solid #e0e0e0',
                        borderRadius: '12px',
                        color: '#333',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#083A85'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#333',
                      marginBottom: '8px'
                    }}>CVV *</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="***"
                      maxLength={4}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        backgroundColor: '#f8f9fa',
                        border: '2px solid #e0e0e0',
                        borderRadius: '12px',
                        color: '#333',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#083A85'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Donation Button */}
            <button
              onClick={handleDonation}
              disabled={!isPaymentDetailsValid()}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: !isPaymentDetailsValid()
                  ? '#e0e0e0'
                  : 'linear-gradient(135deg, #083A85 0%, #0d4a9e 100%)',
                border: 'none',
                borderRadius: '14px',
                color: !isPaymentDetailsValid() ? '#999' : '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: !isPaymentDetailsValid() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: !isPaymentDetailsValid()
                  ? 'none'
                  : '0 4px 15px rgba(8, 58, 133, 0.3)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
              Confirm Donation {formatCurrency(getDisplayAmount(), currency)}
            </button>

            {/* Security Note */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
              color: '#888',
              fontSize: '13px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Your payment is secure and encrypted
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;
