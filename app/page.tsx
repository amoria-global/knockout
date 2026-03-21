'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Footer from "./components/footer";
import Navbar from "./components/navbar";
import GlobalNetwork from "./components/GlobalNetwork";
// import Preloader from "./components/Preloader"; // Commented out — client requested no preloader
import { getPublicEvents } from '@/lib/APIs/public';
import { getStreamVideo } from '@/lib/APIs/streams/route';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const t = useTranslations();
  const [hasLiveEvents, setHasLiveEvents] = useState(false);
  const [activeCard, setActiveCard] = useState(-1) // -1: cover, 0: rated, 1: live, 2: pay, 3: gallery
  const [networkMousePos, setNetworkMousePos] = useState<{ x: number; y: number } | null>(null)
  const [whyAmoriaMousePos, setWhyAmoriaMousePos] = useState<{ x: number; y: number } | null>(null)
  const [heroMousePos, setHeroMousePos] = useState<{ x: number; y: number } | null>(null)
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
  const flipBookRef = useRef<HTMLDivElement>(null)
  const bookCoverRef = useRef<HTMLDivElement>(null)
  const bookPage1Ref = useRef<HTMLDivElement>(null)
  const bookPage2Ref = useRef<HTMLDivElement>(null)
  const bookPage3Ref = useRef<HTMLDivElement>(null)
  const bookPage4Ref = useRef<HTMLDivElement>(null)
  const bookPage5Ref = useRef<HTMLDivElement>(null)
  const bookPage6Ref = useRef<HTMLDivElement>(null)
  const bookPage7Ref = useRef<HTMLDivElement>(null)
  const bookPage8Ref = useRef<HTMLDivElement>(null)
  const book3dRef = useRef<HTMLDivElement>(null)

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
  // Preloader disabled — client requested no preloader (kept for future reuse)
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

  // Check whether any event has a live stream active (mirrors navbar logic)
  useEffect(() => {
    const checkLiveEvents = async () => {
      try {
        const res = await getPublicEvents({ size: 100 });
        if (!res.success || !res.data) return;
        const ongoingEvents = res.data.content.filter(
          ev => (ev.eventStatus as string)?.toLowerCase() === 'ongoing'
        );
        if (ongoingEvents.length === 0) return;

        // Fast path: hasLiveStream flag from backend
        let anyLive = ongoingEvents.some(ev => ev.hasLiveStream === true);

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
      } catch { /* silent */ }
    };
    checkLiveEvents();
  }, []);

  // Scroll-driven book flip for Why Amoria section — GSAP animates each page's rotation
  useEffect(() => {
    if (typeof window === 'undefined' || showPreloader) return

    const timer = setTimeout(() => {
      const flipBook = flipBookRef.current
      const cover = bookCoverRef.current
      const page1 = bookPage1Ref.current
      const page2 = bookPage2Ref.current
      const page3 = bookPage3Ref.current
      const page4 = bookPage4Ref.current
      const page5 = bookPage5Ref.current
      const page6 = bookPage6Ref.current
      const page7 = bookPage7Ref.current
      const page8 = bookPage8Ref.current
      const book = book3dRef.current
      if (!flipBook || !cover || !page1 || !page2 || !page3 || !page4 || !page5 || !page6 || !page7 || !page8 || !book) return

      const ctx = gsap.context(() => {
        const isMobile = window.innerWidth <= 768
        // Set initial states
        const allPages = [cover, page1, page2, page3, page4, page5, page6, page7, page8]
        gsap.set(allPages, { rotateY: 0, transformOrigin: 'left center' })
        if (isMobile) {
          gsap.set(book, { marginLeft: 0 })
        } else {
          gsap.set(book, { width: 380, height: 420 })
        }

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: flipBook,
            start: 'top 20%',
            end: isMobile ? '+=3500' : '+=5500',
            pin: true,
            pinSpacing: true,
            scrub: 0.5,
          }
        })

        // 10 phases: cover + 8 pages + back cover close
        // Each phase ~0.09 of timeline, with slight overlaps

        // Phase 0: Cover flips (0.02 - 0.10)
        tl.to(cover, { rotateY: -180, duration: 0.08, ease: 'power2.inOut' }, 0.02)
        if (!isMobile) {
          tl.to(book, { height: 400, duration: 0.08, ease: 'power2.inOut' }, 0.02)
        }

        // Phase 1: Page 1 flips (0.10 - 0.20)
        tl.to(page1, { rotateY: -180, duration: 0.10, ease: 'power1.inOut' }, 0.10)

        // Phase 2: Page 2 flips (0.20 - 0.30)
        tl.to(page2, { rotateY: -180, duration: 0.10, ease: 'power1.inOut' }, 0.19)

        // Phase 3: Page 3 flips (0.30 - 0.40)
        tl.to(page3, { rotateY: -180, duration: 0.10, ease: 'power1.inOut' }, 0.28)

        // Phase 4: Page 4 flips (0.40 - 0.50)
        tl.to(page4, { rotateY: -180, duration: 0.10, ease: 'power1.inOut' }, 0.37)

        // Phase 5: Page 5 flips (0.50 - 0.60)
        tl.to(page5, { rotateY: -180, duration: 0.10, ease: 'power1.inOut' }, 0.46)

        // Phase 6: Page 6 flips (0.60 - 0.70)
        tl.to(page6, { rotateY: -180, duration: 0.10, ease: 'power1.inOut' }, 0.55)

        // Phase 7: Page 7 flips (0.70 - 0.80)
        tl.to(page7, { rotateY: -180, duration: 0.10, ease: 'power1.inOut' }, 0.64)

        // Phase 8: Page 8 flips (0.80 - 0.90)
        tl.to(page8, { rotateY: -180, duration: 0.10, ease: 'power1.inOut' }, 0.73)

        // Phase 9: Book closes to back cover (0.90 - 1.0)
        if (!isMobile) {
          tl.to(book, { height: 420, duration: 0.08, ease: 'power2.inOut' }, 0.90)
        }

        // All flipped pages stay flat at -180 — no fan-out

        // Track activeCard for UI state
        ScrollTrigger.create({
          trigger: flipBook,
          start: 'top 20%',
          end: '+=5500',
          scrub: 0.3,
          onUpdate: (self) => {
            const p = self.progress
            if (p < 0.05) setActiveCard(-1)
            else if (p < 0.12) setActiveCard(0)
            else if (p < 0.21) setActiveCard(1)
            else if (p < 0.30) setActiveCard(2)
            else if (p < 0.39) setActiveCard(3)
            else if (p < 0.48) setActiveCard(4)
            else if (p < 0.57) setActiveCard(5)
            else if (p < 0.66) setActiveCard(6)
            else if (p < 0.75) setActiveCard(7)
            else if (p < 0.88) setActiveCard(8)
            else setActiveCard(9)
          }
        })
      })

      return () => ctx.revert()
    }, 600)

    return () => clearTimeout(timer)
  }, [showPreloader])


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
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=1300%',
            scrub: 0.5,
            pin: true,
            pinSpacing: true,
            anticipatePin: 0,
            // markers: true, // Uncomment for debugging
          }
        });

        // Phase 0: Container pinned, phone wireframe visible (position 0-0.5)
        // Reduced holding time - peeling starts sooner

        // Phase 1: Phone wireframe peels right→left to reveal phone mockup (position 0.5-1.5)
        tl.to(phoneOverlay, {
          clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
          duration: 1,
          ease: 'none'
        }, 0.5);
        // Phone text scrolls continuously from bottom to top (no fade, just scroll)
        if (phoneText) {
          tl.to(phoneText, {
            y: -300,
            duration: 1.8,
            ease: 'none'
          }, 0.5);
        }

        // Phase 2: Phone mockup peels bottom→top AND tablet reveals bottom→top (position 1.5-2.5)
        // Phone peels from bottom to top (top edge moves upward)
        tl.to(phone, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
          duration: 1,
          ease: 'none'
        }, 1.5);
        // Tablet reveals from bottom to top (top edge moves upward) - same direction as phone peel
        tl.to(tablet, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          duration: 1,
          ease: 'none'
        }, 1.5);

        // Phase 3: Tablet wireframe peels top→bottom to reveal tablet mockup (position 2.5-3.5)
        tl.to(tabletOverlay, {
          clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
          duration: 1,
          ease: 'none'
        }, 2.5);
        // Tablet text scrolls continuously from bottom to top (no fade, just scroll)
        if (tabletText) {
          tl.to(tabletText, {
            y: -300,
            duration: 1.8,
            ease: 'none'
          }, 2.5);
        }

        // Phase 4: Tablet mockup peels bottom→top AND laptop reveals bottom→top simultaneously (position 3.5-4.5)
        // Tablet peels from bottom to top (clips upward)
        tl.to(tablet, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
          duration: 1,
          ease: 'none'
        }, 3.5);
        // Laptop reveals from bottom to top (expands upward) - in sync with tablet peel
        tl.to(laptop, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          duration: 1,
          ease: 'none'
        }, 3.5);

        // Phase 5: Laptop wireframe peels left→right to reveal laptop mockup (position 4.5-5.5)
        tl.to(laptopOverlay, {
          clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
          duration: 1,
          ease: 'none'
        }, 4.5);
        // Laptop text scrolls continuously from bottom to top (no fade, just scroll)
        if (laptopText) {
          tl.to(laptopText, {
            y: -300,
            duration: 1.8,
            ease: 'none'
          }, 4.5);
        }

        // Phase 6: Why Amoria section reveals from top to bottom (position 5.5-6.5)
        if (whyAmoriaSection) {
          tl.to(whyAmoriaSection, {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            duration: 1,
            ease: 'none'
          }, 5.5);
        }

        ScrollTrigger.refresh();
      });

      return () => ctx.revert();
    }, 500);

    return () => clearTimeout(timer);
  }, [showPreloader]);

  // NOTE: How It Works to Mockups peel transition disabled for now
  // The original request was to have How It Works scroll normally and reveal mockups behind it
  // This needs a different approach - possibly wrapping both sections in a container

  // Mouse handlers for Global Network section dotted background effect
  // Hero section entrance animations
  useEffect(() => {
    if (typeof window === 'undefined' || showPreloader) return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Staggered entrance for left content
        gsap.from('.hero-badge', {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power3.out',
          delay: 0.1,
        });

        gsap.from('.hero-title-line', {
          opacity: 0,
          y: 30,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.25,
        });

        gsap.from('.hero-description', {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power3.out',
          delay: 0.6,
        });

        gsap.from('.hero-buttons', {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power3.out',
          delay: 0.75,
        });

        // Right side — image slides in
        gsap.from('.hero-right', {
          opacity: 0,
          x: 60,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.3,
        });

        // Floating cards pop in with stagger
        gsap.from('.hero-floating-card', {
          opacity: 0,
          scale: 0.7,
          duration: 0.5,
          stagger: 0.15,
          ease: 'back.out(1.7)',
          delay: 0.8,
        });

        // Decorative circles
        gsap.from('.hero-circle', {
          opacity: 0,
          scale: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(2)',
          delay: 1.0,
        });
      });

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timer);
  }, [showPreloader]);

  const handleNetworkMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (networkSectionRef.current) {
      const rect = networkSectionRef.current.getBoundingClientRect();
      setNetworkMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleNetworkMouseLeave = () => {
    setNetworkMousePos(null);
  };

  // Mouse handlers for Why Amoria section dotted background effect
  const handleWhyAmoriaMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (whyAmoriaSectionRef.current) {
      const rect = whyAmoriaSectionRef.current.getBoundingClientRect();
      setWhyAmoriaMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleWhyAmoriaMouseLeave = () => {
    setWhyAmoriaMousePos(null);
  };

  return (
    <>
      {/* Preloader disabled — client requested no preloader (kept for future reuse)
      {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}
      */}

      {/* Show main content only after preloader is complete */}
      {!showPreloader && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Navbar - Outside sections to stay fixed */}
          <Navbar />

        <main style={{ flex: 1, position: 'relative' }}>
        <style jsx>{`
          @media (max-width: 768px) {
            .hero-content { flex-direction: column !important; padding: 32px 20px 24px !important; min-height: auto !important; gap: 16px !important; }
            .hero-left { width: 100% !important; max-width: 100% !important; text-align: center; padding: 0 10px !important; }
            .hero-right { width: 100% !important; height: 420px !important; margin-top: 8px !important; position: relative !important; overflow: visible !important; transform: scale(0.5) !important; transform-origin: top center !important; margin-bottom: -200px !important; }
            .hero-title { font-size: 34px !important; line-height: 1.08 !important; letter-spacing: -0.03em !important; }
            .hero-description { max-width: 340px !important; margin-left: auto !important; margin-right: auto !important; font-size: 14px !important; padding: 0 !important; line-height: 1.6 !important; color: #4b5563 !important; margin-bottom: 24px !important; }
            .hero-buttons { justify-content: center !important; flex-direction: column !important; align-items: center !important; gap: 10px !important; }
            .hero-buttons button { width: 100% !important; max-width: 260px !important; padding: 14px 24px !important; border-radius: 50px !important; font-size: 14.5px !important; }
            .hero-badge { margin-bottom: 18px !important; }
            .twitter-badge { margin-left: auto; margin-right: auto; font-size: 12px !important; padding: 8px 16px !important; }
            .hero-glow { left: 50% !important; transform: translateX(-50%) !important; width: 350px !important; top: 0px !important; opacity: 0.6 !important; }
            .hero-floating-card { transform: none !important; }
            .hero-circle:first-child { left: -115px !important; top: 250px !important; }
            .hero-circle:nth-child(2) { left: -60px !important; bottom: 130px !important; }

            .how-it-works-title { font-size: 36px !important; margin-bottom: 40px !important; text-align: center !important; }
            .how-it-works-steps { flex-direction: column !important; gap: 30px !important; align-items: center !important; position: relative !important; }
            .how-it-works-svg { display: none !important; }
            .how-it-works-mobile-line { display: block !important; }
            .how-it-works-steps > div { background: #fff !important; z-index: 2 !important; position: relative !important; padding: 10px 20px !important; }
            .step-img { width: 180px !important; height: 180px !important; }
            .step-title { font-size: 24px !important; text-align: center !important; }
            .step-description { font-size: 15px !important; text-align: center !important; }

            .photographer-container { flex-direction: column !important; padding: 25px 20px 30px !important; gap: 20px !important; align-items: center !important; text-align: center !important; }
            .photographer-title { font-size: 32px !important; position: relative !important; top: 0 !important; text-align: center !important; max-width: 100% !important; line-height: 1.1 !important; margin-bottom: 5px !important; }
            .photographer-description { position: relative !important; top: 0 !important; margin-bottom: 15px !important; font-size: 15px !important; text-align: center !important; opacity: 0.95 !important; }
            .photographer-button { position: relative !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 220px !important; margin: 0 auto !important; font-size: 17px !important; height: auto !important; padding: 12px 20px !important; }
            .photographer-video-container { max-width: 100% !important; width: 100% !important; height: auto !important; order: -1 !important; }

            .mockups-section { padding: 0 !important; background-color: #1c1c1c !important; min-height: 100vh !important; }
            .mockups-inner { padding: 0 20px !important; margin: 0 auto !important; min-height: 100vh !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; }
            .mockups-container { display: flex !important; justify-content: center !important; align-items: center !important; margin-left: 0 !important; padding: 0 !important; }
            .mockups-container { height: auto !important; width: 100% !important; max-width: 100% !important; position: relative !important; }
            .device-laptop { display: none; max-width: 700px !important; max-height: 400px !important; width: 400px !important; height: 300px !important; }
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
            .why-amoria-content { flex-direction: column !important; gap: 30px !important; align-items: center !important; }
            .why-amoria-cards { width: 100% !important; max-width: 100% !important; }
            .why-amoria-image-container { position: relative !important; width: 100% !important; max-width: 370px !important; height: 400px !important; margin: 30px auto 0 !important; flex: none !important; }
            .why-amoria-image-container > div:first-child { width: 100% !important; height: 380px !important; right: 0 !important; }
            .why-amoria-image-container > div:last-child { width: 100% !important; height: 380px !important; right: 0 !important; top: 10px !important; }
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
            .hero-right { transform: scale(0.42) !important; margin-bottom: -240px !important; }
            .hero-title { font-size: 28px !important; }
            .hero-description { font-size: 13px !important; max-width: 280px !important; }
            .hero-buttons button { max-width: 240px !important; font-size: 13.5px !important; }
          }

          @media (min-width: 769px) and (max-width: 1024px) {
            .hero-title { font-size: 42px !important; }
            .hero-content { padding: 20px 20px 30px !important; }
            .mockups-section { padding: 80px 40px !important; }
            .mockups-container { height: 450px !important; }
            .mockup-heading-text h2 { font-size: 38px !important; }
            .mockup-heading-text { left: 20px !important; }
            .how-it-works-title { font-size: 45px !important; }
            .why-amoria-title { font-size: 45px !important; }
            .global-network-title { font-size: 45px !important; }
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
            background: `
              radial-gradient(ellipse 80% 60% at 10% 90%, rgba(8, 58, 133, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 50% at 80% 20%, rgba(8, 58, 133, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 50% 50%, rgba(8, 58, 133, 0.03) 0%, transparent 50%),
              linear-gradient(180deg, #edf1f8 0%, #e8eef6 40%, #e2e9f3 100%)
            `,
            overflow: 'hidden',
          }}
        >
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

          {/* Hero Content Container */}
          <div className="hero-content" style={{
            position: 'relative',
            maxWidth: '1080px',
            margin: '0 auto',
            padding: '24px 20px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 'calc(100vh - 64px)',
            maxHeight: 'calc(100vh - 64px)',
          }}>

            {/* Left Content */}
            <div className="hero-left" style={{
              position: 'relative',
              width: '48%',
              maxWidth: '450px',
              zIndex: 10
            }}>
              {/* Blue lighting bulb-like glow effect */}
              <div className="hero-glow" style={{
                position: 'absolute',
                top: '30px',
                left: '-135px',
                width: '612px',
                height: '212.5px',
                background: 'radial-gradient(circle, rgba(8, 58, 133, 0.3) 0% 10%, rgba(8, 58, 133, 0.2) 4% 10%, rgba(8, 58, 133, 0) 90% 90%)',
                borderRadius: '50%',
                filter: 'blur(55px)',
                zIndex: -1,
                pointerEvents: 'none'
              }} />

              {/* Twitter Handle Badge */}
              <button className="hero-badge twitter-badge" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7.5px',
                padding: '9px 19.5px',
                border: 'none',
                borderRadius: '37.5px',
                marginBottom: '16px',
                backgroundColor: '#101012',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <svg width="15.5" height="15.5" viewBox="0 0 24 24" fill="none">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#fff"/>
                </svg>
                {t('hero.twitter')}
              </button>

              {/* Main Heading */}
              <h1 className="hero-title" style={{
                fontSize: '50px',
                fontWeight: 700,
                lineHeight: '1.05',
                marginBottom: '14px',
                letterSpacing: '-0.02em'
              }}>
                <div className="hero-title-line" style={{
                  marginBottom: '3px',
                  background: 'linear-gradient(135deg, #083A85 0%, #0a5dc2 50%, #083A85 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>{t('hero.title1')}</div>
                <div className="hero-title-line" style={{ color: '#0f172a', marginBottom: '3px' }}>{t('hero.title2')}</div>
                <div className="hero-title-line" style={{ color: '#0f172a' }}>{t('hero.title3')}</div>
              </h1>

              {/* Description */}
              <p className="hero-description" style={{
                fontSize: '15px',
                color: '#1f1d1d',
                lineHeight: '1.6',
                marginBottom: '22px',
                maxWidth: '390px'
              }}>
                {t('hero.description')}
              </p>

              {/* CTA Buttons */}
              <div className="hero-buttons" style={{ display: 'flex', gap: '13.5px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => window.location.href = '/user/photographers'}
                  style={{
                    backgroundColor: '#083A85',
                    color: '#fff',
                    padding: '13px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 14px rgba(8, 58, 133, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(8, 58, 133, 0.4)';
                    e.currentTarget.style.backgroundColor = '#062d6b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(8, 58, 133, 0.3)';
                    e.currentTarget.style.backgroundColor = '#083A85';
                  }}
                >
                  {t('hero.findPhotographer')}
                </button>
                <button
                  onClick={() => window.location.href = '/user/auth/signup?userType=Photographer'}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#083A85',
                    padding: '13px 28px',
                    borderRadius: '12px',
                    border: '2px solid #083A85',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.06)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(8, 58, 133, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {t('hero.joinPhotographer')}
                </button>
              </div>
            </div>

            {/* Right Content - Image Section */}
            <div className="hero-right" style={{
              position: 'relative',
              width: '52%',
              height: '480px',
              zIndex: 5
            }}>
              {/* Full Circle - Upper Left */}
              <div className="hero-circle" style={{
                position: 'absolute',
                left: '-115px',
                top: '235px',
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: '#083A85',
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
                background: '#083A85',
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
                height: '480px',
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
                  background: 'conic-gradient(from 180deg at 70% 50%, rgba(8, 58, 133, 0.35) 0deg, rgba(8, 58, 133, 0.5) 359.96deg, rgba(8, 58, 133, 0.35) 360deg)',
                  borderRadius: '120px 30px 30px 100px',
                  transform: 'perspective(630px) rotateY(-27deg) rotateX(-1deg)',
                  transformOrigin: 'right center',
                  zIndex: 3,
                  boxShadow: '0 400px 800px rgba(8, 58, 133, 0.15)'
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
                    background: 'linear-gradient(-90deg, #083A85 0%, #0a5dc2 100%)',
                    padding: '8.25px 16.5px',
                    borderRadius: '30px',
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
                      fill="#083A85"
                      stroke="#083A85"
                      strokeWidth="6"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Call UI Card - Left Middle (under camera) */}
                <div className="hero-floating-card" style={{
                  position: 'absolute',
                  left: '-200px',
                  top: '130px',
                  height: '40px',
                  width: '160px',
                  backgroundColor: '#fff',
                  padding: '9.75px 12px',
                  borderRadius: '52.5px',
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
                      backgroundColor: '#083A85',
                      borderRadius: '3.75px'
                    }}/>
                    <div style={{
                      position: 'absolute',
                      left: '42px',
                      top: '23px',
                      width: '48.75px',
                      height: '4.75px',
                      backgroundColor: '#a8c4e8',
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
                  borderRadius: '52.5px',
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
                      backgroundColor: '#083A85',
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
                      backgroundColor: '#083A85',
                      borderRadius: '3.75px'
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '45px',
                      width: '67.5px',
                      height: '6.5px',
                      backgroundColor: '#5b9bff',
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
                  background: 'linear-gradient(180deg, #0a4da3 0%, #083A85 100%)',
                  padding: '9.75px 21px',
                  borderRadius: '24px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  zIndex: 12,
                  boxShadow: '0 3.75px 13.5px rgba(8, 58, 133, 0.35)',
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
                    fill="#083A85"
                    stroke="#083A85"
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
            padding: '50px 0 100px 0',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            position: 'relative',
            zIndex: 2
          }}
        >
              <div style={{
                maxWidth: '1080px',
                margin: '0 auto',
                padding: '0 20px'
              }}>
                {/* Section Title */}
                <h2 className="how-it-works-title" style={{
              fontSize: '50px',
              fontWeight: 1000,
              textAlign: 'center',
              marginBottom: '60px',
              color: '#0f172a',
              letterSpacing: '-0.02em'
            }}>
              {t('howItWorks.title')}
            </h2>

            {/* Three Steps Container */}
            <div className="how-it-works-steps" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '40px',
              position: 'relative'
            }}>
              {/* Dotted Line Connector with Flowing Light Inside Dots */}
              <svg
                className="how-it-works-svg"
                style={{
                  position: 'absolute',
                  top: '-300px',
                  left: '12%',
                  width: '76%',
                  height: '850px',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
                viewBox="0 0 1000 120"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Animated gradient - flowing light in brand blue tones */}
                  <linearGradient id="flowingDotGradient">
                    <stop offset="0%" stopColor="#083A85">
                      <animate
                        attributeName="offset"
                        values="-0.3;1.0;-0.3"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="8%" stopColor="#0a4da3">
                      <animate
                        attributeName="offset"
                        values="-0.22;1.08;-0.22"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="15%" stopColor="#00D4FF">
                      <animate
                        attributeName="offset"
                        values="-0.15;1.15;-0.15"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="22%" stopColor="#0a4da3">
                      <animate
                        attributeName="offset"
                        values="-0.08;1.22;-0.08"
                        dur="3s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                      />
                    </stop>
                    <stop offset="30%" stopColor="#083A85">
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

                {/* Single dotted line - flowing brand blue gradient */}
                <path
                  d="M 0 60 Q 250 20, 500 60 T 1000 60"
                  stroke="url(#flowingDotGradient)"
                  strokeWidth="0.7"
                  strokeDasharray="10,10"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              {/* Single vertical S-curve connector for mobile - mirrors desktop horizontal arc */}
              <svg
                className="how-it-works-mobile-line"
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100%',
                  height: '100%',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
                viewBox="-100 0 600 1000"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="mobileFlowGrad" gradientUnits="userSpaceOnUse" x1="200" y1="0" x2="200" y2="1000">
                    <stop offset="0%" stopColor="#083A85">
                      <animate attributeName="offset" values="-0.3;1.0;-0.3" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="8%" stopColor="#0a4da3">
                      <animate attributeName="offset" values="-0.22;1.08;-0.22" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="15%" stopColor="#00D4FF">
                      <animate attributeName="offset" values="-0.15;1.15;-0.15" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="22%" stopColor="#0a4da3">
                      <animate attributeName="offset" values="-0.08;1.22;-0.08" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                    <stop offset="30%" stopColor="#083A85">
                      <animate attributeName="offset" values="0;1.3;0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
                    </stop>
                  </linearGradient>
                </defs>
                <path
                  d="M 350 30 Q 500 250, 50 500 Q -100 750, 350 970"
                  stroke="url(#mobileFlowGrad)"
                  strokeWidth="4"
                  strokeDasharray="12,12"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              {/* Step 1: Get Started */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                <img
                  className="step-img"
                  src="/ava1.png"
                  alt="Get Started"
                  style={{
                    width: '280px',
                    height: '280px',
                    objectFit: 'contain',
                    marginBottom: '24px'
                  }}
                />
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#083A85',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>1</div>
                <h3 className="step-title" style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '12px'
                }}>
                  {t('howItWorks.getStarted.title')}
                </h3>
                <p className="step-description" style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#4b5563',
                  lineHeight: '1.65',
                  maxWidth: '280px'
                }}>
                  {t('howItWorks.getStarted.description')}
                </p>
              </div>

              {/* Step 2: Photography */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                <img
                  className="step-img"
                  src="/ava2.png"
                  alt="Photography"
                  style={{
                    width: '280px',
                    height: '280px',
                    objectFit: 'contain',
                    marginBottom: '24px'
                  }}
                />
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#083A85',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>2</div>
                <h3 className="step-title" style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '12px'
                }}>
                  {t('howItWorks.photography.title')}
                </h3>
                <p className="step-description" style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#4b5563',
                  lineHeight: '1.65',
                  maxWidth: '280px'
                }}>
                  {t('howItWorks.photography.description')}
                </p>
              </div>



              {/* Step 3: Go Live */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                <img
                  className="step-img"
                  src="/ava3.png"
                  alt="Go Live"
                  style={{
                    width: '280px',
                    height: '280px',
                    objectFit: 'contain',
                    marginBottom: '24px'
                  }}
                />
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#083A85',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>3</div>
                <h3 className="step-title" style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '12px'
                }}>
                  {t('howItWorks.goLive.title')}
                </h3>
                <p className="step-description" style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#4b5563',
                  lineHeight: '1.65',
                  maxWidth: '280px'
                }}>
                  {t('howItWorks.goLive.description')}
                </p>
              </div>
            </div>

            {/* For Photographers Container */}
            <div
              ref={forPhotographersRef}
              className="photographer-container"
              style={{
                marginTop: '40px',
                background: 'linear-gradient(90deg, #083A85 19%, #4675AA 100%)',
                borderRadius: '24px',
                padding: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '60px',
                position: 'relative'
              }}
            >
              {/* Left Content */}
              <div style={{
                flex: 1,
                color: '#fff',
                maxWidth: '400px'
              }}>
                <h2 className="photographer-title" style={{
                  position: 'absolute',
                  top: '40px',
                  fontSize: '48px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '20px',
                  maxWidth: '350px',
                  lineHeight: '1'
                }}>
                  {t('howItWorks.forPhotographers.title')}
                </h2>
                <p className="photographer-description" style={{
                  position: 'inherit',
                  top: '120px',
                  fontSize: '18px',
                  lineHeight: '1.5',
                  marginBottom: '-50px',
                  opacity: 0.95
                }}>
                  {t('howItWorks.forPhotographers.description')}
                </p>
              </div>

              {/* Right Video Container */}
              <div className="photographer-video-container" style={{
                flex: 1,
                maxWidth: '580px',
                maxHeight: '1000px',
                background: 'linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #083A85 100%)',
                borderRadius: '20px',
                padding: '23px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '100%',
                  height: '270px',
                  padding: '10px',
                  backgroundColor: '#000',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}>
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      objectFit: 'cover'
                    }}
                    controls={false}
                  >
                    <source src="/vid.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>

              {/* Button - Now after video */}
              <button
                className="photographer-button"
                onClick={() => window.location.href = '/user/auth/signup?userType=Photographer'}
                style={{
                  background: '#FFFFFF',
                  color: '#083A85',
                  position: 'absolute',
                  left: '150px',
                  top: '290px',
                  fontSize: '17px',
                  fontWeight: 600,
                  padding: '8.25px 5.5px',
                  width: '180px',
                  height: '12%',
                  borderRadius: '50px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
                  e.currentTarget.style.background = '#083A85';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(8,58,133,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.color = '#083A85';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                }}
              >
                {t('howItWorks.forPhotographers.cta')}
              </button>
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
          {/* Inner container with #1c1c1c background - Stacked Peel Effect */}
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
                        background: 'linear-gradient(90deg, #083A85 0%, #4fa3d1 100%)',
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
                        background: 'linear-gradient(90deg, #083A85 0%, #4fa3d1 100%)',
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
                        background: 'linear-gradient(90deg, #083A85 0%, #4fa3d1 100%)',
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
          onMouseMove={handleWhyAmoriaMouseMove}
          onMouseLeave={handleWhyAmoriaMouseLeave}
          style={{
            backgroundColor: '#f8fafc',
            padding: '70px 0',
            position: 'relative',
            overflow: 'visible',
            zIndex: 3,
            marginTop: '-100vh'
          }}
        >
          {/* Background Decorative Elements */}
          {/* Top-left decorative icon */}
          <div className="why-amoria-decorative" style={{ display: 'none',
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
          <div className="why-amoria-decorative" style={{ display: 'none',
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
          <div className="why-amoria-decorative" style={{ display: 'none',
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
          <div className="why-amoria-decorative" style={{ display: 'none',
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

          {/* Dotted pattern background - base layer (dim) */}
          <div className="why-amoria-dotted-bg" style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '10px 10px',
            opacity: 0.2,
            zIndex: 0,
            pointerEvents: 'none'
          }} />

          {/* Spotlight layer - reveals brighter dots where cursor is */}
          <div className="why-amoria-dotted-spotlight" style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #64748b 1.5px, transparent 0.5px)',
            backgroundSize: '10px 10px',
            opacity: whyAmoriaMousePos ? 0.7 : 0,
            zIndex: 1,
            pointerEvents: 'none',
            maskImage: whyAmoriaMousePos
              ? `radial-gradient(circle 70px at ${whyAmoriaMousePos.x}px ${whyAmoriaMousePos.y}px, black 0%, black 50%, transparent 80%)`
              : 'none',
            WebkitMaskImage: whyAmoriaMousePos
              ? `radial-gradient(circle 70px at ${whyAmoriaMousePos.x}px ${whyAmoriaMousePos.y}px, black 0%, black 50%, transparent 80%)`
              : 'none',
            transition: 'opacity 0s ease'
          }} />

          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            position: 'relative',
            zIndex: 1
          }}>
            {/* 3D Flip Book */}
            <style>{`
              .book-scene {
                perspective: 1800px;
                max-width: 1000px;
                margin: 0 auto;
                display: flex;
                justify-content: center;
                padding: 0 40px;
              }
              .book-3d {
                width: 380px;
                height: 420px;
                position: relative;
                transform-style: preserve-3d;
                transform: rotateY(-5deg) rotateX(2deg);
                filter: drop-shadow(0 25px 40px rgba(0,0,0,0.2)) drop-shadow(0 10px 15px rgba(0,0,0,0.1));
                margin-left: 380px;
              }
              /* Book cover */
              .book-cover {
                position: absolute;
                width: 100%;
                height: 100%;
                transform-style: preserve-3d;
                transform-origin: left center;
                z-index: 10;
              }
              .book-cover-face {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                border-radius: 4px 20px 20px 4px;
                overflow: hidden;
              }
              .book-cover-front {
                background: linear-gradient(160deg, #052047 0%, #083A85 40%, #0a4da3 70%, #1e5bb7 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                box-shadow: 4px 4px 20px rgba(0,0,0,0.3), inset -2px 0 8px rgba(0,0,0,0.2);
              }
              .book-cover-front::before {
                content: '';
                position: absolute;
                inset: 12px;
                border: 1.5px solid rgba(255,255,255,0.1);
                border-radius: 3px 12px 12px 3px;
                pointer-events: none;
              }
              .book-cover-front h2 {
                font-size: 32px;
                font-weight: 900;
                color: #fff;
                text-align: center;
                line-height: 1.2;
                margin-bottom: 14px;
              }
              .book-cover-front .cover-sub {
                font-size: 14px;
                color: rgba(255,255,255,0.55);
                text-align: center;
                max-width: 440px;
                line-height: 1.6;
                margin-bottom: 32px;
              }
              .book-cover-front .cover-hint {
                display: flex;
                align-items: center;
                gap: 6px;
                color: rgba(255,255,255,0.4);
                font-size: 11px;
                animation: hintBounce 2s ease-in-out infinite;
              }
              @keyframes hintBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(5px); }
              }
              .cover-flow {
                display: flex;
                align-items: center;
                gap: 0;
                margin-bottom: 20px;
              }
              .cf-node {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
              }
              .cf-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .cf-node:nth-child(1) .cf-icon { animation: cfPulse 3s ease-in-out 0s infinite; }
              .cf-node:nth-child(3) .cf-icon { animation: cfPulse 3s ease-in-out 0.6s infinite; }
              .cf-node:nth-child(5) .cf-icon { animation: cfPulse 3s ease-in-out 1.2s infinite; }
              .cf-node:nth-child(7) .cf-icon { animation: cfPulse 3s ease-in-out 1.8s infinite; }
              @keyframes cfPulse {
                0%, 100% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.1); opacity: 1; }
              }
              .cf-label {
                font-size: 9px;
                color: rgba(255,255,255,0.45);
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .cf-arrow {
                width: 20px;
                height: 1.5px;
                background: rgba(255,255,255,0.2);
                margin: 0 4px 16px;
              }
              .book-cover-back {
                transform: rotateY(180deg);
                background: linear-gradient(160deg, #041a3a 0%, #062d5e 100%);
                box-shadow: -4px 4px 20px rgba(0,0,0,0.3);
                border-radius: 20px 4px 4px 20px;
              }
              /* Back cover (bottom of stack) */
              .book-back-cover {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 4px 20px 20px 4px;
                background: linear-gradient(160deg, #052047 0%, #083A85 40%, #0a4da3 100%);
                z-index: -1;
                box-shadow: 2px 4px 15px rgba(0,0,0,0.15);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
              }
              .book-back-cover::before {
                content: '';
                position: absolute;
                inset: 12px;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 3px 14px 14px 3px;
                pointer-events: none;
              }
              .book-back-cover .back-logo {
                font-size: 20px;
                font-weight: 900;
                color: rgba(255,255,255,0.3);
                letter-spacing: 3px;
                text-transform: uppercase;
              }
              .book-back-cover .back-tagline {
                font-size: 11px;
                color: rgba(255,255,255,0.2);
                margin-top: 8px;
                font-weight: 500;
              }

              /* Pages */
              .book-page {
                position: absolute;
                width: 100%;
                height: 100%;
                transform-style: preserve-3d;
                transform-origin: left center;
              }
              /* Page curl effect during mid-flip */
              @keyframes pageCurl {
                0% { transform: rotateY(0deg) scale(1); }
                50% { transform: rotateY(-90deg) scale(0.95) skewY(2deg); }
                100% { transform: rotateY(-180deg) scale(1); }
              }
              .book-page-face {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                border-radius: 4px 20px 20px 4px;
                overflow: hidden;
              }
              .bp-front {
                background: #fff;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 50px 45px;
                box-shadow: 2px 2px 15px rgba(0,0,0,0.1), inset -2px 0 6px rgba(0,0,0,0.04);
                position: relative;
              }
              /* Gutter shadow - simulates book crease along spine */
              .bp-front::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 30px;
                background: linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0.02), transparent);
                z-index: 2;
                pointer-events: none;
                border-radius: 4px 0 0 4px;
              }
              .bp-front .bp-watermark {
                display: none;
              }
              .bp-front .bp-text {
                width: 100%;
                position: relative;
                z-index: 1;
              }
              .bp-front .bp-text .bp-num {
                display: none;
              }
              .bp-front .bp-text h3 {
                font-size: 28px;
                font-weight: 900;
                color: #083A85;
                margin-bottom: 16px;
                line-height: 1.15;
              }
              .bp-front .bp-text p {
                font-size: 15px;
                color: #64748b;
                line-height: 1.7;
                margin: 0;
                max-width: 320px;
              }
              /* Decorative line under heading */
              .bp-front .bp-text .bp-line {
                width: 40px;
                height: 3px;
                background: #083A85;
                border-radius: 2px;
                margin-bottom: 16px;
                opacity: 0.3;
              }
              .bp-back {
                transform: rotateY(180deg);
                background: linear-gradient(135deg, #062d5e 0%, #083A85 50%, #0a4da3 100%);
                position: relative;
                box-shadow: -2px 2px 15px rgba(0,0,0,0.15);
                border-radius: 20px 4px 4px 20px;
                overflow: hidden;
              }
              /* Huge page number — bottom right */
              .bp-back .bp-back-num {
                font-size: 200px;
                font-weight: 900;
                color: rgba(255,255,255,0.15);
                position: absolute;
                bottom: -20px;
                right: 10px;
                line-height: 1;
                letter-spacing: -10px;
                pointer-events: none;
              }
              /* Title — vertical on left side */
              .bp-back h4 {
                writing-mode: vertical-rl;
                font-size: 24px;
                font-weight: 900;
                color: rgba(255,255,255,0.8);
                position: absolute;
                left: 20px;
                top: 50%;
                transform: rotate(180deg);
                letter-spacing: 3px;
                text-transform: uppercase;
                margin: 0;
              }
              /* Small page label — top right */
              .bp-back .bp-back-label {
                font-size: 10px;
                font-weight: 700;
                color: rgba(255,255,255,0.4);
                text-transform: uppercase;
                letter-spacing: 2px;
                position: absolute;
                top: 20px;
                right: 20px;
              }
              /* Description — top left area */
              .bp-back p {
                font-size: 11px;
                color: rgba(255,255,255,0.35);
                position: absolute;
                top: 20px;
                left: 55px;
                right: 80px;
                line-height: 1.6;
                margin: 0;
              }

              /* Page thickness edges */
              .book-page-edges {
                position: absolute;
                right: -3px;
                top: 8px;
                bottom: 8px;
                width: 6px;
                background: repeating-linear-gradient(
                  to bottom,
                  #e8e8e8 0px,
                  #f5f5f5 1px,
                  #e8e8e8 2px
                );
                border-radius: 0 2px 2px 0;
                z-index: -1;
                pointer-events: none;
                box-shadow: 1px 0 3px rgba(0,0,0,0.08);
              }

              /* Spine */
              .book-spine-3d {
                position: absolute;
                left: -6px;
                top: 0;
                bottom: 0;
                width: 14px;
                background: linear-gradient(to right, #041a3a, #052047, #062d5e);
                border-radius: 3px 0 0 3px;
                z-index: 11;
                box-shadow: -2px 2px 8px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
              }
              .book-spine-3d .spine-text {
                writing-mode: vertical-rl;
                text-orientation: mixed;
                transform: rotate(180deg);
                font-size: 7px;
                font-weight: 800;
                color: rgba(255,255,255,0.25);
                letter-spacing: 2px;
                text-transform: uppercase;
                white-space: nowrap;
              }

              /* Page shadow */
              .book-page::after {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 40px;
                height: 100%;
                background: linear-gradient(to left, rgba(0,0,0,0.05), transparent);
                border-radius: 0 16px 16px 0;
                pointer-events: none;
                opacity: 1;
                transition: opacity 0.4s;
              }
              /* Hide back faces of pages — only cover back face shows on the left */
              .bp-back {
                visibility: hidden;
              }

              /* Dots */
              .book-dots {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 30px;
              }
              .book-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 2px solid #083A85;
                background: transparent;
                transition: all 0.3s ease;
              }
              .book-dot.active {
                background: #083A85;
                transform: scale(1.2);
              }
              .book-scroll-hint {
                text-align: center;
                margin-top: 14px;
                font-size: 13px;
                color: #94a3b8;
                font-weight: 500;
              }

              @media (max-width: 768px) {
                .book-scene { padding: 0 20px; }
                .book-3d {
                  width: 100%;
                  max-width: 500px;
                  height: 480px;
                  margin-left: 0 !important;
                  transform: rotateY(0deg) rotateX(0deg) !important;
                }
                .bp-front .bp-text { padding: 50px 40px; }
                .bp-front .bp-text h3 { font-size: 30px; }
                .bp-front .bp-text p { font-size: 18px; }
                .bp-front .bp-text .bp-line { width: 30px; height: 2px; }
                .book-cover-front h2 { font-size: 22px; }
                .book-cover-front .cover-sub { font-size: 11px; margin-bottom: 20px; }
                .book-cover-front { padding: 30px 24px; }
                /* Hide spine and page edges on mobile */
                .book-spine-3d { display: none; }
                .book-page-edges { display: none; }
                /* Hide flipped pages on left — just flip in place */
                .book-cover-back { visibility: hidden !important; }
                .book-cover { z-index: 10 !important; }
                /* Simpler page face styling */
                .bp-front::before { width: 15px; }
                .book-page-face { border-radius: 4px 12px 12px 4px; }
                .book-cover-face { border-radius: 4px 12px 12px 4px; }
                /* Back cover */
                .book-back-cover { border-radius: 4px 12px 12px 4px; padding: 30px; }
                .book-back-cover .back-logo { font-size: 16px; }
                .book-back-cover .back-tagline { font-size: 10px; }
                /* Cover flow smaller */
                .cf-icon { width: 32px; height: 32px; }
                .cf-icon svg { width: 14px; height: 14px; }
                .cf-label { font-size: 8px; }
                .cf-arrow { width: 14px; margin: 0 3px 14px; }
                .cover-flow { margin-bottom: 16px; }
              }
              @media (max-width: 480px) {
                .book-scene { padding: 0 12px; }
                .book-3d {
                  width: 100%;
                  max-width: 340px;
                  height: 400px;
                }
                .bp-front .bp-text { padding: 34px 24px; }
                .bp-front .bp-text h3 { font-size: 24px; }
                .bp-front .bp-text p { font-size: 15px; line-height: 1.6; }
                .book-cover-front h2 { font-size: 19px; }
                .book-cover-front .cover-sub { font-size: 10px; }
                .book-cover-front { padding: 24px 18px; }
                .cf-icon { width: 28px; height: 28px; }
                .cf-icon svg { width: 12px; height: 12px; }
                .cf-label { font-size: 7px; }
                .cf-arrow { width: 10px; margin: 0 2px 12px; }
              }
            `}</style>

            <div className="flip-book-wrapper" ref={flipBookRef}>
              <div className="book-scene">
                <div className="book-3d" ref={book3dRef}>
                  {/* Spine */}
                  <div className="book-spine-3d">
                    <span className="spine-text">AMORIA CONNEKYT</span>
                  </div>
                  {/* Page edges */}
                  <div className="book-page-edges" />

                  {/* Back cover (bottom of stack) */}
                  <div className="book-back-cover">
                    <div className="back-logo">Amoria Connekyt</div>
                    <div className="back-tagline">The Smart Way to Capture Life</div>
                  </div>

                  {/* Page 8: Photographer Portfolio (bottom, z-index 1) */}
                  <div className="book-page" ref={bookPage8Ref} style={{ zIndex: 1 }}>
                    <div className="book-page-face bp-front">
                      <span className="bp-watermark">08</span>
                      <div className="bp-text">
                        <span className="bp-num">PAGE 08</span>
                        <h3>Photographer Portfolio</h3>
                        <div className="bp-line" />
                        <p>Showcase your best work with a stunning portfolio that attracts clients and builds your brand.</p>
                      </div>
                    </div>
                    <div className="book-page-face bp-back">
                      <span className="bp-back-num">08</span>
                      <span className="bp-back-label">Page 08</span>
                      <h4>Photographer Portfolio</h4>
                      <p>Build your professional brand</p>
                    </div>
                  </div>

                  {/* Page 7: Global Network (z-index 2) */}
                  <div className="book-page" ref={bookPage7Ref} style={{ zIndex: 2 }}>
                    <div className="book-page-face bp-front">
                      <span className="bp-watermark">07</span>
                      <div className="bp-text">
                        <span className="bp-num">PAGE 07</span>
                        <h3>Global Network</h3>
                        <div className="bp-line" />
                        <p>Connect with photographers and clients worldwide through our growing international community.</p>
                      </div>
                    </div>
                    <div className="book-page-face bp-back">
                      <span className="bp-back-num">07</span>
                      <span className="bp-back-label">Page 07</span>
                      <h4>Global Network</h4>
                      <p>Worldwide photography community</p>
                    </div>
                  </div>

                  {/* Page 6: Photo Gallery (z-index 3) */}
                  <div className="book-page" ref={bookPage6Ref} style={{ zIndex: 3 }}>
                    <div className="book-page-face bp-front">
                      <span className="bp-watermark">06</span>
                      <div className="bp-text">
                        <span className="bp-num">PAGE 06</span>
                        <h3>Photo Gallery</h3>
                        <div className="bp-line" />
                        <p>Beautiful curated galleries delivered directly from your event, ready to share and download.</p>
                      </div>
                    </div>
                    <div className="book-page-face bp-back">
                      <span className="bp-back-num">06</span>
                      <span className="bp-back-label">Page 06</span>
                      <h4>Photo Gallery</h4>
                      <p>Curated event memories</p>
                    </div>
                  </div>

                  {/* Page 5: Event Management (z-index 4) */}
                  <div className="book-page" ref={bookPage5Ref} style={{ zIndex: 4 }}>
                    <div className="book-page-face bp-front">
                      <span className="bp-watermark">05</span>
                      <div className="bp-text">
                        <span className="bp-num">PAGE 05</span>
                        <h3>Event Management</h3>
                        <div className="bp-line" />
                        <p>Manage your events with a powerful dashboard — track bookings, earnings, and performance in real time.</p>
                      </div>
                    </div>
                    <div className="book-page-face bp-back">
                      <span className="bp-back-num">05</span>
                      <span className="bp-back-label">Page 05</span>
                      <h4>Event Management</h4>
                      <p>Powerful event dashboard</p>
                    </div>
                  </div>

                  {/* Page 4: All in One (z-index 5) */}
                  <div className="book-page" ref={bookPage4Ref} style={{ zIndex: 5 }}>
                    <div className="book-page-face bp-front">
                      <span className="bp-watermark">04</span>
                      <div className="bp-text">
                        <span className="bp-num">PAGE 04</span>
                        <h3>All in One Platform</h3>
                        <div className="bp-line" />
                        <p>Everything you need for event photography in one place.</p>
                      </div>
                    </div>
                    <div className="book-page-face bp-back">
                      <span className="bp-back-num">04</span>
                      <span className="bp-back-label">Page 04</span>
                      <h4>All in One Platform</h4>
                      <p>Your complete photography solution</p>
                    </div>
                  </div>

                  {/* Page 3: Secure Payments (z-index 6) */}
                  <div className="book-page" ref={bookPage3Ref} style={{ zIndex: 6 }}>
                    <div className="book-page-face bp-front">
                      <span className="bp-watermark">03</span>
                      <div className="bp-text">
                        <span className="bp-num">PAGE 03</span>
                        <h3>{t('whyAmoria.securePayments.title')}</h3>
                        <div className="bp-line" />
                        <p>{t('whyAmoria.securePayments.description')}</p>
                      </div>
                    </div>
                    <div className="book-page-face bp-back">
                      <span className="bp-back-num">03</span>
                      <span className="bp-back-label">Page 03</span>
                      <h4>{t('whyAmoria.securePayments.title')}</h4>
                      <p>Protected & verified transactions</p>
                    </div>
                  </div>

                  {/* Page 2: Live Streaming (z-index 7) */}
                  <div className="book-page" ref={bookPage2Ref} style={{ zIndex: 7 }}>
                    <div className="book-page-face bp-front">
                      <span className="bp-watermark">02</span>
                      <div className="bp-text">
                        <span className="bp-num">PAGE 02</span>
                        <h3>{t('whyAmoria.liveStreaming.title')}</h3>
                        <div className="bp-line" />
                        <p>{t('whyAmoria.liveStreaming.description')}</p>
                      </div>
                    </div>
                    <div className="book-page-face bp-back">
                      <span className="bp-back-num">02</span>
                      <span className="bp-back-label">Page 02</span>
                      <h4>{t('whyAmoria.liveStreaming.title')}</h4>
                      <p>Real-time event broadcasting</p>
                    </div>
                  </div>

                  {/* Page 1: Rated Photographers (z-index 8, top) */}
                  <div className="book-page" ref={bookPage1Ref} style={{ zIndex: 8 }}>
                    <div className="book-page-face bp-front">
                      <span className="bp-watermark">01</span>
                      <div className="bp-text">
                        <span className="bp-num">PAGE 01</span>
                        <h3>{t('whyAmoria.ratedPhotographers.title')}</h3>
                        <div className="bp-line" />
                        <p>{t('whyAmoria.ratedPhotographers.description')}</p>
                      </div>
                    </div>
                    <div className="book-page-face bp-back">
                      <span className="bp-back-num">01</span>
                      <span className="bp-back-label">Page 01</span>
                      <h4>{t('whyAmoria.ratedPhotographers.title')}</h4>
                      <p>Trusted & verified professionals</p>
                    </div>
                  </div>

                  {/* Book Cover (z-index 5, very top) */}
                  <div className="book-cover" ref={bookCoverRef}>
                    <div className="book-cover-face book-cover-front">
                      <h2>{t('whyAmoria.title')}</h2>
                      <p className="cover-sub">{t('whyAmoria.subtitle')}</p>
                      <div className="cover-flow">
                        <div className="cf-node">
                          <div className="cf-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                            </svg>
                          </div>
                          <span className="cf-label">Photographer</span>
                        </div>
                        <div className="cf-arrow" />
                        <div className="cf-node">
                          <div className="cf-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                          </div>
                          <span className="cf-label">Event</span>
                        </div>
                        <div className="cf-arrow" />
                        <div className="cf-node">
                          <div className="cf-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
                              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                            </svg>
                          </div>
                          <span className="cf-label">Stream</span>
                        </div>
                        <div className="cf-arrow" />
                        <div className="cf-node">
                          <div className="cf-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                          </div>
                          <span className="cf-label">Client</span>
                        </div>
                      </div>
                    </div>
                    <div className="book-cover-face book-cover-back" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      {/* Big page number */}
                      <span style={{ fontSize: '180px', fontWeight: 900, color: 'rgba(255,255,255,0.1)', lineHeight: 1, letterSpacing: '-8px', marginBottom: '-20px' }}>
                        {activeCard >= 0 && activeCard < 8 ? `0${activeCard + 1}` : ''}
                      </span>
                      {/* Matching heading */}
                      <h4 style={{ fontSize: '22px', fontWeight: 900, color: 'rgba(255,255,255,0.85)', textAlign: 'center', margin: 0, padding: '0 24px', lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: '2px' }}>
                        {activeCard === 0 && t('whyAmoria.ratedPhotographers.title')}
                        {activeCard === 1 && t('whyAmoria.liveStreaming.title')}
                        {activeCard === 2 && t('whyAmoria.securePayments.title')}
                        {activeCard === 3 && 'All in One Platform'}
                        {activeCard === 4 && 'Event Management'}
                        {activeCard === 5 && 'Photo Gallery'}
                        {activeCard === 6 && 'Global Network'}
                        {activeCard === 7 && 'Photographer Portfolio'}
                        {(activeCard === 8 || activeCard === 9) && 'Amoria Connekyt'}
                      </h4>
                    </div>
                  </div>
                </div>
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
          onMouseMove={handleNetworkMouseMove}
          onMouseLeave={handleNetworkMouseLeave}
          style={{
            background: 'linear-gradient(to right, #052047, #052047, #103E83)',
            padding: '100px 0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Dotted pattern background - base layer (dim) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
              backgroundSize: '10px 10px',
              opacity: 0.2,
              zIndex: 0,
              pointerEvents: 'none'
            }}
          />

          {/* Spotlight layer - reveals brighter dots where cursor is */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.85) 1.5px, transparent 0.5px)',
              backgroundSize: '10px 10px',
              opacity: networkMousePos ? 0.5 : 0,
              zIndex: 1,
              pointerEvents: 'none',
              maskImage: networkMousePos
                ? `radial-gradient(circle 60px at ${networkMousePos.x}px ${networkMousePos.y}px, black 0%, black 50%, transparent 80%)`
                : 'none',
              WebkitMaskImage: networkMousePos
                ? `radial-gradient(circle 60px at ${networkMousePos.x}px ${networkMousePos.y}px, black 0%, black 50%, transparent 80%)`
                : 'none',
              transition: 'opacity 0s ease'
            }}
          />
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
              flex: '0 0 45%',
              maxWidth: '600px',
              color: '#fff'
            }}>
              {/* Title */}
              <h2 className="global-network-title" style={{
                fontSize: '50px',
                fontWeight: 800,
                lineHeight: '1.15',
                marginBottom: '24px',
                color: '#fff',
                letterSpacing: '-0.02em',
                wordBreak: 'keep-all'
              }}>
                {t('globalNetwork.title')}
              </h2>

              {/* Description */}
              <p className="global-network-description" style={{
                fontSize: '16px',
                lineHeight: '1.7',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 400,
                marginBottom: '36px',
                maxWidth: '520px'
              }}>
                {t('globalNetwork.description')}
              </p>
              <div className="global-network-buttons" style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap' }}>
                <button
                  onClick={() => window.location.href = '/user/photographers'}
                  style={{
                    backgroundColor: 'white',
                    color: '#083A85',
                    padding: '11.25px 20px',
                    borderRadius: '37.5px',
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
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    padding: '11.25px 20px',
                    borderRadius: '37.5px',
                    border: '1.5px solid rgba(255,255,255,0.5)',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(4px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                >
                  {t('globalNetwork.findEvents')}
                </button>
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