'use client';

import { PRIVACY_NOTE_TEXT } from '@/lib/live/types';
import { Icon } from './icons';

/** Section 7: what public and private mean, before anything is sent. Same wording on mobile. */
export function PrivacyNote() {
  return (
    <p className="lv-privacy">
      <Icon name="shield" size={16} />
      <span>{PRIVACY_NOTE_TEXT}</span>
    </p>
  );
}
