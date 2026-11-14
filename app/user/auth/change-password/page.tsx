import React from "react";
import ChangePasswordPage from "../../../pages/auth/change-password";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Account Access",
  description: "Sign in or manage access to your Amoria Connekyt account.",
  path: "/user/auth/change-password",
  index: false,
});

export default function App() {
  return <ChangePasswordPage />;
}
