'use client';
import React, { useState } from 'react';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-4 sm:p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* Left Side - Gradient Card (Hidden on mobile) */}
        <div
          className="hidden lg:flex lg:w-1/2 p-8 lg:p-12 flex-col items-center justify-between min-h-[400px] lg:min-h-[600px] relative overflow-hidden"
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #E8D5B7 0%, #F5E6D3 15%, #FDB366 35%, #FF9A56 50%, #FF8C42 60%, #6B9FD8 80%, #4A7BC2 90%, #2D5FA8 100%)'
          }}
        >
          <div className="flex flex-col items-center" style={{ paddingTop: '30px', paddingBottom: '20px', position: 'relative', zIndex: 1, flex: 1, justifyContent: 'space-between' }}>
            <div className="flex flex-col items-center" style={{ width: '100%' }}>
              {/* Video/Image Frame */}
              <div style={{
                width: '200px',
                height: '130px',
                border: '5px solid #3B82F6',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: '50px',
                backgroundColor: '#000'
              }}>
                <img src="https://i.pinimg.com/736x/d7/31/69/d7316922309529db5701f6c2bf63c8b8.jpg" alt="Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              </div>

              <h2 className="font-bold text-black text-center" style={{
                fontSize: '20px',
                lineHeight: '1.5',
                maxWidth: '280px',
                fontWeight: '700'
              }}>
                Launch your event and let it dazzle with guests from afar!
              </h2>
            </div>

            {/* Pagination Dots */}
            <div className="flex" style={{ marginBottom: '10px', position: 'relative', zIndex: 1, gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '50%' }}></div>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '50%' }}></div>
              <div style={{ width: '28px', height: '8px', backgroundColor: '#3B82F6', borderRadius: '4px' }}></div>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '50%' }}></div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center py-6 sm:py-8 min-h-[600px] lg:min-h-0">
          <div className="w-full max-w-md px-6 sm:px-8 md:px-12">
            <h1 className="text-xl sm:text-2xl font-bold text-center text-black mb-8 sm:mb-8">Create your account</h1>

            {/* Social Login Buttons */}
            <h2 className="text-sm font-normal text-center text-gray-600" style={{ marginBottom: '16px' }}>or</h2>
            <div style={{ marginBottom: '24px' }}>
              {/* Google Button */}
              <button
                type="button"
                className="w-full py-3 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                style={{ marginBottom: '20px' }}
              >
                <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium text-gray-700">Continue with Google</span>
              </button>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                    First name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your First Name"
                    className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    style={{ padding: '12px 14px', fontSize: '14px' }}
                  />
                  {errors.firstName && <p className="text-xs text-red-600" style={{ marginTop: '6px' }}>{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                    Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your Last Name"
                    className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    style={{ padding: '12px 14px', fontSize: '14px' }}
                  />
                  {errors.lastName && <p className="text-xs text-red-600" style={{ marginTop: '6px' }}>{errors.lastName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                    Your email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Provide your working Email Address"
                    className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    style={{ padding: '12px 14px', fontSize: '14px' }}
                  />
                  {errors.email && <p className="text-xs text-red-600" style={{ marginTop: '6px' }}>{errors.email}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                    Phone
                  </label>
                  <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent overflow-hidden">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="border-0 border-r border-gray-300 focus:ring-0 focus:outline-none bg-white cursor-pointer"
                      style={{ padding: '12px 10px', fontSize: '14px' }}
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
                      className="flex-1 border-0 focus:ring-0 focus:outline-none"
                      style={{ padding: '12px 14px', fontSize: '14px' }}
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-xs text-red-600" style={{ marginTop: '6px' }}>{errors.phoneNumber}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong Password"
                      className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      style={{ padding: '12px 40px 12px 14px', fontSize: '14px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      style={{ right: '12px' }}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                    </button>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>
                    <div>1 number,</div>
                    <div>1 letter,</div>
                    <div>1 special character (@!#$%^&*=+)</div>
                    <div>8 characters</div>
                  </div>
                  {errors.password && <p className="text-xs text-red-600" style={{ marginTop: '6px' }}>{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700" style={{ marginBottom: '8px' }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your Password"
                      className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      style={{ padding: '12px 40px 12px 14px', fontSize: '14px' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      style={{ right: '12px' }}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-600" style={{ marginTop: '6px' }}>{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div style={{ marginTop: '16px', fontSize: '11px', color: '#6b7280', textAlign: 'left' }}>
                By creating an account, you consent that you have read and agree to our{' '}
                <a href="#" className="text-blue-600 hover:underline">Terms of Service and Privacy Policy</a>.
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '24px' }}>
                <button
                  type="submit"
                  className="w-full rounded-lg font-medium text-white cursor-pointer transition-all duration-300"
                  style={{
                    padding: '14px',
                    fontSize: '15px',
                    backgroundColor: '#3b82f6',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  Create account
                </button>
              </div>
            </form>

            {/* Links */}
            <div style={{ marginTop: '20px' }}>
              <p className="text-sm text-gray-600 text-center">
                Already have account?{' '}
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  Log in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
