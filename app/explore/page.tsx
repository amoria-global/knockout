import type { Metadata } from "next";
import ExploreClient from "./ExploreClient";

export const metadata: Metadata = {
  title: "Explore · Connekyt",
  alternates: { canonical: "/explore" },
  description: "Photos and short video clips from Connekyt creators. Watch a preview, pick what you love and get the original in your inbox.",
  openGraph: {
    title: "Explore · Connekyt",
    description: "Photos and video clips from creators across Africa and beyond.",
    type: "website",
  },
};

export default function Page() {
  return <ExploreClient />;
}
