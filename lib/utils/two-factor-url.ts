/**
 * The sign-in code page URL, built from a login answer that asked for a second factor.
 * Carries the signed challenge and the methods the account has; the page does the rest.
 */
export type TwoFactorMethod = 'TOTP' | 'EMAIL';

export interface TwoFactorLoginData {
  customerId?: string | null;
  challengeId?: string | null;
  twoFactorMethods?: string[] | null;
  twoFactorDefaultMethod?: string | null;
  maskedEmail?: string | null;
}

const asMethod = (m: unknown): TwoFactorMethod | null => (m === 'TOTP' || m === 'EMAIL' ? m : null);

export function buildTotpUrl(data: TwoFactorLoginData): string {
  const p = new URLSearchParams();
  if (data.customerId) p.set('customerId', String(data.customerId));
  if (data.challengeId) p.set('challengeId', String(data.challengeId));
  const methods = (data.twoFactorMethods ?? []).map(asMethod).filter((m): m is TwoFactorMethod => m !== null);
  if (methods.length) p.set('methods', methods.join(','));
  const def = asMethod(data.twoFactorDefaultMethod);
  if (def) p.set('defaultMethod', def);
  if (data.maskedEmail) p.set('maskedEmail', String(data.maskedEmail));
  return `/user/auth/verify-totp?${p.toString()}`;
}

export interface TwoFactorChallenge {
  challengeId: string;
  customerId: string;
  methods: TwoFactorMethod[];
  defaultMethod: TwoFactorMethod;
  maskedEmail?: string;
}

/** Reads the page's query string. An old link (customerId only) is an authenticator challenge. */
export function readChallenge(get: (key: string) => string | null): TwoFactorChallenge {
  const methods = (get('methods') ?? '').split(',').map(asMethod).filter((m): m is TwoFactorMethod => m !== null);
  const list: TwoFactorMethod[] = methods.length ? methods : ['TOTP'];
  const def = asMethod(get('defaultMethod'));
  return {
    challengeId: get('challengeId') ?? '',
    customerId: get('customerId') ?? '',
    methods: list,
    defaultMethod: def && list.includes(def) ? def : list[0],
    maskedEmail: get('maskedEmail') || undefined,
  };
}
