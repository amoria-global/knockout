'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getMyWalletMovements } from '@/lib/APIs/wallet/route';
import type { WalletMovementDTO, SpringPage } from '@/lib/api/types';

export interface WalletMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageSize?: number;
}

function formatUsd(value: number | null | undefined): string {
  const v = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const WalletMovementsModal: React.FC<WalletMovementsModalProps> = ({
  isOpen,
  onClose,
  pageSize = 20,
}) => {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<SpringPage<WalletMovementDTO> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      const res = await getMyWalletMovements(p, pageSize);
      if (res.success && res.data) {
        setData(res.data);
        setPage(p);
      } else {
        setError(res.error || 'Could not load movements.');
      }
      setLoading(false);
    },
    [pageSize]
  );

  useEffect(() => {
    if (isOpen) {
      void load(0);
    }
  }, [isOpen, load]);

  if (!isOpen) return null;

  const totalPages = data?.totalPages ?? 0;
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '85vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(17, 24, 39, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
            Wallet movements
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#F3F4F6',
              cursor: 'pointer',
              fontSize: 18,
              color: '#6B7280',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
          {loading && (
            <div style={{ padding: 24, color: '#6B7280', fontSize: 14 }}>
              Loading…
            </div>
          )}
          {error && !loading && (
            <div style={{ padding: 24, color: '#991B1B', fontSize: 14 }}>
              {error}
            </div>
          )}
          {!loading && !error && data && data.content.length === 0 && (
            <div
              style={{
                padding: 24,
                color: '#6B7280',
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              No movements yet.
            </div>
          )}
          {!loading && !error && data && data.content.length > 0 && (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead
                style={{
                  backgroundColor: '#F9FAFB',
                  color: '#6B7280',
                  textAlign: 'left',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                <tr>
                  <th style={{ padding: '10px 16px' }}>Date</th>
                  <th style={{ padding: '10px 16px' }}>Category</th>
                  <th style={{ padding: '10px 16px' }}>Source</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((m) => {
                  const isCredit = m.direction === 'CREDIT';
                  return (
                    <tr
                      key={m.id}
                      style={{ borderTop: '1px solid #F3F4F6' }}
                    >
                      <td
                        style={{
                          padding: '10px 16px',
                          color: '#374151',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(m.createdAt)}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#111827' }}>
                        {m.category}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          color: '#6B7280',
                          maxWidth: 220,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={m.description || m.sourceType}
                      >
                        {m.description || m.sourceType}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: isCredit ? '#166534' : '#991B1B',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isCredit ? '+' : '−'} {formatUsd(m.amountUsd)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {data && totalPages > 1 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              Page {page + 1} of {totalPages} · {data.totalElements} total
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={!canPrev || loading}
                onClick={() => canPrev && void load(page - 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  backgroundColor: canPrev ? '#FFFFFF' : '#F3F4F6',
                  color: canPrev ? '#111827' : '#9CA3AF',
                  cursor: canPrev ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!canNext || loading}
                onClick={() => canNext && void load(page + 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  backgroundColor: canNext ? '#FFFFFF' : '#F3F4F6',
                  color: canNext ? '#111827' : '#9CA3AF',
                  cursor: canNext ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletMovementsModal;
