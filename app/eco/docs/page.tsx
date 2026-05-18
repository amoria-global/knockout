import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Docs',
  description: 'Connekyt ecosystem — OAuth2/OpenID Connect & developer API reference.',
};

const code: React.CSSProperties = {
  background: '#0b1020', color: '#e5e7eb', padding: '.9rem 1rem',
  borderRadius: 10, fontSize: '.78rem', overflowX: 'auto', whiteSpace: 'pre',
};
const h2: React.CSSProperties = { fontSize: '1.05rem', fontWeight: 700, margin: '1.6rem 0 .5rem', color: '#083A85' };

export default function EcoDocsPage() {
  return (
    <div style={{ maxWidth: 760, margin: '4vh auto', padding: '0 1rem',
      fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#083A85' }}>Connekyt Developer Docs</h1>
      <p style={{ color: '#6b7280' }}>
        OAuth2 + OpenID Connect. Build “Continue with Connekyt” and call the
        Connekyt APIs on a user’s behalf. Manage apps at <a href="/eco/developers">/eco/developers</a>.
      </p>

      <h2 style={h2}>Discovery</h2>
      <div style={code}>{`GET https://backend.connekyt.com/api/v1/oauth/.well-known/openid-configuration
GET https://backend.connekyt.com/api/v1/oauth/jwks   (RS256 public keys)`}</div>

      <h2 style={h2}>1. Register</h2>
      <p style={{ fontSize: '.9rem' }}>Create an app, then an OAuth client (or an API key) in the developer console. The <code>client_secret</code> / API key is shown once.</p>

      <h2 style={h2}>2. Authorization Code + PKCE</h2>
      <div style={code}>{`GET /api/v1/oauth/authorize
  ?response_type=code
  &client_id=ck_...
  &redirect_uri=https://yourapp/callback
  &scope=openid profile email wallet.read
  &state=xyz
  &code_challenge=<base64url(sha256(verifier))>
  &code_challenge_method=S256
→ user signs in & consents at connekyt.com/eco/oauth
→ 302 redirect_uri?code=...&state=xyz`}</div>

      <h2 style={h2}>3. Exchange code for tokens</h2>
      <div style={code}>{`POST /api/v1/oauth/token   (application/x-www-form-urlencoded)
  grant_type=authorization_code
  code=...&redirect_uri=...&client_id=ck_...
  &client_secret=cks_...        (confidential clients)
  &code_verifier=...            (PKCE)
→ { access_token (RS256 JWT), refresh_token, id_token, expires_in, scope }`}</div>

      <h2 style={h2}>4. Call APIs</h2>
      <div style={code}>{`Authorization: Bearer <access_token>
GET  /api/v1/oauth/userinfo
GET  /api/v1/wallet/summary        (scope: wallet.read)
GET  /api/v1/transactions          (scope: transactions.read)
GET  /api/v1/payouts/history
# server-to-server: header  X-API-Key: <api key>`}</div>

      <h2 style={h2}>5. Refresh (rotating)</h2>
      <div style={code}>{`POST /api/v1/oauth/token
  grant_type=refresh_token&refresh_token=...&client_id=ck_...&client_secret=cks_...
→ new access_token + NEW refresh_token (old one is revoked; reuse is detected)`}</div>

      <h2 style={h2}>Scopes</h2>
      <p style={{ fontSize: '.85rem', color: '#374151' }}>
        openid · profile · email · wallet.read · wallet.write · transactions.read ·
        payments.create · payouts.create · organizations.read · organizations.write
      </p>

      <h2 style={h2}>Notes</h2>
      <ul style={{ fontSize: '.85rem', color: '#374151' }}>
        <li>Tokens are RS256 — verify with the JWKS endpoint (no shared secret).</li>
        <li>Refresh tokens rotate; a reused refresh token revokes the whole chain.</li>
        <li>Payouts route through Connekyt’s existing KYC-gated withdrawal flow.</li>
      </ul>
    </div>
  );
}
