'use client';

import React, { useState } from 'react';
import Navbar from '../components/navbar';

const TermsAndConditionsPage = () => {
  const [selectedSection, setSelectedSection] = useState('terms-of-use');
  const [isAgreed, setIsAgreed] = useState(false);
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set(['terms-of-use']));
  const [showWarning, setShowWarning] = useState(false);
  const sections = [
    {
      id: 'terms-of-use',
      title: 'Terms of Use',
      content: `Welcome to Amoria Connekt. These Terms of Use ("Terms") govern your use of our website, mobile applications, and services (collectively, the "Platform"). By accessing or using Amoria Connekt, you agree to be bound by these Terms.

1. Acceptance of Terms
By accessing or using Amoria Connekt, you confirm that you are at least 18 years old or have legal parental or guardian consent, and are fully able to enter into a legally binding agreement. If you do not agree with any part of these terms, you may not use the Platform.

2. About Amoria Connekt
Amoria Connekt is a digital platform that connects photographers, videographers, and creative professionals with clients seeking media services for events, campaigns, and personal needs.

3. User Accounts
To access certain features, you must create an account. You agree to:
• Provide accurate and up-to-date information.
• Maintain the security of your login credentials.
• Accept responsibility for all activities under your account.

We reserve the right to suspend or delete accounts that violate our terms or are inactive for extended periods.

4. Intellectual Property
All content, trademarks, logos, and assets on Amoria Connekt are owned by Amoria Connekt or licensed to us. Users may not copy, reproduce, or use content from the Platform without prior permission.

5. Service Modifications
We reserve the right to modify, suspend, or discontinue any aspect of the Platform at any time with or without notice.

6. Limitation of Liability
Amoria Connekt is not liable for any indirect, incidental, or consequential damages arising from your use of the Platform.`
    },
    {
      id: 'user-agreement',
      title: 'User Agreement',
      content: `This User Agreement outlines the terms and conditions that govern the relationship between users and Amoria Connekt.

1. User Responsibilities
Users must maintain professional conduct and adhere to all applicable laws when using the platform. Any violation of these responsibilities may result in account suspension or termination.

2. Platform Usage
The platform should be used solely for legitimate business purposes related to photography and videography services. Misuse of the platform for unauthorized purposes is strictly prohibited.

3. Content Standards
All content uploaded must be original or properly licensed. Users are responsible for ensuring they have the necessary rights to share any content on the platform.

4. Account Security
Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.

5. Prohibited Activities
Users must not engage in fraudulent activities, spam, harassment, or any behavior that violates our community guidelines.

6. Reporting Violations
Users are encouraged to report any violations of this agreement to our support team for investigation.`
    },
    {
      id: 'photographer-membership',
      title: 'Photographer Membership Agreement',
      content: `This agreement governs the terms of membership for photographers and videographers on Amoria Connekt.

1. Membership Requirements
All photographers must provide valid credentials and maintain professional standards. This includes proper licensing, insurance where required, and portfolio verification.

2. Service Standards
Members agree to deliver high-quality services and maintain client satisfaction. Consistent poor performance may result in membership review or termination.

3. Commission Structure
Amoria Connekt retains a percentage of each booking as a platform fee. Current rates and payment schedules are outlined in the payment section.

4. Portfolio Management
Members must maintain an up-to-date portfolio showcasing their work and capabilities.

5. Profile Verification
All photographer profiles undergo verification to ensure authenticity and professional standards.

6. Membership Benefits
Active members receive priority placement in search results, promotional opportunities, and access to exclusive platform features.`
    },
    {
      id: 'cost-and-fees',
      title: 'Cost and Fees Authorization Agreement',
      content: `This agreement outlines all costs, fees, and payment structures associated with using Amoria Connekt.

1. Platform Fees
Amoria Connekt charges a service fee for successful bookings made through the platform. Current fee structure:
• Standard bookings: 15% platform fee
• Premium bookings: 20% platform fee
• Rush bookings: 25% platform fee

2. Payment Processing
All payments are processed securely through our designated payment partners. Processing fees may apply based on payment method selected.

3. Refund Policy
Refunds are handled according to our cancellation policy and service guarantee terms.

4. Fee Changes
We reserve the right to modify our fee structure with 30 days advance notice to all users.

5. Transaction Limits
Minimum transaction amount is $50. Maximum amounts may vary based on account verification level.

6. Currency Conversion
International transactions may incur currency conversion fees as determined by payment processors.`
    },
    {
      id: 'client-initiated',
      title: 'Client Initiated Direct Contract Terms',
      content: `These terms govern direct contracts initiated by clients through the Amoria Connekt platform.

1. Contract Formation
Direct contracts are formed when a client accepts a photographer's quote or proposal. All contracts must include scope of work, deliverables, timeline, and payment terms.

2. Platform Protection
Even for direct contracts, Amoria Connekt's terms of service apply. The platform fee is still applicable to maintain access to our dispute resolution and quality assurance services.

3. Communication Requirements
All contract negotiations must be conducted through the platform messaging system to ensure proper documentation.

4. Dispute Resolution
Any disputes arising from contracts will be handled through our mediation process.

5. Contract Modifications
Any changes to agreed terms must be documented and acknowledged by both parties through the platform.

6. Service Completion
Contracts are considered complete when all deliverables are provided and accepted by the client.`
    },
    {
      id: 'credentials-privacy',
      title: 'Credentials Privacy Agreement',
      content: `This agreement outlines how we handle and protect user credentials and authentication data.

1. Data Protection
We use industry-standard encryption to protect all user credentials and sensitive information. This includes SSL/TLS encryption for all data transmission and encrypted storage for sensitive data.

2. Access Control
User credentials are never shared with third parties without explicit consent. Internal access is limited to authorized personnel only.

3. Breach Notification
In the event of a security breach, affected users will be notified within 72 hours with recommended actions.

4. Password Security
Users must maintain strong passwords and update them regularly for optimal security.

5. Two-Factor Authentication
We strongly recommend enabling two-factor authentication for enhanced account security.

6. Session Management
User sessions automatically expire after periods of inactivity to protect account security.`
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      content: `This Privacy Policy explains how Amoria Connekt collects, uses, and protects your personal information.

1. Information Collection
We collect information you provide directly, such as when you create an account or contact us. This includes name, email, phone number, and portfolio information.

2. Information Use
We use your information to:
• Provide and improve our services
• Match clients with appropriate photographers
• Process payments and transactions
• Send relevant communications

3. Data Retention
We retain your data only as long as necessary to provide our services or as required by law.

4. Third-Party Sharing
We do not sell your personal information to third parties.

5. User Rights
Users have the right to access, modify, or delete their personal information at any time through account settings.

6. Compliance
We comply with all applicable data protection regulations including GDPR and CCPA.`
    },
    {
      id: 'cookie-policy',
      title: 'Cookie Policy',
      content: `This Cookie Policy explains how we use cookies and similar technologies on Amoria Connekt.

1. What Are Cookies
Cookies are small data files stored on your device when you visit our platform. They help us provide a better user experience and analyze platform usage.

2. Types of Cookies We Use
• Essential cookies: Required for platform functionality
• Analytics cookies: Help us understand usage patterns
• Preference cookies: Remember your settings
• Marketing cookies: Used for targeted advertising

3. Managing Cookies
You can control cookie settings through your browser. Note that disabling certain cookies may impact platform functionality.

4. Cookie Consent
By using our platform, you consent to our use of cookies as described in this policy.

5. Third-Party Cookies
Some cookies may be set by third-party services we use for analytics and marketing purposes.

6. Cookie Duration
Session cookies expire when you close your browser. Persistent cookies remain until deleted or expired.`
    },
    {
      id: 'client-payment',
      title: 'Client Payment Agreement',
      content: `This agreement governs payment terms and conditions for clients using Amoria Connekt.

1. Payment Terms
Clients agree to pay all fees as outlined in their service agreements with photographers. Payment is due according to the agreed schedule.

2. Payment Methods
We accept major credit cards, debit cards, and digital payment methods. All payments are processed securely through our payment partners.

3. Late Payment
Late payments may incur additional fees and may result in service suspension until payment is received.

4. Payment Disputes
Any payment disputes must be reported within 14 days of the transaction.

5. Deposit Requirements
Many photographers require deposits to secure bookings. Deposit amounts and terms are set by individual photographers.

6. Payment Confirmation
All successful payments receive immediate confirmation via email with transaction details and receipts.`
    },
    {
      id: 'photographer-payment',
      title: 'Photographer Payment Agreement',
      content: `This agreement outlines payment terms for photographers receiving payments through Amoria Connekt.

1. Payment Processing
Photographers will receive payments within 3-5 business days after service completion and client approval.

2. Payment Schedule
• Milestone-based projects: Payment upon completion of each milestone
• Event photography: Payment within 5 business days of event completion
• Ongoing projects: Monthly payment cycles

3. Tax Responsibilities
Photographers are responsible for their own tax obligations and should maintain appropriate records.

4. Payment Methods
Payments are issued via bank transfer, PayPal, or other approved payment methods.

5. Minimum Payout
Minimum payout threshold is $100. Amounts below this will accumulate until the threshold is reached.

6. Payment History
Complete payment history and transaction records are available in the photographer dashboard.`
    },
    {
      id: 'connekt-team',
      title: "'Connekt Team' Software Licence Agreement",
      content: `This agreement governs the use of Connekt Team software and related services.

1. License Grant
We grant you a limited, non-exclusive license to use the Connekt Team software for business purposes related to the platform.

2. Usage Restrictions
• No reverse engineering or modification
• No sublicensing or redistribution
• No use for competitive purposes

3. Updates and Support
License includes access to updates and basic support. Premium support available with additional subscription.

4. Termination
This license may be terminated if terms are violated or upon account closure.

5. Intellectual Property
All software, trademarks, and intellectual property remain the exclusive property of Amoria Connekt.

6. Warranty Disclaimer
Software is provided "as is" without warranties of any kind, express or implied.`
    },
    {
      id: 'non-discrimination',
      title: 'Non-discrimination Statement',
      content: `Amoria Connekt is committed to providing equal opportunities and does not discriminate based on race, color, religion, gender, sexual orientation, national origin, age, disability, or any other protected status.

1. Equal Access
All users have equal access to platform features and opportunities regardless of their background.

2. Reporting Discrimination
Users who experience or witness discrimination should report it through our dedicated reporting system.

3. Enforcement
Violations of our non-discrimination policy will result in immediate account review and potential termination.

4. Commitment to Diversity
We actively promote diversity and inclusion in our platform community.

5. Training and Education
We provide resources and training to all users to promote inclusive and respectful interactions.

6. Zero Tolerance
We maintain a zero-tolerance policy for discriminatory behavior and take all reports seriously.`
    },
    {
      id: 'referral-program',
      title: 'Referral Program Terms & Conditions',
      content: `These terms govern participation in the Amoria Connekt referral program.

1. Program Eligibility
All registered users in good standing are eligible to participate in the referral program.

2. Referral Rewards
• Client referrals: $50 credit per successful booking
• Photographer referrals: $100 credit upon first completed job
• Rewards credited after 30-day validation period

3. Program Limits
Maximum 10 referral rewards per month. Rewards cannot be combined with other promotions.

4. Fraud Prevention
Any fraudulent referral activity will result in immediate disqualification and possible account termination.

5. Reward Redemption
Rewards can be redeemed for platform services, subscription upgrades, or credited toward future bookings.

6. Program Modifications
Amoria Connekt reserves the right to modify or terminate the referral program at any time with prior notice.

7. Referral Tracking
All referrals are tracked through unique referral codes assigned to each user account.

8. Reward Eligibility Period
Rewards must be claimed within 90 days of earning, after which they will expire.

9. Referral Code Sharing
Users can share their unique referral code via email, social media, or direct messaging to maximize their referral potential.

10. Bonus Rewards
Special bonus rewards may be offered during promotional periods for additional referrals beyond the standard rewards.`
    }
  ];

  const currentSection = sections.find(section => section.id === selectedSection) || sections[0];

  // Check if all sections have been viewed
  const allSectionsViewed = viewedSections.size === sections.length;

  // Handle section selection and track viewed sections
  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
    setViewedSections(prev => new Set(prev).add(sectionId));
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      <style>
        {`
          .left-nav-scrollbar::-webkit-scrollbar {
            width: 12px;
          }
          .left-nav-scrollbar::-webkit-scrollbar-track {
            background: #C0C0C0;
          }
          .left-nav-scrollbar::-webkit-scrollbar-thumb {
            background: #083A85;
            border-radius: 6px;
          }
          .left-nav-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #062d6b;
          }
          .left-nav-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #083A85 #C0C0C0;
          }
        `}
      </style>
      <Navbar />

      {/* Header */}
      <div style={{
        width: '100%',
        backgroundColor: 'white',
        borderBottom: '1px solid #d1d5db',
        padding: '1.5rem 0',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          color: '#111827',
          margin: 0
        }}>
          Terms and Conditions
        </h1>
      </div>

      {/* Main Content Container */}
      <div style={{ display: 'flex', width: 'calc(100% - 2rem)', minHeight: 'calc(100vh - 120px)', overflow: 'hidden', marginLeft: '1rem', marginRight: '1rem', marginBottom: '0' }}>

        {/* Left Sidebar Navigation */}
        <div
          className="left-nav-scrollbar"
          style={{
            width: '30%',
            backgroundColor: '#C0C0C0',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: '100%',
            maxHeight: '100%',
            direction: 'rtl'
          }}>
          <nav style={{ padding: '1rem 0', margin: 0, direction: 'ltr', minHeight: '100%' }}>
            {sections.map((section) => (
              <div
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                style={{
                  cursor: 'pointer',
                  padding: '0.75rem 1rem',
                  fontSize: '15px',
                  lineHeight: '1.4',
                  color: selectedSection === section.id ? '#ffffff' : '#000000',
                  fontWeight: '600',
                  backgroundColor: selectedSection === section.id ? '#083A85' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#083A85';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  if (selectedSection === section.id) {
                    e.currentTarget.style.backgroundColor = '#083A85';
                    e.currentTarget.style.color = '#ffffff';
                  } else {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }
                }}
              >
                {section.title}
              </div>
            ))}
          </nav>
        </div>

        {/* Right Content Area */}
        <div style={{
          width: '70%',
          backgroundColor: '#F2FFDD',
          padding: '2.5rem',
          paddingRight: '3rem',
          overflowY: 'auto',
          minHeight: '100%',
          maxHeight: '100%'
        }}>
          {/* Static Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '0.5rem',
              marginTop: 0
            }}>
              {currentSection.title} - Amoria Connekt
            </h2>

            {/* Effective Date */}
            <p style={{
              fontSize: '14px',
              color: '#000000',
              marginBottom: '1.5rem',
              marginTop: 0
            }}>
              Effective Date: June-20th-2025
            </p>

            {/* Divider */}
            <hr style={{
              border: 'none',
              borderTop: '1px solid #000000',
              marginBottom: '1.5rem',
              marginTop: 0
            }} />
          </div>

          {/* Content */}
          <div style={{
            fontSize: '1rem',
            color: '#000000',
            lineHeight: '1.625',
            whiteSpace: 'pre-wrap',
            paddingBottom: '2rem'
          }}>
            {currentSection.content}
          </div>

          {/* Agree Checkbox */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '1rem',
            paddingBottom: '2rem'
          }}>
            {showWarning && !allSectionsViewed && (
              <div style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '8px',
                padding: '12px 20px',
                marginBottom: '1rem',
                fontSize: '14px',
                color: '#92400E',
                textAlign: 'center'
              }}>
                Please read all {sections.length} sections before agreeing. You have viewed {viewedSections.size} of {sections.length} sections.
              </div>
            )}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: allSectionsViewed ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                color: allSectionsViewed ? '#000000' : '#9CA3AF',
                userSelect: 'none',
                opacity: allSectionsViewed ? 1 : 0.6
              }}
              onClick={() => {
                if (!allSectionsViewed) {
                  setShowWarning(true);
                }
              }}
            >
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                disabled={!allSectionsViewed}
                style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '12px',
                  cursor: allSectionsViewed ? 'pointer' : 'not-allowed',
                  accentColor: '#083A85'
                }}
              />
              <span>
                By clicking the checkbox I confirm that I have read the Amoria Connekt Terms of Use
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;