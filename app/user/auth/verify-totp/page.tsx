import React from "react";
import VerifyTotpPage from "../../../pages/auth/verify-totp";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Account Access",
  description: "Sign in or manage access to your Amoria Connekyt account.",
  path: "/user/auth/verify-totp",
  index: false,
});


function App() {
  return (
    <div className="min-h-screen">
      <VerifyTotpPage />
    </div>
  );
}

export default App;
