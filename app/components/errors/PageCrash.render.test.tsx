import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageCrash } from './PageCrash';
import { ErrorBoundary } from '../ErrorBoundary';
import { setErrorSink, type ErrorReport } from '@/lib/errorSystem/report';
import { buildEnvelope } from '@/lib/errorSystem/sentrySink';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
let reports: ErrorReport[];

beforeEach(() => {
  reports = [];
  setErrorSink((r) => reports.push(r));
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  setErrorSink(null);
});

/** A page that crashed shows one calm screen with a way out and a code, and reports itself once as fatal. */
describe('PageCrash', () => {
  it('shows the crash copy, both actions and a support code', () => {
    act(() => root.render(<PageCrash error={new Error('boom')} retry={() => {}} />));
    expect(host.textContent).toContain('Something went wrong on this page');
    expect(host.textContent).toContain('Try again');
    expect(host.textContent).toContain('Go to Home');
    expect(host.textContent).toMatch(/Support code [A-Z2-9]{3}-[A-Z2-9]{3}/);
  });

  it('calls retry from Try again', () => {
    const retry = vi.fn();
    act(() => root.render(<PageCrash error={new Error('boom')} retry={retry} />));
    const button = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'Try again')!;
    act(() => button.click());
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('reports once, as kind page.crash, with the same code the person sees and no personal data', () => {
    const err = new Error('failed for jo@mail.com');
    act(() => root.render(<PageCrash error={err} retry={() => {}} />));
    act(() => root.render(<PageCrash error={err} retry={() => {}} />));
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ kind: 'page.crash', where: 'page.crash' });
    expect(host.textContent).toContain(reports[0].supportCode!);
    expect(JSON.stringify(reports[0])).not.toContain('jo@mail.com');
  });

  it('is fatal in Sentry, unlike an ordinary window error', () => {
    act(() => root.render(<PageCrash error={new Error('boom')} retry={() => {}} />));
    const level = (r: ErrorReport) => JSON.parse(buildEnvelope(r, { dsn: 'https://k@o1.ingest.de.sentry.io/1', app: 'landing', platform: 'web' }, 1).body.split('\n')[2]).level;
    expect(level(reports[0])).toBe('fatal');
    expect(level({ kind: 'crash', where: 'window.error', detail: {} })).toBe('error');
  });

  it('copes with a thrown value that is not an Error', () => {
    act(() => root.render(<PageCrash error={'just a string'} retry={() => {}} />));
    expect(host.textContent).toContain('Something went wrong on this page');
    expect(reports).toHaveLength(1);
  });
});

describe('the layout ErrorBoundary', () => {
  it('renders the same screen when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Bomb = () => {
      throw new Error('render failed');
    };
    act(() => root.render(<ErrorBoundary showDetails={false}><Bomb /></ErrorBoundary>));
    expect(host.textContent).toContain('Something went wrong on this page');
    expect(reports.some((r) => r.kind === 'page.crash')).toBe(true);
    spy.mockRestore();
  });
});
