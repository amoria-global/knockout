import type { ReactNode } from "react";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Developers",
  description: "Build on Connekyt with OAuth sign-in and the public API.",
  path: "/eco/developers",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
