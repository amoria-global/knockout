"use client";

import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

// Decorative Dot Component with enhanced styling
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

// Dot Rectangle Border Component
const DotRectangleBorder = ({
  width = '100%',
  height = '200px',
  position = 'relative',
  top,
  bottom,
  left,
  right,
}: {
  width?: string;
  height?: string;
  position?: 'relative' | 'absolute';
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}) => {
  // Generate random dots along the border
  const generateBorderDots = () => {
    const dots = [];
    const dotCount = 40;
    const colors = ['#063572', '#2196F3', '#4FC3F7', '#81E7EA'];
    const sizes = [4, 5, 6, 7, 8];

    for (let i = 0; i < dotCount; i++) {
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      const position = Math.random() * 100; // position along the side (%)
      const offset = Math.random() * 20 - 10; // random offset from border (-10px to +10px)

      let dotStyle: React.CSSProperties = {
        position: 'absolute',
        zIndex: 0,
      };

      switch (side) {
        case 0: // top
          dotStyle.top = `${offset}px`;
          dotStyle.left = `${position}%`;
          break;
        case 1: // right
          dotStyle.right = `${offset}px`;
          dotStyle.top = `${position}%`;
          break;
        case 2: // bottom
          dotStyle.bottom = `${offset}px`;
          dotStyle.left = `${position}%`;
          break;
        case 3: // left
          dotStyle.left = `${offset}px`;
          dotStyle.top = `${position}%`;
          break;
      }

      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const delay = Math.random() * 2;

      dots.push(
        <div
          key={i}
          style={{
            ...dotStyle,
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
            }}
          />
        </div>
      );
    }
    return dots;
  };

  return (
    <div
      style={{
        position,
        width,
        height,
        top,
        bottom,
        left,
        right,
        pointerEvents: 'none',
      }}
    >
      {generateBorderDots()}
    </div>
  );
};

const About = () => {
  return (
    <div className="about-page">
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
      `}</style>
      <Navbar />

      {/* Header Section */}
      <section
        style={{
            backgroundColor: '#f0f4f8',
          position: 'relative',
          padding: '60px 20px',
          overflow: 'hidden',
        }}
      >
        {/* Top Wave */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '60px',
             background: 'linear-gradient(180deg, #81E7EA 0%, #063572 100%)',
            clipPath: 'ellipse(100% 100% at 50% 0%)',
          }}
        />

        {/* Bottom Wave */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
             background: 'linear-gradient(180deg, #81E7EA 0%, #063572 100%)',
            clipPath: 'ellipse(100% 100% at 50% 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <h1
            style={{
              fontSize: '50px',
              fontWeight: 700,
              margin: 0,
              lineHeight: '1.05',
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: '#FF6B6B' }}>About Us:</span>{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #FF6B6B 0%, #C44569 30%, #8B5CF6 70%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Capturing Stories, Connecting Moments
            </span>
          </h1>
        </div>
      </section>

      {/* Mission Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundColor: '#ffffff',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Decorative Dot Rectangle Border */}
        <DotRectangleBorder
          width="95%"
          height="calc(100% - 40px)"
          position="absolute"
          top="20px"
          left="2.5%"
        />

        <div
          style={{
            maxWidth: '1080px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '60px',
            position: 'relative',
            zIndex: 1,
            padding: '0 20px',
          }}
        >
          {/* Text Content - Left Side */}
          <div style={{
            flex: '1',
            maxWidth: '500px',
          }}>
            {/* Heading now above the text */}
            <h2
              style={{
                fontSize: '30px',
                fontWeight: 700,
                marginBottom: '19.5px',
                color: '#083A85',
                lineHeight: '1.05',
                textAlign: 'left',
                letterSpacing: '-0.02em',
              }}
            >
              Amoria connekyt is where vision meets visibility
            </h2>

            <p
              style={{
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: '1.65',
                color: '#1f1d1d',
                marginBottom: '14px',
                textAlign: 'left',
              }}
            >
              At Amoria ConneKt, we believe every photo holds a story and every story deserves a stage.
              Our platform empowers passionate creators, especially photographers, to showcase their unique
              perspective and artistry. Whether it's an event, a personal milestone, or a creative shoot,
              we help turn simple clicks into powerful narratives.
            </p>

            <p
              style={{
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: '1.65',
                color: '#1f1d1d',
                marginBottom: '0',
                textAlign: 'left',
              }}
            >
              We build tools and experiences that make capturing and sharing moments seamless and meaningful.
            </p>
          </div>

          {/* Visual/Image with Background - Right Side */}
          <div
            style={{
              position: 'relative',
              flex: '1',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: '600px',
            }}
          >
            {/* Blue Background Card */}
            <div
              style={{
                position: 'relative',
                backgroundColor: '#E8F4F8',
                borderRadius: '30px',
                padding: '50px 40px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '500px',
              }}
            >
              {/* Main Illustration */}
              <img
                src="/about.png"
                alt="Photographer with camera illustration"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundColor: '#f8f9fa',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '1080px',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          {/* Main Heading */}
          <h2
            style={{
              fontSize: '50px',
              fontWeight: 700,
              marginBottom: '19.5px',
              lineHeight: '1.05',
              letterSpacing: '-0.02em',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              We bring your events
            </span>
            <br />
            <span style={{ color: '#000' }}>
              to life with seamless streaming and media solutions
            </span>
          </h2>

          {/* Subtext */}
          <p
            style={{
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: '1.65',
              color: '#1f1d1d',
              marginBottom: '30px',
              maxWidth: '800px',
              margin: '0 auto 30px',
            }}
          >
            Experience powerful features for photography booking, livestreaming, and media sharing made for every moment that matters
          </p>

          {/* CTA Button */}
          <button
            style={{
              background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              padding: '11.25px 25.5px',
              border: 'none',
              borderRadius: '37.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
            }}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* App Showcase Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundColor: '#E8F4F8',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: '1080px',
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minHeight: '500px',
          }}
        >
          {/* Desktop Browser Mockup (Background) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '700px',
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              padding: '0',
              overflow: 'hidden',
            }}
          >
            {/* Browser Top Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                backgroundColor: '#fff',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
              </div>

              {/* Navigation Menu */}
              <div
                style={{
                  display: 'flex',
                  gap: '40px',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>Home</span>
                <span style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>About</span>
                <span style={{ fontSize: '15px', color: '#666', fontWeight: '500' }}>Contact</span>
              </div>
            </div>

            {/* Browser Content Area */}
            <div
              style={{
                padding: '30px',
                minHeight: '350px',
                backgroundColor: '#f3f4f6',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Search Bar at Top */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  maxWidth: '280px',
                  height: '38px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '8px',
                  padding: '0 12px',
                  marginBottom: '25px',
                }}
              >
                <i className="bi bi-search" style={{ fontSize: '14px', color: '#9ca3af' }}></i>
                <div style={{ flex: 1, height: '18px', backgroundColor: '#d1d5db', borderRadius: '4px' }} />
              </div>

              {/* Content Blocks */}
              <div style={{ display: 'flex', gap: '18px' }}>
                {/* Left Section - Two stacked blocks */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ height: '65px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
                  <div style={{ height: '65px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
                </div>

                {/* Middle Section - Two stacked blocks */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ height: '65px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
                  <div style={{ height: '65px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
                </div>

                {/* Right Section - Content blocks */}
                <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ height: '35px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
                  <div style={{ height: '48px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
                  <div style={{ height: '35px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Phone Mockup (Overlaying) - iPhone 14 Pro */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '240px',
              height: '500px',
              backgroundColor: '#1a1a1a',
              borderRadius: '35px',
              padding: '6px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              zIndex: 10,
              border: '2px solid #2a2a2a',
            }}
          >
            {/* Phone Screen */}
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#fff',
                borderRadius: '30px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Dynamic Island (iPhone 14 Pro) */}
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '85px',
                  height: '26px',
                  backgroundColor: '#000',
                  borderRadius: '16px',
                  zIndex: 20,
                  boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                {/* Front Camera */}
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                  }}
                />
              </div>

              {/* Phone Content - Empty (content will be added later) */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff' }}>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        <div
          style={{
            maxWidth: '1080px',
            margin: '0 auto',
            display: 'flex',
            gap: '60px',
            alignItems: 'flex-start',
            padding: '0 20px',
          }}
        >
          {/* Left Side - Main Title and Description */}
          <div
            style={{
              flex: '1',
              maxWidth: '450px',
            }}
          >
            <h2
              style={{
                fontSize: '50px',
                fontWeight: 700,
                marginBottom: '19.5px',
                lineHeight: '1.05',
                letterSpacing: '-0.02em',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Our Journey of Progress & Possibility
              </span>
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  color: '#1f1d1d',
                  marginBottom: '14px',
                }}
              >
                Every step we've taken reflects our commitment to meaningful innovation. From launching our first beta to building a fully connected creative network, we've grown with purpose.
              </p>

              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  color: '#1f1d1d',
                  marginBottom: '14px',
                }}
              >
                We listened, learned, and adapted to serve real people with real needs. Innovation isn't just about features—it's about impact. Each phase brought new lessons, stronger partnerships, and deeper trust.
              </p>

              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  color: '#1f1d1d',
                }}
              >
                The journey continues—with every milestone, we unlock new possibilities for creators worldwide.
              </p>
            </div>
          </div>

          {/* Right Side - Timeline Card */}
          <div
            style={{
              flex: '1',
              backgroundColor: '#E8F4F8',
              borderRadius: '20px',
              padding: '40px',
              position: 'relative',
            }}
          >
            {/* Year Badge */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '30px',
                backgroundColor: '#fff',
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#063572',
                border: '2px solid #063572',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              2025
            </div>

            {/* Card Title */}
            <h3
              style={{
                fontSize: '30px',
                fontWeight: 700,
                marginTop: '40px',
                marginBottom: '16px',
                color: '#000',
                lineHeight: '1.05',
              }}
            >
              The Birth of Our Vision:{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                We're Turning Ideas Into Actions
              </span>
            </h3>

            {/* Card Content */}
            <p
              style={{
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: '1.65',
                color: '#1f1d1d',
                marginBottom: '14px',
              }}
            >
              What began as a simple idea has grown into a purposeful movement. We saw the challenges creatives face in finding platforms that truly represent them and their potential. Driven by that need, Amoria connekyt was born—not just as a tool, but as a bridge between talent and opportunity.
            </p>

            <p
              style={{
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: '1.65',
                color: '#1f1d1d',
              }}
            >
              Our journey started with a desire to empower event creators, photographers, and storytellers alike. Every feature we build reflects real voices, real problems, and real solutions. From sketches on paper to fully integrated experiences, our vision keeps evolving with our users. This is only the beginning: we're building something bigger, together.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section
        style={{
          padding: '80px 20px',
          backgroundColor: '#E8E8E8',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '1080px',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          {/* Main Heading */}
          <h2
            style={{
              fontSize: '50px',
              fontWeight: 700,
              marginBottom: '19.5px',
              lineHeight: '1.05',
              letterSpacing: '-0.02em',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Join the Movement —
            </span>{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #4169E1 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Create, Connect, Captivate!
            </span>
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: '1.65',
              color: '#1f1d1d',
              marginBottom: '30px',
              maxWidth: '800px',
              margin: '0 auto 30px',
            }}
          >
            Whether you're a passionate photographer or someone looking for the perfect moment to be captured, Amoria Connect brings creators and clients together in one seamless experience
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* Find A Photographer Button */}
            <button
              style={{
                backgroundColor: '#083A85',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                padding: '11.25px 25.5px',
                border: 'none',
                borderRadius: '37.5px',
                cursor: 'pointer',
                boxShadow: '0 3px 9px rgba(8, 58, 133, 0.2)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(8, 58, 133, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 9px rgba(8, 58, 133, 0.2)';
              }}
            >
              Find A Photographer
            </button>

            {/* Join As Photographer Button */}
            <button
              style={{
                backgroundColor: 'transparent',
                color: '#083A85',
                fontSize: '15px',
                fontWeight: 600,
                padding: '11.25px 25.5px',
                border: '1.5px solid #083A85',
                borderRadius: '37.5px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.backgroundColor = '#083A85';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#083A85';
              }}
            >
              Join As Photographer
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;