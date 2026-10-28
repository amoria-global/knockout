# Wish page and the event page cards

Same structure on web and mobile (`connekt-mobile` mirrors this file's rules).

## The link

`https://connekyt.com/wish/<event id>`, optionally `?from=<first name>`. The QR on the event page, the live page and the
dashboard host page all encode it (`lib/wishes/wishPage.ts`, mirrored in the other repos). `from` is sanitised (letters,
digits, space, `.` `'` `-`, 40 characters) and the "invited you" line is hidden when nothing usable is left.

Old links (`/user/events/view-event?id=...&tab=wishes`) still work and scroll to the wishes card.

## What the page shows

Rendered on the server from the public event (`app/wish/[id]/page.tsx`), so chat apps read real tags:
`og:image` is the event cover, `og:title` is "Send a wish · <title>", `og:description` is the heartfelt line, plus the
Twitter large-image card. The page is `noindex`.

- Upcoming or live: cover, date and time, optional invited-by line, the wish form.
- Ended or cancelled: cover and title with "Wishes for this event are closed" and a link to the event.
- Unpublished: the public API answers "not available", so nothing about the event is shown (no cover, no title), only the
  closed message. This is deliberate: it keeps `EventPublicAccessPolicy` intact.

Wishes use the existing `POST /public/events/{id}/wishes` and `/wishes/video`, so host approval is unchanged.

## Event page order

Cover and status, title, countdown, Date and time (one card, with Add to calendar), Wishes and memories (Send my wish |
Invite loved ones) and the heartfelt line, Hosted by (one card, one row with two chips when the organizer and photographer
share a user id), About, stream entry, donation, Get notified.

## Not done yet

Opening the app from the https link needs universal links: Android intent filters and iOS associated domains in the app
config, `assetlinks.json` and `apple-app-site-association` served from connekyt.com, and a new native build. Until then the
link opens the web page, and `connekt://wish/<id>` opens the app's wish screen.
