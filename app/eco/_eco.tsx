// Server module (no 'use client'): static, SSR-rendered building blocks.
// Styling lives in globals.css (.eco-*). Only CopyBtn is a client island.
import { CopyBtn } from './_copy';

export { CopyBtn };

/** A request example with a clearly differentiated METHOD · ENDPOINT, then
 *  the params/body block, and a working Copy button. Fully server-rendered. */
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
          const t = l.trim();
          const cls = t.startsWith('→') ? 'eco-arrow'
            : (t.startsWith('&') || t.startsWith('?') || l.includes('=')) ? 'eco-param' : '';
          return <div key={i} className={cls}>{l}</div>;
        })}</pre>
      )}
    </div>
  );
}
