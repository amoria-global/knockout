/**
 * Get Photographers API Route
 * Fetches list of photographers from the backend with pagination and filtering
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

/**
 * Photographer data returned from the API
 */
export interface ProfessionalSkill {
  id?: string;
  name: string;
  proficiencyLevel?: number;
  skillPercentage?: number;
}

export interface Photographer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerType: string;
  profilePicture: string | null;
  coverPicture: string | null;
  address: string | null;
  about: string | null;
  joinedFrom: string;
  professionalPhilosophy: string | null;
  specialties: string[];
  rating: number;
  reviews: Review[];
  availabilities: Availability[];
  projects: Project[];
  professionalSkills: ProfessionalSkill[];
  equipments: Equipment[];
  educationLevels: Education[];
  certifications: Certification[];
  trainings: Training[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer?: {
    id: string;
    name: string;
  };
}

export interface Availability {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
}

export interface Training {
  id: string;
  name: string;
  provider: string;
  completionDate: string;
}

/**
 * Paginated response structure from backend
 */
export interface PaginatedPhotographers {
  content: Photographer[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      direction: string;
      property: string;
      ignoreCase: boolean;
      nullHandling: string;
      ascending: boolean;
      descending: boolean;
    }[];
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    direction: string;
    property: string;
    ignoreCase: boolean;
    nullHandling: string;
    ascending: boolean;
    descending: boolean;
  }[];
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

/**
 * Request parameters for fetching photographers
 */
export interface GetPhotographersRequest {
  page?: number;
  size?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  category?: string;
  location?: string;
  search?: string;
}

/**
 * Fetch list of photographers with optional pagination and filtering
 */
export async function getPhotographers(
  params?: GetPhotographersRequest
): Promise<ApiResponse<PaginatedPhotographers>> {
  const queryParams = new URLSearchParams();

  // Set default values
  const page = params?.page ?? 0;
  const size = params?.size ?? 10;
  const sortColumn = params?.sortColumn ?? 'createdAt';
  const sortDirection = params?.sortDirection ?? 'asc';

  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  queryParams.append('sortColumn', sortColumn);
  queryParams.append('sortDirection', sortDirection);

  // Add optional filters
  if (params?.category && params.category !== 'all') {
    queryParams.append('category', params.category);
  }
  if (params?.location && params.location !== 'all') {
    queryParams.append('location', params.location);
  }
  if (params?.search) {
    queryParams.append('search', params.search);
  }

  const endpoint = `${API_ENDPOINTS.PUBLIC.PHOTOGRAPHERS_LIST}?${queryParams.toString()}`;

  const response = await apiClient.get<PaginatedPhotographers>(endpoint, {
    skipAuth: true,
    retries: 2,
  });

  return response;
}

/**
 * Fetch a single photographer by ID
 */
export async function getPhotographerById(
  id: string
): Promise<ApiResponse<Photographer>> {
  const endpoint = `${API_ENDPOINTS.PUBLIC.PHOTOGRAPHERS_LIST}/${id}`;

  const response = await apiClient.get<Photographer>(endpoint, {
    skipAuth: true,
    retries: 2,
  });

  return response;
}
