import type { ReactNode } from "react";
import { staticPageMetadata } from "@/lib/seo/seo";

export const metadata = staticPageMetadata({
  title: "Terms of Service",
  description: "The terms that apply when you use Amoria Connekyt.",
  path: "/user/terms-of-service",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
