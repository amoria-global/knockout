/**
 * The plain-language message for a payment refused because it is under the minimum, or null if the error is something
 * else. The backend now checks the charged total BEFORE any provider is called and answers with its own sentence
 * ("This payment is below the minimum of 100 RWF that Mobile Money can process..."), which is shown as it is. The
 * provider-error wording is kept as the last fallback, without a number, because the minimum depends on the currency.
 */
export function minimumAmountMessage(raw: string, currencyCode?: string): string | null {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('below the minimum of')) return raw;
  if (lower.includes('minimum amount')) {
    return `That amount is below the minimum Mobile Money can process${currencyCode ? ` in ${currencyCode}` : ''}. Please enter a higher amount.`;
  }
  return null;
}
