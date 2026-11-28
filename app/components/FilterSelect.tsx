'use client';

import React, { useState, useEffect, useRef } from 'react';

/* ------------------------------------------------------------------
 * FilterSelect - custom styled dropdown
 *
 * Native <select> can't have its option list styled (browsers ignore
 * <option> CSS). This is a button + listbox popover that:
 *  • Looks native to the rest of the page (rounded, brand colors, animated)
 *  • Full keyboard support: ArrowUp/Down, Enter/Space, Esc, Tab
 *  • ARIA: combobox/listbox/option with aria-selected, aria-expanded
 *  • Click-outside + Esc to dismiss
 *  • Works both as click-to-toggle and keyboard-driven navigation
 * ------------------------------------------------------------------ */
export interface FilterOption { value: string; label: string }

export default function FilterSelect({
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
  /** Compact trigger - smaller, inline-block instead of full-width. */
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
        <i className={`bi bi-chevron-down ph-select-caret ${open ? 'is-open' : ''}`} aria-hidden="true" />
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

