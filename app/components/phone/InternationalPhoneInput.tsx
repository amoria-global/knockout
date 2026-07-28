'use client';

/**
 * InternationalPhoneInput — Phase-2 integration of
 * app/_design-sandbox/PhoneInput.preview.html.
 *
 * One field for the whole platform:
 *  - auto-applies the international dial code for the detected/selected
 *    country (flag button + searchable dropdown);
 *  - the dial code lives INSIDE the editable value, so deleting or editing
 *    "+250" re-detects the country from what remains (paste "+254712345678"
 *    and the picker flips to Kenya);
 *  - validates the national number against the country's numbering plan
 *    (lengths from lib/phone/phoneKit) with live hints and a ✓/✕ state;
 *  - pasting a trunk-prefixed national number ("0788…") strips the 0.
 *
 * The parent receives every representation via onChange and submits
 * whatever its backend consumer expects (national0 / e164 / digits) —
 * this component never changes wire formats by itself.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PHONE_COUNTRIES,
  type PhoneCountry,
  phoneCountryFor,
  onlyDigits,
  matchDialCode,
  validateNsn,
  formatNsn,
  nsnMaxLen,
} from '@/lib/phone/phoneKit';

export interface PhoneValue {
  iso2: string | null;
  dial: string | null;
  nsn: string;
  e164: string | null;
  /**
   * International digits WITHOUT '+', e.g. "250788123456" — the canonical
   * wire format for this platform: every backend consumer (PawaPay,
   * XentriPay, Pesapal, SMS/OTP store, phone-prefix country detection)
   * normalizes it correctly, per the backend format audit.
   */
  digits: string;
  /** Trunk-prefixed national digits, e.g. "0788123456" — the legacy wire format. */
  national0: string;
  isValid: boolean;
}

interface InternationalPhoneInputProps {
  /** Detected country (usePaymentCountry etc.); applied until the user overrides. */
  defaultIso2?: string | null;
  /** Optional initial national digits (e.g. editing a saved profile phone). */
  initialNsn?: string;
  onChange: (value: PhoneValue) => void;
  dark?: boolean;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

function buildValue(country: PhoneCountry | null, nsn: string): PhoneValue {
  const { isValid } = validateNsn(country, nsn);
  return {
    iso2: country?.iso2 ?? null,
    dial: country?.dial ?? null,
    nsn,
    e164: country && nsn ? `+${country.dial}${nsn}` : null,
    digits: country && nsn ? `${country.dial}${nsn}` : nsn,
    national0: country ? `${country.trunkPrefix ?? ''}${nsn}` : nsn,
    isValid: !!country && isValid,
  };
}

export default function InternationalPhoneInput({
  defaultIso2,
  initialNsn = '',
  onChange,
  dark = false,
  disabled = false,
  id,
  ariaLabel = 'Phone number',
}: InternationalPhoneInputProps) {
  const [country, setCountry] = useState<PhoneCountry>(
    () => phoneCountryFor(defaultIso2) ?? PHONE_COUNTRIES[0]
  );
  const [nsn, setNsn] = useState(() => onlyDigits(initialNsn));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userTouched = useRef(false);

  // Follow late-arriving geo detection until the user interacts.
  useEffect(() => {
    if (userTouched.current) return;
    const detected = phoneCountryFor(defaultIso2);
    if (detected && detected.iso2 !== country.iso2) setCountry(detected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultIso2]);

  const emit = useCallback(
    (c: PhoneCountry, n: string) => onChange(buildValue(c, n)),
    [onChange]
  );

  useEffect(() => {
    emit(country, nsn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, nsn]);

  const handleInput = (raw: string) => {
    userTouched.current = true;
    let digits = onlyDigits(raw);
    // The dial code is part of the visible value; whatever leading digits
    // remain decide the country. Editing/deleting "+250" therefore flips
    // the picker to whichever plan the remaining prefix matches.
    let next = country;
    const m = matchDialCode(digits, country.iso2);
    if (m) {
      next = m;
      digits = digits.slice(m.dial.length);
    }
    if (next.trunkPrefix && digits.startsWith(next.trunkPrefix)) {
      digits = digits.slice(next.trunkPrefix.length);
    }
    const capped = digits.slice(0, nsnMaxLen(next) + 2);
    if (next.iso2 !== country.iso2) setCountry(next);
    setNsn(capped);
  };

  const pickCountry = (c: PhoneCountry) => {
    userTouched.current = true;
    setCountry(c);
    setNsn((prev) => prev.slice(0, nsnMaxLen(c)));
    setOpen(false);
    inputRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const { isValid, hint } = validateNsn(country, nsn);
  const maxLen = nsnMaxLen(country);
  const showInvalid = nsn.length > 0 && !isValid && nsn.length >= maxLen;
  const displayValue = `+${country.dial}${nsn ? ' ' + formatNsn(country, nsn) : ' '}`;
  const exampleNsn = useMemo(
    () => formatNsn(country, '7'.padEnd(country.nsnLengths[0] ?? 9, '8')),
    [country]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || `+${c.dial}`.includes(q) || c.iso2.toLowerCase() === q
    );
  }, [query]);

  return (
    <div ref={rootRef} className={`ckph${dark ? ' ckph--dark' : ''}`}>
      <div
        className={`ckph-row${isValid && nsn ? ' is-valid' : ''}${showInvalid ? ' is-invalid' : ''}`}
      >
        <button
          type="button"
          className="ckph-country"
          onClick={() => !disabled && setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Country: ${country.name} (+${country.dial})`}
          disabled={disabled}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`} alt="" />
          <span className="ckph-dial">+{country.dial}</span>
          <span className={`ckph-chev${open ? ' is-open' : ''}`}>▾</span>
        </button>
        <input
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-label={ariaLabel}
          value={displayValue}
          onChange={(e) => handleInput(e.target.value)}
          disabled={disabled}
        />
        {nsn.length > 0 && (
          <span className={`ckph-state${isValid ? ' ok' : showInvalid ? ' err' : ''}`} aria-hidden="true">
            {isValid ? '✓' : showInvalid ? '✕' : ''}
          </span>
        )}
      </div>
      <div
        className={`ckph-hint${showInvalid ? ' err' : isValid && nsn ? ' ok' : ''}`}
        role={showInvalid ? 'alert' : undefined}
      >
        {nsn.length === 0
          ? `e.g. +${country.dial} ${exampleNsn}`
          : isValid
            ? `${country.name} · looks good`
            : hint || `${country.name} · ${nsn.length}/${maxLen} digits`}
      </div>

      {open && (
        <div className="ckph-menu" role="listbox" aria-label="Choose country">
          <input
            className="ckph-search"
            placeholder="Search country or code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="ckph-list">
            {filtered.map((c) => (
              <button
                key={c.iso2}
                type="button"
                role="option"
                aria-selected={c.iso2 === country.iso2}
                className={`ckph-item${c.iso2 === country.iso2 ? ' sel' : ''}`}
                onClick={() => pickCountry(c)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/w40/${c.iso2.toLowerCase()}.png`} alt="" />
                <span>{c.name}</span>
                <span className="ckph-item-dial">+{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="ckph-empty">No matches</div>}
          </div>
        </div>
      )}

      <style jsx>{`
        .ckph { position: relative; }
        .ckph-row {
          display: flex; align-items: stretch;
          border: 1.5px solid #d7dbe3; border-radius: 12px; background: #fff;
          transition: border-color 0.18s, box-shadow 0.18s; position: relative;
        }
        .ckph--dark .ckph-row { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.2); }
        .ckph-row:focus-within { border-color: #083a85; box-shadow: 0 0 0 3px rgba(8,58,133,0.12); }
        .ckph-row.is-invalid { border-color: #dc2626; }
        .ckph-row.is-invalid:focus-within { box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
        .ckph-row.is-valid { border-color: #059669; }
        .ckph-country {
          display: flex; align-items: center; gap: 7px; padding: 0 10px 0 12px;
          cursor: pointer; border: 0; background: transparent;
          border-right: 1.5px solid #e6e9ef; font-size: 13px; font-weight: 700;
          color: #0f172a; white-space: nowrap;
        }
        .ckph-country:disabled { cursor: not-allowed; opacity: 0.6; }
        .ckph--dark .ckph-country { color: #fff; border-right-color: rgba(255,255,255,0.15); }
        .ckph-country img { width: 20px; height: 14px; object-fit: cover; border-radius: 2.5px; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); }
        .ckph-chev { font-size: 9px; color: #94a3b8; transition: transform 0.18s; }
        .ckph-chev.is-open { transform: rotate(180deg); }
        .ckph-row input {
          flex: 1; border: 0; outline: 0; background: transparent;
          padding: 12px 30px 12px 12px; font-size: 14.5px; color: #0f172a;
          font-variant-numeric: tabular-nums; letter-spacing: 0.02em; min-width: 0;
        }
        .ckph--dark .ckph-row input { color: #fff; }
        .ckph-state {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          font-size: 14px; pointer-events: none;
        }
        .ckph-state.ok { color: #059669; }
        .ckph-state.err { color: #dc2626; }
        .ckph-hint { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 11.5px; min-height: 16px; color: #94a3b8; }
        .ckph-hint.err { color: #dc2626; }
        .ckph-hint.ok { color: #059669; }
        .ckph-menu {
          position: absolute; top: calc(100% - 14px); left: 0; width: 100%;
          max-height: 264px; display: flex; flex-direction: column; z-index: 80;
          background: #fff; border: 1.5px solid #e2e6ee; border-radius: 14px;
          box-shadow: 0 18px 50px rgba(15,23,42,0.18); padding: 6px;
        }
        .ckph--dark .ckph-menu { background: #1a1f2c; border-color: rgba(255,255,255,0.15); }
        .ckph-search {
          width: 100%; border: 1px solid #e2e6ee; border-radius: 9px;
          padding: 8px 10px; font-size: 12.5px; margin-bottom: 6px; outline: 0;
          background: #fff; color: #0f172a; flex: none;
        }
        .ckph-search:focus { border-color: #083a85; }
        .ckph--dark .ckph-search { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); color: #fff; }
        .ckph-list { overflow-y: auto; }
        .ckph-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          border: 0; background: transparent; padding: 8px 10px;
          border-radius: 9px; cursor: pointer; font-size: 13px; color: #0f172a; text-align: left;
        }
        .ckph--dark .ckph-item { color: #e7eaf2; }
        .ckph-item:hover { background: #f1f5fb; }
        .ckph--dark .ckph-item:hover { background: rgba(255,255,255,0.08); }
        .ckph-item.sel { background: #eff6ff; }
        .ckph--dark .ckph-item.sel { background: rgba(8,58,133,0.5); }
        .ckph-item img { width: 20px; height: 14px; border-radius: 2.5px; object-fit: cover; }
        .ckph-item-dial { margin-left: auto; color: #94a3b8; font-weight: 600; font-size: 12px; }
        .ckph-empty { padding: 14px; text-align: center; font-size: 12.5px; color: #94a3b8; }
      `}</style>
    </div>
  );
}
