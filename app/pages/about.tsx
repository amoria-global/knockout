"use client";

import Navbar from "../components/navbar";
import Footer from "../components/footer";

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
        @keyframes slowSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes gridTwinkle {
          0%, 100% {
            opacity: 0.02;
          }
          25% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.02;
          }
          75% {
            opacity: 0.2;
          }
        }
        @keyframes snowfall {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            transform: translateY(2500px);
            opacity: 0;
          }
        }
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 5px rgba(139, 92, 246, 0.5), 0 0 10px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.8), 0 0 25px rgba(139, 92, 246, 0.5), 0 0 35px rgba(255, 107, 107, 0.3);
          }
        }
        @keyframes lineGlow {
          0% {
            background: linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 50%, #8B5CF6 100%);
            background-size: 200% 100%;
            background-position: 0% 50%;
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.3);
          }
          50% {
            background: linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 50%, #8B5CF6 100%);
            background-size: 200% 100%;
            background-position: 100% 50%;
            box-shadow: 0 0 15px rgba(255, 107, 107, 0.8), 0 0 30px rgba(255, 107, 107, 0.4);
          }
          100% {
            background: linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 50%, #8B5CF6 100%);
            background-size: 200% 100%;
            background-position: 0% 50%;
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.3);
          }
        }
        @keyframes flowingDots {
          0% {
            left: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
        @keyframes pendulumSwingLeft {
          0%, 100% {
            transform: rotate(8deg);
          }
          50% {
            transform: rotate(-8deg);
          }
        }
        @keyframes pendulumSwingRight {
          0%, 100% {
            transform: rotate(-8deg);
          }
          50% {
            transform: rotate(8deg);
          }
        }
        .connector-line {
          position: relative;
          overflow: visible;
        }
        .connector-line::before {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background: #fff;
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
          animation: flowingDots 1.5s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(139, 92, 246, 0.6);
        }
        .snowflake {
          position: absolute;
          top: -20px;
          width: 10px;
          height: 14px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(173, 216, 230, 0.7) 50%, rgba(135, 206, 250, 0.5) 100%);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          animation: snowfall linear infinite;
          pointer-events: none;
          box-shadow: inset -1px -1px 2px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(0, 100, 150, 0.2);
        }

        /* Default desktop font sizes */
        .about-hero-title {
          font-size: 60px;
          line-height: 1.15;
        }
        .about-journey-title {
          font-size: 60px;
          line-height: 1.05;
        }
        .about-journey-card-title {
          font-size: 40px;
          line-height: 1.05;
        }
        .about-section-title {
          font-size: 40px;
          line-height: 1.05;
        }
        .about-mock-title {
          font-size: 60px;
          line-height: 1.0;
        }
        .about-cta-title {
          font-size: 65px;
          line-height: 1.05;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 1200px) {
          .about-hero-section {
            padding: 80px 20px 100px !important;
          }
          .about-hero-title,
          .about-journey-title,
          .about-journey-card-title,
          .about-section-title,
          .about-mock-title,
          .about-cta-title {
            font-size: 42px !important;
            line-height: 1.15 !important;
          }
          .about-hero-section p {
            font-size: 16px !important;
          }
          .about-journey-container {
            padding: 40px 30px !important;
          }
          .core-values-cards,
          .approach-cards {
            flex-wrap: wrap !important;
            gap: 20px !important;
          }
          .core-values-cards > div,
          .approach-cards > div {
            margin: 0 !important;
          }
          .core-values-cards > div > div,
          .approach-cards > div > div {
            width: 280px !important;
            height: 300px !important;
            margin: 0 -40px !important;
          }
        }

        @media (max-width: 992px) {
          .about-hero-title,
          .about-journey-title,
          .about-journey-card-title,
          .about-section-title,
          .about-mock-title,
          .about-cta-title {
            font-size: 36px !important;
            line-height: 1.15 !important;
          }
          .about-hero-section p {
            font-size: 15px !important;
            max-width: 90% !important;
          }
          .about-journey-container h2,
          .about-journey-container h3 {
            font-size: 32px !important;
          }
          .mission-vision-grid {
            grid-template-columns: 1fr !important;
          }
          .mission-vision-grid > div {
            width: 100% !important;
          }
          .core-values-cards > div > div,
          .approach-cards > div > div {
            width: 240px !important;
            height: 260px !important;
            margin: 0 -30px !important;
          }
          .core-values-cards > div > div > div,
          .approach-cards > div > div > div {
            width: 55% !important;
          }
          .core-values-cards > div > div > div h4,
          .approach-cards > div > div > div h4 {
            font-size: 16px !important;
            margin-bottom: 15px !important;
          }
          .core-values-cards > div > div > div p,
          .approach-cards > div > div > div p {
            font-size: 13px !important;
          }
        }

        @media (max-width: 768px) {
          .about-hero-section {
            padding: 70px 15px 80px !important;
            min-height: 300px !important;
            overflow: visible !important;
          }
          .about-hero-title,
          .about-journey-title,
          .about-journey-card-title,
          .about-section-title,
          .about-mock-title,
          .about-cta-title {
            font-size: 48px !important;
            line-height: 1.15 !important;
          }
          .about-hero-section p {
            font-size: 14px !important;
            line-height: 1.5 !important;
          }
          .about-hero-shape {
            width: 150px !important;
            height: 150px !important;
            bottom: 20px !important;
            right: 15px !important;
            opacity: 1 !important;
            z-index: 20 !important;
            display: block !important;
            visibility: visible !important;
          }
          .about-hero-shape img {
            width: 100% !important;
            height: 100% !important;
            display: block !important;
          }
          .about-journey-section {
            padding: 40px 15px !important;
          }
          .about-journey-container {
            padding: 25px 20px !important;
          }
          .about-journey-container h2,
          .about-journey-container h3 {
            font-size: 32px !important;
          }
          .about-journey-container p {
            font-size: 14px !important;
          }
          .about-journey-container li {
            font-size: 14px !important;
          }
          .about-journey-card {
            padding: 20px 15px !important;
          }
          .about-journey-card > div:first-child {
            top: 15px !important;
            left: 15px !important;
            padding: 6px 14px !important;
            font-size: 12px !important;
          }
          .core-values-cards,
          .approach-cards {
            flex-direction: column !important;
            align-items: center !important;
            gap: 15px !important;
          }
          .core-values-cards > div > div,
          .approach-cards > div > div {
            width: 300px !important;
            height: 280px !important;
            margin: 0 !important;
            animation: pendulumSwingLeft 2s ease-in-out infinite !important;
          }
          .core-values-cards > div:nth-child(even) > div,
          .approach-cards > div:nth-child(even) > div {
            animation: pendulumSwingRight 2s ease-in-out infinite !important;
          }
          .core-values-cards > div > div > img,
          .approach-cards > div > div > img {
            height: 100% !important;
          }
          .core-values-cards > div > div > div,
          .approach-cards > div > div > div {
            width: 48% !important;
            padding-top: 15px !important;
            top: 45% !important;
          }
          .core-values-cards > div > div > div h4,
          .approach-cards > div > div > div h4 {
            font-size: 16px !important;
            margin-bottom: 10px !important;
          }
          .core-values-cards > div > div > div p,
          .approach-cards > div > div > div p {
            font-size: 12px !important;
            line-height: 1.35 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
          }
          .closing-quote p {
            font-size: 15px !important;
          }
        }

        /* Landscape orientation for mobile/tablet */
        @media (max-height: 500px) and (orientation: landscape) {
          .about-hero-section {
            min-height: 280px !important;
            padding: 50px 15px 60px !important;
            overflow: visible !important;
          }
          .about-hero-shape {
            width: 100px !important;
            height: 100px !important;
            bottom: 10px !important;
            right: 15px !important;
            opacity: 1 !important;
            z-index: 20 !important;
            display: block !important;
            visibility: visible !important;
          }
          .about-hero-shape img {
            width: 100% !important;
            height: 100% !important;
            display: block !important;
          }
        }

        @media (max-width: 480px) {
          .about-hero-section {
            padding: 60px 12px 60px !important;
            min-height: 250px !important;
            overflow: visible !important;
          }
          .about-hero-title,
          .about-journey-title,
          .about-journey-card-title,
          .about-section-title,
          .about-mock-title,
          .about-cta-title {
            font-size: 48px !important;
            line-height: 1.15 !important;
          }
          .about-hero-section p {
            font-size: 13px !important;
          }
          .about-hero-shape {
            width: 100px !important;
            height: 100px !important;
            bottom: 15px !important;
            right: 10px !important;
            opacity: 1 !important;
            z-index: 20 !important;
            display: block !important;
            visibility: visible !important;
          }
          .about-hero-shape img {
            width: 100% !important;
            height: 100% !important;
            display: block !important;
          }
          .about-journey-section {
            padding: 30px 12px !important;
          }
          .about-journey-container {
            padding: 20px 15px !important;
            gap: 25px !important;
          }
          .about-journey-container h2,
          .about-journey-container h3 {
            font-size: 26px !important;
            margin-bottom: 15px !important;
          }
          .about-journey-container p {
            font-size: 13px !important;
          }
          .about-journey-container li {
            font-size: 13px !important;
          }
          .about-journey-card {
            padding: 15px 12px !important;
            border-radius: 15px !important;
          }
          .about-journey-card > div:first-child {
            top: 12px !important;
            left: 12px !important;
            padding: 5px 12px !important;
            font-size: 11px !important;
          }
          .core-values-cards > div > div,
          .approach-cards > div > div {
            width: 280px !important;
            height: 260px !important;
            animation: pendulumSwingLeft 2s ease-in-out infinite !important;
          }
          .core-values-cards > div:nth-child(even) > div,
          .approach-cards > div:nth-child(even) > div {
            animation: pendulumSwingRight 2s ease-in-out infinite !important;
          }
          .core-values-cards > div > div > div,
          .approach-cards > div > div > div {
            width: 50% !important;
            padding-top: 12px !important;
            top: 45% !important;
          }
          .core-values-cards > div > div > div h4,
          .approach-cards > div > div > div h4 {
            font-size: 14px !important;
            margin-bottom: 8px !important;
          }
          .core-values-cards > div > div > div p,
          .approach-cards > div > div > div p {
            font-size: 11px !important;
            line-height: 1.3 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
          }
          .closing-quote p {
            font-size: 14px !important;
          }
          .laptop-mockup-section {
            padding: 40px 15px !important;
          }
          .cta-section {
            padding: 50px 15px !important;
          }
          .cta-section h2 {
            font-size: 24px !important;
          }
          .cta-section p {
            font-size: 14px !important;
          }
        }
      `}</style>
      <Navbar />

      {/* Header/Hero Section - Grid Pattern Design */}
      <section
        className="about-hero-section"
        style={{
          backgroundColor: '#1a1a2e',
          position: 'relative',
          padding: '100px 20px 120px',
          overflow: 'hidden',
          minHeight: '400px',
        }}
      >
        {/* Grid Pattern Background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(138, 180, 255, 1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(138, 180, 255, 1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            zIndex: 1,
            maskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 85%)',
            animation: 'gridTwinkle 4s ease-in-out infinite',
          }}
        />

        {/* Subtle gradient overlay for depth */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(6, 53, 114, 0.3) 100%)',
            zIndex: 2,
          }}
        />

        {/* Abstract 3D Shape - Bottom Right */}
        <div
          className="about-hero-shape"
          style={{
            position: 'absolute',
            bottom: '-60px',
            right: '-60px',
            width: '400px',
            height: '400px',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <img
            src="/glob.png"
            alt=""
            style={{
              width: '90%',
              height: '90%',
              objectFit: 'contain',
              animation: 'slowSpin 5s linear infinite',
            }}
          />
        </div>

        {/* Content */}
        <div
          className="about-hero-content"
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          <h1
            className="about-hero-title"
            style={{
              fontWeight: 700,
              margin: 0,
              marginBottom: '24px',
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            Amoria connekyt: {' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #FF6B6B 0%, #C44569 30%, #8B5CF6 70%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Where vision becomes visibility
            </span>
          </h1>

          <p
            className="about-hero-subtitle"
            style={{
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.75)',
              maxWidth: '700px',
              margin: '0 auto 32px',
            }}
          >
            Amoria Connekyt is a digital ecosystem connecting verified photographers and creative professionals with clients worldwide.
            We combine smart tools, secure payments, and creative visibility to transform moments into meaningful, lasting experiences.
          </p>

          <a
            href="/user/auth/signup"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(90deg, #FF6B6B 0%, #C44569 50%, #8B5CF6 100%)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              padding: '14px 32px',
              border: 'none',
              borderRadius: '40px',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 107, 107, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 107, 107, 0.4)';
            }}
          >
            Sign Up
          </a>
        </div>

      </section>

      {/* Journey Section */}
      <section
        className="about-journey-section"
        style={{
          padding: '80px 20px',
          backgroundColor: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Snow/Rain Effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${8 + Math.random() * 6}s`,
                animationDelay: `${Math.random() * 8}s`,
                opacity: 0.4 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>

        <div
          className="about-journey-container"
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
            className="about-journey-left"
            style={{
              flex: '1',
              maxWidth: '450px',
            }}
          >
            <h2
              className="about-journey-title"
              style={{
                fontWeight: 700,
                marginBottom: '19.5px',
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
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  color: '#1f1d1d',
                  marginBottom: '14px',
                }}
              >
                We have taken every step with care and purpose as innovators in our field. From the debut of our first beta, to our fully functioning and integrated creative network, we have expanded with intention.
              </p>

              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  color: '#1f1d1d',
                  marginBottom: '14px',
                }}
              >
                We read, studied, and got acclimated to work with real individuals with real needs. Innovation is not all about features, it is all about impact. Every step was associated with new lessons, better relationships, and more trust.
              </p>

              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  color: '#1f1d1d',
                }}
              >
                Our trip is not finished yet- with each step we open new opportunities to the creators of the whole world.
              </p>
            </div>
          </div>

          {/* Right Side - Timeline Card */}
          <div
            className="about-journey-card"
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
              className="about-journey-year-badge"
              style={{
                position: 'absolute',
                top: '20px',
                left: '30px',
                backgroundColor: '#fff',
                padding: '8px 20px',
                borderRadius: '30px',
                fontSize: '18px',
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
              className="about-journey-card-title"
              style={{
                fontWeight: 700,
                marginTop: '40px',
                marginBottom: '16px',
                color: '#000',
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
                fontSize: '18px',
                fontWeight: 400,
                lineHeight: '1.65',
                color: '#1f1d1d',
                marginBottom: '14px',
              }}
            >
              Originally, this started as an idea, but it has started to blossom into something larger than that. People were noticing the obstacles and setbacks that creators in the industry had. They didn’t have the right tools and platforms to promote themselves and their work properly. Amoria Connekyt started as a vision to promote creators, but it also helps serve as a bridge to new tools and opportunities.
            </p>

            <p
              style={{
                fontSize: '18px',
                fontWeight: 400,
                lineHeight: '1.65',
                color: '#1f1d1d',
              }}
            >
              What began as a passion for supporting event creators, photographers, and storytellers has impacted us in numerous ways and heavily shaped the growth of our company. We listen to our customers and use their feedback and ideas to drive the changes and developments within the company. We've come a long way in our development, and, looking to the future, we will continue to evolve with our customers. We're only just getting started and are looking to build even more with you.
            </p>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div
          style={{
            maxWidth: '1080px',
            margin: '60px auto 0',
            padding: '0 20px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            className="mission-vision-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '30px',
              marginBottom: '50px',
            }}
          >
            {/* Mission Card */}
            <div
              className="about-journey-card"
              style={{
                backgroundColor: '#E8F4F8',
                borderRadius: '20px',
                padding: '40px',
                position: 'relative',
              }}
            >
              {/* Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '30px',
                  backgroundColor: '#fff',
                  padding: '8px 20px',
                  borderRadius: '30px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#063572',
                  border: '2px solid #063572',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <i className="bi-bullseye" style={{ marginRight: '6px' }} /> Mission
              </div>
              <h3
                className="about-section-title"
                style={{
                  fontWeight: 700,
                  marginTop: '40px',
                  marginBottom: '16px',
                  color: '#000',
                }}
              >
                Our{' '}
                <span
                  style={{
                    background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Mission
                </span>
              </h3>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  color: '#1f1d1d',
                  marginBottom: '20px',
                }}
              >
                To empower creators and communities through technology that connects people, promotes emotional wellness, and transforms creative work into meaningful global opportunities.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  'Simplify how clients find and hire verified photographers and videographers.',
                  'Help creators build trusted brands with fair ratings, secure payments, and smart tools.',
                  'Strengthen family and social bonds through shared memories that inspire joy and connection.',
                ].map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '16px',
                      color: '#1f1d1d',
                      lineHeight: '1.65',
                      marginBottom: '12px',
                      paddingLeft: '24px',
                      position: 'relative',
                    }}
                  >
                    <i className="bi-check-circle-fill" style={{ position: 'absolute', left: 0, color: '#8B5CF6', fontSize: '14px' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vision Card */}
            <div
              className="about-journey-card"
              style={{
                backgroundColor: '#E8F4F8',
                borderRadius: '20px',
                padding: '40px',
                position: 'relative',
              }}
            >
              {/* Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '30px',
                  backgroundColor: '#fff',
                  padding: '8px 20px',
                  borderRadius: '30px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#063572',
                  border: '2px solid #063572',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <i className="bi-globe2" style={{ marginRight: '6px' }} /> Vision
              </div>
              <h3
                className="about-section-title"
                style={{
                  fontWeight: 700,
                  marginTop: '40px',
                  marginBottom: '16px',
                  color: '#000',
                }}
              >
                Our{' '}
                <span
                  style={{
                    background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Vision
                </span>
              </h3>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  color: '#1f1d1d',
                  marginBottom: '20px',
                }}
              >
                To become Africa's leading creative connection platform; a space where every memory matters, creativity meets opportunity, and technology fosters global emotional wellbeing.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  'Creative professionals thrive through fair digital economies.',
                  'Clients access trusted talent anywhere, anytime.',
                  'Memories become bridges that heal distance and celebrate humanity.',
                ].map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '16px',
                      color: '#1f1d1d',
                      lineHeight: '1.65',
                      marginBottom: '12px',
                      paddingLeft: '24px',
                      position: 'relative',
                    }}
                  >
                    <i className="bi-check-circle-fill" style={{ position: 'absolute', left: 0, color: '#FF6B6B', fontSize: '14px' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Core Values */}
          <div style={{ marginBottom: '50px' }}>
            <h3
              className="about-section-title"
              style={{
                fontWeight: 700,
                marginBottom: '30px',
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
                Our Core Values
              </span>
            </h3>

            <div
              className="core-values-cards"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '0',
                flexWrap: 'nowrap',
                paddingTop: '20px',
              }}
            >
              {[
                { title: 'Innovation', desc: 'Technology that uplifts people, not replaces them' },
                { title: 'Trust', desc: 'Every interaction rooted in honesty & transparency' },
                { title: 'Excellence', desc: 'Work that inspires and connects' },
                { title: 'Wellness', desc: 'Memories as therapy for distant hearts' },
                { title: 'Growth', desc: 'Strengthening digital & human connection' },
              ].map((value, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {/* Value Card with card.png background */}
                  <div
                    style={{
                      width: '400px',
                      height: '360px',
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      flexShrink: 0,
                      margin: '0 -70px',
                      transformOrigin: 'top center',
                      animation: `${index % 2 === 0 ? 'pendulumSwingLeft' : 'pendulumSwingRight'} 2s ease-in-out infinite`,
                    }}
                  >
                    <img
                      src="/card.png"
                      alt=""
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '90%',
                        objectFit: 'fill',
                        zIndex: 0,
                        filter: 'brightness(1.08) contrast(1.03)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: 1,
                        top: '45%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '45%',
                        textAlign: 'center',
                        paddingTop: '30px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#000',
                          marginBottom: '25px',
                        }}
                      >
                        {value.title}
                      </h4>
                      <p
                        style={{
                          fontSize: '15px',
                          color: '#1f1d1d',
                          lineHeight: '1.3',
                          margin: 0,
                        }}
                      >
                        {value.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Our Approach */}
          <div
            className="about-journey-card"
            style={{
              backgroundColor: '#c2f0ff',
              borderRadius: '20px',
              padding: '30px 40px',
              position: 'relative',
            }}
          >
            {/* Badge */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '30px',
                backgroundColor: '#fff',
                padding: '8px 20px',
                borderRadius: '30px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#063572',
                border: '2px solid #063572',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <i className="bi-lightning-charge-fill" style={{ marginRight: '6px' }} /> Approach
            </div>
            <h3
              className="about-section-title"
              style={{
                fontWeight: 700,
                marginTop: '30px',
                marginBottom: '10px',
                color: '#000',
              }}
            >
              Our{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Approach
              </span>
            </h3>

            <div
              className="approach-cards"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '0',
                marginBottom: '10px',
                flexWrap: 'nowrap',
                paddingTop: '0',
              }}
            >
              {[
                { title: 'Digital Empowerment', desc: 'Tools to manage projects, payments, and growth from one secure platform' },
                { title: 'Verified Network', desc: 'Quality, trust, and professionalism through creator verification' },
                { title: 'Smart Payments', desc: '50% Hold & Release system that protects both clients and creators' },
                { title: 'Global Mindset', desc: 'Rwandan-born solution connecting Africa\'s creativity to the world' },
              ].map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {/* Approach Card with car.png background */}
                  <div
                    style={{
                      width: '400px',
                      height: '350px',
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      flexShrink: 0,
                      margin: '0 -70px',
                      transformOrigin: 'top center',
                      animation: `${index % 2 === 0 ? 'pendulumSwingLeft' : 'pendulumSwingRight'} 2s ease-in-out infinite`,
                    }}
                  >
                    <img
                      src="/car.png"
                      alt=""
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'fill',
                        zIndex: 0,
                        filter: 'brightness(1.08) contrast(1.03)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: 1,
                        top: '45%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '45%',
                        textAlign: 'center',
                        paddingTop: '30px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#000',
                          marginBottom: '25px',
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        style={{
                          fontSize: '15px',
                          color: '#1f1d1d',
                          lineHeight: '1.3',
                          margin: 0,
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Closing Quote */}
            <div
              className="closing-quote"
              style={{
                textAlign: 'center',
                paddingTop: '24px',
                borderTop: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  color: '#1f1d1d',
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                "Amoria Connekyt is more than a platform, it's a movement to{' '}
                <span
                  style={{
                    background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 700,
                  }}
                >
                  create, connect, and care
                </span>{' '}
                through visual storytelling."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section - Laptop Mockup Design */}
      <section
        className="about-mission-section"
        style={{
          padding: '80px 20px 100px',
          backgroundColor: '#0a0a14',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Purple Gradient Background Effects */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at top left, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2
              style={{
                fontSize: '48px',
                fontWeight: 700,
                marginBottom: '20px',
                lineHeight: '1.15',
                color: '#ffffff',
              }}
            >
              Smart Tools for{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Creative Professionals
              </span>
            </h2>
            <p
              style={{
                fontSize: '17px',
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: '650px',
                margin: '0 auto',
                lineHeight: '1.7',
              }}
            >
              Digital empowerment tools to manage projects, payments, and growth from one secure platform with verified network and smart payment systems.
            </p>
          </div>

          {/* Laptop Mockup Frame */}
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
              position: 'relative',
            }}
          >
            {/* Laptop Screen */}
            <div
              style={{
                background: '#12121f',
                borderRadius: '16px 16px 0 0',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderBottom: 'none',
                padding: '12px 12px 0 12px',
                position: 'relative',
              }}
            >
              {/* Browser Top Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  paddingLeft: '8px',
                }}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28ca41' }} />
                <div
                  style={{
                    flex: 1,
                    marginLeft: '20px',
                    marginRight: '20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  app.amoriaconnekyt.com/dashboard
                </div>
              </div>

              {/* Dashboard Content */}
              <div
                style={{
                  background: '#0a0a14',
                  borderRadius: '12px 12px 0 0',
                  padding: '24px',
                  display: 'flex',
                  gap: '20px',
                  minHeight: '450px',
                }}
              >
                {/* Sidebar */}
                <div
                  style={{
                    width: '180px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    padding: '20px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#8B5CF6',
                        animation: 'float 2s ease-in-out infinite',
                      }}
                    />
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Amoria</span>
                  </div>
                  {['Dashboard', 'Portfolio', 'Bookings', 'Earnings', 'Settings'].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        marginBottom: '6px',
                        background: i === 0 ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                        color: i === 0 ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', margin: 0 }}>Welcome Back</p>
                      <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '4px 0 0 0' }}>Creative Studio</h3>
                    </div>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF6B6B, #8B5CF6)',
                      }}
                    />
                  </div>

                  {/* Stats Cards */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', margin: '0 0 8px 0' }}>Total Earnings</p>
                    <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 700, margin: '0 0 4px 0' }}>$12,450.00</h2>
                    <p style={{ color: '#28ca41', fontSize: '12px', margin: 0 }}>+12.5% this month</p>
                  </div>

                  {/* Mini Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {[
                      { label: 'Active Jobs', value: '8', icon: '📷' },
                      { label: 'Completed', value: '124', icon: '✓' },
                      { label: 'Rating', value: '4.9', icon: '⭐' },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                        <p style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '8px 0 4px 0' }}>{stat.value}</p>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', margin: 0 }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Laptop Base/Stand */}
            <div
              style={{
                background: 'linear-gradient(180deg, #1a1a2e 0%, #12121f 100%)',
                height: '20px',
                borderRadius: '0 0 4px 4px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '200px',
                  height: '8px',
                  background: '#0a0a14',
                  borderRadius: '0 0 8px 8px',
                }}
              />
            </div>
          </div>

          {/* Feature Highlights Below Laptop */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginTop: '50px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { icon: '🔒', text: 'Secure Payments' },
              { icon: '✓', text: 'Verified Creators' },
              { icon: '📊', text: 'Smart Analytics' },
              { icon: '🌍', text: 'Global Reach' },
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '20px' }}>{feature.icon}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mock Image Section */}
      <section
        className="about-mock-section"
        style={{
          padding: '16px',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          className="about-mock-container"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '650px',
            overflow: 'hidden',
            borderRadius: '24px',
          }}
        >
          {/* Background Image */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'url(/mock.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'right center',
              backgroundRepeat: 'no-repeat',
              borderRadius: '24px',
            }}
          />

          {/* Content Overlay */}
          <div
            className="about-mock-overlay"
            style={{
              position: 'relative',
              zIndex: 10,
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '80px 60px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '650px',
            }}
          >
            {/* Left Side Content */}
            <div
              className="about-mock-content"
              style={{
                maxWidth: '550px',
              }}
            >
              <h2
                className="about-mock-title"
                style={{
                  fontWeight: 700,
                  marginBottom: '20px',
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                }}
              >
                Empowering creators to share their vision with the world.
              </h2>

              <p
                className="about-mock-subtitle"
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.7',
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: '32px',
                }}
              >
                Amoria Connekyt is built for photographers and creatives ready to showcase their work and connect with clients. Create your profile today and get started.
              </p>

              <a
                href="/user/auth/signup"
                style={{
                  display: 'inline-block',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  padding: '14px 32px',
                  border: '2px solid #8B5CF6',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section
        className="about-cta-section"
        style={{
          padding: '80px 0 80px 0',
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        <div
          className="about-cta-container"
          style={{
            maxWidth: '100%',
            margin: '0 auto',
            display: 'flex',
            gap: '60px',
            alignItems: 'center',
            paddingRight: '40px',
          }}
        >
          {/* Left Side - Image Card */}
          <div
            className="about-cta-image"
            style={{
              flex: '1.2',
              backgroundColor: 'transparent',
              borderRadius: '20px',
              padding: '0',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '500px',
              height: '400px',
              overflow: 'hidden',
              marginLeft: '16px',
            }}
          >
            <img
              src="/wave.png"
              alt="Wave illustration"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '20px',
              }}
            />
          </div>

          {/* Right Side - Content */}
          <div
            className="about-cta-content"
            style={{
              flex: '1',
              maxWidth: '500px',
            }}
          >
            <h2
              className="about-cta-title"
              style={{
                fontWeight: 700,
                marginBottom: '19.5px',
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
                Join the World,
              </span>{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #4169E1 0%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Create, Connect, & Captivate!
              </span>
            </h2>

            <p
              className="about-cta-subtitle"
              style={{
                fontSize: '18px',
                fontWeight: 400,
                lineHeight: '1.65',
                color: '#1f1d1d',
                marginBottom: '30px',
              }}
            >
              Whether you're a passionate photographer or someone looking for the perfect moment to be captured, Amoria Connect brings creators and clients together in one seamless experience
            </p>

            {/* CTA Buttons */}
            <div
              className="about-cta-buttons"
              style={{
                display: 'flex',
                gap: '20px',
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
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;