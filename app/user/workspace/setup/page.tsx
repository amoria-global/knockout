import React, { Suspense } from 'react';
import WorkspaceSetup from '../../../pages/workspace/setup';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Set Up Workspace",
  description: "Set up your Amoria Connekyt workspace.",
  path: "/user/workspace/setup",
  index: false,
});

const WorkspaceSetupPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <WorkspaceSetup />
  </Suspense>
);
export default WorkspaceSetupPage;
