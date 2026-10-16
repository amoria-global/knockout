import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('./QrCodeSvg', () => ({ default: () => <svg data-testid="qr" /> }));

import GetAppModal from './GetAppModal';

let root: Root | null = null;
let host: HTMLElement | null = null;

function mount(platform: 'ios' | 'android' | null, onClose = () => {}) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(<GetAppModal isOpen onClose={onClose} userPlatform={platform} />));
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('GetAppModal', () => {
  it('iPhone: the App Store is the main button, Google Play the alternative', () => {
    const h = mount('ios');
    expect(h.textContent).toContain('Apple App Store');
    expect(h.textContent).toContain('Best for your iPhone');
    expect(h.textContent).toContain('Also available on Google Play');
  });

  it('Android: Google Play is the main button', () => {
    const h = mount('android');
    expect(h.textContent).toContain('Google Play Store');
    expect(h.textContent).toContain('Also available on Apple App Store');
  });

  it('desktop: a QR code and both store buttons', () => {
    const h = mount(null);
    expect(h.querySelector('[data-testid="qr"]')).not.toBeNull();
    expect(h.querySelectorAll('a.ga-cta')).toHaveLength(2);
  });

  it('shows all three capabilities and closes from the button and the backdrop', () => {
    const onClose = vi.fn();
    const h = mount('ios', onClose);
    expect(h.querySelectorAll('.ga-card')).toHaveLength(3);
    act(() => (h.querySelector('.ga-close') as HTMLElement).click());
    act(() => (h.querySelector('.ga-overlay') as HTMLElement).click());
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps its spacing out of Tailwind utilities', () => {
    // The global `* { margin: 0; padding: 0 }` is unlayered and beats Tailwind v4's layered
    // utilities, so any p-*, m-*, px-* or gap-* class here would be zeroed on a phone.
    const h = mount('ios');
    const bad = Array.from(h.querySelectorAll('[class]')).filter((el) =>
      /(^|\s)-?(p|m|px|py|pt|pb|mt|mb|ml|mr|mx|my)-\d/.test(el.getAttribute('class') ?? ''),
    );
    expect(bad).toHaveLength(0);
    expect(h.querySelector('style')?.textContent).toContain('.ga-body{');
  });
});
