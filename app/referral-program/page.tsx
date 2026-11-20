import { getLocale } from 'next-intl/server';
import { staticPageMetadata } from '@/lib/seo/seo';
import { policyModel } from '@/lib/referral/copy';
import ReferralPolicyView from './ReferralPolicyView';

export const metadata = staticPageMetadata({
  title: 'Photographer Referral Program',
  description: 'Refer photographers to Connekyt and earn up to 90% on every photo you sell. The milestones, when a referral counts and the 40 referral limit.',
  path: '/referral-program',
  index: true,
});

export default async function ReferralProgramPage() {
  const locale = await getLocale();
  return <ReferralPolicyView model={policyModel(locale)} />;
}
