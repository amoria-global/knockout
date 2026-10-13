import { describe, it, expect } from 'vitest';
import GetAppModal from './GetAppModal';

describe('GetAppModal', () => {
  it('instantiates cleanly as a component', () => {
    expect(GetAppModal).toBeDefined();
    expect(typeof GetAppModal).toBe('function');
  });
});
