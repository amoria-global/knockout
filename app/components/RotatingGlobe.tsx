"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { geoOrthographic, geoPath, geoGraticule } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";

interface RotatingGlobeProps {
  size?: number;
  rotationSpeed?: number;
  landColor?: string;
  oceanColor?: string;
  borderColor?: string;
  graticuleColor?: string;
  glowColor?: string;
  interactive?: boolean;
}

const RotatingGlobe: React.FC<RotatingGlobeProps> = ({
  size = 280,
  rotationSpeed = 0.3,
  landColor = "rgba(139, 92, 246, 0.35)",
  oceanColor = "rgba(8, 58, 133, 0.15)",
  borderColor = "rgba(139, 92, 246, 0.5)",
  graticuleColor = "rgba(255, 255, 255, 0.07)",
  glowColor = "rgba(139, 92, 246, 0.4)",
  interactive = false,
}) => {
  const [geographies, setGeographies] = useState<Feature<Geometry>[]>([]);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [splashDots, setSplashDots] = useState<{ x: number; y: number; id: number }[]>([]);
  const splashIdRef = useRef(0);

  const geoUrl =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  useEffect(() => {
    fetch(geoUrl)
      .then((response) => response.json())
      .then((data) => {
        const countries =
          feature(data, data.objects.countries) as unknown as FeatureCollection;
        setGeographies(countries.features);
      });
  }, []);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current) {
        const delta = time - lastTimeRef.current;
        setRotation((prev) => (prev + rotationSpeed * delta * 0.06) % 360);
      }
      lastTimeRef.current = time;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [rotationSpeed]);

  const projection = useMemo(() => {
    return geoOrthographic()
      .scale(size / 2 - 10)
      .translate([size / 2, size / 2])
      .rotate([rotation, -15, 0])
      .clipAngle(90);
  }, [size, rotation]);

  const pathGenerator = useMemo(
    () => geoPath().projection(projection),
    [projection]
  );

  const graticule = useMemo(() => geoGraticule().step([20, 20])(), []);

  // Generate many dots spread across the globe surface
  const cityDots = useMemo(() => {
    const dots: [number, number][] = [
      // Key cities
      [-74.006, 40.7128], [-0.1276, 51.5074], [36.8, -1.3],
      [55.2708, 25.2048], [72.8777, 19.076], [139.6917, 35.6895],
      [151.2093, -33.8688], [-43.1729, -22.9068], [28.0473, -26.2041],
      [103.8198, 1.3521],
    ];
    // Add grid points across the globe for denser coverage
    for (let lat = -60; lat <= 70; lat += 20) {
      for (let lng = -180; lng <= 180; lng += 25) {
        dots.push([lng, lat]);
      }
    }

    return dots
      .map((coords, i) => {
        const projected = projection(coords);
        if (!projected) return null;
        return { x: projected[0], y: projected[1], id: i };
      })
      .filter(Boolean) as { x: number; y: number; id: number }[];
  }, [projection]);

  // Compute displaced dot positions when interactive
  const displacedDots = useMemo(() => {
    if (!interactive || !mousePos) return cityDots.map(d => ({ ...d, dx: 0, dy: 0, force: 0 }));
    return cityDots.map(dot => {
      const dx = dot.x - mousePos.x;
      const dy = dot.y - mousePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 120;
      if (dist < maxDist) {
        const force = (1 - dist / maxDist) * 55;
        const angle = Math.atan2(dy, dx);
        return { ...dot, dx: Math.cos(angle) * force, dy: Math.sin(angle) * force, force };
      }
      return { ...dot, dx: 0, dy: 0, force: 0 };
    });
  }, [cityDots, mousePos, interactive]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (size / rect.width);
    const y = (e.clientY - rect.top) * (size / rect.height);
    setMousePos({ x, y });

    // Spawn splash particles near cursor
    const newDots: { x: number; y: number; id: number }[] = [];
    for (let i = 0; i < 3; i++) {
      newDots.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        id: splashIdRef.current++,
      });
    }
    setSplashDots(prev => [...prev.slice(-30), ...newDots]);
  }, [interactive, size]);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    setSplashDots([]);
  }, []);

  return (
    <div
      className="rotating-globe"
      style={{
        width: size,
        height: size,
        position: "relative",
        borderRadius: "50%",
      }}
    >
      {/* Outer glow */}
      <div
        style={{
          position: "absolute",
          inset: -15,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: "relative", zIndex: 1, cursor: interactive ? 'crosshair' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Globe gradient background */}
          <radialGradient id="globe-ocean" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="rgba(30, 60, 120, 0.3)" />
            <stop offset="100%" stopColor={oceanColor} />
          </radialGradient>

          {/* Atmosphere edge glow */}
          <radialGradient id="globe-atmosphere" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="transparent" />
            <stop offset="95%" stopColor="rgba(139, 92, 246, 0.15)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.3)" />
          </radialGradient>

          {/* City dot glow */}
          <radialGradient id="dot-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 107, 107, 1)" />
            <stop offset="100%" stopColor="rgba(255, 107, 107, 0)" />
          </radialGradient>
        </defs>

        {/* Ocean / globe base */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          fill="url(#globe-ocean)"
          stroke={borderColor}
          strokeWidth={0.5}
        />

        {/* Graticule grid lines */}
        <path
          d={pathGenerator(graticule) || ""}
          fill="none"
          stroke={graticuleColor}
          strokeWidth={0.4}
        />

        {/* Countries */}
        {geographies.map((geo, i) => (
          <path
            key={i}
            d={pathGenerator(geo) || ""}
            fill={landColor}
            stroke={borderColor}
            strokeWidth={0.3}
          />
        ))}

        {/* Dots — displaced when interactive */}
        {displacedDots.map((dot) => {
          const isKey = dot.id < 10; // First 10 are key cities
          const baseR = isKey ? 3 : 1.5;
          const glowR = isKey ? 6 : 3;
          return (
            <g key={dot.id}>
              <circle
                cx={dot.x + dot.dx}
                cy={dot.y + dot.dy}
                r={glowR + dot.force * 0.08}
                fill="url(#dot-glow)"
                opacity={0.4 + dot.force * 0.01}
                style={{ transition: 'cx 0.2s ease, cy 0.2s ease' }}
              />
              <circle
                cx={dot.x + dot.dx}
                cy={dot.y + dot.dy}
                r={baseR + dot.force * 0.04}
                fill={isKey ? '#FF6B6B' : 'rgba(255,255,255,0.7)'}
                opacity={isKey ? 0.9 : 0.5}
                style={{ transition: 'cx 0.2s ease, cy 0.2s ease' }}
              />
              {/* Connecting line when displaced */}
              {dot.force > 8 && (
                <line
                  x1={dot.x + dot.dx}
                  y1={dot.y + dot.dy}
                  x2={dot.x}
                  y2={dot.y}
                  stroke={isKey ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={0.5}
                  strokeDasharray="2,3"
                />
              )}
            </g>
          );
        })}

        {/* Splash particles on cursor move */}
        {interactive && splashDots.map((dot) => (
          <circle
            key={dot.id}
            cx={dot.x}
            cy={dot.y}
            r={1.5}
            fill="#fff"
            opacity={0.5}
          >
            <animate attributeName="opacity" from="0.5" to="0" dur="0.6s" fill="freeze" />
            <animate attributeName="r" from="1.5" to="0" dur="0.6s" fill="freeze" />
          </circle>
        ))}

        {/* Atmosphere overlay */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          fill="url(#globe-atmosphere)"
          pointerEvents="none"
        />
      </svg>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 992px) {
          .rotating-globe {
            width: ${size * 0.7}px !important;
            height: ${size * 0.7}px !important;
          }
          .rotating-globe svg {
            width: ${size * 0.7}px !important;
            height: ${size * 0.7}px !important;
          }
        }
        @media (max-width: 768px) {
          .rotating-globe {
            width: ${size * 0.55}px !important;
            height: ${size * 0.55}px !important;
          }
          .rotating-globe svg {
            width: ${size * 0.55}px !important;
            height: ${size * 0.55}px !important;
          }
        }
        @media (max-width: 480px) {
          .rotating-globe {
            width: ${size * 0.45}px !important;
            height: ${size * 0.45}px !important;
          }
          .rotating-globe svg {
            width: ${size * 0.45}px !important;
            height: ${size * 0.45}px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RotatingGlobe;
