'use client';

import type { LiveTab } from '@/lib/live/types';

/** Section 4: Live and Wishes & Memories. Same props on mobile. */
export function EventTabs({ value, onChange, wishCount, v2 }: { value: LiveTab; onChange: (tab: LiveTab) => void; wishCount?: number; v2?: boolean }) {
  // The new layout's switch reads "Live chat" (with a live dot) and "Wishes & memories" with the count beside it, like the app.
  const tabs: { key: LiveTab; label: React.ReactNode }[] = v2
    ? [
        { key: 'live', label: <>Live chat<span className="lv-tab-dot" aria-hidden="true" /></> },
        { key: 'wishes', label: <>Wishes &amp; memories{wishCount ? <span className="lv-tab-count">{wishCount}</span> : null}</> },
      ]
    : [
        { key: 'live', label: 'Live' },
        { key: 'wishes', label: wishCount ? `Wishes & Memories · ${wishCount}` : 'Wishes & Memories' },
      ];
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') onChange(value === 'live' ? 'wishes' : 'live');
  };
  return (
    <div className="lv-tabs" role="tablist" aria-label="Event sections" onKeyDown={onKey}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          id={`lv-tab-${t.key}`}
          aria-selected={t.key === value}
          aria-controls={`lv-panel-${t.key}`}
          tabIndex={t.key === value ? 0 : -1}
          className="lv-tab"
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
