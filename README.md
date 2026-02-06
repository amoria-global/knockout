# Amoria Connekt — Home

Connecting moments, creating memories. The public-facing web application for **Amoria** — an all-in-one platform for professional event photography and live streaming.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion, GSAP (ScrollTrigger)
- **Auth:** Google OAuth, JWT
- **i18n:** next-intl (English, French, Spanish)
- **AI/ML:** TensorFlow.js, MediaPipe (Face Mesh)
- **Maps:** D3-geo, React Simple Maps

## Features

- **Landing Page** — Hero section, how-it-works, global network visualization, peel transition animations
- **Authentication** — Email/password login, Google OAuth, OTP verification, password reset
- **Photographer Discovery** — Browse, filter by location/category, view profiles, ratings & reviews
- **Booking** — Book photographers directly with package selection
- **Events** — Browse events, join with guest info, live streaming
- **User Profile** — Profile management and photographer guide
- **Help Center** — Booking, payment, account, and technical support pages
- **Internationalization** — Full English, French, and Spanish support

## Project Structure

```
app/
├── api/proxy/            # API proxy routes
├── components/           # Shared components (Navbar, Footer, Preloader, Toast, etc.)
├── pages/                # Page components used by routes
├── providers/            # AuthProvider, GoogleOAuthProvider, LanguageProvider
├── user/
│   ├── auth/             # Login, Signup, OTP, Password Reset
│   ├── photographers/    # Browse, View Profile, Book Now
│   ├── events/           # Browse, View, Join, Live Stream
│   └── ...               # Help Center, About, Contact, Legal
├── utils/                # Utility functions
├── globals.css           # Global styles
├── layout.tsx            # Root layout with providers
└── page.tsx              # Landing page
lib/
├── api/                  # API client (interceptors, retry, rate-limit, logging)
├── APIs/                 # Endpoint modules (auth, photographers, events, bookings, etc.)
├── notifications/        # Toast notification system
├── errors/               # Error handling
└── utils/                # General utilities
messages/                 # i18n translation files (en, fr, es)
public/                   # Static assets (images, videos)
```

## Getting Started

### Prerequisites

- Node.js 18+
- yarn or npm

### Installation

```bash
# Install dependencies
yarn install

# Start development server (Turbopack)
yarn dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
```

### Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Start dev server with Turbopack |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |

## API Integration

The app communicates with the backend through an enhanced API client (`lib/api/`) featuring:

- Automatic retries with exponential backoff
- Rate limiting per endpoint
- Request/response interceptors
- Token refresh on 401 responses
- Request deduplication for GET requests
- Comprehensive logging with request IDs

### API Modules

| Module | Purpose |
|--------|---------|
| `auth` | Login, signup, OTP, password reset, token refresh |
| `photographers` | Browse, profiles, reviews |
| `events` | Create, browse, join, live streaming |
| `bookings` | Create bookings, manage payments |
| `messages` | Chat between users |
| `packages` | Photographer pricing packages |
| `public` | Cities, categories (no auth required) |

## Related Projects

| Project | Description |
|---------|-------------|
| [dashboard](../dashboard) | Role-based dashboard for photographers, clients, and event coordinators |
