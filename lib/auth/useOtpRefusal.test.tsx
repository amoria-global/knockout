import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useOtpRefusal } from './useOtpRefusal';

/**
 * What an inline code step shows after the server refuses a code: its message, the tries it says are left, and a lock
 * with a countdown. The hook holds the server's answer; it never judges a code.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let api: ReturnType<typeof useOtpRefusal>;
function Probe() {
  api = useOtpRefusal();
  return null;
}

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<Probe />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('useOtpRefusal', () => {
  it('starts quiet', () => {
    expect(api.error).toBeUndefined();
    expect(api.hint).toBeUndefined();
    expect(api.locked).toBe(false);
  });

  it('shows a wrong code with the tries left and runs the shake', () => {
    act(() => { api.record({ data: { errorCode: 'WRONG_CODE', attemptsLeft: 2, message: 'That code did not work.' } }, 'x'); });
    expect(api.error).toBe('That code did not work.');
    expect(api.hint).toBe('2 attempts left');
    expect(api.shakeKey).toBe(1);
  });

  it('a lock shows the time left and flags locked, with no tries line', () => {
    act(() => { api.record({ data: { errorCode: 'LOCKED', retryAfterSeconds: 900, message: 'Locked' } }, 'x'); });
    expect(api.locked).toBe(true);
    expect(api.error).toBe('Too many wrong codes. Try again in 15:00.');
    expect(api.hint).toBeUndefined();
  });

  it('falls back to the error text and the fallback message for an answer it does not know', () => {
    act(() => { api.record({ error: 'Incorrect or expired code.' }, 'Fallback'); });
    expect(api.error).toBe('Incorrect or expired code.');
    act(() => { api.record({}, 'Fallback'); });
    expect(api.error).toBe('Fallback');
  });

  it('clear takes the message away', () => {
    act(() => { api.record({ data: { errorCode: 'WRONG_CODE', attemptsLeft: 1, message: 'No.' } }, 'x'); });
    act(() => api.clear());
    expect(api.error).toBeUndefined();
    expect(api.hint).toBeUndefined();
  });
});
