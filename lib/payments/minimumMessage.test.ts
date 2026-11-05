import { describe, expect, it } from 'vitest';
import { minimumAmountMessage } from './minimumMessage';

describe('minimumAmountMessage', () => {
  it('shows the backend sentence as it is', () => {
    const m = 'This payment is below the minimum of 100 RWF that Mobile Money can process. Please choose a higher amount.';
    expect(minimumAmountMessage(m, 'USD')).toBe(m);
  });
  it('words the provider fallback without a hardcoded figure', () => {
    expect(minimumAmountMessage('Minimum amount is 100', 'USD')).toBe(
      'That amount is below the minimum Mobile Money can process in USD. Please enter a higher amount.',
    );
    expect(minimumAmountMessage('minimum amount', undefined)).not.toMatch(/\d/);
  });
  it('ignores other errors', () => {
    expect(minimumAmountMessage('Insufficient balance', 'RWF')).toBeNull();
    expect(minimumAmountMessage('', 'RWF')).toBeNull();
  });
});
