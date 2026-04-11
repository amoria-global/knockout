'use client';

import React, { useEffect, useState } from 'react';
import { getMyWallet } from '@/lib/APIs/wallet/route';
import type { WalletDTO } from '@/lib/api/types';
import WalletMovementsModal from './WalletMovementsModal';

export interface WalletCardProps {
  /** Optional pre-fetched wallet to avoid an extra round-trip. */
  wallet?: WalletDTO | null;
  /** Hide the movements button (e.g. when the card is embedded on the full /wallet page). */
  hideMovementsButton?: boolean;
  className?: string;
}

function formatUsd(value: number | undefined | null): string {
  const v = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function StatusPill({ status }: { status: WalletDTO['status'] }) {
  const color =
    status === 'ACTIVE'
      ? { bg: '#DCFCE7', fg: '#166534' }
      : status === 'SUSPENDED'
      ? { bg: '#FEE2E2', fg: '#991B1B' }
      : { bg: '#F3F4F6', fg: '#374151' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: color.bg,
        color: color.fg,
      }}
    >
      {status}
    </span>
  );
}

const WalletCard: React.FC<WalletCardProps> = ({
  wallet: walletProp,
  hideMovementsButton = false,
  className,
}) => {
  const [wallet, setWallet] = useState<WalletDTO | null>(walletProp ?? null);
  const [loading, setLoading] = useState(!walletProp);
  const [error, setError] = useState<string | null>(null);
  const [movementsOpen, setMovementsOpen] = useState(false);

  useEffect(() => {
    if (walletProp) {
      setWallet(walletProp);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await getMyWallet();
      if (cancelled) return;
      if (res.success && res.data) {
        setWallet(res.data);
      } else {
        setError(res.error || 'Could not load wallet.');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [walletProp]);

  if (loading) {
    return (
      <div
        className={className}
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ color: '#6B7280', fontSize: 14 }}>Loading wallet…</div>
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div
        className={className}
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid #FCA5A5',
          backgroundColor: '#FEF2F2',
        }}
      >
        <div style={{ color: '#991B1B', fontSize: 14 }}>
          {error || 'Wallet unavailable.'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={className}
        style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: '#6B7280',
                marginBottom: 4,
              }}
            >
              My Wallet
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#083A85',
                lineHeight: 1.15,
              }}
            >
              {formatUsd(wallet.balanceAvailable)}
            </div>
          </div>
          <StatusPill status={wallet.status} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <MiniStat label="Pending" value={formatUsd(wallet.pendingAmount)} />
          <MiniStat label="Held" value={formatUsd(wallet.heldForDelivery)} />
          <MiniStat
            label={wallet.customerType === 'photographer' ? 'Tips' : 'Spent'}
            value={formatUsd(
              wallet.customerType === 'photographer'
                ? wallet.balanceTips
                : wallet.clientSpent
            )}
          />
        </div>

        {wallet.suspensionReason && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Suspended: {wallet.suspensionReason.replaceAll('_', ' ')}
          </div>
        )}

        {!hideMovementsButton && (
          <button
            type="button"
            onClick={() => setMovementsOpen(true)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              color: '#111827',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            View movements
          </button>
        )}

        {wallet.lastReconciledAt && (
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: '#9CA3AF',
              textAlign: 'center',
            }}
          >
            Last reconciled: {new Date(wallet.lastReconciledAt).toLocaleString()}
          </div>
        )}
      </div>

      {!hideMovementsButton && (
        <WalletMovementsModal
          isOpen={movementsOpen}
          onClose={() => setMovementsOpen(false)}
        />
      )}
    </>
  );
};

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: '#6B7280',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
        {value}
      </div>
    </div>
  );
}

export default WalletCard;
