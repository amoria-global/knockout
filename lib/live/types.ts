/**
 * Wishes: short messages or clips viewers leave for an event. Mirrors the backend's EventWishDTO and the mobile app's
 * features/wishes/types.ts, so the two platforms read and write the same shapes.
 */
export type WishVisibility = 'public' | 'private';
export type WishStatus = 'pending' | 'approved' | 'hidden';
export type WishType = 'text' | 'video';

export type Wish = {
  id: string;
  type: WishType;
  authorName: string;
  message: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  /** Whole seconds, when the backend knows it. */
  durationSeconds?: number;
  visibility: WishVisibility;
  status: WishStatus;
  createdAt?: string;
  /** Sent from this device, so it can be hidden by its sender. */
  mine: boolean;
};

export type WishPage = { items: Wish[]; page: number; totalPages: number; total: number; allowWishInvites?: boolean };

export type FeedState = 'loading' | 'error' | 'ready';
export type LiveTab = 'live' | 'wishes';
export type EventAccess = 'free' | 'ticket';

export const MAX_WISH_TEXT = 500;
export const MAX_WISH_VIDEO_SECONDS = 60;

export const PRIVACY_NOTE_TEXT =
  'You choose before sending. Public wishes appear in the feed once the host approves them. Private wishes are seen only by the host.';
