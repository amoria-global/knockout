import type { ReactNode } from "react";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "OAuth",
  description: "Connekyt OAuth2 and OpenID Connect integration.",
  path: "/eco/oauth",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
