import React, { Suspense } from 'react';
import WorkspaceSetup from '../../../pages/workspace/setup';

const WorkspaceSetupPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <WorkspaceSetup />
  </Suspense>
);
export default WorkspaceSetupPage;
