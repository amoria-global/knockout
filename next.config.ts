import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

// Security headers applied to every response.
// CSP is kept relatively permissive while we roll it out — tighten after 1 week of
// CSP-report logs show what's actually being loaded.
const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.google.com https://www.gstatic.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Third-party image hosts the landing components already load:
      //   flagcdn        — language/country flag thumbnails in navbar + login
      //   unsplash       — event-photo placeholders (events listing, join-event/join-package)
      //   pinimg         — default photographer avatar placeholder
      //   svgrepo        — Google sign-in button icon
      //   gstatic        — Google sign-in button icon (Firebase UI variant)
      //   unpkg          — three-globe Earth texture images (HalfEarth component)
      //   googleusercontent — Google profile picture after OAuth login
      //   ui-avatars     — auto-generated participant avatar fallback in live-stream
      "img-src 'self' data: blob: https://backend.connekyt.com https://*.cloudflarestream.com https://lh3.googleusercontent.com https://flagcdn.com https://images.unsplash.com https://i.pinimg.com https://www.svgrepo.com https://www.gstatic.com https://unpkg.com https://ui-avatars.com",
      "font-src 'self' data: https://fonts.gstatic.com",
       "connect-src 'self' http://localhost:8081 https://backend.connekyt.com https://dashboard.connekyt.com https://accounts.google.com wss://backend.connekyt.com",
      "media-src 'self' blob: https://*.cloudflarestream.com",
      // www.google.com — Google Maps embed iframe on the contact page.
      "frame-src 'self' https://accounts.google.com https://customer-ngk2huwatflljurq.cloudflarestream.com https://*.cloudflarestream.com https://www.google.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'backend.connekyt.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
