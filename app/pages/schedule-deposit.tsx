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
      <main style={{ minHeight: "100vh", background: "#f9fafb", paddingTop: 100, paddingBottom: 60 }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <div style={{
            background: "#fff", borderRadius: 16, boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
            padding: 32, textAlign: "center",
          }}>
            {success ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", background: "#dcfce7",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                }}>
                  <i className="bi bi-check2" style={{ fontSize: 32, color: "#15803d" }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                  Deposit received
                </h2>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4b5563", lineHeight: 1.55 }}>
                  Thanks for your payment. Your booking <strong>{ref}</strong> is now confirmed.
                  Your photographer has been notified and the receipt is on its way to{" "}
                  {email ? <strong>{email}</strong> : "your email"}.
                </p>
                <p style={{ margin: "16px 0 0", fontSize: 12.5, color: "#6b7280" }}>
                  Payment ref: <code style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>{success.refid}</code>
                </p>
              </>
            ) : (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #083A85 0%, #F20C8F 130%)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                }}>
                  <i className="bi bi-camera-fill" style={{ fontSize: 28, color: "#fff" }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                  Pay your booking deposit
                </h2>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6b7280" }}>
                  Confirm the 50% deposit to lock in your slot. The balance is
                  settled with the photographer at delivery.
                </p>

                <div style={{
                  marginTop: 20, padding: 16, background: "#f9fafb",
                  border: "1px solid #f0f2f5", borderRadius: 12, textAlign: "left",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {packageName}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                    {sym} {amount.toLocaleString(undefined, {
                      maximumFractionDigits: currency === "RWF" ? 0 : 2,
                      minimumFractionDigits: currency === "RWF" ? 0 : 2,
                    })}
                  </div>
                  {ref && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                      Booking ref: <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, border: "1px solid #e5e7eb" }}>{ref}</code>
                    </div>
                  )}
                </div>

                {!valid && (
                  <div style={{
                    marginTop: 14, padding: 10, background: "#fef2f2", color: "#991b1b",
                    border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, textAlign: "left",
                  }}>
                    This deposit link is missing required details. Re-open it from your
                    booking confirmation page on Schedule.
                  </div>
                )}

                {error && (
                  <div style={{
                    marginTop: 14, padding: 10, background: "#fef2f2", color: "#991b1b",
                    border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, textAlign: "left",
                  }}>{error}</div>
                )}

                <button
                  onClick={startPay}
                  disabled={!valid || creating}
                  style={{
                    marginTop: 18, width: "100%",
                    padding: "12px 18px", borderRadius: 10,
                    background: !valid || creating ? "#9ca3af" : "linear-gradient(135deg, #083A85 0%, #F20C8F 130%)",
                    color: "#fff", border: "none", fontWeight: 700, fontSize: 14.5,
                    cursor: !valid || creating ? "wait" : "pointer",
                  }}
                >
                  {creating ? "Connecting…" : `Pay deposit (${sym} ${amount.toLocaleString(undefined, { maximumFractionDigits: currency === "RWF" ? 0 : 2 })})`}
                </button>

                <p style={{ marginTop: 12, fontSize: 11.5, color: "#9ca3af" }}>
                  Powered by Connekyt · Secure mobile money + card payments
                </p>
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
