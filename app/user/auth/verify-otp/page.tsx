import React from "react";
import VerifyOtpPage from "../../../pages/auth/verify-otp";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Account Access",
  description: "Sign in or manage access to your Amoria Connekyt account.",
  path: "/user/auth/verify-otp",
  index: false,
});


function App() {
  return (
    <div className="min-h-screen">
      <VerifyOtpPage />
    </div>
  );
}

export default App;
