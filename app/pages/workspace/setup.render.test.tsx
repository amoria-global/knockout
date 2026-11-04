import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The collaborator's first-visit screen over a fake server. The page shows what the server says about the link (who
 * invited them, the fixed email, whether an account already exists) and never decides whether a link is good.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let query = '';
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(query),
  useRouter: () => ({ push, replace: vi.fn() }),
}));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
const loginUser = vi.fn();
vi.mock('@/app/providers/AuthProvider', () => ({ useAuth: () => ({ login: loginUser }) }));
let signedIn = false;
vi.mock('@/lib/api/client', () => ({ getAuthToken: () => (signedIn ? 'jwt' : null) }));
const previewSetup = vi.fn();
const completeSetup = vi.fn();
const acceptWithToken = vi.fn();
vi.mock('@/lib/APIs/auth/workspace/route', () => ({
  previewSetup: (...a: unknown[]) => previewSetup(...a),
  completeSetup: (...a: unknown[]) => completeSetup(...a),
  acceptWithToken: (...a: unknown[]) => acceptWithToken(...a),
}));

import WorkspaceSetup from './setup';

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.clearAllMocks();
  signedIn = false;
  query = 'invite=11111111-1111-1111-1111-111111111111&t=secret';
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const mount = async () => {
  await act(async () => {
    root.render(<WorkspaceSetup />);
  });
};
const type = (id: string, value: string) => {
  const el = host.querySelector<HTMLInputElement>(`#${id}`)!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

describe('workspace setup page', () => {
  it('says the link is no longer valid when there is no link, and asks nothing of the server', async () => {
    query = '';
    await mount();
    expect(host.textContent).toContain('This link is no longer valid');
    expect(previewSetup).not.toHaveBeenCalled();
  });

  it('says the same for a link the server does not recognise', async () => {
    previewSetup.mockResolvedValue({ success: true, data: { found: false, open: false } });
    await mount();
    expect(host.textContent).toContain('This link is no longer valid');
    expect(host.querySelector('#ws-password')).toBeNull();
  });

  it('shows who invited them and the fixed email, with only a password and its confirmation', async () => {
    previewSetup.mockResolvedValue({ success: true, data: { found: true, open: true, ownerName: 'Eric N.', email: 'new@example.com', account: 'none' } });
    await mount();
    expect(host.textContent).toContain('Eric N. invited you to their workspace');
    const email = host.querySelector<HTMLInputElement>('#ws-email')!;
    expect(email.value).toBe('new@example.com');
    expect(email.readOnly).toBe(true);
    // No name, phone, role or profile fields.
    expect(host.querySelectorAll('input').length).toBe(3);
    expect(host.textContent).toContain('Open workspace');
  });

  it('keeps Open workspace off until the password is acceptable and both match', async () => {
    previewSetup.mockResolvedValue({ success: true, data: { found: true, open: true, ownerName: 'Eric N.', email: 'new@example.com', account: 'none' } });
    await mount();
    const button = () => host.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button().disabled).toBe(true);
    type('ws-password', 'short');
    type('ws-confirm', 'short');
    expect(button().disabled).toBe(true);
    type('ws-password', 'Sup3r$ecret!');
    type('ws-confirm', 'Different1!');
    expect(host.textContent).toContain('The two passwords do not match');
    expect(button().disabled).toBe(true);
    type('ws-confirm', 'Sup3r$ecret!');
    expect(button().disabled).toBe(false);
  });

  it('sends the secret and the password, then opens the only workspace on the dashboard', async () => {
    previewSetup.mockResolvedValue({ success: true, data: { found: true, open: true, ownerName: 'Eric N.', email: 'new@example.com', account: 'none' } });
    completeSetup.mockResolvedValue({ success: true, data: { token: 'jwt', customerId: 'c1', email: 'new@example.com', workspaces: [{ workspaceId: 'w1' }] } });
    const assign = vi.fn();
    Object.defineProperty(window, 'location', { value: { origin: 'https://connekyt.com', get href() { return ''; }, set href(v: string) { assign(v); } }, writable: true });
    await mount();
    type('ws-password', 'Sup3r$ecret!');
    type('ws-confirm', 'Sup3r$ecret!');
    await act(async () => {
      host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(completeSetup).toHaveBeenCalledWith({ invitationId: '11111111-1111-1111-1111-111111111111', token: 'secret', password: 'Sup3r$ecret!', confirmPassword: 'Sup3r$ecret!' });
    expect(loginUser).toHaveBeenCalledWith(expect.objectContaining({ customerType: 'Collaborator', email: 'new@example.com' }), 'jwt');
    expect(assign).toHaveBeenCalledWith(expect.stringContaining('/user/photographer/events?workspace=w1'));
  });

  it('shows the server weak-password answer and stays on the form', async () => {
    previewSetup.mockResolvedValue({ success: true, data: { found: true, open: true, ownerName: 'Eric N.', email: 'new@example.com', account: 'none' } });
    completeSetup.mockResolvedValue({ success: false, error: 'This password has appeared in a known data breach.', data: { errorCode: 'WEAK_PASSWORD' } });
    await mount();
    type('ws-password', 'Sup3r$ecret!');
    type('ws-confirm', 'Sup3r$ecret!');
    await act(async () => {
      host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(host.textContent).toContain('known data breach');
    expect(host.querySelector('#ws-password')).not.toBeNull();
  });

  it('an address with an account is asked to sign in, never to set a second password', async () => {
    previewSetup.mockResolvedValue({ success: true, data: { found: true, open: true, ownerName: 'Eric N.', email: 'client@example.com', account: 'existing' } });
    await mount();
    expect(host.textContent).toContain('already has a Connekyt account');
    expect(host.querySelector('#ws-password')).toBeNull();
    const signIn = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Sign in to add this workspace'))!;
    act(() => signIn.click());
    expect(push).toHaveBeenCalledWith(expect.stringContaining('/user/auth/login?returnUrl='));
    expect(decodeURIComponent(push.mock.calls[0][0])).toContain('/user/workspace/setup?invite=11111111-1111-1111-1111-111111111111&t=secret');
  });

  it('a signed-in existing login joins with one tap', async () => {
    signedIn = true;
    previewSetup.mockResolvedValue({ success: true, data: { found: true, open: true, ownerName: 'Eric N.', email: 'client@example.com', account: 'existing' } });
    acceptWithToken.mockResolvedValue({ success: true, data: { workspaceId: 'w1', invitationId: 'i1', ownerName: 'Eric N.' } });
    await mount();
    const join = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Add this workspace'))!;
    await act(async () => join.click());
    expect(acceptWithToken).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', 'secret');
  });
});
