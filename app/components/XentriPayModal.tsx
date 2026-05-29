'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS } from '@/lib/api/config';
import PaymentCurrencyPreview, { type CurrencyCode, useLiveRates } from './PaymentCurrencyPreview';
import {
  initiateXentriPayTip,
  initiateXentriPayStreaming,
  initiateXentriPayment,
  initiateXentriPayDonation,
  initiateXentriPayPhotoPurchase,
  initiateXentriPayAlbumPurchase,
  initiateAnonymousStreamingPayment,
  checkAnonymousPaymentStatus,
  pollXentriPayStatus,
  type XentriPayResponse,
  type XentriPayStatusResponse,
} from '@/lib/APIs/payments/xentripay';
import { useGeoPaymentStatus } from '@/app/hooks/useGeoPaymentStatus';
import DonationPromptModal from './DonationPromptModal';
import { usePaymentCountry } from '@/lib/payments/usePaymentCountry';
import { usePaymentOptions } from '@/lib/payments/usePaymentOptions';
import { CountryPicker } from './payments/CountryPicker';
import { findCountry } from '@/lib/payments/supportedCountries';
import { phoneHintForCountry } from '@/lib/payments/formatPhone';

// ==================== Types ====================

export type PaymentType = 'booking' | 'tip' | 'streaming' | 'donation' | 'photo_purchase' | 'album_purchase' | 'multi_album_purchase';

export interface XentriPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (refid: string) => void;
  onError?: (error: string) => void;
  // Fires when initiate-album-purchase returns 409 for photos the buyer already owns
  onAlreadyPurchased?: (photoIds: string[]) => void;
  amount: number;
  currencyCode: string;
  currencyId: string;
  paymentType: PaymentType;
  title?: string;
  subtitle?: string;
  // For booking payments - use existing declaration or eventId
  declarationId?: string;
  // For tip/streaming/photo_purchase - need event context
  eventId?: string;
  // For donation payments
  donationId?: string;
  // For streaming payments - optional donation amount added on top of gift
  donationAmount?: number;
  // Anonymous viewer ID - triggers public payment flow (no auth required)
  viewerId?: string;
  /**
   * For streaming group-access purchases. The backend re-computes
   * streamFee × viewerCount × (1 − groupDiscount/100) server-side, so
   * passing this through is what makes group pricing actually charge
   * the right amount instead of falling back to per-viewer.
   */
  viewerCount?: number;
  // For album_purchase - paid face-search photos
  albumId?: string;
  photoIds?: string[];
  buyerId?: string;
  // For multi_album_purchase - face-scan that matched photos across multiple
  // photographers' albums. One item per gallery; backend creates N
  // AlbumPurchase rows sharing one refid so each photographer gets their
  // correct slice of revenue.
  multiAlbumItems?: import('@/lib/APIs/payments/xentripay').MultiAlbumPurchaseItem[];
  // Guest-buyer email for content-album purchases (no auth, no buyerId).
  // Passes through to the backend so the post-purchase ZIP+email flow
  // has someone to send to.
  viewerEmail?: string;
  // Dark theme to match viewer auth modal
  darkMode?: boolean;
  // Show donation prompt after payment method selection
  showDonationPrompt?: boolean;
  // Callback when donation amount changes (from internal donation step)
  onDonationAmountChange?: (amount: number) => void;
  // Skip the per-event IP geo-check entirely (always treat as allowed).
  // Used for live events: spot-reservation geo-restrictions only apply to
  // upcoming events - once the event is live, anyone who paid can join.
  skipEventGeoCheck?: boolean;
}

type PaymentStep = 'method' | 'donation' | 'processing' | 'success' | 'failed';

const FALLBACK_DONATION_TIERS = [500, 1000, 2000, 5000];

// ==================== Payment Methods ====================
//
// The list used to be the three constants below (MTN/Airtel/Card,
// Rwanda-only). It's now built at render time from
// usePaymentOptions(country) so the same modal shows M-Pesa in Kenya,
// MTN+AT+Vodafone in Ghana, etc. The shape is intentionally identical
// (id / name / image / provider) so the existing tile rendering and
// geo-check filters keep working untouched.

type PaymentMethodTile = {
  id: string;        // lowercase, used for selection state ("mtn", "airtel", "card", "mpesa", …)
  name: string;
  image: string;     // /public icon path; "card" gets /cards.png, operators map by iconKey
  provider: string;  // value sent to the backend ("MTN", "AIRTEL", "MPESA", "CARD")
};

const FALLBACK_RW_METHODS: PaymentMethodTile[] = [
  { id: 'mtn', name: 'MTN Mobile Money', image: '/mtn.png', provider: 'MTN' },
  { id: 'airtel', name: 'Airtel Money', image: '/airtel.png', provider: 'AIRTEL' },
  { id: 'card', name: 'VISA & Master Card', image: '/cards.png', provider: 'CARD' },
];

function iconForOperator(iconKey: string): string {
  // Map PawaPay operator iconKey to /public images we ship. Unknown
  // operators fall through to a generic mobile-money icon so the UI
  // doesn't 404 on a missing image.
  switch (iconKey) {
    case 'mtn': return '/mtn.png';
    case 'airtel': return '/airtel.png';
    case 'mpesa': return '/mpesa.svg';
    case 'vodafone': return '/vodafone.svg';
    case 'airteltigo': return '/airteltigo.png';
    case 'orange': return '/orange.svg';
    case 'moov': return '/moov.png';
    case 'wave': return '/wave.png';
    case 'free': return '/free.png';
    case 'tigo': return '/tigo.svg';
    case 'zamtel': return '/zamtel.png';
    case 'halotel': return '/halotel.png';
    case 'tnm': return '/tnm.png';
    case 'movitel': return '/movitel.png';
    default: return '/mobile-money.svg';
  }
}

// ==================== Component ====================

const XentriPayModal: React.FC<XentriPayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  onAlreadyPurchased,
  amount,
  currencyCode,
  currencyId,
  paymentType,
  title,
  subtitle,
  declarationId,
  eventId,
  donationId,
  viewerId,
  viewerCount,
  albumId,
  photoIds,
  buyerId,
  multiAlbumItems,
  viewerEmail,
  donationAmount: donationAmountProp = 0,
  darkMode = false,
  showDonationPrompt = false,
  onDonationAmountChange,
  skipEventGeoCheck = false,
}) => {
  // State
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refid, setRefid] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const stopPollingRef = useRef<(() => void) | null>(null);

  // Multi-country payment options. Country is IP-detected on first
  // render (with localStorage cache for manual overrides), and the
  // operator list is fetched from /api/remote/public/payments/options
  // for that country. Falls back to the RW hardcoded list while the
  // hooks resolve so the modal never flashes empty for the common path.
  const { country: detectedCountry, setCountry } = usePaymentCountry();
  const { options: paymentOptions, supported: countrySupported, loading: optionsLoading }
      = usePaymentOptions(detectedCountry);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const paymentMethods: PaymentMethodTile[] = React.useMemo(() => {
    if (!paymentOptions) return FALLBACK_RW_METHODS;
    const tiles: PaymentMethodTile[] = paymentOptions.operators.map(op => ({
      id: op.id.toLowerCase(),
      name: op.name,
      image: iconForOperator(op.iconKey),
      provider: op.id, // backend expects canonical UPPER provider name
    }));
    if (paymentOptions.supportsCard) {
      tiles.push({ id: 'card', name: 'VISA & Master Card', image: '/cards.png', provider: 'CARD' });
    }
    return tiles;
  }, [paymentOptions]);

  // Internal donation state (used when showDonationPrompt is true).
  // The donation tiers/exchange-rate state below is now legacy - the
  // standalone DonationPromptModal owns that fetch/state internally. We
  // keep `internalDonationAmount` so the chosen donation flows back into
  // handlePay and the existing donation-tracking analytics.
  const [internalDonationAmount, setInternalDonationAmount] = useState(0);
  const [donationTiers, setDonationTiers] = useState<number[]>(FALLBACK_DONATION_TIERS);
  const [selectedDonationTier, setSelectedDonationTier] = useState<number | null>(null);
  const [customDonationAmount, setCustomDonationAmount] = useState('');
  const [isCustomDonation, setIsCustomDonation] = useState(false);
  const [donationExchangeRate, setDonationExchangeRate] = useState(1);

  // Controls the standalone DonationPromptModal overlay - opened when the
  // user clicks "Continue" on the method step (if showDonationPrompt is on).
  const [showDonationOverlay, setShowDonationOverlay] = useState(false);

  // Effective donation amount: internal (from donation step) or external prop
  const donationAmount = showDonationPrompt ? internalDonationAmount : donationAmountProp;

  // Check geo-restriction status
  const geoStatus = useGeoPaymentStatus();

  // Per-event geo-restriction state (automatic detection via IP)
  const [eventGeoCheck, setEventGeoCheck] = useState<{
    allowed: boolean;
    reason?: string;
    userCity?: string;
    userCountry?: string;
    allowedPaymentMethods?: string[];
  } | null>(null);
  const [geoCheckLoading, setGeoCheckLoading] = useState(false);

  // Fetch donation tiers
  const fetchDonationTiers = useCallback(async () => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}${API_ENDPOINTS.PUBLIC.DONATION_TIERS}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data?.tiers?.length) {
          setDonationTiers(data.tiers.map((t: { amount: number }) => t.amount));
        }
        if (data?.exchangeRates && currencyCode && data.baseCurrency && currencyCode !== data.baseCurrency) {
          const base = data.exchangeRates[data.baseCurrency];
          const target = data.exchangeRates[currencyCode];
          if (base?.rateToUsd && target?.rateToUsd) {
            setDonationExchangeRate(target.rateToUsd / base.rateToUsd);
          }
        }
      }
    } catch { /* use fallback tiers */ }
  }, [currencyCode]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedMethod(null);
      setPhone('');
      setLoading(false);
      setError(null);
      setRefid(null);
      setPaymentUrl(null);
      setInternalDonationAmount(0);
      setSelectedDonationTier(null);
      setCustomDonationAmount('');
      setIsCustomDonation(false);
      if (showDonationPrompt) fetchDonationTiers();
    }
    return () => {
      if (stopPollingRef.current) {
        stopPollingRef.current();
        stopPollingRef.current = null;
      }
    };
  }, [isOpen]);

  // Automatic event geo-check based on IP address (only when modal opens).
  // Skipped entirely when skipEventGeoCheck is true - live events allow
  // anyone who has paid to join, regardless of country. Geo-restriction
  // only enforces for spot reservers on upcoming events.
  useEffect(() => {
    if (!isOpen) return;

    if (skipEventGeoCheck || !eventId) {
      setEventGeoCheck({ allowed: true });
      setGeoCheckLoading(false);
      return;
    }

    setGeoCheckLoading(true);
    setEventGeoCheck(null);
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com').replace(/\/$/, '');

    fetch(`${baseUrl}/api/remote/events/${eventId}/geo-check`)
      .then(res => {
        if (!res.ok) throw new Error('Geo check failed');
        return res.json();
      })
      .then(result => {
        setEventGeoCheck({
          allowed: result.allowed,
          reason: result.blockReason,
          userCity: result.userCity,
          userCountry: result.userCountry,
          allowedPaymentMethods: result.allowedPaymentMethods || [],
        });
      })
      .catch(err => {
        console.error('Geo check failed:', err);
        setEventGeoCheck({ allowed: true }); // Fail-open
      })
      .finally(() => {
        setGeoCheckLoading(false);
      });
  }, [isOpen, eventId, skipEventGeoCheck]);

  // Close modal when session expires so auth modal can take over
  useEffect(() => {
    if (!isOpen) return;
    const handleSessionExpired = () => {
      handleClose();
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while preserving scroll position
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Prevent accidental page reload while payment modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen]);

  // Validate payment details
  const isValid = useCallback(() => {
    if (!selectedMethod) return false;
    if (selectedMethod === 'card') return true;
    return phone.length >= 10;
  }, [selectedMethod, phone]);

  // Start payment status polling. Card payments need a grace period:
  // XentriPay reports FAILED on a freshly-created card session that the
  // user hasn't paid yet — without the grace window, polling flips the
  // modal to "Payment Failed" within seconds, before the user has even
  // typed their card number on the gateway page. Mobile money does NOT
  // need a grace period (user gets an SMS prompt and acts on it within
  // seconds, so FAILED there really means declined).
  const startPolling = useCallback((paymentRefid: string, isCard: boolean) => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
    }

    // 3 minutes of grace for card flows — covers the typical time to read
    // the gateway page, type card details, and confirm. After that, FAILED
    // is treated as real.
    const cardGraceMs = 180_000;

    // Anonymous viewer: use public payment-status endpoint
    if (viewerId && eventId) {
      let attempts = 0;
      let stopped = false;
      const startedAt = Date.now();
      const poll = async () => {
        if (stopped) return;
        attempts++;
        try {
          const res = await checkAnonymousPaymentStatus(eventId, { viewerId, refid: paymentRefid });
          if (stopped) return;
          if (res.success && res.data) {
            if (res.data.status === 'SUCCESS') { setStep('success'); setTimeout(() => onSuccess(paymentRefid), 500); return; }
            if (res.data.status === 'FAILED') {
              // Card grace: ignore early FAILEDs so the user gets time
              // to complete the gateway checkout.
              if (isCard && Date.now() - startedAt < cardGraceMs) {
                if (attempts >= 150) { setError('Payment is taking longer than expected. Please check your payment history.'); setStep('failed'); return; }
                setTimeout(poll, 2000);
                return;
              }
              setStep('failed'); setError('Payment was declined or timed out. Please check your balance and try again.'); return;
            }
          }
          if (attempts >= 150) { setError('Payment is taking longer than expected. Please check your payment history.'); setStep('failed'); return; }
          setTimeout(poll, 2000);
        } catch {
          if (stopped) return;
          if (attempts >= 150) { setError('Unable to check payment status. Please try again later.'); setStep('failed'); return; }
          setTimeout(poll, 2000);
        }
      };
      setTimeout(poll, 2000);
      stopPollingRef.current = () => { stopped = true; };
      return;
    }

    const usePublicStatus = paymentType === 'donation' || paymentType === 'album_purchase';
    stopPollingRef.current = pollXentriPayStatus(
      paymentRefid,
      {
        onSuccess: (_data: XentriPayStatusResponse) => {
          setStep('success');
          setTimeout(() => {
            onSuccess(paymentRefid);
          }, 500);
        },
        onFailure: (_data: XentriPayStatusResponse) => {
          setStep('failed');
          setError('Payment was declined or timed out. Please check your balance and try again.');
        },
        onError: (errorMsg: string) => {
          setError(errorMsg || 'Something went wrong while processing your payment.');
          setStep('failed');
        },
      },
      2000,
      150,
      usePublicStatus,
      isCard ? cardGraceMs : 0
    );
  }, [onSuccess, paymentType, viewerId, eventId]);

  // Handle payment initiation
  const handlePay = async (overrideDonationAmount?: number) => {
    if (!isValid()) return;

    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) return;

    const effectiveDonation = overrideDonationAmount !== undefined ? overrideDonationAmount : donationAmount;
    const hasEffectiveDonation = effectiveDonation > 0;

    const isCard = selectedMethod === 'card';
    const paymentMethodType = isCard ? 'CARD' : 'MOBILE_MONEY';

    // Open the card-payment tab SYNCHRONOUSLY, before any await. Mobile
    // browsers (iOS Safari, Chrome on Android) block window.open() that is
    // called after a microtask boundary because the user-gesture chain is
    // broken — that was the "popup blocked → payment failed" path users hit
    // on phones when paying with Visa/Mastercard. We open about:blank now
    // (still inside the click handler) and navigate it to the real gateway
    // URL once the initiate-API responds below. If the browser refused even
    // this sync open (aggressive blocker), we fall back to a same-tab
    // redirect after the URL arrives — card flow leaves the page anyway.
    const cardPaymentWindow: Window | null = isCard ? window.open('about:blank', '_blank') : null;

    setLoading(true);
    setError(null);
    // Use production URL for http (localhost), keep current URL for https (production)
    const currentUrl = window.location.href;
    const redirectUrl = isCard
      ? (currentUrl.startsWith('http://') ? 'https://connekyt.com' : currentUrl)
      : undefined;

    try {
      let response: { success: boolean; data?: XentriPayResponse; error?: string };

      // Country drives backend gateway routing: PawaPay for non-RW,
      // XentriPay backup for RW. Spread conditionally so we don't send
      // a `country: null` field — backend then falls back to IP geo.
      const countryField = detectedCountry ? { country: detectedCountry } : {};

      if (paymentType === 'booking' && (declarationId || eventId)) {
        response = await initiateXentriPayment({
          declarationId,
          eventId,
          ...(hasEffectiveDonation ? { donationAmount: effectiveDonation } : {}),
          ...(isCard ? {} : { phone, telecomProvider: method.provider }),
          paymentMethod: paymentMethodType,
          redirectUrl,
          ...countryField,
        });
      } else if (paymentType === 'tip' && eventId) {
        response = await initiateXentriPayTip({
          eventId,
          amount,
          currencyId,
          ...(hasEffectiveDonation ? { donationAmount: effectiveDonation } : {}),
          ...(isCard ? {} : { phone, telecomProvider: method.provider }),
          paymentMethod: paymentMethodType,
          redirectUrl,
          ...countryField,
        });
      } else if (paymentType === 'streaming' && eventId) {
        if (viewerId) {
          // Anonymous viewer - use public endpoint (no auth)
          response = await initiateAnonymousStreamingPayment(eventId, {
            viewerId,
            amount,
            currencyId,
            ...(hasEffectiveDonation ? { donationAmount: effectiveDonation } : {}),
            ...(viewerCount && viewerCount > 1 ? { viewerCount } : {}),
            ...(isCard ? {} : { phone, telecomProvider: method.provider }),
            paymentMethod: paymentMethodType,
            redirectUrl,
            ...countryField,
          });
        } else {
          response = await initiateXentriPayStreaming({
            eventId,
            amount,
            currencyId,
            ...(hasEffectiveDonation ? { donationAmount: effectiveDonation } : {}),
            ...(isCard ? {} : { phone, telecomProvider: method.provider }),
            paymentMethod: paymentMethodType,
            redirectUrl,
            ...countryField,
          });
        }
      } else if (paymentType === 'donation' && donationId) {
        response = await initiateXentriPayDonation({
          donationId,
          phone,
          telecomProvider: method.provider,
          paymentMethod: paymentMethodType,
          redirectUrl,
          ...countryField,
        });
      } else if (paymentType === 'photo_purchase' && eventId) {
        response = await initiateXentriPayPhotoPurchase({
          eventId,
          amount,
          currencyId,
          ...(hasEffectiveDonation ? { donationAmount: effectiveDonation } : {}),
          ...(isCard ? {} : { phone, telecomProvider: method.provider }),
          paymentMethod: paymentMethodType,
          redirectUrl,
          ...countryField,
        });
      } else if (paymentType === 'album_purchase' && albumId && photoIds && photoIds.length > 0 && buyerId) {
        response = await initiateXentriPayAlbumPurchase({
          albumId,
          buyerId,
          photoIds,
          amount,
          currencyId,
          ...(hasEffectiveDonation ? { donationAmount: effectiveDonation } : {}),
          ...(isCard ? {} : { phone, telecomProvider: method.provider }),
          paymentMethod: paymentMethodType,
          redirectUrl,
          ...countryField,
        });
      } else if (paymentType === 'multi_album_purchase' && multiAlbumItems && multiAlbumItems.length > 0) {
        // Cross-photographer purchase. The backend creates N PENDING
        // AlbumPurchase rows sharing one refid; one XentriPay collection
        // covers the total. Each photographer settles independently on
        // SUCCESS so per-album revenue is correct end-to-end.
        const { initiateMultiAlbumPurchase } = await import('@/lib/APIs/payments/xentripay');
        response = await initiateMultiAlbumPurchase({
          items: multiAlbumItems,
          ...(buyerId ? { buyerId } : {}),
          ...(viewerEmail ? { viewerEmail } : {}),
          ...(hasEffectiveDonation ? { donationAmount: effectiveDonation, donationCurrency: currencyCode } : {}),
          phone,
          ...(isCard ? {} : { telecomProvider: method.provider }),
          paymentMethod: paymentMethodType,
          redirectUrl,
          ...countryField,
        }) as typeof response;
      } else {
        throw new Error('Invalid payment configuration');
      }

      if (!response.success || !response.data) {
        // 409: backend says some photos are already owned by this buyer
        const raw = response.data as unknown as { alreadyPurchased?: string[] } | undefined;
        if (paymentType === 'album_purchase' && raw?.alreadyPurchased?.length) {
          onAlreadyPurchased?.(raw.alreadyPurchased);
          if (cardPaymentWindow && !cardPaymentWindow.closed) cardPaymentWindow.close();
          return;
        }
        throw new Error(response.error || 'Failed to initiate payment');
      }

      const data = response.data as XentriPayResponse;
      setRefid(data.refid);

      // For card payments, we need a paymentUrl to redirect to. If the
      // backend signals success but omits it, fail loudly here instead of
      // silently polling a refid that has no gateway session — that's what
      // caused "Payment Failed" with no link ever shown.
      if (isCard) {
        if (!data.paymentUrl) {
          if (cardPaymentWindow && !cardPaymentWindow.closed) cardPaymentWindow.close();
          throw new Error('Payment session created but no checkout URL was returned. Please try again.');
        }
        setPaymentUrl(data.paymentUrl);
        if (cardPaymentWindow && !cardPaymentWindow.closed) {
          try {
            cardPaymentWindow.location.href = data.paymentUrl;
          } catch {
            window.location.href = data.paymentUrl;
            return;
          }
        } else {
          window.location.href = data.paymentUrl;
          return;
        }
      }

      setStep('processing');
      startPolling(data.refid, isCard);
    } catch (err) {
      if (cardPaymentWindow && !cardPaymentWindow.closed) cardPaymentWindow.close();
      const raw = err instanceof Error ? err.message : '';
      const lower = raw.toLowerCase();
      let msg: string;
      if (lower.includes('network') || lower.includes('fetch')) {
        msg = 'Unable to connect. Please check your internet connection and try again.';
      } else if (raw) {
        // Surface the backend/XentriPay reply verbatim so the user can act
        // on the real reason (amount too low, phone wrong format, provider
        // mismatch, etc.) instead of a generic hint.
        msg = raw;
      } else {
        msg = 'Could not initiate payment. Please try again or choose a different payment method.';
      }
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setStep('method');
    setError(null);
    setRefid(null);
    setPaymentUrl(null);
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
  };

  // Handle close
  const handleClose = () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
    onClose();
  };

  // Display currency for the whole modal. Defaults to USD (safe universal
  // default) and is controlled by the PaymentCurrencyPreview panel's
  // selector below - picking a new currency there re-renders every amount
  // in the modal (header, summaries, inputs, fee lines, success page).
  // The submit wire still carries the original `amount` + `currencyCode`
  // props unchanged - this is purely presentation.
  //
  // IMPORTANT: these hooks must sit ABOVE the `!isOpen` early return so the
  // hook order stays stable between open/closed renders (Rules of Hooks).
  // Default the display ("VIEW IN") currency to the event's own currency
  // so users see prices in the event's native unit first, not USD. They can
  // still flip to USD/EUR/etc. via the dropdown.
  const [displayCurrency, setDisplayCurrency] = React.useState<CurrencyCode>(
    () => ((currencyCode || 'RWF') as CurrencyCode)
  );
  const { format: formatLive } = useLiveRates();

  if (!isOpen) return null;

  const defaultTitle = paymentType === 'donation' ? 'Complete Your Donation'
    : paymentType === 'tip' ? 'Send Tip'
    : paymentType === 'streaming' ? 'Send Gift'
    : paymentType === 'booking' ? 'Complete Payment'
    : paymentType === 'album_purchase' ? 'Buy Photos'
    : 'Make Payment';

  const formatAmount = (val: number) => {
    const from = (currencyCode || 'RWF') as CurrencyCode;
    // While rates haven't loaded yet, fall back to the original currency
    // string so the user doesn't see a flash of unconverted numerics.
    return formatLive(val, from, displayCurrency);
  };

  const totalAmount = amount + (donationAmount || 0);
  const hasDonation = (donationAmount || 0) > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(8,58,133,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(8px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && step !== 'processing') {
          handleClose();
        }
      }}
    >
      <div
        style={{
          // Outer panel: clips the decorative ribbon/glow with border-radius.
          // Scroll happens on the inner content layer instead.
          background: '#ffffff',
          borderRadius: '22px',
          maxWidth: '440px',
          width: '100%',
          maxHeight: '92vh',
          // Layered shadow: deep ambient + brand-blue tinted bloom + thin inner highlight
          boxShadow:
            '0 40px 100px -20px rgba(8,58,133,0.35), 0 18px 40px -12px rgba(8,58,133,0.18), 0 1px 0 rgba(255,255,255,0.9) inset',
          border: '1px solid rgba(8,58,133,0.08)',
          position: 'relative',
          margin: 'auto',
          overflow: 'hidden',
          isolation: 'isolate',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Top brand-blue accent ribbon - subtle gradient that hints at the
            brand without overwhelming the white surface. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background:
              'linear-gradient(90deg, rgba(8,58,133,0) 0%, #083A85 22%, #1f6bff 50%, #083A85 78%, rgba(8,58,133,0) 100%)',
            opacity: 0.95,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        {/* Soft brand glow in the top-right corner */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-90px',
            right: '-90px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at center, rgba(8,58,133,0.10) 0%, rgba(31,107,255,0.06) 40%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Decorative dot grid in the bottom-left - barely-there texture */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '-20px',
            width: '160px',
            height: '160px',
            backgroundImage:
              'radial-gradient(circle, rgba(8,58,133,0.10) 1px, transparent 1.5px)',
            backgroundSize: '14px 14px',
            opacity: 0.45,
            pointerEvents: 'none',
            zIndex: 0,
            maskImage: 'radial-gradient(circle at bottom left, #000 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at bottom left, #000 0%, transparent 70%)',
          }}
        />
        {/* Scrollable content layer */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: 'clamp(22px, 4vw, 34px)',
          paddingTop: 'clamp(26px, 4.5vw, 38px)',
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
        }}>
        {/* Close button - hidden during processing and when geo-blocked.
            Sits absolutely above the scroll layer (zIndex 3) so it doesn't
            scroll away with content. */}
        {step !== 'processing' && !(eventId && !geoCheckLoading && eventGeoCheck && !eventGeoCheck.allowed) && (
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 'clamp(14px, 3vw, 20px)',
              right: 'clamp(14px, 3vw, 20px)',
              background: 'rgba(8,58,133,0.06)',
              border: '1px solid rgba(8,58,133,0.10)',
              color: '#475569',
              cursor: 'pointer',
              padding: '0',
              transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 180ms ease, border-color 180ms ease, color 180ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              zIndex: 3,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.12)';
              e.currentTarget.style.borderColor = 'rgba(8,58,133,0.22)';
              e.currentTarget.style.color = '#083A85';
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.06)';
              e.currentTarget.style.borderColor = 'rgba(8,58,133,0.10)';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* ==================== STEP: Select Method ==================== */}
        {step === 'method' && (
          <>
            {/* Loading state while geo-check is in progress */}
            {eventId && geoCheckLoading && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 20px',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #e5e7eb',
                  borderTopColor: '#083A85',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '16px',
                }} />
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Checking availability...
                </p>
              </div>
            )}

            {/* Blocked overlay - full-screen, no close option */}
            {eventId && !geoCheckLoading && eventGeoCheck && !eventGeoCheck.allowed && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '24px',
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '24px',
                  padding: 'clamp(32px, 6vw, 48px) clamp(24px, 5vw, 40px)',
                  maxWidth: '420px',
                  width: '100%',
                  textAlign: 'center',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
                }}>
                  {/* Icon */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                  </div>

                  <h2 style={{
                    fontSize: 'clamp(20px, 4vw, 26px)',
                    fontWeight: 700,
                    color: '#1f2937',
                    marginBottom: '12px',
                    marginTop: 0,
                    fontFamily: "'Pragati Narrow', sans-serif",
                  }}>
                    This event is not available in your region
                  </h2>

                  <p style={{
                    fontSize: '15px',
                    color: '#6b7280',
                    lineHeight: 1.7,
                    marginBottom: '24px',
                    maxWidth: '340px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}>
                    We&apos;re sorry, but the event organizer has restricted access to this event from your current location. This may be due to regional availability or licensing requirements.
                  </p>

                  {/* Detected location pill */}
                  {eventGeoCheck.userCountry && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '24px',
                      border: '1px solid #e5e7eb',
                      marginBottom: '28px',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        Your location: {eventGeoCheck.userCity && eventGeoCheck.userCity !== 'Unknown'
                          ? `${eventGeoCheck.userCity}, ${eventGeoCheck.userCountry}`
                          : eventGeoCheck.userCountry}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '0 0 20px' }} />

                  <p style={{
                    fontSize: '13px',
                    color: '#9ca3af',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    If you believe this is an error, please contact the event organizer for assistance.
                  </p>
                </div>
              </div>
            )}

            {/* Normal payment form - only when allowed */}
            {(!eventId || (!geoCheckLoading && eventGeoCheck?.allowed !== false)) && (<>
            {/* Header - eyebrow pill + title + subtitle. Currency preview is
                pulled out into its own dedicated "Amount panel" below the
                header so it reads as a first-class element, not an island. */}
            <div style={{ marginBottom: '16px' }}>
              {/* Brand eyebrow pill - communicates "this is a payment", builds trust */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 11px 5px 9px',
                background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(31,107,255,0.06) 100%)',
                border: '1px solid rgba(8,58,133,0.18)',
                borderRadius: '999px',
                marginBottom: '10px',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#083A85',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  fontFamily: "'Pragati Narrow', sans-serif",
                }}>
                  Secure Payment
                </span>
              </div>
              <h2 style={{
                fontSize: 'clamp(20px, 4.5vw, 24px)',
                fontWeight: 800,
                color: '#083A85',
                marginBottom: '4px',
                marginTop: 0,
                fontFamily: "'Pragati Narrow', sans-serif",
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}>
                {title || defaultTitle}
              </h2>
              {subtitle ? (
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{subtitle}</p>
              ) : !hasDonation ? (
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  Choose how you&apos;d like to pay
                </p>
              ) : null}
            </div>

            {/* Amount Panel - the financial heart of the modal. White-on-blue-tint
                gradient card with the headline amount on the left and the currency
                converter on the right. Replaces the previous "floating box" feel.
                NB: overflow stays VISIBLE so the currency dropdown menu can open
                downward without being clipped by the panel's bottom edge. The
                accent stripe is inset 10px from top/bottom so the rounded corners
                still look clean without needing overflow:hidden. */}
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #f0f5ff 0%, #ffffff 60%, #fafbff 100%)',
              border: '1px solid rgba(8,58,133,0.12)',
              borderRadius: '16px',
              padding: '14px 16px',
              marginBottom: '18px',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(8,58,133,0.04)',
            }}>
              {/* Subtle accent stripe on the left */}
              <span aria-hidden="true" style={{
                position: 'absolute',
                top: 10,
                bottom: 10,
                left: 0,
                width: '3px',
                borderRadius: '0 3px 3px 0',
                background: 'linear-gradient(180deg, #083A85 0%, #1f6bff 100%)',
              }} />
              {hasDonation ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
                    <span>Gift</span>
                    <strong style={{ color: '#0f172a', fontWeight: 700 }}>{formatAmount(amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
                    <span>Donation</span>
                    <strong style={{ color: '#0a4da3', fontWeight: 700 }}>{formatAmount(donationAmount!)}</strong>
                  </div>
                  <div style={{
                    borderTop: '1px dashed rgba(8,58,133,0.18)',
                    paddingTop: '8px',
                    marginTop: '2px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: '#083A85',
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      fontFamily: "'Pragati Narrow', sans-serif",
                    }}>Total</span>
                    <strong style={{
                      color: '#083A85',
                      fontSize: '20px',
                      fontWeight: 800,
                      fontFamily: "'Pragati Narrow', sans-serif",
                    }}>{formatAmount(totalAmount)}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: '#083A85',
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      fontFamily: "'Pragati Narrow', sans-serif",
                    }}>Amount to Pay</span>
                    <strong style={{
                      color: '#083A85',
                      fontSize: 'clamp(20px, 5vw, 26px)',
                      fontWeight: 800,
                      fontFamily: "'Pragati Narrow', sans-serif",
                      lineHeight: 1.15,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{formatAmount(amount)}</strong>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {/*
                      NOTE: intentionally NOT forwarding the XentriPayModal
                      `darkMode` prop to the panel. The modal's body renders
                      in light theme regardless of that prop, so passing
                      darkMode=true would render the panel with white text
                      that disappears on the modal's white backdrop.
                    */}
                    <PaymentCurrencyPreview
                      fromCurrency={(currencyCode || 'RWF') as CurrencyCode}
                      defaultCurrency={displayCurrency}
                      onCurrencyChange={setDisplayCurrency}
                      amounts={[{ label: 'Amount', amount }]}
                    />
                  </div>
                </div>
              )}
              {hasDonation && (
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <PaymentCurrencyPreview
                    fromCurrency={(currencyCode || 'RWF') as CurrencyCode}
                    defaultCurrency={displayCurrency}
                    onCurrencyChange={setDisplayCurrency}
                    amounts={[
                      { label: 'Gift', amount },
                      { label: 'Donation', amount: donationAmount || 0 },
                      { label: 'Total', amount: totalAmount },
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Geo-restriction Warning */}
            {!geoStatus.loading && geoStatus.blocked && (
              <div style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
                border: '1.5px solid #fca5a5',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 6px 0',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#991b1b',
                      fontFamily: "'Pragati Narrow', sans-serif",
                    }}>
                      Payment Not Available
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#7f1d1d',
                      lineHeight: '1.5',
                    }}>
                      {geoStatus.message || 'Payment services are not available in your country.'}
                      {geoStatus.country && (
                        <><br /><span style={{ fontSize: '12px', opacity: 0.8 }}>Detected location: {geoStatus.country}</span></>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Money Disabled Warning */}
            {!geoStatus.loading && geoStatus.disableMobileMoney && !geoStatus.blocked && (
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fefce8 100%)',
                border: '1.5px solid #fbbf24',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M12 9V11M12 15H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#92400e',
                    fontWeight: 500,
                  }}>
                    Mobile money (MTN/Airtel) is unavailable in your region. Please use card payment.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Method Selection - uppercase eyebrow label, premium tiles
                with brand-blue ring on selected, hover lift, check badge. */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#083A85',
                marginBottom: '10px',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                fontFamily: "'Pragati Narrow', sans-serif",
              }}>Select Payment Method</label>

              {/* Country pill + "change" link. The operator list below is
                  driven by usePaymentOptions(detectedCountry); changing
                  country here re-fetches and re-renders the grid. */}
              {detectedCountry && !showCountryPicker && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '8px', marginBottom: '12px', flexWrap: 'wrap',
                }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE',
                    borderRadius: '999px', fontSize: '12px', color: '#083A85', fontWeight: 700,
                  }}>
                    {findCountry(detectedCountry)?.flag && <span style={{ fontSize: '13px' }}>{findCountry(detectedCountry)?.flag}</span>}
                    <span>{findCountry(detectedCountry)?.name ?? detectedCountry}{paymentOptions?.currency ? ` · ${paymentOptions.currency}` : ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker(true)}
                    style={{
                      background: 'transparent', border: 'none', color: '#1f6bff',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '4px 6px',
                    }}
                  >
                    Change country
                  </button>
                </div>
              )}

              {/* Country picker fallback: when detection failed, the
                  detected country has no operators, or the user clicked
                  "Change country". Shown in place of the method grid. */}
              {(showCountryPicker || (detectedCountry && !optionsLoading && !countrySupported)) ? (
                <CountryPicker
                  value={detectedCountry}
                  onChange={(iso2) => {
                    setCountry(iso2);
                    setSelectedMethod(null);
                    setShowCountryPicker(false);
                  }}
                  title={showCountryPicker ? 'Pick a country' : 'Mobile money not yet available here'}
                  hint={showCountryPicker
                    ? "Choose the country your number belongs to."
                    : `We don't have operators for ${detectedCountry} yet. Pick a country we support, or use a card.`}
                />
              ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {paymentMethods
                  .filter((method) => {
                    // Filter by per-country allowed payment methods from geo-check
                    const allowed = eventGeoCheck?.allowedPaymentMethods;
                    if (!allowed || allowed.length === 0) return true; // No restriction = show all
                    return allowed.includes(method.provider);
                  })
                  .map((method) => {
                  const isSelected = selectedMethod === method.id;
                  // Disable mobile money if blocked or restricted. Any tile
                  // that isn't 'card' is treated as mobile money — covers
                  // MTN/Airtel/M-Pesa/Wave/etc. uniformly.
                  const isMobileMoneyMethod = method.id !== 'card';
                  const isDisabled = geoStatus.blocked || (isMobileMoneyMethod && geoStatus.disableMobileMoney);

                  return (
                    <button
                      key={method.id}
                      onClick={() => !isDisabled && setSelectedMethod(method.id)}
                      disabled={isDisabled}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '16px 8px 14px',
                        background: isSelected
                          ? 'linear-gradient(160deg, #f0f5ff 0%, #ffffff 100%)'
                          : (isDisabled ? '#f9fafb' : '#ffffff'),
                        border: isSelected
                          ? '2px solid #083A85'
                          : (isDisabled ? '1.5px solid #e5e7eb' : '1.5px solid rgba(8,58,133,0.14)'),
                        borderRadius: '14px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 180ms ease, box-shadow 200ms ease, background 200ms ease',
                        position: 'relative',
                        opacity: isDisabled ? 0.5 : 1,
                        boxShadow: isSelected
                          ? '0 8px 22px -8px rgba(8,58,133,0.35), 0 1px 0 rgba(255,255,255,0.9) inset'
                          : '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(8,58,133,0.04)',
                        transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isDisabled) {
                          e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px -6px rgba(8,58,133,0.20), 0 1px 0 rgba(255,255,255,0.9) inset';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isDisabled) {
                          e.currentTarget.style.borderColor = 'rgba(8,58,133,0.14)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(8,58,133,0.04)';
                        }
                      }}
                    >
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #083A85 0%, #1f6bff 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(8,58,133,0.40)',
                          border: '1.5px solid #ffffff',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(8,58,133,0.10)',
                        boxShadow: '0 1px 2px rgba(8,58,133,0.06)',
                      }}>
                        <img
            src={method.image}
            alt={method.name}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallback === '1') return;
              img.dataset.fallback = '1';
              img.src = '/mobile-money.svg';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '5px' }}
          />
                      </div>
                      <span style={{
                        color: isSelected ? '#083A85' : (isDisabled ? '#9ca3af' : '#475569'),
                        fontSize: '11px',
                        fontWeight: isSelected ? 800 : 600,
                        textAlign: 'center',
                        lineHeight: 1.25,
                        fontFamily: "'Pragati Narrow', sans-serif",
                        letterSpacing: '0.01em',
                      }}>
                        {isDisabled ? (
                          <>
                            {method.name}
                            <div style={{ fontSize: '9px', color: '#ef4444', marginTop: '2px', fontWeight: 700 }}>Unavailable</div>
                          </>
                        ) : method.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              )}
            </div>

            {/* Phone Input - shown for mobile money, and always for donations */}
            {selectedMethod && selectedMethod !== 'card' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#083A85',
                  marginBottom: '8px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  fontFamily: "'Pragati Narrow', sans-serif",
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12" y2="18" />
                  </svg>
                  Phone Number <span style={{ color: '#ef4444', letterSpacing: 0 }}>*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder={phoneHintForCountry(detectedCountry).replace(/^e\.g\.\s*/, '')}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    backgroundColor: '#f8fafc',
                    border: '1.5px solid rgba(8,58,133,0.14)',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '15px',
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease',
                    boxSizing: 'border-box' as const,
                    fontFamily: "'Pragati Narrow', sans-serif",
                    letterSpacing: '0.02em',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(8,58,133,0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(8,58,133,0.14)';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginTop: '8px',
                  marginBottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  You will receive a payment prompt on this number
                </p>
              </div>
            )}

            {/* Card info note */}
            {selectedMethod === 'card' && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 14px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
              }}>
                <p style={{ fontSize: '14px', color: '#083A85', margin: 0 }}>
                  You will be redirected to a secure payment page to enter your card details.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '16px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                color: '#EF4444',
                fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            {/* Pay Button - gradient brand-blue with brand-blue glow when active.
                Disabled state uses a brand-blue tinted soft surface (not pure
                gray) so it still feels like part of the brand system. */}
            <button
              onClick={() => {
                // If donation prompt is enabled, open the standalone overlay
                // (DonationPromptModal) - not the internal step. Skipping or
                // confirming on that overlay continues to handlePay below.
                if (showDonationPrompt && paymentType !== 'donation') {
                  setShowDonationOverlay(true);
                } else {
                  handlePay();
                }
              }}
              disabled={!isValid() || loading}
              style={{
                width: '100%',
                padding: '15px 22px',
                background: (!isValid() || loading)
                  ? 'linear-gradient(135deg, #e5edf9 0%, #f1f5fb 100%)'
                  : 'linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #1f6bff 100%)',
                border: 'none',
                borderRadius: '14px',
                color: (!isValid() || loading) ? '#94a3b8' : '#fff',
                fontSize: '15.5px',
                fontWeight: 700,
                fontFamily: "'Pragati Narrow', sans-serif",
                letterSpacing: '0.01em',
                cursor: (!isValid() || loading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease, filter 220ms ease',
                boxShadow: (!isValid() || loading)
                  ? 'inset 0 0 0 1px rgba(8,58,133,0.10)'
                  : '0 14px 28px -10px rgba(8,58,133,0.55), 0 4px 10px -2px rgba(8,58,133,0.30), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
              onMouseEnter={(e) => {
                if (!isValid() || loading) return;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 20px 36px -10px rgba(8,58,133,0.65), 0 6px 14px -2px rgba(8,58,133,0.40), inset 0 1px 0 rgba(255,255,255,0.22)';
                e.currentTarget.style.filter = 'brightness(1.05)';
              }}
              onMouseLeave={(e) => {
                if (!isValid() || loading) return;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 14px 28px -10px rgba(8,58,133,0.55), 0 4px 10px -2px rgba(8,58,133,0.30), inset 0 1px 0 rgba(255,255,255,0.18)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  {(!isValid()) ? (
                    /* Disabled: small lock icon → "select a method first" feel */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : selectedMethod === 'card' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12" y2="18" />
                    </svg>
                  )}
                  {showDonationPrompt && paymentType !== 'donation'
                    ? `Continue · ${formatAmount(totalAmount)}`
                    : selectedMethod === 'card' ? `Proceed to Pay · ${formatAmount(totalAmount)}` : `Pay · ${formatAmount(totalAmount)}`}
                  {isValid() && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 2 }}>
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </>
              )}
            </button>
            </>)}
          </>
        )}

        {/* ==================== STEP: Donation ==================== */}
        {step === 'donation' && (() => {
          const convertDonation = (rwfAmount: number): number => {
            if (donationExchangeRate === 1) return Math.round(rwfAmount);
            return Math.round(rwfAmount * donationExchangeRate * 100) / 100;
          };
          const formatDonationAmt = (val: number): string => {
            const formatted = new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: donationExchangeRate === 1 ? 0 : 2,
            }).format(val);
            return `${formatted} ${currencyCode}`;
          };
          const getDonationAmt = (): number => {
            if (isCustomDonation && customDonationAmount) return parseFloat(customDonationAmount) || 0;
            if (selectedDonationTier !== null) return convertDonation(selectedDonationTier);
            return 0;
          };
          const canDonate = getDonationAmt() > 0;
          const proceedWithDonation = (amt: number) => {
            setInternalDonationAmount(amt);
            onDonationAmountChange?.(amt);
            handlePay(amt);
          };

          return (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
                }}>
                  <i className="bi bi-heart-fill" style={{ fontSize: '24px', color: '#fff' }}></i>
                </div>
                <h2 style={{
                  fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: '700', color: '#083A85',
                  marginBottom: '6px', fontFamily: "'Pragati Narrow', sans-serif", marginTop: 0,
                }}>
                  Support a Cause
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>
                  Your donation helps support vulnerable families, educate children, and empower those in need.
                </p>
              </div>

              {/* Payment context */}
              <div style={{
                backgroundColor: '#f0f5ff', border: '1px solid #dbeafe', borderRadius: '10px',
                padding: '10px 14px', marginBottom: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '13px', color: '#4b5563' }}>Your payment</span>
                <strong style={{ fontSize: '14px', color: '#083A85' }}>{formatAmount(amount)}</strong>
              </div>

              {/* Tier buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {donationTiers.map((tier) => {
                  const convertedAmount = convertDonation(tier);
                  const isSelected = !isCustomDonation && selectedDonationTier === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => { setSelectedDonationTier(tier); setIsCustomDonation(false); setCustomDonationAmount(''); }}
                      style={{
                        padding: '12px 8px', borderRadius: '12px',
                        border: isSelected ? '2px solid #083A85' : '2px solid #e5e7eb',
                        backgroundColor: isSelected ? '#f0f5ff' : '#fff',
                        color: isSelected ? '#083A85' : '#374151',
                        fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {formatDonationAmt(convertedAmount)}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount */}
              <div style={{ marginBottom: '20px' }}>
                <div
                  onClick={() => { setIsCustomDonation(true); setSelectedDonationTier(null); }}
                  style={{
                    display: 'flex', alignItems: 'center',
                    border: isCustomDonation ? '2px solid #083A85' : '2px solid #e5e7eb',
                    borderRadius: '12px', overflow: 'hidden',
                    backgroundColor: isCustomDonation ? '#f0f5ff' : '#fff', transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    padding: '10px 14px', fontSize: '14px', fontWeight: '600', color: '#6b7280',
                    backgroundColor: isCustomDonation ? '#dbeafe' : '#f9fafb', borderRight: '1px solid #e5e7eb',
                  }}>
                    {currencyCode}
                  </span>
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={customDonationAmount}
                    onChange={(e) => { setCustomDonationAmount(e.target.value); setIsCustomDonation(true); setSelectedDonationTier(null); }}
                    onFocus={() => { setIsCustomDonation(true); setSelectedDonationTier(null); }}
                    style={{
                      flex: 1, padding: '10px 14px', border: 'none', outline: 'none',
                      fontSize: '14px', fontWeight: '500', backgroundColor: 'transparent', color: '#1f2937',
                    }}
                    min="1"
                  />
                </div>
              </div>

              {/* Total display when donation selected */}
              {canDonate && (
                <div style={{
                  backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px',
                  padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#166534',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Payment:</span>
                    <strong>{formatAmount(amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Donation:</span>
                    <strong style={{ color: '#e11d48' }}>{formatDonationAmt(getDonationAmt())}</strong>
                  </div>
                  <div style={{
                    borderTop: '1px solid #bbf7d0', paddingTop: '6px',
                    display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px',
                  }}>
                    <span>Total:</span>
                    <span>{formatAmount(amount + getDonationAmt())}</span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => proceedWithDonation(getDonationAmt())}
                  disabled={!canDonate || loading}
                  style={{
                    width: '100%', padding: '14px 20px',
                    backgroundColor: (canDonate && !loading) ? '#083A85' : '#d1d5db',
                    color: (canDonate && !loading) ? '#fff' : '#9ca3af',
                    border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600',
                    cursor: (canDonate && !loading) ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px', height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-heart-fill" style={{ fontSize: '16px' }}></i>
                      Add Donation & Continue
                    </>
                  )}
                </button>
                <button
                  onClick={() => proceedWithDonation(0)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 20px',
                    backgroundColor: '#fff', color: loading ? '#d1d5db' : '#6b7280',
                    border: '2px solid #e5e7eb', borderRadius: '12px',
                    fontSize: '14px', fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? 'Processing...' : 'Skip, continue to payment'}
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div style={{
                  padding: '12px 16px',
                  marginTop: '12px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#EF4444',
                  fontSize: '14px',
                }}>
                  {error}
                </div>
              )}
            </>
          );
        })()}

        {/* ==================== STEP: Processing ==================== */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '20px 0', position: 'relative' }}>
            {/* Brand-blue ambient halo behind the spinner */}
            <div aria-hidden="true" style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(8,58,133,0.14) 0%, rgba(31,107,255,0.06) 40%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />
            {/* Dual-ring spinner - outer thin track + brand-blue gradient arc */}
            <div style={{
              width: '92px',
              height: '92px',
              margin: '0 auto 24px',
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid rgba(8,58,133,0.10)',
                borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid transparent',
                borderTopColor: '#083A85',
                borderRightColor: '#1f6bff',
                borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
                boxShadow: '0 6px 20px -6px rgba(8,58,133,0.40)',
              }} />
              {/* Inner pulse dot */}
              <div style={{
                position: 'absolute',
                inset: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #083A85 0%, #1f6bff 100%)',
                boxShadow: '0 4px 12px rgba(8,58,133,0.45)',
              }} />
            </div>

            <h3 style={{
              fontSize: 'clamp(20px, 4.5vw, 24px)',
              fontWeight: 800,
              color: '#083A85',
              marginBottom: '12px',
              marginTop: 0,
              fontFamily: "'Pragati Narrow', sans-serif",
              position: 'relative',
              zIndex: 1,
            }}>
              {selectedMethod === 'card' ? 'Complete Payment' : 'Payment Initiated'}
            </h3>

            {selectedMethod === 'card' ? (
              <>
                <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                  A secure payment page has been opened in a new tab.
                  Please complete the payment there.{' '}
                  <strong style={{ color: '#083A85' }}>
                    If you don&apos;t see it, tap the button below.
                  </strong>
                </p>
                {paymentUrl && (
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #083A85 0%, #1f6bff 100%)',
                      color: '#fff',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      boxShadow: '0 10px 22px -8px rgba(8,58,133,0.55), 0 4px 10px -2px rgba(8,58,133,0.30)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    Open Payment Page
                  </a>
                )}
              </>
            ) : (
              <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                A payment prompt has been sent to your phone.
                Please check your phone and confirm the payment.
              </p>
            )}

            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Waiting for the gateway to confirm your payment - this can take up to a minute.
            </p>

            <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '12px', lineHeight: 1.5 }}>
              {"Didn't receive the SMS? Check that your mobile money balance covers the payment amount."}
            </p>
          </div>
        )}

        {/* ==================== STEP: Success ==================== */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0', position: 'relative' }}>
            {/* Brand-tinted halo behind the green check - keeps the page in
                the brand system while preserving green's success semantics. */}
            <div aria-hidden="true" style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(8,58,133,0.10) 0%, rgba(34,197,94,0.06) 35%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />
            {/* Checkmark with success-green core + brand-blue rim */}
            <div style={{
              width: '88px',
              height: '88px',
              margin: '0 auto 22px',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
              border: '2px solid #bbf7d0',
              boxShadow: '0 12px 30px -10px rgba(34,197,94,0.45), 0 0 0 6px rgba(8,58,133,0.04)',
            }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 style={{
              fontSize: 'clamp(22px, 5vw, 26px)',
              fontWeight: 800,
              color: '#083A85',
              marginBottom: '8px',
              marginTop: 0,
              fontFamily: "'Pragati Narrow', sans-serif",
              position: 'relative',
              zIndex: 1,
            }}>
              Payment Successful
            </h3>
            <p style={{ fontSize: '15px', color: '#475569', margin: 0, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
              Your payment of <strong style={{ color: '#083A85' }}>{formatAmount(totalAmount)}</strong> has been completed.
            </p>
          </div>
        )}

        {/* ==================== STEP: Failed ==================== */}
        {step === 'failed' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {/* X mark */}
            <div style={{
              width: '88px',
              height: '88px',
              margin: '0 auto 22px',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fecaca',
              boxShadow: '0 12px 30px -10px rgba(239,68,68,0.40), 0 0 0 6px rgba(8,58,133,0.04)',
            }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>

            <h3 style={{
              fontSize: 'clamp(22px, 5vw, 26px)',
              fontWeight: 800,
              color: '#083A85',
              marginBottom: '8px',
              marginTop: 0,
              fontFamily: "'Pragati Narrow', sans-serif",
            }}>
              Payment Failed
            </h3>
            <p style={{ fontSize: '15px', color: '#475569', marginBottom: '24px', lineHeight: 1.6 }}>
              {error || 'The payment could not be completed. Please try again.'}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleRetry}
                style={{
                  padding: '13px 26px',
                  background: 'linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #1f6bff 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: "'Pragati Narrow', sans-serif",
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 12px 24px -10px rgba(8,58,133,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
                  transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 18px 30px -10px rgba(8,58,133,0.65), inset 0 1px 0 rgba(255,255,255,0.22)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(8,58,133,0.55), inset 0 1px 0 rgba(255,255,255,0.18)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Try Again
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '13px 26px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid rgba(8,58,133,0.16)',
                  borderRadius: '12px',
                  color: '#475569',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: "'Pragati Narrow', sans-serif",
                  cursor: 'pointer',
                  transition: 'border-color 180ms ease, background-color 180ms ease, color 180ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = '#083A85';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(8,58,133,0.16)';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#475569';
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        </div>{/* end scrollable content layer */}
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════
          DonationPromptModal - pops over this payment modal AFTER the user
          clicks "Continue". Visually distinct (rose-coral palette) so the
          viewer immediately sees this is an OPTIONAL ask, not part of the
          payment progression. Either action below closes the overlay and
          calls handlePay() with the appropriate donation amount. */}
      <DonationPromptModal
        isOpen={showDonationOverlay}
        currencyCode={currencyCode}
        paymentAmount={amount}
        onSkip={() => {
          setShowDonationOverlay(false);
          setInternalDonationAmount(0);
          onDonationAmountChange?.(0);
          handlePay(0);
        }}
        onDonate={(amt) => {
          setShowDonationOverlay(false);
          setInternalDonationAmount(amt);
          onDonationAmountChange?.(amt);
          handlePay(amt);
        }}
      />
    </div>
  );
};

export default XentriPayModal;
