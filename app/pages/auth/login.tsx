'use client';
import React, { useState } from 'react';

export default function LoginPage(): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isDisabled = !email || !password;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      console.log('Login submitted:', { email, password });
      // Add your login logic here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-4 sm:p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* Left Side - Gradient Card (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#6b7280] to-[#d4a574] p-8 lg:p-12 flex-col items-center justify-between min-h-[400px] lg:min-h-[600px]">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Three Connected Icons */}
            <div className="mb-6 relative">
              <div className="flex items-center gap-8">
                {/* Photo Camera Icon */}
                <div className="relative">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18Z" fill="#3f3f46"/>
                    <circle cx="12" cy="13" r="3" fill="#3f3f46"/>
                  </svg>
                  {/* Connection line to user */}
                  <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-[#3f3f46]"></div>
                </div>

                {/* User Icon (positioned higher) */}
                <div className="relative -mt-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#3f3f46"/>
                  </svg>
                </div>

                {/* Video Camera Icon */}
                <div className="relative">
                  <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-[#3f3f46]"></div>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="#3f3f46"/>
                  </svg>
                </div>
              </div>
            </div>

            <h2 className="text-xl lg:text-2xl font-bold text-[#3f3f46] max-w-xs">
              Connect with photographer or videographer
            </h2>
          </div>

          {/* Pagination Dots */}
          <div className="flex gap-2 mt-8">
            <div className="w-2 h-2 bg-gray-600 rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full opacity-50"></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full opacity-50"></div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center py-6 sm:py-8 min-h-[600px] lg:min-h-0">
          <div className="w-full max-w-md px-6 sm:px-8 md:px-12">
            <h1 className="text-xl sm:text-2xl font-bold text-center text-black mb-8 sm:mb-8">Log into your account</h1>

            {/* Social Login Buttons */}
            <h2 className="text-lg sm:text-xl font-normal text-left text-black mb-3 sm:mb-6">continue with:</h2>
            <div className="flex gap-2 sm:gap-3 mb-8 sm:mb-6">
              {/* Google Button */}
              <button className="flex-1 py-2.5 sm:py-3 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Instagram Button */}
              <button className="flex-1 py-2.5 sm:py-3 flex items-center justify-center rounded-lg bg-[#0095f6] hover:bg-[#0086e0] transition-all duration-300 cursor-pointer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="white"/>
                </svg>
              </button>

              {/* Apple Button */}
              <button className="flex-1 py-2.5 sm:py-3 flex items-center justify-center rounded-lg bg-black hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="white"/>
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center mb-8 sm:mb-6">
              <hr className="flex-1 border-gray-300" />
              <span className="px-3 sm:px-4 text-sm text-gray-600 font-bold">or</span>
              <hr className="flex-1 border-gray-300" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6 sm:space-y-6">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="caicedomoise25@gmail.com"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Enter Email Address/Phone associated with your account</p>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your Password"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-base sm:text-lg`}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 sm:mt-8">
                <button
                  type="submit"
                  disabled={isDisabled}
                  className={`w-full py-2.5 sm:py-3 text-sm sm:text-base rounded-lg font-medium transition-all duration-300 ${
                    isDisabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  }`}
                >
                  Log in
                </button>
              </div>
            </form>

            {/* Links */}
            <div className="mt-8 space-y-2">
              <a href="#" className="block text-blue-600 hover:underline text-sm underline font-medium">
                Forgot your password?
              </a>
              <p className="text-sm text-gray-600">
                Not registered yet?{' '}
                <a href="#" className="text-blue-600 hover:underline underline font-medium">
                  Create an account
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}