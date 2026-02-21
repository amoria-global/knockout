/**
 * Get the dashboard route for a given user type
 */
function getRouteForType(customerType?: string): string {
  switch (customerType?.toLowerCase()) {
    case 'client': return '/user/client/home';
    case 'event-coordinator': return '/user/event-coordinator/home';
    case 'photographer': return '/user/photographer/dashboard';
    default: return '/'; // Role selection page
  }
}

/**
 * Generate dashboard URL based on user type
 * @param customerType - The user's customer type ('photographer' | 'client' | 'event-coordinator')
 * @returns Full dashboard URL with appropriate route
 */
export function getDashboardUrl(customerType?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || '';
  return `${baseUrl}${getRouteForType(customerType)}`;
}

/**
 * Generate dashboard URL with tokens attached
 * @param customerType - The user's customer type
 * @param token - The auth token to attach
 * @param refreshToken - The refresh token to attach
 * @returns Full dashboard URL with token query parameters
 */
export function getDashboardUrlWithToken(customerType?: string, token?: string, refreshToken?: string): string {
  const dashboardUrl = getDashboardUrl(customerType);
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (refreshToken) params.set('refreshToken', refreshToken);
  const query = params.toString();
  return query ? `${dashboardUrl}?${query}` : dashboardUrl;
}
