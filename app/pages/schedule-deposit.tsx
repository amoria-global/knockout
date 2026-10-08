"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import XentriPayModal from "../components/XentriPayModal";

/**
 * Lands the buyer here after they confirm a Connekyt-package booking on
 * the Schedule app (https://appointment.jambolush.com/booking-confirmation
 * navigates here via the schedule backend's /api/connekyt/deposit/initiate
 * response).
 *
 * Query params:
 *   ref          - schedule appointment reference code (required)
 *   amount       - deposit amount in `currency` (required)
 *   currency     - abbreviation: RWF / USD / EUR / ...
 *   email        - buyer's email (best-effort)
 *   phone        - buyer's phone (best-effort)
 *   packageId    - Connekyt package id
 *   packageName  - human-readable package name
 *
 * Flow:
 *   1. Show summary card with package + amount + ref.
 *   2. On Pay → POST /api/public/schedule-deposit/create → get donationId.
 *   3. Open the existing XentriPayModal in `donation` mode against that
 *      donationId. Existing webhook + status-polling close the loop.
 *   4. On success → confirmation strip + link back to schedule.
 */

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL
    || "https://backend.connekyt.com").replace(/\/$/, "");

export default function ScheduleDepositPage() {
  const searchParams = useSearchParams();

  const ref = searchParams.get("ref") || "";
  const amount = Number(searchParams.get("amount") || "0");
  const currency = (searchParams.get("currency") || "RWF").toUpperCase();
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const packageId = searchParams.get("packageId") || "";
  const packageName = searchParams.get("packageName") || "Photography package";

  const [donationId, setDonationId] = useState<string | null>(null);
  const [currencyId, setCurrencyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showXentri, setShowXentri] = useState(false);
  const [success, setSuccess] = useState<{ refid: string } | null>(null);

  const valid = !!ref && amount > 0;

  const sym = useMemo(() => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      default: return currency;
    }
  }, [currency]);

  const startPay = async () => {
    if (!valid) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/public/schedule-deposit/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceCode: ref,
          amount,
          currency,
          email,
          phone,
          packageId,
          packageName,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.action !== 1) {
        throw new Error(j?.message || `HTTP ${res.status}`);
      }
      setDonationId(j.data.donationId);
      setCurrencyId(j.data.currencyId);
      setShowXentri(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not initiate payment");
    } finally {
      setCreating(false);
    }
  };

  // Some buyers land here straight from the schedule redirect with a
  // popup blocker on - so we DON'T auto-fire the payment. They click
  // the Pay button explicitly. This also gives them a chance to verify
  // the deposit amount before paying.

  return (
    <>
      <Navbar />
      <main className="sd-main">
        <style>{`
          .sd-main {
            min-height: 100vh;
            background: linear-gradient(180deg, #f0f4f9 0%, #f8fafc 100%);
            padding-top: clamp(84px, 12vw, 110px);
            padding-bottom: 60px;
            font-family: 'Pragati Narrow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .sd-wrap {
            max-width: 540px;
            margin: 0 auto;
            padding: 0 16px;
          }
          .sd-card {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 20px 50px -12px rgba(8, 28, 60, 0.12), 0 0 0 1px rgba(8, 58, 133, 0.06);
            padding: clamp(22px, 5vw, 36px);
            text-align: center;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(8, 58, 133, 0.08);
          }
          .sd-brand-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #083A85 0%, #F20C8F 60%, #03969C 100%);
          }
          .sd-badge-secure {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 999px;
            background: rgba(8, 58, 133, 0.06);
            color: #083A85;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 14px;
          }
          .sd-receipt {
            margin-top: 20px;
            padding: 18px 20px;
            background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
            border: 1px solid #dbeafe;
            border-radius: 16px;
            text-align: left;
            box-shadow: 0 4px 12px rgba(8, 58, 133, 0.03);
          }
          .sd-escrow {
            display: flex;
            gap: 9px;
            align-items: flex-start;
            margin-top: 14px;
            padding: 10px 12px;
            background: rgba(3, 150, 156, 0.06);
            border: 1px solid rgba(3, 150, 156, 0.2);
            border-radius: 10px;
            font-size: 12px;
            line-height: 1.45;
            color: #334155;
          }
          .sd-btn-primary {
            margin-top: 22px;
            width: 100%;
            min-height: 48px;
            padding: 13px 20px;
            border-radius: 12px;
            border: none;
            color: #ffffff;
            font-size: 15.5px;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
            box-shadow: 0 10px 24px -8px rgba(242, 12, 143, 0.5);
            font-family: inherit;
          }
          .sd-btn-primary:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 28px -8px rgba(242, 12, 143, 0.65);
          }
          .sd-btn-primary:disabled {
            background: #94a3b8 !important;
            box-shadow: none !important;
            cursor: not-allowed;
            opacity: 0.7;
          }
          @keyframes sd-spin { to { transform: rotate(360deg); } }
          @media (max-width: 600px) {
            .sd-wrap { padding: 0 12px; }
            .sd-card { padding: 22px 16px; border-radius: 20px; }
            .sd-receipt { padding: 14px 14px; }
          }
        `}</style>

        <div className="sd-wrap">
          <div className="sd-card">
            <div className="sd-brand-bar" aria-hidden="true" />

            {success ? (
              <div style={{ padding: "16px 0 8px" }}>
                <div style={{
                  width: 68, height: 68, borderRadius: "50%", background: "#dcfce7",
                  border: "2px solid #86efac",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                }}>
                  <i className="bi bi-check-lg" style={{ fontSize: 36, color: "#15803d" }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
                  Deposit Received!
                </h2>
                <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "#475569", lineHeight: 1.6 }}>
                  Thank you! Your booking <strong>{ref}</strong> is now confirmed. Your photographer has been notified and the receipt is on its way to{" "}
                  {email ? <strong>{email}</strong> : "your email"}.
                </p>
                <div style={{
                  marginTop: 18, padding: "8px 14px", background: "#f8fafc",
                  border: "1px solid #e2e8f0", borderRadius: 10, display: "inline-block",
                  fontSize: 12.5, color: "#64748b",
                }}>
                  Payment ref: <code style={{ color: "#083A85", fontWeight: 700 }}>{success.refid}</code>
                </div>
              </div>
            ) : (
              <>
                <div className="sd-badge-secure">
                  <i className="bi bi-shield-lock-fill" style={{ color: "#083A85" }}></i>
                  Connekyt Deposit Protection
                </div>

                <div style={{
                  width: 58, height: 58, borderRadius: "50%",
                  background: "linear-gradient(135deg, #083A85 0%, #F20C8F 130%)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                  boxShadow: "0 8px 20px -4px rgba(8, 58, 133, 0.35)",
                }}>
                  <i className="bi bi-camera-fill" style={{ fontSize: 24, color: "#fff" }} />
                </div>

                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  Pay Your Booking Deposit
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#64748b" }}>
                  Confirm the 50% deposit to lock in your photographer slot.
                </p>

                <div className="sd-receipt">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#083A85",
                      background: "#dbeafe", padding: "3px 9px", borderRadius: 999,
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {packageName}
                    </span>
                    {ref && (
                      <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
                        Ref: <code style={{ color: "#0f172a", fontWeight: 700 }}>{ref}</code>
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "block" }}>50% Initial Deposit:</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>Remaining balance settled at delivery</span>
                    </div>
                    <strong style={{ fontSize: 26, fontWeight: 800, color: "#083A85", letterSpacing: "-0.02em" }}>
                      {sym} {amount.toLocaleString(undefined, {
                        maximumFractionDigits: currency === "RWF" ? 0 : 2,
                        minimumFractionDigits: currency === "RWF" ? 0 : 2,
                      })}
                    </strong>
                  </div>

                  <div className="sd-escrow">
                    <i className="bi bi-shield-check" style={{ color: "#03969c", fontSize: 15, flexShrink: 0, marginTop: 1 }}></i>
                    <span>
                      <strong style={{ color: "#0f172a" }}>Escrow Protected:</strong> Held safely by Connekyt and released to the creator only after your event is delivered.
                    </span>
                  </div>
                </div>

                {!valid && (
                  <div style={{
                    marginTop: 16, padding: "12px 14px", background: "#fef2f2", color: "#991b1b",
                    border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, textAlign: "left",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 16, color: "#dc2626", flexShrink: 0 }}></i>
                    <span>This deposit link is missing required details. Re-open it from your booking confirmation page on Schedule.</span>
                  </div>
                )}

                {error && (
                  <div style={{
                    marginTop: 16, padding: "12px 14px", background: "#fef2f2", color: "#991b1b",
                    border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, textAlign: "left",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 16, color: "#dc2626", flexShrink: 0 }}></i>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  className="sd-btn-primary"
                  onClick={startPay}
                  disabled={!valid || creating}
                  style={{
                    background: !valid || creating ? "#94a3b8" : "linear-gradient(135deg, #083A85 0%, #F20C8F 130%)",
                  }}
                >
                  {creating ? (
                    <>
                      <span style={{
                        width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff", borderRadius: "50%",
                        animation: "sd-spin 0.8s linear infinite",
                      }} />
                      Connecting to gateway…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lock-fill" style={{ fontSize: 14 }}></i>
                      Pay Deposit ({sym} {amount.toLocaleString(undefined, { maximumFractionDigits: currency === "RWF" ? 0 : 2 })})
                    </>
                  )}
                </button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  256-bit Encrypted · Powered by Connekyt Payments
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {showXentri && donationId && currencyId && (
        <XentriPayModal
          isOpen={showXentri}
          onClose={() => setShowXentri(false)}
          onSuccess={(refid) => {
            setShowXentri(false);
            setSuccess({ refid });
          }}
          paymentType="donation"
          amount={amount}
          currencyCode={currency}
          currencyId={currencyId}
          donationId={donationId}
          viewerEmail={email}
          title="Booking deposit"
          subtitle={packageName + " · ref " + ref}
        />
      )}

      <Footer />
    </>
  );
}
