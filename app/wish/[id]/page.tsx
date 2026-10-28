import type { Metadata } from 'next';
import { WishForm } from '@/app/components/wishes/WishForm';
import { WishStyles } from '@/app/components/wishes/WishStyles';
import { absUrl, fetchEventForSeo, SITE_NAME, SITE_URL } from '@/lib/seo/seo';
import { eventWhen } from '@/lib/events/eventWhen';
import { HEARTFELT_LINE, invitedByLine, wishesOpen } from '@/lib/wishes/wishPage';
import { InviteSomeone } from './InviteSomeone';

/**
 * The page a shared wish link or QR opens (also the mobile app's wish screen): the event's cover, date and title, an
 * optional "<Name> invited you" line, then the wish form. Rendered on the server from the public event so chat apps get
 * the cover, title and the heartfelt line as a rich preview. An unpublished event answers "not available", so nothing about
 * it is shown, only that wishes are closed. Wishes go through the same endpoint and host approval as the event page's.
 */
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;
type SP = Promise<{ [k: string]: string | string[] | undefined }>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const ev = await fetchEventForSeo(id);
  const title = ev?.title ? `Send a wish · ${ev.title}` : 'Send a wish';
  const image = absUrl(ev?.eventPhoto);
  const url = `${SITE_URL}/wish/${encodeURIComponent(id)}`;
  return {
    title,
    description: HEARTFELT_LINE,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { type: 'website', siteName: SITE_NAME, title, description: HEARTFELT_LINE, url, images: image ? [{ url: image }] : undefined },
    twitter: { card: 'summary_large_image', title, description: HEARTFELT_LINE, images: image ? [image] : undefined },
  };
}

export default async function WishPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { id } = await params;
  const from = first((await searchParams).from);
  const ev = await fetchEventForSeo(id);
  const open = !!ev && wishesOpen(ev);
  const when = ev ? eventWhen(ev) : { date: '', time: '' };
  const chip = [when.date.toUpperCase(), when.time.split(' · ')[0]].filter(Boolean).join(' · ');
  const invited = invitedByLine(from);
  const cover = absUrl(ev?.eventPhoto);

  return (
    <main className="wp wm">
      <WishStyles />
      <header className="wp-hero" style={cover ? { backgroundImage: `url("${cover}")` } : undefined} role="img" aria-label={ev?.title ? `Cover image for ${ev.title}` : 'Event cover'}>
        <div className="wp-hero-in">
          {chip ? <span className="wp-chip">{chip}</span> : null}
          {ev?.title ? <h1 className="wp-title">{ev.title}</h1> : null}
        </div>
      </header>
      <div className="wp-body">
        {open ? (
          <>
            {invited ? <p className="wp-invited"><i className="bi bi-heart-fill" aria-hidden="true" />{invited}</p> : null}
            <p className="wp-lead">Your message will appear on screen during the event, so you can be part of it from wherever you are.</p>
            <WishForm eventId={id} variant="page" />
          </>
        ) : (
          <div className="wp-closed" role="status">
            <i className="bi bi-lock" aria-hidden="true" style={{ fontSize: 24, color: '#9aa3b2' }} />
            <h2>Wishes for this event are closed</h2>
            {!ev ? <p className="wp-lead">This event is not available right now.</p> : null}
          </div>
        )}
        <div className="wp-links">
          {ev ? <a href={`/user/events/view-event?id=${encodeURIComponent(id)}`}>View event →</a> : <a href="/user/events">Browse events →</a>}
          {open ? <InviteSomeone eventId={id} title={ev?.title ?? 'this event'} /> : null}
        </div>
      </div>
    </main>
  );
}
