import type { Metadata, Viewport } from "next";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import BackToTop from "./components/BackToTop";
import { LanguageProvider } from "./providers/LanguageProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { ToastProvider } from "@/lib/notifications/ToastProvider";
import { ToastContainer } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Amoria connekyt",
  description: "Connecting moments, creating memories. Your trusted platform for professional event photography and live streaming.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#083A85",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <ErrorBoundary>
                {children}
                <BackToTop />
                <ToastContainer />
              </ErrorBoundary>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
