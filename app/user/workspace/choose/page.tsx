import React, { Suspense } from 'react';
import WorkspaceChoose from '../../../pages/workspace/choose';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Choose Workspace",
  description: "Pick the workspace to continue with.",
  path: "/user/workspace/choose",
  index: false,
});

const WorkspaceChoosePage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <WorkspaceChoose />
  </Suspense>
);
export default WorkspaceChoosePage;
