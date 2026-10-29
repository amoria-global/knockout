# Connekyt Landing — Project Instructions

> Shared rules (repo map, deploy paths, UI design directive, commit and prose
> conventions) live in `~/.claude/CLAUDE.md` and load automatically. This file only
> carries what is specific to this repo.

## ⚠️ Payments — read `docs/PAYMENTS.md` before touching payment code

Applies to `app/components/XentriPayModal.tsx`, `lib/APIs/payments/*`, and any
checkout surface (`find-my-photos`, `browse-photos`, `browse-photos-album`,
`join-package`, `live-stream`, `donations`, `complete-payment`).

**This client owns payment correctness for the whole product.** The mobile app
has no native payment flow — it opens these pages in an in-app browser, so a
bug here hits app users too and a fix here reaches them with no app release.

Each rule below was broken in production and cost a real buyer real money:

1. **Anonymous buyers must poll the PUBLIC status endpoint.** Photo/stream
   buyers and donors have no session, so the authenticated route is refused
   client-side and no request is ever sent. Every buyer-facing `PaymentType`
   must be in `usePublicStatus` — a missing one made the whole browse-photos
   checkout tell paid buyers their payment had failed.
2. **Never offer a retry after a charge may have landed.** A timeout is not a
   failure. Tell the buyer to check their phone and their email first.
3. **Always check `action`.** The backend returns HTTP 200 even for failures;
   `action: 0` with a 200 is a failure.
4. **Every path needs a terminal state.** No unbounded spinners — that is
   indistinguishable from theft from the buyer's side.
5. **Never put a buyer's email in a URL.** Access code only.
6. **Keep both unlock doors** (code and checkout email) reachable. The email
   path is what rescues a purchase when a receipt goes astray.

Backend invariants live in the backend repo's `docs/PAYMENTS.md`.
**Known gap:** there is no refund path for album purchases anywhere.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
