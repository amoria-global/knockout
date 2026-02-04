'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Footer from "./components/footer";
import Navbar from "./components/navbar";
import GlobalNetwork from "./components/GlobalNetwork";
import Preloader from "./components/Preloader";

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const t = useTranslations();
  const [activeCard, setActiveCard] = useState(0) // rated, 1: live, 2: pay, 3: gallery
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
  // Check if preloader should show on initial load
  const [showPreloader, setShowPreloader] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasShownPreloader = sessionStorage.getItem('hasShownPreloader');
      return hasShownPreloader !== 'true';
    }
    return true; // Default to true on server-side rendering
  })

  // Handle preloader completion
  const handlePreloaderComplete = () => {
    setShowPreloader(false)
  }

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
      {/* Show preloader only on first visit */}
      {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Show main content only after preloader is complete */}
      {!showPreloader && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Navbar - Outside sections to stay fixed */}
          <Navbar />

        <main style={{ flex: 1, position: 'relative' }}>
        <style jsx>{`
          @media (max-width: 768px) {
            .hero-content { flex-direction: column !important; padding: 20px 15px 40px !important; min-height: auto !important; gap: 20px !important; }
            .hero-left { width: 100% !important; max-width: 100% !important; text-align: center; padding: 0 10px !important; }
            .hero-right { width: 100% !important; height: 380px !important; margin-top: 10px; position: relative !important; overflow: visible !important; transform: scale(0.55) translateX(25%) !important; transform-origin: top center !important; margin-bottom: -120px !important; }
            .hero-title { font-size: 32px !important; line-height: 1.1 !important; }
            .hero-description { max-width: 100% !important; font-size: 14px !important; padding: 0 5px !important; }
            .hero-buttons { justify-content: center !important; flex-direction: column !important; align-items: center !important; gap: 10px !important; }
            .hero-buttons button { width: 100% !important; max-width: 280px !important; }
            .twitter-badge { margin-left: auto; margin-right: auto; }
            .hero-image-container { left: 50% !important; transform: translateX(-50%) !important; }
            .hero-glow { display: none !important; }
            .hero-circle { display: none !important; }

            .how-it-works-title { font-size: 36px !important; margin-bottom: 40px !important; text-align: center !important; }
            .how-it-works-steps { flex-direction: column !important; gap: 30px !important; align-items: center !important; }
            .how-it-works-svg { display: none !important; }
            .step-img { width: 180px !important; height: 180px !important; }
            .step-title { font-size: 24px !important; text-align: center !important; }
            .step-description { font-size: 15px !important; text-align: center !important; }

            .photographer-container { flex-direction: column !important; padding: 20px !important; gap: 20px !important; align-items: center !important; text-align: center !important; }
            .photographer-title { font-size: 32px !important; position: relative !important; top: 0 !important; text-align: center !important; }
            .photographer-description { position: relative !important; top: 0 !important; margin-bottom: 20px !important; font-size: 16px !important; text-align: center !important; }
            .photographer-button { position: relative !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 220px !important; margin: 0 auto !important; font-size: 22px !important; }
            .photographer-video-container { max-width: 100% !important; width: 100% !important; height: auto !important; }

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

          @media (min-width: 769px) and (max-width: 1024px) {
            .hero-title { font-size: 48px !important; }
            .hero-content { padding: 30px 20px 80px !important; }
            .mockups-section { padding: 80px 40px !important; }
            .mockups-container { height: 450px !important; }
            .mockup-heading-text h2 { font-size: 38px !important; }
            .mockup-heading-text { left: 20px !important; }
            .how-it-works-title { font-size: 45px !important; }
            .why-amoria-title { font-size: 45px !important; }
            .global-network-title { font-size: 45px !important; }
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
            padding: '40px 20px 128px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 'calc(80vh - 64px)'
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
                background: 'radial-gradient(circle, rgba(4, 25, 255, 0.3) 0% 10%, rgba(37, 17, 220, 0.43) 4% 10%, rgba(37, 17, 220, 0) 90% 90%)',
                borderRadius: '50%',
                filter: 'blur(55px)',
                zIndex: -1,
                pointerEvents: 'none'
              }} />

              {/* Twitter Handle Badge */}
              <div className="twitter-badge" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7.5px',
                padding: '9px 19.5px',
                border: 'none',
                borderRadius: '37.5px',
                marginBottom: '24px',
                backgroundColor: '#101012',
                color: '#fff'
              }}>
                <svg width="15.5" height="15.5" viewBox="0 0 24 24" fill="none">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#fff"/>
                </svg>
                <button style={{ fontWeight: 600, fontSize: '13px', color: '#fff', cursor: 'pointer', backgroundColor: 'transparent', border: 'none' }}>{t('hero.twitter')}</button>
              </div>

              {/* Main Heading */}
              <h1 className="hero-title" style={{
                fontSize: '57px',
                fontWeight: 700,
                lineHeight: '1.05',
                marginBottom: '19.5px',
                letterSpacing: '-0.02em'
              }}>
                <div style={{ color: '#083A85', marginBottom: '3px' }}>{t('hero.title1')}</div>
                <div style={{ color: '#000', marginBottom: '3px' }}>{t('hero.title2')}</div>
                <div style={{ color: '#000' }}>{t('hero.title3')}</div>
              </h1>

              {/* Description */}
              <p className="hero-description" style={{
                fontSize: '15px',
                color: '#1f1d1d',
                lineHeight: '1.65',
                marginBottom: '30px',
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
                    padding: '11.25px 25.5px',
                    borderRadius: '37.5px',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 9px rgba(8, 58, 133, 0.2)'
                  }}
                >
                  {t('hero.findPhotographer')}
                </button>
                <button
                  onClick={() => window.location.href = '/user/auth/signup?userType=Photographer'}
                  style={{
                  backgroundColor: 'transparent',
                  color: '#083A85',
                  padding: '11.25px 25.5px',
                  borderRadius: '37.5px',
                  border: '2px solid #083A85',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}>
                  {t('hero.joinPhotographer')}
                </button>
              </div>
            </div>

            {/* Right Content - Image Section */}
            <div className="hero-right" style={{
              position: 'relative',
              width: '52%',
              height: '525px',
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
                    src="/lady.png"
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
            padding: '50px 0 100px 0',
            backgroundColor: '#fff',
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
              marginBottom: '100px',
              color: '#000',
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
                    width: '240px',
                    height: '240px',
                    objectFit: 'contain',
                    marginBottom: '30px'
                  }}
                />
                <h3 className="step-title" style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#000',
                  marginBottom: '16px'
                }}>
                  {t('howItWorks.getStarted.title')}
                </h3>
                <p className="step-description" style={{
                  fontSize: '17px',
                  fontWeight: 400,
                  color: '#1f1d1d',
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
                    width: '240px',
                    height: '240px',
                    objectFit: 'contain',
                    marginBottom: '30px'
                  }}
                />
                <h3 className="step-title" style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#000',
                  marginBottom: '16px'
                }}>
                  {t('howItWorks.photography.title')}
                </h3>
                <p className="step-description" style={{
                  fontSize: '17px',
                  fontWeight: 400,
                  color: '#1f1d1d',
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
                    width: '240px',
                    height: '240px',
                    objectFit: 'contain',
                    marginBottom: '30px'
                  }}
                />
                <h3 className="step-title" style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#000',
                  marginBottom: '16px'
                }}>
                  {t('howItWorks.goLive.title')}
                </h3>
                <p className="step-description" style={{
                  fontSize: '17px',
                  fontWeight: 400,
                  color: '#1f1d1d',
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
                background: 'linear-gradient(90deg, #0104B9 0%, #0104B9 50%, #2213d1 10%, #013773 0%)',
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
                  background: 'linear-gradient(90deg, #041DC0 0%, #FF6363 0%, #7763FF 100%)',
                  color: '#000',
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
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.background = 'linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 100%)';
                  e.currentTarget.style.color = '#083A85';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,255,255,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'linear-gradient(90deg, #041DC0 0%, #FF6363 0%, #7763FF 100%)';
                  e.currentTarget.style.color = '#000';
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
          onMouseMove={handleWhyAmoriaMouseMove}
          onMouseLeave={handleWhyAmoriaMouseLeave}
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

          {/* Dotted pattern background - base layer (dim) */}
          <div className="why-amoria-dotted-bg" style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: 0.5,
            zIndex: 0,
            pointerEvents: 'none'
          }} />

          {/* Spotlight layer - reveals brighter dots where cursor is */}
          <div className="why-amoria-dotted-spotlight" style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #64748b 1.5px, transparent 0.5px)',
            backgroundSize: '20px 20px',
            opacity: whyAmoriaMousePos ? 0.8 : 0,
            zIndex: 1,
            pointerEvents: 'none',
            maskImage: whyAmoriaMousePos
              ? `radial-gradient(circle 100px at ${whyAmoriaMousePos.x}px ${whyAmoriaMousePos.y}px, black 0%, black 50%, transparent 80%)`
              : 'none',
            WebkitMaskImage: whyAmoriaMousePos
              ? `radial-gradient(circle 100px at ${whyAmoriaMousePos.x}px ${whyAmoriaMousePos.y}px, black 0%, black 50%, transparent 80%)`
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
            {/* Section Header */}
            <div className="why-amoria-header" style={{
              maxWidth: '780px',
              margin: '0 auto 120px',
              textAlign: 'center'
            }}>
              <h2 className="why-amoria-title" style={{
                fontSize: '50px',
                fontWeight: 1000,
                marginBottom: '24px',
                color: '#000',
                letterSpacing: '-0.02em'
              }}>
                  {t('whyAmoria.title')}
              </h2>
              <p className="why-amoria-subtitle" style={{
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

              {/* Extra small accent card - Bottom Right */}
              <div
                className="why-amoria-card-accent"
                style={{
                  position: 'absolute',
                  bottom: '50px',
                  right: '20px',
                  width: '220px',
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  padding: '18px',
                  zIndex: 2
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    background: 'linear-gradient(135deg, #083A85 0%, #1e5bb7 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#083A85' }}>All-in-One</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Platform</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#083A85',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  See more
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
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
              backgroundSize: '20px 20px',
              opacity: 0.3,
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
              backgroundSize: '20px 20px',
              opacity: networkMousePos ? 0.7 : 0,
              zIndex: 1,
              pointerEvents: 'none',
              maskImage: networkMousePos
                ? `radial-gradient(circle 80px at ${networkMousePos.x}px ${networkMousePos.y}px, black 0%, black 50%, transparent 80%)`
                : 'none',
              WebkitMaskImage: networkMousePos
                ? `radial-gradient(circle 80px at ${networkMousePos.x}px ${networkMousePos.y}px, black 0%, black 50%, transparent 80%)`
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
              flex: '0 0 42%',
              maxWidth: '550px',
              color: '#fff'
            }}>
              {/* Title */}
              <h2 className="global-network-title" style={{
                fontSize: '55px',
                fontWeight: 1000,
                lineHeight: '1.1',
                lineBreak: 'anywhere',
                marginBottom: '24px',
                color: '#fff',
                letterSpacing: '-0.02em'
              }}>
                {t('globalNetwork.title')}
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
                    borderRadius: '37.5px',
                    border: '1.5px solid #FFFFFF',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 3px 9px rgba(8, 58, 133, 0.2)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t('globalNetwork.connectNow')}
                </button>
                <button
                  onClick={() => window.location.href = '/user/events'}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#FFFFFF',
                    padding: '11.25px 20px',
                    borderRadius: '37.5px',
                    border: '2px solid #FFFFFF',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 3px 9px rgba(8, 58, 133, 0.2)',
                    whiteSpace: 'nowrap'
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