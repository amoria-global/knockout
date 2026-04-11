/**
 * Wallet API
 * Read-only views of the authenticated customer's persisted wallet.
 * Backend endpoints live under /api/remote/wallet/me*.
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  ApiResponse,
  WalletDTO,
  WalletMovementDTO,
  SpringPage,
} from '@/lib/api/types';

/**
 * Fetch the currently authenticated customer's wallet snapshot.
 */
export async function getMyWallet(): Promise<ApiResponse<WalletDTO>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  return apiClient.get<WalletDTO>(API_ENDPOINTS.WALLET.ME, {
    retries: 2,
  });
}

/**
 * Fetch a paginated list of the current customer's wallet movements.
 */
export async function getMyWalletMovements(
  page: number = 0,
  size: number = 50
): Promise<ApiResponse<SpringPage<WalletMovementDTO>>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  const qs = `?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`;
  return apiClient.get<SpringPage<WalletMovementDTO>>(
    `${API_ENDPOINTS.WALLET.ME_MOVEMENTS}${qs}`,
    { retries: 1 }
  );
}
