/**
 * Generate dashboard URL based on user type
 * @param customerType - The user's customer type ('photographer' | 'client')
 * @returns Full dashboard URL with appropriate route
 */
export function getDashboardUrl(customerType?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || '';
  const route = customerType === 'client'
    ? '/user/client/home'
    : '/user/photographer/dashboard';
  return `${baseUrl}${route}`;
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
