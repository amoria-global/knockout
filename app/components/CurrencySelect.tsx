'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import CurrencyFlag from './CurrencyFlag';


export type CurrencyOption = { value: string; code: string; name?: string };

/**
 * A currency dropdown whose rows carry the currency's flag. A native select cannot draw an image inside an option, so this
 * is a button and a listbox: Escape and a click outside close it, arrow keys move, Enter picks. It keeps a hidden input in
 * the form so `required` still blocks a submit with nothing picked.
 */
export default function CurrencySelect({
  value, onChange, options, placeholder = 'Pick a currency', id, disabled = false, required = false, style,
  menuBg = '#fff', menuHover = '#f3f4f6', menuText = '#111827', menuSub = '#6b7280', menuBorder = '#d1d5db',
}: {
  value: string;
  onChange: (value: string) => void;
  options: CurrencyOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  /** The trigger's own style, so it matches the neighbouring inputs. */
  style?: CSSProperties;
  /** The menu's colours, so it matches a dark or light surface. */
  menuBg?: string; menuHover?: string; menuText?: string; menuSub?: string; menuBorder?: string;
}) {
  const colors = { bgSecondary: menuBg, bgTertiary: menuHover, textPrimary: menuText, textSecondary: menuSub, borderPrimary: menuBorder };
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const pick = (o: CurrencyOption) => { onChange(o.value); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(Math.max(0, options.findIndex((o) => o.value === value))); return; }
      setActive((i) => Math.min(options.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1))));
    } else if ((e.key === 'Enter' || e.key === ' ') && open && options[active]) {
      e.preventDefault();
      pick(options[active]);
    }
  };

  return (
    <div ref={root} style={{ position: 'relative' }} onKeyDown={onKey}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { setOpen((v) => !v); setActive(Math.max(0, options.findIndex((o) => o.value === value))); }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
      >
        {selected ? <CurrencyFlag code={selected.code} /> : null}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected ? selected.code : placeholder}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {required ? <input tabIndex={-1} aria-hidden="true" required value={value} onChange={() => undefined} style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }} /> : null}
      {open ? (
        <ul role="listbox" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, margin: 0, padding: 4, listStyle: 'none', maxHeight: 260, overflowY: 'auto', background: colors.bgSecondary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 10, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
          {options.map((o, i) => (
            <li key={o.value} role="option" aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)} onClick={() => pick(o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem', fontWeight: o.value === value ? 600 : 400, background: i === active || o.value === value ? colors.bgTertiary : 'transparent' }}>
              <CurrencyFlag code={o.code} />
              <span style={{ fontWeight: 600 }}>{o.code}</span>
              {o.name ? <span style={{ fontSize: '0.78rem', color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
