 'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Footer from "./components/footer";
import Navbar from "./components/navbar";
import GlobalNetwork from "./components/GlobalNetwork";
import DotGrid from "./components/DotGrid";
// import Preloader from "./components/Preloader"; // Commented out - client requested no preloader
import { getPublicEvents } from '@/lib/APIs/public';
import { getStreamVideo } from '@/lib/APIs/streams/route';
import { getPhotographers } from '@/lib/APIs/photographers/get-photographers/route';
import TextType from './components/TextType';
import Lenis from 'lenis';
import { useLanguage } from './providers/LanguageProvider';
import domTranslationsData from '@/lib/domTranslations.json';

const domTranslations = domTranslationsData as unknown as Record<string, [string, string, string, string]>;

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const t = useTranslations();
  const { locale } = useLanguage();

  const getLangIdx = (l: string | null | undefined): 0 | 1 | 2 | 3 | null => {
    if (l === 'fr') return 0;
    if (l === 'es') return 1;
    if (l === 'rw') return 2;
    if (l === 'sw') return 3;
    return null;
  };

  const tl = (text: string): string => {
    if (!text || !locale || locale === 'en') return text;
    const idx = getLangIdx(locale);
    if (idx === null) return text;
    const direct = domTranslations[text]?.[idx];
    if (direct) return direct;
    const lower = text.toLowerCase().trim();
    for (const [k, v] of Object.entries(domTranslations)) {
      if (k.toLowerCase().trim() === lower && v[idx]) {
        return v[idx];
      }
    }
    return text;
  };

  const [hasLiveEvents, setHasLiveEvents] = useState(false);
  // Real platform stats fetched from public APIs - feed the hero trust strip
  // and the "Joined by N photographers" pill. null while loading; numbers
  // once the API responds (success or failure). Refreshed periodically.
  const [stats, setStats] = useState<{
    photographers: number | null;
    totalEvents: number | null;
    avgRating: number | null;
  }>({ photographers: null, totalEvents: null, avgRating: null });
  const [heroEventImages, setHeroEventImages] = useState<string[]>([]);
  const [heroEventSlide, setHeroEventSlide] = useState(0);
  const [heroSlideKey, setHeroSlideKey] = useState(0);
  const [activeCard, setActiveCard] = useState(0) // rated, 1: live, 2: pay, 3: gallery
  // (Manual mouse-tracking state for the dot patterns was removed - replaced with the
  // interactive DotGrid component which handles cursor tracking + GSAP InertiaPlugin internally.)
  const [heroMousePos, setHeroMousePos] = useState<{ x: number; y: number } | null>(null)
  const [howItWorksAutoScroll, setHowItWorksAutoScroll] = useState(false) // Auto-scroll flag (mobile-only)
  const [isMobile, setIsMobile] = useState(false)
  const networkSectionRef = useRef<HTMLElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)

  // Refs for How It Works section peel effect
  const howItWorksSectionRef = useRef<HTMLElement>(null)
  const forPhotographersRef = useRef<HTMLDivElement>(null)

  // Refs for mockups scroll peel effect
  const mockupsSectionRef = useRef<HTMLElement>(null)
  const mockupsContainerRef = useRef<HTMLDivElement>(null)

  // Ref for Why Amoria section peel effect
  const whyAmoriaSectionRef = useRef<HTMLElement>(null)

  const phoneRef = useRef<HTMLDivElement>(null)
  const tabletRef = useRef<HTMLDivElement>(null)
  const laptopRef = useRef<HTMLDivElement>(null)
  // Overlay refs for peel effect (covers devices initially)
  const phoneOverlayRef = useRef<HTMLDivElement>(null)
  const tabletOverlayRef = useRef<HTMLDivElement>(null)
  const laptopOverlayRef = useRef<HTMLDivElement>(null)
  // Heading text refs for mockup labels
  const phoneTextRef = useRef<HTMLDivElement>(null)
  const tabletTextRef = useRef<HTMLDivElement>(null)
  const laptopTextRef = useRef<HTMLDivElement>(null)
  // Mobile-only text refs - flow left→right above/below mockups during each phase
  const phoneMobileTextRef = useRef<HTMLDivElement>(null)
  const tabletMobileTextRef = useRef<HTMLDivElement>(null)
  const laptopMobileTextRef = useRef<HTMLDivElement>(null)
  // Preloader disabled - client requested no preloader (kept for future reuse)
  // const [showPreloader, setShowPreloader] = useState(() => {
  //   if (typeof window !== 'undefined') {
  //     const hasShownPreloader = sessionStorage.getItem('hasShownPreloader');
  //     return hasShownPreloader !== 'true';
  //   }
  //   return true;
  // })
  // const handlePreloaderComplete = () => {
  //   setShowPreloader(false)
  // }
  const showPreloader = false;

  // Mobile detection for carousel - enable auto-scroll only on mobile
  useEffect(() => {
    const checkMobileSize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      setHowItWorksAutoScroll(isMobileView); // Enable carousel only on mobile
    };

    checkMobileSize(); // Check on mount
    window.addEventListener('resize', checkMobileSize);
    return () => window.removeEventListener('resize', checkMobileSize);
  }, []);

  // Check whether any event has a live stream active (mirrors navbar logic)
  useEffect(() => {
    const checkLiveEvents = async () => {
      try {
        const res = await getPublicEvents({ size: 100 });
        if (!res.success || !res.data) return;
        // Collect event cover images for hero carousel - same filter as events page
        const allEvents = res.data.content;
        const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
        const visibleEvents = allEvents.filter(ev => {
          const isEnded = (ev.eventStatus || '').toUpperCase() === 'COMPLETED' || (ev as Record<string, unknown>).streamStatus === 'ended';
          if (!isEnded) return true;
          const dateStr = ev.updatedAt || ev.eventDate;
          if (!dateStr) return true;
          const ts = new Date(dateStr).getTime();
          if (isNaN(ts)) return true;
          return ts > twoDaysAgo;
        });
        const covers = visibleEvents
          .filter(ev => ev.eventPhoto)
          .map(ev => ev.eventPhoto as string)
          .slice(0, 8);
        if (covers.length > 0) setHeroEventImages(covers);

        const ongoingEvents = allEvents.filter(
          ev => (ev.eventStatus as string)?.toLowerCase() === 'ongoing' && (ev as Record<string, unknown>).streamStatus !== 'ended'
        );

        // (totalEvents already set above - defensive parse before any
        // downstream filter logic that might throw)

        // No ongoing events at all - clear the flag and bail
        if (ongoingEvents.length === 0) {
          setHasLiveEvents(false);
          return;
        }

        // Fast paths: hasLiveStream flag OR streamStatus signals live state
        let anyLive = ongoingEvents.some(ev => {
          if (ev.hasLiveStream === true) return true;
          const ss = ((ev as Record<string, unknown>).streamStatus || '') as string;
          return ss === 'live' || ss === 'started' || ss === 'streaming';
        });

        // Fallback: check Cloudflare connection status
        if (!anyLive) {
          const checks = await Promise.allSettled(
            ongoingEvents.map(ev => getStreamVideo(ev.id))
          );
          anyLive = checks.some(result => {
            if (result.status !== 'fulfilled' || !result.value.success) return false;
            const d = result.value.data as { data?: { connectionStatus?: string }; connectionStatus?: string };
            return (d?.data?.connectionStatus ?? d?.connectionStatus) === 'live';
          });
        }

        setHasLiveEvents(anyLive);
      } catch { /* silent - totalEvents handled by separate effect */ }
    };
    // Run immediately, then poll every 30s so streams that go live AFTER
    // the page loads also light up the EVENTS card pulse without needing
    // a refresh. Cleared on unmount to avoid memory leaks.
    checkLiveEvents();
    const liveInterval = setInterval(checkLiveEvents, 30000);
    return () => clearInterval(liveInterval);
  }, []);

  // ─── LENIS smooth scroll for the home page ──────────────────────────
  // The landing page has multiple heavy pinned/peeling ScrollTriggers
  // (Why Amoria → Mockups peel, How It Works steppers, Global Network,
  // mockup card stack). Native wheel/touch input arrives in chunky bursts,
  // making those pinned animations stutter. Lenis interpolates the scroll
  // input itself; ScrollTrigger and any ref-driven onUpdate handlers
  // receive an already-smoothed scroll position at 60fps - no React
  // re-renders, no choppy peel transitions.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // honor accessibility preference

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

    // Hand Lenis updates to ScrollTrigger so all pin/scrub timelines read
    // the smoothed scroll value Lenis is currently emitting.
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker - single rAF loop site-wide.
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

  // Fetch the FULL events count (upcoming + ongoing + completed) by
  // querying each status separately and summing their `totalElements`.
  // This avoids any default backend filter that might exclude historic
  // or completed events when called without a status parameter.
  useEffect(() => {
    const fetchTotalEventsCount = async () => {
      try {
        const statuses = ['UPCOMING', 'ONGOING', 'COMPLETED'];
        const results = await Promise.allSettled(
          statuses.map((status) => getPublicEvents({ size: 1, status }))
        );
        let sum = 0;
        let anyOk = false;
        for (const r of results) {
          if (r.status !== 'fulfilled' || !r.value.success || !r.value.data) continue;
          anyOk = true;
          const raw = r.value.data as unknown as {
            content?: unknown[]; events?: unknown[]; items?: unknown[];
            totalElements?: number; total?: number; totalCount?: number; count?: number;
          };
          const arr = raw.content ?? raw.events ?? raw.items ?? [];
          const n =
            (typeof raw.totalElements === 'number' && raw.totalElements >= 0) ? raw.totalElements
            : (typeof raw.total === 'number' && raw.total >= 0) ? raw.total
            : (typeof raw.totalCount === 'number' && raw.totalCount >= 0) ? raw.totalCount
            : (typeof raw.count === 'number' && raw.count >= 0) ? raw.count
            : arr.length;
          sum += Math.max(0, n);
        }
        if (anyOk) {
          setStats(prev => ({ ...prev, totalEvents: sum }));
        }
      } catch {
        // Silent - keep previous totalEvents value
      }
    };
    fetchTotalEventsCount();
    // Refresh once a minute so completed events also rack up
    const id = setInterval(fetchTotalEventsCount, 60000);
    return () => clearInterval(id);
  }, []);

  // Fetch photographer stats - total count + avg rating - for the hero
  // trust strip. Refreshes every 5 minutes; safe-fails to keep the UI
  // from breaking if the API is unreachable.
  useEffect(() => {
    const fetchPhotographerStats = async () => {
      try {
        const res = await getPhotographers({ size: 100 });
        if (!res.success || !res.data) {
          // API failed - set safe zeros so UI doesn't dangle on "-"
          setStats(prev => ({
            ...prev,
            photographers: prev.photographers ?? 0,
            avgRating: prev.avgRating ?? 0,
          }));
          return;
        }
        // The real backend response is Spring Boot pagination
        // ({ content, totalElements, totalPages }) - the TS interface in
        // the route.ts is outdated. Read both shapes defensively so we
        // work whichever the backend returns.
        const raw = res.data as unknown as {
          content?: Array<{ rating?: number; reviewCount?: number }>;
          photographers?: Array<{ rating?: number; reviewCount?: number }>;
          totalElements?: number;
          total?: number;
        };
        const list = raw.content ?? raw.photographers ?? [];
        const total = (typeof raw.totalElements === 'number' ? raw.totalElements
          : (typeof raw.total === 'number' ? raw.total : list.length));
        // Compute average rating from the sample (only count photographers
        // who have at least one review so newcomers don't drag it to 0).
        // Default to 5.0 (perfect) if no rated photographers yet - better
        // marketing optics for a platform with limited reviews.
        const rated = list.filter((p) => (p.reviewCount || 0) > 0 && (p.rating || 0) > 0);
        const avg = rated.length > 0
          ? rated.reduce((sum, p) => sum + (p.rating || 0), 0) / rated.length
          : 5.0;
        setStats(prev => ({
          ...prev,
          photographers: total,
          avgRating: Math.round(avg * 10) / 10,
        }));
      } catch {
        // Network error - keep previous values, but ensure they're never null
        setStats(prev => ({
          ...prev,
          photographers: prev.photographers ?? 0,
          avgRating: prev.avgRating ?? 0,
        }));
      }
    };
    fetchPhotographerStats();
    const statsInterval = setInterval(fetchPhotographerStats, 5 * 60 * 1000);
    return () => clearInterval(statsInterval);
  }, []);

  // Format helpers - abbreviate large numbers (5,000 → 5K), graceful "-"
  // while data is loading. Used by the hero trust strip + the "Joined by"
  // pill in the For Creators card.
  const fmtCount = (n: number | null): string => {
    if (n === null) return '-';
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K+`;
    if (n >= 100) return `${Math.floor(n / 10) * 10}+`;
    return String(n);
  };
  const fmtRating = (r: number | null): string => r === null ? '-' : r.toFixed(1);

  // Auto-slide hero event images carousel
  useEffect(() => {
    if (heroEventImages.length <= 1) return;
    const interval = setInterval(() => {
      setHeroEventSlide(prev => (prev + 1) % heroEventImages.length);
      setHeroSlideKey(prev => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroEventImages.length]);

  // Auto-rotation effect for Why Amoria Connekt cards - rotate every 3 seconds
  useEffect(() => {
    const cardInterval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 4)
    }, 3000)

    return () => clearInterval(cardInterval)
  }, [])


  // GSAP ScrollTrigger effect for mockups peel transitions + Why Amoria peel
  // Pinned section with scroll-scrubbed peel-mask animation
  // Includes Phase 4: Why Amoria section peels up over mockups section
  useEffect(() => {
    if (typeof window === 'undefined' || showPreloader) return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        const section = mockupsSectionRef.current;
        const whyAmoriaSection = whyAmoriaSectionRef.current;
        const phone = phoneRef.current;
        const tablet = tabletRef.current;
        const laptop = laptopRef.current;
        const phoneOverlay = phoneOverlayRef.current;
        const tabletOverlay = tabletOverlayRef.current;
        const laptopOverlay = laptopOverlayRef.current;
        const phoneText = phoneTextRef.current;
        const tabletText = tabletTextRef.current;
        const laptopText = laptopTextRef.current;
        const phoneMobileText = phoneMobileTextRef.current;
        const tabletMobileText = tabletMobileTextRef.current;
        const laptopMobileText = laptopMobileTextRef.current;

        if (!section || !phone || !tablet || !laptop || !phoneOverlay || !tabletOverlay || !laptopOverlay) return;

        // Set initial states for sequential reveal:
        // - All wireframe overlays fully cover their devices
        // - Tablet starts clipped at bottom (reveals bottom→top), laptop starts clipped at bottom
        gsap.set(phoneOverlay, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' });
        gsap.set(tabletOverlay, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' });
        gsap.set(laptopOverlay, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' });

        // Phone ready for peel, tablet starts clipped at bottom (reveals bottom→top), laptop starts clipped at bottom
        gsap.set(phone, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }); // Full rectangle
        gsap.set(tablet, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' }); // Clipped to bottom edge (invisible)
        gsap.set(laptop, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' }); // Clipped to bottom edge

        // Set initial states for heading texts - positioned below visible area, ready to scroll up
        if (phoneText) gsap.set(phoneText, { y: 300, opacity: 1 });
        if (tabletText) gsap.set(tabletText, { y: 300, opacity: 1 });
        if (laptopText) gsap.set(laptopText, { y: 300, opacity: 1 });
        // Mobile texts: start off-screen to the right, will flow left during their phase
        if (phoneMobileText) gsap.set(phoneMobileText, { xPercent: 110, opacity: 1 });
        if (tabletMobileText) gsap.set(tabletMobileText, { xPercent: 110, opacity: 1 });
        if (laptopMobileText) gsap.set(laptopMobileText, { xPercent: 110, opacity: 1 });

        // Set initial state for Why Amoria section - starts hidden
        if (whyAmoriaSection) {
          gsap.set(whyAmoriaSection, {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)'
          });
        }

        // Create a timeline for the scroll-driven peel animations
        // Sequential flow: wireframe → mockup → next wireframe → next mockup
        // Duration: 6.5 phases × 200% = 1300% total scroll distance
        gsap.set(section, { zIndex: 1 });

        const tl = gsap.timeline({
          defaults: {
            // Soft sine ease-out gives a "settling" feel on every clip
            // animation - much lovelier than pure linear scrubbing.
            ease: 'sine.inOut',
            // Force the GPU to handle the transform layer for every tween.
            force3D: true,
          },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=1300%',
            // Heavier scrub smoothing (was 0.5) - playback gently catches
            // up with the scroll wheel instead of snapping frame-by-frame.
            scrub: 1.2,
            pin: true,
            pinSpacing: true,
            // Pre-pin a frame ahead so iOS/older CPUs don't flicker.
            anticipatePin: 1,
            // Recompute pin coordinates whenever the layout reflows
            // (mobile address bars hide/show, fonts swap, etc.)
            invalidateOnRefresh: true,
            fastScrollEnd: true,
            preventOverlaps: true,
            // markers: true, // Uncomment for debugging
          }
        });

        // Phase 0: Container pinned, phone wireframe visible (position 0-0.5)
        // Reduced holding time - peeling starts sooner

        // Phase 1: Phone wireframe peels right→left to reveal phone mockup (position 0.5-1.5)
        tl.to(phoneOverlay, {
          clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
          duration: 1,
          /* ease inherited from timeline default (sine.inOut) */
        }, 0.5);
        // Phone text scrolls continuously from bottom to top (no fade, just scroll)
        if (phoneText) {
          tl.to(phoneText, {
            y: -300,
            duration: 1.8,
            /* ease inherited from timeline default (sine.inOut) */
          }, 0.5);
        }
        // Mobile phone text flows left→right during the same phase
        if (phoneMobileText) {
          tl.to(phoneMobileText, {
            xPercent: -110,
            duration: 1.8,
            /* ease inherited from timeline default (sine.inOut) */
          }, 0.5);
        }

        // Phase 2: Phone mockup peels bottom→top AND tablet reveals bottom→top (position 1.5-2.5)
        // Phone peels from bottom to top (top edge moves upward)
        tl.to(phone, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
          duration: 1,
          /* ease inherited from timeline default (sine.inOut) */
        }, 1.5);
        // Tablet reveals from bottom to top (top edge moves upward) - same direction as phone peel
        tl.to(tablet, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          duration: 1,
          /* ease inherited from timeline default (sine.inOut) */
        }, 1.5);

        // Phase 3: Tablet wireframe peels top→bottom to reveal tablet mockup (position 2.5-3.5)
        tl.to(tabletOverlay, {
          clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
          duration: 1,
          /* ease inherited from timeline default (sine.inOut) */
        }, 2.5);
        // Tablet text scrolls continuously from bottom to top (no fade, just scroll)
        if (tabletText) {
          tl.to(tabletText, {
            y: -300,
            duration: 1.8,
            /* ease inherited from timeline default (sine.inOut) */
          }, 2.5);
        }
        // Mobile tablet text flows left→right during the same phase
        if (tabletMobileText) {
          tl.to(tabletMobileText, {
            xPercent: -110,
            duration: 1.8,
            /* ease inherited from timeline default (sine.inOut) */
          }, 2.5);
        }

        // Phase 4: Tablet mockup peels bottom→top AND laptop reveals bottom→top simultaneously (position 3.5-4.5)
        // Tablet peels from bottom to top (clips upward)
        tl.to(tablet, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
          duration: 1,
          /* ease inherited from timeline default (sine.inOut) */
        }, 3.5);
        // Laptop reveals from bottom to top (expands upward) - in sync with tablet peel
        tl.to(laptop, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          duration: 1,
          /* ease inherited from timeline default (sine.inOut) */
        }, 3.5);

        // Phase 5: Laptop wireframe peels left→right to reveal laptop mockup (position 4.5-5.5)
        tl.to(laptopOverlay, {
          clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
          duration: 1,
          /* ease inherited from timeline default (sine.inOut) */
        }, 4.5);
        // Laptop text scrolls continuously from bottom to top (no fade, just scroll)
        if (laptopText) {
          tl.to(laptopText, {
            y: -300,
            duration: 1.8,
            /* ease inherited from timeline default (sine.inOut) */
          }, 4.5);
        }
        // Mobile laptop text flows left→right during the same phase
        if (laptopMobileText) {
          tl.to(laptopMobileText, {
            xPercent: -110,
            duration: 1.8,
            /* ease inherited from timeline default (sine.inOut) */
          }, 4.5);
        }

        // Phase 6: Why Amoria section reveals from top to bottom (position 5.5-6.5)
        if (whyAmoriaSection) {
          tl.to(whyAmoriaSection, {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            duration: 1,
            /* ease inherited from timeline default (sine.inOut) */
          }, 5.5);
        }

        ScrollTrigger.refresh();
      });

      return () => ctx.revert();
    }, 500);

    return () => clearTimeout(timer);
  }, [showPreloader]);

  // Note: Auto-scroll is now handled by pure CSS animation (carouselScroll)
  // No need for JavaScript state updates - they interrupt the smooth CSS animation loop

  // NOTE: How It Works to Mockups peel transition disabled for now
  // The original request was to have How It Works scroll normally and reveal mockups behind it
  // This needs a different approach - possibly wrapping both sections in a container

  // Mouse handlers for the dot-pattern spotlight effect were removed -
  // the DotGrid component handles all cursor tracking internally.

  return (
    <>
      {/* Preloader disabled - client requested no preloader (kept for future reuse)
      {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}
      */}

      {/* Show main content only after preloader is complete */}
      {!showPreloader && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Navbar - Outside sections to stay fixed */}
          <Navbar />

        <main style={{ flex: 1, position: 'relative' }}>
        <style jsx>{`
          /* Seamless one-way marquee - steps are duplicated, so reset at -300vw is invisible */
          @keyframes carouselScroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-300vw); }
          }

          /* Rope flow animation */
          @keyframes ropeFlow {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -100px; }
          }

          /* ─── Mockups section innovations ─────────────────────────────
             Smoothness comes from GPU-accelerated transforms + will-change
             on every animated element. Ambient layers (halos, particles,
             dot-grid) live on z-index 0–1 and never animate clip-path so
             they never compete with the device peel for compositor time. */

          /* Force GPU compositing on every animated mockup layer so the
             scrubbed clip-path animations stay buttery on lower-end CPUs */
          .device-phone,
          .device-tablet,
          .device-laptop,
          .mockups-inner > div[ref]  {
            will-change: clip-path, transform;
            backface-visibility: hidden;
            transform: translateZ(0);
          }

          /* Drifting brand-blue halos behind the devices */
          .mockups-halo {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
            z-index: 0;
            filter: blur(80px);
            opacity: 0.45;
            mix-blend-mode: screen;
            will-change: transform, opacity;
          }
          .mockups-halo--a {
            top: -120px;
            left: 10%;
            width: 480px;
            height: 480px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.55) 0%, rgba(59, 130, 246, 0.18) 50%, rgba(59, 130, 246, 0) 80%);
            animation: mockups-halo-drift 18s ease-in-out infinite;
          }
          .mockups-halo--b {
            bottom: -100px;
            right: 8%;
            width: 420px;
            height: 420px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.40) 0%, rgba(255, 107, 107, 0.15) 50%, rgba(255, 107, 107, 0) 80%);
            animation: mockups-halo-drift 22s ease-in-out infinite reverse;
            animation-delay: -6s;
          }
          @keyframes mockups-halo-drift {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50%      { transform: translate3d(40px, -30px, 0) scale(1.10); }
          }

          /* Floating particles - small dots drifting across the bg */
          .mockups-particle {
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            box-shadow: 0 0 12px rgba(96, 165, 250, 0.85);
            pointer-events: none;
            z-index: 1;
            opacity: 0.65;
            will-change: transform, opacity;
          }
          .mockups-particle--1 { top: 18%; left: 8%;  animation: mockups-particle-float 7s ease-in-out infinite; }
          .mockups-particle--2 { top: 65%; left: 14%; width: 4px; height: 4px; animation: mockups-particle-float 9s ease-in-out infinite; animation-delay: -2s; }
          .mockups-particle--3 { top: 30%; right: 12%; width: 5px; height: 5px; animation: mockups-particle-float 8s ease-in-out infinite; animation-delay: -4s; background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%); box-shadow: 0 0 12px rgba(167, 139, 250, 0.80); }
          .mockups-particle--4 { top: 78%; right: 20%; width: 4px; height: 4px; animation: mockups-particle-float 10s ease-in-out infinite; animation-delay: -1.5s; }
          .mockups-particle--5 { top: 50%; left: 50%; width: 5px; height: 5px; animation: mockups-particle-float 11s ease-in-out infinite; animation-delay: -3.5s; background: linear-gradient(135deg, #fb923c 0%, #f43f5e 100%); box-shadow: 0 0 12px rgba(251, 146, 60, 0.70); }
          @keyframes mockups-particle-float {
            0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.40; }
            50%      { transform: translate3d(20px, -30px, 0); opacity: 1.00; }
          }

          /* Soft dot grid for tactile depth - masked to fade at edges */
          .mockups-grid {
            position: absolute;
            inset: 0;
            background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1.5px);
            background-size: 26px 26px;
            mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 90%);
            -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 90%);
            opacity: 0.55;
            pointer-events: none;
            z-index: 0;
          }

          /* Reduced motion - calm everything */
          @media (prefers-reduced-motion: reduce) {
            .mockups-halo,
            .mockups-particle {
              animation: none !important;
            }
          }

          /* ─── Why Amoria section innovations ───────────────────────── */

          /* Eyebrow pill above the title - matches the rest of the page */
          .wa-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            padding: 6px 14px 6px 11px;
            margin-bottom: 18px;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.10) 0%, rgba(255, 99, 99, 0.08) 100%);
            border: 1px solid rgba(8, 58, 133, 0.20);
            border-radius: 999px;
            font-family: 'Pragati Narrow', sans-serif;
            font-size: 11.5px;
            font-weight: 800;
            color: #083A85;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px -4px rgba(8, 58, 133, 0.30);
          }
          .wa-eyebrow-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: linear-gradient(135deg, #083A85 0%, #FF6363 100%);
            box-shadow: 0 0 10px rgba(8, 58, 133, 0.65);
            animation: wa-eyebrow-pulse 1.6s ease-in-out infinite;
          }
          @keyframes wa-eyebrow-pulse {
            0%, 100% { transform: scale(1); }
            50%      { transform: scale(1.30); }
          }
          .wa-eyebrow-spark {
            font-size: 12px;
            line-height: 1;
            animation: wa-eyebrow-twinkle 2.4s ease-in-out infinite;
          }
          @keyframes wa-eyebrow-twinkle {
            0%, 100% { opacity: 0.55; transform: rotate(0deg); }
            50%      { opacity: 1.00; transform: rotate(20deg); }
          }

          /* Animated brand-blue accent line below the title */
          .wa-accent-line {
            position: relative;
            height: 4px;
            width: 96px;
            margin: -6px auto 22px;
            border-radius: 999px;
            overflow: hidden;
            background: rgba(8, 58, 133, 0.12);
          }
          .wa-accent-line span {
            display: block;
            width: 50%;
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #083A85 0%, #3b82f6 50%, #7763FF 100%);
            animation: wa-accent-sweep 2.6s ease-in-out infinite;
          }
          @keyframes wa-accent-sweep {
            0%   { transform: translateX(-110%); }
            50%  { transform: translateX(110%); }
            100% { transform: translateX(110%); }
          }

          /* Drifting brand halos - soft blurred glows */
          .wa-halo {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
            z-index: 0;
            filter: blur(70px);
            opacity: 0.50;
            mix-blend-mode: multiply;
            will-change: transform;
          }
          .wa-halo--a {
            top: -120px;
            left: 5%;
            width: 460px;
            height: 460px;
            background: radial-gradient(circle, rgba(8, 58, 133, 0.30) 0%, rgba(59, 130, 246, 0.12) 50%, rgba(59, 130, 246, 0) 80%);
            animation: wa-halo-drift 18s ease-in-out infinite;
          }
          .wa-halo--b {
            bottom: -100px;
            right: 5%;
            width: 420px;
            height: 420px;
            background: radial-gradient(circle, rgba(119, 99, 255, 0.22) 0%, rgba(255, 99, 99, 0.10) 50%, rgba(255, 99, 99, 0) 80%);
            animation: wa-halo-drift 22s ease-in-out infinite reverse;
            animation-delay: -6s;
          }
          @keyframes wa-halo-drift {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50%      { transform: translate3d(40px, -30px, 0) scale(1.10); }
          }

          /* Floating sparkle particles */
          .wa-particle {
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            box-shadow: 0 0 12px rgba(96, 165, 250, 0.85);
            pointer-events: none;
            z-index: 1;
            opacity: 0.55;
            will-change: transform, opacity;
          }
          .wa-particle--1 { top: 10%; left: 18%; animation: wa-particle-float 7s ease-in-out infinite; }
          .wa-particle--2 { top: 22%; right: 14%; width: 4px; height: 4px; animation: wa-particle-float 9s ease-in-out infinite; animation-delay: -2s; background: linear-gradient(135deg, #a78bfa 0%, #7763FF 100%); box-shadow: 0 0 12px rgba(167, 139, 250, 0.80); }
          .wa-particle--3 { top: 70%; left: 12%; width: 5px; height: 5px; animation: wa-particle-float 8s ease-in-out infinite; animation-delay: -4s; }
          .wa-particle--4 { bottom: 12%; right: 22%; width: 4px; height: 4px; animation: wa-particle-float 10s ease-in-out infinite; animation-delay: -1.5s; background: linear-gradient(135deg, #fb923c 0%, #FF6363 100%); box-shadow: 0 0 12px rgba(251, 146, 60, 0.70); }
          .wa-particle--5 { top: 50%; right: 8%; width: 5px; height: 5px; animation: wa-particle-float 11s ease-in-out infinite; animation-delay: -3.5s; }
          @keyframes wa-particle-float {
            0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.40; }
            50%      { transform: translate3d(20px, -30px, 0); opacity: 1.00; }
          }

          /* ─── Global Network section spices ────────────────────────── */

          .gn-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            padding: 6px 14px 6px 11px;
            margin-bottom: 18px;
            background: rgba(0, 232, 255, 0.10);
            border: 1px solid rgba(0, 232, 255, 0.32);
            border-radius: 999px;
            font-family: 'Pragati Narrow', sans-serif;
            font-size: 11.5px;
            font-weight: 800;
            color: #00E8FF;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 4px 14px -4px rgba(0, 232, 255, 0.40);
          }
          .gn-eyebrow-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #ef4444;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.85);
            animation: gn-eyebrow-pulse 1.4s ease-in-out infinite;
          }
          @keyframes gn-eyebrow-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50%      { transform: scale(1.30); opacity: 0.55; }
          }
          .gn-eyebrow-spark {
            font-size: 12px;
            line-height: 1;
            animation: gn-eyebrow-twinkle 2.4s ease-in-out infinite;
            color: #00E8FF;
          }
          @keyframes gn-eyebrow-twinkle {
            0%, 100% { opacity: 0.55; transform: rotate(0deg); }
            50%      { opacity: 1.00; transform: rotate(20deg); }
          }

          /* Floating cyan particles drifting across the dark space */
          .gn-particle {
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFFFFF 0%, #00E8FF 100%);
            box-shadow: 0 0 14px rgba(0, 232, 255, 0.85);
            pointer-events: none;
            z-index: 1;
            opacity: 0.55;
            will-change: transform, opacity;
          }
          .gn-particle--1 { top: 14%; left: 28%; animation: gn-particle-float 8s ease-in-out infinite; }
          .gn-particle--2 { top: 70%; left: 18%; width: 4px; height: 4px; animation: gn-particle-float 11s ease-in-out infinite; animation-delay: -3s; }
          .gn-particle--3 { top: 22%; right: 28%; width: 5px; height: 5px; animation: gn-particle-float 9s ease-in-out infinite; animation-delay: -2s; }
          .gn-particle--4 { top: 60%; right: 16%; width: 4px; height: 4px; animation: gn-particle-float 10s ease-in-out infinite; animation-delay: -5s; }
          .gn-particle--5 { top: 40%; left: 50%; width: 3px; height: 3px; animation: gn-particle-float 12s ease-in-out infinite; animation-delay: -1.5s; }
          .gn-particle--6 { top: 85%; right: 40%; width: 4px; height: 4px; animation: gn-particle-float 9.5s ease-in-out infinite; animation-delay: -4s; }
          @keyframes gn-particle-float {
            0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.40; }
            50%      { transform: translate3d(20px, -30px, 0); opacity: 1.00; }
          }

          /* Compass coordinate ornament - top-left corner of section */
          .gn-compass {
            position: absolute;
            top: 26px;
            left: 26px;
            width: 78px;
            height: 78px;
            opacity: 0.85;
            z-index: 2;
            pointer-events: none;
            will-change: transform;
          }
          .gn-compass svg { width: 100%; height: 100%; display: block; animation: gn-compass-spin 60s linear infinite; }
          @keyframes gn-compass-spin {
            to { transform: rotate(360deg); }
          }

          /* Live network stats chips below CTAs */
          .gn-stats {
            display: flex;
            gap: 18px;
            margin-top: 28px;
            padding-top: 20px;
            border-top: 1px dashed rgba(255, 255, 255, 0.18);
            flex-wrap: wrap;
          }
          .gn-stat {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-family: 'Pragati Narrow', sans-serif;
          }
          .gn-stat-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00E8FF;
            box-shadow: 0 0 10px rgba(0, 232, 255, 0.85);
            animation: gn-stat-blink 1.6s ease-in-out infinite;
          }
          .gn-stat:nth-child(2) .gn-stat-dot { animation-delay: -0.5s; background: #60a5fa; box-shadow: 0 0 10px rgba(96, 165, 250, 0.85); }
          .gn-stat:nth-child(3) .gn-stat-dot { animation-delay: -1s; background: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.85); }
          @keyframes gn-stat-blink {
            0%, 100% { opacity: 1; }
            50%      { opacity: 0.40; }
          }
          .gn-stat > div {
            display: flex;
            flex-direction: column;
            line-height: 1.10;
          }
          .gn-stat strong {
            font-size: 18px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.01em;
          }
          .gn-stat span:not(.gn-stat-dot) {
            font-size: 11px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.65);
            text-transform: uppercase;
            letter-spacing: 0.10em;
            margin-top: 2px;
          }

          @media (max-width: 768px) {
            .gn-compass { top: 14px; left: 14px; width: 50px; height: 50px; }
            .gn-eyebrow { font-size: 10px; padding: 5px 12px 5px 10px; }
            .gn-stats { gap: 14px; justify-content: center; margin-top: 22px; padding-top: 16px; }
            .gn-stat strong { font-size: 16px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .gn-eyebrow-dot,
            .gn-eyebrow-spark,
            .gn-particle,
            .gn-compass svg,
            .gn-stat-dot {
              animation: none !important;
            }
          }

          /* ─── Why Amoria SECTION-LEVEL spices ──────────────────────── */

          /* Center backdrop crest - concentric dashed circles behind the
             dashboard area. Slowly counter-rotate for a "platform pulse" */
          .wa-crest {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 720px;
            height: 720px;
            margin: -360px 0 0 -360px;
            pointer-events: none;
            z-index: 0;
            opacity: 0.85;
          }
          .wa-crest-ring {
            transform-origin: 300px 300px;
            will-change: transform;
          }
          .wa-crest-ring--outer { animation: wa-crest-spin 60s linear infinite; }
          .wa-crest-ring--mid   { animation: wa-crest-spin 80s linear infinite reverse; }
          .wa-crest-ring--inner { animation: wa-crest-spin 50s linear infinite; }
          @keyframes wa-crest-spin {
            to { transform: rotate(360deg); }
          }

          /* Geometric corner ornaments - slowly rotate brand glyphs */
          .wa-corner {
            position: absolute;
            width: 56px;
            height: 56px;
            opacity: 0.55;
            pointer-events: none;
            z-index: 1;
            will-change: transform;
          }
          .wa-corner svg { width: 100%; height: 100%; display: block; }
          .wa-corner--tl { top: 7%;    left: 4%;  animation: wa-corner-spin 24s linear infinite; }
          .wa-corner--tr { top: 11%;   right: 4%; animation: wa-corner-spin 30s linear infinite reverse; }
          .wa-corner--bl { bottom: 9%; left: 5%;  animation: wa-corner-spin 28s linear infinite; }
          .wa-corner--br { bottom: 7%; right: 4%; animation: wa-corner-spin 26s linear infinite reverse; }
          @keyframes wa-corner-spin {
            to { transform: rotate(360deg); }
          }

          /* Promise marquee - continuous scroll of brand promises */
          .wa-marquee {
            position: relative;
            margin-top: 100px;
            padding: 16px 0;
            overflow: hidden;
            border-top: 1px solid rgba(8, 58, 133, 0.10);
            border-bottom: 1px solid rgba(8, 58, 133, 0.10);
            background: linear-gradient(180deg, rgba(8, 58, 133, 0.02) 0%, rgba(255, 255, 255, 0) 50%, rgba(8, 58, 133, 0.02) 100%);
            mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
            -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
            z-index: 2;
          }
          .wa-marquee-track {
            display: flex;
            align-items: center;
            gap: 48px;
            width: max-content;
            animation: wa-marquee-slide 38s linear infinite;
            will-change: transform;
          }
          @keyframes wa-marquee-slide {
            from { transform: translate3d(0, 0, 0); }
            to   { transform: translate3d(-50%, 0, 0); }
          }
          .wa-marquee-item {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-family: 'Pragati Narrow', sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: #083A85;
            white-space: nowrap;
            letter-spacing: 0.02em;
            flex-shrink: 0;
          }
          .wa-marquee-item i {
            font-size: 16px;
            color: #3b82f6;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.10) 0%, rgba(59, 130, 246, 0.06) 100%);
            border: 1px solid rgba(8, 58, 133, 0.18);
            border-radius: 8px;
            width: 28px;
            height: 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px -2px rgba(8, 58, 133, 0.25);
          }
          /* Pause marquee on hover (lets users read items) */
          .wa-marquee:hover .wa-marquee-track { animation-play-state: paused; }

          @media (max-width: 768px) {
            .wa-crest { width: 480px; height: 480px; margin: -240px 0 0 -240px; }
            .wa-corner { width: 38px; height: 38px; }
            .wa-marquee { margin-top: 60px; }
            .wa-marquee-item { font-size: 12.5px; gap: 8px; }
            .wa-marquee-item i { font-size: 14px; width: 24px; height: 24px; }
            .wa-marquee-track { gap: 36px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .wa-crest-ring,
            .wa-corner,
            .wa-marquee-track {
              animation: none !important;
            }
          }

          /* ─── Why Amoria card enhancements ─────────────────────────── */
          .why-amoria-card {
            transform-origin: center;
            position: absolute; /* preserve original positioning */
            isolation: isolate;
          }

          /* Top-edge gradient accent stripe - different palette per card */
          .why-amoria-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            border-radius: inherit;
            background: linear-gradient(90deg, transparent 0%, #083A85 25%, #3b82f6 50%, #083A85 75%, transparent 100%);
            opacity: 0;
            transition: opacity 320ms ease;
            z-index: 5;
            pointer-events: none;
          }
          .why-amoria-card:hover::before { opacity: 1; }

          /* Variant accent palettes per card (matches the connection-loop colors) */
          .why-amoria-card-large::before {
            background: linear-gradient(90deg, transparent 0%, #083A85 25%, #3b82f6 50%, #083A85 75%, transparent 100%);
          }
          .why-amoria-card-medium::before {
            background: linear-gradient(90deg, transparent 0%, #1d4ed8 25%, #60a5fa 50%, #1d4ed8 75%, transparent 100%);
          }
          .why-amoria-card-small::before {
            background: linear-gradient(90deg, transparent 0%, #dc2626 25%, #ef4444 50%, #dc2626 75%, transparent 100%);
          }
          .why-amoria-card-base::before {
            background: linear-gradient(90deg, transparent 0%, #047857 25%, #10b981 50%, #047857 75%, transparent 100%);
          }

          /* Sparkle corner badge - appears on hover */
          .why-amoria-card::after {
            content: '✦';
            position: absolute;
            top: 12px;
            right: 14px;
            font-size: 16px;
            line-height: 1;
            color: #3b82f6;
            opacity: 0;
            transform: scale(0.5) rotate(-90deg);
            transition: opacity 360ms cubic-bezier(0.34, 1.56, 0.64, 1),
                        transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
            text-shadow: 0 0 8px rgba(59, 130, 246, 0.65);
            pointer-events: none;
            z-index: 6;
          }
          .why-amoria-card:hover::after {
            opacity: 0.85;
            transform: scale(1) rotate(0deg);
          }
          .why-amoria-card-small::after { color: #ef4444; text-shadow: 0 0 8px rgba(239, 68, 68, 0.65); }
          .why-amoria-card-base::after  { color: #10b981; text-shadow: 0 0 8px rgba(16, 185, 129, 0.65); }

          /* Hover lift + brand-blue glow */
          .why-amoria-card:hover {
            box-shadow:
              0 32px 70px -16px rgba(8, 58, 133, 0.32),
              0 0 0 1px rgba(96, 165, 250, 0.24),
              0 0 60px -10px rgba(59, 130, 246, 0.30) !important;
          }

          /* Card images - subtle zoom on hover for depth */
          .why-amoria-card img {
            transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1), filter 320ms ease;
            will-change: transform;
          }
          .why-amoria-card:hover img {
            transform: scale(1.06);
            filter: saturate(1.10) brightness(1.02);
          }

          /* Card titles - subtle gradient accent on hover */
          .why-amoria-card h3 {
            transition: background 280ms ease, color 280ms ease, transform 280ms ease;
            background: linear-gradient(90deg, #083A85 0%, #083A85 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: #083A85;
          }
          .why-amoria-card:hover h3 {
            background: linear-gradient(90deg, #083A85 0%, #3b82f6 50%, #7763FF 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            transform: translateX(2px);
          }

          /* Image wrapper - soft gradient overlay reveal on hover */
          .why-amoria-card img + div,
          .why-amoria-card div[style*="overflow: hidden"] {
            position: relative;
          }
          .why-amoria-card div[style*="overflow: hidden"]::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, transparent 60%, rgba(8, 58, 133, 0.22) 100%);
            opacity: 0;
            transition: opacity 320ms ease;
            pointer-events: none;
            z-index: 1;
          }
          .why-amoria-card:hover div[style*="overflow: hidden"]::after {
            opacity: 1;
          }

          /* Reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .why-amoria-card,
            .why-amoria-card::before,
            .why-amoria-card::after,
            .why-amoria-card img,
            .why-amoria-card h3 {
              transition: none !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .wa-eyebrow-dot,
            .wa-eyebrow-spark,
            .wa-accent-line span,
            .wa-halo,
            .wa-particle {
              animation: none !important;
            }
          }

          /* Mobile mockup flowing text - scroll-driven horizontal flow per mockup */
          .mobile-mockup-text {
            display: none;
          }
          @media (max-width: 768px) {
            .mobile-mockup-text {
              display: block;
              position: absolute;
              left: 0;
              right: 0;
              width: 100%;
              text-align: center;
              white-space: nowrap;
              z-index: 5;
              pointer-events: none;
              font-size: 34px;
              font-weight: 800;
              line-height: 1.1;
              background: linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              will-change: transform;
            }
            .mobile-mockup-text--top { bottom: calc(50% + 270px); }
            .mobile-mockup-text--bottom { top: calc(50% + 270px); }
          }

          /* Desktop styles - static row, no carousel */
          @media (min-width: 769px) {
            .how-it-works-steps {
              flex-direction: row !important;
              flex-wrap: nowrap !important;
              overflow: visible !important;
              animation: none !important;
            }
            .how-it-works-steps > div {
              min-width: auto !important;
              flex-shrink: 1 !important;
              flex: 1 !important;
            }
            .how-it-works-steps .step-duplicate {
              display: none !important;
            }
            .how-it-works-steps > div::before,
            .how-it-works-steps > div::after {
              display: none !important;
            }
            .how-it-works-dots { display: none !important; }
            .how-it-works-svg { display: block !important; visibility: visible !important; position: absolute !important; width: 76% !important; height: 950px !important; }
            .carousel-rope { display: none !important; }
          }

          @media (max-width: 768px) {
            #how-it-works > div > div {
              max-width: 100% !important;
              padding: 0 !important;
              overflow: visible !important;
            }

            .how-it-works-steps {
              width: 100vw !important;
              max-width: none !important;
              height: auto !important;
              min-height: 600px !important;
              overflow: hidden !important;
              display: flex !important;
              align-items: stretch !important;
              gap: 0 !important;
              position: relative !important;
              left: 50% !important;
              right: 50% !important;
              margin-left: -50vw !important;
              margin-right: -50vw !important;
            }

            .how-it-works-steps > div {
              width: 100vw !important;
              max-width: 100vw !important;
              min-width: 100vw !important;
              flex: 0 0 100vw !important;
              flex-shrink: 0 !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 20px !important;
              gap: 0 !important;
            }

            .how-it-works-steps > svg {
              display: none !important;
            }

            .hero-content { flex-direction: column !important; padding: 20px 15px 20px !important; min-height: auto !important; gap: 10px !important; max-width: 100% !important; }
            .hero-left { width: 100% !important; max-width: 100% !important; text-align: center; padding: 0 15px !important; display: flex !important; flex-direction: column !important; align-items: center; }
            .hero-left .hero-glow { order: 0 !important; }
            .hero-left .hero-eyebrow { order: 1 !important; align-self: center; }
            .hero-left .hero-glass-card { order: 2 !important; margin-bottom: 16px !important; }
            .hero-left .hero-title { order: 3 !important; }
            .hero-left .hero-buttons { order: 4 !important; justify-content: center !important; margin-bottom: 0 !important; }
            .hero-left .hero-description { order: 5 !important; margin-top: 14px !important; }
            .hero-left .hero-trust { order: 6 !important; align-self: stretch; }
            .hero-right { width: 100% !important; height: 525px !important; margin-top: 0 !important; position: relative !important; overflow: visible !important; transform: scale(0.52) !important; transform-origin: top center !important; margin-bottom: -220px !important; }
            .hero-title { font-size: clamp(34px, 9vw, 44px) !important; line-height: 1.05 !important; letter-spacing: -0.02em !important; }
            .hero-description { max-width: 100% !important; font-size: 14px !important; padding: 0 5px !important; }
            .hero-buttons { justify-content: center !important; flex-direction: column !important; align-items: center !important; gap: 10px !important; }
            .hero-buttons button { width: 100% !important; max-width: 280px !important; }
            .hero-glass-card { width: 100% !important; max-width: 100% !important; margin-left: auto; margin-right: auto; padding: 10px !important; margin-bottom: 16px !important; order: 4 !important; }
            .hero-glass-card .glass-sub-cards { flex-direction: row !important; gap: 8px !important; }
            .hero-glass-card .glass-sub-cards > div { min-height: 110px !important; }
            .hero-glass-card .glass-btns { gap: 8px !important; margin-top: 8px !important; }
            .hero-glass-card .glass-btns button { padding: 6px 10px !important; font-size: 10.5px !important; }
            .hero-glass-card .glass-sub-cards > div p { font-size: 10px !important; }
            .hero-glass-card .glass-sub-cards > div span { font-size: 9px !important; }
            .hero-glass-card .glass-sub-cards > div i { font-size: 11px !important; }
            .hero-glow { left: 50% !important; transform: translateX(-50%) !important; width: 400px !important; top: 10px !important; }
            .hero-floating-card { transform: none !important; }

            /* Mobile: land10 design - simple clean vertical stack */
            .how-it-works-title { font-size: 36px !important; margin-bottom: 40px !important; text-align: center !important; }
            .how-it-works-steps { flex-direction: column !important; gap: 12px !important; align-items: center !important; animation: none !important; }
            .how-it-works-svg { display: none !important; }
            .how-it-works-mobile-line { display: none !important; }
            .carousel-rope { display: none !important; }
            .step-duplicate { display: none !important; }
            .how-it-works-steps > div::before { display: none !important; }
            .how-it-works-steps > div::after { display: none !important; }
            .step-img { width: 240px !important; height: 240px !important; }
            .step-title { font-size: 24px !important; text-align: center !important; }
            .step-description { font-size: 15px !important; text-align: center !important; }
            /* Keep outer rectangular border on mobile, adjust wrapper spacing */
            #how-it-works > div > div.how-it-works-rect-wrapper { margin-left: 0 !important; margin-right: 0 !important; padding: 50px 20px 30px !important; }
            .how-it-works-rect-border { display: block !important; }
            .step-rect-border { display: block !important; transform: scale(1.1) !important; }

            .photographer-container { flex-direction: column !important; padding: clamp(15px, 4vw, 25px) clamp(15px, 3vw, 20px) clamp(40px, 10vw, 60px) !important; gap: clamp(15px, 3vw, 20px) !important; align-items: center !important; text-align: center !important; }
            .photographer-title { font-size: clamp(20px, 5vw, 32px) !important; position: relative !important; top: 0 !important; text-align: center !important; max-width: 100% !important; line-height: 1.1 !important; margin-bottom: clamp(5px, 2vw, 10px) !important; }
            .photographer-description { position: relative !important; top: 0 !important; margin-bottom: clamp(10px, 2vw, 15px) !important; font-size: clamp(12px, 3vw, 15px) !important; text-align: center !important; opacity: 0.95 !important; }
            .photographer-button { position: relative !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 220px !important; margin: 0 auto !important; font-size: 17px !important; height: auto !important; padding: 12px 20px !important; }
            .photographer-container > button.photographer-button { margin-bottom: clamp(10px, 3vw, 20px) !important; }
            .photographer-video-container { max-width: 100% !important; width: 100% !important; height: auto !important; order: -1 !important; }

            .mockups-section { padding: 0 !important; background-color: #1c1c1c !important; min-height: 100vh !important; }
            .mockups-inner { padding: 0 20px !important; margin: 0 auto !important; min-height: 100vh !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; }
            .mockups-container { display: flex !important; justify-content: center !important; align-items: center !important; margin-left: 0 !important; padding: 0 !important; }
            .mockups-container { height: auto !important; width: 100% !important; max-width: 100% !important; position: relative !important; }
            .device-laptop { display: flex !important; max-width: none !important; max-height: none !important; transform: translate(-50%, -50%) scale(0.53) !important; transform-origin: center center !important; }
            .device-tablet { width: 320px !important; height: 430px !important; }
            .device-phone { width: 220px !important; height: 430px !important; }
            .phone-body { width: 210px !important; height: 425px !important; border-radius: 30px !important; }
            .tablet-body { width: 310px !important; height: 425px !important; border-radius: 20px !important; }
            .phone-overlay { border-radius: 32px !important; }
            .tablet-overlay { border-radius: 22px !important; }
            .mockup-heading-text { display: none !important; }

            .why-amoria-section { padding: 60px 15px !important; overflow: hidden !important; }
            .why-amoria-header { margin-bottom: 40px !important; }
            .why-amoria-title { font-size: 28px !important; text-align: center !important; line-height: 1.15 !important; margin-bottom: 16px !important; }
            .why-amoria-subtitle { font-size: 14px !important; text-align: center !important; padding: 0 10px !important; }

            /* Stack the dashboard cards vertically on mobile so every card -
               including the Facial Recognition accent card - gets its own
               row instead of overlapping/clipping inside the absolute layout. */
            .why-amoria-dashboard {
              height: auto !important;
              display: flex !important;
              flex-direction: column !important;
              gap: 18px !important;
              max-width: 100% !important;
              padding: 0 !important;
            }
            .why-amoria-dashboard .why-amoria-card,
            .why-amoria-dashboard .why-amoria-card-accent {
              position: static !important;
              top: auto !important;
              left: auto !important;
              right: auto !important;
              bottom: auto !important;
              width: 100% !important;
              max-width: 100% !important;
              transform: none !important;
              scale: 1 !important;
              margin: 0 !important;
              z-index: 1 !important;
            }
            /* Image-only "Full Event Gallery" card adds no extra info on
               mobile - hide it to reduce vertical scroll and keep focus on
               the four content cards. */
            .why-amoria-dashboard .why-amoria-card-large { display: none !important; }
            /* Reorder cards for a logical mobile reading order:
               Rated Photographers → Live Streaming → Facial Recognition → Secure Payments */
            .why-amoria-dashboard .why-amoria-card-medium { order: 1 !important; }
            .why-amoria-dashboard .why-amoria-card-small  { order: 2 !important; }
            .why-amoria-dashboard .why-amoria-card-accent { order: 3 !important; }
            .why-amoria-dashboard .why-amoria-card-base   { order: 4 !important; }
            /* Decorative connection lines need the absolute layout to make
               sense - drop them on mobile. */
            .why-amoria-connections { display: none !important; }

            .why-amoria-card-title { font-size: 16px !important; }
            .why-amoria-card-description { font-size: 13px !important; }

            .global-network-section { padding: 50px 15px !important; overflow: hidden !important; margin-top: 0 !important; }
            .global-network-content { flex-direction: column !important; gap: 30px !important; align-items: center !important; }
            .global-network-left { flex: 1 !important; max-width: 100% !important; text-align: center !important; padding: 0 10px !important; }
            .global-network-title { font-size: 28px !important; line-height: 1.15 !important; text-align: center !important; }
            .global-network-description { font-size: 14px !important; text-align: center !important; padding: 0 10px !important; margin-bottom: 20px !important; }
            .global-network-buttons { justify-content: center !important; flex-direction: column !important; align-items: center !important; gap: 10px !important; }
            .global-network-buttons button { width: 100% !important; max-width: 280px !important; }
            .global-network-right { width: 90% !important; height: 350px !important; margin-top: 20px !important; overflow: visible !important; position: relative !important; }
            .global-network-svg-container { position: relative !important; left: 50% !important; transform: translateX(-50%) !important; overflow: visible !important; }
            .global-network-svg { display: block !important; }
          }

          @media (max-width: 400px) {
            .hero-right { transform: scale(0.44) !important; margin-bottom: -260px !important; }
            .hero-title { font-size: 28px !important; }
            .hero-description { font-size: 13px !important; }
          }

          @media (min-width: 769px) and (max-width: 1024px) {
            .hero-title { font-size: 56px !important; margin-bottom: 14px !important; }
            .hero-content { padding: 22px 20px 28px !important; }
            .mockups-section { padding: 80px 40px !important; }
            .mockups-container { height: 450px !important; }
            .mockup-heading-text h2 { font-size: 38px !important; }
            .mockup-heading-text { left: 20px !important; }
            .how-it-works-title { font-size: 45px !important; }
            .why-amoria-title { font-size: 45px !important; }
            .global-network-title { font-size: 45px !important; }
          }

          /* Short viewports (laptops < 720px tall) - apply a *light* trim so
             the CTAs land at the bottom of the section instead of overflowing.
             Everything stays at near-default sizes; only padding + a couple of
             marginals shrink. */
          @media (min-width: 769px) and (max-height: 720px) {
            .hero-content { padding: 14px 30px 18px !important; }
            .hero-title { font-size: 58px !important; margin-bottom: 14px !important; }
            .hero-glass-card { margin-bottom: 14px !important; }
          }

          .how-it-works-mobile-line {
            display: none;
          }

          .step-img {
            transition: transform 0.3s ease;
          }
          .step-img:hover {
            transform: scale(1.45);
          }
        `}</style>
        {/* Hero Section */}
        <section
          ref={heroSectionRef}
          onMouseMove={(e) => {
            if (heroSectionRef.current) {
              const rect = heroSectionRef.current.getBoundingClientRect();
              setHeroMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              });
            }
          }}
          onMouseLeave={() => setHeroMousePos(null)}
          style={{
            position: 'relative',
            backgroundColor: '#DBDBDB',
            overflow: 'hidden',
          }}
        >

          {/* ── Decorative innovation layer ─────────────────────────────
               Animated brand-blue & coral orbs floating in the background,
               a subtle dot-grid pattern overlay, and a thin gradient hairline
               framing the bottom edge. All purely visual - no layout shift,
               no impact on existing content. */}
          <div className="hero-deco-grid" aria-hidden="true" />
          <div className="hero-orb hero-orb--blue" aria-hidden="true" />
          <div className="hero-orb hero-orb--coral" aria-hidden="true" />
          <div className="hero-orb hero-orb--cyan" aria-hidden="true" />
          <div className="hero-edge-line" aria-hidden="true" />
          {/* Spotlight layer - blue glow that follows cursor */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: heroMousePos
              ? `radial-gradient(circle 120px at ${heroMousePos.x}px ${heroMousePos.y}px, rgba(4, 25, 255, 0.35) 0%, rgba(37, 17, 220, 0.25) 30%, transparent 70%)`
              : 'none',
            opacity: heroMousePos ? 1 : 0,
            zIndex: 1,
            pointerEvents: 'none',
            filter: 'blur(25px)',
            transition: 'opacity 0.15s ease'
          }} />

          {/* Hero Content Container - tightened so the full layout
              (eyebrow → title → description → CTAs → glass card → trust)
              fits cleanly at 100% browser zoom on a 1366×768 viewport. */}
          <div className="hero-content" style={{
            position: 'relative',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px 30px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '40px',
            minHeight: 'calc(100vh - 72px)'
          }}>

            {/* Left Content - flex column with explicit order so the
                hierarchy reads: eyebrow → title → description → CTAs →
                glass card → trust strip. */}
            <div className="hero-left" style={{
              position: 'relative',
              width: '45%',
              maxWidth: '460px',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Blue lighting bulb-like glow effect */}
              <div className="hero-glow" style={{
                position: 'absolute',
                top: '30px',
                left: '-135px',
                width: '612px',
                height: '212.5px',
                background: 'radial-gradient(circle, rgba(4, 25, 255, 0.3) 0% 10%, rgba(37, 17, 220, 0.43) 4% 10%, rgba(37, 17, 220, 0) 90% 90%)',
                borderRadius: '50%',
                filter: 'blur(55px)',
                zIndex: -1,
                pointerEvents: 'none'
              }} />

              {/* Hero Feature Glass Card - sits BELOW the eyebrow pill and
                  ABOVE the headline, presenting EVENTS + AI SCAN as quick
                  entry tiles before the user reads the headline. */}
              <div className="hero-glass-card" style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.75) 100%)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(8, 58, 133, 0.12)',
                boxShadow: '0 18px 40px -16px rgba(8, 58, 133, 0.20), 0 1px 0 rgba(255, 255, 255, 0.95) inset',
                borderRadius: '16px',
                padding: '10px',
                marginTop: '0',
                marginBottom: '18px',
                maxWidth: '440px',
                order: 2,
              }}>
                <div className="glass-sub-cards" style={{ display: 'flex', gap: '12px' }}>
                  {/* Events Sub-Card */}
                  <div
                    onClick={() => window.location.href = '/user/events'}
                    style={{
                      flex: 1,
                      position: 'relative',
                      minHeight: '120px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#0a1628',
                      border: hasLiveEvents ? '2px solid rgba(220, 38, 38, 0.7)' : '1px solid rgba(255, 255, 255, 0.1)',
                      animation: hasLiveEvents ? 'hero-card-twinkle 1s ease-out infinite' : 'none',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)'; e.currentTarget.style.zIndex = '10'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.zIndex = '1'; }}
                  >
                    {/* Carousel background with toss-in / spin-in animations */}
                    {heroEventImages.length > 0 ? (
                      <img
                        key={heroSlideKey}
                        src={heroEventImages[heroEventSlide]}
                        alt=""
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          animation: `${heroEventSlide % 2 === 0 ? 'hero-toss-in' : 'hero-spin-in'} 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                        }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }} />
                    )}
                    {/* Dark overlay for text readability */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)' }} />
                    {/* Content */}
                    <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="bi bi-camera-video-fill" style={{ fontSize: '14px', color: hasLiveEvents ? '#ef4444' : '#fff' }}></i>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{tl('Events')}</span>
                        {hasLiveEvents && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#fca5a5', background: 'rgba(220,38,38,0.20)', padding: '2px 6px', borderRadius: '8px', border: '1px solid rgba(220,38,38,0.45)' }}>LIVE</span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.3 }}>
                        {hasLiveEvents ? tl('Live streams happening now') : tl('Upcoming events & streams')}
                      </p>
                    </div>
                  </div>

                  {/* Facial Recognition Sub-Card */}
                  <div
                    onClick={() => window.location.href = '/user/find-my-photos'}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)'; e.currentTarget.style.zIndex = '10'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.zIndex = '1'; }}
                    style={{
                      flex: 1,
                      position: 'relative',
                      minHeight: '120px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    }}
                  >
                    {/* scan.png background */}
                    <img
                      src="/scan.png"
                      alt=""
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {/* Dark overlay for text readability */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
                    }} />
                    {/* Content */}
                    <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="bi bi-person-bounding-box" style={{ fontSize: '14px', color: '#60a5fa' }}></i>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{tl('AI Scan')}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.3 }}>{tl('Find your photos with facial recognition')}</p>
                    </div>
                  </div>
                </div>

                {/* Buttons row - outside sub-cards, inside main card */}
                <div className="glass-btns" style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    onClick={() => window.location.href = '/user/events'}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      // Solid red gradient + white text when live (matches the
                      // "LIVE NOW" pill language). Maximum readability against
                      // the white parent card. Falls back to outlined dark
                      // button when no live events.
                      background: hasLiveEvents
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                        : 'transparent',
                      border: hasLiveEvents ? '1.5px solid rgba(255,255,255,0.22)' : '1.5px solid #1a1a1a',
                      color: hasLiveEvents ? '#ffffff' : '#1a1a1a',
                      fontSize: '12px',
                      fontWeight: hasLiveEvents ? 700 : 500,
                      letterSpacing: hasLiveEvents ? '0.02em' : '0',
                      textShadow: hasLiveEvents ? '0 1px 2px rgba(0,0,0,0.25)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      animation: hasLiveEvents ? 'hero-card-twinkle 1s ease-out infinite' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (hasLiveEvents) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                      } else {
                        e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                        e.currentTarget.style.borderColor = '#000000';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasLiveEvents) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                      } else {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = '#1a1a1a';
                      }
                    }}
                  >
                    <i className={hasLiveEvents ? 'bi bi-broadcast' : 'bi bi-compass'} style={{ fontSize: '13px' }}></i>
                    {hasLiveEvents ? tl('Go Streaming') : tl('Explore all')}
                  </button>
                  <button
                    onClick={() => window.location.href = '/user/find-my-photos'}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '7px 12px',
                      borderRadius: '10px',
                      background: '#000000',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: '11px' }}></i>
                    Browse Photos
                  </button>
                </div>
              </div>

              {/* Brand eyebrow pill - premium identity flag above the title */}
              <div className="hero-eyebrow" aria-hidden="true" style={{ order: 1 }}>
                <span className="hero-eyebrow-dot" />
                <span className="hero-eyebrow-text">
                  THE MULTI CREATIVE PLATFORM
                </span>
                <span className="hero-eyebrow-sparkle">✨</span>
              </div>

              {/* Main Heading - sits AFTER the glass card, with CTAs
                  directly underneath, then description, then trust. */}
              <h1 className="hero-title" style={{
                fontSize: '56px',
                fontWeight: 800,
                lineHeight: '1.04',
                marginBottom: '16px',
                letterSpacing: '-0.025em',
                order: 3,
              }}>
                <div style={{
                  color: '#083A85',
                  marginBottom: '3px',
                  // Cursive script flourish on the typing word - same
                  // 'Alex Brush' treatment as the contact page's "connect"
                  // word. The contact-page sizing (1.4em + descender
                  // baseline) makes the strokes render thicker visually.
                  fontFamily: "'Alex Brush', cursive",
                  fontWeight: 400,
                  fontSize: '1.4em',
                  lineHeight: 1,
                  letterSpacing: '0',
                  paddingBottom: '8px',
                  verticalAlign: '-0.05em',
                  // 1px text-shadow in the same brand-blue reinforces
                  // the strokes at this size without looking like a halo
                  textShadow: '0.5px 0 0 #083A85, -0.5px 0 0 #083A85',
                }}>
                  <TextType
                    text={['Connekyt', 'Meet', 'Work', 'Chat', 'Grow']}
                    typingSpeed={80}
                    deletingSpeed={50}
                    pauseDuration={1500}
                    showCursor
                    cursorCharacter="_"
                    cursorBlinkDuration={0.5}
                    loop
                    style={{ display: 'inline', fontFamily: "'Alex Brush', cursive", fontWeight: 400 }}
                  />
                </div>
                <div style={{ color: '#000', marginBottom: '3px' }}>{t('hero.title2')}</div>
                <div style={{ color: '#000' }}>{t('hero.title3')}</div>
              </h1>

              {/* Description - now sits AFTER the CTA buttons */}
              <p className="hero-description" style={{
                fontSize: '14px',
                color: '#1f1d1d',
                lineHeight: '1.55',
                marginTop: '14px',
                marginBottom: '0',
                maxWidth: '420px',
                order: 5,
              }}>
                {t('hero.description')}
              </p>

              {/* CTA Buttons - positioned directly UNDER the heading */}
              <div className="hero-buttons" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', order: 4 }}>
                <button
                  className="hero-cta hero-cta--primary"
                  onClick={() => window.location.href = '/user/photographers'}
                >
                  <span className="hero-cta-shimmer" aria-hidden="true" />
                  <span className="hero-cta-content">
                    {t('hero.findPhotographer')}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>
                <button
                  className="hero-cta hero-cta--ghost"
                  onClick={() => window.location.href = '/user/auth/signup?userType=Photographer'}
                >
                  <i className="bi bi-camera-fill" aria-hidden="true" />
                  {t('hero.joinPhotographer')}
                </button>
              </div>

              {/* Trust strip - quick scan of platform credibility.
                  Order 6 places it at the very bottom of the column. */}
              <div className="hero-trust" aria-label="Platform highlights" style={{ order: 6 }}>
                <div className="hero-trust-cell">
                  <span className="hero-trust-icon hero-trust-icon--green" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  </span>
                  <div className="hero-trust-text">
                    <strong>Verified</strong>
                    <span>Pros only</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Image Section */}
            <div className="hero-right" style={{
              position: 'relative',
              width: '55%',
              height: '525px',
              zIndex: 5,
              marginRight: '-80px',
            }}>
              {/* Full Circle - Upper Left */}
              <div className="hero-circle" style={{
                position: 'absolute',
                left: '-115px',
                top: '235px',
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #083A85 0%, #FF6363 100%)',
                zIndex: 20
              }} />

              {/* Half Circle - Lower Right */}
              <div className="hero-circle" style={{
                position: 'absolute',
                left: '-50px',
                bottom: '140px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #083A85 0%, #FF6363 100%)',
                clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                transform: 'rotate(-90deg)',
                zIndex: 20
              }} />

              {/* Photographer Image Container */}
              <div className="hero-image-container" style={{
                position: 'absolute',
                left: '75px',
                top: '0',
                width: '487.5px',
                height: '525px',
                zIndex: 10
              }}>
                {/* Main Image */}
                <img
                  className="hero-image"
                  src="/camman.png"
                  alt="Photographer with camera"
                  style={{
                    width: '700px',
                    height: '700px',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />

                {/* Blue Angular Gradient Overlay - Top Right with 3D Perspective */}
                <div className="hero-overlay" style={{
                  position: 'absolute',
                  top: '2px',
                  right: '20px',
                  width: '1370px',
                  height: '500px',
                  background: 'conic-gradient(from 180deg at 70% 50%, rgba(2, 14, 31, 0.6) 0deg, rgba(8, 58, 133, 0.8) 359.96deg, rgba(2, 14, 31, 0.6) 360deg)',
                  borderRadius: '120px 30px 30px 100px',
                  transform: 'perspective(630px) rotateY(-27deg) rotateX(-1deg)',
                  transformOrigin: 'right center',
                  zIndex: 3,
                  boxShadow: '0 400px 800px rgba(2, 14, 31, 0.3)'
                }} />

                {/* Lady with Speech Bubble - Top Left */}
                <div className="hero-floating-card" style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-175px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '30.5px',
                  zIndex: 15
                }}>
                  <img
                    src="/lady.gif"
                    alt="Smiling woman"
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      boxShadow: '0 4.5px 13.5px rgba(0,0,0,0.12)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '85px',
                    bottom: '20px',
                    background: 'linear-gradient(-90deg, #083A85 0%, #FF6363 100%)',
                    padding: '8.25px 16.5px',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '2.3px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 3.75px 11.25px rgba(0,0,0,0.18)'
                  }}>
                    {t('hero.ohWow')}
                  </div>
                  {/* Triangular polygon pointer for speech bubble */}
                  <svg
                    style={{
                      position: 'absolute',
                      width: '15px',
                      height: '30px',
                      left: '75px',
                      top: '19px',
                      transform: 'matrix(0.7, -0.72, 0.7, 0.72, 0, 0)',
                      zIndex: 14
                    }}
                    viewBox="0 0 48.26 39.64"
                  >
                    <path
                      d="M 20 8 Q 24.13 4 28 8 L 44 34 Q 46 38 44 39.64 L 4 39.64 Q 2 38 4 34 L 20 8 Z"
                      fill="#000000"
                      stroke="#000000"
                      strokeWidth="6"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Call UI Card - Left Middle (under camera) */}
                <div className="hero-floating-card" style={{
                  position: 'absolute',
                  left: '-170px',
                  top: '130px',
                  height: '40px',
                  width: '160px',
                  backgroundColor: '#fff',
                  padding: '9.75px 12px',
                  borderRadius: '10px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  zIndex: 12
                }}>
                  <img
                    src="/bea.png"
                    alt="User Bea"
                    style={{
                      position: 'absolute',
                      left: '4px',
                      top: '2px',
                      width: '33px',
                      height: '35px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5px' }}>
                    <div style={{
                      position: 'absolute',
                      left: '42px',
                      top: '12px',
                      width: '68.5px',
                      height: '4.75px',
                      backgroundColor: '#868686',
                      borderRadius: '3.75px'
                    }}/>
                    <div style={{
                      position: 'absolute',
                      left: '42px',
                      top: '23px',
                      width: '48.75px',
                      height: '4.75px',
                      backgroundColor: '#D9D9D9',
                      borderRadius: '3.75px'
                    }}/>
                  </div>
                  <div style={{
                    position: 'absolute',
                    left: '125px',
                    top: '6px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#34C848',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="16.5" height="16.5" viewBox="0 0 24 24" fill="none">
                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" fill="white"/>
                    </svg>
                  </div>
                </div>

                {/* Verified Man Card - Right Bottom (under photographer hair) */}
                <div className="hero-floating-card" style={{
                  position: 'absolute',
                  right: '-10px',
                  top: '335px',
                  height: '40px',
                  width: '160px',
                  backgroundColor: '#fff',
                  padding: '11.25px 18px',
                  borderRadius: '10px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  zIndex: 12
                }}>
                  <div style={{  }}>
                    <img
                      src="/man.png"
                      alt="Verified man"
                      style={{
                        position: 'absolute',
                        left: '2px',
                        top: '2px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '24px',
                      right: '120px',
                      width: '14.5px',
                      height: '14.5px',
                      borderRadius: '50%',
                      backgroundColor: '#00C2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2.25px solid #fff'
                    }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{
                      position: 'absolute',
                      bottom: '21px',
                      right: '23px',
                      width: '90px',
                      height: '6.5px',
                      backgroundColor: '#9948FF',
                      borderRadius: '3.75px'
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '45px',
                      width: '67.5px',
                      height: '6.5px',
                      backgroundColor: '#FF8E8C',
                      borderRadius: '3.75px'
                    }} />
                  </div>
                </div>

                {/* Smile Please - Bottom Center (under photographer mouth) */}
                <div className="hero-floating-card" style={{
                  position: 'absolute',
                  left: '225px',
                  bottom: '210px',
                  minWidth: '140px',
                  width: 'fit-content',
                  background: 'linear-gradient(180deg, #8C82FF 0%, #14008E 100%)',
                  padding: '9.75px 21px',
                  borderRadius: '24px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  zIndex: 12,
                  boxShadow: '0 3.75px 13.5px rgba(140,130,255,0.35)',
                  whiteSpace: 'nowrap'
                }}>
                  {t('hero.smilePlease')}
                </div>
                {/* Triangular polygon pointer for Smile Please bubble */}
                <svg
                  className="hero-floating-card"
                  style={{
                    position: 'absolute',
                    width: '15px',
                    height: '10px',
                    left: '240px',
                    bottom: '245px',
                    transform: 'matrix(0.7, 0.72, -0.7, 0.72, 0, 0) rotate(90deg)',
                    zIndex: 11
                  }}
                  viewBox="0 0 48.26 39.64"
                >
                  <path
                    d="M 20 8 Q 24.13 4 28 8 L 44 34 Q 46 38 44 39.64 L 4 39.64 Q 2 38 4 34 L 20 8 Z"
                    fill="#14008E"
                    stroke="#14008E"
                    strokeWidth="6"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section
          ref={howItWorksSectionRef}
          id="how-it-works"
          style={{
            padding: 'clamp(30px, 8vw, 50px) 0 clamp(50px, 12vw, 100px) 0',
            backgroundColor: '#fff',
            position: 'relative',
            zIndex: 2,
            overflow: 'hidden'
          }}
        >
              <div style={{
                maxWidth: '1080px',
                margin: '0 auto',
                padding: '0 20px'
              }}>
                {/* Section Title group - eyebrow pill + title + accent line */}
                <div className="hiw-title-group">
                  <div className="hiw-eyebrow" aria-hidden="true">
                    <span className="hiw-eyebrow-dot" />
                    <span>{tl('OUR PROCESS · 3 SIMPLE STEPS')}</span>
                    <span className="hiw-eyebrow-sparkle">✦</span>
                  </div>
                  <h2 className="how-it-works-title hiw-title" style={{
                    fontSize: 'clamp(28px, 6vw, 50px)',
                    fontWeight: 1000,
                    textAlign: 'center',
                    marginBottom: 'clamp(14px, 2vw, 22px)',
                    color: '#000',
                    letterSpacing: '-0.02em'
                  }}>
                    {/* Split the localized title and style the LAST word
                        as bold italic with a brand-blue → violet gradient
                        text fill (Sinc design system pattern). Other words
                        keep the default bold black. */}
                    {(() => {
                      const words = t('howItWorks.title').split(/\s+/).filter(Boolean);
                      const lastIdx = words.length - 1;
                      return words.map((w, i) => (
                        <span key={i} style={{ display: 'inline-block', marginRight: i === lastIdx ? 0 : '0.28em' }}>
                          {i === lastIdx ? (
                            <span style={{
                              fontStyle: 'italic',
                              fontWeight: 'inherit',
                              background: 'linear-gradient(135deg, #083A85 0%, #3b82f6 55%, #7763FF 100%)',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              color: 'transparent',
                              // Padding gives the italic slant + final
                              // punctuation (?, !) room to render fully
                              display: 'inline-block',
                              paddingRight: '0.12em',
                              paddingLeft: '0.04em',
                            }}>{w}</span>
                          ) : w}
                        </span>
                      ));
                    })()}
                  </h2>
                  <div className="hiw-accent-line" aria-hidden="true">
                    <span />
                  </div>
                  <p className="hiw-subtitle">
                    {tl('From discovery to your first live moment, a clear path designed to feel effortless.')}
                  </p>
                </div>

            {/* Three Steps Container - Marquee Carousel on Mobile */}
            {/* Outer rectangular flowing-dot border around all steps */}
            <div className="how-it-works-rect-wrapper" style={{ position: 'relative', paddingTop: isMobile ? '160px' : 'clamp(80px, 12vw, 140px)', paddingBottom: isMobile ? '60px' : 'clamp(16px, 3vw, 28px)', paddingLeft: isMobile ? '20px' : 'clamp(16px, 3vw, 28px)', paddingRight: isMobile ? '20px' : 'clamp(16px, 3vw, 28px)', marginLeft: isMobile ? '0' : '-40px', marginRight: isMobile ? '0' : '-40px' }}>
              <svg
                className="how-it-works-rect-border"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="stepsRectFlowGrad" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000000">
                      <animate attributeName="offset" values="-0.3;1.0;-0.3" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                    </stop>
                    <stop offset="4%" stopColor="#1d4ed8">
                      <animate attributeName="offset" values="-0.26;1.04;-0.26" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                    </stop>
                    <stop offset="8%" stopColor="#3b82f6">
                      <animate attributeName="offset" values="-0.22;1.08;-0.22" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                    </stop>
                    <stop offset="12%" stopColor="#60a5fa">
                      <animate attributeName="offset" values="-0.18;1.12;-0.18" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                    </stop>
                    <stop offset="15%" stopColor="#93c5fd">
                      <animate attributeName="offset" values="-0.15;1.15;-0.15" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                    </stop>
                    <stop offset="18%" stopColor="#60a5fa">
                      <animate attributeName="offset" values="-0.12;1.18;-0.12" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                    </stop>
                    <stop offset="22%" stopColor="#3b82f6">
                      <animate attributeName="offset" values="-0.08;1.22;-0.08" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                    </stop>
                    <stop offset="26%" stopColor="#1d4ed8">
                      <animate attributeName="offset" values="-0.04;1.26;-0.04" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                    </stop>
                    <stop offset="30%" stopColor="#000000">
                      <animate attributeName="offset" values="0;1.3;0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                    </stop>
                  </linearGradient>
                </defs>
                <rect
                  x="1"
                  y="1"
                  width="calc(100% - 2px)"
                  height="calc(100% - 2px)"
                  rx="20"
                  ry="20"
                  fill="none"
                  stroke="url(#stepsRectFlowGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="8,6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="5"
                  y="5"
                  width="calc(100% - 10px)"
                  height="calc(100% - 10px)"
                  rx="17"
                  ry="17"
                  fill="none"
                  stroke="url(#stepsRectFlowGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="8,6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="9"
                  y="9"
                  width="calc(100% - 18px)"
                  height="calc(100% - 18px)"
                  rx="14"
                  ry="14"
                  fill="none"
                  stroke="url(#stepsRectFlowGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="8,6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="13"
                  y="13"
                  width="calc(100% - 26px)"
                  height="calc(100% - 26px)"
                  rx="11"
                  ry="11"
                  fill="none"
                  stroke="url(#stepsRectFlowGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="8,6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="17"
                  y="17"
                  width="calc(100% - 34px)"
                  height="calc(100% - 34px)"
                  rx="8"
                  ry="8"
                  fill="none"
                  stroke="url(#stepsRectFlowGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="8,6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

            <div
              className="how-it-works-steps"
              onMouseEnter={() => setHowItWorksAutoScroll(false)}
              onMouseLeave={() => setHowItWorksAutoScroll(true)}
              onTouchStart={() => setHowItWorksAutoScroll(false)}
              onTouchEnd={() => setHowItWorksAutoScroll(true)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '40px',
                position: 'relative',
              }}>
              {/* Animated Rope Thread - Extended for duplicates */}
              <svg
                className="carousel-rope"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: '600vw',
                  height: '80px',
                  zIndex: 0,
                  pointerEvents: 'none',
                  transform: 'translateY(-50%)',
                  animation: 'ropeFlow 30s linear infinite',
                  animationPlayState: howItWorksAutoScroll ? 'running' : 'paused'
                }}
                viewBox="0 0 3000 80"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="ropeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B7355" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#A0826D" stopOpacity="1" />
                    <stop offset="100%" stopColor="#8B7355" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="ropeShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                  </filter>
                </defs>
                {/* Main rope strand - 3 steps */}
                <path
                  d="M 0,35 Q 375,20 750,35 T 1500,35 T 2250,35 T 3000,35"
                  stroke="url(#ropeGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#ropeShadow)"
                />
                {/* Rope texture detail */}
                <path
                  d="M 0,35 Q 375,25 750,35 T 1500,35 T 2250,35 T 3000,35"
                  stroke="#6B5D52"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.5"
                />
                {/* Knots at intervals - for 3 steps */}
                <circle cx="500" cy="35" r="8" fill="#A0826D" filter="url(#ropeShadow)" />
                <circle cx="1500" cy="35" r="8" fill="#A0826D" filter="url(#ropeShadow)" />
                <circle cx="2500" cy="35" r="8" fill="#A0826D" filter="url(#ropeShadow)" />
              </svg>

              {/* Dotted Line Connector with Flowing Light Inside Dots */}
              <svg
                className="how-it-works-svg"
                style={{
                  position: 'absolute',
                  top: '-360px',
                  left: '12%',
                  width: '76%',
                  height: '950px',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
                viewBox="0 0 1000 120"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Animated gradient - dots change from black to bright blue/cyan as light flows through, bounces back */}
                  <linearGradient id="flowingDotGradient">
                    <stop offset="0%" stopColor="#000000">
                      <animate
                        attributeName="offset"
                        values="-0.3;1.0;-0.3"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="4%" stopColor="#1d4ed8">
                      <animate
                        attributeName="offset"
                        values="-0.26;1.04;-0.26"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="8%" stopColor="#3b82f6">
                      <animate
                        attributeName="offset"
                        values="-0.22;1.08;-0.22"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="12%" stopColor="#60a5fa">
                      <animate
                        attributeName="offset"
                        values="-0.18;1.12;-0.18"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="15%" stopColor="#93c5fd">
                      <animate
                        attributeName="offset"
                        values="-0.15;1.15;-0.15"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="18%" stopColor="#60a5fa">
                      <animate
                        attributeName="offset"
                        values="-0.12;1.18;-0.12"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="22%" stopColor="#3b82f6">
                      <animate
                        attributeName="offset"
                        values="-0.08;1.22;-0.08"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="26%" stopColor="#1d4ed8">
                      <animate
                        attributeName="offset"
                        values="-0.04;1.26;-0.04"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="30%" stopColor="#000000">
                      <animate
                        attributeName="offset"
                        values="0;1.3;0"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                  </linearGradient>
                </defs>

                {/* Single dotted line - dots change color as the gradient flows through them */}
                <path
                  d="M 0 60 Q 250 20, 500 60 T 1000 60"
                  stroke="url(#flowingDotGradient)"
                  strokeWidth="0.7"
                  strokeDasharray="10,10"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              {/* Vertical S-curve connector for mobile */}
              <svg
                className="how-it-works-mobile-line"
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  zIndex: 0,
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
                viewBox="0 0 300 1000"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="mobileFlowGrad" gradientUnits="userSpaceOnUse" x1="200" y1="0" x2="200" y2="1000">
                    <stop offset="0%" stopColor="#000000">
                      <animate attributeName="offset" values="-0.3;1.0;-0.3" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="4%" stopColor="#1d4ed8">
                      <animate attributeName="offset" values="-0.26;1.04;-0.26" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="8%" stopColor="#3b82f6">
                      <animate attributeName="offset" values="-0.22;1.08;-0.22" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="12%" stopColor="#60a5fa">
                      <animate attributeName="offset" values="-0.18;1.12;-0.18" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="15%" stopColor="#93c5fd">
                      <animate attributeName="offset" values="-0.15;1.15;-0.15" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="18%" stopColor="#60a5fa">
                      <animate attributeName="offset" values="-0.12;1.18;-0.12" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="22%" stopColor="#3b82f6">
                      <animate attributeName="offset" values="-0.08;1.22;-0.08" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="26%" stopColor="#1d4ed8">
                      <animate attributeName="offset" values="-0.04;1.26;-0.04" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="30%" stopColor="#000000">
                      <animate attributeName="offset" values="0;1.3;0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                  </linearGradient>
                </defs>
                {/* Vertical S-curve - same flowing dots as desktop, rotated vertically */}
                <path
                  d="M 150 0 C 300 160, 0 340, 150 500 C 300 660, 0 840, 150 1000"
                  stroke="url(#mobileFlowGrad)"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              {(() => {
                const steps = [
                  { img: '/ava1.png', alt: 'Get Started', titleKey: 'howItWorks.getStarted.title', descKey: 'howItWorks.getStarted.description' },
                  { img: '/ava2.png', alt: 'Photography', titleKey: 'howItWorks.photography.title', descKey: 'howItWorks.photography.description' },
                  { img: '/ava3.png', alt: 'Go Live', titleKey: 'howItWorks.goLive.title', descKey: 'howItWorks.goLive.description' },
                ];
                return steps.map((s, i) => (
                  <div key={i} className="hiw-step" style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 2,
                    animationDelay: `${i * 180}ms`,
                  }}>
                    {/* Zigzag connector linking this avatar to the outer rect (mobile only) */}
                    {isMobile && (
                      <svg
                        width="28"
                        height="80"
                        viewBox="0 0 28 80"
                        style={{ marginBottom: '21px', overflow: 'visible', position: 'relative', zIndex: 3 }}
                      >
                        <defs>
                          <linearGradient id={`zigzagGrad-${i}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="80">
                            <stop offset="0%" stopColor="#083A85" stopOpacity="0.85">
                              <animate attributeName="offset" values="-0.3;1.0;-0.3" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                            </stop>
                            <stop offset="15%" stopColor="#3b82f6" stopOpacity="1">
                              <animate attributeName="offset" values="-0.15;1.15;-0.15" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                            </stop>
                            <stop offset="30%" stopColor="#083A85" stopOpacity="0.85">
                              <animate attributeName="offset" values="0;1.3;0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                            </stop>
                          </linearGradient>
                        </defs>
                        <path
                          d="M 3 2 L 25 20 L 3 38 L 25 56 L 3 78"
                          stroke={`url(#zigzagGrad-${i})`}
                          strokeWidth="1.5"
                          strokeDasharray="8,6"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <path
                          d="M 25 2 L 3 20 L 25 38 L 3 56 L 25 78"
                          stroke={`url(#zigzagGrad-${i})`}
                          strokeWidth="1.5"
                          strokeDasharray="8,6"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    )}
                    {/* Avatar with orbital motion design (inspired by the
                        Sinc design system "Orbit" variant): counter-rotating
                        dashed outer ring + rotating gradient inner ring +
                        traveling orbital dot + shimmer ribbon sweep. */}
                    <div className="hiw-avatar-wrap" style={{ position: 'relative', width: isMobile ? (i === 0 ? '280px' : '280px') : 'clamp(140px, 22vw, 240px)', height: isMobile ? (i === 0 ? '250px' : '260px') : 'clamp(140px, 22vw, 240px)', marginBottom: isMobile ? '55px' : 'clamp(16px, 3vw, 24px)', left: isMobile ? (i === 0 ? '10px' : '10px') : undefined  }}>
                      {/* Soft brand-blue halo (kept) */}
                      <span className="hiw-halo" aria-hidden="true" />

                      {/* Outer dashed rounded-rect ring - counter-rotating
                          (rounded rect to match the avatar card shape) */}
                      <svg
                        className="hiw-ring hiw-ring--outer"
                        viewBox="0 0 200 200"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <rect x="3" y="3" width="194" height="194" rx="22" ry="22"
                          fill="none"
                          stroke="#083A85" strokeWidth="1"
                          strokeDasharray="2 7" strokeLinecap="round"
                          vectorEffect="non-scaling-stroke" />
                      </svg>

                      {/* Inner gradient rounded-rect ring - rotating gradient
                          gives the chasing-arc effect on a rectangular path */}
                      <svg
                        className="hiw-ring hiw-ring--inner"
                        viewBox="0 0 200 200"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient id={`hiw-orbit-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0">
                              <animate attributeName="offset" values="0;1;0" dur="8s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.85">
                              <animate attributeName="offset" values="0.5;1.5;0.5" dur="8s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0">
                              <animate attributeName="offset" values="1;2;1" dur="8s" repeatCount="indefinite" />
                            </stop>
                          </linearGradient>
                        </defs>
                        <rect x="9" y="9" width="182" height="182" rx="18" ry="18"
                          fill="none"
                          stroke={`url(#hiw-orbit-grad-${i})`}
                          strokeWidth="2" strokeLinecap="round"
                          vectorEffect="non-scaling-stroke" />
                      </svg>

                      {/* Orbital dot - travels along the rounded-rect ring path */}
                      <svg
                        className="hiw-orbital-dot-svg"
                        viewBox="0 0 200 200"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <defs>
                          <path
                            id={`hiw-orbit-path-${i}`}
                            d="M 25 3 H 175 A 22 22 0 0 1 197 25 V 175 A 22 22 0 0 1 175 197 H 25 A 22 22 0 0 1 3 175 V 25 A 22 22 0 0 1 25 3 Z"
                          />
                        </defs>
                        <circle r="6" fill="#3b82f6" stroke="#ffffff" strokeWidth="3"
                          vectorEffect="non-scaling-stroke">
                          <animateMotion
                            dur="14s"
                            repeatCount="indefinite"
                            rotate="auto"
                          >
                            <mpath xlinkHref={`#hiw-orbit-path-${i}`} />
                          </animateMotion>
                        </circle>
                        <circle r="12" fill="#3b82f6" opacity="0.20">
                          <animateMotion
                            dur="14s"
                            repeatCount="indefinite"
                          >
                            <mpath xlinkHref={`#hiw-orbit-path-${i}`} />
                          </animateMotion>
                        </circle>
                      </svg>

                      {/* Step number badge - top-right corner */}
                      <span className="hiw-step-badge" aria-hidden="true">
                        <span className="hiw-step-badge-num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="hiw-step-badge-label">STEP</span>
                      </span>

                      {/* Shimmer ribbon - sweeps diagonally across the avatar */}
                      <span className="hiw-shimmer-ribbon" aria-hidden="true" />

                      <img
                        className="step-img hiw-step-img"
                        src={s.img}
                        alt={s.alt}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          position: 'relative',
                          zIndex: 2,
                          transform: isMobile ? 'scale(1.20)' : undefined,
                        }}
                      />
                      {/* Rectangular dashed border with flowing twinkling gradient */}
                      <svg
                        className="step-rect-border"
                        style={{ position: 'absolute', inset: '-15px', width: 'calc(100% + 4px)', height: 'calc(100% + 34px)', zIndex: 0, pointerEvents: 'none' }}
                        viewBox="0 0 200 200"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id={`rectFlowGrad-${i}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="0">
                            <stop offset="0%" stopColor="#083A85" stopOpacity="0.3">
                              <animate attributeName="offset" values="-0.3;1.0;-0.3" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                            </stop>
                            <stop offset="15%" stopColor="#3b82f6" stopOpacity="1">
                              <animate attributeName="offset" values="-0.15;1.15;-0.15" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                            </stop>
                            <stop offset="30%" stopColor="#083A85" stopOpacity="0.3">
                              <animate attributeName="offset" values="0;1.3;0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
                            </stop>
                          </linearGradient>
                        </defs>
                        {/* Rectangular path with rounded corners */}
                        <rect x="6" y="6" width="188" height="188" rx="20" ry="20"
                          fill="none"
                          stroke={`url(#rectFlowGrad-${i})`}
                          strokeWidth="1.5"
                          strokeDasharray="8,6"
                          strokeLinecap="round"
                        />
                        <rect x="11" y="11" width="178" height="178" rx="15" ry="15"
                          fill="none"
                          stroke={`url(#rectFlowGrad-${i})`}
                          strokeWidth="1.5"
                          strokeDasharray="8,6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <h3 className="step-title" style={{
                      fontSize: 'clamp(18px, 5vw, 30px)',
                      fontWeight: 700,
                      color: '#000',
                      marginBottom: 'clamp(12px, 2vw, 16px)'
                    }}>
                      {t(s.titleKey)}
                    </h3>
                    <p className="step-description" style={{
                      fontSize: 'clamp(14px, 3.5vw, 17px)',
                      fontWeight: 400,
                      color: '#1f1d1d',
                      lineHeight: '1.65',
                      maxWidth: 'clamp(200px, 90vw, 280px)'
                    }}>
                      {t(s.descKey)}
                    </p>
                  </div>
                ));
              })()}
            </div>
            </div>


            {/* For Photographers Container - modern brand-blue card with
                motion design matching the steps section above. */}
            <div
              ref={forPhotographersRef}
              className="photographer-container hiw-pro-card"
            >
              {/* Decorative ambient layers */}
              <div className="hiw-pro-mesh" aria-hidden="true" />
              <div className="hiw-pro-grid" aria-hidden="true" />
              <div className="hiw-pro-orb hiw-pro-orb--a" aria-hidden="true" />
              <div className="hiw-pro-orb hiw-pro-orb--b" aria-hidden="true" />
              <div className="hiw-pro-particle hiw-pro-particle--1" aria-hidden="true" />
              <div className="hiw-pro-particle hiw-pro-particle--2" aria-hidden="true" />
              <div className="hiw-pro-particle hiw-pro-particle--3" aria-hidden="true" />
              <div className="hiw-pro-particle hiw-pro-particle--4" aria-hidden="true" />

              {/* Left Content */}
              <div className="hiw-pro-left">
                <div className="hiw-pro-eyebrow">
                  <span className="hiw-pro-eyebrow-dot" />
                  <span>{tl('FOR CREATORS')}</span>
                  <span className="hiw-pro-eyebrow-spark">✦</span>
                </div>
                <h2 className="photographer-title hiw-pro-title">
                  {t('howItWorks.forPhotographers.title')}
                </h2>
                <p className="photographer-description hiw-pro-desc">
                  {t('howItWorks.forPhotographers.description')}
                </p>
                <button
                  className="photographer-button hiw-pro-cta"
                  onClick={() => window.location.href = '/user/auth/signup?userType=Photographer'}
                >
                  <span className="hiw-pro-cta-shimmer" aria-hidden="true" />
                  <span className="hiw-pro-cta-content">
                    {t('howItWorks.forPhotographers.cta')}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>

                {/* Inline trust pill */}
                <div className="hiw-pro-trust" aria-hidden="true">
                  <span className="hiw-pro-trust-avatars">
                    <span /><span /><span />
                  </span>
                  <span className="hiw-pro-trust-text">
                    {tl('Joined by')} <strong>{fmtCount(stats.photographers)}</strong> {tl('photographers')}
                  </span>
                </div>
              </div>

              {/* Right Video Container - modern bezel with brand glow */}
              <div className="photographer-video-container hiw-pro-video">
                <div className="hiw-pro-video-frame">
                  {/* Top-left LIVE-style indicator on the bezel */}
                  <span className="hiw-pro-video-indicator" aria-hidden="true">
                    <span className="hiw-pro-video-indicator-dot" />
                    {tl('LIVE WORK')}
                  </span>
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="hiw-pro-video-el"
                    controls={false}
                  >
                    <source src="/vid.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mockups Device Peel Section - positioned behind How It Works with negative margin */}
        <section
          ref={mockupsSectionRef}
          className="mockups-section"
          style={{
            padding: '60px 0 130px 0',
            position: 'relative',
            overflow: 'visible',
            backgroundColor: '#DBDBDB',
            zIndex: 1,
            marginTop: '-100vh'
          }}
        >
          {/* Inner container with #1c1c1c background - Stacked Peel Effect.
              Innovations layered on top of existing peel logic:
                • Soft brand-blue spotlight halo behind the active mockup
                • Subtle drifting particles for ambient depth
                • A thin progress bar at the very bottom that tracks
                  pin progress (0→100% as the user scrolls)
                • GPU-accelerated transform layers via willChange. */}
          <div
            ref={mockupsContainerRef}
            className="mockups-inner"
            style={{
              backgroundColor: '#1c1c1c',
              borderRadius: '0',
              padding: '100px 180px 60px 180px',
              width: '100%',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Innovation layer 1: ambient brand-blue halo (gentle drift) */}
            <div className="mockups-halo mockups-halo--a" aria-hidden="true" />
            <div className="mockups-halo mockups-halo--b" aria-hidden="true" />
            {/* Innovation layer 2: floating particles */}
            <div className="mockups-particle mockups-particle--1" aria-hidden="true" />
            <div className="mockups-particle mockups-particle--2" aria-hidden="true" />
            <div className="mockups-particle mockups-particle--3" aria-hidden="true" />
            <div className="mockups-particle mockups-particle--4" aria-hidden="true" />
            <div className="mockups-particle mockups-particle--5" aria-hidden="true" />
            {/* Innovation layer 3: subtle dot grid texture for depth */}
            <div className="mockups-grid" aria-hidden="true" />
                {/* Mobile-only scroll-driven flowing texts - one per mockup phase */}
                <div ref={phoneMobileTextRef} className="mobile-mockup-text mobile-mockup-text--bottom" aria-hidden="true">
                  {t('devices.mockupHeadings.phone.line1')} {t('devices.mockupHeadings.phone.line2')}
                </div>
                <div ref={tabletMobileTextRef} className="mobile-mockup-text mobile-mockup-text--top" aria-hidden="true">
                  {t('devices.mockupHeadings.tablet.line1')} {t('devices.mockupHeadings.tablet.line2')}
                </div>
                <div ref={laptopMobileTextRef} className="mobile-mockup-text mobile-mockup-text--bottom" aria-hidden="true">
                  {t('devices.mockupHeadings.laptop.line1')} {t('devices.mockupHeadings.laptop.line2')}
                </div>
                <div className="mockups-container" style={{
                  padding: '0',
                  position: 'relative',
                  height: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>

                  {/* LEFT Side Texts Container - Tablet text only */}
                  <div style={{
                    position: 'absolute',
                    left: '-110px',
                    top: 0,
                    bottom: 0,
                    width: '300px',
                    overflow: 'hidden',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {/* Tablet Text */}
                    <div
                      ref={tabletTextRef}
                      className="mockup-heading-text"
                      style={{
                        position: 'absolute',
                        left: 0,
                        textAlign: 'left'
                      }}
                    >
                      <h2 style={{
                        fontSize: '52px',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        margin: 0,
                        background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        {t('devices.mockupHeadings.tablet.line1')}<br />{t('devices.mockupHeadings.tablet.line2')}
                      </h2>
                    </div>
                  </div>

                  {/* RIGHT Side Texts Container - Phone and Laptop texts */}
                  <div style={{
                    position: 'absolute',
                    right: '-130px',
                    top: 0,
                    bottom: 0,
                    width: '300px',
                    overflow: 'hidden',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {/* Phone Text */}
                    <div
                      ref={phoneTextRef}
                      className="mockup-heading-text"
                      style={{
                        position: 'absolute',
                        right: 0,
                        textAlign: 'right'
                      }}
                    >
                      <h2 style={{
                        fontSize: '52px',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        margin: 0,
                        background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        {t('devices.mockupHeadings.phone.line1')}<br />{t('devices.mockupHeadings.phone.line2')}
                      </h2>
                    </div>

                    {/* Laptop Text */}
                    <div
                      ref={laptopTextRef}
                      className="mockup-heading-text"
                      style={{
                        position: 'absolute',
                        right: 0,
                        textAlign: 'right'
                      }}
                    >
                      <h2 style={{
                        fontSize: '52px',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        margin: 0,
                        background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        {t('devices.mockupHeadings.laptop.line1')}<br />{t('devices.mockupHeadings.laptop.line2')}
                      </h2>
                    </div>
                  </div>

                  {/* Layer 3: Laptop Mockup - Bottom Layer (revealed last) */}
                  <div
                    ref={laptopRef}
                    className="device-laptop"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '45%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 1,
                      width: '830px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    {/* Laptop Overlay - Wireframe skeleton that peels bottom to top */}
                    <div
                      ref={laptopOverlayRef}
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        left: '-3px',
                        right: '-3px',
                        bottom: '-24px',
                        borderRadius: '28px 28px 10px 10px',
                        zIndex: 100,
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                        willChange: 'clip-path',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Laptop Wireframe SVG - Desktop browser layout */}
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 850 500"
                        preserveAspectRatio="none"
                        style={{ display: 'block' }}
                      >
                        {/* Background */}
                        <rect width="850" height="500" fill="#1c1c1c" />

                        {/* Grid pattern */}
                        <defs>
                          <pattern id="laptopGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#454545" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="850" height="500" fill="url(#laptopGrid)" opacity="0.3" />

                        {/* Browser chrome - top bar */}
                        <rect x="30" y="20" width="790" height="35" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        {/* Browser buttons */}
                        <circle cx="55" cy="37" r="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="75" cy="37" r="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="95" cy="37" r="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        {/* Address bar */}
                        <rect x="120" y="27" width="400" height="20" rx="4" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        {/* Right icons */}
                        <rect x="720" y="30" width="80" height="14" rx="3" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />

                        {/* Navigation tabs */}
                        <rect x="30" y="65" width="790" height="30" rx="0" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                        <rect x="50" y="72" width="80" height="16" rx="3" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="150" y="75" width="60" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="230" y="75" width="60" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="310" y="75" width="60" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />

                        {/* Main content - Two column layout like reference image */}
                        {/* Left column - Content area */}
                        <rect x="30" y="110" width="380" height="330" rx="8" fill="none" stroke="#00D4FF" strokeWidth="1.5" />

                        {/* Left column header */}
                        <rect x="50" y="130" width="40" height="40" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="105" y="135" width="180" height="12" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="105" y="155" width="120" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />

                        {/* Button row */}
                        <rect x="50" y="185" width="100" height="28" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="165" y="185" width="100" height="28" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />

                        {/* Text content */}
                        <rect x="50" y="235" width="340" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="50" y="255" width="300" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="50" y="275" width="320" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="50" y="295" width="280" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="50" y="315" width="310" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />

                        {/* Right column - Image/Preview area */}
                        <rect x="430" y="110" width="390" height="330" rx="8" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        {/* Image placeholder with X */}
                        <line x1="430" y1="110" x2="820" y2="440" stroke="#00D4FF" strokeWidth="0.5" opacity="0.2" />
                        <line x1="820" y1="110" x2="430" y2="440" stroke="#00D4FF" strokeWidth="0.5" opacity="0.2" />

                        {/* Cards grid in right column - 2x2 like reference image */}
                        {/* Top left card */}
                        <rect x="455" y="135" width="165" height="130" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="537" cy="180" r="22" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="480" y="220" width="115" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="495" y="240" width="85" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />

                        {/* Top right card */}
                        <rect x="635" y="135" width="165" height="130" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="717" cy="180" r="22" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="660" y="220" width="115" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="675" y="240" width="85" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />

                        {/* Bottom left card */}
                        <rect x="455" y="285" width="165" height="130" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="537" cy="330" r="22" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="480" y="365" width="115" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="495" y="385" width="85" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />

                        {/* Bottom right card */}
                        <rect x="635" y="285" width="165" height="130" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="717" cy="330" r="22" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="660" y="365" width="115" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="675" y="385" width="85" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                      </svg>
                    </div>
                    {/* Laptop Screen - Resized to fit container */}
                    <div style={{
                      width: '750px',
                      height: '420px',
                      backgroundColor: '#e8e8e8',
                      borderRadius: '26px 26px 0 0',
                      border: '3px solid #d0d0d0',
                      borderBottom: 'none',
                      boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
                      overflow: 'visible',
                      position: 'relative'
                    }}>
                {/* Screen Bezel */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '3px solid #bdbdbd',
                  borderRadius: '25px 25px 0 0',
                  pointerEvents: 'none',
                  zIndex: 4
                }} />

                {/* Webcam Notch */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '50%',
                  zIndex: 5,
                  boxShadow: 'inset 0 0 3px rgba(100,100,255,0.3), 0 0 0 2px rgba(200,200,200,0.3)'
                }} />

                {/* Browser UI */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  height: '32px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '20px 20px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  gap: '8px',
                  zIndex: 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  {/* Browser Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#ff5f56', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#ffbd2e', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#27c93f', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                  </div>
                  {/* Address Bar */}
                  <div style={{
                    flex: 1,
                    height: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#666'
                  }}>
                    🔒 connekyt.com/user/events/live-stream
                  </div>
                </div>

                {/* Screen Content */}
                <div style={{
                  position: 'absolute',
                  top: '44px',
                  left: '12px',
                  right: '12px',
                  bottom: '3px',
                  backgroundColor: '#000',
                  overflow: 'hidden',
                  borderRadius: '0'
                }}>
                  <video
                    src="/pc.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              </div>

                    {/* Laptop Base */}
                    <div style={{
                      width: '750px',
                      height: '15px',
                      backgroundColor: '#d0d0d0',
                      borderRadius: '0 0 6px 6px',
                      boxShadow: '0 3px 2px rgba(0,0,0,0.15)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 100%)'
                    }}>
                      {/* Keyboard indent */}
                      <div style={{
                        width: '85%',
                        height: '2px',
                        backgroundColor: '#c0c0c0',
                        borderRadius: '1px',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                      }} />
                    </div>

                    {/* Laptop Keyboard Base */}
                    <div style={{
                      width: '830px',
                      height: '6px',
                      backgroundColor: '#bdbdbd',
                      position: 'relative',
                      borderRadius: '0 0 8px 8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }} />
                  </div>

                  {/* Layer 2: Tablet Mockup - Middle Layer (revealed after phone peels) */}
                  <div
                    ref={tabletRef}
                    className="device-tablet"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '42%',
                      transform: 'translate(-50%, -50%)',
                      width: '400px',
                      height: '500px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      overflow: 'visible',
                      zIndex: 2
                    }}
                  >
                    {/* Tablet Overlay - Wireframe skeleton that peels bottom to top */}
                    <div
                      ref={tabletOverlayRef}
                      className="tablet-overlay"
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        left: '-3px',
                        right: '-3px',
                        bottom: '-3px',
                        borderRadius: '28px',
                        zIndex: 100,
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                        willChange: 'clip-path',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Tablet Wireframe SVG */}
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 400 510"
                        preserveAspectRatio="xMidYMid slice"
                        style={{ display: 'block' }}
                      >
                        {/* Background */}
                        <rect width="400" height="510" fill="#1c1c1c" />

                        {/* Grid pattern */}
                        <defs>
                          <pattern id="tabletGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#454545" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="400" height="510" fill="url(#tabletGrid)" opacity="0.3" />

                        {/* Status bar */}
                        <rect x="25" y="20" width="50" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="310" y="20" width="65" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1.5" />

                        {/* Header navigation */}
                        <rect x="25" y="45" width="350" height="40" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="40" y="57" width="80" height="16" rx="3" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.7" />
                        <rect x="180" y="60" width="50" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="240" y="60" width="50" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
                        <rect x="300" y="60" width="50" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />

                        {/* Hero image placeholder */}
                        <rect x="25" y="100" width="350" height="140" rx="8" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <line x1="25" y1="100" x2="375" y2="240" stroke="#00D4FF" strokeWidth="0.5" opacity="0.3" />
                        <line x1="375" y1="100" x2="25" y2="240" stroke="#00D4FF" strokeWidth="0.5" opacity="0.3" />
                        <rect x="40" y="200" width="150" height="12" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="40" y="218" width="100" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />

                        {/* Section title */}
                        <rect x="25" y="260" width="120" height="14" rx="3" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="25" y="280" width="200" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />

                        {/* Cards grid - 2x2 */}
                        {/* Card 1 */}
                        <rect x="25" y="305" width="165" height="85" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="70" cy="340" r="18" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="100" y="328" width="75" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="100" y="345" width="55" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                        <rect x="40" y="370" width="130" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />

                        {/* Card 2 */}
                        <rect x="210" y="305" width="165" height="85" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="255" cy="340" r="18" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="285" y="328" width="75" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="285" y="345" width="55" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                        <rect x="225" y="370" width="130" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />

                        {/* Card 3 */}
                        <rect x="25" y="405" width="165" height="85" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="70" cy="440" r="18" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="100" y="428" width="75" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="100" y="445" width="55" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                        <rect x="40" y="470" width="130" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />

                        {/* Card 4 */}
                        <rect x="210" y="405" width="165" height="85" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="255" cy="440" r="18" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="285" y="428" width="75" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="285" y="445" width="55" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                        <rect x="225" y="470" width="130" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                      </svg>
                    </div>
                    {/* Tablet Body - Inner container with casing styling */}
                    <div className="tablet-body" style={{
                      width: '390px',
                      height: '500px',
                      backgroundColor: '#fff',
                      borderRadius: '24px',
                      border: '2px solid #e8e8e8',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.35)',
                      position: 'relative'
                    }}>
                      {/* Power Button (Top Right) */}
                      <div style={{
                        position: 'absolute',
                        top: '55px',
                        right: '-5px',
                        width: '4px',
                        height: '40px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '0 50px 50px 0',
                        boxShadow: '2px 0 4px rgba(0,0,0,0.15), inset -1px 0 2px rgba(0,0,0,0.2)',
                        zIndex: 90
                      }} />

                      {/* Volume Up Button (Left Side) */}
                      <div style={{
                        position: 'absolute',
                        top: '100px',
                        left: '-4px',
                        width: '4px',
                        height: '35px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '50px 0 0 50px',
                        boxShadow: '-2px 0 4px rgba(0,0,0,0.15), inset 1px 0 2px rgba(0,0,0,0.2)',
                        zIndex: 90
                      }} />

                      {/* Volume Down Button (Left Side) */}
                      <div style={{
                        position: 'absolute',
                        top: '155px',
                        left: '-4px',
                        width: '4px',
                        height: '35px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '50px 0 0 50px',
                        boxShadow: '-2px 0 4px rgba(0,0,0,0.15), inset 1px 0 2px rgba(0,0,0,0.2)',
                        zIndex: 90
                      }} />

                      {/* Screen Bezel */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        right: '4px',
                        bottom: '4px',
                        backgroundColor: '#000',
                        borderRadius: '20px',
                        overflow: 'hidden'
                      }}>
                      {/* Status Bar */}
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        height: '35px',
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
                        zIndex: 90,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 20px',
                        fontSize: '11px',
                        color: '#fff',
                        fontWeight: 800
                      }}>
                        {/* Time - Left Side */}
                        <div style={{ marginTop: '3px' }}>9:41</div>

                        {/* Status Icons - Right Side */}
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '3px' }}>
                          {/* WiFi */}
                          <svg width="14" height="11" viewBox="0 0 18 14" fill="none">
                            <path d="M9 11C9.55 11 10 11.45 10 12C10 12.55 9.55 13 9 13C8.45 13 8 12.55 8 12C8 11.45 8.45 11 9 11ZM9 5C10.78 5 12.44 5.66 13.71 6.76L12.65 7.82C11.68 7.04 10.4 6.5 9 6.5C7.6 6.5 6.32 7.04 5.35 7.82L4.29 6.76C5.56 5.66 7.22 5 9 5ZM9 0C11.73 0 14.24 0.97 16.18 2.58L15.12 3.64C13.5 2.31 11.36 1.5 9 1.5C6.64 1.5 4.5 2.31 2.88 3.64L1.82 2.58C3.76 0.97 6.27 0 9 0Z" fill="white"/>
                          </svg>

                          {/* Battery */}
                          <svg width="22" height="11" viewBox="0 0 28 14" fill="none">
                            <rect x="0.5" y="1.5" width="22" height="11" rx="2.5" stroke="white" strokeWidth="1" fill="none" opacity="0.4"/>
                            <rect x="2.5" y="3.5" width="17" height="7" rx="1.5" fill="#f7d705"/>
                            <rect x="24" y="5" width="3" height="4" rx="1" fill="white" opacity="0.4"/>
                          </svg>
                        </div>
                      </div>

                      {/* Front Camera */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#000000',
                        borderRadius: '50%',
                        zIndex: 100,
                        boxShadow: 'inset 0 0 3px rgba(255,255,255,255.9), 0 0 0 3px rgba(60,60,60,0.4)'
                      }} />

                      <video
                        src="/tab.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {/* Left Ring */}
                      <img
                        src="/ring.png"
                        alt="Ring"
                        style={{
                          position: 'absolute',
                          top: '35px',
                          left: '5px',
                          width: '35px',
                          height: '28px',
                          transform: 'rotate(-45deg)',
                          zIndex: 3
                        }}
                      />
                      {/* Right Ring */}
                      <img
                        src="/ring.png"
                        alt="Ring"
                        style={{
                          position: 'absolute',
                          top: '35px',
                          right: '5px',
                          width: '35px',
                          height: '28px',
                          transform: 'rotate(45deg)',
                          zIndex: 3
                        }}
                      />

                      {/* Navigation Dock (Bottom) */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '170px',
                        height: '50px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '14px',
                        zIndex: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        padding: '0 10px',
                        boxShadow: '0 6px 10px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
                      }}>
                        {/* App Icons */}
                        <div style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: 'rgba(8, 58, 133, 0.9)',
                          borderRadius: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
                        }}>📷</div>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: 'rgba(255, 99, 99, 0.9)',
                          borderRadius: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
                        }}>🎬</div>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: 'rgba(140, 130, 255, 0.9)',
                          borderRadius: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
                        }}>💼</div>
                      </div>

                      {/* Home Indicator */}
                      <div style={{
                        position: 'absolute',
                        bottom: '70px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '70px',
                        height: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '2px',
                        zIndex: 50
                      }} />
                    </div>
                    </div>
                  </div>

                  {/* Layer 1: Phone Mockup - Top Layer (visible first with wireframe) */}
                  <div
                    ref={phoneRef}
                    className="device-phone"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '42%',
                      transform: 'translate(-50%, -50%)',
                      width: '260px',
                      height: '470px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 3,
                      overflow: 'visible'
                    }}
                  >
                    {/* Phone Overlay - Wireframe skeleton that peels bottom to top */}
                    <div
                      ref={phoneOverlayRef}
                      className="phone-overlay"
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        left: '-2px',
                        right: '-2px',
                        bottom: '-2px',
                        borderRadius: '40px',
                        zIndex: 100,
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                        willChange: 'clip-path',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Phone Wireframe SVG */}
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 260 480"
                        preserveAspectRatio="xMidYMid slice"
                        style={{ display: 'block' }}
                      >
                        {/* Background */}
                        <rect width="260" height="480" fill="#1c1c1c" />

                        {/* Grid pattern */}
                        <defs>
                          <pattern id="phoneGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#454545" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="260" height="480" fill="url(#phoneGrid)" opacity="0.3" />

                        {/* Status bar skeleton */}
                        <rect x="20" y="25" width="35" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="185" y="25" width="55" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1.5" />

                        {/* Header area */}
                        <rect x="20" y="55" width="220" height="35" rx="4" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="30" y="65" width="80" height="15" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <circle cx="220" cy="72" r="10" fill="none" stroke="#00D4FF" strokeWidth="1.5" />

                        {/* Search bar */}
                        <rect x="20" y="100" width="220" height="32" rx="16" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="45" cy="116" r="8" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="60" y="112" width="100" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />

                        {/* Card 1 - Featured */}
                        <rect x="20" y="145" width="220" height="120" rx="8" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="30" y="155" width="200" height="70" rx="4" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                        <rect x="30" y="235" width="120" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="30" y="250" width="80" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />

                        {/* Card 2 - List item */}
                        <rect x="20" y="280" width="220" height="60" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="55" cy="310" r="20" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="85" y="295" width="100" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="85" y="312" width="70" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                        <rect x="200" y="300" width="30" height="20" rx="4" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />

                        {/* Card 3 - List item */}
                        <rect x="20" y="350" width="220" height="60" rx="6" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="55" cy="380" r="20" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <rect x="85" y="365" width="110" height="10" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
                        <rect x="85" y="382" width="60" height="8" rx="2" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.4" />
                        <rect x="200" y="370" width="30" height="20" rx="4" fill="none" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />

                        {/* Bottom navigation */}
                        <rect x="20" y="425" width="220" height="45" rx="22" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="65" cy="447" r="12" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="130" cy="447" r="12" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                        <circle cx="195" cy="447" r="12" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
                      </svg>
                    </div>
                    {/* Phone Body - Inner container with casing styling */}
                    <div className="phone-body" style={{
                      width: '250px',
                      height: '470px',
                      backgroundColor: '#fff',
                      borderRadius: '36px',
                      border: '1px solid #e8e8e8',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.4)',
                      position: 'relative'
                    }}>
                      {/* Power Button (Right Side) */}
                      <div style={{
                        position: 'absolute',
                        top: '130px',
                        right: '-4px',
                        width: '4px',
                        height: '70px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '0 30px 30px 0',
                        boxShadow: '2px 0 3px rgba(0,0,0,0.15), inset -1px 0 2px rgba(0,0,0,0.2)',
                        zIndex: 90
                      }} />

                      {/* Volume Up Button (Left Side) */}
                      <div style={{
                        position: 'absolute',
                        top: '120px',
                        left: '-4px',
                        width: '4px',
                        height: '35px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '30px 0 0 30px',
                        boxShadow: '-2px 0 3px rgba(0,0,0,0.15), inset 1px 0 2px rgba(0,0,0,0.2)',
                        zIndex: 90
                      }} />

                      {/* Volume Down Button (Left Side) */}
                      <div style={{
                        position: 'absolute',
                        top: '165px',
                        left: '-4px',
                        width: '4px',
                        height: '35px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '30px 0 0 30px',
                        boxShadow: '-2px 0 3px rgba(0,0,0,0.15), inset 1px 0 2px rgba(0,0,0,0.2)',
                        zIndex: 90
                      }} />

                      {/* Mute Switch (Left Side) */}
                      <div style={{
                        position: 'absolute',
                        top: '85px',
                        left: '-3px',
                        width: '4px',
                        height: '25px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '2px 0 0 2px',
                        boxShadow: '-2px 0 3px rgba(0,0,0,0.15), inset 1px 0 2px rgba(0,0,0,0.2)',
                        zIndex: 90
                      }} />

                      {/* Screen Bezel */}
                      <div style={{
                        position: 'absolute',
                        top: '5px',
                        left: '6px',
                        right: '6px',
                        bottom: '6px',
                backgroundColor: '#000',
                borderRadius: '30px',
                overflow: 'hidden'
              }}>
                {/* Notch Container */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100px',
                  height: '20px',
                  backgroundColor: '#000',
                  borderRadius: '0 0 50px 50px',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '0 12px'
                }}>
                  {/* Front Camera */}
                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    left: '20%',
                    width: '9px',
                    height: '9px',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '50%',
                    boxShadow: 'inset 0 0 8px rgba(255,255,255,255)'
                  }} />

                  {/* Sensor */}
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    left: '37%',
                    width: '32px',
                    height: '5px',
                    backgroundColor: '#0f0f0f',
                    borderRadius: '2.5px',
                    boxShadow: 'inset 0 1px 3px rgba(255,255,255,255)'
                  }} />
                </div>

                {/* Status Bar Background (behind notch) */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  height: '40px',
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 70%, transparent 100%)',
                  zIndex: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 15px',
                  fontSize: '10px',
                  color: '#fff',
                  fontWeight: 500
                }}>
                  {/* Time - Left Side */}
                  <div style={{ marginTop: '2px', fontWeight: 600, fontSize: '11px'}}>9:41</div>

                  {/* Status Icons - Right Side */}
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginTop: '1px' }}>
                    {/* Signal Bars */}
                    <svg width="10" height="9" viewBox="0 0 14 10" fill="none">
                      <rect x="0" y="6" width="2" height="4" rx="0.5" fill="white" opacity="9.8"/>
                      <rect x="4" y="4" width="2" height="6" rx="0.5" fill="white" opacity="9.8"/>
                      <rect x="8" y="2" width="2" height="8" rx="0.5" fill="white"/>
                      <rect x="12" y="0" width="2" height="10" rx="0.5" fill="white"/>
                    </svg>

                    {/* WiFi */}
                    <svg width="18" height="9" viewBox="0 0 18 13" fill="white" opacity="9" >
                      <path d="M9 11C9.55 11 10 11.45 10 12C10 12.55 9.55 13 9 13C8.45 13 8 12.55 8 12C8 11.45 8.45 11 9 11ZM9 5C10.78 5 12.44 5.66 13.71 6.76L12.65 7.82C11.68 7.04 10.4 6.5 9 6.5C7.6 6.5 6.32 7.04 5.35 7.82L4.29 6.76C5.56 5.66 7.22 5 9 5ZM9 0C11.73 0 14.24 0.97 16.18 2.58L15.12 3.64C13.5 2.31 11.36 1.5 9 1.5C6.64 1.5 4.5 2.31 2.88 3.64L1.82 2.58C3.76 0.97 6.27 0 9 0Z" fill="white"/>
                    </svg>

                     {/* Battery */}
                    <svg width="24" height="10" viewBox="0 0 28 14" fill="none">
                      <rect x="0.5" y="1.5" width="22" height="11" rx="2.5" stroke="white" strokeWidth="1" fill="none" opacity="9"/>
                      <rect x="2.5" y="3.5" width="17" height="7" rx="1.5" fill="#ffffff"/>
                      <rect x="24" y="5" width="3" height="4" rx="1" fill="white" opacity="9.4"/>
                    </svg>
                  </div>
                </div>

                {/* Video Content */}
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                >
                  <source src="/phone.mp4" type="video/mp4" />
                </video>

                {/* Bottom Navigation Bar with Controls */}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  height: '80px',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
                  zIndex: 9,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '0 20px 15px'
                }}>
                  {/* Control Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '30px',
                    marginBottom: '12px',
                    alignItems: 'center'
                  }}>
                    {/* Capture Button */}
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '4px solid rgba(255, 255, 255, 0.5)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                    }} />
                  </div>
                </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </section>

        {/* Why Amoria connekyt Only Section */}
        <section
          ref={whyAmoriaSectionRef}
          className="why-amoria-section"
          style={{
            backgroundColor: '#f8fafc',
            padding: '70px 0',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 3,
            marginTop: '-100vh'
          }}
        >
          {/* Background Decorative Elements */}
          {/* Top-left decorative icon */}
          <div className="why-amoria-decorative" style={{
            position: 'absolute',
            top: '15%',
            left: '3%',
            width: '60px',
            height: '60px',
            opacity: 0.01,
            zIndex: 0
          }}>
            <svg viewBox="0 0 100 100" fill="none" stroke="#083A85" strokeWidth="3">
              <polygon points="50,10 90,90 10,90"/>
            </svg>
          </div>
          {/* Bottom-left circle icon */}
          <div className="why-amoria-decorative" style={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: '50px',
            height: '50px',
            opacity: 0.4,
            zIndex: 0
          }}>
            <svg viewBox="0 0 100 100" fill="none" stroke="#083A85" strokeWidth="3">
              <circle cx="50" cy="50" r="40"/>
              <text x="50" y="60" textAnchor="middle" fontSize="30" fill="#083A85">$</text>
            </svg>
          </div>
          {/* Right side decorative icon */}
          <div className="why-amoria-decorative" style={{
            position: 'absolute',
            top: '30%',
            right: '3%',
            width: '70px',
            height: '70px',
            opacity: 0.4,
            zIndex: 0
          }}>
            <svg viewBox="0 0 100 100" fill="none" stroke="#083A85" strokeWidth="2">
              <path d="M50 10 L90 50 L50 90 L10 50 Z"/>
              <circle cx="50" cy="50" r="15" fill="#083A85" opacity="0.3"/>
            </svg>
          </div>
          {/* Bottom-right decorative */}
          <div className="why-amoria-decorative" style={{
            position: 'absolute',
            bottom: '15%',
            right: '5%',
            width: '55px',
            height: '55px',
            opacity: 0.4,
            zIndex: 0
          }}>
            <svg viewBox="0 0 100 100" fill="none" stroke="#083A85" strokeWidth="2">
              <rect x="20" y="20" width="60" height="60" rx="8"/>
              <rect x="35" y="35" width="30" height="30" rx="4"/>
            </svg>
          </div>

          {/* Ambient brand halos - soft drifting blue glows */}
          <div className="wa-halo wa-halo--a" aria-hidden="true" />
          <div className="wa-halo wa-halo--b" aria-hidden="true" />

          {/* Floating sparkle particles for depth */}
          <span className="wa-particle wa-particle--1" aria-hidden="true" />
          <span className="wa-particle wa-particle--2" aria-hidden="true" />
          <span className="wa-particle wa-particle--3" aria-hidden="true" />
          <span className="wa-particle wa-particle--4" aria-hidden="true" />
          <span className="wa-particle wa-particle--5" aria-hidden="true" />

          {/* Decorative center backdrop crest - concentric dashed circles
              that slowly counter-rotate, sitting behind the dashboard */}
          <svg className="wa-crest" viewBox="0 0 600 600" aria-hidden="true">
            <circle cx="300" cy="300" r="280" fill="none" stroke="#083A85" strokeWidth="1" strokeDasharray="2 8" opacity="0.18" className="wa-crest-ring wa-crest-ring--outer" />
            <circle cx="300" cy="300" r="220" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 6" opacity="0.20" className="wa-crest-ring wa-crest-ring--mid" />
            <circle cx="300" cy="300" r="160" fill="none" stroke="#083A85" strokeWidth="1" strokeDasharray="2 4" opacity="0.14" className="wa-crest-ring wa-crest-ring--inner" />
          </svg>

          {/* Geometric corner ornaments - slowly rotating brand glyphs */}
          <span className="wa-corner wa-corner--tl" aria-hidden="true">
            <svg viewBox="0 0 60 60" fill="none">
              <polygon points="30,4 56,30 30,56 4,30" stroke="#083A85" strokeWidth="1.5" />
              <polygon points="30,16 44,30 30,44 16,30" stroke="#3b82f6" strokeWidth="1" />
              <circle cx="30" cy="30" r="3" fill="#083A85" />
            </svg>
          </span>
          <span className="wa-corner wa-corner--tr" aria-hidden="true">
            <svg viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="26" stroke="#7763FF" strokeWidth="1.5" strokeDasharray="3 4" />
              <circle cx="30" cy="30" r="14" stroke="#083A85" strokeWidth="1" />
              <circle cx="30" cy="30" r="3" fill="#7763FF" />
            </svg>
          </span>
          <span className="wa-corner wa-corner--bl" aria-hidden="true">
            <svg viewBox="0 0 60 60" fill="none">
              <rect x="6" y="6" width="48" height="48" rx="8" stroke="#FF6363" strokeWidth="1.5" />
              <rect x="18" y="18" width="24" height="24" rx="4" stroke="#3b82f6" strokeWidth="1" />
              <circle cx="30" cy="30" r="3" fill="#FF6363" />
            </svg>
          </span>
          <span className="wa-corner wa-corner--br" aria-hidden="true">
            <svg viewBox="0 0 60 60" fill="none">
              <path d="M 30 4 L 56 30 L 30 56 L 4 30 Z" stroke="#083A85" strokeWidth="1.5" strokeDasharray="3 5" />
              <path d="M 30 14 L 46 30 L 30 46 L 14 30 Z" stroke="#3b82f6" strokeWidth="1" />
              <circle cx="30" cy="30" r="3" fill="#083A85" />
            </svg>
          </span>

          {/* Interactive DotGrid - 2px dots with 15px gap. Dim slate at rest → primary
              brand-blue on cursor proximity, with GSAP InertiaPlugin push and click shockwave. */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
            <DotGrid
              dotSize={2}
              gap={15}
              baseColor="#CBD5E1"
              activeColor="#083A85"
              proximity={120}
              shockRadius={180}
              shockStrength={4}
              resistance={750}
              returnDuration={1.4}
            />
          </div>

          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Section Header - premium eyebrow + gradient italic last word */}
            <div className="why-amoria-header wa-header" style={{
              maxWidth: '780px',
              margin: '0 auto 120px',
              textAlign: 'center'
            }}>
              <div className="wa-eyebrow" aria-hidden="true">
                <span className="wa-eyebrow-dot" />
                <span>WHY CONNEKYT</span>
                <span className="wa-eyebrow-spark">✦</span>
              </div>
              <h2 className="why-amoria-title wa-title" style={{
                fontSize: '50px',
                fontWeight: 1000,
                marginBottom: '24px',
                color: '#000',
                letterSpacing: '-0.02em'
              }}>
                {(() => {
                  const words = t('whyAmoria.title').split(/\s+/).filter(Boolean);
                  const lastIdx = words.length - 1;
                  return words.map((w, i) => (
                    <span key={i} style={{ display: 'inline-block', marginRight: i === lastIdx ? 0 : '0.28em' }}>
                      {i === lastIdx ? (
                        <span style={{
                          fontStyle: 'italic',
                          fontWeight: 'inherit',
                          background: 'linear-gradient(135deg, #083A85 0%, #3b82f6 55%, #7763FF 100%)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'transparent',
                          // Italic slant pushes the right edge of glyphs
                          // (especially "?") past the inline-block clip
                          // box. paddingRight gives the gradient text room
                          // to render its full slanted right edge.
                          display: 'inline-block',
                          paddingRight: '0.12em',
                          paddingLeft: '0.04em',
                        }}>{w}</span>
                      ) : w}
                    </span>
                  ));
                })()}
              </h2>
              <div className="wa-accent-line" aria-hidden="true">
                <span />
              </div>
              <p className="why-amoria-subtitle wa-subtitle" style={{
                fontSize: '18px',
                fontWeight: 500,
                color: '#1f1d1d',
                lineHeight: '1.7',
              }}>
                {t('whyAmoria.subtitle')}
              </p>
            </div>

            {/* Overlapping Cards Layout */}
            <div className="why-amoria-dashboard" style={{
              position: 'relative',
              maxWidth: '1100px',
              margin: '0 auto',
              height: '650px'
            }}>
              {/* Connection Lines SVG */}
              <svg
                className="why-amoria-connections"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  top: 0,
                  left: 0,
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
                viewBox="0 0 1100 650"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="lineGradientAmoria" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#083A85" stopOpacity="0.5"/>
                    <stop offset="50%" stopColor="#083A85" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#083A85" stopOpacity="0.5"/>
                  </linearGradient>
                </defs>
                {/* Top line - straight horizontal */}
                <path d="M 60 20 L 1040 20"
                  stroke="#083A85" strokeWidth="2" fill="none" strokeDasharray="10,8" strokeLinecap="round" opacity="1"/>

                {/* Right line - straight vertical */}
                <path d="M 1090 60 L 1090 590"
                  stroke="#083A85" strokeWidth="2" fill="none" strokeDasharray="10,8" strokeLinecap="round" opacity="1"/>

                {/* Bottom line - straight horizontal */}
                <path d="M 1040 630 L 60 630"
                  stroke="#083A85" strokeWidth="2" fill="none" strokeDasharray="10,8" strokeLinecap="round" opacity="1"/>

                {/* Left line - straight vertical */}
                <path d="M 10 590 L 10 60"
                  stroke="#083A85" strokeWidth="2" fill="none" strokeDasharray="10,8" strokeLinecap="round" opacity="1"/>

                {/* Corner arcs */}
                <path d="M 1040 20 Q 1090 20 1090 60" stroke="#083A85" strokeWidth="3" fill="none" strokeDasharray="10,8" strokeLinecap="round" opacity="1"/>
                <path d="M 1090 590 Q 1090 630 1040 630" stroke="#083A85" strokeWidth="3" fill="none" strokeDasharray="10,8" strokeLinecap="round" opacity="1"/>
                <path d="M 60 630 Q 10 630 10 590" stroke="#083A85" strokeWidth="3" fill="none" strokeDasharray="10,8" strokeLinecap="round" opacity="1"/>
                <path d="M 10 60 Q 10 20 60 20" stroke="#083A85" strokeWidth="3" fill="none" strokeDasharray="10,8" strokeLinecap="round" opacity="1"/>

                {/* Animated full-perimeter loop - invisible path used for
                    the traveling pulse below. animateMotion follows it. */}
                <path
                  id="wa-connection-loop"
                  d="M 60 20 L 1040 20 Q 1090 20 1090 60 L 1090 590 Q 1090 630 1040 630 L 60 630 Q 10 630 10 590 L 10 60 Q 10 20 60 20 Z"
                  fill="none"
                  stroke="none"
                />
                {/* Traveling glow pulse - circulates the perimeter every 12s */}
                <circle r="6" fill="#3b82f6" opacity="0.95">
                  <animateMotion dur="12s" repeatCount="indefinite" rotate="auto">
                    <mpath xlinkHref="#wa-connection-loop" />
                  </animateMotion>
                </circle>
                <circle r="14" fill="#3b82f6" opacity="0.20">
                  <animateMotion dur="12s" repeatCount="indefinite">
                    <mpath xlinkHref="#wa-connection-loop" />
                  </animateMotion>
                </circle>
              </svg>

              {/* LARGE CARD - Gallery - Center background */}
              <div
                className="why-amoria-card why-amoria-card-large"
                onMouseEnter={() => setActiveCard(3)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '820px',
                  backgroundColor: '#fff',
                  borderRadius: '24px',
                  boxShadow: activeCard === 3
                    ? '0 30px 70px rgba(8, 58, 133, 0.25)'
                    : '0 20px 50px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 1
                }}
              >
                <div style={{
                  height: '350px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <img
                    src="/gallery.png"
                    alt="Full Event Gallery"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div style={{ padding: '44px 20px' }}>
                </div>
              </div>

              {/* MEDIUM CARD - Rated Photographers - Top Left overlapping */}
              <div
                className="why-amoria-card why-amoria-card-medium"
                onMouseEnter={() => setActiveCard(0)}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '-50px',
                  width: '340px',
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  boxShadow: activeCard === 0
                    ? '0 24px 60px rgba(8, 58, 133, 0.3)'
                    : '0 12px 35px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeCard === 0 ? 'scale(1.05)' : 'scale(1)',
                  zIndex: activeCard === 0 ? 10 : 3
                }}
              >
                <div style={{ padding: '12px 14px 14px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#083A85',
                    marginBottom: '4px'
                  }}>
                    {t('whyAmoria.ratedPhotographers.title')}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#000',
                    lineHeight: '1.4',
                    margin: 0,
                    marginBottom: '10px'
                  }}>
                    {t('whyAmoria.ratedPhotographers.description')}
                  </p>
                  <div style={{
                    height: '200px',
                    borderRadius: '14px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src="/rated.png"
                      alt="Rated Photographers"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* BASE CARD - Secure Payments - Bottom Left overlapping */}
              <div
                className="why-amoria-card why-amoria-card-base"
                onMouseEnter={() => setActiveCard(2)}
                style={{
                  position: 'absolute',
                  bottom: '-60px',
                  left: '70px',
                  width: '320px',
                  backgroundColor: '#fff',
                  borderRadius: '18px',
                  boxShadow: activeCard === 2
                    ? '0 22px 55px rgba(8, 58, 133, 0.28)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeCard === 2 ? 'scale(1.05)' : 'scale(1)',
                  zIndex: activeCard === 2 ? 10 : 4
                }}
              >
                <div style={{ padding: '12px 14px 14px' }}>
                  <div style={{
                    height: '180px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img
                      src="/pay.png"
                      alt="Secure Payments"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      color: '#16a34a',
                      padding: '5px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                      Secured
                    </div>
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#083A85',
                    marginTop: '10px',
                    marginBottom: '4px'
                  }}>
                    {t('whyAmoria.securePayments.title')}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#000',
                    lineHeight: '1.4',
                    margin: 0
                  }}>
                    {t('whyAmoria.securePayments.description')}
                  </p>
                </div>
              </div>

              {/* SECOND LARGE CARD - Live Streaming - Top Right overlapping */}
              <div
                className="why-amoria-card why-amoria-card-small"
                onMouseEnter={() => setActiveCard(1)}
                style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-60px',
                  width: '380px',
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  boxShadow: activeCard === 1
                    ? '0 24px 60px rgba(8, 58, 133, 0.3)'
                    : '0 12px 35px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeCard === 1 ? 'scale(1.05)' : 'scale(1)',
                  zIndex: activeCard === 1 ? 10 : 5
                }}
              >
                <div style={{ padding: '12px 14px 14px' }}>
                  <div style={{
                    height: '240px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img
                      src="/live.png"
                      alt="Live Streaming"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#dc2626',
                      color: '#fff',
                      padding: '5px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite'
                      }}/>
                      LIVE
                    </div>
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#083A85',
                    marginTop: '10px',
                    marginBottom: '4px'
                  }}>
                    {t('whyAmoria.liveStreaming.title')}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#000',
                    lineHeight: '1.4',
                    margin: 0
                  }}>
                    {t('whyAmoria.liveStreaming.description')}
                  </p>
                </div>
              </div>

              {/* Extra small accent card - Bottom Right - Facial Recognition */}
              <div
                className="why-amoria-card-accent"
                onMouseEnter={() => setActiveCard(4)}
                onClick={() => window.location.href = '/user/find-my-photos'}
                style={{
                  position: 'absolute',
                  bottom: '-30px',
                  right: '120px',
                  width: '320px',
                  backgroundColor: '#fff',
                  borderRadius: '18px',
                  boxShadow: activeCard === 4
                    ? '0 22px 55px rgba(8, 58, 133, 0.28)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeCard === 4 ? 'scale(1.05)' : 'scale(1)',
                  zIndex: activeCard === 4 ? 10 : 2
                }}
              >
                <div style={{ padding: '12px 14px 14px' }}>
                  <div style={{
                    height: '180px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img
                      src="/scan.png"
                      alt="Facial Recognition"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      color: '#083A85',
                      padding: '5px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                      </svg>
                      {tl('AI Scan')}
                    </div>
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#083A85',
                    marginTop: '10px',
                    marginBottom: '4px'
                  }}>
                    {tl('Facial Recognition')}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#000',
                    lineHeight: '1.4',
                    margin: 0
                  }}>
                    {tl('Instantly find photos of you captured by event photographers.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Promise marquee - continuous scrolling strip of brand
                promises below the dashboard. Doubles the content for a
                seamless infinite loop. */}
            <div className="wa-marquee" aria-label="Platform promises">
              <div className="wa-marquee-track">
                {[
                  { i: 'bi-shield-check', t: 'Verified pros only' },
                  { i: 'bi-cash-coin', t: 'Secure payments' },
                  { i: 'bi-broadcast', t: '4K live streaming' },
                  { i: 'bi-stars', t: '4.9 average rating' },
                  { i: 'bi-camera-fill', t: 'AI photo finder' },
                  { i: 'bi-globe2', t: 'Global coverage' },
                  { i: 'bi-headset', t: '24/7 support' },
                  { i: 'bi-lightning-charge-fill', t: 'Instant booking' },
                ].concat([
                  { i: 'bi-shield-check', t: 'Verified pros only' },
                  { i: 'bi-cash-coin', t: 'Secure payments' },
                  { i: 'bi-broadcast', t: '4K live streaming' },
                  { i: 'bi-stars', t: '4.9 average rating' },
                  { i: 'bi-camera-fill', t: 'AI photo finder' },
                  { i: 'bi-globe2', t: 'Global coverage' },
                  { i: 'bi-headset', t: '24/7 support' },
                  { i: 'bi-lightning-charge-fill', t: 'Instant booking' },
                ]).map((p, i) => (
                  <span key={i} className="wa-marquee-item">
                    <i className={`bi ${p.i}`} aria-hidden="true" />
                    {tl(p.t)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }

          /* ─── Hero CTA buttons - premium gradient + ghost variants ── */
          .hero-cta {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 10px 18px;
            border-radius: 11px;
            font-family: 'Pragati Narrow', sans-serif;
            font-size: 13.5px;
            font-weight: 700;
            letter-spacing: 0.01em;
            cursor: pointer;
            border: 1.5px solid transparent;
            overflow: hidden;
            isolation: isolate;
            transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 200ms ease, box-shadow 220ms ease;
          }
          .hero-cta--primary {
            background: #083A85;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(8, 58, 133, 0.20);
          }
          .hero-cta--primary:hover {
            transform: translateY(-2px);
            background: #062d6b;
            box-shadow: 0 8px 18px rgba(8, 58, 133, 0.30);
          }
          .hero-cta--primary:active { transform: translateY(0) scale(0.98); }
          /* Shimmer kept as a no-op so existing JSX nodes don't break */
          .hero-cta-shimmer { display: none; }
          .hero-cta-content {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            z-index: 1;
          }
          .hero-cta--ghost {
            background: rgba(255, 255, 255, 0.55);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            color: #083A85;
            border-color: rgba(8, 58, 133, 0.30);
          }
          .hero-cta--ghost:hover {
            background: rgba(255, 255, 255, 0.85);
            border-color: rgba(8, 58, 133, 0.55);
            transform: translateY(-2px);
          }
          .hero-cta--ghost i { font-size: 14px; }

          /* Hero title - subtle gradient sheen on the second + third lines */
          .hero-title { text-shadow: 0 1px 2px rgba(255, 255, 255, 0.45); }

          /* ─── Hero innovation layer ─────────────────────────────────
             Decorative orbs, dot grid, eyebrow pill, and trust strip. */
          .hero-deco-grid {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 1;
            background-image:
              radial-gradient(rgba(8, 58, 133, 0.10) 1px, transparent 1.5px);
            background-size: 22px 22px;
            mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 80%);
            -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 80%);
            opacity: 0.55;
          }
          .hero-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(60px);
            pointer-events: none;
            z-index: 1;
            mix-blend-mode: screen;
            opacity: 0.55;
            animation: hero-orb-drift 18s ease-in-out infinite;
          }
          .hero-orb--blue {
            top: -120px;
            right: -100px;
            width: 360px;
            height: 360px;
            background: radial-gradient(circle, rgba(8, 58, 133, 0.55) 0%, rgba(31, 107, 255, 0.30) 50%, rgba(31, 107, 255, 0) 80%);
            animation-duration: 16s;
          }
          .hero-orb--coral {
            bottom: -80px;
            left: -60px;
            width: 280px;
            height: 280px;
            background: radial-gradient(circle, rgba(255, 99, 99, 0.45) 0%, rgba(244, 63, 94, 0.25) 50%, rgba(244, 63, 94, 0) 80%);
            animation-duration: 22s;
            animation-direction: reverse;
            animation-delay: -4s;
          }
          .hero-orb--cyan {
            top: 40%;
            left: 38%;
            width: 220px;
            height: 220px;
            background: radial-gradient(circle, rgba(96, 165, 250, 0.30) 0%, rgba(96, 165, 250, 0) 80%);
            animation-duration: 26s;
            animation-delay: -8s;
            opacity: 0.40;
          }
          @keyframes hero-orb-drift {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33%      { transform: translate(40px, -30px) scale(1.08); }
            66%      { transform: translate(-30px, 25px) scale(0.94); }
          }
          .hero-edge-line {
            position: absolute;
            left: 5%;
            right: 5%;
            bottom: 0;
            height: 1px;
            background: linear-gradient(90deg, rgba(8, 58, 133, 0) 0%, rgba(8, 58, 133, 0.30) 50%, rgba(8, 58, 133, 0) 100%);
            pointer-events: none;
            z-index: 1;
          }

          /* Eyebrow pill */
          .hero-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 5px 12px 5px 10px;
            margin-bottom: 12px;
            align-self: flex-start;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.10) 0%, rgba(255, 99, 99, 0.08) 100%);
            border: 1px solid rgba(8, 58, 133, 0.18);
            border-radius: 999px;
            font-family: 'Pragati Narrow', sans-serif;
            font-size: 11px;
            font-weight: 800;
            color: #083A85;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px -4px rgba(8, 58, 133, 0.30);
          }
          .hero-eyebrow-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: linear-gradient(135deg, #083A85 0%, #FF6363 100%);
            box-shadow: 0 0 10px rgba(8, 58, 133, 0.65);
            animation: hero-eyebrow-pulse 1.6s ease-in-out infinite;
          }
          @keyframes hero-eyebrow-pulse {
            0%, 100% { transform: scale(1); }
            50%      { transform: scale(1.30); }
          }
          .hero-eyebrow-sparkle {
            font-size: 12px;
            line-height: 1;
            animation: hero-eyebrow-twinkle 2.4s ease-in-out infinite;
          }
          @keyframes hero-eyebrow-twinkle {
            0%, 100% { opacity: 0.55; transform: rotate(0deg); }
            50%      { opacity: 1.00; transform: rotate(20deg); }
          }

          /* Trust strip - 4-cell credibility row below the buttons */
          .hero-trust {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px dashed rgba(8, 58, 133, 0.18);
            max-width: 460px;
          }
          .hero-trust-cell {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }
          .hero-trust-icon {
            width: 26px;
            height: 26px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            flex-shrink: 0;
            box-shadow: 0 3px 8px -2px rgba(8, 58, 133, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.20);
          }
          .hero-trust-icon svg { width: 12px; height: 12px; }
          .hero-trust-icon--blue { background: linear-gradient(135deg, #083A85 0%, #1f6bff 100%); }
          .hero-trust-icon--red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
          .hero-trust-icon--gold { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); }
          .hero-trust-icon--green { background: linear-gradient(135deg, #10b981 0%, #047857 100%); }
          .hero-trust-text {
            display: flex;
            flex-direction: column;
            line-height: 1.10;
            min-width: 0;
          }
          .hero-trust-text strong {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.005em;
            font-family: 'Pragati Narrow', sans-serif;
          }
          .hero-trust-text span {
            font-size: 10.5px;
            font-weight: 600;
            color: #64748b;
            letter-spacing: 0.02em;
            margin-top: 2px;
          }
          @media (max-width: 700px) {
            .hero-trust {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              margin-top: 22px;
              padding-top: 18px;
              max-width: 100%;
            }
            .hero-eyebrow { font-size: 10px; padding: 5px 12px 5px 10px; }
            .hero-orb { opacity: 0.30; }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-orb,
            .hero-eyebrow-dot,
            .hero-eyebrow-sparkle {
              animation: none !important;
            }
          }

          /* ─── How It Works - modern motion redesign ─────────────── */

          /* Title group: eyebrow + title + accent line + subtitle */
          .hiw-title-group {
            text-align: center;
            margin-bottom: clamp(40px, 8vw, 100px);
          }
          .hiw-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            padding: 6px 14px 6px 11px;
            margin-bottom: 18px;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.08) 0%, rgba(96, 165, 250, 0.10) 100%);
            border: 1px solid rgba(8, 58, 133, 0.20);
            border-radius: 999px;
            font-family: 'Pragati Narrow', sans-serif;
            font-size: 11px;
            font-weight: 800;
            color: #083A85;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            box-shadow: 0 4px 12px -4px rgba(8, 58, 133, 0.25);
            animation: hiw-eyebrow-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
          }
          .hiw-eyebrow-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: linear-gradient(135deg, #083A85 0%, #3b82f6 100%);
            box-shadow: 0 0 8px rgba(8, 58, 133, 0.65);
            animation: hiw-eyebrow-pulse 1.6s ease-in-out infinite;
          }
          .hiw-eyebrow-sparkle {
            font-size: 11px;
            color: #3b82f6;
            animation: hiw-eyebrow-twinkle 2.4s ease-in-out infinite;
          }
          @keyframes hiw-eyebrow-rise {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes hiw-eyebrow-pulse {
            0%, 100% { transform: scale(1); }
            50%      { transform: scale(1.30); }
          }
          @keyframes hiw-eyebrow-twinkle {
            0%, 100% { opacity: 0.55; transform: rotate(0deg) scale(0.9); }
            50%      { opacity: 1.00; transform: rotate(180deg) scale(1.1); }
          }
          .hiw-title {
            position: relative;
            background: linear-gradient(135deg, #000000 0%, #0a1f4a 30%, #083A85 60%, #1d4ed8 100%);
            -webkit-background-clip: text;
                    background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            animation: hiw-title-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) 100ms backwards;
          }
          @keyframes hiw-title-rise {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          /* Brand-blue accent line below the title */
          .hiw-accent-line {
            position: relative;
            display: flex;
            justify-content: center;
            margin: 0 auto 14px;
            width: 100%;
            max-width: 200px;
            height: 4px;
          }
          .hiw-accent-line span {
            display: block;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent 0%, #083A85 25%, #3b82f6 50%, #083A85 75%, transparent 100%);
            border-radius: 999px;
            background-size: 200% 100%;
            animation: hiw-accent-shimmer 3s linear infinite;
          }
          @keyframes hiw-accent-shimmer {
            from { background-position: 200% 0; }
            to   { background-position: -200% 0; }
          }
          .hiw-subtitle {
            font-size: 15px;
            color: #475569;
            max-width: 480px;
            margin: 0 auto;
            line-height: 1.55;
            font-weight: 500;
            animation: hiw-eyebrow-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) 280ms backwards;
          }

          /* Step entry - stagger fade-up */
          .hiw-step {
            animation: hiw-step-rise 800ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
          }
          @keyframes hiw-step-rise {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          /* Avatar wrap - hover lift + 3D tilt feel */
          .hiw-avatar-wrap {
            transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          .hiw-avatar-wrap:hover {
            transform: translateY(-6px) scale(1.02);
          }

          /* Avatar image - hover scale + softer drop shadow */
          .hiw-step-img {
            transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1), filter 320ms ease;
            filter: drop-shadow(0 10px 24px rgba(8, 58, 133, 0.18));
          }
          .hiw-avatar-wrap:hover .hiw-step-img {
            transform: scale(1.04);
            filter: drop-shadow(0 18px 32px rgba(8, 58, 133, 0.32));
          }

          /* Brand-blue halo behind avatar - pulses gently */
          .hiw-halo {
            position: absolute;
            inset: 8%;
            border-radius: 50%;
            background:
              radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.30) 0%, rgba(59, 130, 246, 0.18) 35%, rgba(8, 58, 133, 0) 70%);
            filter: blur(20px);
            z-index: 0;
            pointer-events: none;
            animation: hiw-halo-breathe 4s ease-in-out infinite;
          }
          .hiw-avatar-wrap:hover .hiw-halo {
            background:
              radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.45) 0%, rgba(59, 130, 246, 0.28) 35%, rgba(8, 58, 133, 0) 70%);
          }
          @keyframes hiw-halo-breathe {
            0%, 100% { transform: scale(1.00); opacity: 0.85; }
            50%      { transform: scale(1.08); opacity: 1.00; }
          }

          /* ─── Orbital ring system - rounded-rect rings hugging the card ── */

          /* SVG rings stretch to fit the rectangular avatar wrap exactly,
             so the dashed strokes follow the card outline instead of
             extending past its corners. */
          .hiw-ring {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
          }
          .hiw-ring--outer {
            opacity: 0.55;
            transition: opacity 400ms ease;
          }
          .hiw-avatar-wrap:hover .hiw-ring--outer { opacity: 1; }
          .hiw-ring--inner {
            opacity: 1;
          }

          /* Orbital dot - uses SVG animateMotion to travel along a rounded
             rectangle path that traces the card outline. The mpath ensures
             the dot follows the card shape regardless of aspect ratio. */
          .hiw-orbital-dot-svg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 3;
            overflow: visible;
          }

          /* Shimmer ribbon - diagonal shine sweep across the avatar.
             Clipped to the wrap's bounds to avoid bleeding past the card. */
          .hiw-shimmer-ribbon {
            position: absolute;
            inset: 0;
            overflow: hidden;
            border-radius: 24px;
            pointer-events: none;
            z-index: 2;
          }
          .hiw-shimmer-ribbon::before {
            content: '';
            position: absolute;
            top: -25%;
            left: -25%;
            width: 150%;
            height: 150%;
            background: linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.45) 50%, transparent 60%);
            animation: hiw-shimmer 10s linear infinite;
            mix-blend-mode: screen;
          }
          @keyframes hiw-shimmer {
            0%   { transform: translateX(-60%); }
            100% { transform: translateX(60%); }
          }

          /* Step number badge - top-right corner of avatar */
          .hiw-step-badge {
            position: absolute;
            top: -6px;
            right: -10px;
            z-index: 5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #083A85 0%, #1d4ed8 50%, #3b82f6 100%);
            color: #ffffff;
            box-shadow:
              0 10px 24px -6px rgba(8, 58, 133, 0.55),
              inset 0 1px 0 rgba(255, 255, 255, 0.20);
            border: 2px solid #ffffff;
            font-family: 'Pragati Narrow', sans-serif;
            transform: rotate(0deg);
            transition: transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
            animation: hiw-badge-pulse 2.4s ease-in-out infinite;
          }
          .hiw-step-badge-num {
            font-size: 18px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -0.02em;
          }
          .hiw-step-badge-label {
            font-size: 7.5px;
            font-weight: 800;
            letter-spacing: 0.20em;
            opacity: 0.85;
            margin-top: 1px;
          }
          .hiw-avatar-wrap:hover .hiw-step-badge {
            transform: rotate(-8deg) scale(1.06);
          }
          @keyframes hiw-badge-pulse {
            0%, 100% { box-shadow: 0 10px 24px -6px rgba(8, 58, 133, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.20), 0 0 0 0 rgba(59, 130, 246, 0.55); }
            50%      { box-shadow: 0 10px 24px -6px rgba(8, 58, 133, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.20), 0 0 0 12px rgba(59, 130, 246, 0); }
          }

          /* Mobile: smaller badge + simplified orbital system */
          @media (max-width: 768px) {
            .hiw-step-badge {
              width: 48px;
              height: 48px;
              top: 4px;
              right: 4px;
            }
            .hiw-step-badge-num { font-size: 15px; }
            .hiw-step-badge-label { font-size: 6.5px; }
            .hiw-particle { display: none; }
          }

          /* ─── For Creators card - modern brand-blue redesign ─────── */
          .hiw-pro-card {
            position: relative;
            margin-top: 60px;
            padding: 48px;
            border-radius: 28px;
            background:
              radial-gradient(ellipse 80% 60% at 90% 10%, rgba(59, 130, 246, 0.30) 0%, rgba(59, 130, 246, 0) 60%),
              radial-gradient(ellipse 60% 80% at 0% 100%, rgba(96, 165, 250, 0.20) 0%, rgba(96, 165, 250, 0) 65%),
              linear-gradient(135deg, #052047 0%, #083A85 50%, #0a4da3 100%);
            border: 1px solid rgba(96, 165, 250, 0.20);
            box-shadow:
              0 32px 80px -20px rgba(8, 58, 133, 0.55),
              0 1px 0 rgba(255, 255, 255, 0.10) inset;
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            align-items: center;
            gap: 48px;
            overflow: hidden;
            isolation: isolate;
          }
          /* Animated mesh gradient overlay */
          .hiw-pro-mesh {
            position: absolute;
            inset: 0;
            background:
              radial-gradient(ellipse 50% 40% at 30% 30%, rgba(96, 165, 250, 0.20) 0%, rgba(96, 165, 250, 0) 60%),
              radial-gradient(ellipse 40% 50% at 70% 80%, rgba(29, 78, 216, 0.25) 0%, rgba(29, 78, 216, 0) 60%);
            pointer-events: none;
            z-index: 0;
            animation: hiw-pro-mesh-drift 14s ease-in-out infinite;
          }
          @keyframes hiw-pro-mesh-drift {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50%      { transform: translate(20px, -10px) scale(1.06); }
          }
          /* Subtle dot grid texture */
          .hiw-pro-grid {
            position: absolute;
            inset: 0;
            background-image: radial-gradient(rgba(255, 255, 255, 0.10) 1px, transparent 1.5px);
            background-size: 22px 22px;
            mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 80%);
            -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 80%);
            opacity: 0.35;
            pointer-events: none;
            z-index: 0;
          }
          /* Floating brand-blue orbs */
          .hiw-pro-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(60px);
            pointer-events: none;
            z-index: 0;
            mix-blend-mode: screen;
            opacity: 0.55;
            animation: hiw-pro-orb-drift 16s ease-in-out infinite;
          }
          .hiw-pro-orb--a {
            top: -80px; right: -60px;
            width: 280px; height: 280px;
            background: radial-gradient(circle, rgba(96, 165, 250, 0.55) 0%, rgba(59, 130, 246, 0.30) 50%, rgba(59, 130, 246, 0) 80%);
          }
          .hiw-pro-orb--b {
            bottom: -100px; left: -40px;
            width: 240px; height: 240px;
            background: radial-gradient(circle, rgba(147, 197, 253, 0.45) 0%, rgba(96, 165, 250, 0.25) 50%, rgba(96, 165, 250, 0) 80%);
            animation-delay: -6s;
            animation-duration: 20s;
            animation-direction: reverse;
          }
          @keyframes hiw-pro-orb-drift {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50%      { transform: translate(30px, -20px) scale(1.10); }
          }
          /* Floating sparkle particles */
          .hiw-pro-particle {
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
            box-shadow: 0 0 10px rgba(96, 165, 250, 0.85);
            pointer-events: none;
            z-index: 1;
            animation: hiw-pro-particle-float 5s ease-in-out infinite;
          }
          .hiw-pro-particle--1 { top: 18%; left: 42%; }
          .hiw-pro-particle--2 { top: 38%; left: 8%; width: 4px; height: 4px; animation-delay: -1.5s; }
          .hiw-pro-particle--3 { top: 70%; left: 52%; width: 5px; height: 5px; animation-delay: -3s; }
          .hiw-pro-particle--4 { top: 28%; right: 38%; width: 4px; height: 4px; animation-delay: -2s; }
          @keyframes hiw-pro-particle-float {
            0%, 100% { transform: translate(0, 0); opacity: 0.55; }
            50%      { transform: translate(-8px, -10px); opacity: 1.00; }
          }

          /* Left content column */
          .hiw-pro-left {
            position: relative;
            z-index: 2;
            color: #ffffff;
          }
          .hiw-pro-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            padding: 6px 13px 6px 11px;
            margin-bottom: 18px;
            background: rgba(255, 255, 255, 0.10);
            border: 1px solid rgba(255, 255, 255, 0.20);
            border-radius: 999px;
            font-family: 'Pragati Narrow', sans-serif;
            font-size: 11px;
            font-weight: 800;
            color: #93c5fd;
            letter-spacing: 0.16em;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
          .hiw-pro-eyebrow-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%);
            box-shadow: 0 0 8px rgba(96, 165, 250, 0.85);
            animation: hiw-eyebrow-pulse 1.6s ease-in-out infinite;
          }
          .hiw-pro-eyebrow-spark {
            color: #93c5fd;
            animation: hiw-eyebrow-twinkle 2.4s ease-in-out infinite;
          }

          .hiw-pro-title {
            font-size: clamp(28px, 4.5vw, 48px) !important;
            font-weight: 800 !important;
            line-height: 1.05 !important;
            letter-spacing: -0.025em;
            margin: 0 0 16px !important;
            color: #ffffff !important;
            position: static !important;
            top: auto !important;
            max-width: none !important;
            text-shadow: 0 4px 24px rgba(0, 0, 0, 0.30);
          }
          .hiw-pro-desc {
            font-size: 15.5px !important;
            line-height: 1.65 !important;
            color: rgba(255, 255, 255, 0.85) !important;
            margin: 0 0 26px !important;
            max-width: 460px;
            position: static !important;
            top: auto !important;
            opacity: 1 !important;
          }

          /* CTA - refined brand-coherent design (was pink/purple) */
          .hiw-pro-cta {
            position: static !important;
            top: auto !important;
            left: auto !important;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 13px 28px !important;
            width: auto !important;
            height: auto !important;
            border-radius: 12px !important;
            border: 1.5px solid rgba(255, 255, 255, 0.24) !important;
            background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%) !important;
            color: #083A85 !important;
            font-size: 14.5px !important;
            font-weight: 800 !important;
            letter-spacing: 0.02em;
            cursor: pointer;
            overflow: hidden;
            isolation: isolate;
            box-shadow:
              0 14px 28px -10px rgba(0, 0, 0, 0.40),
              inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;
            transition: transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 200ms ease, box-shadow 220ms ease !important;
          }
          .hiw-pro-cta:hover {
            transform: translateY(-2px) !important;
            filter: brightness(1.05);
            box-shadow:
              0 22px 40px -10px rgba(0, 0, 0, 0.55),
              inset 0 1px 0 rgba(255, 255, 255, 0.55) !important;
          }
          .hiw-pro-cta:active { transform: translateY(0) scale(0.98) !important; }
          .hiw-pro-cta-shimmer {
            position: absolute;
            inset: 0;
            background: linear-gradient(110deg, transparent 35%, rgba(96, 165, 250, 0.30) 50%, transparent 65%);
            transform: translateX(-100%);
            transition: transform 700ms ease;
            pointer-events: none;
          }
          .hiw-pro-cta:hover .hiw-pro-cta-shimmer { transform: translateX(100%); }
          .hiw-pro-cta-content {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            z-index: 1;
          }

          /* Trust pill below CTA */
          .hiw-pro-trust {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-top: 18px;
            font-size: 12.5px;
            color: rgba(255, 255, 255, 0.78);
            font-family: 'Pragati Narrow', sans-serif;
          }
          .hiw-pro-trust-avatars {
            display: inline-flex;
          }
          .hiw-pro-trust-avatars span {
            display: block;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid #083A85;
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            margin-right: -7px;
          }
          .hiw-pro-trust-avatars span:nth-child(2) {
            background: linear-gradient(135deg, #93c5fd 0%, #1d4ed8 100%);
          }
          .hiw-pro-trust-avatars span:nth-child(3) {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            margin-right: 0;
          }
          .hiw-pro-trust-text strong {
            color: #ffffff;
            font-weight: 800;
          }

          /* Right video - modern bezel with brand glow */
          .hiw-pro-video {
            position: relative !important;
            z-index: 2;
            background: none !important;
            padding: 0 !important;
            max-width: none !important;
            max-height: none !important;
            display: block !important;
          }
          .hiw-pro-video-frame {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 10;
            border-radius: 20px;
            background: #000;
            overflow: hidden;
            border: 1px solid rgba(96, 165, 250, 0.30);
            box-shadow:
              0 30px 70px -20px rgba(0, 0, 0, 0.65),
              0 0 0 1px rgba(255, 255, 255, 0.06) inset,
              0 0 60px -10px rgba(96, 165, 250, 0.40);
          }
          .hiw-pro-video-frame::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 30%);
            pointer-events: none;
          }
          .hiw-pro-video-el {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
          }
          .hiw-pro-video-indicator {
            position: absolute;
            top: 12px;
            left: 12px;
            z-index: 3;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px 4px 8px;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 11, 19, 0.90) 100%);
            border: 1px solid rgba(96, 165, 250, 0.30);
            border-radius: 999px;
            font-family: 'Pragati Narrow', sans-serif;
            font-size: 9.5px;
            font-weight: 800;
            color: #93c5fd;
            letter-spacing: 0.14em;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.40);
          }
          .hiw-pro-video-indicator-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #ef4444;
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.85);
            animation: hiw-pro-live-dot 1.2s ease-in-out infinite;
          }
          @keyframes hiw-pro-live-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%      { opacity: 0.40; transform: scale(0.85); }
          }

          /* Mobile */
          @media (max-width: 900px) {
            .hiw-pro-card {
              grid-template-columns: 1fr;
              padding: 28px;
              gap: 28px;
              border-radius: 22px;
            }
            .hiw-pro-particle { display: none; }
          }
          @media (max-width: 540px) {
            .hiw-pro-card { padding: 22px; }
            .hiw-pro-title { font-size: clamp(24px, 7vw, 32px) !important; }
            .hiw-pro-desc { font-size: 14px !important; }
            .hiw-pro-cta { width: 100% !important; padding: 12px 20px !important; }
          }

          /* Reduced motion - strip animations cleanly */
          @media (prefers-reduced-motion: reduce) {
            .hiw-eyebrow,
            .hiw-eyebrow-dot,
            .hiw-eyebrow-sparkle,
            .hiw-title,
            .hiw-accent-line span,
            .hiw-subtitle,
            .hiw-step,
            .hiw-avatar-wrap,
            .hiw-step-img,
            .hiw-halo,
            .hiw-particle,
            .hiw-step-badge,
            .hiw-ring,
            .hiw-orbital-dot-svg,
            .hiw-shimmer-ribbon,
            .hiw-shimmer-ribbon::before,
            .hiw-pro-mesh,
            .hiw-pro-orb,
            .hiw-pro-particle,
            .hiw-pro-eyebrow-dot,
            .hiw-pro-eyebrow-spark,
            .hiw-pro-cta,
            .hiw-pro-cta-shimmer,
            .hiw-pro-video-indicator-dot {
              animation: none !important;
              transition: none !important;
            }
          }

          @keyframes hero-card-twinkle {
            0%, 100% {
              border-color: rgba(220, 38, 38, 0.8);
              box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.8),
                          0 0 0 0 rgba(220, 38, 38, 0.6),
                          0 0 12px rgba(220, 38, 38, 0.3);
            }
            25% {
              box-shadow: 0 0 0 10px rgba(220, 38, 38, 0),
                          0 0 0 20px rgba(220, 38, 38, 0),
                          0 0 20px rgba(220, 38, 38, 0.15);
            }
            50% {
              border-color: rgba(248, 113, 113, 1);
              box-shadow: 0 0 0 18px rgba(220, 38, 38, 0),
                          0 0 0 32px rgba(220, 38, 38, 0),
                          0 0 28px rgba(220, 38, 38, 0.2);
            }
            75% {
              box-shadow: 0 0 0 10px rgba(220, 38, 38, 0),
                          0 0 0 20px rgba(220, 38, 38, 0),
                          0 0 20px rgba(220, 38, 38, 0.15);
            }
          }
          @keyframes hero-toss-in {
            0% { transform: translateY(100%) rotate(15deg) scale(0.6); opacity: 0; }
            60% { transform: translateY(-8%) rotate(-3deg) scale(1.02); opacity: 1; }
            100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          }
          @keyframes hero-spin-in {
            0% { transform: scale(0.3) rotate(-180deg); opacity: 0; }
            60% { transform: scale(1.05) rotate(10deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes find-events-border-vibrate {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7),
                          0 0 0 0 rgba(255, 255, 255, 0.5);
            }
            25% {
              box-shadow: 0 0 0 8px rgba(255, 255, 255, 0),
                          0 0 0 16px rgba(255, 255, 255, 0);
            }
            50% {
              box-shadow: 0 0 0 16px rgba(255, 255, 255, 0),
                          0 0 0 28px rgba(255, 255, 255, 0);
            }
            75% {
              box-shadow: 0 0 0 8px rgba(255, 255, 255, 0),
                          0 0 0 16px rgba(255, 255, 255, 0);
            }
          }

          .find-events-btn {
            animation: find-events-border-vibrate 1s ease-out infinite;
          }

          .find-events-btn:hover {
            animation: none;
            background-color: rgba(255, 255, 255, 0.1) !important;
          }
        `}</style>

        {/* Global Network Section */}
        <section
          ref={networkSectionRef}
          className="global-network-section"
          style={{
            background: 'linear-gradient(to right, #052047, #052047, #103E83)',
            padding: '100px 0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Interactive DotGrid - same brand-blue palette as the footer. 2px dots with 15px gap,
              dim brand at rest → bright brand on cursor proximity, GSAP inertia push + click shock. */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
            <DotGrid
              dotSize={2}
              gap={15}
              baseColor="#1E3A78"
              activeColor="#3B82F6"
              proximity={120}
              shockRadius={180}
              shockStrength={4}
              resistance={750}
              returnDuration={1.4}
            />
          </div>

          {/* Floating cyan particles - drift slowly across the section */}
          <span className="gn-particle gn-particle--1" aria-hidden="true" />
          <span className="gn-particle gn-particle--2" aria-hidden="true" />
          <span className="gn-particle gn-particle--3" aria-hidden="true" />
          <span className="gn-particle gn-particle--4" aria-hidden="true" />
          <span className="gn-particle gn-particle--5" aria-hidden="true" />
          <span className="gn-particle gn-particle--6" aria-hidden="true" />

          {/* Decorative compass corner - coordinate ornament top-left */}
          <span className="gn-compass" aria-hidden="true">
            <svg viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#00E8FF" strokeWidth="1" strokeDasharray="2 4" opacity="0.45" />
              <circle cx="40" cy="40" r="24" stroke="#00E8FF" strokeWidth="1" opacity="0.35" />
              <circle cx="40" cy="40" r="3" fill="#00E8FF" opacity="0.85" />
              {/* Cardinal marks */}
              <line x1="40" y1="4"  x2="40" y2="14" stroke="#00E8FF" strokeWidth="1.5" opacity="0.6" />
              <line x1="40" y1="76" x2="40" y2="66" stroke="#00E8FF" strokeWidth="1.5" opacity="0.6" />
              <line x1="4"  y1="40" x2="14" y2="40" stroke="#00E8FF" strokeWidth="1.5" opacity="0.6" />
              <line x1="76" y1="40" x2="66" y2="40" stroke="#00E8FF" strokeWidth="1.5" opacity="0.6" />
              <text x="40" y="9" textAnchor="middle" fontSize="6" fill="#00E8FF" opacity="0.7" fontFamily="monospace">N</text>
            </svg>
          </span>
          <div className="global-network-content" style={{
            maxWidth: '1480px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            minHeight: '350px',
            position: 'relative',
            zIndex: 2
          }}>
            {/* Left Content */}
            <div className="global-network-left" style={{
              flex: '0 0 42%',
              maxWidth: '550px',
              color: '#fff'
            }}>
              {/* Eyebrow pill - same brand language as other sections */}
              <div className="gn-eyebrow" aria-hidden="true">
                <span className="gn-eyebrow-dot" />
                <span>GLOBAL NETWORK · LIVE</span>
                <span className="gn-eyebrow-spark">✦</span>
              </div>

              {/* Title - last word styled in italic gradient text fill */}
              <h2 className="global-network-title gn-title" style={{
                fontSize: '55px',
                fontWeight: 1000,
                lineHeight: '1.1',
                lineBreak: 'anywhere',
                marginBottom: '24px',
                color: '#fff',
                letterSpacing: '-0.02em'
              }}>
                {(() => {
                  const words = t('globalNetwork.title').split(/\s+/).filter(Boolean);
                  const lastIdx = words.length - 1;
                  return words.map((w, i) => (
                    <span key={i} style={{ display: 'inline-block', marginRight: i === lastIdx ? 0 : '0.28em' }}>
                      {i === lastIdx ? (
                        <span style={{
                          fontStyle: 'italic',
                          fontWeight: 'inherit',
                          background: 'linear-gradient(135deg, #00E8FF 0%, #60a5fa 50%, #7763FF 100%)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'transparent',
                          display: 'inline-block',
                          paddingRight: '0.12em',
                          paddingLeft: '0.04em',
                        }}>{w}</span>
                      ) : w}
                    </span>
                  ));
                })()}
              </h2>

              {/* Description */}
              <p className="global-network-description" style={{
                fontSize: '17px',
                lineHeight: '1.65',
                color: '#fff',
                opacity: 0.9,
                fontWeight: 400,
                marginBottom: '32px'
              }}>
                {t('globalNetwork.description')}
              </p>
              <div className="global-network-buttons" style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap' }}>
                <button
                  onClick={() => window.location.href = '/user/photographers'}
                  style={{
                    backgroundColor: 'white',
                    color: '#000000',
                    padding: '11.25px 20px',
                    borderRadius: '10px',
                    border: '1.5px solid #FFFFFF',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 3px 9px rgba(8, 58, 133, 0.2)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {t('globalNetwork.connectNow')}
                </button>
                <button
                  className={hasLiveEvents ? 'find-events-btn' : undefined}
                  onClick={() => window.location.href = '/user/events'}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#FFFFFF',
                    padding: '11.25px 20px',
                    borderRadius: '10px',
                    border: '2px solid #FFFFFF',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {t('globalNetwork.findEvents')}
                </button>
              </div>

              {/* Live network stats - small chips reinforcing the
                  "live, growing platform" idea below the CTAs */}
              <div className="gn-stats" aria-label="Network reach">
                <div className="gn-stat">
                  <span className="gn-stat-dot" />
                  <div>
                    <strong>17</strong>
                    <span>Cities</span>
                  </div>
                </div>
                <div className="gn-stat">
                  <span className="gn-stat-dot" />
                  <div>
                    <strong>6</strong>
                    <span>Continents</span>
                  </div>
                </div>
                <div className="gn-stat">
                  <span className="gn-stat-dot" />
                  <div>
                    <strong>24/7</strong>
                    <span>Live</span>
                  </div>
                </div>
              </div>
            </div>
          
            {/* Right Content - for the network visualization */}
            <div className="global-network-right" style={{
              flex: '1',
              height: '450px',
              position: 'relative'
            }}>
              <GlobalNetwork />
            </div>
          </div>

          {/* Additional ambient glow effects */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 1
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(0, 168, 204, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 1
          }} />
        </section>
      </main>
      <Footer />
      </div>
      )}
    </>
  );
}