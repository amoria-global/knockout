'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

// Interface for the connection lines
interface ConnectionLine {
  id: number;
  from: [number, number]; // Source coordinates [longitude, latitude]
  to: [number, number];   // Destination coordinates [longitude, latitude]
  delay: number;
}

// Interface for the glowing nodes on the map
interface GlowNode {
  id: number;
  coords: [number, number]; // Geographic coordinates [longitude, latitude]
  delay: number;
  size: number;
  label?: string;
}

const GlobalNetwork = () => {
  const [mounted, setMounted] = useState(false);
  // Use a more specific type for GeoJSON features
  const [geographies, setGeographies] = useState<Feature<Geometry>[]>([]);

  const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  useEffect(() => {
    setMounted(true);
    fetch(geoUrl)
      .then(response => response.json())
      .then(data => {
        // Correctly type the TopoJSON data with the fix
        const countries = feature(data, data.objects.countries) as unknown as FeatureCollection;
        setGeographies(countries.features);
      });
  }, []);

  // Memoize the D3 projection to prevent re-computation on re-renders
  const projection = useMemo(() => {
    return geoEqualEarth()
      .scale(180)
      .translate([500, 400])
      .rotate([0, 0, 0]);
  }, []);
  
  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  // Define major hubs across continents
  const nodes: GlowNode[] = [
    { id: 1, coords: [-120.006, 40.7128], delay: 0, size: 8, label: 'New York' },
    { id: 2, coords: [-118.2437, 34.0522], delay: 0.5, size: 6, label: 'Los Angeles' },
    { id: 3, coords: [-67.6333, -23.5505], delay: 1, size: 6, label: 'São Paulo' },
    { id: 4, coords: [-0.1276, 51.5074], delay: 1.5, size: 7, label: 'London' },
    { id: 5, coords: [2.3522, 48.8566], delay: 2, size: 6, label: 'Paris' },
    { id: 6, coords: [29.7500, 2.0800], delay: 2.5, size: 6, label: 'Kigali' },
    { id: 7, coords: [55.2708, 25.2048], delay: 3, size: 6, label: 'Dubai' },
    { id: 8, coords: [139.6917, 35.6895], delay: 3.5, size: 7, label: 'Tokyo' },
    { id: 9, coords: [103.8198, 1.3521], delay: 4, size: 6, label: 'Singapore' },
    { id: 10, coords: [116.4074, 39.9042], delay: 4.5, size: 8, label: 'Beijing' },
    { id: 11, coords: [151.2093, -33.8688], delay: 5, size: 6, label: 'Sydney' },
  ];

  // Define a denser, intersecting web of connections for a "globular" structure
  const connections: ConnectionLine[] = [
    { id: 1, from: nodes[0].coords, to: nodes[3].coords, delay: 0 }, // New York -> London
    { id: 2, from: nodes[1].coords, to: nodes[7].coords, delay: 0.2 }, // LA -> Tokyo
    { id: 3, from: nodes[2].coords, to: nodes[5].coords, delay: 0.4 }, // São Paulo -> Kigali
    { id: 4, from: nodes[3].coords, to: nodes[9].coords, delay: 0.6 }, // London -> Beijing
    { id: 5, from: nodes[4].coords, to: nodes[0].coords, delay: 0.8 }, // Paris -> New York
    { id: 6, from: nodes[5].coords, to: nodes[10].coords, delay: 1.0 }, // Kigali -> Sydney
    { id: 7, from: nodes[6].coords, to: nodes[1].coords, delay: 1.2 }, // Dubai -> LA
    { id: 8, from: nodes[7].coords, to: nodes[2].coords, delay: 1.4 }, // Tokyo -> São Paulo
    { id: 9, from: nodes[8].coords, to: nodes[3].coords, delay: 1.6 }, // Singapore -> London
    { id: 10, from: nodes[9].coords, to: nodes[6].coords, delay: 1.8 }, // Beijing -> Dubai
    { id: 11, from: nodes[10].coords, to: nodes[0].coords, delay: 2.0 }, // Sydney -> New York
    { id: 12, from: nodes[0].coords, to: nodes[7].coords, delay: 2.2 }, // New York -> Tokyo
    { id: 13, from: nodes[3].coords, to: nodes[10].coords, delay: 2.4 },// London -> Sydney
    { id: 14, from: nodes[1].coords, to: nodes[9].coords, delay: 2.6 }, // LA -> Beijing
    { id: 15, from: nodes[2].coords, to: nodes[8].coords, delay: 2.8 }, // São Paulo -> Singapore
  ];

  // Convert geographic coordinates to SVG coordinates
  const projectCoords = (coords: [number, number]): [number, number] | null => {
    if (!projection) return null;
    const projected = projection(coords);
    return projected || null;
  };

  // Generate a smooth quadratic bezier curve path
  const generateCircularPath = (
    start: [number, number],
    end: [number, number],
    curvature: number = 0.3
  ): string => {
    const [startX, startY] = start;
    const [endX, endY] = end;

    // Use different midpoint calculation based on direction
    // For connections going right (positive dx), use the /5 formula
    // For connections going left (negative dx), mirror the approach
    const dx = endX - startX;
    const dy = endY - startY;

    let midX, midY;
    if (dx > 0) {
      // Going right - use /5 for startX bias
      midX = (startX + endX) / 10 ;
    } else {
      // Going left - mirror the bias (4/5 from start, 1/5 from end)
      midX = startX + (endX - startX) / 3;
    }
    midY = (startY + endY) / 2;

    const offsetX = -dy * curvature;
    const offsetY = dx * curvature;
    const cp1X = midX + offsetX;
    const cp1Y = midY + offsetY;
    return `M ${startX} ${startY} Q ${cp1X} ${cp1Y} ${endX} ${endY}`;
  };

  return (
    <div className="global-network-svg-container" style={{ position: 'relative', width: '110%', height: '100%', overflow: 'hidden', margin: '0 auto' }}>
      <svg
        className="global-network-svg"
        viewBox="10 0 1000 780"
        style={{ width: '100%', height: '100%', display: 'block', margin: '0 auto' }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glow filter for nodes */}
          <filter id="glow" x="-10%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle glow for map outlines */}
          <filter id="mapGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0" result="blur1" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glow for thin connection lines */}
          <filter id="lineGlow" x="-100%" y="-100%" width="300%" height="900%">
            <feGaussianBlur stdDeviation="0" result="blurOut" />
            <feMerge>
              <feMergeNode in="blurOut" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for the core nodes */}
          <radialGradient id="nodeGradient">
            <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#00F0FF', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#0088FF', stopOpacity: 0.3 }} />
          </radialGradient>
        </defs>

        {/* World Map */}
        {mounted && (
          <g opacity="0.35" filter="url(#mapGlow)">
             {geographies.map((geo, i) => (
                <path
                  key={`geo-${i}`}
                  d={pathGenerator(geo) || ''}
                  fill="#4A90A4"
                  stroke="#5AC8E8"
                  strokeWidth={2}
                  style={{ outline: 'none' }}
                />
              ))}
          </g>
        )}

        {/* Thin, intersecting connection lines */}
        {mounted && connections.map((conn, index) => {
          const start = projectCoords(conn.from);
          const end = projectCoords(conn.to);
          if (!start || !end) return null;

          const curvatures = [0.696, 0.696, 0.396, -0.696, 0.696, 0.696, -0.696, -0.896, 0.396, 0.396, 0.696, 0.396, 0.396, 0.396, 0.396];
          const curvature = curvatures[index % curvatures.length];
          const pathData = generateCircularPath(start, end, curvature);

          return (
            <g key={`conn-${conn.id}`}>
              <path
                d={pathData}
                stroke="#00D4FF"
                strokeWidth="0.75"
                opacity="0.6"
                fill="none"
                strokeLinecap="round"
                filter="url(#lineGlow)"
              />
              <path
                d={pathData}
                stroke="#FFFFFF"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: '20 200',
                  strokeDashoffset: '0',
                  animation: `flowLine 6s linear ${conn.delay}s infinite`,
                  willChange: 'stroke-dashoffset',
                }}
              />
            </g>
          );
        })}

        {/* Nodes with glowing signal waves */}
        {mounted && nodes.map((node) => {
          const pos = projectCoords(node.coords);
          if (!pos) return null;

          return (
            <g key={`node-${node.id}`} style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}>
              {/* Signal Wave 1 */}
              <circle
                cx={pos[0]}
                cy={pos[1]}
                r={node.size}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2"
                style={{
                  animation: `signalWave 10s ease-out ${node.delay}s infinite`,
                  willChange: 'transform, opacity, stroke-width',
                }}
              />
              {/* Signal Wave 2 (delayed) */}
              <circle
                cx={pos[0]}
                cy={pos[1]}
                r={node.size}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                style={{
                  animation: `signalWave 3000s ease-out ${node.delay + 0.5}s infinite`,
                  willChange: 'transform, opacity, stroke-width',
                }}
              />

              {/* Core twinkling node */}
              <circle cx={pos[0]} cy={pos[1]} r={node.size * 1.5} fill="#00E8FF" opacity="0.4" filter="url(#glow)" style={{ animation: `glow 2s ease-in-out ${node.delay}s infinite`, willChange: 'transform, opacity' }} />
              <circle cx={pos[0]} cy={pos[1]} r={node.size} fill="url(#nodeGradient)" filter="url(#glow)" />
              <circle cx={pos[0]} cy={pos[1]} r={node.size * 0.5} fill="#FFFFFF" opacity="0.95" filter="url(#glow)" style={{ animation: `brightPulse 2s ease-in-out ${node.delay}s infinite`, willChange: 'opacity' }} />
            </g>
          );
        })}
      </svg>

      {/* Correct Next.js styled-jsx syntax */}
      <style jsx>{`
        /* Animation for the subtle particle on connection lines */
        @keyframes flowLine {
          from { stroke-dashoffset: 202; }
          to { stroke-dashoffset: -202; }
        }

        /* Brighter glowing signal wave animation from each node */
        @keyframes signalWave {
          0% {
            transform: scale(0.8);
            opacity: 1;
            stroke-width: 2.5px;
          }
          100% {
            transform: scale(5);
            opacity: 0;
            stroke-width: 0.5px;
          }
        }

        /* Breathing glow effect for core nodes */
        @keyframes glow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.15);
          }
        }

        /* Twinkling effect for the center of the nodes */
        @keyframes brightPulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }

        /* GPU acceleration hints for smoother animations */
        svg * {
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        g {
           transform-origin: center;
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .global-network-svg-container {
            width: 180% !important;
            height: 180% !important;
            margin-left: -40% !important;
            margin-top: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalNetwork;