'use client'

import Link from 'next/link'
import Navbar from './components/navbar'
import Footer from './components/footer'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DBDBDB',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Blue lighting glow effect - matching home page */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(4, 25, 255, 0.2) 0%, rgba(37, 17, 220, 0.3) 20%, rgba(37, 17, 220, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '60px 20px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* 404 Number with gradient */}
          <h1 style={{
            fontSize: '150px',
            fontWeight: 1000,
            background: 'linear-gradient(135deg, #083A85 0%, #FF6363 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '20px',
            lineHeight: '1',
            letterSpacing: '-0.02em'
          }}>
            404
          </h1>

          {/* Decorative elements matching home page style */}
          <div style={{
            position: 'absolute',
            top: '80px',
            right: '100px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #083A85 0%, #FF6363 100%)',
            zIndex: -1
          }} />

          <div style={{
            position: 'absolute',
            bottom: '260px',
            left: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #083A85 0%, #FF6363 100%)',
            clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
            transform: 'rotate(90deg)',
            zIndex: -1
          }} />

          {/* Error Message */}
          <h2 style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#000',
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}>
            Page Not Found
          </h2>

          <p style={{
            fontSize: '18px',
            color: '#1f1d1d',
            lineHeight: '1.65',
            marginBottom: '40px',
            maxWidth: '500px',
            margin: '0 auto 40px'
          }}>
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted, or perhaps the URL was mistyped.
          </p>

          {/* CTA Buttons matching home page style */}
          <div style={{
            display: 'flex',
            gap: '13.5px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '40px'
          }}>
            <Link
              href="/"
              style={{
                backgroundColor: '#083A85',
                color: '#fff',
                padding: '11.25px 25.5px',
                borderRadius: '37.5px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 9px rgba(8, 58, 133, 0.2)',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Go Back Home
            </Link>
            <Link
              href="/user/help-center"
              style={{
                backgroundColor: 'transparent',
                color: '#083A85',
                padding: '11.25px 25.5px',
                borderRadius: '37.5px',
                border: '1.5px solid #083A85',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Get Help
            </Link>
          </div>

          {/* Helpful Links */}
          <div style={{
            marginTop: '60px',
            paddingTop: '40px',
            borderTop: '2px solid rgba(8, 58, 133, 0.1)'
          }}>
            <p style={{
              fontSize: '16px',
              color: '#1f1d1d',
              marginBottom: '20px',
              fontWeight: 600
            }}>
              Quick Links
            </p>
            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link
                href="/"
                style={{
                  color: '#083A85',
                  fontSize: '15px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'opacity 0.2s'
                }}
              >
                Photographers
              </Link>
              <Link
                href="/"
                style={{
                  color: '#083A85',
                  fontSize: '15px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'opacity 0.2s'
                }}
              >
                Events
              </Link>
              <Link
                href="/user/about"
                style={{
                  color: '#083A85',
                  fontSize: '15px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'opacity 0.2s'
                }}
              >
                About
              </Link>
              <Link
                href="/user/contact_us"
                style={{
                  color: '#083A85',
                  fontSize: '15px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'opacity 0.2s'
                }}
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
