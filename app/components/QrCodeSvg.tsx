'use client';

import React, { useMemo } from 'react';
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
 * responsive scaling, and optional center logo badge.
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
  const { pathData, matrixSize } = useMemo(() => {
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
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
      return { pathData: '', matrixSize: 31 };
    }
  }, [value, includeLogo]);

  const centerCoord = matrixSize / 2;
  const logoBoxSize = 5.2;

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
        borderRadius: 12,
        padding: 6,
        boxShadow: '0 2px 10px rgba(8, 58, 133, 0.08)',
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
        <rect width={matrixSize} height={matrixSize} fill={bgColor} rx={1.5} />
        <path d={pathData} fill={fgColor} />
        {includeLogo && (
          <g>
            <rect
              x={centerCoord - logoBoxSize / 2}
              y={centerCoord - logoBoxSize / 2}
              width={logoBoxSize}
              height={logoBoxSize}
              rx={1.2}
              fill={bgColor}
              stroke={fgColor}
              strokeWidth={0.25}
            />
            {/* Styled "C" brand emblem in the center */}
            <circle
              cx={centerCoord}
              cy={centerCoord}
              r={1.8}
              fill="url(#qr-brand-grad)"
            />
            <text
              x={centerCoord}
              y={centerCoord + 0.75}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="2.4"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              C
            </text>
            <defs>
              <linearGradient id="qr-brand-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#083A85" />
                <stop offset="100%" stopColor="#F20C8F" />
              </linearGradient>
            </defs>
          </g>
        )}
      </svg>
    </div>
  );
}
