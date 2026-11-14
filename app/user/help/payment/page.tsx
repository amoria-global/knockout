import PaymentHelp from '../../../pages/help/payment';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Payment Help",
  description: "How payments, receipts and refunds work on Amoria Connekyt.",
  path: "/user/help/payment",
});

export default function PaymentHelpPage() {
  return <PaymentHelp />;
}
