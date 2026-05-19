import type { Metadata } from 'next';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import { CodeBlock } from '../_eco';

export const metadata: Metadata = {
  title: 'Developer Docs',
  description: 'Connekyt ecosystem — OAuth2 / OpenID Connect & developer API reference.',
};

const TOC = [
  ['discovery', 'bi-compass', 'Discovery'],
  ['register', 'bi-rocket-takeoff', '1 · Register'],
  ['authorize', 'bi-shield-lock', '2 · Authorize'],
  ['token', 'bi-key', '3 · Get tokens'],
  ['call', 'bi-broadcast', '4 · Call APIs'],
  ['refresh', 'bi-arrow-repeat', '5 · Refresh'],
  ['scopes', 'bi-ui-checks', 'Scopes'],
];
const SCOPES: [string, string][] = [
  ['openid', 'Sign-in / identity'], ['profile', 'Name'], ['email', 'Email address'],
  ['wallet.read', 'Read wallet balance'], ['wallet.write', 'Move wallet funds'],
  ['transactions.read', 'Read transactions'], ['payments.create', 'Create payments'],
  ['payouts.create', 'Request payouts'], ['organizations.read', 'Read org data'],
  ['organizations.write', 'Manage org data'],
];

export default function EcoDocsPage() {
  return (
    <>
      <Navbar />
      <main className="eco">
        <div className="eco-wrap">
          <section className="eco-hero">
            <p className="k">Connekyt Developers</p>
            <h1>Build with Connekyt</h1>
            <p>OAuth2 &amp; OpenID Connect. Add “Continue with Connekyt” and call the
              Connekyt APIs on a user’s behalf — wallets, transactions and more.</p>
            <div className="eco-row" style={{ marginTop: 18 }}>
              <a className="eco-btn" href="/eco/developers"><i className="bi bi-grid-1x2" /> Developer console</a>
              <a className="eco-btn ghost" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}
                 href="https://backend.connekyt.com/api/v1/oauth/.well-known/openid-configuration">
                <i className="bi bi-compass" /> Discovery document
              </a>
            </div>
          </section>

          <div className="eco-docgrid">
            <nav className="eco-toc">
              {TOC.map(([id, ic, t]) => (
                <a key={id} href={`#${id}`}><i className={`bi ${ic}`} />{t}</a>
              ))}
            </nav>

            <article style={{ minWidth: 0 }}>
              <h2 id="discovery" className="eco-h2"><i className="bi bi-compass i" />Discovery</h2>
              <p className="eco-p">Standard OIDC metadata &amp; public keys (RS256 — verify tokens with no shared secret):</p>
              <CodeBlock method="GET" endpoint="/api/v1/oauth/.well-known/openid-configuration" />
              <CodeBlock method="GET" endpoint="/api/v1/oauth/jwks" />

              <h2 id="register" className="eco-h2"><i className="bi bi-rocket-takeoff i" />1 · Register an app</h2>
              <p className="eco-p">In the <a className="eco-link" href="/eco/developers">developer console</a>, create an app then an
                OAuth client (or an API key). The <code>client_secret</code> / API key is shown <strong>once</strong>.</p>

              <h2 id="authorize" className="eco-h2"><i className="bi bi-shield-lock i" />2 · Authorize (Authorization Code + PKCE)</h2>
              <CodeBlock method="GET" endpoint="/api/v1/oauth/authorize" lines={[
                '?response_type=code',
                '&client_id=ck_...',
                '&redirect_uri=https://yourapp/callback',
                '&scope=openid profile email wallet.read',
                '&state=xyz',
                '&code_challenge=BASE64URL(SHA256(verifier))',
                '&code_challenge_method=S256',
                '→ user signs in & approves at connekyt.com/eco/oauth',
                '→ 302  redirect_uri?code=...&state=xyz',
              ]} />

              <h2 id="token" className="eco-h2"><i className="bi bi-key i" />3 · Exchange code for tokens</h2>
              <p className="eco-p">Content-Type: <code>application/x-www-form-urlencoded</code></p>
              <CodeBlock method="POST" endpoint="/api/v1/oauth/token" lines={[
                'grant_type=authorization_code',
                'code=...   redirect_uri=...   client_id=ck_...',
                'client_secret=cks_...    (confidential clients)',
                'code_verifier=...        (PKCE)',
                '→ { access_token (RS256 JWT), refresh_token,',
                '    id_token, expires_in, scope }',
              ]} />

              <h2 id="call" className="eco-h2"><i className="bi bi-broadcast i" />4 · Call the APIs</h2>
              <p className="eco-p">Send <code>Authorization: Bearer &lt;access_token&gt;</code> (or <code>X-API-Key</code> for server-to-server):</p>
              <CodeBlock method="GET" endpoint="/api/v1/oauth/userinfo" />
              <CodeBlock method="GET" endpoint="/api/v1/wallet/summary" lines={['scope: wallet.read']} />
              <CodeBlock method="GET" endpoint="/api/v1/transactions" lines={['scope: transactions.read']} />
              <CodeBlock method="GET" endpoint="/api/v1/payouts/history" />

              <h2 id="refresh" className="eco-h2"><i className="bi bi-arrow-repeat i" />5 · Refresh (rotating)</h2>
              <CodeBlock method="POST" endpoint="/api/v1/oauth/token" lines={[
                'grant_type=refresh_token',
                'refresh_token=...   client_id=ck_...   client_secret=cks_...',
                '→ new access_token + NEW refresh_token',
                '  (old one revoked; reuse is detected & the chain killed)',
              ]} />

              <h2 id="scopes" className="eco-h2"><i className="bi bi-ui-checks i" />Scopes</h2>
              <div className="eco-scopes">
                {SCOPES.map(([s, d]) => (
                  <div key={s} className="eco-scope"><code>{s}</code><span>{d}</span></div>
                ))}
              </div>

              <div className="eco-note" style={{ marginTop: 30 }}>
                <i className="bi bi-info-circle" style={{ color: '#b45309', marginRight: 6 }} />
                Payouts route through Connekyt’s existing KYC-gated withdrawal flow — one money-moving path, nothing duplicated.
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
