# API Integration Guide

This directory contains all API route functions for the Connekt platform. **Each API endpoint has its own folder with a dedicated `route.ts` file.**

## 📁 Directory Structure

```
lib/
├── db.ts                                    # Core API client and utilities
└── APIs/
    ├── auth/
    │   ├── login/route.ts                  # User login
    │   ├── signup/route.ts                 # User registration
    │   ├── verify-otp/route.ts             # Email verification
    │   ├── forgot-password/route.ts        # Request password reset
    │   ├── reset-password/route.ts         # Reset password
    │   ├── set-new-password/route.ts       # Set new password
    │   ├── resend-otp/route.ts             # Resend OTP code
    │   ├── validate-token/route.ts         # Validate auth token
    │   ├── refresh-token/route.ts          # Refresh auth token
    │   └── logout/route.ts                 # User logout
    ├── contact/
    │   └── submit/route.ts                 # Contact form submission
    ├── events/
    │   ├── get-events/route.ts             # Browse events
    │   ├── get-event-details/route.ts      # Event details
    │   ├── create-event/route.ts           # Create event
    │   ├── join-event/route.ts             # Join event
    │   └── live-stream/route.ts            # Live streaming
    ├── photographers/
    │   ├── get-photographers/route.ts      # Browse photographers
    │   ├── get-profile/route.ts            # View profile
    │   └── get-reviews/route.ts            # Get reviews
    ├── bookings/
    │   ├── create-booking/route.ts         # Create booking
    │   ├── get-bookings/route.ts           # Get bookings
    │   └── payment/route.ts                # Process payment
    └── messages/
        ├── get-conversations/route.ts      # Get all chats
        ├── send-message/route.ts           # Send message
        └── get-messages/route.ts           # Get messages
```

## 🔌 Backend Connection

**Base URL**: `http://64.23.239.148`

All API functions automatically connect to this backend server using the configuration in [lib/db.ts](../db.ts).

## 🚀 Quick Start

### 1. Import the API functions you need:

```typescript
import { login } from '@/lib/APIs/auth/login/route';
import { signup } from '@/lib/APIs/auth/signup/route';
import { verifyOtp } from '@/lib/APIs/auth/verify-otp/route';
import { submitContactForm } from '@/lib/APIs/contact/submit/route';
import { getEvents } from '@/lib/APIs/events/get-events/route';
import { joinEvent } from '@/lib/APIs/events/join-event/route';
```

### 2. Use in your components:

```typescript
const handleLogin = async (email: string, password: string) => {
  const response = await login({ email, password });

  if (response.success) {
    console.log('Login successful:', response.data);
    // Token is automatically stored in localStorage
    router.push('/dashboard');
  } else {
    console.error('Login failed:', response.error);
    setError(response.error);
  }
};
```

### 3. Handle responses:

All API functions return a standardized response:

```typescript
{
  success: boolean;      // Whether the request succeeded
  data?: any;           // Response data (if successful)
  message?: string;     // Success message
  error?: string;       // Error message (if failed)
  errors?: Record<string, string[]>; // Validation errors
}
```

## 📚 API Categories

### 🔐 Authentication APIs (`lib/APIs/auth/`)

Authentication and user management.

**Available Functions:**

| Function | File | Endpoint | Description |
|----------|------|----------|-------------|
| `signup()` | `auth/signup/route.ts` | POST `/api/remote/auth/signup` | Register new user |
| `verifyOtp()` | `auth/verify-otp/route.ts` | POST `/api/remote/auth/verify-otp` | Verify email with OTP |
| `login()` | `auth/login/route.ts` | POST `/api/remote/auth/login` | User login |
| `logout()` | `auth/logout/route.ts` | - | User logout |
| `forgotPassword()` | `auth/forgot-password/route.ts` | POST `/api/remote/auth/forgot-password` | Request password reset |
| `resetPassword()` | `auth/reset-password/route.ts` | POST `/api/remote/auth/reset-password` | Reset password with code |
| `setNewPassword()` | `auth/set-new-password/route.ts` | POST `/api/remote/auth/set-new-password` | Set new password |
| `resendOtp()` | `auth/resend-otp/route.ts` | POST `/api/remote/auth/resend-otp` | Resend OTP code |
| `validateToken()` | `auth/validate-token/route.ts` | GET `/api/remote/auth/validate-token` | Check token validity |
| `refreshToken()` | `auth/refresh-token/route.ts` | GET `/api/remote/auth/refresh-token` | Get new access token |

**Usage Example:**
```typescript
import { signup } from '@/lib/APIs/auth/signup/route';
import { verifyOtp } from '@/lib/APIs/auth/verify-otp/route';

// Step 1: Sign up
const signupResponse = await signup({
  email: 'user@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  phone: '1234567890',
  countryCode: '+1',
  userType: 'client'
});

if (signupResponse.success) {
  // Step 2: Verify email
  const verifyResponse = await verifyOtp({
    email: 'user@example.com',
    otp: '123456'
  });

  if (verifyResponse.success) {
    // User is now logged in with token stored
    console.log('User:', verifyResponse.data?.user);
  }
}
```

### 📧 Contact APIs (`lib/APIs/contact/`)

Contact form submission.

| Function | File | Endpoint | Description |
|----------|------|----------|-------------|
| `submitContactForm()` | `contact/submit/route.ts` | POST `/api/remote/contact` | Submit contact inquiry |

**Usage Example:**
```typescript
import { submitContactForm } from '@/lib/APIs/contact/submit/route';

const response = await submitContactForm({
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  message: 'I have a question about your services.',
  subject: 'General Inquiry'
});
```

### 🎉 Events APIs (`lib/APIs/events/`)

Event creation, browsing, and participation.

| Function | File | Endpoint | Description |
|----------|------|----------|-------------|
| `getEvents()` | `events/get-events/route.ts` | GET `/api/remote/events` | Get all events with filters |
| `getEventDetails()` | `events/get-event-details/route.ts` | GET `/api/remote/events/:id` | Get specific event |
| `createEvent()` | `events/create-event/route.ts` | POST `/api/remote/events` | Create new event |
| `joinEvent()` | `events/join-event/route.ts` | POST `/api/remote/events/:id/join` | Join an event |
| `getLiveStreamInfo()` | `events/live-stream/route.ts` | GET `/api/remote/events/:id/live-stream` | Get live stream details |
| `startLiveStream()` | `events/live-stream/route.ts` | POST `/api/remote/events/:id/start-stream` | Start live streaming |
| `endLiveStream()` | `events/live-stream/route.ts` | POST `/api/remote/events/:id/end-stream` | End live streaming |

**Usage Example:**
```typescript
import { getEvents } from '@/lib/APIs/events/get-events/route';
import { joinEvent } from '@/lib/APIs/events/join-event/route';

// Browse events
const eventsResponse = await getEvents({
  page: 1,
  limit: 20,
  eventType: 'wedding',
  isVirtual: false,
  status: 'upcoming'
});

// Join an event
const joinResponse = await joinEvent({
  eventId: 'event-123',
  attendeeInfo: {
    numberOfGuests: 2,
    specialRequirements: 'Vegetarian meal'
  }
});
```

### 📸 Photographers APIs (`lib/APIs/photographers/`)

Photographer profiles, portfolios, and packages.

| Function | File | Endpoint | Description |
|----------|------|----------|-------------|
| `getPhotographers()` | `photographers/get-photographers/route.ts` | GET `/api/remote/photographers` | Browse photographers with filters |
| `getPhotographerProfile()` | `photographers/get-profile/route.ts` | GET `/api/remote/photographers/:id` | Get photographer details |
| `getPhotographerReviews()` | `photographers/get-reviews/route.ts` | GET `/api/remote/photographers/:id/reviews` | Get reviews |

**Usage Example:**
```typescript
import { getPhotographers } from '@/lib/APIs/photographers/get-photographers/route';
import { getPhotographerProfile } from '@/lib/APIs/photographers/get-profile/route';

// Search photographers
const photographersResponse = await getPhotographers({
  search: 'wedding',
  city: 'New York',
  minRating: 4.5,
  verified: true,
  sortBy: 'rating',
  sortOrder: 'desc'
});

// View profile
const profileResponse = await getPhotographerProfile('photographer-123');
```

### 📅 Bookings APIs (`lib/APIs/bookings/`)

Photographer bookings, payments, and contracts.

| Function | File | Endpoint | Description |
|----------|------|----------|-------------|
| `createBooking()` | `bookings/create-booking/route.ts` | POST `/api/remote/bookings` | Create new booking |
| `getBookings()` | `bookings/get-bookings/route.ts` | GET `/api/remote/bookings` | Get all bookings with filters |
| `processPayment()` | `bookings/payment/route.ts` | POST `/api/remote/bookings/:id/payment` | Process payment |

**Usage Example:**
```typescript
import { createBooking } from '@/lib/APIs/bookings/create-booking/route';
import { processPayment } from '@/lib/APIs/bookings/payment/route';

// Create booking
const bookingResponse = await createBooking({
  photographerId: 'photographer-123',
  packageId: 'package-456',
  eventDetails: {
    eventType: 'Wedding',
    eventDate: '2025-06-15',
    eventTime: '14:00',
    duration: '6 hours',
    location: {
      address: '123 Main St',
      city: 'New York',
      country: 'USA'
    },
    guestCount: 150
  },
  notes: 'Looking forward to working with you!'
});

// Process payment
if (bookingResponse.success) {
  const paymentResponse = await processPayment({
    bookingId: bookingResponse.data.booking.id,
    amount: 1500,
    paymentMethod: 'credit_card'
  });
}
```

### 💬 Messages APIs (`lib/APIs/messages/`)

Chat and messaging between users.

| Function | File | Endpoint | Description |
|----------|------|----------|-------------|
| `getConversations()` | `messages/get-conversations/route.ts` | GET `/api/remote/messages/conversations` | Get all conversations |
| `sendMessage()` | `messages/send-message/route.ts` | POST `/api/remote/messages` | Send a message |
| `getMessages()` | `messages/get-messages/route.ts` | GET `/api/remote/messages/conversations/:id/messages` | Get messages in conversation |

**Usage Example:**
```typescript
import { getConversations } from '@/lib/APIs/messages/get-conversations/route';
import { sendMessage } from '@/lib/APIs/messages/send-message/route';
import { getMessages } from '@/lib/APIs/messages/get-messages/route';

// Get conversations
const conversationsResponse = await getConversations();

// Send message
await sendMessage({
  conversationId: 'conv-123',
  content: 'Hi! I am interested in booking you for my wedding.',
  type: 'text'
});

// Get messages
const messagesResponse = await getMessages({
  conversationId: 'conv-123',
  page: 1,
  limit: 50
});
```

## 🔒 Authentication

### Token Management

Authentication tokens are automatically managed by the API client:

- **Login/Signup**: Token is automatically stored in `localStorage`
- **Logout**: Token is automatically removed
- **Protected Routes**: Token is automatically included in requests

### Manual Token Operations

```typescript
import { getAuthToken, setAuthToken, removeAuthToken, isAuthenticated } from '@/lib/db';

// Check if user is authenticated
if (isAuthenticated()) {
  console.log('User is logged in');
}

// Get current token
const token = getAuthToken();

// Manually set token (rarely needed)
setAuthToken('your-token-here');

// Remove token
removeAuthToken();
```

### Token Validation

```typescript
import { validateToken } from '@/lib/APIs/auth/validate-token/route';

// Validate current token
const validation = await validateToken();
if (validation.success && validation.data?.valid) {
  console.log('Token is valid');
}
```

## 🎨 Integration with React Components

### Example: Login Form

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/APIs/auth/login/route';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const response = await login({ email, password });

    if (response.success) {
      router.push('/dashboard');
    } else {
      setError(response.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## 🐛 Error Handling

All API functions return a consistent response format. Always check the `success` field:

```typescript
const response = await someAPIFunction(data);

if (response.success) {
  // Handle success
  console.log('Data:', response.data);
  console.log('Message:', response.message);
} else {
  // Handle error
  console.error('Error:', response.error);

  // Check for validation errors
  if (response.errors) {
    Object.entries(response.errors).forEach(([field, messages]) => {
      console.error(`${field}:`, messages.join(', '));
    });
  }
}
```

## 📝 TypeScript Support

All API functions are fully typed. Import types as needed:

```typescript
import type { SignupRequest, SignupResponse } from '@/lib/APIs/auth/signup/route';
import type { Event } from '@/lib/APIs/events/get-events/route';
import type { Photographer } from '@/lib/APIs/photographers/get-photographers/route';
import type { Booking } from '@/lib/APIs/bookings/create-booking/route';
```

## 🔄 Next Steps

1. **Update your existing forms** to use these API functions instead of `console.log`
2. **Add loading states** to provide user feedback during API calls
3. **Implement error handling** to display user-friendly error messages
4. **Add authentication checks** to protect routes that require login
5. **Test each API endpoint** in Swagger before integrating with frontend

## 📞 Support

If you encounter any issues or the API responses don't match expectations:

1. Test the endpoint in Swagger first
2. Check the browser console for error messages
3. Verify the request payload matches the expected format
4. Confirm authentication token is present for protected routes
5. Contact the backend developer with specific error details

---

**Backend URL**: http://64.23.239.148
**Documentation**: This file
**Last Updated**: 2025-11-07
