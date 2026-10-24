import { describe, it, expect } from 'vitest';
import { classifyEventLoadError, EVENT_NOT_OPEN_MESSAGE } from './loadError';

describe('classifyEventLoadError', () => {
  it('shows the designed not-open state for the backend not-open message', () => {
    const c = classifyEventLoadError(EVENT_NOT_OPEN_MESSAGE);
    expect(c.kind).toBe('not-open');
    expect(c.title).toBe('This event is not open yet');
    expect(c.canRetry).toBe(true);
  });

  it('never echoes a raw backend message', () => {
    const c = classifyEventLoadError('java.lang.NullPointerException at EventService:42');
    expect(c.kind).toBe('not-found');
    expect(`${c.title} ${c.body}`).not.toContain('NullPointer');
  });

  it('treats a missing event and an empty error as not found', () => {
    expect(classifyEventLoadError('Event not found').kind).toBe('not-found');
    expect(classifyEventLoadError(undefined).kind).toBe('not-found');
  });

  it('offers a retry on a network failure', () => {
    const c = classifyEventLoadError(null, true);
    expect(c.kind).toBe('offline');
    expect(c.canRetry).toBe(true);
  });
});
