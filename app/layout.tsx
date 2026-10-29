import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import BackToTop from "./components/BackToTop";
import { LanguageProvider } from "./providers/LanguageProvider";
import { AuthProvider } from "./providers/AuthProvider";
import GoogleOAuthProvider from "./providers/GoogleOAuthProvider";
import { ToastProvider } from "@/lib/notifications/ToastProvider";
import { BannerNotification, OfflineBanner } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AppInstallWizard from "./components/AppInstallWizard";
import { SITE_URL, SITE_NAME } from "@/lib/seo/seo";

const DEFAULT_DESCRIPTION =
  "Amoria Connekyt - book professional event photographers and reserve spots or watch live-streamed events. Discover recent and upcoming events and studios.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Child pages set just their part (e.g. "Book - Legacy Studio") and this
  // template appends the brand → "Book - Legacy Studio | Amoria Connekyt".
  title: {
    default: `${SITE_NAME} - Event Photography & Live Streaming`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Connekyt", "Amoria Connekyt", "event photography", "photographers",
    "live streaming events", "book photographer", "watch live event",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Event Photography & Live Streaming`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Event Photography & Live Streaming`,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

// Brand JSON-LD so a "connekyt" search can surface the site + its search box.
const SITE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.ico`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#org` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/user/photographers?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSONLD) }}
        />
        <LanguageProvider>
          <GoogleOAuthProvider>
            <AuthProvider>
              <ToastProvider>
                <ErrorBoundary>
                  {children}
                  <BackToTop />
                  <BannerNotification />
                  <OfflineBanner />
                  <Suspense fallback={null}>
                    <AppInstallWizard />
                  </Suspense>
                </ErrorBoundary>
              </ToastProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
