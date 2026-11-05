# Error reporting

What a person sees when something fails is decided by `lib/errorSystem/presentError.ts` and the catalogue beside it. This
file covers the other half: how the failure reaches the team.

## The support code ties both halves together

- The backend gives every unexpected failure a support code (`ApiErrors.unexpected`), logs the real exception under it,
  and returns it in the response body as `supportCode`.
- The page shows that code on the dialog or full-page error ("Support code 7F3-A2C") with a Copy button, and sends it
  with the report as the tag `support_code`.
- Support asks for the code, searches `support_code:7F3-A2C` in Sentry, and finds the backend event and the page event.

## What is reported, and what never is

Reports go through `report.ts`. Before anything leaves the browser it removes emails, phone numbers, bearer tokens,
JWTs, card-length digit runs, and the value of any key that looks secret (`password`, `token`, `otp`, `code`, `email`,
`phone`, `key`, `account`, `card`, and so on). `errorCode` stays readable. Request bodies and payment details are not
sent at all. Events are limited to 10 a minute per page and the same failure is sent once a minute.

## Turning it on

`startErrorReporting()` runs once from `ErrorHost`. It does nothing unless a DSN is set at build time:

    NEXT_PUBLIC_SENTRY_DSN=https://<key>@<host>/<projectId>
    NEXT_PUBLIC_SENTRY_RELEASE=<optional, e.g. the git sha>

Set them in the server environment the webhook build reads, then rebuild. A DSN is a public ingest key by design.

## Through this site's own origin

The page posts to `/api/monitoring` (`app/api/monitoring/route.ts`), which forwards to Sentry. An ad blocker that blocks
sentry.io therefore does not hide errors. The route is not an open relay: it forwards only an envelope whose DSN equals
this deployment's `NEXT_PUBLIC_SENTRY_DSN`, to that DSN's host and project, caps the size, and always answers 204. With
no DSN it accepts and drops everything.

## What it covers, and what it does not

Handled failures (the ones the user is shown) and uncaught errors and unhandled promise rejections
(`window.error`, `window.unhandledrejection`). There is no SDK, so there is no bundle weight and no build risk. It does
not yet give symbolicated stack traces from minified code; that needs source maps uploaded from the build, which is the
reason to move to `@sentry/nextjs` later if the traces matter.

## Status

Switched on 2026-11-05. Sentry organisation `amoria-global-tech` (EU data region), project `connekyt-landing`. The DSN is the
`NEXT_PUBLIC_SENTRY_DSN` line in `/var/www/front/knockout/.env.production` on the server. It is a public ingest key and is not in git. It is read at
build time, so changing it needs a rebuild (push to `main`).

To check it: open the site, run `window.dispatchEvent(new ErrorEvent('error', { error: new Error('sentry test') }))` in
the browser console, and the event appears under Issues in `connekyt-landing` within a minute, tagged `app:landing`.
