import React from "react";
import Gallery from "../pages/gallery";

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
