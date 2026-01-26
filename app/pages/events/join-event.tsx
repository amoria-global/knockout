'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/navbar';

// Existing events data from the system
const eventsData = [
  {
    id: 1,
    title: 'APR BBC Vs Espoir BCC',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&q=80',
    category: 'Sports',
    date: '2025-08-15',
    time: '08:00 AM - 11:50 PM',
    location: 'BK Arena - KN 4 Ave, Kigali',
    status: 'UPCOMING',
    price: '15,000 RWF',
    attendees: 450
  },
  {
    id: 2,
    title: 'Joseph & Solange Wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80',
    category: 'Wedding',
    date: '2025-07-20',
    time: '10:00 AM - 06:00 PM',
    location: 'Kigali Serena Hotel - KN 3 Ave, Kigali',
    status: 'LIVE',
    price: '50,000 RWF',
    attendees: 200
  },
  {
    id: 3,
    title: '2021 Graduation Ceremony',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=80',
    category: 'Academic',
    date: '2025-09-10',
    time: '09:00 AM - 02:00 PM',
    location: 'University of Rwanda - KK 737 St, Kigali',
    status: 'UPCOMING',
    price: 'Free',
    attendees: 1500
  },
  {
    id: 4,
    title: 'Zuba Sisterhood',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80',
    category: 'Gathering',
    date: '2025-08-05',
    time: '03:00 PM - 07:00 PM',
    location: 'Inema Arts Center - KG 518 St, Kigali',
    status: 'LIVE',
    price: '10,000 RWF',
    attendees: 80
  },
  {
    id: 5,
    title: 'The Toxxyk Experience',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&q=80',
    category: 'Concert',
    date: '2025-07-20',
    time: '08:00 AM - 11:50 PM',
    location: 'Heza Beach Resort - RBV 187 Ave, Gisenyi',
    status: 'UPCOMING',
    price: '25,000 RWF',
    attendees: 500
  },
  {
    id: 6,
    title: 'New Jersey Fashion Week',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&q=80',
    category: 'Fashion',
    date: '2025-10-15',
    time: '06:00 PM - 11:00 PM',
    location: 'Kigali Convention Centre - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '30,000 RWF',
    attendees: 350
  },
  {
    id: 7,
    title: 'Rebecca Holy Service',
    image: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=500&q=80',
    category: 'Religious',
    date: '2025-07-25',
    time: '10:00 AM - 01:00 PM',
    location: 'Christian Life Assembly - KG 7 Ave, Kigali',
    status: 'UPCOMING',
    price: 'Free',
    attendees: 800
  },
  {
    id: 8,
    title: 'Kwita Izina - Gorilla Naming',
    image: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=500&q=80',
    category: 'Cultural',
    date: '2025-09-05',
    time: '08:00 AM - 05:00 PM',
    location: 'Volcanoes National Park, Musanze',
    status: 'UPCOMING',
    price: '100,000 RWF',
    attendees: 250
  },
  {
    id: 9,
    title: 'Pervision Experience',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80',
    category: 'Corporate',
    date: '2025-11-20',
    time: '02:00 PM - 06:00 PM',
    location: 'Radisson Blu Hotel - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '40,000 RWF',
    attendees: 150
  },
  {
    id: 10,
    title: 'Iwacu Music Festival',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500&q=80',
    category: 'Concert',
    date: '2025-12-10',
    time: '05:00 PM - 11:30 PM',
    location: 'Amahoro Stadium - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '20,000 RWF',
    attendees: 2000
  },
  {
    id: 11,
    title: 'Tech Startup Summit',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&q=80',
    category: 'Conference',
    date: '2025-08-30',
    time: '09:00 AM - 05:00 PM',
    location: 'Norrsken House - KG 17 Ave, Kigali',
    status: 'LIVE',
    price: '35,000 RWF',
    attendees: 300
  },
  {
    id: 12,
    title: 'Rwanda Film Festival',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&q=80',
    category: 'Entertainment',
    date: '2025-07-18',
    time: '06:00 PM - 10:00 PM',
    location: 'Century Cinema - UTC, Kigali',
    status: 'LIVE',
    price: '12,000 RWF',
    attendees: 180
  },
  {
    id: 13,
    title: 'Jazz & Wine Evening',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=500&q=80',
    category: 'Concert',
    date: '2025-08-22',
    time: '07:00 PM - 11:00 PM',
    location: 'Heaven Restaurant - KN 6 Ave, Kigali',
    status: 'UPCOMING',
    price: '25,000 RWF',
    attendees: 120
  },
  {
    id: 14,
    title: 'Startup Pitch Competition',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80',
    category: 'Conference',
    date: '2025-09-15',
    time: '10:00 AM - 05:00 PM',
    location: 'Impact Hub - KG 9 Ave, Kigali',
    status: 'LIVE',
    price: '20,000 RWF',
    attendees: 200
  },
  {
    id: 15,
    title: 'Annual Charity Gala',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&q=80',
    category: 'Corporate',
    date: '2025-10-05',
    time: '06:00 PM - 11:00 PM',
    location: 'Kigali Marriott Hotel - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '75,000 RWF',
    attendees: 300
  },
  {
    id: 16,
    title: 'Traditional Dance Festival',
    image: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=500&q=80',
    category: 'Cultural',
    date: '2025-08-18',
    time: '03:00 PM - 08:00 PM',
    location: 'Kigali Cultural Village - KG 14 Ave, Kigali',
    status: 'LIVE',
    price: '8,000 RWF',
    attendees: 400
  },
  {
    id: 17,
    title: 'E-Commerce Summit 2025',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=500&q=80',
    category: 'Conference',
    date: '2025-11-08',
    time: '08:00 AM - 06:00 PM',
    location: 'Radisson Blu Hotel - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '45,000 RWF',
    attendees: 250
  },
  {
    id: 18,
    title: 'Photography Exhibition',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500&q=80',
    category: 'Entertainment',
    date: '2025-09-20',
    time: '10:00 AM - 08:00 PM',
    location: 'Ivuka Arts Center - KG 563 St, Kigali',
    status: 'UPCOMING',
    price: '5,000 RWF',
    attendees: 150
  },
  {
    id: 19,
    title: 'Youth Leadership Forum',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=500&q=80',
    category: 'Conference',
    date: '2025-10-12',
    time: '09:00 AM - 04:00 PM',
    location: 'Kigali Convention Centre - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: 'Free',
    attendees: 500
  },
  {
    id: 20,
    title: 'International Food Fair',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
    category: 'Entertainment',
    date: '2025-08-28',
    time: '12:00 PM - 09:00 PM',
    location: 'Kigali Heights - KN 4 Ave, Kigali',
    status: 'UPCOMING',
    price: '15,000 RWF',
    attendees: 600
  },
  {
    id: 21,
    title: 'Marathon for Peace',
    image: 'https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?w=500&q=80',
    category: 'Sports',
    date: '2025-09-25',
    time: '06:00 AM - 12:00 PM',
    location: 'Kigali City Centre - KN 3 Ave, Kigali',
    status: 'LIVE',
    price: '10,000 RWF',
    attendees: 1000
  },
  {
    id: 22,
    title: 'Classical Music Night',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&q=80',
    category: 'Concert',
    date: '2025-11-15',
    time: '07:30 PM - 10:30 PM',
    location: 'Kigali Serena Hotel - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '30,000 RWF',
    attendees: 180
  },
  {
    id: 23,
    title: 'Digital Marketing Bootcamp',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=500&q=80',
    category: 'Conference',
    date: '2025-10-20',
    time: '09:00 AM - 05:00 PM',
    location: 'Norrsken House - KG 17 Ave, Kigali',
    status: 'LIVE',
    price: '50,000 RWF',
    attendees: 100
  },
  {
    id: 24,
    title: 'Comedy & Brunch Special',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=500&q=80',
    category: 'Entertainment',
    date: '2025-08-10',
    time: '11:00 AM - 03:00 PM',
    location: 'The Hut - KG 623 St, Kigali',
    status: 'UPCOMING',
    price: '18,000 RWF',
    attendees: 90
  }
];

// Big event categories that require payment for live stream access
const paidEventCategories = [
  'Sports', 'Concert', 'Conference', 'Entertainment', 'Fashion', 'Corporate', 'Cultural'
];

// Helper to parse price string to number (e.g., "15,000 RWF" -> 15000)
const parsePrice = (priceStr: string): number => {
  if (priceStr.toLowerCase() === 'free') return 0;
  const numStr = priceStr.replace(/[^0-9]/g, '');
  return parseInt(numStr, 10) || 0;
};

export default function JoinEvent() {
  const [eventLink, setEventLink] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Payment state for big LIVE events
  const [detectedEvent, setDetectedEvent] = useState<{ id: number; title: string; category: string; fee: number; location: string; image: string; status: string } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Package state from URL params
  const [packageType, setPackageType] = useState<string | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [showShareableLink, setShowShareableLink] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Input validation error states
  const [phoneError, setPhoneError] = useState('');
  const [bankNameError, setBankNameError] = useState('');
  const [bankAccountNameError, setBankAccountNameError] = useState('');
  const [bankAccountNumberError, setBankAccountNumberError] = useState('');
  const [cardNumberError, setCardNumberError] = useState('');
  const [cardExpiryError, setCardExpiryError] = useState('');
  const [cardCvvError, setCardCvvError] = useState('');
  const [cardHolderNameError, setCardHolderNameError] = useState('');

  // Input validation handlers
  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (value !== digitsOnly) {
      setPhoneError('Only numbers allowed');
    } else {
      setPhoneError('');
    }
    setPaymentPhone(digitsOnly);
  };

  const handleBankNameChange = (value: string) => {
    // Only allow letters and spaces
    const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
    if (value !== lettersOnly) {
      setBankNameError('Only letters allowed');
    } else {
      setBankNameError('');
    }
    setBankName(lettersOnly);
  };

  const handleBankAccountNameChange = (value: string) => {
    // Only allow letters and spaces
    const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
    if (value !== lettersOnly) {
      setBankAccountNameError('Only letters allowed');
    } else {
      setBankAccountNameError('');
    }
    setBankAccountName(lettersOnly);
  };

  const handleBankAccountNumberChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (value !== digitsOnly) {
      setBankAccountNumberError('Only numbers allowed');
    } else {
      setBankAccountNumberError('');
    }
    setBankAccountNumber(digitsOnly);
  };

  const handleCardNumberChange = (value: string) => {
    // Only allow digits and spaces for formatting
    const digitsOnly = value.replace(/[^0-9\s]/g, '');
    if (value !== digitsOnly) {
      setCardNumberError('Only numbers allowed');
    } else {
      setCardNumberError('');
    }
    setCardNumber(digitsOnly);
  };

  const handleCardExpiryChange = (value: string) => {
    // Only allow digits and forward slash
    const validChars = value.replace(/[^0-9/]/g, '');
    if (value !== validChars) {
      setCardExpiryError('Format: MM/YY');
    } else {
      setCardExpiryError('');
    }
    setCardExpiry(validChars);
  };

  const handleCardCvvChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (value !== digitsOnly) {
      setCardCvvError('Only numbers allowed');
    } else {
      setCardCvvError('');
    }
    setCardCvv(digitsOnly);
  };

  const handleCardHolderNameChange = (value: string) => {
    // Only allow letters and spaces
    const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
    if (value !== lettersOnly) {
      setCardHolderNameError('Only letters allowed');
    } else {
      setCardHolderNameError('');
    }
    setCardHolderName(lettersOnly);
  };

  // Payment methods
  const paymentMethods = [
    { id: 'mtn', name: 'MTN Mobile Money', image: '/mtn.png' },
    { id: 'airtel', name: 'Airtel Money', image: '/airtel.png' },
    { id: 'bank', name: 'Bank Account', image: '/bank.png' },
    { id: 'card', name: 'VISA & Master Card', image: '/cards.png' }
  ];

  // Detect screen size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-detect event from URL params and set detectedEvent if it's a paid big LIVE event
  useEffect(() => {
    const eventId = searchParams.get('id');
    const pkgType = searchParams.get('package');
    const peopleCount = searchParams.get('people');

    // Set package info from URL params
    if (pkgType) {
      setPackageType(pkgType);
    }
    if (peopleCount) {
      setNumberOfPeople(parseInt(peopleCount, 10) || 1);
    }

    if (eventId) {
      const numericId = parseInt(eventId, 10);
      const event = eventsData.find(e => e.id === numericId);

      if (event) {
        let fee = parsePrice(event.price);

        // Apply 10% discount for group package
        if (pkgType === 'group' && peopleCount) {
          const numPeople = parseInt(peopleCount, 10) || 1;
          const discountedFeePerPerson = fee * 0.9; // 10% off
          fee = discountedFeePerPerson * numPeople;
        }

        const eventData = {
          id: event.id,
          title: event.title,
          category: event.category,
          fee: fee,
          location: event.location,
          image: event.image,
          status: event.status
        };

        // Show payment form if:
        // 1. User came from join-package page (has package param) with a valid fee, OR
        // 2. It's a LIVE event with a paid category
        const hasPackageFromJoinPackage = pkgType && (pkgType === 'individual' || pkgType === 'group');
        const isLivePaidEvent = event.status === 'LIVE' && paidEventCategories.includes(event.category) && fee > 0;

        if ((hasPackageFromJoinPackage && fee > 0) || isLivePaidEvent) {
          // Show inline payment form
          setDetectedEvent(eventData);
        }
        // For UPCOMING, free, or non-paid category events without package param - show original content
      }
    }
  }, [searchParams]);

  // Check if event requires payment
  const isPaidEvent = (event: { category: string; fee: number }) => {
    return paidEventCategories.some(cat =>
      event.category.toLowerCase().includes(cat.toLowerCase())
    ) && event.fee > 0;
  };

  // Validate payment details
  const isPaymentValid = () => {
    if (!selectedPaymentMethod) return false;

    switch (selectedPaymentMethod) {
      case 'mtn':
      case 'airtel':
        return paymentPhone.length >= 10;
      case 'bank':
        return bankAccountName.trim() !== '' && bankAccountNumber.trim() !== '' && bankName.trim() !== '';
      case 'card':
        return cardNumber.length >= 16 && cardExpiry.length >= 4 && cardCvv.length >= 3 && cardHolderName.trim() !== '';
      default:
        return false;
    }
  };

  // Reset payment form
  const resetPaymentForm = () => {
    setDetectedEvent(null);
    setSelectedPaymentMethod(null);
    setPaymentPhone('');
    setBankName('');
    setBankAccountName('');
    setBankAccountNumber('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardHolderName('');
    setIsProcessing(false);
    setPaymentSuccess(false);
  };

  // Generate unique shareable link
  const generateShareableLink = () => {
    const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const eventId = detectedEvent?.id || 0;
    return `STREAM-${eventId}-${uniqueId}-${numberOfPeople}`;
  };

  // Copy link to clipboard
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Handle payment submission
  const handlePayment = () => {
    if (!isPaymentValid()) {
      alert('Please fill in all required payment details');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);

      // After showing success message
      setTimeout(() => {
        if (packageType === 'group') {
          // For group package, show shareable link card
          setPaymentSuccess(false);
          const newLink = generateShareableLink();
          setShareableLink(newLink);
          setShowShareableLink(true);
        } else {
          // For individual package, redirect to live stream
          resetPaymentForm();
          router.push('/user/events/live-stream');
        }
      }, 2000);
    }, 2500);
  };

  const handleJoin = () => {
    // Only proceed if event link is filled in
    if (eventLink.trim()) {
      // Try to find event by ID (numeric) or by title match
      const inputValue = eventLink.trim();
      const numericId = parseInt(inputValue, 10);

      // Find event by ID or by partial title match
      const event = eventsData.find(e =>
        e.id === numericId ||
        e.title.toLowerCase().includes(inputValue.toLowerCase())
      );

      if (event) {
        const fee = parsePrice(event.price);
        const eventData = {
          id: event.id,
          title: event.title,
          category: event.category,
          fee: fee,
          location: event.location,
          image: event.image,
          status: event.status
        };

        // Check if it's a LIVE event with a paid category
        if (event.status === 'LIVE' && paidEventCategories.includes(event.category) && fee > 0) {
          // Show inline payment form for paid big LIVE events
          setDetectedEvent(eventData);
        } else {
          // Free event, non-LIVE, or non-paid category - proceed directly
          router.push('/user/events/live-stream');
        }
      } else {
        // Event not found - proceed directly (could show error instead)
        router.push('/user/events/live-stream');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Background image only */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/arms.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.2)',
        }}
      ></div>

      {/* Content container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Navbar */}
        <Navbar />

        {/* Main content - centered */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: detectedEvent ? 'flex-start' : 'center',
            justifyContent: 'center',
            padding: detectedEvent
              ? (isMobile ? '16px' : '24px 16px')
              : (isMobile ? '24px 16px' : '48px 16px'),
            overflowY: detectedEvent ? 'auto' : 'visible',
          }}
        >
          {/* Conditional rendering: Payment form for big LIVE events, original content otherwise */}
          {detectedEvent ? (
            /* INLINE PAYMENT FORM for big LIVE events */
            <div
              style={{
                width: '100%',
                maxWidth: '100%',
                position: 'relative',
                padding: isMobile ? '0' : '0 2cm',
              }}
            >
              {/* Success Overlay */}
              {paymentSuccess && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    borderRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                      animation: 'pulse 1s ease-in-out infinite',
                    }}
                  >
                    <i className="bi bi-check-lg" style={{ fontSize: '40px', color: '#fff' }}></i>
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                    Payment Successful!
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '15px' }}>
                    {packageType === 'group' ? 'Generating your shareable link...' : 'Redirecting to live stream...'}
                  </p>
                </div>
              )}

              {/* Shareable Link Card for Group Package */}
              {showShareableLink && packageType === 'group' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    borderRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    padding: '24px',
                  }}
                >
                  {/* Success Icon */}
                  <div
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <i className="bi bi-link-45deg" style={{ fontSize: '32px', color: '#fff' }}></i>
                  </div>

                  <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>
                    Your Shareable Stream Link
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
                    Share this link with your group. It can be used by up to {numberOfPeople} people (including you).
                  </p>

                  {/* Link Display Box */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          fontFamily: 'monospace',
                          fontSize: '15px',
                          color: '#10b981',
                          fontWeight: '600',
                          letterSpacing: '1px',
                          wordBreak: 'break-all',
                        }}
                      >
                        {shareableLink}
                      </div>
                      <button
                        onClick={copyLinkToClipboard}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: linkCopied ? '#059669' : '#10b981',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <i className={linkCopied ? 'bi bi-check-lg' : 'bi bi-clipboard'} style={{ color: '#fff', fontSize: '16px' }}></i>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                          {linkCopied ? 'Copied!' : 'Copy'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Usage Info */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <i className="bi bi-info-circle-fill" style={{ color: '#3b82f6', fontSize: '18px', marginTop: '2px' }}></i>
                      <div>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                          Link Usage Limit: {numberOfPeople} people (including you)
                        </p>
                        <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                          This link can be used by you and {numberOfPeople - 1} other {numberOfPeople - 1 === 1 ? 'person' : 'people'}. Each person can use it once to access the stream.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '400px' }}>
                    <button
                      onClick={() => {
                        setShowShareableLink(false);
                        resetPaymentForm();
                        router.push('/user/events/live-stream');
                      }}
                      style={{
                        flex: 1,
                        padding: '14px',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      <i className="bi bi-play-circle-fill" style={{ fontSize: '16px' }}></i>
                      Watch Now
                    </button>
                  </div>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && !paymentSuccess && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    borderRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      border: '4px solid rgba(99, 102, 241, 0.3)',
                      borderTopColor: '#6366f1',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '20px',
                    }}
                  ></div>
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                    Processing Payment...
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>
                    Please wait while we verify your payment
                  </p>
                </div>
              )}

              {/* Payment Card Container */}
              <div
                style={{
                  background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                  borderRadius: '24px',
                  boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 40px rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                }}
              >
                {/* Header with Event Preview */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                    padding: '12px 20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Premium badge and title row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #7C3AED 100%)',
                      padding: '4px 10px',
                      borderRadius: '14px',
                      boxShadow: '0 2px 8px rgba(168, 85, 247, 0.4)',
                    }}>
                      <i className="bi bi-star-fill" style={{ color: '#fbbf24', fontSize: '14px' }}></i>
                      <span style={{ color: '#fff', fontSize: '11px', fontWeight: '600' }}>PREMIUM EVENT</span>
                    </div>
                    <h2 style={{
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: '700',
                      margin: 0,
                      lineHeight: '1.2',
                    }}>
                      {detectedEvent.title}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="bi bi-broadcast" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}></i>
                      <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>{detectedEvent.category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="bi bi-geo-alt" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}></i>
                      <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>{detectedEvent.location}</span>
                    </div>
                  </div>
                </div>

                {/* Fee Display */}
                <div style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                          {packageType === 'group' ? `Group Stream (${numberOfPeople} people, including you)` : 'Live Stream Access Fee'}
                        </p>
                        {packageType === 'group' && (
                          <span
                            className="discount-badge-bounce"
                            style={{
                              background: 'linear-gradient(135deg, #FDE047 0%, #FBBF24 50%, #F59E0B 100%)',
                              color: '#1f2937',
                              fontSize: '15px',
                              fontWeight: '800',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                              display: 'inline-block',
                            }}>
                            10% OFF
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#fff', fontSize: '30px', fontWeight: '700', margin: 0 }}>
                        {detectedEvent.fee.toLocaleString()} RWF
                      </p>
                      {packageType === 'group' && (
                        <p style={{ color: '#10b981', fontSize: '14px', margin: '2px 0 0 0' }}>
                          {Math.round(detectedEvent.fee / numberOfPeople).toLocaleString()} RWF per person (discounted)
                        </p>
                      )}
                    </div>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <i className={packageType === 'group' ? 'bi bi-people-fill' : 'bi bi-ticket-perforated-fill'} style={{ color: '#fff', fontSize: '18px' }}></i>
                    </div>
                  </div>
                </div>

                {/* Payment Form */}
                <div style={{ padding: '14px 20px' }}>
                  {/* Payment Methods */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#fff',
                      marginBottom: '8px',
                    }}>
                      Select Payment Method
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                      gap: '10px',
                    }}>
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          style={{
                            padding: '20px 8px',
                            background: selectedPaymentMethod === method.id
                              ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                              : 'rgba(255, 255, 255, 0.05)',
                            border: '2px solid',
                            borderColor: selectedPaymentMethod === method.id
                              ? '#10b981'
                              : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                          }}
                        >
                          {selectedPaymentMethod === method.id && (
                            <div style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: '#0ea5e9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <i className="bi bi-check" style={{ color: '#fff', fontSize: '11px' }}></i>
                            </div>
                          )}
                          <img
                            src={method.image}
                            alt={method.name}
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'contain',
                            }}
                          />
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#fff',
                            textAlign: 'center',
                          }}>
                            {method.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Details - Mobile Money */}
                  {(selectedPaymentMethod === 'mtn' || selectedPaymentMethod === 'airtel') && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '6px',
                      }}>
                        <i className="bi bi-phone" style={{ marginRight: '6px', color: '#10b981' }}></i>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={paymentPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="Enter your phone number"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          fontSize: '14px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: `2px solid ${phoneError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '10px',
                          color: '#fff',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => {
                          if (!phoneError) {
                            e.currentTarget.style.borderColor = '#10b981';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.2)';
                          }
                        }}
                        onBlur={(e) => {
                          if (!phoneError) {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      {phoneError && (
                        <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', margin: '4px 0 0 0' }}>
                          {phoneError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment Details - Bank */}
                  {selectedPaymentMethod === 'bank' && (
                    <div style={{ marginBottom: '14px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                          <i className="bi bi-bank" style={{ marginRight: '6px', color: '#10b981' }}></i>
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => handleBankNameChange(e.target.value)}
                          placeholder="Enter bank name"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: '14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${bankNameError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {bankNameError && (
                          <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0 0' }}>{bankNameError}</p>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                          <i className="bi bi-person" style={{ marginRight: '6px', color: '#10b981' }}></i>
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={bankAccountName}
                          onChange={(e) => handleBankAccountNameChange(e.target.value)}
                          placeholder="Enter account holder name"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: '14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${bankAccountNameError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {bankAccountNameError && (
                          <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0 0' }}>{bankAccountNameError}</p>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                          <i className="bi bi-credit-card-2-front" style={{ marginRight: '6px', color: '#10b981' }}></i>
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={bankAccountNumber}
                          onChange={(e) => handleBankAccountNumberChange(e.target.value)}
                          placeholder="Enter account number"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: '14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${bankAccountNumberError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {bankAccountNumberError && (
                          <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0 0' }}>{bankAccountNumberError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Details - Card */}
                  {selectedPaymentMethod === 'card' && (
                    <div style={{ marginBottom: '14px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                          <i className="bi bi-person" style={{ marginRight: '6px', color: '#10b981' }}></i>
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardHolderName}
                          onChange={(e) => handleCardHolderNameChange(e.target.value)}
                          placeholder="Enter cardholder name"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: '14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${cardHolderNameError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {cardHolderNameError && (
                          <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0 0' }}>{cardHolderNameError}</p>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                          <i className="bi bi-credit-card" style={{ marginRight: '6px', color: '#10b981' }}></i>
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: '14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${cardNumberError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {cardNumberError && (
                          <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0 0' }}>{cardNumberError}</p>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => handleCardExpiryChange(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: '14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${cardExpiryError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {cardExpiryError && (
                          <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0 0' }}>{cardExpiryError}</p>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => handleCardCvvChange(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: '14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${cardCvvError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {cardCvvError && (
                          <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0 0' }}>{cardCvvError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    onClick={handlePayment}
                    disabled={!isPaymentValid() || isProcessing}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#fff',
                      background: isPaymentValid()
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: isPaymentValid() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      transition: 'all 0.3s ease',
                      boxShadow: isPaymentValid() ? '0 8px 30px rgba(16, 185, 129, 0.4)' : 'none',
                      marginBottom: '10px',
                    }}
                  >
                    <i className="bi bi-lock-fill" style={{ fontSize: '16px' }}></i>
                    Pay {detectedEvent.fee.toLocaleString()} RWF {packageType === 'group' ? `for ${numberOfPeople} People` : '& Join'}
                  </button>

                  {/* Security note */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                  }}>
                    <i className="bi bi-shield-check" style={{ color: '#10b981', fontSize: '14px' }}></i>
                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                      Your payment is secured with 256-bit encryption
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ORIGINAL CONTENT for UPCOMING/free/small events */
            <div
              style={{
                width: '100%',
                maxWidth: isMobile ? '100%' : '576px',
                textAlign: 'center',
                padding: isMobile ? '0 8px' : '0',
              }}
            >
              {/* Main heading */}
              <h1
                style={{
                  fontSize: isMobile ? 'clamp(1.75rem, 8vw, 2.5rem)' : '3rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: isMobile ? '16px' : '24px',
                  lineHeight: '1.2',
                  fontFamily: "'Pragati Narrow', sans-serif",
                }}
              >
                Live Moments, Shared Instantly
              </h1>

              {/* Description */}
              <div
                style={{
                  color: 'white',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  marginBottom: isMobile ? '32px' : '48px',
                  fontFamily: "'Pragati Narrow', sans-serif",
                }}
              >
                <p style={{ marginBottom: '4px' }}>
                  Stream Your Event In Real-Time And Let Remote Guests Celebrate With You
                </p>
                <p>Through Reactions, Wishes, And Gifts — No Matter Where They Are.</p>
              </div>

              {/* Join section */}
              <div style={{ marginTop: isMobile ? '8px' : '16px' }}>
                <h2
                  style={{
                    fontSize: isMobile ? 'clamp(1.375rem, 6vw, 1.875rem)' : '1.875rem',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: isMobile ? '16px' : '24px',
                    fontFamily: "'Pragati Narrow', sans-serif",
                  }}
                >
                  Join Live Now
                </h2>

                {/* Input field */}
                <input
                  type="text"
                  placeholder="Enter Event Link or Host ID from your event host"
                  value={eventLink}
                  onChange={(e) => setEventLink(e.target.value)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '10px 16px' : '12px 20px',
                    borderRadius: isMobile ? '12px' : '16px',
                    color: '#000000',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    textAlign: 'center',
                    fontSize: isMobile ? '0.875rem' : '1.1rem',
                    marginBottom: isMobile ? '12px' : '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    outline: 'none',
                    fontFamily: "'Pragati Narrow', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />

                {/* Terms text */}
                <p
                  style={{
                    color: 'white',
                    fontSize: isMobile ? '0.75rem' : '0.9rem',
                    paddingTop: isMobile ? '6px' : '8px',
                    paddingBottom: isMobile ? '6px' : '8px',
                    marginBottom: isMobile ? '12px' : '16px',
                    fontFamily: "'Pragati Narrow', sans-serif",
                    lineHeight: '1.4',
                  }}
                >
                  By clicking "Join", you agree to our{' '}
                  <a
                    href="/user/terms-of-service"
                    style={{
                      textDecoration: 'underline',
                      color: 'white',
                    }}
                  >
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a
                    href="/user/privacy-policy"
                    style={{
                      textDecoration: 'underline',
                      color: 'white',
                    }}
                  >
                    Privacy Statement
                  </a>
                </p>

                {/* Join button */}
                <button
                  onClick={handleJoin}
                  style={{
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '384px',
                    margin: '0 auto',
                    display: 'block',
                    backgroundColor: eventLink ? '#039130' : 'white',
                    color: eventLink ? '#FFFFFF' : '#374151',
                    fontWeight: '600',
                    padding: isMobile ? '10px 24px' : '12px 32px',
                    borderRadius: isMobile ? '12px' : '16px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.9375rem' : '1rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Pragati Narrow', sans-serif",
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    if (eventLink) {
                      e.currentTarget.style.backgroundColor = '#039130';
                    } else {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (eventLink) {
                      e.currentTarget.style.backgroundColor = '#039130';
                    } else {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS Keyframes for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes discountBadgeBounce {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          12% {
            transform: rotate(-4deg) scale(1.4);
          }
          24% {
            transform: rotate(4deg) scale(1.3);
          }
          36% {
            transform: rotate(-3deg) scale(1.35);
          }
          48% {
            transform: rotate(3deg) scale(1.25);
          }
          60%, 100% {
            transform: rotate(0deg) scale(1);
          }
        }
        .discount-badge-bounce {
          animation: discountBadgeBounce 1.8s ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>
    </div>
  );
}
