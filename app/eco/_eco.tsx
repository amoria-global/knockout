'use client';

import { useState } from 'react';

/* Self-contained, namespaced CSS for the /eco pages. Does NOT depend on
 * Tailwind utility generation (only the brand gradient classes resolved
 * site-wide reliably). Everything below is plain CSS scoped under `.eco`. */
const CSS = `
.eco{font-family:'Pragati Narrow',system-ui,sans-serif;color:#0f172a;background:linear-gradient(#f8fafc,#fff);min-height:100vh;padding:130px 20px 90px}
.eco *{box-sizing:border-box}
.eco-wrap{max-width:1040px;margin:0 auto}
.eco-narrow{max-width:480px;margin:0 auto}
.eco-hero{border-radius:24px;padding:34px 32px;color:#fff;background:linear-gradient(120deg,#083A85,#F20C8F)}
.eco-hero .k{font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.75}
.eco-hero h1{font-size:34px;font-weight:800;margin:6px 0 8px}
.eco-hero p{max-width:620px;opacity:.92;font-size:15px;line-height:1.5}
.eco-h1{font-size:30px;font-weight:800;color:#083A85;margin:0}
.eco-sub{color:#64748b;font-size:15px;margin:4px 0 0}
.eco-link{color:#F20C8F;font-weight:700;text-decoration:none}
.eco-grid{display:grid;gap:14px;margin-top:22px}
.eco-stats{grid-template-columns:repeat(3,1fr)}
.eco-card{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:18px}
.eco-stat .i{color:#F20C8F;font-size:18px}
.eco-stat .v{font-size:22px;font-weight:800;color:#083A85;margin-top:8px}
.eco-stat .l{font-size:12px;color:#64748b}
.eco-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.eco-input{flex:1;min-width:200px;border:1px solid #d1d5db;border-radius:12px;padding:11px 14px;font-size:14px;font-family:inherit;outline:none}
.eco-input:focus{border-color:#083A85}
.eco-btn{border:0;border-radius:12px;padding:11px 18px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;background:#083A85;color:#fff;transition:opacity .15s}
.eco-btn:hover{opacity:.9}.eco-btn:disabled{opacity:.5;cursor:default}
.eco-btn.grad{background:linear-gradient(120deg,#083A85,#F20C8F)}
.eco-btn.sm{padding:7px 12px;font-size:12px;border-radius:9px}
.eco-btn.ghost{background:#fff;color:#083A85;border:1px solid #083A85}
.eco-btn.ghost.pink{color:#F20C8F;border-color:#F20C8F}
.eco-btn.ghost:hover{background:#083A85;color:#fff}
.eco-btn.ghost.pink:hover{background:#F20C8F;color:#fff}
.eco-badge{display:inline-block;border-radius:999px;padding:2px 9px;font-size:10px;font-weight:700}
.eco-badge.ok{background:#dcfce7;color:#15803d}.eco-badge.mut{background:#f1f5f9;color:#475569}
.eco-empty{border:1px dashed #cbd5e1;border-radius:16px;background:#fff;padding:42px;text-align:center;color:#64748b}
.eco-empty .i{font-size:30px;color:#083A85}
.eco-note{border:1px solid #fcd34d;background:#fffbeb;border-radius:16px;padding:16px}
.eco-secret{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#fff;border-radius:10px;padding:8px 12px}
.eco-secret .k{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8}
.eco-secret .v{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#1e293b;overflow-wrap:anywhere}
.eco-docgrid{display:grid;grid-template-columns:210px 1fr;gap:36px;margin-top:34px}
.eco-toc{position:sticky;top:120px;align-self:start;display:flex;flex-direction:column;gap:2px;font-size:14px}
.eco-toc a{display:flex;gap:8px;align-items:center;padding:8px 12px;border-radius:9px;color:#475569;text-decoration:none}
.eco-toc a:hover{background:rgba(8,58,133,.06);color:#083A85}
.eco-h2{display:flex;align-items:center;gap:9px;font-size:21px;font-weight:800;color:#083A85;margin:34px 0 10px;scroll-margin-top:120px}
.eco-h2 .i{color:#F20C8F}
.eco-p{color:#475569;font-size:15px;line-height:1.55}
.eco-code{border:1px solid #1e293b;border-radius:14px;overflow:hidden;margin-top:10px;background:#0b1020}
.eco-code-top{display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid #1e293b}
.eco-m{font-size:11px;font-weight:800;padding:3px 9px;border-radius:6px;letter-spacing:.04em}
.eco-m.GET{background:#064e3b;color:#6ee7b7}.eco-m.POST{background:#1e3a8a;color:#93c5fd}.eco-m.NA{background:#334155;color:#cbd5e1}
.eco-ep{color:#e2e8f0;font-family:ui-monospace,Menlo,monospace;font-size:13px;font-weight:700;overflow-wrap:anywhere}
.eco-copy{margin-left:auto;border:1px solid #334155;background:#0b1020;color:#94a3b8;border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer}
.eco-copy:hover{color:#fff;border-color:#64748b}
.eco-code pre{margin:0;padding:12px 14px;overflow-x:auto;font-size:12.5px;line-height:1.6;color:#cbd5e1;font-family:ui-monospace,Menlo,monospace;white-space:pre}
.eco-param{color:#7dd3fc}.eco-arrow{color:#86efac}
.eco-scopes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.eco-scope{display:flex;justify-content:space-between;border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:8px 12px;font-size:13px}
.eco-scope code{color:#083A85;font-weight:700}.eco-scope span{color:#64748b}
@media(max-width:760px){
 .eco{padding:104px 14px 70px}
 .eco-hero h1{font-size:26px}.eco-h1{font-size:24px}
 .eco-stats{grid-template-columns:1fr}
 .eco-docgrid{grid-template-columns:1fr;gap:18px}
 .eco-toc{position:static;flex-direction:row;flex-wrap:wrap;top:auto}
 .eco-scopes{grid-template-columns:1fr}
}`;

export function EcoStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}

export function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [d, setD] = useState(false);
  return (
    <button className="eco-copy" type="button"
      onClick={() => { try { navigator.clipboard.writeText(text); } catch {} setD(true); setTimeout(() => setD(false), 1400); }}>
      <i className={`bi ${d ? 'bi-check2' : 'bi-clipboard'}`} /> {d ? 'Copied' : label}
    </button>
  );
}

/* A request example with a clearly differentiated METHOD · ENDPOINT, then
 * the params/body block, and a working Copy button (copies the raw call). */
export function CodeBlock(
  { method, endpoint, lines = [] }:
  { method: 'GET' | 'POST' | 'NA'; endpoint: string; lines?: string[] }
) {
  const raw = `${method === 'NA' ? '' : method + ' '}${endpoint}${lines.length ? '\n' + lines.join('\n') : ''}`;
  return (
    <div className="eco-code">
      <div className="eco-code-top">
        <span className={`eco-m ${method}`}>{method === 'NA' ? 'KEY' : method}</span>
        <span className="eco-ep">{endpoint}</span>
        <CopyBtn text={raw} />
      </div>
      {lines.length > 0 && (
        <pre>{lines.map((l, i) => {
          const cls = l.trim().startsWith('→') ? 'eco-arrow'
            : (l.trim().startsWith('&') || l.trim().startsWith('?') || l.includes('=')) ? 'eco-param' : '';
          return <div key={i} className={cls}>{l}</div>;
        })}</pre>
      )}
    </div>
  );
}
