'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

const TrustSafetyPage = () => {
  const [selectedSection, setSelectedSection] = useState('privacy-policy');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  
  const sections = [
    // Privacy Policy Sections
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
      id: 'information-collection',
      title: 'Information We Collect',
      content: `We collect several types of information from and about our users to deliver and improve our services.

1. Information You Provide Directly
When you use Amoria Connekt, you may provide:
• Personal Information: Your name, email address, phone number, and account login details.
• Profile Information: Professional details, biography, portfolio, and social media links (for photographers).
• Payment Information: Billing address, payment details (processed through secure third-party payment processors), and transaction history.
• Event Information: Details about your project or event, including descriptions, locations, and dates.
• Communications: Messages, feedback, or inquiries sent through our contact forms or support channels.

2. Information Collected Automatically
When you access Amoria Connekt, we automatically collect:
• Usage Data: Pages viewed, features used, duration of sessions, and clicks.
• Device Information: IP address, browser type, operating system, and device identifiers.
• Cookies and Tracking Technologies: We use cookies and similar technologies to enhance your experience and analyze platform performance.

3. Location Information
With your permission, we may collect precise location data to help match you with nearby photographers or clients.

4. Portfolio and Media Files
Photographers may upload images, videos, and other media files that become part of their professional portfolio on our platform.`
    },
    {
      id: 'information-sharing',
      title: 'How We Share Your Information',
      content: `We value your trust and only share information as necessary to deliver our services.

1. With Other Users
• Client and photographer information is shared to facilitate bookings and project collaboration.
• Profile information is visible to users searching for photography services.

2. Service Providers
We share data with trusted third parties who help us operate our platform:
• Payment processors for transaction handling
• Cloud hosting providers for data storage
• Analytics services to understand usage patterns
• Email and communication tools

3. Legal Requirements
We may disclose information:
• If required by law or valid legal process
• To protect our rights, property, or safety
• To prevent fraud or security threats
• During legal proceedings

4. Business Transfers
In case of a merger, acquisition, or sale of assets, user information may be transferred to the new entity.

5. With Your Consent
We may share information with other third parties when you explicitly consent to such sharing.

We never sell or rent personal information to third parties for marketing purposes.`
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: `We implement strong safeguards to protect your information from unauthorized access, alteration, or disclosure.

1. Technical Security Measures
• Encrypted data transmission using SSL/TLS protocols
• Secure data storage with encryption at rest
• Regular security audits and vulnerability assessments
• Firewall protection and intrusion detection systems

2. Access Control
• Role-based access control limiting employee access
• Multi-factor authentication for administrative access
• Regular review of access privileges
• Immediate revocation of access for terminated employees

3. Security Monitoring
• 24/7 monitoring for suspicious activity
• Automated threat detection systems
• Regular backup procedures
• Incident response protocols

4. User Responsibilities
However, no system is 100% secure. Users are responsible for:
• Maintaining strong, unique passwords
• Keeping login credentials confidential
• Reporting suspicious activity immediately
• Using secure internet connections

5. Security Incident Response
In the event of a data breach, we will notify affected users within 72 hours and provide guidance on protective measures.`
    },
    {
      id: 'how-we-use',
      title: 'How We Use Your Information',
      content: `We use the collected information for the following purposes:

1. Service Delivery
• To create and manage user accounts and verify identities.
• To connect clients with verified photographers and facilitate communication.
• To process bookings and schedule events.

2. Payment Processing
• To process payments securely through trusted third-party providers.
• To issue payouts to photographers for completed work.
• To maintain transaction records and receipts.

3. Platform Improvement
• To improve platform functionality, security, and performance.
• To analyze user behavior and enhance user experience.
• To develop new features based on user needs.

4. Communication
• To send service-related updates, such as confirmations, reminders, or notifications.
• To provide customer support and respond to inquiries.
• To send promotional materials (with your consent).

5. Legal Compliance
• To comply with legal obligations, resolve disputes, and enforce agreements.
• To prevent fraud and maintain platform security.
• To respond to law enforcement requests when required.`
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      content: `We retain personal information only as long as necessary to fulfill the purposes described in this policy.

1. Active Account Data
While your account is active, we retain all information necessary to provide our services, including profile data, transaction history, and communications.

2. Retention Periods
• Account information: Retained while account is active
• Transaction records: 7 years for tax and legal compliance
• Communication logs: 3 years for support and dispute resolution
• Analytics data: Aggregated and anonymized after 2 years

3. Data Deletion
When data is no longer needed:
• Personal information is securely deleted
• Data may be anonymized for statistical purposes
• Backups are purged according to retention schedules

4. Legal Obligations
We may retain certain data longer when required by:
• Legal or regulatory requirements
• Ongoing legal proceedings
• Legitimate business needs

5. Account Closure
Upon account deletion:
• Personal information is removed within 30 days
• Some information may be retained for legal compliance
• Anonymized data may be kept for analytics

6. User Requests
Users can request data deletion at any time, subject to legal retention requirements.`
    },
    {
      id: 'user-rights',
      title: 'Your Rights and Choices',
      content: `Depending on your location, you may have various rights regarding your personal information.

1. Access Rights
You have the right to:
• Access your personal data held by Amoria Connekt
• Request a copy of your data in a portable format
• View your data processing history

2. Correction Rights
You can:
• Update your profile information at any time
• Correct inaccurate data
• Request verification of data accuracy

3. Deletion Rights ("Right to be Forgotten")
You may request deletion of your personal data, except where retention is required by law or legitimate business interests.

4. Objection Rights
You can object to:
• Processing of your data for marketing purposes
• Automated decision-making
• Data processing based on legitimate interests

5. Restriction Rights
You may request restriction of data processing in certain circumstances, such as during dispute resolution.

6. Withdrawal of Consent
You can withdraw consent for data processing at any time where processing is based on consent.

7. Marketing Communications
You can opt-out of marketing emails by:
• Clicking unsubscribe links in emails
• Adjusting preferences in account settings
• Contacting support`
    },
    {
      id: 'cookies-tracking',
      title: 'Cookies and Tracking',
      content: `We use cookies and similar technologies to enhance your experience and analyze platform performance.

1. What Are Cookies
Cookies are small data files stored on your device when you visit our platform. They help us provide a better user experience and understand usage patterns.

2. Types of Cookies We Use
• Essential Cookies: Required for platform functionality (authentication, security, basic operations)
• Analytics Cookies: Help us understand usage patterns and improve our service
• Preference Cookies: Remember your settings and preferences
• Marketing Cookies: Used for targeted advertising and promotional campaigns

3. Third-Party Cookies
We use cookies from trusted third parties:
• Google Analytics for usage analysis
• Payment processors for transaction security
• Social media platforms for sharing features
• Advertising partners for targeted campaigns

4. Managing Cookies
You can control cookie settings through:
• Your browser settings
• Our cookie preference center
• Third-party opt-out tools

Note that disabling certain cookies may impact platform functionality and user experience.

5. Do Not Track
We respect Do Not Track browser settings where technically feasible.

6. Cookie Duration
• Session cookies: Expire when you close your browser
• Persistent cookies: Remain until deleted or expired (typically 1-2 years)

7. Updates
We may update our cookie usage. Significant changes will be communicated through our platform.`
    },
    {
      id: 'third-party-links',
      title: 'Third-Party Links',
      content: `Amoria Connekt may contain links to external websites and services not operated by us.

1. External Websites
Our platform may link to:
• Photographer personal websites and portfolios
• Social media profiles
• Payment processor sites
• Partner platforms and services

2. No Responsibility
We are not responsible for:
• Privacy practices of external sites
• Content accuracy of linked websites
• Security of third-party platforms
• Terms and conditions of external services

3. User Discretion
When visiting external sites:
• Review their privacy policies
• Understand their data practices
• Exercise caution with personal information
• Use secure connections

4. Social Media Integration
We may integrate with social platforms for:
• Profile authentication
• Content sharing
• Social login features

These integrations are subject to the privacy policies of respective platforms.

5. Photographer External Content
Photographers may link to external portfolios. We do not control or endorse external content and users access it at their own discretion.

6. Reporting Concerns
If you encounter inappropriate or suspicious links, please report them to our support team immediately.`
    },
    {
      id: 'childrens-privacy',
      title: "Children's Privacy",
      content: `Amoria Connekt is committed to protecting the privacy of children and complying with applicable children's privacy laws.

1. Age Requirements
• Amoria Connekt is not intended for users under 18 years old
• We do not knowingly collect information from individuals under 18
• Users must confirm they meet age requirements during registration

2. Parental Consent
If we discover that a user is under 18:
• The account will be immediately suspended
• We will attempt to notify parents or guardians
• All personal information will be deleted promptly

3. COPPA Compliance
We comply with the Children's Online Privacy Protection Act (COPPA) and similar international regulations protecting minors online.

4. No Targeting of Minors
• We do not market to children
• Our services are designed for adult professionals and clients
• Content is appropriate for business purposes only

5. Reporting Underage Users
If you believe a user is under 18, please report this to:
• Email: privacy@amoriaconnekt.com
• Subject line: "Underage User Report"
• Include relevant account information

6. Educational Use
For legitimate educational purposes (e.g., photography students over 18), parental consent may be required by educational institutions, though this is outside our direct control.

7. Data Deletion
If found, data from underage users will be deleted immediately and permanently from all systems, including backups.`
    },
    {
      id: 'international-transfers',
      title: 'International Data Transfers',
      content: `Amoria Connekt operates globally and may transfer data across international borders.

1. Data Transfer Locations
Your information may be transferred to and processed in:
• United States (primary data center location)
• European Union (for EU users)
• Other countries where our service providers operate

2. Legal Safeguards
We ensure international transfers comply with:
• Standard Contractual Clauses (SCCs)
• EU-US Data Privacy Framework
• Adequacy decisions by data protection authorities
• Other legally recognized transfer mechanisms

3. EU User Rights
For users in the European Economic Area:
• Your data is protected under GDPR
• We maintain EU representative contact information
• You have additional rights under European law

4. Cross-Border Processing
Data may be processed across borders for:
• Payment processing
• Cloud storage and backup
• Customer support services
• Analytics and platform improvement

5. Security During Transfer
• All data transfers use encrypted connections
• We vet all international service providers
• Regular compliance audits are conducted

6. Your Consent
By using Amoria Connekt, you consent to international data transfers as described in this policy.`
    },
    {
      id: 'rwanda-privacy',
      title: 'Rwanda Data Protection and Privacy Rights',
      content: (
        <div>
          Rwanda's Data Protection and Privacy Law No. 058/2021 of 13/10/2021 provides individuals (data subjects) with rights concerning how their personal data is collected, processed, and used. Amoria Connekt respects and complies with this law to ensure that your personal information is protected, processed fairly, and used only for legitimate purposes.
          <br /><br />
          <strong>1. Right to Be Informed</strong><br />
          You have the right to be informed about how and why Amoria Connekt collects and uses your personal data. This includes knowing the purpose, legal basis, data retention period, and your rights regarding such data.
          <br /><br />
          <strong>2. Right of Access</strong><br />
          You may request access to the personal data we hold about you, including how it has been processed and for what purpose.
          <br /><br />
          <strong>3. Right to Rectification</strong><br />
          You have the right to request correction of any inaccurate or incomplete personal data we hold about you.
          <br /><br />
          <strong>4. Right to Erasure ("Right to Be Forgotten")</strong><br />
          You can request the deletion of your personal data when:
          <ul style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <li>The data is no longer needed for its original purpose.</li>
            <li>You withdraw your consent.</li>
            <li>The data has been unlawfully processed.</li>
            <li>Erasure is required to comply with Rwandan law.</li>
          </ul>
          <strong>5. Right to Restrict Processing</strong><br />
          You may request that we limit the processing of your personal data in certain cases, such as when the accuracy of the data is contested or when processing is unlawful.
          <br /><br />
          <strong>6. Right to Data Portability</strong><br />
          You have the right to obtain your personal data in a structured, commonly used, and machine-readable format, and to transfer it to another controller where technically feasible.
          <br /><br />
          <strong>7. Right to Object</strong><br />
          You may object to the processing of your personal data for marketing, profiling, or other legitimate interests pursued by Amoria Connekt.
          <br /><br />
          <strong>8. Rights in Automated Decision-Making</strong><br />
          You have the right not to be subject to decisions based solely on automated processing, including profiling, that significantly affects you.
          <br /><br />
          <strong>9. Data Protection and Security</strong><br />
          Amoria Connekt implements strict technical and organizational measures to secure your data, including:
          <ul style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <li>Encryption and access control mechanisms.</li>
            <li>Secure storage and transmission of personal data.</li>
            <li>Regular audits and compliance checks.</li>
          </ul>
          <strong>10. Cross-Border Data Transfers</strong><br />
          We transfer personal data outside Rwanda only when adequate protection measures are in place, and in compliance with the National Cyber Security Authority (NCSA) regulations.
          <br /><br />
          <strong>11. Data Retention</strong><br />
          Personal data is retained only for as long as necessary to fulfill its intended purpose or comply with legal obligations.
          <br /><br />
          <strong>12. How to Exercise Your Rights</strong><br />
          To exercise any of these rights, please contact:<br />
          Email: <a href="mailto:privacy@amoriaconnekt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>privacy@amoriaconnekt.com</a><br />
          Subject line: "Rwanda Data Privacy Request"<br />
          Include your name, email, and specific request. We will respond within the timeframe required by Rwandan law.
          <br /><br />
          <strong>13. Supervisory Authority</strong><br />
          If you believe your data protection rights have been violated, you can file a complaint with:<br />
          National Cyber Security Authority (NCSA)<br />
          Data Protection Office – Kigali, Rwanda<br />
          Website: <a href="https://www.ncsa.gov.rw" target="_blank" rel="noopener noreferrer" style={{ color: '#083A85', textDecoration: 'underline' }}>www.ncsa.gov.rw</a>
        </div>
      )
    },
    {
      id: 'policy-updates',
      title: 'Updates to This Policy',
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.

1. Notification of Changes
When we make significant changes:
• We will update the "Effective Date" at the top
• We will notify users via email
• We will display a prominent notice on the platform
• Major changes require 30 days notice before taking effect

2. Minor Changes
For minor or administrative changes:
• We will update the policy with a new effective date
• Continued use of the platform constitutes acceptance
• Changes will be highlighted in the updated policy

3. Review Frequency
We review this policy:
• Annually as part of compliance audits
• When launching new features
• When legal requirements change
• Following user feedback or privacy concerns

4. Version History
Previous versions of this policy are available upon request for comparison and transparency purposes.

5. Your Responsibility
We encourage you to:
• Review this policy periodically
• Check the effective date for updates
• Contact us with questions about changes
• Exercise your rights if you disagree with changes

6. Continued Use
Continued use of Amoria Connekt after policy updates indicates acceptance of the revised terms. If you do not agree, you should discontinue use and may request account deletion.

7. Material Changes
Material changes affecting your rights will require explicit consent or the opportunity to opt-out before taking effect.`
    },
    {
      id: 'contact-us',
      title: 'Contact Us',
      content: (
        <div>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us.
          <br /><br />
          <strong>1. Privacy Office Contact</strong><br />
          Amoria Connekt Privacy Office<br />
          Email: <a href="mailto:privacy@amoriaconnekt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>privacy@amoriaconnekt.com</a><br />
          Phone: <a href="tel:+250788437347" style={{ color: '#083A85', textDecoration: 'underline' }}>+250 788 437 347</a><br />
          Website: <a href="https://www.amoriaconnekt.com" target="_blank" rel="noopener noreferrer" style={{ color: '#083A85', textDecoration: 'underline' }}>www.amoriaconnekt.com</a>
          <br /><br />
          <strong>2. General Support</strong><br />
          For general inquiries:<br />
          Email: <a href="mailto:support@amoriaconnekt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>support@amoriaconnekt.com</a><br />
          Response time: Within 24-48 hours
          <br /><br />
          <strong>3. Data Protection Officer</strong><br />
          For specific privacy and data protection matters:<br />
          Email: <a href="mailto:dpo@amoriaconnekt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>dpo@amoriaconnekt.com</a><br />
          Available for GDPR and CCPA related inquiries
          <br /><br />
          We take all privacy concerns seriously and will work diligently to address your issues.
        </div>
      )
    },
    // Divider between sections (this is just for visual separation in the navigation)
    { isDivider: true },
    // Trust & Safety Sections
    {
      id: 'trust-safety-overview',
      title: 'Trust & Safety Overview',
      content: `At Amoria Connekt, we believe that trust is the foundation of every creative collaboration. Whether you are a client seeking to preserve your story or a photographer capturing it, we are committed to maintaining a safe, transparent, and respectful community.

This Trust & Safety Policy outlines the principles, protections, and practices we follow to ensure that everyone using Amoria Connekt feels secure and supported.`
    },
    {
      id: 'commitment-safety',
      title: 'Our Commitment to Safety',
      content: `Amoria Connekt is built on integrity, professionalism, and care. We actively monitor, verify, and protect the experience of every user on our platform through:

• Verified user and photographer onboarding
• Secure payment and content delivery systems
• Active moderation and user support for conflict resolution
• Strict data protection aligned with Rwanda's Data Protection and Privacy Law No. 058/2021`
    },
    {
      id: 'verification-authenticity',
      title: 'Verification & Authenticity',
      content: `We ensure that all photographers and clients are legitimate through:

1. Identity Verification
Every photographer is required to provide valid identification and portfolio verification before joining the platform.

2. Portfolio Review
Submitted work is reviewed for authenticity and quality standards.

3. Community Reviews
Clients can rate and review photographers after each project to maintain accountability and transparency.`
    },
    {
      id: 'secure-transactions',
      title: 'Secure Transactions',
      content: `Your payments and data are protected at every step:

1. Escrow System
Client payments are securely held in escrow until project completion and approval.

2. Refund & Dispute Resolution
Funds are only released when clients confirm satisfaction. Disputes are handled fairly and transparently through our internal support process.

3. Data Encryption
All transactions and communications occur over encrypted channels.`
    },
    {
      id: 'content-safety-ip',
      title: 'Content Safety & Intellectual Property',
      content: `We respect your creative ownership and personal memories:

1. Client Ownership
Clients retain ownership of their photos and videos unless otherwise agreed upon.

2. Photographer Rights
Photographers maintain the right to display work in portfolios with client consent.

3. No Unauthorized Sharing
Amoria Connekt prohibits any unauthorized sharing, resale, or misuse of client or photographer content.

4. Takedown Policy
We respond promptly to any copyright or privacy complaints under Rwanda's data and intellectual property laws.`
    },
    {
      id: 'respectful-behavior',
      title: 'Respectful Behavior & Anti-Abuse Policy',
      content: `We maintain a respectful and inclusive environment:

• Harassment, discrimination, or offensive conduct will not be tolerated
• Users may not request or share inappropriate, explicit, or illegal content
• Any form of fraud, impersonation, or exploitation will lead to account suspension or permanent removal`
    },
    {
      id: 'live-streaming-safety',
      title: 'Live Streaming & Event Coverage Safety',
      content: `When using live streaming features:

1. Privacy Controls
Clients can choose who can view or interact with their live streams.

2. Recording Transparency
All recorded sessions must comply with consent requirements.

3. Content Moderation
Offensive or harmful live content will be immediately terminated and reviewed.`
    },
    {
      id: 'data-protection-confidentiality',
      title: 'Data Protection & Confidentiality',
      content: `Amoria Connekt complies fully with Rwanda's Law No. 058/2021 on the Protection of Personal Data and Privacy. We ensure:

• Your personal data is used only for legitimate platform operations
• Cross-border data transfers occur only under legally approved safeguards
• Sensitive information (such as payment data) is never disclosed to unauthorized third parties

For full details, see our Privacy Policy sections above.`
    },
    {
      id: 'reporting-issues',
      title: 'Reporting Issues',
      content: `If you encounter a problem or safety concern:

1. Report Directly
Use the in-app "Report" or "Contact Support" feature.

2. Email
Send details to safety@amoriaconnekt.com

3. Include Information
Your name, email, description of the issue, and any supporting evidence.

Our Trust & Safety team will investigate and respond within 72 hours. Urgent matters such as abuse, harassment, or fraud are prioritized.`
    },
    {
      id: 'enforcement-accountability',
      title: 'Enforcement & Accountability',
      content: `Violations of this policy may result in:

• Warning or temporary suspension
• Permanent account removal for serious or repeated offenses
• Reporting to authorities under applicable Rwandan laws if criminal behavior is involved`
    },
    {
      id: 'continuous-improvement',
      title: 'Continuous Improvement',
      content: `Trust and safety are ongoing responsibilities. Amoria Connekt continuously reviews community feedback, local regulations, and best practices to strengthen user safety, data protection, and professional integrity across our platform.`
    },
    {
      id: 'trust-safety-contact',
      title: 'Contact Our Trust & Safety Team',
      content: (
        <div>
          For safety-related issues or general questions, please contact:
          <br /><br />
          <i className="bi bi-envelope-fill" style={{ marginRight: '0.5rem' }}></i><a href="mailto:safety@amoriaconnekt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>safety@amoriaconnekt.com</a><br />
          <i className="bi bi-geo-alt-fill" style={{ marginRight: '0.5rem' }}></i>Kigali, Rwanda<br />
          <i className="bi bi-globe" style={{ marginRight: '0.5rem' }}></i><a href="https://www.amoriaconnekt.com" target="_blank" rel="noopener noreferrer" style={{ color: '#083A85', textDecoration: 'underline' }}>www.amoriaconnekt.com</a>
        </div>
      )
    }
  ];

  const currentSection = sections.find(section => section.id === selectedSection) || sections[0];

  // Auto-scroll selected section into view
  useEffect(() => {
    if (selectedSection && sectionRefs.current[selectedSection]) {
      sectionRefs.current[selectedSection]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedSection]);

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
            scroll-behavior: smooth;
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
          Privacy Policy & Trust Safety
        </h1>
      </div>

      {/* Main Content Container */}
      <div style={{ display: 'flex', width: 'calc(100% - 2rem)', height: 'calc(100vh - 200px)', overflow: 'hidden', marginLeft: '1rem', marginRight: '1rem', marginBottom: '0' }}>

        {/* Left Sidebar Navigation */}
        <div
          className="left-nav-scrollbar"
          style={{
            width: '30%',
            backgroundColor: '#C0C0C0',
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '100%',
            direction: 'rtl'
          }}>
          <nav style={{ padding: '1rem 0', margin: 0, direction: 'ltr', minHeight: '100%' }}>
            {sections.map((section, index) => {
              // Handle divider
              if (section.isDivider) {
                return (
                  <div
                    key={`divider-${index}`}
                    style={{
                      borderTop: '2px solid #666',
                      margin: '1rem 1.5rem',
                      opacity: 0.5
                    }}
                  />
                );
              }

              // Type guard: ensure section has id
              if (!section.id) return null;

              return (
                <div
                  key={section.id}
                  ref={(el) => {
                    if (section.id) {
                      sectionRefs.current[section.id] = el;
                    }
                  }}
                  onClick={() => setSelectedSection(section.id)}
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
              );
            })}
          </nav>
        </div>

        {/* Right Content Area */}
        <div style={{
          width: '70%',
          backgroundColor: '#F2FFDD',
          padding: '2.5rem',
          overflowY: 'auto',
          height: '100%'
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
              {currentSection.id?.includes('trust') || currentSection.id?.includes('safety') ?
                'Last Updated: October 9, 2025' :
                'Effective Date: June 20th, 2025'}
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
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TrustSafetyPage;