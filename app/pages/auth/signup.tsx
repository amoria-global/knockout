'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function SignupPage(): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+250');
  const [phoneNumber, setPhoneNumber] = useState('');

  const countries = [
    { name: 'Rwanda', code: '+250', flag: '🇷🇼' },
    { name: 'Kenya', code: '+254', flag: '🇰🇪' },
    { name: 'Uganda', code: '+256', flag: '🇺🇬' },
    { name: 'Tanzania', code: '+255', flag: '🇹🇿' },
    { name: 'United States', code: '+1', flag: '🇺🇸' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'South Africa', code: '+27', flag: '🇿🇦' },
    { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
    { name: 'Ghana', code: '+233', flag: '🇬🇭' },
    { name: 'Ethiopia', code: '+251', flag: '🇪🇹' },
    { name: 'Egypt', code: '+20', flag: '🇪🇬' },
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'China', code: '+86', flag: '🇨🇳' },
    { name: 'Japan', code: '+81', flag: '🇯🇵' },
    { name: 'Australia', code: '+61', flag: '🇦🇺' },
    { name: 'Germany', code: '+49', flag: '🇩🇪' },
    { name: 'France', code: '+33', flag: '🇫🇷' },
  ];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isDisabled = !firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword;

  const validatePassword = (pwd: string): boolean => {
    const hasNumber = /\d/.test(pwd);
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasSpecialChar = /[@!#$%^&*=+]/.test(pwd);
    const isLongEnough = pwd.length >= 8;

    return hasNumber && hasLetter && hasSpecialChar && isLongEnough;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // Validation
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!validatePassword(password)) {
      newErrors.password = 'Password must contain at least 8 characters, 1 number, 1 letter, and 1 special character (@!#$%^&*=+)';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('Signup submitted:', {
        firstName,
        lastName,
        phone: `${countryCode}${phoneNumber}`,
        email,
        password,
      });
      // Add your signup logic here
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-4 py-4 sm:p-4">
      <div className="w-full max-w-5xl h-[90vh] max-h-[800px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* Left Side - Gradient Card (Hidden on mobile) */}
        <div
          className="hidden lg:flex lg:w-1/2 p-8 lg:p-12 flex-col items-center justify-between h-full"
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(8, 58, 133, 1) 0%, rgba(8, 58, 133, 0.6) 40%, rgba(217, 217, 217, 1) 55%, rgba(217, 217, 217, 0.8) 70%, rgba(227, 54, 41, 1) 100%)',
            overflow: 'hidden'
          }}
        >
          {/* Overlay gradients */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(63deg, rgba(8, 58, 133, 1) 0%, rgba(8, 58, 133, 0) 100%)',
            pointerEvents: 'none'
          }}></div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 90% 0%, rgba(137, 89, 0, 1) 0%, rgba(255, 166, 0, 1) 0%, rgba(255, 166, 0, 0) 90%)',
            pointerEvents: 'none'
          }}></div>

          <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex flex-col items-center" style={{ width: '100%' }}>
              {/* Video/Image Frame */}
              <div style={{
                width: '400px',
                height: '180px',
                borderRadius: '20px 0 0 20px',
                overflow: 'hidden',
                marginBottom: '13rem',
                backgroundColor: '#000'
              }}>
                <img src="/signup.png" alt="Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              </div>

              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#000000',
                marginTop: '-10rem',
                maxWidth: '280px',
                lineHeight: '1.3',
                textAlign: 'center'
              }}>
                Launch your event and let it dazzle with guests from afar!
              </h2>
            </div>
          </div>

          {/* Pagination Dots */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '180px', position: 'relative', zIndex: 1, marginBottom: '1rem' }}>
            <div style={{ width: '28px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px' }}></div>
            <div style={{ width: '28px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
            <div style={{ width: '28px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px' }}></div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center h-full overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
          <div className="w-full max-w-md px-6 sm:px-8 md:px-12 py-4 sm:py-6">
            <h1 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'left', color: '#000000', marginBottom: '24px', letterSpacing: '0.5px' }}>
              Create your first account
            </h1>

            {/* Social Login Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {/* Google Button */}
              <button style={{
                flex: '1',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '20px',
                border: '2px solid #d1d5db',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
                <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', marginTop: '16px' }}>
              <hr style={{ flex: '1', border: 'none', borderTop: '2px solid #d1d5db' }} />
              <span style={{ padding: '0 12px', fontSize: '16px', color: '#6b7280', fontWeight: '600' }}>or</span>
              <hr style={{ flex: '1', border: 'none', borderTop: '2px solid #d1d5db' }} />
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" style={{ display: 'block', fontSize: '15px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    First name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your First Name"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '15px',
                      border: '2px solid #d1d5db',
                      borderRadius: '20px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  {errors.firstName && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" style={{ display: 'block', fontSize: '15px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your Last Name"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '15px',
                      border: '2px solid #d1d5db',
                      borderRadius: '20px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  {errors.lastName && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>{errors.lastName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: '15px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '15px',
                      border: '2px solid #d1d5db',
                      borderRadius: '20px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  {errors.email && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>{errors.email}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" style={{ display: 'block', fontSize: '15px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Phone
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '2px solid #d1d5db', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{
                        border: '0',
                        borderRight: '2px solid #d1d5db',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        padding: '12px 10px',
                        fontSize: '15px'
                      }}
                    >
                      {countries.map((country) => (
                        <option key={country.code + country.name} value={country.code}>
                          {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder=""
                      style={{
                        flex: '1',
                        border: '0',
                        outline: 'none',
                        padding: '12px 14px',
                        fontSize: '15px'
                      }}
                    />
                  </div>
                  {errors.phoneNumber && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>{errors.phoneNumber}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" style={{ display: 'block', fontSize: '15px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your Password"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        paddingRight: '44px',
                        fontSize: '15px',
                        border: '2px solid #d1d5db',
                        borderRadius: '20px',
                        outline: 'none',
                        transition: 'all 0.3s',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        padding: '4px'
                      }}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    Must contain at least 8 characters, 1 number, 1 letter, and 1 special character (@!#$%^&*=+)
                  </p>
                  {errors.password && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '15px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your Password"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        paddingRight: '44px',
                        fontSize: '15px',
                        border: '2px solid #d1d5db',
                        borderRadius: '20px',
                        outline: 'none',
                        transition: 'all 0.3s',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        padding: '4px'
                      }}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div style={{ marginTop: '16px', fontSize: '15px', color: '#6b7280', textAlign: 'left', lineHeight: '1.5' }}>
                By creating an account, you consent that you have read and agree to our{' '}
                <a href="/all/terms-of-service" style={{ color: '#083A85', textDecoration: 'underline', fontWeight: '800' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="/all/privacy-policy" style={{ color: '#083A85', textDecoration: 'underline', fontWeight: '800' }}>Privacy Policy</a>.
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={isDisabled}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    borderRadius: '30px',
                    fontWeight: '600',
                    transition: 'all 0.3s',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    backgroundColor: isDisabled ? '#d1d5db' : '#083A85',
                    color: isDisabled ? '#9ca3af' : '#ffffff',
                    border: 'none'
                  }}
                >
                  Create account
                </button>
              </div>
            </form>

            {/* Links */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ fontSize: '15px', color: '#6b7280' }}>
                Already have an account?{' '}
                <Link href="/all/login" style={{ color: '#083A85', textDecoration: 'underline', fontWeight: '800' }}>
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
