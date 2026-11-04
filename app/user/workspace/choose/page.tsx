import React, { Suspense } from 'react';
import WorkspaceChoose from '../../../pages/workspace/choose';

const WorkspaceChoosePage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <WorkspaceChoose />
  </Suspense>
);
export default WorkspaceChoosePage;
