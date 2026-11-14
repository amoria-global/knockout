import React from "react";
import Gallery from "../pages/gallery";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Hall of Fame",
  description: "Standout photographers and moments from events on Amoria Connekyt.",
  path: "/user/hall-of-fame",
});

// Top-level /hall-of-fame route — the page lives in /pages/gallery (still
// named Gallery internally because the React component is unchanged; the
// route + label use the new wording). Acts as a public alias of
// /user/hall-of-fame for unauthenticated links.
const HallOfFamePage = () => {
  return (
    <div>
      <Gallery />
    </div>
  );
};

export default HallOfFamePage;
