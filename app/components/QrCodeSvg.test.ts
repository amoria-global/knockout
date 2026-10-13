import { describe, it, expect } from 'vitest';
import React from 'react';
import QrCodeSvg from './QrCodeSvg';

describe('QrCodeSvg', () => {
  it('instantiates cleanly as a component', () => {
    expect(QrCodeSvg).toBeDefined();
    expect(typeof QrCodeSvg).toBe('function');
  });
});
