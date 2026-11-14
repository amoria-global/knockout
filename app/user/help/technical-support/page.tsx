import TechnicalSupportHelp from '../../../pages/help/technical-support';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Technical Support",
  description: "Fix playback, upload and sign-in problems, or contact our support team.",
  path: "/user/help/technical-support",
});

export default function TechnicalSupportHelpPage() {
  return <TechnicalSupportHelp />;
}
