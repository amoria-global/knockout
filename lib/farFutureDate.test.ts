import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmYear, farYearMessage, formatLongDay, isFarFuture } from './farFutureDate';

const today = new Date(2026, 10, 10);

describe('farFutureDate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('formats the day as a civil date', () => {
    expect(formatLongDay('2028-10-14')).toBe('14 Oct 2028');
    expect(farYearMessage('2028-10-14')).toBe('This event is on 14 Oct 2028. Is the year right?');
  });

  it('is far only after the same day next year', () => {
    expect(isFarFuture('2027-11-10', today)).toBe(false);
    expect(isFarFuture('2027-11-11', today)).toBe(true);
    expect(isFarFuture('2028-10-14', today)).toBe(true);
    expect(isFarFuture('2026-12-01', today)).toBe(false);
    expect(isFarFuture('', today)).toBe(false);
    expect(isFarFuture('not a date', today)).toBe(false);
  });

  it('asks only for a far date and honours the answer', () => {
    const ask = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    vi.stubGlobal('window', { confirm: ask });
    expect(confirmYear('2026-12-01', today)).toBe(true);
    expect(ask).not.toHaveBeenCalled();
    expect(confirmYear('2028-10-14', today)).toBe(true);
    expect(confirmYear('2028-10-14', today)).toBe(false);
    expect(ask).toHaveBeenCalledWith('This event is on 14 Oct 2028. Is the year right?');
  });
});
