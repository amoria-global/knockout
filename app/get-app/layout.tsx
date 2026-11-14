import type { ReactNode } from "react";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Get the App",
  description: "Download the Amoria Connekyt app to book photographers, join events and watch live streams.",
  path: "/get-app",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
