import react from "react";
import TrustSafetyPage from "../../pages/trust-safety";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Trust and Safety",
  description: "How Amoria Connekyt keeps events, photographers and payments safe.",
  path: "/user/trust-safety",
});
const TrustSafety = () => {
  return <TrustSafetyPage />;
}
export default TrustSafety;