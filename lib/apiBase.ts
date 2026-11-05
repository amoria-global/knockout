/** The backend origin for plain public reads (no auth, no retry wrapper), without a trailing slash. */
export function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com').replace(/\/+$/, '');
}
