'use client';

// ContainerScroll - 3D card-rotation scroll effect.
// Inspired by Aceternity's container-scroll-animation. Card starts tilted forward
// (rotateX: 20deg) and flattens to 0 as the section enters the viewport.

import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';

interface ContainerScrollProps {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
  /** Outer card frame colors - defaults to a brand-blue gradient frame */
  frameClassName?: string;
  /** Inner content area background */
  innerClassName?: string;
}

export const ContainerScroll: React.FC<ContainerScrollProps> = ({
  titleComponent,
  children,
  frameClassName,
  innerClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scaleDimensions = (): [number, number] => (isMobile ? [0.7, 0.9] : [1.05, 1]);

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      ref={containerRef}
      className="cs-section"
      style={{
        height: 'clamp(60rem, 110vh, 80rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: 'clamp(8px, 2vw, 80px)',
      }}
    >
      <div className="cs-perspective" style={{ width: '100%', position: 'relative', perspective: '1000px', padding: 'clamp(40px, 8vw, 160px) 0' }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale} frameClassName={frameClassName} innerClassName={innerClassName}>
          {children}
        </Card>
      </div>
    </div>
  );
};

interface HeaderProps {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ translate, titleComponent }) => {
  return (
    <motion.div
      style={{ translateY: translate }}
      className="cs-header"
    >
      {titleComponent}
    </motion.div>
  );
};

interface CardProps {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
  frameClassName?: string;
  innerClassName?: string;
}

const Card: React.FC<CardProps> = ({ rotate, scale, children, frameClassName, innerClassName }) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
      }}
      className={`cs-card ${frameClassName ?? ''}`}
    >
      <div className={`cs-card-inner ${innerClassName ?? ''}`}>{children}</div>
    </motion.div>
  );
};

export default ContainerScroll;
