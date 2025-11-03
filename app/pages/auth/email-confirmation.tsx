'use client';
import React from 'react';

export default function EmailConfirmationPage(): React.JSX.Element {
  // The OTP is represented as a string, which we will split for individual display.
  const otpCode = '040403';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#F4F6F7',
        fontFamily: `'Pragati Narrow', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
        overflow: 'hidden',
      }}
    >
      {/* Top section with the gradient background, header, and card */}
      <div
        style={{
          position: 'relative',
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px',
          background: 'linear-gradient(180deg, rgba(8, 58, 133, 1) 0%, rgba(8, 58, 133, 0.6) 40%, rgba(217, 217, 217, 1) 55%, rgba(217, 217, 217, 0.8) 70%, rgba(227, 54, 41, 1) 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Gradient Overlays */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(63deg, rgba(8, 58, 133, 1) 0%, rgba(8, 58, 133, 0) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 90% 0%, rgba(137, 89, 0, 1) 0%, rgba(255, 166, 0, 1) 0%, rgba(255, 166, 0, 0) 90%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header Section */}  
        <div style={{ width: '100%', maxWidth: '56rem', padding: '0.5rem 0', position: 'relative', zIndex: 1 }}>
          <p
            style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#ffffff', 
              textAlign: 'center',
            }}
          >
            Amoria connekyt
          </p>
        </div>

        {/* Spacer to push the card down from the header */}
        <div style={{ minHeight: '30px' }} />

        {/* Main Content Card */}
        <div
          className="w-full max-w-md bg-white overflow-hidden"
          style={{
            position: 'relative',
            zIndex: 2,
            borderRadius: '16px', 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            marginBottom: '-100px', 
          }}
        >
          <div style={{ padding: '40px 48px 60px 48px' }}>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#083A85',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              Your OTP
            </h2>

            {/* Body Text */}
            <p
              style={{
                fontSize: '15px',
                color: '#566573',
                lineHeight: '1.6',
                margin: '0 auto 40px auto',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              Thank you for choosing Amoria connekyt. Use the following OTP
              to complete the procedure to verify your email address. OTP is
              valid for <strong>10 minutes</strong>.
            </p>

            {/* OTP Display - Individual Numbers */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px', 
                marginBottom: '0',
              }}
            >
              {otpCode.split('').map((digit, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: '36px',
                    fontWeight: '500',
                    color: '#083A85',
                    width: '44px',
                    textAlign: 'center',
                  }}
                >
                  {digit}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flexGrow: 1 }} />
      </div>

      {/* Footer Section */}
      <div style={{ padding: '80px 24px 40px 24px', textAlign: 'center' }}>
        <p
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#083A85',
            marginBottom: '12px',
          }}
        >
          Amoria connekyt
        </p>
        <p
          style={{
            fontSize: '12px',
            color: '#083A85',
            marginBottom: '6px',
          }}
        >
          KN 5 Road, Remera, Gasabo District, Kigali, Rwanda
        </p>
        <p
          style={{
            fontSize: '12px',
            color: '#083A85',
          }}
        >
          Copyright &copy; 2025 Amoria connekyt. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export { EmailConfirmationPage };