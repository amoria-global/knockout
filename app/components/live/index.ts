/**
 * The live event page, one component per numbered section (docs/LIVE_EVENT_STRUCTURE.md). The mobile app builds the same
 * sections under the same names and props in src/features/live/sections.
 *
 *  1 EventHeader   2 LivePlayer (AccessChip here; the player and its controls are the page's own)   3 EventInfo
 *  4 EventTabs     5 SendWishes   6 InviteOthers   7 PrivacyNote   8 WishesFeed (viewer) / ModerationQueue (host)
 *  9 the page's live chat, reactions and gifts
 */
export { EventHeader } from './EventHeader';
export { EventInfo, AccessChip, accessLabel } from './EventInfo';
export { EventTabs } from './EventTabs';
export { SendWishes } from './SendWishes';
export { WishComposer } from './WishComposer';
export { InviteOthers } from './InviteOthers';
export { PrivacyNote } from './PrivacyNote';
export { WishesFeed, WishVideoDialog } from './WishesFeed';
export { ModerationQueue } from './ModerationQueue';
export { LiveSectionsStyles } from './LiveSectionsStyles';
export { useWishFeed, useHostWishes } from './useWishes';
