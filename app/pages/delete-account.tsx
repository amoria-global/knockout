'use client';

import React from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

/**
 * Public account-deletion request page.
 *
 * Google Play requires account-based apps to offer a deletion route that works
 * without installing the app, so this page is deliberately public, static and
 * login-free. The copy must keep matching what the backend actually does
 * (CustomerProfileController: anonymise and disable, financial records
 * retained) — an overstated promise here is worse than no page.
 */

const SUPPORT_EMAIL = 'privacy@amoriaglobal.com';

const REMOVED = [
  'Your name, replaced with “Deleted User”',
  'Your email address and phone number',
  'Your profile photo, cover photo, and bio',
  'Your address and username',
  'Your password and two-factor authentication secret — sign-in is permanently disabled',
];

const RETAINED = [
  'Bookings, payments, and payout records, which we are legally required to keep for accounting and tax purposes',
  'Records already required by Rwandan law or an ongoing dispute',
];

const styles: Record<string, React.CSSProperties> = {
  page: { background: '#F4F6FB', minHeight: '100vh' },
  wrap: { maxWidth: 820, margin: '0 auto', padding: '48px 20px 72px' },
  kicker: {
    color: '#F20C8F',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  h1: { color: '#083A85', fontSize: 38, lineHeight: 1.15, margin: '0 0 12px' },
  lede: { color: '#3A3D44', fontSize: 17, lineHeight: 1.6, margin: '0 0 32px' },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E6E7EC',
    borderRadius: 14,
    padding: '24px 26px',
    marginBottom: 20,
  },
  h2: { color: '#083A85', fontSize: 20, margin: '0 0 6px' },
  sub: { color: '#6A6D76', fontSize: 14, margin: '0 0 14px' },
  ol: { color: '#3A3D44', fontSize: 15.5, lineHeight: 1.75, margin: 0, paddingLeft: 20 },
  ul: { color: '#3A3D44', fontSize: 15.5, lineHeight: 1.75, margin: 0, paddingLeft: 20 },
  emailBtn: {
    display: 'inline-block',
    marginTop: 16,
    background: '#083A85',
    color: '#FFFFFF',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 15,
    padding: '12px 22px',
    borderRadius: 10,
  },
  note: {
    background: '#FFFBEB',
    border: '1px solid #F0D9A8',
    borderRadius: 10,
    padding: '14px 16px',
    color: '#92400E',
    fontSize: 14.5,
    lineHeight: 1.6,
  },
  link: { color: '#083A85', textDecoration: 'underline' },
};

const DeleteAccountPage = () => {
  const subject = encodeURIComponent('Account deletion request');
  const body = encodeURIComponent(
    'I would like my Connekyt account and personal data deleted.\n\n' +
      'Email or phone number on the account: \n' +
      'Full name on the account: \n\n' +
      'I understand that my account will be permanently disabled and that ' +
      'financial records will be retained where the law requires it.',
  );

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.wrap}>
        <p style={styles.kicker}>Connekyt</p>
        <h1 style={styles.h1}>Delete your account and data</h1>
        <p style={styles.lede}>
          You can permanently delete your Connekyt account at any time. You do not need the app
          installed to make the request — this page works on its own.
        </p>

        <section style={styles.card}>
          <h2 style={styles.h2}>Option 1 — delete it yourself in the app</h2>
          <p style={styles.sub}>The fastest route. Takes effect immediately.</p>
          <ol style={styles.ol}>
            <li>Open the Connekyt app and sign in.</li>
            <li>Go to the <strong>Profile</strong> tab.</li>
            <li>Scroll to the bottom and tap <strong>Delete account</strong>.</li>
            <li>Type <strong>DELETE</strong> to confirm.</li>
          </ol>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>Option 2 — ask us to delete it</h2>
          <p style={styles.sub}>
            Use this if you can&apos;t install the app or can&apos;t sign in. We respond within 30
            days.
          </p>
          <p style={{ ...styles.sub, marginBottom: 0 }}>
            Email <a style={styles.link} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from
            the address on your account, with the subject &ldquo;Account deletion request&rdquo;.
            Include the email address or phone number your account uses so we can identify it. We
            may ask you to verify your identity before deleting anything — this protects you from
            someone else deleting your account.
          </p>
          <a style={styles.emailBtn} href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}>
            Email a deletion request
          </a>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>What gets deleted</h2>
          <p style={styles.sub}>Removed from your account and no longer identifies you:</p>
          <ul style={styles.ul}>
            {REMOVED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>What we keep, and why</h2>
          <p style={styles.sub}>
            We are honest about this rather than promising a total erase we cannot legally perform:
          </p>
          <ul style={styles.ul}>
            {RETAINED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p style={{ ...styles.sub, marginTop: 14, marginBottom: 0 }}>
            These records are detached from your identity — your name, contact details and photos are
            removed, so what remains is a transaction history that no longer points to you. Retention
            periods are set out in our{' '}
            <a style={styles.link} href="/user/privacy-policy">
              Privacy Policy
            </a>
            .
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>Photos and live streams</h2>
          <p style={{ ...styles.sub, marginBottom: 0 }}>
            Photos you uploaded, any selfie used to find your photos, and identity-verification
            documents are deleted with your account. Photos taken of you by a photographer at an
            event belong to that event&apos;s gallery — if you want those removed too, say so in your
            request and we will handle them separately.
          </p>
        </section>

        <div style={styles.note}>
          <strong>This cannot be undone.</strong> Once your account is deleted you cannot sign in
          again, and bookings, purchased photos, and stream access tied to it are no longer
          reachable. If you only want to stop notifications, change your notification settings in the
          app instead.
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DeleteAccountPage;
