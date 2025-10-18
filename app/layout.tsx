import type { Metadata, Viewport } from "next";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import BackToTop from "./components/BackToTop";

export const metadata: Metadata = {
  title: "Amoria Connekt",
  description: "Connecting moments, creating memories. Your trusted platform for professional event photography and live streaming.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
