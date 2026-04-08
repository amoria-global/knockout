"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const steps = [
  {
    num: 1,
    title: "Create Your Account",
    desc: "Sign up on Amoria Connekyt with your email or Google account. It only takes a minute. You'll receive a confirmation email to verify your address.",
    icon: "bi-person-plus",
    color: "#083A85",
  },
  {
    num: 2,
    title: "Verify Your Identity",
    desc: "Complete the KYC verification process by uploading your government-issued ID. This ensures trust and safety for you and your future clients.",
    icon: "bi-patch-check",
    color: "#0a4da3",
  },
  {
    num: 3,
    title: "Set Up Your Profile",
    desc: "Add your bio, location, specialties (wedding, portrait, commercial, etc.), and set your availability. A complete profile attracts more clients.",
    icon: "bi-person-gear",
    color: "#083A85",
  },
  {
    num: 4,
    title: "Upload Your Portfolio",
    desc: "Showcase your best work by uploading high-quality photos and videos. Your portfolio is the first thing clients see — make it count.",
    icon: "bi-images",
    color: "#0a4da3",
  },
  {
    num: 5,
    title: "Set Your Pricing",
    desc: "Define your packages, hourly rates, and service pricing. Be transparent — clients appreciate clear pricing with no hidden fees.",
    icon: "bi-tag",
    color: "#083A85",
  },
  {
    num: 6,
    title: "Start Accepting Bookings",
    desc: "You're live! Clients can now discover you, view your portfolio, and book your services. Manage everything from your dashboard.",
    icon: "bi-rocket-takeoff",
    color: "#0a4da3",
  },
];

const features = [
  { icon: "bi-speedometer2", title: "Dashboard Overview", desc: "Track bookings, earnings, and performance at a glance" },
  { icon: "bi-wallet2", title: "Manage Earnings", desc: "Withdraw funds via mobile money, bank transfer, or card" },
  { icon: "bi-collection", title: "Portfolio & Gallery", desc: "Organize and showcase your work with beautiful galleries" },
  { icon: "bi-send-check", title: "Photo Delivery", desc: "Deliver photos securely to clients through the platform" },
  { icon: "bi-chat-dots", title: "Client Communication", desc: "Message clients directly with our built-in chat system" },
  { icon: "bi-star", title: "Reviews & Ratings", desc: "Build your reputation with verified client reviews" },
];

const PhotographerGuide = () => {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;
      const newVisible = new Set<number>();
      stepRefs.current.forEach((ref, i) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          if (rect.top < vh * 0.75) newVisible.add(i);
        }
      });
      setVisibleSteps(newVisible);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`
        @keyframes pgWave1 {
          0%, 100% { d: path("M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"); }
          50% { d: path("M0,80 C240,20 480,100 720,40 C960,0 1200,100 1440,80 L1440,120 L0,120 Z"); }
        }
        @keyframes pgWave2 {
          0%, 100% { d: path("M0,80 C300,20 600,100 900,50 C1200,0 1350,80 1440,60 L1440,120 L0,120 Z"); }
          50% { d: path("M0,50 C300,100 600,20 900,70 C1200,120 1350,30 1440,80 L1440,120 L0,120 Z"); }
        }
        @keyframes pgDrift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-10px, -10px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes pgFloat1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pgFloat2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(10px); }
        }
        @keyframes pgIconFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.06; }
          50% { transform: translateY(-18px) rotate(8deg); opacity: 0.1; }
        }
        @keyframes pgPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
        }
        @keyframes pgScrollDot {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(8px); opacity: 0.8; }
        }

        .pg-step-card {
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .pg-step-card.right {
          transform: translateX(40px);
        }
        .pg-step-card.visible {
          opacity: 1;
          transform: translateX(0);
        }
        .pg-feature:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(8, 58, 133, 0.12);
        }
        @media (max-width: 768px) {
          .pg-timeline-row {
            flex-direction: column !important;
            gap: 0 !important;
          }
          .pg-timeline-left, .pg-timeline-right {
            width: 100% !important;
            text-align: left !important;
          }
          .pg-timeline-center {
            display: none !important;
          }
          .pg-step-card, .pg-step-card.right {
            transform: translateY(30px);
          }
          .pg-step-card.visible {
            transform: translateY(0);
          }
          .pg-features-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Navbar />

      {/* ===== ANIMATED HERO (half) ===== */}
      <div style={{
        position: "relative",
        paddingTop: "clamp(6rem, 10vw, 8rem)",
        paddingBottom: "clamp(2rem, 3vw, 3rem)",
        overflow: "hidden",
        background: "linear-gradient(160deg, #052047 0%, #083A85 40%, #0a4da3 70%, #103E83 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}>
        {/* Animated dot grid */}
        <div style={{ position: "absolute", inset: "-80px", backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px)", backgroundSize: "32px 32px", pointerEvents: "none", animation: "pgDrift 20s linear infinite" }} />

        {/* Floating gradient orbs */}
        <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(100,180,255,0.1) 0%, transparent 70%)", top: "10%", left: "-5%", filter: "blur(40px)", animation: "pgFloat1 8s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(80,140,255,0.08) 0%, transparent 70%)", bottom: "5%", right: "-3%", filter: "blur(40px)", animation: "pgFloat2 10s ease-in-out infinite", pointerEvents: "none" }} />

        {/* Floating camera icons */}
        {[
          { icon: "bi-camera", top: "15%", left: "10%", size: 22, delay: "0s", dur: "6s" },
          { icon: "bi-aperture", top: "25%", right: "12%", size: 18, delay: "1s", dur: "7s" },
          { icon: "bi-camera-reels", bottom: "20%", left: "15%", size: 20, delay: "2s", dur: "8s" },
          { icon: "bi-image", bottom: "30%", right: "10%", size: 16, delay: "0.5s", dur: "6.5s" },
          { icon: "bi-camera-video", top: "60%", left: "5%", size: 14, delay: "3s", dur: "9s" },
          { icon: "bi-camera2", top: "10%", right: "25%", size: 12, delay: "1.5s", dur: "7.5s" },
          { icon: "bi-camera", bottom: "15%", right: "30%", size: 16, delay: "4s", dur: "8s" },
          { icon: "bi-aperture", top: "45%", left: "25%", size: 13, delay: "2.5s", dur: "6s" },
        ].map((item, i) => (
          <i key={i} className={`bi ${item.icon}`} style={{
            position: "absolute",
            top: item.top,
            left: (item as Record<string, unknown>).left as string | undefined,
            right: (item as Record<string, unknown>).right as string | undefined,
            bottom: (item as Record<string, unknown>).bottom as string | undefined,
            fontSize: item.size,
            color: "rgba(255,255,255,0.06)",
            animation: `pgIconFloat ${item.dur} ease-in-out ${item.delay} infinite`,
            pointerEvents: "none",
          }} />
        ))}

        {/* Lens flare ring */}
        <div style={{ position: "absolute", width: "clamp(500px, 60vw, 900px)", height: "clamp(500px, 60vw, 900px)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.03)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", animation: "pgPulse 4s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "clamp(300px, 35vw, 500px)", height: "clamp(300px, 35vw, 500px)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", animation: "pgPulse 4s ease-in-out 2s infinite", pointerEvents: "none" }} />

        {/* Animated wave at bottom */}
        <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, zIndex: 3, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: "100%", height: "clamp(35px, 5vw, 60px)", display: "block" }}>
            <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" fill="#f8fafc" style={{ animation: "pgWave1 8s ease-in-out infinite" }} />
            <path d="M0,80 C300,20 600,100 900,50 C1200,0 1350,80 1440,60 L1440,120 L0,120 Z" fill="#f8fafc" opacity="0.5" style={{ animation: "pgWave2 6s ease-in-out infinite" }} />
          </svg>
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 4, maxWidth: "700px", margin: "0 auto", padding: "0 1.5rem 0" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "4px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "10px" }}>Amoria Connekyt</p>
          <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 800, color: "#fff", margin: "0 0 12px", fontFamily: "'Pragati Narrow', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            Turn Your Passion Into Income
          </h1>
          <p style={{ fontSize: "clamp(14px, 1.3vw, 16px)", color: "rgba(255,255,255,0.45)", margin: "0 0 24px", lineHeight: 1.6, maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
            Set up your profile, showcase your work, and start earning — all in 6 simple steps.
          </p>
        </div>

      </div>

      {/* ===== TIMELINE ===== */}
      <div id="timeline" style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(0.5rem, 1.5vw, 1rem) 1.5rem clamp(2rem, 4vw, 3rem)" }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(1.5rem, 3vw, 2rem)" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#083A85", marginBottom: "6px" }}>How It Works</p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: "'Pragati Narrow', sans-serif" }}>
            6 Simple Steps to Get Started
          </h2>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "2px", background: "linear-gradient(180deg, #083A85, rgba(8,58,133,0.1))", transform: "translateX(-50%)", display: "var(--timeline-line, block)" }} className="pg-timeline-center" />

          {steps.map((step, i) => {
            const isLeft = i % 2 === 0;
            const isVisible = visibleSteps.has(i);

            return (
              <div
                key={step.num}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="pg-timeline-row"
                style={{ display: "flex", alignItems: "center", marginBottom: i < steps.length - 1 ? "2.5rem" : 0, position: "relative" }}
              >
                {/* Left side */}
                <div className="pg-timeline-left" style={{ width: "47%", textAlign: isLeft ? "right" : "left" }}>
                  {isLeft && (
                    <div className={`pg-step-card ${isVisible ? "visible" : ""}`} style={{ display: "inline-block", textAlign: "left", background: "#fff", borderRadius: "16px", padding: "clamp(1.25rem, 2.5vw, 1.75rem)", boxShadow: "0 4px 20px rgba(8,58,133,0.06)", border: "1px solid rgba(8,58,133,0.06)", maxWidth: "380px", width: "100%", transition: "opacity 0.7s ease, transform 0.7s ease", transitionDelay: `${i * 0.1}s` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "12px", background: step.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <i className={`bi ${step.icon}`} style={{ fontSize: "1.1rem", color: "#fff" }}></i>
                        </div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Pragati Narrow', sans-serif" }}>{step.title}</h3>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                    </div>
                  )}
                </div>

                {/* Center — step number */}
                <div className="pg-timeline-center" style={{ width: "6%", display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isVisible ? step.color : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "0.85rem", fontFamily: "'Pragati Narrow', sans-serif", transition: "background 0.5s ease", boxShadow: isVisible ? `0 4px 12px ${step.color}40` : "none" }}>
                    {step.num}
                  </div>
                </div>

                {/* Right side */}
                <div className="pg-timeline-right" style={{ width: "47%", textAlign: isLeft ? "left" : "right" }}>
                  {!isLeft && (
                    <div className={`pg-step-card right ${isVisible ? "visible" : ""}`} style={{ display: "inline-block", textAlign: "left", background: "#fff", borderRadius: "16px", padding: "clamp(1.25rem, 2.5vw, 1.75rem)", boxShadow: "0 4px 20px rgba(8,58,133,0.06)", border: "1px solid rgba(8,58,133,0.06)", maxWidth: "380px", width: "100%", transition: "opacity 0.7s ease, transform 0.7s ease", transitionDelay: `${i * 0.1}s` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "12px", background: step.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <i className={`bi ${step.icon}`} style={{ fontSize: "1.1rem", color: "#fff" }}></i>
                        </div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Pragati Narrow', sans-serif" }}>{step.title}</h3>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== DASHBOARD FEATURES ===== */}
      <div style={{ background: "linear-gradient(180deg, #f0f4fa 0%, #f8fafc 100%)", padding: "clamp(3rem, 6vw, 5rem) 1.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(2rem, 4vw, 3rem)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#083A85", marginBottom: "6px" }}>Your Dashboard</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: "'Pragati Narrow', sans-serif" }}>
              Everything You Need to Succeed
            </h2>
          </div>

          <div className="pg-features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
            {features.map((f) => (
              <div key={f.title} className="pg-feature" style={{ background: "#fff", borderRadius: "14px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(8,58,133,0.05)", border: "1px solid rgba(8,58,133,0.05)", transition: "all 0.3s ease", cursor: "default" }}>
                <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(8,58,133,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <i className={`bi ${f.icon}`} style={{ fontSize: "1.1rem", color: "#083A85" }}></i>
                </div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px", fontFamily: "'Pragati Narrow', sans-serif" }}>{f.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PhotographerGuide;
