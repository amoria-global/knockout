import { currencyFlagSrc } from '@/lib/currencyFlag';

/** The flag of a currency. Decorative (the code beside it names the currency), and nothing for a currency with no flag. */
export default function CurrencyFlag({ code, width = 20 }: { code: string | null | undefined; width?: number }) {
  const src = currencyFlagSrc(code);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden="true" width={width} height={Math.round((width * 2) / 3)}
      style={{ width, height: Math.round((width * 2) / 3), objectFit: 'cover', borderRadius: 2, boxShadow: '0 0 0 1px rgba(128,128,128,0.35)', flexShrink: 0 }} />
  );
}
