'use client';

import React, { useState } from 'react';
import {
  FaFacebookF,
  FaLinkedinIn,
  FaXTwitter,
  FaInstagram,
} from 'react-icons/fa6';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    console.log('Subscribing email:', email);
    setEmail('');
  };

  return (
    // Use a relative container to position the subscribe form
    <footer className="relative w-full mt-40">
      {/* Subscribe Section - Positioned to overlap the top of the footer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-4 z-10">
        <form
          onSubmit={handleSubscribe}
          className="flex items-center bg-white rounded-full p-2 shadow-lg"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Email Address"
            className="w-full px-5 py-2.5 bg-transparent text-gray-900 text-base font-pragati-narrow border-none focus:outline-none"
            required
          />
          <button
            type="submit"
            className="px-8 py-4 bg-[#103E83] hover:bg-[#0d3268] text-white font-bold rounded-full transition-colors font-pragati-narrow tracking-wide text-base flex-shrink-0 cursor-pointer"
          >
            SUBSCRIBE
          </button>
        </form>
      </div>

      {/* Main Footer Body */}
      <div className="w-full bg-gradient-to-r from-[#052047] via-[#052047] to-[#103E83] rounded-t-2xl">
        {/* Add significant top padding (pt-24) to create space for the subscribe form */}
        <div className="max-w-7xl mx-auto px-8 pt-24 pb-10">
          {/* Main Footer Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-20">
            {/* Amoria Connekt Section */}
            <div className="lg:col-span-2">
              <h3 className="text-white text-2xl font-bold mb-3 font-pragati-narrow">
                Amoria Connekt
              </h3>
              <p className="text-gray-200 text-base mb-5 font-pragati-narrow leading-relaxed">
                Connecting moments, creating memories. Your trusted platform for
                professional event photography and live streaming.
              </p>
              <div className="flex items-center gap-3">
                <span className="text-gray-200 text-sm font-pragati-narrow">
                  Follow us:
                </span>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <FaFacebookF className="text-lg" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn className="text-lg" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 hover:text-white transition-colors"
                  aria-label="X (Twitter)"
                >
                  <FaXTwitter className="text-lg" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram className="text-lg" />
                </a>
              </div>
            </div>

            {/* For Clients Section */}
            <div>
              <h4 className="text-gray-400 text-xl font-bold mb-3 font-pragati-narrow">
                For Clients
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/find-photographer"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Find A Photographer
                  </a>
                </li>
                <li>
                  <a
                    href="/how-it-works"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    How it Works
                  </a>
                </li>
                <li>
                  <a
                    href="/browse-events"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Browse Events
                  </a>
                </li>
              </ul>
            </div>

            {/* For Photographers Section */}
            <div>
              <h4 className="text-gray-400 text-xl font-bold mb-3 font-pragati-narrow">
                For Photographers
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/join-photographer"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Join As Photographer
                  </a>
                </li>
                <li>
                  <a
                    href="/photographer-guide"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Photographer Guide
                  </a>
                </li>
                <li>
                  <a
                    href="/portfolio-tips"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Portfolio Tips
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Section */}
            <div>
              <h4 className="text-gray-400 text-xl font-bold mb-3 font-pragati-narrow">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/about"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Section */}
            <div>
              <h4 className="text-gray-400 text-xl font-bold mb-3 font-pragati-narrow">
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/help-center"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy-policy"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms-of-service"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/trust-safety"
                    className="text-gray-200 hover:text-white transition-colors text-lg font-pragati-narrow"
                  >
                    Trust & Safety
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="border-t border-white/30 mt-12 pt-8 text-center">
            <p className="text-gray-200 text-lg font-pragati-narrow">
              © 2025 Amoria Connekt. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}