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
 * Generate dashboard URL with token and email attached
 * @param customerType - The user's customer type
 * @param token - The auth token to attach
 * @param email - The user's email to attach
 * @returns Full dashboard URL with token and email query parameters
 */
export function getDashboardUrlWithToken(customerType?: string, token?: string, email?: string): string {
  const dashboardUrl = getDashboardUrl(customerType);
  if (token) {
    const params = new URLSearchParams();
    params.set('token', token);
    if (email) {
      params.set('email', email);
    }
    return `${dashboardUrl}?${params.toString()}`;
  }
  return dashboardUrl;
}
