'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface PeelTransitionProps {
  children: React.ReactNode;
}

const PeelTransition: React.FC<PeelTransitionProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Get the peeling layer and revealed section
        const peelingLayer = containerRef.current?.querySelector('[data-peel-layer]') as HTMLElement;
        const revealedSection = containerRef.current?.querySelector('[data-peel-reveal]') as HTMLElement;

        if (!peelingLayer || !revealedSection) return;

        const peelContent = peelingLayer.querySelector('[data-peel-content]') as HTMLElement;
        if (!peelContent) return;

        // No overlap - sections flow naturally

        // Create sticky peel effect
        // Trigger later (bottom of section reaching center) so For Photographers is fully visible first
        ScrollTrigger.create({
          trigger: peelingLayer,
          start: 'bottom bottom',
          end: '+=200%',
          pin: peelContent,
          pinSpacing: false,
          scrub: 0.5,
          // markers: true, // Uncomment for debugging
          onUpdate: (self) => {
            const progress = self.progress;
            const clipPercent = 100 - (progress * 100);

            gsap.set(peelContent, {
              clipPath: `polygon(0% 0%, 100% 0%, 100% ${clipPercent}%, 0% ${clipPercent}%)`,
              scale: 1 - (progress * 0.03),
            });
          }
        });

        // Refresh ScrollTrigger
        ScrollTrigger.refresh();
      }, containerRef);

      return () => ctx.revert();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div ref={containerRef} className="peel-container">
      {children}

      <style jsx global>{`
        .peel-container {
          position: relative;
          overflow: hidden;
        }

        [data-peel-layer] {
          position: relative;
          z-index: 10;
        }

        [data-peel-content] {
          position: relative;
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
          will-change: clip-path, transform;
        }

        [data-peel-reveal] {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

// Section that will peel away to reveal the next section
export const PeelLayer: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  bgColor?: string;
}> = ({ children, className = '', style, id, bgColor }) => {
  return (
    <div
      id={id}
      data-peel-layer
      className={className}
      style={{ position: 'relative', ...style }}
    >
      {/* Content that will peel away */}
      <div
        data-peel-content
        style={{
          backgroundColor: bgColor || 'inherit',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Section that gets revealed underneath (doesn't peel itself)
export const PeelSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  bgColor?: string;
}> = ({ children, className = '', style, id, bgColor }) => {
  return (
    <div
      id={id}
      data-peel
      data-peel-reveal
      className={className}
      style={{ position: 'relative', zIndex: 1, ...style }}
    >
      <div data-peel-content style={{ backgroundColor: bgColor || 'inherit' }}>
        {children}
      </div>
    </div>
  );
};

export default PeelTransition;
