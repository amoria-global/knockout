import { redirect } from 'next/navigation';

/**
 * Legacy redirect: pre-fix password-reset emails pointed at
 * `/reset-password?token=…` because the backend built that URL.
 * The actual page lives at `/user/auth/resetpswd`. Backend was
 * updated to emit the correct URL going forward, but emails
 * already in the wild still link here — preserve the token
 * query string and redirect so those viewers don't hit 404.
 */
export default async function ResetPasswordLegacyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token;
  const dest = token
    ? `/user/auth/resetpswd?token=${encodeURIComponent(token)}`
    : '/user/auth/resetpswd';
  redirect(dest);
}
