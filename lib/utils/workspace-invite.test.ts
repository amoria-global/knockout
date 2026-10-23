import { describe, it, expect } from 'vitest';
import { planForInvite, workspaceInviteIdFromUrl, type WorkspaceInvitePreview } from './workspace-invite';

/**
 * A workspace invitation link followed through sign-in and sign-up. These pin the two decisions the auth screen makes:
 * which invitation id is in the link it was sent here with, and which door (sign-up, sign-in or neither) to open first.
 */
const ID = '3f2a9c1e-5b7d-4c8e-9a10-0b1c2d3e4f50';
const LINK = `https://dashboard.connekyt.com/user/photographer/collaborate?tab=workspace&invite=${ID}`;

describe('workspaceInviteIdFromUrl', () => {
  it('reads the id from the invitation link', () => {
    expect(workspaceInviteIdFromUrl(LINK)).toBe(ID);
  });
  it('normalises case and ignores a trailing slash', () => {
    expect(workspaceInviteIdFromUrl(`https://dashboard.connekyt.com/user/photographer/collaborate/?invite=${ID.toUpperCase()}`)).toBe(ID);
  });
  it('is null for any other destination, including an album invite and a missing or malformed id', () => {
    expect(workspaceInviteIdFromUrl(null)).toBeNull();
    expect(workspaceInviteIdFromUrl('')).toBeNull();
    expect(workspaceInviteIdFromUrl('https://dashboard.connekyt.com/user/photographer/collaborate/join/Dl-BJR1AHVfgoAYoTKzJyFM9oP0C3WfF')).toBeNull();
    expect(workspaceInviteIdFromUrl('https://dashboard.connekyt.com/user/photographer/collaborate?tab=workspace')).toBeNull();
    expect(workspaceInviteIdFromUrl('https://dashboard.connekyt.com/user/photographer/collaborate?invite=not-a-uuid')).toBeNull();
    expect(workspaceInviteIdFromUrl(`https://dashboard.connekyt.com/user/photographer/events?invite=${ID}`)).toBeNull();
    expect(workspaceInviteIdFromUrl('not a url')).toBeNull();
  });
});

const open = (o: Partial<WorkspaceInvitePreview>): WorkspaceInvitePreview => ({
  found: true, open: true, status: 'PENDING', ownerName: 'Aline Uwase', email: 'New.Person@Example.com', account: 'none', ...o,
});

describe('planForInvite', () => {
  it('does nothing when the preview could not be read, so the page stays ordinary sign-in and sign-up', () => {
    expect(planForInvite(null, ID)).toBeNull();
    expect(planForInvite(undefined, ID)).toBeNull();
  });

  it('sends an address with no account to sign up as a photographer, email fixed, with no way to sign in', () => {
    const plan = planForInvite(open({}), ID)!;
    expect(plan.view).toBe('signup');
    expect(plan.requireSignup).toBe(true);
    expect(plan.lockEmail).toBe(true);
    expect(plan.email).toBe('new.person@example.com');
    expect(plan.notice.tone).toBe('info');
    expect(plan.notice.text).toContain('Aline Uwase');
    expect(plan.notice.text).toContain('Create your photographer account');
    expect(plan.notice.text).toContain('new.person@example.com');
  });

  it('sends an address that already has a photographer account to sign in, email filled in', () => {
    const plan = planForInvite(open({ account: 'photographer' }), ID)!;
    expect(plan.view).toBe('login');
    expect(plan.requireSignup).toBe(false);
    expect(plan.lockEmail).toBe(false);
    expect(plan.email).toBe('new.person@example.com');
    expect(plan.notice.text).toContain('Sign in with new.person@example.com');
  });

  it('says plainly that an address with a non-photographer account cannot join, and opens neither door', () => {
    const plan = planForInvite(open({ account: 'other' }), ID)!;
    expect(plan.view).toBe('none');
    expect(plan.notice.tone).toBe('error');
    expect(plan.notice.text).toContain('not a photographer');
    expect(plan.requireSignup).toBe(false);
  });

  it.each([
    ['unknown', { found: false, open: false }],
    ['answered or cancelled', { found: true, open: false, status: 'CANCELLED' }],
    ['expired', { found: true, open: false, status: 'EXPIRED' }],
  ])('says an invitation that is %s is no longer open and changes nothing else', (_n, p) => {
    const plan = planForInvite(p as WorkspaceInvitePreview, ID)!;
    expect(plan.view).toBe('none');
    expect(plan.notice.tone).toBe('warn');
    expect(plan.notice.text).toContain('no longer open');
    expect(plan.requireSignup).toBe(false);
    expect(plan.email).toBe('');
  });

  it('does not lock an email it does not have', () => {
    const plan = planForInvite(open({ email: undefined }), ID)!;
    expect(plan.lockEmail).toBe(false);
  });

  it('has a different key for each outcome so the screen applies each plan once', () => {
    const keys = new Set([
      planForInvite(open({}), ID)!.key,
      planForInvite(open({ account: 'photographer' }), ID)!.key,
      planForInvite(open({ account: 'other' }), ID)!.key,
      planForInvite({ found: false, open: false }, ID)!.key,
    ]);
    expect(keys.size).toBe(4);
  });
});
