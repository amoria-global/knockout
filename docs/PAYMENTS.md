# Payments on the web client

**This client owns payment correctness for the whole product.** The mobile app
has no native payment flow — it opens these very pages in an in-app browser, so
a bug here hits app users too, and a fix here reaches them with no app release.

Read this before changing `app/components/XentriPayModal.tsx`,
`lib/APIs/payments/*`, or any checkout surface
(`find-my-photos`, `browse-photos`, `browse-photos-album`, `join-package`,
`live-stream`, `donations`, `complete-payment`).

Every rule below was broken in production and cost a real buyer real money.

---

## 1. Anonymous buyers must poll the PUBLIC status endpoint

Photo buyers, stream buyers and donors have **no session**. The authenticated
status route is refused client-side before a request is ever sent, so polling
it means no network call happens at all — the poller just retries until it
times out.

```ts
// XentriPayModal.tsx — every buyer-facing payment type belongs here
const usePublicStatus = paymentType === 'donation'
  || paymentType === 'album_purchase'
  || paymentType === 'multi_album_purchase';
```

*What happened:* `multi_album_purchase` — the type hard-coded for the **entire
browse-photos checkout** — was missing. Anonymous buyers paid, the poller spun
for five minutes with no request going out, and the modal then reported
"payment status check timed out" to someone whose money the gateway had
already taken.

`checkXentriPayStatus` now falls through to the public endpoint when there is
no token, so a missing entry in that condition can no longer strand a buyer. A
status read is not privileged. **Do not "harden" that fallback away.**

> Adding a new `PaymentType` to the union? Add it to `usePublicStatus` in the
> same commit unless the payer is guaranteed to be authenticated.

## 2. Never offer a retry after a charge may have landed

The `failed` step offers a Retry that re-initiates the same cart. If the buyer
was in fact charged, that is a second charge — and the backend's
already-purchased guard cannot save them, because content-album rows carry no
`buyerId`.

A timeout, a network error, or an unknown status is **not** a failure. Tell the
buyer to check their phone for a prompt and to check their email for an unlock
code before paying again.

## 3. Always check `action` on the envelope

The backend returns `{action: 1|0, message, data}` with **HTTP 200 even for
failures**. An HTTP 200 with `action: 0` is a failure. Treating the HTTP status
as the verdict is how a purchase gets reported as successful when nothing
settled.

## 4. Every path needs a terminal state

No unbounded spinners. A buyer must always end at either "you have your
photos" or a clear, actionable message. "Waiting for the gateway to confirm"
forever is the single worst outcome — it is indistinguishable from theft from
the buyer's side.

Settlement normally completes in well under a minute; a live purchase on
2026-08-23 settled in 26 seconds. If polling is still pending after a
reasonable window, say so plainly and point the buyer at their email and the
unlock-by-email path — do not silently keep spinning.

## 5. Never put a buyer's email in a URL

Album and photo links carry the access code only. The backend resolves the
recipient from the album when no email is supplied. An email in a query string
lands in browser history, in the `Referer` of every request the page makes, and
in anything the link is pasted into.

## 6. Unlock always has two doors

A buyer can unlock with the **code** or with the **email used at checkout**.
Keep both visible. When a receipt goes astray, the email path is what rescues
the purchase — it is what recovered a stranded buyer on 2026-08-23.

Both are case- and whitespace-tolerant server-side; do not add client-side
validation stricter than the server's.

---

## Before you ship a change here

1. Does every buyer-facing `paymentType` poll the public status endpoint?
2. Is `action` checked on every payment response?
3. Can any failure path offer a retry after money may have moved?
4. Does every state eventually terminate with something the buyer can act on?
5. Are the code **and** email unlock paths both still reachable?

Backend invariants (gateway routing, idempotency, webhooks, refunds) live in
the backend repo at `docs/PAYMENTS.md`. Read it before changing anything that
touches money.

**Known gap:** there is no refund path for album purchases anywhere in the
product. If a buyer is charged and something goes wrong, no admin action can
refund them or re-issue a code.
