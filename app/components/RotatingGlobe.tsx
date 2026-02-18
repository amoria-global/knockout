"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
}

const RotatingGlobe: React.FC<RotatingGlobeProps> = ({
  size = 280,
  rotationSpeed = 0.3,
  landColor = "rgba(139, 92, 246, 0.35)",
  oceanColor = "rgba(8, 58, 133, 0.15)",
  borderColor = "rgba(139, 92, 246, 0.5)",
  graticuleColor = "rgba(255, 255, 255, 0.07)",
  glowColor = "rgba(139, 92, 246, 0.4)",
}) => {
  const [geographies, setGeographies] = useState<Feature<Geometry>[]>([]);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

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

  // Highlight dots for key cities
  const cityDots = useMemo(() => {
    const cities: [number, number][] = [
      [-74.006, 40.7128],    // New York
      [-0.1276, 51.5074],    // London
      [36.8, -1.3],          // Nairobi
      [55.2708, 25.2048],    // Dubai
      [72.8777, 19.076],     // Mumbai
      [139.6917, 35.6895],   // Tokyo
      [151.2093, -33.8688],  // Sydney
      [-43.1729, -22.9068],  // Rio
      [28.0473, -26.2041],   // Johannesburg
      [103.8198, 1.3521],    // Singapore
    ];

    return cities
      .map((coords, i) => {
        const projected = projection(coords);
        if (!projected) return null;
        return { x: projected[0], y: projected[1], id: i };
      })
      .filter(Boolean) as { x: number; y: number; id: number }[];
  }, [projection]);

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
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: "relative", zIndex: 1 }}
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

        {/* City dots */}
        {cityDots.map((dot) => (
          <g key={dot.id}>
            <circle
              cx={dot.x}
              cy={dot.y}
              r={5}
              fill="url(#dot-glow)"
              opacity={0.5}
            />
            <circle
              cx={dot.x}
              cy={dot.y}
              r={2}
              fill="#FF6B6B"
              opacity={0.9}
            />
          </g>
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
