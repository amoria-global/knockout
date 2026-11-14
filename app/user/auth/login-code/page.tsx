import React, { Suspense } from 'react';
import LoginCode from '../../../pages/auth/login-code';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Account Access",
  description: "Sign in or manage access to your Amoria Connekyt account.",
  path: "/user/auth/login-code",
  index: false,
});

const LoginCodePage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LoginCode />
  </Suspense>
);
export default LoginCodePage;
