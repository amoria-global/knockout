import React from "react";
import Gallery from "../../pages/gallery";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Hall of Fame",
  description: "Standout photographers and moments from events on Amoria Connekyt.",
  path: "/user/hall-of-fame",
});

const GalleryPage = () => {
  return (
    <div>
      <Gallery />
    </div>
  );
};

export default GalleryPage;
