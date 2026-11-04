import { describe, expect, it } from 'vitest';
import { dashboardWorkspaceUrl, isCollaboratorType, setupLinkPath, workspaceDestination } from './workspace-entry';

describe('workspace entry', () => {
  it('knows a collaborator login by its customer type', () => {
    expect(isCollaboratorType('Collaborator')).toBe(true);
    expect(isCollaboratorType('collaborator')).toBe(true);
    for (const other of ['Photographer', 'Client', 'Viewer', '', undefined, null]) expect(isCollaboratorType(other as string)).toBe(false);
  });

  it('opens the only workspace on the dashboard and sends several to the picker', () => {
    expect(workspaceDestination([{ workspaceId: 'w1' }])).toBe(dashboardWorkspaceUrl('w1'));
    expect(dashboardWorkspaceUrl('w1')).toContain('/user/photographer/events?workspace=w1');
    expect(workspaceDestination([{ workspaceId: 'a' }, { workspaceId: 'b' }])).toBe('/user/workspace/choose');
    expect(workspaceDestination([])).toBe('/user/workspace/choose');
    expect(workspaceDestination(undefined)).toBe('/user/workspace/choose');
  });

  it('keeps the invitation link intact across a sign-in', () => {
    expect(setupLinkPath('abc', 'x y')).toBe('/user/workspace/setup?invite=abc&t=x%20y');
  });
});
