'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, getAuthToken, setAuthToken, removeAuthToken, removeRefreshToken, isAuthenticated as checkAuth } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { logout as logoutFromBackend } from '@/lib/APIs/auth/logout/route';

/**
 * User data stored in auth context
 */
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerId: string;
  profilePicture?: string;
  customerType?: string; // 'photographer' | 'client'
}

/**
 * Auth context type definition
 */
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: AuthUser, token: string) => void;
  logout: () => void;
}

const AUTH_USER_KEY = 'authUser';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Get stored user data from localStorage
 */
function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid JSON, clear it
    localStorage.removeItem(AUTH_USER_KEY);
  }
  return null;
}

/**
 * Store user data in localStorage
 */
function storeUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Remove user data from localStorage
 */
function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_USER_KEY);
}

/**
 * Validate profile picture URL — backend sometimes returns URLs like ".../null" instead of actual null
 */
function getValidProfilePicture(url: string | null | undefined): string | undefined {
  if (!url || url.includes('/null')) return undefined;
  return url;
}

/**
 * Rewrite backend HTTP image URLs to go through our HTTPS proxy on deployment.
 * e.g. http://197.243.24.101/uploads/photo.jpg → /api/proxy/uploads/photo.jpg
 */
function normalizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101').replace(/\/$/, '');
  if (typeof window !== 'undefined' && url.startsWith(apiBase) && window.location.origin !== apiBase) {
    return url.replace(apiBase, '/api/proxy');
  }
  return url;
}

/**
 * Profile summary response shape
 */
interface ProfileSummaryData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  customerType?: string;
  profilePicture?: string | null;
}

/**
 * Fetch user profile from profile-summary endpoint to get real customerType.
 * Uses apiClient so it routes through the proxy on deployment (HTTPS→HTTP bridging)
 * and gets automatic token refresh + retry handling.
 */
async function fetchUserProfile(): Promise<Partial<AuthUser> | null> {
  try {
    const response = await apiClient.get<ProfileSummaryData>(
      API_ENDPOINTS.PHOTOGRAPHER.PROFILE_SUMMARY
    );

    if (!response.success || !response.data) return null;

    const data = response.data;
    console.log('[AuthProvider] profile-summary response data:', JSON.stringify(data, null, 2));

    return {
      id: data.id || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      customerType: data.customerType || '',
      profilePicture: normalizeImageUrl(getValidProfilePicture(data.profilePicture)),
    };
  } catch {
    return null;
  }
}

/**
 * AuthProvider component
 * Manages authentication state globally across the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const hasToken = checkAuth();
      const storedUser = getStoredUser();

      if (hasToken && storedUser) {
        // Normalize any stored HTTP image URLs for current environment
        if (storedUser.profilePicture) {
          storedUser.profilePicture = normalizeImageUrl(storedUser.profilePicture);
        }
        setUser(storedUser);
        // Refresh customerType and profilePicture from profile-summary API
        if (getAuthToken()) {
          fetchUserProfile().then(profile => {
            if (profile) {
              const needsUpdate =
                (profile.customerType && profile.customerType !== storedUser.customerType) ||
                (profile.profilePicture && profile.profilePicture !== storedUser.profilePicture);
              if (needsUpdate) {
                const updated = {
                  ...storedUser,
                  ...(profile.customerType && { customerType: profile.customerType }),
                  ...(profile.profilePicture && { profilePicture: profile.profilePicture }),
                };
                storeUser(updated);
                setUser(updated);
              }
            }
          });
        }
      } else if (!hasToken) {
        // No token, clear any stale user data
        clearStoredUser();
        setUser(null);
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Listen for logout messages from dashboard (opened via window.open)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept logout messages from the dashboard origin
      const dashboardOrigin = process.env.NEXT_PUBLIC_DASHBOARD_URL?.replace(/\/$/, '') || '';
      if (dashboardOrigin && event.origin !== dashboardOrigin) return;
      if (event.data?.type === 'connekyt-logout') {
        removeAuthToken();
        clearStoredUser();
        setUser(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_USER_KEY) {
        if (event.newValue) {
          try {
            const newUser = JSON.parse(event.newValue);
            setUser(newUser);
          } catch {
            setUser(null);
          }
        } else {
          // User was removed (logged out in another tab)
          setUser(null);
        }
      }

      // Also check for token changes
      if (event.key === 'authToken') {
        if (!event.newValue) {
          // Token removed, clear user
          clearStoredUser();
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Login function - stores user data and token
   * Also fetches profile-summary in background to get real customerType
   */
  const login = useCallback(async (userData: AuthUser, token: string) => {
    // Store token first
    setAuthToken(token);
    // Store user data
    storeUser(userData);
    // Update state
    setUser(userData);
    // Fetch real profile to get customerType and profilePicture
    const profile = await fetchUserProfile();
    if (profile?.customerType || profile?.profilePicture) {
      const updated = {
        ...userData,
        ...(profile.customerType && { customerType: profile.customerType }),
        ...(profile.profilePicture && { profilePicture: profile.profilePicture }),
      };
      storeUser(updated);
      setUser(updated);
    }
  }, []);

  /**
   * Logout function - invalidates token on backend and clears all local auth data
   */
  const logout = useCallback(() => {
    // Call backend to invalidate the token (fire-and-forget)
    logoutFromBackend().catch(() => {});
    // Clear tokens
    removeAuthToken();
    removeRefreshToken();
    // Clear user data
    clearStoredUser();
    // Update state
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && checkAuth(),
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
