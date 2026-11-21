import React from 'react';
import type { PolicyModel } from '@/lib/referral/copy';

/**
 * Presentational policy page in the Compact Glass look. Contrast: body text is white or slate-200 on the
 * navy surface (above 12:1); small accent text uses the light pink #FF7AC6 (above 7:1) and the brand pink
 * #F20C8F is kept for large marks only.
 */
export default function ReferralPolicyView({ model }: { model: PolicyModel }): React.JSX.Element {
  return (
    <main className="rp-root">
      <style>{`
        .rp-root{min-height:100vh;background:radial-gradient(1100px 500px at 15% -10%,rgba(242,12,143,.18),transparent 60%),radial-gradient(900px 500px at 90% 0%,rgba(8,58,133,.9),transparent 60%),#050d22;color:#f8fafc;padding:56px 16px 96px}
        .rp-wrap{max-width:760px;margin:0 auto}
        .rp-card{background:linear-gradient(160deg,rgba(255,255,255,.08),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:20px;box-shadow:0 12px 32px rgba(0,0,0,.35);backdrop-filter:blur(10px)}
        .rp-h1{font-size:clamp(28px,6vw,42px);line-height:1.12;font-weight:800;margin:0}
        .rp-h2{font-size:18px;font-weight:700;margin:0 0 12px}
        .rp-eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ff7ac6;font-weight:700}
        .rp-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04)}
        .rp-row+.rp-row{margin-top:8px}
        .rp-share{font-size:22px;font-weight:800}
        .rp-max{border-color:rgba(242,12,143,.6);background:linear-gradient(90deg,rgba(242,12,143,.16),rgba(8,58,133,.3))}
        .rp-step{display:flex;gap:12px;align-items:flex-start}
        .rp-step+.rp-step{margin-top:14px}
        .rp-num{flex:none;width:28px;height:28px;border-radius:50%;background:#083A85;border:1px solid rgba(255,255,255,.4);display:grid;place-items:center;font-weight:700;font-size:14px}
        .rp-p{color:#e2e8f0;line-height:1.7;margin:0}
        a.rp-link{color:#ff9fd6;text-decoration:underline}
        a.rp-link:focus-visible{outline:3px solid #ff7ac6;outline-offset:3px;border-radius:4px}
        .rp-stack>*+*{margin-top:16px}
        @media (min-width:640px){.rp-card{padding:28px}}
      `}</style>
      <div className="rp-wrap rp-stack">
        <header>
          <div className="rp-eyebrow">Connekyt</div>
          <h1 className="rp-h1" style={{ marginTop: 8 }}>{model.title}</h1>
          <p className="rp-p" style={{ marginTop: 12, fontSize: 18 }}>{model.intro}</p>
        </header>

        <section className="rp-card" aria-labelledby="rp-tiers">
          <h2 className="rp-h2" id="rp-tiers">{model.tiersTitle}</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {model.tiers.map((t) => (
              <li key={t.range} className={`rp-row${t.note && t.share === '90%' ? ' rp-max' : ''}`}>
                <span>
                  <strong>{t.range}</strong>
                  {t.note ? <span style={{ display: 'block', fontSize: 13, color: '#cbd5e1' }}>{t.note}</span> : null}
                </span>
                <span className="rp-share">{t.share}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rp-card" aria-labelledby="rp-rules">
          <h2 className="rp-h2" id="rp-rules">{model.rulesTitle}</h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {model.steps.map((s, i) => (
              <li key={i} className="rp-step">
                <span className="rp-num" aria-hidden="true">{i + 1}</span>
                <p className="rp-p">{s}</p>
              </li>
            ))}
          </ol>
          <p className="rp-p" style={{ marginTop: 16, color: '#cbd5e1' }}>{model.stepsFooter}</p>
        </section>

        {model.sections.map((s) => (
          <section key={s.h} className="rp-card">
            <h2 className="rp-h2">{s.h}</h2>
            <p className="rp-p">{s.p}</p>
          </section>
        ))}

        <section className="rp-card">
          <h2 className="rp-h2">{model.contactTitle}</h2>
          <p className="rp-p">{model.contact}</p>
        </section>
      </div>
    </main>
  );
}
