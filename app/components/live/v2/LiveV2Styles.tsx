'use client';

/**
 * The new livestream layout. Every rule is scoped under `.ls-v2`, a class the page only gets while the switch is on
 * (lib/live/viewerV2.ts), so with the switch off none of this applies. Brand values are the same ones the dashboard's
 * Compact Glass tokens use (navy #083A85, pink #F20C8F, live red #FF0033); surfaces stay dark like the current page.
 */
export const LIVE_V2_CSS = `
.ls-v2 {
  --v2-primary: #083A85;
  --v2-primary-light: #2F64C8;
  --v2-accent: #F20C8F;
  --v2-accent-light: #ff4fae;
  --v2-live: #FF0033;
  --v2-bg: #0b0d12;
  --v2-surface: #141821;
  --v2-surface-2: #1b2130;
  --v2-border: rgba(255, 255, 255, 0.10);
  --v2-text: #f2f4f8;
  --v2-text-soft: #b6bcc9;
  --v2-safe-b: env(safe-area-inset-bottom, 0px);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Page frame: dynamic viewport units, and no 100vh lock that clips the bottom under the browser bar. */
.main-container.ls-v2 {
  height: auto !important;
  max-height: none !important;
  min-height: 100vh;
  min-height: 100dvh !important;
  overflow: visible !important;
  background: var(--v2-bg) !important;
  color: var(--v2-text);
}
.ls-v2 .layout-wrapper { height: auto !important; max-height: none !important; }

/* Old chrome that the new layout replaces: the old header/hero strip, title, stats, and the rate/leave row. */
.ls-v2 .stream-title,
.ls-v2 .ls-stats-row,
.ls-v2 .stream-action-btn,
.ls-v2 .ls-leave-btn,
.ls-v2 .mobile-only-float,
.ls-v2 .floating-action-btn { display: none !important; }
.ls-v2 .lv-page > .lv-header,
.ls-v2 .lv-page > header { display: none !important; }

/* Player: 16:9, no layout shift when the video loads, no fixed calc(100vh) height. */
.ls-v2 .video-section { padding: 0 !important; background: transparent !important; overflow: visible !important; }
.ls-v2 #main-video-player {
  height: auto !important;
  min-height: 0 !important;
  aspect-ratio: 16 / 9;
  width: 100%;
  border-radius: 0 !important;
  background: #000;
}
.ls-v2 #main-video-player video { width: 100%; height: 100%; object-fit: contain; }
.ls-v2 .vjs-progress-row,
.ls-v2 .vjs-btn--play,
.ls-v2 .vjs-live-badge,
.ls-v2 .settings-button,
.ls-v2 .vjs-buttons-row .vjs-btn[title="Emoji reactions"] { display: none !important; }
.ls-v2 .vjs-buttons-row { justify-content: flex-end; gap: 8px; }
.ls-v2 .vjs-controls { border-bottom: 2px solid var(--v2-live); background: linear-gradient(transparent, rgba(0, 0, 0, 0.55)); }

/* Top bar over the player. */
.ls-v2-bar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 6;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 12px; pointer-events: none;
}
.ls-v2-bar > * { pointer-events: auto; }
.ls-v2-bar-l, .ls-v2-bar-r { display: flex; align-items: center; gap: 8px; }
.ls-v2-btn {
  width: 36px; height: 36px; border-radius: 12px; border: 1px solid var(--v2-border);
  background: rgba(10, 12, 18, 0.55); color: #fff; display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 16px; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
}
.ls-v2-btn:focus-visible, .ls-v2-chip:focus-visible, .ls-v2-row:focus-visible, .ls-v2-gift:focus-visible, .ls-v2-like:focus-visible {
  outline: 2px solid var(--v2-accent-light); outline-offset: 2px;
}
.ls-v2-pill {
  display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700; letter-spacing: .06em; color: #fff; background: rgba(10, 12, 18, 0.55);
  border: 1px solid var(--v2-border); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
}
.ls-v2-pill--live { background: var(--v2-live); border-color: transparent; }
.ls-v2-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; }
.ls-v2-tvslot .lv-tv { position: relative; }
.ls-v2-tvslot .lv-icon-btn {
  width: 36px; height: 36px; padding: 0; border-radius: 12px; border: 1px solid var(--v2-border);
  background: rgba(10, 12, 18, 0.55); color: #fff; justify-content: center;
}
.ls-v2-tvslot .lv-label { display: none; }

/* Host row under the player. */
.ls-v2-host { display: flex; align-items: center; gap: 12px; padding: 14px 16px 10px; }
.ls-v2-avatar {
  width: 48px; height: 48px; border-radius: 50%; flex: 0 0 auto; object-fit: cover; background: var(--v2-surface-2);
  display: inline-flex; align-items: center; justify-content: center; color: var(--v2-text-soft);
}
.ls-v2-avatar--live { box-shadow: 0 0 0 2px var(--v2-bg), 0 0 0 4px var(--v2-live); }
.ls-v2-host-meta { min-width: 0; flex: 1 1 auto; }
.ls-v2-title { margin: 0; font-family: "Space Grotesk", Inter, sans-serif; font-size: 17px; font-weight: 700; color: var(--v2-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ls-v2-sub { margin: 2px 0 0; font-size: 13px; color: var(--v2-text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ls-v2-gift {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 0; border-radius: 999px; cursor: pointer;
  color: #fff; font-weight: 700; font-size: 14px; background: linear-gradient(135deg, var(--v2-accent-light), var(--v2-accent));
  box-shadow: 0 6px 18px rgba(242, 12, 143, 0.28);
}
.ls-v2-like {
  width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--v2-border); background: var(--v2-surface);
  color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 17px;
}

/* Tabs and chat: the chat is inline under the tabs, with the input pinned above the safe area. */
.ls-v2 .lv-tabs-wrap { padding: 0 16px 10px; }
.ls-v2 .chat-section {
  position: static !important; transform: none !important; width: 100% !important; height: auto !important;
  max-height: none !important; border-left: 0 !important; background: transparent !important;
}
.ls-v2 .lv-panel { padding-bottom: calc(12px + var(--v2-safe-b)); }

/* Desktop: player and actions left, tabs and chat in a fixed right column. */
@media (min-width: 1024px) {
  .ls-v2 .lv-grid {
    display: grid !important; grid-template-columns: minmax(0, 1fr) 380px; column-gap: 0; align-items: start;
    max-width: 1440px; margin: 0 auto;
  }
  .ls-v2 .lv-left { grid-column: 1; grid-row: 1 / span 6; min-width: 0; }
  .ls-v2 .lv-tabs-wrap, .ls-v2 .lv-panel { grid-column: 2; }
  .ls-v2 .lv-tabs-wrap { position: sticky; top: 0; z-index: 3; background: var(--v2-bg); padding-top: 12px; }
  .ls-v2 .lv-panel { max-height: calc(100dvh - 64px); overflow-y: auto; }
  .ls-v2 .ls-v2-bar { padding: 14px 16px; }
}
@media (max-width: 1023.98px) {
  .ls-v2 .lv-grid { display: block !important; }
}

/* Chips under the player on desktop. */
.ls-v2-chips { display: none; flex-wrap: wrap; gap: 8px; padding: 0 16px 14px; }
@media (min-width: 1024px) { .ls-v2-chips { display: flex; } }
.ls-v2-chip {
  display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 12px; cursor: pointer;
  border: 1px solid var(--v2-border); background: var(--v2-surface); color: var(--v2-text); font-size: 13px; font-weight: 600;
}

/* The more sheet and the QR card: the only blurred surfaces. */
.ls-v2-scrim { position: fixed; inset: 0; z-index: 2000; background: rgba(0, 0, 0, 0.5); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
.ls-v2-sheet {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 2001; max-width: 560px; margin: 0 auto;
  background: var(--v2-surface); border: 1px solid var(--v2-border); border-radius: 20px 20px 0 0;
  padding: 10px 14px calc(16px + var(--v2-safe-b)); max-height: 86dvh; overflow-y: auto; color: var(--v2-text);
}
.ls-v2-grab { width: 40px; height: 4px; border-radius: 4px; background: var(--v2-border); margin: 4px auto 12px; }
.ls-v2-sheet h3 { margin: 0 4px 10px; font-family: "Space Grotesk", Inter, sans-serif; font-size: 17px; }
.ls-v2-row {
  width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 8px; border-radius: 14px; cursor: pointer;
  border: 1px solid var(--v2-border); background: var(--v2-surface-2); color: var(--v2-text); text-align: left; font-size: 14px; font-weight: 600;
}
.ls-v2-row small { display: block; margin-top: 2px; color: var(--v2-text-soft); font-weight: 400; font-size: 12px; }
.ls-v2-ico { width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; background: rgba(47, 100, 200, 0.2); color: #9db8f2; flex: 0 0 auto; }

.ls-v2-qr { text-align: center; }
.ls-v2-qr-img { width: 220px; max-width: 70vw; aspect-ratio: 1; background: #fff; border-radius: 16px; padding: 10px; margin: 6px auto 10px; display: block; }
.ls-v2-qr-link { display: flex; gap: 8px; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: var(--v2-surface-2); border: 1px solid var(--v2-border); font-size: 12px; word-break: break-all; text-align: left; }
.ls-v2-qr-actions { display: flex; gap: 8px; margin-top: 12px; }
.ls-v2-qr-actions .ls-v2-chip { flex: 1; justify-content: center; }
.ls-v2-note { margin: 8px 4px 0; font-size: 12px; color: var(--v2-text-soft); }

@media (prefers-reduced-motion: reduce) { .ls-v2 * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
`;

export function LiveV2Styles() {
  return <style>{LIVE_V2_CSS}</style>;
}
