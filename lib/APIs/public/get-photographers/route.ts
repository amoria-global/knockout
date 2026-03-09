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
  email?: string;
  phone?: string;
  customerType?: string;
  profilePicture?: string | null;
  coverPicture?: string | null;
  address?: string | null;
  about?: string | null;
  joinedFrom?: string;
  professionalPhilosophy?: string | null;
  specialties?: string[];
  rating?: number;
  completedEvents?: number;
  reviews?: Review[];
  availabilities?: Availability[];
  projects?: Project[];
  professionalSkills?: ProfessionalSkill[];
  equipments?: Equipment[];
  educationLevels?: Education[];
  certifications?: Certification[];
  trainings?: Training[];
  packages?: PhotographerPackage[];
  workExperiences?: WorkExperience[];
  isVerified?: boolean;
}

export interface PhotographerPackageFeature {
  featureName: string;
  isIncluded: boolean;
  displayOrder: number;
}

export interface PhotographerPackage {
  id: string;
  packageName: string;
  price: number;
  currencyId: string;
  priceUnit: string;
  durationHours: number;
  description: string;
  isActive: boolean;
  features: PhotographerPackageFeature[];
}

export interface Review {
  id: string;
  rating: number;
  // API returns "review" field per spec, keep "comment" for backward compat
  review?: string;
  comment?: string;
  createdAt?: string;
  images?: string[];
  reviewer?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    customerType?: string;
  };
}

export interface Availability {
  id?: string;
  dayOfWeek: string;
  // API may return {hour, minute} objects or strings
  startTime: string | { hour: number; minute: number };
  endTime: string | { hour: number; minute: number };
  isAvailable?: boolean;
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  year?: number;
  projectImage?: string;
  // Legacy field - API may return either
  images?: string[];
  category?: string;
}

export interface Equipment {
  id?: string;
  name: string;
  type?: string;
  description?: string;
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  // Spec uses string dates, legacy uses numbers
  startDate?: string;
  endDate?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
}

export interface Certification {
  id?: string;
  // Spec uses "title", legacy uses "name"
  title?: string;
  name?: string;
  // Spec uses "institution", legacy uses "issuingOrganization"
  institution?: string;
  issuingOrganization?: string;
  // Spec uses "yearObtained", legacy uses "issueDate"
  yearObtained?: string;
  issueDate?: string;
  expiryDate?: string;
  description?: string;
}

export interface Training {
  id?: string;
  // Spec uses "title", legacy uses "name"
  title?: string;
  name?: string;
  // Spec uses "institution", legacy uses "provider"
  institution?: string;
  provider?: string;
  // Spec uses "yearObtained", legacy uses "completionDate"
  yearObtained?: string;
  completionDate?: string;
  description?: string;
}

export interface WorkExperience {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
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
  availableOn?: string; // "YYYY-MM-DD" - filter by availability
}

/**
 * Format time from API - handles both string and {hour, minute} formats
 */
export function formatTimeValue(t: string | { hour: number; minute: number }): string {
  if (typeof t === 'string') return t;
  const period = t.hour >= 12 ? 'PM' : 'AM';
  const h = t.hour === 0 ? 12 : t.hour > 12 ? t.hour - 12 : t.hour;
  return `${h}:${t.minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get reviewer display name - handles both formats
 */
export function getReviewerName(reviewer?: Review['reviewer']): string {
  if (!reviewer) return 'Anonymous';
  if (reviewer.firstName || reviewer.lastName) {
    return `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim();
  }
  return reviewer.name || 'Anonymous';
}

/**
 * Get review text - handles both "review" and "comment" field names
 */
export function getReviewText(review: Review): string {
  return review.review || review.comment || '';
}

/**
 * Get project thumbnail - handles both "projectImage" and "images[0]"
 */
export function getProjectImage(project: Project): string | undefined {
  return project.projectImage || project.images?.[0];
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
  if (params?.availableOn) {
    queryParams.append('availableOn', params.availableOn);
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
