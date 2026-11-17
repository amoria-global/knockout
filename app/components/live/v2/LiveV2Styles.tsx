'use client';

/**
 * The new livestream layout. Every rule is scoped under `.ls-v2`, a class the page only gets while the switch is on
 * (lib/live/viewerV2.ts), so with the switch off none of this applies. Colours are the mobile app's dark palette (src/theme/palettes.ts in the app repo): blue #3E6FD8 and #5B8CFF, magenta #EE0E8F,
 * live red #FF0033, so the web and the app read as one product.
 */
export const LIVE_V2_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
.ls-v2 {
  --v2-primary: #3E6FD8;
  --v2-primary-light: #5B8CFF;
  --v2-accent: #EE0E8F;
  --v2-accent-light: #FF5DB8;
  --v2-live: #FF0033;
  --v2-bg: #0A1220;
  --v2-surface: #101B2E;
  --v2-surface-2: #16243C;
  --v2-border: #2A3B58;
  --v2-text: #EAF0FA;
  --v2-text-soft: #C9D5EA;
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

/* The player's own LIVE label and access chip are replaced by the top bar; the corner logo moves down, clear of it. */
.ls-v2 #main-video-player .vjs-live-label,
.ls-v2 #main-video-player .lv-chip { display: none !important; }
.ls-v2 .ls-v2-wm { top: auto !important; bottom: 58px !important; }

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
  box-shadow: 0 6px 18px rgba(238, 14, 143, 0.28);
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

/* Layout. .lv-left is flattened (display: contents) so the player, the tabs, both panels and the wishes rail can be
   placed directly: one column on phones, two from 1024px. Only the active tab shows; the chat stays mounted. The rail
   (send a wish, invite, privacy note) belongs to the Wishes tab, so it shows only while that tab is active, and its
   short preview list is dropped because the tab already lists every approved wish. */
.ls-v2 .lv-grid { display: flex !important; flex-direction: column; }
.ls-v2 .lv-left { display: contents !important; }
.ls-v2 .lv-main { order: 1; min-width: 0; }
.ls-v2 .lv-tabs-wrap { order: 2; }
.ls-v2 #lv-panel-live { order: 3; }
.ls-v2 .lv-side {
  order: 4; display: flex !important; flex-direction: column; gap: 12px; padding: 0 16px 12px;
  position: static !important; max-height: none !important; overflow: visible !important;
}
.ls-v2 #lv-panel-wishes { order: 5; }
.ls-v2 .lv-side > .lv-feed--preview { display: none !important; }
.ls-v2 .lv-panel[hidden], .ls-v2 .lv-panel--off { display: none !important; }
.ls-v2 .lv-grid:has(#lv-panel-wishes[hidden]) .lv-side { display: none !important; }

@media (min-width: 1024px) {
  .ls-v2 .lv-grid {
    display: grid !important; grid-template-columns: minmax(0, 1fr) 380px; grid-template-rows: auto auto auto 1fr;
    align-items: start; max-width: 1600px; margin: 0 auto;
  }
  .ls-v2 .lv-main { grid-column: 1; grid-row: 1 / span 4; }
  .ls-v2 .lv-tabs-wrap {
    grid-column: 2; grid-row: 1; position: sticky; top: 0; z-index: 3; background: var(--v2-bg); padding: 12px 16px 10px;
    border-left: 1px solid var(--v2-border);
  }
  .ls-v2 #lv-panel-live { grid-column: 2; grid-row: 2 / span 3; }
  .ls-v2 .lv-side { grid-column: 2; grid-row: 2; padding-top: 4px; }
  .ls-v2 #lv-panel-wishes { grid-column: 2; grid-row: 3; }
  .ls-v2 .lv-panel, .ls-v2 .lv-side { border-left: 1px solid var(--v2-border); }
  
  .ls-v2 .ls-v2-bar { padding: 14px 16px; }
}

/* Reactions row above the chat input. */
.ls-v2-reacts { display: flex; justify-content: space-between; gap: 6px; padding: 0 2px 10px; }
.ls-v2-react {
  width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--v2-border); background: var(--v2-surface-2);
  font-size: 20px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
}
.ls-v2-react:active { transform: scale(0.94); }
.ls-v2-react:focus-visible { outline: 2px solid var(--v2-accent-light); outline-offset: 2px; }

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
.ls-v2-ico { width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; background: rgba(62, 111, 216, 0.2); color: #5B8CFF; flex: 0 0 auto; }

.ls-v2-qr { text-align: center; }
.ls-v2-qr-cover {
  position: relative; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; gap: 6px;
  min-height: 104px; margin: 0 0 12px; padding: 12px; border-radius: 16px; text-align: left; overflow: hidden;
  background: var(--v2-surface-2) center / cover no-repeat; box-shadow: inset 0 -60px 60px -20px rgba(10, 18, 32, 0.85);
}
.ls-v2-qr-cover strong { font-family: "Space Grotesk", Inter, sans-serif; font-size: 17px; color: var(--v2-text); }
.ls-v2-qr-img { width: 220px; max-width: 70vw; aspect-ratio: 1; background: #fff; border-radius: 16px; padding: 10px; margin: 6px auto 10px; display: block; }
.ls-v2-qr-link { display: flex; gap: 8px; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: var(--v2-surface-2); border: 1px solid var(--v2-border); font-size: 12px; word-break: break-all; text-align: left; }
.ls-v2-qr-actions { display: flex; gap: 8px; margin-top: 12px; }
.ls-v2-qr-actions .ls-v2-chip { flex: 1; justify-content: center; }
.ls-v2-note { margin: 8px 4px 0; font-size: 12px; color: var(--v2-text-soft); }

/* Type: Space Grotesk for titles, Inter for everything else (icons keep their own font). */
.ls-v2 *:not(i):not(svg):not(svg *) { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; }
.ls-v2 :is(h1, h2, h3, h4, .ls-v2-title, .lv-tab, .ls-v2-sheet h3, .ls-v2-qr-cover strong) { font-family: "Space Grotesk", Inter, sans-serif !important; letter-spacing: -0.005em; }

/* The switch: one segmented control, "Live chat" and "Wishes & memories", the active half filled blue. */
.ls-v2 .lv-tabs {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 14px;
  background: var(--v2-surface); border: 1px solid var(--v2-border);
}
.ls-v2 .lv-tab {
  text-transform: none !important; letter-spacing: 0 !important;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 38px; padding: 8px 10px;
  border: 0; border-radius: 11px; background: transparent; color: var(--v2-text-soft); font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.ls-v2 .lv-tab[aria-selected="true"] { color: #fff; background: linear-gradient(135deg, var(--v2-primary-light), var(--v2-primary)); box-shadow: 0 4px 14px rgba(62, 111, 216, 0.35); }
.ls-v2 .lv-tab:focus-visible { outline: 2px solid var(--v2-accent-light); outline-offset: 2px; }
.ls-v2 .lv-tab-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--v2-live); box-shadow: 0 0 0 3px rgba(255, 0, 51, 0.25); }
.ls-v2 .lv-tab-count { font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: rgba(255, 255, 255, 0.16); }
.ls-v2 .lv-tab:not([aria-selected="true"]) .lv-tab-count { background: var(--v2-surface-2); color: var(--v2-text-soft); }

/* Host row line: name, live minutes, watching. */
.ls-v2 .ls-v2-livetime { color: #FF8FA3; font-weight: 600; }

/* The chat is a fixed-height column on every width: the list scrolls inside it and the reactions and input stay at its
   bottom. On a phone it takes what is left under the player, host row and switch, so the whole screen fits the viewport
   (like the reference) and the input is in reach without scrolling. */
.ls-v2 #lv-panel-live .chat-section { display: flex !important; flex-direction: column; height: max(280px, calc(100dvh - 380px)) !important; max-height: none !important; }
.ls-v2 #lv-panel-live .chat-section > .custom-scrollbar { flex: 1 1 auto; min-height: 0; overflow-y: auto !important; }
.ls-v2 #lv-panel-live .chat-section > div:last-child { flex: 0 0 auto; }
@media (min-width: 1024px) { .ls-v2 #lv-panel-live .chat-section { height: calc(100dvh - 96px) !important; } }
.ls-v2 .ls-v2-gift, .ls-v2 .ls-v2-like { flex: 0 0 auto; }
.ls-v2 #lv-panel-live .custom-scrollbar > div button { opacity: 0.55; }
.ls-v2 .lv-card .lv-btn { white-space: nowrap; padding-left: 10px; padding-right: 10px; font-size: 13px; }

/* Chat messages: a 32px picture or coloured initial, then the name and time, then the text, with room to breathe. */
.ls-v2-initial { flex: 0 0 auto; width: 32px; height: 32px; margin-top: 1px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; }
.ls-v2 #lv-panel-live .custom-scrollbar > div { padding: 6px 4px !important; gap: 10px !important; align-items: flex-start !important; }
.ls-v2 #lv-panel-live .custom-scrollbar > div > img { width: 32px !important; height: 32px !important; }
.ls-v2 #lv-panel-live .custom-scrollbar p { font-size: 14px !important; line-height: 1.35 !important; color: var(--v2-text) !important; margin: 0 !important; }
.ls-v2 #lv-panel-live .custom-scrollbar > div span { font-size: 13px !important; }
.ls-v2 #lv-panel-live .custom-scrollbar > div span + span { font-size: 11px !important; color: var(--v2-text-soft) !important; opacity: 0.7; }

/* The chat: no header (the switch above says what it is), the list straight under it, then reactions and the input row. */
.ls-v2 #lv-panel-live .chat-section { background: transparent !important; border: 0 !important; box-shadow: none !important; }
.ls-v2 #lv-panel-live .chat-section > div:first-child { display: none !important; }
.ls-v2 #lv-panel-live .chat-section > .custom-scrollbar, .ls-v2 #lv-panel-live .custom-scrollbar { background: transparent !important; padding: 10px 14px !important; }
.ls-v2 .ls-chat-empty-orb, .ls-v2 .ls-chat-empty-bubbles { display: none !important; }
.ls-v2 .ls-chat-empty { padding: 28px 16px !important; text-align: center; }
.ls-v2 .ls-chat-empty-title { font-size: 14.5px !important; color: var(--v2-text) !important; margin: 0 0 4px !important; }
.ls-v2 .ls-chat-empty-sub { font-size: 12.5px !important; color: var(--v2-text-soft) !important; margin: 0 !important; }

.ls-v2 #lv-panel-live .chat-section > div:last-child {
  display: flex !important; flex-wrap: wrap; align-items: center; gap: 8px;
  padding: 10px 12px calc(12px + var(--v2-safe-b)) !important; background: transparent !important; border-top: 1px solid var(--v2-border) !important;
}
.ls-v2 .ls-v2-reacts { order: 0; flex: 1 0 100%; padding: 0 0 2px; }
.ls-v2 .ls-video-msg-cta {
  order: 1; flex: 0 0 44px !important; width: 44px !important; min-width: 44px; max-width: 44px; height: 44px !important; padding: 0 !important; margin: 0 !important; border-radius: 50% !important; font-size: 0 !important; line-height: 0;
  background: var(--v2-surface-2) !important; border: 1px solid var(--v2-border) !important; box-shadow: none !important;
  display: inline-flex !important; align-items: center; justify-content: center; color: var(--v2-text) !important;
}
.ls-v2 .ls-video-msg-cta i { font-size: 18px !important; margin: 0 !important; color: var(--v2-text) !important; }
.ls-v2 .ls-chat-input-row {
  order: 2; flex: 1 1 0; min-width: 0; margin: 0 !important; padding: 0 5px 0 14px !important; height: 44px; border-radius: 999px !important;
  background: var(--v2-surface-2) !important; border: 1px solid var(--v2-border) !important;
}
.ls-v2 .ls-chat-input-row:focus-within { border-color: var(--v2-primary-light) !important; }
.ls-v2 .ls-chat-input-row input[type="text"] { background: transparent !important; color: var(--v2-text) !important; font-size: 14px !important; }
.ls-v2 .ls-chat-input-row input[type="text"]::placeholder { color: var(--v2-text-soft) !important; opacity: 0.8; }
.ls-v2 .ls-chat-input-row > button.ls-chat-emoji { display: none !important; }
.ls-v2 .ls-chat-input-row > button.ls-chat-send {
  width: 36px !important; height: 36px !important; border-radius: 50% !important; flex: 0 0 auto;
  background: linear-gradient(135deg, var(--v2-primary-light), var(--v2-primary)) !important; color: #fff !important; box-shadow: none !important; border: 0 !important;
}
.ls-v2 .ls-chat-input-row > button.ls-chat-send:disabled { opacity: 0.45; }
/* A guest sees one pill in place of the field; it opens the same details form. */
.ls-v2 #lv-panel-live .chat-section > div:last-child > button:not(.ls-v2-react):not(.ls-video-msg-cta) {
  order: 2; flex: 1 1 0; min-width: 0; height: 44px; padding: 0 16px !important; margin: 0 !important; border-radius: 999px !important; text-align: left;
  background: var(--v2-surface-2) !important; border: 1px solid var(--v2-border) !important; color: var(--v2-text-soft) !important; font-size: 14px !important; font-weight: 500 !important; box-shadow: none !important;
}

@media (prefers-reduced-motion: reduce) { .ls-v2 * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
`;

export function LiveV2Styles() {
  return <style>{LIVE_V2_CSS}</style>;
}
