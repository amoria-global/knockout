import type { Metadata } from 'next';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';

export const metadata: Metadata = {
  title: 'Developer Docs',
  description: 'Connekyt ecosystem — OAuth2 / OpenID Connect & developer API reference.',
};

const SECTIONS = [
  { id: 'discovery', icon: 'bi-compass', t: 'Discovery' },
  { id: 'register', icon: 'bi-rocket-takeoff', t: '1 · Register an app' },
  { id: 'authorize', icon: 'bi-shield-lock', t: '2 · Authorize (PKCE)' },
  { id: 'token', icon: 'bi-key', t: '3 · Get tokens' },
  { id: 'call', icon: 'bi-broadcast', t: '4 · Call APIs' },
  { id: 'refresh', icon: 'bi-arrow-repeat', t: '5 · Refresh' },
  { id: 'scopes', icon: 'bi-ui-checks', t: 'Scopes' },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-xl bg-[#0b1020] p-4 text-[12.5px] leading-relaxed text-gray-200">
      <code>{children}</code>
    </pre>
  );
}
function H({ id, icon, children }: { id: string; icon: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 scroll-mt-28 flex items-center gap-2 text-xl font-bold text-[#083A85]">
      <i className={`bi ${icon} text-[#F20C8F]`} />{children}
    </h2>
  );
}

export default function EcoDocsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-white pt-24 pb-20 md:pt-28">
        <div className="mx-auto max-w-6xl px-4">
          {/* Hero */}
          <div className="rounded-3xl bg-gradient-to-r from-[#083A85] to-[#F20C8F] p-8 text-white md:p-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/70">Connekyt Developers</p>
            <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Build with Connekyt</h1>
            <p className="mt-3 max-w-2xl text-white/90">
              OAuth2 &amp; OpenID Connect. Add “Continue with Connekyt” and call the
              Connekyt APIs on a user’s behalf — wallets, transactions and more.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/eco/developers" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#083A85] transition hover:opacity-90">
                <i className="bi bi-grid-1x2 mr-2" />Developer console
              </a>
              <a href="https://backend.connekyt.com/api/v1/oauth/.well-known/openid-configuration"
                 className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                <i className="bi bi-compass mr-2" />Discovery document
              </a>
            </div>
          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-[220px_1fr]">
            {/* Sticky in-page nav */}
            <nav className="hidden md:block">
              <ul className="sticky top-28 space-y-1 text-sm">
                {SECTIONS.map(s => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 transition hover:bg-[#083A85]/5 hover:text-[#083A85]">
                      <i className={`bi ${s.icon}`} />{s.t}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <article className="min-w-0">
              <H id="discovery" icon="bi-compass">Discovery</H>
              <p className="mt-2 text-gray-600">Standard OIDC metadata &amp; public keys (RS256 — verify tokens without any shared secret):</p>
              <Code>{`GET /api/v1/oauth/.well-known/openid-configuration
GET /api/v1/oauth/jwks`}</Code>

              <H id="register" icon="bi-rocket-takeoff">1 · Register an app</H>
              <p className="mt-2 text-gray-600">In the <a className="font-semibold text-[#F20C8F]" href="/eco/developers">developer console</a>, create an app then an OAuth client (or an API key). The <code className="rounded bg-gray-100 px-1">client_secret</code> / API key is shown <strong>once</strong>.</p>

              <H id="authorize" icon="bi-shield-lock">2 · Authorize (Authorization Code + PKCE)</H>
              <Code>{`GET /api/v1/oauth/authorize
  ?response_type=code
  &client_id=ck_...
  &redirect_uri=https://yourapp/callback
  &scope=openid profile email wallet.read
  &state=xyz
  &code_challenge=BASE64URL(SHA256(verifier))
  &code_challenge_method=S256

→ user signs in & approves at connekyt.com/eco/oauth
→ 302  redirect_uri?code=...&state=xyz`}</Code>

              <H id="token" icon="bi-key">3 · Exchange code for tokens</H>
              <Code>{`POST /api/v1/oauth/token        (x-www-form-urlencoded)
  grant_type=authorization_code
  code=...  redirect_uri=...  client_id=ck_...
  client_secret=cks_...           (confidential clients)
  code_verifier=...               (PKCE)

→ { access_token (RS256 JWT), refresh_token,
    id_token, expires_in, scope }`}</Code>

              <H id="call" icon="bi-broadcast">4 · Call the APIs</H>
              <Code>{`Authorization: Bearer <access_token>

GET /api/v1/oauth/userinfo
GET /api/v1/wallet/summary       scope: wallet.read
GET /api/v1/transactions         scope: transactions.read
GET /api/v1/payouts/history

# server-to-server:  X-API-Key: <api key>`}</Code>

              <H id="refresh" icon="bi-arrow-repeat">5 · Refresh (rotating)</H>
              <Code>{`POST /api/v1/oauth/token
  grant_type=refresh_token
  refresh_token=...  client_id=ck_...  client_secret=cks_...

→ new access_token + NEW refresh_token
  (old one revoked; reuse is detected & the chain is killed)`}</Code>

              <H id="scopes" icon="bi-ui-checks">Scopes</H>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  ['openid', 'Sign-in / identity'], ['profile', 'Name'], ['email', 'Email address'],
                  ['wallet.read', 'Read wallet balance'], ['wallet.write', 'Move wallet funds'],
                  ['transactions.read', 'Read transactions'], ['payments.create', 'Create payments'],
                  ['payouts.create', 'Request payouts'], ['organizations.read', 'Read org data'],
                  ['organizations.write', 'Manage org data'],
                ].map(([s, d]) => (
                  <div key={s} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                    <code className="font-semibold text-[#083A85]">{s}</code>
                    <span className="text-gray-500">{d}</span>
                  </div>
                ))}
              </div>

              <div className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <i className="bi bi-info-circle mr-2" />
                Payouts route through Connekyt’s existing KYC-gated withdrawal flow —
                there is exactly one money-moving path.
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
