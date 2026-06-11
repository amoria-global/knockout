"use client";

/**
 * Gallery — public "Hall of Fame".
 * Masthead (black, big title, sub-nav tabs) + three tab views:
 *   Overview  ·  Inductees  ·  FAQs
 *
 * Images: ALL from /public — zero database calls for images.
 * Photographer names come from the public list API (names only, no photos used).
 */

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "bootstrap-icons/font/bootstrap-icons.css";

// ─── Local public images — no database, no CDN ──────────────────────────────
// These files already live in /public and are shipped with the Next.js build.
const MOSAIC_IMAGES = [
  { src: "/caman.png",    alt: "Photographer at work",       tall: true  },
  { src: "/family.png",   alt: "Family event",               tall: false },
  { src: "/students.png", alt: "Group photo",                tall: false },
  { src: "/lady.png",     alt: "Portrait session",           tall: false },
  { src: "/man.png",      alt: "Event guest",                tall: true  },
  { src: "/scan.png",     alt: "AI face recognition",        tall: false },
  { src: "/gallery.png",  alt: "Gallery wall",               tall: false },
  { src: "/pro.png",      alt: "Professional photographer",  tall: false },
  { src: "/rated.png",    alt: "Top-rated photographer",     tall: false },
];

// ─── Static content ──────────────────────────────────────────────────────────
const MILESTONES = [
  { icon: "bi-patch-check-fill", value: "Verified",  label: "Photographers only"  },
  { icon: "bi-broadcast",        value: "Live",       label: "Event albums"        },
  { icon: "bi-person-bounding-box", value: "AI",     label: "Face search"         },
  { icon: "bi-star-fill",        value: "Rated",      label: "By real clients"     },
  { icon: "bi-shield-lock-fill", value: "Secure",     label: "Private vaults"      },
  { icon: "bi-cloud-arrow-down", value: "Instant",    label: "Download originals"  },
];

const WHAT_WE_CELEBRATE = [
  {
    icon: "bi-gem",
    color: "#a87f1f",
    bg: "rgba(217,184,118,0.14)",
    title: "Exclusive by design",
    body: "We partner with a select few. Each agreement is exclusive within its category — your brand stands alone here, not buried in a crowded directory of logos.",
  },
  {
    icon: "bi-broadcast-pin",
    color: "#083a85",
    bg: "rgba(8,58,133,0.10)",
    title: "Shared audience",
    body: "Reach Connekyt's community of clients, creators and event-goers. Your brand appears where Rwanda's events are captured, streamed and remembered.",
  },
  {
    icon: "bi-patch-check-fill",
    color: "#f20c8f",
    bg: "rgba(242,12,143,0.10)",
    title: "Verified credibility",
    body: "Every partnership is vetted and verified by the Connekyt team. A place on this wall signals an official, active, trusted relationship — never paid placement.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "bi-chat-square-heart-fill",
    title: "Reach out",
    body: "Tell us about your brand and how you'd like to align with Connekyt. Partnerships start with a conversation, not a form.",
  },
  {
    step: "02",
    icon: "bi-shield-check",
    title: "We align & verify",
    body: "We review fit and shared values. Exclusive partnerships are intentional — we only take on brands whose standards match our own.",
  },
  {
    step: "03",
    icon: "bi-award-fill",
    title: "Featured on the wall",
    body: "Your brand joins the Hall of Fame — logo, story and links — seen by every client, creator and visitor who comes to Connekyt.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the Connekyt Hall of Fame?",
    a: "It's where we honour the exclusive partners who stand with Connekyt — a permanent, public tribute to the organisations backing our mission, shown to everyone who visits.",
  },
  {
    q: "What makes a partnership exclusive?",
    a: "Each partner is the only brand we work with in their category. No crowded directory of logos — every partner stands alone here, by design.",
  },
  {
    q: "How does a brand become a partner?",
    a: "It starts with a conversation. Reach out, we review fit and shared values, and approved partners are featured here with their logo, story and links to their channels.",
  },
  {
    q: "Is every partnership verified?",
    a: "Yes. Every partnership is vetted by the Connekyt team. A place on this wall signals an official, active, trusted relationship — never paid placement.",
  },
  {
    q: "What do partners get?",
    a: "A prominent, permanent feature on a page seen by Connekyt's clients, creators and visitors — plus direct links to their website and social channels.",
  },
  {
    q: "How can my brand get in touch?",
    a: "Use the “Get in touch” button on this page, or contact the Connekyt team directly. We'll take it from there.",
  },
];

// ─── Exclusive Partners ─────────────────────────────────────────────────────
const PARTNERS = [
  {
    id: "igihe",
    name: "Igihe",
    logo: "/igihe_logo.png",
    category: "Media & Press",
    caution: "Official media partner — Rwanda's leading news platform.",
    quote: "Connekyt events, now featured where Rwanda reads first.",
    instagram: "https://www.instagram.com/igiheofficial/",
    website: "https://www.igihe.com",
    color: "#083a85",
  },
];

// ─── Inducted Milestones ────────────────────────────────────────────────────
const UMUDENDE_PILLARS = [
  {
    icon: "bi-globe-americas",
    title: "A global beacon for Gakondo",
    body: "Umudende 2026 wasn't just a local performance — it was a borderless celebration of Gakondo, traditional Rwandan music. Streamed live to thousands across the globe, it broke geographical barriers, letting the diaspora and international art lovers experience the Ingoma drums, the dancers and Rwandan storytelling in real time.",
  },
  {
    icon: "bi-lightning-charge-fill",
    title: "Where tradition met tomorrow",
    body: "Its magic lay in a groundbreaking fusion of genres. The collaboration of Jules Sentore and Masamba proved that safeguarding culture doesn't mean keeping it stagnant — weaving ancient Rwandan poetry with contemporary sound sparked a wave of pride among Gen Z and millennial viewers, making traditional art viral, trendy and relevant.",
  },
  {
    icon: "bi-trophy-fill",
    title: "Why it belongs in the Hall of Fame",
    body: "We induct Umudende 2026 for fulfilling the ultimate mission of art advocacy: global access — democratising Rwandan culture by bringing an authentic Kigali stage to global screens; and intergenerational dialogue — uniting musical elders and youth icons on one stage, passing Rwanda's creative flame securely to the next generation.",
  },
];

type Tab = "overview" | "partners" | "milestones" | "faqs";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",   label: "Overview"   },
  { id: "partners",   label: "Partners"   },
  { id: "milestones", label: "Milestones" },
  { id: "faqs",       label: "FAQs"       },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function Gallery() {
  const [tab, setTab]         = useState<Tab>("overview");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const monthLabel      = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const featuredPartner = PARTNERS[0];

  return (
    <div className="hof">
      <Navbar />

      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <header className="hof-mast">
        <div className="hof-motif" aria-hidden="true" />
        <div className="hof-mast-inner">
          <p className="hof-mast-super">Connekyt · Hall of fame</p>
          <h1 className="hof-title">Hall of Fame</h1>
          <p className="hof-mast-sub">
            Honouring the exclusive partners who stand with Connekyt.
          </p>
          <nav className="hof-tabs" role="tablist" aria-label="Hall of Fame sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                className="hof-tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Views ────────────────────────────────────────────────────────── */}
      <main className="hof-body">

        {/* ════ OVERVIEW ════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <section className="hof-view" aria-label="Overview">

            {/* Hero split */}
            <div className="hof-ov-hero hof-ov-hero-solo">
              <div className="hof-ov-copy">
                <p className="hof-kicker">The Connekyt Hall of Fame</p>
                <h2 className="hof-h2">
                  Brands that<br />stand with<br />Connekyt.
                </h2>
                <p className="hof-lead">
                  A permanent tribute to the organisations who back our mission.
                  Each is an exclusive partner — vetted, verified and honoured here
                  for everyone who comes to Connekyt to see.
                </p>
                <div className="hof-ov-btns">
                  <button
                    type="button"
                    className="hof-btn hof-btn-primary"
                    onClick={() => setTab("partners")}
                  >
                    <i className="bi bi-award-fill" aria-hidden="true" />
                    Meet our partners
                  </button>
                  <Link href="/user/photographers" className="hof-btn hof-btn-ghost">
                    <i className="bi bi-people-fill" aria-hidden="true" />
                    All photographers
                  </Link>
                </div>
              </div>
            </div>

            {/* Stat strip */}
            <div className="hof-stats">
              {MILESTONES.map((m) => (
                <div key={m.label} className="hof-stat">
                  <i className={`bi ${m.icon}`} aria-hidden="true" />
                  <div>
                    <strong>{m.value}</strong>
                    <span>{m.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Featured Partner */}
            <div className="hof-divider">
              <span>
                <i className="bi bi-award-fill" aria-hidden="true" />
                Featured Partner
              </span>
              <span className="hof-divider-date">{monthLabel}</span>
            </div>

            {featuredPartner ? (
              <div className="hof-partner-grid">
                <div className="hof-partner-card">
                  <div className="hof-partner-top" style={{ borderLeftColor: featuredPartner.color }}>
                    <div className="hof-partner-logo-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={featuredPartner.logo} alt={`${featuredPartner.name} logo`} className="hof-partner-logo" />
                    </div>
                    <span className="hof-partner-badge" style={{ background: featuredPartner.color }}>
                      <i className="bi bi-patch-check-fill" aria-hidden="true" />
                      Exclusive
                    </span>
                  </div>
                  <div className="hof-partner-body">
                    <span className="hof-partner-cat">{featuredPartner.category}</span>
                    <strong className="hof-partner-name">{featuredPartner.name}</strong>
                    <p className="hof-partner-caution">
                      <i className="bi bi-info-circle" aria-hidden="true" />
                      {featuredPartner.caution}
                    </p>
                    {featuredPartner.quote && (
                      <blockquote className="hof-partner-quote">&ldquo;{featuredPartner.quote}&rdquo;</blockquote>
                    )}
                    <div className="hof-partner-actions">
                      {featuredPartner.website && (
                        <a href={featuredPartner.website} target="_blank" rel="noopener noreferrer" className="hof-btn hof-btn-primary" style={{ fontSize: 13 }}>
                          <i className="bi bi-globe2" aria-hidden="true" />
                          Visit website
                        </a>
                      )}
                      <button type="button" className="hof-btn hof-btn-ghost" onClick={() => setTab("partners")} style={{ fontSize: 13 }}>
                        <i className="bi bi-grid-3x3-gap-fill" aria-hidden="true" />
                        All partners
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Why brands partner with us */}
            <div className="hof-divider hof-divider-mt">
              <span>
                <i className="bi bi-gem" aria-hidden="true" />
                Why brands partner with us
              </span>
            </div>
            <div className="hof-celebrate">
              {WHAT_WE_CELEBRATE.map((c) => (
                <div key={c.title} className="hof-cel-card">
                  <div className="hof-cel-icon" style={{ background: c.bg, color: c.color }}>
                    <i className={`bi ${c.icon}`} aria-hidden="true" />
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>

            {/* How partnership works */}
            <div className="hof-divider hof-divider-mt">
              <span>
                <i className="bi bi-signpost-2-fill" aria-hidden="true" />
                How partnership works
              </span>
            </div>
            <div className="hof-steps">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.step} className="hof-step">
                  <div className="hof-step-num">{s.step}</div>
                  <div className="hof-step-icon">
                    <i className={`bi ${s.icon}`} aria-hidden="true" />
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="hof-ov-cta">
              <div className="hof-ov-cta-left">
                <div className="hof-ov-motif" aria-hidden="true" />
                <div className="hof-ov-lockup" aria-hidden="true">
                  <span className="hof-ov-chip">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="" />
                  </span>
                  <span className="hof-ov-x"><i className="bi bi-plus-lg" /></span>
                  <span className="hof-ov-chip">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/igihe_logo.png" alt="" />
                  </span>
                </div>
                <span className="hof-ov-lockup-cap">Connekyt &times; its partners</span>
              </div>
              <div className="hof-ov-cta-right">
                <p className="hof-kicker">Become a partner</p>
                <h2 className="hof-h2" style={{ maxWidth: "20ch" }}>
                  Stand with<br />Connekyt.
                </h2>
                <p className="hof-lead" style={{ maxWidth: "44ch" }}>
                  We align with a select few brands whose values match ours. If
                  that&rsquo;s you, let&rsquo;s build something exclusive — and put your name
                  on the wall.
                </p>
                <div className="hof-ov-btns" style={{ marginTop: 24 }}>
                  <Link href="/user/contact_us" className="hof-btn hof-btn-primary">
                    <i className="bi bi-envelope-fill" aria-hidden="true" />
                    Get in touch
                  </Link>
                  <button type="button" className="hof-btn hof-btn-ghost" onClick={() => setTab("partners")}>
                    <i className="bi bi-award-fill" aria-hidden="true" />
                    Meet our partners
                  </button>
                </div>
              </div>
            </div>

          </section>
        )}

        {/* ════ PARTNERS ════════════════════════════════════════════════ */}
        {tab === "partners" && (
          <section className="hof-view" aria-label="Exclusive Partners">
            <div className="hof-view-head">
              <p className="hof-kicker">Exclusive Partners</p>
              <h2 className="hof-h2">Brands that stand with Connekyt.</h2>
              <p className="hof-lead">
                These organisations have chosen to align with Connekyt — sharing
                our commitment to quality, creativity and community. Each
                partnership is exclusive, intentional and built on shared values.
              </p>
            </div>

            <div className="hof-partner-notice">
              <i className="bi bi-shield-check-fill" aria-hidden="true" />
              <p>
                All partnerships listed here are exclusive agreements verified
                by the Connekyt team. Presence on this page signifies an
                official, active relationship.
              </p>
            </div>

            <div className="hof-partner-grid">
              {PARTNERS.map((p) => (
                <div key={p.id} className="hof-partner-card">
                  {/* Header bar with brand colour accent */}
                  <div
                    className="hof-partner-top"
                    style={{ borderLeftColor: p.color }}
                  >
                    <div className="hof-partner-logo-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.logo} alt={`${p.name} logo`} className="hof-partner-logo" />
                    </div>
                    <span
                      className="hof-partner-badge"
                      style={{ background: p.color }}
                    >
                      <i className="bi bi-patch-check-fill" aria-hidden="true" />
                      Exclusive
                    </span>
                  </div>

                  <div className="hof-partner-body">
                    <span className="hof-partner-cat">{p.category}</span>
                    <strong className="hof-partner-name">{p.name}</strong>

                    <p className="hof-partner-caution">
                      <i className="bi bi-info-circle" aria-hidden="true" />
                      {p.caution}
                    </p>

                    {p.quote && (
                      <blockquote className="hof-partner-quote">
                        &ldquo;{p.quote}&rdquo;
                      </blockquote>
                    )}

                    <div className="hof-partner-actions">
                      {p.website && (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hof-btn hof-btn-primary"
                          style={{ fontSize: 13 }}
                        >
                          <i className="bi bi-globe2" aria-hidden="true" />
                          Visit website
                        </a>
                      )}
                      {p.instagram && (
                        <a
                          href={p.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hof-btn hof-btn-ghost hof-btn-insta"
                          style={{ fontSize: 13 }}
                        >
                          <i className="bi bi-instagram" aria-hidden="true" />
                          Instagram
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hof-partner-cta">
              <div>
                <p className="hof-kicker">Become a partner</p>
                <h3 style={{ margin: "8px 0 6px", fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 900, color: "#0b1020" }}>
                  Interested in an exclusive partnership?
                </h3>
                <p style={{ margin: 0, fontSize: 15, color: "#475569", maxWidth: "54ch" }}>
                  We work with a select number of brands whose values align with
                  ours. If that&apos;s you, we&apos;d love to talk.
                </p>
              </div>
              <a href="/user/contact_us" className="hof-btn hof-btn-primary" style={{ whiteSpace: "nowrap" }}>
                <i className="bi bi-envelope-fill" aria-hidden="true" />
                Get in touch
              </a>
            </div>
          </section>
        )}

        {/* ════ MILESTONES ══════════════════════════════════════════════ */}
        {tab === "milestones" && (
          <section className="hof-view" aria-label="Inducted Milestones">
            <div className="hof-view-head">
              <p className="hof-kicker">Inducted Milestones</p>
              <h2 className="hof-h2">Moments that made history.</h2>
              <p className="hof-lead">
                Beyond people and brands, the Hall of Fame honours the landmark events that
                push Rwandan culture forward — the moments we&rsquo;ll never forget.
              </p>
            </div>

            <article className="hof-ms">
              <div className="hof-ms-hero">
                <div className="hof-ms-visual">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/umudende.PNG" alt="Jules Sentore performing at the Umudende Live Concert 2026" />
                  <span className="hof-ms-ribbon"><i className="bi bi-trophy-fill" aria-hidden="true" /> Inducted 2026</span>
                  <div className="hof-ms-cap">
                    <strong>Jules Sentore</strong>
                    <span>Umudende Live Concert · Kigali Universe · May 29, 2026</span>
                  </div>
                </div>

                <div className="hof-ms-intro">
                  <span className="hof-ms-eyebrow">Hall of Fame · Cultural Milestone</span>
                  <h3 className="hof-ms-title">Umudende 2026</h3>
                  <p className="hof-ms-sub">Giving history wings to fly across the digital universe — bridging eras.</p>
                  <p className="hof-ms-lead">
                    On May 29, 2026, the digital and physical worlds collided at Kigali Universe for a
                    historic milestone in Rwandan heritage — the Umudende Live Concert. Led by the
                    visionary Jules Sentore alongside cultural icons Masamba Intore, it enters our
                    Hall of Fame as the first masterclass in cultural preservation for the modern era.
                  </p>
                  <div className="hof-ms-chips">
                    <span><i className="bi bi-mic-fill" aria-hidden="true" /> Jules Sentore</span>
                    <span><i className="bi bi-people-fill" aria-hidden="true" /> Masamba Intore</span>
                    <span><i className="bi bi-geo-alt-fill" aria-hidden="true" /> Kigali Universe</span>
                    <span><i className="bi bi-broadcast" aria-hidden="true" /> Streamed live</span>
                  </div>
                </div>
              </div>

              <div className="hof-ms-pillars">
                {UMUDENDE_PILLARS.map((p) => (
                  <div key={p.title} className="hof-ms-pillar">
                    <div className="hof-ms-pillar-icon"><i className={`bi ${p.icon}`} aria-hidden="true" /></div>
                    <h4>{p.title}</h4>
                    <p>{p.body}</p>
                  </div>
                ))}
              </div>

              <blockquote className="hof-ms-closing">
                Umudende 2026 proved that culture is not a relic of the past — it is a living force
                capable of inspiring the future. By embracing digital innovation while honouring
                tradition, Rwanda showed the world that its history is not merely preserved; it is
                empowered to travel beyond borders, generations, and time itself.
              </blockquote>
            </article>
          </section>
        )}

        {/* ════ FAQS ════════════════════════════════════════════════════ */}
        {tab === "faqs" && (
          <section className="hof-view" aria-label="FAQs">
            <div className="hof-view-head">
              <p className="hof-kicker">Frequently asked</p>
              <h2 className="hof-h2">Hall of Fame, explained.</h2>
              <p className="hof-lead">
                Everything you need to know about the Connekyt Hall of Fame —
                how it works, who qualifies and what it means.
              </p>
            </div>

            <div className="hof-faqs">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q} className={`hof-faq${open ? " open" : ""}`}>
                    <button
                      type="button"
                      className="hof-faq-q"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      <span>{f.q}</span>
                      <i className="bi bi-chevron-down hof-faq-ic" aria-hidden="true" />
                    </button>
                    <div className="hof-faq-a" role="region">
                      <p>{f.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FAQ bottom CTA */}
            <div className="hof-faq-cta">
              <p>Still have questions? Our team is happy to help.</p>
              <Link href="/user/contact_us" className="hof-btn hof-btn-primary">
                <i className="bi bi-chat-dots-fill" aria-hidden="true" />
                Contact us
              </Link>
            </div>
          </section>
        )}

      </main>

      <Footer />

      {/* ── Styles ─────────────────────────────────────────────────────── */}
      <style jsx>{`
        /* ─ root ─ */
        .hof { min-height: 100vh; background: #f8fafc; }

        /* ─ masthead ─ */
        .hof-mast {
          position: relative;
          overflow: hidden;
          background: #050506;
          padding: clamp(72px, 10vh, 120px) clamp(20px, 6vw, 80px) 0;
        }
        .hof-mast-inner {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
        }
        .hof-mast-super {
          margin: 0 0 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.40);
        }
        .hof-title {
          margin: 0;
          font-family: "Pragati Narrow","Arial Black",Impact,sans-serif;
          font-weight: 900;
          font-size: clamp(48px, 8vw, 108px);
          line-height: 0.96;
          letter-spacing: -0.025em;
          color: #ffffff;
        }
        .hof-mast-sub {
          margin: 14px 0 0;
          font-size: clamp(14px, 1.5vw, 18px);
          color: rgba(255,255,255,0.50);
          max-width: 48ch;
          line-height: 1.5;
        }
        .hof-tabs {
          display: flex;
          gap: clamp(20px, 3vw, 44px);
          margin-top: clamp(28px, 4vh, 52px);
          border-bottom: 1px solid rgba(255,255,255,0.10);
        }
        .hof-tab {
          appearance: none;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: clamp(14px, 1.4vw, 17px);
          font-weight: 600;
          color: rgba(255,255,255,0.50);
          padding: 0 0 18px;
          position: relative;
          transition: color 0.2s ease;
          letter-spacing: 0.01em;
        }
        .hof-tab:hover { color: #fff; }
        .hof-tab[aria-selected="true"] { color: #fff; font-weight: 800; }
        .hof-tab[aria-selected="true"]::after {
          content: "";
          position: absolute; left: 0; right: 0; bottom: -1px;
          height: 3px; border-radius: 3px;
          background: linear-gradient(90deg, #083a85, #f20c8f);
        }

        /* diagonal speed-line motif */
        .hof-motif {
          position: absolute; top: 0; right: 0;
          width: clamp(260px, 42vw, 680px); height: 100%;
          z-index: 0; pointer-events: none;
          background: linear-gradient(118deg, #083a85 0%, #6a1f7a 48%, #f20c8f 100%);
          -webkit-mask:
            repeating-linear-gradient(118deg, #000 0 4px, transparent 4px 14px),
            linear-gradient(90deg, transparent 0%, #000 58%);
          -webkit-mask-composite: source-in;
          mask:
            repeating-linear-gradient(118deg, #000 0 4px, transparent 4px 14px),
            linear-gradient(90deg, transparent 0%, #000 58%);
          mask-composite: intersect;
          opacity: 0.80;
        }

        /* ─ shared layout ─ */
        .hof-body { background: #f8fafc; }
        .hof-view {
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(44px, 6vw, 80px) clamp(20px, 6vw, 80px) clamp(60px, 8vw, 100px);
        }
        .hof-view-head { margin-bottom: clamp(28px, 4vw, 48px); }

        /* ─ typography atoms ─ */
        .hof-kicker {
          margin: 0 0 10px;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: #083a85;
        }
        .hof-h2 {
          margin: 0 0 16px;
          font-family: "Pragati Narrow",Impact,sans-serif;
          font-size: clamp(32px, 4.8vw, 60px);
          font-weight: 900;
          line-height: 1.01;
          letter-spacing: -0.022em;
          color: #0b1020;
        }
        .hof-lead {
          margin: 0;
          font-size: clamp(15px, 1.5vw, 19px);
          line-height: 1.65;
          color: #475569;
        }
        .hof-placeholder {
          margin: 0; font-size: 16px; color: #64748b;
        }

        /* ─ shared button ─ */
        .hof-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 22px; border-radius: 10px;
          font-family: inherit; font-size: 15px; font-weight: 800;
          text-decoration: none; cursor: pointer; border: none;
          white-space: nowrap;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .hof-btn:hover { transform: translateY(-2px); }
        .hof-btn-primary {
          background: linear-gradient(120deg, #083a85, #f20c8f);
          color: #fff;
          box-shadow: 0 12px 28px -12px rgba(242,12,143,0.48);
        }
        .hof-btn-ghost {
          background: #fff; color: #083a85;
          border: 1.5px solid rgba(8,58,133,0.35);
        }
        .hof-btn-ghost:hover { background: rgba(8,58,133,0.05); border-color: #083a85; }

        /* ─ section divider ─ */
        .hof-divider {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
          margin: clamp(40px,5vw,64px) 0 clamp(24px,3vw,36px);
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(8,16,32,0.10);
        }
        .hof-divider-mt { margin-top: clamp(52px,7vw,88px); }
        .hof-divider span:first-child {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 800; letter-spacing: 0.16em;
          text-transform: uppercase; color: #0b1020;
        }
        .hof-divider span:first-child i { color: #d9b876; }
        .hof-divider-date {
          font-size: 12px; font-weight: 600; color: #94a3b8;
          letter-spacing: 0.06em; text-transform: uppercase;
        }

        /* ─ skeleton ─ */
        .hof-skel {
          display: block;
          background: linear-gradient(90deg,#e8edf4 25%,#d8e0ec 45%,#e8edf4 65%);
          background-size: 200% 100%;
          animation: hof-shimmer 1.5s linear infinite;
          border-radius: 8px;
        }
        @keyframes hof-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        /* ════════════════════════════════════════════════════════════════
           OVERVIEW TAB
        ════════════════════════════════════════════════════════════════ */

        /* hero split */
        .hof-ov-hero {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .hof-ov-copy { display: flex; flex-direction: column; gap: 20px; }
        .hof-ov-btns { display: flex; flex-wrap: wrap; gap: 12px; }

        /* mosaic — local images only */
        .hof-mosaic {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 130px;
          gap: 6px;
          border-radius: 16px;
          overflow: hidden;
        }
        .hof-mc {
          position: relative;
          overflow: hidden;
          background: #1a2540;
        }
        .hof-mc img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          /* editorial monochrome — clean, unified look regardless of subject */
          filter: grayscale(0.55) contrast(1.08) brightness(0.9);
          transition: transform 0.55s ease, filter 0.4s ease;
          pointer-events: none; user-select: none;
        }
        .hof-mc:hover img {
          transform: scale(1.06);
          filter: grayscale(0) contrast(1.02) brightness(1);
        }
        .hof-mc-tall { grid-row: span 2; }
        .hof-mc-wide { grid-column: span 2; }

        /* stat strip */
        .hof-stats {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1px;
          background: rgba(8,16,32,0.08);
          border: 1px solid rgba(8,16,32,0.08);
          border-radius: 14px;
          overflow: hidden;
          margin-top: clamp(36px,5vw,60px);
        }
        .hof-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: clamp(16px,2vw,22px) clamp(14px,1.8vw,20px);
          background: #fff;
        }
        .hof-stat i {
          font-size: 18px;
          color: #083a85;
          flex-shrink: 0;
        }
        .hof-stat div { display: flex; flex-direction: column; line-height: 1.1; min-width: 0; }
        .hof-stat strong {
          font-size: 16px; font-weight: 900; color: #0b1020;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .hof-stat span {
          margin-top: 3px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: #64748b;
        }

        /* inductee of the month card */
        .hof-feat {
          display: grid;
          grid-template-columns: minmax(260px,400px) 1fr;
          align-items: stretch;
          background: #fff;
          border: 1px solid rgba(8,16,32,0.08);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 48px -24px rgba(8,16,32,0.35);
        }
        .hof-feat-loading { grid-template-columns: 320px 1fr; }
        .hof-feat-skel-img { height: 100%; min-height: 280px; border-radius: 0; }
        .hof-feat-skel-body {
          padding: 36px;
          display: flex; flex-direction: column; gap: 0;
        }
        .hof-feat-visual {
          position: relative;
          min-height: clamp(280px,28vw,380px);
          background: #0b1020;
          overflow: hidden;
        }
        .hof-feat-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
          object-position: center top; display: block;
          filter: grayscale(1) brightness(0.45) contrast(1.1);
          pointer-events: none; user-select: none;
        }
        .hof-feat-bg-clear {
          filter: none;
        }
        .hof-feat-bg-clear::after {
          content: "";
        }
        .hof-feat-visual::after {
          content: "";
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(180deg,
            rgba(5,8,18,0.08) 0%,
            rgba(5,8,18,0.18) 40%,
            rgba(5,8,18,0.55) 75%,
            rgba(5,8,18,0.82) 100%
          );
        }
        .hof-feat-medallion {
          position: absolute;
          inset: 0; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          font-family: "Pragati Narrow",Impact,sans-serif;
          font-size: clamp(56px, 7vw, 88px);
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 24px rgba(0,0,0,0.5);
        }
        .hof-feat-ribbon {
          position: absolute; top: 16px; left: 16px; z-index: 3;
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: 999px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
          color: #2a200d;
          background: linear-gradient(180deg, #fbf2d6, #d9b876);
          box-shadow: 0 8px 20px -6px rgba(0,0,0,0.35);
        }
        .hof-feat-ribbon i { color: #a87f1f; }
        .hof-feat-body {
          display: flex; flex-direction: column; justify-content: center; gap: 10px;
          padding: clamp(28px,3.5vw,52px);
        }
        .hof-feat-eyebrow {
          font-size: 11.5px; font-weight: 800; letter-spacing: 0.14em;
          text-transform: uppercase; color: #b3174e;
        }
        .hof-feat-name {
          font-family: "Pragati Narrow",Impact,sans-serif;
          font-size: clamp(28px,3.5vw,50px); font-weight: 900; line-height: 1; color: #0b1020;
        }
        .hof-feat-spec {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 15px; font-weight: 600; color: #334155;
        }
        .hof-feat-spec i { color: #083a85; font-size: 15px; }
        .hof-feat-stars {
          display: inline-flex; align-items: center; gap: 4px;
          color: #d9b876; font-size: 14px;
        }
        .hof-feat-stars span {
          margin-left: 6px; font-size: 14px; font-weight: 700; color: #475569;
        }
        .hof-feat-quote {
          margin: 4px 0;
          padding-left: 14px;
          border-left: 3px solid #f20c8f;
          font-style: italic;
          font-size: clamp(14px,1.4vw,16px);
          line-height: 1.55;
          color: #475569;
          max-width: 52ch;
        }
        .hof-feat-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-top: 2px;
        }
        .hof-feat-chips span {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 11px; border-radius: 999px;
          font-size: 12px; font-weight: 600; color: #475569;
          background: #f1f5f9; border: 1px solid rgba(8,16,32,0.08);
        }
        .hof-feat-chips i { color: #083a85; font-size: 12px; }
        .hof-chip-verified { color: #083a85 !important; background: rgba(8,58,133,0.08) !important; }
        .hof-feat-actions {
          display: flex; flex-wrap: wrap; gap: 12px;
          margin-top: 12px;
        }

        /* celebrate cards */
        .hof-celebrate {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px,2vw,24px);
        }
        .hof-cel-card {
          background: #fff;
          border: 1px solid rgba(8,16,32,0.07);
          border-radius: 16px;
          padding: clamp(24px,3vw,36px);
          display: flex; flex-direction: column; gap: 14px;
          box-shadow: 0 4px 18px rgba(8,16,32,0.05);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .hof-cel-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 38px rgba(8,16,32,0.10);
        }
        .hof-cel-icon {
          width: 50px; height: 50px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }
        .hof-cel-card h3 {
          margin: 0;
          font-size: clamp(16px,1.7vw,19px); font-weight: 800; color: #0b1020;
        }
        .hof-cel-card p {
          margin: 0;
          font-size: 14.5px; line-height: 1.65; color: #475569;
        }

        /* how to earn — steps */
        .hof-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px,2vw,28px);
        }
        .hof-step {
          position: relative;
          background: #fff;
          border: 1px solid rgba(8,16,32,0.07);
          border-radius: 16px;
          padding: clamp(22px,3vw,34px);
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 4px 18px rgba(8,16,32,0.04);
        }
        /* connector line between steps */
        .hof-step:not(:last-child)::after {
          content: "";
          position: absolute;
          top: 30px; right: -14px;
          width: 28px; height: 1px;
          background: linear-gradient(90deg, rgba(8,58,133,0.25), rgba(242,12,143,0.25));
          z-index: 1;
        }
        .hof-step-num {
          position: absolute; top: -12px; left: 20px;
          font-family: "Pragati Narrow",Impact,sans-serif;
          font-size: 11px; font-weight: 900; letter-spacing: 0.1em;
          color: #fff;
          background: linear-gradient(120deg, #083a85, #f20c8f);
          padding: 3px 9px; border-radius: 999px;
        }
        .hof-step-icon {
          width: 46px; height: 46px; border-radius: 12px;
          background: rgba(8,58,133,0.08); color: #083a85;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .hof-step h3 {
          margin: 0;
          font-size: clamp(15px,1.6vw,18px); font-weight: 800; color: #0b1020;
        }
        .hof-step p {
          margin: 0;
          font-size: 14px; line-height: 1.65; color: #475569;
        }

        /* bottom CTA */
        .hof-ov-cta {
          display: grid;
          grid-template-columns: minmax(180px,320px) 1fr;
          gap: clamp(24px,4vw,60px);
          align-items: center;
          margin-top: clamp(52px,7vw,88px);
          background: #0b1020;
          border-radius: 20px;
          overflow: hidden;
        }
        .hof-ov-cta-left {
          position: relative;
          min-height: 320px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          isolation: isolate;
          background: linear-gradient(150deg, #06205a 0%, #0a2f73 45%, #7a1860 80%, #b3174e 100%);
        }
        .hof-ov-motif {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background: repeating-linear-gradient(118deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 16px);
          -webkit-mask-image: radial-gradient(120% 80% at 50% 50%, #000 28%, transparent 82%);
                  mask-image: radial-gradient(120% 80% at 50% 50%, #000 28%, transparent 82%);
        }
        .hof-ov-lockup {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 14px;
        }
        .hof-ov-chip {
          width: clamp(60px, 8vw, 76px); height: clamp(60px, 8vw, 76px);
          border-radius: 18px;
          background: #fff;
          display: grid; place-items: center;
          box-shadow: 0 14px 32px -12px rgba(0,0,0,0.55);
        }
        .hof-ov-chip img { width: 62%; height: 62%; object-fit: contain; }
        .hof-ov-x {
          width: 30px; height: 30px; border-radius: 50%;
          display: grid; place-items: center;
          color: #fff; font-size: 13px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.32);
        }
        .hof-ov-lockup-cap {
          position: relative; z-index: 1;
          font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(255,255,255,0.72);
        }
        .hof-ov-cta-right {
          padding: clamp(32px,4vw,56px) clamp(24px,3vw,48px) clamp(32px,4vw,56px) 0;
        }
        .hof-ov-cta-right .hof-kicker { color: rgba(255,255,255,0.50); }
        .hof-ov-cta-right .hof-h2 { color: #fff; }
        .hof-ov-cta-right .hof-lead { color: rgba(255,255,255,0.58); }
        .hof-ov-cta-right .hof-btn-ghost {
          background: transparent; color: rgba(255,255,255,0.80);
          border-color: rgba(255,255,255,0.25);
        }
        .hof-ov-cta-right .hof-btn-ghost:hover {
          background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.55);
          color: #fff;
        }

        /* ════════════════════════════════════════════════════════════════
           INDUCTEES TAB
        ════════════════════════════════════════════════════════════════ */
        .hof-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(12px,1.8vw,22px);
        }
        .hof-tile {
          position: relative; display: block;
          border-radius: 14px; overflow: hidden;
          text-decoration: none; background: #0b1020;
          box-shadow: 0 12px 28px -18px rgba(8,16,32,0.55);
          isolation: isolate;
          transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease;
        }
        .hof-tile:hover {
          transform: translateY(-6px);
          box-shadow: 0 28px 52px -22px rgba(8,16,32,0.60);
        }
        .hof-tile:focus-visible { outline: 3px solid #083a85; outline-offset: 3px; }
        .hof-tile-photo {
          position: relative; display: block;
          width: 100%; padding-bottom: 133.33%; overflow: hidden;
        }
        .hof-tile-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
          object-position: center top; display: block;
          filter: grayscale(1) brightness(0.40) contrast(1.08);
          transition: transform 0.55s cubic-bezier(0.22,1,0.36,1), filter 0.45s ease;
          pointer-events: none; user-select: none;
        }
        .hof-tile:hover .hof-tile-bg {
          transform: scale(1.06);
          filter: grayscale(0.5) brightness(0.50) contrast(1.04);
        }
        .hof-tile-initials {
          position: absolute; inset: 0;
          display: grid; place-items: center;
          font-family: "Pragati Narrow",Impact,sans-serif;
          font-weight: 900;
          font-size: clamp(38px,4.5vw,60px);
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.01em;
          text-shadow: 0 2px 16px rgba(0,0,0,0.55);
          z-index: 1;
        }
        /* scrim */
        .hof-tile::after {
          content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(180deg,rgba(5,8,18,0) 28%,rgba(5,8,18,0.38) 54%,rgba(5,8,18,0.85) 80%,rgba(5,8,18,0.97) 100%);
        }
        /* brand edge on hover */
        .hof-tile::before {
          content: ""; position: absolute; inset: 0; z-index: 3; pointer-events: none;
          border-radius: 14px; padding: 2px;
          background: linear-gradient(140deg, #083a85, #f20c8f);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0; transition: opacity 0.25s ease;
        }
        .hof-tile:hover::before { opacity: 1; }
        .hof-tile-info {
          position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
          display: flex; flex-direction: column; gap: 3px;
          padding: clamp(12px,1.5vw,18px);
        }
        .hof-tile-year {
          font-size: 10px; font-weight: 800; letter-spacing: 0.14em;
          text-transform: uppercase; color: #ff9ecb;
        }
        .hof-tile-name {
          margin: 1px 0 0;
          font-family: "Pragati Narrow",Impact,sans-serif;
          font-size: clamp(16px,1.8vw,22px); font-weight: 900; line-height: 1.05;
          text-transform: uppercase; letter-spacing: 0.006em; color: #fff;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .hof-tile-spec { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.80); }
        .hof-tile-check {
          position: absolute; top: 12px; left: 12px; z-index: 3;
          width: 26px; height: 26px; border-radius: 50%;
          display: grid; place-items: center; font-size: 13px; color: #fff;
          background: #083a85; border: 2px solid rgba(255,255,255,0.85);
          box-shadow: 0 4px 10px -2px rgba(0,0,0,0.4);
        }
        .hof-tile-go {
          position: absolute; top: 12px; right: 12px; z-index: 3;
          width: 28px; height: 28px; border-radius: 50%;
          display: grid; place-items: center; font-size: 13px; color: #0b1020;
          background: #fff;
          opacity: 0; transform: translateY(-6px) scale(0.88);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .hof-tile:hover .hof-tile-go { opacity: 1; transform: none; }

        /* ════════════════════════════════════════════════════════════════
           MILESTONES TAB
        ════════════════════════════════════════════════════════════════ */
        .hof-ms { max-width: 1100px; }
        .hof-ms-hero {
          display: grid;
          grid-template-columns: minmax(0, 0.82fr) 1fr;
          gap: clamp(24px, 4vw, 56px);
          align-items: stretch;
        }
        .hof-ms-visual {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: #0b1020;
          aspect-ratio: 4 / 5;
          isolation: isolate;
        }
        .hof-ms-visual img {
          width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block;
        }
        .hof-ms-visual::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg, rgba(5,8,18,0) 45%, rgba(5,8,18,0.5) 72%, rgba(5,8,18,0.92) 100%);
        }
        .hof-ms-ribbon {
          position: absolute; top: 16px; left: 16px; z-index: 1;
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: 999px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
          color: #2a200d; background: linear-gradient(180deg, #fbf2d6, #d9b876);
          box-shadow: 0 8px 20px -6px rgba(0,0,0,0.5);
        }
        .hof-ms-ribbon i { color: #a87f1f; }
        .hof-ms-cap {
          position: absolute; left: 0; right: 0; bottom: 0; z-index: 1;
          display: flex; flex-direction: column; gap: 3px;
          padding: clamp(16px, 2vw, 22px);
        }
        .hof-ms-cap strong { font-family: "Pragati Narrow", Impact, sans-serif; font-size: clamp(20px, 2.4vw, 28px); font-weight: 900; color: #fff; }
        .hof-ms-cap span { font-size: 12.5px; color: rgba(255,255,255,0.78); }
        .hof-ms-intro { display: flex; flex-direction: column; justify-content: center; gap: 12px; }
        .hof-ms-eyebrow { font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #f20c8f; }
        .hof-ms-title {
          margin: 0;
          font-family: "Pragati Narrow", Impact, sans-serif;
          font-size: clamp(34px, 5vw, 60px); font-weight: 900; line-height: 0.98;
          letter-spacing: -0.02em; color: #0b1020;
        }
        .hof-ms-sub { margin: 0; font-size: clamp(16px, 1.8vw, 21px); font-weight: 600; color: #334155; }
        .hof-ms-lead { margin: 6px 0 0; font-size: clamp(15px, 1.5vw, 17px); line-height: 1.6; color: #475569; }
        .hof-ms-chips { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 6px; }
        .hof-ms-chips span {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 999px;
          font-size: 12.5px; font-weight: 600; color: #334155;
          background: rgba(8,58,133,0.06); border: 1px solid rgba(8,58,133,0.1);
        }
        .hof-ms-chips i { color: #083a85; }

        .hof-ms-pillars {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(16px, 2vw, 24px);
          margin-top: clamp(36px, 5vw, 56px);
        }
        .hof-ms-pillar {
          background: #fff;
          border: 1px solid rgba(8,16,32,0.08);
          border-radius: 16px;
          padding: clamp(20px, 2.4vw, 28px);
          box-shadow: 0 10px 28px -18px rgba(8,16,32,0.22);
        }
        .hof-ms-pillar-icon {
          width: 48px; height: 48px; border-radius: 13px;
          display: grid; place-items: center; margin-bottom: 14px;
          font-size: 22px; color: #fff;
          background: linear-gradient(135deg, #083a85, #f20c8f);
        }
        .hof-ms-pillar h4 { margin: 0 0 8px; font-size: 17px; font-weight: 800; line-height: 1.25; color: #0b1020; }
        .hof-ms-pillar p { margin: 0; font-size: 14px; line-height: 1.6; color: #475569; }

        .hof-ms-closing {
          margin: clamp(32px, 4vw, 48px) 0 0;
          padding: clamp(24px, 3vw, 36px) clamp(24px, 3vw, 40px);
          border-left: 4px solid #f20c8f;
          background: linear-gradient(120deg, rgba(8,58,133,0.05), rgba(242,12,143,0.05));
          border-radius: 0 16px 16px 0;
          font-size: clamp(16px, 1.8vw, 21px);
          font-style: italic;
          line-height: 1.55;
          color: #1e293b;
          max-width: 70ch;
        }

        @media (max-width: 860px) {
          .hof-ms-hero { grid-template-columns: 1fr; }
          .hof-ms-visual { aspect-ratio: 16 / 11; }
          .hof-ms-pillars { grid-template-columns: 1fr; }
        }

        /* ════════════════════════════════════════════════════════════════
           FAQs TAB
        ════════════════════════════════════════════════════════════════ */
        .hof-faqs { max-width: 840px; }
        .hof-faq { border-bottom: 1px solid rgba(8,16,32,0.09); }
        .hof-faq:first-child { border-top: 1px solid rgba(8,16,32,0.09); }
        .hof-faq-q {
          width: 100%;
          appearance: none; background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding: clamp(18px,2.2vw,26px) 4px;
          font-family: inherit; text-align: left;
          font-size: clamp(15px,1.6vw,19px); font-weight: 700; color: #0b1020;
          transition: color 0.2s ease;
        }
        .hof-faq-q:hover { color: #083a85; }
        .hof-faq.open .hof-faq-q { color: #083a85; }
        .hof-faq-ic {
          flex-shrink: 0; font-size: 14px; color: #083a85;
          transition: transform 0.3s ease;
        }
        .hof-faq.open .hof-faq-ic { transform: rotate(180deg); }
        .hof-faq-a {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s ease;
        }
        .hof-faq.open .hof-faq-a { grid-template-rows: 1fr; }
        .hof-faq-a > p {
          overflow: hidden; min-height: 0; margin: 0;
          padding: 0 4px clamp(18px,2.2vw,26px);
          max-width: 68ch;
          font-size: clamp(14px,1.4vw,16px); line-height: 1.65; color: #475569;
        }
        .hof-faq-cta {
          margin-top: clamp(40px,5vw,64px);
          display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
          padding: clamp(24px,3vw,36px);
          background: #fff;
          border: 1px solid rgba(8,16,32,0.08);
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(8,16,32,0.05);
        }
        .hof-faq-cta p {
          margin: 0; flex: 1;
          font-size: clamp(15px,1.6vw,18px); font-weight: 600; color: #0b1020;
        }

        /* ─ responsive ─ */
        @media (max-width: 1100px) {
          .hof-stats { grid-template-columns: repeat(3,1fr); }
          .hof-celebrate { grid-template-columns: 1fr 1fr; }
          .hof-steps { grid-template-columns: 1fr; }
          .hof-step:not(:last-child)::after { display: none; }
          .hof-grid { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 860px) {
          .hof-ov-hero { grid-template-columns: 1fr; }
          .hof-mosaic { grid-auto-rows: 110px; }
          .hof-feat { grid-template-columns: 1fr; }
          .hof-feat-loading { grid-template-columns: 1fr; }
          .hof-feat-visual { min-height: 220px; }
          .hof-ov-cta { grid-template-columns: 1fr; }
          .hof-ov-cta-left { min-height: 220px; }
          .hof-ov-cta-right { padding: clamp(24px,4vw,40px); }
          .hof-stats { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 620px) {
          .hof-grid { grid-template-columns: repeat(2,1fr); }
          .hof-mosaic { grid-template-columns: repeat(2,1fr); grid-auto-rows: 120px; }
          .hof-mc-wide { grid-column: span 1; }
          .hof-celebrate { grid-template-columns: 1fr; }
          .hof-stats { grid-template-columns: repeat(2,1fr); }
          .hof-faq-cta { flex-direction: column; align-items: flex-start; }
        }
        /* ════════════════════════════════════════════════════════════════
           PARTNERS TAB
        ════════════════════════════════════════════════════════════════ */
        .hof-partner-notice {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 16px 20px;
          background: rgba(8,58,133,0.05);
          border: 1px solid rgba(8,58,133,0.14);
          border-radius: 12px;
          margin-bottom: clamp(28px,4vw,44px);
        }
        .hof-partner-notice i {
          font-size: 16px; color: #083a85; flex-shrink: 0; margin-top: 2px;
        }
        .hof-partner-notice p {
          margin: 0; font-size: 14px; line-height: 1.55; color: #334155;
        }
        /* exclusive partners = wide "plaque" rows, centred — deliberate, never sparse */
        .hof-partner-grid {
          display: flex;
          flex-direction: column;
          gap: clamp(18px, 2vw, 24px);
          max-width: 940px;
          margin: 0 auto;
        }
        .hof-partner-card {
          background: #fff;
          border: 1px solid rgba(8,16,32,0.08);
          border-radius: 20px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 280px 1fr;
          box-shadow: 0 10px 30px -16px rgba(8,16,32,0.18);
          transition: transform 0.24s ease, box-shadow 0.24s ease;
        }
        .hof-partner-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 50px -22px rgba(8,16,32,0.26);
        }
        .hof-partner-top {
          display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between;
          gap: 22px;
          padding: clamp(24px, 3vw, 34px);
          border-left: 5px solid #083a85;
          background: linear-gradient(160deg, #f7f9fc, #eef2f9);
        }
        .hof-partner-logo-wrap {
          display: flex; align-items: center; height: 60px;
        }
        .hof-partner-logo {
          max-width: 190px; max-height: 60px;
          object-fit: contain; display: block;
        }
        .hof-partner-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 999px;
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: #fff;
        }
        .hof-partner-body {
          padding: clamp(22px, 3vw, 34px);
          display: flex; flex-direction: column; gap: 12px;
          justify-content: center;
        }
        .hof-partner-cat {
          font-size: 11px; font-weight: 800; letter-spacing: 0.16em;
          text-transform: uppercase; color: #083a85;
        }
        .hof-partner-name {
          font-family: "Pragati Narrow",Impact,sans-serif;
          font-size: clamp(22px,2.8vw,30px); font-weight: 900; line-height: 1;
          color: #0b1020;
        }
        .hof-partner-caution {
          display: flex; align-items: flex-start; gap: 7px;
          margin: 0; padding: 10px 12px;
          background: rgba(8,58,133,0.04);
          border-radius: 8px;
          font-size: 13px; line-height: 1.5; color: #334155;
        }
        .hof-partner-caution i { color: #083a85; flex-shrink: 0; margin-top: 2px; }
        .hof-partner-quote {
          margin: 0;
          padding: 0 0 0 13px;
          border-left: 3px solid #f20c8f;
          font-style: italic;
          font-size: 14px; line-height: 1.55; color: #475569;
        }
        .hof-partner-actions {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-top: auto; padding-top: 6px;
        }
        .hof-btn-insta {
          background: transparent;
          border-color: rgba(242,12,143,0.35) !important;
          color: #f20c8f !important;
        }
        .hof-btn-insta:hover {
          background: rgba(242,12,143,0.06) !important;
          border-color: #f20c8f !important;
        }
        .hof-partner-cta {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 24px;
          margin-top: clamp(40px,5vw,60px);
          padding: clamp(24px,3vw,36px);
          background: #fff;
          border: 1px solid rgba(8,16,32,0.08);
          border-radius: 18px;
          box-shadow: 0 4px 18px rgba(8,16,32,0.05);
        }

        @media (max-width: 640px) {
          .hof-partner-card { grid-template-columns: 1fr; }
          .hof-partner-top {
            flex-direction: row; align-items: center; justify-content: space-between;
            border-left: none; border-top: 5px solid #083a85;
          }
          .hof-partner-cta { flex-direction: column; align-items: flex-start; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hof-tab, .hof-faq-ic, .hof-faq-a,
          .hof-tile, .hof-tile-bg, .hof-tile-go, .hof-tile::before,
          .hof-cel-card, .hof-btn, .hof-mc img { transition: none !important; }
          .hof-tile:hover { transform: none; }
          .hof-tile:hover .hof-tile-bg { transform: none; }
          .hof-skel { animation: none; }
        }
      `}</style>
    </div>
  );
}
