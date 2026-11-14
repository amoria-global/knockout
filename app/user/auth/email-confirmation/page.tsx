import React from 'react';
import EmailConfirmation from '../../../pages/auth/email-confirmation';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Account Access",
  description: "Sign in or manage access to your Amoria Connekyt account.",
  path: "/user/auth/email-confirmation",
  index: false,
});

export default function Page() {
  return <EmailConfirmation />;
}
