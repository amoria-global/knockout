'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthToken, setAuthToken, removeAuthToken, removeRefreshToken, isAuthenticated as checkAuth } from '@/lib/api/client';
import { API_CONFIG } from '@/lib/api/config';
import { refreshToken as attemptRefreshToken } from '@/lib/APIs/auth/refresh-token/route';
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
 * Fetch user profile from profile-summary endpoint to get real customerType
 */
async function fetchUserProfile(token: string): Promise<Partial<AuthUser> | null> {
  try {
    const response = await fetch(
      `${API_CONFIG.baseUrl}api/remote/photographer/profile-summary`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': process.env.NEXT_PUBLIC_API_KEY || '',
        },
      }
    );
    if (response.status === 401) {
      // Attempt token refresh before giving up
      const refreshResult = await attemptRefreshToken();
      if (refreshResult.success && refreshResult.data?.token) {
        // Retry profile fetch with the new token
        const retryResponse = await fetch(
          `${API_CONFIG.baseUrl}api/remote/photographer/profile-summary`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${refreshResult.data.token}`,
              'api-token': process.env.NEXT_PUBLIC_API_KEY || '',
            },
          }
        );
        if (retryResponse.ok) {
          const retryResult = await retryResponse.json();
          if (retryResult.action === 1 && retryResult.data) {
            const retryData = retryResult.data;
            return {
              id: retryData.id || '',
              firstName: retryData.firstName || '',
              lastName: retryData.lastName || '',
              email: retryData.email || '',
              customerType: retryData.customerType || '',
              profilePicture: retryData.profilePicture || undefined,
            };
          }
        }
      }
      // Refresh failed — clear auth and redirect to login
      removeAuthToken();
      removeRefreshToken();
      clearStoredUser();
      if (typeof window !== 'undefined') {
        window.location.href = '/user/auth/login';
      }
      return null;
    }
    if (!response.ok) return null;
    const result = await response.json();
    if (result.action !== 1 || !result.data) return null;
    const data = result.data;
    return {
      id: data.id || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      customerType: data.customerType || '',
      profilePicture: data.profilePicture || undefined,
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
        setUser(storedUser);
        // Refresh customerType from profile-summary API
        const token = getAuthToken();
        if (token) {
          fetchUserProfile(token).then(profile => {
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
    const profile = await fetchUserProfile(token);
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
