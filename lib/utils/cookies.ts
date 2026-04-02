const AUTH_COOKIE = 'authToken';
const REFRESH_COOKIE = 'refreshToken';
const USER_ROLE_COOKIE = 'userRole';

/**
 * Set auth cookies so Next.js middleware can detect authentication.
 * Only sets the cookies that are provided (supports partial updates like token refresh).
 */
export function setAuthCookies(
  authToken?: string,
  refreshToken?: string,
  userRole?: string,
  maxAgeSeconds = 7 * 24 * 60 * 60
): void {
  if (typeof document === 'undefined') return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const base = `; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;

  if (authToken) {
    document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(authToken)}${base}`;
  }
  if (refreshToken) {
    document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}${base}`;
  }
  if (userRole) {
    document.cookie = `${USER_ROLE_COOKIE}=${encodeURIComponent(userRole)}${base}`;
  }
}

/**
 * Clear all auth cookies (on logout or session expiry).
 */
export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  [AUTH_COOKIE, REFRESH_COOKIE, USER_ROLE_COOKIE].forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}
