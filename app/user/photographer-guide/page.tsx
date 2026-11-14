import PhotographerGuide from "../../pages/photographer-guide";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Photographer Guide",
  description: "A step-by-step guide for photographers: set up your profile, get booked and get paid.",
  path: "/user/photographer-guide",
});

export default function Page() {
  return <PhotographerGuide />;
}
