import React from "react";
import { AuthPage } from "../../../pages/auth/login";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Sign In",
  description: "Sign in or manage access to your Amoria Connekyt account.",
  path: "/user/auth/login",
  index: false,
});

function App() {
  return (
    <AuthPage initialView="login" />
  );
}

export default App;
