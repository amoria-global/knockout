import type { ReactNode } from "react";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Live Streams",
  description: "Watch live-streamed events on Amoria Connekyt.",
  path: "/user/events/live-stream",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
