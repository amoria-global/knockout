'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AmoriaKNavbar from '../../components/navbar';
import { useTranslations } from 'next-intl';
import {
  getLocationFromStorage,
  getDistrictsForCountry,
  type LocationData,
} from '../../utils/locationUtils';
import { getPublicEvents, type PublicEvent } from '@/lib/APIs/public';
import { getStreamVideo } from '@/lib/APIs/streams/route';

const BRAND = '#083A85';
const BRAND_DARK = '#062a63';

// =====================================================================
// Helpers - preserved from the original (formatTime12h, formatTimeRange)
// =====================================================================
function formatTime12h(t: string): string {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return 'Time TBA';
  const start = formatTime12h(startTime);
  return endTime ? `${start} - ${formatTime12h(endTime)}` : start;
}

// New: friendly relative-date for upcoming events. Falls back to absolute
// formatted date when the event is more than ~6 days away.
function describeWhen(eventDate?: string, startTime?: string): string {
  if (!eventDate) return 'Date TBA';
  const target = new Date(eventDate + (startTime ? `T${startTime}` : 'T00:00'));
  const diff = target.getTime() - Date.now();
  const SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR;
  if (Number.isNaN(diff)) return 'Date TBA';
  if (diff < 0) {
    return target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  if (diff < HOUR) {
    const m = Math.max(1, Math.round(diff / MIN));
    return `Starts in ${m} min`;
  }
  if (diff < DAY) {
    const h = Math.round(diff / HOUR);
    return `Starts in ${h}h`;
  }
  if (diff < 7 * DAY) {
    const d = Math.round(diff / DAY);
    return `In ${d} day${d === 1 ? '' : 's'}`;
  }
  return target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

type TabKey = 'all' | 'live' | 'upcoming' | 'completed';

// =====================================================================
// Custom dropdown - replaces native <select> so the popover panel matches
// the rest of the platform (rounded, brand-tinted, animated).
// =====================================================================
interface FilterOption { value: string; label: string }

function FilterSelect({
  icon,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  icon: string;
  value: string;
  options: FilterOption[];
  onChange: (val: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !listRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex(o => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    requestAnimationFrame(() => listRef.current?.focus());
  }, [open, options, value]);

  const selectedLabel = options.find(o => o.value === value)?.label ?? options[0]?.label ?? '';

  const handleTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Home') { e.preventDefault(); setActiveIndex(0); }
    else if (e.key === 'End') { e.preventDefault(); setActiveIndex(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(options[activeIndex].value);
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className="ev-select-wrap">
      <button
        ref={triggerRef}
        type="button"
        className="ev-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleTriggerKey}
      >
        <i className={`bi ${icon} ev-select-icon`} aria-hidden="true" />
        <span className="ev-select-value">{selectedLabel}</span>
        <i className={`bi bi-chevron-up ev-select-caret ${open ? 'is-open' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="ev-select-list"
          tabIndex={-1}
          onKeyDown={handleListKey}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`ev-select-option${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <i
                  className={`bi bi-check2 ev-select-check ${isSelected ? '' : 'ev-select-check--hidden'}`}
                  aria-hidden="true"
                />
                <span>{opt.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const Events: React.FC = () => {
  const t = useTranslations('events');
  const searchParams = useSearchParams();

  // ───── State (preserved 1:1) ─────
  const [searchTerm, setSearchTerm] = useState('');
  const catParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string>(catParam || 'all');
  const [selectedLocation, setSelectedLocation] = useState<string>(searchParams.get('location') || 'all');
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get('date') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const itemsPerPage = 12;

  // userLocation kept for future use (set by useEffect, not directly read)
  void userLocation;

  // Saved events (bookmarks) - local-only; persists across sessions
  const [savedEvents, setSavedEvents] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem('connekyt:savedEvents');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  const toggleSaved = (id: string) => {
    setSavedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem('connekyt:savedEvents', JSON.stringify(Array.from(next)));
      } catch { /* ignore */ }
      return next;
    });
  };

  // Active tab - All / Live Now / Upcoming / Recently Ended.
  // Defaults to "all" so first-time viewers see every event combined,
  // with the tabs acting as quick filters they can toggle into.
  // Honors a URL `?status=` param (e.g., from navbar links) on first load.
  const initialTab: TabKey = (() => {
    const s = searchParams.get('status');
    if (s?.toUpperCase() === 'ONGOING') return 'live';
    if (s?.toUpperCase() === 'PUBLISHED') return 'upcoming';
    if (s?.toUpperCase() === 'COMPLETED') return 'completed';
    return 'all';
  })();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // Load user location from storage and set available districts
  useEffect(() => {
    const location = getLocationFromStorage();
    if (location) {
      setUserLocation(location);
      const districts = getDistrictsForCountry(location.countryCode);
      setAvailableDistricts(districts);
    }
  }, []);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // API-driven events data
  const [eventsData, setEventsData] = useState<PublicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiTotalPages, setApiTotalPages] = useState(0);
  const [liveStreamIds, setLiveStreamIds] = useState<Set<string>>(new Set());
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const seenCategoriesRef = useRef<Set<string>>(new Set());

  // Sync filters when URL params change
  useEffect(() => {
    const cat = searchParams.get('category');
    const loc = searchParams.get('location');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    if (cat) {
      const matched = categoryOptions.find(c => c.toLowerCase() === cat.toLowerCase());
      const normalized = matched || cat;
      if (normalized !== selectedCategory) setSelectedCategory(normalized);
    }
    if (loc && loc !== selectedLocation) setSelectedLocation(loc);
    if (date && date !== selectedDate) setSelectedDate(date);
    if (status && status !== selectedStatus) setSelectedStatus(status);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categoryOptions]);

  // Map tab → status filter sent to API. `all` sends undefined (no status
  // filter) so every event status is returned and combined.
  const tabToStatus: Record<TabKey, string | undefined> = {
    all: undefined,
    live: 'ONGOING',
    upcoming: 'PUBLISHED',
    completed: 'COMPLETED',
  };

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // The status filter is now driven by the tab; the legacy selectedStatus
      // dropdown is gone, but URL ?status= still wins on first load.
      const effectiveStatus =
        selectedStatus !== 'all'
          ? selectedStatus
          : tabToStatus[activeTab];
      const response = await getPublicEvents({
        page: currentPage - 1,
        size: itemsPerPage,
        sortColumn: 'eventDate',
        sortDirection: activeTab === 'completed' ? 'desc' : 'asc',
        category:  selectedCategory  !== 'all' ? selectedCategory  : undefined,
        location:  selectedLocation  !== 'all' ? selectedLocation  : undefined,
        status:    effectiveStatus,
        dateRange: selectedDate      !== 'all' ? selectedDate      : undefined,
        search:    searchTerm.trim() || undefined,
      });
      if (response.success && response.data) {
        const events = response.data.content;
        // Verify which "ongoing" events have an active Cloudflare stream
        const ongoingEvents = events.filter(e => (e.eventStatus || '').toLowerCase() === 'ongoing');
        const trulyLiveIds = new Set<string>();
        if (ongoingEvents.length > 0) {
          const checks = await Promise.allSettled(
            ongoingEvents.map(e => getStreamVideo(e.id))
          );
          checks.forEach((result, i) => {
            if (result.status === 'fulfilled' && result.value.success) {
              const d = result.value.data as { data?: { connectionStatus?: string }; connectionStatus?: string };
              const connStatus = d?.data?.connectionStatus ?? d?.connectionStatus;
              if (connStatus === 'live') trulyLiveIds.add(ongoingEvents[i].id);
            }
          });
        }
        // Visibility for ended events is now driven by admin-controlled flags
        // on the backend (featured_in_recently_ended_tab / featured_in_all_events_tab).
        // The previous client-side "hide completed events older than 2 days"
        // filter contradicted that - it stripped out events the admin had
        // explicitly flagged for display. Backend's response is the source of
        // truth: if it returned the event, render it.
        setEventsData(events);
        setLiveStreamIds(trulyLiveIds);
        setApiTotalPages(response.data.totalPages);
        let changed = false;
        for (const ev of events) {
          const cat = ev.eventCategory?.name?.trim();
          if (cat && !seenCategoriesRef.current.has(cat)) {
            seenCategoriesRef.current.add(cat);
            changed = true;
          }
        }
        if (changed) {
          setCategoryOptions(Array.from(seenCategoriesRef.current).sort());
        }
      } else {
        setLoadError(response.error || 'Failed to fetch events');
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, selectedCategory, selectedLocation, selectedStatus, selectedDate, searchTerm, activeTab]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ───── Derivations ─────
  const isEventLive = (event: PublicEvent) =>
    (event.eventStatus || '').toUpperCase() === 'ONGOING' &&
    event.streamStatus !== 'ended' &&
    (event.hasLiveStream === true || liveStreamIds.has(event.id));

  const isEventEnded = (event: PublicEvent) =>
    (event.eventStatus || '').toUpperCase() === 'COMPLETED' || event.streamStatus === 'ended';

  // Featured live events - ALL of them. The banner section shows every live
  // event at once: a single full-width 5:1 cinematic banner when there's
  // one, or a side-by-side grid (2-up / 3-up / scrollable for 4+) when
  // multiple are live, so users see every live event without swiping.
  const featuredLiveEvents = useMemo(
    () => eventsData.filter(e => isEventLive(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventsData, liveStreamIds]
  );

  // Live count for the tab badge
  const liveCount = useMemo(
    () => eventsData.filter(e => isEventLive(e)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventsData, liveStreamIds]
  );

  // Active filter count (excluding the search term)
  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedLocation !== 'all' ? 1 : 0) +
    (selectedDate !== 'all' ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedDate('all');
    setCurrentPage(1);
  };

  // ───── Handlers ─────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const switchTab = (tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSelectedStatus('all'); // tab is now the source of truth
    setCurrentPage(1);
  };

  const goToPage = (n: number) => setCurrentPage(n);
  const goToNext = () => setCurrentPage(p => Math.min(p + 1, apiTotalPages));
  const goToPrev = () => setCurrentPage(p => Math.max(p - 1, 1));

  // Pagination ranges (compact on mobile)
  const getPageNumbers = (): (number | string)[] => {
    const total = apiTotalPages;
    if (total <= 5 || !isMobile) return Array.from({ length: total }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, '...', total];
    if (currentPage >= total - 2) return [1, '...', total - 2, total - 1, total];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total];
  };

  // (renderCardStatus / renderPhotographerChip helpers removed - the new
  // poster-style card inlines its time pill and uses an organizer chip
  // built from event.creator / event.eventOrganizer instead.)

  return (
    <div className="ev-root">
      <style>{`
        /* ============================================================
           EVENTS PAGE - cinematic redesign
           ============================================================ */
        .ev-root {
          min-height: 100vh;
          background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);
          font-family: 'Pragati Narrow', system-ui, sans-serif;
          color: #0f172a;
        }

        /* ===== Banner ===== */
        .ev-banner {
          position: relative;
          background: linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%);
          color: #fff;
          padding: 0.7rem 1.5rem;
          display: flex; align-items: center; justify-content: center;
          gap: 0.875rem;
          overflow: hidden;
        }
        .ev-banner::after {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 18px 18px;
          opacity: 0.4;
          pointer-events: none;
        }
        .ev-banner > * { position: relative; z-index: 1; }
        .ev-banner-text { font-size: 0.9rem; color: rgba(255,255,255,0.85); }
        .ev-banner-cta { font-size: 0.9rem; font-weight: 700; }
        .ev-banner-divider { width: 1px; height: 18px; background: rgba(255,255,255,0.25); }
        .ev-banner-close {
          background: transparent; border: none; color: rgba(255,255,255,0.65);
          cursor: pointer; padding: 6px; border-radius: 6px;
          transition: background 0.18s, color 0.18s;
        }
        .ev-banner-close:hover { color: #fff; background: rgba(255,255,255,0.12); }
        /* Mobile - single-line banner: drop the prefix tagline + divider,
           keep only the icon + CTA + close so it stays one slim row. */
        @media (max-width: 700px) {
          .ev-banner {
            padding: 0.55rem 0.85rem;
            gap: 0.5rem;
          }
          .ev-banner-text,
          .ev-banner-divider { display: none; }
          .ev-banner-cta {
            font-size: 0.78rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
            flex: 1;
          }
          .ev-banner > .bi-megaphone-fill { font-size: 0.95rem; flex-shrink: 0; }
          .ev-banner-close { padding: 4px; flex-shrink: 0; }
        }
        @media (max-width: 380px) {
          .ev-banner-cta { font-size: 0.72rem; }
        }

        /* ===== Hero ===== */
        .ev-hero {
          position: relative;
          background: linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%);
          color: #fff;
          padding: clamp(2.25rem, 5vw, 3.75rem) 1.25rem clamp(2rem, 4vw, 3rem);
          overflow: hidden;
          text-align: center;
        }
        /* Blurred background image - slight scale prevents blur edges from showing */
        .ev-hero-bg {
          position: absolute;
          inset: -20px;
          background-image: url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=80');
          background-size: cover;
          background-position: center;
          filter: blur(7px) saturate(1.2);
          transform: scale(1.08);
          opacity: 1;
          pointer-events: none;
          z-index: 0;
        }
        /* Light brand-blue tint - soft from top, slightly darker at the bottom
           so the title still reads clearly. Image dominates the visuals. */
        .ev-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(8,58,133,0.18) 0%, rgba(6,42,99,0.40) 100%);
          pointer-events: none;
          z-index: 1;
        }
        /* Dot pattern on top */
        .ev-hero::after {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.10) 1.2px, transparent 1.2px);
          background-size: 22px 22px;
          -webkit-mask-image: radial-gradient(circle at 50% 0%, #000 60%, transparent 90%);
                  mask-image: radial-gradient(circle at 50% 0%, #000 60%, transparent 90%);
          opacity: 0.55;
          pointer-events: none;
          z-index: 2;
        }
        /* Lift text above all the layered backgrounds */
        .ev-hero > .ev-hero-eyebrow,
        .ev-hero > .ev-hero-title,
        .ev-hero > .ev-hero-sub { position: relative; z-index: 3; }

        .ev-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 999px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.22);
          font-size: 0.72rem; letter-spacing: 1.2px; font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .ev-hero-eyebrow i { color: #ffd28a; }
        .ev-hero-title {
          font-size: clamp(1.85rem, 4.5vw, 2.75rem);
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 0.5rem;
        }
        .ev-hero-sub {
          font-size: clamp(0.9rem, 1.5vw, 1.05rem);
          color: rgba(255,255,255,0.82);
          max-width: 42rem;
          margin: 0 auto;
        }

        /* ═══════════════════════════════════════════════════════════
           HOT LIVE TRENDS - Instagram stories-style live event strip.
           Each live event becomes a circular avatar with a rotating
           Instagram-gradient ring + a live badge. Lifts on hover.
           ═══════════════════════════════════════════════════════════ */
        .ev-trends {
          position: relative;
          max-width: 1280px;
          /* Symmetric breathing room - clears the hero above and the tab
             segment below. No more negative-margin overlap (that was a
             leftover from when this was the cinematic banner). */
          margin: clamp(20px, 2.5vw, 32px) auto 0;
          /* Bottom padding has extra space because the story title is
             absolutely positioned below each avatar (out of the flex flow),
             so the section needs visual room for it. */
          padding: clamp(20px, 2.5vw, 28px) clamp(0.75rem, 2vw, 1.5rem) clamp(34px, 4vw, 44px);
          z-index: 3;
        }
        .ev-trends-row {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: clamp(10px, 1.5vw, 14px);
          /* Isolate so the ::before line's negative z-index can't escape
             this stacking context and slide under the section background. */
          isolation: isolate;
        }
        /* Decorative gradient line. Rendered as the row's ::before so its
           position is computed from the row's own box (top:50% = the
           row's vertical center = the avatar's vertical center, since
           the row uses align-items:center and the avatar is the tallest
           item). Identical math on desktop and mobile, no padding-sum
           gymnastics, ring never gets bisected. */
        .ev-trends-row::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 2px;
          transform: translateY(-50%);
          background: linear-gradient(90deg,
            rgba(240,148,51,0) 0%,
            rgba(220,39,67,0.55) 18%,
            rgba(204,35,102,0.55) 50%,
            rgba(188,24,136,0.55) 82%,
            rgba(188,24,136,0) 100%);
          z-index: -1;
          pointer-events: none;
        }

        /* "Hot Live Trends 🔥" pill on the far left */
        .ev-trends-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px 9px 12px;
          border-radius: 999px;
          background: linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          color: #fff;
          font-family: 'Pragati Narrow', sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
          flex: none;
          box-shadow:
            0 8px 22px -6px rgba(220,39,67,0.55),
            inset 0 1px 0 rgba(255,255,255,0.20);
          text-shadow: 0 1px 2px rgba(0,0,0,0.25);
        }
        .ev-trends-flame {
          font-size: 16px;
          line-height: 1;
          animation: ev-flame-flicker 1.6s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes ev-flame-flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50%      { transform: scale(1.15) rotate(2deg); }
        }
        .ev-trends-pill-text { letter-spacing: 0.06em; }
        /* Default: show full label, hide short. Mobile media query below
           inverts this to show "Trends" only. */
        .ev-trends-pill-text--short { display: none; }
        .ev-trends-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 7px;
          margin-left: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.22);
          border: 1px solid rgba(255,255,255,0.30);
          color: #fff;
          font-size: 11.5px;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0;
        }

        /* Scrollable row of stories - flex: 1 fills the remaining width
           after the pill, so stories spread across the row from left to
           right (and overflow scrolls horizontally when there are many). */
        /* Generous vertical padding so the hover lift + 12px pulse ring
           don't get clipped (overflow-x:auto forces overflow-y to compute
           as auto, which DOES clip). Wider gap so the rings of two
           neighbouring stories never visually touch when one is hovered. */
        .ev-trends-scroll {
          display: flex;
          gap: clamp(16px, 2vw, 22px);
          overflow-x: auto;
          overflow-y: visible;
          padding: 16px 6px 18px;
          flex: 1;
          min-width: 0;
          scroll-snap-type: x proximity;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .ev-trends-scroll::-webkit-scrollbar { display: none; }

        /* Each live event story - circular avatar with gradient ring.
           Story is a fixed-size square (avatar dimensions only). The title
           below is absolutely positioned so it doesn't add to the story's
           height - that way the flex row's "align-items: center" lines up
           the pill and the avatar centers, not the avatar+title centers. */
        .ev-story {
          position: relative;
          flex: none;
          width: clamp(72px, 8.5vw, 88px);
          height: clamp(72px, 8.5vw, 88px);
          text-decoration: none;
          scroll-snap-align: start;
          cursor: pointer;
          transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        /* Lift only - scaling expanded the avatar past its layout box and
           let the pulse ring overlap neighbours. A clean translateY reads
           as just as "alive" without breaking sibling spacing. */
        .ev-story:hover { transform: translateY(-4px); }

        /* The rotating Instagram-gradient ring - wraps the avatar */
        .ev-story-ring {
          position: absolute;
          inset: -3px;
          width: calc(100% + 6px);
          height: calc(100% + 6px);
          border-radius: 50%;
          background: conic-gradient(from 0deg,
            #f09433, #e6683c, #dc2743, #cc2366, #bc1888,
            #cc2366, #dc2743, #e6683c, #f09433);
          animation: ev-ring-spin 4s linear infinite;
          z-index: 0;
          box-shadow:
            0 4px 12px -2px rgba(220,39,67,0.40),
            0 0 0 0 rgba(220,39,67,0.55);
        }
        .ev-story-ring::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(220,39,67,0.55);
          animation: ev-ring-pulse 1.6s ease-out infinite;
        }
        @keyframes ev-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ev-ring-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,39,67,0.55); }
          70%  { box-shadow: 0 0 0 12px rgba(220,39,67,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,39,67,0); }
        }

        /* The actual avatar inside the ring - fills the whole story box */
        .ev-story-avatar {
          position: absolute;
          inset: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #ffffff;
          background: #f3f4f6;
          display: block;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.04);
        }
        .ev-story-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* "LIVE" badge in the bottom-right corner of the avatar */
        .ev-story-live {
          position: absolute;
          z-index: 3;
          bottom: -2px;
          right: -2px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 6px 2px 5px;
          border-radius: 6px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.06em;
          line-height: 1;
          border: 1.5px solid #ffffff;
          box-shadow: 0 4px 10px -2px rgba(220,38,38,0.55);
          text-shadow: 0 1px 1px rgba(0,0,0,0.30);
        }
        .ev-story-live-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #fff;
          animation: ev-story-live-blink 1.2s ease-in-out infinite;
        }
        @keyframes ev-story-live-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }

        /* Title floats below the avatar (absolute, out of flex flow) so the
           row's vertical centering aligns the pill with the AVATAR center,
           not the avatar+title combined center. */
        .ev-story-title {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          width: max(100%, 96px);
          font-size: 11.5px;
          font-weight: 600;
          color: #1f2937;
          text-align: center;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0;
          white-space: nowrap;
          pointer-events: none;
        }

        /* "View all" link at the right end (visible when 5+ live events) */
        .ev-trends-all {
          flex: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(220,39,67,0.08);
          border: 1px solid rgba(220,39,67,0.45);
          color: #dc2743;
          font-family: 'Pragati Narrow', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: background 160ms ease, transform 160ms ease;
        }
        .ev-trends-all:hover {
          background: rgba(220,39,67,0.14);
          transform: translateX(2px);
        }

        @media (max-width: 700px) {
          /* Tighter section + smaller stories so 2-3 fit before scrolling.
             More bottom padding so titles aren't clipped by the section's
             bottom edge / next section. */
          .ev-trends {
            margin-top: clamp(16px, 2vw, 22px);
            padding: clamp(16px, 2vw, 20px) clamp(0.5rem, 2vw, 1rem) clamp(38px, 6vw, 48px);
          }
          .ev-trends-pill {
            font-size: 10.5px;
            padding: 6px 10px 6px 8px;
            gap: 6px;
          }
          .ev-trends-pill-text { letter-spacing: 0.04em; }
          /* Mobile: swap full → short label so the pill stays compact */
          .ev-trends-pill-text--full { display: none; }
          .ev-trends-pill-text--short { display: inline; }
          .ev-trends-flame { font-size: 14px; }
          .ev-trends-count {
            min-width: 19px;
            height: 19px;
            font-size: 10.5px;
            padding: 0 6px;
          }
          /* Smaller avatars to fit more stories on phone screens */
          .ev-story {
            width: clamp(60px, 18vw, 72px);
            height: clamp(60px, 18vw, 72px);
          }
          /* Tighter scroll lane on mobile but still enough vertical room
             for the hover lift + pulse ring without clipping. */
          .ev-trends-scroll {
            gap: clamp(12px, 3vw, 18px);
            padding: 12px 4px 14px;
          }
          .ev-story-live { font-size: 7.5px; padding: 1px 5px; }
          .ev-story-live-dot { width: 4px; height: 4px; }
          .ev-story-title {
            font-size: 10.5px;
            top: calc(100% + 6px);
            width: max(100%, 80px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ev-story-ring { animation: none; }
          .ev-story-ring::after { animation: none; }
          .ev-story-live-dot { animation: none; }
          .ev-trends-flame { animation: none; }
          .ev-story:hover { transform: none; }
        }

        /* ===== Single full-width live banner (LEGACY - used elsewhere) ===== */
        .ev-featured {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 5 / 1;
          min-height: 160px;
          max-height: 240px;
          border-radius: 22px;
          overflow: hidden;
          text-decoration: none;
          color: #fff;
          background: #0f172a;
          border: 2px solid rgba(220,38,38,0.85);
          animation: ev-featured-twinkle 1s ease-out infinite;
        }
        @media (max-width: 700px) {
          .ev-featured { aspect-ratio: 16 / 9; min-height: 200px; max-height: 280px; }
        }
        .ev-featured:hover {
          transform: translateY(-3px);
          animation-play-state: paused;
          border-color: rgba(248,113,113,1);
          box-shadow:
            0 36px 70px -25px rgba(8,28,60,0.55),
            0 0 0 4px rgba(220,38,38,0.35),
            0 0 50px 0 rgba(220,38,38,0.55);
        }
        @keyframes ev-featured-twinkle {
          0%, 100% {
            border-color: rgba(220,38,38,0.85);
            box-shadow:
              0 30px 60px -25px rgba(8,28,60,0.45),
              0 0 0 0 rgba(220,38,38,0.75),
              0 0 0 0 rgba(220,38,38,0.5);
          }
          25% {
            box-shadow:
              0 30px 60px -25px rgba(8,28,60,0.45),
              0 0 0 8px rgba(220,38,38,0.35),
              0 0 0 18px rgba(220,38,38,0.18);
          }
          50% {
            border-color: rgba(248,113,113,1);
            box-shadow:
              0 30px 60px -25px rgba(8,28,60,0.45),
              0 0 0 18px rgba(220,38,38,0.10),
              0 0 0 32px rgba(220,38,38,0.05);
          }
          75% {
            box-shadow:
              0 30px 60px -25px rgba(8,28,60,0.45),
              0 0 0 26px rgba(220,38,38,0),
              0 0 0 44px rgba(220,38,38,0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ev-featured {
            animation: none;
            box-shadow:
              0 30px 60px -25px rgba(8,28,60,0.45),
              0 0 0 3px rgba(220,38,38,0.55);
          }
        }
        .ev-featured-img {
          position: absolute; inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
        }
        .ev-featured:hover .ev-featured-img { transform: scale(1.04); }
        .ev-featured-tint {
          position: absolute; inset: 0;
          /* Deep-navy base differentiates the featured banner from the
             brand-blue hero above - reads as a separate "premiere stage"
             rather than a continuation of the hero. */
          background:
            linear-gradient(180deg, rgba(15,23,42,0.10) 0%, rgba(15,23,42,0.30) 40%, rgba(15,23,42,0.78) 80%, rgba(15,23,42,0.92) 100%),
            linear-gradient(90deg, rgba(15,23,42,0.40) 0%, rgba(15,23,42,0) 60%);
        }
        .ev-featured-content {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          padding: clamp(0.75rem, 2vw, 1.25rem) clamp(0.875rem, 2.5vw, 1.5rem);
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 1rem;
        }
        .ev-featured-meta {
          flex: 1; min-width: 0;
        }
        .ev-featured-title {
          font-size: clamp(1.1rem, 2.2vw, 1.6rem);
          font-weight: 800;
          line-height: 1.15;
          margin: 6px 0 4px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ev-featured-meta-row {
          display: flex; flex-wrap: wrap; gap: 10px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.92);
        }
        .ev-featured-meta-row > span {
          display: inline-flex; align-items: center; gap: 5px;
        }
        .ev-featured-cta {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          background: linear-gradient(135deg, ${BRAND}, ${BRAND_DARK});
          color: #fff; font-weight: 700; font-size: 0.85rem;
          box-shadow: 0 10px 24px -8px rgba(8,58,133,0.7);
          flex-shrink: 0;
        }
        .ev-featured:hover .ev-featured-cta { transform: translateY(-1px); }


        /* ===== Tab segment ===== */
        /* Sticky tabs - stay visible as the grid scrolls so switching is one tap */
        .ev-tabs-wrap {
          position: sticky;
          top: 8px;
          z-index: 20;
          max-width: 1280px;
          margin: 1.5rem auto 0;
          padding: 0 clamp(0.75rem, 2vw, 1.5rem);
        }
        .ev-tabs {
          display: flex;
          gap: 4px;
          padding: 5px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(8,58,133,0.08);
        }
        /* Default: full text labels visible, short hidden. Swapped on mobile. */
        .ev-tab-label-short { display: none; }
        .ev-tab {
          flex: 1;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 0.85rem 0.85rem;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #475569;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.18s, color 0.18s, transform 0.18s;
          white-space: nowrap;
        }
        /* Mobile - short labels swap in so all 4 tabs fit on a single row
           without horizontal scroll. Each tab keeps flex: 1 to share width
           equally; padding tightens, font drops a notch. */
        @media (max-width: 700px) {
          .ev-tabs {
            overflow: visible;
            gap: 4px;
            padding: 4px;
          }
          .ev-tab {
            flex: 1 1 0;
            min-width: 0;
            padding: 0.55rem 0.4rem;
            font-size: 0.75rem;
            gap: 5px;
            white-space: nowrap;
            overflow: hidden;
          }
          .ev-tab i { font-size: 0.85rem; }
          /* Swap to short labels */
          .ev-tab-label-full { display: none; }
          .ev-tab-label-short { display: inline; }
        }
        /* Tiny phones - drop the icons too so labels keep their space */
        @media (max-width: 380px) {
          .ev-tab {
            padding: 0.55rem 0.3rem;
            font-size: 0.72rem;
            gap: 3px;
          }
          .ev-tab i { display: none; }
          .ev-tab-count {
            min-width: 16px;
            height: 16px;
            font-size: 9.5px;
            padding: 0 4px;
          }
        }
        .ev-tab:hover { background: rgba(8,58,133,0.05); color: ${BRAND}; }
        .ev-tab.is-active {
          background: linear-gradient(135deg, ${BRAND}, ${BRAND_DARK});
          color: #fff;
          box-shadow: 0 8px 18px -8px rgba(8,58,133,0.55);
        }
        .ev-tab-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 22px; height: 22px;
          padding: 0 7px;
          border-radius: 999px;
          background: rgba(239,68,68,0.18);
          color: #ef4444;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .ev-tab.is-active .ev-tab-count { background: rgba(255,255,255,0.20); color: #fff; }
        .ev-tab-pulse {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 0 rgba(239,68,68,0.6);
          animation: ev-pulse 1.6s ease-out infinite;
          flex: none;
        }
        @keyframes ev-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }

        /* ===== Filter control card ===== */
        .ev-controls {
          max-width: 1280px;
          margin: 1rem auto 0;
          padding: 0 clamp(0.75rem, 2vw, 1.5rem);
        }
        .ev-controls-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: clamp(0.85rem, 2vw, 1.1rem);
          box-shadow: 0 4px 12px rgba(8,58,133,0.04);
        }
        .ev-search { position: relative; margin-bottom: 0.75rem; }
        .ev-search-icon {
          position: absolute;
          left: 16px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; pointer-events: none;
        }
        .ev-search-input {
          width: 100%;
          padding: 0.85rem 0.85rem 0.85rem 44px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 0.95rem;
          color: #0f172a;
          outline: none;
          font-family: inherit;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .ev-search-input::placeholder { color: #94a3b8; }
        .ev-search-input:focus {
          border-color: ${BRAND};
          background: #fff;
          box-shadow: 0 0 0 4px rgba(8,58,133,0.08);
        }
        .ev-search-clear {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: transparent; border: none; cursor: pointer;
          color: #94a3b8; padding: 6px; border-radius: 50%;
        }
        .ev-search-clear:hover { color: ${BRAND}; background: rgba(8,58,133,0.08); }

        .ev-filters {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.55rem;
        }
        @media (max-width: 700px) { .ev-filters { grid-template-columns: 1fr; } }

        /* ===== Custom select (FilterSelect component) - light theme ===== */
        .ev-select-wrap { position: relative; }
        .ev-select-trigger {
          display: flex; align-items: center; gap: 8px;
          width: 100%;
          padding: 0.6rem 0.85rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 500;
          color: #0f172a;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .ev-select-trigger:hover,
        .ev-select-trigger[aria-expanded="true"] {
          border-color: ${BRAND};
          box-shadow: 0 0 0 3px rgba(8,58,133,0.06);
        }
        .ev-select-icon { color: ${BRAND}; font-size: 0.95rem; flex: none; }
        .ev-select-value {
          flex: 1;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ev-select-caret {
          color: #94a3b8;
          font-size: 0.72rem;
          flex: none;
          transition: transform 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .ev-select-caret.is-open { transform: rotate(180deg); color: ${BRAND}; }

        .ev-select-list {
          /* Drop-up - anchored to the bottom of the trigger, popover grows upward */
          position: absolute;
          bottom: calc(100% + 6px);
          left: 0; right: 0;
          z-index: 50;
          margin: 0;
          padding: 0.35rem;
          list-style: none;
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(8, 58, 133, 0.10);
          box-shadow:
            0 18px 44px -14px rgba(8, 58, 133, 0.22),
            0 6px 14px rgba(0, 0, 0, 0.06);
          max-height: 280px;
          overflow-y: auto;
          outline: none;
          animation: ev-select-pop 0.16s cubic-bezier(0.22, 1, 0.36, 1);
          scrollbar-width: thin;
          scrollbar-color: rgba(8,58,133,0.25) transparent;
        }
        .ev-select-list::-webkit-scrollbar { width: 6px; }
        .ev-select-list::-webkit-scrollbar-track { background: transparent; }
        .ev-select-list::-webkit-scrollbar-thumb {
          background: rgba(8,58,133,0.25); border-radius: 3px;
        }
        @keyframes ev-select-pop {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ev-select-option {
          display: flex; align-items: center; gap: 8px;
          padding: 0.55rem 0.65rem;
          border-radius: 8px;
          font-size: 0.86rem;
          color: #475569;
          cursor: pointer;
          user-select: none;
          transition: background 0.12s, color 0.12s;
        }
        .ev-select-option.is-active {
          background: rgba(8,58,133,0.06);
          color: ${BRAND};
        }
        .ev-select-option.is-selected {
          color: ${BRAND};
          font-weight: 700;
        }
        .ev-select-option.is-selected.is-active {
          background: rgba(8,58,133,0.10);
        }
        .ev-select-check {
          color: ${BRAND};
          font-size: 0.95rem;
          flex: none;
        }
        .ev-select-check--hidden { visibility: hidden; }
        @media (max-width: 640px) {
          .ev-select-option { padding: 0.7rem 0.65rem; font-size: 0.85rem; }
          .ev-select-list   { max-height: 60vh; }
        }

        /* ===== Result strip ===== */
        .ev-result {
          max-width: 1280px;
          margin: 1.75rem auto 0;
          padding: 0 clamp(0.75rem, 2vw, 1.5rem);
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.75rem; flex-wrap: wrap;
        }
        .ev-result-count {
          font-size: 0.95rem;
          color: #475569;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .ev-result-count strong { color: ${BRAND}; font-weight: 800; }
        .ev-result-pulse {
          display: inline-flex; align-items: center; gap: 6px;
          color: #ef4444;
          font-weight: 700;
          font-size: 0.82rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-right: 4px;
        }
        .ev-result-pulse::before {
          content: '';
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 0 rgba(239,68,68,0.6);
          animation: ev-pulse-mini 1.6s ease-out infinite;
          flex: none;
        }
        @keyframes ev-pulse-mini {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        .ev-clear-btn {
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #475569;
          font-size: 0.85rem; font-weight: 600;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          transition: all 0.18s;
          font-family: inherit;
        }
        .ev-clear-btn:hover {
          border-color: ${BRAND};
          color: ${BRAND};
          background: rgba(8,58,133,0.04);
        }

        /* ===== Grid ===== */
        .ev-grid-wrap {
          max-width: 1280px;
          margin: 1rem auto 0;
          padding: 0 clamp(0.75rem, 2vw, 1.5rem) 5rem;
        }
        .ev-grid {
          display: grid;
          /* Bigger cards - was 260px min, now 320px → fewer per row, more poster real estate */
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.75rem;
        }
        @media (max-width: 700px) {
          .ev-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        }
        /* Stay 2-up down through phone widths (matches /user/photographers).
           Single-column only kicks in on very small devices below 380px. */
        @media (max-width: 480px) {
          .ev-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        }
        @media (max-width: 380px) {
          .ev-grid { grid-template-columns: 1fr; gap: 1rem; }
        }

        /* ===== Card - adapted from sinc-events-design-system / preview/card-default.html
           Structure: the cover image now fills the ENTIRE card (no separate
           dark strip), but the card's TOTAL height is unchanged from the
           old design - it's still the 4:3 image region plus the natural
           height of the details block. The image simply also spans behind
           the details, which sit on a gradient that progressively darkens
           only the lower region so they stay readable while the top of the
           poster stays bright and full-bleed. */
        .ev-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #0E1116;
          color: #F5F6F8;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px;
          overflow: hidden;
          text-decoration: none;
          cursor: pointer;
          isolation: isolate;
          transition:
            transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
            box-shadow 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow:
            0 1px 2px rgba(0,0,0,0.40),
            0 12px 32px -8px rgba(0,0,0,0.55);
        }
        .ev-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 2px 4px rgba(0,0,0,0.45),
            0 24px 48px -10px rgba(0,0,0,0.70);
        }
        .ev-card:active { transform: translateY(0) scale(0.99); transition-duration: 80ms; }

        /* Media area - a STATIC flow spacer that reserves the original 4:3
           top region (so the card's overall height is identical to the old
           design). It is intentionally non-positioned: that lets .ev-card-art
           resolve its containing block against .ev-card and span the WHOLE
           card (this region + the details region below). Holds the TL/TR
           overlay rails. */
        .ev-card-media {
          position: static;
          width: 100%;
          flex: 0 0 auto;
          aspect-ratio: 4 / 3;
          background: #0E1116;
        }
        /* Image fills edge-to-edge. The 1.30 idle scale aggressively crops
           the baked-in light margins event posters typically ship with -
           removes ~15% from each edge so square Instagram-style posters
           look full-bleed inside the card's media area.
           translate3d + backface-visibility forces GPU compositing so the
           scaled edges snap to pixel boundaries (otherwise sub-pixel
           rendering can leave a thin light line where the image meets
           the meta strip). */
        .ev-card-art {
          position: absolute;
          /* Extend 1px past every edge - overflow:hidden on the parent
             clips the excess. Guarantees the image always reaches the
             pixel boundary, eliminating sub-pixel anti-alias fringes
             where sliver of the parent bg could otherwise leak. */
          top: -1px; left: -1px; right: -1px; bottom: -1px;
          background-size: cover;
          background-position: center;
          background-color: #0E1116;
          transform: translate3d(0, 0, 0) scale(1.36);
          transition: transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1);
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .ev-card:hover .ev-card-art { transform: translate3d(0, 0, 0) scale(1.40); }
        .ev-card-art-empty {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.35);
          font-size: 2.75rem;
        }
        /* Bottom darkening - progressively dims only the lower portion of
           the poster so the overlaid details read clearly while the top of
           the image stays bright and full-bleed. Tuned to #0E1116 (the old
           strip colour) so the bottom edge lands on the same tone the card
           used to have, just blended into the artwork instead of a hard
           seam. */
        .ev-card-scrim {
          position: absolute; inset: 0;
          z-index: 1;
          background: linear-gradient(180deg,
            rgba(8,11,16,0) 0%,
            rgba(8,11,16,0) 38%,
            rgba(8,11,16,0.32) 55%,
            rgba(8,11,16,0.66) 72%,
            rgba(8,11,16,0.88) 86%,
            rgba(8,11,16,0.97) 100%);
          pointer-events: none;
        }

        /* Top-left / top-right overlay rails */
        .ev-card-tl, .ev-card-tr {
          position: absolute; top: 14px;
          z-index: 2;
          display: flex; gap: 8px; align-items: center;
        }
        .ev-card-tl { left: 14px; }
        .ev-card-tr { right: 14px; }

        /* Date pill - white tear-off, brand-blue overline + tabular-num day */
        .ev-card-date {
          display: inline-flex; flex-direction: column; align-items: center;
          background: #fff; color: #0E1116;
          border-radius: 14px;
          padding: 6px 10px 7px;
          min-width: 46px;
          box-shadow:
            0 1px 2px rgba(0,0,0,0.30),
            0 6px 16px -6px rgba(0,0,0,0.45);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .ev-card-date-mo {
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.08em;
          color: ${BRAND};
        }
        .ev-card-date-day {
          font-size: 18px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.01em;
          margin-top: 1px;
          font-variant-numeric: tabular-nums;
        }

        /* Live pill - replaces date when event is currently live.
           Bold red gradient + breathing red glow ring so it punches through
           any backdrop (event poster, hero gradient, dark photos). */
        .ev-card-live {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 14px;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          border-radius: 999px;
          color: #ffffff;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: 1px solid rgba(255,255,255,0.28);
          box-shadow:
            0 1px 2px rgba(0,0,0,0.30),
            0 6px 16px -2px rgba(220,38,38,0.55),
            inset 0 1px 0 rgba(255,255,255,0.20);
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(0,0,0,0.35);
          animation: ev-card-live-glow 1.8s ease-in-out infinite;
        }
        @keyframes ev-card-live-glow {
          0%, 100% {
            box-shadow:
              0 1px 2px rgba(0,0,0,0.30),
              0 6px 16px -2px rgba(220,38,38,0.55),
              0 0 0 0 rgba(220,38,38,0.55),
              inset 0 1px 0 rgba(255,255,255,0.20);
          }
          50% {
            box-shadow:
              0 1px 2px rgba(0,0,0,0.30),
              0 6px 16px -2px rgba(220,38,38,0.55),
              0 0 0 8px rgba(220,38,38,0),
              inset 0 1px 0 rgba(255,255,255,0.20);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ev-card-live { animation: none; }
        }
        /* Inside the live pill the pulse-dot stays white (the pill itself
           is now red, so a red dot would disappear). */
        .ev-card-live .ev-pulse-dot {
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.30);
        }

        /* Top-right status banner - solid filled chip, white text.
           Default = UPCOMING (brand blue). Variants:
             --live  : emerald green with breathing-halo pulse
             --ended : red */
        .ev-card-status {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 8px;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          border-radius: 14px;
          color: #ffffff;
          background: ${BRAND};
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow:
            0 1px 2px rgba(0,0,0,0.30),
            0 6px 16px -6px rgba(0,0,0,0.45);
          white-space: nowrap;
          /* Faux-heavy: thickens strokes even when the font tops out at 700 */
          -webkit-text-stroke: 0.4px currentColor;
          text-shadow: 0 0 0.01px currentColor;
          /* System font stack with real 900 weights available */
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Pragati Narrow", sans-serif;
        }
        .ev-card-status--live {
          background: #dc2626;
          border-color: rgba(255,255,255,0.30);
          animation: ev-status-live-pulse 1.6s ease-in-out infinite;
        }
        .ev-card-status--ended {
          background: #6b7280;
          color: #ffffff;
          border-color: rgba(255,255,255,0.18);
        }
        @keyframes ev-status-live-pulse {
          0%, 100% {
            background: #dc2626;
            box-shadow:
              0 0 0 0 rgba(220,38,38,0.55),
              0 1px 2px rgba(0,0,0,0.30),
              0 6px 16px -6px rgba(0,0,0,0.45);
          }
          50% {
            background: #ef4444;
            box-shadow:
              0 0 0 6px rgba(220,38,38,0),
              0 1px 2px rgba(0,0,0,0.30),
              0 6px 16px -6px rgba(0,0,0,0.45);
          }
        }
        /* Pulse dot inherits color from the live pill - make it white so it
           reads against the emerald background. */
        .ev-card-status--live .ev-pulse-dot {
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.30);
        }
        .ev-pulse-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #FF4D55;
          box-shadow: 0 0 0 3px rgba(255,77,85,0.25);
          animation: ev-pulse 2s ease-in-out infinite;
          flex: none;
        }
        @keyframes ev-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }

        /* Bookmark - frost-glass dark, top-right */
        .ev-bookmark {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(15,18,22,0.55);
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          color: #F5F6F8;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          box-shadow:
            0 1px 2px rgba(0,0,0,0.30),
            0 6px 16px -6px rgba(0,0,0,0.45);
          transition:
            background 120ms cubic-bezier(0.2, 0.8, 0.2, 1),
            color 120ms cubic-bezier(0.2, 0.8, 0.2, 1),
            transform 120ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .ev-bookmark:hover { background: rgba(15,18,22,0.78); }
        .ev-bookmark:active { transform: scale(0.94); }
        .ev-bookmark.is-saved { color: ${BRAND}; }

        /* Meta block - in normal flow at the bottom of the card (NOT
           absolute), so it contributes its natural height and the card's
           total height stays identical to the old design. It has no
           background; instead its ::before paints a gradient anchored to
           the text block, extending ~86px above it, so the area directly
           behind the details is always dark enough to read regardless of
           content height (1- vs 2-line title, with/without venue) -
           independent of the card-wide scrim. z-index:2 keeps it above the
           full-card image + scrim. */
        .ev-card-meta {
          display: flex; flex-direction: column;
          gap: 7px;
          padding: 14px 16px 16px;
          background: none;
          position: relative;
          z-index: 2;
          /* Grow to fill the card's full height (cards in a grid row stretch
             to equal height) so the footer can be pinned to the very bottom
             regardless of how tall the venue / title above it are. */
          flex: 1 1 auto;
        }
        .ev-card-meta::before {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: 0;
          top: -86px;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(180deg,
            rgba(8,11,16,0) 0%,
            rgba(8,11,16,0.45) 34%,
            rgba(8,11,16,0.78) 62%,
            rgba(8,11,16,0.94) 100%);
        }
        .ev-card-row {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 13.5px;
          line-height: 1.35;
          font-weight: 600;
          letter-spacing: 0.005em;
          color: #E3E6EE;
          text-shadow: 0 1px 3px rgba(0,0,0,0.65);
          padding-bottom: 4px;
        }
        .ev-card-row svg, .ev-card-row i {
          flex: none;
          width: 16px; height: 16px;
          margin-top: 2px;
          color: #6E97DD;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
        /* Venue wraps to a 2nd line when it's too long for the card width
           (instead of single-line ellipsis), then clamps with an ellipsis
           if it still overflows two lines. min-width:0 lets it shrink inside
           the flex row so it actually wraps at the card edge. */
        .ev-card-venue {
          margin: 0;
          min-width: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          overflow-wrap: anywhere;
        }
        .ev-card-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          text-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.55);
          text-wrap: balance;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Footer - organizer chip on the left, brand-blue price pill on the
           right. No divider line: over a photo a hairline reads as dated, so
           we separate it from the title with spacing alone. */
        .ev-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
          /* Pinned to the very bottom of the card - takes all the free space
             above it so the organizer + price banner is static at the bottom
             and unaffected by the venue/title length above. */
          margin-top: auto;
          padding-top: 10px;
        }

        .ev-card-chip-org {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px 4px 4px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
          border-radius: 10px;
          background: rgba(15,18,22,0.55);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          border: 1px solid rgba(255,255,255,0.10);
          color: #F5F6F8;
          max-width: 60%;
          white-space: nowrap;
        }
        .ev-card-chip-org-avatar {
          width: 22px; height: 22px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #2a2f3a, #151921);
          display: inline-flex; align-items: center; justify-content: center;
          flex: 0 0 auto;
          border: 1px solid rgba(255,255,255,0.10);
          font-size: 11px;
          font-weight: 700;
          color: #F5F6F8;
        }
        .ev-card-chip-org-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ev-card-chip-org-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Price pill - brand blue solid, "From RWF X,XXX" inline */
        .ev-card-price {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 12px;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
          color: #fff;
          background: ${BRAND};
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          transition: background 120ms cubic-bezier(0.2, 0.8, 0.2, 1);
          white-space: nowrap;
        }
        .ev-card-price-num { font-variant-numeric: tabular-nums; }
        .ev-card:hover .ev-card-price { background: ${BRAND_DARK}; }

        /* ── LIVE state ──
           Live cards get a high-intensity twinkle: solid red border that
           cycles between bright/brighter, plus a triple-ring outward ripple
           that fires every 1s (same expanding-ripple pattern used by the
           navbar's live-event link, but scaled up for the larger card). */
        .ev-card.is-live {
          border-color: rgba(220,38,38,0.85);
          border-width: 2px;
          animation: ev-card-twinkle 1s ease-out infinite;
        }
        .ev-card.is-live:hover {
          animation-play-state: paused;
          border-color: rgba(248,113,113,1);
          box-shadow:
            0 1px 2px rgba(0,0,0,0.40),
            0 12px 32px -8px rgba(0,0,0,0.55),
            0 0 0 4px rgba(220,38,38,0.35),
            0 0 36px 0 rgba(220,38,38,0.55);
        }
        @keyframes ev-card-twinkle {
          0%, 100% {
            border-color: rgba(220,38,38,0.85);
            box-shadow:
              0 1px 2px rgba(0,0,0,0.40),
              0 12px 32px -8px rgba(0,0,0,0.55),
              0 0 0 0 rgba(220,38,38,0.75),
              0 0 0 0 rgba(220,38,38,0.5);
          }
          25% {
            box-shadow:
              0 1px 2px rgba(0,0,0,0.40),
              0 12px 32px -8px rgba(0,0,0,0.55),
              0 0 0 6px rgba(220,38,38,0.35),
              0 0 0 12px rgba(220,38,38,0.18);
          }
          50% {
            border-color: rgba(248,113,113,1);
            box-shadow:
              0 1px 2px rgba(0,0,0,0.40),
              0 12px 32px -8px rgba(0,0,0,0.55),
              0 0 0 12px rgba(220,38,38,0.10),
              0 0 0 22px rgba(220,38,38,0.05);
          }
          75% {
            box-shadow:
              0 1px 2px rgba(0,0,0,0.40),
              0 12px 32px -8px rgba(0,0,0,0.55),
              0 0 0 18px rgba(220,38,38,0),
              0 0 0 30px rgba(220,38,38,0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ev-card.is-live {
            animation: none;
            box-shadow:
              0 1px 2px rgba(0,0,0,0.40),
              0 12px 32px -8px rgba(0,0,0,0.55),
              0 0 0 2px rgba(220,38,38,0.55);
          }
        }
        /* Live price pill - red gradient (the "you can watch this NOW"
           colour, matches the LIVE NOW pill) instead of the brand-blue
           used for upcoming/free pricing. */
        .ev-card.is-live .ev-card-price {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-color: rgba(255,255,255,0.22);
          box-shadow: 0 6px 18px -4px rgba(220,38,38,0.55), inset 0 1px 0 rgba(255,255,255,0.20);
        }
        .ev-card.is-live:hover .ev-card-price {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }

        /* Ended state - desaturate poster, neutralize price pill */
        .ev-card.is-ended .ev-card-art { filter: grayscale(0.55) brightness(0.9); }
        .ev-card.is-ended { opacity: 0.92; }
        .ev-card.is-ended .ev-card-price {
          background: rgba(255,255,255,0.06);
          color: #C5C9D2;
          border-color: rgba(255,255,255,0.10);
        }

        /* Reduced motion - keep the brand cues but stop the breathing glow. */
        @media (prefers-reduced-motion: reduce) {
          .ev-card.is-live { animation: none; box-shadow: 0 0 0 1px rgba(220,38,38,0.55), 0 12px 32px -8px rgba(0,0,0,0.55); }
        }

        @media (max-width: 700px) {
          .ev-card { border-radius: 16px; }
          .ev-card-meta { padding: 13px 14px 14px; gap: 7px; }
          .ev-card-title { font-size: 20px; }
          .ev-card-row { font-size: 12.5px; }
          .ev-card-tl, .ev-card-tr { top: 10px; }
          .ev-card-tl { left: 10px; }
          .ev-card-tr { right: 10px; }
          .ev-card-date { min-width: 42px; padding: 5px 8px 6px; border-radius: 12px; }
          .ev-card-date-mo { font-size: 10px; }
          .ev-card-date-day { font-size: 16px; }
          .ev-card-live { font-size: 10px; padding: 5px 9px; }
          .ev-bookmark { width: 36px; height: 36px; }
          .ev-card-chip-org { font-size: 11px; }
          .ev-card-chip-org-avatar { width: 20px; height: 20px; font-size: 10px; }
          .ev-card-price { font-size: 13px; padding: 6px 10px; }
        }

        /* 2-up at phone widths - cards become ~170px wide.
           Stack the TR rail vertically (status above bookmark) so it
           doesn't fight the TL date pill, and trim padding/sizes. */
        @media (max-width: 480px) {
          .ev-card { border-radius: 14px; }
          .ev-card-meta { padding: 11px 11px 12px; gap: 6px; }
          .ev-card-title { font-size: 17px; }
          .ev-card-row { font-size: 11.5px; }
          .ev-card-row svg, .ev-card-row i { width: 14px; height: 14px; }
          .ev-card-tl, .ev-card-tr { top: 8px; }
          .ev-card-tl { left: 8px; }
          .ev-card-tr { right: 8px; flex-direction: column; align-items: flex-end; gap: 6px; }
          .ev-card-date { min-width: 38px; padding: 4px 7px 5px; border-radius: 10px; }
          .ev-card-date-mo { font-size: 9px; }
          .ev-card-date-day { font-size: 14px; }
          .ev-card-status {
            font-size: 9px;
            padding: 5px 8px;
            border-radius: 10px;
            letter-spacing: 0.08em;
          }
          .ev-bookmark { width: 30px; height: 30px; }
          .ev-bookmark svg { width: 14px; height: 14px; }
          .ev-card-chip-org {
            font-size: 10px;
            padding: 4px 7px;
            /* Take the full footer row width when chips wrap */
            min-width: 0;
            max-width: 100%;
            flex: 1 1 auto;
          }
          .ev-card-chip-org-avatar { width: 16px; height: 16px; font-size: 9px; }
          .ev-card-chip-org-name {
            min-width: 0;
            max-width: 100%;
            flex: 1 1 auto;
          }
          .ev-card-price { font-size: 11px; padding: 4px 8px; }
          .ev-card-price svg { width: 11px; height: 11px; }
          /* Footer can wrap if both chips can't share a row */
          .ev-card-footer { flex-wrap: wrap; gap: 4px; }
        }

        /* ===== Skeleton - matches the new full-bleed poster card ===== */
        .ev-skel {
          aspect-ratio: 3/4;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(15,23,42,0.10);
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
          background-size: 400% 100%;
          animation: ev-shimmer 1.4s linear infinite;
        }
        /* (skeleton no longer needs separate poster + info sub-elements
           since the card body is now a single continuous image surface) */
        .ev-skel-poster, .ev-skel-info, .ev-skel-line { display: none; }
        @keyframes ev-shimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        /* ===== Empty / Error - light theme ===== */
        .ev-empty {
          background: #fff;
          border: 1px dashed #e2e8f0;
          border-radius: 18px;
          padding: clamp(2.5rem, 6vw, 4rem) 1.5rem;
          text-align: center;
        }
        .ev-empty-icon {
          width: 72px; height: 72px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          background: rgba(8,58,133,0.08);
          display: flex; align-items: center; justify-content: center;
          color: ${BRAND}; font-size: 2rem;
        }
        .ev-empty h3 {
          font-size: 1.15rem; color: #0f172a;
          margin: 0 0 0.35rem; font-weight: 700;
        }
        .ev-empty p {
          color: #64748b; margin: 0 0 1.25rem; font-size: 0.92rem;
        }
        .ev-empty-cta {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0.65rem 1.2rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, ${BRAND}, ${BRAND_DARK});
          color: #fff; font-weight: 700; font-size: 0.9rem;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 8px 18px -8px rgba(8,58,133,0.55);
        }

        /* ===== Pagination - light theme ===== */
        .ev-pager {
          display: flex; justify-content: center; align-items: center;
          gap: 0.4rem;
          margin-top: 3rem;
          flex-wrap: wrap;
        }
        .ev-pager-btn {
          min-width: 40px; height: 40px;
          padding: 0 0.85rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #475569;
          font-weight: 600; font-size: 0.88rem;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          transition: all 0.18s;
          font-family: inherit;
        }
        .ev-pager-btn:hover:not(:disabled) {
          border-color: ${BRAND};
          color: ${BRAND};
          transform: translateY(-1px);
        }
        .ev-pager-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ev-pager-btn.is-active {
          background: linear-gradient(135deg, ${BRAND}, ${BRAND_DARK});
          color: #fff; border-color: transparent;
          box-shadow: 0 6px 14px -6px rgba(8,58,133,0.55);
        }
        .ev-pager-ellipsis { color: #94a3b8; padding: 0 6px; }

        /* ===== A11y ===== */
        .ev-root :where(a, button, input, select, [tabindex]):focus-visible {
          outline: 2px solid ${BRAND};
          outline-offset: 2px;
          border-radius: 8px;
        }
      `}</style>

      <AmoriaKNavbar />

      {/* Banner */}
      {showBanner && (
        <div className="ev-banner" role="region" aria-label="Promotional message">
          <i className="bi bi-megaphone-fill" />
          <span className="ev-banner-text">The Smart Way to Capture Life</span>
          <span className="ev-banner-divider" aria-hidden="true" />
          <span className="ev-banner-cta">Discover amazing events near you!</span>
          <button
            type="button"
            className="ev-banner-close"
            onClick={() => setShowBanner(false)}
            aria-label="Dismiss banner"
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }} />
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="ev-hero" aria-labelledby="ev-hero-title">
        <div className="ev-hero-bg" aria-hidden="true" />
        <span className="ev-hero-eyebrow">
          <i className="bi bi-stars" /> Connekyt events
        </span>
        <h1 id="ev-hero-title" className="ev-hero-title">{t('title')}</h1>
        <p className="ev-hero-sub">{t('subtitle')}</p>
      </section>

      {/* Featured live events. With one event we render a single banner;
          with multiple, the same banner becomes a horizontal scroll-snap
          carousel with prev/next arrows + pagination dots so EVERY live
          event surfaces above the tab segment. */}
      {/* ── HOT LIVE TRENDS - Instagram-stories-style strip ──
          Surfaces every live event as a circular avatar with a rotating
          gradient story ring + LIVE badge. Clicking jumps to the event. */}
      {featuredLiveEvents.length > 0 && (
        <section className="ev-trends" aria-label="Live event stories">
          {/* The gradient line that runs behind the pill + stories is
              rendered as .ev-trends-row::before in the stylesheet below,
              so it can use the row's geometry directly (top:50%) and
              identically on every viewport, matching the desktop look. */}
          <div className="ev-trends-row">
            {/* Hot Live Trends pill */}
            <div className="ev-trends-pill">
              <span className="ev-trends-flame" aria-hidden="true">🔥</span>
              {/* Two text variants - full label on desktop, short "Trends"
                  on mobile to keep the pill compact. CSS toggles which
                  one is visible based on viewport width. */}
              <span className="ev-trends-pill-text ev-trends-pill-text--full">
                {t('hotLiveTrends').replace('🔥', '').trim()}
              </span>
              <span className="ev-trends-pill-text ev-trends-pill-text--short">
                Trends
              </span>
              <span className="ev-trends-count" aria-label={`${featuredLiveEvents.length} live`}>
                {featuredLiveEvents.length}
              </span>
            </div>

            {/* Stories - each live event is a circular avatar with gradient ring */}
            <div className="ev-trends-scroll" role="list">
              {featuredLiveEvents.map((evt) => {
                const cover = evt.eventPhoto || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80';
                return (
                  <a
                    key={evt.id}
                    href={`/user/events/view-event?id=${evt.id}`}
                    className="ev-story"
                    role="listitem"
                    aria-label={`Watch live: ${evt.title}`}
                    title={evt.title}
                  >
                    {/* Rotating Instagram gradient ring */}
                    <span className="ev-story-ring" aria-hidden="true" />
                    {/* Avatar */}
                    <span className="ev-story-avatar">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt="" loading="lazy" />
                    </span>
                    {/* Live pulse badge - tucked into bottom-right */}
                    <span className="ev-story-live" aria-hidden="true">
                      <span className="ev-story-live-dot" />
                      LIVE
                    </span>
                    {/* Title - truncated */}
                    <span className="ev-story-title">{evt.title}</span>
                  </a>
                );
              })}
            </div>

            {/* "View all live" - visible only when scrollable */}
            {featuredLiveEvents.length > 4 && (
              <a
                href="?status=live"
                className="ev-trends-all"
                onClick={(e) => { e.preventDefault(); switchTab('live'); }}
                aria-label="View all live events"
              >
                View all
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </a>
            )}
          </div>
        </section>
      )}

      {/* Tab segment */}
      <div className="ev-tabs-wrap">
        <div className="ev-tabs" role="tablist" aria-label="Event status">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`ev-tab ${activeTab === 'all' ? 'is-active' : ''}`}
            onClick={() => switchTab('all')}
          >
            <i className="bi bi-grid-fill" aria-hidden="true" />
            <span className="ev-tab-label-full">All events</span>
            <span className="ev-tab-label-short">All</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'live'}
            className={`ev-tab ${activeTab === 'live' ? 'is-active' : ''}`}
            onClick={() => switchTab('live')}
          >
            <i className="bi bi-broadcast" aria-hidden="true" />
            <span className="ev-tab-label-full">Live now</span>
            <span className="ev-tab-label-short">Live</span>
            {liveCount > 0 && <span className="ev-tab-count">{liveCount}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            className={`ev-tab ${activeTab === 'upcoming' ? 'is-active' : ''}`}
            onClick={() => switchTab('upcoming')}
          >
            <i className="bi bi-calendar-event-fill" aria-hidden="true" />
            <span className="ev-tab-label-full">Upcoming</span>
            <span className="ev-tab-label-short">Soon</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'completed'}
            className={`ev-tab ${activeTab === 'completed' ? 'is-active' : ''}`}
            onClick={() => switchTab('completed')}
          >
            <i className="bi bi-check-circle-fill" aria-hidden="true" />
            <span className="ev-tab-label-full">Recently ended</span>
            <span className="ev-tab-label-short">Ended</span>
          </button>
        </div>
      </div>

      {/* Filter control card */}
      <div className="ev-controls">
        <div className="ev-controls-card">
          <form onSubmit={handleSearch} role="search">
            <div className="ev-search">
              <i className="bi bi-search ev-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="ev-search-input"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search events"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="ev-search-clear"
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </div>
          </form>

          <div className="ev-filters">
            <FilterSelect
              icon="bi-tag"
              ariaLabel="Filter by category"
              value={selectedCategory}
              onChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}
              options={[
                { value: 'all', label: t('allCategories') },
                ...categoryOptions.map(cat => ({ value: cat, label: cat })),
              ]}
            />
            <FilterSelect
              icon="bi-geo-alt"
              ariaLabel="Filter by location"
              value={selectedLocation}
              onChange={(v) => { setSelectedLocation(v); setCurrentPage(1); }}
              options={[
                { value: 'all', label: t('allLocations') },
                ...availableDistricts.map(d => ({ value: d, label: d })),
              ]}
            />
            <FilterSelect
              icon="bi-calendar-week"
              ariaLabel="Filter by date range"
              value={selectedDate}
              onChange={(v) => { setSelectedDate(v); setCurrentPage(1); }}
              options={[
                { value: 'all',         label: t('allDates') },
                { value: 'today',       label: 'Today' },
                { value: 'tomorrow',    label: 'Tomorrow' },
                { value: 'this-week',   label: 'This week' },
                { value: 'this-month',  label: 'This month' },
                { value: 'next-month',  label: 'Next month' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Result strip */}
      <div className="ev-result">
        <p className="ev-result-count">
          {isLoading ? (
            'Searching events…'
          ) : (
            <>
              <strong>{eventsData.length}</strong> event{eventsData.length === 1 ? '' : 's'}
              {' '}
              {activeTab === 'live'
                ? 'live now'
                : activeTab === 'upcoming'
                ? 'coming up'
                : activeTab === 'completed'
                ? 'recently ended'
                : 'available'}
              {activeFilterCount > 0 && (
                <> · <span style={{ color: BRAND, fontWeight: 600 }}>{activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active</span></>
              )}
            </>
          )}
        </p>
        {activeFilterCount > 0 && (
          <button type="button" className="ev-clear-btn" onClick={resetAllFilters}>
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true" /> Reset filters
          </button>
        )}
      </div>

      {/* Grid */}
      <main className="ev-grid-wrap">
        {isLoading ? (
          <div className="ev-grid" aria-busy="true" aria-live="polite">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="ev-skel" />)}
          </div>
        ) : loadError ? (
          <div className="ev-empty" role="alert">
            <div className="ev-empty-icon" style={{ background: 'rgba(239,68,68,0.10)', color: '#dc2626' }}>
              <i className="bi bi-exclamation-triangle-fill" />
            </div>
            <h3>Couldn&apos;t load events</h3>
            <p>{loadError}</p>
            <button type="button" className="ev-empty-cta" onClick={fetchEvents}>
              <i className="bi bi-arrow-clockwise" /> Try again
            </button>
          </div>
        ) : eventsData.length === 0 ? (
          <div className="ev-empty">
            <div className="ev-empty-icon">
              <i className={
                activeTab === 'live' ? 'bi bi-broadcast' :
                activeTab === 'completed' ? 'bi bi-check-circle' :
                activeTab === 'upcoming' ? 'bi bi-calendar-event' :
                'bi bi-grid'
              } />
            </div>
            <h3>
              {activeTab === 'live'
                ? 'No live events right now'
                : activeTab === 'completed'
                ? 'Nothing recently ended'
                : activeTab === 'upcoming'
                ? 'No upcoming events match your filters'
                : 'No events match your filters'}
            </h3>
            <p>
              {activeTab === 'live'
                ? 'Check back soon. Live shows are added throughout the day.'
                : activeTab === 'completed'
                ? 'Recent events from the past 2 days will appear here.'
                : 'Try widening your search or clearing filters.'}
            </p>
            {activeFilterCount > 0 && (
              <button type="button" className="ev-empty-cta" onClick={resetAllFilters}>
                <i className="bi bi-arrow-counterclockwise" /> Reset filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="ev-grid">
              {eventsData.map(event => {
                const live = isEventLive(event);
                const ended = isEventEnded(event);
                const href = `/user/events/view-event?id=${event.id}`;
                const isSaved = savedEvents.has(event.id);
                const cover = event.eventPhoto;

                // Organizer info (creator → eventOrganizer → fallback)
                const creatorName = event.creator
                  ? `${event.creator.firstName ?? ''} ${event.creator.lastName ?? ''}`.trim()
                  : '';
                const organizerLabel = creatorName || event.eventOrganizer || 'Connekyt';
                const organizerImg = event.creator?.profilePicture && !event.creator.profilePicture.includes('/null')
                  ? event.creator.profilePicture
                  : null;
                const orgInitial = (organizerLabel.charAt(0) || '?').toUpperCase();

                // Inline price - "From RWF X,XXX" or "Free". Use the same
                // currency-resolution rule as the view-event page so the
                // listing card and the detail page stay in sync.
                const priceText = (() => {
                  const code = event.streamFeeCurrencyAbbreviation || 'RWF';
                  if (event.streamFee && event.streamFee > 0) {
                    return { label: 'From', amount: `${code} ${event.streamFee.toLocaleString()}` };
                  }
                  if (event.price && event.price > 0) {
                    return { label: 'From', amount: `${code} ${event.price.toLocaleString()}` };
                  }
                  return { label: '', amount: 'Free' };
                })();

                // Stacked date pill - "MAY / 09" tear-off
                const dateParts = (() => {
                  if (!event.eventDate) return null;
                  const d = new Date(event.eventDate);
                  if (Number.isNaN(d.getTime())) return null;
                  return {
                    mo: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                    day: String(d.getDate()).padStart(2, '0'),
                  };
                })();

                return (
                  <a
                    key={event.id}
                    href={href}
                    className={`ev-card${live ? ' is-live' : ''}${ended ? ' is-ended' : ''}`}
                    aria-label={event.title}
                  >
                    {/* Media area - full-bleed image with TL/TR overlay rails */}
                    <div className="ev-card-media">
                      {cover ? (
                        <div
                          className="ev-card-art"
                          aria-hidden="true"
                          style={{ backgroundImage: `url("${cover}")` }}
                        />
                      ) : (
                        <div className="ev-card-art" aria-hidden="true">
                          <div className="ev-card-art-empty">
                            <i className="bi bi-image" />
                          </div>
                        </div>
                      )}
                      <div className="ev-card-scrim" aria-hidden="true" />

                      {/* Top-left: date tear-off (always visible when we have a date) */}
                      <div className="ev-card-tl">
                        {dateParts ? (
                          <div className="ev-card-date" aria-label={`${dateParts.mo} ${dateParts.day}`}>
                            <span className="ev-card-date-mo">{dateParts.mo}</span>
                            <span className="ev-card-date-day">{dateParts.day}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Top-right: status banner + bookmark */}
                      <div className="ev-card-tr">
                        {live ? (
                          <span className="ev-card-status ev-card-status--live" aria-label="Event is live now">
                            <span className="ev-pulse-dot" aria-hidden="true" />
                            LIVE
                          </span>
                        ) : ended ? (
                          <span className="ev-card-status ev-card-status--ended" aria-label="Event has ended">
                            ENDED
                          </span>
                        ) : (
                          <span className="ev-card-status" aria-label="Upcoming event">
                            UPCOMING
                          </span>
                        )}
                        <button
                          type="button"
                          className={`ev-bookmark${isSaved ? ' is-saved' : ''}`}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(event.id); }}
                          aria-label={isSaved ? 'Remove from saved' : 'Save event'}
                          aria-pressed={isSaved}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Meta strip - venue, title, footer (organizer | price) */}
                    <div className="ev-card-meta">
                      {event.location && (
                        <div className="ev-card-row">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span className="ev-card-venue">{event.location}</span>
                        </div>
                      )}
                      <h3 className="ev-card-title">{event.title}</h3>
                      <div className="ev-card-footer">
                        <span className="ev-card-chip-org" title={organizerLabel}>
                          <span className="ev-card-chip-org-avatar" aria-hidden="true">
                            {organizerImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={organizerImg} alt="" loading="lazy" />
                            ) : (
                              <span>{orgInitial}</span>
                            )}
                          </span>
                          <span className="ev-card-chip-org-name">{organizerLabel}</span>
                        </span>
                        <span className="ev-card-price">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20.59 13.41L12 22l-9-9V3h10l7.59 7.59a2 2 0 0 1 0 2.82Z" />
                            <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
                          </svg>
                          <span>
                            {priceText.label && `${priceText.label} `}
                            <span className="ev-card-price-num">{priceText.amount}</span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Pagination - show only when:
                  • backend says there's more than one page AND
                  • the current page is actually full (visible data >=
                    itemsPerPage) OR we're already past page 1
                Otherwise, the first page already contains every event
                that survived client-side filtering and pagination would
                lead to empty/sparse pages - so we hide it. */}
            {apiTotalPages > 1 && (eventsData.length >= itemsPerPage || currentPage > 1) && (
              <nav className="ev-pager" aria-label="Pagination">
                <button
                  type="button"
                  className="ev-pager-btn"
                  onClick={goToPrev}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <i className="bi bi-chevron-left" /> Prev
                </button>
                {getPageNumbers().map((p, i) =>
                  typeof p === 'number' ? (
                    <button
                      key={`p-${p}`}
                      type="button"
                      className={`ev-pager-btn ${currentPage === p ? 'is-active' : ''}`}
                      onClick={() => goToPage(p)}
                      aria-label={`Go to page ${p}`}
                      aria-current={currentPage === p ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={`e-${i}`} className="ev-pager-ellipsis">{p}</span>
                  )
                )}
                <button
                  type="button"
                  className="ev-pager-btn"
                  onClick={goToNext}
                  disabled={currentPage >= apiTotalPages}
                  aria-label="Next page"
                >
                  Next <i className="bi bi-chevron-right" />
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
};

// Wrap with Suspense for useSearchParams
const EventsWithSuspense: React.FC = () => (
  <Suspense fallback={
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc',
    }}>
      <div style={{ color: BRAND, fontWeight: 700 }}>
        <i className="bi bi-hourglass-split" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
        Loading events…
      </div>
    </div>
  }>
    <Events />
  </Suspense>
);

export default EventsWithSuspense;
