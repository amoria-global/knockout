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
              linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            zIndex: 1,
            maskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 85%)',
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
            bottom: '-130px',
            right: '-120px',
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
              width: '70%',
              height: '70%',
              objectFit: 'contain',
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
              fontSize: '60px',
              fontWeight: 700,
              margin: 0,
              marginBottom: '24px',
              lineHeight: '1.15',
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            Amoria connekyt is where{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #FF6B6B 0%, #C44569 30%, #8B5CF6 70%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              vision meets visibility
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
            At Amoria Connekyt, we are of the opinion that each photo bears a narrative, and each narrative warrants a performance.
            Our platform gives the opportunity to dedicated craftsmen and women, and especially photographers, to display their vision and talent.
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
        }}
      >
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
                fontSize: '60px',
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
                fontSize: '40px',
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
                  fontSize: '60px',
                  fontWeight: 700,
                  marginBottom: '20px',
                  lineHeight: '1.0',
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
                fontSize: '65px',
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