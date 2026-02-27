/**
 * Photographer Profile Management API
 * Various POST endpoints on /api/remote/photographer/*
 */

import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// Base path
const BASE = '/api/remote/photographer';

// ---------- Types ----------

export interface UpdateImportantDetailsRequest {
  firstName: string;
  lastName: string;
  phone: string;
  about: string;
  address: string;
  professionalPhilosophy?: string;
  specialtyIds: string[];
}

export interface EquipmentRequest {
  name: string;
}

export interface ProfessionalSkillRequest {
  name: string;
  skillPercentage: number;
}

export interface AvailabilityRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface EducationRequest {
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface CertificateRequest {
  title: string;
  institution?: string;
  yearObtained?: string;
  description?: string;
  type: 'Certification' | 'Training';
}

export interface ProjectRequest {
  title: string;
  year?: string;
  description?: string;
}

interface GenericResponse {
  action: number;
  message: string;
}

// ---------- Profile Picture / Cover Photo ----------

export async function updateProfilePicture(file: File): Promise<ApiResponse<GenericResponse>> {
  const formData = new FormData();
  formData.append('profilePicture', file);
  return apiClient.post<GenericResponse>(`${BASE}/update-profile-picture`, formData, { retries: 1 });
}

export async function updateCoverPhoto(file: File): Promise<ApiResponse<GenericResponse>> {
  const formData = new FormData();
  formData.append('coverPhoto', file);
  return apiClient.post<GenericResponse>(`${BASE}/update-cover-photo`, formData, { retries: 1 });
}

// ---------- Important Details ----------

export async function updateImportantDetails(data: UpdateImportantDetailsRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/update-important-details`, data, { retries: 2 });
}

// ---------- Equipment ----------

export async function addEquipment(data: EquipmentRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/add-equipment`, data, { retries: 2 });
}

export async function updateEquipment(id: string, data: EquipmentRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/update-equipment/${id}`, data, { retries: 2 });
}

export async function deleteEquipment(id: string): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/delete-equipment/${id}`, undefined, { retries: 2 });
}

// ---------- Professional Skills ----------

export async function addSkill(data: ProfessionalSkillRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/add-professional-skills`, data, { retries: 2 });
}

export async function updateSkill(id: string, data: ProfessionalSkillRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/update-professional-skills/${id}`, data, { retries: 2 });
}

export async function deleteSkill(id: string): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/delete-professional-skills/${id}`, undefined, { retries: 2 });
}

// ---------- Availability ----------

export async function addAvailability(data: AvailabilityRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/add-availability`, data, { retries: 2 });
}

export async function updateAvailability(id: string, data: AvailabilityRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/update-availability/${id}`, data, { retries: 2 });
}

export async function deleteAvailability(id: string): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/delete-availability/${id}`, undefined, { retries: 2 });
}

// ---------- Education ----------

export async function addEducation(data: EducationRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/add-education-level`, data, { retries: 2 });
}

export async function updateEducation(id: string, data: EducationRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/update-education-level/${id}`, data, { retries: 2 });
}

export async function deleteEducation(id: string): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/delete-education-level/${id}`, undefined, { retries: 2 });
}

// ---------- Certifications / Training ----------

export async function addCertification(data: CertificateRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/add-trainting-certification`, data, { retries: 2 });
}

export async function updateCertification(id: string, data: CertificateRequest): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/update-trainting-certification/${id}`, data, { retries: 2 });
}

// ---------- Projects / Portfolio ----------

export async function addProject(data: ProjectRequest, projectImage: File): Promise<ApiResponse<GenericResponse>> {
  const formData = new FormData();
  formData.append('projectImage', projectImage);
  formData.append('title', data.title);
  if (data.year) formData.append('year', data.year);
  if (data.description) formData.append('description', data.description);
  return apiClient.post<GenericResponse>(`${BASE}/add-project-portfolio`, formData, { retries: 1 });
}

export async function updateProject(id: string, data: ProjectRequest, projectImage?: File): Promise<ApiResponse<GenericResponse>> {
  const formData = new FormData();
  if (projectImage) formData.append('projectImage', projectImage);
  formData.append('title', data.title);
  if (data.year) formData.append('year', data.year);
  if (data.description) formData.append('description', data.description);
  return apiClient.post<GenericResponse>(`${BASE}/update-add-project-portfolio/${id}`, formData, { retries: 1 });
}

export async function deleteProject(id: string): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/delete-add-project-portfolio/${id}`, undefined, { retries: 2 });
}

// ---------- Submit Profile for Review ----------

export async function submitProfile(): Promise<ApiResponse<GenericResponse>> {
  return apiClient.post<GenericResponse>(`${BASE}/submit-profile`, undefined, { retries: 2 });
}

// ---------- Profile Summary ----------

export async function getProfileSummary(): Promise<ApiResponse<GenericResponse>> {
  return apiClient.get<GenericResponse>(`${BASE}/profile-summary`, { retries: 2 });
}
