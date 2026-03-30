'use client';
import React from 'react';
import { AuthPage } from './login';

export default function SignupPage(): React.JSX.Element {
  return <AuthPage initialView="signup" />;
}
