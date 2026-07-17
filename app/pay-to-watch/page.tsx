import type { Metadata } from "next";
import PayToWatch from "../pages/pay-to-watch";

export const metadata: Metadata = {
  title: "Pay to watch · Connekyt",
  description: "Complete payment to unlock this stream on your TV.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PayToWatch />;
}
