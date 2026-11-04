/**
 * Where a collaborator goes after signing in. The workspace is chosen on this site (a picker when there are several) and
 * handed to the dashboard in the URL, because the dashboard is a different origin and keeps its own selection. The
 * dashboard treats it as a request, not a claim: the server checks a live membership on every call.
 */

const COLLABORATOR = 'collaborator';

export function isCollaboratorType(customerType?: string | null): boolean {
  return (customerType || '').toLowerCase() === COLLABORATOR;
}

export function dashboardWorkspaceUrl(workspaceId: string): string {
  const base = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.connekyt.com';
  const url = new URL(`${base}/user/photographer/events`);
  url.searchParams.set('workspace', workspaceId);
  return url.toString();
}

/** One workspace opens straight away, several go to the picker. Returns the path or URL to navigate to. */
export function workspaceDestination(workspaces: Array<{ workspaceId: string }> | undefined | null): string {
  if (workspaces && workspaces.length === 1) return dashboardWorkspaceUrl(workspaces[0].workspaceId);
  return '/user/workspace/choose';
}

/** The link in the invitation email, kept across a sign-in so an existing login can finish joining. */
export function setupLinkPath(invitationId: string, token: string): string {
  return `/user/workspace/setup?invite=${encodeURIComponent(invitationId)}&t=${encodeURIComponent(token)}`;
}
