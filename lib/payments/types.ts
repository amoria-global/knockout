/**
 * Shared types for the multi-country payment-method picker.
 * Mirrors the backend's PaymentOperatorRegistry payload from
 * GET /api/remote/public/payments/options?country=XX.
 */

export type OperatorType = 'MOBILE_MONEY' | 'CARD';

export interface PaymentOperator {
  /** Canonical provider id sent back on initiate (e.g. "MTN", "AIRTEL"). */
  id: string;
  name: string;
  iconKey: string;
  type: OperatorType;
}

export interface PaymentOptions {
  country: string;       // ISO-2
  currency: string;      // ISO-4217
  operators: PaymentOperator[];
  supportsCard: boolean;
  supportsMobileMoney: boolean;
}

export interface DetectedCountry {
  country: string | null; // ISO-2 or null if undetectable
  source: 'IP' | 'DEFAULT' | 'MANUAL' | 'CACHED';
  supported: boolean;
}
