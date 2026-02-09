"use client";

import React from "react";

interface TextBlock {
  badge: {
    icon: string;
    label: string;
  };
  title: string;
  description: string;
  bulletPoints: string[];
  accentColor: string;
  backgroundColor?: string;
}

interface MissionStatementProps {
  sectionTitle?: string;
  sectionSubtitle?: string;
  blocks: TextBlock[];
  backgroundColor?: string;
}

const MissionStatement: React.FC<MissionStatementProps> = ({
  sectionTitle,
  sectionSubtitle,
  blocks,
  backgroundColor = "#ffffff",
}) => {
  return (
    <section
      className="mission-statement-section"
      style={{
        padding: "80px 40px",
        backgroundColor,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Section Header */}
      {(sectionTitle || sectionSubtitle) && (
        <div style={{ textAlign: "center", marginBottom: "50px", maxWidth: "700px", margin: "0 auto 50px" }}>
          {sectionTitle && (
            <h2
              style={{
                fontSize: "42px",
                fontWeight: 700,
                lineHeight: 1.15,
                margin: 0,
                marginBottom: "16px",
                color: "#1a1a2e",
              }}
            >
              <span
                style={{
                  background: "linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {sectionTitle}
              </span>
            </h2>
          )}
          {sectionSubtitle && (
            <p
              style={{
                fontSize: "16px",
                color: "#4a4a4a",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {sectionSubtitle}
            </p>
          )}
        </div>
      )}

      {/* Content Grid */}
      <div
        className="mission-statement-grid"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: blocks.length > 1 ? "1fr 1fr" : "1fr",
          gap: "40px",
        }}
      >
        {blocks.map((block, index) => (
          <div
            key={index}
            style={{
              backgroundColor: block.backgroundColor || "#E8F4F8",
              borderRadius: "20px",
              padding: "40px",
              position: "relative",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#fff",
                padding: "8px 20px",
                borderRadius: "30px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#063572",
                border: "2px solid #063572",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                marginBottom: "20px",
              }}
            >
              <i className={block.badge.icon} style={{ fontSize: "16px" }} />
              {block.badge.label}
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: "32px",
                fontWeight: 700,
                margin: 0,
                marginBottom: "16px",
                color: "#1a1a2e",
              }}
            >
              Our{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {block.title}
              </span>
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: "15px",
                color: "#4a4a4a",
                lineHeight: 1.7,
                margin: 0,
                marginBottom: "24px",
              }}
            >
              {block.description}
            </p>

            {/* Bullet Points */}
            {block.bulletPoints.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {block.bulletPoints.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: "14px",
                      color: "#4a4a4a",
                      lineHeight: 1.6,
                      marginBottom: "12px",
                      paddingLeft: "28px",
                      position: "relative",
                    }}
                  >
                    <i
                      className="bi bi-check-circle-fill"
                      style={{
                        position: "absolute",
                        left: 0,
                        color: block.accentColor,
                        fontSize: "18px",
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 992px) {
          .mission-statement-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
        }
        @media (max-width: 768px) {
          .mission-statement-section {
            padding: 60px 20px !important;
          }
          .mission-statement-section h2 {
            font-size: 32px !important;
          }
          .mission-statement-section h3 {
            font-size: 26px !important;
          }
        }
        @media (max-width: 480px) {
          .mission-statement-section {
            padding: 40px 16px !important;
          }
          .mission-statement-section h2 {
            font-size: 28px !important;
          }
          .mission-statement-section h3 {
            font-size: 22px !important;
          }
          .mission-statement-grid > div {
            padding: 28px 20px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default MissionStatement;
