import React from "react";
import Donations from "../../pages/donations";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Donations",
  description: "Support causes and creators through Amoria Connekyt.",
  path: "/user/donations",
});

const DonationsPage = () => {
  return (
    <div>
      <Donations />
    </div>
  );
};

export default DonationsPage;
