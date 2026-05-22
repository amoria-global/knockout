import type { Metadata } from "next";
import BrowsePhotos from "../../pages/browse-photos";

export const metadata: Metadata = {
  title: "Browse Photos · Connekyt",
  description: "Browse stock-style photography by category, price, and photographer. Per-photo paid download - photos arrive in your inbox.",
  openGraph: {
    title: "Browse Photos · Connekyt",
    description: "Curated photography for press, newspaper, luxury, nature, sport, and more.",
    type: "website",
  },
};

export default function Page() {
  return <BrowsePhotos />;
}
