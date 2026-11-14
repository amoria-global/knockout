import ConnectTvPage from "../../pages/tv/connect";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Connect Your TV",
  description: "Link your TV to watch Amoria Connekyt events on the big screen.",
  path: "/user/connect-tv",
  index: false,
});

const Page = () => {
  return <ConnectTvPage />;
}
export default Page;
