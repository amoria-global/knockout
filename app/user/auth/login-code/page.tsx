import React, { Suspense } from 'react';
import LoginCode from '../../../pages/auth/login-code';

const LoginCodePage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LoginCode />
  </Suspense>
);
export default LoginCodePage;
