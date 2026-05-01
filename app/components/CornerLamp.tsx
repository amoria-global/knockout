'use client';

// CornerLamp — a smaller copy of the Smart Tools Lamp design, mounted at a
// section corner and rotated 45° so its conic light cone aims into the section.
// Same visual recipe as Lamp.tsx (filament line + conic gradient cone + diffuse
// bulb glow + masks), at roughly half the size.

import React from 'react';
import { motion } from 'framer-motion';

interface CornerLampProps {
  /** Which top corner the lamp sits in */
  position?: 'left' | 'right';
  /** Section background color the cone fades into */
  bgColor?: string;
  /** Conic cone color */
  beamColor?: string;
  /** Wide diffuse glow under the bulb */
  glowColor?: string;
  /** Bright filament + bulb hot-spot color */
  filamentColor?: string;
  /** Stacking order */
  zIndex?: number;
}

const CornerLamp: React.FC<CornerLampProps> = ({
  position = 'left',
  bgColor = '#FFF6FA',
  beamColor = '#A855F7',
  glowColor = '#C084FC',
  filamentColor = '#EC4899',
  zIndex = 1,
}) => {
  const isLeft = position === 'left';
  // CSS rotate from a downward-pointing lamp:
  //   rotate(+45°) clockwise  → cone tilts to point DOWN-LEFT
  //   rotate(-45°) counter-cw → cone tilts to point DOWN-RIGHT
  // For the cones to face the SECTION CENTER:
  //   left  lamp: rotate(-45°) → cone projects down-right into section
  //   right lamp: rotate(+45°) → cone projects down-left into section
  const rotation = isLeft ? -45 : 45;

  // Offset so the bulb sits at the visible section corner. The bulb is at the
  // top-center of the lamp box; positioning the box so its top-center falls on the
  // section's corner pre-rotation, then rotating around that bulb point keeps the
  // bulb fixed at the corner while the cone swings inward.
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 720px) {
          .corner-lamp-${position} {
            width: 14rem !important;
            height: 10rem !important;
            top: -1.6rem !important;
            ${isLeft ? 'left' : 'right'}: -5.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .corner-lamp-${position} {
            width: 11rem !important;
            height: 8rem !important;
            top: -1.2rem !important;
            ${isLeft ? 'left' : 'right'}: -4.2rem !important;
          }
        }
      ` }} />
    <div
      className={`corner-lamp-${position}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '-2.5rem',
        [isLeft ? 'left' : 'right']: '-9rem',
        width: '22rem',
        height: '15rem',
        pointerEvents: 'none',
        zIndex,
        overflow: 'visible',
        transform: `rotate(${rotation}deg)`,
        // Pivot at the bulb point: 50% horizontally, ~22% vertically (where the
        // filament line lives after the inner scaleY(1.25)).
        transformOrigin: '50% 22%',
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
        {/* Left half of the conic cone */}
        <motion.div
          initial={{ opacity: 0.5, width: '7rem' }}
          whileInView={{ opacity: 1, width: '14rem' }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 'auto',
            right: '50%',
            height: '7rem',
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
              height: '5rem',
              zIndex: 20,
              maskImage: 'linear-gradient(to top, white, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, white, transparent)',
            }}
          />
          {/* Inside-edge fade */}
          <div
            style={{
              position: 'absolute',
              width: '5rem',
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

        {/* Right half of the conic cone */}
        <motion.div
          initial={{ opacity: 0.5, width: '7rem' }}
          whileInView={{ opacity: 1, width: '14rem' }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 'auto',
            left: '50%',
            height: '7rem',
            color: '#fff',
            backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, ${beamColor})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '5rem',
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
              height: '5rem',
              zIndex: 20,
              maskImage: 'linear-gradient(to top, white, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, white, transparent)',
            }}
          />
        </motion.div>

        {/* BG-color softener — blurs cone into section */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            height: '6rem',
            width: '100%',
            transform: 'translateY(1.4rem) scaleX(1.5)',
            background: bgColor,
            filter: 'blur(20px)',
          }}
        />

        {/* Wide diffuse glow under the bulb */}
        <div
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 50,
            height: '4.5rem',
            width: '13rem',
            transform: 'translateY(-50%)',
            borderRadius: '9999px',
            background: glowColor,
            opacity: 0.55,
            filter: 'blur(34px)',
          }}
        />

        {/* Bright bulb hot-spot — animates wider on view */}
        <motion.div
          initial={{ width: '4rem' }}
          whileInView={{ width: '8rem' }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 30,
            height: '4.5rem',
            transform: 'translateY(-3rem)',
            borderRadius: '9999px',
            background: filamentColor,
            filter: 'blur(22px)',
          }}
        />

        {/* Filament — sharp horizontal line at the top */}
        <motion.div
          initial={{ width: '7rem' }}
          whileInView={{ width: '14rem' }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 50,
            height: '2px',
            transform: 'translateY(-3.5rem)',
            background: filamentColor,
            boxShadow: `0 0 14px ${filamentColor}`,
          }}
        />

        {/* Top mask — hides the cone's top so the lamp appears to come from above */}
        <div
          style={{
            position: 'absolute',
            inset: 'auto',
            zIndex: 40,
            height: '5.5rem',
            width: '100%',
            transform: 'translateY(-6.25rem)',
            background: bgColor,
          }}
        />
      </div>
    </div>
    </>
  );
};

export default CornerLamp;
