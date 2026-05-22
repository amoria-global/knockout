import type { Metadata } from "next";
import BrowsePhotosSuccess from "../../../../pages/browse-photos-success";

export const metadata: Metadata = {
  title: "Your purchase · Connekyt",
  description: "Your Connekyt photos are being prepared and emailed to you.",
  robots: { index: false, follow: false },
};

type Params = Promise<{ refid: string }>;

export default async function Page({ params }: { params: Params }) {
  const { refid } = await params;
  return <BrowsePhotosSuccess refid={refid} />;
}
