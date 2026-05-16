"use client";

/**
 * PaymentCurrencyPreview (landing variant)
 *
 * Compact panel for payment / checkout modals. The user picks a preferred
 * display currency and the panel shows every relevant amount on the modal
 * converted to that currency. Mirrors the dashboard component visually
 * (pill selector + stacked converted amounts) so the affordance is
 * consistent across both apps.
 *
 * Differences from the dashboard variant: landing has no CurrencyContext /
 * topbar currency selector, so this component self-fetches live rates from
 * the public /api/remote/public/currencies/rates endpoint and caches them
 * at module scope. No global "user currency preference" to inherit - each
 * modal owns its own selection.
 *
 * Display-only. The submitted amount + currency to the backend is unchanged.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCurrencyRates, type CurrencyRate } from "@/lib/APIs/public";

export type CurrencyCode = "USD" | "RWF" | "EUR" | "KES" | "UGX" | "TZS";

const FLAG: Record<CurrencyCode, string> = { USD: "us", RWF: "rw", EUR: "eu", KES: "ke", UGX: "ug", TZS: "tz" };
const DECIMALS: Record<CurrencyCode, number> = { USD: 2, EUR: 2, RWF: 0, KES: 0, UGX: 0, TZS: 0 };
const SYMBOL: Record<CurrencyCode, string> = { USD: "$", EUR: "€", RWF: "RF ", KES: "KSh", UGX: "USh", TZS: "TSh" };
const NAME: Record<CurrencyCode, string> = {
  USD: "US Dollar", EUR: "Euro", RWF: "Rwandan franc",
  KES: "Kenyan Shilling", UGX: "Ugandan Shilling", TZS: "Tanzanian Shilling",
};
const CURRENCY_CODES: CurrencyCode[] = ["USD", "RWF", "EUR", "KES", "UGX", "TZS"];

// Module-level cache so every modal doesn't refetch the same rate table.
// Rates refresh on page reload - good enough for a conversion preview.
let ratesCache: Record<string, CurrencyRate> | null = null;
let ratesPromise: Promise<Record<string, CurrencyRate> | null> | null = null;
function loadRates(): Promise<Record<string, CurrencyRate> | null> {
  if (ratesCache) return Promise.resolve(ratesCache);
  if (ratesPromise) return ratesPromise;
  ratesPromise = getCurrencyRates()
    .then((res) => {
      const data = res.success && res.data ? res.data : null;
      if (data) ratesCache = data;
      return data;
    })
    .catch(() => null)
    .finally(() => { ratesPromise = null; });
  return ratesPromise;
}

export interface PaymentCurrencyPreviewAmount {
  label: string;
  amount: number;
}

interface PaymentCurrencyPreviewProps {
  /** Currency the input `amount` values are denominated in. */
  fromCurrency: CurrencyCode;
  /** Labelled amounts to convert and display under the selector. */
  amounts: PaymentCurrencyPreviewAmount[];
  /** Optional title for the panel. */
  title?: string;
  /** Default display currency (defaults to USD if unset). */
  defaultCurrency?: CurrencyCode;
  /** Notify parent when the user picks a different display currency. */
  onCurrencyChange?: (code: CurrencyCode) => void;
  /** Whether the parent app is in dark mode - affects selection highlight color. */
  darkMode?: boolean;
}

const PaymentCurrencyPreview: React.FC<PaymentCurrencyPreviewProps> = ({
  fromCurrency,
  amounts,
  title = "View in",
  defaultCurrency = "USD",
  onCurrencyChange,
  darkMode = false,
}) => {
  const [displayCode, setDisplayCode] = useState<CurrencyCode>(defaultCurrency);
  const [open, setOpen] = useState(false);
  const [rates, setRates] = useState<Record<string, CurrencyRate> | null>(ratesCache);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rates) loadRates().then(setRates);
  }, [rates]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Rates keyed by abbreviation, value is "1 USD = X of this currency".
  const rateFor = (code: CurrencyCode): number => {
    if (code === "USD") return 1;
    const r = rates?.[code]?.rateToUsd;
    return typeof r === "number" && r > 0 ? r : 1;
  };

  const converted = useMemo(() => {
    if (!rates) return [];
    const fromRate = rateFor(fromCurrency);
    const toRate = rateFor(displayCode);
    return amounts.map(({ label, amount }) => {
      const safe = Number.isFinite(amount) ? amount : 0;
      const usd = safe / (fromRate || 1);
      return { label, value: usd * (toRate || 1) };
    });
  }, [amounts, fromCurrency, displayCode, rates]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: DECIMALS[displayCode],
      maximumFractionDigits: DECIMALS[displayCode],
    }).format(n);

  const handlePick = (code: CurrencyCode) => {
    setDisplayCode(code);
    setOpen(false);
    onCurrencyChange?.(code);
  };

  // The outer panel uses a transparent background so it picks up whatever
  // color the host modal sits on, instead of painting its own dark/light
  // card. This fixes the visual mismatch where a light modal (e.g. the
  // "Buy 1 photo" XentriPayModal) was rendering a dark grey panel over it.
  // The dropdown menu + pill button stay opaque so they remain legible as
  // overlays regardless of the parent's backdrop. Border + text colors
  // still honor `darkMode` so contrast stays correct either way.
  // Border / textSecondary bumped a touch from the previous revision so
  // both the outline and the "View in / Amount" label are clearly visible
  // on typical modal backdrops. Panel bg stays transparent so it blends
  // with whatever color the host modal paints behind it.
  const palette = darkMode
    ? { bg: "transparent", bg2: "#111827", bg3: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.28)", text: "#F9FAFB", textSecondary: "rgba(249,250,251,0.82)", selectedBg: "#1E3A5F", checkColor: "#60A5FA" }
    : { bg: "transparent", bg2: "#FFFFFF", bg3: "#F3F4F6", border: "#CBD5E1", text: "#111827", textSecondary: "#4B5563", selectedBg: "#EFF6FF", checkColor: "#083A85" };

  return (
    <div
      ref={rootRef}
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: "0.75rem",
        padding: "0.75rem",
        minWidth: "200px",
        maxWidth: "260px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.6rem",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: palette.textSecondary,
          }}
        >
          {title}
        </span>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.55rem",
              borderRadius: "9999px",
              border: `2px solid ${palette.border}`,
              background: palette.bg3,
              color: palette.text,
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            <img
              src={`https://flagcdn.com/w40/${FLAG[displayCode]}.png`}
              alt=""
              style={{ width: "16px", height: "12px", objectFit: "cover", borderRadius: "2px" }}
            />
            {displayCode}
            <span
              style={{
                fontSize: "0.6rem",
                color: palette.textSecondary,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                display: "inline-block",
              }}
            >▾</span>
          </button>

          {open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 0.4rem)",
                right: 0,
                backgroundColor: palette.bg2,
                borderRadius: "0.75rem",
                boxShadow: "0 10px 25px -3px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)",
                border: `2px solid ${palette.border}`,
                padding: "0.4rem",
                minWidth: "200px",
                zIndex: 1200,
              }}
            >
              {CURRENCY_CODES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handlePick(c)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0.45rem 0.7rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background: displayCode === c ? palette.selectedBg : "transparent",
                    color: palette.text,
                    fontSize: "0.82rem",
                    fontWeight: displayCode === c ? 600 : 400,
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    gap: "0.5rem",
                  }}
                  onMouseEnter={(e) => {
                    if (displayCode !== c) e.currentTarget.style.backgroundColor = palette.bg3;
                  }}
                  onMouseLeave={(e) => {
                    if (displayCode !== c) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <img
                      src={`https://flagcdn.com/w40/${FLAG[c]}.png`}
                      alt={NAME[c]}
                      style={{ width: "20px", height: "15px", objectFit: "cover", borderRadius: "2px" }}
                    />
                    <span style={{ fontWeight: 600 }}>{c}</span>
                    <span style={{ fontSize: "0.78rem", color: palette.textSecondary }}>{NAME[c]}</span>
                  </div>
                  {displayCode === c && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke={palette.checkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {converted.map(({ label, value }, idx) => (
          <div
            key={`${label}-${idx}`}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "0.5rem",
              fontSize: "0.78rem",
            }}
          >
            <span style={{ color: palette.textSecondary }}>{label}</span>
            <span style={{ color: palette.text, fontWeight: 600 }}>
              {SYMBOL[displayCode]}
              {fmt(value)}
            </span>
          </div>
        ))}
        {!rates && (
          <span style={{ color: palette.textSecondary, fontSize: "0.72rem", fontStyle: "italic" }}>
            Loading rates…
          </span>
        )}
      </div>
    </div>
  );
};

export default PaymentCurrencyPreview;

// Conversion helper for callers that want to format a number in a specific
// display currency without rendering the panel itself - useful when a modal
// has many scattered amount displays and only wants to reuse the rate maths.
export function convertAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: Record<string, CurrencyRate> | null,
): number {
  if (!Number.isFinite(amount) || amount === 0) return 0;
  const fromRate = fromCurrency === "USD" ? 1 : rates?.[fromCurrency]?.rateToUsd ?? 1;
  const toRate = toCurrency === "USD" ? 1 : rates?.[toCurrency]?.rateToUsd ?? 1;
  const usd = amount / (fromRate || 1);
  return usd * (toRate || 1);
}

export function formatInCurrency(amount: number, code: CurrencyCode): string {
  return `${SYMBOL[code]}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: DECIMALS[code],
    maximumFractionDigits: DECIMALS[code],
  }).format(amount)}`;
}

export { DECIMALS as CURRENCY_DECIMALS, SYMBOL as CURRENCY_SYMBOL, FLAG as CURRENCY_FLAG };

/**
 * Hook that gives a parent modal direct access to the live-rate table the
 * preview panel uses, plus a convert() helper so every amount display in
 * the modal (headers, summaries, buttons, inputs) can re-render in the
 * user's chosen display currency without duplicating the rate-fetch.
 *
 * Used by XentriPayModal / BookingWizard / join-event to flip every amount
 * on the modal - not just the preview panel - when the user picks a new
 * currency in the panel's selector. The modal holds the display currency
 * state and passes it back into the panel via defaultCurrency + receives
 * changes via onCurrencyChange.
 */
export function useLiveRates() {
  const [rates, setRates] = useState<Record<string, CurrencyRate> | null>(ratesCache);
  useEffect(() => {
    if (!rates) loadRates().then(setRates);
  }, [rates]);

  const convert = React.useCallback(
    (amount: number, from: CurrencyCode, to: CurrencyCode): number => {
      // Before rates load, returning a converted value would use rate=1 as a
      // fallback - which treats e.g. 1000 RWF as $1000 USD. Wildly wrong to
      // show. Return the original amount unchanged; callers should pair this
      // with `ready` or format() so they don't mislabel the currency.
      if (!rates && from !== to) return amount;
      return convertAmount(amount, from, to, rates);
    },
    [rates],
  );

  const format = React.useCallback(
    (amount: number, from: CurrencyCode, to: CurrencyCode): string => {
      // While rates are still loading, keep the source-currency label so the
      // user doesn't see a wrong symbol next to a pre-conversion number.
      if (!rates && from !== to) return formatInCurrency(amount, from);
      return formatInCurrency(convertAmount(amount, from, to, rates), to);
    },
    [rates],
  );

  return { rates, convert, format, ready: rates !== null };
}
