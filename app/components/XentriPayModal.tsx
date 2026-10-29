'use client';

import CurrencySelect from './CurrencySelect';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS } from '@/lib/api/config';
import { type CurrencyCode, useLiveRates } from './PaymentCurrencyPreview';
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
import { PaymentMethodChooser } from './payments/PaymentMethodChooser';
import { findCountry } from '@/lib/payments/supportedCountries';
import InternationalPhoneInput, { type PhoneValue } from './phone/InternationalPhoneInput';

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

// Cards are offered in every market. Mobile money is offered only for the
// operators the backend returns for the buyer's country, so while the country is
// unknown, still loading or unsupported nothing falls back to Rwanda's MTN/Airtel.
const CARD_METHOD: PaymentMethodTile = { id: 'card', name: 'VISA & Master Card', image: '/cards.png', provider: 'CARD' };

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
  const [phoneVal, setPhoneVal] = useState<PhoneValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refid, setRefid] = useState<string | null>(null);
  // How the payment ended when step === 'failed'. 'declined' = the gateway
  // definitively said FAILED (no charge landed) so retrying is safe.
  // 'unknown' = timeout / status-check error: the charge MAY have landed, so
  // per docs/PAYMENTS.md rule 2 we must NOT offer a retry - the buyer is
  // told to check their phone and email first.
  // Defaults to 'unknown' so a path that forgets to say which it is fails
  // safe, without a Retry. It used to default to 'declined' and only one path
  // set it, so a five-minute poll timeout told a buyer whose money may have
  // left "Payment declined. You were not charged." next to a Retry button.
  const [failureKind, setFailureKind] = useState<'declined' | 'unknown'>('unknown');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const stopPollingRef = useRef<(() => void) | null>(null);
  // Every road into the failed step goes through here and names its kind.
  // Only an explicit gateway FAILED is 'declined'.
  const fail = (kind: 'declined' | 'unknown', message: string) => {
    setFailureKind(kind);
    setError(message);
    setStep('failed');
  };

  // Multi-country payment options. Country is IP-detected on first
  // render (with localStorage cache for manual overrides), and the
  // operator list is fetched from /api/remote/public/payments/options
  // for that country. Falls back to the RW hardcoded list while the
  // hooks resolve. Until then, and whenever the country is unknown or has no
  // mobile-money coverage, only the card option is shown.
  const { country: detectedCountry, setCountry, loading: countryLoading } = usePaymentCountry();
  const { options: paymentOptions, supported: countrySupported, loading: optionsLoading }
      = usePaymentOptions(detectedCountry);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const paymentMethods: PaymentMethodTile[] = React.useMemo(() => {
    if (!paymentOptions) return [CARD_METHOD];
    const tiles: PaymentMethodTile[] = paymentOptions.operators.map(op => ({
      id: op.id.toLowerCase(),
      name: op.name,
      image: iconForOperator(op.iconKey),
      provider: op.id, // backend expects canonical UPPER provider name
    }));
    if (paymentOptions.supportsCard) {
      tiles.push(CARD_METHOD);
    }
    return tiles;
  }, [paymentOptions]);

  // A method that is no longer on offer (country changed, options reloaded) cannot stay selected.
  useEffect(() => {
    setSelectedMethod((cur) => (cur && !paymentMethods.some((m) => m.id === cur) ? null : cur));
  }, [paymentMethods]);

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
      setPhoneVal(null);
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
    return !!phoneVal?.isValid;
  }, [selectedMethod, phoneVal]);

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
                if (attempts >= 150) { fail('unknown', 'Payment is taking longer than expected.'); return; }
                setTimeout(poll, 2000);
                return;
              }
              fail('declined', 'The provider reported this payment as failed.'); return;
            }
          }
          if (attempts >= 150) { fail('unknown', 'Payment is taking longer than expected.'); return; }
          setTimeout(poll, 2000);
        } catch {
          if (stopped) return;
          if (attempts >= 150) { fail('unknown', 'Unable to check payment status.'); return; }
          setTimeout(poll, 2000);
        }
      };
      setTimeout(poll, 2000);
      stopPollingRef.current = () => { stopped = true; };
      return;
    }

    // ⚠ ADDING A PaymentType? Add it here too. See docs/PAYMENTS.md.
    //
    // Every buyer-facing purchase type must poll the PUBLIC status endpoint:
    // these buyers are anonymous, so the authenticated endpoint is refused
    // client-side before a request is even made. Omitting
    // 'multi_album_purchase' here meant the entire browse-photos checkout
    // polled the authenticated route, spun for five minutes, and then told a
    // buyer whose money had already been taken that their payment failed -
    // and offered them a Retry button that charges them again.
    const usePublicStatus = paymentType === 'donation'
      || paymentType === 'album_purchase'
      || paymentType === 'multi_album_purchase';
    stopPollingRef.current = pollXentriPayStatus(
      paymentRefid,
      {
        onSuccess: (_data: XentriPayStatusResponse) => {
          setStep('success');
          setTimeout(() => {
            onSuccess(paymentRefid);
          }, 500);
        },
        // onFailure fires only on an explicit gateway FAILED past the card
        // grace window. onError is every timeout and status-check error: the
        // charge may have landed, so it must never offer a retry.
        onFailure: (_data: XentriPayStatusResponse) => {
          fail('declined', 'The provider reported this payment as failed.');
        },
        onError: (errorMsg: string) => {
          fail('unknown', errorMsg || 'Unable to check payment status.');
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

    // Wire format per the backend audit: international digits, no '+'
    // (e.g. "250788123456"). Every request body below sends this as `phone`.
    const phone = phoneVal?.digits ?? '';

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
        // The initiate POST may have reached the gateway before the
        // connection dropped, so a prompt may already be on the buyer's
        // phone. That is an unknown outcome (docs/PAYMENTS.md rule 3).
        fail('unknown', 'The connection dropped while starting this payment.');
        onError?.('The connection dropped while starting this payment.');
        return;
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

  // ═══ "The Receipt" - one token set drives light and dark ═══
  const T = darkMode ? {
    overlay: 'rgba(2,6,16,0.72)',
    surface: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
    border: 'rgba(255,255,255,0.12)',
    text: '#fff',
    sub: 'rgba(255,255,255,0.58)',
    faint: 'rgba(255,255,255,0.4)',
    field: 'rgba(255,255,255,0.06)',
    fieldBorder: 'rgba(255,255,255,0.16)',
    chip: 'rgba(255,255,255,0.05)',
    chipBorder: 'rgba(255,255,255,0.14)',
    chipOnBg: 'rgba(3,150,156,0.16)',
    hair: 'rgba(255,255,255,0.09)',
    receipt: 'rgba(255,255,255,0.04)',
    tileBg: 'rgba(255,255,255,0.05)',
    shadow: '0 40px 100px rgba(0,0,0,0.6)',
  } : {
    overlay: 'rgba(8,25,55,0.45)',
    surface: '#ffffff',
    border: 'rgba(8,58,133,0.1)',
    text: '#0f1f3d',
    sub: '#5b6b85',
    faint: '#93a0b5',
    field: '#f6f8fb',
    fieldBorder: '#dbe2ec',
    chip: '#f6f8fb',
    chipBorder: '#e3e8f0',
    chipOnBg: 'rgba(3,150,156,0.09)',
    hair: '#edf0f5',
    receipt: '#f8fafc',
    tileBg: '#ffffff',
    shadow: '0 40px 100px -20px rgba(8,58,133,0.35)',
  };

  const DISPLAY_CCYS: CurrencyCode[] = ['RWF', 'USD', 'EUR', 'KES', 'UGX', 'TZS'];

  const trustFooter = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px 24px 16px', color: T.faint, fontSize: 11.5, fontWeight: 600 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      Encrypted · Secured by Connekyt Payments
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: T.overlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10005, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        padding: 16, overflowY: 'auto',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && step !== 'processing') {
          handleClose();
        }
      }}
    >
      <div
        style={{
          background: T.surface,
          borderRadius: 22, maxWidth: 420, width: '100%', maxHeight: '92vh',
          boxShadow: T.shadow, border: `1px solid ${T.border}`,
          position: 'relative', margin: 'auto', overflow: 'hidden',
          isolation: 'isolate', display: 'flex', flexDirection: 'column',
          fontFamily: "'Pragati Narrow', system-ui, -apple-system, sans-serif",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Brand hairline */}
        <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85, #F20C8F 60%, #03969C)', opacity: 0.9, zIndex: 2 }} />

        {/* Scrollable content layer */}
        <div style={{ overflowY: 'auto', padding: '20px 22px 0' }}>

        {/* Close - hidden during processing and when geo-blocked */}
        {step !== 'processing' && !(eventId && !geoCheckLoading && eventGeoCheck && !eventGeoCheck.allowed) && (
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 14, right: 14, zIndex: 3,
              width: 32, height: 32, borderRadius: '50%',
              background: T.chip, border: `1px solid ${T.chipBorder}`,
              color: T.sub, fontSize: 17, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        )}

        {/* ==================== STEP: Select Method ==================== */}
        {step === 'method' && (
          <>
            {/* Geo-check in progress */}
            {eventId && geoCheckLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px' }}>
                <div style={{ width: 38, height: 38, border: `3px solid ${T.hair}`, borderTopColor: '#F20C8F', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
                <p style={{ fontSize: 13.5, color: T.sub, margin: 0 }}>Checking availability…</p>
              </div>
            )}

            {/* Geo-blocked - full-screen, no close */}
            {eventId && !geoCheckLoading && eventGeoCheck && !eventGeoCheck.allowed && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.8)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24,
              }}>
                <div style={{
                  background: T.surface, borderRadius: 22,
                  padding: 'clamp(30px, 6vw, 44px) clamp(24px, 5vw, 38px)',
                  maxWidth: 420, width: '100%', textAlign: 'center',
                  border: `1px solid ${T.border}`, boxShadow: T.shadow,
                }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
                  </div>
                  <h2 className="pay-serif" style={{ fontSize: 'clamp(20px, 4vw, 25px)', fontWeight: 600, color: T.text, margin: '0 0 10px' }}>
                    Not available in your region.
                  </h2>
                  <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.65, margin: '0 auto 20px', maxWidth: 330 }}>
                    The event organizer has restricted access from your current
                    location. This may be due to regional availability or
                    licensing requirements.
                  </p>
                  {eventGeoCheck.userCountry && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: T.chip, borderRadius: 999, border: `1px solid ${T.chipBorder}`, marginBottom: 20 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: T.faint }} aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span style={{ fontSize: 13, color: T.sub }}>
                        Your location: {eventGeoCheck.userCity && eventGeoCheck.userCity !== 'Unknown'
                          ? `${eventGeoCheck.userCity}, ${eventGeoCheck.userCountry}`
                          : eventGeoCheck.userCountry}
                      </span>
                    </div>
                  )}
                  <p style={{ fontSize: 12.5, color: T.faint, lineHeight: 1.5, margin: 0, borderTop: `1px solid ${T.hair}`, paddingTop: 16 }}>
                    If you believe this is an error, contact the event organizer.
                  </p>
                </div>
              </div>
            )}

            {/* Normal payment form - only when allowed */}
            {(!eventId || (!geoCheckLoading && eventGeoCheck?.allowed !== false)) && (<>
            {/* Header */}
            <div style={{ marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Secure checkout
              </span>
              <h2 className="pay-serif" style={{ fontSize: 'clamp(20px, 4.5vw, 23px)', fontWeight: 600, color: T.text, margin: '9px 0 3px', lineHeight: 1.2 }}>
                {title || defaultTitle}
              </h2>
              {subtitle ? (
                <p style={{ fontSize: 12.5, color: T.sub, margin: 0, lineHeight: 1.5 }}>{subtitle}</p>
              ) : (
                <p style={{ fontSize: 12.5, color: T.sub, margin: 0 }}>Choose how you&apos;d like to pay</p>
              )}
            </div>

            {/* Amount hero - receipt panel with inline currency pill */}
            <div style={{ padding: '15px 17px', borderRadius: 16, background: T.receipt, border: `1px solid ${T.hair}`, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="pay-serif" style={{ color: T.text, fontSize: 'clamp(26px, 6vw, 32px)', fontWeight: 600, lineHeight: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatAmount(totalAmount)}
                </span>
                <label style={{ marginLeft: 'auto', position: 'relative', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden />
                  <CurrencySelect
                    value={displayCurrency}
                    onChange={(v) => setDisplayCurrency(v as CurrencyCode)}
                    options={DISPLAY_CCYS.map(c => ({ value: c, code: c }))}
                    menuBg={darkMode ? '#0a1f44' : '#fff'} menuHover={darkMode ? '#143266' : '#f3f4f6'}
                    menuText={darkMode ? '#fff' : '#0f1f3d'} menuSub={darkMode ? '#aab6d0' : '#6b7280'} menuBorder={T.chipBorder}
                    style={{
                      padding: '6px 12px', borderRadius: 999, background: T.chip,
                      border: `1px solid ${T.chipBorder}`, color: T.sub,
                      fontSize: 11.5, fontWeight: 800, outline: 'none', minWidth: 96,
                    }}
                  />
                </label>
              </div>
              {hasDonation ? (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.fieldBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: T.sub, fontSize: 12 }}>
                    <span>{paymentType === 'streaming' ? 'Gift' : 'Payment'}</span><span>{formatAmount(amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, color: T.sub, fontSize: 12 }}>
                    <span>Donation</span><span style={{ color: '#ff7ec4', fontWeight: 700 }}>{formatAmount(donationAmount!)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.fieldBorder}`, color: T.text, fontSize: 12.5, fontWeight: 800 }}>
                    <span>Total</span><span>{formatAmount(totalAmount)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.fieldBorder}`, color: T.sub, fontSize: 12 }}>
                  <span>Amount to pay</span><span style={{ fontWeight: 700, color: T.text }}>{formatAmount(amount)}</span>
                </div>
              )}
            </div>

            {/* Escrow notice - booking deposits are platform-held */}
            {paymentType === 'booking' && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: T.chip, border: `1px solid ${T.chipBorder}`, borderRadius: 12, padding: '11px 14px', marginBottom: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#03969c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: T.sub }}>
                  <strong style={{ color: T.text }}>Held safely by Connekyt.</strong> This payment is not sent to the photographer directly. We hold it and release it to them only after your event is delivered.
                </p>
              </div>
            )}

            {/* Geo-restriction warning */}
            {!geoStatus.loading && geoStatus.blocked && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '13px 15px', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true"><path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 800, color: '#ef4444' }}>Payment not available</h4>
                    <p style={{ margin: 0, fontSize: 12.5, color: T.sub, lineHeight: 1.5 }}>
                      {geoStatus.message || 'Payment services are not available in your country.'}
                      {geoStatus.country && (
                        <><br /><span style={{ fontSize: 11.5, opacity: 0.8 }}>Detected location: {geoStatus.country}</span></>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile money disabled warning */}
            {!geoStatus.loading && geoStatus.disableMobileMoney && !geoStatus.blocked && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.4)', borderRadius: 12, padding: '11px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden="true"><path d="M12 9V11M12 15H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <p style={{ margin: 0, fontSize: 12.5, color: T.sub, fontWeight: 500 }}>
                  Mobile money is unavailable in your region. Please use card payment.
                </p>
              </div>
            )}

            {/* Pay with - country pill + method chips */}
            <div style={{ marginBottom: 14 }}>
              {!showCountryPicker && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
                  <span style={{ color: T.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Pay with</span>
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker(true)}
                    style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 999, background: 'transparent', border: `1px solid ${T.chipBorder}`, color: T.sub, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {detectedCountry ? (
                      <>
                        {findCountry(detectedCountry)?.flag && <span style={{ fontSize: 12 }}>{findCountry(detectedCountry)?.flag}</span>}
                        {findCountry(detectedCountry)?.name ?? detectedCountry}{paymentOptions?.currency ? ` · ${paymentOptions.currency}` : ''} · change
                      </>
                    ) : (
                      <>🌍 Choose country</>
                    )}
                  </button>
                </div>
              )}

              {showCountryPicker ? (
                <CountryPicker
                  value={detectedCountry}
                  dark={darkMode}
                  onChange={(iso2) => {
                    setCountry(iso2);
                    setSelectedMethod(null);
                    setShowCountryPicker(false);
                  }}
                  title="Pick a country"
                  hint="Choose the country your number belongs to."
                />
              ) : (
                <PaymentMethodChooser
                  tone={darkMode ? 'dark' : 'light'}
                  accent="#03969c"
                  selectedId={selectedMethod}
                  onSelect={setSelectedMethod}
                  methods={paymentMethods
                    .filter((method) => {
                      // Filter by the event geo-check's allowed methods at the
                      // CATEGORY level (mobile-money vs card): matching exact
                      // provider names hid other countries' operators.
                      const allowed = eventGeoCheck?.allowedPaymentMethods;
                      if (!allowed || allowed.length === 0) return true;
                      if (method.provider === 'CARD') return allowed.includes('CARD');
                      return allowed.some((m) => m !== 'CARD');
                    })
                    .map((method) => ({
                      id: method.id,
                      name: method.name,
                      image: method.image,
                      disabled: geoStatus.blocked || (method.id !== 'card' && geoStatus.disableMobileMoney),
                    }))}
                />
              )}
              {!showCountryPicker && !optionsLoading && !countryLoading && !countrySupported && (
                <p style={{ margin: '9px 0 0', color: T.faint, fontSize: 12, lineHeight: 1.45 }}>
                  {detectedCountry
                    ? `Mobile money is not available in ${findCountry(detectedCountry)?.name ?? detectedCountry}. You can pay by card, or choose another country above.`
                    : 'We could not confirm your country. You can pay by card, or choose your country above to see mobile money.'}
                </p>
              )}
            </div>

            {/* Phone - mobile money */}
            {selectedMethod && selectedMethod !== 'card' && (
              <div style={{ marginBottom: 14 }}>
                <InternationalPhoneInput
                  defaultIso2={detectedCountry}
                  onChange={setPhoneVal}
                  disabled={loading}
                  dark={darkMode}
                  ariaLabel="Mobile money phone number"
                />
                <p style={{ fontSize: 11.5, color: T.faint, margin: '7px 2px 0' }}>
                  An approval prompt lands on this phone. Keep it nearby.
                </p>
              </div>
            )}

            {/* Card note */}
            {selectedMethod === 'card' && (
              <p style={{ margin: '0 2px 14px', fontSize: 11.5, color: T.faint, lineHeight: 1.55 }}>
                A secure card page opens in a new tab. Come back here after
                paying, we watch for the confirmation.
              </p>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: '11px 14px', marginBottom: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, color: darkMode ? '#fca5a5' : '#dc2626', fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => {
                if (showDonationPrompt && paymentType !== 'donation') {
                  setShowDonationOverlay(true);
                } else {
                  handlePay();
                }
              }}
              disabled={!isValid() || loading}
              style={{
                width: '100%', padding: 15, borderRadius: 14, border: 0,
                background: (!isValid() || loading)
                  ? (darkMode ? 'rgba(255,255,255,0.08)' : '#eef2f8')
                  : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: (!isValid() || loading) ? T.faint : '#fff',
                fontSize: 15, fontWeight: 800,
                cursor: (!isValid() || loading) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: (!isValid() || loading) ? 'none' : '0 12px 30px -10px rgba(242,12,143,0.5)',
                transition: 'transform 180ms ease, box-shadow 180ms ease',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Processing…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  {showDonationPrompt && paymentType !== 'donation'
                    ? `Continue · ${formatAmount(totalAmount)}`
                    : selectedMethod === 'card'
                      ? `Proceed to pay · ${formatAmount(totalAmount)}`
                      : `Pay ${formatAmount(totalAmount)}`}
                </>
              )}
            </button>
            {trustFooter}
            </>)}
          </>
        )}

        {/* ==================== STEP: Processing ==================== */}
        {step === 'processing' && (
          <div style={{ padding: '16px 4px 0', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 86, height: 86, margin: '4px auto 18px' }}>
              <span className="pay-ring" aria-hidden />
              <span className="pay-ring d2" aria-hidden />
              <span style={{ position: 'absolute', inset: 18, borderRadius: '50%', background: 'rgba(3,150,156,0.14)', border: '1px solid rgba(3,150,156,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#03969c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {selectedMethod === 'card'
                    ? <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>
                    : <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>}
                </svg>
              </span>
            </div>
            <h3 className="pay-serif" style={{ margin: '0 0 6px', color: T.text, fontSize: 23, fontWeight: 600 }}>
              {selectedMethod === 'card' ? 'Finish in the card tab.' : 'Check your phone.'}
            </h3>
            <p style={{ margin: '0 auto', maxWidth: 300, color: T.sub, fontSize: 13, lineHeight: 1.6 }}>
              {selectedMethod === 'card'
                ? 'We opened a secure card page in another tab. This screen updates by itself the moment the payment lands.'
                : `An approval prompt was sent${phoneVal?.digits ? ` to your number ending in ${phoneVal.digits.slice(-3)}` : ' to your phone'}. Approve it there, this screen updates by itself.`}
            </p>
            {selectedMethod !== 'card' && (
              <div style={{ margin: '14px auto 0', maxWidth: 300, padding: '10px 14px', borderRadius: 12, background: T.chip, border: `1px solid ${T.chipBorder}`, color: T.sub, fontSize: 12, textAlign: 'left', lineHeight: 1.55 }}>
                No prompt? Open your mobile money menu to approve pending
                payments, and check your balance covers <strong style={{ color: T.text }}>{formatAmount(totalAmount)}</strong>.
              </div>
            )}
            {selectedMethod === 'card' && paymentUrl && (
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '14px auto 0', padding: '9px 16px', borderRadius: 999, background: T.chip, border: `1px solid ${T.chipBorder}`, color: '#03969c', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}
              >
                Reopen the card page ↗
              </a>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, margin: '16px 0 4px', color: T.faint, fontSize: 11.5, fontWeight: 600 }}>
              <span className="pay-dot" aria-hidden /> Watching for confirmation{refid ? ` · ref ${refid.slice(0, 10)}…` : ''}
            </div>
            {trustFooter}
          </div>
        )}

        {/* ==================== STEP: Success ==================== */}
        {step === 'success' && (
          <div style={{ padding: '20px 4px 0', textAlign: 'center' }}>
            <div style={{ width: 76, height: 76, margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(16,185,129,0.14)', border: '2px solid rgba(16,185,129,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="pay-serif" style={{ margin: '0 0 6px', color: T.text, fontSize: 25, fontWeight: 600 }}>Paid.</h3>
            <p style={{ margin: '0 auto', maxWidth: 290, color: T.sub, fontSize: 13, lineHeight: 1.6 }}>
              {formatAmount(totalAmount)} received. Taking you to your purchase now.
            </p>
            {refid && (
              <div style={{ margin: '16px auto 4px', maxWidth: 270, padding: '9px 14px', borderRadius: 12, background: T.receipt, border: `1px dashed ${T.fieldBorder}`, color: T.sub, fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span>Receipt</span><code style={{ color: '#03969c', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{refid}</code>
              </div>
            )}
            {trustFooter}
          </div>
        )}

        {/* ==================== STEP: Failed ==================== */}
        {/* Two truths, per docs/PAYMENTS.md rule 2:
            - declined: the gateway definitively refused - no charge landed,
              retrying is safe and offered.
            - unknown: timeout / status-check error - the charge MAY have
              landed, so NO retry is offered. The buyer is told to check
              their phone and email first. */}
        {step === 'failed' && (
          <div style={{ padding: '20px 4px 0', textAlign: 'center' }}>
            <div style={{
              width: 70, height: 70, margin: '0 auto 16px', borderRadius: '50%',
              background: failureKind === 'declined' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
              border: `2px solid ${failureKind === 'declined' ? 'rgba(239,68,68,0.55)' : 'rgba(245,158,11,0.55)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {failureKind === 'declined' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <span style={{ color: '#f59e0b', fontSize: 26, fontWeight: 800 }}>?</span>
              )}
            </div>
            <h3 className="pay-serif" style={{ margin: '0 0 6px', color: T.text, fontSize: 23, fontWeight: 600 }}>
              {failureKind === 'declined' ? 'Payment declined.' : 'Still unconfirmed.'}
            </h3>
            <p style={{ margin: '0 auto', maxWidth: 300, color: T.sub, fontSize: 13, lineHeight: 1.6 }}>
              {failureKind === 'declined'
                ? 'The provider declined this payment. You were not charged. Check your balance or try a different method.'
                : "We couldn't confirm the payment in time. If you approved it, the money may have left your account, so don't pay again yet."}
            </p>
            {error && failureKind === 'declined' && (
              <p style={{ margin: '10px auto 0', maxWidth: 300, color: T.faint, fontSize: 11.5 }}>{error}</p>
            )}
            {failureKind === 'unknown' && (
              <div style={{ margin: '14px auto 0', maxWidth: 310, padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: T.sub, fontSize: 12.5, textAlign: 'left', lineHeight: 1.6 }}>
                <strong style={{ color: '#f59e0b' }}>Before anything else:</strong><br />
                1. Check your phone for the payment receipt SMS.<br />
                2. Check your email, we deliver there the moment it clears.<br />
                If neither arrives in a few minutes, you can safely start over.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, margin: '16px 0 4px' }}>
              {failureKind === 'declined' ? (
                <>
                  <button
                    onClick={handleClose}
                    style={{ flex: 1, padding: 13, borderRadius: 13, cursor: 'pointer', background: T.chip, border: `1px solid ${T.chipBorder}`, color: T.text, fontWeight: 700, fontSize: 13.5 }}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleRetry}
                    style={{ flex: 1.4, padding: 13, borderRadius: 13, border: 0, cursor: 'pointer', background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)', color: '#fff', fontWeight: 800, fontSize: 13.5, boxShadow: '0 10px 26px -10px rgba(242,12,143,0.5)' }}
                  >
                    Try a different way
                  </button>
                </>
              ) : (
                <button
                  onClick={handleClose}
                  style={{ flex: 1, padding: 13, borderRadius: 13, cursor: 'pointer', background: T.chip, border: `1px solid ${T.chipBorder}`, color: T.text, fontWeight: 700, fontSize: 13.5 }}
                >
                  Close · I&apos;ll check my phone &amp; email
                </button>
              )}
            </div>
            {trustFooter}
          </div>
        )}
        </div>{/* end scrollable content layer */}
      </div>

      <style>{`
        .pay-serif {
          font-family: 'Pragati Narrow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -0.015em;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(3,150,156,0.5); animation: pay-pulse 2s ease-out infinite; }
        .pay-ring.d2 { animation-delay: 1s; }
        @keyframes pay-pulse { 0% { transform: scale(0.6); opacity: 1; } 100% { transform: scale(1.25); opacity: 0; } }
        .pay-dot { width: 7px; height: 7px; border-radius: 50%; background: #03969c; display: inline-block; animation: pay-blink 1.2s ease-in-out infinite; }
        @keyframes pay-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        @media (prefers-reduced-motion: reduce) { .pay-ring, .pay-dot { animation: none; } }
      `}</style>

      {/* DonationPromptModal - optional add-on overlay AFTER Continue.
          Either action closes the overlay and calls handlePay() with the
          chosen donation amount. */}
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
