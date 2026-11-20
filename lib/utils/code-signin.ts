/**
 * "Sign in with an email code" is for invited team members (collaborator logins) only: for every other address the
 * server sends nothing. Shown to everyone under "Forgot your password?", people took it for a password reset and waited
 * for a code that never came. So the login page offers it only in a browser where a team-member login has already
 * signed in. Nothing here is a secret or a credential: it only decides whether a link is shown.
 */
export const CODE_SIGNIN_KEY = 'connekyt.codeSignIn';

function store(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function rememberCodeSignIn(): boolean {
  const s = store();
  if (!s) return false;
  try {
    s.setItem(CODE_SIGNIN_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

export function codeSignInRemembered(): boolean {
  const s = store();
  if (!s) return false;
  try {
    return s.getItem(CODE_SIGNIN_KEY) === '1';
  } catch {
    return false;
  }
}
