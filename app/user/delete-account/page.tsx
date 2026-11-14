import React from "react";
import DeleteAccount from "../../pages/delete-account";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Delete Account",
  description: "Request deletion of your Amoria Connekyt account.",
  path: "/user/delete-account",
  index: false,
});

const DeleteAccountPage = () => {
  return <DeleteAccount />;
}
export default DeleteAccountPage;
