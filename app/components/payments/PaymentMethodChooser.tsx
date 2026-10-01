'use client';

import React, { useEffect, useState } from 'react';

/** Logo for the grouped "Mobile Money" choice. */
export const MOMO_ICON = '/momo.jpeg';
/** Logo for the "Cards" choice. */
export const CARDS_ICON = '/cards.png';

export interface ChooserMethod {
  /** Selection id, untouched: "card" or the lowercased operator id ("mtn", "airtel", "mpesa", ...). */
  id: string;
  name: string;
  image: string;
  disabled?: boolean;
  /** Short note under the name when disabled (e.g. "Unavailable"). */
  disabledNote?: string;
}

interface Props {
  methods: ChooserMethod[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Match the host surface. */
  tone?: 'light' | 'dark';
  /** Selected ring / check colour. */
  accent?: string;
  /** Lock everything while a payment is in flight. */
  disabled?: boolean;
}

/**
 * Two-step payment method chooser. Every payment surface shows the same two
 * choices, "Mobile Money" and "Cards". Mobile Money opens the operators the
 * buyer's country supports (MTN, Airtel, M-Pesa, ...); Cards selects card
 * straight away.
 *
 * Presentation only. The ids handed to onSelect are the same ids the flat
 * tile grids used ("card", "mtn", "airtel", ...), so each host's payment
 * handler and backend payload are unchanged.
 */
export const PaymentMethodChooser: React.FC<Props> = ({
  methods, selectedId, onSelect, tone = 'light', accent = '#083A85', disabled = false,
}) => {
  const operators = methods.filter(m => m.id !== 'card');
  const card = methods.find(m => m.id === 'card') ?? null;
  const selectedOperator = operators.find(m => m.id === selectedId) ?? null;
  const cardSelected = selectedId === 'card';

  const [open, setOpen] = useState<boolean>(!!selectedOperator);
  // A selection made elsewhere (host reset, deep link) keeps the panel in step.
  useEffect(() => {
    if (selectedOperator) setOpen(true);
    else if (cardSelected) setOpen(false);
  }, [selectedOperator, cardSelected]);

  const dark = tone === 'dark';
  const T = dark ? {
    text: '#ffffff', sub: 'rgba(255,255,255,0.6)', tile: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.14)', panel: 'rgba(255,255,255,0.04)', logoBg: '#ffffff',
  } : {
    text: '#0f1f3d', sub: '#5b6b85', tile: '#ffffff',
    border: 'rgba(8,58,133,0.16)', panel: 'rgba(8,58,133,0.035)', logoBg: '#ffffff',
  };

  const momoDisabled = disabled || operators.length === 0 || operators.every(o => o.disabled);
  const cardDisabled = disabled || !card || !!card.disabled;
  const momoActive = open || !!selectedOperator;

  const mainTile = (active: boolean, off: boolean): React.CSSProperties => ({
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
    padding: '11px 12px', borderRadius: 14, width: '100%', minWidth: 0,
    background: active ? `${accent}14` : T.tile,
    border: active ? `2px solid ${accent}` : `1.5px solid ${T.border}`,
    cursor: off ? 'not-allowed' : 'pointer',
    opacity: off ? 0.45 : 1,
    transition: 'border-color 160ms ease, background 160ms ease, box-shadow 160ms ease',
    boxShadow: active ? `0 6px 18px -10px ${accent}` : 'none',
    color: T.text, font: 'inherit',
  });

  const logoBox = (size: number): React.CSSProperties => ({
    width: size, height: size, borderRadius: 11, overflow: 'hidden', flexShrink: 0,
    background: T.logoBg, border: `1px solid ${T.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  const onLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallback === '1') return;
    img.dataset.fallback = '1';
    img.src = '/mobile-money.svg';
  };

  if (methods.length === 0) {
    return <p style={{ margin: 0, fontSize: 13, color: T.sub }}>No payment methods are available right now.</p>;
  }

  return (
    <div>
      <style>{`
        @keyframes pmc-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .pmc-panel { animation: none !important; } }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {operators.length > 0 && (
          <button
            type="button"
            aria-expanded={momoActive}
            aria-controls="pmc-operators"
            disabled={momoDisabled}
            onClick={() => setOpen(o => !o)}
            style={mainTile(momoActive, momoDisabled)}
          >
            <span style={logoBox(44)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MOMO_ICON} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={onLogoError} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, lineHeight: 1.2 }}>Mobile Money</span>
              <span style={{ display: 'block', fontSize: 11, color: T.sub, marginTop: 2, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedOperator ? selectedOperator.name : momoDisabled && !disabled ? 'Unavailable' : 'Choose your network'}
              </span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              style={{ marginLeft: 'auto', flexShrink: 0, color: T.sub, transform: momoActive ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        {card && (
          <button
            type="button"
            aria-pressed={cardSelected}
            disabled={cardDisabled}
            onClick={() => { setOpen(false); onSelect('card'); }}
            style={mainTile(cardSelected, cardDisabled)}
          >
            <span style={logoBox(44)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={CARDS_ICON} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} onError={onLogoError} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, lineHeight: 1.2 }}>Cards</span>
              <span style={{ display: 'block', fontSize: 11, color: T.sub, marginTop: 2, lineHeight: 1.25 }}>
                {cardDisabled && !disabled ? (card?.disabledNote ?? 'Unavailable') : 'Visa & Mastercard'}
              </span>
            </span>
            {cardSelected && (
              <span style={{ marginLeft: 'auto', flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
            )}
          </button>
        )}
      </div>

      {momoActive && operators.length > 0 && (
        <div
          id="pmc-operators"
          className="pmc-panel"
          role="radiogroup"
          aria-label="Mobile money network"
          style={{
            marginTop: 8, padding: 8, borderRadius: 14, background: T.panel, border: `1px solid ${T.border}`,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8,
            animation: 'pmc-in 160ms ease-out',
          }}
        >
          {operators.map(op => {
            const active = selectedId === op.id;
            const off = disabled || !!op.disabled;
            return (
              <button
                key={op.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={off}
                onClick={() => onSelect(op.id)}
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  padding: '12px 6px 10px', borderRadius: 12, font: 'inherit',
                  background: active ? `${accent}14` : T.tile,
                  border: active ? `2px solid ${accent}` : `1px solid ${T.border}`,
                  cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.45 : 1,
                  color: active ? T.text : T.sub, transition: 'all 160ms ease',
                }}
              >
                {active && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 15, height: 15, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                )}
                <span style={logoBox(36)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={op.image} alt="" onError={onLogoError} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>
                  {op.name}
                  {op.disabled && <span style={{ display: 'block', fontSize: 9, color: '#ef4444', marginTop: 2, fontWeight: 700 }}>{op.disabledNote ?? 'Unavailable'}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
