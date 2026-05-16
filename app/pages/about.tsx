"use client";

import React, { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import HalfEarth from "../components/HalfEarth";
import DotGrid from "../components/DotGrid";
import ElectricBorder from "../components/ElectricBorder";
import ContainerScroll from "../components/ContainerScroll";
import Lamp from "../components/Lamp";
import CornerLamp from "../components/CornerLamp";

// react-pageflip uses DOM APIs (window/document) at module load, so it must be
// loaded client-side only. next/dynamic with ssr:false skips the server resolve
// entirely, which sidesteps Turbopack's strict ESM resolver on the legacy
// page-flip CommonJS bundle.
const HTMLFlipBook = dynamic(() => import("react-pageflip"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: 380,
        height: 460,
        borderRadius: 12,
        background: 'linear-gradient(160deg, #052047 0%, #083A85 50%, #0F4FB6 100%)',
        boxShadow: '0 18px 38px -16px rgba(8,58,133,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        letterSpacing: 2,
      }}
    >
      Loading book…
    </div>
  ),
}) as unknown as React.ComponentType<React.PropsWithChildren<Record<string, unknown>>>;

// react-pageflip needs each child to forward a ref so the engine can measure pages.
type CoreValue = { title: string; icon: string; desc: string; color: string };
const BookCover = forwardRef<HTMLDivElement, { kind: 'front' | 'back' }>(
  function BookCover({ kind }, ref) {
    return (
      <div ref={ref} className="cv-pf-cover" data-density="hard">
        {kind === 'front' ? (
          <div className="cv-pf-cover-inner">
            <div className="cv-pf-cover-eyebrow">AMORIA CONNEKYT</div>
            <h2 className="cv-pf-cover-title">Our Core<br />Values</h2>
            <div className="cv-pf-cover-rule" />
            <p className="cv-pf-cover-sub">The principles that guide everything we build at Amoria Connekyt.</p>
            <div className="cv-pf-cover-hint"><span aria-hidden="true">↓</span> Scroll to turn the page</div>
          </div>
        ) : (
          <div className="cv-pf-cover-inner cv-pf-cover-back">
            <div className="cv-pf-cover-emblem">A·C</div>
            <p className="cv-pf-cover-back-tagline">The Smart Way to Capture Life</p>
          </div>
        )}
      </div>
    );
  }
);

const BookPage = forwardRef<HTMLDivElement, { num: string; value: CoreValue }>(
  function BookPage({ num, value }, ref) {
    return (
      <div ref={ref} className="cv-pf-page">
        <div className="cv-pf-page-inner">
          <div className="cv-pf-page-num">{num}</div>
          <h3 className="cv-pf-page-title">{value.title}</h3>
          <div className="cv-pf-page-rule" style={{ background: value.color }} />
          <p className="cv-pf-page-desc">{value.desc}</p>
          <div className="cv-pf-page-icon" style={{ color: value.color }}>
            <i className={`bi ${value.icon}`} />
          </div>
          <div className="cv-pf-page-foot">Amoria Connekyt · Core Value {num}</div>
        </div>
      </div>
    );
  }
);

// ── DEPRECATED: SplitHoverText (canvas particle simulation) is no longer rendered.
// The hero now uses Alex Brush plain text + CSS-only ambient effects, which removes the
// per-mousemove canvas redraw that was the heaviest CPU load on the about page hero.
// Function kept temporarily to avoid TS churn - safe to delete in a future cleanup pass.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SplitHoverText({ lines, style }: { lines: string[]; style: React.CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const positionsRef = useRef<{ x: number; y: number; ox: number; oy: number }[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !mouseRef.current.active) { if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height); return; }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    canvas.width = rect.width + 100;
    canvas.height = rect.height + 100;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pts = positionsRef.current.filter(p => {
      const dx = p.x - p.ox;
      const dy = p.y - p.oy;
      return Math.abs(dx) > 1 || Math.abs(dy) > 1;
    });

    // Draw connecting lines between displaced letters
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 200) {
          ctx.globalAlpha = (1 - d / 200) * 0.3;
          ctx.beginPath();
          ctx.moveTo(pts[i].x + 50, pts[i].y + 50);
          ctx.lineTo(pts[j].x + 50, pts[j].y + 50);
          ctx.stroke();
        }
      }
    }

    // Draw particles (dots) at displaced letter positions
    pts.forEach(p => {
      const dx = p.x - p.ox;
      const dy = p.y - p.oy;
      const force = Math.sqrt(dx * dx + dy * dy);
      const size = Math.min(force / 8, 4);

      ctx.globalAlpha = Math.min(force / 30, 0.8);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x + 50, p.y + 50, size, 0, Math.PI * 2);
      ctx.fill();

      // Scatter small dots around displaced letters
      for (let k = 0; k < 2; k++) {
        const sx = p.x + 50 + (Math.random() - 0.5) * force * 1.5;
        const sy = p.y + 50 + (Math.random() - 0.5) * force * 1.5;
        ctx.globalAlpha = Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.random() * 2.5 + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.globalAlpha = 1;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    mouseRef.current = { x: e.clientX, y: e.clientY, active: true };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      positionsRef.current = [];

      letterRefs.current.forEach(span => {
        if (!span) return;
        const rect = span.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - e.clientX;
        const dy = cy - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;

        const contRect = container.getBoundingClientRect();
        const ox = cx - contRect.left;
        const oy = cy - contRect.top;

        if (dist < maxDist) {
          const force = (1 - dist / maxDist) * 50;
          const angle = Math.atan2(dy, dx);
          const tx = Math.cos(angle) * force;
          const ty = Math.sin(angle) * force;
          span.style.transform = `translate(${tx}px, ${ty}px)`;
          span.style.opacity = `${0.4 + 0.6 * (dist / maxDist)}`;
          positionsRef.current.push({ x: ox + tx, y: oy + ty, ox, oy });
        } else {
          span.style.transform = 'translate(0, 0)';
          span.style.opacity = '1';
          positionsRef.current.push({ x: ox, y: oy, ox, oy });
        }
      });

      drawParticles();
    });
  }, [drawParticles]);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
    cancelAnimationFrame(rafRef.current);
    letterRefs.current.forEach(span => {
      if (!span) return;
      span.style.transform = 'translate(0, 0)';
      span.style.opacity = '1';
    });
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  let idx = 0;
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', cursor: 'default' }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: -50, left: -50, pointerEvents: 'none', zIndex: 1 }}
      />
      <h1 style={{ ...style, position: 'relative', zIndex: 2 }}>
        {lines.map((line, li) => (
          <span key={li}>
            {li > 0 && <br />}
            {line.split('').map((char) => {
              const i = idx++;
              return (
                <span
                  key={i}
                  ref={el => { letterRefs.current[i] = el; }}
                  style={{ display: 'inline-block', transition: 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1), opacity 0.25s ease', willChange: 'transform' }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </span>
        ))}
      </h1>
    </div>
  );
}

const About = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const heroTextRefs = useRef<(HTMLDivElement | null)[]>([]);
  const journeyRef = useRef<HTMLDivElement>(null);
  // (mvRef removed - Mission & Vision now live inside the Journey carousel)
  // Core Values flip book - section ref for pinning, book ref for driving flips
  const cvSectionRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  const [bookReady, setBookReady] = useState(false);
  const [bookSize, setBookSize] = useState<{ w: number; h: number; single: boolean }>({ w: 380, h: 460, single: false });
  // Journey carousel - 3 chapters + Mission + Vision = 5 slides (slides built after
  // journeyMilestones is declared further down to avoid a temporal-dead-zone error).
  const [activeSlide, setActiveSlide] = useState(0);

  // After the book lazily mounts, re-measure all ScrollTriggers so the pin-spacing
  // for the Core Values section reflects the actual book height (not the placeholder).
  useEffect(() => {
    if (!bookReady) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [bookReady]);

  // When viewport breakpoint changes, the book switches portrait/landscape and the
  // ScrollTrigger end value needs to recompute too.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [bookSize.single]);

  // Responsive book sizing - single-page mode on mobile, two-page spread on desktop.
  // Book uses its natural full height; the section's top padding + header gap are
  // tightened (see CSS below) to give the book maximum vertical real estate.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compute = () => {
      const vw = window.innerWidth;
      if (vw < 720) {
        // Mobile: single-page portrait
        const w = Math.min(vw - 40, 380);
        const h = Math.round(w * 1.35);
        setBookSize({ w, h, single: true });
      } else if (vw < 1100) {
        // Tablet: two-page spread
        setBookSize({ w: 380, h: 460, single: false });
      } else {
        // Desktop: large two-page spread
        setBookSize({ w: 460, h: 560, single: false });
      }
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  // (Smart Tools section renders statically - refs removed)
  const earthSectionRef = useRef<HTMLDivElement>(null);
  // Earth scroll progress as a ref - written by ScrollTrigger, read by Three.js useFrame.
  // Using a ref instead of state means scroll updates never trigger React re-renders,
  // so the WebGL globe stays at full 60fps during scroll.
  const earthProgressRef = useRef<number>(0);

  const journeyMilestones = [
    { year: 2025, title: 'The Birth of Our Vision:', highlight: "We're Turning Ideas Into Actions", paragraphs: ["Originally, this started as an idea, but it has started to blossom into something larger than that. People were noticing the obstacles and setbacks that creators in the industry had. They didn't have the right tools and platforms to promote themselves and their work properly.", 'Amoria Connekyt started as a vision to promote creators, but it also helps serve as a bridge to new tools and opportunities.'] },
    { year: 2026, title: 'Scaling Our Impact:', highlight: 'Building the Future Together', paragraphs: ['What began as a passion for supporting event creators, photographers, and storytellers has impacted us in numerous ways and heavily shaped the growth of our company. We listen to our customers and use their feedback to drive changes and developments.', "We've come a long way in our development, and looking to the future, we will continue to evolve with our customers. We're only just getting started and are looking to build even more with you."] },
    { year: 2027, title: 'Expanding Horizons:', highlight: 'Going Global, Staying Personal', paragraphs: ['With a strong foundation built on trust and innovation, we are expanding into new markets and empowering creators across continents. Our platform now supports multilingual experiences and localized payment solutions.', 'We remain committed to the personal touch that defines Amoria Connekyt - every feature we build starts with the creator in mind. The future is global, but the heart stays local.'] },
  ];
  const currentYear = new Date().getFullYear();

  // Combined slide deck data (chapters + mission + vision)
  const missionPoints = [
    'Simplify how clients find and hire verified photographers and videographers.',
    'Help creators build trusted brands with fair ratings, secure payments, and smart tools.',
    'Strengthen family and social bonds through shared memories that inspire joy and connection.',
  ];
  const visionPoints = [
    'Creative professionals thrive through fair digital economies.',
    'Clients access trusted talent anywhere, anytime.',
    'Memories become bridges that heal distance and celebrate humanity.',
  ];
  type Slide =
    | { kind: 'chapter'; index: number; year: number; title: string; highlight: string; paragraphs: string[]; tabLabel: string; tabSub: string }
    | { kind: 'mission' | 'vision'; title: string; emphasis: string; body: string; bullets: string[]; icon: string; tabLabel: string; tabSub: string };

  const slides: Slide[] = [
    ...journeyMilestones.map((m, idx): Slide => ({
      kind: 'chapter',
      index: idx,
      year: m.year,
      title: m.title,
      highlight: m.highlight,
      paragraphs: m.paragraphs,
      tabLabel: String(m.year).slice(2),
      tabSub: `'${String(m.year).slice(2)}`,
    })),
    {
      kind: 'mission',
      title: 'Our',
      emphasis: 'Mission',
      body: 'To empower creators and communities through technology that connects people, promotes emotional wellness, and transforms creative work into meaningful global opportunities.',
      bullets: missionPoints,
      icon: 'bi-bullseye',
      tabLabel: '◎',
      tabSub: 'Mission',
    },
    {
      kind: 'vision',
      title: 'Our',
      emphasis: 'Vision',
      body: "To become Africa's leading creative connection platform; a space where every memory matters, creativity meets opportunity, and technology fosters global emotional wellbeing.",
      bullets: visionPoints,
      icon: 'bi-globe2',
      tabLabel: '✦',
      tabSub: 'Vision',
    },
  ];
  const totalSlides = slides.length;

  const coreValues = [
    { title: 'Innovation', icon: 'bi-lightbulb', desc: 'Pioneering creative tools and smart solutions for the photography industry.', color: '#3b82f6' },
    { title: 'Trust', icon: 'bi-shield-check', desc: 'Building confidence through verified professionals and secure transactions.', color: '#10b981' },
    { title: 'Excellence', icon: 'bi-award', desc: 'Setting the highest standards in creative quality and client satisfaction.', color: '#f59e0b' },
    { title: 'Wellness', icon: 'bi-heart', desc: 'Supporting the well-being and growth of our creative community.', color: '#ec4899' },
    { title: 'Growth', icon: 'bi-graph-up-arrow', desc: 'Empowering photographers to expand their reach and build lasting careers.', color: '#8b5cf6' },
  ];

  // ─── LENIS smooth scroll - eliminates janky wheel/touch scroll on Windows + iOS.
  // The about page has multiple pinned ScrollTriggers (Hero, Core Values, Journey,
  // Half Earth) and ref-based animations (book.flip(), earthProgressRef). Lenis
  // smooths the scroll INPUT itself; ScrollTrigger and our refs receive an already-
  // smoothed scroll position, so all per-scroll DOM updates feel natural without
  // any React re-renders.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // honor user preference - let native scroll run

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      wheelMultiplier: 1,
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.08,
    });

    // Hand Lenis updates to ScrollTrigger so all scroll-driven animations
    // (pin/scrub timelines + our manual ref-based onUpdate handlers) read the
    // same smoothed scroll value Lenis is currently emitting.
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker so we have a single rAF loop site-wide.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Pause Lenis whenever a scroll-lock is active (mobile menu, modal,
    // etc. set body.style.overflow = 'hidden'). With syncTouch on, Lenis
    // transforms the page on touch - that transform turns the body into
    // a containing block for position:fixed children, which makes the
    // mobile drawer drift away with the page on touch-scroll. Pausing
    // Lenis while the lock is active restores the normal fixed-anchoring.
    const syncLockState = () => {
      if (document.body.style.overflow === 'hidden') lenis.stop();
      else lenis.start();
    };
    syncLockState();
    const lockObserver = new MutationObserver(syncLockState);
    lockObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => {
      lockObserver.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  // GSAP reveals + smart tools peel - smoothed scrubs, force3D layers, anticipatePin
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wait one frame so layout settles instead of the old fixed setTimeout(300)
    const raf = requestAnimationFrame(() => {
      const ctx = gsap.context(() => {

        // Shared smooth defaults applied to every pinned timeline below
        const scrubVal = 1.1;            // longer scrub = smoother trail
        const sharedTriggerOpts = {
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          preventOverlaps: true,
        } as const;
        const sharedDefaults = { ease: 'sine.inOut', force3D: true } as const;

        // ── HERO: Window starts fullscreen, shrinks on scroll revealing cabin + text ──
        const hero = heroRef.current;
        const win = windowRef.current;
        const isMobileHero = window.innerWidth <= 768;
        if (hero && win) {
          const overlayText = heroTextRefs.current[4];
          const cabinTexts = [heroTextRefs.current[0], heroTextRefs.current[1], heroTextRefs.current[2], heroTextRefs.current[3]].filter(Boolean) as HTMLDivElement[];

          gsap.set(win, { scale: 1 });
          const winRect = win.getBoundingClientRect();
          const scaleX = window.innerWidth / winRect.width;
          const scaleY = window.innerHeight / winRect.height;
          const fillScale = Math.max(scaleX, scaleY) * 1.2;

          // Promote the window to its own GPU layer for the entire scroll life - avoids
          // repeated layer creation/destruction during scale, which was the biggest jank source.
          gsap.set(win, { scale: fillScale, force3D: true, willChange: 'transform' });
          gsap.set(hero, { visibility: 'visible' });

          // On mobile we only animate opacity (cabin texts use translateX(-50%) for centering,
          // so adding GSAP y-translate would conflict). On desktop we keep the y rise for polish.
          if (isMobileHero) {
            gsap.set(cabinTexts, { opacity: 0, force3D: true });
          } else {
            gsap.set(cabinTexts, { opacity: 0, y: 24, force3D: true, willChange: 'transform, opacity' });
          }
          if (overlayText) gsap.set(overlayText, { opacity: 1, force3D: true });

          const heroTl = gsap.timeline({
            defaults: sharedDefaults,
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: '+=200%',
              // Longer scrub trail = smoother decel; the window scale is heavy compositing,
              // so a 1.5 trail buys the browser time to ease between frames.
              scrub: 1.5,
              pin: true,
              pinSpacing: true,
              ...sharedTriggerOpts,
            },
          });

          if (overlayText) {
            heroTl.to(overlayText, { opacity: 0, y: -24, duration: 0.28 }, 0);
          }
          heroTl.to(win, { scale: 1, duration: 1, ease: 'power2.out' }, 0);
          if (isMobileHero) {
            heroTl.to(cabinTexts, { opacity: 1, duration: 0.5, stagger: 0.08 }, 0.42);
          } else {
            heroTl.to(cabinTexts, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.42);
          }
          heroTl.to({}, { duration: 0.3 });
        }

        // ── CORE VALUES: Pin section + drive react-pageflip flips on scroll ──
        const cvSection = cvSectionRef.current;
        if (cvSection) {
          // Total scroll-driven spreads:
          //   landscape (two-page) = 4 spreads:  [cover] → [innov+trust] → [excel+well] → [growth+back]
          //   portrait  (one-page) = 7 spreads:  [cover] → [innov] → [trust] → [excel] → [well] → [growth] → [back]
          // The target page index for `flip(N)` differs:
          //   landscape: 0, 1, 3, 5  (left page of each spread)
          //   portrait : 0, 1, 2, 3, 4, 5, 6
          const cvLastBucket = { current: -1 };

          ScrollTrigger.create({
            trigger: cvSection,
            // Engage the pin when the section's center reaches the viewport's center -
            // that way the book is fully visible (and visually centered) before page-flips begin.
            start: 'center center',
            // ~80vh of scroll per spread feels natural - enough to register intent without dragging
            end: () => `+=${(bookSize.single ? 7 : 4) * 80}%`,
            pin: true,
            pinSpacing: true,
            scrub: false, // discrete flips, not scrubbed
            ...sharedTriggerOpts,
            onUpdate: (self) => {
              const portrait = bookSize.single;
              const totalBuckets = portrait ? 7 : 4;
              const bucket = Math.min(totalBuckets - 1, Math.floor(self.progress * totalBuckets));
              if (bucket === cvLastBucket.current) return;
              cvLastBucket.current = bucket;

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pf = bookRef.current?.pageFlip?.() as any;
              if (!pf || typeof pf.flip !== 'function') return;

              const targetPage = portrait
                ? bucket
                : bucket === 0 ? 0 : 2 * bucket - 1; // 0, 1, 3, 5
              try {
                pf.flip(targetPage, 'top');
              } catch {
                // book mid-init or transitioning - safe to ignore
              }
            },
          });
        }

        // (Journey scroll-pin removed - the section now uses framer-motion's
        // ContainerScroll for the 3D card-rotation effect, which handles its own
        // scroll-driven animation. Chapter switching is click-driven via year dots.)

        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.from(el, {
            y: 50, opacity: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
          });
        });

        // (Mission & Vision merged into the Journey carousel - no standalone scroll-pin needed.)

        gsap.utils.toArray<HTMLElement>('.reveal-stagger').forEach((container) => {
          gsap.from(container.children, {
            y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out',
            scrollTrigger: { trigger: container, start: 'top 85%', toggleActions: 'play none none none' },
          });
        });

        // (Smart Tools peel block removed - its refs were never bound to JSX, so it was a
        // silent no-op. Section now renders statically, which removes one pinned trigger
        // and tightens overall scroll smoothness.)

        // ── HALF EARTH: Scroll-driven globe rotation above footer ──
        // Writes scroll progress directly into a ref. Three.js useFrame reads the ref
        // at 60fps and lerps to the target with frame-rate-independent smoothing -
        // ZERO React re-renders during scroll. Dropping `scrub` removes the GSAP
        // tween latency that was layered on top of the WebGL lerp; the WebGL side
        // already smooths perfectly.
        const earthSection = earthSectionRef.current;
        if (earthSection) {
          const isMobileView = window.innerWidth <= 480;
          const isTabletView = window.innerWidth <= 768;
          const pinDuration = isMobileView ? '+=100%' : isTabletView ? '+=200%' : '+=500%';

          ScrollTrigger.create({
            trigger: earthSection,
            start: 'top top',
            end: pinDuration,
            scrub: false,
            pin: !isMobileView,
            pinSpacing: !isMobileView,
            ...sharedTriggerOpts,
            onUpdate: (self) => {
              earthProgressRef.current = self.progress;
            },
          });
        }

        ScrollTrigger.refresh();
      });
      return () => ctx.revert();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    // Outermost wrapper bg deliberately neutral so it can't flash dark at viewport
    // edges during GSAP pin/unpin transitions. The Hero, Half-Earth, and Footer all
    // set their own dark backgrounds internally, so this neutral base never shows
    // behind dark sections - only behind the light middle sections (where it's invisible).
    <div style={{ background: '#f8fafc', overflow: 'hidden' }}>
      <style>{`
        /* ══════════════════════════════════════════════════
           PURE CSS 3D PARALLAX - "Looking Through a Window"
           Based on Keith Clark's technique.
           Container has perspective; layers use translateZ.
           Browser compositor handles parallax at 60fps.
           ══════════════════════════════════════════════════ */

        .par-group {
          position: relative;
          z-index: 1;
        }
        .par-base {
          position: relative;
        }
        /* Decorative bg layer behind content */
        .par-deep, .par-mid {
          position: absolute;
          inset: 0;
          z-index: -1;
        }

        /* ── Animations ── */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .marquee-track { display: flex; gap: 24px; width: max-content; animation: marquee 30s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        .cv-card {
          flex-shrink: 0; width: 260px; padding: 28px 22px; border-radius: 16px;
          background: #fff; border: 1px solid #e2e8f0;
          transition: transform 0.2s, box-shadow 0.2s; cursor: default; text-align: center;
        }
        .cv-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }

        .about-section { padding: clamp(50px, 8vw, 90px) clamp(16px, 4vw, 60px); position: relative; }

        /* ── Premium eyebrow pill (matches landing page) ── */
        .ab-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 6px 14px;
          background: rgba(8,58,133,0.06);
          border: 1px solid rgba(8,58,133,0.18);
          border-radius: 999px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: #083A85;
          backdrop-filter: blur(6px);
        }
        .ab-eyebrow-dark {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.18);
          color: #E2E8F0;
        }
        .ab-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: linear-gradient(135deg, #0F4FB6, #3B82F6);
          box-shadow: 0 0 6px rgba(15,79,182,0.6);
        }
        .ab-eyebrow-spark { color: #3B82F6; font-size: 10px; }

        /* ── Section accent line (subtle gradient rule between sections) ── */
        .ab-section-divider {
          height: 1px; width: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(8,58,133,0.18) 38%, rgba(8,58,133,0.45) 50%, rgba(8,58,133,0.18) 62%, transparent 100%);
        }

        /* ── DotGrid wrapper used on light sections ── */
        .ab-dotgrid {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,1), rgba(0,0,0,0.35) 70%, rgba(0,0,0,0) 100%);
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,1), rgba(0,0,0,0.35) 70%, rgba(0,0,0,0) 100%);
          opacity: 0.7;
        }

        /* ── Smart Tools dashboard - live pulse keyframe ── */
        @keyframes smartLivePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.85); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="smartLivePulse"] { animation: none !important; }
        }

        /* Lenis owns smooth scrolling site-wide. Disable native smooth-behavior so
           anchor jumps don't fight Lenis's interpolated scroll. */
        html { scroll-behavior: auto; }
        html.lenis, html.lenis body { height: auto; }
        .lenis.lenis-smooth { scroll-behavior: auto !important; }
        .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
        .lenis.lenis-stopped { overflow: clip; }

        /* ══════════════════════════════════════════════════
           MOBILE RESPONSIVE FIXES - about page
           ══════════════════════════════════════════════════ */

        /* - Who We Serve - corner lamps + cards on phones - */
        @media (max-width: 720px) {
          /* Smaller CornerLamp so it doesn't dominate phone-width corners */
          .wws-section .corner-lamp,
          .wws-section [aria-hidden="true"][style*="rotate(-45deg)"],
          .wws-section [aria-hidden="true"][style*="rotate(45deg)"] {
            transform-origin: 50% 22% !important;
          }
          /* Pull the section's top padding tighter on mobile */
          .wws-section { padding-top: 72px !important; padding-bottom: 48px !important; }
          /* Header gap shrink */
          .wws-header { margin-bottom: 32px !important; gap: 12px !important; }
          .wws-title { font-size: clamp(26px, 7vw, 36px) !important; line-height: 1.15 !important; }
          .wws-lede { font-size: 13.5px !important; line-height: 1.6 !important; }

          /* Memory-Keepers + other ElectricBorder cards become tighter on mobile */
          .wws-eb { width: 100%; }
          .wws-card { padding: 0 !important; }
          .wws-card-art { aspect-ratio: 16/8 !important; }
          .wws-card-body { padding: 18px !important; gap: 10px !important; }
          .wws-card-title { font-size: 19px !important; }
          .wws-card-desc { font-size: 12.5px !important; }

          /* Decorative aperture / orb scale down */
          .wws-aperture { width: 60px !important; height: 60px !important; bottom: 24px !important; right: 24px !important; }
          .wws-orb { width: 360px !important; height: 200px !important; }
        }

        /* - Journey carousel - fits a phone - */
        @media (max-width: 720px) {
          /* Stack the chapter aside above the main column */
          .journey-cs-card {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
            padding: 14px 16px !important;
          }
          .journey-card-aside,
          .journey-mv-aside {
            padding-right: 0 !important;
            padding-bottom: 10px;
            border-right: none !important;
            border-bottom: 1px dashed rgba(8,58,133,0.18);
            flex-direction: row !important;
            align-items: center !important;
            gap: 12px !important;
            flex-wrap: wrap !important;
          }
          .journey-card-roman { font-size: 44px !important; margin: 0 !important; }
          .journey-card-year { font-size: 18px !important; }
          .journey-card-chapter,
          .journey-mv-kind { font-size: 9px !important; flex-basis: 100%; letter-spacing: 0.3em !important; }
          .journey-card-divider { display: none !important; }
          .journey-card-status { margin-left: auto; font-size: 9.5px !important; }
          .journey-mv-icon {
            width: 56px !important; height: 56px !important;
            font-size: 26px !important;
            margin-bottom: 0 !important;
          }
          .journey-mv-tag { font-size: 32px !important; line-height: 0.95 !important; }
          .journey-card-eyebrow { font-size: 9px !important; margin-bottom: 8px !important; letter-spacing: 0.24em !important; }
          .journey-card-title { font-size: 18px !important; line-height: 1.2 !important; margin-bottom: 12px !important; }
          .journey-card-paragraphs { gap: 8px !important; }
          .journey-card-lede,
          .journey-card-body { font-size: 12.5px !important; line-height: 1.6 !important; }
          .journey-mv-bullets li { font-size: 12.5px !important; padding-left: 22px !important; }
          .journey-card-foot { margin-top: 12px !important; }
          .journey-card-foot-label { font-size: 8.5px !important; letter-spacing: 0.18em !important; }

          /* Carousel tabs row - wrap if needed, smaller dots */
          .journey-cs-tabs { gap: 12px !important; padding: 4px 44px 12px !important; flex-wrap: wrap; }
          .journey-cs-tab { width: 36px !important; height: 36px !important; }
          .journey-cs-tab-num { font-size: 12px !important; }
          .journey-cs-tab-label { display: none !important; }
          .journey-cs-arrow { width: 34px !important; height: 34px !important; font-size: 14px !important; }
          .journey-cs-arrow--prev { left: -8px !important; }
          .journey-cs-arrow--next { right: -8px !important; }

          /* ContainerScroll outer card at smaller breakpoints */
          .cs-card { height: clamp(32rem, 88vh, 42rem) !important; padding: 6px !important; border-radius: 20px !important; border-width: 2px !important; }
          .cs-card-inner { border-radius: 14px !important; padding: 8px !important; }
        }

        /* - Smart Tools - lamp + dashboard mockup on phones - */
        @media (max-width: 720px) {
          /* Tighter section padding so lamp + content fit */
          .smart-tools-section {
            padding: 130px 14px 50px !important;
          }
          /* Smart Tools heading sizing */
          .smart-tools-section h2 {
            font-size: clamp(24px, 6.4vw, 32px) !important;
            line-height: 1.15 !important;
          }
          .smart-tools-section .ab-eyebrow { font-size: 10px !important; }
          /* Dashboard mockup - make sidebar hide (already done) and grid stack */
          .smart-dashboard {
            border-radius: 14px !important;
            box-shadow: 0 18px 38px -16px rgba(0,0,0,0.45), 0 6px 14px -6px rgba(168,85,247,0.30) !important;
          }
          .smart-dashboard .smart-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .smart-dashboard h2 { font-size: 20px !important; }
          .smart-dashboard h3 { font-size: 14px !important; }
          .smart-dashboard svg[viewBox="0 0 200 70"] { height: 44px !important; }
          /* Tighten stats card spacing */
          .smart-dashboard [style*="grid-template-columns: 1.4fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }

        /* - Half Earth section: tighten the stats + content for mobile - */
        @media (max-width: 720px) {
          .earth-stats { gap: 12px !important; }
          .earth-stat { min-width: 64px !important; }
          .earth-stat-num { font-size: 26px !important; }
          .earth-stat-label { font-size: 9.5px !important; letter-spacing: 0.22em !important; }
          .earth-live-pill { font-size: 9.5px !important; padding: 5px 11px !important; letter-spacing: 0.14em !important; }
          .earth-aurora { display: none !important; }
          .earth-orbital { display: none !important; }
        }

        /* - Mock CTA section - mobile copy fit - */
        @media (max-width: 720px) {
          /* This section's container has its own clamps but make sure inner copy
             reflows cleanly at < 480px viewports. */
        }
        @media (max-width: 480px) {
          /* Even tighter on small phones */
          .wws-section { padding-top: 64px !important; padding-bottom: 40px !important; }
          .wws-card-art { aspect-ratio: 16/9 !important; }
          .wws-card-body { padding: 16px !important; }
          .smart-tools-section { padding: 120px 12px 40px !important; }
          .smart-dashboard { border-radius: 12px !important; }
          .journey-cs-card { padding: 12px !important; }
          .journey-card-roman { font-size: 38px !important; }
          .journey-card-year { font-size: 16px !important; }
          .journey-mv-icon { width: 48px !important; height: 48px !important; font-size: 22px !important; }
          .journey-mv-tag { font-size: 28px !important; }
          .journey-cs-tab { width: 32px !important; height: 32px !important; }
          .journey-cs-tab-num { font-size: 11px !important; }
          .earth-stats { gap: 8px !important; }
          .earth-stat-num { font-size: 22px !important; }
          .earth-stat-label { font-size: 9px !important; }
        }

        /* - Reduce GSAP-animated decorations that don't add value on phones - */
        @media (max-width: 720px) {
          .ab-dotgrid { display: none !important; }
        }

        /* ══════════════════════════════════════════════════
           WHO WE SERVE - premium persona showcase
           ══════════════════════════════════════════════════ */
        .wws-section {
          position: relative; overflow: hidden;
          /* Deep purple-tinted dark - provides high contrast for the corner lamp
             cones to read dramatically. Distinct from the navy Hero (different hue
             family, purple instead of blue). White persona cards inside pop as
             spotlit objects against this backdrop. */
          background:
            radial-gradient(60% 50% at 50% 100%, rgba(139,92,246,0.10), transparent 65%),
            linear-gradient(180deg, #13091F 0%, #1A0E2E 55%, #13091F 100%);
          padding: clamp(96px, 12vw, 160px) clamp(20px, 4vw, 60px) clamp(60px, 8vw, 100px);
        }
        .wws-orb {
          /* Soft purple ambient bloom in the lower-mid area - fills the dark space
             between the corner lamp cones with a faint glow */
          position: absolute; top: 38%; left: 50%; transform: translateX(-50%);
          width: 720px; height: 380px; border-radius: 50%;
          background: radial-gradient(closest-side, rgba(168,85,247,0.18), rgba(192,132,252,0.08) 50%, transparent 100%);
          filter: blur(40px); pointer-events: none; z-index: 0;
        }
        .wws-aperture {
          position: absolute; bottom: 40px; right: 40px;
          width: 100px; height: 100px; pointer-events: none; z-index: 0;
          animation: wwsRotate 60s linear infinite;
        }
        @keyframes wwsRotate { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .wws-aperture { animation: none; } }

        .wws-inner { max-width: 1200px; margin: 0 auto; position: relative; z-index: 2; }

        .wws-header { text-align: center; max-width: 760px; margin: 0 auto clamp(48px, 6vw, 70px); display: flex; flex-direction: column; align-items: center; gap: 18px; position: relative; z-index: 3; }
        .wws-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: clamp(30px, 4.5vw, 54px); font-weight: 400; line-height: 1.1;
          color: #F5EBFF; letter-spacing: -0.01em; margin: 0;
          text-shadow: 0 4px 30px rgba(168,85,247,0.35);
        }
        .wws-title-em {
          /* Italic emphasis uses the platform's secondary palette so it matches the lamps */
          font-style: italic;
          background: linear-gradient(90deg, #C084FC 0%, #EC4899 55%, #F472B6 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          padding-right: 0.12em;
        }
        .wws-lede {
          font-size: clamp(14px, 1.2vw, 16px); color: rgba(245,235,255,0.7); line-height: 1.7;
          margin: 0; max-width: 580px;
        }

        .wws-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(20px, 2.5vw, 32px);
          align-items: stretch;
        }
        /* ElectricBorder wrapper acts as the grid item now */
        .wws-eb { display: flex; flex-direction: column; }
        .wws-eb > .eb-content { flex: 1; display: flex; }
        .wws-eb > .eb-content > .wws-card { width: 100%; }
        /* Visual rhythm - middle card sits a touch higher to break the flat baseline */
        .wws-eb--mid { transform: translateY(-18px); transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .wws-eb--mid:hover { transform: translateY(-26px); }

        .wws-card {
          position: relative;
          display: flex; flex-direction: column;
          background: #ffffff;
          border-radius: 22px;
          overflow: hidden;
          text-decoration: none; color: inherit;
          box-shadow: 0 14px 30px -18px rgba(8,58,133,0.18), 0 4px 10px -4px rgba(15,23,42,0.05);
          transition: box-shadow 0.35s ease;
        }
        .wws-card:hover {
          box-shadow: 0 28px 50px -20px rgba(8,58,133,0.32), 0 8px 18px -6px rgba(15,23,42,0.08);
        }

        /* Hero art zone */
        .wws-card-art {
          position: relative;
          aspect-ratio: 16 / 11;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .wws-card-art svg { width: 78%; height: 78%; transition: transform 0.5s ease; }
        .wws-card:hover .wws-card-art svg { transform: scale(1.06); }
        .wws-art--photog { background: radial-gradient(120% 100% at 50% 0%, #EEF2FA 0%, #F8FAFC 70%, #F8FAFC 100%); }
        .wws-art--org    { background: radial-gradient(120% 100% at 50% 0%, #E6EEF9 0%, #F4F8FC 70%, #F4F8FC 100%); }
        .wws-art--fam    { background: radial-gradient(120% 100% at 50% 0%, #F1F5FA 0%, #FAFCFE 70%, #FAFCFE 100%); }
        .wws-card-art::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(8,58,133,0.06) 1px, transparent 1px);
          background-size: 14px 14px; opacity: 0.55; pointer-events: none;
        }
        .wws-card-num {
          position: absolute; top: 14px; right: 16px;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-style: italic; font-size: 28px; font-weight: 400;
          color: rgba(8,58,133,0.22); line-height: 1;
        }

        /* Body */
        .wws-card-body { padding: clamp(22px, 2.4vw, 32px); display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .wws-card-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          color: #3B82F6;
        }
        .wws-card-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: clamp(22px, 2.3vw, 28px); font-weight: 400; line-height: 1.2;
          margin: 0; color: #0f172a; letter-spacing: -0.005em;
        }
        .wws-card-title em {
          font-style: italic;
          background: linear-gradient(90deg, #083A85 0%, #3B82F6 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          padding-right: 0.1em;
        }
        .wws-card-desc {
          font-size: clamp(13px, 1.05vw, 14.5px); color: #475569; line-height: 1.65;
          margin: 0;
        }
        .wws-card-bullets {
          list-style: none; padding: 0; margin: 6px 0 0;
          display: flex; flex-direction: column; gap: 8px;
        }
        .wws-card-bullets li {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #334155; line-height: 1.5;
        }
        .wws-card-bullets i { color: #083A85; font-size: 14px; flex-shrink: 0; }
        .wws-card-cta {
          margin-top: auto; padding-top: 14px;
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 700; color: #083A85;
          letter-spacing: 0.01em;
          transition: gap 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .wws-card:hover .wws-card-cta { gap: 12px; }

        /* Memory Keepers card - secondary purple-pink palette */
        .wws-eb--memory .wws-card-eyebrow { color: #B83AB6; }
        .wws-eb--memory .wws-card-title em {
          background: linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .wws-eb--memory .wws-card-bullets i { color: #B83AB6; }
        .wws-eb--memory .wws-card-cta { color: #B83AB6; }
        .wws-eb--memory .wws-card-num { color: rgba(184,58,182,0.22); }
        .wws-eb--memory .wws-art--fam {
          background: radial-gradient(120% 100% at 50% 0%, #FBE6F2 0%, #FCEFE3 70%, #FAFCFE 100%);
        }
        .wws-eb--memory .wws-card-art::before {
          background-image: radial-gradient(circle, rgba(184,58,182,0.06) 1px, transparent 1px);
        }

        /* Footer rule + secondary CTA */
        .wws-footer {
          margin-top: clamp(48px, 6vw, 70px);
          text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 18px;
        }
        .wws-footer-rule {
          width: min(100%, 720px); height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.18) 30%, rgba(192,132,252,0.55) 50%, rgba(168,85,247,0.18) 70%, transparent 100%);
        }
        .wws-footer-line { font-size: 14px; color: rgba(245,235,255,0.7); margin: 0; }
        .wws-footer-link {
          color: #C084FC; font-weight: 700; text-decoration: none;
          transition: color 0.2s ease;
          background: linear-gradient(90deg, #C084FC, #EC4899);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .wws-footer-link:hover { filter: brightness(1.15); }

        /* Responsive */
        @media (max-width: 1024px) {
          .wws-grid { grid-template-columns: repeat(2, 1fr); }
          .wws-eb--mid { transform: translateY(0) !important; }
          .wws-eb--mid:hover { transform: translateY(0) !important; }
        }
        @media (max-width: 720px) {
          .wws-section { padding: 60px 18px; }
          .wws-grid { grid-template-columns: 1fr; gap: 28px; }
          .wws-eb--mid { transform: translateY(0) !important; }
          .wws-eb--mid:hover { transform: translateY(0) !important; }
          .wws-card-art { aspect-ratio: 16 / 9; }
          .wws-aperture, .wws-orb { display: none; }
        }

        /* ── Responsive ── */
        /* Ensure navbar stays above GSAP pinned sections */
        .about-nav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
        }
        .about-nav-wrapper nav {
          position: relative !important;
          top: auto !important;
        }

        /* ══════════════════════════════════════════════════
           Core Values - react-pageflip realistic 3D book
           ══════════════════════════════════════════════════ */
        .cv-pf-section { overflow: hidden; }
        .cv-pf-stage-glow {
          position: absolute; left: 50%; top: 55%; transform: translate(-50%, -50%);
          width: min(80vw, 900px); height: min(60vw, 600px);
          background: radial-gradient(60% 50% at 50% 50%, rgba(8,58,133,0.10), rgba(8,58,133,0.04) 55%, transparent 80%);
          z-index: 1; pointer-events: none; filter: blur(4px);
        }
        .cv-pf-book-wrap {
          position: relative;
          padding-bottom: 14px;
          /* Browser-skip offscreen rendering - page-flip's canvas RAF keeps drawing,
             this offloads it whenever the section is past the viewport, which removes
             the perceived lag during the handoff to the journey section. */
          contain: layout paint;
        }
        .cv-pf-floor {
          position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%);
          width: 80%; height: 28px; pointer-events: none; opacity: 0.55;
          background: radial-gradient(50% 50% at 50% 50%, rgba(8,58,133,0.45), rgba(8,58,133,0.18) 55%, transparent 80%);
          filter: blur(8px);
        }
        .cv-pf-book { font-family: 'Pragati Narrow', system-ui, sans-serif; }
        .cv-pf-book .stf__parent { perspective: 2400px; }

        /* Cover (hard) - brand-blue gradient with embossed border */
        .cv-pf-cover {
          width: 100%; height: 100%;
          background: linear-gradient(160deg, #052047 0%, #083A85 45%, #0F4FB6 100%);
          color: #ffffff; border-radius: 6px 14px 14px 6px;
          box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.10), inset -2px 0 8px rgba(0,0,0,0.25), 4px 4px 20px rgba(0,0,0,0.28);
          overflow: hidden;
        }
        .cv-pf-cover-inner {
          position: absolute; inset: 18px;
          border: 1.5px solid rgba(255,255,255,0.18); border-radius: 4px 10px 10px 4px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: clamp(20px, 4vw, 36px); text-align: center;
        }
        .cv-pf-cover-eyebrow {
          font-size: 10px; letter-spacing: 4px; font-weight: 700;
          color: rgba(255,255,255,0.55);
          margin-bottom: 22px; text-transform: uppercase;
        }
        .cv-pf-cover-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: clamp(28px, 4vw, 44px); font-weight: 400; font-style: italic;
          line-height: 1.1; margin: 0 0 18px; color: #ffffff;
          letter-spacing: -0.01em;
        }
        .cv-pf-cover-rule {
          width: 56px; height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, rgba(255,255,255,0.85), rgba(255,255,255,0.25));
          margin-bottom: 18px;
        }
        .cv-pf-cover-sub {
          font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.65;
          margin: 0 0 26px; max-width: 280px;
        }
        .cv-pf-cover-hint {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; color: rgba(255,255,255,0.55);
          padding: 6px 14px; border: 1px solid rgba(255,255,255,0.18);
          border-radius: 999px; backdrop-filter: blur(6px);
        }
        .cv-pf-cover-back { background: linear-gradient(160deg, #041a3a 0%, #062d5e 100%); }
        .cv-pf-cover-emblem {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 64px; font-weight: 700; font-style: italic;
          color: rgba(255,255,255,0.85); line-height: 1; margin-bottom: 14px;
          background: linear-gradient(135deg, #ffffff, rgba(255,255,255,0.4));
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .cv-pf-cover-back-tagline {
          font-size: 12px; color: rgba(255,255,255,0.55); letter-spacing: 1px; margin: 0;
          font-style: italic;
        }

        /* Inner page - printed paper texture + text */
        .cv-pf-page {
          width: 100%; height: 100%;
          background: #fefefe;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(8,58,133,0.025) 0%, transparent 35%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          color: #0f172a;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.04);
        }
        .cv-pf-page-inner {
          position: absolute; inset: 0;
          padding: clamp(28px, 4vw, 44px) clamp(28px, 4vw, 40px);
          display: flex; flex-direction: column;
        }
        /* Faint "binding gutter" shadow on the spine side */
        .cv-pf-page-inner::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 36px;
          background: linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0.02) 60%, transparent);
          pointer-events: none;
        }
        /* When the page is on the right side of the spread, mirror the gutter to the right edge */
        .stf__item.--right .cv-pf-page-inner::before { left: auto; right: 0; transform: scaleX(-1); }

        .cv-pf-page-num {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 12px; font-weight: 600; color: #94A3B8;
          letter-spacing: 4px; margin-bottom: 18px;
        }
        .cv-pf-page-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: clamp(24px, 3.2vw, 34px); font-weight: 400; font-style: italic;
          color: #083A85; margin: 0 0 14px; line-height: 1.15; letter-spacing: -0.01em;
        }
        .cv-pf-page-rule { width: 44px; height: 3px; border-radius: 3px; opacity: 0.85; margin-bottom: 22px; }
        .cv-pf-page-desc {
          font-size: clamp(13px, 1.05vw, 15px); color: #475569; line-height: 1.75;
          margin: 0; max-width: 360px;
        }
        .cv-pf-page-icon {
          margin-top: auto;
          font-size: clamp(34px, 3.5vw, 44px);
          opacity: 0.85;
        }
        .cv-pf-page-foot {
          margin-top: 14px;
          font-size: 10px; letter-spacing: 2px; color: #94A3B8;
          text-transform: uppercase;
        }

        @media (max-width: 720px) {
          .cv-pf-page-inner { padding: 22px 22px; }
          .cv-pf-page-title { font-size: 24px; }
          .cv-pf-page-desc { font-size: 14px; line-height: 1.65; }
          .cv-pf-cover-title { font-size: 26px; }
          .cv-pf-cover-sub { font-size: 12px; }
        }

        /* ══════════════════════════════════════════════════
           JOURNEY - 3D ContainerScroll wrapper
           ══════════════════════════════════════════════════ */
        .journey-section-cs {
          /* Slate-blue gradient - distinct from the white book-flip section above */
          background:
            radial-gradient(80% 50% at 50% 0%, rgba(8,58,133,0.08), transparent 70%),
            linear-gradient(180deg, #DBE6F2 0%, #C7D5E7 50%, #D4DFEC 100%);
          position: relative; overflow: hidden;
        }
        /* Subtle paper-grain texture overlay */
        .journey-section-cs::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            radial-gradient(circle at 25% 30%, rgba(8,58,133,0.04) 0%, transparent 30%),
            radial-gradient(circle at 75% 70%, rgba(15,79,182,0.04) 0%, transparent 32%);
          pointer-events: none; z-index: 0;
        }

        /* ContainerScroll outer frame - brand-blue gradient */
        .cs-section { z-index: 1; }
        .cs-perspective { z-index: 1; }
        .cs-header { max-width: 64rem; margin: 0 auto; text-align: center; position: relative; z-index: 2; }
        .cs-card {
          max-width: 70rem;
          margin: -3rem auto 0;
          height: clamp(36rem, 88vh, 50rem);
          width: 100%;
          padding: clamp(8px, 1vw, 24px);
          border: 4px solid rgba(8,58,133,0.35);
          background: linear-gradient(160deg, #052047 0%, #083A85 50%, #0F4FB6 100%);
          border-radius: 30px;
          position: relative; z-index: 1;
        }
        .cs-card::before {
          /* Inner glow ring - gives the brand-blue frame depth */
          content: ''; position: absolute; inset: 6px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
          pointer-events: none;
        }
        .cs-card-inner {
          height: 100%; width: 100%;
          overflow: hidden;
          border-radius: 22px;
          background: #ffffff;
          background-image:
            radial-gradient(circle at 18% 22%, rgba(8,58,133,0.025) 0%, transparent 38%),
            linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          padding: clamp(16px, 2vw, 28px);
        }
        /* Subtle paper-grain texture overlay */
        .journey-section::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            radial-gradient(circle at 25% 30%, rgba(8,58,133,0.04) 0%, transparent 30%),
            radial-gradient(circle at 75% 70%, rgba(15,79,182,0.04) 0%, transparent 32%);
          pointer-events: none; z-index: 0;
        }
        .journey-orb {
          position: absolute; top: 8%; right: -200px;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(closest-side, rgba(8,58,133,0.14), rgba(15,79,182,0.05) 60%, transparent 100%);
          filter: blur(14px); pointer-events: none; z-index: 0;
          will-change: transform; /* keep on its own layer, no repaint */
        }
        .journey-fleuron {
          position: absolute; bottom: 7%; left: 5%;
          font-size: 80px; color: rgba(8,58,133,0.10);
          font-family: 'Georgia', serif;
          pointer-events: none; z-index: 0;
          animation: journeyFleuron 24s ease-in-out infinite;
          will-change: transform, opacity;
        }
        @keyframes journeyFleuron {
          0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.55; }
          50% { transform: rotate(180deg) scale(1.1); opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) { .journey-fleuron { animation: none; } }

        .journey-header {
          text-align: center; margin: 0 auto clamp(14px, 2vw, 22px);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          position: relative; z-index: 2; max-width: 880px;
        }
        .journey-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: clamp(28px, 4vw, 56px); font-weight: 400;
          line-height: 1.15; margin: 0; color: #0f172a; letter-spacing: -0.01em;
        }
        .journey-title-em {
          font-style: italic;
          background: linear-gradient(90deg, #083A85 0%, #3B82F6 55%, #0F4FB6 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          padding-right: 0.12em;
        }
        .journey-subtitle {
          font-size: clamp(13px, 1.1vw, 15px); color: #475569;
          margin: 6px 0 0; line-height: 1.6; max-width: 520px;
        }

        /* In-card content layout */
        .journey-cs-content {
          position: relative;
          height: 100%; width: 100%;
          display: flex; flex-direction: column;
          gap: clamp(14px, 2vw, 22px);
        }

        /* Edge-anchored prev / next arrows */
        .journey-cs-arrow {
          appearance: none; padding: 0; cursor: pointer;
          position: absolute; top: 50%;
          width: 48px; height: 48px; border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(8,58,133,0.18);
          color: #083A85;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 20px; line-height: 1;
          z-index: 5;
          box-shadow: 0 12px 24px -10px rgba(8,58,133,0.35),
                      0 2px 6px -2px rgba(15,23,42,0.08);
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      border-color 0.25s ease, background 0.25s ease,
                      box-shadow 0.3s ease, color 0.25s ease;
        }
        .journey-cs-arrow--prev { left: -22px; transform: translateY(-50%); }
        .journey-cs-arrow--next { right: -22px; transform: translateY(-50%); }
        .journey-cs-arrow:hover {
          background: linear-gradient(135deg, #083A85, #0F4FB6);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 18px 30px -10px rgba(8,58,133,0.55),
                      0 4px 10px -2px rgba(15,23,42,0.12);
        }
        .journey-cs-arrow--prev:hover { transform: translateY(-50%) translateX(-2px); }
        .journey-cs-arrow--next:hover { transform: translateY(-50%) translateX(2px); }
        .journey-cs-arrow:active { filter: brightness(0.95); }
        .journey-cs-arrow:focus-visible {
          outline: 2px solid #3B82F6; outline-offset: 3px;
        }

        /* Dot navigator - just the dots now */
        .journey-cs-tabs {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          gap: clamp(20px, 3.5vw, 44px);
          padding: 4px clamp(36px, 6vw, 64px) 14px;
        }
        .journey-cs-progress {
          position: absolute; bottom: 0; left: 5%; right: 5%; height: 2px;
          background: rgba(8,58,133,0.08); border-radius: 2px;
          overflow: hidden;
        }
        .journey-cs-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #083A85, #3B82F6, #0F4FB6);
          border-radius: 2px; box-shadow: 0 0 8px rgba(8,58,133,0.4);
          transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .journey-cs-tab {
          appearance: none; background: #ffffff; border: 2px solid #e2e8f0;
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          font-family: 'Georgia', serif; color: #94a3b8;
          cursor: pointer; padding: 0; line-height: 1;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                      border-color 0.3s ease, color 0.3s ease,
                      background 0.3s ease, box-shadow 0.4s ease;
          position: relative; z-index: 1;
        }
        .journey-cs-tab-num { font-size: 14px; font-weight: 600; }
        .journey-cs-tab--mission .journey-cs-tab-num,
        .journey-cs-tab--vision .journey-cs-tab-num { font-size: 18px; }
        .journey-cs-tab-label { font-size: 8px; font-weight: 700; letter-spacing: 0.18em; opacity: 0; margin-top: 1px; transition: opacity 0.3s ease; text-transform: uppercase; }
        .journey-cs-tab:hover { border-color: rgba(8,58,133,0.45); color: #083A85; transform: translateY(-2px); }
        .journey-cs-tab.active {
          border-color: #083A85; color: #083A85; background: #fff;
          transform: scale(1.18);
          box-shadow: 0 0 0 6px rgba(8,58,133,0.10), 0 8px 18px -8px rgba(8,58,133,0.45);
        }
        .journey-cs-tab.active .journey-cs-tab-label { opacity: 0.55; }
        .journey-cs-tab.past { background: #083A85; color: #fff; border-color: #083A85; }

        /* Slide content (chapter or mission/vision) */
        .journey-cs-card {
          flex: 1;
          display: grid;
          grid-template-columns: 0.7fr 1.6fr;
          gap: clamp(20px, 3vw, 44px);
          padding: clamp(14px, 2vw, 28px) clamp(8px, 1.4vw, 22px);
          animation: jcsFade 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes jcsFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mission / Vision aside column - replaces Roman numeral with a big icon */
        .journey-mv-aside {
          position: relative;
          display: flex; flex-direction: column;
          justify-content: center; align-items: flex-start;
          padding-right: clamp(24px, 3vw, 36px);
          border-right: 1px dashed rgba(8,58,133,0.18);
        }
        .journey-mv-icon {
          width: clamp(72px, 8vw, 104px); height: clamp(72px, 8vw, 104px);
          border-radius: 24px;
          background: linear-gradient(160deg, #083A85 0%, #0F4FB6 50%, #3B82F6 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-size: clamp(32px, 3.6vw, 46px);
          margin-bottom: 14px;
          box-shadow: 0 12px 24px -10px rgba(8,58,133,0.45),
                      inset 0 1px 0 rgba(255,255,255,0.15);
        }
        /* Vision uses the platform's secondary purple-pink gradient - visually
           distinguishes it from the brand-blue Mission slide. */
        .journey-cs-card--vision .journey-mv-icon {
          background: linear-gradient(160deg, #8B5CF6 0%, #B83AB6 50%, #EC4899 100%);
          box-shadow: 0 12px 24px -10px rgba(139,92,246,0.45),
                      inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .journey-cs-card--vision .journey-mv-aside {
          border-right-color: rgba(139,92,246,0.25);
        }
        .journey-mv-kind {
          font-size: 10px; font-weight: 700; letter-spacing: 0.4em;
          text-transform: uppercase; color: #94a3b8;
          margin-bottom: 6px;
        }
        .journey-mv-tag {
          font-family: 'Alex Brush', cursive;
          font-size: clamp(40px, 5vw, 64px);
          line-height: 0.95;
          background: linear-gradient(135deg, #083A85, #3B82F6, #0F4FB6);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          padding-right: 0.1em;
        }
        .journey-cs-card--vision .journey-mv-tag {
          background: linear-gradient(135deg, #8B5CF6, #B83AB6, #EC4899);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        /* Vision title's italic emphasis word also uses the secondary gradient */
        .journey-cs-card--vision .journey-card-title-em {
          background: linear-gradient(90deg, #8B5CF6 0%, #B83AB6 55%, #EC4899 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .journey-cs-card--vision .journey-card-eyebrow { color: #B83AB6; }
        .journey-cs-card--vision .journey-mv-bullets li i { color: #8B5CF6; }
        /* Vision tab marker in the carousel navigator picks up the secondary tint when active */
        .journey-cs-tab--vision.active {
          border-color: #8B5CF6; color: #8B5CF6;
          box-shadow: 0 0 0 6px rgba(139,92,246,0.10), 0 8px 18px -8px rgba(139,92,246,0.45);
        }

        /* Mission / Vision bullet list */
        .journey-mv-bullets {
          list-style: none; padding: 0; margin: 16px 0 0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .journey-mv-bullets li {
          position: relative;
          padding-left: 28px;
          font-size: clamp(13px, 1.05vw, 14.5px);
          color: #475569; line-height: 1.65;
        }
        .journey-mv-bullets li i {
          position: absolute; left: 0; top: 2px;
          color: #083A85; font-size: 16px;
        }

        /* (Old absolute-stacked timeline + agenda removed - replaced by .journey-cs-tabs
            and .journey-cs-card inside the ContainerScroll rotating frame.) */

        /* Left aside column */
        .journey-card-aside {
          position: relative;
          display: flex; flex-direction: column;
          justify-content: center; align-items: flex-start;
          padding-right: clamp(24px, 3vw, 36px);
          border-right: 1px dashed rgba(8,58,133,0.18);
        }
        .journey-card-chapter {
          font-size: 10px; font-weight: 700; letter-spacing: 0.4em;
          text-transform: uppercase; color: #94a3b8;
        }
        .journey-card-roman {
          font-family: 'Alex Brush', cursive;
          font-size: clamp(64px, 8vw, 104px);
          font-weight: 400; line-height: 0.9;
          margin: 6px 0 4px;
          background: linear-gradient(135deg, #083A85, #3B82F6, #0F4FB6);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          padding-right: 0.1em;
        }
        .journey-card-year {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-style: italic; font-size: clamp(28px, 3vw, 40px);
          font-weight: 400; line-height: 1; color: #0f172a;
          letter-spacing: -0.005em;
        }
        .journey-card-divider {
          display: flex; align-items: center; gap: 10px;
          width: 100%; margin: 18px 0 14px;
          color: rgba(8,58,133,0.45);
        }
        .journey-card-divider::before, .journey-card-divider::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(8,58,133,0.25), transparent);
        }
        .journey-card-divider-mark { font-size: 12px; }
        .journey-card-status {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: #64748b;
        }
        .journey-card-status.is-now { color: #083A85; }
        .journey-card-pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.7);
          animation: journeyPulse 1.6s ease-in-out infinite;
        }
        @keyframes journeyPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @media (prefers-reduced-motion: reduce) { .journey-card-pulse { animation: none; } }

        /* Right narrative column */
        .journey-card-main {
          display: flex; flex-direction: column; justify-content: center;
        }
        .journey-card-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 0.32em;
          text-transform: uppercase; color: #3B82F6; margin-bottom: 14px;
        }
        .journey-card-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: clamp(22px, 2.6vw, 32px); font-weight: 400;
          line-height: 1.2; margin: 0 0 18px;
          color: #0f172a; letter-spacing: -0.005em;
        }
        .journey-card-title-em {
          font-style: italic;
          background: linear-gradient(90deg, #083A85 0%, #3B82F6 60%, #0F4FB6 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          padding-right: 0.1em;
        }
        .journey-card-paragraphs { display: flex; flex-direction: column; gap: 12px; }
        .journey-card-lede {
          font-size: clamp(14px, 1.2vw, 16px);
          color: #334155; line-height: 1.75; margin: 0;
          font-weight: 500;
        }
        .journey-card-body {
          font-size: clamp(13.5px, 1.1vw, 15px);
          color: #64748b; line-height: 1.75; margin: 0;
        }
        .journey-card-foot {
          display: flex; align-items: center; gap: 12px;
          margin-top: 22px;
        }
        .journey-card-foot-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(8,58,133,0.25), transparent);
        }
        .journey-card-foot-label {
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.28em;
          text-transform: uppercase; color: #94a3b8;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .journey-cs-card {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .journey-card-aside {
            padding-right: 0 !important;
            border-right: none !important;
            border-bottom: 1px dashed rgba(8,58,133,0.18);
            padding-bottom: 14px;
            flex-direction: row;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
          }
          .journey-card-roman { font-size: 56px !important; margin: 0 !important; }
          .journey-card-year { font-size: 22px !important; }
          .journey-card-divider { display: none !important; }
          .journey-card-chapter { font-size: 9px !important; flex-basis: 100%; }
          .journey-card-status { margin-left: auto; }
        }
        @media (max-width: 768px) {
          .tm-row { grid-template-columns: 1fr !important; gap: 8px !important; }
          .smart-sidebar { display: none !important; }
          .smart-stats-grid { grid-template-columns: 1fr !important; }
          .journey-fleuron, .journey-orb { display: none !important; }
          .cs-card { height: clamp(28rem, 75vh, 36rem) !important; border-radius: 22px !important; border-width: 3px !important; }
          .cs-card-inner { border-radius: 16px !important; padding: 12px !important; }
          .journey-cs-tabs { gap: clamp(16px, 5vw, 28px); padding: 4px clamp(48px, 12vw, 64px) 12px; }
          .journey-cs-tab { width: 42px; height: 42px; }
          .journey-cs-tab-num { font-size: 13px; }
          .journey-cs-arrow { width: 40px; height: 40px; font-size: 18px; }
          .journey-cs-arrow--prev { left: -14px; }
          .journey-cs-arrow--next { right: -14px; }
        }
        @media (max-width: 480px) {
          .tm-row { gap: 6px !important; }
          .smart-stats-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .cs-card { height: clamp(30rem, 80vh, 38rem) !important; }
          .journey-cs-card { padding: 8px !important; }
          .journey-card-roman { font-size: 46px !important; }
          .journey-card-year { font-size: 20px !important; }
          .journey-card-title { font-size: 20px !important; }
          .journey-card-lede, .journey-card-body { font-size: 13px !important; }
          .journey-cs-arrow { width: 36px; height: 36px; font-size: 16px; }
          .journey-cs-arrow--prev { left: -10px; }
          .journey-cs-arrow--next { right: -10px; }
          .journey-cs-tabs { padding: 4px clamp(40px, 10vw, 56px) 12px; gap: 14px; }
          .journey-cs-tab { width: 38px; height: 38px; }
        }

        /* (Mission & Vision standalone styles removed - content now lives inside the Journey carousel.) */

        /* ══════════════════════════════════════════════════
           HERO - Alex Brush typography + ambient effects
           ══════════════════════════════════════════════════ */
        /* Cabin wall text: hidden until GSAP animates them in */
        .hero-text-item { opacity: 0; transform: translateY(24px); }
        .hero-overlay-text { opacity: 1; }

        /* Overlay (visible at fullscreen window) */
        .hero-overlay-eyebrow {
          font-size: clamp(10px, 1vw, 12px); font-weight: 700;
          letter-spacing: 0.5em; text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          padding: 6px 16px;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 999px;
          backdrop-filter: blur(8px);
        }
        .hero-overlay-script {
          font-family: 'Alex Brush', cursive;
          font-size: clamp(56px, 9.5vw, 132px);
          font-weight: 400;
          line-height: 1.05;
          color: #ffffff;
          text-align: center;
          margin: 0;
          letter-spacing: -0.005em;
          text-shadow: 0 4px 24px rgba(0,0,0,0.45), 0 1px 2px rgba(255,255,255,0.25);
          background: linear-gradient(180deg, #ffffff 0%, #DDE9FF 60%, #93C5FD 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          /* keep the strong drop shadow even with clipped fill */
          filter: drop-shadow(0 2px 24px rgba(0,0,0,0.4));
        }
        .hero-overlay-rule {
          display: block; width: 64px; height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0));
        }
        .hero-overlay-sub {
          font-size: clamp(10px, 1vw, 13px); font-weight: 500;
          letter-spacing: 0.3em; text-transform: uppercase;
          color: rgba(255,255,255,0.55);
        }

        /* Top-left brand block (Alex Brush) */
        .hero-tl {
          position: absolute;
          top: clamp(60px, 10vh, 110px);
          left: clamp(24px, 5vw, 80px);
          max-width: clamp(220px, 28vw, 400px);
        }
        .hero-brand-script {
          font-family: 'Alex Brush', cursive;
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 400; line-height: 1; color: #ffffff;
          text-shadow: 0 2px 18px rgba(0,0,0,0.4);
          letter-spacing: -0.01em;
        }
        .hero-brand-sub {
          margin-top: 10px;
          font-size: clamp(10px, 1vw, 12px); font-weight: 600;
          letter-spacing: 0.32em; text-transform: uppercase;
          color: rgba(255,255,255,0.55);
        }

        /* Top-right "About Us" eyebrow */
        .hero-tr {
          position: absolute;
          top: clamp(60px, 10vh, 110px);
          right: clamp(24px, 5vw, 80px);
          display: flex; align-items: center; gap: 14px;
        }
        .hero-eyebrow {
          font-size: clamp(10px, 1.1vw, 13px); font-weight: 700;
          letter-spacing: 0.4em; text-transform: uppercase;
          color: rgba(255,255,255,0.7);
        }
        .hero-eyebrow-rule {
          width: 36px; height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0));
        }

        /* Bottom-left "Cabin Brief" manifesto block */
        .hero-bl {
          position: absolute;
          bottom: clamp(50px, 8vh, 100px);
          left: clamp(24px, 5vw, 80px);
          max-width: clamp(220px, 24vw, 340px);
        }
        .hero-brief {
          position: relative;
          padding-left: 20px;
        }
        .hero-brief::before {
          content: '';
          position: absolute;
          left: 0; top: 4px; bottom: 4px;
          width: 2px; border-radius: 2px;
          background: linear-gradient(180deg, #93C5FD 0%, #3B82F6 45%, rgba(15,79,182,0) 100%);
          box-shadow: 0 0 10px rgba(147,197,253,0.45);
        }
        .hero-brief-label {
          display: block;
          font-size: clamp(9px, 0.85vw, 11px);
          font-weight: 700; letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          margin-bottom: 12px;
        }
        .hero-desc {
          font-size: clamp(12px, 1.1vw, 14.5px);
          font-weight: 400; line-height: 1.7;
          color: rgba(255,255,255,0.78);
          margin: 0 0 14px;
        }
        .hero-desc em {
          /* "connecting" keyword - Alex Brush gradient highlight */
          font-family: 'Alex Brush', cursive;
          font-style: normal; font-weight: 400;
          font-size: 1.55em; line-height: 0.85;
          background: linear-gradient(90deg, #ffffff 0%, #93C5FD 65%, #3B82F6 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          padding: 0 0.05em;
          display: inline-block;
          vertical-align: -0.06em;
          letter-spacing: -0.005em;
        }
        .hero-brief-sig {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Alex Brush', cursive;
          font-size: clamp(18px, 1.6vw, 22px);
          color: rgba(255,255,255,0.55);
          letter-spacing: 0;
        }

        /* Bottom-right destination card (replaces overlapping slogan) */
        .hero-br {
          position: absolute;
          bottom: clamp(50px, 8vh, 100px);
          right: clamp(24px, 5vw, 80px);
        }
        .hero-card {
          padding: 16px 22px;
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          width: clamp(240px, 24vw, 320px);
          color: #fff;
          box-shadow: 0 14px 30px -16px rgba(0,0,0,0.45);
        }
        .hero-card-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 14px;
        }
        .hero-card-tag {
          font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(255,255,255,0.7);
        }
        .hero-card-status {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.15em;
          text-transform: uppercase; color: #93C5FD;
        }
        .hero-card-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #34D399;
          box-shadow: 0 0 8px rgba(52,211,153,0.7);
          animation: heroPulseDot 1.6s ease-in-out infinite;
        }
        @keyframes heroPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.8); }
        }
        .hero-card-route {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .hero-card-port { display: flex; flex-direction: column; gap: 2px; }
        .hero-card-port--right { text-align: right; align-items: flex-end; }
        .hero-card-code {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-style: italic; font-size: 28px; font-weight: 400;
          color: #ffffff; line-height: 1; letter-spacing: -0.01em;
        }
        .hero-card-city {
          font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(255,255,255,0.55);
        }
        .hero-card-line {
          color: #93C5FD; font-size: 16px;
          display: inline-flex; align-items: center; justify-content: center;
          padding: 4px 8px;
        }
        .hero-card-line i { transform: rotate(0deg); }
        .hero-card-meta {
          font-size: 10px; font-weight: 500; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(255,255,255,0.45);
          padding-top: 10px;
          border-top: 1px dashed rgba(255,255,255,0.12);
        }

        /* Ambient stars drifting in the cabin */
        .hero-star {
          position: absolute; width: 3px; height: 3px; border-radius: 50%;
          background: #ffffff; opacity: 0; pointer-events: none; z-index: 5;
          box-shadow: 0 0 6px rgba(255,255,255,0.7);
        }
        .hero-star--1 { top: 18%; left: 12%; animation: heroStar 9s ease-in-out 0s infinite; }
        .hero-star--2 { top: 28%; left: 86%; animation: heroStar 11s ease-in-out -2s infinite; }
        .hero-star--3 { top: 70%; left: 8%;  animation: heroStar 8s ease-in-out -5s infinite; width: 2px; height: 2px; }
        .hero-star--4 { top: 72%; left: 92%; animation: heroStar 12s ease-in-out -7s infinite; }
        .hero-star--5 { top: 42%; left: 50%; animation: heroStar 10s ease-in-out -3s infinite; width: 2px; height: 2px; }
        @keyframes heroStar {
          0%, 100% { opacity: 0; transform: translate(0,0) scale(0.7); }
          40%, 60% { opacity: 0.9; transform: translate(6px,-4px) scale(1); }
        }

        /* Slow horizontal light streak passing across the cabin */
        .hero-light-streak {
          position: absolute;
          top: 35%; left: -30%;
          width: 60%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(147,197,253,0.45), rgba(255,255,255,0.65), rgba(147,197,253,0.45), transparent);
          filter: blur(1px); opacity: 0.65; pointer-events: none; z-index: 4;
          animation: heroStreak 14s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes heroStreak {
          0% { transform: translate(0, 0) rotate(-4deg); opacity: 0; }
          15% { opacity: 0.65; }
          50% { transform: translate(140vw, 30vh) rotate(-4deg); opacity: 0.4; }
          80%, 100% { transform: translate(180vw, 60vh) rotate(-4deg); opacity: 0; }
        }

        /* Subtle pulsing halo around the airplane window */
        .airplane-window::before {
          content: ''; position: absolute;
          inset: -22px;
          border-radius: 45% 45% 42% 42% / 50% 50% 46% 46%;
          background: radial-gradient(closest-side, rgba(147,197,253,0.18), transparent 70%);
          filter: blur(12px);
          z-index: -1;
          animation: heroWinHalo 6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes heroWinHalo {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-star, .hero-light-streak, .hero-card-dot { animation: none !important; opacity: 0.6; }
          .airplane-window::before { animation: none !important; }
        }

        /* Other-section mobile rules (kept) */
        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr !important; }
          .tm-row { grid-template-columns: auto 1fr !important; }
          .tm-row p { grid-column: 1 / -1 !important; }
          .flip-layout { flex-direction: column !important; text-align: center; }
          .journey-grid { grid-template-columns: 1fr !important; }
          .mv-grid { grid-template-columns: 1fr !important; }
          .smart-sidebar { display: none !important; }
        }

        /* ══════════════════════════════════════════════════
           HERO MOBILE - absolute layout retained so the GSAP
           fullscreen-window-shrink animation works the same as desktop.
           Cabin texts arrange around the small centered window:
             TL: brand (Alex Brush)            TR: ABOUT US chip
                          [ window ]
             BL: Cabin Brief (centered below window)
             BR: Destination card (centered, lower)
           ══════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          /* Section keeps the desktop centering - the window must be in the viewport
             center for the fullscreen-scale effect to read correctly. */
          .hero-section {
            height: 100vh !important;
            min-height: 600px !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            gap: 0 !important;
          }

          /* Smaller window so there's room above (TL/TR) and below (BL/BR) */
          .airplane-window {
            width: min(58vw, 230px) !important;
            height: min(72vw, 280px) !important;
          }

          /* Each cabin item stays absolute but mobile-tuned */
          .hero-text-item {
            position: absolute !important;
          }

          /* Top-left: small brand */
          .hero-tl {
            top: clamp(80px, 11vh, 100px) !important;
            left: 16px !important;
            right: auto !important;
            max-width: clamp(140px, 42vw, 200px) !important;
            text-align: left !important;
          }
          .hero-brand-script {
            font-size: clamp(34px, 9.5vw, 48px) !important;
            line-height: 0.95 !important;
            text-align: left !important;
          }
          .hero-brand-sub {
            margin-top: 6px !important;
            font-size: 8px !important;
            letter-spacing: 0.28em !important;
            text-align: left !important;
          }

          /* Top-right: ABOUT US chip */
          .hero-tr {
            top: clamp(86px, 12vh, 106px) !important;
            right: 16px !important;
            display: inline-flex !important;
          }
          .hero-eyebrow-rule { display: none !important; }
          .hero-eyebrow {
            font-size: 9.5px !important;
            padding: 6px 11px;
            border: 1px solid rgba(255,255,255,0.18);
            border-radius: 999px;
            backdrop-filter: blur(6px);
          }

          /* Bottom-left: Cabin Brief - centered below the window with horizontal accent */
          .hero-bl {
            bottom: clamp(110px, 17vh, 150px) !important;
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            width: calc(100% - 32px) !important;
            max-width: 320px !important;
            text-align: center !important;
          }
          .hero-brief {
            padding-left: 0 !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            text-align: center !important;
          }
          .hero-brief::before {
            position: relative !important;
            display: block !important;
            top: auto !important; bottom: auto !important; left: auto !important;
            width: 44px !important; height: 2px !important;
            margin: 0 auto 10px !important;
            background: linear-gradient(90deg, rgba(147,197,253,0), #93C5FD 50%, rgba(147,197,253,0)) !important;
          }
          .hero-brief-label { font-size: 9px !important; letter-spacing: 0.36em !important; margin-bottom: 8px !important; }
          .hero-desc {
            font-size: 12.5px !important;
            line-height: 1.6 !important;
            margin: 0 0 8px !important;
          }
          .hero-desc em { font-size: 1.35em !important; }
          .hero-brief-sig {
            font-size: 16px !important;
            justify-content: center !important;
          }

          /* Bottom-right: Destination card - centered, full-width-ish under the brief */
          .hero-br {
            bottom: 22px !important;
            right: auto !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: calc(100% - 32px) !important;
            max-width: 300px !important;
          }
          .hero-card {
            width: 100% !important;
            padding: 12px 16px !important;
          }
          .hero-card-row { margin-bottom: 10px !important; }
          .hero-card-code { font-size: 22px !important; }
          .hero-card-route { gap: 8px !important; }
          .hero-card-meta { padding-top: 8px !important; }

          /* Reduce ambient effects on mobile to keep it clean */
          .hero-star { display: none !important; }
          .hero-light-streak { display: none !important; }
          .airplane-window::before {
            inset: -14px !important;
            opacity: 0.55;
          }
        }

        @media (max-width: 480px) {
          .airplane-window {
            width: min(60vw, 220px) !important;
            height: min(74vw, 270px) !important;
          }
          .hero-brand-script { font-size: clamp(30px, 9vw, 40px) !important; }
          .hero-bl { bottom: clamp(100px, 15vh, 132px) !important; }
          .hero-br { bottom: 18px !important; }
          .hero-card-code { font-size: 20px !important; }
          .hero-card-tag, .hero-card-status, .hero-card-city, .hero-card-meta { font-size: 8.5px !important; }
        }
      `}</style>

      <div className="about-nav-wrapper">
        <Navbar />
      </div>

      <div>

        {/* ━━━ HERO: AIRPLANE WINDOW ━━━ */}
        <div ref={heroRef} className="par-group hero-section" style={{ height: '100vh', minHeight: 650, background: '#041e4f', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', visibility: 'hidden' }}>

          {/* Cabin wall - brand blue gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, #0a4a8a 0%, #083A85 30%, #052a5e 70%, #031b3d 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4px 4px', opacity: 0.5 }} />

          {/* ── AIRPLANE WINDOW ── */}
          <div ref={windowRef} className="airplane-window" style={{ position: 'relative', width: 'clamp(240px, 30vw, 400px)', height: 'clamp(290px, 38vw, 500px)', flexShrink: 0, willChange: 'transform' }}>

            {/* Outer bezel - the thick plastic surround */}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '45% 45% 42% 42% / 50% 50% 46% 46%',
              background: 'linear-gradient(160deg, #e8e8ec 0%, #c8c8ce 20%, #a0a0a8 50%, #b8b8c0 80%, #d8d8de 100%)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.15)',
            }} />

            {/* Inner bezel ring */}
            <div style={{
              position: 'absolute', inset: 'clamp(14px, 2vw, 22px)',
              borderRadius: '45% 45% 42% 42% / 50% 50% 46% 46%',
              background: 'linear-gradient(160deg, #d0d0d6 0%, #b0b0b8 30%, #909098 60%, #b0b0b8 100%)',
              boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.25), inset 0 -1px 3px rgba(255,255,255,0.2)',
            }} />

            {/* Glass opening - the actual window you look through */}
            <div className="window-glass" style={{
              position: 'absolute', inset: 'clamp(28px, 4vw, 44px)',
              borderRadius: '44% 44% 40% 40% / 48% 48% 44% 44%',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 30px 8px rgba(0,0,0,0.3)',
            }}>
              {/* Scene visible through the window - video fills the glass directly */}
              <video autoPlay muted loop playsInline poster="/camm.png"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 38%', // bias framing slightly higher so the camera body sits centered
                  filter: 'brightness(0.4) saturate(1.15) contrast(1.05)',
                  pointerEvents: 'none',
                }}
              >
                <source src="/photographero.mp4" type="video/mp4" />
              </video>

              {/* Brand-blue tint pass - keeps the video reading as ambient cabin view */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(8,40,100,0.35) 0%, rgba(5,15,40,0.55) 100%)',
                pointerEvents: 'none',
              }} />

              {/* Top + bottom vignette - fades any awkward video framing into shadow */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)',
                pointerEvents: 'none',
              }} />

              {/* Glass reflection - diagonal light streak */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 30%, transparent 50%, rgba(255,255,255,0.02) 80%, rgba(255,255,255,0.06) 100%)',
                pointerEvents: 'none',
              }} />

              {/* Secondary reflection arc - top-left highlight */}
              <div style={{
                position: 'absolute', top: '5%', left: '10%', width: '35%', height: '25%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)',
                transform: 'rotate(-15deg)',
                pointerEvents: 'none',
              }} />
            </div>
            {/* (Inner shade groove removed - it visually clipped the bottom of the glass) */}
          </div>

          {/* ── FULLSCREEN OVERLAY TEXT - Alex Brush cursive, visible at fullscreen window ── */}
          <div ref={el => { heroTextRefs.current[4] = el; }} className="hero-overlay-text" style={{
            position: 'absolute', inset: 0, zIndex: 30,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 18, padding: 24,
          }}>
            <span className="hero-overlay-eyebrow">Amoria · Connekyt</span>
            <h1 className="hero-overlay-script">The Smart Way to Capture Life</h1>
            <span className="hero-overlay-rule" aria-hidden="true" />
            <span className="hero-overlay-sub">Scroll to step inside the cabin</span>
          </div>

          {/* ── TEXT ON THE CABIN WALL ── */}

          {/* Top-left: brand name (Alex Brush + small tagline) */}
          <div ref={el => { heroTextRefs.current[0] = el; }} className="hero-text-item hero-tl">
            <div className="hero-brand-script">Amoria<br />Connekyt</div>
            <div className="hero-brand-sub">Born in Kigali · Built worldwide</div>
          </div>

          {/* Top-right: page label */}
          <div ref={el => { heroTextRefs.current[1] = el; }} className="hero-text-item hero-tr">
            <span className="hero-eyebrow">About Us</span>
            <span className="hero-eyebrow-rule" />
          </div>

          {/* Bottom-left: Cabin Brief - manifesto block with vertical accent stripe */}
          <div ref={el => { heroTextRefs.current[2] = el; }} className="hero-text-item hero-bl">
            <div className="hero-brief">
              <span className="hero-brief-label">Cabin Brief</span>
              <p className="hero-desc">
                A digital ecosystem <em>connecting</em> verified photographers and creative professionals with clients worldwide.
              </p>
              <span className="hero-brief-sig">- Crafted in Kigali</span>
            </div>
          </div>

          {/* Bottom-right: destination card ornament - replaces the duplicate slogan */}
          <div ref={el => { heroTextRefs.current[3] = el; }} className="hero-text-item hero-br">
            <div className="hero-card">
              <div className="hero-card-row">
                <span className="hero-card-tag">Flight ·  AC2026</span>
                <span className="hero-card-status"><span className="hero-card-dot" /> On schedule</span>
              </div>
              <div className="hero-card-route">
                <div className="hero-card-port">
                  <span className="hero-card-code">KGL</span>
                  <span className="hero-card-city">Kigali</span>
                </div>
                <span className="hero-card-line">
                  <i className="bi bi-airplane-engines-fill" />
                </span>
                <div className="hero-card-port hero-card-port--right">
                  <span className="hero-card-code">WLD</span>
                  <span className="hero-card-city">Worldwide</span>
                </div>
              </div>
              <div className="hero-card-meta">Cruising · 38,000 ft · Memory altitude</div>
            </div>
          </div>

          {/* Ambient effects - drifting stars + light streak (decorative, GPU-only) */}
          <span className="hero-star hero-star--1" aria-hidden="true" />
          <span className="hero-star hero-star--2" aria-hidden="true" />
          <span className="hero-star hero-star--3" aria-hidden="true" />
          <span className="hero-star hero-star--4" aria-hidden="true" />
          <span className="hero-star hero-star--5" aria-hidden="true" />
          <span className="hero-light-streak" aria-hidden="true" />
        </div>

        {/* ━━━ WHO WE SERVE - premium persona showcase ━━━ */}
        <div className="par-group">
          <div className="par-base wws-section">
            {/* Two corner lamps - pink-purple cones beaming inward over the dark bg */}
            <CornerLamp
              position="left"
              bgColor="#13091F"
              filamentColor="#EC4899"
              beamColor="#A855F7"
              glowColor="#C084FC"
              zIndex={1}
            />
            <CornerLamp
              position="right"
              bgColor="#13091F"
              filamentColor="#EC4899"
              beamColor="#A855F7"
              glowColor="#C084FC"
              zIndex={1}
            />

            {/* Interactive DotGrid - purple palette for dark bg */}
            <div className="ab-dotgrid" aria-hidden="true">
              <DotGrid
                dotSize={2}
                gap={15}
                baseColor="#3D2459"
                activeColor="#EC4899"
                proximity={120}
                shockRadius={180}
                shockStrength={4}
                resistance={750}
                returnDuration={1.4}
              />
            </div>

            {/* Decorative purple orb (mid) and aperture mark (bottom-right) */}
            <span className="wws-orb" aria-hidden="true" />
            <span className="wws-aperture" aria-hidden="true">
              <svg viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="34" stroke="#C084FC" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
                <circle cx="40" cy="40" r="22" stroke="#C084FC" strokeWidth="1" opacity="0.4" />
                <circle cx="40" cy="40" r="3" fill="#EC4899" opacity="0.85" />
              </svg>
            </span>

            <div className="wws-inner">

              {/* Section header */}
              <header className="reveal wws-header">
                <div className="ab-eyebrow ab-eyebrow-dark">
                  <span className="ab-eyebrow-dot" />
                  <span>Who We Serve</span>
                  <span className="ab-eyebrow-spark">✦</span>
                </div>
                <h2 className="wws-title">
                  Built for the <span className="wws-title-em">people behind every memory</span>
                </h2>
                <p className="wws-lede">
                  Three audiences, one platform. Whether you create, organize, or treasure, Connekyt was designed
                  to put real, human moments into trusted hands.
                </p>
              </header>

              {/* Persona grid - 3 staggered cards */}
              <div className="reveal-stagger wws-grid">

                {/* - 01 · Creative Professionals - */}
                <ElectricBorder color="#3B82F6" speed={1} chaos={0.14} thickness={2} borderRadius={22} className="wws-eb">
                <a href="/user/auth/signup?userType=Photographer" className="wws-card wws-card--lift">
                  <div className="wws-card-art wws-art--photog">
                    {/* Camera SVG with aperture rings */}
                    <svg viewBox="0 0 200 140" fill="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="wwsCamBody" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0" stopColor="#083A85" />
                          <stop offset="1" stopColor="#0F4FB6" />
                        </linearGradient>
                      </defs>
                      {/* Camera body */}
                      <rect x="34" y="48" width="132" height="72" rx="10" fill="url(#wwsCamBody)" />
                      {/* Top hump (viewfinder) */}
                      <rect x="74" y="34" width="52" height="22" rx="6" fill="#0F4FB6" />
                      {/* Lens outer */}
                      <circle cx="100" cy="84" r="30" fill="#062A5C" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
                      <circle cx="100" cy="84" r="22" fill="#03152F" />
                      {/* Aperture petals */}
                      <circle cx="100" cy="84" r="14" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                      <circle cx="100" cy="84" r="8" fill="#3B82F6" opacity="0.7" />
                      <circle cx="94" cy="78" r="3" fill="rgba(255,255,255,0.85)" />
                      {/* Flash + light */}
                      <rect x="44" y="58" width="14" height="6" rx="2" fill="rgba(255,255,255,0.4)" />
                      <circle cx="148" cy="62" r="3" fill="#F87171" />
                      {/* Strap holes */}
                      <rect x="34" y="56" width="6" height="4" fill="rgba(0,0,0,0.3)" />
                      <rect x="160" y="56" width="6" height="4" fill="rgba(0,0,0,0.3)" />
                    </svg>
                    <div className="wws-card-num">01</div>
                  </div>
                  <div className="wws-card-body">
                    <div className="wws-card-eyebrow">For Creators</div>
                    <h3 className="wws-card-title">Creative <em>Professionals</em></h3>
                    <p className="wws-card-desc">
                      Photographers, videographers, and visual storytellers who want to expand reach,
                      build a verified brand, and connect with clients globally.
                    </p>
                    <ul className="wws-card-bullets">
                      <li><i className="bi bi-check-circle-fill" /> Verified portfolio + reviews</li>
                      <li><i className="bi bi-check-circle-fill" /> Secure payouts + invoicing</li>
                      <li><i className="bi bi-check-circle-fill" /> Live streaming + bookings</li>
                    </ul>
                    <span className="wws-card-cta">Join as a creator <span aria-hidden="true">→</span></span>
                  </div>
                </a>
                </ElectricBorder>

                {/* - 02 · Event Organizers - */}
                <ElectricBorder color="#0F4FB6" speed={1.15} chaos={0.16} thickness={2} borderRadius={22} className="wws-eb wws-eb--mid">
                <a href="/user/auth/signup" className="wws-card wws-card--lift">
                  <div className="wws-card-art wws-art--org">
                    {/* Calendar grid + people SVG */}
                    <svg viewBox="0 0 200 140" fill="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="wwsOrgBody" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0" stopColor="#0F4FB6" />
                          <stop offset="1" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                      {/* Calendar */}
                      <rect x="32" y="34" width="100" height="80" rx="8" fill="url(#wwsOrgBody)" />
                      <rect x="32" y="34" width="100" height="20" rx="8" fill="#083A85" />
                      <rect x="42" y="28" width="6" height="14" rx="2" fill="#03152F" />
                      <rect x="116" y="28" width="6" height="14" rx="2" fill="#03152F" />
                      {/* Calendar grid cells */}
                      {[0, 1, 2, 3].map((c) => (
                        <rect key={`r0-${c}`} x={42 + c * 22} y={62} width="14" height="10" rx="2" fill="rgba(255,255,255,0.25)" />
                      ))}
                      {[0, 1, 2, 3].map((c) => (
                        <rect key={`r1-${c}`} x={42 + c * 22} y={78} width="14" height="10" rx="2" fill="rgba(255,255,255,0.25)" />
                      ))}
                      {[0, 1, 2, 3].map((c) => (
                        <rect key={`r2-${c}`} x={42 + c * 22} y={94} width="14" height="10" rx="2" fill="rgba(255,255,255,0.25)" />
                      ))}
                      {/* Highlighted "event" cell */}
                      <rect x="86" y="78" width="14" height="10" rx="2" fill="#FBBF24" />
                      {/* Floating people heads (top-right card) */}
                      <circle cx="156" cy="62" r="14" fill="#fff" stroke="#083A85" strokeWidth="2" />
                      <circle cx="172" cy="78" r="12" fill="#fff" stroke="#0F4FB6" strokeWidth="2" />
                      <circle cx="156" cy="62" r="5" fill="#083A85" />
                      <path d="M 146 80 Q 156 70 166 80" stroke="#083A85" strokeWidth="3" fill="none" />
                      <circle cx="172" cy="78" r="4" fill="#0F4FB6" />
                      <path d="M 164 92 Q 172 86 180 92" stroke="#0F4FB6" strokeWidth="3" fill="none" />
                    </svg>
                    <div className="wws-card-num">02</div>
                  </div>
                  <div className="wws-card-body">
                    <div className="wws-card-eyebrow">For Organizers</div>
                    <h3 className="wws-card-title">Event <em>Organizers</em></h3>
                    <p className="wws-card-desc">
                      Wedding planners, corporate event managers, and celebration coordinators who need
                      reliable, verified creative coverage for memorable occasions.
                    </p>
                    <ul className="wws-card-bullets">
                      <li><i className="bi bi-check-circle-fill" /> Browse vetted talent</li>
                      <li><i className="bi bi-check-circle-fill" /> Live coverage + replays</li>
                      <li><i className="bi bi-check-circle-fill" /> One contract, many gigs</li>
                    </ul>
                    <span className="wws-card-cta">Plan with us <span aria-hidden="true">→</span></span>
                  </div>
                </a>
                </ElectricBorder>

                {/* - 03 · Families & Individuals - uses platform secondary purple-pink */}
                <ElectricBorder color="#B83AB6" speed={0.85} chaos={0.13} thickness={2} borderRadius={22} className="wws-eb wws-eb--memory">
                <a href="/user/auth/signup" className="wws-card wws-card--lift">
                  <div className="wws-card-art wws-art--fam">
                    {/* Stacked Polaroids SVG */}
                    <svg viewBox="0 0 200 140" fill="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="wwsFamPic" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0" stopColor="#3B82F6" />
                          <stop offset="1" stopColor="#0F4FB6" />
                        </linearGradient>
                      </defs>
                      {/* Polaroid 3 (back) */}
                      <g transform="translate(60 30) rotate(-12 50 60)">
                        <rect x="0" y="0" width="100" height="120" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
                        <rect x="8" y="8" width="84" height="80" rx="2" fill="#CBD5E1" />
                        <circle cx="38" cy="42" r="10" fill="#94A3B8" />
                        <path d="M 18 78 Q 50 55 82 78 L 82 88 L 18 88 Z" fill="#94A3B8" />
                      </g>
                      {/* Polaroid 2 (mid) */}
                      <g transform="translate(80 26) rotate(4 50 60)">
                        <rect x="0" y="0" width="100" height="120" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
                        <rect x="8" y="8" width="84" height="80" rx="2" fill="url(#wwsFamPic)" />
                        <circle cx="38" cy="38" r="14" fill="rgba(255,255,255,0.3)" />
                        <path d="M 12 78 Q 50 50 88 78 L 88 88 L 12 88 Z" fill="rgba(255,255,255,0.3)" />
                        <text x="50" y="106" textAnchor="middle" fontSize="9" fill="#083A85" fontStyle="italic" fontFamily="Georgia, serif">Memory · 2025</text>
                      </g>
                      {/* Polaroid 1 (front, brand-blue tinted) */}
                      <g transform="translate(48 16) rotate(-4 50 60)">
                        <rect x="0" y="0" width="100" height="120" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
                        <rect x="8" y="8" width="84" height="80" rx="2" fill="#083A85" />
                        <path d="M 26 36 Q 38 22 50 36 Q 62 22 74 36 Q 70 56 50 70 Q 30 56 26 36 Z" fill="#F87171" opacity="0.85" />
                        <circle cx="50" cy="48" r="8" fill="#fff" opacity="0.9" />
                        <text x="50" y="106" textAnchor="middle" fontSize="9" fill="#0F4FB6" fontStyle="italic" fontFamily="Georgia, serif">Family · Forever</text>
                      </g>
                    </svg>
                    <div className="wws-card-num">03</div>
                  </div>
                  <div className="wws-card-body">
                    <div className="wws-card-eyebrow">For Memory Keepers</div>
                    <h3 className="wws-card-title">Families &amp; <em>Individuals</em></h3>
                    <p className="wws-card-desc">
                      Anyone wanting to preserve precious moments through professional photography and
                      videography services they can trust to deliver beautifully.
                    </p>
                    <ul className="wws-card-bullets">
                      <li><i className="bi bi-check-circle-fill" /> Find local pros in minutes</li>
                      <li><i className="bi bi-check-circle-fill" /> Transparent pricing</li>
                      <li><i className="bi bi-check-circle-fill" /> Vault-safe digital memories</li>
                    </ul>
                    <span className="wws-card-cta">Find your photographer <span aria-hidden="true">→</span></span>
                  </div>
                </a>
                </ElectricBorder>

              </div>

              {/* Footer rule + secondary CTA */}
              <div className="reveal wws-footer">
                <div className="wws-footer-rule" />
                <p className="wws-footer-line">
                  Not sure which fits you? <a href="/user/contact_us" className="wws-footer-link">Talk to our team →</a>
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ━━━ CORE VALUES - scroll-pinned react-pageflip 3D book ━━━ */}
        <div ref={cvSectionRef} className="par-group cv-pf-section" style={{ background: 'linear-gradient(180deg, #E8EEF7 0%, #DBE4F2 50%, #E2E9F4 100%)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'clamp(20px, 2.5vw, 36px) clamp(16px, 4vw, 60px) clamp(24px, 3vw, 40px)' }}>
          {/* Subtle stage lighting behind the book */}
          <div className="cv-pf-stage-glow" aria-hidden="true" />

          <div style={{ textAlign: 'center', marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 2 }}>
            <div className="ab-eyebrow">
              <span className="ab-eyebrow-dot" />
              <span>What Drives Us</span>
              <span className="ab-eyebrow-spark">✦</span>
            </div>
            <h2 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, lineHeight: 1.15, margin: 0, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Our <span style={{ fontStyle: 'italic', background: 'linear-gradient(90deg, #083A85 0%, #3B82F6 55%, #0F4FB6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', paddingRight: '0.12em' }}>Core Values</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: 'clamp(13px, 1.2vw, 15px)', maxWidth: 520, margin: 0, lineHeight: 1.65 }}>
              Scroll to turn the pages, or drag a corner to flip manually.
            </p>
          </div>

          <div className="cv-pf-book-wrap" style={{ position: 'relative', zIndex: 2 }}>
            {/* Soft floor shadow under the book */}
            <div className="cv-pf-floor" aria-hidden="true" />
            <HTMLFlipBook
              ref={bookRef}
              onInit={() => setBookReady(true)}
              width={bookSize.w}
              height={bookSize.h}
              size="stretch"
              minWidth={300}
              maxWidth={520}
              minHeight={400}
              maxHeight={720}
              showCover={true}
              maxShadowOpacity={0.55}
              flippingTime={750}
              usePortrait={bookSize.single}
              mobileScrollSupport={true}
              drawShadow={true}
              startZIndex={0}
              autoSize={false}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
              clickEventForward={true}
              useMouseEvents={true}
              startPage={0}
              style={{ touchAction: 'pan-y' }}
              className="cv-pf-book"
            >
              <BookCover kind="front" />
              {coreValues.map((v, i) => (
                <BookPage key={v.title} num={String(i + 1).padStart(2, '0')} value={v} />
              ))}
              <BookCover kind="back" />
            </HTMLFlipBook>
          </div>
        </div>

        {/* ━━━ JOURNEY - 3D ContainerScroll chapter book ━━━ */}
        <div ref={journeyRef} className="journey-section-cs">
          {/* Ambient decorations behind the rotating card */}
          <span className="journey-orb" aria-hidden="true" />
          <span className="journey-fleuron" aria-hidden="true">✦</span>

          <ContainerScroll
            titleComponent={
              <div className="journey-header">
                <div className="ab-eyebrow">
                  <span className="ab-eyebrow-dot" />
                  <span>Our Journey · Mission · Vision</span>
                  <span className="ab-eyebrow-spark">✦</span>
                </div>
                <h2 className="journey-title">
                  Journey of Progress <span className="journey-title-em">&amp; Possibility</span>
                </h2>
                <p className="journey-subtitle">Five stories, one mission. Tap a marker, or use the arrows, to navigate the timeline.</p>
              </div>
            }
          >
            {(() => {
              const romans = ['I', 'II', 'III', 'IV', 'V'];
              const slide = slides[activeSlide];
              const goPrev = () => setActiveSlide((s) => (s - 1 + totalSlides) % totalSlides);
              const goNext = () => setActiveSlide((s) => (s + 1) % totalSlides);
              return (
                <div className="journey-cs-content">
                  {/* Edge-anchored prev / next arrows - visually prominent */}
                  <button type="button" aria-label="Previous slide" className="journey-cs-arrow journey-cs-arrow--prev" onClick={goPrev}>
                    <i className="bi bi-chevron-left" />
                  </button>
                  <button type="button" aria-label="Next slide" className="journey-cs-arrow journey-cs-arrow--next" onClick={goNext}>
                    <i className="bi bi-chevron-right" />
                  </button>

                  {/* Year + mission + vision dot navigator */}
                  <div className="journey-cs-tabs" role="tablist" aria-label="Journey + mission + vision">
                    {slides.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={i === activeSlide}
                        className={`journey-cs-tab journey-cs-tab--${s.kind}${i === activeSlide ? ' active' : i < activeSlide ? ' past' : ''}`}
                        onClick={() => setActiveSlide(i)}
                      >
                        <span className="journey-cs-tab-num">{s.tabLabel}</span>
                        <span className="journey-cs-tab-label">{s.tabSub}</span>
                      </button>
                    ))}
                    <div className="journey-cs-progress" aria-hidden="true">
                      <div className="journey-cs-progress-fill" style={{ width: `${((activeSlide + 1) / totalSlides) * 100}%` }} />
                    </div>
                  </div>

                  {/* Slide content (chapter or mission/vision) */}
                  {slide.kind === 'chapter' ? (
                    (() => {
                      const isCurrent = slide.year === currentYear;
                      return (
                        <article key={`ch-${slide.year}`} className="journey-cs-card journey-cs-card--chapter">
                          <div className="journey-card-aside">
                            <span className="journey-card-chapter">Chapter {romans[slide.index] ?? slide.index + 1}</span>
                            <span className="journey-card-roman">{romans[slide.index] ?? slide.index + 1}</span>
                            <span className="journey-card-year">{slide.year}</span>
                            <div className="journey-card-divider">
                              <span className="journey-card-divider-mark">✦</span>
                            </div>
                            <span className={`journey-card-status${isCurrent ? ' is-now' : ''}`}>
                              {isCurrent ? (
                                <><span className="journey-card-pulse" /> Live milestone</>
                              ) : slide.year < currentYear ? (
                                <>Completed chapter</>
                              ) : (
                                <>Upcoming chapter</>
                              )}
                            </span>
                          </div>
                          <div className="journey-card-main">
                            <span className="journey-card-eyebrow">Milestone {slide.index + 1} of {journeyMilestones.length}</span>
                            <h3 className="journey-card-title">
                              {slide.title}{' '}
                              <span className="journey-card-title-em">{slide.highlight}</span>
                            </h3>
                            <div className="journey-card-paragraphs">
                              {slide.paragraphs.map((p, j) => (
                                <p key={j} className={j === 0 ? 'journey-card-lede' : 'journey-card-body'}>{p}</p>
                              ))}
                            </div>
                            <footer className="journey-card-foot">
                              <span className="journey-card-foot-line" />
                              <span className="journey-card-foot-label">Amoria Connekyt · Chapter {romans[slide.index] ?? slide.index + 1}</span>
                            </footer>
                          </div>
                        </article>
                      );
                    })()
                  ) : (
                    <article key={`mv-${slide.kind}`} className={`journey-cs-card journey-cs-card--mv journey-cs-card--${slide.kind}`}>
                      <div className="journey-mv-aside">
                        <div className="journey-mv-icon"><i className={`bi ${slide.icon}`} /></div>
                        <span className="journey-mv-kind">{slide.kind === 'mission' ? 'Our purpose' : 'Where we are going'}</span>
                        <span className="journey-mv-tag">{slide.kind === 'mission' ? 'MISSION' : 'VISION'}</span>
                        <div className="journey-card-divider">
                          <span className="journey-card-divider-mark">✦</span>
                        </div>
                        <span className="journey-card-status">{slide.kind === 'mission' ? 'Active commitment' : 'Future direction'}</span>
                      </div>
                      <div className="journey-card-main">
                        <span className="journey-card-eyebrow">{slide.kind === 'mission' ? 'Statement 1 of 2' : 'Statement 2 of 2'}</span>
                        <h3 className="journey-card-title">
                          {slide.title}{' '}
                          <span className="journey-card-title-em">{slide.emphasis}</span>
                        </h3>
                        <p className="journey-card-lede">{slide.body}</p>
                        <ul className="journey-mv-bullets">
                          {slide.bullets.map((b, j) => (
                            <li key={j}><i className="bi bi-check-circle-fill" />{b}</li>
                          ))}
                        </ul>
                        <footer className="journey-card-foot">
                          <span className="journey-card-foot-line" />
                          <span className="journey-card-foot-label">Amoria Connekyt · {slide.kind === 'mission' ? 'Mission Statement' : 'Vision Statement'}</span>
                        </footer>
                      </div>
                    </article>
                  )}
                </div>
              );
            })()}
          </ContainerScroll>
        </div>

        {/* (Mission & Vision merged into the Journey carousel above - section removed.) */}

        {/* ━━━ SMART TOOLS - Dashboard Mockup with secondary-color lamp ━━━ */}
        <div className="par-group">
          <div
            className="par-base about-section smart-tools-section"
            style={{
              background: '#0B0817',
              position: 'relative',
              overflow: 'hidden',
              padding: 'clamp(180px, 24vh, 240px) clamp(16px, 4vw, 60px) clamp(60px, 8vw, 100px)',
            }}
          >
            {/* Secondary purple-pink lamp lighting the whole section from above */}
            <Lamp
              bgColor="#0B0817"
              beamColor="#A855F7"
              glowColor="#C084FC"
              filamentColor="#EC4899"
              height="22rem"
              zIndex={1}
            />

            <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 5 }}>

              <div className="reveal" style={{ textAlign: 'center', marginBottom: 'clamp(32px, 5vw, 50px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div className="ab-eyebrow ab-eyebrow-dark">
                  <span className="ab-eyebrow-dot" />
                  <span>Our Platform</span>
                  <span className="ab-eyebrow-spark">✦</span>
                </div>
                <h2 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(32px, 4.8vw, 56px)', fontWeight: 400, lineHeight: 1.1, margin: 0, color: '#F5EBFF', letterSpacing: '-0.015em', maxWidth: 760, textShadow: '0 4px 30px rgba(168,85,247,0.35)' }}>
                  Smart Tools for <span style={{ fontStyle: 'italic', background: 'linear-gradient(90deg, #C084FC 0%, #EC4899 60%, #F472B6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', paddingRight: '0.12em' }}>Creative Professionals</span>
                </h2>
                <p style={{ fontSize: 'clamp(14px, 1.3vw, 16px)', color: 'rgba(245,235,255,0.7)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                  Digital empowerment tools to manage projects, payments, and growth from one secure platform.
                </p>
              </div>

              {/* Dashboard mockup - premium creator-platform UI */}
              <div className="reveal smart-dashboard" style={{ maxWidth: 980, margin: '0 auto', borderRadius: 18, overflow: 'hidden', background: '#fff', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.55), 0 8px 24px -8px rgba(168,85,247,0.35)' }}>
                {/* Browser bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28ca41' }} />
                  <div style={{ flex: 1, marginLeft: 16, background: '#fff', borderRadius: 6, padding: '6px 14px', fontSize: 12, color: '#94a3b8', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-shield-lock-fill" style={{ fontSize: 11, color: '#10b981' }} />
                    app.connekyt.com/dashboard
                  </div>
                </div>

                {/* Dashboard content */}
                <div style={{ display: 'flex', gap: 0, minHeight: 'clamp(360px, 48vw, 440px)' }}>
                  {/* Sidebar */}
                  <div className="smart-sidebar" style={{ width: 200, background: 'linear-gradient(180deg, #083A85 0%, #062a64 100%)', padding: '20px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 6px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #C084FC, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px -2px rgba(236,72,153,0.55)' }}>A</div>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>Connekyt Pro</span>
                    </div>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[
                        { label: 'Dashboard', icon: 'bi-grid-1x2-fill', active: true },
                        { label: 'Portfolio', icon: 'bi-images', badge: '24' },
                        { label: 'Bookings', icon: 'bi-calendar2-event', badge: '3' },
                        { label: 'Live Streams', icon: 'bi-broadcast', live: true },
                        { label: 'Earnings', icon: 'bi-graph-up-arrow' },
                        { label: 'Messages', icon: 'bi-chat-dots', badge: '7' },
                        { label: 'Settings', icon: 'bi-sliders' },
                      ].map((item, i) => (
                        <div key={i} style={{ position: 'relative', padding: '8px 12px', borderRadius: 8, background: item.active ? 'rgba(255,255,255,0.14)' : 'transparent', color: item.active ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 12.5, fontWeight: item.active ? 600 : 500, display: 'flex', alignItems: 'center', gap: 10, cursor: 'default', borderLeft: item.active ? '3px solid #EC4899' : '3px solid transparent' }}>
                          <i className={`bi ${item.icon}`} style={{ fontSize: 13, opacity: item.active ? 1 : 0.85 }} />
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.badge && <span style={{ background: 'rgba(236,72,153,0.25)', color: '#FBA9D2', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6, letterSpacing: 0.3 }}>{item.badge}</span>}
                          {item.live && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(236,72,153,0.18)', color: '#F472B6', fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 6, letterSpacing: 0.4 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#F472B6', boxShadow: '0 0 6px #F472B6' }} />LIVE</span>}
                        </div>
                      ))}
                    </nav>

                    {/* Sidebar footer - user card */}
                    <div style={{ marginTop: 'auto', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #EC4899, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>SK</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sarah Karuhanga</div>
                        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9.5, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
                          Verified · Pro
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main content */}
                  <div style={{ flex: 1, padding: 'clamp(14px, 1.8vw, 22px)', background: 'linear-gradient(180deg, #FAFBFD 0%, #F4F6FB 100%)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Top bar - welcome + live + bell */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: '#94a3b8', fontSize: 11, margin: 0, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 600 }}>Welcome back, Sarah ✨</p>
                        <h3 style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, margin: '2px 0 0', letterSpacing: '-0.01em' }}>Creative Studio</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.10)', color: '#10b981', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'smartLivePulse 1.5s ease-in-out infinite' }} />
                          Live now
                        </span>
                        <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                          <i className="bi bi-bell-fill" style={{ fontSize: 13 }} />
                          <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 14, height: 14, padding: '0 4px', borderRadius: 7, background: '#EC4899', color: '#fff', fontSize: 9, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #fff' }}>3</span>
                        </div>
                      </div>
                    </div>

                    {/* Hero KPI card with sparkline */}
                    <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #FAF5FF 100%)', borderRadius: 14, padding: 18, border: '1px solid #ECE3F8', boxShadow: '0 10px 24px -16px rgba(168,85,247,0.25)', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ color: '#94a3b8', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 700 }}>Total Earnings</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.10)', padding: '1px 6px', borderRadius: 5 }}>
                            <i className="bi bi-arrow-up-short" style={{ fontSize: 11 }} />12.5%
                          </span>
                        </div>
                        <h2 style={{ color: '#0f172a', fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>$12,450<span style={{ fontSize: '0.6em', color: '#94a3b8' }}>.00</span></h2>
                        <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>vs $11,068 last month · 7 payouts pending</p>
                      </div>
                      {/* Sparkline */}
                      <svg viewBox="0 0 200 70" style={{ width: '100%', height: 60 }} preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#C084FC" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                        <path d="M 0 50 L 20 44 L 40 48 L 60 36 L 80 40 L 100 28 L 120 32 L 140 22 L 160 20 L 180 14 L 200 10 L 200 70 L 0 70 Z" fill="url(#sparkFill)" />
                        <path d="M 0 50 L 20 44 L 40 48 L 60 36 L 80 40 L 100 28 L 120 32 L 140 22 L 160 20 L 180 14 L 200 10" fill="none" stroke="url(#sparkLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="200" cy="10" r="3.5" fill="#EC4899" stroke="#fff" strokeWidth="1.5" />
                      </svg>
                    </div>

                    {/* Two-col: stat cards + recent bookings */}
                    <div className="smart-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.4fr', gap: 12 }}>
                      {/* Stat cards stack */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Active Jobs', value: '8', icon: 'bi-camera-fill', tint: '#3B82F6', bgTint: 'rgba(59,130,246,0.1)' },
                          { label: 'Completed', value: '124', icon: 'bi-check-circle-fill', tint: '#10b981', bgTint: 'rgba(16,185,129,0.1)' },
                          { label: 'Rating', value: '4.9', icon: 'bi-star-fill', tint: '#F59E0B', bgTint: 'rgba(245,158,11,0.1)' },
                        ].map((s, i) => (
                          <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #ECE3F8', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bgTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className={`bi ${s.icon}`} style={{ fontSize: 14, color: s.tint }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: '#0f172a', fontSize: 16, fontWeight: 800, lineHeight: 1.1 }}>{s.value}</div>
                              <div style={{ color: '#94a3b8', fontSize: 9.5, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.label}</div>
                            </div>
                            {/* Mini bar chart per stat */}
                            <svg viewBox="0 0 40 24" style={{ width: 38, height: 22, flexShrink: 0 }}>
                              {[0.4, 0.6, 0.5, 0.75, 0.5, 0.85, 1].map((h, k) => (
                                <rect key={k} x={k * 6} y={24 - h * 22} width="3" height={h * 22} rx="1" fill={s.tint} opacity={0.4 + h * 0.4} />
                              ))}
                            </svg>
                          </div>
                        ))}
                      </div>

                      {/* Recent bookings */}
                      <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #ECE3F8', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ color: '#0f172a', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3 }}>Recent Bookings</span>
                          <span style={{ color: '#A855F7', fontSize: 10, fontWeight: 700, cursor: 'default' }}>View all →</span>
                        </div>
                        {[
                          { name: 'Sarah K.', event: 'Wedding · Today', status: 'live', color: '#EC4899', initials: 'SK', avatar: 'linear-gradient(135deg, #F472B6, #EC4899)' },
                          { name: 'Mike J.',  event: 'Event · Tomorrow', status: 'scheduled', color: '#A855F7', initials: 'MJ', avatar: 'linear-gradient(135deg, #C084FC, #A855F7)' },
                          { name: 'Lisa P.',  event: 'Portrait · Fri', status: 'pending', color: '#F59E0B', initials: 'LP', avatar: 'linear-gradient(135deg, #FBBF24, #F59E0B)' },
                          { name: 'David O.', event: 'Brand shoot · Sat', status: 'confirmed', color: '#3B82F6', initials: 'DO', avatar: 'linear-gradient(135deg, #60A5FA, #3B82F6)' },
                        ].map((b, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderTop: i === 0 ? 'none' : '1px solid #F1ECF8' }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: b.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{b.initials}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: '#0f172a', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{b.name}</div>
                              <div style={{ color: '#94a3b8', fontSize: 9.5, lineHeight: 1.2 }}>{b.event}</div>
                            </div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 999, fontSize: 8.5, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase', color: b.color, background: `${b.color}1A` }}>
                              {b.status === 'live' && <span style={{ width: 4, height: 4, borderRadius: '50%', background: b.color, boxShadow: `0 0 6px ${b.color}` }} />}
                              {b.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature pills below */}
              <div className="reveal" style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(20px, 3vw, 40px)', marginTop: 32, flexWrap: 'wrap' }}>
                {[
                  { icon: 'bi-shield-lock', text: 'Secure Payments' },
                  { icon: 'bi-patch-check', text: 'Verified Creators' },
                  { icon: 'bi-bar-chart-line', text: 'Smart Analytics' },
                  { icon: 'bi-globe2', text: 'Global Reach' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className={`bi ${f.icon}`} style={{ fontSize: 16, color: '#C084FC' }} />
                    <span style={{ color: 'rgba(245,235,255,0.75)', fontSize: 14 }}>{f.text}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ━━━ MOCK CTA GROUP ━━━ */}
        <div className="par-group">
          <div className="par-deep" style={{ overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/mock.png)', backgroundSize: 'cover', backgroundPosition: 'right center' }} />
          </div>
          <div className="par-base about-section" style={{ padding: 'clamp(12px, 2vw, 16px)', background: 'linear-gradient(180deg, #FFF8F2 0%, #FCEFE3 100%)' }}>
            <div className="reveal" style={{ position: 'relative', width: '100%', minHeight: 'clamp(300px, 50vw, 600px)', overflow: 'hidden', borderRadius: 'clamp(14px, 2vw, 24px)' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/mock.png)', backgroundSize: 'cover', backgroundPosition: 'right center' }} />
              {/* Brand-blue tint overlay so white text reads cleanly on any background image */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(5,32,71,0.85) 0%, rgba(8,58,133,0.6) 45%, rgba(8,58,133,0.15) 100%)' }} />
              <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: 'clamp(28px, 6vw, 80px) clamp(16px, 5vw, 60px)', display: 'flex', alignItems: 'center', minHeight: 'clamp(300px, 50vw, 600px)' }}>
                <div style={{ maxWidth: 520 }}>
                  <div className="ab-eyebrow ab-eyebrow-dark" style={{ marginBottom: 18 }}>
                    <span className="ab-eyebrow-dot" />
                    <span>Join the platform</span>
                    <span className="ab-eyebrow-spark">✦</span>
                  </div>
                  <h2 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(24px, 4vw, 50px)', fontWeight: 400, marginBottom: 'clamp(12px, 2vw, 18px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                    Empowering creators to share their <span style={{ fontStyle: 'italic', background: 'linear-gradient(90deg, #ffffff 0%, #F0A6E1 45%, #EC4899 75%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', paddingRight: '0.12em' }}>vision</span> with the world.
                  </h2>
                  <p style={{ fontSize: 'clamp(13px, 1.5vw, 17px)', fontWeight: 400, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', marginBottom: 'clamp(18px, 3vw, 28px)' }}>Amoria Connekyt is built for photographers and creatives ready to showcase their work and connect with clients. Create your profile today and get started.</p>
                  <a href="/user/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 'clamp(13px, 1.2vw, 15px)', fontWeight: 700, padding: 'clamp(10px, 1.5vw, 14px) clamp(22px, 3vw, 32px)', background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 100%)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 40, textDecoration: 'none', transition: 'all 0.3s ease', boxShadow: '0 8px 22px -10px rgba(8,58,133,0.55)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 30px -10px rgba(8,58,133,0.7)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 22px -10px rgba(8,58,133,0.55)'; }}
                  >Get Started <span aria-hidden="true">→</span></a>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* ── Half Earth - scroll-driven globe rotation ── */}
        <style>{`
          .earth-section {
            position: relative; width: 100%; height: 100dvh;
            background:
              radial-gradient(60% 40% at 50% 0%, rgba(125,99,255,0.18), transparent 65%),
              radial-gradient(80% 60% at 50% 30%, rgba(0,232,255,0.10), transparent 70%),
              linear-gradient(to bottom, #03152F 0%, #062D5E 35%, #083A85 70%, #052047 100%);
            overflow: hidden;
          }
          /* Starfield - 28 absolutely-positioned twinkling stars */
          .earth-star {
            position: absolute; width: 2px; height: 2px; border-radius: 50%;
            background: #fff; box-shadow: 0 0 4px rgba(255,255,255,0.8);
            pointer-events: none; z-index: 1;
            animation: earthStarTwinkle 4s ease-in-out infinite;
          }
          .earth-star.lg { width: 3px; height: 3px; box-shadow: 0 0 8px rgba(255,255,255,0.95); }
          @keyframes earthStarTwinkle {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 1; }
          }
          /* Aurora ribbon - soft cyan/violet sweep above the globe horizon */
          .earth-aurora {
            position: absolute; top: 18%; left: -10%; right: -10%; height: 14%;
            background: linear-gradient(90deg, transparent 0%, rgba(125,211,252,0.18) 25%, rgba(168,85,247,0.22) 50%, rgba(236,72,153,0.18) 75%, transparent 100%);
            filter: blur(40px);
            pointer-events: none; z-index: 1;
            animation: earthAuroraDrift 18s ease-in-out infinite;
          }
          @keyframes earthAuroraDrift {
            0%, 100% { transform: translateX(0) skewX(-6deg); opacity: 0.65; }
            50% { transform: translateX(20px) skewX(-3deg); opacity: 1; }
          }
          /* Live stats row - sits between the description and the CTA */
          .earth-stats {
            display: flex; flex-wrap: wrap; justify-content: center;
            gap: clamp(16px, 3vw, 36px);
            margin: clamp(16px, 2.5vw, 24px) auto clamp(20px, 3vw, 30px);
            max-width: 720px; padding: 0 16px;
          }
          .earth-stat {
            display: flex; flex-direction: column; align-items: center;
            min-width: 80px; pointer-events: auto;
          }
          .earth-stat-num {
            font-family: 'Georgia', serif;
            font-size: clamp(28px, 3.6vw, 42px); font-weight: 600;
            line-height: 1; letter-spacing: -0.01em;
            background: linear-gradient(180deg, #ffffff 0%, #93C5FD 100%);
            -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
            text-shadow: 0 0 24px rgba(147,197,253,0.4);
          }
          .earth-stat-num sup { font-size: 0.55em; vertical-align: super; color: #7DD3FC; }
          .earth-stat-label {
            margin-top: 6px;
            font-size: clamp(9.5px, 1vw, 11px); font-weight: 700;
            letter-spacing: 0.32em; text-transform: uppercase;
            color: rgba(255,255,255,0.55);
          }
          /* Live activity pill - under the CTA */
          .earth-live-pill {
            margin-top: clamp(14px, 2vw, 22px);
            display: inline-flex; align-items: center; gap: 8px;
            padding: 6px 14px; border-radius: 999px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(8px);
            color: rgba(255,255,255,0.75); font-size: 11px; font-weight: 600;
            letter-spacing: 0.18em; text-transform: uppercase;
            pointer-events: auto;
          }
          .earth-live-pill-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: #34D399; box-shadow: 0 0 10px #34D399;
            animation: earthLivePulse 1.6s ease-in-out infinite;
          }
          @keyframes earthLivePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.55; transform: scale(0.85); }
          }
          @media (prefers-reduced-motion: reduce) {
            .earth-star, .earth-aurora, .earth-live-pill-dot { animation: none !important; }
          }
          /* Decorative orbital rings */
          .earth-orbital {
            position: absolute; left: 50%; bottom: -50%;
            width: clamp(900px, 130vw, 1600px); aspect-ratio: 1 / 1;
            border-radius: 50%;
            border: 1px solid rgba(125,211,252,0.10);
            transform: translateX(-50%);
            pointer-events: none; z-index: 1;
          }
          .earth-orbital--inner {
            bottom: -45%;
            width: clamp(800px, 115vw, 1400px);
            border-color: rgba(168,85,247,0.10);
          }
          .about-footer-wrap .footer-container { margin-top: 0 !important; }
          .earth-overlay { position: absolute; top: 0; left: 0; right: 0; height: 55%; background: linear-gradient(to bottom, #083A85 0%, #083A85 50%, rgba(8,58,133,0.85) 75%, rgba(5,32,71,0) 100%); z-index: 3; pointer-events: none; }
          .earth-text { position: absolute; top: 0; left: 0; right: 0; z-index: 5; text-align: center; padding: clamp(60px, 10vh, 120px) clamp(16px, 4vw, 24px) 0; pointer-events: none; }
          .earth-globe-wrap { position: absolute; top: 20%; left: -25%; right: -25%; bottom: -60%; z-index: 2; }

          @media (max-width: 768px) {
            .earth-section { height: 80dvh; min-height: 500px; }
            .earth-overlay { height: 50%; }
            .earth-globe-wrap { top: 15%; left: -40%; right: -40%; bottom: -50%; }
          }

          @media (max-width: 480px) {
            .earth-section { height: 70dvh; min-height: 450px; }
            .earth-overlay { height: 45%; }
            .earth-globe-wrap { top: 10%; left: -50%; right: -50%; bottom: -40%; }
          }
        `}</style>
        <div
          ref={earthSectionRef}
          className="earth-section"
        >
          <div className="earth-overlay" />

          {/* Aurora ribbon high in the sky */}
          <div className="earth-aurora" aria-hidden="true" />

          {/* Decorative orbital rings */}
          <div className="earth-orbital" aria-hidden="true" />
          <div className="earth-orbital earth-orbital--inner" aria-hidden="true" />

          {/* Starfield - 28 twinkling stars at scattered positions */}
          {[
            { t: '6%',  l: '8%',  d: 0,    big: true  },
            { t: '4%',  l: '22%', d: 1.2,  big: false },
            { t: '12%', l: '14%', d: 2.4,  big: false },
            { t: '8%',  l: '38%', d: 0.8,  big: true  },
            { t: '14%', l: '46%', d: 3,    big: false },
            { t: '5%',  l: '62%', d: 1.6,  big: false },
            { t: '11%', l: '74%', d: 2.2,  big: true  },
            { t: '7%',  l: '88%', d: 0.4,  big: false },
            { t: '15%', l: '94%', d: 2.8,  big: false },
            { t: '20%', l: '5%',  d: 1,    big: false },
            { t: '22%', l: '32%', d: 3.6,  big: false },
            { t: '24%', l: '58%', d: 0.6,  big: false },
            { t: '21%', l: '82%', d: 2,    big: true  },
            { t: '28%', l: '12%', d: 1.4,  big: false },
            { t: '30%', l: '40%', d: 2.6,  big: false },
            { t: '32%', l: '66%', d: 0.2,  big: false },
            { t: '34%', l: '90%', d: 1.8,  big: false },
            { t: '38%', l: '4%',  d: 3.2,  big: false },
            { t: '40%', l: '24%', d: 1.1,  big: true  },
            { t: '42%', l: '50%', d: 2.5,  big: false },
            { t: '44%', l: '76%', d: 0.9,  big: false },
            { t: '46%', l: '95%', d: 2.7,  big: false },
            { t: '50%', l: '15%', d: 1.7,  big: false },
            { t: '52%', l: '36%', d: 3.4,  big: false },
            { t: '54%', l: '60%', d: 0.5,  big: false },
            { t: '56%', l: '82%', d: 2.3,  big: false },
            { t: '60%', l: '6%',  d: 1.3,  big: false },
            { t: '62%', l: '92%', d: 2.9,  big: true  },
          ].map((s, i) => (
            <span key={i} className={`earth-star${s.big ? ' lg' : ''}`} style={{ top: s.t, left: s.l, animationDelay: `${s.d}s` }} aria-hidden="true" />
          ))}

          {/* Text content overlaying the globe */}
          <div className="earth-text">
            <div className="ab-eyebrow ab-eyebrow-dark" style={{ marginBottom: 18, pointerEvents: 'auto' }}>
              <span className="ab-eyebrow-dot" />
              <span>From Kigali · To the world</span>
              <span className="ab-eyebrow-spark">✦</span>
            </div>
            <h2 style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(30px, 5.4vw, 68px)',
              fontWeight: 300,
              color: '#fff',
              letterSpacing: '-0.02em',
              marginBottom: 'clamp(10px, 2vw, 16px)',
              lineHeight: 1.05,
              textShadow: '0 4px 30px rgba(0,0,0,0.4), 0 0 40px rgba(125,211,252,0.15)',
            }}>
              Born in Kigali, <span style={{ fontWeight: 600, fontStyle: 'italic', background: 'linear-gradient(90deg, #ffffff 0%, #93C5FD 55%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', paddingRight: '0.12em' }}>built for the world</span>
            </h2>
            <p style={{
              fontSize: 'clamp(13px, 1.5vw, 18px)',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 620,
              margin: '0 auto clamp(6px, 1vw, 10px)',
              lineHeight: 1.7,
              padding: '0 clamp(8px, 2vw, 16px)',
            }}>
              Connecting photographers and creatives across continents. From local talent to global stages, one platform, limitless reach.
            </p>

            {/* Live network stats row */}
            <div className="earth-stats reveal">
              {[
                { num: '47', sup: '+', label: 'Cities' },
                { num: '6',  sup: '',  label: 'Continents' },
                { num: '1.2', sup: 'K+', label: 'Creators' },
                { num: '24', sup: '/7', label: 'Coverage' },
              ].map((s, i) => (
                <div key={i} className="earth-stat">
                  <span className="earth-stat-num">{s.num}{s.sup && <sup>{s.sup}</sup>}</span>
                  <span className="earth-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
            <a
              href="/user/auth/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: '#ffffff',
                fontSize: 'clamp(14px, 1.2vw, 16px)',
                fontWeight: 700,
                padding: 'clamp(12px, 1.5vw, 16px) clamp(24px, 3vw, 32px)',
                background: 'linear-gradient(135deg, #083A85 0%, #0F4FB6 50%, #3B82F6 100%)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 12,
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                pointerEvents: 'auto',
                whiteSpace: 'nowrap',
                boxShadow: '0 10px 26px -10px rgba(8,58,133,0.65)',
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 30px -10px rgba(8,58,133,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 26px -10px rgba(8,58,133,0.65)'; }}
            >
              Get Started
            </a>

            {/* Live activity pill - under the CTA */}
            <div className="earth-live-pill">
              <span className="earth-live-pill-dot" />
              Broadcasting from 12 cities right now
            </div>
          </div>

          {/* Globe */}
          <div className="earth-globe-wrap">
            <HalfEarth
              height={1400}
              progressRef={earthProgressRef}
            />
          </div>
        </div>

        {/* No bg on the wrapper so the page's neutral #f8fafc shows through the
            footer-body's rounded top corners - the brand corner radius reads cleanly. */}
        <div className="about-footer-wrap">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default About;
