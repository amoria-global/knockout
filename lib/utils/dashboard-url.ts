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
 * Generate dashboard URL with token attached
 * @param customerType - The user's customer type
 * @param token - The auth token to attach
 * @returns Full dashboard URL with token query parameter
 */
export function getDashboardUrlWithToken(customerType?: string, token?: string): string {
  const dashboardUrl = getDashboardUrl(customerType);
  if (token) {
    return `${dashboardUrl}?token=${encodeURIComponent(token)}`;
  }
  return dashboardUrl;
}
