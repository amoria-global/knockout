import react from "react";
import PhotographerInfoPage from "../../pages/photographer/info";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Become a Photographer",
  description: "Join Amoria Connekyt as a photographer and get booked for events.",
  path: "/user/info",
});
const Page = () => {
  return <PhotographerInfoPage />;
}
export default Page;