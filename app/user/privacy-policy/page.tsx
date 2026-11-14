import React from "react";
import PrivacyPolicy from "../../pages/privacy-policy";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Privacy Policy",
  description: "How Amoria Connekyt collects, uses and protects your personal data.",
  path: "/user/privacy-policy",
});

const PrivacyPolicyPage = () => {
  return <PrivacyPolicy />;
}
export default PrivacyPolicyPage;