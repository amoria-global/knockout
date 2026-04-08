'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

const TermsAndConditionsPage = () => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 }); // normalized 0–1
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll tracking with requestAnimationFrame
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let rafId: number;

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollY(container.scrollTop);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Mouse tracking for 3D tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Per-section parallax offset (distance from section top to current scroll)
  const getSectionOffset = (index: number) => {
    const ref = sectionRefs.current[index];
    if (!ref || !containerRef.current) return 0;
    return scrollY - ref.offsetTop;
  };

  // Visibility ratio: 0 = below viewport, 0.5 = entering, 1 = fully in view
  const getSectionVisibility = (index: number) => {
    const ref = sectionRefs.current[index];
    if (!ref || !containerRef.current) return 0;
    const vh = window.innerHeight;
    const progress = (scrollY + vh - ref.offsetTop) / (vh * 1.4);
    return Math.max(0, Math.min(1, progress));
  };

  // 3D tilt transform for cards based on mouse position
  const getTiltStyle = (index: number) => {
    const vis = getSectionVisibility(index);
    if (vis < 0.4 || vis > 1.2) return {};
    const tiltX = (mousePos.y - 0.5) * -8; // max ±4deg
    const tiltY = (mousePos.x - 0.5) * 8;
    return {
      transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
    };
  };

  const sections = [
    {
      id: 'terms-of-use',
      title: 'Terms and Conditions',
      content: `These Terms and Conditions represent the legally binding agreement governing your access to and use of the Amoria Connekyt platform — including our website, mobile applications, event management tools, and streaming services.

By creating an account, providing or booking creative services, or interacting with any feature of Amoria Connekyt, you agree to these Terms in full.

KEY DEFINITIONS:

• Platform: The Amoria Connekyt website, mobile app, and supporting systems that connect photographers, videographers, and clients.

• Client: Any person or business booking photography, videography, or media services through Amoria Connekyt.

• Creator: A photographer, videographer, or media professional offering creative services via the Platform.

• Host/Organizer: A person or entity that creates or promotes an event, session, or production through the Platform.

• User: Any individual or entity using the Platform, including Clients, Creators, Organizers.

• Content: Any photo, video, audio, text, or other media uploaded or shared on the Platform.

• User Account: A registered profile that allows access to Amoria Connekyt's services and features.

SCOPE OF SERVICES:

Amoria Connekyt is a global platform that connects photographers, videographers, and clients in a secure, transparent, and performance-driven environment.

It helps creative professionals grow their brands, save time, and earn fairly, while enabling clients to discover and book trusted talent with ease.

Through verified ratings, transparent agreements, and secure digital workflows, Amoria Connekyt promotes creativity, accountability, and emotional connection.

By empowering people to capture, share, and relive meaningful moments, Amoria Connekyt strengthens families, communities, and mental wellbeing through visual storytelling.`
    },
    {
      id: 'user-agreement',
      title: 'Account Registration',
      content: `Creating an account on Amoria Connekyt is your gateway to connecting with creative professionals or showcasing your photography and videography talents. Account registration comes with important responsibilities and requirements designed to protect all users and maintain platform integrity.

1. Registration Requirements
To create an account on Amoria Connekyt, you must be at least 18 years old. This age requirement is not arbitrary—it's mandated by legal regulations protecting minors and ensuring that all users can enter into legally binding agreements. During registration, you must provide accurate, complete, and up-to-date information including your full legal name, valid email address, phone number, and location.

You must maintain a valid, actively monitored email address as this is our primary channel for important communications including booking confirmations, payment notifications, security alerts, and policy updates. For users who wish to engage in financial transactions—whether receiving payments as a creator or booking services as a client—you must complete our Know Your Customer (KYC) identity verification process.

2. Account Responsibility
When you create an account on Amoria Connekyt, you accept full responsibility for all activities conducted under that account. You must maintain the security of your login credentials by choosing strong, unique passwords that combine letters, numbers, and special characters.

Never share your account credentials with others. If you suspect unauthorized access—perhaps you notice unfamiliar login locations, unexpected bookings, or changes you didn't make—notify us immediately through our support channels.

3. Account Suspension
Amoria Connekyt reserves the right to suspend accounts when we detect activities that violate our terms of service or pose risks to other users. Suspension may occur for fraudulent activities, misuse of platform features, harassment, discrimination, or attempts to bypass platform fees.

4. Account Termination
You have the right to close your account at any time by accessing your account settings or contacting our support team. Upon voluntary account closure, we will deactivate your profile, remove you from search results, and cease sending promotional communications.`
    },
    {
      id: 'photographer-membership',
      title: 'Creator Responsibilities',
      content: `As a creative professional on Amoria Connekyt, you play a vital role in maintaining the quality, trust, and integrity of our platform. Your responsibilities extend beyond simply providing creative services.

1. Professional Standards
Creators must maintain professional standards in all interactions with clients, other creators, and platform staff. This includes timely communication, delivering work as agreed, maintaining appropriate conduct at events and sessions, and representing yourself honestly in your portfolio and capabilities.

2. Portfolio Integrity
Your portfolio must accurately represent your own work. Using others' work, stock photos presented as original work, or heavily misrepresenting your skill level through edited samples is strictly prohibited. Clients rely on portfolios to make booking decisions, and misrepresentation undermines the trust that is fundamental to our platform.

3. Availability and Commitment
When you accept a booking, you're making a commitment to the client. Cancellations should be rare and only for legitimate reasons. Repeated cancellations or no-shows will result in account penalties, reduced visibility in search results, and potential suspension.

4. Equipment and Preparation
Creators are responsible for maintaining professional-grade equipment appropriate for the services they offer. This includes having backup equipment for critical assignments, ensuring batteries are charged, memory cards have sufficient space, and all gear is in working condition before each assignment.

5. Delivery Standards
Deliver final work within the agreed timeframe. If delays are unavoidable, communicate proactively with the client and provide realistic updated timelines. Quality of delivered work should match or exceed the standard represented in your portfolio.`
    },
    {
      id: 'cost-and-fees',
      title: 'Client Responsibilities',
      content: `As a client using Amoria Connekyt, you have responsibilities that ensure smooth, professional interactions and help maintain the quality of our creative community.

1. Clear Communication
Provide clear, detailed briefs for your creative needs. Include event details, preferred style, specific shots or coverage requirements, timeline expectations, and any restrictions or special considerations. Clear communication prevents misunderstandings and ensures you receive the results you envision.

2. Timely Payments
Honor your payment commitments as agreed in booking terms. Amoria Connekyt uses a hold-and-release payment model that protects both parties. Funds are held securely during service delivery and released to the creator upon satisfactory completion. Attempting to circumvent the platform's payment system is a violation of these terms.

3. Respectful Interaction
Treat creators with the same professionalism you expect. This includes being punctual for scheduled sessions, providing adequate working conditions, respecting creative expertise and professional boundaries, and providing constructive feedback rather than abusive criticism.

4. Cancellation Policies
If you need to cancel a booking, do so as early as possible. Our cancellation policies are designed to be fair to both parties. Late cancellations or no-shows may result in partial or full charges depending on the circumstances and the creator's cancellation policy.

5. Content Usage
Use delivered content in accordance with the agreed license terms. Unless specifically negotiated, standard licenses typically cover personal use. Commercial use, resale, or distribution beyond agreed terms requires additional licensing arrangements with the creator.`
    },
    {
      id: 'client-initiated',
      title: 'Payments & Fees',
      content: `Amoria Connekyt operates a Hold & Release payment model designed to protect both creators and clients while ensuring fair compensation for creative services.

1. How Payments Work
When a client books a service, payment is collected and held securely by Amoria Connekyt. The funds are not immediately transferred to the creator. Instead, they are held in a secure escrow-like arrangement until the service is delivered and the client confirms satisfaction. This protects clients from paying for services not rendered and ensures creators know that verified funds are waiting upon successful delivery.

2. Platform Fees
Amoria Connekyt charges a service fee on each transaction to maintain the platform, provide customer support, develop new features, and ensure secure payment processing. Current fee structures are:
• Creator service fee: A percentage of each transaction
• Client booking fee: A small fee added to the booking total
• Payment processing fees: Standard processing charges from payment providers

Fee rates are displayed transparently before each transaction is confirmed. We may adjust fees periodically with advance notice to all users.

3. Payment Release
Funds are released to creators after service delivery is confirmed by the client, or automatically after a specified holding period if the client doesn't raise any disputes. The release timeline varies by service type and may be subject to additional verification for large transactions.

4. Currency and International Payments
Amoria Connekyt supports multiple currencies and international payment methods. Exchange rates are applied at the time of transaction based on current market rates plus a small conversion margin. Users are responsible for any additional fees charged by their banks or payment providers for international transactions.`
    },
    {
      id: 'credentials-privacy',
      title: 'Cancellations & Refunds',
      content: `Our cancellation and refund policies are designed around trust, fairness, and accountability for both creators and clients.

1. Client-Initiated Cancellations
Clients may cancel bookings subject to the following guidelines:
• More than 7 days before scheduled service: Full refund minus processing fees
• 3-7 days before scheduled service: 50% refund
• Less than 3 days before scheduled service: No refund (creator has likely turned down other bookings)
• No-show without cancellation: No refund and potential account restrictions

These timelines may vary based on the creator's individual cancellation policy, which is displayed at booking time.

2. Creator-Initiated Cancellations
Creators who cancel bookings face consequences designed to protect clients and maintain platform reliability:
• More than 7 days notice: Full refund to client, no penalty to creator
• 3-7 days notice: Full refund to client, warning to creator
• Less than 3 days notice: Full refund to client, penalty applied to creator's account
• No-show: Full refund, severe penalty, potential suspension

Repeated cancellations by creators result in reduced search visibility, lower trust scores, and potential account suspension.

3. Dispute Resolution for Refunds
If a client is dissatisfied with delivered work, they may initiate a dispute through our resolution center. Both parties provide evidence, and our team mediates to reach a fair outcome. Possible resolutions include full refund, partial refund, re-delivery of services, or no refund if the service was delivered as agreed.

4. Force Majeure Cancellations
Cancellations due to events beyond either party's control (natural disasters, pandemics, government orders) are handled on a case-by-case basis with the goal of finding fair solutions for all parties.`
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      content: `Your privacy is important to Amoria Connekyt. This Privacy Policy explains how we collect, use, protect, and share your personal information.

1. Information We Collect
We collect information you provide directly (name, email, phone, payment details, portfolio content), information collected automatically (device information, IP address, browser type, usage patterns, location data), and information from third parties (social media profiles when you connect accounts, payment processor data, identity verification services).

2. How We Use Your Information
Your information is used to provide and improve our services, process transactions and payments, verify identity and prevent fraud, communicate about bookings, updates, and promotions, personalize your experience, comply with legal obligations, and resolve disputes and enforce our terms.

3. Information Sharing
We share information with service providers who assist our operations (payment processors, cloud hosting, analytics), when required by law or legal process, to protect the rights, property, or safety of Amoria Connekyt, our users, or the public, with your consent, and in aggregated, anonymized form for research or business purposes.

4. Data Security
We implement industry-standard security measures including encryption, secure servers, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.

5. Your Rights
You have the right to access your personal data, correct inaccurate information, request deletion of your data (subject to legal retention requirements), opt out of marketing communications, and data portability where technically feasible.

6. International Data Transfers
Your data may be transferred to and processed in countries other than your country of residence. We ensure adequate protection through standard contractual clauses and compliance with applicable data protection laws.

7. Data Retention
We retain personal data for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When data is no longer needed, it is securely deleted or anonymized.`
    },
    {
      id: 'cookie-policy',
      title: 'Cookie Policy',
      content: `Amoria Connekyt uses cookies and similar tracking technologies to enhance your experience, analyze usage, and support our marketing efforts.

1. What Are Cookies?
Cookies are small text files placed on your device when you visit our website. They help us recognize your device, remember your preferences, and understand how you use our platform.

2. Types of Cookies We Use

Essential Cookies: Required for basic platform functionality including authentication, security, and session management. These cannot be disabled without affecting platform usability.

Performance Cookies: Help us understand how users interact with our platform by collecting anonymous usage data. This information helps us identify popular features, detect navigation issues, and improve overall performance.

Functionality Cookies: Remember your preferences and settings (language, currency, display preferences) to provide a more personalized experience. These enhance usability but aren't strictly necessary.

Marketing Cookies: Used to deliver relevant advertisements and measure advertising campaign effectiveness. These cookies may track your browsing activity across different websites.

3. Third-Party Cookies
Some cookies are placed by third-party services we use, including Google Analytics for usage analysis, payment processors for transaction security, social media platforms for sharing features, and advertising networks for targeted advertising.

4. Managing Cookies
You can manage cookie preferences through your browser settings. Most browsers allow you to block or delete cookies, though this may affect platform functionality. You can also use our cookie consent tool to manage preferences for non-essential cookies.

5. Cookie Retention
Cookie retention periods vary by type. Essential cookies typically expire when you close your browser or within a few hours. Performance and functionality cookies may persist for up to 12 months. Marketing cookies typically have longer retention periods but can be cleared at any time.`
    },
    {
      id: 'client-payment',
      title: 'Client Payment Agreement',
      content: `This Client Payment Agreement outlines the terms governing financial transactions when you book creative services through Amoria Connekyt.

1. Payment Authorization
By booking a service, you authorize Amoria Connekyt to charge the agreed amount using your selected payment method. You confirm that you are the authorized user of the payment method and that all payment information provided is accurate and complete.

2. Hold & Release System
Upon booking confirmation, your payment is held securely by Amoria Connekyt. Funds are released to the creator only after:
• You confirm satisfactory service delivery, OR
• The automatic release period expires without a dispute being filed, OR
• A dispute is resolved in the creator's favor

This system protects you from paying for services not delivered and gives you recourse if services don't meet agreed specifications.

3. Accepted Payment Methods
We accept various payment methods including mobile money (MTN, Airtel), bank transfers, credit/debit cards (Visa, Mastercard), and other payment methods available through our payment partners.

4. Taxes and Additional Charges
Prices displayed on the platform may or may not include applicable taxes depending on your jurisdiction. You are responsible for any taxes applicable to your purchase. Additional charges such as international transaction fees, currency conversion fees, or bank charges are your responsibility.

5. Failed Payments
If a payment fails, the booking will not be confirmed until successful payment is received. We may attempt to process the payment again or contact you to provide alternative payment information. Repeatedly failing to complete payments may result in booking restrictions on your account.`
    },
    {
      id: 'photographer-payment',
      title: 'Photographer Payment Agreement',
      content: `This Photographer Payment Agreement outlines how creators receive compensation for services provided through Amoria Connekyt.

1. Earnings and Payouts
Creators earn money when clients book and pay for their services. After service delivery is confirmed, earnings (minus platform fees) become available for withdrawal. Payout schedules depend on your chosen withdrawal method and may take 1-5 business days to process.

2. Platform Commission
Amoria Connekyt retains a commission on each completed transaction. The commission rate is clearly displayed in your creator dashboard and may vary based on your membership tier, transaction volume, or promotional periods. Commission is calculated on the gross booking amount before any discounts or promotions.

3. Withdrawal Methods
Available withdrawal methods include mobile money (MTN, Airtel), bank transfer to your verified account, and other methods as they become available. Minimum withdrawal amounts apply and vary by withdrawal method. Withdrawal fees may apply depending on the method and amount.

4. Tax Responsibility
Creators are responsible for reporting their earnings and paying applicable taxes in their jurisdiction. Amoria Connekyt may provide earnings summaries or tax documents as required by law, but we do not provide tax advice. Consult a qualified tax professional for guidance specific to your situation.

5. Payment Disputes
If a client disputes a payment after service delivery, the disputed amount may be held pending resolution. Our dispute resolution team will review evidence from both parties and make a determination. Creators are encouraged to document their work thoroughly to support their position in any disputes.

6. Inactive Accounts
Earnings in inactive accounts (no login for 12+ months) may be subject to dormancy procedures as required by applicable law. We will attempt to contact you before taking any action regarding dormant funds.`
    },
    {
      id: 'connekyt-team',
      title: 'Connekyt Team Agreement',
      content: `The Connekyt Team Agreement outlines the expectations, responsibilities, and standards for all team members, contractors, and partners who contribute to building and maintaining the Amoria Connekyt platform.

1. Confidentiality
All team members must maintain strict confidentiality regarding proprietary information, user data, business strategies, technical implementations, and any other non-public information encountered during their work with Amoria Connekyt. This obligation extends beyond the termination of any working relationship.

2. Data Handling
Team members with access to user data must follow our data protection policies strictly. This includes accessing data only as necessary for their role, never sharing data outside authorized channels, following encryption and security protocols, reporting any data breaches or security concerns immediately, and completing regular data protection training.

3. Code of Conduct
Team members represent Amoria Connekyt and must maintain professional conduct at all times. This includes treating all users, colleagues, and partners with respect and dignity, avoiding conflicts of interest, not using their position for personal gain at the expense of users, maintaining transparency in all dealings, and upholding our non-discrimination policies.

4. Intellectual Property
All work produced by team members in the course of their duties is the intellectual property of Amoria Connekyt unless explicitly agreed otherwise. This includes code, designs, documentation, processes, and inventions related to the platform.

5. Compliance
Team members must comply with all applicable laws, regulations, and company policies. This includes anti-corruption laws, data protection regulations, employment laws, and any industry-specific regulations applicable to our operations.`
    },
    {
      id: 'non-discrimination',
      title: 'Non-discrimination Statement',
      content: `Amoria Connekyt is committed to creating an inclusive, welcoming, and discrimination-free environment for all users, creators, clients, and team members.

1. Our Commitment
We believe that creativity knows no boundaries. Every person deserves equal access to creative services and opportunities, regardless of their background. Amoria Connekyt prohibits discrimination based on race, ethnicity, or national origin, color, religion or spiritual beliefs, gender identity or expression, sexual orientation, age, disability (physical or mental), marital or family status, socioeconomic status, political opinion, HIV/AIDS status, or any other characteristic protected by applicable law.

2. Platform Policies
Creators may not refuse service based on any protected characteristic. Clients may not discriminate in their selection of creators based on protected characteristics. All users must treat others with respect and dignity in all platform interactions. Content that promotes hatred, violence, or discrimination against any group is strictly prohibited.

3. Reporting Discrimination
If you experience or witness discrimination on our platform, report it immediately through our support channels. We take all reports seriously and investigate promptly. Substantiated discrimination complaints result in warnings, suspensions, or permanent bans depending on severity.

4. Accessibility
We're committed to making our platform accessible to users with disabilities. This includes implementing WCAG accessibility standards, providing screen reader compatibility, enabling keyboard navigation, and offering alternative text for visual content.

5. Cultural Sensitivity
Operating globally means respecting diverse cultural norms and practices. While we maintain universal anti-discrimination standards, we also recognize and respect cultural differences in how creative services are experienced and appreciated across different communities.`
    },
    {
      id: 'referral-program',
      title: 'Intellectual Property',
      content: `Intellectual property rights are fundamental to the creative services marketplace. This section clarifies ownership, licensing, and usage rights for all content on the Amoria Connekyt platform.

1. Creator-Owned Content
Photographers and videographers retain ownership of their original creative works (photos, videos, edits) unless explicitly transferred through a written agreement. Uploading content to Amoria Connekyt does not transfer ownership to the platform. Creators grant Amoria Connekyt a limited, non-exclusive license to display portfolio content on the platform for marketing and promotional purposes.

2. Platform Content
The Amoria Connekyt brand, logo, website design, software code, algorithms, and all platform-generated content are owned by Amoria Global Tech Ltd. Users may not copy, modify, distribute, or create derivative works from platform content without explicit written permission.

3. Client Licenses
When a client pays for creative services, they receive a license to use the delivered content as specified in the booking agreement. Standard licenses typically cover personal, non-commercial use. Extended or commercial licenses must be explicitly negotiated and agreed upon with the creator. The specific license terms are outlined at the time of booking.

4. User-Generated Content
Content uploaded by users (reviews, comments, messages, profile information) grants Amoria Connekyt a worldwide, non-exclusive, royalty-free license to use, display, and distribute that content in connection with platform operations. Users warrant that they have the right to share any content they upload.

5. DMCA and Takedown Procedures
We respect intellectual property rights and respond to valid infringement notices. If you believe your intellectual property has been infringed on our platform, contact us with a detailed description of the claimed infringement, and we will investigate and take appropriate action.`
    },
    {
      id: 'policies-compliance',
      title: 'Policies and Compliance',
      content: `Amoria Connekyt maintains comprehensive policies to ensure legal compliance, user safety, and platform integrity across all jurisdictions where we operate.

1. Anti-Money Laundering (AML)
We comply with AML regulations applicable to our operations. This includes monitoring transactions for suspicious activity, reporting suspicious transactions to relevant authorities, maintaining records of financial transactions, conducting enhanced due diligence for high-risk transactions, and cooperating with law enforcement investigations.

2. Know Your Customer (KYC)
Users engaging in financial transactions must complete identity verification. This involves providing government-issued identification, verifying residential address, for business accounts providing business registration documents, and periodic re-verification as required by regulations.

3. Content Moderation
We actively moderate content on our platform to prevent illegal content, harmful or dangerous content, misleading or fraudulent content, content violating intellectual property rights, and content that violates our community guidelines.

4. Platform Updates
We may update our platform, features, and policies from time to time. Material changes to these Terms will be communicated through email notifications, platform announcements, and updated effective dates on policy documents. Continued use after updates constitutes acceptance of revised terms.

5. Regulatory Compliance
Amoria Connekyt complies with applicable laws and regulations in all jurisdictions where we operate, including Rwanda's Data Protection and Privacy Law No. 058/2021, GDPR for EU users, consumer protection laws, employment and labor regulations, and tax and financial reporting requirements.`
    },
    {
      id: 'legal-terms',
      title: 'Legal Terms and Jurisdiction',
      content: `These Legal Terms establish the formal legal framework governing our entire relationship with users of the Amoria Connekyt platform.

1. Limitation of Liability
To the maximum extent permitted by applicable law, Amoria Connekyt's total liability for any claims arising from or related to these Terms or your use of the platform shall not exceed the total fees paid by you to Amoria Connekyt in the twelve (12) months preceding the claim.

Amoria Connekyt is not liable for indirect, incidental, special, consequential, or punitive damages. We are not responsible for losses arising from user-to-user interactions, third-party service failures, content posted by users, or events beyond our reasonable control.

2. Dispute Resolution
Before initiating formal proceedings, parties must attempt to resolve disputes through direct communication followed by mediation if necessary. If mediation fails, disputes are resolved through binding arbitration conducted in Kigali, Rwanda.

By agreeing to these Terms, you consent to arbitration as the primary dispute resolution mechanism and waive your right to trial by jury for most disputes.

3. Governing Law
These Terms are governed by the laws of the Republic of Rwanda. Courts in Kigali, Rwanda, have exclusive jurisdiction over any litigation. International users consent to Rwandan law application by using our platform.

4. Governing Language
The official governing language of these Terms is English. Translations in other languages are provided for convenience only. In case of conflict, the English version prevails.

5. Force Majeure
Amoria Connekyt is not liable for delays or failures caused by events beyond reasonable control including natural disasters, pandemics, war, government actions, cyber attacks, or infrastructure failures.

6. Entire Agreement
These Terms, together with our Privacy Policy and incorporated policies, constitute the entire agreement between you and Amoria Connekyt. No other agreements modify these Terms unless agreed to in writing.

7. Contact Information
Amoria Connekyt is owned and operated by Amoria Global Tech Ltd., registered in Kigali, Rwanda.
• General: info@amoriaglobal.com
• Legal: legal@amoriaglobal.com
• Privacy: privacy@amoriaglobal.com
• Support: support@amoriaconnect.com`
    }
  ];

  // Palettes cycle — every 4th section gets the dark theme
  const palettes = [
    { bg: 'linear-gradient(180deg, #ffffff 0%, #f0f4fa 100%)' },
    { bg: 'linear-gradient(180deg, #f0f4fa 0%, #e8edf6 100%)' },
    { bg: 'linear-gradient(180deg, #083A85 0%, #052047 100%)' },
    { bg: 'linear-gradient(180deg, #f8fafc 0%, #f0f4fa 100%)' },
  ];

  return (
    <>
      <style>{`
        /* === CONTAINER === */
        .tos-plx {
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: rgba(8,58,133,0.2) transparent;
        }
        .tos-plx::-webkit-scrollbar { width: 6px; }
        .tos-plx::-webkit-scrollbar-track { background: transparent; }
        .tos-plx::-webkit-scrollbar-thumb { background: rgba(8,58,133,0.2); border-radius: 3px; }

        /* === HERO === */
        .tos-plx-hero {
          position: relative;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: linear-gradient(160deg, #052047 0%, #083A85 40%, #0a4da3 70%, #103E83 100%);
          color: #fff;
          overflow: hidden;
        }

        .tos-plx-hero-dots {
          position: absolute;
          inset: -120px;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px);
          background-size: 32px 32px;
          will-change: transform;
        }

        .tos-plx-hero-glow {
          position: absolute;
          inset: -150px;
          background:
            radial-gradient(ellipse at 20% 15%, rgba(100,180,255,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 85%, rgba(100,140,255,0.06) 0%, transparent 50%);
          will-change: transform;
        }

        .tos-plx-hero-ring {
          position: absolute;
          width: clamp(450px, 55vw, 800px);
          height: clamp(450px, 55vw, 800px);
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.04);
          top: 50%;
          left: 50%;
          will-change: transform;
        }

        .tos-plx-hero-ring2 {
          position: absolute;
          width: clamp(250px, 30vw, 450px);
          height: clamp(250px, 30vw, 450px);
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.03);
          top: 50%;
          left: 50%;
          will-change: transform;
        }

        .tos-plx-hero-content {
          position: relative;
          z-index: 3;
          will-change: transform, opacity;
        }

        @keyframes plxFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }


        /* === SECTION === */
        .tos-plx-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(60px, 8vh, 100px) clamp(16px, 4vw, 48px);
          overflow: hidden;
        }

        /* --- Giant BG number (Layer 1 - slowest) --- */
        .tos-plx-bg-num {
          position: absolute;
          font-size: clamp(300px, 38vw, 550px);
          font-weight: 900;
          font-family: 'Pragati Narrow', sans-serif;
          line-height: 0.85;
          pointer-events: none;
          user-select: none;
          will-change: transform;
          z-index: 0;
        }
        .tos-plx-bg-num.left { left: clamp(-50px, -4vw, -100px); top: 50%; }
        .tos-plx-bg-num.right { right: clamp(-50px, -4vw, -100px); top: 50%; }

        /* --- Floating gradient orb (Layer 2) --- */
        .tos-plx-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          will-change: transform;
          z-index: 0;
        }

        /* --- Accent line (Layer 3) --- */
        .tos-plx-accent-line {
          position: absolute;
          width: clamp(100px, 14vw, 200px);
          height: 3px;
          border-radius: 2px;
          will-change: transform;
          z-index: 1;
        }

        /* --- Floating section label (Layer 4) --- */
        .tos-plx-floating-label {
          position: absolute;
          font-size: clamp(12px, 1.1vw, 14px);
          font-weight: 700;
          letter-spacing: 4px;
          text-transform: uppercase;
          will-change: transform, opacity;
          z-index: 1;
          pointer-events: none;
        }

        /* --- Decorative cross mark (Layer 5) --- */
        .tos-plx-cross {
          position: absolute;
          width: 24px;
          height: 24px;
          will-change: transform;
          z-index: 1;
          pointer-events: none;
          opacity: 0.08;
        }
        .tos-plx-cross::before,
        .tos-plx-cross::after {
          content: '';
          position: absolute;
          border-radius: 1px;
        }
        .tos-plx-cross::before {
          width: 100%;
          height: 2px;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
        }
        .tos-plx-cross::after {
          width: 2px;
          height: 100%;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
        }

        /* --- Content card (Layer 6 - foreground) --- */
        .tos-plx-card {
          position: relative;
          max-width: 780px;
          width: 100%;
          padding: clamp(32px, 4.5vw, 56px);
          border-radius: 24px;
          will-change: transform, opacity;
          z-index: 2;
          transition: box-shadow 0.4s ease, transform 0.15s ease;
        }

        .tos-plx-card:hover {
          box-shadow: 0 24px 70px rgba(8,58,133,0.18), 0 8px 20px rgba(0,0,0,0.06) !important;
        }

        .tos-plx-card-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          font-size: 18px;
          font-weight: 800;
          font-family: 'Pragati Narrow', sans-serif;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s;
        }

        .tos-plx-card.revealed .tos-plx-card-badge {
          opacity: 1;
          transform: translateY(0);
        }

        .tos-plx-card-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 8px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s;
        }

        .tos-plx-card.revealed .tos-plx-card-label {
          opacity: 1;
          transform: translateY(0);
        }

        .tos-plx-card-title {
          font-size: clamp(1.6rem, 3.5vw, 2.2rem);
          font-weight: 700;
          font-family: 'Pragati Narrow', sans-serif;
          margin: 0 0 16px;
          line-height: 1.2;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s;
        }

        .tos-plx-card.revealed .tos-plx-card-title {
          opacity: 1;
          transform: translateY(0);
        }

        .tos-plx-card-divider {
          width: 60px;
          height: 3px;
          border-radius: 2px;
          margin-bottom: 24px;
          opacity: 0;
          transform: scaleX(0);
          transform-origin: left;
          transition: opacity 0.4s ease 0.35s, transform 0.6s ease 0.35s;
        }

        .tos-plx-card.revealed .tos-plx-card-divider {
          opacity: 1;
          transform: scaleX(1);
        }

        .tos-plx-card-text {
          font-size: clamp(14px, 1.1vw, 15.5px);
          line-height: 1.85;
          white-space: pre-wrap;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s;
        }

        .tos-plx-card.revealed .tos-plx-card-text {
          opacity: 1;
          transform: translateY(0);
        }

        /* === PROGRESS NAV === */
        .tos-plx-nav {
          position: fixed;
          left: clamp(14px, 2vw, 26px);
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 200;
        }

        .tos-plx-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tos-plx-pip:hover { transform: scale(1.4); }

        .tos-plx-pip.active {
          height: 16px;
          border-radius: 3px;
        }

        /* === AGREEMENT === */
        .tos-plx-agree {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: clamp(40px, 6vw, 80px) clamp(16px, 3vw, 32px);
          background: linear-gradient(180deg, #f0f4fa 0%, #ffffff 100%);
        }

        .tos-plx-agree-card {
          background: #fff;
          padding: clamp(32px, 4vw, 52px);
          border-radius: 24px;
          box-shadow: 0 8px 40px rgba(8,58,133,0.08);
          max-width: 520px;
          width: 100%;
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }

        .tos-plx-agree-card:hover {
          box-shadow: 0 20px 60px rgba(8,58,133,0.15);
          transform: translateY(-6px);
        }

        .tos-plx-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 15px;
          color: #374151;
          user-select: none;
          padding: 16px 20px;
          border-radius: 12px;
          border: 2px solid rgba(8,58,133,0.1);
          transition: all 0.25s ease;
          background: #f8fafc;
          text-align: left;
        }

        .tos-plx-checkbox:hover {
          border-color: rgba(8,58,133,0.3);
          background: #f0f4fa;
        }

        .tos-plx-checkbox.checked {
          border-color: #083A85;
          background: rgba(8,58,133,0.04);
        }

        /* === RESPONSIVE === */
        @media (max-width: 768px) {
          .tos-plx-section {
            min-height: auto;
            padding: clamp(40px, 6vh, 70px) 16px;
          }

          .tos-plx-bg-num { font-size: clamp(160px, 24vw, 260px); }

          .tos-plx-orb { filter: blur(40px); }

          .tos-plx-accent-line,
          .tos-plx-floating-label,
          .tos-plx-cross { display: none; }

          .tos-plx-card {
            padding: clamp(22px, 3.5vw, 36px);
            border-radius: 16px;
          }

          .tos-plx-card-title { font-size: 1.4rem !important; }
          .tos-plx-card-text { font-size: 0.92rem !important; line-height: 1.7 !important; }

          .tos-plx-nav { left: 6px; gap: 4px; }
          .tos-plx-pip { width: 5px; height: 5px; }
          .tos-plx-pip.active { height: 12px; }
        }

        @media (max-width: 480px) {
          .tos-plx-bg-num, .tos-plx-nav { display: none; }
          .tos-plx-card { padding: 18px; border-radius: 14px; }
        }
      `}</style>

      <div ref={containerRef} className="tos-plx">
        <Navbar />

        {/* ===================== HERO ===================== */}
        <div className="tos-plx-hero">
          <div className="tos-plx-hero-dots" style={{ transform: `translate(${(mousePos.x - 0.5) * -8}px, ${scrollY * 0.15 + (mousePos.y - 0.5) * -8}px)` }} />
          <div className="tos-plx-hero-glow" style={{ transform: `translate(${(mousePos.x - 0.5) * -20}px, ${scrollY * 0.35 + (mousePos.y - 0.5) * -20}px)` }} />
          <div className="tos-plx-hero-ring" style={{ transform: `translate(calc(-50% + ${(mousePos.x - 0.5) * 12}px), calc(-50% + ${scrollY * 0.22 + (mousePos.y - 0.5) * 12}px)) scale(${1 + scrollY * 0.0004})` }} />
          <div className="tos-plx-hero-ring2" style={{ transform: `translate(calc(-50% + ${(mousePos.x - 0.5) * -15}px), calc(-50% + ${scrollY * 0.12 + (mousePos.y - 0.5) * -15}px)) scale(${1 + scrollY * 0.0002})` }} />
          <div
            className="tos-plx-hero-content"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`,
              opacity: Math.max(0, 1 - scrollY / 450),
            }}
          >
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: '2px solid rgba(255,255,255,0.1)' }}>
              <i className="bi bi-shield-check" style={{ fontSize: 32, color: '#fff' }}></i>
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 7vw, 62px)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.02em', fontFamily: "'Pragati Narrow', sans-serif" }}>
              Terms of Service
            </h1>
            <p style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', color: 'rgba(255,255,255,0.45)', margin: '0 0 8px' }}>Amoria Connekyt</p>
            <div style={{ width: 50, height: 2, background: 'rgba(255,255,255,0.1)', margin: '0 auto 12px', borderRadius: 1 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Last Updated: 01 February 2026</p>
          </div>
        </div>

        {/* ===================== SECTIONS ===================== */}
        {sections.map((section, index) => {
          const palette = palettes[index % palettes.length];
          const isDark = index % palettes.length === 2;
          const offset = getSectionOffset(index);
          const vis = getSectionVisibility(index);
          const numSide = index % 2 === 0 ? 'left' : 'right';
          const isRevealed = vis > 0.35;
          const tilt = getTiltStyle(index);

          // Orb colors per section
          const orbColor = isDark ? 'rgba(100,160,255,0.12)' : 'rgba(8,58,133,0.06)';
          const orbColor2 = isDark ? 'rgba(80,120,220,0.08)' : 'rgba(8,58,133,0.04)';

          return (
            <div
              key={section.id}
              ref={el => { sectionRefs.current[index] = el; }}
              className="tos-plx-section"
              style={{ background: palette.bg }}
            >
              {/* L1: Giant number (0.12x — dramatic slow drift) */}
              <div
                className={`tos-plx-bg-num ${numSide}`}
                style={{
                  color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(8,58,133,0.035)',
                  transform: `translateY(calc(-50% + ${offset * 0.12}px))`,
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* L2: Floating gradient orb A (0.25x + mouse drift) */}
              <div
                className="tos-plx-orb"
                style={{
                  background: orbColor,
                  width: 'clamp(200px, 25vw, 400px)',
                  height: 'clamp(200px, 25vw, 400px)',
                  top: '20%',
                  left: index % 2 === 0 ? '5%' : 'auto',
                  right: index % 2 === 0 ? 'auto' : '5%',
                  transform: `translate(${(mousePos.x - 0.5) * 30}px, ${offset * 0.25 + (mousePos.y - 0.5) * 30}px)`,
                }}
              />

              {/* L2b: Orb B — opposite corner (0.18x) */}
              <div
                className="tos-plx-orb"
                style={{
                  background: orbColor2,
                  width: 'clamp(150px, 18vw, 280px)',
                  height: 'clamp(150px, 18vw, 280px)',
                  bottom: '10%',
                  right: index % 2 === 0 ? '10%' : 'auto',
                  left: index % 2 === 0 ? 'auto' : '10%',
                  transform: `translate(${(mousePos.x - 0.5) * -20}px, ${offset * 0.18 + (mousePos.y - 0.5) * -20}px)`,
                }}
              />

              {/* L3: Accent line (0.3x) */}
              <div
                className="tos-plx-accent-line"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(8,58,133,0.1)',
                  top: index % 2 === 0 ? '18%' : 'auto',
                  bottom: index % 2 === 0 ? 'auto' : '20%',
                  left: index % 2 === 0 ? '6%' : 'auto',
                  right: index % 2 === 0 ? 'auto' : '6%',
                  transform: `translateY(${offset * 0.3}px) rotate(${index % 2 === 0 ? -15 : 15}deg)`,
                }}
              />

              {/* L4: Floating label ghost (0.4x) */}
              <div
                className="tos-plx-floating-label"
                style={{
                  color: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(8,58,133,0.05)',
                  top: '10%',
                  right: index % 2 === 0 ? '8%' : 'auto',
                  left: index % 2 === 0 ? 'auto' : '8%',
                  transform: `translateY(${offset * 0.4}px)`,
                  opacity: Math.min(0.6, vis * 1.5),
                }}
              >
                {section.title}
              </div>

              {/* L5: Decorative cross marks (0.22x) */}
              <div
                className="tos-plx-cross"
                style={{
                  top: '30%',
                  left: index % 2 === 0 ? '15%' : 'auto',
                  right: index % 2 === 0 ? 'auto' : '15%',
                  transform: `translateY(${offset * 0.22}px) rotate(45deg)`,
                }}
              >
                <div style={{ position: 'absolute', width: '100%', height: '2px', top: '50%', left: 0, transform: 'translateY(-50%)', background: isDark ? '#fff' : '#083A85', borderRadius: 1 }} />
                <div style={{ position: 'absolute', width: '2px', height: '100%', left: '50%', top: 0, transform: 'translateX(-50%)', background: isDark ? '#fff' : '#083A85', borderRadius: 1 }} />
              </div>

              <div
                className="tos-plx-cross"
                style={{
                  bottom: '25%',
                  right: index % 2 === 0 ? '12%' : 'auto',
                  left: index % 2 === 0 ? 'auto' : '12%',
                  transform: `translateY(${offset * 0.28}px) rotate(15deg)`,
                  width: 18,
                  height: 18,
                }}
              >
                <div style={{ position: 'absolute', width: '100%', height: '2px', top: '50%', left: 0, transform: 'translateY(-50%)', background: isDark ? '#fff' : '#083A85', borderRadius: 1 }} />
                <div style={{ position: 'absolute', width: '2px', height: '100%', left: '50%', top: 0, transform: 'translateX(-50%)', background: isDark ? '#fff' : '#083A85', borderRadius: 1 }} />
              </div>

              {/* L6: Content card (foreground — 3D tilt + reveal) */}
              <div
                ref={el => { cardRefs.current[index] = el; }}
                className={`tos-plx-card ${isRevealed ? 'revealed' : ''}`}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                  boxShadow: isDark
                    ? '0 12px 40px rgba(0,0,0,0.25)'
                    : '0 10px 40px rgba(8,58,133,0.08), 0 2px 8px rgba(0,0,0,0.03)',
                  backdropFilter: isDark ? 'blur(16px)' : 'none',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(8,58,133,0.04)',
                  opacity: Math.min(1, vis * 2),
                  ...tilt,
                }}
              >
                <div
                  className="tos-plx-card-badge"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.1)' : '#083A85',
                    color: '#fff',
                  }}
                >
                  {index + 1}
                </div>
                <div className="tos-plx-card-label" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>
                  Section {index + 1} of {sections.length}
                </div>
                <h2 className="tos-plx-card-title" style={{ color: isDark ? '#fff' : '#083A85' }}>
                  {section.title}
                </h2>
                <div className="tos-plx-card-divider" style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'linear-gradient(90deg, #083A85, #0a4da3)' }} />
                <div className="tos-plx-card-text" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : '#374151' }}>
                  {section.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* ===================== AGREEMENT ===================== */}
        <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 48px)', maxWidth: 780, margin: '0 auto', width: '100%' }}>
          <label className={`tos-plx-checkbox ${isAgreed ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={e => setIsAgreed(e.target.checked)}
              style={{ width: 20, height: 20, marginRight: 12, accentColor: '#083A85', cursor: 'pointer', flexShrink: 0 }}
            />
            I confirm that I have read the Amoria Connekyt Terms of Use
          </label>
        </div>

        <Footer />
      </div>

      {/* ===================== PROGRESS NAV ===================== */}
      {(() => {
        // Find which section is currently most visible
        let currentIdx = -1; // -1 = hero
        for (let i = 0; i < sections.length; i++) {
          const vis = getSectionVisibility(i);
          if (vis > 0.4 && vis < 1.2) currentIdx = i;
        }
        // Hero or dark palette section = dark background
        const onDark = currentIdx === -1 || currentIdx % palettes.length === 2;

        return (
          <div className="tos-plx-nav" style={{ transition: 'all 0.3s ease' }}>
            {sections.map((section, i) => {
              const vis = getSectionVisibility(i);
              const isActive = vis > 0.3 && vis < 1.3;
              return (
                <button
                  key={section.id}
                  className={`tos-plx-pip ${isActive ? 'active' : ''}`}
                  style={{
                    background: isActive
                      ? (onDark ? '#ffffff' : '#083A85')
                      : (onDark ? 'rgba(255,255,255,0.25)' : 'rgba(8,58,133,0.15)'),
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => {
                    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  title={section.title}
                />
              );
            })}
          </div>
        );
      })()}
    </>
  );
};

export default TermsAndConditionsPage;
