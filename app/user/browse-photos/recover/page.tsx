import type { Metadata } from "next";
import BrowsePhotosRecover from "../../../pages/browse-photos-recover";

export const metadata: Metadata = {
  title: "Recover purchases · Connekyt",
  description: "Re-send your past Connekyt photo downloads to your email.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BrowsePhotosRecover />;
}
