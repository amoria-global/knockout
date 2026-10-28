/**
 * The rules of the wish composer, apart from any screen. Same rules as the mobile app (features/wishes/composer.ts).
 * Visibility has no default: the sender picks public or private before sending.
 */
import { MAX_WISH_TEXT, MAX_WISH_VIDEO_SECONDS, type WishVisibility } from './types';

export type Identity = { name: string; email: string };

export type ComposerDraft = {
  kind: 'text' | 'video';
  name: string;
  email: string;
  message: string;
  visibility: WishVisibility | null;
  /** Video only: the clip's length in seconds, null while unknown, and whether a clip is attached. */
  durationSeconds: number | null;
  hasVideo: boolean;
};

export type ComposerErrors = Partial<Record<'name' | 'email' | 'message' | 'visibility' | 'video', string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: string) => EMAIL.test(v.trim());

/** `account` is set for a signed-in person, who is never asked for a name or email. */
export function validateDraft(draft: ComposerDraft, account: Identity | null): ComposerErrors {
  const errors: ComposerErrors = {};
  if (!account) {
    if (!draft.name.trim()) errors.name = 'Please enter your name.';
    if (!isEmail(draft.email)) errors.email = 'Please enter a valid email.';
  }
  if (draft.kind === 'text') {
    if (!draft.message.trim()) errors.message = 'Please write your message.';
    else if (draft.message.length > MAX_WISH_TEXT) errors.message = `Keep it under ${MAX_WISH_TEXT} characters.`;
  } else {
    if (!draft.hasVideo) errors.video = 'Record or choose a video first.';
    else if (draft.durationSeconds != null && draft.durationSeconds > MAX_WISH_VIDEO_SECONDS) {
      errors.video = `A video wish can be at most ${MAX_WISH_VIDEO_SECONDS} seconds.`;
    }
    if (draft.message.length > MAX_WISH_TEXT) errors.message = `Keep it under ${MAX_WISH_TEXT} characters.`;
  }
  if (!draft.visibility) errors.visibility = 'Choose who can see your wish.';
  return errors;
}

export const canSend = (errors: ComposerErrors): boolean => Object.keys(errors).length === 0;

/** 0:07, 1:00. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const remainingChars = (message: string): number => MAX_WISH_TEXT - message.length;

/** What the sender is told once the wish is in, by the choice they made. */
export function sentNotice(visibility: WishVisibility): string {
  return visibility === 'public'
    ? 'Thank you. Your wish will appear in the feed once the host approves it.'
    : 'Thank you. Your wish was sent privately to the host.';
}

/** Server refusals in the same words as the mobile app. */
export function wishErrorMessage(raw: string | undefined, kind: 'text' | 'video'): string {
  const msg = (raw ?? '').toLowerCase();
  if (msg.includes('closed for this event') || msg.includes('only allowed before')) return 'Wishes are closed for this event.';
  if (msg.includes('rate') || msg.includes('limit')) return 'You are sending wishes too quickly. Please wait a moment.';
  if (msg.includes('restricted') || msg.includes('blocked')) return 'Your message contains restricted content (emails, phone numbers, or links).';
  if (kind === 'video' && (msg.includes('size') || msg.includes('large'))) return 'Video upload failed. Please try a shorter clip.';
  return raw || (kind === 'video' ? 'Could not send your video wish. Please try again.' : 'Could not send your wish. Please try again.');
}
