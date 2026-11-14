import PaymentMethodsHelp from '../../../pages/help/payment-methods';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Payment Methods",
  description: "Mobile money, card and other ways to pay on Amoria Connekyt.",
  path: "/user/help/payment-methods",
});

export default function PaymentMethodsHelpPage() {
  return <PaymentMethodsHelp />;
}
