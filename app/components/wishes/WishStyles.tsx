/**
 * Styles for the event page cards and the shared wish page (Compact Glass on the viewer's dark stage). Rendered once by
 * each page that uses the cards. Tokens are scoped to `.wm`, so the cards look the same in the event page and the wish page.
 */
export const WISH_CSS = `
.wm { --wm-card:rgba(255,255,255,0.045); --wm-well:rgba(0,0,0,0.28); --wm-line:rgba(255,255,255,0.12); --wm-text:#f4f5f7; --wm-mute:#9aa3b2;
  --wm-blue:#2f6df0; --wm-blue-soft:#7fa8ff; --wm-pink:#F20C8F; --wm-cyan:#37d0e6; color:var(--wm-text); }
.wm *, .wm *::before, .wm *::after { box-sizing:border-box; }
.wm-card { background:var(--wm-card); border:1px solid var(--wm-line); border-radius:18px; padding:14px; display:flex; flex-direction:column; gap:12px; }
.wm-head { display:flex; align-items:center; gap:10px; }
.wm-ico { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; color:#fff; flex:none; }
.wm-ico--pink { background:var(--wm-pink); }
.wm-ico--blue { background:var(--wm-blue); }
.wm-title { margin:0; font-size:16px; font-weight:800; }
.wm-sub { margin:2px 0 0; font-size:12.5px; color:var(--wm-mute); }
.wm-seg { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:999px; background:var(--wm-well); border:1px solid var(--wm-line); }
.wm-seg button { min-height:44px; border:0; border-radius:999px; background:transparent; color:var(--wm-mute); font:inherit; font-weight:700; font-size:14px; cursor:pointer; }
.wm-seg button[aria-selected="true"] { background:var(--wm-blue); color:#fff; }
.wm-form { display:flex; flex-direction:column; gap:10px; }
.wm-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.wm-col { display:flex; flex-direction:column; gap:10px; }
@media (max-width:420px) { .wm-row:not(.wm-row--actions) { grid-template-columns:1fr; } }
.wm-input { width:100%; min-height:44px; border-radius:12px; border:1px solid var(--wm-line); background:var(--wm-well); color:var(--wm-text); padding:10px 12px; font:inherit; font-size:14px; }
.wm-input::placeholder { color:var(--wm-mute); }
.wm-textarea { min-height:84px; resize:vertical; }
.wm-btn { min-height:44px; border-radius:999px; padding:0 16px; font:inherit; font-weight:700; font-size:14px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; border:1px solid var(--wm-line); background:transparent; color:var(--wm-text); text-decoration:none; }
.wm-btn:disabled { opacity:.5; cursor:not-allowed; }
.wm-btn--outline { border-color:var(--wm-blue-soft); color:var(--wm-blue-soft); background:rgba(47,109,240,0.12); }
.wm-btn--fill { background:linear-gradient(180deg,#4c86ff,#2f6df0); border-color:transparent; color:#fff; box-shadow:0 8px 24px rgba(47,109,240,0.35); }
.wm-btn--video { border-color:var(--wm-pink); color:#ff6fbd; background:rgba(242,12,143,0.10); }
.wm-row--actions .wm-btn { width:100%; }
.wm :focus-visible { outline:2px solid #fff; outline-offset:2px; box-shadow:0 0 0 4px rgba(77,141,255,0.6); }
.wm-note { margin:0; font-size:12px; color:var(--wm-mute); }
.wm-msg { margin:0; font-size:13px; font-weight:600; }
.wm-msg--err { color:#ff8a8a; }
.wm-msg--ok { color:#6ee7a8; }
.wm-invite { display:grid; grid-template-columns:112px 1fr; gap:14px; align-items:center; }
@media (max-width:340px) { .wm-invite { grid-template-columns:1fr; justify-items:start; } }
.wm-qr { width:112px; height:112px; border-radius:12px; background:#fff; padding:4px; }
.wm-qr img { width:100%; height:100%; display:block; }
.wm-invite-actions { display:flex; flex-direction:column; gap:8px; }
.wm-invite-actions .wm-btn { width:100%; }
.wm-pair { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.wm-heart { display:flex; gap:10px; padding:2px 4px; color:var(--wm-mute); font-size:14px; line-height:1.5; }
.wm-heart i { color:var(--wm-pink); margin-top:2px; }
.wm-when { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.wm-when-text { flex:1; min-width:160px; }
.wm-when-date { font-size:16px; font-weight:800; }
.wm-when-time { font-size:14px; color:var(--wm-mute); margin-top:2px; }
.wm-when-rows { display:flex; flex-direction:column; gap:8px; font-size:14px; }
.wm-when-rows i { color:var(--wm-blue-soft); margin-right:8px; }
.wm-host { display:flex; align-items:center; gap:12px; min-height:44px; color:inherit; text-decoration:none; }
.wm-host + .wm-host { border-top:1px solid var(--wm-line); padding-top:12px; }
.wm-host-av { width:48px; height:48px; border-radius:50%; background:var(--wm-blue); display:grid; place-items:center; color:#fff; overflow:hidden; flex:none; }
.wm-host-av img { width:100%; height:100%; object-fit:cover; display:block; }
.wm-host-label { font-size:11px; font-weight:700; color:var(--wm-mute); }
.wm-host-name { font-size:16px; font-weight:800; }
.wm-chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
.wm-chip { font-size:11px; font-weight:800; letter-spacing:.04em; padding:3px 9px; border-radius:999px; border:1px solid currentColor; }
.wm-chip--org { color:var(--wm-blue-soft); background:rgba(47,109,240,0.14); }
.wm-chip--pho { color:var(--wm-cyan); background:rgba(55,208,230,0.12); }
.wm-host-chev { margin-left:auto; color:var(--wm-mute); }
/* The shared wish page */
.wp { min-height:100vh; background:#0a0f1d; color:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
.wp-hero { position:relative; min-height:300px; display:flex; align-items:flex-end; background-size:cover; background-position:center; background-color:#10204a; }
.wp-hero::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(8,16,32,0) 30%,rgba(8,16,32,0.94)); }
.wp-hero-in { position:relative; z-index:1; width:100%; max-width:560px; margin:0 auto; padding:24px 16px; display:flex; flex-direction:column; gap:10px; }
.wp-chip { align-self:flex-start; background:#2f6df0; color:#fff; font-size:11px; font-weight:800; letter-spacing:.04em; padding:4px 10px; border-radius:6px; }
.wp-title { margin:0; font-size:28px; line-height:1.15; font-weight:800; }
.wp-body { max-width:560px; margin:0 auto; padding:16px; display:flex; flex-direction:column; gap:14px; }
.wp-invited { display:flex; align-items:center; gap:10px; border:1px solid var(--wm-line,rgba(255,255,255,0.12)); background:rgba(255,255,255,0.045); border-radius:14px; padding:12px; font-weight:700; font-size:14px; }
.wp-invited i { color:#F20C8F; }
.wp-lead { margin:0; color:#9aa3b2; font-size:14px; line-height:1.5; }
.wp-closed { text-align:center; padding:28px 8px; display:flex; flex-direction:column; align-items:center; gap:10px; }
.wp-closed h2 { margin:0; font-size:18px; }
.wp-links { display:flex; justify-content:space-between; align-items:center; }
.wp-links a, .wp-links button { min-height:44px; display:inline-flex; align-items:center; background:none; border:0; font:inherit; font-size:14px; cursor:pointer; text-decoration:none; }
.wp-links a { color:#7fa8ff; font-weight:700; }
.wp-links button { color:#9aa3b2; }
.wp :focus-visible { outline:2px solid #fff; outline-offset:2px; box-shadow:0 0 0 4px rgba(77,141,255,0.6); }
/* The Wish invites form field */
.wf-card { margin:0; min-width:0; border:1px solid var(--wf-line,rgba(255,255,255,0.12)); border-radius:16px; padding:14px; background:var(--wf-card,rgba(255,255,255,0.045)); color:var(--wf-text,#f4f5f7); }
.wf-inner { display:flex; flex-direction:column; gap:10px; }
.wf-card.has-error { border-color:#ff6b81; }
.wf-legend { padding:0 4px; font-size:16px; font-weight:800; }
.wf-req { color:#F20C8F; }
.wf-question { margin:0; font-size:14px; line-height:1.45; color:var(--wf-soft,#c9ced8); }
.wf-well { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:12px; background:rgba(0,0,0,0.28); border:1px solid var(--wf-line,rgba(255,255,255,0.12)); }
.has-error .wf-well { border-color:#ff6b81; }
.wf-opt { position:relative; min-height:44px; border-radius:9px; display:flex; align-items:center; justify-content:center; gap:6px; font-weight:700; font-size:14px; cursor:pointer; color:var(--wf-soft,#c9ced8); }
.wf-opt input { position:absolute; inset:0; opacity:0; margin:0; cursor:pointer; }
.wf-opt.is-on { background:linear-gradient(180deg,#46d6ea,#1fb6cf); color:#04202a; }
.wf-opt.is-off { background:#2f6df0; color:#fff; }
.wf-opt:focus-within { outline:2px solid #fff; outline-offset:2px; box-shadow:0 0 0 4px rgba(77,141,255,0.6); }
.wf-helper { margin:0; font-size:12.5px; line-height:1.45; color:var(--wf-mute,#9aa3b2); }
.wf-err { margin:0; font-size:13px; font-weight:700; color:#ff8a9b; }
.wf-light { --wf-line:rgba(15,23,42,0.18); --wf-card:#fff; --wf-text:#0f172a; --wf-soft:#334155; --wf-mute:#566176; }
.wf-light .wf-well { background:#eef1f7; }
.wf-light .wf-err { color:#c81e3a; }
`;

export function WishStyles() {
  return <style dangerouslySetInnerHTML={{ __html: WISH_CSS }} />;
}
