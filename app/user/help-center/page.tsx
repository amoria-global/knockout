import React from "react";
import HelpCenterPage from "../../pages/help-center";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Help Center",
  description: "Answers about booking, payments, your account, security and technical support.",
  path: "/user/help-center",
});

const HelpCenter: React.FC = () => {
  return <HelpCenterPage />;
}
export default HelpCenter;