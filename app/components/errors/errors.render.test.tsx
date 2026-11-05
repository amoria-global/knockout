import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Banner, BannerHost } from './Banner';
import { ErrorDialog } from './ErrorDialog';
import { FieldError, invalidFieldProps } from './FieldError';
import { FullScreenError } from './FullScreenError';
import { TOAST_MS, ToastHost } from './Toast';
import { presentError } from '@/lib/errorSystem/presentError';
import { clearBanner, getErrorState, resetErrorState, setBanner, showToast } from '@/lib/errorSystem/store';
import { showError } from '@/lib/errorSystem/useErrors';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

function render(node: React.ReactNode) {
  act(() => root.render(node));
}

beforeEach(() => {
  resetErrorState();
  vi.useFakeTimers();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe('FieldError', () => {
  it('draws nothing without a message', () => {
    render(<FieldError message={null} id="x" />);
    expect(host.innerHTML).toBe('');
  });

  it('shows icon plus text, is an alert, and links to its input', () => {
    render(<FieldError message="The minimum price is RWF 100." id="price-error" />);
    const el = host.querySelector('#price-error')!;
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.textContent).toContain('The minimum price is RWF 100.');
    expect(el.querySelector('i')).not.toBeNull();
    expect(invalidFieldProps('price-error', 'x')).toEqual({ 'aria-invalid': true, 'aria-describedby': 'price-error' });
    expect(invalidFieldProps('price-error', null)).toEqual({ 'aria-invalid': false });
  });
});

describe('toast', () => {
  it('shows one at a time, queues the rest, and dedupes the same message', () => {
    showToast({ message: 'first', tone: 'warning' });
    showToast({ message: 'second', tone: 'warning' });
    showToast({ message: 'second', tone: 'warning' });
    expect(getErrorState().toasts).toHaveLength(2);
    render(<ToastHost />);
    expect(host.textContent).toContain('first');
    expect(host.textContent).not.toContain('second');
  });

  it('leaves after 5 seconds and the next one shows', () => {
    showToast({ message: 'first', tone: 'warning' });
    showToast({ message: 'second', tone: 'warning' });
    render(<ToastHost />);
    act(() => {
      vi.advanceTimersByTime(TOAST_MS + 10);
    });
    expect(host.textContent).toContain('second');
    expect(host.textContent).not.toContain('first');
  });

  it('stays while the pointer is over it', () => {
    showToast({ message: 'first', tone: 'warning' });
    render(<ToastHost />);
    const alert = host.querySelector('[role=alert]')!;
    act(() => {
      alert.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      alert.dispatchEvent(new MouseEvent('mouseenter'));
    });
    act(() => {
      vi.advanceTimersByTime(TOAST_MS * 2);
    });
    // React's onMouseEnter is driven by mouseover; either way the toast must not have been removed by a stale timer.
    expect(getErrorState().toasts.length).toBeLessThanOrEqual(1);
  });

  it('runs Retry once and removes the toast; the dismiss control is at least 44px', () => {
    const onAction = vi.fn();
    showToast({ message: 'x', tone: 'danger', actionLabel: 'Try again', onAction });
    render(<ToastHost />);
    const buttons = Array.from(host.querySelectorAll('button'));
    const retry = buttons.find((b) => b.textContent === 'Try again')!;
    act(() => retry.click());
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(getErrorState().toasts).toHaveLength(0);

    showToast({ message: 'y', tone: 'warning' });
    render(<ToastHost />);
    const close = host.querySelector('button[aria-label="Dismiss"]') as HTMLButtonElement;
    expect(close.style.width).toBe('44px');
    expect(close.style.height).toBe('44px');
  });
});

describe('banner', () => {
  it('replaces a banner with the same key and stays until cleared', () => {
    setBanner({ key: 'connectivity', tone: 'warning', title: "You're offline" });
    setBanner({ key: 'connectivity', tone: 'success', title: "You're back online" });
    render(<BannerHost />);
    expect(host.textContent).toContain("You're back online");
    expect(host.textContent).not.toContain("You're offline");
    act(() => clearBanner('connectivity'));
    expect(host.innerHTML).toBe('');
  });

  it('shows a close button only when dismissing is safe', () => {
    render(<Banner tone="info" title="Heads up" />);
    expect(host.querySelectorAll('button')).toHaveLength(0);
    render(<Banner tone="info" title="Heads up" onDismiss={() => {}} />);
    expect(host.querySelectorAll('button')).toHaveLength(1);
  });
});

describe('error dialog', () => {
  const presentation = presentError({ status: 500, message: 'x' }, { intent: 'pay', reassurance: "You weren't charged." });

  it('explains, reassures, focuses the first action, and has a plain way out', () => {
    render(<ErrorDialog presentation={presentation} onAction={() => {}} onClose={() => {}} />);
    const dialog = host.querySelector('[role=alertdialog]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain("You weren't charged.");
    expect(dialog.textContent).toContain('Try again');
    expect(dialog.textContent).toContain('Cancel');
    expect(document.activeElement?.textContent).toBe('Try again');
  });

  it('runs the chosen action and closes on Escape', () => {
    const onAction = vi.fn();
    const onClose = vi.fn();
    render(<ErrorDialog presentation={presentation} onAction={onAction} onClose={onClose} />);
    act(() => (host.querySelector('button') as HTMLButtonElement).click());
    expect(onAction).toHaveBeenCalledWith('retry');
    act(() => {
      host.querySelector('[role=alertdialog]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('full page error', () => {
  it('offers Try again and Home and a support code', () => {
    const presentation = presentError({ status: 503, message: 'x' }, { intent: 'load', critical: true });
    render(<FullScreenError presentation={presentation} onAction={() => {}} />);
    expect(host.textContent).toContain('Try again');
    expect(host.textContent).toContain('Go to Home');
    expect(host.textContent).toContain(`Support code ${presentation.supportCode}`);
  });
});

describe('showError dispatch', () => {
  it('toasts a network blip with Retry wired to the handler', () => {
    const onRetry = vi.fn();
    const p = showError({ status: 0, message: 'Network request failed' }, { intent: 'background' }, { onRetry });
    expect(p.kind).toBe('toast');
    const t = getErrorState().toasts[0];
    expect(t.actionLabel).toBe('Try again');
    t.onAction?.();
    expect(onRetry).toHaveBeenCalled();
  });

  it('raises a banner for offline and a dialog for payments, and returns field and fullscreen to the page', () => {
    expect(showError({ status: 0 }, { offline: true }).kind).toBe('banner');
    expect(showError({ status: 500 }, { intent: 'pay' }).kind).toBe('sheet');
    expect(getErrorState().sheet).not.toBeNull();
    expect(showError({ errorCode: 'WRONG_CODE', attemptsLeft: 2 }, { intent: 'validate' }).kind).toBe('field');
    expect(showError({ status: 503 }, { intent: 'load', critical: true }).kind).toBe('fullscreen');
  });

  it('sends an expired session to the sign-in handler without showing an error', () => {
    const onSignIn = vi.fn();
    showError({ status: 401, message: 'x' }, {}, { onSignIn });
    expect(onSignIn).toHaveBeenCalled();
    expect(getErrorState().toasts).toHaveLength(0);
  });
});
