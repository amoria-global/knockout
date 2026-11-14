import MyAccountHelp from '../../../pages/help/my-account';
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Account Help",
  description: "Manage your profile, sign-in and account settings on Amoria Connekyt.",
  path: "/user/help/my-account",
});

export default function MyAccountHelpPage() {
  return <MyAccountHelp />;
}
