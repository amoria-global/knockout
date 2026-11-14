import React from "react";
import About from "../../pages/about";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "About Us",
  description: "Amoria Connekyt connects people with professional event photographers and live-streamed events.",
  path: "/user/about",
});

const AboutPage = () => {
  return (
    <div>
      <About />
    </div>
  );
};

export default AboutPage;
