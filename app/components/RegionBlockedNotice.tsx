'use client';

/**
 * What a visitor sees when their place is kept out of an event, or could not be confirmed. It says so plainly and, when a
 * retry could help, offers one. It never shows a price, a stream link or a pay button.
 */
import React from 'react';
import type { RegionBlock } from '@/lib/regionBlock';

export default function RegionBlockedNotice({ block, onRetry, backHref = '/' }: { block: RegionBlock; onRetry?: () => void; backHref?: string }) {
  const canRetry = block.unknown && !!onRetry;
  return (
    <div role="alert" data-testid="region-blocked" className="mx-auto my-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#EEF2FB] text-[#083A85]" aria-hidden="true">
        <i className={`bi ${block.unknown ? 'bi-geo-alt' : 'bi-globe2'} text-2xl`} />
      </div>
      <h1 className="text-xl font-bold text-[#083A85]">{block.unknown ? 'We could not confirm your location' : 'Not available in your region'}</h1>
      <p className="mt-2 text-sm text-slate-600">{block.message}</p>
      <div className="mt-6 flex flex-col gap-2">
        {canRetry ? (
          <button type="button" onClick={onRetry} className="rounded-xl bg-[#083A85] px-5 py-3 text-sm font-bold text-white">
            Retry
          </button>
        ) : null}
        <a href={backHref} className={canRetry ? 'text-sm font-semibold text-[#083A85]' : 'rounded-xl bg-[#083A85] px-5 py-3 text-sm font-bold text-white'}>
          Go back
        </a>
      </div>
    </div>
  );
}
