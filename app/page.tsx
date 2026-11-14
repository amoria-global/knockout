import type { Metadata } from "next";
import HomeClient from "./HomeClient";

// The home page is a client component, so its metadata lives in this server wrapper.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomeClient />;
}
