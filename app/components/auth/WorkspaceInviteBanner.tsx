"use client";

import React from 'react';
import type { InviteTone } from '@/lib/utils/workspace-invite';

const TONES: Record<InviteTone, { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: '#eef2f9', border: '#c3d1ea', text: '#083A85', icon: 'bi-person-workspace' },
  warn: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: 'bi-info-circle' },
  error: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', icon: 'bi-exclamation-circle' },
};

/**
 * Says why the visitor is on this screen when they came from a workspace invitation link: who invited them and which
 * email to use. It is a status for the good cases and an alert when the invited address cannot take the invitation.
 */
export function WorkspaceInviteBanner({ tone, text }: { tone: InviteTone; text: string }) {
  const t = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      data-testid="workspace-invite-banner"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left',
        background: t.bg, border: `1px solid ${t.border}`, color: t.text,
        borderRadius: '10px', padding: '10px 12px', margin: '0 0 12px 0', fontSize: '13px', lineHeight: 1.45, fontWeight: 600,
      }}
    >
      <i className={`bi ${t.icon}`} aria-hidden style={{ fontSize: '16px', lineHeight: 1.2 }} />
      <span>{text}</span>
    </div>
  );
}

export default WorkspaceInviteBanner;
