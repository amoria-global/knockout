import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

// Security headers applied to every response.
// CSP is kept relatively permissive while we roll it out - tighten after 1 week of
// CSP-report logs show what's actually being loaded.
const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    // fullscreen=(self) is the browser default for top-level docs but
    // listing it explicitly guards against reverse-proxy / iframe
    // contexts silently revoking it, which would make the live-stream
    // player's Fullscreen button a no-op on tap.
    value: 'camera=(self), microphone=(self), geolocation=(self), fullscreen=(self), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.google.com https://www.gstatic.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Third-party image hosts the landing components already load:
      //   flagcdn        - language/country flag thumbnails in navbar + login
      //   unsplash       - event-photo placeholders (events listing, join-event/join-package)
      //   pinimg         - default photographer avatar placeholder
      //   svgrepo        - Google sign-in button icon
      //   gstatic        - Google sign-in button icon (Firebase UI variant)
      //   unpkg          - three-globe Earth texture images (HalfEarth component)
      //   googleusercontent - Google profile picture after OAuth login
      //   ui-avatars     - auto-generated participant avatar fallback in live-stream
      "img-src 'self' data: blob: https://backend.connekyt.com https://*.cloudflarestream.com https://lh3.googleusercontent.com https://flagcdn.com https://images.unsplash.com https://i.pinimg.com https://www.svgrepo.com https://www.gstatic.com https://unpkg.com https://ui-avatars.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      // cdn.jsdelivr.net          - world-atlas TopoJSON fetched by Rotating/HalfEarth globes
      // unpkg.com                 - three-globe texture URLs are also fetched via JS, not only rendered as <img>
      // www.googleapis.com        - /oauth2/v3/userinfo call in handleGoogleLoginSuccess /
      //                             handleGoogleSignupSuccess (auth/login.tsx) to resolve the
      //                             Google account's email + given/family name after GIS returns an
      //                             access token. Without this, Google sign-in fails with "Failed to fetch".
      // *.cloudflarestream.com    - WHEP HTTP SDP exchange in WHEPClient, used by
      //                             events/live-stream.tsx to play paid live streams.
      "connect-src 'self' https://backend.connekyt.com https://dashboard.connekyt.com https://accounts.google.com https://www.googleapis.com wss://backend.connekyt.com https://cdn.jsdelivr.net https://unpkg.com https://*.cloudflarestream.com",
      "media-src 'self' blob: https://*.cloudflarestream.com",
      // www.google.com - Google Maps embed iframe on the contact page.
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
  // page-flip (used internally by react-pageflip) ships only a CJS build with no ESM
  // "module" field, which trips Turbopack's ESM resolver. Transpiling both packages
  // through SWC routes them through Next's bundler and resolves the module graph cleanly.
  transpilePackages: ['react-pageflip', 'page-flip'],
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
