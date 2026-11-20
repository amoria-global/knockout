import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Source rules for the pages that are too heavy to render here (the login page pulls in social sign-in and the phone
 * input). They pin what the page may show: the emailed-code link is for invited team members, so it is offered only
 * where one has signed in, never beside "Forgot your password?".
 */
const read = (p: string) => fs.readFileSync(path.join(__dirname, p), 'utf8');

describe('login page', () => {
  const login = read('login.tsx');

  it('no longer puts the emailed-code link next to "Forgot your password?"', () => {
    expect(login).not.toContain('Email me a code instead');
  });

  it('offers it only where a team-member login has signed in, with a label that says who it is for', () => {
    expect(login).toMatch(/codeSignInOffered\s*&&/);
    expect(login).toContain('Team member? Sign in with an email code');
  });
});

describe('every sign-in route remembers a team member', () => {
  it('the shared login step marks the browser for a collaborator, and only for one', () => {
    const provider = read('../../providers/AuthProvider.tsx');
    expect(provider).toContain('if (isCollaboratorType(userData.customerType)) rememberCodeSignIn();');
  });
});
