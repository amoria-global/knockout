'use client';

/**
 * User (consumer) dashboard — web counterpart of the mobile UserHome.
 *
 * Surfaces everything a User has bought and watched, each wired to the same
 * customer-scoped backend endpoints the app uses:
 *   Snapshot · Recent watches · Photos purchased · Archives · Recent payments
 *   · Settings · Help
 *
 * Brand tokens: navy #083A85, pink #F20C8F. Fully responsive, with designed
 * loading + empty states so a brand-new User still lands on a polished page.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';
import XentriPayModal from '../../components/XentriPayModal';
import {
  getAnalytics,
  getCompletedStreams,
  getPendingPayments,
  getPurchasedAlbums,
  type DashAlbum,
  type DashAnalytics,
  type DashPending,
  type DashStream,
} from '@/lib/userDashboard';
import { removeAuthToken, removeRefreshToken } from '@/lib/api/client';

const NAVY = '#083A85';
const PINK = '#F20C8F';

function money(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

export default function UserDashboard(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('there');
  const [analytics, setAnalytics] = useState<DashAnalytics>({ totalSpent: 0, totalPhotos: 0, totalBookings: 0, totalEvents: 0 });
  const [albums, setAlbums] = useState<DashAlbum[]>([]);
  const [streams, setStreams] = useState<DashStream[]>([]);
  const [pending, setPending] = useState<DashPending[]>([]);

  // In-page pay modal (booking declaration) for a pending payment.
  const [payTarget, setPayTarget] = useState<DashPending | null>(null);

  const reloadPending = useCallback(async () => {
    setPending(await getPendingPayments());
  }, []);

  useEffect(() => {
    // Greeting from the persisted auth user.
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) {
        const u = JSON.parse(raw) as { firstName?: string; lastName?: string };
        const full = [u.firstName, u.lastName].filter(Boolean).join(' ');
        if (full) setName(full);
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      const [a, al, st, pe] = await Promise.all([
        getAnalytics(),
        getPurchasedAlbums(),
        getCompletedStreams(),
        getPendingPayments(),
      ]);
      if (cancelled) return;
      setAnalytics(a);
      setAlbums(al);
      setStreams(st);
      setPending(pe);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const purchasedPhotos = useMemo(() => albums.filter((a) => !a.archived), [albums]);
  const archived = useMemo(() => albums.filter((a) => a.archived), [albums]);
  const totalPending = pending.reduce((s, p) => s + (p.amount - p.paidAmount), 0);

  const stats = [
    { label: 'Total spent', value: money(analytics.totalSpent), icon: 'bi-wallet2' },
    { label: 'Streams watched', value: String(streams.length), icon: 'bi-camera-video' },
    { label: 'Photos', value: String(analytics.totalPhotos || purchasedPhotos.reduce((s, p) => s + p.photoCount, 0)), icon: 'bi-images' },
    { label: 'Bookings', value: String(analytics.totalBookings), icon: 'bi-calendar-check' },
  ];

  const actions = [
    { label: 'Book a photographer', sub: 'Find & hire talent', icon: 'bi-camera', href: '/user/photographers', color: NAVY },
    { label: 'Live events', sub: 'Watch & buy access', icon: 'bi-broadcast', href: '/user/events', color: PINK },
    { label: 'Find my photos', sub: 'Buy your event photos', icon: 'bi-search', href: '/user/find-my-photos', color: '#0EA5E9' },
    { label: 'My albums', sub: 'Purchased galleries', icon: 'bi-collection', href: '/user/albums', color: '#10B981' },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Hero */}
        <header
          className="rounded-3xl px-6 sm:px-10 py-8 sm:py-10 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a4da3 55%, ${PINK} 165%)` }}
        >
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/70">Welcome back</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold leading-tight">{name}</h1>
          <p className="mt-2 max-w-xl text-sm sm:text-base text-white/80">
            Your photos, streams, and payments — all in one place.
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 border border-white/15">
                <div className="flex items-center gap-2 text-white/70">
                  <i className={`bi ${s.icon} text-sm`} />
                  <span className="text-[11px] font-semibold">{s.label}</span>
                </div>
                <div className="mt-1 text-xl font-extrabold">{loading ? '—' : s.value}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Quick actions */}
        <section className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group rounded-2xl bg-white border border-gray-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: a.color }}
              >
                <i className={`bi ${a.icon} text-lg`} />
              </span>
              <h3 className="mt-3 text-sm font-bold text-gray-900">{a.label}</h3>
              <p className="text-xs text-gray-500">{a.sub}</p>
            </Link>
          ))}
        </section>

        {/* Recent watches */}
        <SectionHead title="Recent watches" actionLabel="All events" href="/user/events" show={streams.length > 0} />
        {loading ? (
          <CardRailSkeleton />
        ) : streams.length === 0 ? (
          <Empty icon="bi-camera-video" text="No streams yet — buy access to watch live events." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {streams.slice(0, 8).map((s) => (
              <Link
                key={s.id}
                href={s.eventId ? `/user/events/view-event?id=${s.eventId}` : '/user/events'}
                className="group rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-video bg-gray-100">
                  {s.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <i className="bi bi-play-circle text-3xl" />
                    </div>
                  )}
                  {s.duration && s.duration !== '0:00:00' ? (
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {s.duration}
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  <h4 className="truncate text-sm font-bold text-gray-900">{s.title}</h4>
                  <p className="truncate text-xs text-gray-500">
                    {[s.photographer, s.date].filter(Boolean).join(' · ') || 'Watched'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Photos purchased */}
        <SectionHead title="Photos purchased" actionLabel="Gallery" href="/user/albums" show={purchasedPhotos.length > 0} />
        {loading ? (
          <CardRailSkeleton />
        ) : purchasedPhotos.length === 0 ? (
          <Empty icon="bi-images" text="No purchased photos yet — find yours from any event." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {purchasedPhotos.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href="/user/albums"
                className="group rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <i className="bi bi-images text-3xl" />
                    </div>
                  )}
                  {p.locked ? (
                    <span className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#083A85]/85 text-white">
                      <i className="bi bi-lock-fill text-[10px]" />
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  <h4 className="truncate text-sm font-bold text-gray-900">{p.title}</h4>
                  <p className="truncate text-xs text-gray-500">
                    {p.photoCount > 0 ? `${p.photoCount} photo${p.photoCount === 1 ? '' : 's'}` : p.photographer || 'Album'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Archives — only when present */}
        {!loading && archived.length > 0 ? (
          <>
            <SectionHead title="Archives" actionLabel="Gallery" href="/user/albums" show />
            <div className="space-y-2">
              {archived.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href="/user/albums"
                  className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-3 shadow-sm transition hover:shadow-md"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#083A85]">
                    <i className="bi bi-archive" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-gray-900">{p.title}</h4>
                    <p className="truncate text-xs text-gray-500">
                      {[p.photoCount > 0 ? `${p.photoCount} photos` : null, p.date].filter(Boolean).join(' · ') || 'Archived'}
                    </p>
                  </div>
                  <i className="bi bi-chevron-right text-gray-400" />
                </Link>
              ))}
            </div>
          </>
        ) : null}

        {/* Recent payments */}
        <SectionHead title="Recent payments" actionLabel={pending.length > 0 ? 'All events' : undefined} href="/user/events" show={pending.length > 0} />
        {loading ? (
          <div className="h-20 rounded-2xl bg-white border border-gray-200 animate-pulse" />
        ) : pending.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <i className="bi bi-check-circle text-emerald-600 text-lg" />
            <p className="text-sm text-gray-700">You&apos;re all settled up — no payments due.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-2xl px-5 py-4 text-white" style={{ backgroundColor: NAVY }}>
              <span className="text-sm text-white/80">Total due</span>
              <span className="text-xl font-extrabold">{money(totalPending)}</span>
            </div>
            {pending.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-gray-900">{p.eventName}</h4>
                  <p className="truncate text-xs text-gray-500">
                    {(p.photographerName || 'Booking')} · {money(p.amount - p.paidAmount)}
                    {p.status === 'failed' ? ' · Failed' : p.status === 'partially_paid' ? ' · Partially paid' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setPayTarget(p)}
                  className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-white"
                  style={{ backgroundColor: p.status === 'failed' ? '#dc2626' : NAVY }}
                >
                  {p.status === 'failed' ? 'Retry' : 'Pay'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Settings & Help */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/user/settings" className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm transition hover:shadow-md">
            <i className="bi bi-gear text-xl text-[#083A85]" />
            <h3 className="mt-2 text-sm font-bold text-gray-900">Settings</h3>
            <p className="text-xs text-gray-500">Profile, security & privacy</p>
          </Link>
          <Link href="/user/help-center" className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm transition hover:shadow-md">
            <i className="bi bi-life-preserver text-xl text-[#083A85]" />
            <h3 className="mt-2 text-sm font-bold text-gray-900">Help</h3>
            <p className="text-xs text-gray-500">Support & FAQs</p>
          </Link>
          <button
            onClick={signOut}
            className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm transition hover:shadow-md text-left"
          >
            <i className="bi bi-box-arrow-right text-xl text-red-600" />
            <h3 className="mt-2 text-sm font-bold text-gray-900">Sign out</h3>
            <p className="text-xs text-gray-500">End your session</p>
          </button>
        </div>
      </main>

      {/* In-page pay modal for a pending booking declaration. The backend
          recomputes the charge from the declaration, so amount/currency here
          are for display; USD matches the dashboard's shown figures. */}
      {payTarget ? (
        <XentriPayModal
          isOpen={!!payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={() => {
            setPayTarget(null);
            void reloadPending();
          }}
          amount={Math.max(0, payTarget.amount - payTarget.paidAmount)}
          currencyCode="USD"
          currencyId=""
          paymentType="booking"
          declarationId={payTarget.id}
          title="Complete payment"
          subtitle={payTarget.eventName}
        />
      ) : null}
    </div>
  );
}

// ────── Small building blocks ────────────────────────────────────────────

function SectionHead({
  title,
  actionLabel,
  href,
  show,
}: {
  title: string;
  actionLabel?: string;
  href: string;
  show: boolean;
}): React.JSX.Element {
  return (
    <div className="mt-8 mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
      {show && actionLabel ? (
        <Link href={href} className="text-sm font-bold" style={{ color: NAVY }}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function CardRailSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="aspect-video bg-gray-100 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-dashed border-gray-300 p-6 text-gray-500">
      <i className={`bi ${icon} text-xl`} />
      <p className="text-sm">{text}</p>
    </div>
  );
}
