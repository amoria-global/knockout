'use client';

import type { LiveTab } from '@/lib/live/types';

/** Section 4: Live and Wishes & Memories. Same props on mobile. */
export function EventTabs({ value, onChange, wishCount }: { value: LiveTab; onChange: (tab: LiveTab) => void; wishCount?: number }) {
  const tabs: { key: LiveTab; label: string }[] = [
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
