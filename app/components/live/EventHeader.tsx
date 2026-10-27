'use client';

import { Icon } from './icons';

/** Section 1: back, the event name, and share. Same props on mobile (EventHeader in features/live/sections). */
export function EventHeader({ title, onBack, onShare }: { title: string; onBack: () => void; onShare: () => void }) {
  return (
    <header className="lv-header">
      <button type="button" className="lv-icon-btn" onClick={onBack} aria-label="Back">
        <Icon name="back" size={20} />
        <span className="lv-label">Back</span>
      </button>
      {/* Keyed so it re-mounts when the title arrives: unkeyed, this heading stayed on the loading text in the browser. */}
      <h1 key={title} className="lv-title-sm">{title}</h1>
      <button type="button" className="lv-icon-btn" onClick={onShare} aria-label="Share event">
        <Icon name="share" size={18} />
        <span className="lv-label">Share</span>
      </button>
    </header>
  );
}
