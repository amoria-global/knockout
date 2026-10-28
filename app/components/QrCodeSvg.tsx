'use client';

import React, { useMemo } from 'react';
import { buildBrandedQr } from '@/lib/qr/brandedQr';
import { BRAND_MARK_DATA_URI } from '@/lib/qr/brandMark';

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
 * Pure SVG QR code: navy modules on white with the Connekyt logo icon in the middle. The geometry and the safety rules
 * (error correction H, a badge covering under 6% of the modules) live in lib/qr/brandedQr so every code on the platform
 * is drawn the same way.
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
  const q = useMemo(() => {
    try {
      return buildBrandedQr(value, 1);
    } catch (e) {
      console.error('Failed to generate QR code SVG:', e);
      return null;
    }
  }, [value]);

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
      {q ? (
        <svg viewBox={`0 0 ${q.size} ${q.size}`} width="100%" height="100%" shapeRendering="crispEdges" style={{ display: 'block' }} role="img" aria-label="QR code">
          <rect width={q.size} height={q.size} fill={bgColor} rx={2} />
          <path d={q.path} fill={fgColor} />
          {includeLogo ? (
            <>
              <rect x={q.badge.x} y={q.badge.y} width={q.badge.side} height={q.badge.side} rx={q.badge.side * 0.22} fill={bgColor} />
              <image href={BRAND_MARK_DATA_URI} x={q.mark.x} y={q.mark.y} width={q.mark.side} height={q.mark.side} preserveAspectRatio="xMidYMid meet" shapeRendering="auto" />
            </>
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}
