import react from 'react';
import JoinPackagePage from '../../../pages/events/join-package';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Join Package",
  description: "Choose an event package on Amoria Connekyt.",
  path: "/user/events/join-package",
  index: false,
});
const JoinPackage = () => {
    return < JoinPackagePage/>;
}
export default JoinPackage;
