'use client';
import { useState } from 'react';

export function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [d, setD] = useState(false);
  return (
    <button className="eco-copy" type="button"
      onClick={() => { try { navigator.clipboard.writeText(text); } catch {} setD(true); setTimeout(() => setD(false), 1400); }}>
      <i className={`bi ${d ? 'bi-check2' : 'bi-clipboard'}`} /> {d ? 'Copied' : label}
    </button>
  );
}
