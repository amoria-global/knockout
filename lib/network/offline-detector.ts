/**
 * Offline Detector
 * Network status monitoring for graceful offline handling
 */

import { logger } from '../api/logger';

/**
 * Network status change listener type
 */
export type NetworkStatusListener = (online: boolean) => void;

/**
 * Offline detector singleton class
 */
class OfflineDetector {
  private _isOnline: boolean;
  private listeners: Set<NetworkStatusListener> = new Set();
  private initialized: boolean = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private lastOnlineTime: number | null = null;

  constructor() {
    // Default to online if we can't detect
    this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Initialize the detector (call once on app mount)
   */
  init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    // Set initial state
    this._isOnline = navigator.onLine;
    if (this._isOnline) {
      this.lastOnlineTime = Date.now();
    }

    // Listen for browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Optional: Periodic connectivity check
    this.startPeriodicCheck();

    this.initialized = true;
    logger.debug('Offline detector initialized', { online: this._isOnline });
  }

  /**
   * Cleanup listeners (call on app unmount)
   */
  destroy(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.listeners.clear();
    this.initialized = false;
  }

  /**
   * Handle browser online event
   */
  private handleOnline = (): void => {
    this.setOnline(true);
  };

  /**
   * Handle browser offline event
   */
  private handleOffline = (): void => {
    this.setOnline(false);
  };

  /**
   * Update online status and notify listeners
   */
  private setOnline(value: boolean): void {
    if (this._isOnline === value) return;

    this._isOnline = value;
    logger.networkStatus(value);

    if (value) {
      this.lastOnlineTime = Date.now();
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(value);
      } catch (error) {
        logger.error('Error in network status listener', error as Error);
      }
    });
  }

  /**
   * Start periodic connectivity check
   * This helps detect silent disconnections
   */
  private startPeriodicCheck(): void {
    // Check every 30 seconds
    this.pingInterval = setInterval(() => {
      this.checkConnectivity();
    }, 30000);
  }

  /**
   * Active connectivity check by making a small request
   */
  async checkConnectivity(): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    // If browser says offline, trust it
    if (!navigator.onLine) {
      this.setOnline(false);
      return false;
    }

    try {
      // Try to fetch a small resource
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isOnline = response.ok;
      this.setOnline(isOnline);
      return isOnline;
    } catch {
      // Fetch failed - might be offline or CORS issue
      // Only mark offline if browser also says offline
      if (!navigator.onLine) {
        this.setOnline(false);
        return false;
      }
      // Browser says online but fetch failed - could be server issue, not network
      return this._isOnline;
    }
  }

  /**
   * Get current online status
   */
  get isOnline(): boolean {
    return this._isOnline;
  }

  /**
   * Get current offline status
   */
  get isOffline(): boolean {
    return !this._isOnline;
  }

  /**
   * Get time since last online (in milliseconds)
   */
  get timeSinceOnline(): number | null {
    if (this._isOnline) return 0;
    if (!this.lastOnlineTime) return null;
    return Date.now() - this.lastOnlineTime;
  }

  /**
   * Subscribe to network status changes
   * @returns Unsubscribe function
   */
  subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);

    // Immediately notify of current status
    listener(this._isOnline);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Wait for network to come back online
   * @param timeout - Maximum time to wait in milliseconds
   * @returns Promise that resolves when online or rejects on timeout
   */
  waitForOnline(timeout?: number): Promise<void> {
    if (this._isOnline) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const unsubscribe = this.subscribe(online => {
        if (online) {
          if (timeoutId) clearTimeout(timeoutId);
          unsubscribe();
          resolve();
        }
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error('Timed out waiting for network connection'));
        }, timeout);
      }
    });
  }
}

/**
 * Singleton instance
 */
export const offlineDetector = new OfflineDetector();

/**
 * Hook-friendly functions
 */
export function isOnline(): boolean {
  return offlineDetector.isOnline;
}

export function isOffline(): boolean {
  return offlineDetector.isOffline;
}

export function onNetworkChange(listener: NetworkStatusListener): () => void {
  return offlineDetector.subscribe(listener);
}

export function initOfflineDetector(): void {
  offlineDetector.init();
}

export function destroyOfflineDetector(): void {
  offlineDetector.destroy();
}

export default offlineDetector;
