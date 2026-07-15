'use client';

/**
 * User (consumer) settings — the web counterpart of the mobile /preferences.
 *
 * Sections: Profile (editable name/phone/address), Security (change password
 * + 2FA status), Privacy (delete account), and Sign out. Wired to the
 * customer-scoped profile endpoints. Brand tokens: navy #083A85, pink #F20C8F.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';
import { deleteAccount, getProfile, updateProfile, type CustomerProfile } from '@/lib/userProfile';
import { removeAuthToken, removeRefreshToken } from '@/lib/api/client';

const NAVY = '#083A85';

export default function UserSettings(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState('');
  const [error, setError] = useState('');

  // Delete-account confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getProfile();
      if (cancelled) return;
      if (p) {
        setProfile(p);
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setPhone(p.phone ?? '');
        setAddress(p.address ?? '');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async () => {
    setSaving(true);
    setError('');
    setSavedNote('');
    const res = await updateProfile({ firstName, lastName, phone, address });
    setSaving(false);
    if (res.success) {
      setSavedNote('Saved');
      // Keep the greeting in sync with the persisted auth user.
      try {
        const raw = localStorage.getItem('authUser');
        const u = raw ? JSON.parse(raw) : {};
        localStorage.setItem('authUser', JSON.stringify({ ...u, firstName, lastName, phone }));
      } catch {
        /* ignore */
      }
      setTimeout(() => setSavedNote(''), 2500);
    } else {
      setError(res.error || 'Could not save your changes. Please try again.');
    }
  };

  const signOut = () => {
    removeAuthToken();
    removeRefreshToken();
    try {
      localStorage.removeItem('authUser');
    } catch {
      /* ignore */
    }
    router.push('/user/auth/login?loggedOut=true');
  };

  const onDelete = async () => {
    setDeleting(true);
    const res = await deleteAccount();
    setDeleting(false);
    if (res.success) {
      signOut();
    } else {
      setError(res.error || 'Could not delete your account. Please try again.');
      setConfirmDelete(false);
    }
  };

  const dirty =
    !!profile &&
    (firstName !== profile.firstName ||
      lastName !== profile.lastName ||
      phone !== (profile.phone ?? '') ||
      address !== (profile.address ?? ''));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/user/dashboard" className="text-gray-500 hover:text-gray-900">
            <i className="bi bi-arrow-left text-xl" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile */}
            <section className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-gray-900">Profile</h2>
              <p className="text-sm text-gray-500">Update your personal details.</p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First name" value={firstName} onChange={setFirstName} />
                <Field label="Last name" value={lastName} onChange={setLastName} />
                <Field label="Phone" value={phone} onChange={setPhone} placeholder="7888…" />
                <Field label="Address" value={address} onChange={setAddress} placeholder="City, Country" />
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  {profile?.email || '—'}
                  <span className="ml-2 text-[11px] text-gray-400">(contact support to change)</span>
                </div>
              </div>

              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={onSave}
                  disabled={!dirty || saving}
                  className="rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: NAVY }}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                {savedNote ? <span className="text-sm font-semibold text-emerald-600">{savedNote}</span> : null}
              </div>
            </section>

            {/* Security */}
            <section className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-gray-900">Security</h2>
              <div className="mt-4 divide-y divide-gray-100">
                <Link href="/user/auth/change-password" className="flex items-center justify-between py-3 group">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Change password</p>
                    <p className="text-xs text-gray-500">Update the password you use to sign in.</p>
                  </div>
                  <i className="bi bi-chevron-right text-gray-400 group-hover:text-gray-700" />
                </Link>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Two-factor authentication</p>
                    <p className="text-xs text-gray-500">Extra security when signing in.</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      profile?.twoFactorEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {profile?.twoFactorEnabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </section>

            {/* Help */}
            <section className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-gray-900">Support</h2>
              <div className="mt-4 divide-y divide-gray-100">
                <Link href="/user/help-center" className="flex items-center justify-between py-3 group">
                  <p className="text-sm font-bold text-gray-900">Help center</p>
                  <i className="bi bi-chevron-right text-gray-400 group-hover:text-gray-700" />
                </Link>
                <Link href="/user/privacy-policy" className="flex items-center justify-between py-3 group">
                  <p className="text-sm font-bold text-gray-900">Privacy policy</p>
                  <i className="bi bi-chevron-right text-gray-400 group-hover:text-gray-700" />
                </Link>
                <Link href="/user/terms-of-service" className="flex items-center justify-between py-3 group">
                  <p className="text-sm font-bold text-gray-900">Terms of service</p>
                  <i className="bi bi-chevron-right text-gray-400 group-hover:text-gray-700" />
                </Link>
              </div>
            </section>

            {/* Danger zone */}
            <section className="rounded-2xl bg-white border border-red-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-red-700">Danger zone</h2>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Sign out</p>
                  <p className="text-xs text-gray-500">End your session on this device.</p>
                </div>
                <button onClick={signOut} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                  Sign out
                </button>
              </div>
              <div className="my-4 h-px bg-red-100" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Delete account</p>
                  <p className="text-xs text-gray-500">Permanently remove your account and personal data.</p>
                </div>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onDelete}
                      disabled={deleting}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {deleting ? 'Deleting…' : 'Confirm delete'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">
                    Delete account
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}): React.JSX.Element {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20"
      />
    </div>
  );
}
