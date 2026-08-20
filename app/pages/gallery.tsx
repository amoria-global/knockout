"use client";

/**
 * Gallery: public "Hall of Fame".
 * Dark, cinematic prestige theme: aurora hero with outlined display type,
 * glassy sticky pill tab bar, gradient-bordered partner spotlight, scroll
 * reveals. Four views: Overview · Partners · Milestones · FAQs.
 *
 * Images: ALL from /public, zero database calls.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "bootstrap-icons/font/bootstrap-icons.css";

// ─── Static content ──────────────────────────────────────────────────────────
const MILESTONES = [
  { icon: "bi-patch-check-fill",    value: "Verified", label: "Photographers only" },
  { icon: "bi-broadcast",           value: "Live",     label: "Event albums"       },
  { icon: "bi-person-bounding-box", value: "AI",       label: "Face search"        },
  { icon: "bi-star-fill",           value: "Rated",    label: "By real clients"    },
  { icon: "bi-shield-lock-fill",    value: "Secure",   label: "Private vaults"     },
  { icon: "bi-cloud-arrow-down",    value: "Instant",  label: "Download originals" },
];

const MARQUEE = [
  "Exclusive partnerships",
  "Verified by Connekyt",
  "Cultural milestones",
  "Never paid placement",
  "One brand per category",
];

const WHAT_WE_CELEBRATE = [
  {
    icon: "bi-gem",
    glow: "rgba(217,184,118,0.13)",
    line: "rgba(217,184,118,0.35)",
    bg:   "rgba(217,184,118,0.12)",
    fg:   "#e6c98a",
    title: "Exclusive by design",
    body: "We partner with a select few. Each agreement is exclusive within its category, so your brand stands alone here instead of being buried in a crowded directory of logos.",
  },
  {
    icon: "bi-broadcast-pin",
    glow: "rgba(93,140,220,0.14)",
    line: "rgba(93,140,220,0.38)",
    bg:   "rgba(8,58,133,0.25)",
    fg:   "#8fb0e6",
    title: "Shared audience",
    body: "Reach Connekyt's community of clients, creators and event-goers. Your brand appears where Rwanda's events are captured, streamed and remembered.",
  },
  {
    icon: "bi-patch-check-fill",
    glow: "rgba(242,12,143,0.14)",
    line: "rgba(242,12,143,0.35)",
    bg:   "rgba(242,12,143,0.12)",
    fg:   "#f20c8f",
    title: "Verified credibility",
    body: "Every partnership is vetted and verified by the Connekyt team. A place on this wall signals an official, active and trusted relationship. It is never paid placement.",
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
    body: "We review fit and shared values. Exclusive partnerships are intentional, and we only take on brands whose standards match our own.",
  },
  {
    step: "03",
    icon: "bi-award-fill",
    title: "Featured on the wall",
    body: "Your brand joins the Hall of Fame with its logo, story and links, seen by every client, creator and visitor who comes to Connekyt.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the Connekyt Hall of Fame?",
    a: "It's where we honour the exclusive partners who stand with Connekyt. It is a permanent, public tribute to the organisations backing our mission, shown to everyone who visits.",
  },
  {
    q: "What makes a partnership exclusive?",
    a: "Each partner is the only brand we work with in their category. There is no crowded directory of logos here. Every partner stands alone, by design.",
  },
  {
    q: "How does a brand become a partner?",
    a: "It starts with a conversation. Reach out, we review fit and shared values, and approved partners are featured here with their logo, story and links to their channels.",
  },
  {
    q: "Is every partnership verified?",
    a: "Yes. Every partnership is vetted by the Connekyt team. A place on this wall signals an official, active and trusted relationship, and it is never paid placement.",
  },
  {
    q: "What do partners get?",
    a: "A prominent, permanent feature on a page seen by Connekyt's clients, creators and visitors, plus direct links to their website and social channels.",
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
    caution: "Official media partner and Rwanda's leading news platform.",
    quote: "Connekyt events, now featured where Rwanda reads first.",
    instagram: "https://www.instagram.com/igiheofficial/",
    website: "https://www.igihe.com",
  },
];

// ─── Inducted Milestones ────────────────────────────────────────────────────
const UMUDENDE_PILLARS = [
  {
    icon: "bi-globe-americas",
    title: "A global beacon for Gakondo",
    body: "Umudende 2026 wasn't just a local performance. It was a borderless celebration of Gakondo, traditional Rwandan music. Streamed live to thousands across the globe, it broke geographical barriers, letting the diaspora and international art lovers experience the Ingoma drums, the dancers and Rwandan storytelling in real time.",
  },
  {
    icon: "bi-lightning-charge-fill",
    title: "Where tradition met tomorrow",
    body: "Its magic lay in a groundbreaking fusion of genres. The collaboration of Jules Sentore and Masamba proved that safeguarding culture doesn't mean keeping it stagnant. Weaving ancient Rwandan poetry with contemporary sound sparked a wave of pride among Gen Z and millennial viewers, making traditional art viral, trendy and relevant.",
  },
  {
    icon: "bi-trophy-fill",
    title: "Why it belongs in the Hall of Fame",
    body: "We induct Umudende 2026 for fulfilling the ultimate mission of art advocacy. It delivered global access, democratising Rwandan culture by bringing an authentic Kigali stage to global screens. And it opened an intergenerational dialogue, uniting musical elders and youth icons on one stage and passing Rwanda's creative flame securely to the next generation.",
  },
];

type Tab = "overview" | "partners" | "milestones" | "faqs";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",   label: "Overview",   icon: "bi-stars"           },
  { id: "partners",   label: "Partners",   icon: "bi-award"           },
  { id: "milestones", label: "Milestones", icon: "bi-trophy"          },
  { id: "faqs",       label: "FAQs",       icon: "bi-question-circle" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function Gallery() {
  const [tab, setTabState] = useState<Tab>("overview");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const mainRef = useRef<HTMLElement>(null);

  const monthLabel      = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const featuredPartner = PARTNERS[0];

  const setTab = (next: Tab) => {
    setTabState(next);
    // Keep the reader anchored at the top of the active view when switching.
    // Anchor on <main> (static): the sticky tab bar's rect reports its stuck
    // position, not its place in the document.
    const anchor = mainRef.current;
    if (anchor) {
      const top = anchor.getBoundingClientRect().top + window.scrollY - 170;
      if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
    }
  };

  // Scroll-reveal: observe .rv elements of the active view.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".hf .rv:not(.in)"));
    if (!els.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tab]);

  return (
    <div className="hf">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="hero">
        <div className="hero-inner">
          <span className="hero-badge">
            <span className="dot" aria-hidden="true" />
            Connekyt · Hall of fame
            <i className="bi bi-trophy-fill" aria-hidden="true" />
          </span>
          <h1 className="hero-title">
            <span className="row outline">Hall of</span>
            <span className="row grad">Fame</span>
          </h1>
          <p className="hero-sub">
            A permanent tribute to the exclusive partners and landmark moments
            that stand with Connekyt. Each one is vetted, verified and honoured
            for everyone to see.
          </p>
          <div className="hero-cta">
            <button type="button" className="btn btn-primary" onClick={() => setTab("partners")}>
              <i className="bi bi-award-fill" aria-hidden="true" />
              Meet our partners
            </button>
            <Link href="/user/contact_us" className="btn btn-ghost">
              <i className="bi bi-envelope-fill" aria-hidden="true" />
              Become a partner
            </Link>
          </div>
        </div>
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i}><i className="bi bi-circle-fill" /> {m}</span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Sticky tab bar ───────────────────────────────────────────────── */}
      <div className="tabbar-wrap">
        <nav className="tabbar" role="tablist" aria-label="Hall of Fame sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              className="tab"
              onClick={() => setTab(t.id)}
            >
              <i className={`bi ${t.icon}`} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <main ref={mainRef}>
        {/* ════ OVERVIEW ════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <section className="view" aria-label="Overview">
            <div className="stats rv">
              {MILESTONES.map((m) => (
                <div key={m.label} className="stat">
                  <i className={`bi ${m.icon}`} aria-hidden="true" />
                  <strong>{m.value}</strong>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>

            <div className="sect-head rv">
              <span className="sect-label">
                <i className="bi bi-award-fill" aria-hidden="true" />
                Featured partner
              </span>
              <span className="sect-meta">{monthLabel}</span>
            </div>

            {featuredPartner ? (
              <div className="spotlight rv">
                <div className="spotlight-in">
                  <div className="spot-visual">
                    <div className="spot-logo-ring">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={featuredPartner.logo} alt={`${featuredPartner.name} logo`} />
                    </div>
                    <span className="spot-cat">
                      <i className="bi bi-newspaper" aria-hidden="true" />
                      {featuredPartner.category}
                    </span>
                  </div>
                  <div className="spot-body">
                    <span className="spot-flag">
                      <i className="bi bi-patch-check-fill" aria-hidden="true" />
                      Exclusive partner
                    </span>
                    <h2 className="spot-name">{featuredPartner.name}</h2>
                    <p className="spot-desc">{featuredPartner.caution}</p>
                    {featuredPartner.quote && (
                      <blockquote className="spot-quote">
                        <i className="bi bi-quote" aria-hidden="true" />
                        {featuredPartner.quote}
                      </blockquote>
                    )}
                    <div className="spot-actions">
                      {featuredPartner.website && (
                        <a href={featuredPartner.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                          <i className="bi bi-globe2" aria-hidden="true" />
                          Visit website
                        </a>
                      )}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab("partners")}>
                        <i className="bi bi-grid-3x3-gap-fill" aria-hidden="true" />
                        All partners
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="sect-head rv">
              <span className="sect-label">
                <i className="bi bi-gem" aria-hidden="true" />
                Why brands partner with us
              </span>
            </div>
            <div className="why rv">
              {WHAT_WE_CELEBRATE.map((c) => (
                <div
                  key={c.title}
                  className="why-card"
                  style={{
                    "--wc-glow": c.glow,
                    "--wc-line": c.line,
                    "--wc-bg": c.bg,
                    "--wc-fg": c.fg,
                  } as React.CSSProperties}
                >
                  <div className="why-ic"><i className={`bi ${c.icon}`} aria-hidden="true" /></div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>

            <div className="sect-head rv">
              <span className="sect-label">
                <i className="bi bi-signpost-2-fill" aria-hidden="true" />
                How partnership works
              </span>
            </div>
            <div className="steps rv">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={s.step} className="step">
                  <div className="step-top">
                    <span className="step-num">{s.step}</span>
                    <span className="step-ic"><i className={`bi ${s.icon}`} aria-hidden="true" /></span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  {i < HOW_IT_WORKS.length - 1 && <span className="step-link" aria-hidden="true" />}
                </div>
              ))}
            </div>

            <div className="cta rv">
              <div className="cta-lockup" aria-hidden="true">
                <span className="cta-chip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="" />
                </span>
                <span className="cta-x"><i className="bi bi-plus-lg" /></span>
                <span className="cta-chip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/igihe_logo.png" alt="" />
                </span>
              </div>
              <p className="kicker kicker-center">Become a partner</p>
              <h2 className="h2">Stand with <span className="accent">Connekyt.</span></h2>
              <p className="lead lead-center">
                We align with a select few brands whose values match ours. If
                that&rsquo;s you, let&rsquo;s build something exclusive and put your
                name on the wall.
              </p>
              <div className="cta-btns">
                <Link href="/user/contact_us" className="btn btn-primary">
                  <i className="bi bi-envelope-fill" aria-hidden="true" />
                  Get in touch
                </Link>
                <button type="button" className="btn btn-ghost" onClick={() => setTab("partners")}>
                  <i className="bi bi-award-fill" aria-hidden="true" />
                  Meet our partners
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ════ PARTNERS ════════════════════════════════════════════════ */}
        {tab === "partners" && (
          <section className="view" aria-label="Exclusive Partners">
            <div className="view-head">
              <p className="kicker">Exclusive partners</p>
              <h2 className="h2">Brands that stand<br />with <span className="accent">Connekyt.</span></h2>
              <p className="lead">
                These organisations have chosen to align with Connekyt, sharing
                our commitment to quality, creativity and community. Each
                partnership is exclusive, intentional and built on shared values.
              </p>
            </div>

            <div className="assurance rv">
              <i className="bi bi-shield-check-fill" aria-hidden="true" />
              <p>
                All partnerships listed here are exclusive agreements verified by
                the Connekyt team. Presence on this page signifies an official,
                active relationship and is never paid placement.
              </p>
            </div>

            <div className="partner-list">
              {PARTNERS.map((p) => (
                <div key={p.id} className="spotlight rv">
                  <div className="spotlight-in">
                    <div className="spot-visual">
                      <div className="spot-logo-ring">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.logo} alt={`${p.name} logo`} />
                      </div>
                      <span className="spot-cat">
                        <i className="bi bi-newspaper" aria-hidden="true" />
                        {p.category}
                      </span>
                    </div>
                    <div className="spot-body">
                      <span className="spot-flag">
                        <i className="bi bi-patch-check-fill" aria-hidden="true" />
                        Exclusive partner
                      </span>
                      <h3 className="spot-name">{p.name}</h3>
                      <p className="spot-desc">{p.caution}</p>
                      {p.quote && (
                        <blockquote className="spot-quote">
                          <i className="bi bi-quote" aria-hidden="true" />
                          {p.quote}
                        </blockquote>
                      )}
                      <div className="spot-actions">
                        {p.website && (
                          <a href={p.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                            <i className="bi bi-globe2" aria-hidden="true" />
                            Visit website
                          </a>
                        )}
                        {p.instagram && (
                          <a href={p.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                            <i className="bi bi-instagram" aria-hidden="true" />
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="slot rv">
                <i className="bi bi-plus-circle-dotted" aria-hidden="true" />
                Your category could stand here. One exclusive brand per category.
              </div>
            </div>

            <div className="panel-cta rv">
              <div>
                <strong>Interested in an exclusive partnership?</strong>
                <p>
                  We work with a select number of brands whose values align with
                  ours. If that&apos;s you, we&apos;d love to talk.
                </p>
              </div>
              <Link href="/user/contact_us" className="btn btn-primary">
                <i className="bi bi-envelope-fill" aria-hidden="true" />
                Get in touch
              </Link>
            </div>
          </section>
        )}

        {/* ════ MILESTONES ══════════════════════════════════════════════ */}
        {tab === "milestones" && (
          <section className="view" aria-label="Inducted Milestones">
            <div className="view-head">
              <p className="kicker">Inducted milestones</p>
              <h2 className="h2">Moments that<br />made <span className="accent">history.</span></h2>
              <p className="lead">
                Beyond people and brands, the Hall of Fame honours the landmark
                events that push Rwandan culture forward. These are the moments
                we&rsquo;ll never forget.
              </p>
            </div>

            <article>
              <div className="ms-hero rv">
                <div className="ms-visual">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/umudende.PNG" alt="Jules Sentore performing at the Umudende Live Concert 2026" />
                  <span className="ms-ribbon">
                    <i className="bi bi-trophy-fill" aria-hidden="true" />
                    Inducted 2026
                  </span>
                  <div className="ms-cap">
                    <strong>Jules Sentore</strong>
                    <span>Umudende Live Concert · Kigali Universe · May 29, 2026</span>
                  </div>
                </div>
                <div className="ms-intro">
                  <span className="kicker kicker-tight">Hall of Fame · Cultural milestone</span>
                  <h3 className="h2 h2-tight">Umudende <span className="accent">2026</span></h3>
                  <p className="ms-sub">Giving history wings to fly across the digital universe, bridging eras.</p>
                  <p className="lead lead-sm">
                    On May 29, 2026, the digital and physical worlds collided at
                    Kigali Universe for a historic milestone in Rwandan heritage:
                    the Umudende Live Concert. Led by the visionary Jules Sentore
                    alongside cultural icons Masamba Intore, it enters our Hall of
                    Fame as the first masterclass in cultural preservation for the
                    modern era.
                  </p>
                  <div className="ms-chips">
                    <span><i className="bi bi-mic-fill" aria-hidden="true" /> Jules Sentore</span>
                    <span><i className="bi bi-people-fill" aria-hidden="true" /> Masamba Intore</span>
                    <span><i className="bi bi-geo-alt-fill" aria-hidden="true" /> Kigali Universe</span>
                    <span><i className="bi bi-broadcast" aria-hidden="true" /> Streamed live</span>
                  </div>
                </div>
              </div>

              <div className="pillars rv">
                {UMUDENDE_PILLARS.map((p) => (
                  <div key={p.title} className="pillar">
                    <div className="pillar-ic"><i className={`bi ${p.icon}`} aria-hidden="true" /></div>
                    <h4>{p.title}</h4>
                    <p>{p.body}</p>
                  </div>
                ))}
              </div>

              <blockquote className="ms-closing rv">
                <i className="bi bi-quote" aria-hidden="true" />
                Umudende 2026 proved that culture is not a relic of the past. It
                is a living force capable of inspiring the future. By embracing
                digital innovation while honouring tradition, Rwanda showed the
                world that its history is not merely preserved; it is empowered to
                travel beyond borders, generations, and time itself.
              </blockquote>
            </article>
          </section>
        )}

        {/* ════ FAQS ════════════════════════════════════════════════════ */}
        {tab === "faqs" && (
          <section className="view" aria-label="FAQs">
            <div className="view-head">
              <p className="kicker">Frequently asked</p>
              <h2 className="h2">Hall of Fame,<br /><span className="accent">explained.</span></h2>
              <p className="lead">
                Everything you need to know about the Connekyt Hall of Fame:
                how it works, who qualifies and what it means.
              </p>
            </div>

            <div className="faq-grid rv">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q} className={`faq${open ? " open" : ""}`}>
                    <button
                      type="button"
                      className="faq-q"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      <span>{f.q}</span>
                      <span className="faq-tog"><i className="bi bi-plus-lg" aria-hidden="true" /></span>
                    </button>
                    <div className="faq-a" role="region">
                      <p>{f.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="panel-cta rv">
              <div>
                <strong>Still have questions?</strong>
                <p>Our team is happy to help. Reach out any time.</p>
              </div>
              <Link href="/user/contact_us" className="btn btn-primary">
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
        /* ═ tokens ═ */
        .hf {
          --navy: #083a85;
          --pink: #f20c8f;
          --gold: #d9b876;
          --gold-deep: #a87f1f;
          --ink-0: #04060c;
          --ink-2: #0d1220;
          --line: rgba(255, 255, 255, 0.08);
          --line-strong: rgba(255, 255, 255, 0.14);
          --txt-hi: #f4f6fb;
          --txt-mid: rgba(226, 232, 244, 0.72);
          --txt-low: rgba(180, 190, 210, 0.55);
          --glass: rgba(255, 255, 255, 0.04);
          --glass-hover: rgba(255, 255, 255, 0.07);
          --display: "Pragati Narrow", "Arial Narrow", Impact, sans-serif;
          min-height: 100vh;
          background: var(--ink-0);
          color: var(--txt-hi);
        }
        .hf ::selection { background: rgba(242, 12, 143, 0.35); color: #fff; }

        /* ═ hero ═ */
        .hero {
          position: relative;
          min-height: clamp(460px, 60vh, 620px);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: clamp(40px, 6vh, 64px) clamp(20px, 6vw, 80px) 0;
          overflow: hidden;
          isolation: isolate;
        }
        .hero::before {
          content: "";
          position: absolute;
          inset: -20%;
          z-index: -2;
          background:
            radial-gradient(42% 48% at 18% 28%, rgba(8, 58, 133, 0.55), transparent 70%),
            radial-gradient(38% 44% at 82% 18%, rgba(242, 12, 143, 0.28), transparent 70%),
            radial-gradient(50% 55% at 68% 78%, rgba(8, 58, 133, 0.35), transparent 72%),
            radial-gradient(30% 34% at 40% 60%, rgba(122, 24, 96, 0.3), transparent 70%);
          filter: blur(10px);
          animation: hf-aurora 22s ease-in-out infinite alternate;
        }
        @keyframes hf-aurora {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          50%  { transform: translate3d(2%, -2%, 0) scale(1.06); }
          100% { transform: translate3d(-2%, 2%, 0) scale(1.02); }
        }
        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background:
            linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
          background-size: 72px 72px;
          -webkit-mask-image: radial-gradient(90% 80% at 50% 30%, #000 30%, transparent 85%);
                  mask-image: radial-gradient(90% 80% at 50% 30%, #000 30%, transparent 85%);
        }
        .hero-inner { max-width: 1280px; margin: 0 auto; width: 100%; position: relative; }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(217, 184, 118, 0.1);
          border: 1px solid rgba(217, 184, 118, 0.3);
          color: var(--gold);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .hero-badge i { font-size: 13px; }
        .hero-badge .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 12px 2px rgba(217, 184, 118, 0.8);
          animation: hf-pulse 2.4s ease-in-out infinite;
        }
        @keyframes hf-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .hero-title {
          margin: 0;
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(52px, 8.2vw, 118px);
          line-height: 0.9;
          letter-spacing: -0.02em;
          text-transform: uppercase;
        }
        .hero-title .row { display: block; }
        .hero-title .outline {
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.34);
        }
        .hero-title .grad {
          background: linear-gradient(96deg, #fff 12%, #ffd9ee 38%, var(--pink) 72%, var(--navy) 118%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-sub {
          margin: 16px 0 0;
          max-width: 58ch;
          font-size: clamp(14px, 1.4vw, 17px);
          line-height: 1.6;
          color: var(--txt-mid);
        }
        .hero-cta { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 22px; }

        .marquee {
          margin-top: clamp(24px, 4vh, 44px);
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          padding: 16px 0;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
                  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }
        .marquee-track {
          display: flex;
          gap: 56px;
          width: max-content;
          animation: hf-marquee 30s linear infinite;
        }
        .marquee-track span {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--txt-low);
          white-space: nowrap;
        }
        .marquee-track i { color: var(--pink); font-size: 10px; }
        @keyframes hf-marquee {
          to { transform: translateX(-50%); }
        }

        /* ═ tab bar ═ */
        .tabbar-wrap {
          position: sticky;
          top: 68px;
          z-index: 40;
          display: flex;
          justify-content: center;
          padding: 18px clamp(16px, 4vw, 32px);
          pointer-events: none;
        }
        .tabbar {
          pointer-events: auto;
          display: flex;
          gap: 4px;
          padding: 5px;
          border-radius: 999px;
          background: rgba(10, 13, 24, 0.78);
          -webkit-backdrop-filter: blur(18px);
          backdrop-filter: blur(18px);
          border: 1px solid var(--line-strong);
          box-shadow: 0 18px 48px -18px rgba(0, 0, 0, 0.8);
        }
        .tab {
          appearance: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--txt-mid);
          background: transparent;
          transition: color 0.25s ease, background 0.25s ease;
          white-space: nowrap;
        }
        .tab i { font-size: 13px; opacity: 0.8; }
        .tab:hover { color: #fff; }
        .tab:focus-visible { outline: 2px solid var(--pink); outline-offset: 2px; }
        .tab[aria-selected="true"] {
          color: #fff;
          background: linear-gradient(120deg, var(--navy), #6a1f7a 55%, var(--pink));
          box-shadow: 0 8px 22px -8px rgba(242, 12, 143, 0.55);
        }

        /* ═ shared ═ */
        .view {
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(40px, 5vw, 72px) clamp(20px, 6vw, 80px) clamp(80px, 9vw, 120px);
        }
        .view-head { margin-bottom: clamp(32px, 4.5vw, 52px); }
        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 16px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--pink);
        }
        .kicker::before {
          content: "";
          width: 26px;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--navy), var(--pink));
        }
        .kicker-center { justify-content: center; }
        .kicker-tight { margin-bottom: 0; }
        .h2 {
          margin: 0 0 18px;
          font-family: var(--display);
          font-size: clamp(38px, 5.4vw, 72px);
          font-weight: 700;
          line-height: 0.96;
          letter-spacing: -0.015em;
          text-transform: uppercase;
          color: var(--txt-hi);
        }
        .h2-tight { margin-bottom: 0; }
        .h2 .accent {
          background: linear-gradient(96deg, var(--pink), #ff77c4);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          /* The heading's negative letter-spacing shrinks the inline box past
             the last glyph's ink; widen the paint area so clip-to-text never
             cuts the final letter. */
          padding-right: 0.1em;
          margin-right: -0.1em;
        }
        .lead {
          margin: 0;
          font-size: clamp(15px, 1.5vw, 18px);
          line-height: 1.7;
          color: var(--txt-mid);
          max-width: 62ch;
        }
        .lead-sm { font-size: 15px; }
        .lead-center { margin: 0 auto 32px; }

        /* .btn is used on next/link components too; styled-jsx only scopes
           intrinsic tags, so these must be :global under the .hf root. */
        .hf :global(.btn) {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 14px 26px;
          border-radius: 999px;
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 800;
          letter-spacing: 0.01em;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
          white-space: nowrap;
        }
        .hf :global(.btn:hover) { transform: translateY(-2px); }
        .hf :global(.btn:active) { transform: translateY(0); }
        .hf :global(.btn:focus-visible) { outline: 2px solid var(--pink); outline-offset: 3px; }
        .hf :global(.btn-sm) { padding: 12px 22px; font-size: 13.5px; }
        .hf :global(.btn-primary) {
          background: linear-gradient(120deg, var(--navy), var(--pink));
          color: #fff;
          box-shadow: 0 14px 34px -12px rgba(242, 12, 143, 0.55);
        }
        .hf :global(.btn-primary:hover) { box-shadow: 0 20px 44px -12px rgba(242, 12, 143, 0.7); }
        .hf :global(.btn-ghost) {
          background: var(--glass);
          color: var(--txt-hi);
          border: 1px solid var(--line-strong);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
        }
        .hf :global(.btn-ghost:hover) { background: var(--glass-hover); border-color: rgba(255, 255, 255, 0.28); }

        .sect-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          margin: clamp(64px, 8vw, 104px) 0 clamp(28px, 3.5vw, 44px);
        }
        .sect-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--txt-hi);
        }
        .sect-label i { color: var(--gold); font-size: 14px; }
        .sect-meta {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--txt-low);
        }

        /* reveal on scroll */
        .rv {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .rv.in { opacity: 1; transform: none; }

        /* ═ overview: stats ═ */
        .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
        .stat {
          position: relative;
          padding: 22px 18px;
          border-radius: 18px;
          background: var(--glass);
          border: 1px solid var(--line);
          overflow: hidden;
          transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
        }
        .stat:hover {
          transform: translateY(-4px);
          border-color: rgba(242, 12, 143, 0.4);
          background: var(--glass-hover);
        }
        .stat i {
          font-size: 20px;
          background: linear-gradient(120deg, #7fa8e8, var(--pink));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stat strong {
          display: block;
          margin-top: 14px;
          font-family: var(--display);
          font-size: 24px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.01em;
        }
        .stat span {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--txt-low);
        }

        /* ═ partner spotlight ═ */
        .spotlight {
          position: relative;
          border-radius: 26px;
          padding: 1.5px;
          background: linear-gradient(135deg, rgba(8, 58, 133, 0.9), rgba(255, 255, 255, 0.1) 40%, rgba(242, 12, 143, 0.85));
          overflow: hidden;
        }
        .spotlight-in {
          position: relative;
          border-radius: 25px;
          background: linear-gradient(150deg, #0b1120 0%, #0d1024 55%, #180a1e 100%);
          display: grid;
          grid-template-columns: minmax(280px, 420px) 1fr;
          overflow: hidden;
        }
        .spotlight-in::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(60% 90% at 8% 8%, rgba(8, 58, 133, 0.35), transparent 60%),
            radial-gradient(50% 80% at 95% 90%, rgba(242, 12, 143, 0.16), transparent 60%);
        }
        .spot-visual {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: clamp(40px, 5vw, 64px) clamp(28px, 4vw, 48px);
          border-right: 1px solid var(--line);
        }
        .spot-logo-ring {
          position: relative;
          width: clamp(130px, 15vw, 168px);
          height: clamp(130px, 15vw, 168px);
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #fff;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.16), 0 0 60px -8px rgba(242, 12, 143, 0.4), 0 24px 60px -18px rgba(0, 0, 0, 0.7);
        }
        .spot-logo-ring::before {
          content: "";
          position: absolute;
          inset: -9px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, var(--navy), var(--pink), var(--gold), var(--navy));
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
                  mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
          animation: hf-spin 9s linear infinite;
        }
        @keyframes hf-spin {
          to { transform: rotate(360deg); }
        }
        .spot-logo-ring img { width: 62%; height: 62%; object-fit: contain; }
        .spot-cat {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 15px;
          border-radius: 999px;
          background: rgba(8, 58, 133, 0.28);
          border: 1px solid rgba(93, 140, 220, 0.35);
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9db9e8;
        }
        .spot-body {
          position: relative;
          padding: clamp(34px, 4.5vw, 60px);
          display: flex;
          flex-direction: column;
          gap: 16px;
          justify-content: center;
        }
        .spot-flag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          padding: 7px 14px;
          border-radius: 999px;
          background: linear-gradient(180deg, #fbf2d6, var(--gold));
          color: #2a200d;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          box-shadow: 0 10px 24px -8px rgba(217, 184, 118, 0.45);
        }
        .spot-flag i { color: var(--gold-deep); }
        .spot-name {
          margin: 0;
          font-family: var(--display);
          font-size: clamp(40px, 5.5vw, 68px);
          font-weight: 700;
          line-height: 0.95;
          text-transform: uppercase;
          color: var(--txt-hi);
        }
        .spot-desc { margin: 0; font-size: 15px; line-height: 1.7; color: var(--txt-mid); max-width: 56ch; }
        .spot-quote {
          margin: 0;
          display: flex;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid var(--line);
          font-size: 15px;
          font-style: italic;
          line-height: 1.6;
          color: var(--txt-mid);
          max-width: 58ch;
        }
        .spot-quote i { color: var(--pink); font-size: 18px; flex-shrink: 0; }
        .spot-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; }

        /* ═ overview: why cards ═ */
        .why { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .why-card {
          position: relative;
          padding: clamp(26px, 3vw, 38px);
          border-radius: 22px;
          background: var(--glass);
          border: 1px solid var(--line);
          overflow: hidden;
          transition: transform 0.28s ease, border-color 0.28s ease;
        }
        .why-card::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.35s ease;
          background: radial-gradient(80% 60% at 50% 0%, var(--wc-glow, rgba(242, 12, 143, 0.14)), transparent 70%);
          pointer-events: none;
        }
        .why-card:hover { transform: translateY(-6px); border-color: var(--wc-line, rgba(242, 12, 143, 0.35)); }
        .why-card:hover::before { opacity: 1; }
        .why-ic {
          width: 52px;
          height: 52px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          font-size: 22px;
          background: var(--wc-bg, rgba(242, 12, 143, 0.12));
          color: var(--wc-fg, var(--pink));
          border: 1px solid var(--wc-line, rgba(242, 12, 143, 0.25));
          margin-bottom: 20px;
        }
        .why-card h3 { margin: 0 0 10px; font-size: 18px; font-weight: 800; letter-spacing: -0.01em; color: var(--txt-hi); }
        .why-card p { margin: 0; font-size: 14.5px; line-height: 1.7; color: var(--txt-mid); }

        /* ═ overview: steps ═ */
        .steps { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .step {
          position: relative;
          padding: clamp(26px, 3vw, 36px);
          border-radius: 22px;
          background: var(--glass);
          border: 1px solid var(--line);
          transition: transform 0.28s ease, border-color 0.28s ease;
        }
        .step:hover { transform: translateY(-5px); border-color: rgba(93, 140, 220, 0.4); }
        .step-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .step-num {
          font-family: var(--display);
          font-size: 48px;
          font-weight: 700;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1.3px rgba(255, 255, 255, 0.28);
        }
        .step-ic {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          font-size: 19px;
          color: #fff;
          background: linear-gradient(135deg, var(--navy), var(--pink));
          box-shadow: 0 10px 24px -10px rgba(242, 12, 143, 0.5);
        }
        .step h3 { margin: 0 0 9px; font-size: 17px; font-weight: 800; color: var(--txt-hi); }
        .step p { margin: 0; font-size: 14px; line-height: 1.7; color: var(--txt-mid); }
        .step-link {
          position: absolute;
          top: 50%;
          right: -17px;
          z-index: 1;
          width: 18px;
          height: 2px;
          background: linear-gradient(90deg, rgba(93, 140, 220, 0.5), rgba(242, 12, 143, 0.5));
        }

        /* ═ CTA panel ═ */
        .cta {
          position: relative;
          margin-top: clamp(72px, 9vw, 112px);
          border-radius: 28px;
          overflow: hidden;
          isolation: isolate;
          padding: clamp(48px, 7vw, 92px) clamp(28px, 5vw, 72px);
          text-align: center;
          border: 1px solid var(--line-strong);
          background: linear-gradient(160deg, #081231 0%, #12102e 45%, #2a0d28 100%);
        }
        .cta::before {
          content: "";
          position: absolute;
          inset: -30%;
          z-index: -1;
          background:
            radial-gradient(35% 45% at 30% 20%, rgba(8, 58, 133, 0.6), transparent 70%),
            radial-gradient(30% 40% at 75% 80%, rgba(242, 12, 143, 0.35), transparent 70%);
          filter: blur(12px);
          animation: hf-aurora 18s ease-in-out infinite alternate;
        }
        .cta::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: repeating-linear-gradient(118deg, rgba(255, 255, 255, 0.05) 0 2px, transparent 2px 18px);
          -webkit-mask-image: radial-gradient(100% 90% at 50% 50%, #000 20%, transparent 80%);
                  mask-image: radial-gradient(100% 90% at 50% 50%, #000 20%, transparent 80%);
        }
        .cta-lockup { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 30px; }
        .cta-chip {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: #fff;
          display: grid;
          place-items: center;
          box-shadow: 0 18px 40px -14px rgba(0, 0, 0, 0.65);
        }
        .cta-chip img { width: 60%; height: 60%; object-fit: contain; }
        .cta-x {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 14px;
          color: #fff;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .cta .h2 { margin-bottom: 14px; }
        .cta-btns { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }

        /* ═ partners ═ */
        .assurance {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 24px;
          border-radius: 16px;
          background: rgba(8, 58, 133, 0.12);
          border: 1px solid rgba(93, 140, 220, 0.25);
          margin-bottom: clamp(32px, 4vw, 48px);
        }
        .assurance i { font-size: 20px; color: #7fa8e8; flex-shrink: 0; }
        .assurance p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--txt-mid); }
        .partner-list { display: flex; flex-direction: column; gap: 22px; max-width: 980px; margin: 0 auto; }
        .slot {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 30px;
          border-radius: 22px;
          border: 1.5px dashed rgba(255, 255, 255, 0.16);
          color: var(--txt-low);
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          transition: border-color 0.25s ease, color 0.25s ease;
        }
        .slot:hover { border-color: rgba(242, 12, 143, 0.45); color: var(--txt-mid); }
        .slot i { font-size: 18px; color: var(--pink); }

        /* ═ milestones ═ */
        .ms-hero {
          display: grid;
          grid-template-columns: minmax(0, 0.85fr) 1fr;
          gap: clamp(28px, 4.5vw, 64px);
          align-items: stretch;
        }
        .ms-visual {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          aspect-ratio: 4 / 5;
          background: var(--ink-2);
          border: 1px solid var(--line);
          isolation: isolate;
        }
        .ms-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          display: block;
          transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ms-visual:hover img { transform: scale(1.04); }
        .ms-visual::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(4, 6, 12, 0) 42%, rgba(4, 6, 12, 0.55) 74%, rgba(4, 6, 12, 0.94) 100%);
        }
        .ms-ribbon {
          position: absolute;
          top: 18px;
          left: 18px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 999px;
          background: linear-gradient(180deg, #fbf2d6, var(--gold));
          color: #2a200d;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.6);
        }
        .ms-ribbon i { color: var(--gold-deep); }
        .ms-cap {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          padding: clamp(18px, 2.4vw, 26px);
        }
        .ms-cap strong {
          display: block;
          font-family: var(--display);
          font-size: clamp(22px, 2.6vw, 32px);
          font-weight: 700;
          text-transform: uppercase;
          color: var(--txt-hi);
        }
        .ms-cap span { font-size: 13px; color: var(--txt-mid); }
        .ms-intro { display: flex; flex-direction: column; justify-content: center; gap: 14px; }
        .ms-sub { margin: 0; font-size: clamp(16px, 1.9vw, 21px); font-weight: 600; color: var(--txt-hi); }
        .ms-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
        .ms-chips span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 15px;
          border-radius: 999px;
          background: var(--glass);
          border: 1px solid var(--line);
          font-size: 12.5px;
          font-weight: 600;
          color: var(--txt-mid);
        }
        .ms-chips i { color: #7fa8e8; }
        .pillars {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: clamp(40px, 5vw, 64px);
        }
        .pillar {
          position: relative;
          padding: clamp(24px, 2.8vw, 34px);
          border-radius: 22px;
          background: var(--glass);
          border: 1px solid var(--line);
          transition: transform 0.28s ease, border-color 0.28s ease;
        }
        .pillar:hover { transform: translateY(-5px); border-color: rgba(217, 184, 118, 0.4); }
        .pillar-ic {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 20px;
          color: #fff;
          background: linear-gradient(135deg, var(--navy), var(--pink));
          margin-bottom: 18px;
        }
        .pillar h4 { margin: 0 0 10px; font-size: 16.5px; font-weight: 800; line-height: 1.3; color: var(--txt-hi); }
        .pillar p { margin: 0; font-size: 14px; line-height: 1.7; color: var(--txt-mid); }
        .ms-closing {
          position: relative;
          margin: clamp(40px, 5vw, 60px) 0 0;
          padding: clamp(30px, 4vw, 48px) clamp(28px, 4vw, 52px);
          border-radius: 24px;
          background: linear-gradient(130deg, rgba(8, 58, 133, 0.16), rgba(242, 12, 143, 0.1));
          border: 1px solid var(--line);
          font-size: clamp(16px, 1.8vw, 21px);
          font-style: italic;
          line-height: 1.65;
          color: var(--txt-hi);
          max-width: 74ch;
        }
        .ms-closing i {
          position: absolute;
          top: -16px;
          left: 30px;
          font-size: 34px;
          color: var(--pink);
          background: var(--ink-0);
          padding: 0 10px;
          border-radius: 8px;
        }

        /* ═ FAQs ═ */
        .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
        .faq {
          border-radius: 18px;
          background: var(--glass);
          border: 1px solid var(--line);
          overflow: hidden;
          transition: border-color 0.3s ease, background 0.3s ease;
        }
        .faq.open { border-color: rgba(242, 12, 143, 0.35); background: rgba(242, 12, 143, 0.045); }
        .faq-q {
          width: 100%;
          appearance: none;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 22px;
          font-family: inherit;
          text-align: left;
          font-size: 15.5px;
          font-weight: 700;
          color: var(--txt-hi);
        }
        .faq-q:focus-visible { outline: 2px solid var(--pink); outline-offset: -2px; border-radius: 18px; }
        .faq-tog {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 13px;
          background: var(--glass-hover);
          border: 1px solid var(--line-strong);
          color: var(--txt-mid);
          transition: transform 0.35s ease, background 0.3s ease, color 0.3s ease;
        }
        .faq.open .faq-tog { transform: rotate(45deg); background: var(--pink); border-color: var(--pink); color: #fff; }
        .faq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s ease; }
        .faq.open .faq-a { grid-template-rows: 1fr; }
        .faq-a > p {
          overflow: hidden;
          min-height: 0;
          margin: 0;
          padding: 0 22px;
          font-size: 14px;
          line-height: 1.7;
          color: var(--txt-mid);
        }
        .faq.open .faq-a > p { padding-bottom: 22px; }

        /* ═ bottom CTA panels (partners / faq) ═ */
        .panel-cta {
          margin-top: clamp(44px, 5vw, 64px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          padding: clamp(26px, 3.4vw, 40px);
          border-radius: 22px;
          background: var(--glass);
          border: 1px solid var(--line);
        }
        .panel-cta strong { display: block; font-size: 18px; font-weight: 800; margin-bottom: 5px; color: var(--txt-hi); }
        .panel-cta p { margin: 0; font-size: 14px; color: var(--txt-mid); }

        /* ═ responsive ═ */
        @media (max-width: 1080px) {
          .stats { grid-template-columns: repeat(3, 1fr); }
          .why { grid-template-columns: 1fr 1fr; }
          .steps { grid-template-columns: 1fr; }
          .step-link { display: none; }
          .pillars { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .spotlight-in { grid-template-columns: 1fr; }
          .spot-visual { border-right: none; border-bottom: 1px solid var(--line); }
          .ms-hero { grid-template-columns: 1fr; }
          .ms-visual { aspect-ratio: 16 / 10; }
          .faq-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
          .why { grid-template-columns: 1fr; }
          .tabbar {
            width: 100%;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .tabbar::-webkit-scrollbar { display: none; }
          .tab { padding: 9px 14px; font-size: 12.5px; }
          .panel-cta { flex-direction: column; align-items: flex-start; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero::before,
          .cta::before,
          .hero-badge .dot,
          .marquee-track,
          .spot-logo-ring::before { animation: none !important; }
          .rv { opacity: 1; transform: none; transition: none; }
          .hf :global(.btn), .stat, .why-card, .step, .pillar, .faq-tog, .faq-a, .ms-visual img, .tab { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
