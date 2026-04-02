'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

const TermsAndConditionsPage = () => {
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1 = TOC, 2+ = sections
  const [isAgreed, setIsAgreed] = useState(false);
  const [viewedSections, setViewedSections] = useState<Set<number>>(new Set());
  const [showWarning, setShowWarning] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const contentRef = useRef<HTMLDivElement>(null);

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

  const totalPages = sections.length + 2; // cover + TOC + sections
  const allSectionsViewed = viewedSections.size === sections.length;
  const bookRef = useRef<HTMLDivElement>(null);
  const scrollCooldown = useRef(false);

  // Track viewed sections
  useEffect(() => {
    if (currentPage >= 2) {
      setViewedSections(prev => new Set(prev).add(currentPage - 2));
    }
  }, [currentPage]);

  // Scroll content to top on page change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  const goToPage = (page: number) => {
    if (isFlipping || page < 0 || page >= totalPages) return;
    setFlipDirection(page > currentPage ? 'next' : 'prev');
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(page);
    }, 300);
    setTimeout(() => {
      setIsFlipping(false);
    }, 600);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Scroll-driven page flipping
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // If content area is scrollable, let it scroll first
      const content = contentRef.current;
      if (content) {
        const isAtTop = content.scrollTop <= 0;
        const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 2;

        // Scrolling down but content has more to scroll — let it scroll
        if (e.deltaY > 0 && !isAtBottom) return;
        // Scrolling up but content has more to scroll — let it scroll
        if (e.deltaY < 0 && !isAtTop) return;
      }

      // Content is at boundary or no scrollable content — flip page
      e.preventDefault();
      if (scrollCooldown.current || isFlipping) return;

      scrollCooldown.current = true;
      if (e.deltaY > 0) {
        nextPage();
      } else if (e.deltaY < 0) {
        prevPage();
      }

      setTimeout(() => {
        scrollCooldown.current = false;
      }, 800);
    };

    const book = bookRef.current;
    if (book) {
      book.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (book) {
        book.removeEventListener('wheel', handleWheel);
      }
    };
  });

  // Touch swipe for mobile
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const book = bookRef.current;
    if (!book) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current || isFlipping) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      touchStart.current = null;

      // Only trigger if horizontal swipe is dominant and significant
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) nextPage(); // swipe left = next
        else prevPage(); // swipe right = prev
      }
    };

    book.addEventListener('touchstart', handleTouchStart, { passive: true });
    book.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      book.removeEventListener('touchstart', handleTouchStart);
      book.removeEventListener('touchend', handleTouchEnd);
    };
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <>
      <style>{`
        .tos-book-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
          display: flex;
          flex-direction: column;
        }

        .tos-book-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(16px, 3vw, 40px);
          padding-top: clamp(80px, 10vh, 100px);
        }

        .tos-book {
          width: 100%;
          max-width: 720px;
          min-height: clamp(500px, 70vh, 700px);
          background: #fff;
          border-radius: 4px 16px 16px 4px;
          box-shadow:
            0 20px 60px rgba(8,58,133,0.12),
            0 4px 16px rgba(0,0,0,0.06),
            -4px 0 12px rgba(0,0,0,0.04);
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          perspective: 1500px;
        }

        /* Book spine effect */
        .tos-book::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          background: linear-gradient(to right, #052047, #083A85, #052047);
          z-index: 2;
          border-radius: 4px 0 0 4px;
        }

        /* Page edge lines */
        .tos-book::after {
          content: '';
          position: absolute;
          right: -3px;
          top: 10px;
          bottom: 10px;
          width: 5px;
          background: repeating-linear-gradient(to bottom, #e8e8e8 0px, #f5f5f5 1px, #e8e8e8 2px);
          border-radius: 0 2px 2px 0;
          z-index: 0;
        }

        .tos-page {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: clamp(24px, 4vw, 40px);
          padding-left: clamp(32px, 5vw, 52px);
          position: relative;
          transform-origin: left center;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          animation: none;
        }

        .tos-page.flipping-next {
          animation: flipOutNext 0.6s ease-in-out forwards;
        }

        .tos-page.flipping-prev {
          animation: flipOutPrev 0.6s ease-in-out forwards;
        }

        @keyframes flipOutNext {
          0% { transform: rotateY(0deg); opacity: 1; }
          40% { transform: rotateY(-90deg); opacity: 0.6; }
          50% { transform: rotateY(-90deg); opacity: 0; }
          51% { transform: rotateY(90deg); opacity: 0; }
          60% { transform: rotateY(90deg); opacity: 0.6; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }

        @keyframes flipOutPrev {
          0% { transform: rotateY(0deg); opacity: 1; }
          40% { transform: rotateY(90deg); opacity: 0.6; }
          50% { transform: rotateY(90deg); opacity: 0; }
          51% { transform: rotateY(-90deg); opacity: 0; }
          60% { transform: rotateY(-90deg); opacity: 0.6; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }

        .tos-page-content {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(8,58,133,0.2) transparent;
        }

        .tos-page-content::-webkit-scrollbar { width: 6px; }
        .tos-page-content::-webkit-scrollbar-track { background: transparent; }
        .tos-page-content::-webkit-scrollbar-thumb { background: rgba(8,58,133,0.2); border-radius: 3px; }
        .tos-page-content::-webkit-scrollbar-thumb:hover { background: rgba(8,58,133,0.35); }

        /* Navigation bar at bottom of book */
        .tos-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px);
          padding-left: clamp(32px, 5vw, 52px);
          border-top: 1px solid rgba(8,58,133,0.08);
          background: #fafbfc;
          border-radius: 0 0 16px 0;
        }

        .tos-nav-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 8px;
          border: 1px solid rgba(8,58,133,0.15);
          background: #fff;
          color: #083A85;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tos-nav-btn:hover:not(:disabled) {
          background: #083A85;
          color: #fff;
          border-color: #083A85;
        }

        .tos-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Progress dots */
        .tos-progress {
          display: flex;
          gap: 4px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 50%;
        }

        .tos-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(8,58,133,0.15);
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          padding: 0;
        }

        .tos-dot.active {
          background: #083A85;
          width: 20px;
          border-radius: 4px;
        }

        .tos-dot.viewed {
          background: rgba(8,58,133,0.4);
        }

        /* Cover page */
        .tos-cover {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: clamp(32px, 5vw, 60px);
          background: linear-gradient(160deg, #052047 0%, #083A85 40%, #0a4da3 70%, #103E83 100%);
          color: #fff;
          border-radius: 0 16px 16px 0;
          position: relative;
          overflow: hidden;
          transform-origin: left center;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          animation: none;
        }

        .tos-cover.flipping-next {
          animation: flipOutNext 0.6s ease-in-out forwards;
        }

        .tos-cover.flipping-prev {
          animation: flipOutPrev 0.6s ease-in-out forwards;
        }

        .tos-cover::before {
          content: '';
          position: absolute;
          inset: clamp(12px, 2vw, 20px);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 3px 12px 12px 3px;
          pointer-events: none;
        }

        /* TOC */
        .tos-toc-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .tos-toc-item:hover {
          background: rgba(8,58,133,0.04);
          border-color: rgba(8,58,133,0.1);
        }

        /* Flip shadow overlay — darkens during mid-flip */
        .tos-book.is-flipping::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.04);
          z-index: 10;
          pointer-events: none;
          animation: flipShadow 0.6s ease-in-out forwards;
        }

        @keyframes flipShadow {
          0% { opacity: 0; }
          40% { opacity: 1; }
          60% { opacity: 1; }
          100% { opacity: 0; }
        }

        @media (max-width: 768px) {
          .tos-book-wrapper {
            padding: 12px;
            padding-top: 72px;
          }
          .tos-book {
            min-height: calc(100dvh - 100px);
            border-radius: 2px 10px 10px 2px;
          }
          .tos-book::before { width: 5px; }
          .tos-book::after { display: none; }
          .tos-progress { max-width: 40%; }
          .tos-dot { width: 6px; height: 6px; }
          .tos-dot.active { width: 14px; }
          .tos-nav-btn { padding: 8px 12px; font-size: 13px; }
        }

        @media (max-width: 480px) {
          .tos-book-wrapper { padding: 8px; padding-top: 68px; }
          .tos-book { min-height: calc(100dvh - 84px); }
          .tos-nav-btn span { display: none; }
        }
      `}</style>

      <div className="tos-book-container">
        <Navbar />

        <div className="tos-book-wrapper">
          <div ref={bookRef} className={`tos-book ${isFlipping ? 'is-flipping' : ''}`}>

            {/* === COVER PAGE === */}
            {currentPage === 0 && (
              <div className={`tos-cover ${isFlipping ? `flipping-${flipDirection}` : ''}`}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid rgba(255,255,255,0.2)' }}>
                    <i className="bi bi-shield-check" style={{ fontSize: 28, color: '#fff' }}></i>
                  </div>
                  <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Terms of Service</h1>
                  <p style={{ fontSize: 'clamp(14px, 1.5vw, 17px)', color: 'rgba(255,255,255,0.6)', margin: '0 0 32px', lineHeight: 1.6 }}>Amoria Connekyt</p>
                  <div style={{ width: 50, height: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 32px', borderRadius: 1 }} />
                  <p style={{ fontSize: 'clamp(11px, 1vw, 13px)', color: 'rgba(255,255,255,0.4)', margin: '0 0 40px' }}>Last Updated: 01 February 2026</p>
                  <button
                    onClick={nextPage}
                    style={{ padding: '14px 36px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                  >
                    Begin Reading <i className="bi bi-arrow-right" style={{ marginLeft: 8 }}></i>
                  </button>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>
                    <i className="bi bi-mouse" style={{ marginRight: 6 }}></i>
                    Scroll or swipe to flip pages
                  </p>
                </div>
              </div>
            )}

            {/* === TABLE OF CONTENTS === */}
            {currentPage === 1 && (
              <div className={`tos-page ${isFlipping ? `flipping-${flipDirection}` : ''}`}>
                <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, color: '#083A85', margin: '0 0 8px' }}>Table of Contents</h2>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>{sections.length} sections — tap to jump to any section</p>
                <div ref={contentRef} className="tos-page-content" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {sections.map((section, i) => (
                    <div
                      key={section.id}
                      className="tos-toc-item"
                      onClick={() => goToPage(i + 2)}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: viewedSections.has(i) ? '#083A85' : '#f1f5f9', color: viewedSections.has(i) ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {viewedSections.has(i) ? <i className="bi bi-check" style={{ fontSize: 14 }}></i> : i + 1}
                      </span>
                      <span style={{ fontSize: 'clamp(14px, 1.3vw, 15px)', fontWeight: 600, color: '#1e293b' }}>{section.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* === SECTION PAGES === */}
            {currentPage >= 2 && currentPage < totalPages && (
              <div className={`tos-page ${isFlipping ? `flipping-${flipDirection}` : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#083A85', letterSpacing: 2, textTransform: 'uppercase' }}>Section {currentPage - 1}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>of {sections.length}</span>
                </div>
                <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, color: '#083A85', margin: '0 0 4px' }}>
                  {sections[currentPage - 2].title}
                </h2>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(8,58,133,0.1)', margin: '12px 0 16px' }} />
                <div ref={contentRef} className="tos-page-content">
                  <div style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                    {sections[currentPage - 2].content}
                  </div>

                  {/* Agree section on last page */}
                  {currentPage === totalPages - 1 && (
                    <div style={{ marginTop: 32, padding: '20px 0', borderTop: '1px solid rgba(8,58,133,0.1)' }}>
                      {showWarning && !allSectionsViewed && (
                        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400E', textAlign: 'center' }}>
                          Please read all {sections.length} sections before agreeing. You have viewed {viewedSections.size} of {sections.length}.
                        </div>
                      )}
                      <label
                        style={{ display: 'flex', alignItems: 'center', cursor: allSectionsViewed ? 'pointer' : 'not-allowed', fontSize: 'clamp(13px, 1.2vw, 15px)', color: allSectionsViewed ? '#374151' : '#9CA3AF', userSelect: 'none', opacity: allSectionsViewed ? 1 : 0.6 }}
                        onClick={() => { if (!allSectionsViewed) setShowWarning(true); }}
                      >
                        <input
                          type="checkbox"
                          checked={isAgreed}
                          onChange={e => setIsAgreed(e.target.checked)}
                          disabled={!allSectionsViewed}
                          style={{ width: 20, height: 20, marginRight: 12, accentColor: '#083A85', cursor: allSectionsViewed ? 'pointer' : 'not-allowed' }}
                        />
                        By clicking the checkbox I confirm that I have read the Amoria Connekyt Terms of Use
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === NAVIGATION BAR === */}
            {currentPage > 0 && (
              <div className="tos-nav">
                <button className="tos-nav-btn" onClick={prevPage} disabled={currentPage === 0 || isFlipping}>
                  <i className="bi bi-chevron-left"></i> <span>Previous</span>
                </button>

                <div className="tos-progress">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`tos-dot ${i === currentPage ? 'active' : ''} ${i >= 2 && viewedSections.has(i - 2) ? 'viewed' : ''}`}
                      onClick={() => goToPage(i)}
                      title={i === 0 ? 'Cover' : i === 1 ? 'Contents' : sections[i - 2]?.title}
                    />
                  ))}
                </div>

                <button className="tos-nav-btn" onClick={nextPage} disabled={currentPage === totalPages - 1 || isFlipping}>
                  <span>Next</span> <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsAndConditionsPage;
