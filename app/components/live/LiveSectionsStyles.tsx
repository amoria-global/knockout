/**
 * Styles for the live-page sections (docs/LIVE_EVENT_STRUCTURE.md). Rendered once by LiveShell. The look follows the live
 * page it sits in (dark stage, brand navy and pink, Broadcast Red for live); the structure follows the wireframe.
 *
 * Breakpoints: mobile up to 767 (single column in section order), tablet 768 to 1023 (two columns where space allows),
 * web 1024 and up (player, info and tabs in the left two thirds, a sticky sidebar on the right).
 */
export const LIVE_SECTIONS_CSS = `
.lv { --lv-bg:#0e0e10; --lv-card:rgba(255,255,255,0.045); --lv-card-2:rgba(255,255,255,0.08); --lv-line:rgba(255,255,255,0.12);
  --lv-text:#f4f5f7; --lv-soft:#c9ced8; --lv-mute:#9aa3b2; --lv-navy:#083A85; --lv-blue:#4d8dff; --lv-pink:#F20C8F; --lv-live:#E61220;
  --lv-dialog:#121626; --lv-option:rgba(0,0,0,0.25); --lv-menu:#171b27;
  color:var(--lv-text); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
.lv *, .lv *::before, .lv *::after { box-sizing:border-box; }
.lv[data-theme="light"] { --lv-bg:#f4f6fb; --lv-card:#ffffff; --lv-card-2:#eef1f7; --lv-line:rgba(15,23,42,0.14); --lv-text:#0f172a; --lv-soft:#334155; --lv-mute:#566176;
  --lv-blue:#1d4fd7; --lv-dialog:#ffffff; --lv-option:#f4f6fb; --lv-menu:#ffffff; }
.lv button { font:inherit; color:var(--lv-text); cursor:pointer; }
/* Filled controls keep white text in either theme. */
.lv .lv-btn--primary, .lv .lv-btn--danger, .lv .lv-btn--pink, .lv .lv-tab[aria-selected="true"] { color:#fff; }
.lv :focus-visible { outline:2px solid #ffffff; outline-offset:2px; box-shadow:0 0 0 4px rgba(77,141,255,0.6); }

/* The page: header on top, then the grid. */
.lv-page { display:flex; flex-direction:column; width:100%; min-height:100vh; background:var(--lv-bg); }
.lv-grid { display:grid; gap:16px; padding:0 16px 24px; width:100%; max-width:1480px; margin:0 auto; grid-template-columns:minmax(0,1fr); }
.lv-left { display:contents; }
.lv-main { grid-column:1 / -1; order:1; min-width:0; }
.lv-tabs-wrap { grid-column:1 / -1; order:2; }
.lv-side { order:3; display:flex; flex-direction:column; gap:12px; min-width:0; grid-column:1 / -1; }
.lv-panel { order:4; min-width:0; grid-column:1 / -1; }
.lv-panel[hidden] { display:none; }
@media (min-width:768px) and (max-width:1024px) {
  .lv-side { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); align-items:start; }
  .lv-side > .lv-privacy, .lv-side > .lv-feed { grid-column:1 / -1; }
  .lv-side .lv-pair { grid-template-columns:1fr; }
}
@media (min-width:1025px) {
  .lv-grid { grid-template-columns:minmax(0,2fr) minmax(300px,1fr); align-items:start; padding:0 24px 32px; gap:20px; }
  .lv-left { display:flex; flex-direction:column; gap:12px; grid-column:1; grid-row:1; min-width:0; }
  .lv-main, .lv-tabs-wrap, .lv-panel { grid-column:auto; order:0; }
  .lv-side { grid-column:2; grid-row:1; position:sticky; top:12px; max-height:calc(100vh - 24px); overflow:auto; order:0; }
}

/* 1 Header */
.lv-header { display:flex; align-items:center; gap:8px; padding:10px 16px; width:100%; max-width:1480px; margin:0 auto; }
@media (min-width:1025px) { .lv-header { padding:12px 24px; } }
.lv-title-sm { flex:1; min-width:0; text-align:center; font-weight:700; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
@media (min-width:1025px) { .lv-title-sm { text-align:left; font-size:18px; } }
.lv-icon-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-width:44px; min-height:44px; padding:0 12px; border-radius:999px;
  background:var(--lv-card-2); border:1px solid var(--lv-line); }
.lv-icon-btn:hover { background:var(--lv-line); }
.lv-icon-btn .lv-label { font-weight:600; font-size:14px; }
@media (max-width:767px) { .lv-icon-btn .lv-label { display:none; } .lv-icon-btn { padding:0; } }

/* 2 chips (shown over the player) */
.lv-chip { display:inline-flex; align-items:center; height:26px; padding:0 10px; border-radius:999px; font-size:12px; font-weight:700; letter-spacing:.02em;
  background:rgba(0,0,0,0.62); color:#fff; border:1px solid rgba(255,255,255,0.14); }

/* 3 Info */
.lv-info { padding:12px 0 4px; display:flex; flex-direction:column; gap:6px; }
.lv-info h2 { margin:0; font-size:clamp(20px,2.4vw,28px); line-height:1.2; font-weight:800; }
.lv-tagline { margin:0; color:var(--lv-soft); font-size:15px; line-height:1.45; }
.lv-info-row { display:flex; flex-wrap:wrap; gap:6px 16px; align-items:center; color:var(--lv-mute); font-size:14px; }
.lv-info-row strong { color:var(--lv-text); font-weight:700; }
.lv-info-row span { display:inline-flex; align-items:center; gap:6px; }

/* 4 Tabs */
.lv-tabs { display:flex; gap:8px; flex-wrap:wrap; padding:4px 0; }
.lv-tab { min-height:44px; padding:0 18px; border-radius:999px; background:var(--lv-card-2); border:1px solid var(--lv-line); font-weight:700; font-size:14px; color:var(--lv-soft); }
.lv-tab[aria-selected="true"] { background:var(--lv-navy); border-color:var(--lv-navy); color:#fff; box-shadow:0 0 0 1px rgba(77,141,255,0.45) inset; }

/* Cards */
.lv-card { background:var(--lv-card); border:1px solid var(--lv-line); border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:12px; }
.lv-card h3 { margin:0; font-size:15px; font-weight:800; }
.lv-sub { margin:0; font-size:13px; line-height:1.45; color:var(--lv-mute); }
.lv-pair { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (min-width:1025px) { .lv-side .lv-pair { grid-template-columns:1fr; } }
.lv-option { display:flex; flex-direction:column; gap:8px; padding:12px; border-radius:12px; background:var(--lv-option); border:1px solid var(--lv-line); }
.lv-option-head { display:flex; align-items:center; gap:8px; font-weight:700; font-size:14px; }
.lv-option-head svg { color:var(--lv-blue); }

/* Buttons */
.lv-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:0 16px; border-radius:999px; font-weight:700; font-size:14px;
  background:var(--lv-card-2); border:1px solid var(--lv-line); color:var(--lv-text); }
.lv-btn:hover:not(:disabled) { background:var(--lv-line); }
.lv-btn:disabled { opacity:.5; cursor:not-allowed; }
.lv-btn--primary { background:var(--lv-navy); border-color:var(--lv-navy); color:#fff; }
.lv-btn--primary:hover:not(:disabled) { background:#0a4aa8; }
.lv-btn--danger { background:var(--lv-live); border-color:var(--lv-live); color:#fff; }
.lv-btn--pink { background:#c4086f; border-color:#c4086f; color:#fff; }
.lv-btn-row { display:flex; flex-wrap:wrap; gap:8px; }

/* 6 Invite */
.lv-invite { display:grid; grid-template-columns:1fr auto; gap:12px; align-items:center; }
.lv-invite-actions { display:flex; flex-direction:column; gap:8px; }
.lv-qr { width:104px; height:104px; border-radius:10px; background:#fff; padding:4px; }
.lv-qr img { width:100%; height:100%; display:block; }
.lv-note { margin:0; font-size:13px; color:var(--lv-soft); }

/* 7 Privacy */
.lv-privacy { display:flex; gap:8px; align-items:flex-start; padding:2px 4px; color:var(--lv-mute); font-size:13px; line-height:1.45; }
.lv-privacy svg { flex:none; margin-top:2px; }

/* 8 Feed */
.lv-list { display:flex; flex-direction:column; gap:12px; margin:0; padding:0; list-style:none; }
.lv-wish { display:flex; gap:12px; align-items:center; }
.lv-feed--full .lv-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:12px; }
.lv-feed--full .lv-wish { align-items:flex-start; padding:12px; border-radius:12px; background:var(--lv-option); border:1px solid var(--lv-line); }
.lv-thumb { position:relative; flex:none; width:72px; height:72px; border-radius:10px; overflow:hidden; background:#1b2233; border:0; display:flex; align-items:center; justify-content:center; color:#fff; padding:0; }
.lv-thumb img, .lv-thumb video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.lv-thumb svg { position:relative; filter:drop-shadow(0 1px 2px rgba(0,0,0,.6)); }
.lv-dur { position:absolute; right:4px; bottom:4px; padding:0 6px; height:18px; display:inline-flex; align-items:center; border-radius:9px; font-size:11px; font-weight:700; background:rgba(0,0,0,.72); color:#fff; }
.lv-avatar { flex:none; width:44px; height:44px; border-radius:50%; background:var(--lv-navy); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:17px; }
.lv-wish-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.lv-wish-name { font-weight:700; font-size:14px; }
.lv-wish-msg { margin:0; font-size:14px; line-height:1.45; color:var(--lv-soft); overflow-wrap:anywhere; }
.lv-menu-wrap { position:relative; flex:none; }
.lv-menu { position:absolute; right:0; top:100%; z-index:30; min-width:190px; padding:6px; border-radius:12px; background:var(--lv-menu); border:1px solid var(--lv-line); box-shadow:0 12px 32px rgba(0,0,0,.45); }
.lv-menu button { display:flex; align-items:center; gap:10px; width:100%; min-height:44px; padding:0 12px; background:transparent; border:0; border-radius:8px; text-align:left; font-weight:600; }
.lv-menu button:hover { background:var(--lv-card-2); }

/* States */
.lv-state { display:flex; flex-direction:column; align-items:center; gap:8px; padding:18px 8px; text-align:center; color:var(--lv-soft); font-size:14px; }
.lv-skel { display:flex; gap:12px; align-items:center; }
.lv-skel i { display:block; border-radius:8px; background:rgba(255,255,255,0.1); animation:lv-pulse 1.4s ease-in-out infinite; }
@keyframes lv-pulse { 0%,100% { opacity:.55; } 50% { opacity:1; } }
@media (prefers-reduced-motion:reduce) { .lv-skel i { animation:none; opacity:.7; } .lv *, .lv *::before, .lv *::after { transition-duration:.01ms !important; animation-duration:.01ms !important; } }

/* 8 Moderation (host) */
.lv-mod { display:flex; flex-direction:column; gap:6px; padding-bottom:12px; border-bottom:1px solid var(--lv-line); }
.lv-mod:last-child { border-bottom:0; padding-bottom:0; }
.lv-mod-top { display:flex; justify-content:space-between; gap:8px; align-items:baseline; }
.lv-status { font-size:12px; color:var(--lv-mute); }

/* Composer dialog */
.lv-overlay { position:fixed; inset:0; z-index:2000; background:rgba(5,8,16,0.72); backdrop-filter:blur(6px); display:flex; align-items:flex-end; justify-content:center; padding:0; }
@media (min-width:640px) { .lv-overlay { align-items:center; padding:24px; } }
.lv-dialog { width:100%; max-width:520px; max-height:92vh; overflow:auto; background:var(--lv-dialog); border:1px solid var(--lv-line); border-radius:20px 20px 0 0; padding:18px; display:flex; flex-direction:column; gap:14px; }
@media (min-width:640px) { .lv-dialog { border-radius:20px; } }
.lv-dialog-head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
.lv-dialog h3 { margin:0; font-size:18px; font-weight:800; }
.lv-field { display:flex; flex-direction:column; gap:6px; }
.lv-field label, .lv-legend { font-size:13px; font-weight:700; color:var(--lv-soft); }
.lv-input, .lv-textarea { width:100%; min-height:44px; padding:10px 12px; border-radius:10px; background:var(--lv-card-2); border:1px solid var(--lv-line); color:var(--lv-text); font:inherit; font-size:15px; }
.lv-textarea { min-height:104px; resize:vertical; }
.lv-input[aria-invalid="true"], .lv-textarea[aria-invalid="true"] { border-color:#ff6b78; }
.lv-err { margin:0; color:#ff8a95; font-size:13px; }
.lv-count { align-self:flex-end; font-size:12px; color:var(--lv-mute); }
.lv-radios { display:grid; grid-template-columns:1fr 1fr; gap:10px; border:0; margin:0; padding:0; }
.lv-radio { position:relative; display:flex; flex-direction:column; gap:4px; padding:12px; min-height:88px; border-radius:12px; border:1px solid var(--lv-line); background:var(--lv-card); cursor:pointer; }
.lv-radio input { position:absolute; opacity:0; inset:0; cursor:pointer; }
.lv-radio:has(input:checked) { border-color:var(--lv-blue); background:rgba(77,141,255,0.12); }
.lv-radio:has(input:focus-visible) { outline:2px solid #fff; box-shadow:0 0 0 4px rgba(77,141,255,.6); }
.lv-radio b { display:flex; align-items:center; gap:6px; font-size:15px; }
.lv-radio small { color:var(--lv-mute); font-size:12px; line-height:1.35; }
.lv-preview { width:100%; aspect-ratio:16/9; border-radius:12px; background:#000; }
.lv-rec { display:flex; align-items:center; gap:8px; font-weight:700; color:var(--lv-text); }
.lv-rec i { width:10px; height:10px; border-radius:50%; background:var(--lv-live); display:inline-block; }
.lv-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
`;

export function LiveSectionsStyles() {
  return <style dangerouslySetInnerHTML={{ __html: LIVE_SECTIONS_CSS }} />;
}
