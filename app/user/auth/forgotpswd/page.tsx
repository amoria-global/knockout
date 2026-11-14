import react from 'react';
import Forgotpswd from '../../../pages/auth/forgotpswd';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Account Access",
  description: "Sign in or manage access to your Amoria Connekyt account.",
  path: "/user/auth/forgotpswd",
  index: false,
});

const page = () => {
  return <Forgotpswd />;
}
export default page;