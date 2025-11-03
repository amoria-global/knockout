"use client";

import React from "react";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import Link from "next/link";

// Decorative Dot Component
const DecorativeDot = ({
  size,
  color,
  top,
  bottom,
  left,
  right,
  delay = 0
}: {
  size: number;
  color: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  delay?: number;
}) => (
  <div
    style={{
      position: 'absolute',
      top,
      bottom,
      left,
      right,
      zIndex: 0,
      animation: `float ${3 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  >
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 1px 2px rgba(0, 0, 0, 0.1)`,
        opacity: 0.8,
        transition: 'all 0.3s ease',
      }}
    />
  </div>
);

const PortfolioTips = () => {
  const tips = [
    {
      icon: "bi-palette-fill",
      iconColor: "#FFFFFF",
      gradient: "linear-gradient(135deg, #F97316 0%, #FF6B6B 100%)",
      title: "Show Your Signature Style",
      description: "Highlight what makes your photos unique—lighting, emotion, or composition. Consistency builds your brand identity.",
      decorativeIcon: "bi-brush"
    },
    {
      icon: "bi-stars",
      iconColor: "#FFFFFF",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #C084FC 100%)",
      title: "Curate, Don't Overload",
      description: "Pick your top 10–20 photos that best represent your quality and creativity. Less is more when done right.",
      decorativeIcon: "bi-gem"
    },
    {
      icon: "bi-calendar-event",
      iconColor: "#FFFFFF",
      gradient: "linear-gradient(135deg, #103E83 0%, #0D99FF 100%)",
      title: "Add Event Diversity",
      description: "Include samples from weddings, concerts, birthdays, and corporate events to show your versatility.",
      decorativeIcon: "bi-calendar-check"
    },
    {
      icon: "bi-chat-quote-fill",
      iconColor: "#FFFFFF",
      gradient: "linear-gradient(135deg, #FF6B6B 0%, #FF8E8C 100%)",
      title: "Describe Your Shots",
      description: "Write brief captions explaining your creative approach or story behind each image.",
      decorativeIcon: "bi-pencil"
    },
    {
      icon: "bi-star-fill",
      iconColor: "#FFFFFF",
      gradient: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
      title: "Engage with Testimonials",
      description: "Include client reviews to strengthen your portfolio's trustworthiness and appeal.",
      decorativeIcon: "bi-heart-fill"
    },
    {
      icon: "bi-arrow-repeat",
      iconColor: "#FFFFFF",
      gradient: "linear-gradient(135deg, #4CAF50 0%, #81C784 100%)",
      title: "Stay Updated",
      description: "Regularly replace old projects with recent work that reflects your growth and trends.",
      decorativeIcon: "bi-arrow-clockwise"
    }
  ];

  return (
    <div className="portfolio-tips-page">
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-8px);
            opacity: 0.95;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-5deg);
          }
          75% {
            transform: rotate(5deg);
          }
        }

        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes slideInOut {
          0%, 100% {
            transform: translateX(-10px);
            opacity: 0.5;
          }
          50% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .tip-card {
          animation: slideInUp 0.6s ease-out forwards;
          transition: all 0.3s ease;
        }

        .tip-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(16, 62, 131, 0.15) !important;
        }

        .tip-icon {
          font-size: 40px;
          transition: transform 0.3s ease;
        }

        .tip-card:hover .tip-icon {
          transform: scale(1.15) rotate(5deg);
        }

        .tip-image {
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .tip-card:hover .tip-image {
          transform: scale(1.05);
        }

        .cta-button {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .cta-button:hover::before {
          width: 300px;
          height: 300px;
        }

        .portfolio-grid-item {
          position: relative;
          overflow: hidden;
          border-radius: 1.25rem;
          transition: transform 0.3s ease;
        }

        .portfolio-grid-item:hover {
          transform: scale(1.05);
        }

        .portfolio-grid-item::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(16, 62, 131, 0.8), rgba(249, 115, 22, 0.6));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .portfolio-grid-item:hover::after {
          opacity: 1;
        }
      `}</style>

      <Navbar />

      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #052047 0%, #103E83 50%, #0D99FF 100%)',
          position: 'relative',
          padding: '100px 20px 120px',
          overflow: 'hidden',
          color: 'white',
        }}
      >
        {/* Decorative floating dots */}
        <DecorativeDot size={80} color="rgba(129, 231, 234, 0.3)" top="10%" left="5%" delay={0} />
        <DecorativeDot size={60} color="rgba(249, 115, 22, 0.3)" top="20%" right="8%" delay={0.5} />
        <DecorativeDot size={100} color="rgba(255, 255, 255, 0.1)" bottom="15%" left="10%" delay={1} />
        <DecorativeDot size={70} color="rgba(129, 231, 234, 0.2)" bottom="25%" right="15%" delay={1.5} />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '700',
              marginBottom: '24px',
              lineHeight: '1.2',
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            Perfect Your Portfolio: Capture Clients' Hearts Before the Camera Clicks 
          </h1>

          <p
            style={{
              fontSize: '18px',
              fontWeight: '400',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '40px',
              maxWidth: '800px',
              margin: '0 auto 40px',
            }}
          >
            Learn how to design, organize, and showcase your photography work to attract more clients and shine on Amoria Connect.
          </p>

          <Link href="/user/auth/signup-type?type=photographer">
            <button
              className="cta-button"
              style={{
                background: 'linear-gradient(90deg, #041DC0 0%, #FF6363 0%, #7763FF 100%)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                padding: '14px 40px',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(119, 99, 255, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 30px rgba(119, 99, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(119, 99, 255, 0.4)';
              }}
            >
              Upgrade Your Portfolio →
            </button>
          </Link>
        </div>

        {/* Hero Illustration */}
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            right: '-5%',
            width: '400px',
            height: '400px',
            opacity: 0.15,
            pointerEvents: 'none',
          }}
        >
          <img
            src="/camman.png"
            alt="Photographer illustration"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      </section>

      {/* Tip Cards Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundColor: '#F9FAFB',
          position: 'relative',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <h2
            style={{
              fontSize: '45px',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '16px',
              color: '#103E83',
            }}
          >
            Master Your Portfolio Game
          </h2>

          <p
            style={{
              fontSize: '18px',
              textAlign: 'center',
              color: '#6B7280',
              marginBottom: '60px',
              maxWidth: '700px',
              margin: '0 auto 60px',
            }}
          >
            Follow these proven strategies to build a portfolio that stands out and wins clients
          </p>

          {/* Tip Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '30px',
            }}
          >
            {tips.map((tip, index) => (
              <div
                key={index}
                className="tip-card"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '1.25rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                  animationDelay: `${index * 0.1}s`,
                  border: '3px solid rgba(16, 62, 131, 0.1)',
                }}
              >
                {/* Gradient Header with Visual Images */}
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    background: tip.gradient,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Card-specific visual content */}
                  {index === 0 && (
                    /* Signature Style - Camera and photos */
                    <>
                      <div style={{ position: 'absolute', top: '30px', left: '30px', width: '50px', height: '45px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', animation: 'bounce 2s ease-in-out infinite' }}>
                        <div style={{ width: '100%', height: '60%', background: 'linear-gradient(135deg, #FFA500, #FF6B6B)', borderRadius: '8px 8px 0 0' }} />
                      </div>
                      <div style={{ position: 'absolute', top: '50px', right: '25px', width: '45px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transform: 'rotate(10deg)', animation: 'bounce 2s ease-in-out infinite 0.5s' }}>
                        <div style={{ width: '100%', height: '60%', background: 'linear-gradient(135deg, #FF6B6B, #F97316)', borderRadius: '8px 8px 0 0' }} />
                      </div>
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="white" style={{ animation: 'pulse 3s ease-in-out infinite' }}>
                        <path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                        <circle cx="12" cy="12" r="3.2" fill="white"/>
                      </svg>
                    </>
                  )}

                  {index === 1 && (
                    /* Curate - Photo grid */
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '20px' }}>
                        {[...Array(9)].map((_, i) => (
                          <div key={i} style={{ width: '50px', height: '50px', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', animation: `fadeInOut ${0.8 + i * 0.2}s ease-in-out infinite` }}>
                            <div style={{ width: '100%', height: '70%', background: i % 3 === 0 ? 'linear-gradient(135deg, #C084FC, #8B5CF6)' : i % 2 === 0 ? 'linear-gradient(135deg, #A78BFA, #8B5CF6)' : 'linear-gradient(135deg, #DDD6FE, #C084FC)', borderRadius: '8px 8px 0 0' }} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {index === 2 && (
                    /* Event Diversity - Calendar with icons */
                    <>
                      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: '140px', animation: 'pulse 2.5s ease-in-out infinite' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', backgroundColor: '#0D99FF', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', animation: 'bounce 2s ease-in-out infinite 0s' }}>💼</div>
                          <div style={{ width: '30px', height: '30px', backgroundColor: '#103E83', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', animation: 'bounce 2s ease-in-out infinite 0.2s' }}>🎵</div>
                          <div style={{ width: '30px', height: '30px', backgroundColor: '#0D99FF', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', animation: 'bounce 2s ease-in-out infinite 0.4s' }}>💍</div>
                          <div style={{ width: '30px', height: '30px', backgroundColor: '#103E83', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', animation: 'bounce 2s ease-in-out infinite 0.6s' }}>🎂</div>
                          <div style={{ width: '30px', height: '30px', backgroundColor: '#0D99FF', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', animation: 'bounce 2s ease-in-out infinite 0.8s' }}>🎪</div>
                          <div style={{ width: '30px', height: '30px', backgroundColor: '#103E83', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', animation: 'bounce 2s ease-in-out infinite 1s' }}>🎭</div>
                        </div>
                      </div>
                    </>
                  )}

                  {index === 3 && (
                    /* Describe Shots - Text bubbles */
                    <>
                      <div style={{ position: 'absolute', top: '25px', left: '20px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '8px 12px', maxWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'slideInOut 2s ease-in-out infinite' }}>
                        <div style={{ height: '4px', backgroundColor: '#FF8E8C', borderRadius: '2px', marginBottom: '4px' }} />
                        <div style={{ height: '4px', backgroundColor: '#FFB3B3', borderRadius: '2px', width: '80%', marginBottom: '4px' }} />
                        <div style={{ height: '4px', backgroundColor: '#FFB3B3', borderRadius: '2px', width: '60%' }} />
                      </div>
                      <div style={{ position: 'absolute', bottom: '30px', right: '20px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '8px 12px', maxWidth: '100px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'slideInOut 2s ease-in-out infinite 1.5s' }}>
                        <div style={{ height: '4px', backgroundColor: '#FF6B6B', borderRadius: '2px', marginBottom: '4px', width: '90%' }} />
                        <div style={{ height: '4px', backgroundColor: '#FF8E8C', borderRadius: '2px', width: '70%' }} />
                      </div>
                      <i className="bi-pencil-square" style={{ fontSize: '60px', color: 'white', animation: 'shake 1s ease-in-out infinite' }} />
                    </>
                  )}

                  {index === 4 && (
                    /* Testimonials - Star ratings */
                    <>
                      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'pulse 2s ease-in-out infinite' }}>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className="bi-star-fill" style={{ fontSize: '20px', color: '#FFD700', animation: `bounce 1.5s ease-in-out infinite ${i * 0.1}s` }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className="bi-star-fill" style={{ fontSize: '20px', color: i < 4 ? '#FFD700' : '#E0E0E0', animation: `bounce 1.5s ease-in-out infinite ${i * 0.1 + 0.2}s` }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className="bi-star-fill" style={{ fontSize: '20px', color: '#FFD700', animation: `bounce 1.5s ease-in-out infinite ${i * 0.1 + 0.4}s` }} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {index === 5 && (
                    /* Stay Updated - Circular refresh */
                    <>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '100px', height: '100px', border: '8px solid rgba(255, 255, 255, 0.9)', borderRadius: '50%', borderTopColor: 'rgba(255, 255, 255, 0.3)', animation: 'spin 3s linear infinite' }} />
                        <i className="bi-arrow-clockwise" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '40px', color: 'white' }} />
                      </div>
                      <div style={{ position: 'absolute', top: '20px', left: '25px', width: '35px', height: '35px', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        <div style={{ width: '100%', height: '60%', background: 'linear-gradient(135deg, #81C784, #4CAF50)', borderRadius: '6px 6px 0 0' }} />
                      </div>
                      <div style={{ position: 'absolute', bottom: '25px', right: '30px', width: '35px', height: '35px', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        <div style={{ width: '100%', height: '60%', background: 'linear-gradient(135deg, #66BB6A, #81C784)', borderRadius: '6px 6px 0 0' }} />
                      </div>
                    </>
                  )}
                </div>

                {/* Card Content */}
                <div style={{ padding: '24px' }}>
                  <h3
                    style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      marginBottom: '12px',
                      color: '#103E83',
                    }}
                  >
                    {tip.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: '#6B7280',
                      margin: 0,
                    }}
                  >
                    {tip.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: '50px',
            }}
          >
            <h2
              style={{
                fontSize: '45px',
                fontWeight: '700',
                marginBottom: '16px',
                background: 'linear-gradient(90deg, #103E83 0%, #F97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Your Work, Your Identity
            </h2>

            <p
              style={{
                fontSize: '18px',
                color: '#6B7280',
              }}
            >
              Showcase your best work in stunning portfolios that tell your story
            </p>
          </div>

          {/* Portfolio Grid Mockup */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="portfolio-grid-item"
                style={{
                  height: '420px',
                  borderRadius: '1.5rem',
                  backgroundColor: '#ffffff',
                  border: '2px solid #909091',
                  boxShadow: '0 10px 30px rgba(16, 62, 131, 0.2), 0 0 0 1px rgba(16, 62, 131, 0.05)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Top 40% - Individual card images */}
                <div
                  style={{
                    height: '40%',
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(16, 62, 131, 0.15)',
                  }}
                >
                  <img
                    src={`/card${item}.png`}
                    alt={`Portfolio ${item}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                {/* Middle 30% - pro.png (same for all) */}
                <div
                  style={{
                    height: '30%',
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(16, 62, 131, 0.15)',
                  }}
                >
                  <img
                    src="/pro.png"
                    alt="Professional work"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                {/* Bottom 30% - pro1.png (same for all) */}
                <div
                  style={{
                    height: '30%',
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(16, 62, 131, 0.15)',
                  }}
                >
                  <img
                    src="/pro1.png"
                    alt="Professional showcase"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #052047 0%, #103E83 100%)',
          padding: '80px 20px',
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
        }}
      >
        {/* Decorative dots */}
        <DecorativeDot size={120} color="rgba(249, 115, 22, 0.2)" top="10%" left="5%" delay={0} />
        <DecorativeDot size={90} color="rgba(129, 231, 234, 0.2)" bottom="10%" right="5%" delay={0.8} />

        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontSize: '42px',
              fontWeight: '700',
              marginBottom: '20px',
              lineHeight: '1.2',
            }}
          >
            Your Talent Deserves the Spotlight 
          </h2>

          <p
            style={{
              fontSize: '18px',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '40px',
            }}
          >
            Start building a stunning portfolio on Amoria Connect today, and let your photos speak for you.
          </p>

          <Link href="/user/auth/signup-type?type=photographer">
            <button
              className="cta-button"
              style={{
                background: 'linear-gradient(90deg, #041DC0 0%, #FF6363 0%, #7763FF 100%)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '700',
                padding: '16px 50px',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                boxShadow: '0 6px 25px rgba(119, 99, 255, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 35px rgba(119, 99, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(119, 99, 255, 0.4)';
              }}
            >
              Create My Portfolio Now →
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PortfolioTips;
