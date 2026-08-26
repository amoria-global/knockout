'use client';

import React, { useMemo, useState } from 'react';
import { SUPPORTED_COUNTRIES } from '@/lib/payments/supportedCountries';

interface CountryPickerProps {
  value: string | null;
  onChange: (iso2: string) => void;
  /** Title shown above the list. Defaults to "Choose your country". */
  title?: string;
  /** Optional helper line ("We couldn't detect your country…"). */
  hint?: string;
  /** Match the host surface (XentriPayModal passes its darkMode). */
  dark?: boolean;
}

/**
 * Searchable list of supported countries, in the payment sheet's
 * "Receipt" language: token-driven light/dark, one readable row per
 * country (flag, name, dial code), a real search field, selected ring.
 *
 * Used as the fallback when IP-detection finds no PawaPay coverage and
 * as the "change country" affordance inside the payment modal. Renders
 * inline (not a modal) so it composes inside existing overlays.
 */
export const CountryPicker: React.FC<CountryPickerProps> = ({ value, onChange, title, hint, dark = false }) => {
  const [query, setQuery] = useState('');

  const T = dark ? {
    text: '#fff',
    sub: 'rgba(255,255,255,0.58)',
    faint: 'rgba(255,255,255,0.4)',
    field: 'rgba(255,255,255,0.06)',
    fieldBorder: 'rgba(255,255,255,0.16)',
    row: 'rgba(255,255,255,0.04)',
    rowBorder: 'rgba(255,255,255,0.1)',
    rowOnBg: 'rgba(3,150,156,0.16)',
  } : {
    text: '#0f1f3d',
    sub: '#5b6b85',
    faint: '#93a0b5',
    field: '#f6f8fb',
    fieldBorder: '#dbe2ec',
    row: '#f8fafc',
    rowBorder: '#e8edf4',
    rowOnBg: 'rgba(3,150,156,0.09)',
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUPPORTED_COUNTRIES;
    return SUPPORTED_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.iso2.toLowerCase().includes(q) ||
      c.dialCode.includes(q)
    );
  }, [query]);

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h4 style={{ fontSize: 13.5, fontWeight: 800, color: T.text, margin: '0 0 4px' }}>{title}</h4>
      )}
      {hint && (
        <p style={{ fontSize: 12, color: T.sub, margin: '0 0 10px', lineHeight: 1.5 }}>{hint}</p>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: T.field, border: `1px solid ${T.fieldBorder}`,
        borderRadius: 12, padding: '0 12px', marginBottom: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: T.faint, flexShrink: 0 }} aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search country or code…"
          aria-label="Search country"
          className="ckcp-search"
          style={{
            flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent',
            padding: '11px 0', fontSize: 13.5, color: T.text, fontWeight: 600,
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            style={{ border: 0, background: 'transparent', color: T.faint, cursor: 'pointer', fontSize: 14, padding: 2 }}
          >×</button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto', paddingRight: 2 }}>
        {filtered.map(c => {
          const selected = value?.toUpperCase() === c.iso2;
          return (
            <button
              key={c.iso2}
              type="button"
              onClick={() => onChange(c.iso2)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                background: selected ? T.rowOnBg : T.row,
                border: selected ? '2px solid #03969c' : `1px solid ${T.rowBorder}`,
                transition: 'border-color 140ms ease, background 140ms ease',
              }}
            >
              <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{c.flag}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13.5, fontWeight: 700, color: T.text }}>
                {c.name}
              </span>
              <span style={{ color: T.faint, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{c.dialCode}</span>
              {selected && (
                <span style={{ width: 15, height: 15, borderRadius: '50%', background: '#03969c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: T.faint, padding: 18, fontSize: 12.5, margin: 0 }}>
            No matching countries
          </p>
        )}
      </div>
      <style>{`.ckcp-search::placeholder { color: ${dark ? 'rgba(255,255,255,0.35)' : '#a6b1c2'}; }`}</style>
    </div>
  );
};
