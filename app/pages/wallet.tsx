'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { getMyWallet } from '@/lib/APIs/wallet/route';
import type { WalletDTO } from '@/lib/api/types';
import WalletCard from '../components/wallet/WalletCard';
import WalletMovementsModal from '../components/wallet/WalletMovementsModal';

function formatUsd(v: number | null | undefined): string {
  const n = typeof v === 'number' && !Number.isNaN(v) ? v : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function SubBalanceRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #F3F4F6',
      }}
    >
      <span style={{ color: '#374151', fontSize: 14 }}>{label}</span>
      <span
        style={{
          color: highlight ? '#083A85' : '#111827',
          fontWeight: highlight ? 700 : 600,
          fontSize: 14,
        }}
      >
        {formatUsd(value)}
      </span>
    </div>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movementsOpen, setMovementsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/user/auth/login?redirect=/user/wallet');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6B7280',
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
        padding: '32px 16px 64px',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              color: '#6B7280',
              marginBottom: 4,
            }}
          >
            Account
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#111827',
              margin: 0,
            }}
          >
            My Wallet
          </h1>
          <p
            style={{
              color: '#6B7280',
              fontSize: 14,
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            Your balance is tracked in USD and reconciled every hour against the
            underlying ledger.
          </p>
        </div>

        <WalletCard wallet={wallet} hideMovementsButton />

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 10,
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {wallet && (
          <div
            style={{
              marginTop: 24,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E5E7EB',
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
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                Breakdown
              </div>
              <button
                type="button"
                onClick={() => setMovementsOpen(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                  color: '#111827',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                View all movements
              </button>
            </div>

            <SubBalanceRow label="Available balance" value={wallet.balanceAvailable} highlight />
            <SubBalanceRow label="Tips" value={wallet.balanceTips} />
            <SubBalanceRow label="Bonuses" value={wallet.balanceBonuses} />
            <SubBalanceRow label="Gifts" value={wallet.balanceGifts} />
            <SubBalanceRow label="Stream fees" value={wallet.balanceStreamFees} />
            <SubBalanceRow label="Donations" value={wallet.balanceDonations} />
            <SubBalanceRow label="Held for delivery" value={wallet.heldForDelivery} />
            <SubBalanceRow label="Pending" value={wallet.pendingAmount} />
            <SubBalanceRow label="Blocked" value={wallet.blockedAmount} />
            <SubBalanceRow label="Total withdrawn" value={wallet.totalWithdrawn} />
            <SubBalanceRow label="Total refunded" value={wallet.totalRefunded} />
            {wallet.customerType !== 'photographer' && (
              <SubBalanceRow label="Client spent" value={wallet.clientSpent} />
            )}
          </div>
        )}
      </div>

      <WalletMovementsModal
        isOpen={movementsOpen}
        onClose={() => setMovementsOpen(false)}
      />
    </div>
  );
}
