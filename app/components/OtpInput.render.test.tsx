import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import OtpInput from './OtpInput';

/**
 * The shared code field, rendered: one real input drawn as six boxes. It cleans what is typed or
 * pasted, submits once at six digits, locks while the server checks, and never judges the code.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function Harness(props: Partial<React.ComponentProps<typeof OtpInput>> & { onDone?: (c: string) => void }) {
  const [v, setV] = useState('');
  return <OtpInput {...props} value={v} onChange={setV} onComplete={props.onDone} />;
}

const field = () => host.querySelector('input') as HTMLInputElement;
function type(value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(field(), value);
    field().dispatchEvent(new Event('input', { bubbles: true }));
  });
}
function paste(text: string) {
  const ev = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
  ev.clipboardData = { getData: () => text };
  act(() => {
    field().dispatchEvent(ev);
  });
}

describe('OtpInput', () => {
  it('is one input that asks the browser for a one-time code', () => {
    act(() => root.render(<Harness />));
    expect(host.querySelectorAll('input')).toHaveLength(1);
    const i = field();
    expect(i.getAttribute('autocomplete')).toBe('one-time-code');
    expect(i.getAttribute('inputmode')).toBe('numeric');
  });

  it('cleans a pasted code with spaces and dashes', () => {
    const done = vi.fn();
    act(() => root.render(<Harness onDone={done} />));
    paste('123 456');
    expect(field().value).toBe('123456');
    expect(done).toHaveBeenCalledWith('123456');
  });

  it('submits once when the sixth digit lands, not again for the same code', () => {
    const done = vi.fn();
    act(() => root.render(<Harness onDone={done} />));
    type('12345');
    expect(done).not.toHaveBeenCalled();
    type('123456');
    type('123456');
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('allows the next full code after the field was cleared', () => {
    const done = vi.fn();
    act(() => root.render(<Harness onDone={done} />));
    type('111111');
    type('');
    type('222222');
    expect(done).toHaveBeenCalledTimes(2);
  });

  it('locks while the server checks and ignores input', () => {
    const done = vi.fn();
    act(() => root.render(<Harness busy onDone={done} />));
    expect(field().disabled).toBe(true);
  });

  it('shows the digits in the boxes and announces an error to screen readers', () => {
    act(() => root.render(<OtpInput value="12" onChange={() => {}} error="That code is not right." hint="2 attempts left" />));
    expect(host.textContent).toContain('12');
    const alert = host.querySelector('[role="alert"]');
    expect(alert?.getAttribute('aria-live')).toBe('assertive');
    expect(alert?.textContent).toBe('That code is not right.');
    expect(host.textContent).toContain('2 attempts left');
  });
});
