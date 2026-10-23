/**
 * A workspace invitation link, followed through sign-in and sign-up.
 *
 * Another photographer invites an email address to work in their workspace and the email carries
 * `https://dashboard.connekyt.com/user/photographer/collaborate?tab=workspace&invite=<invitation id>`. A signed-out
 * visitor is bounced here with that link as `returnUrl` (see post-auth-destination.ts), which keeps it through the
 * login/signup toggle, the one-time code and two-factor. This file reads the invitation id out of that link and
 * decides what the auth screen should do about it:
 *
 *  - the invited address has no account: show sign-up, as a photographer, with that address filled in and fixed, and
 *    no way to switch to sign-in (there is no account to sign in to);
 *  - it already has a photographer account: show sign-in with the address filled in;
 *  - it belongs to an account that is not a photographer: say plainly that it cannot join;
 *  - the invitation is gone (answered, cancelled, expired, never existed): say so and change nothing else.
 *
 * Nothing here lets anyone in. The invitation can only be answered by an account whose own, verified email is the
 * invited address, and the dashboard says so when it is not. This only makes the right door the first one they see.
 */

export interface WorkspaceInvitePreview {
  found: boolean;
  open: boolean;
  status?: string;
  ownerName?: string;
  email?: string;
  account?: 'none' | 'photographer' | 'other';
}

export type InviteTone = 'info' | 'warn' | 'error';

export interface InvitePlan {
  /** Changes whenever the plan does, so an effect can apply it once. */
  key: string;
  /** Which door to show first; `none` leaves whatever the visitor chose. */
  view: 'signup' | 'login' | 'none';
  email: string;
  ownerName: string;
  /** The sign-up email is fixed to the invited address. */
  lockEmail: boolean;
  /** There is no account yet, so signing in is not offered. */
  requireSignup: boolean;
  notice: { tone: InviteTone; text: string };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The invitation id in a post-auth destination, or null when the destination is not a workspace invitation link. */
export function workspaceInviteIdFromUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.pathname.replace(/\/+$/, '') !== '/user/photographer/collaborate') return null;
    const id = u.searchParams.get('invite');
    return id && UUID.test(id.trim()) ? id.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

/** What the auth screen should do for this invitation. Null when the preview could not be read: change nothing. */
export function planForInvite(preview: WorkspaceInvitePreview | null | undefined, id: string): InvitePlan | null {
  if (!preview) return null;
  const owner = preview.ownerName?.trim() || 'A photographer';
  const email = preview.email?.trim().toLowerCase() || '';

  if (!preview.found || !preview.open) {
    return {
      key: `${id}:closed`, view: 'none', email: '', ownerName: '', lockEmail: false, requireSignup: false,
      notice: { tone: 'warn', text: 'This workspace invitation is no longer open. You can still sign in or create an account.' },
    };
  }
  if (preview.account === 'other') {
    return {
      key: `${id}:other`, view: 'none', email, ownerName: owner, lockEmail: false, requireSignup: false,
      notice: { tone: 'error', text: `${email || 'That email'} belongs to an account that is not a photographer, so it cannot join ${owner}'s workspace.` },
    };
  }
  if (preview.account === 'photographer') {
    return {
      key: `${id}:login`, view: 'login', email, ownerName: owner, lockEmail: false, requireSignup: false,
      notice: { tone: 'info', text: `${owner} invited you to work in their workspace. Sign in with ${email} to continue.` },
    };
  }
  return {
    key: `${id}:signup`, view: 'signup', email, ownerName: owner, lockEmail: !!email, requireSignup: true,
    notice: { tone: 'info', text: `${owner} invited you to work in their workspace. Create your photographer account with ${email} to continue.` },
  };
}
