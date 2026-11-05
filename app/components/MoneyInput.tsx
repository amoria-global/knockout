'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import CurrencyFlag from './CurrencyFlag';
import type { CurrencyOption } from './CurrencySelect';
import {
  approxLabel,
  displayAmount,
  filterCurrencies,
  minimumLabel,
  quickPickCodes,
  rawFromInput,
  sortAtoZ,
  suggestedCodes,
} from '@/lib/money';
import { isWholeNumberCurrency, priceError, usePaymentLimitState } from '@/lib/paymentLimits';
import { recordCurrencyUse, useCurrencyUsage, useRates } from '@/lib/useMoney';

/** The landing is a light surface with the brand navy and pink, so the field draws from these instead of a theme context. */
const LIGHT = {
  bgSecondary: '#FFFFFF',
  bgTertiary: '#F3F4F6',
  bgInput: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  borderPrimary: '#E5E7EB',
  borderFocus: '#F20C8F',
  statusError: '#DC2626',
  statusWarning: '#F59E0B',
  statusWarningBg: '#FFFBEB',
  shadowLg: '0 12px 32px rgba(0, 0, 0, 0.12)',
};

/** The dark live-stream modals draw the same field on a glass-dark ground. */
const DARK: typeof LIGHT = {
  bgSecondary: '#101a30',
  bgTertiary: 'rgba(255, 255, 255, 0.10)',
  bgInput: 'rgba(255, 255, 255, 0.06)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textTertiary: 'rgba(255, 255, 255, 0.55)',
  borderPrimary: 'rgba(255, 255, 255, 0.20)',
  borderFocus: '#60A5FA',
  statusError: '#FCA5A5',
  statusWarning: '#FBBF24',
  statusWarningBg: 'rgba(251, 191, 36, 0.12)',
  shadowLg: '0 12px 32px rgba(0, 0, 0, 0.45)',
};

/** A country's English name from its two-letter code, where the runtime can say it. Used only for searching. */
function countryNameFor(code: string): string | undefined {
  const map: Record<string, string> = { RWF: 'RW', USD: 'US', EUR: 'EU', KES: 'KE', UGX: 'UG', TZS: 'TZ', CDF: 'CD', ETB: 'ET', GHS: 'GH', LSL: 'LS', MWK: 'MW', MZN: 'MZ', NGN: 'NG', ZMW: 'ZM', XAF: 'CM', XOF: 'CI', GBP: 'GB', ZAR: 'ZA', BIF: 'BI' };
  const cc = map[code.toUpperCase()];
  if (!cc) return undefined;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(cc);
  } catch {
    return undefined;
  }
}

/**
 * Price and currency as ONE field: the currency is a button inside the field, the amount sits beside it, and the minimum
 * and conversion show right under the number so the error is prevented rather than reported. The currency list opens as
 * a popover with search (type to search, up and down to move, Enter to pick, Escape to close).
 *
 * The amount is held as plain digits ("1234.5", never "1,234.5"); thousands separators are display only, so the value a
 * form sends is the same amount and currency it always sent. The server still judges every price on submit.
 */
export default function MoneyInput({
  label,
  required,
  value,
  onChange,
  currencyId,
  onCurrencyChange,
  currencies,
  placeholder = '0',
  disabled,
  showQuickPick = true,
  showLimits = true,
  error: formError,
  wholeNumbersOnly,
  onFocus,
  id,
  hideLabel,
  keepAmountOnCurrencyChange = true,
  displayCurrency,
  tone = 'light',
}: {
  label: string;
  required?: boolean;
  /** The amount as plain digits and at most one decimal point. */
  value: string;
  onChange: (raw: string) => void;
  currencyId: string;
  onCurrencyChange: (id: string) => void;
  /** The currencies the server lists for this context. Never hardcoded in the client. */
  currencies: CurrencyOption[];
  placeholder?: string;
  disabled?: boolean;
  showQuickPick?: boolean;
  /** Show the minimum, the below-minimum error and the old-rate note. Off where the server does not enforce the listing minimum. */
  showLimits?: boolean;
  /** An error from the form itself, shown when the amount has no error of its own. */
  error?: string;
  /** Force whole numbers whatever the currency. */
  wholeNumbersOnly?: boolean;
  onFocus?: () => void;
  id?: string;
  /** The label stays for screen readers but is not drawn (the surrounding form already shows one). */
  hideLabel?: boolean;
  /** Keep the typed amount when the currency changes (the default). Off where the amount is a payment: the same number in another currency is a different sum of money. */
  keepAmountOnCurrencyChange?: boolean;
  /** 'dark' for the live-stream modals. */
  tone?: 'light' | 'dark';
  /** The currency the "about" line converts into (the viewer's own). No line is drawn without it. */
  displayCurrency?: string;
}) {
  const accountCode = displayCurrency;
  const colors = tone === 'dark' ? DARK : LIGHT;
  const uid = useId();
  const fieldId = id ?? `money-${uid}`;
  const helperId = `${fieldId}-help`;
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const usage = useCurrencyUsage();
  const rates = useRates();
  const selected = currencies.find((c) => c.value === currencyId);
  const code = selected?.code;
  const { limit, loading } = usePaymentLimitState(code);
  const whole = wholeNumbersOnly ?? (limit ? limit.wholeNumbersOnly : isWholeNumberCurrency(code));

  const limitError = showLimits ? priceError(value, limit) : null;
  const error = limitError ?? formError ?? null;
  const minimum = showLimits ? minimumLabel(limit) : null;
  const approx = approxLabel(value, code, accountCode, rates);

  const codes = useMemo(() => currencies.map((c) => c.code), [currencies]);
  const quick = useMemo(() => quickPickCodes(codes, usage, accountCode, code), [codes, usage, accountCode, code]);
  const suggested = useMemo(() => suggestedCodes(codes, usage, accountCode), [codes, usage, accountCode]);

  const pickerItems = useMemo(() => sortAtoZ(currencies.map((c) => ({ id: c.value, code: c.code, name: c.name ?? c.code }))), [currencies]);
  const matches = useMemo(() => filterCurrencies(pickerItems, query, countryNameFor), [pickerItems, query]);
  const searching = query.trim().length > 0;
  const suggestedItems = searching ? [] : suggested.map((s) => pickerItems.find((p) => p.code === s)).filter((p): p is (typeof pickerItems)[number] => !!p);
  // One flat list drives the keyboard: suggested first, then everything.
  const flat = [...suggestedItems, ...matches];

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const choose = (nextId: string) => {
    const c = currencies.find((x) => x.value === nextId);
    if (c && nextId !== currencyId) {
      recordCurrencyUse(c.code);
      onCurrencyChange(nextId);
      // By default the amount is kept and only digits a zero-decimal currency cannot carry are dropped.
      if (value) onChange(keepAmountOnCurrencyChange ? rawFromInput(value, c.code) : '');
    }
    setOpen(false);
    setQuery('');
  };

  const onPopoverKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1))));
    } else if (e.key === 'Enter' && flat[active]) {
      e.preventDefault();
      choose(flat[active].id);
    }
  };

  const borderColor = error ? colors.statusError : focused ? colors.borderFocus : colors.borderPrimary;
  const optId = (i: number) => `${fieldId}-opt-${i}`;

  return (
    <div ref={root} style={{ position: 'relative' }}>
      <label htmlFor={fieldId} style={hideLabel ? srOnly : { display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', color: colors.textSecondary }}>
        {label}
        {required ? ' *' : ''}
      </label>

      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 44, border: `1px solid ${borderColor}`, borderRadius: 10, background: colors.bgInput, boxShadow: focused ? `0 0 0 3px ${colors.borderFocus}22` : 'none', opacity: disabled ? 0.6 : 1 }}>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Currency, ${selected?.name ?? 'none chosen'}, change`}
          onClick={() => {
            setOpen((v) => !v);
            setActive(0);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 96, minHeight: 44, padding: '0 12px', border: 'none', borderRight: `1px solid ${colors.borderPrimary}`, borderRadius: '10px 0 0 10px', background: 'transparent', color: colors.textPrimary, fontWeight: 700, fontSize: '0.9rem', cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <CurrencyFlag code={code} />
          <span>{code ?? 'Pick'}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          id={fieldId}
          value={displayAmount(value)}
          onChange={(e) => onChange(rawFromInput(e.target.value, code, whole))}
          placeholder={placeholder}
          inputMode={whole ? 'numeric' : 'decimal'}
          autoComplete="off"
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={helperId}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, minWidth: 0, padding: '0 14px', border: 'none', outline: 'none', background: 'transparent', color: colors.textPrimary, fontSize: '1.05rem', fontWeight: 600 }}
        />
      </div>

      <div id={helperId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6, minHeight: 16, fontSize: '0.75rem' }} aria-live="polite">
        {error ? (
          <span role="alert" style={{ color: colors.statusError, fontWeight: 500 }}>{error}</span>
        ) : (
          <>
            <span style={{ color: colors.textTertiary }}>{showLimits && loading ? 'Checking the minimum...' : minimum ?? ''}</span>
            {approx ? <span style={{ color: colors.textTertiary, fontWeight: 500 }}>{approx}</span> : null}
          </>
        )}
      </div>

      {showLimits && limit?.rateStale ? (
        <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, border: `1px solid ${colors.statusWarning}`, background: colors.statusWarningBg, color: colors.textSecondary, fontSize: '0.75rem' }}>
          The exchange rate is more than 24 hours old, so the minimum and the conversion may be slightly off.
        </div>
      ) : null}

      {showQuickPick && currencies.length > 1 ? (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', color: colors.textTertiary }}>QUICK PICK</span>
          {quick.map((q) => {
            const c = currencies.find((x) => x.code === q);
            if (!c) return null;
            const on = c.value === currencyId;
            return (
              <button key={c.value} type="button" disabled={disabled} aria-pressed={on} onClick={() => choose(c.value)} style={chipStyle(colors, on)}>
                <CurrencyFlag code={c.code} width={16} />
                {c.code}
              </button>
            );
          })}
          <button type="button" disabled={disabled} onClick={() => { setOpen(true); setActive(0); }} style={chipStyle(colors, false)}>More...</button>
        </div>
      ) : null}

      {open ? (
        <div role="dialog" aria-label="Choose currency" onKeyDown={onPopoverKey} style={{ position: 'absolute', zIndex: 100, top: 'calc(100% - 2px)', left: 0, width: 'min(340px, 100%)', maxHeight: 360, display: 'flex', flexDirection: 'column', background: colors.bgSecondary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 12, boxShadow: colors.shadowLg }}>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search code, name or country"
            aria-label="Search currencies"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${fieldId}-list`}
            aria-activedescendant={flat[active] ? optId(active) : undefined}
            style={{ margin: 8, minHeight: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${colors.borderPrimary}`, background: colors.bgInput, color: colors.textPrimary, fontSize: '0.9rem' }}
          />
          <ul id={`${fieldId}-list`} role="listbox" style={{ listStyle: 'none', margin: 0, padding: '0 8px 8px', overflowY: 'auto' }}>
            {flat.length === 0 ? <li style={{ padding: 10, fontSize: '0.85rem', color: colors.textSecondary }}>No currency matches that. Try a code like USD or a country name.</li> : null}
            {flat.map((c, i) => {
              const isSuggestedRow = i < suggestedItems.length;
              const heading =
                i === 0 && suggestedItems.length > 0 ? 'SUGGESTED' : i === suggestedItems.length ? (searching ? 'RESULTS' : 'ALL CURRENCIES · A–Z') : null;
              return (
                <li key={`${isSuggestedRow ? 's' : 'a'}-${c.id}`} role="presentation">
                  {heading ? <div style={{ padding: '8px 4px 4px', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', color: colors.textTertiary }}>{heading}</div> : null}
                  <div
                    id={optId(i)}
                    role="option"
                    aria-selected={c.id === currencyId}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, padding: '0 10px', borderRadius: 8, cursor: 'pointer', background: i === active || c.id === currencyId ? colors.bgTertiary : 'transparent' }}
                  >
                    <CurrencyFlag code={c.code} />
                    <span style={{ fontWeight: 700, width: 40 }}>{c.code}</span>
                    <span style={{ flex: 1, fontSize: '0.82rem', color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    {c.id === currencyId ? <span aria-hidden="true">{'✓'}</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

const srOnly = { position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 } as const;

function chipStyle(colors: typeof LIGHT, on: boolean) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    padding: '0 12px',
    borderRadius: 999,
    border: `1px solid ${on ? colors.borderFocus : colors.borderPrimary}`,
    background: on ? colors.bgTertiary : 'transparent',
    color: colors.textPrimary,
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as const;
}
