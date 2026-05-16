'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AmoriaKNavbar from '../../components/navbar';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  getLocationFromStorage,
  getDistrictsForCountry,
  type LocationData,
} from '../../utils/locationUtils';
import {
  getPhotographers,
  getCities,
  getCurrencies,
  type Photographer,
  type PhotographerCategory,
  type City,
  type Currency,
} from '@/lib/APIs/public';
import { useToast } from '@/lib/notifications/ToastProvider';
import dynamic from 'next/dynamic';

const BookingWizard = dynamic(() => import('../../components/BookingWizard'), { ssr: false });

const BRAND = '#083A85';
const BRAND_DARK = '#062a63';

type SortKey = 'top_rated' | 'most_jobs' | 'newest' | 'price_asc' | 'price_desc';

/* ------------------------------------------------------------------
 * FilterSelect — custom styled dropdown
 *
 * Native <select> can't have its option list styled (browsers ignore
 * <option> CSS). This is a button + listbox popover that:
 *  • Looks native to the rest of the page (rounded, brand colors, animated)
 *  • Full keyboard support: ArrowUp/Down, Enter/Space, Esc, Tab
 *  • ARIA: combobox/listbox/option with aria-selected, aria-expanded
 *  • Click-outside + Esc to dismiss
 *  • Works both as click-to-toggle and keyboard-driven navigation
 * ------------------------------------------------------------------ */
interface FilterOption { value: string; label: string }

function FilterSelect({
  icon,
  value,
  options,
  onChange,
  ariaLabel,
  prefix,
  compact = false,
  align = 'left',
}: {
  icon: string;
  value: string;
  options: FilterOption[];
  onChange: (val: string) => void;
  ariaLabel: string;
  /** Optional inline label shown before the selected value (e.g. "Sort:"). */
  prefix?: string;
  /** Compact trigger — smaller, inline-block instead of full-width. */
  compact?: boolean;
  /** Anchor the popover from the left or right edge of the trigger. */
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Click-outside dismissal
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !listRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // When opening, sync active index to the currently selected option
  useEffect(() => {
    if (open) {
      const idx = options.findIndex(o => o.value === value);
      setActiveIndex(idx >= 0 ? idx : 0);
      // Focus the listbox so arrow keys work immediately
      requestAnimationFrame(() => listRef.current?.focus());
    }
  }, [open, options, value]);

  const selectedLabel = options.find(o => o.value === value)?.label ?? options[0]?.label ?? '';

  const handleTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(options[activeIndex].value);
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const wrapCls = `ph-select-wrap${compact ? ' ph-select-wrap--compact' : ''}${align === 'right' ? ' ph-select-wrap--align-right' : ''}`;
  const triggerCls = `ph-select-trigger${compact ? ' ph-select-trigger--compact' : ''}`;

  return (
    <div className={wrapCls}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerCls}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleTriggerKey}
      >
        <i className={`bi ${icon} ph-select-icon`} aria-hidden="true" />
        {prefix && <span className="ph-select-prefix">{prefix}</span>}
        <span className="ph-select-value">{selectedLabel}</span>
        <i className={`bi bi-chevron-up ph-select-caret ${open ? 'is-open' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="ph-select-list"
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
                className={`ph-select-option${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <i
                  className={`bi bi-check2 ph-select-check ${isSelected ? '' : 'ph-select-check--hidden'}`}
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

/**
 * Slide-in/Slide-out carousel for the photographer card's cover area.
 *
 * Cycles through a list of image URLs every 3 seconds. Each image enters
 * from the right edge of the cover, holds in the middle, then exits to
 * the left as the next image enters. Implemented with absolutely
 * positioned siblings and a 3-position CSS transition (left / active /
 * right) so we don't need a motion library and the animation stays smooth
 * even under React's reconciliation.
 *
 * If there's only one image the interval is skipped — no animation, just
 * a static cover. If there are zero images the parent renders its own
 * empty-state, so this component is rendered conditionally on
 * images.length > 0.
 */
const COVER_SLIDE_INTERVAL_MS = 3000;

const CoverCarousel: React.FC<{ images: string[]; alt: string }> = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = images.length;

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex(i => (i + 1) % total);
    }, COVER_SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [total]);

  // Each image gets one of three positions relative to the current index:
  //   active  → on-screen, transform: translateX(0)
  //   left    → just exited (transform: translateX(-100%))
  //   right   → queued for next entry (transform: translateX(100%))
  // The "previous" image (current - 1) is the one in "left" position.
  // Everything else queued goes to "right". This keeps exits and entries
  // in lockstep so they cross-fade through the cover frame.
  return (
    <div className="ph-cover-slider">
      {images.map((src, i) => {
        let position: 'left' | 'active' | 'right';
        if (i === currentIndex) position = 'active';
        else if ((i + 1) % total === currentIndex) position = 'left';
        else position = 'right';
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={alt}
            loading="lazy"
            className={`ph-cover-slide ph-cover-slide--${position}`}
          />
        );
      })}
    </div>
  );
};

const Photographers: React.FC = () => {
  const t = useTranslations('photographers');
  const searchParams = useSearchParams();
  const toast = useToast();

  // ----- States (preserved from previous version) -----
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [availableOn, setAvailableOn] = useState<string>('');
  const [bookmarkedPhotographers, setBookmarkedPhotographers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  // currencyMap kept for type compatibility — was unused in the original UI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currencyMap, setCurrencyMap] = useState<Map<string, Currency>>(new Map());

  // API data states
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  // Sort state — default to newest-first (last come, first out).
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  // Booking wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardPhotographerId, setWizardPhotographerId] = useState<string | undefined>();

  // Auto-popup wizard after 5 seconds (once per session)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('wizardDismissed')) return;
    const timer = setTimeout(() => setShowWizard(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const itemsPerPage = 12;

  useEffect(() => {
    const location = getLocationFromStorage();
    if (location) {
      setUserLocation(location);
      const districts = getDistrictsForCountry(location.countryCode);
      setAvailableDistricts(districts);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await getCities();
        if (response.success && response.data) {
          const cityList = Array.isArray(response.data) ? response.data : [];
          setCities(cityList.filter((c) => c.isActive !== false));
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      }
    };
    const fetchCurrencies = async () => {
      try {
        const response = await getCurrencies();
        if (response.success && response.data) {
          const list = Array.isArray(response.data) ? response.data : [];
          const map = new Map<string, Currency>();
          list.forEach(c => map.set(c.id, c));
          setCurrencyMap(map);
        }
      } catch { /* silent */ }
    };
    fetchCities();
    fetchCurrencies();
  }, []);

  const fetchPhotographers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPhotographers({
        page: currentPage,
        size: itemsPerPage,
        sortColumn: 'createdAt',
        sortDirection: 'desc', // newest registrations first (last come, first out)
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        location: selectedLocation !== 'all' ? selectedLocation : undefined,
        search: searchTerm || undefined,
        availableOn: availableOn || undefined,
      });

      if (response.success && response.data) {
        setPhotographers(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else {
        setError(response.error || 'Failed to fetch photographers');
        toast.error(response.error || 'Failed to fetch photographers');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedCategory, selectedLocation, searchTerm, availableOn]);

  useEffect(() => { fetchPhotographers(); }, [fetchPhotographers]);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [searchParams]);

  // ----- Handlers (preserved) -----
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchPhotographers();
  };

  const toggleBookmark = (photographerId: string) => {
    setBookmarkedPhotographers(prev =>
      prev.includes(photographerId)
        ? prev.filter(id => id !== photographerId)
        : [...prev, photographerId]
    );
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setPriceRange('all');
    setSelectedRating('all');
    setAvailableOn('');
    setCurrentPage(0);
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedLocation !== 'all' ? 1 : 0) +
    (priceRange !== 'all' ? 1 : 0) +
    (selectedRating !== 'all' ? 1 : 0) +
    (availableOn ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  // ----- Display helpers (preserved) -----
  const getPhotographerDisplayName = (photographer: Photographer) =>
    `${photographer.firstName} ${photographer.lastName}`;

  const getPhotographerLocation = (photographer: Photographer) =>
    photographer.address || 'Location not specified';

  const getProfileImage = (photographer: Photographer): string | null => {
    if (photographer.profilePicture && !photographer.profilePicture.includes('/null')) {
      return photographer.profilePicture;
    }
    return null;
  };

  const getCoverImage = (photographer: Photographer): string | null => {
    if (photographer.coverPicture && !photographer.coverPicture.includes('/null')) {
      return photographer.coverPicture;
    }
    return null;
  };

  const getStartingPrice = (photographer: Photographer) => {
    const activePkgs = (photographer.packages ?? []).filter(p => p.isActive);
    if (activePkgs.length === 0) return null;
    const cheapest = activePkgs.reduce((min, p) => p.price < min.price ? p : min, activePkgs[0]);
    return cheapest;
  };

  // Pagination
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
  };
  const goToPreviousPage = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };
  const goToPage = (pageNumber: number) => setCurrentPage(pageNumber);

  // ----- Derived (preserved + new sort) -----
  const categoryOptions = useMemo(() => {
    const seen = new Map<string, PhotographerCategory>();
    photographers.forEach((p) => {
      (p.specialties ?? []).forEach((s) => {
        const name = typeof s === 'string' ? s : (s as { id: string; name: string }).name;
        const id = typeof s !== 'string' && (s as { id: string; name: string }).id
          ? (s as { id: string; name: string }).id
          : name.toLowerCase();
        const key = name.toLowerCase();
        if (!seen.has(key)) seen.set(key, { id, name, isActive: true });
      });
    });
    return [...seen.values()];
  }, [photographers]);

  const displayedPhotographers = useMemo(() => {
    const filtered = photographers.filter(p => {
      if (selectedCategory !== 'all') {
        const specialties = (p.specialties ?? []).map((s) =>
          (typeof s === 'string' ? s : s.name).toLowerCase()
        );
        if (!specialties.includes(selectedCategory.toLowerCase())) return false;
      }
      if (selectedRating !== 'all') {
        const minRating = parseFloat(selectedRating);
        if ((p.rating || 0) < minRating) return false;
      }
      if (priceRange !== 'all') {
        const packages = p.packages || [];
        if (packages.length > 0) {
          const minPrice = Math.min(...packages.map(pkg => pkg.price));
          if (priceRange === 'budget' && minPrice >= 50000) return false;
          if (priceRange === 'moderate' && (minPrice < 50000 || minPrice > 150000)) return false;
          if (priceRange === 'premium' && (minPrice <= 150000 || minPrice > 300000)) return false;
          if (priceRange === 'luxury' && minPrice <= 300000) return false;
        }
      }
      return true;
    });

    // Client-side sort
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'top_rated':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'most_jobs':
          return (b.completedEvents ?? 0) - (a.completedEvents ?? 0);
        case 'price_asc': {
          const ap = getStartingPrice(a)?.price ?? Number.POSITIVE_INFINITY;
          const bp = getStartingPrice(b)?.price ?? Number.POSITIVE_INFINITY;
          return ap - bp;
        }
        case 'price_desc': {
          const ap = getStartingPrice(a)?.price ?? Number.NEGATIVE_INFINITY;
          const bp = getStartingPrice(b)?.price ?? Number.NEGATIVE_INFINITY;
          return bp - ap;
        }
        case 'newest':
        default: {
          // Last come, first out — most recently created photographer first.
          // The landing Photographer type carries the registration timestamp
          // as `joinedFrom` (backend maps it from Customer.getCreatedAt());
          // there is no `createdAt` on this type, which is what failed
          // c40d514's build with "Property 'createdAt' does not exist".
          const at = a.joinedFrom ? new Date(a.joinedFrom).getTime() : 0;
          const bt = b.joinedFrom ? new Date(b.joinedFrom).getTime() : 0;
          return bt - at;
        }
      }
    });
    return sorted;
  }, [photographers, selectedRating, priceRange, selectedCategory, sortBy]);

  // userLocation kept for future use (was set but unused in original render)
  void userLocation;

  return (
    <div className="ph-root">
      <style>{`
        /* ============================================================
           PHOTOGRAPHERS PAGE — scoped styles
           Single source of brand-blue, hover-via-CSS, focus rings,
           skeleton shimmer, and responsive overrides.
           ============================================================ */
        .ph-root {
          min-height: 100vh;
          background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #e9eef5 100%);
          font-family: 'Pragati Narrow', system-ui, sans-serif;
        }

        /* Banner */
        .ph-banner {
          position: relative;
          background: linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%);
          color: #fff;
          padding: 0.7rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.875rem;
          overflow: hidden;
        }
        .ph-banner::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
          background-size: 18px 18px;
          opacity: 0.4;
          pointer-events: none;
        }
        .ph-banner > * { position: relative; z-index: 1; }
        .ph-banner-text { font-size: 0.9rem; color: rgba(255,255,255,0.85); }
        .ph-banner-cta  { font-size: 0.9rem; font-weight: 700; }
        .ph-banner-divider { width: 1px; height: 18px; background: rgba(255,255,255,0.25); }
        .ph-banner-close {
          background: transparent; border: none; color: rgba(255,255,255,0.65);
          cursor: pointer; padding: 6px; border-radius: 6px;
          transition: background 0.18s, color 0.18s;
        }
        .ph-banner-close:hover { color: #fff; background: rgba(255,255,255,0.12); }

        /* Hero */
        .ph-hero {
          position: relative;
          background: linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%);
          color: #fff;
          padding: clamp(2rem, 5vw, 3.5rem) 1.25rem clamp(5rem, 10vw, 7rem);
          overflow: hidden;
          text-align: center;
        }
        .ph-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.10) 1.2px, transparent 1.2px);
          background-size: 22px 22px;
          -webkit-mask-image: radial-gradient(circle at 50% 0%, #000 60%, transparent 90%);
                  mask-image: radial-gradient(circle at 50% 0%, #000 60%, transparent 90%);
          opacity: 0.55;
          pointer-events: none;
        }
        .ph-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 999px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.22);
          font-size: 0.72rem; letter-spacing: 1.2px; font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .ph-hero-title {
          font-size: clamp(1.85rem, 4.5vw, 2.75rem);
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 0.5rem;
        }
        .ph-hero-sub {
          font-size: clamp(0.9rem, 1.5vw, 1.05rem);
          color: rgba(255,255,255,0.82);
          max-width: 42rem;
          margin: 0 auto;
        }

        /* Control card — floats over hero */
        .ph-control {
          position: relative;
          z-index: 3;
          margin: -4rem auto 0;
          max-width: 1200px;
          padding: 0 1rem;
        }
        .ph-control-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 20px 50px -25px rgba(8,58,133,0.30), 0 4px 12px rgba(8,58,133,0.05);
          border: 1px solid rgba(8,58,133,0.06);
          padding: clamp(1rem, 2vw, 1.25rem);
        }
        .ph-search {
          position: relative;
          margin-bottom: 0.85rem;
        }
        .ph-search-icon {
          position: absolute;
          left: 16px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; font-size: 1rem; pointer-events: none;
        }
        .ph-search-input {
          width: 100%;
          padding: 0.85rem 0.85rem 0.85rem 44px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 0.95rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          font-family: inherit;
        }
        .ph-search-input::placeholder { color: #94a3b8; }
        .ph-search-input:focus {
          border-color: ${BRAND};
          background: #fff;
          box-shadow: 0 0 0 4px rgba(8,58,133,0.08);
        }
        .ph-search-clear {
          position: absolute;
          right: 12px; top: 50%; transform: translateY(-50%);
          background: transparent; border: none; cursor: pointer;
          color: #94a3b8; padding: 6px; border-radius: 50%;
          transition: color 0.18s, background 0.18s;
        }
        .ph-search-clear:hover { color: ${BRAND}; background: rgba(8,58,133,0.08); }

        .ph-filters {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.6rem;
        }
        @media (max-width: 900px) { .ph-filters { grid-template-columns: repeat(2, 1fr); } }

        /* Date input wrapper (kept native — OS pickers are good) */
        .ph-filter {
          position: relative;
          display: flex; align-items: center; gap: 8px;
          padding: 0.55rem 0.85rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .ph-filter:hover, .ph-filter:focus-within {
          border-color: ${BRAND};
          box-shadow: 0 0 0 3px rgba(8,58,133,0.06);
        }
        .ph-filter > i {
          color: ${BRAND};
          font-size: 0.9rem;
          flex: none;
        }
        .ph-filter > input[type="date"] {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.85rem;
          font-weight: 500;
          color: #0f172a;
          cursor: pointer;
          font-family: inherit;
          min-width: 0;
        }

        /* ----------------------------------------------------------
           Custom select (FilterSelect component)
           ---------------------------------------------------------- */
        .ph-select-wrap { position: relative; }
        .ph-select-wrap--compact { display: inline-block; }

        .ph-select-trigger {
          display: flex; align-items: center; gap: 8px;
          width: 100%;
          padding: 0.55rem 0.85rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          color: #0f172a;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        /* Compact variant — used by Sort in the result strip */
        .ph-select-trigger--compact {
          width: auto;
          padding: 0.5rem 0.85rem;
        }
        .ph-select-prefix {
          color: #64748b;
          font-weight: 600;
          font-size: 0.85rem;
          flex: none;
          white-space: nowrap;
        }
        .ph-select-trigger:hover,
        .ph-select-trigger[aria-expanded="true"] {
          border-color: ${BRAND};
          box-shadow: 0 0 0 3px rgba(8,58,133,0.06);
        }
        .ph-select-icon {
          color: ${BRAND};
          font-size: 0.9rem;
          flex: none;
        }
        .ph-select-value {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ph-select-caret {
          color: #94a3b8;
          font-size: 0.7rem;
          flex: none;
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ph-select-caret.is-open { transform: rotate(180deg); color: ${BRAND}; }

        .ph-select-list {
          /* Drop-up: anchor to the bottom of the trigger, popover grows upward */
          position: absolute;
          bottom: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 50;
          margin: 0;
          padding: 0.35rem;
          list-style: none;
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(8,58,133,0.10);
          box-shadow: 0 18px 44px -14px rgba(8,58,133,0.22),
                      0 6px 14px rgba(0,0,0,0.06);
          max-height: 280px;
          overflow-y: auto;
          outline: none;
          animation: ph-select-pop 0.16s cubic-bezier(0.22, 1, 0.36, 1);
          /* Brand-tint scrollbar so the popover feels native to the page */
          scrollbar-width: thin;
          scrollbar-color: rgba(8,58,133,0.25) transparent;
        }
        /* Compact wraps size-to-content — let the popover grow up to a sensible max */
        .ph-select-wrap--compact .ph-select-list {
          left: 0;
          right: auto;
          min-width: 220px;
          max-width: 280px;
        }
        /* Right-anchored popover — anchors the dropdown to the trigger's right edge */
        .ph-select-wrap--align-right .ph-select-list {
          left: auto;
          right: 0;
        }
        .ph-select-list::-webkit-scrollbar { width: 6px; }
        .ph-select-list::-webkit-scrollbar-track { background: transparent; }
        .ph-select-list::-webkit-scrollbar-thumb {
          background: rgba(8,58,133,0.25); border-radius: 3px;
        }
        /* Drop-up entry: slide up from below into final position */
        @keyframes ph-select-pop {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ph-select-option {
          display: flex; align-items: center; gap: 8px;
          padding: 0.5rem 0.6rem;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #475569;
          cursor: pointer;
          user-select: none;
          transition: background 0.12s, color 0.12s;
        }
        .ph-select-option.is-active {
          background: rgba(8,58,133,0.06);
          color: ${BRAND};
        }
        .ph-select-option.is-selected {
          color: ${BRAND};
          font-weight: 700;
        }
        .ph-select-option.is-selected.is-active {
          background: rgba(8,58,133,0.10);
        }
        .ph-select-check {
          color: ${BRAND};
          font-size: 0.95rem;
          flex: none;
        }
        .ph-select-check--hidden { visibility: hidden; }

        /* Bigger touch targets on mobile */
        @media (max-width: 640px) {
          .ph-select-option { padding: 0.65rem 0.65rem; font-size: 0.82rem; }
          .ph-select-list   { max-height: 60vh; }
        }

        /* Result strip */
        .ph-result {
          display: flex; align-items: center; justify-content: space-between;
          margin: 1.75rem 0 1rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .ph-result-count {
          font-size: 0.95rem;
          color: #475569;
        }
        .ph-result-count strong { color: ${BRAND}; font-weight: 700; }
        .ph-result-actions {
          display: flex; align-items: center; gap: 0.5rem;
        }
        .ph-clear-btn {
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #475569;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          transition: all 0.18s;
          font-family: inherit;
        }
        .ph-clear-btn:hover { border-color: ${BRAND}; color: ${BRAND}; background: rgba(8,58,133,0.04); }
        /* .ph-sort native styling removed — sort now uses <FilterSelect compact /> */

        /* Grid */
        .ph-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 640px) {
          .ph-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        }
        @media (max-width: 380px) {
          .ph-grid { grid-template-columns: 1fr; }
        }

        /* CARD — preserves original border + cover-height proportions */
        .ph-card {
          position: relative;
          background: #fff;
          border-radius: 20px;
          border: 3px solid #bab8b8;
          overflow: hidden;
          display: flex; flex-direction: column;
          transition: transform 0.25s var(--ease, cubic-bezier(0.22,1,0.36,1)),
                      box-shadow 0.25s, border-color 0.25s;
        }
        .ph-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 48px -20px rgba(8,58,133,0.22), 0 4px 12px rgba(8,58,133,0.06);
          border-color: rgba(8,58,133,0.40);
        }

        .ph-card-cover {
          position: relative;
          width: 100%;
          height: 155px;
          background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
          overflow: hidden;
        }
        .ph-card-cover img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          display: block;
        }
        /* Cover carousel — stack a few images in the same frame and slide
           through them every 3s. Each slide is absolutely positioned so the
           three positions (left / active / right) line up regardless of the
           image's natural size. */
        .ph-cover-slider {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .ph-cover-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          will-change: transform;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ph-cover-slide--active { transform: translateX(0); }
        .ph-cover-slide--left   { transform: translateX(-100%); }
        .ph-cover-slide--right  { transform: translateX(100%); }
        /* Respect reduced-motion preferences — we still cycle the image, just
           without the slide animation. */
        @media (prefers-reduced-motion: reduce) {
          .ph-cover-slide { transition: opacity 0.3s ease; transform: none !important; opacity: 0; }
          .ph-cover-slide--active { opacity: 1; }
        }
        .ph-card-cover-empty {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7);
          font-size: 2.5rem;
        }
        /* (gradient fade removed — name no longer overlays the cover) */

        /* Avatar — straddles cover/body boundary, mostly in cover with a slight
           lip into the body so the name has breathing room below it. */
        .ph-avatar {
          position: absolute;
          top: 117px;     /* sticks 18px into body (avatar 56 + 117 = 173, cover ends at 155) */
          left: 20px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #cbd5e1;
          z-index: 5;
        }
        .ph-avatar img,
        .ph-avatar-empty {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid #fff;
          object-fit: cover;
          object-position: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: block;
        }
        .ph-avatar-empty {
          background: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 2rem;
        }
        /* Blue verification tick — small white circle pinned to bottom-right of avatar */
        .ph-avatar-verif {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 22px;
          height: 22px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0; /* kills icon-font baseline so the check sits exactly centered */
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
          z-index: 6;
        }
        .ph-avatar-verif i {
          color: #3b82f6;
          font-size: 0.92rem;
          display: block;
          line-height: 1;
        }

        /* Status pill (top-left) */
        .ph-status {
          position: absolute;
          top: 12px; left: 12px;
          z-index: 2;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(6px);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          box-shadow: 0 4px 10px rgba(0,0,0,0.12);
        }
        .ph-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16,185,129,0.5);
          animation: ph-pulse 2s ease-out infinite;
        }
        .ph-status--available     { color: #047857; }
        .ph-status--booked        { color: #b91c1c; }
        .ph-status--booked .ph-status-dot { background: #ef4444; box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
        @keyframes ph-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }

        /* Rating chip (top-right) + bookmark below */
        .ph-rating {
          position: absolute;
          top: 12px; right: 12px;
          z-index: 2;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(6px);
          font-size: 0.78rem; font-weight: 700;
          color: #0f172a;
          box-shadow: 0 4px 10px rgba(0,0,0,0.12);
        }
        .ph-rating i { color: #f59e0b; font-size: 0.78rem; }
        .ph-rating-count { color: #64748b; font-weight: 500; font-size: 0.72rem; }

        .ph-bookmark {
          position: absolute;
          top: 50px; right: 12px;
          z-index: 2;
          width: 32px; height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(6px);
          color: #475569;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.12);
          transition: transform 0.18s, color 0.18s, background 0.18s;
        }
        .ph-bookmark:hover { transform: scale(1.08); }
        .ph-bookmark.is-saved { color: ${BRAND}; }

        /* Identity block — sits inside the body, below the straddling avatar */
        .ph-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ph-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        /* headline + location share one row */
        .ph-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: #475569;
          margin: 0;
          min-width: 0;
        }
        .ph-meta-headline { font-weight: 500; flex: none; }
        .ph-meta-sep { color: #cbd5e1; flex: none; }
        .ph-meta-loc-icon { color: ${BRAND}; font-size: 0.72rem; flex: none; }
        .ph-meta-loc {
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        /* Card body — top padding clears the 18px avatar overhang + 8px breathing */
        .ph-card-body {
          padding: 26px 0.95rem 0.7rem;
          display: flex; flex-direction: column; gap: 0.32rem;
        }
        .ph-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          padding: 0.32rem 0.55rem;
          background: #f8fafc;
          border-radius: 10px;
        }
        .ph-stat {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.78rem;
          color: #475569;
        }
        .ph-stat i { color: ${BRAND}; font-size: 0.78rem; }
        .ph-stat strong { color: #0f172a; font-weight: 700; }

        .ph-chips {
          display: flex; flex-wrap: wrap; gap: 4px;
        }
        .ph-chip {
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
        }
        .ph-chip--more {
          color: ${BRAND};
          background: rgba(8,58,133,0.06);
          border-color: rgba(8,58,133,0.15);
        }

        .ph-cta-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
          margin-top: 2px;
        }
        .ph-price {
          display: flex; flex-direction: column;
          line-height: 1.1;
          min-width: 0;
        }
        .ph-price-label {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        .ph-price-value {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ph-price-value small { color: #64748b; font-weight: 500; font-size: 0.72rem; }

        .ph-cta {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0.55rem 0.95rem;
          border-radius: 10px;
          border: none;
          background: #1a1a1a;
          color: #fff;
          font-size: 0.82rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          font-family: inherit;
          flex: none;
        }
        .ph-cta:hover {
          background: #2d2d2d;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.18);
        }

        /* Mobile compact card */
        @media (max-width: 640px) {
          .ph-card { border-radius: 12px; border-width: 2px; }
          .ph-card-cover { height: 105px; }

          /* Mobile avatar — sticks 14px into body, leaving room for the name */
          .ph-avatar { top: 79px; left: 8px; width: 40px; height: 40px; }
          .ph-avatar img,
          .ph-avatar-empty { border-width: 2px; }
          .ph-avatar-empty { font-size: 1.15rem; }
          .ph-avatar-verif { width: 14px; height: 14px; bottom: 0; right: 0; }
          .ph-avatar-verif i { font-size: 0.6rem; }

          .ph-name { font-size: 0.86rem; }
          .ph-meta { font-size: 0.66rem; gap: 4px; }
          .ph-meta-loc-icon { font-size: 0.6rem; }

          .ph-status, .ph-rating { font-size: 0.58rem; padding: 3px 7px; top: 8px; }
          .ph-status { left: 8px; }
          .ph-rating { right: 8px; }
          /* Cover is now 150px tall — bookmark fits cleanly below rating chip again */
          .ph-bookmark { width: 24px; height: 24px; top: 38px; right: 8px; font-size: 0.7rem; }

          /* Mobile body padding — clears 14px avatar overhang + 6px breathing */
          .ph-card-body { padding: 20px 0.65rem 0.5rem; gap: 0.25rem; }
          .ph-stat { font-size: 0.65rem; }
          .ph-chip { font-size: 0.6rem; padding: 2px 7px; }
          .ph-price-value { font-size: 0.78rem; }
          .ph-cta { padding: 0.4rem 0.65rem; font-size: 0.68rem; }
        }

        /* Skeleton */
        .ph-skeleton {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .ph-skeleton-cover {
          width: 100%; aspect-ratio: 4/3;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
          background-size: 400% 100%;
          animation: ph-shimmer 1.4s linear infinite;
        }
        .ph-skeleton-body { padding: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .ph-skeleton-line {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
          background-size: 400% 100%;
          animation: ph-shimmer 1.4s linear infinite;
        }
        @keyframes ph-shimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        /* Empty / Error */
        .ph-empty {
          text-align: center;
          padding: clamp(2.5rem, 6vw, 4rem) 1rem;
          background: #fff;
          border-radius: 18px;
          border: 1px dashed #e2e8f0;
        }
        .ph-empty-icon {
          width: 72px; height: 72px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          background: rgba(8,58,133,0.08);
          display: flex; align-items: center; justify-content: center;
          color: ${BRAND}; font-size: 2rem;
        }
        .ph-empty h3 { font-size: 1.15rem; color: #0f172a; margin: 0 0 0.35rem; font-weight: 700; }
        .ph-empty p  { color: #64748b; margin: 0 0 1.25rem; font-size: 0.92rem; }

        /* Pagination */
        .ph-pager {
          display: flex; justify-content: center; align-items: center;
          gap: 0.4rem;
          margin-top: 2.5rem;
          flex-wrap: wrap;
        }
        .ph-pager-btn {
          min-width: 40px; height: 40px;
          padding: 0 0.85rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          color: #475569;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          transition: all 0.18s;
          font-family: inherit;
        }
        .ph-pager-btn:hover:not(:disabled) {
          border-color: ${BRAND};
          color: ${BRAND};
          transform: translateY(-1px);
        }
        .ph-pager-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ph-pager-btn.is-active {
          background: linear-gradient(135deg, ${BRAND}, ${BRAND_DARK});
          color: #fff;
          border-color: transparent;
          box-shadow: 0 6px 14px -6px rgba(8,58,133,0.55);
        }

        /* A11y focus ring */
        .ph-root :where(a, button, input, select, [tabindex]):focus-visible {
          outline: 2px solid ${BRAND};
          outline-offset: 2px;
          border-radius: 8px;
        }
      `}</style>

      <AmoriaKNavbar />

      {/* Banner */}
      {showBanner && (
        <div className="ph-banner" role="region" aria-label="Promotional message">
          <i className="bi bi-megaphone-fill" />
          <span className="ph-banner-text">The Smart Way to Capture Life</span>
          <span className="ph-banner-divider" aria-hidden="true" />
          <span className="ph-banner-cta">Book your perfect photographer today!</span>
          <button
            type="button"
            className="ph-banner-close"
            onClick={() => setShowBanner(false)}
            aria-label="Dismiss promotional banner"
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }} />
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="ph-hero" aria-labelledby="ph-hero-title">
        <span className="ph-hero-eyebrow">
          <i className="bi bi-stars" /> Browse Connekyt photographers
        </span>
        <h1 id="ph-hero-title" className="ph-hero-title">{t('title')}</h1>
        <p className="ph-hero-sub">{t('subtitle')}</p>
      </section>

      {/* Control card — search + filters */}
      <div className="ph-control">
        <div className="ph-control-card">
          <form onSubmit={handleSearch} role="search">
            <div className="ph-search">
              <i className="bi bi-search ph-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="ph-search-input"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search photographers"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="ph-search-clear"
                  onClick={() => { setSearchTerm(''); setCurrentPage(0); }}
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </div>
          </form>

          <div className="ph-filters">
            <FilterSelect
              icon="bi-camera"
              ariaLabel="Filter by category"
              value={selectedCategory}
              onChange={(v) => { setSelectedCategory(v); setCurrentPage(0); }}
              options={[
                { value: 'all', label: t('allCategories') },
                ...categoryOptions.map(c => ({ value: c.name.toLowerCase(), label: c.name })),
              ]}
            />

            <FilterSelect
              icon="bi-geo-alt"
              ariaLabel="Filter by location"
              value={selectedLocation}
              onChange={(v) => { setSelectedLocation(v); setCurrentPage(0); }}
              options={[
                { value: 'all', label: t('allLocations') },
                ...(cities.length > 0
                  ? cities.map(c => ({ value: c.name, label: c.name }))
                  : availableDistricts.map(d => ({ value: d, label: d }))),
              ]}
            />

            <FilterSelect
              icon="bi-cash-stack"
              ariaLabel="Filter by price range"
              value={priceRange}
              onChange={setPriceRange}
              options={[
                { value: 'all',      label: t('allPrices') },
                { value: 'budget',   label: 'Budget · Under 50k' },
                { value: 'moderate', label: 'Moderate · 50k–150k' },
                { value: 'premium',  label: 'Premium · 150k–300k' },
                { value: 'luxury',   label: 'Luxury · 300k+' },
              ]}
            />

            <FilterSelect
              icon="bi-star"
              ariaLabel="Filter by rating"
              value={selectedRating}
              onChange={setSelectedRating}
              options={[
                { value: 'all', label: t('allRatings') },
                { value: '5',   label: '5 stars' },
                { value: '4',   label: '4+ stars' },
                { value: '3',   label: '3+ stars' },
                { value: '2',   label: '2+ stars' },
              ]}
            />

            <label className="ph-filter ph-filter--date">
              <i className="bi bi-calendar-event" aria-hidden="true" />
              <input
                type="date"
                value={availableOn}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => { setAvailableOn(e.target.value); setCurrentPage(0); }}
                aria-label="Filter by availability date"
              />
              {availableOn && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setAvailableOn(''); setCurrentPage(0); }}
                  aria-label="Clear date filter"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Main */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '1rem clamp(0.75rem,2vw,1rem) 4rem' }}>
        {/* Result strip */}
        <div className="ph-result">
          <p className="ph-result-count">
            {isLoading ? (
              <>Searching photographers…</>
            ) : (
              <>
                <strong>{totalElements || displayedPhotographers.length}</strong> photographer
                {(totalElements || displayedPhotographers.length) === 1 ? '' : 's'} found
                {activeFilterCount > 0 && (
                  <> · <span style={{ color: BRAND, fontWeight: 600 }}>{activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active</span></>
                )}
              </>
            )}
          </p>
          <div className="ph-result-actions">
            {activeFilterCount > 0 && (
              <button type="button" className="ph-clear-btn" onClick={resetAllFilters}>
                <i className="bi bi-arrow-counterclockwise" /> Reset filters
              </button>
            )}
            <FilterSelect
              icon="bi-sort-down"
              prefix="Sort:"
              compact
              align="right"
              ariaLabel="Sort results"
              value={sortBy}
              onChange={(v) => setSortBy(v as SortKey)}
              options={[
                { value: 'top_rated',  label: 'Top rated' },
                { value: 'most_jobs',  label: 'Most jobs' },
                { value: 'price_asc',  label: 'Price: low → high' },
                { value: 'price_desc', label: 'Price: high → low' },
                { value: 'newest',     label: 'Newest' },
              ]}
            />
          </div>
        </div>

        {/* Loading — skeleton grid */}
        {isLoading && (
          <div className="ph-grid" aria-busy="true" aria-live="polite">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="ph-skeleton" key={i}>
                <div className="ph-skeleton-cover" />
                <div className="ph-skeleton-body">
                  <div className="ph-skeleton-line" style={{ width: '60%', height: 16 }} />
                  <div className="ph-skeleton-line" style={{ width: '40%' }} />
                  <div className="ph-skeleton-line" style={{ width: '85%' }} />
                  <div className="ph-skeleton-line" style={{ width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="ph-empty" role="alert">
            <div className="ph-empty-icon" style={{ background: 'rgba(239,68,68,0.10)', color: '#dc2626' }}>
              <i className="bi bi-exclamation-triangle-fill" />
            </div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button type="button" className="ph-cta" onClick={fetchPhotographers}>
              <i className="bi bi-arrow-clockwise" /> Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && displayedPhotographers.length === 0 && (
          <div className="ph-empty">
            <div className="ph-empty-icon"><i className="bi bi-camera" /></div>
            <h3>No photographers match your filters</h3>
            <p>Try widening your search, picking a different location, or clearing filters.</p>
            <button type="button" className="ph-cta" onClick={resetAllFilters}>
              <i className="bi bi-arrow-counterclockwise" /> Reset filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && displayedPhotographers.length > 0 && (
          <div className="ph-grid">
            {displayedPhotographers.map((photographer) => {
              const isBookmarked = bookmarkedPhotographers.includes(photographer.id);
              const displayName   = getPhotographerDisplayName(photographer);
              const profileImage  = getProfileImage(photographer);
              const coverImage    = getCoverImage(photographer);
              // Stack everything the photographer has uploaded for the cover
              // carousel: their cover photo first, profile photo next, then
              // any featured portfolio project images. Filter out blanks /
              // legacy "null" string artefacts so the carousel never holds an
              // empty frame. De-dupe so the same image doesn't loop twice if
              // they used the same upload for cover + a project.
              const carouselImages = Array.from(new Set(
                [
                  photographer.coverPicture,
                  photographer.profilePicture,
                  ...((photographer.projects ?? []).map(p => p.projectImage)),
                ]
                  .filter((u): u is string => typeof u === 'string' && !!u && !u.includes('/null'))
              ));
              const location      = getPhotographerLocation(photographer);
              const cheapest      = getStartingPrice(photographer);
              const specialties   = (photographer.specialties ?? []).map(s =>
                typeof s === 'string' ? s : s.name
              );
              const rating        = photographer.rating ?? 0;
              const reviewCount   = photographer.reviews?.length ?? 0;
              const completedJobs = photographer.completedEvents ?? 0;
              // Per design spec: every card shows "Available" — no booked state surfaced
              const isVerified    = photographer.isVerified ?? true; // default true (matches old default badge)
              const headline      = specialties[0] || photographer.customerType || 'Photographer';
              const visibleChips  = isMobile ? 2 : 3;

              return (
                <article className="ph-card" key={photographer.id}>
                  {/* COVER */}
                  <div className="ph-card-cover">
                    {carouselImages.length > 0 ? (
                      <CoverCarousel images={carouselImages} alt={`${displayName}'s photos`} />
                    ) : (
                      <div className="ph-card-cover-empty" aria-hidden="true">
                        <i className="bi bi-image" />
                      </div>
                    )}

                    {/* Status pill — reflects the backend's red-day model:
                        "booked" when today is at capacity or the photographer
                        manually blocked it, "available" otherwise. */}
                    {photographer.currentStatus === 'booked' ? (
                      <span className="ph-status ph-status--booked" aria-label="Booked today">
                        <span className="ph-status-dot" aria-hidden="true" />
                        Booked
                      </span>
                    ) : (
                      <span className="ph-status ph-status--available" aria-label="Available now">
                        <span className="ph-status-dot" aria-hidden="true" />
                        Available
                      </span>
                    )}

                    {/* Rating chip */}
                    {rating > 0 && (
                      <span className="ph-rating" aria-label={`Rated ${rating.toFixed(1)} out of 5, ${reviewCount} reviews`}>
                        <i className="bi bi-star-fill" aria-hidden="true" />
                        {rating.toFixed(1)}
                        <span className="ph-rating-count">({reviewCount})</span>
                      </span>
                    )}

                    {/* Bookmark */}
                    <button
                      type="button"
                      className={`ph-bookmark ${isBookmarked ? 'is-saved' : ''}`}
                      onClick={() => toggleBookmark(photographer.id)}
                      aria-label={isBookmarked ? `Remove ${displayName} from saved` : `Save ${displayName}`}
                      aria-pressed={isBookmarked}
                    >
                      <i className={isBookmarked ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'} />
                    </button>

                  </div>

                  {/* Avatar — straddles cover/body boundary (original placement) */}
                  <div className="ph-avatar">
                    {profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileImage} alt={`${displayName} profile`} loading="lazy" />
                    ) : (
                      <div className="ph-avatar-empty" aria-hidden="true">
                        <i className="bi bi-person-fill" />
                      </div>
                    )}
                    {/* Verification tick always shown (per design spec) */}
                    <div className="ph-avatar-verif" title="Verified photographer" aria-label="Verified">
                      <i className="bi bi-patch-check-fill" aria-hidden="true" />
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="ph-card-body">
                    {/* Identity — headline + location share one row to keep card compact */}
                    <div className="ph-info">
                      <h3 className="ph-name">{displayName}</h3>
                      <p className="ph-meta">
                        <span className="ph-meta-headline">{headline}</span>
                        <span className="ph-meta-sep" aria-hidden="true">·</span>
                        <i className="bi bi-geo-alt-fill ph-meta-loc-icon" aria-hidden="true" />
                        <span className="ph-meta-loc">{location}</span>
                      </p>
                    </div>

                    {/* Stats strip */}
                    <div className="ph-stats">
                      <div className="ph-stat">
                        <i className="bi bi-camera-reels-fill" />
                        <strong>{completedJobs}</strong>
                        <span>{t('completedJobs')}</span>
                      </div>
                      <div className="ph-stat">
                        <i className="bi bi-chat-square-quote-fill" />
                        <strong>{reviewCount}</strong>
                        <span>review{reviewCount === 1 ? '' : 's'}</span>
                      </div>
                    </div>

                    {/* Specialty chips */}
                    {specialties.length > 0 ? (
                      <div className="ph-chips">
                        {specialties.slice(0, visibleChips).map((s, i) => (
                          <span className="ph-chip" key={i}>{s}</span>
                        ))}
                        {specialties.length > visibleChips && (
                          <span className="ph-chip ph-chip--more">+{specialties.length - visibleChips}</span>
                        )}
                      </div>
                    ) : (
                      <div className="ph-chips">
                        <span className="ph-chip" style={{ color: '#94a3b8' }}>No specialties listed</span>
                      </div>
                    )}

                    {/* Price + CTA */}
                    <div className="ph-cta-row">
                      {cheapest ? (
                        <div className="ph-price">
                          <span className="ph-price-label">From</span>
                          <span className="ph-price-value">
                            {cheapest.currencySymbol || ''}{cheapest.price.toLocaleString()}{' '}
                            <small>{cheapest.priceUnit}</small>
                          </span>
                        </div>
                      ) : (
                        <div className="ph-price">
                          <span className="ph-price-label">Pricing</span>
                          <span className="ph-price-value" style={{ color: '#94a3b8', fontWeight: 600 }}>On request</span>
                        </div>
                      )}
                      <a
                        className="ph-cta"
                        href={`/user/photographers/view-profile?id=${photographer.id}`}
                        aria-label={`View ${displayName}'s profile`}
                      >
                        {t('getInTouch')} <i className="bi bi-arrow-right" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination — show only when there's actual overflow worth
            paginating (visible data fills the current page OR we're
            already past page 1). Hides when the first page already has
            every photographer that survived filtering. */}
        {!isLoading && !error && totalPages > 1 && (photographers.length >= itemsPerPage || currentPage > 0) && (
          <nav className="ph-pager" aria-label="Pagination">
            <button
              type="button"
              className="ph-pager-btn"
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              <i className="bi bi-chevron-left" /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i).map((pageIndex) => (
              <button
                key={pageIndex}
                type="button"
                className={`ph-pager-btn ${currentPage === pageIndex ? 'is-active' : ''}`}
                onClick={() => goToPage(pageIndex)}
                aria-label={`Go to page ${pageIndex + 1}`}
                aria-current={currentPage === pageIndex ? 'page' : undefined}
              >
                {pageIndex + 1}
              </button>
            ))}
            <button
              type="button"
              className="ph-pager-btn"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
            >
              Next <i className="bi bi-chevron-right" />
            </button>
          </nav>
        )}
      </main>

      <BookingWizard
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false);
          setWizardPhotographerId(undefined);
          sessionStorage.setItem('wizardDismissed', 'true');
        }}
        preselectedPhotographerId={wizardPhotographerId}
      />
    </div>
  );
};

export default Photographers;
