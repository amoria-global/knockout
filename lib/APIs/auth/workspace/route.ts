/**
 * Workspace collaborator API.
 *
 * A collaborator is a private login that exists only to work inside the workspaces its owner invited it to. The
 * invitation email carries a link with the invitation id and a single-use secret; the first visit sets a password.
 * Afterwards they sign in on the normal login page, or with an emailed code.
 *
 *   POST /api/remote/auth/workspace-setup/preview   who invited them, and the fixed email
 *   POST /api/remote/auth/workspace-setup           choose a password, sign in
 *   POST /api/remote/auth/login-code/send           "Email me a code instead"
 *   POST /api/remote/auth/login-code/verify
 *   GET  /api/remote/collaborator/workspaces        the picker
 *   POST /api/remote/collaborator/invitations/{id}/accept   an existing login joins from the link
 */

import { apiClient, setAuthToken, setRefreshToken } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { LoginResponse } from '@/lib/APIs/auth/login/route';

export interface SetupPreview {
  found: boolean;
  open: boolean;
  ownerName?: string;
  email?: string;
  /** none: no login yet. returning: a collaborator login with no workspace left. existing: sign in with the account's own password. */
  account?: 'none' | 'returning' | 'existing';
}

export interface WorkspaceEntry {
  workspaceId: string;
  invitationId: string;
  role?: string;
  owner: { id: string; name: string; profilePicture?: string | null };
}

export interface CollaboratorWorkspaces {
  workspaces: WorkspaceEntry[];
  myBusiness: { id: string; customerType: string } | null;
}

export type SetupResponse = LoginResponse & { errorCode?: string; workspaces?: WorkspaceEntry[] };

export async function previewSetup(invitationId: string, token: string): Promise<ApiResponse<SetupPreview>> {
  return apiClient.post<SetupPreview>('/api/remote/auth/workspace-setup/preview', { invitationId, token }, { skipAuth: true, retries: 1 });
}

export async function completeSetup(body: { invitationId: string; token: string; password: string; confirmPassword: string }): Promise<ApiResponse<SetupResponse>> {
  const response = await apiClient.post<SetupResponse>('/api/remote/auth/workspace-setup', body, { skipAuth: true, retries: 0 });
  storeSession(response);
  return response;
}

export async function sendLoginCode(email: string): Promise<ApiResponse<{ message?: string }>> {
  return apiClient.post('/api/remote/auth/login-code/send', { email }, { skipAuth: true, retries: 0 });
}

export async function verifyLoginCode(email: string, code: string): Promise<ApiResponse<SetupResponse>> {
  const response = await apiClient.post<SetupResponse>('/api/remote/auth/login-code/verify', { email, code }, { skipAuth: true, retries: 0 });
  storeSession(response);
  return response;
}

export async function getCollaboratorWorkspaces(): Promise<ApiResponse<CollaboratorWorkspaces>> {
  return apiClient.get<CollaboratorWorkspaces>('/api/remote/collaborator/workspaces');
}

export async function acceptWithToken(invitationId: string, token: string): Promise<ApiResponse<{ workspaceId: string; invitationId: string; ownerName: string }>> {
  return apiClient.post(`/api/remote/collaborator/invitations/${encodeURIComponent(invitationId)}/accept`, { token }, { retries: 0 });
}

/** Keeps the tokens of a finished sign-in, unless a second factor is still pending. */
function storeSession(response: ApiResponse<SetupResponse>): void {
  const data = response.data;
  if (!response.success || !data || data.twoFactorRequired) return;
  if (data.token) setAuthToken(data.token);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
}
