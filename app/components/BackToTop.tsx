'use client';
import React, { useState, useEffect } from 'react';

export default function BackToTop(): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = document.documentElement.scrollTop || document.body.scrollTop;

      // Show button only after scrolling down 100px
      if (scrolled > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Change color based on scroll depth - switch every 800px
      const colorCycle = Math.floor(scrolled / 800) % 2;
      setIsDarkMode(colorCycle === 0);
    };

    // Add scroll listener
    window.addEventListener('scroll', toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: isHovered ? '#062d6b' : '#083A85',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isHovered
          ? '0 6px 16px rgba(8, 58, 133, 0.4)'
          : '0 4px 12px rgba(8, 58, 133, 0.3)',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        fontSize: '20px',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transform: isVisible
          ? (isHovered ? 'translateY(-3px) scale(1.05)' : 'translateY(0) scale(1)')
          : 'translateY(20px) scale(0.8)',
      }}
      aria-label="Back to top"
    >
      <i className="bi bi-arrow-up" style={{ fontWeight: 'bold' }}></i>
    </button>
  );
}
