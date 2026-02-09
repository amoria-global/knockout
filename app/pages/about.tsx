"use client";

import Navbar from "../components/navbar";
import Footer from "../components/footer";
import MissionStatement from "../components/MissionStatement";
import RotatingGlobe from "../components/RotatingGlobe";
import { motion } from "framer-motion";

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
        @keyframes gentleSwing {
          0%, 100% {
            transform: rotate(var(--rotation)) translateY(0);
          }
          50% {
            transform: rotate(calc(var(--rotation) * -1)) translateY(-3px);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .hanging-tag-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .hanging-tag-card:hover {
          transform: rotate(0deg) scale(1.05) translateY(-10px) !important;
          z-index: 10;
        }
        .hanging-tag-card:hover .tag-body {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 30px rgba(139, 92, 246, 0.15);
        }
        .hanging-tag-card:hover .tag-icon {
          transform: scale(1.2) rotate(10deg);
        }
        .hanging-tag-card:hover .tag-clip {
          background: linear-gradient(135deg, #8B5CF6 0%, #FF6B6B 100%);
        }
        @keyframes floatUp {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes floatUpAlt {
          0%, 100% {
            transform: translateY(-8px);
          }
          50% {
            transform: translateY(4px);
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 4px 12px var(--glow-color);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 8px 25px var(--glow-color);
            transform: scale(1.08);
          }
        }
        @keyframes iconPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.8;
          }
        }
        @keyframes lineFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        @keyframes verticalLinePulse {
          0%, 100% {
            opacity: 0.5;
            height: var(--line-height);
          }
          50% {
            opacity: 1;
            height: calc(var(--line-height) + 5px);
          }
        }
        @keyframes dotPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }
        @keyframes shadowPulse {
          0%, 100% {
            box-shadow: 8px 8px 20px rgba(0, 0, 0, 0.1), -8px -8px 20px rgba(255, 255, 255, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
          }
          50% {
            box-shadow: 12px 12px 30px rgba(0, 0, 0, 0.15), -12px -12px 30px rgba(255, 255, 255, 1), inset 0 0 0 2px rgba(255, 255, 255, 0.8);
          }
        }
        /* Core Values - Static (no animations) */
        .core-value-circle {
          animation: none !important;
        }
        .core-value-icon {
          animation: none !important;
        }
        @keyframes coreValueLineFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        .core-value-line {
          background: linear-gradient(90deg, #F97316, #FBBF24, #34D399, #2DD4BF, #3B82F6, #8B5CF6, #F97316, #FBBF24, #34D399, #2DD4BF, #3B82F6);
          background-size: 200% 100%;
          width: 80%;
          animation: coreValueLineFlow 4s linear infinite !important;
        }
        .core-value-number {
          animation: none !important;
        }
        .core-value-vertical-line {
          animation: none !important;
        }
        .colored-dot {
          animation: none !important;
        }
        .core-value-card:hover .core-value-circle {
          transform: scale(1.15);
          box-shadow: 8px 8px 25px rgba(0, 0, 0, 0.15), -8px -8px 25px rgba(255, 255, 255, 0.9), 0 0 30px var(--hover-color);
        }
        .core-value-card:hover .core-value-icon {
          transform: scale(1.2);
        }
        @keyframes diagonalMove {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 40px 40px;
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

        /* Default desktop font sizes - matched to homepage */
        .about-hero-title {
          font-size: 57px;
          line-height: 1.05;
        }
        .about-journey-title {
          font-size: 50px;
          line-height: 1.05;
        }
        .about-journey-card-title {
          font-size: 38px;
          line-height: 1.05;
        }
        .about-section-title {
          font-size: 38px;
          line-height: 1.05;
        }
        .about-mock-title {
          font-size: 55px;
          line-height: 1.0;
        }
        .about-cta-title {
          font-size: 55px;
          line-height: 1.1;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 1200px) {
          .about-hero-section {
            min-height: 100vh !important;
          }
          .about-hero-globe {
            top: 60px !important;
            left: 20px !important;
            opacity: 0.45 !important;
          }
          .about-hero-globe .rotating-globe {
            width: 300px !important;
            height: 300px !important;
          }
          .about-hero-globe .rotating-globe svg {
            width: 300px !important;
            height: 300px !important;
          }
          .about-hero-content {
            padding: 80px 50px !important;
            max-width: 500px !important;
          }
          .about-hero-image-container {
            width: 45% !important;
          }
          .about-hero-title {
            font-size: 48px !important;
            line-height: 1.05 !important;
          }
          .about-journey-title,
          .about-mock-title,
          .about-cta-title {
            font-size: 45px !important;
            line-height: 1.1 !important;
          }
          .about-journey-card-title,
          .about-section-title {
            font-size: 36px !important;
            line-height: 1.15 !important;
          }
          .about-hero-section p {
            font-size: 15px !important;
          }
          .about-journey-container {
            padding: 40px 30px !important;
          }
          .core-values-cards {
            flex-wrap: wrap !important;
            gap: 20px !important;
          }
          .core-values-cards > div {
            margin: 0 !important;
          }
          .core-values-cards > div > div {
            width: 280px !important;
            height: 300px !important;
            margin: 0 -40px !important;
          }
        }

        @media (max-width: 992px) {
          .about-hero-globe {
            top: 40px !important;
            left: 10px !important;
            opacity: 0.35 !important;
          }
          .about-hero-globe .rotating-globe {
            width: 220px !important;
            height: 220px !important;
          }
          .about-hero-globe .rotating-globe svg {
            width: 220px !important;
            height: 220px !important;
          }
          .about-hero-content {
            padding: 80px 40px !important;
            max-width: 450px !important;
          }
          .about-hero-image-container {
            width: 42% !important;
          }
          .about-hero-title {
            font-size: 40px !important;
            line-height: 1.1 !important;
          }
          .about-journey-title,
          .about-mock-title,
          .about-cta-title {
            font-size: 38px !important;
            line-height: 1.15 !important;
          }
          .about-journey-card-title,
          .about-section-title {
            font-size: 32px !important;
            line-height: 1.15 !important;
          }
          .about-hero-section p {
            font-size: 15px !important;
            max-width: 90% !important;
          }
          .about-journey-container h2,
          .about-journey-container h3 {
            font-size: 30px !important;
          }
          .mission-vision-grid {
            grid-template-columns: 1fr !important;
          }
          .mission-vision-grid > div {
            width: 100% !important;
          }
          .core-values-cards > div > div {
            width: 240px !important;
            height: 260px !important;
            margin: 0 -30px !important;
          }
          .core-values-cards > div > div > div {
            width: 55% !important;
          }
          .core-values-cards > div > div > div h4 {
            font-size: 16px !important;
            margin-bottom: 15px !important;
          }
          .core-values-cards > div > div > div p {
            font-size: 13px !important;
          }
        }

        @media (max-width: 768px) {
          .about-hero-globe {
            top: auto !important;
            bottom: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            opacity: 0.2 !important;
          }
          .about-hero-globe .rotating-globe {
            width: 180px !important;
            height: 180px !important;
          }
          .about-hero-globe .rotating-globe svg {
            width: 180px !important;
            height: 180px !important;
          }
          .about-hero-section {
            min-height: 100vh !important;
            padding: 0 !important;
          }
          .about-hero-content {
            padding: 100px 30px 80px !important;
            max-width: 100% !important;
          }
          .about-hero-title {
            font-size: 32px !important;
            line-height: 1.1 !important;
          }
          .about-journey-title,
          .about-mock-title,
          .about-cta-title {
            font-size: 28px !important;
            line-height: 1.15 !important;
          }
          .about-journey-card-title,
          .about-section-title {
            font-size: 24px !important;
            line-height: 1.15 !important;
          }
          .about-hero-section p {
            font-size: 14px !important;
            line-height: 1.5 !important;
          }
          .about-hero-image-container {
            display: none !important;
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
          .core-values-cards {
            flex-direction: column !important;
            align-items: center !important;
            gap: 15px !important;
          }
          .core-values-cards > div > div {
            width: 300px !important;
            height: 280px !important;
            margin: 0 !important;
            animation: pendulumSwingLeft 2s ease-in-out infinite !important;
          }
          .core-values-cards > div:nth-child(even) > div {
            animation: pendulumSwingRight 2s ease-in-out infinite !important;
          }
          .core-values-cards > div > div > img {
            height: 100% !important;
          }
          .core-values-cards > div > div > div {
            width: 48% !important;
            padding-top: 15px !important;
            top: 45% !important;
          }
          .core-values-cards > div > div > div h4 {
            font-size: 16px !important;
            margin-bottom: 10px !important;
          }
          .core-values-cards > div > div > div p {
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
            min-height: 100vh !important;
            padding: 0 !important;
          }
          .about-hero-content {
            padding: 40px 30px !important;
          }
          .about-hero-image-container {
            width: 35% !important;
          }
        }

        @media (max-width: 480px) {
          .about-hero-globe {
            display: none !important;
          }
          .about-hero-section {
            min-height: 100vh !important;
            padding: 0 !important;
          }
          .about-hero-content {
            padding: 80px 20px 60px !important;
            max-width: 100% !important;
          }
          .about-hero-title {
            font-size: 28px !important;
            line-height: 1.1 !important;
          }
          .about-journey-title,
          .about-mock-title,
          .about-cta-title {
            font-size: 26px !important;
            line-height: 1.15 !important;
          }
          .about-journey-card-title,
          .about-section-title {
            font-size: 22px !important;
            line-height: 1.15 !important;
          }
          .about-hero-section p {
            font-size: 13px !important;
          }
          .about-hero-image-container {
            display: none !important;
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
          .core-values-cards > div > div {
            width: 280px !important;
            height: 260px !important;
            animation: pendulumSwingLeft 2s ease-in-out infinite !important;
          }
          .core-values-cards > div:nth-child(even) > div {
            animation: pendulumSwingRight 2s ease-in-out infinite !important;
          }
          .core-values-cards > div > div > div {
            width: 50% !important;
            padding-top: 12px !important;
            top: 45% !important;
          }
          .core-values-cards > div > div > div h4 {
            font-size: 14px !important;
            margin-bottom: 8px !important;
          }
          .core-values-cards > div > div > div p {
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

        /* ===== CONSOLIDATED MOBILE RESPONSIVE STYLES ===== */

        /* Tablet Breakpoint - 768px */
        @media (max-width: 768px) {
          /* Hero Section */
          .about-hero-section {
            min-height: auto !important;
            padding: 0 !important;
            flex-direction: column !important;
          }
          .about-hero-content {
            padding: 100px 20px 40px !important;
            max-width: 100% !important;
            text-align: center !important;
            position: relative !important;
            z-index: 10 !important;
          }
          .about-hero-content a {
            display: block !important;
            width: fit-content !important;
            margin: 0 auto !important;
          }
          .about-hero-image-container {
            position: relative !important;
            width: 100% !important;
            height: 350px !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-end !important;
            right: auto !important;
            bottom: auto !important;
          }
          .about-hero-image-container > div {
            height: 100% !important;
            display: flex !important;
            justify-content: center !important;
          }
          .about-hero-image-container img {
            height: 100% !important;
            width: auto !important;
            max-width: 100% !important;
          }
          .about-hero-title {
            font-size: 36px !important;
          }

          /* Target Market Section */
          .about-target-market-section {
            padding: 60px 20px !important;
          }
          .about-target-market-section > div {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          .about-target-market-section h2 {
            font-size: 36px !important;
            text-align: center !important;
          }
          .about-target-market-section > div > div:first-child {
            text-align: center !important;
          }
          .about-target-market-section > div > div:nth-child(2) {
            height: 300px !important;
            order: -1 !important;
          }
          .about-target-market-section > div > div:last-child {
            text-align: center !important;
          }

          /* Journey Section */
          .about-journey-section {
            padding: 40px 20px !important;
          }
          .about-journey-container {
            padding: 30px 20px !important;
            gap: 30px !important;
          }
          .about-journey-container h2 {
            font-size: 32px !important;
          }

          /* Mission & Vision Section */
          .about-mission-vision-section {
            padding: 60px 20px !important;
          }
          .about-mission-vision-section > div {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          .about-mission-vision-section > div > div {
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Core Values Section */
          .about-core-values-section {
            padding: 60px 20px !important;
          }
          .about-core-values-section h2 {
            font-size: 32px !important;
          }
          .about-core-values-section > div > div:last-child {
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 20px !important;
          }
          .about-core-values-section > div > div:last-child > div {
            width: calc(50% - 10px) !important;
            min-width: 140px !important;
          }

          /* Smart Tools / Laptop Section */
          .about-smart-tools-section {
            padding: 60px 16px !important;
          }
          .about-smart-tools-section h2 {
            font-size: 28px !important;
          }
          .about-smart-tools-section > div > div:first-child p {
            font-size: 15px !important;
          }
          /* Hide sidebar on tablet/mobile */
          .smart-tools-sidebar {
            display: none !important;
          }
          /* Dashboard content padding */
          .smart-tools-dashboard {
            padding: 16px !important;
            min-height: 320px !important;
          }
          /* Stats grid stays 3 columns but smaller */
          .smart-tools-stats-grid {
            gap: 10px !important;
          }
          .smart-tools-stats-grid > div {
            padding: 12px !important;
          }
          /* Feature highlights */
          .smart-tools-features {
            gap: 24px !important;
            margin-top: 30px !important;
          }

          /* Mock CTA Section */
          .about-mock-section {
            margin: 0 20px !important;
          }
          .about-mock-container {
            min-height: 400px !important;
            border-radius: 20px !important;
          }
          .about-mock-overlay {
            padding: 40px 24px !important;
            min-height: 400px !important;
          }
          .about-mock-content {
            max-width: 100% !important;
          }
          .about-mock-title {
            font-size: 32px !important;
          }
          .about-mock-subtitle {
            font-size: 15px !important;
          }

          /* Final CTA Section */
          .about-final-cta-section {
            padding: 60px 20px !important;
          }
          .about-cta-container {
            flex-direction: column !important;
            gap: 30px !important;
            padding-right: 0 !important;
          }
          .about-cta-image {
            width: 100% !important;
            min-height: 280px !important;
            height: auto !important;
            margin-left: 0 !important;
            order: -1 !important;
          }
          .about-cta-content {
            max-width: 100% !important;
            text-align: center !important;
          }
          .about-cta-title {
            font-size: 32px !important;
          }
          .about-cta-buttons {
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
        }

        /* Small Mobile Breakpoint - 480px */
        @media (max-width: 480px) {
          /* Hero Section */
          .about-hero-content {
            padding: 80px 16px 30px !important;
          }
          .about-hero-title {
            font-size: 28px !important;
          }
          .about-hero-section p {
            font-size: 14px !important;
          }
          .about-hero-image-container {
            height: 280px !important;
          }

          /* Target Market Section */
          .about-target-market-section {
            padding: 50px 16px !important;
          }
          .about-target-market-section h2 {
            font-size: 28px !important;
          }
          .about-target-market-section > div > div:nth-child(2) {
            height: 250px !important;
          }

          /* Journey Section */
          .about-journey-section {
            padding: 30px 12px !important;
          }
          .about-journey-container {
            padding: 20px 15px !important;
          }
          .about-journey-container h2 {
            font-size: 26px !important;
          }
          .about-journey-container p {
            font-size: 13px !important;
          }

          /* Mission & Vision Section */
          .about-mission-vision-section {
            padding: 50px 16px !important;
          }
          .about-mission-vision-section h3 {
            font-size: 22px !important;
          }

          /* Core Values Section */
          .about-core-values-section {
            padding: 50px 16px !important;
          }
          .about-core-values-section h2 {
            font-size: 26px !important;
          }
          .about-core-values-section > div > div:last-child > div {
            width: 100% !important;
          }

          /* Smart Tools Section */
          .about-smart-tools-section {
            padding: 40px 12px !important;
          }
          .about-smart-tools-section h2 {
            font-size: 22px !important;
          }
          .about-smart-tools-section > div > div:first-child p {
            font-size: 14px !important;
          }
          /* Dashboard content smaller on mobile */
          .smart-tools-dashboard {
            padding: 12px !important;
            min-height: 280px !important;
          }
          /* Stats grid - smaller on mobile */
          .smart-tools-stats-grid {
            gap: 8px !important;
          }
          .smart-tools-stats-grid > div {
            padding: 10px !important;
          }
          .smart-tools-stats-grid > div p {
            font-size: 10px !important;
          }
          .smart-tools-stats-grid > div span {
            font-size: 16px !important;
          }
          /* Feature highlights - 2x2 grid */
          .smart-tools-features {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
            margin-top: 24px !important;
          }
          .smart-tools-features > div {
            justify-content: center !important;
          }
          .smart-tools-features span {
            font-size: 12px !important;
          }

          /* Mock CTA Section */
          .about-mock-section {
            margin: 0 12px !important;
          }
          .about-mock-container {
            min-height: 350px !important;
            border-radius: 16px !important;
          }
          .about-mock-overlay {
            padding: 30px 20px !important;
            min-height: 350px !important;
          }
          .about-mock-title {
            font-size: 24px !important;
          }
          .about-mock-subtitle {
            font-size: 14px !important;
          }
          .about-mock-content a {
            padding: 12px 24px !important;
            font-size: 14px !important;
          }

          /* Final CTA Section */
          .about-final-cta-section {
            padding: 50px 16px !important;
          }
          .about-cta-container {
            gap: 24px !important;
          }
          .about-cta-image {
            min-height: 220px !important;
          }
          .about-cta-title {
            font-size: 24px !important;
          }
          .about-cta-subtitle {
            font-size: 14px !important;
          }
          .about-cta-buttons {
            flex-direction: column !important;
            width: 100% !important;
          }
          .about-cta-buttons button {
            width: 100% !important;
          }
        }
      `}</style>
      <Navbar />

      {/* Header/Hero Section - Corporate Business Style */}
      <section
        className="about-hero-section"
        style={{
          backgroundColor: '#1a1a2e',
          position: 'relative',
          padding: '0',
          overflow: 'hidden',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Background Image - Corporate Building */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 1,
            filter: 'grayscale(40%) blur(3px) brightness(0.6)',
          }}
        />
        {/* Dark blur overlay for background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1,
          }}
        />

        {/* Cameraman Image with Diagonal Lines Pattern Overlay */}
        <div
          className="about-hero-image-container"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            height: '100%',
            width: '55%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            zIndex: 3,
          }}
        >
          <div
            style={{
              position: 'relative',
              height: '100%',
              maxWidth: '100%',
            }}
          >
            <img
              src="/camman.png"
              alt="Professional photographer"
              style={{
                height: '100%',
                width: 'auto',
                objectFit: 'contain',
                objectPosition: 'bottom right',
              }}
            />
            {/* Static Diagonal Lines - One direction */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 12px,
                    rgba(255, 255, 255, 0.5) 12px,
                    rgba(255, 255, 255, 0.5) 14px
                  )
                `,
                WebkitMaskImage: 'url(/camman.png)',
                maskImage: 'url(/camman.png)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'bottom right',
                maskPosition: 'bottom right',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                pointerEvents: 'none',
              }}
            />
            {/* Moving Diagonal Lines - Other direction with gradient color */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  repeating-linear-gradient(
                    -45deg,
                    transparent,
                    transparent 12px,
                    rgba(139, 92, 246, 0.6) 12px,
                    rgba(139, 92, 246, 0.6) 14px
                  )
                `,
                WebkitMaskImage: 'url(/camman.png)',
                maskImage: 'url(/camman.png)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'bottom right',
                maskPosition: 'bottom right',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                pointerEvents: 'none',
                animation: 'diagonalMove 4s linear infinite',
              }}
            />
          </div>
        </div>

        {/* Dark Overlay for better text readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, rgba(20, 20, 35, 0.95) 0%, rgba(20, 20, 35, 0.85) 40%, rgba(20, 20, 35, 0.4) 70%, rgba(20, 20, 35, 0.2) 100%)',
            zIndex: 2,
          }}
        />

        {/* Rotating Globe - Top Left */}
        <div
          className="about-hero-globe"
          style={{
            position: 'absolute',
            top: '50px',
            left: '30px',
            zIndex: 5,
            opacity: 0.65,
            pointerEvents: 'none',
          }}
        >
          <RotatingGlobe
            size={380}
            rotationSpeed={0.3}
            landColor="rgba(139, 92, 246, 0.35)"
            oceanColor="rgba(8, 58, 133, 0.15)"
            borderColor="rgba(139, 92, 246, 0.5)"
            graticuleColor="rgba(255, 255, 255, 0.07)"
            glowColor="rgba(139, 92, 246, 0.4)"
          />
        </div>

        {/* Content - Left Side */}
        <div
          className="about-hero-content"
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'left',
            maxWidth: '550px',
            padding: '120px 80px 80px',
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
            Amoria
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #20b2aa 0%, #48d1cc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Connekyt
            </span>
          </h1>

          <p
            className="about-hero-subtitle"
            style={{
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: '1.65',
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '500px',
              margin: '0 0 32px 0',
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
              fontSize: '14px',
              fontWeight: 600,
              padding: '14px 32px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
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
            Get Started
          </a>

          {/* Website URL */}
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0,
              marginTop: '60px',
            }}
          >
            www.amoriaconnekyt.com
          </p>
        </div>

      </section>

      {/* Our Target Market Section */}
      <section
        className="about-target-market-section"
        style={{
          padding: '80px 40px',
          backgroundColor: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background elements */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '-5%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '-5%',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 107, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 1fr',
            gap: '40px',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left Column - Title and Strategy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Main Title */}
            <div>
              <h2
                style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  margin: 0,
                  marginBottom: '8px',
                  background: 'linear-gradient(90deg, #1a1a2e 0%, #4a4a4a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Our Target
              </h2>
              <h2
                style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  margin: 0,
                  background: 'linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Market
              </h2>
            </div>

            {/* Strategy Box */}
            <div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  background: 'linear-gradient(90deg, #8B5CF6 0%, #FF6B6B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                  marginBottom: '12px',
                }}
              >
                Creative Professionals
                <br />
                Seeking Growth
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#4a4a4a',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Photographers, videographers, and visual storytellers who want to expand their reach, build their brand, and connect with clients globally.
              </p>
            </div>
          </div>

          {/* Center Column - Image */}
          <div
            style={{
              position: 'relative',
              height: '450px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Dark overlay on image */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(26, 26, 46, 0.4) 100%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
            <img
              src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
              alt="Professional photographer at work"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'grayscale(100%) blur(1px) brightness(0.7)',
              }}
            />
          </div>

          {/* Right Column - Text Blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Text Block */}
            <div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#4a4a4a',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Clients and businesses looking for verified creative talent to capture their special moments, corporate events, and brand stories with professionalism and creativity.
              </p>
            </div>

            {/* Highlighted Box */}
            <div
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #FF6B6B 100%)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
              }}
            >
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0,
                  marginBottom: '12px',
                }}
              >
                Event Organizers
              </h4>
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.95)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Wedding planners, corporate event managers, and celebration coordinators who need reliable creative coverage for memorable occasions.
              </p>
            </div>

            {/* Bottom Text Block */}
            <div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#4a4a4a',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Families and individuals wanting to preserve precious moments through professional photography and videography services.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Responsive Styles for Target Market */}
        <style>{`
          @media (max-width: 992px) {
            .about-target-market-section > div:nth-child(2) {
              grid-template-columns: 1fr !important;
              gap: 30px !important;
            }
            .about-target-market-section h2 {
              font-size: 36px !important;
            }
          }
          @media (max-width: 768px) {
            .about-target-market-section {
              padding: 60px 20px !important;
            }
            .about-target-market-section h2 {
              font-size: 32px !important;
            }
          }
        `}</style>
      </section>

      {/* Our Journey Section - Two Column Layout */}
      <section
        className="about-journey-section"
        style={{
          padding: '80px 40px',
          backgroundColor: '#f8f9fa',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '50px',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column - Journey Intro */}
          <div>
            <h2
              style={{
                fontSize: '42px',
                fontWeight: 700,
                lineHeight: 1.15,
                margin: 0,
                marginBottom: '24px',
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

            <p
              style={{
                fontSize: '16px',
                color: '#4a4a4a',
                lineHeight: 1.7,
                margin: 0,
                marginBottom: '16px',
              }}
            >
              We have taken every step with care and purpose as innovators in our field. From the debut of our first beta, to our fully functioning and integrated creative network, we have expanded with intention.
            </p>

            <p
              style={{
                fontSize: '16px',
                color: '#4a4a4a',
                lineHeight: 1.7,
                margin: 0,
                marginBottom: '16px',
              }}
            >
              We read, studied, and got acclimated to work with real individuals with real needs. Innovation is not all about features, it is all about impact. Every step was associated with new lessons, better relationships, and more trust.
            </p>

            <p
              style={{
                fontSize: '16px',
                color: '#4a4a4a',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Our trip is not finished yet- with each step we open new opportunities to the creators of the whole world.
            </p>
          </div>

          {/* Right Column - 2025 Vision Card */}
          <div
            style={{
              backgroundColor: '#E8F4F8',
              borderRadius: '20px',
              padding: '40px',
              position: 'relative',
            }}
          >
            {/* Year Badge */}
            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#fff',
                padding: '8px 24px',
                borderRadius: '30px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#063572',
                border: '2px solid #063572',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px',
              }}
            >
              2025
            </div>

            <h3
              style={{
                fontSize: '28px',
                fontWeight: 700,
                lineHeight: 1.2,
                margin: 0,
                marginBottom: '20px',
                color: '#1a1a2e',
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

            <p
              style={{
                fontSize: '15px',
                color: '#4a4a4a',
                lineHeight: 1.7,
                margin: 0,
                marginBottom: '16px',
              }}
            >
              Originally, this started as an idea, but it has started to blossom into something larger than that. People were noticing the obstacles and setbacks that creators in the industry had. They didn't have the right tools and platforms to promote themselves and their work properly. Amoria Connekyt started as a vision to promote creators, but it also helps serve as a bridge to new tools and opportunities.
            </p>

            <p
              style={{
                fontSize: '15px',
                color: '#4a4a4a',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              What began as a passion for supporting event creators, photographers, and storytellers has impacted us in numerous ways and heavily shaped the growth of our company. We listen to our customers and use their feedback and ideas to drive the changes and developments within the company. We've come a long way in our development, and, looking to the future, we will continue to evolve with our customers. We're only just getting started and are looking to build even more with you.
            </p>
          </div>
        </div>

        {/* Mobile Responsive Styles for Journey Section */}
        <style>{`
          @media (max-width: 992px) {
            .about-journey-section > div {
              grid-template-columns: 1fr !important;
              gap: 40px !important;
            }
          }
          @media (max-width: 768px) {
            .about-journey-section {
              padding: 60px 20px !important;
            }
            .about-journey-section h2 {
              font-size: 32px !important;
            }
            .about-journey-section h3 {
              font-size: 24px !important;
            }
          }
        `}</style>
      </section>

      {/* Mission & Vision Section */}
      <section
        className="about-mission-vision-section"
        style={{
          padding: '80px 40px',
          backgroundColor: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
          }}
        >
          {/* Mission Card */}
          <div
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#fff',
                padding: '8px 20px',
                borderRadius: '30px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#063572',
                border: '2px solid #063572',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '20px',
              }}
            >
              <i className="bi bi-bullseye" style={{ fontSize: '16px' }} />
              Mission
            </div>

            <h3
              style={{
                fontSize: '32px',
                fontWeight: 700,
                margin: 0,
                marginBottom: '16px',
                color: '#1a1a2e',
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
                fontSize: '15px',
                color: '#4a4a4a',
                lineHeight: 1.7,
                margin: 0,
                marginBottom: '24px',
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
                    fontSize: '14px',
                    color: '#4a4a4a',
                    lineHeight: 1.6,
                    marginBottom: '12px',
                    paddingLeft: '28px',
                    position: 'relative',
                  }}
                >
                  <i
                    className="bi bi-check-circle-fill"
                    style={{
                      position: 'absolute',
                      left: 0,
                      color: '#8B5CF6',
                      fontSize: '18px',
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Vision Card */}
          <div
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#fff',
                padding: '8px 20px',
                borderRadius: '30px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#063572',
                border: '2px solid #063572',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '20px',
              }}
            >
              <i className="bi bi-globe2" style={{ fontSize: '16px' }} />
              Vision
            </div>

            <h3
              style={{
                fontSize: '32px',
                fontWeight: 700,
                margin: 0,
                marginBottom: '16px',
                color: '#1a1a2e',
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
                fontSize: '15px',
                color: '#4a4a4a',
                lineHeight: 1.7,
                margin: 0,
                marginBottom: '24px',
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
                    fontSize: '14px',
                    color: '#4a4a4a',
                    lineHeight: 1.6,
                    marginBottom: '12px',
                    paddingLeft: '28px',
                    position: 'relative',
                  }}
                >
                  <i
                    className="bi bi-check-circle-fill"
                    style={{
                      position: 'absolute',
                      left: 0,
                      color: '#FF6B6B',
                      fontSize: '18px',
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile Responsive Styles for Mission & Vision */}
        <style>{`
          @media (max-width: 992px) {
            .about-mission-vision-section > div {
              grid-template-columns: 1fr !important;
              gap: 30px !important;
            }
          }
          @media (max-width: 768px) {
            .about-mission-vision-section {
              padding: 60px 20px !important;
            }
            .about-mission-vision-section h3 {
              font-size: 26px !important;
            }
          }
        `}</style>
      </section>

      {/* Our Core Values Section */}
      <section
        className="about-core-values-section"
        style={{
          padding: '80px 40px 120px',
          backgroundColor: '#EAECEE',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
          }}
        >
          {/* Section Title */}
          <div style={{ textAlign: 'center', marginBottom: '20px', overflow: 'hidden' }}>
            <h2
              style={{
                fontSize: '48px',
                fontWeight: 700,
                lineHeight: 1.15,
                margin: 0,
                color: '#1a1a2e',
                letterSpacing: '2px',
                display: 'flex',
                justifyContent: 'center',
                gap: '0px',
              }}
            >
              {'CORE VALUES'.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, rotateX: -90 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  viewport={{ once: false, amount: 0.5 }}
                  style={{
                    display: 'inline-block',
                    minWidth: char === ' ' ? '16px' : 'auto',
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </h2>
          </div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            viewport={{ once: false, amount: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}
          >
            <p
              style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Our values define who we are and guide every decision we make. They represent our commitment to excellence, innovation, and the well-being of our creative community.
            </p>
          </motion.div>

          {/* Colored Dots */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            viewport={{ once: false, amount: 0.5 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '60px' }}
          >
            {['#F97316', '#FBBF24', '#34D399', '#2DD4BF', '#3B82F6'].map((color, i) => (
              <motion.div
                key={i}
                className="colored-dot"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1, type: 'spring', stiffness: 300 }}
                viewport={{ once: false }}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}50`,
                }}
              />
            ))}
          </motion.div>

          {/* Values Cards with Timeline */}
          <div className="core-values-timeline" style={{ position: 'relative', paddingBottom: '80px' }}>
            {/* Horizontal connecting line */}
            <motion.div
              className="core-value-line"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              viewport={{ once: false, amount: 0.3 }}
              style={{
                position: 'absolute',
                bottom: '15px',
                left: '10%',
                height: '3px',
                borderRadius: '2px',
                zIndex: 1,
                transformOrigin: 'left center',
              }}
            />

            {/* Cards Container */}
            <div
              className="core-values-cards-container"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '20px',
              }}
            >
              {[
                {
                  title: 'INNOVATION',
                  icon: 'bi-lightbulb',
                  color: '#F97316',
                  number: 1,
                  offset: 0,
                },
                {
                  title: 'TRUST',
                  icon: 'bi-shield-check',
                  color: '#FBBF24',
                  number: 2,
                  offset: 40,
                },
                {
                  title: 'EXCELLENCE',
                  icon: 'bi-award',
                  color: '#34D399',
                  number: 3,
                  offset: 0,
                },
                {
                  title: 'WELLNESS',
                  icon: 'bi-heart',
                  color: '#2DD4BF',
                  number: 4,
                  offset: 40,
                },
                {
                  title: 'GROWTH',
                  icon: 'bi-graph-up-arrow',
                  color: '#3B82F6',
                  number: 5,
                  offset: 0,
                },
              ].map((value, index) => (
                <motion.div
                  key={index}
                  className="core-value-card"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.15, ease: 'easeOut' }}
                  viewport={{ once: false, amount: 0.2 }}
                  whileHover={{ y: -8 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    marginTop: `${value.offset}px`,
                  }}
                >
                  {/* Circle Card */}
                  <motion.div
                    className="core-value-circle"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.15, type: 'spring', stiffness: 200 }}
                    viewport={{ once: false, amount: 0.2 }}
                    whileHover={{ scale: 1.1, boxShadow: `0 10px 30px ${value.color}30` }}
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0',
                      cursor: 'pointer',
                      position: 'relative',
                      // @ts-ignore
                      '--hover-color': `${value.color}50`,
                    }}
                  >
                    <motion.i
                      className={`bi ${value.icon} core-value-icon`}
                      initial={{ opacity: 0, rotate: -30 }}
                      whileInView={{ opacity: 1, rotate: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.15 }}
                      viewport={{ once: false }}
                      style={{
                        fontSize: '40px',
                        color: value.color,
                        display: 'inline-block',
                      }}
                    />
                  </motion.div>

                  {/* Vertical Line */}
                  <motion.div
                    className="core-value-vertical-line"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.15, ease: 'easeOut' }}
                    viewport={{ once: false }}
                    style={{
                      width: '2px',
                      backgroundColor: value.color,
                      opacity: 0.6,
                      // @ts-ignore
                      '--line-height': value.offset === 0 ? '60px' : '100px',
                      height: value.offset === 0 ? '60px' : '100px',
                      transformOrigin: 'top center',
                    }}
                  />

                  {/* Number Circle */}
                  <motion.div
                    className="core-value-number"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.15, type: 'spring', stiffness: 400 }}
                    viewport={{ once: false }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: value.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 700,
                      marginBottom: '12px',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    {value.number}
                  </motion.div>

                  {/* Label */}
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.15 }}
                    viewport={{ once: false }}
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#4a4a4a',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {value.title}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Responsive Styles for Core Values */}
        <style>{`
          .core-value-card {
            transition: all 0.3s ease;
          }
          .core-value-circle:hover {
            transform: scale(1.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          }
          @media (max-width: 1200px) {
            .core-values-cards-container {
              flex-wrap: wrap !important;
              justify-content: center !important;
            }
            .core-value-card {
              width: 30% !important;
              margin-bottom: 40px !important;
            }
          }
          @media (max-width: 768px) {
            .about-core-values-section {
              padding: 60px 20px 80px !important;
            }
            .about-core-values-section h2 {
              font-size: 32px !important;
            }
            .core-values-timeline {
              padding-bottom: 40px !important;
            }
            .core-value-line {
              display: none !important;
            }
            .core-values-cards-container {
              gap: 30px !important;
            }
            .core-value-card {
              width: calc(50% - 15px) !important;
              margin-top: 0 !important;
              margin-bottom: 20px !important;
            }
            .core-value-circle {
              width: 100px !important;
              height: 100px !important;
            }
            .core-value-icon {
              font-size: 32px !important;
            }
            .core-value-vertical-line {
              height: 40px !important;
            }
            .core-value-number {
              width: 28px !important;
              height: 28px !important;
              font-size: 12px !important;
            }
          }
          @media (max-width: 480px) {
            .about-core-values-section {
              padding: 50px 16px 60px !important;
            }
            .about-core-values-section h2 {
              font-size: 26px !important;
              letter-spacing: 1px !important;
            }
            .about-core-values-section p {
              font-size: 13px !important;
            }
            .colored-dot {
              width: 10px !important;
              height: 10px !important;
            }
            .core-values-cards-container {
              gap: 24px !important;
            }
            .core-value-card {
              width: 100% !important;
              flex-direction: row !important;
              align-items: center !important;
              gap: 20px !important;
              background: #fff !important;
              padding: 16px 20px !important;
              border-radius: 16px !important;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08) !important;
            }
            .core-value-circle {
              width: 70px !important;
              height: 70px !important;
              flex-shrink: 0 !important;
            }
            .core-value-icon {
              font-size: 28px !important;
            }
            .core-value-vertical-line {
              display: none !important;
            }
            .core-value-number {
              position: absolute !important;
              top: -8px !important;
              right: -8px !important;
              width: 24px !important;
              height: 24px !important;
              font-size: 11px !important;
              margin-bottom: 0 !important;
            }
            .core-value-card span {
              font-size: 14px !important;
              font-weight: 700 !important;
            }
          }
        `}</style>
      </section>

      {/* Smart Tools Section - Laptop Mockup Design */}
      <style>{`
        .about-smart-tools-section,
        .about-smart-tools-section * {
          animation: none !important;
          transition: none !important;
        }
      `}</style>
      <section
        className="about-smart-tools-section"
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
                className="smart-tools-dashboard"
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
                  className="smart-tools-sidebar"
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
                  <div className="smart-tools-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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
            className="smart-tools-features"
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
        className="about-final-cta-section"
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