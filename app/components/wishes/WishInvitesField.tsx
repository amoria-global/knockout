'use client';

import { useId } from 'react';
import {
  WISH_INVITES_ERROR_ID,
  WISH_INVITES_FIELD_ID,
  WISH_INVITES_HELPER,
  WISH_INVITES_LABEL,
  WISH_INVITES_QUESTION,
} from '@/lib/wishes/wishInvites';

/**
 * The required "Wish invites" field: a label, the question, an Enable | Disable choice with nothing pre-selected on a new
 * event, and the helper. A native radio group, so arrow keys and screen readers work as expected; the error is linked to
 * the group with aria-describedby. One component, one set of words, for every role's create and edit form (the mobile app
 * has the same field).
 */
export function WishInvitesField({ value, onChange, error, disabled, name, light }: {
  value: boolean | null;
  onChange: (next: boolean) => void;
  error?: string | null;
  disabled?: boolean;
  /** Distinguishes two fields on one page. */
  name?: string;
  /** For a light surface such as the booking wizard. */
  light?: boolean;
}) {
  const uid = useId();
  const group = name ?? `wish-invites-${uid}`;
  const describedBy = error ? WISH_INVITES_ERROR_ID : `${WISH_INVITES_FIELD_ID}-helper`;
  const radio = (label: string, on: boolean) => (
    <label className={`wf-opt ${value === on ? (on ? 'is-on' : 'is-off') : ''}`}>
      <input type="radio" name={group} checked={value === on} onChange={() => onChange(on)} disabled={disabled} />
      {value === on ? <i className="bi bi-check-lg" aria-hidden="true" /> : null}
      <span>{label}</span>
    </label>
  );
  return (
    <fieldset id={WISH_INVITES_FIELD_ID} className={`wf-card ${light ? 'wf-light' : ''} ${error ? 'has-error' : ''}`} aria-required="true" aria-invalid={error ? true : undefined} aria-describedby={describedBy}>
      <legend className="wf-legend">{WISH_INVITES_LABEL}<span className="wf-req" aria-hidden="true"> *</span></legend>
      <div className="wf-inner">
        <p className="wf-question">{WISH_INVITES_QUESTION}</p>
        <div className="wf-well">
          {radio('Enable', true)}
          {radio('Disable', false)}
        </div>
        {error ? (
          <p id={WISH_INVITES_ERROR_ID} className="wf-err" role="alert"><i className="bi bi-exclamation-circle" aria-hidden="true" /> {error}</p>
        ) : (
          <p id={`${WISH_INVITES_FIELD_ID}-helper`} className="wf-helper">{WISH_INVITES_HELPER}</p>
        )}
      </div>
    </fieldset>
  );
}

/** Brings the field into view and focuses its group when it blocks a submit. */
export function focusWishInvitesField() {
  const el = document.getElementById(WISH_INVITES_FIELD_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (el.querySelector('input[type="radio"]') as HTMLInputElement | null)?.focus({ preventScroll: true });
}
