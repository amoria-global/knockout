/** Slide index of the wizard's success screen; nothing is left to save there. */
export const SUCCESS_SLIDE = 7;

export interface AutosaveGate {
  serverSync: boolean;
  isOpen: boolean;
  finalized: boolean;
  currentSlide: number;
}

/**
 * Whether the onboarding wizard's debounced background save may run.
 *
 * The login page keeps the wizard mounted while it is closed, and the hooks
 * run before `if (!isOpen) return null`. Without the isOpen check the save
 * fired five seconds after every login page load, found no session yet, and
 * fell back to signup() with the still empty form. Production logged a blank
 * POST /auth/signup ("Provide an email or phone number to register.") on
 * every visit. A closed wizard has nothing to save.
 */
export function shouldAutosave({ serverSync, isOpen, finalized, currentSlide }: AutosaveGate): boolean {
  return serverSync && isOpen && !finalized && currentSlide !== SUCCESS_SLIDE;
}
