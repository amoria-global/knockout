'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

// Interface for the connection lines with explicit control point
interface ConnectionLine {
  id: number;
  from: [number, number];
  to: [number, number];
  controlOffset: [number, number]; // Explicit offset from midpoint [x, y] in SVG coords
  delay: number;
}

// Interface for the glowing nodes on the map
interface GlowNode {
  id: number;
  coords: [number, number];
  delay: number;
  size: number;
  type: 'solid' | 'ring';
  label?: string;
}

const GlobalNetwork: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [geographies, setGeographies] = useState<Feature<Geometry>[]>([]);

  const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  useEffect(() => {
    setMounted(true);
    fetch(geoUrl)
      .then(response => response.json())
      .then(data => {
        const countries = feature(data, data.objects.countries) as unknown as FeatureCollection;
        setGeographies(countries.features);
      });
  }, []);

  const projection = useMemo(() => {
    return geoEqualEarth()
      .scale(180)
      .translate([500, 400])
      .rotate([0, 0, 0]);
  }, []);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  // Nodes - Kept mostly same, but organized for the new "cleaner" layout
  const nodes: GlowNode[] = [
    // North America
    { id: 1, coords: [-122.4194, 37.7749], delay: 0, size: 6, type: 'solid', label: 'SF' },           // 0
    { id: 2, coords: [-74.006, 40.7128], delay: 0.2, size: 5, type: 'solid', label: 'NY' },           // 1
    // Europe
    { id: 3, coords: [-0.1276, 51.5074], delay: 0.4, size: 6, type: 'solid', label: 'London' },       // 2
    { id: 4, coords: [10.0, 48.0], delay: 0.6, size: 4, type: 'ring', label: 'Frankfurt' },           // 3
    { id: 5, coords: [37.6173, 55.7558], delay: 0.8, size: 5, type: 'solid', label: 'Moscow' },       // 4
    // Middle East & Africa
    { id: 6, coords: [55.2708, 25.2048], delay: 1.0, size: 5, type: 'ring', label: 'Dubai' },         // 5
    { id: 7, coords: [36.8, -1.3], delay: 1.2, size: 4, type: 'ring', label: 'Nairobi' },             // 6
    // Asia
    { id: 8, coords: [72.8777, 19.0760], delay: 1.4, size: 5, type: 'solid', label: 'Mumbai' },       // 7
    { id: 9, coords: [121.4737, 31.2304], delay: 1.6, size: 5, type: 'solid', label: 'Shanghai' },    // 8
    { id: 10, coords: [139.6917, 35.6895], delay: 1.8, size: 6, type: 'solid', label: 'Tokyo' },      // 9
    { id: 11, coords: [126.978, 37.5665], delay: 2.0, size: 4, type: 'ring', label: 'Seoul' },        // 10
    // Southeast Asia & Oceania
    { id: 12, coords: [103.8198, 1.3521], delay: 2.2, size: 5, type: 'solid', label: 'Singapore' },   // 11
    { id: 13, coords: [151.2093, -33.8688], delay: 2.4, size: 5, type: 'ring', label: 'Sydney' },     // 12
    { id: 14, coords: [174.7633, -41.2865], delay: 2.6, size: 5, type: 'solid', label: 'Wellington' },// 13
    // South America
    { id: 15, coords: [-77.0428, -12.0464], delay: 2.8, size: 4, type: 'ring', label: 'Lima' },       // 14
    { id: 16, coords: [-70.6693, -33.4489], delay: 3.0, size: 4, type: 'ring', label: 'Santiago' },   // 15
    // Central America
    { id: 17, coords: [-99.1332, 19.4326], delay: 3.1, size: 4, type: 'ring', label: 'Mexico City' }, // 16
  ];

  const projectCoords = (coords: [number, number]): [number, number] | null => {
    if (!projection) return null;
    const projected = projection(coords);
    return projected || null;
  };

  // Pre-calculate projected positions for connections
  const projectedNodes = useMemo(() => {
    return nodes.map(node => projectCoords(node.coords));
  }, [projection]);

  /**
   * REVISED CONNECTION TOPOLOGY - "High Arches & Perfect Curves"
   * Strategy:
   * - Huge negative Y offsets create the "Parabolic" look
   * - Varied X offsets prevent lines from looking parallel
   * - Matching reference image layout
   */
  const connections: ConnectionLine[] = [
    // --- NORTHERN HEMISPHERE ARCHES (well separated) ---

    // 1. SF to London: High Atlantic arch (TOP LEFT)
    { id: 1, from: nodes[0].coords, to: nodes[2].coords, controlOffset: [-100, -180], delay: 0 },

    // 2. Tokyo to Moscow: High arch (TOP RIGHT - matches SF to London)
    { id: 2, from: nodes[9].coords, to: nodes[4].coords, controlOffset: [0, -180], delay: 0.5 },

    // 3. NY to Moscow: High Atlantic-Eurasian arch (matches top curves)
    { id: 3, from: nodes[1].coords, to: nodes[4].coords, controlOffset: [80, -180], delay: 1.0 },

    // 5. NY to Mexico City: Short North America connection
    { id: 5, from: nodes[1].coords, to: nodes[16].coords, controlOffset: [-30, -70], delay: 1.8 },


    // --- EURASIAN CONNECTIONS (London to Tokyo split) ---

    // 6. London to Dubai: Europe to Middle East
    { id: 6, from: nodes[2].coords, to: nodes[5].coords, controlOffset: [40, -120], delay: 2.0 },

    // 7. Dubai to Tokyo: Middle East to Japan (cuts through middle of top arches)
    { id: 7, from: nodes[5].coords, to: nodes[9].coords, controlOffset: [0, -180], delay: 2.5 },


    // --- PACIFIC CONNECTIONS (SF to Singapore split) ---

    // 9. Shanghai to Singapore: East Asia to Southeast Asia
    { id: 9, from: nodes[8].coords, to: nodes[11].coords, controlOffset: [50, -90], delay: 3.5 },


    // --- CENTRAL EQUATORIAL CONNECTIONS (extending to center) ---

    // 10. London to Mumbai: Europe to India (mid-level)
    { id: 10, from: nodes[2].coords, to: nodes[7].coords, controlOffset: [60, -200], delay: 4.0 },

    // 11. Mumbai to Singapore: India to Southeast Asia
    { id: 11, from: nodes[7].coords, to: nodes[11].coords, controlOffset: [70, -100], delay: 4.5 },

    // 12. Nairobi to Mumbai: Africa to India (central connection)
    { id: 12, from: nodes[6].coords, to: nodes[7].coords, controlOffset: [-50, -70], delay: 5.0 },

    // 13. Nairobi to Singapore: Africa to Southeast Asia
    { id: 13, from: nodes[6].coords, to: nodes[11].coords, controlOffset: [70, -120], delay: 5.5 },


    // --- ASIA-OCEANIA CONNECTIONS ---

    // 14. Tokyo to Sydney: Eastern Pacific curve
    { id: 14, from: nodes[9].coords, to: nodes[12].coords, controlOffset: [130, -100], delay: 6.0 },

    // 15. Singapore to Sydney: Southeast Asia to Oceania
    { id: 15, from: nodes[11].coords, to: nodes[12].coords, controlOffset: [70, -80], delay: 6.5 },


    // --- AMERICAS CONNECTIONS ---

    // 16. Canada to Lima: Americas western spine
    { id: 16, from: nodes[0].coords, to: nodes[14].coords, controlOffset: [-180, 20], delay: 7.0 },

    // 17. NY to Nairobi: East Americas to Africa (central bridge)
    { id: 17, from: nodes[1].coords, to: nodes[6].coords, controlOffset: [20, -140], delay: 7.5 },


    // --- CROSS-HEMISPHERE CONNECTIONS (Santiago to Sydney split) ---

    // 18. Santiago to Nairobi: South America to Africa
    { id: 18, from: nodes[15].coords, to: nodes[6].coords, controlOffset: [-120, -250], delay: 8.0 },

    // 19. Nairobi to Sydney: Africa to Oceania
    { id: 19, from: nodes[6].coords, to: nodes[12].coords, controlOffset: [80, -140], delay: 8.5 },

    // 20. Lima to Dubai: South America to Middle East (central link)
    { id: 20, from: nodes[14].coords, to: nodes[5].coords, controlOffset: [-90, -260], delay: 9.0 },

    // 21. Mumbai to Tokyo: South Asia to Japan
    { id: 21, from: nodes[7].coords, to: nodes[9].coords, controlOffset: [40, -100], delay: 9.5 },
    { id: 22, from: nodes[16].coords, to: nodes[15].coords, controlOffset: [-120, 100], delay: 9.5 },
  ];

  
  // Generate bezier path with explicit control point
  const generatePath = (
    start: [number, number] | null,
    end: [number, number] | null,
    controlOffset: [number, number]
  ): string => {
    if (!start || !end) return '';

    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;

    const cpX = midX + controlOffset[0];
    const cpY = midY + controlOffset[1];

    return `M ${start[0]} ${start[1]} Q ${cpX} ${cpY} ${end[0]} ${end[1]}`;
  };

  return (
    <div className="global-network-svg-container" style={{ position: 'relative', width: '110%', height: '100%', overflow: 'hidden', margin: '0 auto' }}>
      <svg
        className="global-network-svg"
        viewBox="0 0 1000 800"
        style={{ width: '100%', height: '100%', display: 'block', margin: '0 auto' }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blurOut" />
            <feMerge>
              <feMergeNode in="blurOut" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="nodeGradient">
            <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
            <stop offset="60%" style={{ stopColor: '#00E8FF', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#0088FF', stopOpacity: 0.2 }} />
          </radialGradient>
        </defs>

        {/* World Map */}
        {mounted && (
          <g opacity="0.7">
            {geographies.map((geo, i) => (
              <path
                key={`geo-${i}`}
                d={pathGenerator(geo) || ''}
                fill="#3A6B7C"
                stroke="#4A8FA8"
                strokeWidth={1}
                style={{ outline: 'none' }}
              />
            ))}
          </g>
        )}

        {/* Connection lines */}
        {mounted && connections.map((conn) => {
          const start = projectCoords(conn.from);
          const end = projectCoords(conn.to);
          if (!start || !end) return null;

          const pathData = generatePath(start, end, conn.controlOffset);

          return (
            <g key={`conn-${conn.id}`}>
              {/* Main line with glow */}
              <path
                d={pathData}
                stroke="#00D4FF"
                strokeWidth="0.9"
                opacity="1.0"
                fill="none"
                strokeLinecap="round"
                filter="url(#lineGlow)"
              />
              {/* Animated particle */}
              <path
                d={pathData}
                stroke="#FFFFFF"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: '12 400',
                  strokeDashoffset: '0',
                  animation: `flowLine 10s linear ${conn.delay}s infinite`,
                }}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {mounted && nodes.map((node) => {
          const pos = projectCoords(node.coords);
          if (!pos) return null;

          if (node.type === 'solid') {
            return (
              <g key={`node-${node.id}`}>
                {/* Glow */}
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={node.size * 2}
                  fill="#00E8FF"
                  opacity="0.3"
                  filter="url(#glow)"
                />
                {/* Main body */}
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={node.size}
                  fill="url(#nodeGradient)"
                />
                {/* Center dot */}
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={node.size * 0.35}
                  fill="#FFFFFF"
                />
              </g>
            );
          } else {
            return (
              <g key={`node-${node.id}`}>
                {/* Glow */}
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={node.size * 1.5}
                  fill="#00E8FF"
                  opacity="0.2"
                  filter="url(#glow)"
                />
                {/* Ring */}
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={node.size}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  opacity="0.9"
                />
              </g>
            );
          }
        })}
      </svg>

      <style jsx>{`
        @keyframes flowLine {
          from { stroke-dashoffset: 412; }
          to { stroke-dashoffset: -412; }
        }

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