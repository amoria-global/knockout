"use client";

import { useState } from "react";
import Link from "next/link";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Navbar from "../components/navbar";
import Footer from "../components/footer";

/**
 * /user/browse-photos/recover
 *
 * Lets a returning buyer re-trigger ZIP+email delivery for any past
 * CONTENT-album purchases they made under a given email. No login —
 * the email itself is the credential. The backend response is
 * intentionally neutral (always "if we found anything, you'll get an
 * email") so a stranger plugging in someone else's email learns nothing.
 */

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL
    || "https://backend.connekyt.com").replace(/\/$/, "");

export default function BrowsePhotosRecoverPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/public/content/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Backend always returns 200 with a neutral message — we just
      // check action === 1.
      const j = await res.json().catch(() => ({}));
      if (j?.action === 1) {
        setDone(true);
      } else {
        setError(j?.message || 'Something went wrong. Please try again.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#f9fafb', paddingTop: 100 }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.06)', padding: '36px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(8,58,133,0.10)', color: '#083A85', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <i className="bi bi-envelope-paper" style={{ fontSize: 26 }} />
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Recover past purchases</h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280', lineHeight: 1.55 }}>
                Enter the email you used at checkout — we&apos;ll re-send a fresh
                download link (and ZIP attachment) for everything you&apos;ve bought.
              </p>
            </div>

            {done ? (
              <div style={{ padding: 14, background: '#dcfce7', borderRadius: 8, color: '#166534', fontSize: 13.5, textAlign: 'center' }}>
                If we found purchases under that email, your fresh download
                link is on its way. Check your inbox in a minute or two —
                also worth peeking in spam.
                <div style={{ marginTop: 14 }}>
                  <Link href="/user/browse-photos" style={{ color: '#166534', fontWeight: 700, textDecoration: 'none' }}>
                    ← Back to browse
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submit}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', marginBottom: 14 }}
                  disabled={busy}
                  required
                />
                {error && (
                  <div style={{ marginBottom: 10, padding: 8, background: '#fef2f2', color: '#991b1b', borderRadius: 6, fontSize: 12.5 }}>{error}</div>
                )}
                <button type="submit" disabled={busy}
                  style={{ width: '100%', padding: '12px 18px', background: busy ? '#9ca3af' : '#F20C8F', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer' }}>
                  {busy ? 'Sending…' : 'Email me my photos'}
                </button>
                <div style={{ marginTop: 14, textAlign: 'center' }}>
                  <Link href="/user/browse-photos" style={{ fontSize: 12.5, color: '#6b7280', textDecoration: 'none' }}>
                    ← Back to browse
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
