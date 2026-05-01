'use client';

// Lamp — conic-gradient light beam projecting downward into a dark section.
// Inspired by Aceternity's Lamp Effect. Ported from Tailwind-classes JSX into a
// self-contained component with inline styles so it drops into any section.
// Positioned absolutely at the top of its parent — the parent should have
// position:relative and a dark background for the light to read against.

import React from 'react';
import { motion } from 'framer-motion';

interface LampProps {
  /** Section background color the lamp's light fades into */
  bgColor?: string;
  /** Conic light cone color (the "spread" of the beam) */
  beamColor?: string;
  /** Wide diffuse glow under the bulb */
  glowColor?: string;
  /** Bright filament + bulb hot-spot color */
  filamentColor?: string;
  /** Total area height occupied by the lamp graphic */
  height?: string;
  /** z-index of the lamp graphic relative to surrounding content */
  zIndex?: number;
  className?: string;
}

const Lamp: React.FC<LampProps> = ({
  bgColor = '#0B0817',
  beamColor = '#A855F7',
  glowColor = '#C084FC',
  filamentColor = '#EC4899',
  height = '22rem',
  zIndex = 1,
  className,
}) => {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          height: '100%',
          transform: 'scaleY(1.25)',
          alignItems: 'center',
          justifyContent: 'center',
          isolation: 'isolate',
        }}
      >
        {/* Left half of the conic light cone */}
        <motion.div
          initial={{ opacity: 0.5, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 'auto',
            right: '50%',
            height: '14rem',
            overflow: 'visible',
            color: '#fff',
            backgroundImage: `conic-gradient(from 70deg at center top, ${beamColor}, transparent, transparent)`,
          }}
        >
          {/* Bottom fade — masks the cone into the section bg */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              left: 0,
              bottom: 0,
              background: bgColor,
              height: '10rem',
              zIndex: 20,
              maskImage: 'linear-gradient(to top, white, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, white, transparent)',
            }}
          />
          {/* Inside-edge fade — keeps the cone shape clean */}
          <div
            style={{
              position: 'absolute',
              width: '10rem',
              height: '100%',
              left: 0,
              bottom: 0,
              background: bgColor,
              zIndex: 20,
              maskImage: 'linear-gradient(to right, white, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, white, transparent)',
            }}
          />
        </motion.div>

        {/* Right half of the conic light cone */}
        <motion.div
          initial={{ opacity: 0.5, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 'auto',
            left: '50%',
            height: '14rem',
            color: '#fff',
            backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, ${beamColor})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '10rem',
              height: '100%',
              right: 0,
              bottom: 0,
              background: bgColor,
              zIndex: 20,
              maskImage: 'linear-gradient(to left, white, transparent)',
              WebkitMaskImage: 'linear-gradient(to left, white, transparent)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              right: 0,
              bottom: 0,
              background: bgColor,
              height: '10rem',
              zIndex: 20,
              maskImage: 'linear-gradient(to top, white, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, white, transparent)',
            }}
          />
        </motion.div>

        {/* Stretched bg-color blur — softens the beam onto the section */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            height: '12rem',
            width: '100%',
            transform: 'translateY(3rem) scaleX(1.5)',
            background: bgColor,
            filter: 'blur(40px)',
          }}
        />

        {/* Wide diffuse glow under the bulb */}
        <div
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 50,
            height: '9rem',
            width: '28rem',
            transform: 'translateY(-50%)',
            borderRadius: '9999px',
            background: glowColor,
            opacity: 0.5,
            filter: 'blur(60px)',
          }}
        />

        {/* Bright bulb hot-spot — animates wider on view */}
        <motion.div
          initial={{ width: '8rem' }}
          whileInView={{ width: '16rem' }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 30,
            height: '9rem',
            transform: 'translateY(-6rem)',
            borderRadius: '9999px',
            background: filamentColor,
            filter: 'blur(40px)',
          }}
        />

        {/* Filament — sharp horizontal line at the top */}
        <motion.div
          initial={{ width: '15rem' }}
          whileInView={{ width: '30rem' }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 50,
            height: '2px',
            transform: 'translateY(-7rem)',
            background: filamentColor,
            boxShadow: `0 0 18px ${filamentColor}`,
          }}
        />

        {/* Top mask — hides the cone's top so the lamp appears to come from above */}
        <div
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 40,
            height: '11rem',
            width: '100%',
            transform: 'translateY(-12.5rem)',
            background: bgColor,
          }}
        />
      </div>
    </div>
  );
};

export default Lamp;
