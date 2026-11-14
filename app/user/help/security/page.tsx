import SecurityHelp from '../../../pages/help/security';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Security Help",
  description: "How we keep your account and payments safe, and how you can too.",
  path: "/user/help/security",
});

export default function SecurityHelpPage() {
  return <SecurityHelp />;
}
