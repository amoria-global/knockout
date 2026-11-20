import raw from '@/contract/referral-copy.json';

/**
 * The one source of referral wording. contract/referral-copy.json is owned by the backend and copied here
 * verbatim, so the policy page, the sign-up helper text and the footer say what the app, the emails and the
 * Help article say. sw, rw, fr and es are drafts awaiting native-speaker review.
 */
export type ReferralCopy = Record<string, string>;

const all = raw as unknown as Record<string, ReferralCopy>;

/** Minimum first sale shown to guests, in USD (the backend minimum). */
export const MIN_QUALIFYING_LABEL = 'USD 5';

export const TIERS: ReadonlyArray<{ from: number; to: number | null; share: number }> = [
  { from: 0, to: 9, share: 70 },
  { from: 10, to: 19, share: 75 },
  { from: 20, to: 29, share: 80 },
  { from: 30, to: 39, share: 85 },
  { from: 40, to: null, share: 90 },
];

export function referralCopy(locale: string | undefined): ReferralCopy {
  const base = all.en;
  const chosen = locale && all[locale] ? all[locale] : base;
  return { ...base, ...chosen };
}

export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export interface PolicyModel {
  title: string;
  intro: string;
  tiersTitle: string;
  tiers: Array<{ range: string; share: string; note: string | null }>;
  rulesTitle: string;
  steps: string[];
  stepsFooter: string;
  sections: Array<{ h: string; p: string }>;
  contactTitle: string;
  contact: string;
}

export function policyModel(locale: string | undefined): PolicyModel {
  const c = referralCopy(locale);
  const tiers = TIERS.map((t, i) => ({
    range: t.to === null ? fmt(c.tierExact, { n: t.from }) : fmt(c.tierRange, { from: t.from, to: t.to }),
    share: `${t.share}%`,
    note: i === 0 ? c.tierStarting : t.to === null ? c.tierMax : null,
  }));
  return {
    title: c.policyTitle,
    intro: c.policyIntro,
    tiersTitle: c.policyTiersTitle,
    tiers,
    rulesTitle: c.policyRulesTitle,
    steps: [c.step1, c.step2, fmt(c.step3, { min: MIN_QUALIFYING_LABEL })],
    stepsFooter: c.stepsFooter,
    sections: [
      { h: c.policyScopeTitle, p: c.policyScope },
      { h: c.policyFraudTitle, p: c.policyFraud },
      { h: c.policyCapTitle, p: c.policyCap },
      { h: c.policyPermanenceTitle, p: c.policyPermanence },
      { h: c.policyGrandfatherTitle, p: c.policyGrandfather },
    ],
    contactTitle: c.policyContactTitle,
    contact: c.policyContact,
  };
}
