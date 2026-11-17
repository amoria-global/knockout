import { describe, expect, it } from 'vitest';
import { nameColor, nameInitial } from './nameColor';

describe('chat name colours', () => {
  it('gives the same person the same colour every time, ignoring case and spaces at the ends', () => {
    expect(nameColor('Aline')).toEqual(nameColor('  aline '));
  });

  it('always returns a fill and a readable text colour', () => {
    for (const n of ['Aline', 'Kevin', 'Grace', 'Eric', 'Divine', '', 'QA']) {
      const c = nameColor(n);
      expect(c.fill).toMatch(/^#[0-9A-F]{6}$/i);
      expect(c.text).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('uses more than one colour across a group of names', () => {
    const fills = new Set(['Aline', 'Kevin', 'Grace', 'Eric', 'Divine', 'Jean', 'Marie'].map((n) => nameColor(n).fill));
    expect(fills.size).toBeGreaterThan(2);
  });

  it('takes the first letter in upper case, or a question mark', () => {
    expect(nameInitial('aline')).toBe('A');
    expect(nameInitial('  kevin')).toBe('K');
    expect(nameInitial('')).toBe('?');
  });
});
