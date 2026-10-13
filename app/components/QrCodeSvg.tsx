'use client';

import React, { useId, useMemo } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  includeLogo?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Pure SVG QR code renderer with high-precision vector paths,
 * Level 'H' error-correction resilience for logo overlays,
 * responsive scaling, and vibrant Connekyt center emblem.
 */
export default function QrCodeSvg({
  value,
  size = 140,
  fgColor = '#083A85',
  bgColor = '#ffffff',
  includeLogo = true,
  className,
  style,
}: QrCodeSvgProps): React.JSX.Element {
  const reactId = useId();
  const gradId = `qr-brand-grad-${reactId.replace(/:/g, '')}`;

  const { pathData, matrixSize } = useMemo(() => {
    try {
      // Level 'H' provides 30% error recovery, ensuring phone cameras decode effortlessly
      const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
      const n = qr.modules.size;
      const margin = 1;
      let d = '';

      // Center cutout boundary if logo is included (keep modules clear in center)
      const centerStart = Math.floor(n / 2) - 2;
      const centerEnd = Math.floor(n / 2) + 2;

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (qr.modules.get(r, c)) {
            if (includeLogo && r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd) {
              continue;
            }
            const x = c + margin;
            const y = r + margin;
            d += `M${x},${y}h1v1h-1z `;
          }
        }
      }

      return { pathData: d, matrixSize: n + margin * 2 };
    } catch (e) {
      console.error('Failed to generate QR code SVG:', e);
      return { pathData: '', matrixSize: 33 };
    }
  }, [value, includeLogo]);

  const centerCoord = matrixSize / 2;
  const logoBoxSize = 5.6;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        borderRadius: 14,
        padding: 6,
        boxShadow: '0 4px 16px rgba(8, 58, 133, 0.12)',
        border: '1px solid rgba(8, 58, 133, 0.12)',
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${matrixSize} ${matrixSize}`}
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        style={{ display: 'block' }}
      >
        <rect width={matrixSize} height={matrixSize} fill={bgColor} rx={2} />
        <path d={pathData} fill={fgColor} />
        {includeLogo && (
          <g>
            <rect
              x={centerCoord - logoBoxSize / 2}
              y={centerCoord - logoBoxSize / 2}
              width={logoBoxSize}
              height={logoBoxSize}
              rx={1.4}
              fill={bgColor}
              stroke={fgColor}
              strokeWidth={0.28}
            />
            {/* Styled "C" brand emblem in the center with Connekyt brand gradient */}
            <circle
              cx={centerCoord}
              cy={centerCoord}
              r={1.9}
              fill={`url(#${gradId})`}
            />
            <text
              x={centerCoord}
              y={centerCoord + 0.8}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="2.5"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
            >
              C
            </text>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#083A85" />
                <stop offset="60%" stopColor="#0F4FB6" />
                <stop offset="100%" stopColor="#F20C8F" />
              </linearGradient>
            </defs>
          </g>
        )}
      </svg>
    </div>
  );
}
