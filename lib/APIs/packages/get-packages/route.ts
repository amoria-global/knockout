/**
 * Get Photographer Packages API
 * GET /api/remote/photographer/packages
 * GET /api/remote/photographer/packages/{id}
 * GET /api/remote/public/photographers/{id}/packages (public)
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: string;
  features: string[];
  photographerId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetPackagesResponse {
  packages: Package[];
  total: number;
}

export interface GetPackageByIdResponse {
  package: Package;
}

/**
 * Get all packages for a photographer
 * @param photographerId - The photographer's ID
 */
export async function getPhotographerPackages(
  photographerId: string
): Promise<ApiResponse<GetPackagesResponse>> {
  if (!photographerId) {
    return {
      success: false,
      error: 'Photographer ID is required',
    };
  }

  const response = await apiClient.get<GetPackagesResponse>(
    `${API_ENDPOINTS.PHOTOGRAPHER.PACKAGES}?photographerId=${photographerId}`,
    {
      retries: 2,
    }
  );

  return response;
}

/**
 * Get a specific package by ID
 * @param packageId - The package ID
 */
export async function getPackageById(
  packageId: string
): Promise<ApiResponse<GetPackageByIdResponse>> {
  if (!packageId) {
    return {
      success: false,
      error: 'Package ID is required',
    };
  }

  const response = await apiClient.get<GetPackageByIdResponse>(
    API_ENDPOINTS.PHOTOGRAPHER.PACKAGE_BY_ID(packageId),
    {
      retries: 2,
    }
  );

  return response;
}

/**
 * Public package feature from API
 */
export interface PublicPackageFeature {
  featureName: string;
  isIncluded: boolean;
  displayOrder: number;
}

/**
 * Public package from API (matches create POST body shape)
 */
export interface PublicPackage {
  id: string;
  packageName: string;
  price: number;
  currencyId: string;
  priceUnit: string;
  durationHours: number;
  description: string;
  isActive: boolean;
  features: PublicPackageFeature[];
}

/**
 * Get public packages for a photographer (no auth required)
 * @param photographerId - The photographer's ID
 */
export async function getPublicPhotographerPackages(
  photographerId: string
): Promise<ApiResponse<PublicPackage[]>> {
  if (!photographerId) {
    return {
      success: false,
      error: 'Photographer ID is required',
    };
  }

  const response = await apiClient.get<PublicPackage[]>(
    API_ENDPOINTS.PUBLIC.PHOTOGRAPHER_PACKAGES(photographerId),
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}
