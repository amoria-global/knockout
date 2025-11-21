/**
 * User Logout API
 * Clears local authentication data
 */

import { removeAuthToken } from '../../../db';

/**
 * User Logout
 */
export async function logout() {
  removeAuthToken();

  // Optionally call backend logout endpoint if it exists
  // const token = getAuthToken();
  // await apiRequest(`${API_ENDPOINTS.AUTH}/logout`, {
  //   method: 'POST',
  //   token: token || undefined,
  // });

  return { success: true, message: 'Logged out successfully' };
}
