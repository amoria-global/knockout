import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import LangFlag from './LangFlag';
import { locales } from '../../i18n';

describe('LangFlag', () => {
  it('draws a flag for every language the site offers, with no image request', () => {
    for (const code of locales) {
      const host = document.createElement('div');
      const root = createRoot(host);
      act(() => root.render(<LangFlag code={code} />));
      expect(host.querySelector('svg'), code).not.toBeNull();
      expect(host.querySelector('img')).toBeNull();
      act(() => root.unmount());
    }
  });

  it('draws nothing for an unknown language rather than a broken image', () => {
    const host = document.createElement('div');
    const root = createRoot(host);
    act(() => root.render(<LangFlag code="xx" />));
    expect(host.innerHTML).toBe('');
    act(() => root.unmount());
  });
});
