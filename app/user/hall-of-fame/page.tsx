import React from "react";
import Gallery from "../../pages/gallery";

// Hall of Fame — same masthead + tabs the component renders. /user/gallery
// still resolves for any bookmarks / external links that haven't been
// updated; this is the canonical route the nav + footer point at.
const HallOfFamePage = () => {
  return (
    <div>
      <Gallery />
    </div>
  );
};

export default HallOfFamePage;
