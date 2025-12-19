"use client";

import Navbar from "../components/navbar";
import Footer from "../components/footer";

const PhotographerGuide = () => {
  return (
    <div className="photographer-guide-page">
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

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .guide-card {
          transition: all 0.3s ease;
        }

        .guide-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 36px !important;
          }
          .section-title {
            font-size: 32px !important;
          }
          .grid-container {
            grid-template-columns: 1fr !important;
          }
          .two-column-layout {
            flex-direction: column !important;
          }
        }
      `}</style>

      <Navbar />

      {/* Hero Section - Seamlessly Integrated Platform */}
      <section
        style={{
          padding: '16px',
          backgroundColor: '#ffffff',
        }}
      >
        <div
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
              backgroundImage: 'url(/sect.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              borderRadius: '24px',
            }}
          />

          {/* Content Overlay */}
          <div
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
              style={{
                maxWidth: '700px',
              }}
            >
              <h2
                style={{
                  fontSize: '60px',
                  fontWeight: 700,
                  marginBottom: '20px',
                  lineHeight: '1.6',
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                }}
              >
                Seamlessly Integrated Platform
              </h2>

              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.7',
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: '32px',
                }}
              >
                Amoria Connekyt brings together everything you need in one place: from live streaming your events to secure payment processing with Stripe, and community features powered by Nu. Join a thriving ecosystem designed for photographers.
              </p>

              <a
                href="#getting-started"
                style={{
                  display: 'inline-block',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  padding: '14px 32px',
                  border: '2px solid #fff',
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
                Learn How to Start
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Steps Section */}
      <section
        id="getting-started"
        style={{
          backgroundColor: '#0a0a38',
          position: 'relative',
          padding: '100px 20px 80px',
          overflow: 'hidden',
        }}
      >
        {/* Kite Grid Pattern Background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(45deg, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
              linear-gradient(-45deg, rgba(255, 255, 255, 0.1) 2px, transparent 2px)
            `,
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 30px 30px',
            zIndex: 1,
            maskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 85%)',
          }}
        />

        {/* Subtle gradient overlay */}
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
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1
              className="hero-title"
              style={{
                fontSize: '60px',
                fontWeight: 700,
                marginBottom: '24px',
                lineHeight: '1.15',
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              Your Complete Guide to{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #FF6B6B 0%, #C44569 30%, #8B5CF6 70%, #6366F1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Photographer Success
              </span>
            </h1>
            <p
              style={{
                fontSize: '18px',
                fontWeight: 400,
                lineHeight: '1.7',
                color: 'rgba(255, 255, 255, 0.75)',
                maxWidth: '700px',
                margin: '0 auto 32px',
              }}
            >
              Follow these simple steps to create your photographer account and start connecting with clients on Amoria Connekyt.
            </p>
          </div>

          {/* Step 1: Create Account */}
          <div
            className="guide-card"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '0',
              marginBottom: '30px',
              display: 'flex',
              gap: '20px',
              alignItems: 'stretch',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              minHeight: '450px',
            }}
          >
            <div style={{ flex: '1', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#083A85',
                  color: '#fff',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '20px',
                }}
              >
                1
              </div>
              <h3
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#000',
                  marginBottom: '15px',
                }}
              >
                Create Your Account
              </h3>
              <p
                style={{
                  fontSize: '16px',
                  color: '#666',
                  lineHeight: 1.7,
                  marginBottom: '15px',
                }}
              >
                Sign up with your email or use Google authentication for quick access. Fill in your basic information including first name, last name, and email address to get started.
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: '#333', fontSize: '15px' }}>Quick signup with Google</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#083A85" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: '#333', fontSize: '15px' }}>Or create account with email</span>
                </li>
              </ul>
            </div>
            <div
              style={{
                flex: '1',
                backgroundColor: '#d1d1d1',
                padding: '20px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/land2.png"
                alt="Create your account"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              />
            </div>
          </div>

          {/* Step 2: Choose Photographer Type */}
          <div
            className="guide-card"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '0',
              marginBottom: '30px',
              display: 'flex',
              gap: '20px',
              alignItems: 'stretch',
              flexDirection: 'row-reverse',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              minHeight: '450px',
            }}
          >
            <div style={{ flex: '1', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: '#8B5CF6',
                  color: '#fff',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '20px',
                }}
              >
                2
              </div>
              <h3
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#000',
                  marginBottom: '15px',
                }}
              >
                Choose Your Photographer Type
              </h3>
              <p
                style={{
                  fontSize: '16px',
                  color: '#666',
                  lineHeight: 1.7,
                  marginBottom: '15px',
                }}
              >
                Select whether you're a hired photographer working with clients through the platform, or a freelancer/self-employed photographer showcasing your portfolio and connecting with potential clients.
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: '#333', fontSize: '15px' }}>Hired Photographer - Work directly with clients</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: '#333', fontSize: '15px' }}>Freelancer - Build your brand and portfolio</span>
                </li>
              </ul>
            </div>
            <div
              style={{
                flex: '1',
                backgroundColor: '#d1d1d1',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/land1.png"
                alt="Choose photographer type"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              />
            </div>
          </div>

          {/* Step 3: Login */}
          <div
            className="guide-card"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '0',
              marginBottom: '30px',
              display: 'flex',
              gap: '20px',
              alignItems: 'stretch',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              minHeight: '450px',
            }}
          >
            <div style={{ flex: '1', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: '#FF6B6B',
                  color: '#fff',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '20px',
                }}
              >
                3
              </div>
              <h3
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#000',
                  marginBottom: '15px',
                }}
              >
                Login to Your Dashboard
              </h3>
              <p
                style={{
                  fontSize: '16px',
                  color: '#666',
                  lineHeight: 1.7,
                  marginBottom: '15px',
                }}
              >
                After selecting your photographer type, log in to access your personalized dashboard. Use your email and password, or continue with Google for seamless access.
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: '#333', fontSize: '15px' }}>Secure login with password</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: '#333', fontSize: '15px' }}>Password recovery available</span>
                </li>
              </ul>
            </div>
            <div
              style={{
                flex: '1',
                backgroundColor: '#d1d1d1',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/land3.png"
                alt="Login to your dashboard"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Features Section */}
      <section
        style={{
          padding: '80px 20px',
          background: 'linear-gradient(180deg, #fff 0%, #f0f4f8 100%)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2
              className="section-title"
              style={{
                fontSize: '50px',
                fontWeight: 700,
                marginBottom: '18px',
                lineHeight: 1.1,
              }}
            >
              <span style={{ color: '#000' }}>Explore Your</span>{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #083A85 0%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Dashboard Features
              </span>
            </h2>
            <p
              style={{
                fontSize: '18px',
                color: '#666',
                maxWidth: '650px',
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Your photographer dashboard is packed with powerful tools to help you manage your business efficiently.
            </p>
          </div>

          <div
            className="grid-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '30px',
            }}
          >
            {/* Dashboard Home */}
            <div
              className="guide-card"
              style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '0',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderBottom: '1px solid #e9ecef',
                }}
              >
                <img
                  src="/dash1.png"
                  alt="Dashboard Overview"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>
              <div style={{ padding: '30px' }}>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#000',
                    marginBottom: '12px',
                  }}
                >
                  Dashboard Overview
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#666',
                    lineHeight: 1.7,
                  }}
                >
                  Track your earnings, clients, accuracy ratings, and bonuses at a glance. View performance charts and recent activities to stay on top of your photography business.
                </p>
              </div>
            </div>

            {/* Transactions & Withdrawals */}
            <div
              className="guide-card"
              style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '0',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderBottom: '1px solid #e9ecef',
                }}
              >
                <img
                  src="/dash2.png"
                  alt="Withdraw Funds"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>
              <div style={{ padding: '30px' }}>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#000',
                    marginBottom: '12px',
                  }}
                >
                  Manage Earnings & Withdrawals
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#666',
                    lineHeight: 1.7,
                  }}
                >
                  Easily withdraw your earnings to MTN Mobile Money or other payment methods. Track your transactions, view tips from clients, and manage your available balance.
                </p>
              </div>
            </div>

            {/* Gallery Management */}
            <div
              className="guide-card"
              style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '0',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderBottom: '1px solid #e9ecef',
                }}
              >
                <img
                  src="/dash3.png"
                  alt="Gallery Management"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>
              <div style={{ padding: '30px' }}>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#000',
                    marginBottom: '12px',
                  }}
                >
                  Portfolio & Gallery
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#666',
                    lineHeight: 1.7,
                  }}
                >
                  Create beautiful albums, upload your best work, and organize photos by category and client. Showcase your photography portfolio to attract more clients.
                </p>
              </div>
            </div>

            {/* Photo Selection */}
            <div
              className="guide-card"
              style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '0',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderBottom: '1px solid #e9ecef',
                }}
              >
                <img
                  src="/dash4.png"
                  alt="Photo Selection Mode"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>
              <div style={{ padding: '30px' }}>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#000',
                    marginBottom: '12px',
                  }}
                >
                  Photo Selection & Delivery
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#666',
                    lineHeight: 1.7,
                  }}
                >
                  Share selected photos with clients for review and approval. Use selection mode to help clients choose their favorite shots from your product photography sessions.
                </p>
              </div>
            </div>

            {/* Client Communication */}
            <div
              className="guide-card"
              style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '0',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderBottom: '1px solid #e9ecef',
                }}
              >
                <img
                  src="/dash5.png"
                  alt="Client Messages"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>
              <div style={{ padding: '30px' }}>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#000',
                    marginBottom: '12px',
                  }}
                >
                  Client Communication
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#666',
                    lineHeight: 1.7,
                  }}
                >
                  Stay connected with your clients through built-in messaging. Discuss wedding packages, schedule portrait sessions, and receive booking confirmations all in one place.
                </p>
              </div>
            </div>

            {/* Tips & Reviews */}
            <div
              className="guide-card"
              style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '0',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderBottom: '1px solid #e9ecef',
                }}
              >
                <img
                  src="/dash6.png"
                  alt="Tips and Reviews"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>
              <div style={{ padding: '30px' }}>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#000',
                    marginBottom: '12px',
                  }}
                >
                  Receive Tips & Reviews
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#666',
                    lineHeight: 1.7,
                  }}
                >
                  Build your reputation with client reviews and receive tips for exceptional work. Your ratings help you attract more clients and grow your photography business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action with Tech Image */}
      <section
        style={{
          padding: '16px',
          backgroundColor: '#ffffff',
        }}
      >
        <div
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
              backgroundImage: 'url(/camm.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              borderRadius: '24px',
            }}
          />

          {/* Content Overlay */}
          <div
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
              style={{
                maxWidth: '550px',
              }}
            >
              <h2
                style={{
                  fontSize: '60px',
                  fontWeight: 700,
                  marginBottom: '20px',
                  lineHeight: '1.0',
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                }}
              >
                Ready to Elevate Your Photography Career?
              </h2>

              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '1.7',
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: '32px',
                }}
              >
                Join thousands of photographers who trust Amoria Connekyt to manage their bookings, showcase their work, and grow their business. Start your journey today.
              </p>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <a
                  href="/user/auth/signup-type?type=photographer"
                  style={{
                    display: 'inline-block',
                    background: '#fff',
                    color: '#083A85',
                    fontSize: '16px',
                    fontWeight: 600,
                    padding: '14px 32px',
                    border: 'none',
                    borderRadius: '40px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 255, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.3)';
                  }}
                >
                  Get Started Now
                </a>
                <a
                  href="/user/contact_us"
                  style={{
                    display: 'inline-block',
                    background: 'transparent',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                    padding: '14px 32px',
                    border: '2px solid rgba(255,255,255,0.4)',
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
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PhotographerGuide;
