/**
 * Workspace invitation preview
 * GET /api/remote/public/workspace-invitations/{id}
 *
 * What the link in an invitation email shows before anyone has signed in: who invited them, to which address, and
 * whether that address already has an account. Read only; answering the invitation is a separate, signed-in call.
 */

import { apiClient } from '@/lib/api/client';
import type { WorkspaceInvitePreview } from '@/lib/utils/workspace-invite';

export async function getWorkspaceInvitePreview(id: string): Promise<WorkspaceInvitePreview | null> {
  try {
    const response = await apiClient.get<WorkspaceInvitePreview>(
      `/api/remote/public/workspace-invitations/${encodeURIComponent(id)}`,
      { skipAuth: true, retries: 1 },
    );
    return response.success && response.data ? response.data : null;
  } catch {
    // The page keeps working as plain sign-in or sign-up when the preview cannot be read.
    return null;
  }
}
