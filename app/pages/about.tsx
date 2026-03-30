"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import HalfEarth from "../components/HalfEarth";

// ── Split Hover Text: letters explode from cursor with particles & connecting lines ──
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
  const [activeCvCard, setActiveCvCard] = useState(-1);
  const journeyRef = useRef<HTMLDivElement>(null);
  const mvRef = useRef<HTMLDivElement>(null);
  const cvFlipRef = useRef<HTMLDivElement>(null);
  const cvBook3dRef = useRef<HTMLDivElement>(null);
  const cvCoverRef = useRef<HTMLDivElement>(null);
  const cvPage1Ref = useRef<HTMLDivElement>(null);
  const cvPage2Ref = useRef<HTMLDivElement>(null);
  const cvPage3Ref = useRef<HTMLDivElement>(null);
  const cvPage4Ref = useRef<HTMLDivElement>(null);
  const cvPage5Ref = useRef<HTMLDivElement>(null);
  const laptopMockupRef = useRef<HTMLDivElement>(null);
  const smartToolsRef = useRef<HTMLElement>(null);
  const earthSectionRef = useRef<HTMLDivElement>(null);
  const [earthProgress, setEarthProgress] = useState(0);

  const journeyMilestones = [
    { year: 2025, title: 'The Birth of Our Vision:', highlight: "We're Turning Ideas Into Actions", paragraphs: ["Originally, this started as an idea, but it has started to blossom into something larger than that. People were noticing the obstacles and setbacks that creators in the industry had. They didn't have the right tools and platforms to promote themselves and their work properly.", 'Amoria Connekyt started as a vision to promote creators, but it also helps serve as a bridge to new tools and opportunities.'] },
    { year: 2026, title: 'Scaling Our Impact:', highlight: 'Building the Future Together', paragraphs: ['What began as a passion for supporting event creators, photographers, and storytellers has impacted us in numerous ways and heavily shaped the growth of our company. We listen to our customers and use their feedback to drive changes and developments.', "We've come a long way in our development, and looking to the future, we will continue to evolve with our customers. We're only just getting started and are looking to build even more with you."] },
    { year: 2027, title: 'Expanding Horizons:', highlight: 'Going Global, Staying Personal', paragraphs: ['With a strong foundation built on trust and innovation, we are expanding into new markets and empowering creators across continents. Our platform now supports multilingual experiences and localized payment solutions.', 'We remain committed to the personal touch that defines Amoria Connekyt — every feature we build starts with the creator in mind. The future is global, but the heart stays local.'] },
  ];
  const currentYear = new Date().getFullYear();
  const currentIdx = journeyMilestones.findIndex(m => m.year === currentYear);
  const visibleCards = currentIdx >= 1 ? [journeyMilestones[currentIdx - 1], journeyMilestones[currentIdx]] : journeyMilestones.slice(-2);

  const coreValues = [
    { title: 'Innovation', icon: 'bi-lightbulb', desc: 'Pioneering creative tools and smart solutions for the photography industry.', color: '#3b82f6' },
    { title: 'Trust', icon: 'bi-shield-check', desc: 'Building confidence through verified professionals and secure transactions.', color: '#10b981' },
    { title: 'Excellence', icon: 'bi-award', desc: 'Setting the highest standards in creative quality and client satisfaction.', color: '#f59e0b' },
    { title: 'Wellness', icon: 'bi-heart', desc: 'Supporting the well-being and growth of our creative community.', color: '#ec4899' },
    { title: 'Growth', icon: 'bi-graph-up-arrow', desc: 'Empowering photographers to expand their reach and build lasting careers.', color: '#8b5cf6' },
  ];

  // GSAP reveals + smart tools peel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {

        // ── HERO: Window starts fullscreen, shrinks on scroll revealing cabin + text ──
        const hero = heroRef.current;
        const win = windowRef.current;
        if (hero && win) {
          // Measure the window at its natural size (scale 1)
          gsap.set(win, { scale: 1 });
          const winRect = win.getBoundingClientRect();
          const scaleX = window.innerWidth / winRect.width;
          const scaleY = window.innerHeight / winRect.height;
          const fillScale = Math.max(scaleX, scaleY) * 1.2;

          // Overlay text (ref index 4) starts visible; cabin wall texts (ref 0-3) start hidden
          const overlayText = heroTextRefs.current[4];
          const cabinTexts = [heroTextRefs.current[0], heroTextRefs.current[1], heroTextRefs.current[2], heroTextRefs.current[3]].filter(Boolean) as HTMLDivElement[];

          gsap.set(win, { scale: fillScale });
          gsap.set(hero, { visibility: 'visible' });
          gsap.set(cabinTexts, { opacity: 0, y: 30 });
          if (overlayText) gsap.set(overlayText, { opacity: 1 });

          const heroTl = gsap.timeline({
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: '+=150%',
              scrub: 0.6,
              pin: true,
              pinSpacing: true,
            },
          });

          // Overlay text fades out first as window starts shrinking
          if (overlayText) {
            heroTl.to(overlayText, { opacity: 0, y: -30, duration: 0.3, ease: 'power2.in' }, 0);
          }

          // Window shrinks from fullscreen to its natural size
          heroTl.to(win, { scale: 1, duration: 1, ease: 'power3.out' }, 0);

          // Cabin wall text fades in as the window shrinks
          heroTl.to(cabinTexts, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, 0.4);

          // Hold at the end so user can read
          heroTl.to({}, { duration: 0.3 });
        }

        // ── CORE VALUES: Exact same flip book as landing page ──
        const cvFlip = cvFlipRef.current;
        const cvCover = cvCoverRef.current;
        const cvP1 = cvPage1Ref.current;
        const cvP2 = cvPage2Ref.current;
        const cvP3 = cvPage3Ref.current;
        const cvP4 = cvPage4Ref.current;
        const cvP5 = cvPage5Ref.current;
        const cvBook = cvBook3dRef.current;
        if (cvFlip && cvCover && cvP1 && cvP2 && cvP3 && cvP4 && cvP5 && cvBook) {
          const isMobile = window.innerWidth <= 768;
          const allPages = [cvCover, cvP1, cvP2, cvP3, cvP4, cvP5];
          gsap.set(allPages, { rotateY: 0, transformOrigin: 'left center' });
          if (isMobile) {
            gsap.set(cvBook, { marginLeft: 0 });
          } else {
            gsap.set(cvBook, { width: 280, height: 320 });
          }

          const cvTl = gsap.timeline({
            scrollTrigger: {
              trigger: cvFlip,
              start: 'top top',
              end: isMobile ? '+=2500' : '+=4000',
              pin: true,
              pinSpacing: true,
              scrub: 0.5,
            },
          });

          // Cover flips
          cvTl.to(cvCover, { rotateY: -180, duration: 0.10, ease: 'power2.inOut' }, 0.02);
          if (!isMobile) {
            cvTl.to(cvBook, { height: 300, duration: 0.10, ease: 'power2.inOut' }, 0.02);
          }

          // Page 1
          cvTl.to(cvP1, { rotateY: -180, duration: 0.12, ease: 'power1.inOut' }, 0.14);
          // Page 2
          cvTl.to(cvP2, { rotateY: -180, duration: 0.12, ease: 'power1.inOut' }, 0.27);
          // Page 3
          cvTl.to(cvP3, { rotateY: -180, duration: 0.12, ease: 'power1.inOut' }, 0.40);
          // Page 4
          cvTl.to(cvP4, { rotateY: -180, duration: 0.12, ease: 'power1.inOut' }, 0.53);
          // Page 5
          cvTl.to(cvP5, { rotateY: -180, duration: 0.12, ease: 'power1.inOut' }, 0.66);

          // Book closes
          if (!isMobile) {
            cvTl.to(cvBook, { height: 320, duration: 0.10, ease: 'power2.inOut' }, 0.85);
          }

          // Track active card
          ScrollTrigger.create({
            trigger: cvFlip,
            start: 'top top',
            end: isMobile ? '+=2500' : '+=4000',
            scrub: 0.3,
            onUpdate: (self) => {
              const p = self.progress;
              if (p < 0.05) setActiveCvCard(-1);
              else if (p < 0.16) setActiveCvCard(0);
              else if (p < 0.29) setActiveCvCard(1);
              else if (p < 0.42) setActiveCvCard(2);
              else if (p < 0.55) setActiveCvCard(3);
              else if (p < 0.68) setActiveCvCard(4);
              else if (p < 0.85) setActiveCvCard(5);
              else setActiveCvCard(6);
            },
          });
        }

        // ── JOURNEY: Scroll-driven agenda — 2025 visible, scroll reveals 2026 ──
        const journeySection = journeyRef.current;
        if (journeySection) {
          const cards = journeySection.querySelectorAll<HTMLElement>('.journey-card');
          const yearDots = journeySection.querySelectorAll<HTMLElement>('.journey-year-dot');

          if (cards.length >= 2) {
            // Card 2 starts hidden below
            gsap.set(cards[1], { yPercent: 100, opacity: 0 });

            const jTl = gsap.timeline({
              scrollTrigger: {
                trigger: journeySection,
                start: 'top top',
                end: '+=200%',
                scrub: 0.5,
                pin: true,
                pinSpacing: true,
              },
            });

            // Hold 2025 so user can read
            jTl.to({}, { duration: 0.3 });

            // 2025 slides up and fades
            jTl.to(cards[0], { yPercent: -60, opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.3);

            // 2026 slides in from below
            jTl.to(cards[1], { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.4);

            // Hold 2026 so user can read
            jTl.to({}, { duration: 0.3 });

            // Update dots
            if (yearDots.length >= 2) {
              jTl.eventCallback('onUpdate', () => {
                const p = jTl.progress();
                yearDots[0].classList.toggle('active', p < 0.4);
                yearDots[0].classList.toggle('past', p >= 0.4);
                yearDots[1].classList.toggle('active', p >= 0.4);
              });
            }
          }
        }

        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.from(el, {
            y: 50, opacity: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
          });
        });

        // ── MISSION & VISION: Pinned stacking scroll ──
        const mvSection = mvRef.current;
        if (mvSection) {
          const missionPanel = mvSection.querySelector<HTMLElement>('.mv-mission');
          const visionPanel = mvSection.querySelector<HTMLElement>('.mv-vision');
          const panels = mvSection.querySelector<HTMLElement>('.mv-panels');
          const missionContent = mvSection.querySelectorAll<HTMLElement>('.mv-mission .mv-animate');
          const visionContent = mvSection.querySelectorAll<HTMLElement>('.mv-vision .mv-animate');

          if (missionPanel && visionPanel && panels) {
            // Set panels container height to fit one card
            const missionH = missionPanel.offsetHeight;
            gsap.set(panels, { height: missionH });

            // Vision starts below, hidden
            gsap.set(visionPanel, { yPercent: 110, opacity: 0 });
            gsap.set(visionContent, { y: 30, opacity: 0 });
            gsap.set(missionContent, { y: 30, opacity: 0 });

            const mvTl = gsap.timeline({
              scrollTrigger: {
                trigger: mvSection,
                start: 'top top',
                end: '+=300%',
                scrub: 0.5,
                pin: true,
                pinSpacing: true,
              },
            });

            // Phase 1: Mission content fades in
            mvTl.to(missionContent, { y: 0, opacity: 1, duration: 0.15, stagger: 0.04, ease: 'power2.out' }, 0.02);

            // Hold — let user read mission
            mvTl.to({}, { duration: 0.2 });

            // Phase 2: Mission shrinks & dims, Vision slides up from bottom
            mvTl.to(missionPanel, { scale: 0.92, opacity: 0.5, y: -20, duration: 0.3, ease: 'power2.inOut' }, 0.4);
            mvTl.to(visionPanel, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }, 0.42);

            // Phase 3: Vision content fades in
            mvTl.to(visionContent, { y: 0, opacity: 1, duration: 0.15, stagger: 0.04, ease: 'power2.out' }, 0.65);

            // Hold — let user read vision
            mvTl.to({}, { duration: 0.25 });
          }
        }

        gsap.utils.toArray<HTMLElement>('.reveal-stagger').forEach((container) => {
          gsap.from(container.children, {
            y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out',
            scrollTrigger: { trigger: container, start: 'top 85%', toggleActions: 'play none none none' },
          });
        });

        // Smart Tools wireframe→mockup peel
        const section = smartToolsRef.current;
        const mockup = laptopMockupRef.current;
        if (section && mockup) {
          gsap.set(mockup, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' });
          const tl = gsap.timeline({
            scrollTrigger: { trigger: section, start: 'top top', end: '+=200%', scrub: 0.5, pin: true, pinSpacing: true },
          });
          tl.to({}, { duration: 0.4 });
          tl.to(mockup, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 1, ease: 'none' }, 0.4);
          tl.to({}, { duration: 0.3 });
        }

        // ── HALF EARTH: Scroll-driven globe rotation above footer ──
        const earthSection = earthSectionRef.current;
        if (earthSection) {
          ScrollTrigger.create({
            trigger: earthSection,
            start: 'top top',
            end: '+=500%',
            scrub: 0.5,
            pin: true,
            pinSpacing: true,
            onUpdate: (self) => {
              setEarthProgress(self.progress);
            },
          });
        }

        ScrollTrigger.refresh();
      });
      return () => ctx.revert();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ background: '#000', overflow: 'hidden' }}>
      <style>{`
        /* ══════════════════════════════════════════════════
           PURE CSS 3D PARALLAX — "Looking Through a Window"
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

        /* ── Core Values 3D Book — EXACT copy of landing page CSS ── */
        .cv-book-scene { perspective: 1800px; max-width: 1000px; margin: 0 auto; display: flex; justify-content: center; align-items: center; padding: 0 40px; }
        .cv-book-3d { width: 280px; height: 320px; position: relative; transform-style: preserve-3d; transform: rotateY(-5deg) rotateX(2deg); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.18)) drop-shadow(0 8px 12px rgba(0,0,0,0.08)); margin-left: 280px; }
        .cv-book-cover { position: absolute; width: 100%; height: 100%; transform-style: preserve-3d; transform-origin: left center; z-index: 10; }
        .cv-book-cover-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 4px 20px 20px 4px; overflow: hidden; }
        .cv-book-cover-front { background: linear-gradient(160deg, #052047 0%, #083A85 40%, #0a4da3 70%, #1e5bb7 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; box-shadow: 4px 4px 20px rgba(0,0,0,0.3), inset -2px 0 8px rgba(0,0,0,0.2); }
        .cv-book-cover-front::before { content: ''; position: absolute; inset: 12px; border: 1.5px solid rgba(255,255,255,0.1); border-radius: 3px 12px 12px 3px; pointer-events: none; }
        .cv-book-cover-back { transform: rotateY(180deg); background: linear-gradient(160deg, #041a3a 0%, #062d5e 100%); box-shadow: -4px 4px 20px rgba(0,0,0,0.3); border-radius: 20px 4px 4px 20px; }
        .cv-book-back-cover { position: absolute; width: 100%; height: 100%; border-radius: 4px 20px 20px 4px; background: linear-gradient(160deg, #052047 0%, #083A85 40%, #0a4da3 100%); z-index: -1; box-shadow: 2px 4px 15px rgba(0,0,0,0.15); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
        .cv-book-back-cover::before { content: ''; position: absolute; inset: 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px 14px 14px 3px; pointer-events: none; }
        .cv-book-back-cover .back-logo { font-size: 20px; font-weight: 900; color: rgba(255,255,255,0.3); letter-spacing: 3px; text-transform: uppercase; }
        .cv-book-back-cover .back-tagline { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 8px; font-weight: 500; }
        .cv-book-page { position: absolute; width: 100%; height: 100%; transform-style: preserve-3d; transform-origin: left center; }
        .cv-book-page-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 4px 20px 20px 4px; overflow: hidden; }
        .cv-bp-front { background: #fff; display: flex; flex-direction: column; justify-content: center; padding: 36px 32px; box-shadow: 2px 2px 15px rgba(0,0,0,0.1), inset -2px 0 6px rgba(0,0,0,0.04); position: relative; }
        .cv-bp-front::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 30px; background: linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0.02), transparent); z-index: 2; pointer-events: none; border-radius: 4px 0 0 4px; }
        .cv-bp-front .bp-watermark { display: none; }
        .cv-bp-front .bp-text { width: 100%; position: relative; z-index: 1; }
        .cv-bp-front .bp-text .bp-num { display: none; }
        .cv-bp-front .bp-text h3 { font-size: 22px; font-weight: 900; color: #083A85; margin-bottom: 12px; line-height: 1.15; }
        .cv-bp-front .bp-text p { font-size: 13px; color: #64748b; line-height: 1.65; margin: 0; max-width: 280px; }
        .cv-bp-front .bp-text .bp-line { width: 40px; height: 3px; background: #083A85; border-radius: 2px; margin-bottom: 16px; opacity: 0.3; }
        .cv-bp-back { transform: rotateY(180deg); background: linear-gradient(135deg, #062d5e 0%, #083A85 50%, #0a4da3 100%); position: relative; box-shadow: -2px 2px 15px rgba(0,0,0,0.15); border-radius: 20px 4px 4px 20px; overflow: hidden; }
        .cv-bp-back .bp-back-num { font-size: 200px; font-weight: 900; color: rgba(255,255,255,0.15); position: absolute; bottom: -20px; right: 10px; line-height: 1; letter-spacing: -10px; pointer-events: none; }
        .cv-bp-back h4 { writing-mode: vertical-rl; font-size: 24px; font-weight: 900; color: rgba(255,255,255,0.8); position: absolute; left: 20px; top: 50%; transform: rotate(180deg); letter-spacing: 3px; text-transform: uppercase; margin: 0; }
        .cv-bp-back .bp-back-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; position: absolute; top: 20px; right: 20px; }
        .cv-bp-back p { font-size: 11px; color: rgba(255,255,255,0.35); position: absolute; top: 20px; left: 55px; right: 80px; line-height: 1.6; margin: 0; }
        .cv-book-page-edges { position: absolute; right: -3px; top: 8px; bottom: 8px; width: 6px; background: repeating-linear-gradient(to bottom, #e8e8e8 0px, #f5f5f5 1px, #e8e8e8 2px); border-radius: 0 2px 2px 0; z-index: -1; pointer-events: none; box-shadow: 1px 0 3px rgba(0,0,0,0.08); }
        .cv-book-spine { position: absolute; left: -6px; top: 0; bottom: 0; width: 14px; background: linear-gradient(to right, #041a3a, #052047, #062d5e); border-radius: 3px 0 0 3px; z-index: 11; box-shadow: -2px 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .cv-book-spine .spine-text { writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); font-size: 7px; font-weight: 800; color: rgba(255,255,255,0.25); letter-spacing: 2px; text-transform: uppercase; white-space: nowrap; }
        .cv-book-page::after { content: ''; position: absolute; top: 0; right: 0; width: 40px; height: 100%; background: linear-gradient(to left, rgba(0,0,0,0.05), transparent); border-radius: 0 16px 16px 0; pointer-events: none; opacity: 1; transition: opacity 0.4s; }
        /* KEY: Hide back faces of pages — only cover back face shows on the left */
        .cv-bp-back { visibility: hidden; }
        .cv-book-scroll-hint { text-align: center; margin-top: 14px; font-size: 13px; color: #94a3b8; font-weight: 500; }
        @media (max-width: 768px) {
          .cv-book-scene { padding: 0 16px; perspective: none !important; }
          .cv-book-3d { width: 85vw !important; max-width: 400px; height: 55vh; max-height: 500px; margin-left: 0 !important; transform: none !important; filter: none !important; }
          .cv-bp-front { padding: 28px 24px !important; }
          .cv-bp-front .bp-text h3 { font-size: 22px; }
          .cv-bp-front .bp-text p { font-size: 14px; max-width: 100% !important; }
          .cv-bp-front .bp-text .bp-line { width: 30px; height: 2px; }
          .cv-book-cover-front h2 { font-size: 20px; }
          .cv-book-cover-front .cover-sub { font-size: 10px; margin-bottom: 16px; }
          .cv-book-cover-front { padding: 28px 24px; }
          .cv-book-spine { display: none; }
          .cv-book-page-edges { display: none; }
          .cv-book-cover-back { visibility: hidden !important; }
          .cv-book-cover { z-index: 10 !important; }
          .cv-bp-front::before { width: 10px; }
          .cv-book-page-face { border-radius: 4px 12px 12px 4px; }
          .cv-book-cover-face { border-radius: 4px 12px 12px 4px; }
          .cv-book-back-cover { border-radius: 4px 12px 12px 4px; padding: 24px; }
          .cv-book-back-cover .back-logo { font-size: 14px; }
          .cv-book-back-cover .back-tagline { font-size: 9px; }
        }
        @media (max-width: 480px) {
          .cv-book-3d { width: 90vw !important; max-width: 320px; height: 50vh; max-height: 420px; }
          .cv-bp-front { padding: 24px 20px !important; }
          .cv-bp-front .bp-text h3 { font-size: 19px; }
          .cv-bp-front .bp-text p { font-size: 13px; line-height: 1.6; }
          .cv-book-cover-front h2 { font-size: 18px; }
          .cv-book-cover-front .cover-sub { font-size: 9px; }
          .cv-book-cover-front { padding: 22px 18px; }
        }

        /* ── Journey Agenda ── */
        .journey-agenda {
          position: relative;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          height: 480px;
          overflow: hidden;
        }
        .journey-card {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(32px, 4vw, 48px);
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          will-change: transform, opacity;
        }
        .journey-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 32px;
          right: 32px;
          height: 3px;
          border-radius: 0 0 3px 3px;
          background: linear-gradient(90deg, #083A85, #5b9bff);
        }
        .journey-timeline {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 28px;
          position: relative;
        }
        .journey-timeline::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 2px;
          background: #e2e8f0;
        }
        .journey-year-dot {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #e2e8f0;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          position: relative;
          z-index: 2;
          transition: all 0.4s ease;
        }
        .journey-year-dot.active {
          border-color: #083A85;
          color: #083A85;
          background: #eef2ff;
          transform: scale(1.15);
          box-shadow: 0 0 0 4px rgba(8,58,133,0.1);
        }
        .journey-year-dot.past {
          border-color: #083A85;
          background: #083A85;
          color: #fff;
        }
        @media (max-width: 768px) {
          .journey-agenda { height: 420px; }
          .journey-card { padding: 28px 24px; }
          .tm-row { grid-template-columns: 1fr !important; gap: 8px !important; }
          .smart-sidebar { display: none !important; }
          .smart-stats-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .journey-agenda { height: 380px; }
          .journey-card { padding: 20px 16px; }
        }

        /* ── Mission & Vision Pinned Stacking ── */
        .mv-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          padding: clamp(20px, 4vw, 40px) clamp(16px, 3vw, 24px);
          background: #f8fafc;
        }
        .mv-panels {
          position: relative;
          width: 100%;
          max-width: 680px;
        }
        .mv-mission, .mv-vision {
          background: #fff;
          border-radius: 20px;
          padding: clamp(36px, 5vw, 56px);
          border: 1px solid #e2e8f0;
          position: absolute;
          width: 100%;
          box-sizing: border-box;
          will-change: transform, opacity;
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        }
        .mv-mission {
          z-index: 1;
          top: 0;
        }
        .mv-vision {
          z-index: 2;
          top: 0;
        }
        @media (max-width: 768px) {
          .mv-panels { max-width: 100%; }
        }

        /* Cabin wall text: hidden until GSAP animates them in */
        .hero-text-item {
          opacity: 0;
          transform: translateY(30px);
        }
        /* Overlay text: visible by default on fullscreen window */
        .hero-overlay-text {
          opacity: 1;
        }

        /* Airplane window hero — mobile layout */
        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr !important; }
          .tm-row { grid-template-columns: auto 1fr !important; }
          .tm-row p { grid-column: 1 / -1 !important; }
          .flip-layout { flex-direction: column !important; text-align: center; }
          .journey-grid { grid-template-columns: 1fr !important; }
          .mv-grid { grid-template-columns: 1fr !important; }
          .smart-sidebar { display: none !important; }
          /* Stack text above/below the window on mobile */
          .par-group:first-child {
            flex-direction: column !important;
            padding: 40px 20px !important;
            gap: 28px !important;
          }
          .par-group:first-child .airplane-window {
            order: 0;
          }
          .par-group:first-child > div[class="reveal"],
          .par-group:first-child > div:not(.airplane-window):not([style*="position: absolute"]):not([style*="backgroundImage"]) {
            position: relative !important;
            inset: auto !important;
            max-width: 100% !important;
            text-align: center !important;
          }
        }
      `}</style>

      <div className="about-nav-wrapper">
        <Navbar />
      </div>

      <div>

        {/* ━━━ HERO: AIRPLANE WINDOW ━━━ */}
        <div ref={heroRef} className="par-group" style={{ height: '100vh', minHeight: 650, background: '#041e4f', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', visibility: 'hidden' }}>

          {/* Cabin wall — brand blue gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, #0a4a8a 0%, #083A85 30%, #052a5e 70%, #031b3d 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '4px 4px', opacity: 0.5 }} />

          {/* ── AIRPLANE WINDOW ── */}
          <div ref={windowRef} className="airplane-window" style={{ position: 'relative', width: 'clamp(240px, 30vw, 400px)', height: 'clamp(290px, 38vw, 500px)', flexShrink: 0, willChange: 'transform' }}>

            {/* Outer bezel — the thick plastic surround */}
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

            {/* Glass opening — the actual window you look through */}
            <div className="window-glass" style={{
              position: 'absolute', inset: 'clamp(28px, 4vw, 44px)',
              borderRadius: '44% 44% 40% 40% / 48% 48% 44% 44%',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 30px 8px rgba(0,0,0,0.3)',
            }}>
              {/* Scene visible through the window — video + overlay */}
              <video autoPlay muted loop playsInline poster="/camm.png"
                style={{ position: 'absolute', inset: '-10%', width: '120%', height: '120%', objectFit: 'cover', filter: 'brightness(0.35) saturate(1.2)' }}
              >
                <source src="/photographero.mp4" type="video/mp4" />
              </video>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,40,100,0.4) 0%, rgba(5,15,40,0.6) 100%)' }} />

              {/* Glass reflection — diagonal light streak */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 30%, transparent 50%, rgba(255,255,255,0.02) 80%, rgba(255,255,255,0.06) 100%)',
                pointerEvents: 'none',
              }} />
              {/* Secondary reflection arc */}
              <div style={{
                position: 'absolute', top: '5%', left: '10%', width: '35%', height: '25%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)',
                transform: 'rotate(-15deg)',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Inner shade groove — the small ridge where the shade slides */}
            <div style={{
              position: 'absolute',
              bottom: 'clamp(24px, 3.5vw, 38px)',
              left: 'clamp(36px, 5vw, 56px)',
              right: 'clamp(36px, 5vw, 56px)',
              height: 6,
              borderRadius: 3,
              background: 'linear-gradient(180deg, #808088, #a0a0a8)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
            }} />
          </div>

          {/* ── FULLSCREEN OVERLAY TEXT — visible when window fills screen, fades as it shrinks ── */}
          <div ref={el => { heroTextRefs.current[4] = el; }} className="hero-overlay-text" style={{
            position: 'absolute', inset: 0, zIndex: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SplitHoverText
              lines={['The Smart Way to Capture Life']}
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: 400,
                fontStyle: 'italic',
                fontSize: 'clamp(36px, 5.5vw, 72px)',
                lineHeight: 1.15,
                color: '#fff',
                textAlign: 'center' as const,
                margin: 0,
                textShadow: '0 2px 20px rgba(0,0,0,0.4)',
              }}
            />
          </div>

          {/* ── TEXT ON THE CABIN WALL ── */}

          {/* Top-left: brand name */}
          <div ref={el => { heroTextRefs.current[0] = el; }} className="hero-text-item" style={{ position: 'absolute', top: 'clamp(60px, 10vh, 120px)', left: 'clamp(24px, 5vw, 80px)', maxWidth: 'clamp(220px, 28vw, 400px)' }}>
            <h1 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(30px, 4.5vw, 56px)', lineHeight: 1.1, color: '#fff', margin: 0 }}>
              Amoria<br />Connekyt
            </h1>
          </div>

          {/* Top-right: label */}
          <div ref={el => { heroTextRefs.current[1] = el; }} className="hero-text-item" style={{ position: 'absolute', top: 'clamp(60px, 10vh, 120px)', right: 'clamp(24px, 5vw, 80px)' }}>
            <span style={{ fontSize: 'clamp(10px, 1.1vw, 14px)', fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>About Us</span>
          </div>

          {/* Bottom-left: description */}
          <div ref={el => { heroTextRefs.current[2] = el; }} className="hero-text-item" style={{ position: 'absolute', bottom: 'clamp(50px, 8vh, 100px)', left: 'clamp(24px, 5vw, 80px)', maxWidth: 'clamp(200px, 22vw, 300px)' }}>
            <p style={{ fontSize: 'clamp(11px, 1.1vw, 14px)', fontWeight: 400, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              A digital ecosystem connecting verified photographers and creative professionals with clients worldwide.
            </p>
          </div>

          {/* Bottom-right: slogan */}
          <div ref={el => { heroTextRefs.current[3] = el; }} className="hero-text-item" style={{ position: 'absolute', bottom: 'clamp(50px, 8vh, 100px)', right: 'clamp(24px, 5vw, 80px)', maxWidth: 'clamp(220px, 30vw, 420px)', textAlign: 'right' }}>
            <SplitHoverText
              lines={['The Smart Way to Capture Life']}
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontWeight: 400, fontSize: 'clamp(24px, 3.5vw, 48px)', lineHeight: 1.15, color: '#fff', margin: 0, textAlign: 'right' as const }}
            />
          </div>
        </div>

        {/* ━━━ TARGET MARKET — Editorial Typography ━━━ */}
        <div className="par-group">
          <div className="par-base about-section" style={{ background: '#fff' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>

              {/* Section header */}
              <div className="reveal" style={{ marginBottom: 'clamp(40px, 6vw, 70px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 2, background: '#083A85' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#083A85', letterSpacing: 2, textTransform: 'uppercase' }}>Who We Serve</span>
                </div>
                <h2 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.1, margin: 0, background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Our Target Market
                </h2>
              </div>

              {/* Three editorial rows */}
              <div className="reveal-stagger" style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { num: '01', title: 'Creative Professionals', desc: 'Photographers, videographers, and visual storytellers who want to expand their reach, build their brand, and connect with clients globally.' },
                  { num: '02', title: 'Event Organizers', desc: 'Wedding planners, corporate event managers, and celebration coordinators who need reliable, verified creative coverage for memorable occasions.' },
                  { num: '03', title: 'Families & Individuals', desc: 'Anyone wanting to preserve precious moments through professional photography and videography services they can trust.' },
                ].map((item, i) => (
                  <div key={i} className="tm-row" style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr 1.2fr',
                    gap: 'clamp(16px, 4vw, 48px)',
                    alignItems: 'baseline',
                    padding: 'clamp(24px, 3.5vw, 40px) 0',
                    borderTop: '1px solid #e2e8f0',
                  }}>
                    <span style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, color: '#083A85', opacity: 0.25, lineHeight: 1 }}>{item.num}</span>
                    <h3 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: 400, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{item.title}</h3>
                    <p style={{ fontSize: 'clamp(13px, 1.2vw, 15px)', color: '#64748b', lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ━━━ CORE VALUES — Exact copy of landing page flip book ━━━ */}
        <div ref={cvFlipRef} className="par-group" style={{ background: '#f8fafc', position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#083A85', letterSpacing: 2, textTransform: 'uppercase' }}>What Drives Us</span>
            <h2 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 400, lineHeight: 1.15, margin: '6px 0 0', background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Our Core Values
            </h2>
          </div>

          <div className="cv-book-scene">
            <div className="cv-book-3d" ref={cvBook3dRef}>
              {/* Spine */}
              <div className="cv-book-spine"><span className="spine-text">AMORIA CONNEKYT</span></div>
              {/* Page edges */}
              <div className="cv-book-page-edges" />

              {/* Back cover (bottom of stack) */}
              <div className="cv-book-back-cover">
                <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, textTransform: 'uppercase' }}>Amoria Connekyt</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8, fontWeight: 500 }}>The Smart Way to Capture Life</div>
              </div>

              {/* Page 5: Growth (bottom, z-index 1) */}
              <div className="cv-book-page" ref={cvPage5Ref} style={{ zIndex: 1 }}>
                <div className="cv-book-page-face cv-bp-front">
                  <span className="bp-watermark">05</span>
                  <div className="bp-text">
                    <h3>{coreValues[4].title}</h3>
                    <div className="bp-line" />
                    <p>{coreValues[4].desc}</p>
                  </div>
                </div>
                <div className="cv-book-page-face cv-bp-back">
                  <span className="bp-back-num">05</span>
                  <span className="bp-back-label">Value 05</span>
                  <h4>{coreValues[4].title}</h4>
                  <p>{coreValues[4].desc}</p>
                </div>
              </div>

              {/* Page 4: Wellness (z-index 2) */}
              <div className="cv-book-page" ref={cvPage4Ref} style={{ zIndex: 2 }}>
                <div className="cv-book-page-face cv-bp-front">
                  <span className="bp-watermark">04</span>
                  <div className="bp-text">
                    <h3>{coreValues[3].title}</h3>
                    <div className="bp-line" />
                    <p>{coreValues[3].desc}</p>
                  </div>
                </div>
                <div className="cv-book-page-face cv-bp-back">
                  <span className="bp-back-num">04</span>
                  <span className="bp-back-label">Value 04</span>
                  <h4>{coreValues[3].title}</h4>
                  <p>{coreValues[3].desc}</p>
                </div>
              </div>

              {/* Page 3: Excellence (z-index 3) */}
              <div className="cv-book-page" ref={cvPage3Ref} style={{ zIndex: 3 }}>
                <div className="cv-book-page-face cv-bp-front">
                  <span className="bp-watermark">03</span>
                  <div className="bp-text">
                    <h3>{coreValues[2].title}</h3>
                    <div className="bp-line" />
                    <p>{coreValues[2].desc}</p>
                  </div>
                </div>
                <div className="cv-book-page-face cv-bp-back">
                  <span className="bp-back-num">03</span>
                  <span className="bp-back-label">Value 03</span>
                  <h4>{coreValues[2].title}</h4>
                  <p>{coreValues[2].desc}</p>
                </div>
              </div>

              {/* Page 2: Trust (z-index 4) */}
              <div className="cv-book-page" ref={cvPage2Ref} style={{ zIndex: 4 }}>
                <div className="cv-book-page-face cv-bp-front">
                  <span className="bp-watermark">02</span>
                  <div className="bp-text">
                    <h3>{coreValues[1].title}</h3>
                    <div className="bp-line" />
                    <p>{coreValues[1].desc}</p>
                  </div>
                </div>
                <div className="cv-book-page-face cv-bp-back">
                  <span className="bp-back-num">02</span>
                  <span className="bp-back-label">Value 02</span>
                  <h4>{coreValues[1].title}</h4>
                  <p>{coreValues[1].desc}</p>
                </div>
              </div>

              {/* Page 1: Innovation (z-index 5, top) */}
              <div className="cv-book-page" ref={cvPage1Ref} style={{ zIndex: 5 }}>
                <div className="cv-book-page-face cv-bp-front">
                  <span className="bp-watermark">01</span>
                  <div className="bp-text">
                    <h3>{coreValues[0].title}</h3>
                    <div className="bp-line" />
                    <p>{coreValues[0].desc}</p>
                  </div>
                </div>
                <div className="cv-book-page-face cv-bp-back">
                  <span className="bp-back-num">01</span>
                  <span className="bp-back-label">Value 01</span>
                  <h4>{coreValues[0].title}</h4>
                  <p>{coreValues[0].desc}</p>
                </div>
              </div>

              {/* Cover (very top) */}
              <div className="cv-book-cover" ref={cvCoverRef}>
                <div className="cv-book-cover-face cv-book-cover-front">
                  <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 14 }}>Our Core<br />Values</h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 280, lineHeight: 1.6, marginBottom: 32 }}>The principles that guide everything we build at Amoria Connekyt.</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    <span>↓</span> Scroll to read
                  </div>
                </div>
                <div className="cv-book-cover-face cv-book-cover-back" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <span style={{ fontSize: 180, fontWeight: 900, color: 'rgba(255,255,255,0.1)', lineHeight: 1, letterSpacing: -8, marginBottom: -20 }}>
                    {activeCvCard >= 0 && activeCvCard < 5 ? `0${activeCvCard + 1}` : ''}
                  </span>
                  <h4 style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.85)', textAlign: 'center', margin: 0, padding: '0 24px', lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: 2 }}>
                    {activeCvCard >= 0 && activeCvCard < 5 && coreValues[activeCvCard].title}
                    {(activeCvCard === 5 || activeCvCard === 6) && 'Amoria Connekyt'}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━ JOURNEY — Scroll Agenda ━━━ */}
        <div ref={journeyRef} className="par-group" style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#083A85', letterSpacing: 2, textTransform: 'uppercase' }}>Our Journey</span>
            <h2 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(30px, 4.5vw, 48px)', fontWeight: 400, lineHeight: 1.15, margin: '8px 0 0', color: '#0f172a' }}>
              Journey of Progress <span style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>&amp; Possibility</span>
            </h2>
          </div>

          {/* Year dots timeline */}
          <div className="journey-timeline">
            {journeyMilestones.slice(0, 2).map((m, i) => (
              <div key={m.year} className={`journey-year-dot${i === 0 ? ' active' : ''}`}>
                {String(m.year).slice(2)}
              </div>
            ))}
          </div>

          {/* Agenda cards — stacked, one visible at a time */}
          <div className="journey-agenda">
            {journeyMilestones.slice(0, 2).map((card, i) => (
              <div key={card.year} className="journey-card">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#083A85', marginBottom: 20 }}>
                  <i className="bi bi-calendar-event" style={{ fontSize: 15 }} />
                  {card.year}
                  {card.year === currentYear && <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: '#10b981', padding: '3px 10px', borderRadius: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>Now</span>}
                </div>
                <h3 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, lineHeight: 1.25, margin: '0 0 18px', color: '#0f172a' }}>
                  {card.title} <span style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{card.highlight}</span>
                </h3>
                {card.paragraphs.map((p, j) => (
                  <p key={j} style={{ fontSize: 'clamp(14px, 1.3vw, 16px)', color: '#64748b', lineHeight: 1.75, margin: j < card.paragraphs.length - 1 ? '0 0 14px' : 0 }}>{p}</p>
                ))}
              </div>
            ))}
          </div>


        </div>

        {/* ━━━ MISSION & VISION — Split Panel Reveal ━━━ */}
        <div ref={mvRef} className="mv-section">
          <div className="mv-panels">

            {/* Mission — dark blue, appears first */}
            <div className="mv-mission">
              <div className="mv-animate" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <i className="bi bi-bullseye" style={{ fontSize: 16, color: '#083A85' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#083A85', letterSpacing: 2, textTransform: 'uppercase' }}>Mission</span>
              </div>
              <h3 className="mv-animate" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 400, margin: '0 0 20px', lineHeight: 1.15, background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Our Mission</h3>
              <p className="mv-animate" style={{ fontSize: 'clamp(14px, 1.3vw, 16px)', color: '#64748b', lineHeight: 1.75, margin: '0 0 28px' }}>
                To empower creators and communities through technology that connects people, promotes emotional wellness, and transforms creative work into meaningful global opportunities.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Simplify how clients find and hire verified photographers and videographers.', 'Help creators build trusted brands with fair ratings, secure payments, and smart tools.', 'Strengthen family and social bonds through shared memories that inspire joy and connection.'].map((item, i) => (
                  <li key={i} className="mv-animate" style={{ fontSize: 'clamp(13px, 1.2vw, 15px)', color: '#64748b', lineHeight: 1.65, paddingLeft: 'clamp(20px, 3vw, 28px)', position: 'relative' }}>
                    <i className="bi bi-check-circle-fill" style={{ position: 'absolute', left: 0, color: '#083A85', fontSize: 16 }} />{item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vision — white, slides in from right */}
            <div className="mv-vision">
              <div className="mv-animate" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <i className="bi bi-globe2" style={{ fontSize: 16, color: '#083A85' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#083A85', letterSpacing: 2, textTransform: 'uppercase' }}>Vision</span>
              </div>
              <h3 className="mv-animate" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 400, margin: '0 0 20px', lineHeight: 1.15, background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Our Vision</h3>
              <p className="mv-animate" style={{ fontSize: 'clamp(14px, 1.3vw, 16px)', color: '#64748b', lineHeight: 1.75, margin: '0 0 28px' }}>
                To become Africa&apos;s leading creative connection platform; a space where every memory matters, creativity meets opportunity, and technology fosters global emotional wellbeing.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Creative professionals thrive through fair digital economies.', 'Clients access trusted talent anywhere, anytime.', 'Memories become bridges that heal distance and celebrate humanity.'].map((item, i) => (
                  <li key={i} className="mv-animate" style={{ fontSize: 'clamp(13px, 1.2vw, 15px)', color: '#64748b', lineHeight: 1.65, paddingLeft: 'clamp(20px, 3vw, 28px)', position: 'relative' }}>
                    <i className="bi bi-check-circle-fill" style={{ position: 'absolute', left: 0, color: '#083A85', fontSize: 16 }} />{item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* ━━━ SMART TOOLS — Dashboard Mockup (static, brand colors) ━━━ */}
        <div className="par-group">
          <div className="par-base about-section" style={{ background: '#f0f4fa' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>

              <div className="reveal" style={{ textAlign: 'center', marginBottom: 'clamp(32px, 5vw, 50px)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#083A85', letterSpacing: 2, textTransform: 'uppercase' }}>Our Platform</span>
                <h2 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 'clamp(30px, 4.5vw, 48px)', fontWeight: 400, lineHeight: 1.15, margin: '10px 0 16px', background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Smart Tools for Creative Professionals
                </h2>
                <p style={{ fontSize: 'clamp(14px, 1.3vw, 16px)', color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                  Digital empowerment tools to manage projects, payments, and growth from one secure platform.
                </p>
              </div>

              {/* Dashboard mockup — brand colors */}
              <div className="reveal" style={{ maxWidth: 900, margin: '0 auto', borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 8px 40px rgba(8,58,133,0.08)' }}>
                {/* Browser bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28ca41' }} />
                  <div style={{ flex: 1, marginLeft: 16, background: '#fff', borderRadius: 6, padding: '6px 14px', fontSize: 12, color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                    app.amoriaconnekyt.com/dashboard
                  </div>
                </div>

                {/* Dashboard content */}
                <div style={{ display: 'flex', gap: 0, minHeight: 360 }}>
                  {/* Sidebar */}
                  <div className="smart-sidebar" style={{ width: 180, background: '#083A85', padding: '24px 16px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#5b9bff' }} />
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Amoria</span>
                    </div>
                    {['Dashboard', 'Portfolio', 'Bookings', 'Earnings', 'Settings'].map((item, i) => (
                      <div key={i} style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 4, background: i === 0 ? 'rgba(255,255,255,0.15)' : 'transparent', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'default' }}>{item}</div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div style={{ flex: 1, padding: 24 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <div>
                        <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Welcome Back</p>
                        <h3 style={{ color: '#0f172a', fontSize: 18, fontWeight: 600, margin: '4px 0 0' }}>Creative Studio</h3>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #5b9bff)' }} />
                    </div>

                    {/* Stats card */}
                    <div style={{ background: '#f8fafc', borderRadius: 14, padding: 22, marginBottom: 18, border: '1px solid #e2e8f0' }}>
                      <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 6px' }}>Total Earnings</p>
                      <h2 style={{ color: '#0f172a', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, margin: '0 0 4px' }}>$12,450.00</h2>
                      <p style={{ color: '#10b981', fontSize: 12, margin: 0 }}>+12.5% this month</p>
                    </div>

                    {/* Mini cards */}
                    <div className="smart-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { label: 'Active Jobs', value: '8', icon: 'bi-camera' },
                        { label: 'Completed', value: '124', icon: 'bi-check-circle' },
                        { label: 'Rating', value: '4.9', icon: 'bi-star' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <i className={`bi ${s.icon}`} style={{ fontSize: 20, color: '#083A85' }} />
                          <p style={{ color: '#0f172a', fontSize: 20, fontWeight: 600, margin: '8px 0 4px' }}>{s.value}</p>
                          <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>{s.label}</p>
                        </div>
                      ))}
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
                    <i className={`bi ${f.icon}`} style={{ fontSize: 16, color: '#083A85' }} />
                    <span style={{ color: '#64748b', fontSize: 14 }}>{f.text}</span>
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
          <div className="par-base about-section" style={{ padding: 'clamp(12px, 2vw, 16px)', background: '#fff' }}>
            <div className="reveal" style={{ position: 'relative', width: '100%', minHeight: 'clamp(350px, 50vw, 600px)', overflow: 'hidden', borderRadius: 24 }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/mock.png)', backgroundSize: 'cover', backgroundPosition: 'right center' }} />
              <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 80px) clamp(24px, 5vw, 60px)', display: 'flex', alignItems: 'center', minHeight: 'clamp(350px, 50vw, 600px)' }}>
                <div style={{ maxWidth: 520 }}>
                  <h2 style={{ fontSize: 'clamp(26px, 4vw, 50px)', fontWeight: 700, marginBottom: 18, color: '#fff', letterSpacing: '-0.02em' }}>Empowering creators to share their vision with the world.</h2>
                  <p style={{ fontSize: 'clamp(14px, 1.5vw, 17px)', fontWeight: 400, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>Amoria Connekyt is built for photographers and creatives ready to showcase their work and connect with clients. Create your profile today and get started.</p>
                  <a href="/user/auth/signup" style={{ display: 'inline-block', color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 32px', border: '2px solid #f5652c', borderRadius: 40, textDecoration: 'none', transition: 'all 0.3s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >Get Started</a>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* ── Half Earth — scroll-driven globe rotation ── */}
        <style>{`
          .earth-section { position: relative; width: 100%; height: 100dvh; background: linear-gradient(to bottom, #083A85 0%, #052047 60%, #052047 100%); overflow: hidden; }
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

          {/* Text content overlaying the globe */}
          <div className="earth-text">
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 64px)',
              fontWeight: 300,
              color: '#fff',
              letterSpacing: '-0.02em',
              marginBottom: 'clamp(10px, 2vw, 16px)',
              lineHeight: 1.1,
            }}>
              Born in Kigali, <span style={{ fontWeight: 700 }}>built for the world</span>
            </h2>
            <p style={{
              fontSize: 'clamp(13px, 1.5vw, 18px)',
              color: 'rgba(255,255,255,0.6)',
              maxWidth: 600,
              margin: '0 auto clamp(20px, 3vw, 32px)',
              lineHeight: 1.7,
              padding: '0 clamp(8px, 2vw, 0px)',
            }}>
              Connecting photographers and creatives across continents. From local talent to global stages one platform, limitless reach.
            </p>
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
                background: '#FF6B6B',
                border: 'none',
                borderRadius: 12,
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                pointerEvents: 'auto',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ff5252'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FF6B6B'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Get Started
            </a>
          </div>

          {/* Globe */}
          <div className="earth-globe-wrap">
            <HalfEarth
              height={1400}
              scrollProgress={earthProgress}
            />
          </div>
        </div>

        <div style={{ background: '#083A85' }}>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default About;
