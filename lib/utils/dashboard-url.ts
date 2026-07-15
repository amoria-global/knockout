/**
 * Get the dashboard route for a given user type
 */
function getRouteForType(customerType?: string): string {
  switch (customerType?.toLowerCase()) {
    case 'client': return '/user/client/home';
    case 'event-coordinator':
    case 'coordinator': return '/user/event-coordinator/home';
    case 'photographer': return '/user/photographer/dashboard';
    // The consumer `User` role has its own dedicated dashboard section on the
    // cross-app dashboard host.
    case 'user': return '/user/user/home';
    case 'viewer': return '';  // Viewers don't have a dashboard
    default: return '/'; // Role selection page
  }
}

/**
 * Generate dashboard URL based on user type
 * @param customerType - The user's customer type ('photographer' | 'client' | 'event-coordinator')
 * @returns Full dashboard URL with appropriate route
 */
export function getDashboardUrl(customerType?: string): string {
  const route = getRouteForType(customerType);
  // Roles without a cross-app dashboard (user, viewer) resolve to '' so callers
  // use their in-app fallback (e.g. `|| '/user/dashboard'`).
  if (!route) return '';
  const baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || '';
  return `${baseUrl}${route}`;
}

/**
 * Generate dashboard URL for a given user type.
 *
 * Historically this function appended `?token=…&refreshToken=…` so the
 * dashboard could extract auth from the URL on first load. That handoff is
 * no longer needed: backend issues the JWT as an HttpOnly cookie scoped to
 * `.connekyt.com`, which travels automatically on any navigation to
 * `dashboard.connekyt.com` - no secrets in URL bars, referrer headers, or
 * browser history. The old `token` / `refreshToken` parameters are
 * accepted for source-compat and silently dropped.
 */
export function getDashboardUrlWithToken(customerType?: string, _token?: string, _refreshToken?: string): string {
  return getDashboardUrl(customerType);
}
