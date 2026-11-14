import react from 'react';
import PhotographersPage from '../../pages/photographer/photographers';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Find a Photographer",
  description: "Browse professional event photographers and studios, then book the right one for your event.",
  path: "/user/photographers",
});
const Photographers = () => {
  return <PhotographersPage />;
}
export default Photographers;