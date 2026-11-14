import React from "react";
import { AuthPage } from "../../../pages/auth/login";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Create Account",
  description: "Sign in or manage access to your Amoria Connekyt account.",
  path: "/user/auth/signup",
  index: false,
});

function App() {
  return (
    <AuthPage initialView="signup" />
  );
}

export default App;
