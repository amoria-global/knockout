import { describe, it, expect } from 'vitest';
import { shouldAutosave, SUCCESS_SLIDE } from './autosave';

/**
 * Regression cover for the blank signup request: the closed onboarding wizard
 * on the login page autosaved, and with no session its fallback called
 * signup() with an empty form on every page load.
 */
const open = { serverSync: true, isOpen: true, finalized: false, currentSlide: 2 };

describe('shouldAutosave', () => {
  it('saves while an open, unfinished wizard is being filled', () => {
    expect(shouldAutosave(open)).toBe(true);
  });

  it('never saves while the wizard is closed, so no blank signup is sent', () => {
    expect(shouldAutosave({ ...open, isOpen: false })).toBe(false);
    expect(shouldAutosave({ ...open, isOpen: false, currentSlide: 0 })).toBe(false);
  });

  it('does not save without server sync, after finalising, or on the success slide', () => {
    expect(shouldAutosave({ ...open, serverSync: false })).toBe(false);
    expect(shouldAutosave({ ...open, finalized: true })).toBe(false);
    expect(shouldAutosave({ ...open, currentSlide: SUCCESS_SLIDE })).toBe(false);
  });
});
