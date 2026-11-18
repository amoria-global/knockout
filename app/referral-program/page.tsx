import { getTranslations } from 'next-intl/server';
import { staticPageMetadata } from '@/lib/seo/seo';

export const metadata = staticPageMetadata({
  title: 'Photographer Referral Program',
  description: 'How the Connekyt Photographer Referral Program works: who can join, when a referral counts, the fee table and the 20-referral limit.',
  path: '/referral-program',
  index: true,
});

const FEE_ROWS: Array<[string, string, string]> = [
  ['rowDefault', 'rowDefaultFee', ''],
  ['rowFive', '', '25%'],
  ['rowStep', 'rowStepFee', ''],
  ['rowMax', '', '10%'],
];

export default async function ReferralProgramPage() {
  const t = await getTranslations('referral.policy');
  const sections = t.raw('sections') as Array<{ h: string; p: string[] }>;
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 16px 80px', color: '#0f172a' }}>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.15, fontWeight: 800, color: '#083A85', margin: 0 }}>{t('title')}</h1>
      <p style={{ color: '#475569', marginTop: 8, fontSize: 14 }}>{t('updated')}</p>
      <p style={{ fontSize: 18, lineHeight: 1.6, marginTop: 24 }}>{t('intro')}</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40 }}>{t('tableTitle')}</h2>
      <div style={{ overflowX: 'auto', marginTop: 12, border: '1px solid #e2e8f0', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th scope="col" style={{ padding: '12px 16px' }}>{t('colRefs')}</th>
              <th scope="col" style={{ padding: '12px 16px' }}>{t('colFee')}</th>
            </tr>
          </thead>
          <tbody>
            {FEE_ROWS.map(([refKey, feeKey, literal]) => (
              <tr key={refKey} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t(refKey)}</td>
                <td style={{ padding: '12px 16px' }}>{feeKey ? t(feeKey) : literal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sections.map((s, i) => (
        <section key={i} style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{i + 1}. {s.h}</h2>
          {s.p.map((para, j) => (
            <p key={j} style={{ lineHeight: 1.7, marginTop: 10, color: '#1e293b' }}>{para}</p>
          ))}
        </section>
      ))}
    </main>
  );
}
