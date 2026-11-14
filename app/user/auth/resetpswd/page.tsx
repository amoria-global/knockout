import React, { Suspense } from "react";
import Resetpassword from '../../../pages/auth/resetpswd';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Account Access",
  description: "Sign in or manage access to your Amoria Connekyt account.",
  path: "/user/auth/resetpswd",
  index: false,
});

const ResetpswdPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Resetpassword />
        </Suspense>
    );
}
export default ResetpswdPage;