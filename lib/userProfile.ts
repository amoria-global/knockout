/**
 * Customer profile + account actions for the User settings page.
 * Wraps the customer-scoped backend endpoints:
 *   GET    /api/remote/customer/profile
 *   PUT    /api/remote/customer/profile?firstName=&lastName=&phone=&address=
 *   DELETE /api/remote/customer/profile   (anonymize + disable)
 */
import apiClient from '@/lib/api/client';

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

export type CustomerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  preferredUsername?: string;
  customerType?: string;
  profilePicture?: string;
  twoFactorEnabled: boolean;
  kycStatus?: string;
};

function mapProfile(d: Raw): CustomerProfile {
  return {
    id: String(d.id ?? ''),
    firstName: str(d.firstName) ?? '',
    lastName: str(d.lastName) ?? '',
    email: str(d.email),
    phone: str(d.phone),
    address: str(d.address),
    preferredUsername: str(d.preferredUsername),
    customerType: str(d.customerType),
    profilePicture: str(d.profilePicture),
    twoFactorEnabled: d.twoFactorEnabled === true,
    kycStatus: str(d.kycStatus),
  };
}

export async function getProfile(): Promise<CustomerProfile | null> {
  try {
    const res = await apiClient.get<Raw>('/api/remote/customer/profile');
    if (!res.success || !res.data) return null;
    return mapProfile(res.data as Raw);
  } catch {
    return null;
  }
}

export type ProfileUpdate = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
};

/** The backend reads these as @RequestParam, so send them as a query string. */
export async function updateProfile(fields: ProfileUpdate): Promise<{ success: boolean; error?: string }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    if (v != null) qs.set(k, v);
  }
  const res = await apiClient.put<Raw>(`/api/remote/customer/profile?${qs.toString()}`);
  return { success: !!res.success, error: res.error };
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const res = await apiClient.delete<Raw>('/api/remote/customer/profile');
  return { success: !!res.success, error: res.error };
}
