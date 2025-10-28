'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [isComplete, setIsComplete] = useState(false);
  // Check sessionStorage immediately during initialization
  const [shouldShow] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasShownPreloader = sessionStorage.getItem('hasShownPreloader');
      return hasShownPreloader !== 'true';
    }
    return true; // Default to true on server-side rendering
  });

  useEffect(() => {
    // If preloader should not show, call onComplete immediately
    if (!shouldShow) {
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Mark that preloader has been shown
    sessionStorage.setItem('hasShownPreloader', 'true');

    const sequence = async () => {
      // Wait for the full animation to complete
      await new Promise((resolve) => setTimeout(resolve, 4800));

      // Trigger fade out
      setIsComplete(true);

      // Wait for fade out, then call onComplete
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (onComplete) {
        onComplete();
      }
    };

    sequence();
  }, [onComplete, shouldShow]);

  if (!shouldShow || isComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0A2A66, #5BC0EB)',
      }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Connecting Lines - Animating from edges to center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Top Line */}
          <motion.div
            initial={{ y: -500, opacity: 5 }}
            animate={{ y: 10, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute top-0"
            style={{
              width: '2px',
              height: '100px',
              background: 'linear-gradient(180deg, transparent, #5BC0EB)',
              boxShadow: '0 0 10px #5BC0EB',
            }}
          />

          {/* Bottom Line */}
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute bottom-0"
            style={{
              width: '2px',
              height: '100px',
              background: 'linear-gradient(0deg, transparent, #5BC0EB)',
              boxShadow: '0 0 10px #5BC0EB',
            }}
          />

          {/* Left Line */}
          <motion.div
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute left-0"
            style={{
              width: '100px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #5BC0EB)',
              boxShadow: '0 0 10px #5BC0EB',
            }}
          />

          {/* Right Line */}
          <motion.div
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute right-0"
            style={{
              width: '100px',
              height: '2px',
              background: 'linear-gradient(270deg, transparent, #5BC0EB)',
              boxShadow: '0 0 10px #5BC0EB',
            }}
          />
        </div>

        {/* Main Logo SVG - Amoria Connekt 'K' Symbol */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <svg
            width="200"
            height="240"
            viewBox="0 0 200 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative"
          >
            {/* Left Side - Three Parallel Vertical Lines */}
            {/* First vertical bar */}
            <motion.rect
              x="20"
              y="40"
              width="16"
              height="160"
              fill="#FFFFFF"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              style={{ transformOrigin: 'top' }}
              transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
            />
            {/* Second vertical bar */}
            <motion.rect
              x="46"
              y="40"
              width="16"
              height="160"
              fill="#FFFFFF"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              style={{ transformOrigin: 'top' }}
              transition={{ delay: 0.9, duration: 0.5, ease: 'easeOut' }}
            />
            {/* Third vertical bar */}
            <motion.rect
              x="72"
              y="40"
              width="16"
              height="160"
              fill="#FFFFFF"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              style={{ transformOrigin: 'top' }}
              transition={{ delay: 1.0, duration: 0.5, ease: 'easeOut' }}
            />

            {/* Right Side - Three Diagonal Lines from Midpoint */}

            {/* Top Diagonal - Upward 45° angle */}
            <motion.path
              d="M 88 70 L 180 40"
              stroke="#FFFFFF"
              strokeWidth="16"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Second top diagonal - parallel to first */}
            <motion.path
              d="M 88 92 L 180 62"
              stroke="#FFFFFF"
              strokeWidth="16"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Middle Diagonal - Horizontal (aligned with center) */}
            <motion.path
              d="M 88 120 L 180 120"
              stroke="#FFFFFF"
              strokeWidth="16"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Bottom Diagonal - Downward 45° angle */}
            <motion.path
              d="M 88 148 L 180 178"
              stroke="#FFFFFF"
              strokeWidth="16"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Second bottom diagonal - parallel to previous */}
            <motion.path
              d="M 88 170 L 180 200"
              stroke="#FFFFFF"
              strokeWidth="16"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6, ease: 'easeInOut' }}
            />
          </svg>

          {/* Glow Effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.6] }}
            transition={{ delay: 1.9, duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              filter: 'blur(20px)',
            }}
          >
            <div
              style={{
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle, #5BC0EB 0%, transparent 70%)',
                opacity: 0.6,
              }}
            />
          </motion.div>
        </motion.div>

        {/* Tagline Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, duration: 0.6, ease: 'easeOut' }}
          className="mt-12 text-center"
        >
          
        </motion.div>
      </div>
    </motion.div>
  );
}
