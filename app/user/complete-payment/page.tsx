import type { Metadata } from "next";
import CompletePayment from "../../pages/complete-payment";

export const metadata: Metadata = {
  title: "Complete your payment · Connekyt",
  description: "Finish the payment you started in the Connekyt app.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CompletePayment />;
}
