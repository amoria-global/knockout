'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/navbar';

const TrustSafetyPage = () => {
  const [selectedSection, setSelectedSection] = useState('privacy-policy');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const contentRef = useRef<HTMLDivElement>(null);

  
  const sections = [
    // Privacy Policy Sections
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      content: `Privacy is a fundamental right that we take seriously at Amoria Connekyt. This Privacy Policy explains in clear, comprehensive terms how we collect, use, protect, and share your personal information when you use our platform. Whether you're a creative professional showcasing your talents or a client seeking photography services, understanding how we handle your data empowers you to make informed decisions and exercise control over your privacy.

We've designed our privacy practices around core principles of transparency, data minimization, purpose limitation, and user control. We only collect information necessary to provide our services effectively, we use it only for specified legitimate purposes, we protect it with industry-leading security measures, and we give you meaningful control over your data through accessible rights and choices.

This privacy policy summary provides essential information about our data practices. For comprehensive details about every aspect of privacy on our platform, please refer to our complete Privacy Policy available at www.amoriaconnect.com/privacy-policy or within your account dashboard.

1. Information Collection - What We Gather and Why
Understanding what information we collect and why helps you assess whether you're comfortable using our services. We collect several categories of information, each serving specific purposes that enable platform functionality and improve your experience.

Information you provide directly forms the foundation of your account and enables core platform features. When you create an account, we collect your name for identification and personalization, email address for account access and communication, phone number for verification and urgent contact, password for account security, and location information to match you with nearby services. For photographers and videographers, we additionally collect professional information including biography and service descriptions, portfolio images and videos showcasing your work, pricing information for services offered, specialties and categories (wedding, portrait, commercial, etc.), and availability calendars.

We collect booking and project information when you engage in transactions including detailed project requirements and specifications, event dates, times, and locations, communication between clients and creators about projects, agreed terms, deliverables, and pricing, revision requests and feedback during projects, and final approval or dispute information. Payment and financial information is processed securely through our licensed payment gateway partners (Pesapal, Flutterwave, JengaPay) including billing addresses, payment method information (tokenized for security - we never store complete card numbers), transaction amounts, dates, and statuses, and invoice and receipt information.

Identity verification documents are required for KYC compliance including government-issued identification (national ID, passport, driver's license), proof of address for identity confirmation, and for businesses, registration documents and Tax Identification Numbers. Technical and usage data is automatically collected to optimize platform performance including IP addresses and device information, pages viewed and features accessed, search queries and navigation patterns, session duration and interaction data, and error logs for troubleshooting and improvement.

2. Information Use - How We Apply Your Data
Every piece of information we collect serves specific, legitimate purposes directly related to providing and improving our services. We use your information to provide and improve our services by maintaining your account and profile, processing bookings and facilitating transactions, enabling communication between users, delivering customer support and resolving issues, personalizing your experience based on preferences, and continuously improving platform features and functionality.

Matching clients with appropriate photographers and videographers relies on intelligent use of data including location proximity for convenient service delivery, specialty alignment (wedding, corporate, portrait, etc.), pricing range compatibility with client budgets, availability on requested dates, past reviews and ratings from previous clients, and portfolio style matching client preferences.

We use information to process payments and transactions securely by verifying payment methods and preventing fraud, collecting funds from clients and holding in escrow, releasing payments to creators upon project completion, maintaining transaction records for accounting and tax purposes, detecting suspicious patterns that might indicate fraud, and complying with Anti-Money Laundering regulations.

Communication purposes include sending service-related updates such as booking confirmations, payment receipts, project status changes, and account security alerts; providing customer support responses to inquiries and assistance; and with your explicit consent, sending promotional materials about new features, special offers, or platform updates (you can opt out anytime).

3. Data Retention - Balancing Service Needs with Privacy
We don't retain your data indefinitely. Our retention practices carefully balance operational needs, legal requirements, and your privacy interests. We retain your data only as long as necessary to provide our services or as required by applicable law.

Active account data remains accessible while your account is active including your profile information, portfolio content, transaction history, communications with other users, and account settings. Upon account closure or extended inactivity, different retention periods apply based on data type and legal requirements. Transaction records and financial data are retained for 7 years as required by Rwandan tax law and international financial regulations to support tax audits, regulatory compliance, and financial investigations.

KYC verification documents are retained for 5 years following your last transaction to comply with Anti-Money Laundering requirements under Rwanda's Law No. 69/2018. Communication logs are typically retained for 12 months for security auditing, fraud investigation, and platform debugging. Analytics data may be retained longer in anonymized form that doesn't identify individuals, supporting long-term platform strategy and improvement.

4. Third-Party Sharing - When and Why We Share Data
Your trust is paramount, and we protect it by limiting data sharing to necessary, transparent purposes. We do not sell, rent, or trade your personal information to third parties for marketing purposes. We only share information when necessary to deliver services, comply with legal obligations, or with your explicit consent.

Other platform users see certain information to enable connections and transactions. Your public profile (name, photo, biography, portfolio for creators) is visible to users browsing the platform. When you book services or accept bookings, relevant contact information and project details are shared to facilitate collaboration. Payment processors receive necessary transaction information to process payments securely including billing addresses, transaction amounts, and tokenized payment methods (never complete card numbers).

Service providers assisting with platform operations include cloud hosting providers for data storage, analytics services for understanding usage patterns, identity verification partners for KYC compliance, and email/communication tools for notifications. All service providers are bound by strict confidentiality agreements. Legal or government bodies may receive information when required by valid legal processes, when necessary to prevent fraud or investigate security threats, or to comply with AML/CTF reporting requirements.

5. User Rights - Your Control Over Personal Data
You have significant rights regarding your personal information under Rwanda's Data Protection and Privacy Law No. 058/2021, GDPR (for EU users), and our commitment to privacy. Users have the right to access, modify, or delete their personal information at any time through account settings for most data, or by contacting privacy@amoriaglobal.com for comprehensive data access, correction of inaccurate information, deletion subject to legal retention requirements, restriction of processing for certain purposes, data portability in machine-readable formats, or objection to processing based on legitimate interests.

We respond to rights requests within 30 days as required by Rwandan law, though typically much faster for straightforward requests. Most requests are free of charge, though we may charge reasonable fees for manifestly excessive or repetitive requests.

6. Compliance with Data Protection Regulations
We comply with all applicable data protection regulations to ensure the highest level of protection regardless of where you're located. This includes Rwanda's Data Protection and Privacy Law No. 058/2021 as our primary framework, GDPR protections for EU users, international standards including ISO 27001 and ISO 27701, and various other privacy regulations applicable to our global user base.

Our compliance includes lawful bases for all processing activities, enhanced consent mechanisms for sensitive data, data protection by design and default in all systems, privacy impact assessments for high-risk processing, data breach notification within 72 hours as required, and comprehensive documentation of all data processing activities.

For Complete Privacy Information:
This summary covers essential privacy practices, but for comprehensive details about all aspects of data protection, your rights, international transfers, cookies, security measures, and contact information for privacy requests, please review our complete Privacy Policy at www.amoriaconnect.com/privacy-policy or contact privacy@amoriaglobal.com with any questions or concerns.`
    },
    {
      id: 'information-collection',
      title: 'Information We Collect',
      content: `Understanding what information we collect and why is essential to making informed decisions about using Amoria Connekyt. We collect several types of information from and about our users to deliver services, facilitate connections between clients and creators, process transactions securely, and continuously improve our platform. Our data collection is guided by principles of transparency, necessity, and purpose limitation—we collect only what we need and use it only for specified, legitimate purposes.

Every piece of information we collect serves a specific function that benefits you directly, whether by enabling core features, enhancing security, personalizing your experience, or ensuring legal compliance. Below is a comprehensive explanation of the categories of information we collect, the methods of collection, and the purposes each type serves.

1. Information You Provide Directly - Active Data Submission
The most significant category of information comes directly from you when you interact with our platform. This information is provided consciously and deliberately as you use various features and services.

Personal Information forms the foundation of your account and identity on our platform. When you register for an account, you provide your full name for identification and personalization throughout the platform, email address serving as your primary account identifier and communication channel, phone number for account verification, security (two-factor authentication), and urgent communications, and password that you create to secure your account access (stored in encrypted form, never in plain text). This basic personal information enables us to create and maintain your unique account, verify your identity, communicate with you about your account and bookings, and protect your account from unauthorized access.

Profile Information allows you to present yourself professionally and helps clients or creators find the right match. For photographers, videographers, and other creative professionals, profile information is extensive and crucial to attracting clients. It includes professional biography describing your background, experience, and creative approach; detailed service descriptions explaining what you offer, your specialties, and your process; portfolio content showcasing your best work through images and videos; pricing information including packages, rates, and what's included; service categories and specialties (wedding, portrait, commercial, events, drone photography, videography, etc.); professional credentials, certifications, or awards; availability calendar showing when you're available for bookings; and social media links connecting to your Instagram, Facebook, or professional website. For clients, profile information is simpler but still important—preferred name and contact preferences, location for finding nearby creators, and preferences for services you're seeking.

Payment Information enables secure financial transactions through our platform. When you make or receive payments, we collect billing address for payment verification and fraud prevention, payment method details processed exclusively through our secure, PCI DSS-compliant payment gateway partners (Pesapal, Flutterwave, JengaPay), transaction history documenting payments made or received for record-keeping and tax purposes, and invoices and receipts for your financial records. Importantly, we never store complete credit card numbers, CVV codes, or other highly sensitive payment credentials on our servers—these are handled exclusively by our payment processors in tokenized form.

Event and Project Information captures details about bookings and creative projects. When clients book services or creators accept projects, we collect comprehensive project information including event type and description (wedding, birthday party, corporate event, product shoot, etc.), event date, time, and location, specific requirements and client expectations, shot lists or particular moments to capture, number of people attending or subjects to photograph, special requests or unique circumstances, delivery timeline and format preferences (digital files, prints, video editing style), and budget or pricing agreed upon. This detailed information ensures creators understand exactly what's expected and can deliver services that meet or exceed client expectations.

Communications and Messages exchanged through our platform are stored to facilitate ongoing conversations and provide evidence for dispute resolution if needed. This includes direct messages between clients and creators discussing projects, support conversations when you contact our customer service team, feedback or reviews you provide about experiences, inquiries or questions sent through contact forms, and any other communications facilitated through platform messaging features. Communications are encrypted in transit and stored securely with access limited to authorized personnel.

Identity Verification Documents are required for financial transactions and regulatory compliance. Before creators can receive payments or for high-value client transactions, we collect government-issued identification such as national ID cards, passports, or driver's licenses; proof of address through utility bills, bank statements, or government correspondence; and for businesses, registration certificates, Tax Identification Numbers (TIN), and beneficial ownership information identifying the people controlling the business. These documents are processed securely, accessed only by authorized verification personnel, and retained only as long as legally required (typically 5 years under AML/CTF regulations).

2. Information Collected Automatically - Passive Data Gathering
Beyond what you explicitly provide, our systems automatically collect certain information when you access and use Amoria Connekyt. This automatic collection enables platform functionality, security monitoring, and performance optimization.

Usage Data provides insights into how you interact with our platform, helping us understand what features are valuable and where improvements are needed. We automatically collect information about pages and sections you view, features and functions you use, duration of your sessions and time spent on specific pages, clicks, navigation paths, and user flow through the platform, search queries entered when looking for photographers or services, and interactions with content (viewing portfolios, watching videos, reading reviews). This usage data is typically aggregated and analyzed in ways that don't identify you personally, though we can also examine individual usage patterns to provide personalized recommendations or investigate security concerns.

Device Information helps us optimize the platform for the devices you use and detect potential security threats. When you access Amoria Connekyt, we collect IP address identifying your general geographic location and internet service provider, browser type and version (Chrome, Firefox, Safari, Edge, etc.), operating system (Windows, macOS, iOS, Android, Linux), device identifiers (unique IDs for mobile devices or browsers), screen resolution and display characteristics to optimize visual presentation, and language preferences and timezone settings. Device information serves multiple purposes including optimizing platform display for your specific device, detecting suspicious login patterns (access from unusual locations or unfamiliar devices), preventing fraud and abuse, ensuring compatibility with your technical configuration, and understanding which devices and browsers we need to support.

Cookies and Tracking Technologies enhance your experience and enable essential platform functionality. We use several types of cookies and similar technologies: Essential cookies required for platform operation including session cookies maintaining your login state, security cookies preventing CSRF attacks and protecting your account, preference cookies remembering your settings and choices, and shopping cart/booking cookies maintaining your selections during multi-step processes. Analytics cookies help us understand usage patterns through Google Analytics and similar services tracking page views, user flows, popular features, and performance metrics. Preference cookies remember your language selection, display options, notification preferences, and other customization choices. Marketing cookies (only with your consent) support targeted advertising and promotional campaigns.

You can control cookie settings through your browser preferences or our cookie preference center. Disabling certain cookies may impact platform functionality, though essential cookies necessary for core operations cannot be disabled while using the service.

Referral Information tracks how you found Amoria Connekyt, helping us understand which marketing efforts are effective. We collect information about the source that brought you to our platform (search engines, social media, direct links, partner websites), marketing campaigns you responded to, referral codes if you were invited by existing users, and advertising channels that drove your visit.

3. Location Information - Geographic Data Collection
Location data helps us connect you with nearby services and provide localized experiences, but we collect it only with your permission and use it only for specified purposes.

With your explicit permission, we may collect precise location data from your device using GPS, Wi-Fi positioning, or cellular tower triangulation. This precise location enables highly accurate matching with nearby photographers or venues, real-time location features for event coordination, and distance-based search results showing creators closest to you.

Even without precise location permission, we collect approximate location based on IP address. This coarse location (typically city or region level) is sufficient for basic geographic matching, showing creators in your general area, customizing content for your region, and complying with geographic restrictions or legal requirements.

You control location permissions through your device settings and can revoke permission at any time. Without location access, you can still use our platform but will need to manually enter locations for searches and bookings.

4. Portfolio and Media Files - Creative Content
For photographers, videographers, and creative professionals, portfolio content is the heart of your presence on Amoria Connekyt. Portfolio and media files you upload become part of your professional presentation and are subject to specific handling and protection.

Creators upload various types of media including photographic images in JPEG, PNG, RAW, and other formats, video files showcasing videography work or promotional content, audio files if relevant to services (though less common), documents describing services, pricing sheets, or sample contracts, and any other media supporting professional presentation. This content serves to showcase your creative style and quality, demonstrate your capabilities to potential clients, build your professional brand and reputation, attract bookings from clients whose aesthetic aligns with your work, and establish your credibility and expertise.

Portfolio content is protected through several mechanisms: access controls determining who can view your portfolio (public, clients only, private), encryption during storage and transmission, respect for your intellectual property rights (you retain copyright), limited platform license only for operational purposes (hosting, display, optimization), and your ability to update, remove, or modify portfolio content at any time.

Metadata embedded in media files (camera settings, location where photos were taken, timestamps, software used for editing) may be collected when you upload files. We may strip certain metadata for privacy or use it for organizing and searching content, but we don't share metadata publicly without your permission.

5. Information from Third-Party Sources - External Data Integration
Sometimes we receive information about you from external sources that integrate with our platform or verify your identity.

Social media platforms provide basic information if you use social login features (signing in with Facebook, Google, Instagram, etc.). This typically includes your name, profile photo, email address, and basic public profile information. You control what information social platforms share through their permission settings.

Payment processors provide transaction status information, fraud detection signals, and verification results, though not complete financial credentials. Identity verification partners provide verification results confirming or questioning document authenticity but don't provide us with copies of verification documents unnecessarily.

Background check services (if applicable for certain creator categories) may provide verification of credentials, certifications, or professional history when relevant to services offered.

Why We Collect This Information - Purpose and Necessity

Every category of information serves specific purposes that directly benefit you and enable platform functionality: Account creation and management require personal information; Matching clients with creators requires location, specialties, and availability data; Processing payments requires financial information and identity verification; Security and fraud prevention require device information, IP addresses, and behavioral patterns; Platform improvement requires usage analytics and performance data; Legal compliance requires identity documents and transaction records; Customer support requires communication history and account details; and Personalization requires preferences and usage patterns.

Your Control Over Information Collection:
While much of the information we collect is necessary for platform functionality, you retain significant control. You can update or correct most information through account settings, request comprehensive data access to see everything we hold, delete your account and request data erasure (subject to legal retention requirements), manage cookie and tracking preferences, control location permissions, and opt out of non-essential data collection where alternatives exist. For comprehensive information about your rights and how to exercise them, see the "Your Rights and Choices" section of our Privacy Policy.`
    },
    {
      id: 'information-sharing',
      title: 'How We Share Your Information',
      content: `Your privacy and trust are fundamental to our relationship. We value your trust deeply and recognize that sharing your personal information with third parties is a significant responsibility that must be handled with care, transparency, and strict limitations. We do not sell, rent, or trade your personal information to third parties for their marketing purposes—this is a firm commitment that distinguishes us from many online platforms.

However, providing our services does require sharing certain information in specific, limited circumstances. Whether it's connecting you with other users to facilitate bookings, working with service providers who help operate our platform, complying with legal obligations, or protecting platform security, every instance of information sharing serves a legitimate purpose and is governed by strict controls.

Understanding when, how, and why we share your information empowers you to make informed decisions about using our platform. Below is a comprehensive explanation of the circumstances under which we share data, the parties who receive it, the protections in place, and your control over these sharing practices.

1. With Other Users - Facilitating Connections and Collaborations
The core purpose of Amoria Connekyt is connecting clients who need creative services with photographers and videographers who can provide them. This fundamental function necessarily requires sharing certain information between users.

Client and photographer information is shared to facilitate bookings and project collaboration in controlled, purposeful ways. When a client searches for photographers or videographers, they see public profile information including the creator's name, professional photo, biography and service description, portfolio showcasing their work, service specialties and categories, location or service area, pricing information and packages, availability calendar, and aggregate reviews and ratings from previous clients. This public profile information is intentionally designed for discovery—it helps clients find creators whose style, expertise, and availability match their needs.

When a client initiates contact with a creator (sending an inquiry or booking request), additional information is exchanged to enable meaningful communication. The creator receives the client's name and contact information, project details and requirements the client provided, event date, location, and timing, budget or pricing expectations, and any special requests or preferences. Similarly, when creators respond to inquiries, clients receive the creator's contact information, detailed responses to their questions, customized quotes or proposals, and terms and conditions for services offered.

Once a booking is confirmed, both parties receive comprehensive information necessary for successful project execution. This includes full contact details (phone numbers, email addresses) for direct communication, final project specifications and deliverables agreed upon, payment terms and schedule, timeline for delivery of finished work, and any contracts or agreements established. This information sharing is essential—without it, creators couldn't understand client needs and clients couldn't communicate requirements or receive delivered work.

Profile information visibility is determined by user type and privacy settings. Creator profiles are intentionally public to enable client discovery—photographers and videographers want potential clients to find them. Client profiles are more restricted, typically visible only to creators they've interacted with. All users can adjust certain privacy settings to control what information is shared beyond minimum necessary details.

Reviews and ratings are shared publicly (associated with creator profiles) to provide transparency about service quality and help future clients make informed decisions. When you leave a review, your name and review content are publicly associated with the creator's profile. Reviews are valuable community resources that reward quality work and help clients avoid poor experiences.

2. Service Providers - Trusted Partners Supporting Platform Operations
Modern online platforms rely on specialized service providers who offer expertise, infrastructure, and capabilities that would be impractical to build internally. We share data with carefully selected, trusted third-party service providers who help us operate our platform securely and effectively.

Payment processors are essential partners handling all financial transactions. We share data with our licensed payment gateway partners (Pesapal, Flutterwave, JengaPay) to enable secure payment processing. Information shared includes billing addresses and payment method details for transaction processing and fraud prevention, transaction amounts and recipient information, customer names for payment verification, and transaction status and history. Importantly, these payment processors are PCI DSS Level 1 compliant—the highest security standard in the payment industry. They handle sensitive payment credentials (full credit card numbers, CVV codes) directly, and we never receive or store this highly sensitive information on our servers. Payment processors are bound by strict confidentiality agreements and regulatory obligations governing financial data.

Cloud hosting providers store and process platform data in secure, reliable infrastructure. We use reputable cloud infrastructure providers (often in EU, Kenya, or South Africa) to host our application and store user data. Information shared includes all platform data necessary for operation (user accounts, profiles, portfolios, messages, transaction records), though always encrypted and protected by access controls. Cloud providers are selected based on their security certifications (ISO 27001, SOC 2), data protection compliance (GDPR, Rwanda DPPL), physical and technical security measures, and geographic location in jurisdictions with strong legal protections. Cloud providers act as data processors under our instruction and are contractually prohibited from using our data for their own purposes.

Analytics services help us understand how users interact with our platform so we can identify problems, optimize user experience, and prioritize development efforts. We use services like Google Analytics to track usage patterns, popular features, user flows through the platform, performance metrics and loading times, and geographic distribution of users. Analytics data is typically aggregated and anonymized, meaning it shows overall trends rather than tracking specific individuals in detail. We configure analytics tools to respect privacy including IP anonymization, respecting Do Not Track signals where feasible, and providing opt-out mechanisms. You can opt out of analytics tracking through our cookie preference center or browser settings.

Email and communication tools enable platform notifications and customer support. We use email service providers and communication platforms to send booking confirmations and reminders, payment receipts and transaction notifications, support responses and account updates, security alerts and important notices, and with your consent, promotional communications about new features or offers. These providers receive information necessary for communication purposes (your email address, name, relevant transaction or account details) but are contractually prohibited from using your information for their own marketing or purposes beyond delivering our communications.

Identity verification partners assist with KYC (Know Your Customer) compliance. To verify identities and prevent fraud, we work with specialized verification services that authenticate government-issued identification documents, perform anti-money laundering (AML) checks, screen against sanctions lists and politically exposed persons (PEP) databases, and assess fraud risk. These partners receive identity documents and personal information submitted for verification but are bound by strict confidentiality agreements and data protection obligations. Verification partners are selected based on security credentials, regulatory compliance, and proven trustworthiness in handling sensitive identity information.

All service providers are carefully vetted before engagement and continuously monitored for compliance. Our vendor selection process includes reviewing security certifications and compliance (ISO 27001, SOC 2 Type II, GDPR compliance), assessing data protection policies and practices, evaluating technical security controls, checking history of breaches or security incidents, and verifying financial stability and operational reliability. We maintain contractual relationships requiring service providers to implement appropriate security measures, process data only according to our instructions, protect data confidentiality, notify us immediately of breaches or security incidents, cooperate with audits and compliance reviews, and return or delete data when services terminate.

3. Legal Requirements and Law Enforcement - Mandatory Disclosures
Despite our commitment to protecting your privacy, certain legal obligations may require us to disclose information to government authorities or in legal proceedings.

We may disclose information when required by law or valid legal process including court orders, subpoenas, warrants, or other legal demands from law enforcement agencies or courts; regulatory inquiries from government bodies with oversight authority; tax authority requests for financial transaction information; and legal obligations to report suspicious activities under Anti-Money Laundering and Counter-Terrorism Financing regulations.

When we receive legal demands for user information, we carefully review each request to ensure it's valid, properly authorized, and legally sufficient. We disclose only the specific information required by the legal demand, not broader access to user data. Where legally permissible, we notify affected users of legal demands for their data, giving them opportunity to challenge the request if they believe it's improper. However, some legal demands (like national security letters or sealed court orders) prohibit us from notifying users.

We may disclose information to protect our rights, property, or safety and that of our users and the public. This includes investigating, preventing, or taking action against suspected fraud, security threats, or illegal activities; enforcing our Terms of Service and protecting intellectual property rights; responding to emergencies involving immediate danger to persons or property; and defending against legal claims or litigation. These discretionary disclosures are made carefully and only when genuinely necessary to protect legitimate interests.

During legal proceedings, we may need to disclose information relevant to disputes, investigations, or litigation. If you're involved in a dispute with another user that escalates to mediation or legal action, we may share relevant communications, transaction records, or other evidence with mediators, arbitrators, or courts. If we're sued or face legal claims, we may disclose information necessary for our legal defense.

Compliance with Anti-Money Laundering and Counter-Terrorism Financing (AML/CTF) regulations requires reporting suspicious activities to relevant authorities. Under Rwanda's Law No. 69/2018 and international AML/CTF standards, we're required to report transactions or patterns that raise suspicion of money laundering, terrorism financing, fraud, or other financial crimes. These reports go to Rwanda's Financial Intelligence Centre (FIC), Rwanda Investigation Bureau (RIB), and potentially international financial crime authorities. Reported information includes transaction details, identity verification information, behavioral patterns that triggered suspicion, and any relevant communications or documentation.

4. Business Transfers - Mergers, Acquisitions, and Corporate Changes
In the event of significant corporate transactions affecting our business, user information may be transferred as part of the transaction assets.

In case of a merger, acquisition, or sale of assets, user information may be transferred to the acquiring entity or new owners. Business transactions might include sale of Amoria Connekyt or Amoria Global Tech Ltd. to another company, merger with another company, acquisition of substantially all our assets, bankruptcy or liquidation proceedings, or reorganization or restructuring. User data is a valuable business asset because it represents our user community and enables ongoing platform operations. Acquirers or new owners would need access to user data to continue providing services.

When business transfers occur, we take steps to protect user privacy including notifying users of the impending transfer and providing information about the acquiring entity, requiring acquirers to honor existing privacy commitments and comply with applicable data protection laws, giving users opportunity to delete accounts or request data deletion before the transfer (though this means losing access to services), and ensuring transferred data remains subject to privacy protections equivalent to those described in this policy. Changes in ownership don't give new owners carte blanche to use your data however they wish—they inherit our privacy obligations and commitments.

You'll be notified via email and platform notices if business transfers that affect your data are planned, giving you time to exercise your rights or discontinue use if you're uncomfortable with the new ownership.

5. With Your Explicit Consent - Voluntary Sharing
Beyond the sharing practices described above, we may share information with other third parties when you explicitly consent to such sharing for specific purposes.

Explicit consent scenarios include promotional partnerships where you agree to share information with partner brands or services for special offers or collaborations, research or surveys where you voluntarily participate and agree to share data with researchers, third-party integrations you choose to connect (like social media accounts, portfolio websites, or business tools), public contests or giveaways where participation requires sharing certain information, or other specific purposes where we clearly explain the sharing and obtain your agreement.

Consent is always informed (you understand what's being shared and why), specific (for defined purposes, not unlimited future use), and revocable (you can withdraw consent, though past sharing based on previous consent may not be retrievable). We never use buried consent in dense legal language—if we're asking for consent beyond standard platform operations, we'll be clear and explicit about it.

What We Never Do - Firm Commitments to Privacy
It's important to understand not just what we do with your data, but what we firmly commit never to do.

We never sell or rent personal information to third parties for their marketing purposes. Your email address, contact details, browsing behavior, and other personal information are not for sale to advertisers, data brokers, or marketers. Many "free" online services fund operations by selling user data—we don't. Our revenue comes from legitimate platform fees on transactions, not from commoditizing your privacy.

We never share your data with advertisers for behavioral targeting without your consent. While we may use first-party cookies and analytics to improve our own services, we don't share your individual data with third-party advertising networks unless you explicitly opt into marketing programs.

We never share sensitive information like complete payment credentials, full identity documents, or private communications beyond what's absolutely necessary for specified, legitimate purposes (payment processing, verification, support, legal compliance). Your most sensitive information receives the highest level of protection.

We never share your creative content (portfolio images, videos, client project work) with third parties for their purposes without your permission. Your intellectual property is yours, and we respect it.

Your Control Over Information Sharing:
While much information sharing is necessary for platform functionality, you retain significant control including adjusting privacy settings to control profile visibility, choosing whether to connect third-party integrations, opting out of non-essential sharing like marketing partnerships, deleting your account to terminate most ongoing sharing (subject to legal retention requirements), and reporting unauthorized sharing or privacy violations. For comprehensive information about your rights and how to exercise them, see the "Your Rights and Choices" section of our Privacy Policy or contact privacy@amoriaglobal.com.`
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: `Data security is not just a technical requirement—it's a fundamental trust commitment we make to every user of Amoria Connekyt. We implement comprehensive, multi-layered safeguards to protect your information from unauthorized access, alteration, disclosure, or destruction. Our security program combines industry-leading technical measures, rigorous operational procedures, continuous monitoring, and a culture of security awareness throughout our organization.

Protecting your personal information, financial data, creative content, and business communications requires constant vigilance and investment in security technologies, processes, and expertise. While no system can guarantee 100% security against all possible threats, we implement defenses designed to meet or exceed industry best practices and regulatory requirements. Our security approach is proactive, comprehensive, and continuously evolving to address emerging threats.

Understanding our security measures helps you make informed decisions about trusting us with your data and enables you to participate in platform security through your own responsible practices.

1. Technical Security Measures - Technological Defenses
Our technical security infrastructure employs multiple layers of protection to safeguard data at every stage—during transmission, while stored, and when processed.

Encrypted data transmission using SSL/TLS protocols protects information as it travels between your device and our servers. Every interaction with Amoria Connekyt—whether you're logging in, uploading portfolio images, sending messages, or making payments—occurs over encrypted connections using Transport Layer Security (TLS) with strong cipher suites. This encryption means that even if someone intercepts data during transmission (through network sniffing or man-in-the-middle attacks), they cannot read its contents without the encryption keys. We enforce HTTPS for all platform access, automatically redirecting any unencrypted HTTP requests to secure HTTPS connections. Modern TLS versions (1.2 and 1.3) with strong cryptographic algorithms ensure that encrypted transmissions resist current attack techniques.

Secure data storage with encryption at rest protects information stored on our servers and databases. All sensitive data—including personal information, financial records, identity documents, and private communications—is encrypted using AES-256 encryption before being written to storage systems. This means that even if someone gained unauthorized physical access to our servers or storage media, they couldn't read the data without the encryption keys, which are managed separately through secure key management systems. Different data categories may use different encryption keys, limiting the impact of any single key compromise. Encryption keys themselves are protected through hardware security modules (HSMs) or secure key management services that prevent unauthorized access.

Regular security audits and vulnerability assessments conducted by both internal security teams and independent third-party experts help identify and remediate vulnerabilities before they can be exploited. Our security audit program includes annual penetration testing by certified ethical hackers who attempt to breach our defenses and identify weaknesses, quarterly vulnerability scans using automated tools that check for known security flaws in software and configurations, code security reviews examining application source code for security vulnerabilities like SQL injection, cross-site scripting (XSS), or insecure authentication, infrastructure security assessments evaluating server configurations, network security, and cloud security posture, and compliance audits verifying adherence to security standards like ISO 27001, SOC 2, and payment card industry requirements.

Findings from security audits are prioritized based on severity and addressed promptly. Critical vulnerabilities are typically remediated within 24-48 hours, high-severity issues within one week, and moderate issues within 30 days. We maintain comprehensive documentation of all security assessments and remediation activities.

Firewall protection and intrusion detection systems provide perimeter security and real-time threat detection. Our network infrastructure employs multiple security layers including web application firewalls (WAF) protecting against common web attacks like SQL injection, cross-site scripting, and denial-of-service attacks; network firewalls restricting traffic to only authorized protocols and ports; intrusion detection systems (IDS) monitoring network traffic for suspicious patterns indicating attack attempts; and intrusion prevention systems (IPS) actively blocking detected threats in real-time.

These systems use both signature-based detection (identifying known attack patterns) and behavioral analysis (detecting anomalous activity that might indicate new attack types). Security logs from all systems are centralized, analyzed, and retained for forensic investigation and compliance purposes.

Database security measures protect the core repositories of user data through access controls limiting which applications and users can query databases, query monitoring and anomaly detection identifying suspicious database access patterns, database encryption at multiple levels (column, table, and full database encryption), SQL injection prevention through parameterized queries and input validation, and regular database backups stored securely in geographically distributed locations for disaster recovery.

Application security practices are integrated throughout our development lifecycle through secure coding standards followed by all developers, security training for engineering teams, automated security testing integrated into continuous integration/continuous deployment (CI/CD) pipelines, dependency scanning to identify vulnerabilities in third-party libraries and frameworks, and security review requirements for all code changes before production deployment.

2. Access Control - Limiting Who Can Access What
Even with strong technical defenses, data must be accessible to legitimate users and authorized personnel. Access control ensures that only the right people can access specific data for appropriate purposes.

Role-based access control (RBAC) limits employee and system access to data based on job function and necessity. Not all employees can access all data—access is granted according to the principle of least privilege, meaning individuals receive only the minimum access necessary to perform their job duties. Access roles are carefully defined including customer support representatives who can view account information and communications necessary for assisting users but not financial credentials or identity documents, developers who can access development and testing environments but have restricted access to production user data, security personnel who can access logs and security monitoring data but not personal user communications unless investigating incidents, financial auditors who can access transaction records for compliance but not user messages or portfolio content, and executives who have oversight access but are subject to the same security controls and audit logging as other employees.

Access permissions are reviewed quarterly to ensure they remain appropriate as job responsibilities change. When employees change roles or leave the company, access is immediately updated or revoked.

Multi-factor authentication (MFA) for administrative access ensures that even if passwords are compromised, unauthorized access is prevented. All employees, contractors, or partners with elevated access to platform systems must use MFA, typically combining something they know (password), something they have (authentication app on smartphone, hardware security key), and sometimes something they are (biometric authentication). Administrative access to critical systems requires additional verification including time-based one-time passwords (TOTP) from authenticator apps, hardware security keys (YubiKey, etc.) for highest-sensitivity systems, or biometric authentication for device access.

We strongly encourage all users to enable two-factor authentication on their accounts as well, providing this as an optional security enhancement for anyone concerned about account security.

Regular review of access privileges ensures that permissions remain appropriate and current. Our access review process includes quarterly audits of all user access permissions, immediate revocation of access for terminated employees or contractors, periodic recertification where managers confirm that their team members' access remains appropriate, and monitoring for dormant accounts that haven't been used in extended periods (potentially indicating compromised credentials or departing employees whose access wasn't properly revoked).

Immediate revocation of access for terminated employees is a critical security control. When an employee's relationship with Amoria Connekyt ends, all access is revoked within minutes through automated deprovisioning processes that disable authentication credentials, remove access permissions from all systems, log out active sessions, and retrieve company devices and credentials. This rapid revocation prevents disgruntled former employees from accessing or sabotaging systems.

3. Security Monitoring - Constant Vigilance
Proactive security monitoring enables rapid detection and response to threats before they can cause significant harm.

24/7 monitoring for suspicious activity means our Security Operations Center (SOC) continuously watches for signs of security incidents, attacks, or policy violations. Monitoring covers multiple dimensions including login attempts and authentication failures (detecting credential stuffing, brute force attacks, or account compromises), data access patterns (unusual queries, bulk downloads, or access to sensitive information), network traffic (spikes indicating DDoS attacks, unusual protocols, or data exfiltration attempts), system performance and availability (ensuring services remain operational and responsive), and application errors or crashes (which might indicate security issues or attacks).

Security monitoring leverages both automated systems and human analysts. Automated tools process vast amounts of log data, applying machine learning to identify patterns associated with attacks or security incidents. Human analysts investigate alerts, distinguish false positives from genuine threats, and coordinate responses to confirmed incidents.

Automated threat detection systems use machine learning and behavioral analysis to identify security threats that might not match known attack signatures. These systems learn normal patterns of platform usage and flag anomalies that could indicate attacks including unusual login locations or times (account compromise), rapid failed login attempts (credential attacks), bulk data access or downloads (data theft), suspicious transaction patterns (fraud), or application behavior suggesting exploitation attempts.

Automated systems generate alerts prioritized by severity. Critical alerts trigger immediate human investigation, while lower-severity alerts are queued for review during security rounds.

Regular backup procedures ensure that data can be recovered even in catastrophic scenarios like ransomware attacks, system failures, natural disasters affecting data centers, or accidental deletion. Our backup strategy includes frequent automated backups (hourly incremental backups, daily full backups), geographic distribution storing backups in multiple regions, encryption of all backup data, regular restoration testing verifying backups can actually be restored when needed, and retention policies maintaining backups for defined periods (typically 30-90 days) before secure deletion.

Backups are isolated from production systems, meaning that attackers who compromise production environments cannot easily access or delete backups. This isolation is critical for ransomware resilience—even if an attacker encrypts production data and demands ransom, we can restore from clean backups.

Incident response protocols define clear procedures for responding to security incidents, ensuring rapid, coordinated, and effective responses that minimize harm. Our incident response plan includes detection and alerting mechanisms triggering response workflows, initial triage assessing incident severity and impact, containment actions isolating affected systems to prevent incident spread, investigation and forensics determining how incidents occurred and what damage resulted, remediation eliminating vulnerabilities and restoring secure operation, notification procedures for affected users, regulatory authorities, and law enforcement when required, and post-incident review analyzing what happened and how to prevent recurrence.

Incident response teams include security specialists, engineering leads, legal counsel, communications professionals, and executive leadership. Team members participate in regular incident response drills to maintain readiness.

4. User Responsibilities - Your Role in Security
While we invest heavily in platform security, security is a shared responsibility. Users play a critical role in protecting their own accounts and data.

No system is 100% secure against all possible threats, particularly those arising from user actions. Even the strongest technical defenses can be undermined by weak passwords, phishing attacks, or careless behavior. Understanding your security responsibilities helps protect your account and data.

Users are responsible for maintaining strong, unique passwords that resist guessing and brute-force attacks. Strong passwords are at least 12 characters long (ideally 16+), combine uppercase and lowercase letters, numbers, and special characters, avoid dictionary words, personal information, or common patterns, and are unique to Amoria Connekyt (not reused from other websites or services). Weak passwords like "password123" or "YourName2024" can be cracked in seconds using automated tools. Password reuse is particularly dangerous—if you use the same password on multiple sites and one is breached, attackers can access all your accounts.

Consider using a reputable password manager to generate and store strong, unique passwords for all your online accounts. Password managers make security convenient by remembering passwords so you don't have to.

Keeping login credentials confidential means never sharing your password or account access with anyone, even trusted friends, family members, or colleagues. Shared credentials create security vulnerabilities (you can't know what others do with your account) and accountability problems (who was responsible for actions taken?). If you need to grant someone access to manage your account, use proper delegation features where available rather than sharing credentials.

Be alert for phishing attacks attempting to steal your credentials. Phishing typically involves fake emails, messages, or websites impersonating Amoria Connekyt to trick you into providing your password or other sensitive information. Warning signs include emails requesting login credentials or sensitive information, links to login pages with unusual URLs (not our official domain), urgent language creating pressure to act immediately without thinking, and poor grammar or formatting (though sophisticated phishing can be very convincing).

Never click links in suspicious emails—instead, navigate directly to our website by typing the address into your browser. Amoria Connekyt will never ask you to provide your password via email or unsolicited messages.

Reporting suspicious activity immediately enables us to investigate and respond before significant harm occurs. Report concerning signs including unauthorized login notifications or password reset requests you didn't initiate, unexpected changes to your account settings or profile, messages or bookings you didn't send or create, transactions you don't recognize, contacts from supposed "Amoria Connekyt support" requesting sensitive information, or any other activity suggesting your account has been compromised. Report security concerns to support@amoriaconnect.com with "Security Concern" in the subject line, including as much detail as possible about the suspicious activity.

Using secure internet connections protects your data during transmission. Avoid accessing your Amoria Connekyt account (especially for sensitive operations like payments) over public Wi-Fi networks in cafes, airports, hotels, or other public spaces. Public Wi-Fi is often unencrypted and vulnerable to eavesdropping. If you must use public Wi-Fi, consider using a reputable VPN (Virtual Private Network) service to encrypt your connection. Always ensure your home Wi-Fi is secured with strong encryption (WPA3 or at minimum WPA2) and a strong password.

5. Security Incident Response and Breach Notification
Despite our best efforts and strongest defenses, no organization can guarantee perfect security. If a data breach occurs affecting your personal information, we're committed to transparent, prompt communication and remediation.

In the event of a data breach, we will notify affected users within 72 hours as required by Rwanda's Data Protection and Privacy Law No. 058/2021 and GDPR (for EU users). Breach notification includes what happened (nature of the breach and how it occurred), what data was affected (types of information compromised), what we're doing about it (containment, investigation, and remediation steps), what steps you should take to protect yourself (password changes, monitoring for fraud, etc.), and how to contact us with questions or concerns (dedicated support for breach-related inquiries).

We'll also notify Rwanda's National Cyber Security Authority (NCSA), data protection authorities in other jurisdictions if required (like EU supervisory authorities for GDPR breaches), and law enforcement if criminal activity was involved. We cooperate fully with regulatory investigations and implement corrective measures to prevent recurrence.

Breach notification is not just legal compliance—it's an ethical obligation to empower you to protect yourself when your data may be at risk. Prompt notification enables you to take protective actions like changing passwords, monitoring financial accounts for fraud, or being alert for phishing attempts leveraging stolen data.

Our Commitment to Security Excellence:
Security is not a one-time project but an ongoing commitment requiring constant investment, vigilance, and evolution. We're committed to maintaining industry-leading security practices, regularly assessing and improving our defenses, staying ahead of emerging threats, investing in security technologies and expertise, fostering a security-conscious culture throughout our organization, and being transparent about our security practices and any incidents that occur. Your trust is our most valuable asset, and we protect it by protecting your data with the utmost care and rigor.`
    },
    {
      id: 'how-we-use',
      title: 'How We Use Your Information',
      content: `Understanding how we use your information is essential to trusting us with your data. Every piece of information we collect serves specific, legitimate purposes that directly benefit you, enable platform functionality, or fulfill legal obligations. We don't use your data arbitrarily, sell it to third parties, or process it in ways unrelated to providing and improving our services.

Our data usage is governed by principles of purpose limitation (using data only for specified purposes), necessity (processing only what's needed), and transparency (being clear about what we do). Below is a comprehensive explanation of how we use the collected information across different aspects of platform operation.

1. Service Delivery - Core Platform Functionality
The primary purpose of data collection is enabling the core services that bring you to Amoria Connekyt—connecting clients with creative professionals, facilitating bookings, and supporting successful project collaborations.

To create and manage user accounts and verify identities, we use the personal information you provide during registration. Your name, email address, and phone number establish your unique identity on the platform, enable account authentication, and provide communication channels. Account creation involves generating unique identifiers for your profile, setting up secure authentication credentials (password hashing with industry-standard algorithms), creating your user dashboard and interface, and establishing your account preferences and settings.

Identity verification through KYC processes uses the identification documents you submit to confirm you are who you claim to be. This verification protects everyone from fraud, impersonation, and financial crimes. For creators receiving payments, verification is mandatory and involves authenticating government-issued identification, verifying address information, checking against sanctions lists and watchlists, assessing fraud risk through specialized verification partners, and documenting verification for regulatory compliance.

To connect clients with verified photographers and facilitate communication, we use profile information, portfolios, location data, and service descriptions. Our matching algorithms consider multiple factors including geographic proximity (showing creators near clients or willing to travel to event locations), specialty alignment (matching wedding photographers with wedding clients, corporate videographers with business clients), pricing compatibility (showing creators within client budget ranges), availability on requested dates (filtering out creators already booked), portfolio style matching client aesthetic preferences, and review ratings indicating quality and reliability.

When matches are identified, we facilitate communication by providing messaging features for direct conversations, sharing contact information when bookings are confirmed, notifying both parties of inquiries, booking requests, and responses, and maintaining communication history for reference and dispute resolution.

To process bookings and schedule events, we use event information, calendars, and project specifications. Booking processing involves recording event details (date, time, location, type), documenting agreed services and deliverables, establishing pricing and payment terms, updating creator availability calendars to prevent double-booking, generating booking confirmations and contracts, and setting reminders and notifications for upcoming events.

2. Payment Processing - Financial Transactions and Security
Financial transactions require careful handling of payment information, identity data, and transaction records to ensure security, prevent fraud, and maintain compliance with financial regulations.

To process payments securely through trusted third-party providers (Pesapal, Flutterwave, JengaPay), we transmit necessary payment information including billing addresses, payment method details (tokenized for security), and transaction amounts. Payment processing involves initiating payment collection from clients, holding 50% of payment in secure escrow as part of our Hold & Release system, verifying payment success or failure, handling payment retries if initial attempts fail, and managing refunds when necessary according to our cancellation policies.

Security measures during payment processing include encrypting all financial data in transit using SSL/TLS, never storing complete credit card numbers or CVV codes on our servers, using tokenization where payment details are replaced with secure tokens, implementing fraud detection monitoring for suspicious transaction patterns, and complying with PCI DSS standards through our payment processor partners.

To issue payouts to photographers for completed work, we use verified bank account information, payment preferences, and transaction records. Payout processing involves calculating amounts due (project payments minus platform fees), aggregating earnings until minimum payout thresholds are reached, initiating transfers to creator bank accounts or payment methods, generating payout receipts and documentation, and maintaining payout history for financial tracking and tax reporting.

To maintain transaction records and receipts for accounting, tax compliance, and dispute resolution, we retain comprehensive financial data including full transaction details (amounts, dates, parties involved), payment method information (tokenized), booking and service details associated with transactions, platform fees and net amounts, refund or dispute information, and downloadable receipts and invoices.

Transaction records serve multiple purposes: providing you with documentation for expense tracking or tax filing, supporting dispute resolution with evidence of agreed terms and payments, enabling regulatory compliance with financial crime prevention laws (AML/CTF), and maintaining business financial records for accounting and auditing.

3. Platform Improvement - Enhancing User Experience
Continuous improvement of our platform depends on understanding how users interact with features, identifying problems, and developing solutions that address real needs.

To improve platform functionality, security, and performance, we analyze technical data, error logs, and system metrics. Functionality improvement involves identifying features that are confusing or difficult to use, discovering bugs or technical issues affecting user experience, understanding which features are most valuable to users, and prioritizing development efforts based on actual usage patterns.

Security improvement uses data about login patterns, access attempts, and suspicious activities to detect threats and vulnerabilities, identify potential security incidents early, improve fraud detection algorithms, and strengthen authentication and access controls.

Performance improvement analyzes page load times, server response speeds, bandwidth usage, and system resource consumption to optimize code and database queries, improve infrastructure scaling, reduce latency and loading times, and ensure platform remains responsive as user base grows.

To analyze user behavior and enhance user experience, we examine usage data, navigation patterns, and interaction metrics. User behavior analysis (conducted in aggregate and anonymized form wherever possible) reveals which features users find valuable and use frequently, where users encounter difficulties or abandon workflows, how different user segments (clients vs. creators, new users vs. experienced) interact with the platform, what search terms and filters users employ when finding creators, and which portfolio styles and pricing models attract the most bookings.

These insights inform user experience enhancements including simplifying complex workflows, improving search and discovery features, personalizing recommendations, designing more intuitive interfaces, and creating help content addressing common questions or confusion.

To develop new features based on user needs, we consider feature requests, usage patterns indicating unmet needs, and competitive analysis of what users might expect based on other platforms. New feature development involves identifying gaps in current platform capabilities, prioritizing features based on user demand and business value, designing features with user privacy and security built in from the start (privacy by design), testing features with user feedback before full release, and measuring adoption and satisfaction after launch.

4. Communication - Keeping You Informed and Supported
Effective communication ensures you stay informed about your bookings, account activities, platform updates, and receive support when needed.

To send service-related updates such as confirmations, reminders, or notifications, we use your email address, phone number, and in-app notification preferences. Essential service communications include booking confirmations when you book services or receive booking requests, payment receipts when transactions complete, event reminders before scheduled shoots or deliverables are due, delivery notifications when creators upload completed work, message notifications when you receive communications from other users, and security alerts about login attempts, password changes, or suspicious account activity.

These communications are essential to platform operation and cannot be opted out of while maintaining an active account—you need to know about your bookings, payments, and security events.

To provide customer support and respond to inquiries, we use your contact information, account details, and communication history. Support provision involves responding to questions about platform features, account management, or policies, troubleshooting technical issues you encounter, assisting with booking modifications or cancellations, mediating disputes between users when necessary, and investigating reports of policy violations or suspicious activity.

Support communications may occur through email, in-app messaging, or phone depending on the nature and urgency of the issue. We maintain support interaction history to provide continuity (so you don't have to repeat information with each contact) and improve support quality.

To send promotional materials (with your consent), we may use your email address and preferences to share information about new platform features or improvements, special promotional offers or discounts, success stories or case studies from the community, educational content about photography business, platform tips, or industry insights, and partner offers or collaborations that might interest you.

Promotional communications are optional—you can opt out at any time through unsubscribe links in emails or by adjusting preferences in your account settings. Opting out of promotional communications doesn't affect essential service notifications.

5. Legal Compliance - Meeting Regulatory Obligations
Operating a financial and technology platform involves significant legal and regulatory obligations requiring careful data handling and documentation.

To comply with legal obligations, resolve disputes, and enforce agreements, we use various types of data depending on the specific legal requirement. Legal compliance activities include honoring valid legal processes (court orders, subpoenas, regulatory inquiries) by providing requested information, reporting suspicious financial activities to authorities under AML/CTF regulations, maintaining transaction records for tax compliance and auditing purposes, documenting disputes and resolutions for potential legal proceedings, enforcing our Terms of Service and community guidelines against violators, and cooperating with law enforcement investigations into fraud, crimes, or policy violations.

To prevent fraud and maintain platform security, we use device information, IP addresses, usage patterns, and transaction data to detect and prevent fraudulent accounts, fake profiles, or identity theft, suspicious transaction patterns indicating money laundering or fraud, unauthorized access attempts or account compromises, payment fraud such as stolen credit cards or fraudulent chargebacks, and abuse of platform features or manipulation of reviews/ratings.

Fraud prevention is proactive and ongoing, using both automated detection systems and human review. When fraud is detected, we take appropriate action including warning users, suspending accounts, terminating access, withholding payments pending investigation, and reporting to authorities when legally required.

To respond to law enforcement requests when required by law, we carefully review each request for legal validity and provide only the information specifically required. Law enforcement cooperation involves responding to court orders, warrants, and subpoenas with appropriate legal authority, providing information to prevent imminent harm or danger to persons, complying with national security or terrorism prevention obligations, and assisting investigations into serious crimes while protecting user privacy to the fullest extent permitted by law.

We notify users of law enforcement requests where legally permissible, giving them opportunity to challenge requests they believe are improper. However, some legal demands prohibit notification.

Data Minimization and Purpose Limitation:
We use your data only for the purposes described above and related activities necessary to provide our services. We don't use your information for purposes unrelated to platform operation, we don't sell your data to third parties for their marketing, we don't track you across other websites for advertising purposes (beyond standard analytics), and we don't make automated decisions with significant legal effects without human review. If we identify new uses for data beyond what's described here, we'll update this policy and notify you, seeking additional consent where required by law.`
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      content: `Data retention is a delicate balance between providing you with continuous service, meeting legal obligations, and respecting your privacy rights. We retain personal information only as long as necessary to fulfill the purposes for which it was collected or as required by applicable law. We don't keep your data indefinitely "just in case"—we maintain documented retention schedules that specify how long different types of data are kept and ensure timely, secure deletion when retention is no longer justified.

Understanding our retention practices empowers you to know how long your information remains in our systems and what happens to it over time. Our retention policies comply with Rwanda's Data Protection and Privacy Law No. 058/2021, GDPR (for EU users), financial regulations, and industry best practices for data lifecycle management.

1. Active Account Data - Information While You Use Our Platform
While your account is active and you're using Amoria Connekyt, we retain all information necessary to provide our services effectively, maintain continuity of your experience, and support your ongoing needs.

Active account data includes everything that makes your account functional and valuable: profile information (name, bio, contact details, preferences), portfolio content for creators (images, videos, project samples), transaction history (all bookings and payments made or received), communications (messages with other users, support conversations), reviews and ratings (given and received), booking history and upcoming events, saved searches or bookmarks, account settings and customization preferences, and security information (login history, security settings, trusted devices).

This data remains readily accessible through your dashboard and account interfaces. You can view, update, modify, or in some cases delete this information at any time. Active retention serves clear purposes: enabling you to access your account and use platform features, maintaining context for ongoing conversations and bookings, preserving your professional reputation through portfolio and reviews, facilitating customer support with access to your history, and personalizing your experience based on preferences and past behavior.

Active account data is retained indefinitely as long as your account remains open and active. There's no expiration date on active accounts—whether you created your account yesterday or years ago, your data remains available as long as you want to use the platform. This indefinite retention during active use is necessary for providing continuous service and is expected by users who want their accounts to remain consistent over time.

2. Retention Periods for Different Data Types
When data is no longer actively needed or when accounts close, different types of information have different retention requirements based on legal obligations, business necessity, and the nature of the data.

Account information is retained while your account is active and for a defined period after account closure or extended inactivity. Upon account deletion or after prolonged inactivity (typically 2-3 years without login), basic account information may be deleted within 30 days, though some information must be retained longer for legal reasons. Account identifiers and minimal information may be retained in anonymized form to prevent re-registration fraud (users creating multiple accounts to abuse platform features or circumvent bans).

Transaction records and financial data are retained for 7 years from the transaction date to comply with tax laws and financial regulations in Rwanda and internationally. This extended retention is legally mandated, not optional—tax authorities, financial regulators, and auditors require access to transaction records for years after they occur. Retained financial data includes transaction amounts and dates, parties involved (payer and payee), booking and service details associated with payments, platform fees and net amounts, refund or chargeback information, and related invoices and receipts.

After 7 years, unless there's ongoing litigation or investigation requiring continued retention, financial records are securely deleted. This deletion is automatic based on transaction dates, ensuring we don't retain financial data longer than legally necessary.

Communication logs (messages between users, support conversations) are retained for 3 years to support dispute resolution, customer service continuity, and fraud investigation. Three years is sufficient for resolving most disputes, investigating fraudulent activities, providing support context if recurring issues arise, and maintaining evidence if legal proceedings occur (most civil litigation must be initiated within 3 years of events).

After 3 years, communication logs are typically deleted unless they're involved in ongoing disputes or investigations. Users can also delete their own message histories before this automatic deletion period if they choose, though deletions don't affect the other party's copy of conversations or our support records where necessary for dispute resolution.

Analytics data and usage metrics are aggregated and anonymized after 2 years, removing personal identifiers while retaining valuable platform insights. Raw analytics data (showing individual user interactions) is retained for up to 2 years to enable detailed analysis and pattern detection. After 2 years, this data is transformed into anonymized aggregate statistics (showing trends and patterns without identifying individuals) that can be retained indefinitely for long-term strategic planning and research.

Anonymization is irreversible—once personal identifiers are removed and data is aggregated, individual users can no longer be identified or re-identified from the statistical summaries.

Identity verification documents (KYC) are retained for 5 years following your last transaction to comply with Anti-Money Laundering and Counter-Terrorism Financing regulations under Rwanda's Law No. 69/2018. These regulations require financial service providers to maintain KYC records for specified periods after customer relationships end, enabling authorities to investigate suspicious activities even years after they occurred.

After 5 years (or longer if required for ongoing investigations), KYC documents are securely deleted including permanent deletion from active systems, removal from backup archives as backup cycles expire, and destruction of any physical copies if they exist.

3. Data Deletion - Secure Removal When Retention Ends
When data reaches the end of its retention period or when you request deletion, we don't simply mark it as deleted while leaving it accessible in systems—we implement secure deletion procedures that genuinely remove data.

When data is no longer needed based on retention schedules or user deletion requests, personal information is securely deleted through multiple processes. Active database deletion removes data from production databases where it's readily accessible and usable. Backup purging removes data from backup systems as backup rotation cycles naturally expire (typically within 30-90 days of active deletion). Log file cleanup removes personal identifiers from system logs and audit trails while retaining anonymized operational information. Cache clearing eliminates data from temporary storage, CDN caches, and other performance-optimization systems.

Secure deletion uses methods appropriate to the data sensitivity and storage media. For highly sensitive information like payment credentials or identity documents, cryptographic erasure (destroying encryption keys rendering encrypted data unreadable) or data overwriting (replacing data with random information multiple times) may be employed. For standard personal data, deletion from databases and automatic backup expiration is typically sufficient.

Data may be anonymized for statistical purposes rather than fully deleted when the anonymized form provides valuable platform insights without privacy risks. Anonymization transforms data so individuals cannot be identified either from the data itself or by combining it with other information. Properly anonymized data is no longer "personal data" under privacy laws and can be retained and used without privacy concerns.

Examples of anonymization include converting "User ID 12345 viewed 15 portfolios and booked 3 photographers in Kigali" to aggregate statistics like "Users in Kigali view an average of 12 portfolios before booking" or "Wedding photography bookings peak in November-December." Individual behaviors disappear into statistical patterns.

Backups are purged according to retention schedules and backup rotation policies. We maintain multiple backup generations (hourly, daily, weekly, monthly) for disaster recovery. Older backup generations are automatically deleted as new ones are created. If personal data is deleted from active systems, it persists in backups only until those backup generations expire. For example, if you delete your account on January 15th, your data remains in the January 15th daily backup, but when that backup expires (typically 30-90 days later), your data is removed from backups as well. We cannot selectively delete individual user data from backups without compromising backup integrity for everyone, which is why backup purging follows natural rotation cycles.

4. Legal Obligations and Extended Retention
While we aim to minimize data retention, certain legal, regulatory, or business obligations require retaining specific data longer than you might prefer.

We may retain certain data beyond standard retention periods when required by legal or regulatory requirements including tax laws requiring 7-year financial record retention, AML/CTF regulations requiring 5-year KYC documentation, regulatory investigations or audits where authorities request data preservation, court orders or legal holds requiring specific data retention, or other jurisdictional requirements applicable to our operations.

Ongoing legal proceedings may necessitate retaining data until litigation, arbitration, or investigations conclude. If you're involved in a dispute with another user, relevant communications, transaction records, and account information may be retained as evidence until the dispute is resolved (whether through settlement, arbitration, or court judgment). If we're subject to litigation, regulatory action, or criminal investigation, relevant data is preserved until proceedings conclude and appeals periods expire.

Legal holds take precedence over standard retention schedules. When legal counsel or compliance officers issue preservation notices, automated deletion is suspended for affected data until the hold is lifted.

Legitimate business needs may justify retention beyond standard periods in limited circumstances including resolving customer service issues that span multiple years, investigating complex fraud schemes involving historical data, fulfilling contractual obligations to partners or clients, or maintaining business records required for financial audits or insurance claims.

However, "business convenience" doesn't justify indefinite retention. Legitimate business needs must be documented, specific, and time-limited. We periodically review extended retention to ensure it remains justified.

5. Account Closure and User-Initiated Deletion
When you choose to close your account or request data deletion, we respect your decision while complying with legal retention requirements that prevent immediate total deletion of all information.

Upon account deletion requested by you, several things happen on different timelines. Immediate actions (within 24 hours) include account deactivation so you can no longer log in, profile removal from public view (other users can't find or view your profile), portfolio and public content removal from discovery and search, and termination of future communications (no more emails or notifications).

Personal information removal within 30 days includes deletion of contact information (email, phone), biographical information and preferences, private communications and messages, non-essential account details, and user-specific customization or settings.

Some information is retained for legal compliance despite account closure, specifically transaction records retained for 7 years for tax compliance, KYC documents retained for 5 years for AML/CTF compliance, data subject to legal holds or ongoing disputes, and minimal information preventing fraud (preventing banned users from immediately re-registering).

Anonymized data may be kept for analytics in forms where you cannot be identified. For example, "A wedding photographer in Kigali completed 47 bookings generating $12,500 in revenue" might become part of anonymized platform statistics as "Wedding photographers averaged 23 bookings and $6,200 revenue" without identifying you specifically.

When you request account deletion, we provide clear information about what will be deleted immediately, what must be retained and for how long, how to export your data before deletion if desired (using data portability rights), and confirmation when deletion is complete.

6. User Requests and Data Deletion Rights
You don't have to wait for automatic retention periods to expire—you can request data deletion at any time under your rights as a data subject, though deletions are subject to legal retention requirements that we cannot waive.

Users can request data deletion through account settings for most user-generated content (messages, portfolio images, bookings you created as a client, etc.) or by contacting privacy@amoriaglobal.com for comprehensive account deletion or specific data deletion requests. Deletion requests should specify what data you want deleted (entire account, specific information types, particular messages or content), why you're requesting deletion if it helps us process the request, and any specific concerns or circumstances we should consider.

We respond to deletion requests within 30 days as required by Rwanda's Data Protection and Privacy Law, explaining what has been deleted, what must be retained and why (citing specific legal requirements), how long retained data will be kept, and how to contact us with follow-up questions.

Legal retention requirements mean some data cannot be deleted immediately despite your request. We'll be transparent about these limitations, citing specific laws or regulations requiring retention and providing timelines for when retained data will eventually be deleted.

Our Commitment to Responsible Retention:
We retain your data only as long as genuinely necessary for legitimate purposes, not indefinitely out of convenience. We implement documented retention schedules ensuring systematic deletion when justification expires. We're transparent about retention periods and the reasons behind them. And we respect your deletion rights while honestly communicating legal limitations we cannot override. Data retention is a trust responsibility we take seriously, balancing service continuity, legal compliance, and your privacy interests.`
    },
    {
      id: 'user-rights',
      title: 'Your Rights and Choices',
      content: `At Amoria Connekyt, we believe that your personal data belongs to you—not to us. While we process your information to provide valuable services, you retain fundamental rights over how that data is collected, used, stored, and shared. These rights aren't merely legal formalities; they represent our commitment to treating you as a partner in your own data management rather than a passive subject of our data practices. We've designed our systems and processes to make exercising these rights as straightforward as possible.

Depending on your country or region, you may have specific legal rights under various data protection frameworks including Rwanda's Data Protection and Privacy Law, the European Union's General Data Protection Regulation (GDPR), California's Consumer Privacy Act (CCPA), and other regional privacy laws. Regardless of which specific laws apply to you, we extend comprehensive privacy rights to all users because we believe everyone deserves control over their personal information.

1. Access Rights - Understanding What We Know About You
You have the fundamental right to know what personal information we hold about you. This isn't just a legal requirement—it's a cornerstone of the transparent relationship we want to have with every user. When you request access to your data, you're not asking for a favor; you're exercising a right we genuinely want you to use.

Your access rights include the ability to view all personal data associated with your account or profile, including information you provided directly (name, email, preferences), information generated through your use of the platform (booking history, reviews, communications), information inferred or derived from your activity (usage patterns, interest profiles), and information received from third parties (payment verification, identity confirmation). You can also request a complete copy of your personal data in a structured, commonly used, and machine-readable format—this is your data portability right, allowing you to take your information elsewhere if you choose.

Beyond simply seeing your data, you have the right to understand how it has been processed. This means reviewing the history of how your data has been used, who has had access to it (including third-party integrations), what automated systems have processed it, and what decisions have been made based on it. We maintain detailed logs specifically to support this transparency.

When you submit an access request, we respond within 30 days as required by law, providing your information in a clear, organized format that actually makes sense rather than dumping raw database exports. If your request is complex or we need more time, we'll tell you why and provide an updated timeline. Access requests are free of charge for reasonable requests; excessive or repetitive requests may incur a reasonable administrative fee, but we'll inform you before processing such requests.

2. Correction Rights - Keeping Your Information Accurate
Accurate personal information benefits everyone. Incorrect data can lead to poor recommendations, failed communications, payment issues, or misrepresentation of your professional profile. You have the absolute right to ensure that any personal information we hold is accurate, complete, and up to date—and we have every incentive to help you maintain data quality.

Most corrections can be made directly by you through self-service options. Your account dashboard and profile settings allow you to update contact information, change preferences and settings, modify your biography and professional description, update portfolio content and service offerings, correct any user-generated content you've created, and adjust privacy and communication preferences. These changes take effect immediately without requiring our intervention.

For information you cannot modify directly, you can submit a correction request to our support team. This includes correcting transaction records where errors occurred, updating identity information that was incorrectly recorded during verification, fixing data received from third-party sources, and correcting historical information in system logs or archives where technically feasible. When you dispute the accuracy of specific data, we'll investigate promptly—and while the investigation is ongoing, we'll mark the disputed data to prevent it from being used for decisions until accuracy is confirmed.

We don't just correct data when you ask; we proactively notify relevant parties when corrections affect shared information. If incorrect data was shared with third parties, we'll inform them of corrections so they can update their records too.

3. Deletion Rights - The Right to Be Forgotten
Perhaps the most powerful right you have is the ability to have your personal data permanently erased. This "right to be forgotten" recognizes that you may want to remove your digital footprint from our platform—whether you're leaving the service, concerned about privacy, or simply prefer not to have certain information retained.

Upon receiving a verified deletion request, we take comprehensive action. Your personal data is removed from our active systems and databases, making it inaccessible for normal platform operations. We inform relevant third-party service providers with whom we've shared your data, requiring them to delete their copies as well. Your public profile, portfolio, and user-generated content are removed from public view. Marketing systems are updated to ensure you receive no further communications. And your data is queued for removal from backup systems as backup rotation cycles occur.

However, we must be transparent about limitations on deletion. Certain data cannot be deleted immediately due to legal requirements including transaction records retained for 7 years under tax regulations, KYC and identity verification documents retained for 5 years under anti-money laundering laws, data subject to active legal holds or ongoing disputes, and information required for fraud prevention or regulatory compliance. We'll clearly explain what can be deleted, what must be retained and why, and when retained data will eventually be removed.

The deletion process follows a structured timeline. Within 24 hours of request verification, your account is deactivated and removed from public view. Within 30 days, deletable personal information is removed from active systems. Within 30-90 days, data is purged from backup systems as rotation cycles complete. At the end of legal retention periods, legally required data is finally deleted.

4. Objection Rights - Saying No to Specific Processing
You have the right to object to certain types of data processing, even when we have legal grounds to perform that processing. Objection rights give you veto power over uses of your data that you find uncomfortable, unnecessary, or intrusive—regardless of whether those uses are technically permitted.

You can object to marketing and promotional processing at any time without providing any reason. This includes refusing personalized marketing based on your profile or behavior, opting out of targeted advertising and promotional communications, blocking your data from being used for marketing analytics, and preventing your information from being shared with marketing partners. Marketing objections are absolute—we stop immediately with no exceptions.

You can object to automated decision-making and profiling, particularly when automated processes significantly affect you. This includes requesting human review of any algorithmic decisions (such as account verification, fraud detection, or matching algorithms), understanding the logic behind automated decisions, challenging decisions you believe are unfair or inaccurate, and opting out of profiling for purposes beyond core service delivery.

You can object to legitimate interest processing where we process data based on our business interests rather than your explicit consent. When you object, we must either demonstrate compelling legitimate grounds that override your interests, or stop the processing. Common objection scenarios include analytics and research using your data, platform improvement studies, aggregate reporting that includes your information, and new feature testing using historical data.

When you submit an objection, we respond promptly—typically within 30 days. If we believe we have compelling grounds to continue processing despite your objection, we'll explain our reasoning and give you the opportunity to escalate to regulatory authorities if you disagree.

5. Restriction Rights - Pausing Data Processing
Sometimes you don't want your data deleted, but you do want us to stop using it—at least temporarily. Restriction rights allow you to "freeze" your data, keeping it stored but preventing active processing while issues are resolved or decisions are made.

Restriction is appropriate in several scenarios. When you contest data accuracy, restriction protects you while we verify whether information is correct. If processing is unlawful but you prefer restriction over deletion (perhaps because you need the data for legal claims), restriction preserves your options. When we no longer need data but you require it for legal purposes, restriction keeps it available for you. And when you've objected to processing and we're evaluating your objection, restriction maintains the status quo during review.

During restriction, your data remains securely stored but is not used for any active processing. It won't influence recommendations, won't be included in analytics, won't be shared with third parties, and won't be used for any decisions. The only exceptions are storage itself, processing with your explicit consent, processing for legal claims, processing to protect others' rights, and processing for important public interest reasons.

Restriction can be lifted when the issue that triggered it is resolved—for example, when disputed data is verified as accurate, when your objection is processed, or when you request lifting the restriction. We'll inform you before lifting any restriction so you can take further action if needed.

6. How to Exercise Your Rights - Making It Easy
We've designed multiple channels for exercising your rights, recognizing that different users prefer different approaches. Self-service through your account settings handles most routine requests instantly. You can access and download your data, modify profile information, adjust privacy settings, manage communication preferences, and initiate account deletion directly through your dashboard.

For requests requiring our involvement, you can contact us at privacy@amoriaglobal.com with your specific request. When submitting requests, please include your account email or username, the specific right you're exercising, details about what data or processing you're addressing, any relevant context that helps us understand your request, and your preferred response format if you have one.

We respond to all rights requests within 30 days, though complex requests may require extensions (which we'll communicate promptly). We verify your identity before processing requests to protect against unauthorized access to your data—this typically involves confirming your email or, for sensitive requests, additional verification steps.

Our Commitment to Your Data Rights:
Your rights aren't obstacles to our business—they're expressions of the respectful relationship we want to have with you. We've invested in systems, processes, and training specifically to make rights exercise easy and effective. When you have questions about your rights or encounter difficulties exercising them, our privacy team is ready to help. And if you're ever unsatisfied with how we handle your rights, you have the additional right to lodge complaints with data protection authorities in your jurisdiction.`
    },
    {
      id: 'cookies-tracking',
      title: 'Cookies and Tracking',
      content: `At Amoria Connekyt, we use cookies and similar tracking technologies as essential tools for delivering a seamless, secure, and personalized experience on our platform. These small but powerful technologies work behind the scenes to remember your preferences, keep you logged in, analyze how our platform performs, and help us understand what features matter most to our users. We believe in complete transparency about these technologies—what they are, why we use them, how they benefit you, and most importantly, how you can control them.

Cookies and tracking technologies are often misunderstood or viewed with suspicion, but when used responsibly and transparently, they're fundamental to modern web experiences. Without them, every page visit would feel like your first—you'd need to log in repeatedly, reconfigure settings constantly, and lose the personalized experience that makes platforms genuinely useful. Our approach is to use these technologies only where they provide genuine value to you or are necessary for platform operation, never for invasive surveillance or purposes that don't benefit our users.

1. What Are Cookies - Understanding the Technology
Cookies are small text files or data fragments that are placed on your computer, tablet, or mobile device when you visit a website or use an online service. Despite their technical nature, they serve a simple purpose: helping websites remember information about your visit so they can provide better, more personalized experiences. They contain information such as your browser type, session identifiers, user preferences, interaction history, and authentication tokens that verify your identity.

Think of cookies as digital memory—they allow the platform to recognize your device, remember your login sessions, and deliver a seamless experience across visits. For example, when you log into Amoria Connekyt and return later to find yourself still signed in, that's cookies at work. When the platform remembers your preferred language, display settings, or the photographers you've favorited, cookies enable that continuity. When pages load quickly because cached preferences are already known, cookies improve that performance.

Beyond traditional cookies, we employ similar tracking technologies that serve related purposes. Web beacons (also called tracking pixels) are tiny, invisible images embedded in pages or emails that help us understand whether content was viewed and how users navigate our platform. Local storage and session storage are browser-based data stores that can hold larger amounts of information than cookies, useful for complex preferences or temporary data during your session. Device fingerprinting techniques may be used for fraud prevention, creating unique identifiers based on device characteristics to detect suspicious activity. These technologies work together to create the modern web experience you expect.

2. Types of Cookies We Use - Purpose-Driven Categories
To make your experience efficient, secure, and personalized, Amoria Connekyt uses different categories of cookies, each serving a distinct and documented purpose. Understanding these categories helps you make informed decisions about which to accept and which to decline.

• Essential Cookies - The Foundation of Platform Functionality

These cookies are fundamental to the operation of our platform—without them, Amoria Connekyt simply wouldn't work properly. They're not optional extras or conveniences; they're the technical backbone that enables core features like account login, payment processing, navigation, and security protections. Essential cookies enable secure access to user accounts by maintaining authentication state so you don't need to log in on every page. They prevent fraudulent activity by tracking suspicious patterns and validating legitimate sessions. They ensure platform sessions remain stable and safe during use by managing server connections and load balancing. They enable shopping cart functionality for booking services and completing purchases. They remember form data during multi-step processes so you don't lose progress. And they enforce security policies like CSRF protection that prevent malicious attacks.

Because these cookies are necessary for basic platform operation, they cannot be disabled without breaking core functionality. However, we minimize their scope to only what's genuinely required, and they contain no personally identifying information beyond what's necessary for session management.

• Analytics Cookies - Understanding Platform Performance

Analytics cookies collect data about how users interact with the platform—such as pages visited, features used, session duration, navigation paths, error encounters, and performance metrics. This information helps us understand what's working well and what needs improvement, enabling data-driven decisions about platform development.

The data collected through analytics cookies is aggregated and anonymized wherever possible, meaning we see patterns and trends rather than individual behaviors. We learn that "40% of users visit the photographer search page before booking" rather than "User John Smith searched for wedding photographers on Tuesday." This aggregate understanding helps us analyze platform performance and identify bottlenecks, detect and diagnose technical issues before they affect many users, understand which features users value most (so we can invest in improving them), identify confusing user flows that need redesign, measure the success of new features or changes, and plan infrastructure capacity based on usage patterns.

We use analytics tools like Google Analytics, which set their own cookies subject to Google's privacy policies. We've configured these tools to anonymize IP addresses and minimize data collection while still providing valuable insights.

• Preference Cookies - Personalizing Your Experience

Preference cookies remember choices you make during your visits, enabling the platform to provide a customized experience tailored to your needs. They store information like your selected language and region, display settings (dark mode, layout preferences, thumbnail sizes), login preferences (remember me options, preferred authentication methods), search preferences and filters you commonly use, notification settings and communication preferences, accessibility options you've configured, and recently viewed content for quick access.

By storing these preferences, the platform automatically adjusts your interface and personalizes your experience each time you return, eliminating the need to reconfigure settings repeatedly. Preference cookies make the platform feel like "yours"—configured the way you like it rather than generic and impersonal. These cookies typically persist for extended periods (months to years) so your preferences remain stable across sessions.

• Marketing Cookies - Relevant Content and Advertising

Marketing cookies are used to deliver relevant advertisements and promotional content based on your interests and prior interactions with our platform. They help ensure that when you see Amoria Connekyt-related content—whether on our platform or elsewhere—it's relevant to your interests rather than random and irrelevant.

These cookies enable us and our advertising partners to show you offers aligned with your demonstrated interests (photography styles you've browsed, event types you've searched for, price ranges you've explored), measure the effectiveness of promotional campaigns so we can invest in marketing that actually helps users find what they need, limit how often you see the same advertisement (frequency capping), understand the customer journey from first seeing an ad to completing a booking, and provide photographers and creative professionals with aggregated insights about their audience reach.

Marketing cookies are entirely optional—you have complete control over whether to accept them. Declining marketing cookies means you may see less relevant advertisements, but it won't affect core platform functionality. We respect this choice absolutely and never penalize users who prefer not to be tracked for marketing purposes.

3. Third-Party Cookies - Our Trusted Partners
In addition to our own first-party cookies, Amoria Connekyt integrates trusted third-party services that may set their own cookies on your device for their respective purposes. These partnerships enable capabilities we couldn't provide alone and are essential for a full-featured platform experience.

Google Analytics provides comprehensive website analytics, helping us understand traffic patterns, user behavior, and platform performance. Google's cookies enable detailed reporting on page views, session duration, user flow, and technical performance metrics. These cookies are governed by Google's privacy policy, and we've implemented privacy-protective configurations including IP anonymization.

Payment processors such as Stripe, PayPal, and local payment providers set cookies necessary for secure financial transactions. These cookies enable fraud detection (identifying suspicious payment patterns), session management during checkout flows, compliance with payment card industry (PCI) security standards, and remembering payment preferences for returning users. Payment processor cookies are essential for completing transactions securely and cannot be disabled without breaking payment functionality.

Social media platforms including Facebook, Instagram, LinkedIn, and others may set cookies when you use social features on our platform. These enable sharing content directly from Amoria Connekyt to your social accounts, authenticating logins through social sign-in options, displaying social proof like follower counts or shared content, and enabling social plugins that enhance connectivity. Social media cookies are governed by each platform's respective privacy policies.

Advertising partners help us deliver and measure marketing campaigns. These partners may set cookies for ad targeting based on browsing behavior, campaign performance measurement, conversion tracking (understanding which ads led to bookings), and cross-site advertising coordination. All advertising partners are vetted for compliance with privacy regulations and our own standards.

We carefully select third-party partners based on their privacy practices, security standards, and regulatory compliance. All third-party integrations undergo review, and we maintain contractual requirements for data protection. However, third-party cookies are ultimately governed by their providers' policies, which we encourage you to review.

4. Managing Cookies - Your Control Options
You have full control over how cookies are used on your device, and we provide multiple ways to exercise that control. We believe informed consent means giving you genuine choices, not just legal checkboxes.

Browser settings provide the most comprehensive cookie control. Most modern browsers (Chrome, Firefox, Safari, Edge) allow you to view all cookies stored on your device, delete specific cookies or clear all cookies at once, block all cookies (though this breaks many websites), block only third-party cookies (allowing first-party cookies from sites you visit directly), set exceptions for specific websites, and enable "private browsing" or "incognito" mode that doesn't retain cookies after sessions end.

To access cookie settings, look for "Privacy," "Security," or "Cookies" options in your browser's settings menu. Each browser handles this slightly differently, but all major browsers provide these controls.

Our cookie preference center (when enabled on the platform) provides granular control specifically for Amoria Connekyt cookies. Through this interface, you can accept or decline specific cookie categories, change your preferences at any time, see exactly what cookies are active, and understand the purpose of each cookie category before deciding.

Third-party opt-out tools are provided by advertising networks and analytics platforms. The Digital Advertising Alliance (DAA) offers opt-out tools at aboutads.info. The Network Advertising Initiative (NAI) provides options at networkadvertising.org. Google provides specific opt-out mechanisms for its advertising and analytics services. European users can use the EDAA's YourOnlineChoices.eu tool.

Important considerations when managing cookies: Disabling essential cookies will break core platform functionality—you won't be able to log in, complete purchases, or use many features. Disabling analytics cookies means we have less insight into platform problems you might experience, potentially slowing our ability to fix issues. Disabling preference cookies means you'll need to reconfigure settings on each visit. Disabling marketing cookies won't reduce the number of ads you see—just their relevance to your interests.

5. Do Not Track - Respecting Browser Signals
Amoria Connekyt respects Do Not Track (DNT) browser signals where technically feasible. Do Not Track is a browser setting that sends a signal to websites requesting that they not track your browsing activity. When your browser sends a DNT request, we make every reasonable effort to honor that preference.

When we detect a DNT signal, we disable non-essential tracking cookies, exclude your activity from marketing analytics, prevent advertising partners from setting targeting cookies, and limit data collection to what's strictly necessary for platform operation.

However, we must be transparent about limitations. DNT is not a legally mandated standard, and there's no universal definition of what "honoring DNT" means. Some third-party services integrated into our platform may have their own DNT policies that differ from ours. Essential cookies and tracking necessary for security, fraud prevention, and basic functionality continue regardless of DNT signals.

If privacy is a priority, we recommend combining DNT with other measures: using browser privacy settings, installing privacy-focused browser extensions, regularly clearing cookies, and reviewing our cookie preference center to customize your experience.

6. Cookie Duration - How Long They Last
Cookies on Amoria Connekyt have varying lifespans depending on their purpose, ranging from minutes to years. Understanding cookie duration helps you know how long your browsing data persists.

Session cookies are temporary cookies that exist only during your active browsing session. They're stored in temporary memory and are automatically deleted when you close your browser. Session cookies handle short-term needs like maintaining your login state while browsing, keeping items in your cart during a shopping session, managing multi-step processes (like checkout flows), and storing temporary preferences during a single visit. Because session cookies disappear when you close your browser, they pose minimal long-term privacy implications.

Persistent cookies remain stored on your device for a defined period or until you manually delete them. They survive browser closures and computer restarts, enabling continuity across sessions. Persistent cookie durations vary by purpose. Authentication cookies that enable "remember me" functionality typically last 30 days to 1 year. Preference cookies storing your settings typically last 1 to 2 years. Analytics cookies tracking usage patterns typically last 6 months to 2 years. Marketing cookies for advertising purposes typically last 30 days to 1 year.

Persistent cookies may be refreshed each time you revisit the platform, extending their expiration date to maintain your personalized experience. For example, a preference cookie set to expire in one year might be renewed to another year each time you visit, ensuring your settings persist as long as you remain an active user.

You can view cookie expiration dates in your browser's cookie management interface and delete persistent cookies at any time if you prefer not to be remembered across sessions.

7. Updates - Evolving Our Cookie Practices
Our cookie usage practices evolve as we introduce new features, adopt new technologies, respond to regulatory changes, and improve our platform. We're committed to keeping you informed about significant changes that affect how your data is collected and used.

When significant updates occur, we notify users through multiple channels. Platform banners alert you when visiting the site about cookie policy changes. Updated policy links direct you to review changes in detail. Email communications inform registered users of material changes. In-app notifications highlight changes within the platform interface. And our cookie preference center is updated to reflect new cookie categories or purposes.

Changes that trigger notifications include adding new cookie categories or purposes, integrating new third-party services that set cookies, modifying consent processes or user controls, changing cookie durations significantly, and responding to new privacy regulations affecting cookie use.

We encourage all users to periodically review this Cookie Policy to stay informed about how tracking technologies are used on Amoria Connekyt. Policy review is especially important after receiving change notifications, if you have concerns about new features or integrations, when privacy regulations in your region change, or if you're reconsidering your cookie preferences.

Our Commitment to Transparent Tracking:
Cookies and tracking technologies are tools—and like all tools, their impact depends on how they're used. We're committed to using these technologies responsibly, transparently, and always with your interests in mind. We minimize tracking to what genuinely improves your experience or is necessary for platform operation. We're transparent about what we track, why, and how long data persists. We provide meaningful controls so you can make informed choices. We respect your preferences, including browser signals like Do Not Track. And we continuously evaluate our practices against evolving privacy standards and user expectations. Your trust matters more than any data point we could collect.`
    },
    {
      id: 'third-party-links',
      title: 'Third-Party Links',
      content: `Amoria Connekyt exists within a broader digital ecosystem—we're not an isolated platform but rather a connected hub that integrates with payment processors, social media networks, creative tools, and the personal websites of our photographer community. This interconnectedness enables powerful capabilities: seamless payments, social sharing, portfolio showcasing, and access to specialized tools that enhance the creative professional experience. However, it also means that your journey on Amoria Connekyt may lead you to external destinations where different rules, policies, and privacy practices apply.

We believe in transparency about these connections. When you click a link that takes you outside Amoria Connekyt—whether to a photographer's personal portfolio, a payment processor's checkout page, or a social media platform—you're entering territory we don't control. This section explains what external connections exist, why they're valuable, what risks they may present, and how you can protect yourself while enjoying the benefits of our connected platform.

1. External Websites - Understanding the Connections
Our platform features or redirects users to external sites across several categories, each serving distinct purposes in enhancing your Amoria Connekyt experience.

Photographer personal websites and portfolios represent one of the most common external link categories. Creative professionals on our platform often maintain independent websites showcasing their complete body of work, detailed service offerings, client testimonials, and booking systems. These personal sites may offer content not available on Amoria Connekyt—behind-the-scenes content, blog posts about their creative process, expanded galleries, or direct booking options. When you visit a photographer's external portfolio, you're accessing content they've created and hosted independently, subject to their own terms and privacy practices.

Social media profiles and pages connect you with photographers' broader online presence. Many creative professionals maintain active Instagram accounts, Facebook pages, Pinterest boards, YouTube channels, or TikTok profiles where they share work, engage with followers, and build their brand. Links to these profiles help you evaluate photographers' style, engagement with their community, and recent work before making booking decisions. However, each social platform has its own data collection practices that apply once you visit.

Payment processor sites handle the financial aspects of transactions on our platform. When you complete a booking or purchase services, you may be redirected to secure payment pages operated by processors like Stripe, PayPal, Flutterwave, or local payment providers. These redirects are necessary for PCI-compliant payment processing—keeping sensitive financial data on specialized, highly-secured systems rather than our own servers. Payment processors have their own privacy policies and security measures, typically among the most stringent in the technology industry.

Partner platforms and services extend Amoria Connekyt's capabilities through integrations. These may include AI-based photo editing tools that enhance images, print-on-demand services for physical products, calendar and scheduling integrations for booking management, cloud storage providers for portfolio hosting, email marketing platforms for client communication, and specialized creative software with partnership arrangements. Each partner operates independently with their own policies governing your use of their services.

Educational and resource links may direct you to photography tutorials, industry publications, equipment reviews, or professional development resources. While we curate these links to provide value, the content is created and maintained by external parties whose views and practices may differ from ours.

These links are provided for convenience and user experience enhancement. However, their inclusion does not imply endorsement, monitoring, or control by Amoria Connekyt. A link's presence on our platform means we've identified potential value for users, not that we've audited or approved every aspect of the destination.

2. No Responsibility - Understanding the Boundaries
While we strive to connect you only with trusted and reputable partners and to remove obviously problematic links when identified, Amoria Connekyt cannot and does not assume responsibility for external websites or services. This isn't a legal technicality designed to avoid accountability—it reflects the genuine reality that we have no control over external sites and cannot guarantee their behavior.

Our responsibility boundaries include the following areas. Privacy practices of external sites are beyond our control. When you leave Amoria Connekyt, you enter environments governed by different privacy policies. External sites may collect more data than we do, share information with additional third parties, use tracking technologies we don't employ, or have weaker data protection standards. We cannot audit every external site's privacy practices or ensure they meet our standards.

Content accuracy, relevance, and reliability on linked pages cannot be guaranteed. Photographer portfolios may contain outdated information, pricing that's changed, or work samples that don't represent current capabilities. Partner sites may modify their offerings, terms, or availability without notifying us. Resource links may become outdated as industries evolve. We don't continuously monitor external content for accuracy.

Security and stability of third-party platforms varies widely. While we partner with reputable payment processors and established platforms, we cannot guarantee that any external site is free from security vulnerabilities, data breaches, or operational issues. External sites may experience downtime, be compromised by attackers, or suffer data loss—events outside our knowledge or control.

Terms, conditions, and policies governing external services are created and enforced by those services, not by us. When you use an external platform, you're agreeing to their terms, which may include provisions about intellectual property, dispute resolution, liability limitations, or data usage that differ significantly from Amoria Connekyt's policies.

By following a link to an external website, you acknowledge that Amoria Connekyt has no control over how those sites operate, collect data, present information, or interact with you. This acknowledgment isn't about shifting blame—it's about ensuring you understand the reality of internet interconnection and can make informed decisions about which links to follow.

3. User Discretion - Protecting Yourself Online
We encourage all users to exercise caution and good judgment when engaging with third-party websites or services. The internet offers tremendous opportunities but also presents risks that require personal vigilance. Your online safety is ultimately in your hands, and we want to equip you with the knowledge to protect yourself.

Before visiting external links, consider several protective practices. Review their privacy policy to understand how your personal data will be handled. Look for clear explanations of what data is collected, how it's used, who it's shared with, and how long it's retained. Privacy policies that are hidden, vague, or excessively complicated may indicate concerning practices.

Read their terms and conditions to know your rights and responsibilities. Pay particular attention to sections about intellectual property (especially important for photographers sharing work), dispute resolution processes, liability limitations, and cancellation or refund policies. Understanding terms before engaging prevents surprises later.

Be mindful of personal information you share. Avoid providing sensitive data—financial information, identity documents, detailed personal history—unless you trust the platform's security and have verified you're on the legitimate site (not a phishing imitation). Legitimate services rarely ask for unnecessary personal information.

Ensure secure connections by checking for "https://" in the URL and a padlock symbol in your browser's address bar. These indicators confirm encrypted connections that protect data in transit. Be especially cautious on sites lacking these security indicators, particularly when entering any personal information.

Verify you're on legitimate sites, especially for financial transactions. Phishing attacks often create convincing imitations of legitimate payment processors or popular websites. Double-check URLs, look for subtle misspellings, and when in doubt, navigate directly to known legitimate addresses rather than clicking links.

Be skeptical of requests that seem unusual. If an external site asks for information that seems unrelated to its purpose, requests payment through unusual methods, or pressures you to act quickly, these may be warning signs of scams or compromised sites.

Amoria Connekyt cannot guarantee that third-party links are free from malicious or misleading content. While we remove problematic links when identified and investigate reports promptly, the dynamic nature of the internet means new threats emerge constantly. Your vigilance is key to maintaining online safety.

4. Social Media Integration - Connected but Independent
Amoria Connekyt integrates with major social media platforms to provide users with enhanced connectivity, simplified access, and seamless content sharing. These integrations make our platform more convenient and help creative professionals extend their reach, but they also create connections to platforms with their own extensive data practices.

Profile authentication through social login allows users to sign in or create accounts using existing social media credentials from platforms like Google, Facebook, Apple, or LinkedIn. This integration offers several benefits: no need to create and remember another password, faster account creation, automatic profile information population, and verified email addresses. However, social login also creates data flows between Amoria Connekyt and the authentication provider. When you use social login, the provider may receive information about your Amoria Connekyt activity, and we may receive profile information from the provider. The exact data exchanged depends on permissions you grant during the login process.

Content sharing enables users to share photos, portfolio updates, booking announcements, or achievements directly on platforms such as Instagram, Facebook, LinkedIn, Twitter, or Pinterest. Sharing integrations help photographers promote their work, celebrate milestones, and engage their audiences across platforms. When you share content, you're interacting directly with social platforms, which may track this activity, associate it with your social profile, and use it for their own purposes (advertising targeting, content recommendations, engagement metrics).

Social media embeds may display Instagram feeds, Facebook pages, or other social content directly within Amoria Connekyt profiles or pages. These embeds provide rich, dynamic content but also allow social platforms to track your presence on our site—even if you don't interact with the embedded content. Social platforms may use this tracking to build profiles of your browsing behavior across the web.

Social proof features may display follower counts, engagement metrics, or social endorsements to help users evaluate photographers. This information comes from social platforms and is subject to their accuracy and availability.

While these integrations make using our platform more convenient and powerful, your use of social features is subject to the privacy policies and data practices of the respective social media platforms. These platforms—Facebook/Meta, Google, Apple, LinkedIn, Twitter, and others—have extensive data collection practices that may include information about your use of Amoria Connekyt when you use connected features.

We recommend reviewing social platform privacy policies carefully to understand how your data may be processed outside Amoria Connekyt's environment. You can often limit data sharing through privacy settings on both our platform and the social platforms themselves. Consider whether the convenience of social features outweighs privacy trade-offs for your personal situation.

5. Photographer External Content - User-Generated Links
Photographers and creative professionals on Amoria Connekyt frequently share external links to showcase additional content beyond what's hosted on our platform. This user-generated linking is a fundamental feature that enables creative professionals to present their complete professional presence, but it also means we host links to content we haven't created, reviewed, or approved.

Common external content shared by photographers includes personal websites featuring expanded portfolios, detailed service information, and direct booking capabilities that may differ from Amoria Connekyt's systems. Third-party gallery platforms like SmugMug, Pixieset, or 500px where photographers host client galleries or display additional work. Video hosting platforms like YouTube or Vimeo where photographers share behind-the-scenes content, tutorials, or cinematic work. Cloud storage links to downloadable resources, contracts, or sample deliverables. Blog posts and articles showcasing their expertise, creative process, or industry insights. Review platforms where clients have left testimonials or ratings.

These links are entirely under the photographer's control and are shared at their discretion. Amoria Connekyt does not pre-screen, monitor, verify, or endorse the accuracy, legality, quality, or appropriateness of external content linked by users. We cannot guarantee that photographer-shared links are safe, accurate, professional, or consistent with how photographers present themselves on our platform.

Photographers are responsible for the links they share. Our community guidelines require that shared links be relevant to their professional services, free from malicious content or security threats, compliant with applicable laws, and not misleading about their services or capabilities. Violation of these requirements may result in link removal, account warnings, or suspension.

If you choose to access a photographer's external portfolio or linked content, you do so at your own discretion and assume responsibility for any interactions that occur on those external platforms. We recommend applying the same caution you'd use for any unfamiliar website: verify security indicators, review privacy policies, and be thoughtful about information you share.

6. Reporting Concerns - Community-Powered Safety
The safety and trust of our community are top priorities, and maintaining a safe linking environment requires partnership between Amoria Connekyt and our users. We cannot monitor every external link in real-time, but we can respond quickly and effectively when our community identifies problems.

If you encounter inappropriate, misleading, or suspicious external links while browsing Amoria Connekyt—whether posted by photographers, embedded in content, appearing within messages, or found anywhere else on the platform—please report them immediately to our Support Team. Your reports help us identify and address problems that automated systems might miss.

Reportable concerns include links to malicious websites containing malware, phishing attempts, or security threats. Deceptive links that misrepresent their destination or purpose. Inappropriate content that violates community standards or applicable laws. Broken links that lead to error pages or hijacked domains. Suspicious links that seem designed to scam or defraud users. Privacy-violating links that inappropriately expose personal information. Copyright-infringing content hosted on linked sites.

Our team reviews reported cases promptly, typically within 24-48 hours for standard reports and faster for urgent security concerns. Based on our investigation, we may take various actions including removing harmful links from the platform, issuing warnings to users who shared problematic links, suspending or terminating accounts involved in malicious linking, notifying affected users who may have clicked dangerous links, reporting severe violations to appropriate authorities, and implementing platform-wide protections against similar threats.

You can report concerns through multiple channels. The in-platform "Report" feature is available on most content where you see external links—look for report options in menus or near the content. Our support desk can be reached directly via the Help Center for detailed reports or urgent concerns. Email reports can be sent to support@amoriaconnekyt.com with "External Link Concern" in the subject line. When reporting, please include the URL of the problematic link, where you encountered it on our platform, what concern it raised, and any other relevant details.

We appreciate every report and take each one seriously. Community vigilance is essential to maintaining a safe platform, and we're grateful to users who take the time to help protect others.

Our Commitment to Safe Connections:
External links are essential to Amoria Connekyt's value proposition—they connect you with photographer portfolios, enable secure payments, facilitate social sharing, and extend our platform's capabilities. We couldn't provide the rich, connected experience users expect without these external integrations. At the same time, we recognize that every external link is a doorway to environments we don't control, and we take seriously our responsibility to be transparent about this reality. We vet our official partners and integrations carefully, respond promptly to reported concerns, and continuously work to balance connectivity with safety. Your awareness and caution complement our efforts, creating a community where the benefits of connection don't come at the cost of security or privacy.`
    },
    {
      id: 'childrens-privacy',
      title: "Children's Privacy",
      content: `Protecting children online is not just a legal obligation—it's a moral imperative that Amoria Connekyt takes with the utmost seriousness. Children deserve special protection in digital environments, where they may not fully understand the implications of sharing personal information, the permanence of digital footprints, or the potential risks of online interactions. While our platform is designed for adult creative professionals and their clients, we recognize our responsibility to implement robust safeguards that prevent minors from accessing services not intended for them and to respond swiftly and appropriately if we discover children have gained access to our platform.

Our approach to children's privacy goes beyond mere compliance with laws like COPPA (Children's Online Privacy Protection Act) or GDPR provisions for minors. We've built our systems, policies, and response procedures with the understanding that any failure to protect children represents a fundamental breach of trust—not just with potential minor users, but with our entire community of parents, families, and responsible adults who expect platforms to prioritize child safety.

1. Age Requirements - An Adults-Only Platform
Amoria Connekyt is designed exclusively for users who are 18 years of age or older. This isn't an arbitrary restriction—it reflects the professional nature of our platform, the types of transactions and interactions that occur here, and the legal frameworks governing online services for minors. Our platform facilitates commercial transactions, professional service arrangements, and business communications that are appropriate only for adults who can legally enter into contracts and make informed decisions about their personal and financial information.

We do not knowingly collect, store, process, or use personal information from individuals under 18 years of age. This prohibition applies to all categories of personal data, including account registration information, profile details, communication content, transaction records, usage analytics, and any other information that could identify or relate to a minor. Our data collection systems are designed with the assumption that all users are adults, and we have no legitimate purpose for processing children's data.

During registration, all users must affirmatively confirm that they meet our age requirements. This confirmation is not merely a checkbox acknowledgment—it's a representation that the user is legally an adult and eligible to use our services. Providing false age information during registration violates our Terms of Service and may result in immediate account termination. We implement this confirmation as a gate that must be passed before any account creation or data collection begins.

We employ multiple layers of age verification and detection throughout the user journey. Initial registration requires explicit age confirmation before proceeding. Profile information is monitored for indicators that might suggest underage users. Behavioral patterns that seem inconsistent with adult professional use may trigger review. Reports from community members about suspected underage users are investigated promptly. And we continuously evaluate and improve our age verification methods as technology and best practices evolve.

While no age verification system is perfect—determined minors can sometimes circumvent restrictions—we're committed to making our verification as effective as possible while maintaining reasonable user experience for legitimate adult users. We regularly review industry developments in age verification technology and update our approaches accordingly.

2. Parental Consent and Discovery Response - Swift Action When Needed
Despite our preventive measures, we recognize that minors may occasionally create accounts using false information, borrowed credentials, or other methods to circumvent age restrictions. When we discover or reasonably suspect that a user is under 18 years of age, we take immediate and comprehensive action to protect the minor and comply with applicable children's privacy laws.

Immediate account suspension occurs the moment we have reasonable grounds to believe a user is a minor. This suspension prevents further data collection, stops access to platform features, and halts any ongoing transactions or communications. We don't wait for conclusive proof before taking protective action—when child safety is at stake, we err on the side of caution.

We make reasonable efforts to notify parents or guardians when we discover an underage user, particularly in cases where we can identify appropriate contacts. This notification serves multiple purposes: alerting parents to their child's online activity, providing information about what data was collected, explaining what steps we're taking to protect the child, and offering parents the opportunity to make decisions about any data that might need to be retained for legitimate purposes (such as evidence in investigations).

Prompt data deletion is initiated for all personal information associated with the underage user's account. This deletion is comprehensive—we remove data from active databases, queue it for removal from backups as rotation cycles permit, and notify any third parties who may have received the minor's data that they should delete it as well. Our goal is to eliminate the minor's digital footprint from our systems as completely and quickly as technically possible.

In cases where the minor's account was involved in any transactions, communications, or interactions that might require investigation (for child safety, fraud, or legal reasons), we may retain minimal necessary records in secure, access-restricted storage while investigations proceed. This retention is strictly limited to what's legally required or necessary for child protection purposes, and data is deleted as soon as retention is no longer justified.

If we discover patterns suggesting systematic attempts by minors to access our platform—whether organized efforts, viral trends, or exploitation of specific vulnerabilities—we escalate our response to include enhanced verification measures, potential coordination with parents' groups or schools, and consultation with child safety experts.

3. COPPA and International Compliance - Meeting Global Standards
We comply with the Children's Online Privacy Protection Act (COPPA), the landmark U.S. federal law that protects children under 13 online, as well as similar international regulations protecting minors in jurisdictions worldwide. While our platform is designed for users 18 and older (exceeding COPPA's 13-year threshold), we maintain COPPA compliance as a foundational element of our children's privacy program.

COPPA compliance means we do not knowingly collect personal information from children under 13 without verifiable parental consent—and since we don't offer services to children at all, we don't seek such consent. We don't market to children, design features to appeal specifically to minors, or create any content targeted at users under 18. Our privacy practices for any inadvertently collected children's data meet or exceed COPPA's requirements for notice, consent, access, and deletion.

Beyond COPPA, we comply with international children's privacy frameworks including GDPR provisions for minors (which provide enhanced protections for children under 16 in the EU), the UK Age Appropriate Design Code (Children's Code), which establishes standards for online services likely to be accessed by children, Australia's Privacy Act provisions regarding children's personal information, Canada's PIPEDA and provincial privacy laws as they apply to minors, and Rwanda's Data Protection and Privacy Law provisions protecting vulnerable persons including children.

These regulations share common principles: children deserve heightened privacy protections, parental involvement is essential for children's online activities, data minimization is especially important for minors, and services must be designed with children's best interests in mind. Even though we're an adults-only platform, we embrace these principles as guides for how we handle any inadvertent contact with minors.

We maintain awareness of evolving children's privacy regulations worldwide and update our practices as new laws are enacted or existing laws are strengthened. Our legal and compliance teams monitor regulatory developments, and we participate in industry discussions about best practices for children's online safety.

4. No Targeting of Minors - Platform Design Philosophy
Our commitment to children's privacy extends beyond reactive measures to fundamental platform design decisions. Amoria Connekyt is architected, marketed, and operated as an adults-only professional platform, with no features, content, or communications designed to attract or appeal to minors.

We do not market to children through any channel. Our advertising, social media presence, and promotional activities are directed exclusively at adult professionals and clients. We don't advertise on platforms or in contexts primarily frequented by minors, we don't use marketing techniques known to appeal to children (cartoon characters, gamification designed for young users, prizes or rewards targeting youth), and we don't partner with influencers or brands primarily associated with younger audiences.

Our services are designed for adult professionals and their clients, reflecting the business nature of photography services, event planning, creative professional work, and the associated transactions. The features we build assume adult users making professional decisions—booking photography services for weddings, corporate events, or professional portfolios; managing business relationships; processing payments; and conducting professional communications. Nothing about our feature set is designed to engage or entertain children.

Content on the platform is appropriate for business purposes only. We don't host games, entertainment content, or interactive features designed to appeal to minors. User-generated content is expected to be professional in nature, and our community guidelines prohibit content that might attract underage users or be inappropriate for professional contexts.

Our user interface and experience design reflect adult professional expectations—clean, business-oriented design without elements specifically appealing to children like bright cartoon graphics, simplified language for young readers, or gamified elements common in youth-oriented platforms.

If we ever introduce new features, marketing campaigns, or content strategies, our review process includes assessment of whether changes might inadvertently attract minors or require additional children's privacy safeguards.

5. Reporting Underage Users - Community Partnership
Protecting children requires partnership between platform operators and community members. Our users are often best positioned to identify potential underage users through interactions, profile content, or behavioral patterns that might not be visible to automated systems. We encourage and facilitate reporting of suspected underage users as an essential component of our children's safety program.

If you believe a user may be under 18 years of age, please report this concern immediately. Reports can be submitted through multiple channels to ensure accessibility. Email reports should be sent to privacy@amoriaconnekyt.com with "Underage User Report" in the subject line. The in-platform reporting feature allows you to flag concerning profiles or users directly. Our support desk via the Help Center can receive reports along with questions about our process.

When submitting a report, please include information that helps us investigate effectively: the username or profile URL of the suspected underage user, what led you to believe the user might be under 18 (profile content, communication content, behavior patterns, direct statements, etc.), any relevant screenshots or documentation (if available and appropriate to share), your contact information in case we need clarification, and any urgency factors that might require expedited review.

All underage user reports are treated as high priority and reviewed by trained staff members—not just automated systems. We typically begin investigation within 24 hours of receiving a report, with expedited review for reports indicating immediate safety concerns. During investigation, we may temporarily restrict the reported account's access while we gather information.

We take reporter privacy seriously. Your identity as a reporter is kept confidential and is not shared with the reported user. We don't retaliate against good-faith reporters, even if investigation determines the reported user is actually an adult. We'd rather receive reports that turn out to be unfounded than miss genuine cases of minors on the platform.

After investigation, we inform reporters of the general outcome (account removed, account confirmed as adult user, investigation ongoing) without sharing details that might compromise the privacy of either party.

6. Educational Use and Special Circumstances - Nuanced Approaches
While Amoria Connekyt is an adults-only platform, we recognize that legitimate educational contexts may involve users near the age boundary or situations requiring nuanced consideration. We approach these circumstances thoughtfully while maintaining our commitment to children's privacy.

Photography students aged 18 and older are welcome on our platform as adult users. Many university photography programs, professional training courses, and continuing education offerings include students who are legal adults but may be in educational settings. These users have the same rights and responsibilities as any adult user, and their educational context doesn't change our privacy practices.

For educational institutions using Amoria Connekyt as part of curriculum or training, we recommend institutions verify that participating students meet our age requirements, institutional policies address appropriate platform use, and any required institutional consents or approvals are obtained. While these matters are outside our direct control—educational institutions are responsible for their own policies—we're happy to provide information about our platform to support institutional decision-making.

Users aged 16-17 present a gray area in some jurisdictions where they may legally enter certain types of contracts or be considered capable of consent for some purposes. However, our policy is clear: Amoria Connekyt requires users to be 18 or older, regardless of local variations in age of majority or consent. This bright-line rule simplifies compliance, ensures consistent user experience, and provides maximum protection for minors.

In rare circumstances where legal processes, investigations, or other extraordinary situations might involve minor's data (for example, if a minor was victimized through misuse of our platform), we cooperate with appropriate authorities while applying heightened protections to any children's information involved.

7. Data Deletion - Complete and Permanent Removal
When we identify that personal data belongs to or was collected from an underage user, we initiate comprehensive data deletion procedures designed to eliminate the minor's information from our systems as completely and permanently as possible.

Immediate deletion from active systems removes the minor's data from production databases, making it inaccessible for any platform operations, analytics, or other processing. This deletion is not a soft delete or archival—it's removal of data from active systems.

Third-party notification is sent to any service providers, partners, or integrations that may have received the minor's data, instructing them to delete associated information from their systems. We track these notifications and follow up to confirm deletion where possible.

Backup purging occurs as backup rotation cycles complete. Because backups are created as complete snapshots and can't easily have individual records selectively removed without compromising backup integrity, minor's data may persist in backups until those backups naturally expire and are replaced. For most backup generations, this occurs within 30-90 days. We document when deletion was initiated and track backup expiration to ensure eventual complete removal.

Audit trail retention is limited to the minimum information necessary to demonstrate compliance with children's privacy laws and our internal policies. This may include records that an account was identified as belonging to a minor and deleted, timestamps of relevant actions, and general categories of data that were removed—but not the actual personal information itself.

In cases involving legal holds, ongoing investigations, or situations where retention is legally required (such as cooperation with law enforcement investigating crimes against children), we may retain minimal necessary data in highly secured, access-restricted storage. This retention is strictly limited, carefully documented, and terminated as soon as legal requirements permit.

Our Commitment to Children's Safety:
Children's privacy isn't an afterthought or a compliance checkbox at Amoria Connekyt—it's a fundamental commitment that shapes how we design, operate, and govern our platform. We recognize that protecting children requires constant vigilance, continuous improvement, and partnership with parents, regulators, and our community. While we're confident in our current safeguards, we're never complacent—we continuously evaluate new risks, emerging best practices, and technological developments that might strengthen our protections. Every child deserves a safe online environment, and we're committed to doing our part to create that safety, even on a platform not intended for children.`
    },
    {
      id: 'international-transfers',
      title: 'International Data Transfers',
      content: `In today's interconnected digital economy, providing a seamless global service often requires moving data across international borders. Amoria Connekyt operates as a global platform connecting creative professionals and clients across multiple countries and continents, which means your personal information may be transferred to, stored in, and processed in countries other than the one where you reside. We understand that international data transfers raise legitimate privacy concerns—different countries have different privacy laws, and data moving across borders may be subject to varying levels of legal protection.

We take these concerns seriously and have implemented comprehensive safeguards to ensure your data receives consistent, high-quality protection regardless of where it's processed. Our approach combines legal mechanisms recognized by major privacy regulators, robust technical security measures, careful vetting of international partners, and transparency about where and why your data travels. This section explains the reality of international data transfers in our operations and the protections we've put in place.

1. Data Transfer Locations - Where Your Information May Travel
Your information may be transferred to and processed in multiple jurisdictions depending on various factors including where you're located, what services you're using, which service providers are involved, and operational requirements at any given time. Understanding these potential destinations helps you make informed decisions about using our platform.

Rwanda serves as our primary operational headquarters and a key data processing location. As a Rwandan company, significant portions of our data processing occur within Rwanda under the governance of Rwanda's Data Protection and Privacy Law No. 058/2021. User data for African operations, local payment processing, customer support for regional users, and core business operations are primarily handled in Rwanda.

The United States hosts critical infrastructure for our global operations. Many of the world's leading cloud service providers, payment processors, and technology platforms are headquartered in the US, making it a common destination for data transfers. Our US-based processing may include cloud infrastructure and hosting services provided by major platforms like Amazon Web Services, Google Cloud, or Microsoft Azure. Payment processing through US-headquartered providers like Stripe or PayPal. Analytics and performance monitoring tools. Content delivery networks that speed up platform performance globally. And customer support systems that serve users across time zones.

The European Union maintains some of the world's strongest data protection standards under GDPR, and we maintain EU-based processing capabilities to serve European users effectively. Data from EU users may be processed within EU member states to comply with GDPR localization preferences, using EU-based cloud regions and service providers where available. We maintain EU representative contact information as required by GDPR for non-EU companies processing EU residents' data.

Other countries where our service providers operate may also process your data. The global nature of technology services means data may flow through various jurisdictions including the United Kingdom (post-Brexit, with its own data protection framework similar to GDPR), Canada (with PIPEDA providing privacy protections), Singapore and other Asian technology hubs hosting regional infrastructure, and various countries where specialized service providers or support teams are located.

We maintain current records of which service providers process data in which jurisdictions and can provide this information upon request. The specific countries involved may change over time as we add, remove, or change service providers, but we always ensure appropriate safeguards are in place before transferring data to any new jurisdiction.

2. Legal Safeguards - Protecting Your Data Across Borders
International data transfers don't happen without legal frameworks ensuring your information remains protected. We rely on multiple legally recognized mechanisms to legitimize cross-border transfers and maintain consistent protection standards regardless of where data is processed.

Standard Contractual Clauses (SCCs) are pre-approved contract terms adopted by the European Commission and recognized by other regulators as providing adequate data protection guarantees. When we transfer data to countries without "adequacy" decisions (official recognition that a country's privacy laws meet EU standards), we use SCCs to contractually bind recipients to protect data according to EU-equivalent standards. These clauses impose obligations on data importers including protecting data with appropriate security measures, limiting use to specified purposes, notifying us of government access requests, allowing audits of their data protection practices, and deleting or returning data when the relationship ends. We've implemented the latest 2021 SCCs that address modern data processing scenarios and regularly review our SCC implementations to ensure continued compliance.

The EU-US Data Privacy Framework (and its predecessor mechanisms) provides a structured approach for transatlantic data transfers. US companies that certify under this framework commit to privacy principles enforceable by US regulatory authorities. When transferring data to US service providers, we prioritize those participating in recognized transfer frameworks. For providers not participating in such frameworks, we implement SCCs and additional safeguards.

Adequacy decisions by data protection authorities recognize certain countries as providing data protection "essentially equivalent" to EU standards, allowing free data flow without additional safeguards. Countries with adequacy decisions include Canada (for commercial organizations under PIPEDA), Japan, South Korea, the United Kingdom, Switzerland, Israel, New Zealand, and others. When we transfer data to countries with adequacy decisions, the transfer is legally straightforward, though we still implement strong contractual and technical protections.

Binding Corporate Rules (BCRs) may be relevant for some of our larger service providers who have obtained approval for company-wide data protection policies that govern international transfers within their corporate groups. BCRs provide another legally recognized mechanism for ensuring consistent protection across borders.

Additional safeguards beyond these primary mechanisms may include data localization where we keep certain data within specific regions when required by law or user preference, encryption ensuring data is protected during transfer and at rest in destination countries, access controls limiting who can access transferred data to only those with legitimate need, pseudonymization and anonymization reducing the identifiability of transferred data where possible, and transfer impact assessments evaluating the legal environment in destination countries and implementing additional protections where needed.

3. EU User Rights - Enhanced Protections Under GDPR
For users located in the European Economic Area (EEA), the United Kingdom, or Switzerland, your data receives the full protection of GDPR and equivalent frameworks, including specific rights related to international transfers.

Your data is protected under GDPR regardless of where it's processed. GDPR's extraterritorial reach means that EU data protection principles follow your data across borders. Service providers processing EU residents' data must comply with GDPR requirements even if they're located outside the EU. This "data follows the person" approach ensures consistent protection.

We maintain EU representative contact information as required by GDPR Article 27. Non-EU companies that process EU residents' data must designate a representative within the EU to serve as a contact point for data subjects and supervisory authorities. Our EU representative can be reached for questions about data protection, to exercise your rights, or to raise concerns about our data practices.

You have additional rights under European law specifically related to international transfers. You can request information about international transfers, including which countries your data has been transferred to, what safeguards are in place, and how to obtain copies of relevant safeguard documents (like SCCs). You can object to specific transfers if you have legitimate grounds. You can lodge complaints with your local data protection authority if you believe transfers aren't adequately protected. And you can seek judicial remedies if you believe your rights have been violated.

We respond to EU data subject requests within GDPR's required timeframes (generally 30 days) and provide the detailed information about international transfers that GDPR requires.

4. Cross-Border Processing - Why Data Travels
Understanding why data crosses borders helps contextualize the necessity of international transfers. We don't transfer data internationally without operational justification—every cross-border flow serves specific purposes that benefit you or are necessary for platform operations.

Payment processing often requires international transfers because payment networks are inherently global. When you make or receive payments on Amoria Connekyt, transaction data may flow through payment processors headquartered in various countries. Card network authorizations may route through international processing centers. Currency conversion and international payment settlement involve cross-border data flows. Fraud detection systems may analyze patterns across global transaction data. And compliance with payment card industry (PCI) standards may require processing in certified facilities located in various jurisdictions.

Cloud storage and backup leverages the global infrastructure of major cloud providers to ensure reliability, performance, and disaster recovery. Your data may be stored in multiple geographic regions to provide fast access regardless of your location, redundancy protecting against regional outages or disasters, compliance with data localization requirements where applicable, and optimal performance through content delivery networks.

Customer support services may involve international teams to provide coverage across time zones and language capabilities. When you contact support, your inquiry may be handled by team members in various locations depending on availability, language requirements, and expertise needed. We ensure all support personnel, regardless of location, are trained in data protection and bound by confidentiality obligations.

Analytics and platform improvement aggregate data from users worldwide to understand platform performance, identify issues, and improve features. Analytics processing may occur in jurisdictions where our analytics providers are headquartered. However, analytics data is typically aggregated and anonymized, minimizing privacy implications of these transfers.

Security and fraud prevention systems analyze patterns across our global user base to detect and prevent abuse. This may involve transferring data to security service providers in various jurisdictions who maintain threat intelligence and fraud detection capabilities.

5. Security During Transfer - Technical Protections
Legal safeguards are complemented by robust technical measures that protect your data as it moves across borders. We don't rely solely on legal frameworks—we implement security measures that provide practical protection regardless of which jurisdiction data passes through.

All data transfers use encrypted connections. Data in transit between your device and our servers, between our servers and service providers, and between different service provider systems is encrypted using industry-standard protocols like TLS 1.2 or higher. Encryption ensures that even if data is intercepted during transfer, it cannot be read by unauthorized parties.

Data at rest in destination systems is also encrypted. Beyond protecting data in transit, we ensure that data stored in cloud infrastructure, databases, and backup systems is encrypted at rest. This protection means that even physical access to storage hardware wouldn't reveal readable data without encryption keys.

We vet all international service providers before engaging them for services that involve personal data. Our vendor assessment process evaluates security certifications and compliance (SOC 2, ISO 27001, etc.), data protection policies and practices, technical security measures and infrastructure, incident response capabilities, legal jurisdiction and government access risks, and contractual willingness to accept appropriate data protection obligations.

Regular compliance audits verify that our international data protection measures remain effective. We conduct periodic assessments of our own practices as well as our service providers, reviewing compliance with contractual obligations, verifying security measures remain current, identifying and addressing any gaps or risks, and updating safeguards as threats and best practices evolve.

Access controls limit who can access your data regardless of where it's stored. Role-based access ensures only authorized personnel can access personal data, with access limited to what's necessary for their specific job functions. We maintain logs of data access for audit purposes.

6. Your Consent and Choices - Understanding Your Options
By using Amoria Connekyt, you acknowledge that international data transfers are necessary for us to provide our services and consent to such transfers as described in this policy. However, this consent is informed consent—we want you to understand what you're agreeing to and what options you have.

Your consent is based on transparency. We've explained where your data may travel, why transfers occur, what legal safeguards protect transferred data, what technical measures secure data in transit and at rest, and what rights you have regarding international transfers. This information enables you to make an informed decision about using our platform.

You have options to limit international transfers in some cases. If you're concerned about specific destinations, contact us to discuss whether alternatives are available. For some services, we may be able to accommodate data localization preferences, though this may limit functionality or incur additional costs. EU users can specifically request information about EU-based processing options.

You can withdraw consent by closing your account, though this means discontinuing use of our services. Account closure triggers our data deletion procedures, including deletion from international systems (subject to legal retention requirements discussed elsewhere in this policy).

If you have concerns about specific transfers, we're happy to discuss them. Contact our privacy team at privacy@amoriaglobal.com with questions about international transfers, requests for information about specific destination countries or service providers, concerns about legal protections in particular jurisdictions, or requests for copies of relevant safeguard documents.

Our Commitment to Global Data Protection:
Operating a global platform means navigating a complex landscape of international data flows, varying legal requirements, and evolving privacy standards. We're committed to getting this right—not just meeting minimum legal requirements, but implementing comprehensive protections that give you genuine confidence in how your data is handled across borders. We continuously monitor developments in international data transfer law, update our safeguards as requirements change, and maintain transparency about where and why your data travels. The global nature of our platform enables us to connect creative professionals and clients across the world, and we're determined to deliver that value while respecting your privacy regardless of which borders your data crosses.`
    },
    {
      id: 'rwanda-privacy',
      title: 'Rwanda Data Protection and Privacy Rights',
      content: (
        <div>
          As a Rwandan company, Amoria Connekyt operates under the jurisdiction of Rwanda's Data Protection and Privacy Law No. 058/2021 of 13/10/2021—one of Africa's most comprehensive data protection frameworks. This landmark legislation establishes robust rights for individuals (data subjects) concerning how their personal data is collected, processed, stored, and used by organizations operating in Rwanda. We don't view compliance with this law as merely a legal obligation; we see it as an expression of our commitment to respecting the privacy and dignity of every person who entrusts us with their personal information.
          <br /><br />
          Rwanda's data protection framework reflects the country's broader commitment to becoming a leading digital economy in Africa while ensuring that technological advancement doesn't come at the expense of individual privacy rights. The law aligns with international best practices, including principles found in the European Union's GDPR, while addressing the specific context and needs of Rwanda's digital ecosystem. For users in Rwanda and those whose data is processed under Rwandan jurisdiction, this section details your comprehensive rights and how Amoria Connekyt fulfills its obligations under this important legislation.
          <br /><br />
          <strong>1. Right to Be Informed - Transparency as Foundation</strong><br />
          You have the fundamental right to be informed about how and why Amoria Connekyt collects and uses your personal data before and during our processing activities. This right to transparency is the foundation upon which all other data protection rights rest—you cannot make informed decisions about your data if you don't understand what's happening with it.
          <br /><br />
          Your right to be informed includes knowing the specific purposes for which your data is collected and processed, whether for account management, service delivery, payment processing, marketing, analytics, or other purposes. You're entitled to understand the legal basis justifying our processing—whether we're relying on your consent, contractual necessity, legal obligations, or legitimate business interests. You should know the categories of personal data we collect about you, from basic contact information to more sensitive data like financial details or identity documents.
          <br /><br />
          We must inform you about data retention periods—how long we keep different types of information and why. You have the right to know about any third parties with whom we share your data, whether service providers, business partners, or regulatory authorities. If we transfer your data outside Rwanda, you're entitled to know the destination countries and the safeguards protecting your information abroad. And crucially, you must be informed about your rights under Rwandan law and how to exercise them.
          <br /><br />
          We fulfill this obligation through this comprehensive privacy policy, through notices provided at the point of data collection, through our cookie consent mechanisms, and through direct communications when processing activities change. If you ever feel inadequately informed about our data practices, please contact us—transparency is a right we take seriously.
          <br /><br />
          <strong>2. Right of Access - Understanding What We Know</strong><br />
          You have the right to request and receive confirmation of whether Amoria Connekyt processes your personal data, and if so, to access that data along with comprehensive information about how it's being used. This access right empowers you to understand exactly what information we hold about you and to verify that our processing is lawful and fair.
          <br /><br />
          When you exercise your access right, we provide a copy of your personal data in a commonly used electronic format. Beyond the raw data, we also provide contextual information including the purposes of our processing, the categories of data involved, the recipients or categories of recipients who have received your data, the retention period or criteria used to determine how long data is kept, information about your other rights (rectification, erasure, restriction, objection), your right to lodge complaints with the supervisory authority, the source of data if we didn't collect it directly from you, and information about any automated decision-making or profiling affecting you.
          <br /><br />
          Access requests are free of charge for reasonable requests. If requests are manifestly unfounded, excessive, or repetitive, we may charge a reasonable administrative fee or refuse to act—but we'll explain our reasoning and your options if this occurs. We respond to access requests within the timeframes required by Rwandan law, typically within 30 days, though complex requests may require extensions with notification to you.
          <br /><br />
          <strong>3. Right to Rectification - Ensuring Accuracy</strong><br />
          You have the right to request correction of any inaccurate personal data we hold about you and to have incomplete data completed. Accurate data is essential for fair processing—decisions based on incorrect information can harm you, and maintaining data quality is both your right and our responsibility.
          <br /><br />
          Your rectification right covers several scenarios. Factually incorrect data should be corrected—if your name is misspelled, your address is outdated, or your professional credentials are wrong, you can request correction. Incomplete data can be supplemented—if relevant information is missing from your profile that would provide a more accurate picture, you can request completion. Outdated information that no longer reflects current reality can be updated to maintain accuracy over time.
          <br /><br />
          Many corrections can be made directly through your account settings without needing to submit a formal request. For data you cannot modify yourself, submit a rectification request to our privacy team with details of what's incorrect and what the accurate information should be, along with any supporting documentation if relevant.
          <br /><br />
          When we correct data that was previously shared with third parties, we notify those recipients of the correction so they can update their records—ensuring accuracy propagates throughout systems that hold your information.
          <br /><br />
          <strong>4. Right to Erasure ("Right to Be Forgotten") - Deletion When Appropriate</strong><br />
          You have the right to request that Amoria Connekyt permanently delete your personal data in certain circumstances. This "right to be forgotten" recognizes that your relationship with us may end, that you may withdraw consent, or that continued retention may simply not be justified.
          <br /><br />
          You can request erasure when:
          <ul style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <li>The data is no longer needed for the purposes for which it was originally collected or processed—if you close your account and we have no ongoing need for your information, deletion is appropriate.</li>
            <li>You withdraw consent that was the basis for processing—if we processed data based on your consent and you revoke that consent, the legal basis for continued processing disappears.</li>
            <li>You successfully object to processing—if your objection is upheld, continued retention isn't justified.</li>
            <li>The data has been unlawfully processed—if we processed data without proper legal basis, erasure remedies the violation.</li>
            <li>Erasure is required to comply with Rwandan law—legal obligations may mandate deletion in specific circumstances.</li>
            <li>The data was collected in relation to offering information society services to a child—special protections for children's data may require erasure.</li>
          </ul>
          However, the right to erasure isn't absolute. We may retain data despite your request when retention is necessary for exercising freedom of expression and information, complying with legal obligations under Rwandan law (such as tax records or anti-money laundering requirements), performing tasks in the public interest, establishing, exercising, or defending legal claims, or archiving in the public interest, scientific research, or statistical purposes where erasure would seriously impair the processing.
          <br /><br />
          When we delete your data, we implement comprehensive deletion from active systems, notify third parties who received your data to delete their copies, and queue removal from backups as rotation cycles permit. We'll confirm what has been deleted and explain any data that must be retained and why.
          <br /><br />
          <strong>5. Right to Restrict Processing - Pausing Without Deleting</strong><br />
          You have the right to request that we limit or "freeze" our processing of your personal data in certain circumstances. Restriction is a middle ground between continued processing and full deletion—your data remains stored but is not actively used while issues are resolved.
          <br /><br />
          You can request restriction when you contest the accuracy of your data—restriction applies while we verify accuracy, protecting you from decisions based on potentially incorrect information. Restriction is available when processing is unlawful but you prefer restriction over erasure—perhaps because you need the data for legal claims even though our processing was improper. You can request restriction when we no longer need the data but you require it for legal claims—keeping data available for your purposes even after our purposes end. And restriction applies when you've objected to processing and we're evaluating whether our legitimate grounds override your objection.
          <br /><br />
          During restriction, your data remains securely stored but is excluded from active processing. We won't use it for analytics, include it in marketing, share it with third parties, or base decisions on it. The only processing permitted during restriction is storage itself, processing with your explicit consent, processing for legal claims, processing to protect others' rights, and processing for important public interest reasons.
          <br /><br />
          Before lifting any restriction, we'll inform you so you can take further action if needed. Restriction can be lifted when the triggering issue is resolved—disputed data verified, objection evaluated, or your explicit consent obtained.
          <br /><br />
          <strong>6. Right to Data Portability - Taking Your Data With You</strong><br />
          You have the right to receive your personal data in a structured, commonly used, and machine-readable format, and to transmit that data to another controller without hindrance from Amoria Connekyt. This portability right recognizes that your data has value and that you shouldn't be locked into our platform simply because migrating your information elsewhere is too difficult.
          <br /><br />
          Portability applies to personal data you provided to us directly (account information, profile content, uploaded files, messages you wrote) and data generated through your use of our services (transaction history, booking records, interaction logs). It applies when processing is based on your consent or on contract performance and when processing is carried out by automated means.
          <br /><br />
          When you exercise portability, we provide your data in formats like JSON, CSV, or XML that can be read by other systems. Where technically feasible and where you request it, we can transmit data directly to another controller—though this depends on the receiving system's ability to accept such transfers.
          <br /><br />
          Portability empowers you to move your professional presence, booking history, and accumulated data to competing platforms if you choose. We support this right because we believe users should stay with us because of the value we provide, not because leaving is too difficult.
          <br /><br />
          <strong>7. Right to Object - Saying No to Specific Processing</strong><br />
          You have the right to object to certain types of processing of your personal data, requiring us to stop unless we can demonstrate compelling legitimate grounds that override your interests. Objection is a powerful right that gives you control over uses of your data that you find objectionable.
          <br /><br />
          You can object to direct marketing at any time, unconditionally, and without needing to provide reasons. When you object to marketing, we stop using your data for promotional purposes immediately—no exceptions, no delays, no questions asked. This includes email marketing, targeted advertising, personalized promotions, and any other marketing activities.
          <br /><br />
          You can object to processing based on legitimate interests (ours or third parties') or processing for tasks in the public interest. When you object on these grounds, we must stop processing unless we demonstrate compelling legitimate grounds that override your interests, rights, and freedoms, or processing is necessary for legal claims. The burden is on us to justify continued processing, not on you to justify your objection.
          <br /><br />
          You can object to profiling to the extent it relates to direct marketing (absolute right) or where it produces legal or similarly significant effects (subject to exceptions for contract performance, legal authorization, or explicit consent).
          <br /><br />
          We inform you of your right to object at the point of first communication and in our privacy policy. When you object, we acknowledge receipt promptly and communicate our decision within timeframes required by law.
          <br /><br />
          <strong>8. Rights in Automated Decision-Making - Human Oversight of Algorithms</strong><br />
          You have the right not to be subject to decisions based solely on automated processing, including profiling, that produce legal effects concerning you or similarly significantly affect you. This right ensures that consequential decisions about your life aren't made entirely by algorithms without human judgment and oversight.
          <br /><br />
          Automated decision-making covered by this right includes decisions that affect your legal rights or status, decisions with significant financial implications, decisions about access to services or opportunities, and profiling that places you in categories that affect how you're treated. Examples might include automated rejection of account applications, algorithmic determination of service pricing, automated fraud detection resulting in account restrictions, or profiling that affects what opportunities are shown to you.
          <br /><br />
          When automated decisions significantly affect you, you have the right to obtain human intervention—having a real person review the automated decision. You can express your point of view and provide additional information that the algorithm may not have considered. You can contest the decision if you believe it's wrong, and you're entitled to an explanation of the logic involved in the automated processing.
          <br /><br />
          Exceptions exist where automated decision-making is necessary for contract performance (fraud detection enabling secure payments), authorized by Rwandan law with appropriate safeguards, or based on your explicit consent. Even in these cases, we implement safeguards including the ability to obtain human intervention, to express your view, and to contest decisions.
          <br /><br />
          <strong>9. Data Protection and Security - Our Technical and Organizational Safeguards</strong><br />
          Rwandan law requires data controllers to implement appropriate technical and organizational measures to secure personal data. Amoria Connekyt takes this obligation seriously, implementing comprehensive security measures that protect your data throughout its lifecycle.
          <br /><br />
          Our technical security measures include:
          <ul style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <li>Encryption protecting data in transit (TLS 1.2+) and at rest (AES-256), ensuring unauthorized parties cannot read your information even if they intercept or access it.</li>
            <li>Access control mechanisms limiting data access to authorized personnel with legitimate need, enforced through role-based permissions, strong authentication, and the principle of least privilege.</li>
            <li>Secure storage infrastructure using reputable cloud providers with certified security practices (SOC 2, ISO 27001) and geographic redundancy for disaster recovery.</li>
            <li>Network security including firewalls, intrusion detection systems, and continuous monitoring for suspicious activities.</li>
            <li>Regular security testing including vulnerability assessments and penetration testing to identify and remediate weaknesses.</li>
          </ul>
          Our organizational security measures include security awareness training for all personnel handling personal data, background checks for employees with access to sensitive information, incident response procedures for detecting, containing, and remediating security events, vendor management ensuring third-party service providers maintain adequate security, and regular audits verifying compliance with our security policies and legal requirements.
          <br /><br />
          We document our security measures and can demonstrate compliance to the supervisory authority upon request. When security incidents occur that may affect your data, we notify you and the authorities as required by Rwandan law.
          <br /><br />
          <strong>10. Cross-Border Data Transfers - International Protection</strong><br />
          Rwanda's Data Protection and Privacy Law regulates transfers of personal data outside Rwanda's borders, recognizing that data traveling internationally may be subject to different legal protections. As a platform serving users across Africa and beyond, Amoria Connekyt necessarily transfers some data internationally—and we ensure these transfers comply fully with Rwandan legal requirements.
          <br /><br />
          We transfer personal data outside Rwanda only when adequate protection measures are in place as recognized by the National Cyber Security Authority (NCSA). Adequate protection may be established through transfers to countries with data protection laws recognized as providing adequate protection, standard contractual clauses approved by relevant authorities binding recipients to protect data, binding corporate rules for transfers within corporate groups, explicit consent from you after being informed of potential risks, or necessity for contract performance, legal claims, or vital interests.
          <br /><br />
          Before transferring data internationally, we assess the destination country's legal environment, implement appropriate safeguards, and document our compliance rationale. We maintain records of international transfers that we can provide to regulators upon request.
          <br /><br />
          You have the right to know when your data is transferred outside Rwanda, to which countries, and what safeguards protect it. This information is available in our general privacy policy and can be provided in more detail upon specific request.
          <br /><br />
          <strong>11. Data Retention - Keeping Data Only as Long as Necessary</strong><br />
          Under Rwandan law, personal data must not be kept longer than necessary for the purposes for which it was collected. We implement documented retention schedules ensuring data is deleted when no longer needed, rather than retained indefinitely out of convenience.
          <br /><br />
          Our retention periods are determined by the original purpose of collection—when purpose is fulfilled, retention justification ends. Legal obligations may require extended retention—tax laws require 7-year financial record retention, anti-money laundering laws require 5-year KYC document retention. Ongoing legal disputes or investigations may necessitate retaining relevant data until resolution. And legitimate business needs, when documented and specific, may justify limited extended retention.
          <br /><br />
          When retention periods expire, data is securely deleted from active systems, queued for removal from backups, and anonymized where aggregate information provides value without privacy risk. We conduct regular reviews to ensure data isn't retained beyond justified periods.
          <br /><br />
          You can request information about specific retention periods applicable to your data, and you can request early deletion subject to legal retention requirements we cannot waive.
          <br /><br />
          <strong>12. How to Exercise Your Rights - Practical Steps</strong><br />
          We've designed accessible processes for exercising your rights under Rwandan data protection law. You don't need legal expertise or formal documentation—we respond to straightforward requests submitted through convenient channels.
          <br /><br />
          To exercise any of your rights, please contact:<br />
          Email: <a href="mailto:privacy@amoriaconnekyt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>privacy@amoriaconnekyt.com</a><br />
          Subject line: "Rwanda Data Privacy Request"<br /><br />
          In your request, please include your full name and email address associated with your account, the specific right you're exercising (access, rectification, erasure, restriction, portability, objection, or automated decision-making), details about your request—what data, what correction, what objection grounds, etc., and any supporting documentation if relevant to your request.
          <br /><br />
          We acknowledge receipt of requests promptly, typically within 48 hours. We verify your identity to protect against unauthorized access to your data—this usually involves confirming your email address, but sensitive requests may require additional verification. We respond substantively within the timeframe required by Rwandan law, typically 30 days from verified request receipt. If requests are complex, we may extend by an additional period with notification to you explaining the delay.
          <br /><br />
          If we cannot fulfill your request (due to legal retention requirements, identity verification failure, or other valid reasons), we explain why, inform you of your options, and advise you of your right to complain to the supervisory authority.
          <br /><br />
          <strong>13. Supervisory Authority - Independent Oversight</strong><br />
          Rwanda's data protection framework includes independent regulatory oversight through the National Cyber Security Authority (NCSA), which serves as the supervisory authority for data protection matters. The NCSA has powers to investigate complaints, conduct audits, issue guidance, and enforce compliance with data protection law.
          <br /><br />
          If you believe your data protection rights have been violated by Amoria Connekyt, you have the right to lodge a complaint with the NCSA. You don't need to exhaust internal remedies with us first—you can complain to the authority at any time, though we encourage you to contact us first as we may be able to resolve concerns more quickly.
          <br /><br />
          National Cyber Security Authority (NCSA)<br />
          Data Protection Office – Kigali, Rwanda<br />
          Website: <a href="https://www.ncsa.gov.rw" target="_blank" rel="noopener noreferrer" style={{ color: '#083A85', textDecoration: 'underline' }}>www.ncsa.gov.rw</a>
          <br /><br />
          The NCSA can investigate your complaint, require us to provide information and access, order us to take specific actions to remedy violations, and impose penalties for non-compliance. We cooperate fully with NCSA investigations and respect their authority to enforce Rwandan data protection law.
          <br /><br />
          <strong>Our Commitment to Rwandan Data Protection Standards:</strong><br />
          As a Rwandan company, we're proud to operate under one of Africa's most progressive data protection frameworks. We view Rwanda's Data Protection and Privacy Law not as a burden but as an expression of values we share—respect for individual dignity, transparency in how organizations operate, and accountability when things go wrong. We're committed to not just meeting but exceeding the law's requirements, to being a positive example of data protection in Rwanda's growing digital economy, and to continuously improving our practices as standards evolve. Your trust is the foundation of our business, and Rwandan data protection law gives us a framework for honoring that trust consistently and verifiably.
        </div>
      )
    },
    {
      id: 'policy-updates',
      title: 'Updates to This Policy',
      content: `Privacy practices and the legal landscape governing them are not static—they evolve as technology advances, regulations change, business practices develop, and user expectations shift. Amoria Connekyt is committed to maintaining a Privacy Policy that accurately reflects our current practices, complies with applicable laws, and provides you with the information you need to make informed decisions about your data. This means we may update this Privacy Policy from time to time, and this section explains how we handle those updates, how we notify you, and what your options are when changes occur.

We approach policy updates with the same transparency and respect for users that guides all our privacy practices. We don't bury changes in fine print or hope users won't notice—we proactively communicate updates, explain what's changing and why, and give you meaningful opportunities to understand and respond to changes that affect your rights or our handling of your data.

1. Notification of Changes - How We Communicate Updates
When we make significant changes to this Privacy Policy, we employ multiple notification methods to ensure you're aware of updates that may affect your privacy rights or how we handle your personal information. We don't rely on a single notification channel because we know different users engage with our platform in different ways.

We update the "Effective Date" prominently displayed at the top of this policy with every revision, whether major or minor. This date serves as your first indicator that something has changed—if the date is more recent than your last review, updates have occurred. We recommend noting the effective date when you review this policy so you can easily identify future changes.

For significant changes, we notify users via email sent to the address associated with your account. These email notifications summarize what's changing, explain why changes are being made (new features, legal requirements, improved practices), highlight any changes that particularly affect your rights or our data handling, and provide direct links to the updated policy for your review. We send these notifications to all active users, not just those who've opted into marketing communications—policy updates are service communications, not marketing.

We display prominent notices on the platform itself when you log in or use our services after a significant update. These notices may appear as banners, pop-ups, or interstitial pages depending on the significance of changes. Platform notices ensure that even users who don't regularly check email are informed of important updates when they engage with our services.

Major changes require advance notice before taking effect—typically 30 days from notification to implementation. This advance notice period gives you time to review the changes, understand their implications, ask questions if anything is unclear, adjust your privacy settings if desired, exercise your rights (including account deletion) if you disagree with changes, and make informed decisions about continued use of our platform. During this advance notice period, the current policy remains in effect—changes don't apply until the stated effective date.

2. Minor Changes - Administrative and Clarifying Updates
Not every policy update is significant. Some changes are administrative, clarifying, or technical in nature—they don't substantively affect your rights or how we handle your data. For these minor changes, our notification approach is proportionally lighter while still maintaining transparency.

Minor changes include corrections of typographical errors, grammar, or formatting issues that don't change meaning. Clarifications that explain existing practices more clearly without changing what we actually do. Updates to contact information, company names, or other administrative details. Reorganization of content for better readability without substantive changes. Updates to reflect changes in third-party service provider names or branding. And technical corrections that align policy language with actual, unchanged practices.

For minor changes, we update the policy with a new effective date so you can identify that changes occurred. We may highlight changed sections within the policy document itself using revision marks or change summaries. Continued use of the platform after minor updates constitutes acceptance—we don't require explicit acknowledgment for non-substantive changes. We maintain change logs so you can review exactly what was modified if you're interested.

The distinction between "significant" and "minor" changes involves judgment, and we err on the side of treating changes as significant when there's any doubt. If a change could reasonably affect your decisions about using our platform or sharing data with us, we treat it as significant and provide full notification.

3. Review Frequency - When and Why We Update
We don't update this policy arbitrarily or on a fixed schedule without reason. Updates are driven by genuine changes in our practices, legal requirements, or circumstances that warrant policy revision. However, we do conduct regular reviews to ensure our policy remains accurate and compliant.

Annual compliance audits trigger policy review as part of our regular governance processes. Even if no changes are needed, we verify that our stated practices match our actual practices, that legal requirements haven't changed in ways requiring policy updates, that new features or services are adequately addressed, and that user feedback or questions haven't revealed areas needing clarification.

Launching new features or services prompts policy review because new functionality may involve new data collection, new processing purposes, new third-party integrations, or other changes that should be reflected in our privacy disclosures. We review privacy implications during product development and update policies before or concurrent with feature launches.

Legal and regulatory changes necessitate policy updates when new laws are enacted, existing laws are amended, regulatory guidance is issued, or court decisions affect data protection requirements. We monitor legal developments in Rwanda, the EU, the US, and other jurisdictions where we operate or have users, updating our policy to maintain compliance as requirements evolve.

User feedback and privacy concerns may reveal areas where our policy is unclear, incomplete, or not aligned with user expectations. We take feedback seriously and update our policy when doing so would better serve users' understanding of our practices.

Industry best practices evolve, and we periodically update our policy to reflect improved approaches to privacy disclosure, consent mechanisms, or data handling that emerge as standards across the technology industry.

4. Version History - Transparency Through Archives
Previous versions of this Privacy Policy are available upon request for comparison and transparency purposes. We maintain policy archives because transparency isn't just about the current policy—it's about understanding how our practices have evolved over time.

Our version history allows you to compare current and previous versions to understand exactly what changed. You can review the policy that was in effect during specific periods if you have questions about practices that applied to your data at particular times. You can track the evolution of our privacy practices over the life of the platform. And regulators, auditors, or legal processes can access historical policies when relevant to investigations or compliance verification.

To request previous policy versions, contact our privacy team at privacy@amoriaglobal.com specifying which version(s) you need—by date, version number, or approximate timeframe. We provide requested versions in a reasonable timeframe, typically within 14 days.

We also maintain internal change logs documenting the rationale for each policy update, which sections were modified, and what drove the changes. While these detailed logs are primarily for internal governance, summaries may be shared upon request to help users understand the evolution of specific policy provisions.

5. Your Responsibility - Staying Informed
While we work hard to notify you of policy changes through multiple channels, maintaining awareness of our privacy practices is a shared responsibility. We encourage you to take an active role in staying informed about how your data is handled.

Review this policy periodically, especially after receiving notification of updates. We recommend reviewing at least annually even if you haven't received change notifications, to refresh your understanding of our practices and ensure continued comfort with our data handling.

Check the effective date for updates whenever you access this policy. If the date has changed since your last review, take time to understand what's new. We try to make changes easy to identify, but the effective date is your reliable indicator of updates.

Contact us with questions about changes if anything is unclear. We're happy to explain what changed, why changes were made, and how updates affect you specifically. Our privacy team can be reached at privacy@amoriaglobal.com for questions about policy updates.

Exercise your rights if you disagree with changes. If policy updates reflect practices you're not comfortable with, you have options: adjust your privacy settings, limit your use of certain features, exercise data deletion rights, or discontinue use entirely. We respect your right to make these choices, even when it means losing you as a user.

Update your contact information to ensure you receive policy update notifications. If your email address changes, update it in your account settings so important communications reach you.

6. Continued Use - What It Means for Acceptance
Continued use of Amoria Connekyt after policy updates take effect indicates your acceptance of the revised terms. This is a standard approach across the technology industry, and it's important you understand what it means and doesn't mean.

Continued use constitutes acceptance because ongoing engagement with our services necessarily involves data processing as described in our policy. When you log in, browse, book services, communicate with other users, or otherwise use the platform after an updated policy takes effect, you're engaging in activities governed by that updated policy.

This doesn't mean you have no choice. Before updates take effect (during the advance notice period for significant changes), you can review changes and decide whether to continue using our services. If you disagree with upcoming changes, you can exercise your rights before the new policy applies—including downloading your data, deleting your account, or adjusting settings. You're never forced to accept changes you disagree with; the alternative is discontinuing use.

If you do not agree with policy updates, you should discontinue use of our platform. We understand this may be a significant decision, especially if you've invested in building your presence on Amoria Connekyt. We don't take this lightly, which is why we provide advance notice for significant changes—giving you time to make thoughtful decisions rather than forcing immediate choices.

Account deletion is available if you choose to leave. You can request complete deletion of your account and personal data (subject to legal retention requirements), export your data before leaving (exercising portability rights), and close your account through self-service or by contacting support. We process departure requests promptly and don't create artificial barriers to leaving.

7. Material Changes - Special Handling for Significant Rights Impact
Some policy changes are so significant that they warrant special handling beyond standard notification procedures. Material changes affecting your fundamental rights require explicit consent or meaningful opt-out opportunities before taking effect.

Material changes include introducing entirely new categories of data collection not previously disclosed. Sharing data with new categories of third parties in ways that significantly expand disclosure. Changing the legal basis for processing in ways that affect your control over your data. Removing or significantly limiting privacy rights you previously enjoyed. Introducing new uses of sensitive personal information. Changes to international transfer practices that significantly affect data protection. And modifications to retention periods that significantly extend how long we keep your data.

For material changes, we go beyond standard notification. We may require explicit consent through active acknowledgment (not just continued use) before changes apply to your data. We provide meaningful opt-out opportunities allowing you to reject specific changes while continuing to use the platform where feasible. We offer extended notice periods beyond the standard 30 days for particularly significant changes. We provide direct communication explaining the changes and your options, not just policy updates. And we ensure granular choices where possible—allowing you to accept some changes while rejecting others.

Our goal with material changes is ensuring you have genuine informed consent, not just technical legal compliance. We want you to understand significant changes, have real choices about whether to accept them, and never feel that changes were imposed without your knowledge or meaningful opportunity to respond.

Our Commitment to Transparent Policy Evolution:
This Privacy Policy is a living document that evolves alongside our platform, the legal landscape, and privacy best practices. We're committed to evolving thoughtfully—making changes when genuinely needed while maintaining the stability users depend on. We're committed to communicating clearly—using plain language, multiple channels, and adequate notice so you're never surprised by changes. We're committed to respecting your choices—providing real options when changes occur, not just take-it-or-leave-it ultimatums where avoidable. And we're committed to maintaining trust—recognizing that how we handle policy updates reflects our broader values about transparency, respect, and user empowerment. The way we update this policy is itself a privacy practice, and we hold it to the same high standards as everything else we do with your data.`
    },
    {
      id: 'contact-us',
      title: 'Contact Us',
      content: (
        <div>
          Your ability to communicate with us about privacy matters is fundamental to the trust relationship we're building. Whether you have questions about how we handle your data, concerns about practices you've observed, requests to exercise your privacy rights, or feedback on how we can improve our privacy practices, we want to hear from you. We've established multiple contact channels to ensure you can reach the right team for your specific needs, and we're committed to responding promptly, thoroughly, and respectfully to every inquiry.
          <br /><br />
          We believe that accessible communication is itself a privacy practice. If you can't easily reach us with questions or concerns, our commitments to transparency and user rights ring hollow. That's why we've invested in building responsive privacy and support teams, establishing clear escalation paths for complex issues, and maintaining multiple contact methods to accommodate different preferences and needs.
          <br /><br />
          <strong>1. Privacy Office Contact - Your Primary Privacy Resource</strong><br />
          For all privacy-related questions, concerns, and requests, our Privacy Office serves as your primary point of contact. This dedicated team handles privacy inquiries with the specialized knowledge and attention these matters deserve.
          <br /><br />
          <strong>Amoria Connekyt Privacy Office</strong><br />
          Email: <a href="mailto:privacy@amoriaconnekyt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>privacy@amoriaconnekyt.com</a><br />
          Phone: <a href="tel:+250788437347" style={{ color: '#083A85', textDecoration: 'underline' }}>+250 788 437 347</a><br />
          Website: <a href="https://www.amoriaconnekyt.com" target="_blank" rel="noopener noreferrer" style={{ color: '#083A85', textDecoration: 'underline' }}>www.amoriaconnekyt.com</a>
          <br /><br />
          The Privacy Office handles a wide range of inquiries including questions about this Privacy Policy or how specific provisions apply to your situation, requests to exercise your privacy rights (access, correction, deletion, portability, objection, restriction), concerns about how your data has been collected, used, or shared, questions about specific data processing activities or third-party integrations, reports of potential privacy violations or security incidents, inquiries about international data transfers and applicable safeguards, questions about children's privacy or age verification, and feedback on our privacy practices or suggestions for improvement.
          <br /><br />
          When contacting the Privacy Office, please include your name and email address associated with your Amoria Connekyt account (if applicable), a clear description of your question, concern, or request, any relevant details that help us understand and address your inquiry, and your preferred method of response if you have a preference.
          <br /><br />
          We acknowledge receipt of Privacy Office inquiries within 48 hours and provide substantive responses within the timeframes required by applicable law—typically 30 days for formal rights requests, though many inquiries are resolved more quickly. Complex requests may require additional time, and we'll communicate proactively if extensions are needed.
          <br /><br />
          <strong>2. General Support - Platform and Account Assistance</strong><br />
          For general inquiries about using the Amoria Connekyt platform, account issues, technical problems, or questions not specifically related to privacy, our General Support team is available to help.
          <br /><br />
          Email: <a href="mailto:support@amoriaconnekyt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>support@amoriaconnekyt.com</a><br />
          Response time: Within 24-48 hours for standard inquiries
          <br /><br />
          General Support handles account access and authentication issues, platform functionality questions and technical troubleshooting, booking and transaction inquiries, general questions about our services and features, feedback on user experience and platform improvements, and issues with other users or content concerns (which may be escalated to Trust & Safety).
          <br /><br />
          If you contact General Support with a privacy-specific inquiry, our support team will route your message to the Privacy Office to ensure it receives appropriate specialized attention. You don't need to worry about contacting the "wrong" team—we'll make sure your inquiry reaches the right people.
          <br /><br />
          For urgent account security issues—such as suspected unauthorized access to your account, compromised credentials, or active security threats—please indicate "URGENT: Security Issue" in your subject line for expedited handling. We prioritize security-related support requests to minimize potential harm.
          <br /><br />
          <strong>3. Data Protection Officer - Specialized Privacy Oversight</strong><br />
          For specific privacy and data protection matters requiring specialized expertise, particularly those involving regulatory compliance, complex legal questions, or formal complaints, our Data Protection Officer (DPO) provides independent oversight and guidance.
          <br /><br />
          Email: <a href="mailto:dpo@amoriaconnekyt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>dpo@amoriaconnekyt.com</a>
          <br /><br />
          The DPO is available for GDPR-related inquiries from users in the European Economic Area, United Kingdom, or Switzerland, including questions about EU-specific rights, international data transfers, and adequacy safeguards. CCPA and state privacy law inquiries from California residents and users in other US states with comprehensive privacy laws. Formal privacy complaints when you believe your rights have been violated and initial responses haven't resolved your concerns. Complex cross-border privacy issues involving multiple jurisdictions or international data flows. Questions about our compliance with Rwanda's Data Protection and Privacy Law. Inquiries from regulatory authorities, including data protection supervisory authorities. And requests for information about our data protection impact assessments or privacy program governance.
          <br /><br />
          The DPO operates with independence within our organization, meaning they can provide objective assessments of our privacy practices without pressure to minimize concerns or avoid difficult conclusions. If you feel your privacy concerns haven't been adequately addressed through other channels, escalating to the DPO ensures independent review.
          <br /><br />
          <strong>4. Physical Address - Formal Correspondence</strong><br />
          For formal written correspondence, legal notices, or situations where physical mail is preferred or required, you can reach us at our registered business address:
          <br /><br />
          Amoria Global Ltd<br />
          Kigali, Rwanda<br />
          <br />
          Please note that physical mail takes longer to process than electronic communications. For time-sensitive matters, we recommend using email as your primary contact method and sending physical copies only when legally required or specifically preferred.
          <br /><br />
          <strong>5. Response Times and Escalation - What to Expect</strong><br />
          We're committed to responding to privacy inquiries promptly and thoroughly. Here's what you can expect when you contact us:
          <br /><br />
          Initial acknowledgment within 48 hours confirms we've received your inquiry, provides a reference number for tracking, and indicates expected response timeframe based on the nature of your request.
          <br /><br />
          Standard response times vary by inquiry type. General privacy questions typically receive responses within 5-7 business days. Formal rights requests (access, deletion, etc.) are completed within 30 days as required by law. Complex requests requiring investigation may take longer, with proactive communication about extensions. Urgent security matters receive expedited handling, often within 24 hours.
          <br /><br />
          If you're not satisfied with our initial response, escalation paths are available. You can request supervisory review by asking for your matter to be escalated to a privacy team supervisor. You can contact the DPO directly for independent assessment if you believe your concerns weren't adequately addressed. You can lodge complaints with supervisory authorities—we'll provide relevant contact information upon request. And you can seek legal remedies if you believe your rights have been violated and other resolution attempts have failed.
          <br /><br />
          <strong>6. Language and Accessibility - Communicating Effectively</strong><br />
          We want communication barriers to never prevent you from exercising your privacy rights or raising concerns. Our primary communication languages are English and French, reflecting Rwanda's linguistic environment and our international user base. If you need to communicate in another language, please let us know and we'll make reasonable efforts to accommodate your needs, potentially using translation services for important communications.
          <br /><br />
          If you have accessibility needs that affect how you communicate with us—such as requirements for large text, screen reader-compatible formats, or alternative communication methods—please inform us and we'll work to accommodate your needs.
          <br /><br />
          <strong>7. What Happens After You Contact Us - Our Process</strong><br />
          When you reach out with a privacy inquiry, here's what happens on our end:
          <br /><br />
          Your inquiry is logged and assigned a tracking reference so you can follow up efficiently and we can maintain records of our communications. We verify your identity when necessary to protect against unauthorized access to personal information—this is especially important for rights requests that involve accessing or modifying your data. Your inquiry is routed to the appropriate team member based on the nature of your request, ensuring specialized handling for complex matters. We investigate and gather information needed to respond thoroughly, which may involve consulting internal records, technical teams, or legal resources. We prepare and send our response, aiming for clarity and completeness while avoiding unnecessary legal jargon. We follow up if needed to ensure your inquiry has been fully resolved and you're satisfied with our response.
          <br /><br />
          We maintain records of privacy inquiries and our responses as part of our accountability practices. These records help us identify patterns that might indicate systemic issues, demonstrate compliance with regulatory requirements, improve our privacy practices based on the questions and concerns users raise, and ensure consistent handling of similar inquiries.
          <br /><br />
          <strong>Our Commitment to Accessible Privacy Communication:</strong><br />
          We take all privacy concerns seriously and will work diligently to address your issues. Your questions and concerns aren't inconveniences—they're opportunities for us to demonstrate our commitment to transparency and to improve how we serve our users. We'd rather hear about problems directly from you than have concerns go unaddressed. Whether your inquiry is a simple question or a complex complaint, we approach every communication with respect, attention, and genuine commitment to resolution. Don't hesitate to reach out—we're here to help.
        </div>
      )
    },
    // Divider between sections (this is just for visual separation in the navigation)
    { isDivider: true },
    // Trust & Safety Sections
    {
      id: 'trust-safety-overview',
      title: 'Trust & Safety Overview',
      content: `The Amoria Connekyt Trust & Safety Policy represents our comprehensive commitment to creating and maintaining a secure, respectful, and transparent environment for all users—photographers, videographers, creative professionals, and clients alike—across every aspect of our platform. This isn't merely a set of rules to be enforced; it's the foundation of the community we're building together, reflecting our belief that meaningful creative collaboration can only flourish when all participants feel safe, respected, and fairly treated.

In the creative services industry, trust is everything. Clients entrust photographers with capturing their most precious moments—weddings, family milestones, professional achievements, and personal stories that cannot be recreated. Photographers entrust clients with valuing their artistic expertise, respecting their time and creative vision, and fulfilling payment commitments. Both parties share sensitive personal information, engage in financial transactions, and collaborate intimately on projects that matter deeply to everyone involved. This trust cannot exist without robust safety measures, clear expectations, transparent processes, and meaningful accountability when things go wrong.

Our Trust & Safety framework addresses the full spectrum of risks and challenges that arise in online creative service marketplaces. We protect against fraud and financial abuse through verified identities, secure payment systems, and proactive monitoring. We prevent harassment, discrimination, and inappropriate behavior through clear community standards and responsive enforcement. We safeguard intellectual property and creative content through robust rights management and dispute resolution. We ensure fair treatment and professional conduct through transparent policies and balanced conflict resolution. And we maintain digital security through comprehensive technical safeguards protecting user data and platform integrity.

Our goal is to protect creativity at its core—enabling photographers and clients to focus on the art of capturing and preserving meaningful moments without worrying about scams, disputes, safety threats, or unfair treatment. We promote fairness across all interactions, ensuring that both service providers and clients are treated with equal respect and have access to equitable processes when issues arise. We ensure emotional and digital wellbeing for everyone who uses Amoria Connekyt, recognizing that creative work is deeply personal and that platform experiences can significantly impact users' mental health, professional reputations, and financial security.

SCOPE AND APPLICATION:
This Trust & Safety Policy applies comprehensively to all aspects of the Amoria Connekyt ecosystem, ensuring consistent protection and standards across every user interaction.

All registered users are covered by this policy, including Clients who book photography and creative services for personal, corporate, or special event needs, seeking professionals to capture and preserve their important moments. Creators encompassing photographers, videographers, and other creative professionals who offer their artistic services through our platform, building their businesses and serving clients. Organizers who coordinate events, manage group bookings, or facilitate creative projects involving multiple parties. And any other user types we may introduce as our platform evolves to serve the creative community.

All services and features fall within this policy's scope, including Bookings and service arrangements from initial inquiry through project completion and final delivery. Messaging and communications between users, whether related to active bookings, inquiries, or general platform interaction. File sharing and content delivery for portfolios, project deliverables, contracts, and other materials exchanged between users. Live sessions including virtual consultations, remote photo direction, or real-time collaboration features. Payments and financial transactions covering deposits, milestone payments, final payments, refunds, and disputes. Reviews and ratings that help build reputation and inform future booking decisions. And any additional features we develop to enhance the creative service experience.

All data and interactions taking place on or through the Amoria Connekyt platform are governed by this policy, whether accessed via our website, mobile applications, API integrations, or any other interface we provide. This includes actions taken directly on the platform as well as off-platform behavior that affects the Amoria Connekyt community or violates our standards.

WHY TRUST & SAFETY MATTERS:
At Amoria Connekyt, we believe that trust is the foundation of every creative collaboration. The relationship between a photographer and client is uniquely intimate—photographers are often present at the most significant moments of people's lives, granted access to private spaces and emotional experiences, and trusted to capture images that will be treasured for generations. This level of trust cannot be manufactured through marketing or mandated through contracts alone; it must be earned through consistent, reliable, and respectful behavior supported by platform systems that hold all parties accountable.

Whether you are a client seeking to preserve your story—a wedding day, a family reunion, a professional milestone, or a personal creative project—or a photographer capturing it and building your creative business, we are committed to maintaining a safe, transparent, and respectful community. Safety means protection from fraud, harassment, and harm. Transparency means clear expectations, honest communication, and understandable processes. Respect means treating every user—regardless of their role, experience level, or transaction size—with dignity and fairness.

Our Trust & Safety commitment extends beyond reactive enforcement of rules. We proactively design our platform to encourage positive behavior, make violations difficult, and resolve issues quickly when they occur. We invest in technology that detects problems before they escalate, support teams trained to handle sensitive situations with empathy and expertise, and processes that balance efficiency with fairness. We recognize that perfect safety is impossible, but we believe that continuous improvement, honest acknowledgment of challenges, and genuine commitment to user wellbeing can create a community where creativity thrives.

GUIDING PRINCIPLES:
Several core principles guide our Trust & Safety approach and inform every decision we make about policies, enforcement, and platform design.

Prevention over reaction—we design systems that make harmful behavior difficult rather than simply punishing it after the fact. Verified identities, secure payments, and clear guidelines reduce opportunities for bad actors to cause harm.

Proportional response—our enforcement actions match the severity of violations. Minor first-time issues receive education and warnings; serious or repeated violations result in stronger consequences up to permanent removal.

Due process and fairness—users accused of violations have opportunities to respond before final decisions are made. We investigate thoroughly, consider context, and explain our reasoning.

Transparency and clarity—our rules are published, explained, and consistently applied. Users know what's expected and what happens when expectations aren't met.

Continuous improvement—we learn from every incident, regularly review our policies and processes, and evolve our approach as new challenges emerge and best practices develop.

Human judgment supplementing technology—while we use automated systems to scale our safety efforts, human reviewers make final decisions on complex or consequential matters.

Our Commitment to the Creative Community:
This Trust & Safety Policy exists because we genuinely care about the people who use Amoria Connekyt. Photographers building their businesses and pursuing their artistic passions deserve a platform that protects their work, ensures fair payment, and connects them with respectful clients. Clients capturing life's precious moments deserve confidence that they're working with verified professionals who will deliver quality work and treat them fairly. Everyone deserves a digital environment free from harassment, fraud, and abuse. We take this responsibility seriously, and we invite every member of our community to help us build the safe, creative, and thriving platform we all want Amoria Connekyt to be.`
    },
    {
      id: 'commitment-safety',
      title: 'Our Commitment to Safety',
      content: `Safety isn't a feature we've added to Amoria Connekyt—it's woven into the fabric of everything we do. From the moment we began building this platform, we understood that creative professionals and their clients need more than just a marketplace for services; they need an environment where they can focus on their craft and their important moments without worrying about fraud, harassment, unfair treatment, or security threats. Our commitment to safety reflects our belief that the best creative work happens when people feel protected, respected, and confident that the platform supporting their collaboration has their best interests at heart.

This commitment manifests in every aspect of our platform: the technologies we deploy, the policies we enforce, the teams we train, the processes we design, and the culture we cultivate. We don't view safety as a cost center or compliance burden—we see it as a competitive advantage and moral imperative that distinguishes Amoria Connekyt as a platform where creativity can truly flourish.

CORE SAFETY COMMITMENTS:

1. Providing a Safe Digital Space for Both Creators and Clients
Every user who joins Amoria Connekyt—whether a photographer building their business or a client planning their wedding—deserves protection from the risks that plague online platforms. We're committed to creating an environment where harmful behavior is difficult, detected quickly, and addressed decisively.

For creators, this means protection from clients who might attempt to obtain services without proper payment, misuse delivered content, leave fraudulent negative reviews, or engage in harassment. Photographers invest significant time, creativity, and resources in their work; they deserve a platform that ensures fair compensation and professional treatment.

For clients, this means protection from photographers who might misrepresent their capabilities, fail to deliver promised services, deliver substandard work, or behave unprofessionally during sensitive events. Clients often book photography for once-in-a-lifetime moments that cannot be recreated; they deserve confidence that they're working with verified, accountable professionals.

For everyone, this means protection from scams, phishing attempts, identity theft, harassment, discrimination, and other harmful behaviors that can occur on online platforms. We implement technical safeguards, human moderation, and clear policies to minimize these risks and respond effectively when they occur.

2. Ensuring Transparency in Payments and Fair Treatment of All Parties
Financial transactions are often where trust breaks down on online platforms. Disputes over payment, delivery, and quality can poison what should be positive creative collaborations. We're committed to payment systems and processes that are transparent, fair, and protective of both parties' legitimate interests.

Our Hold & Release payment model protects both sides of every transaction. Clients pay upfront, ensuring photographers know they'll be compensated for accepted work. Payments are held securely until deliverables are provided and accepted, ensuring clients receive what they paid for before funds are released. Clear milestones and release conditions prevent misunderstandings about when payments become due.

Transparent pricing and fees mean no hidden charges or surprise deductions. Users know exactly what they'll pay or receive before committing to transactions. Platform fees are clearly disclosed, and the mathematics of every transaction are understandable and verifiable.

Fair dispute resolution provides balanced processes when disagreements occur. We don't automatically favor clients over creators or vice versa—we investigate facts, consider evidence, apply consistent standards, and reach fair outcomes. Both parties have opportunities to present their perspectives before decisions are made.

3. Protecting Users' Personal Data and Creative Content Through Encryption and Privacy Safeguards
Personal information and creative work are valuable assets that deserve robust protection. We implement comprehensive technical and organizational measures to safeguard both.

Data protection encompasses everything from the personal information you share during registration to the communications you exchange with other users. We encrypt data in transit and at rest, limit access to authorized personnel with legitimate need, implement strong authentication and access controls, and maintain security practices aligned with industry standards and regulatory requirements. Our privacy practices comply with Rwanda's Data Protection and Privacy Law No. 058/2021, GDPR, and other applicable frameworks.

Creative content protection recognizes that photographers' images and clients' personal photographs represent significant value—artistic, commercial, and sentimental. We implement access controls ensuring only authorized parties can view and download content. We provide tools for watermarking and protecting preview images. We prohibit unauthorized redistribution and take action against intellectual property violations. And we maintain secure delivery systems that protect content during transfer.

4. Promoting Mental Health and Emotional Respect Through Positive Communication
Creative work is deeply personal, and the interactions surrounding it can significantly impact emotional wellbeing. We're committed to fostering a community culture that supports positive mental health and treats all participants with emotional respect.

Professional communication standards require users to interact respectfully, constructively, and without harassment, discrimination, or intimidation. We prohibit hate speech, personal attacks, and behavior designed to demean or distress other users. Our community guidelines establish clear expectations for appropriate conduct.

Support for difficult situations recognizes that creative projects—especially those involving significant life events—can be emotionally charged. Weddings, family gatherings, and personal milestones carry emotional weight, and disappointments or disputes in these contexts can be particularly distressing. Our support teams are trained to handle sensitive situations with empathy, patience, and understanding.

Constructive feedback mechanisms encourage honest reviews and improvement-focused communication rather than destructive criticism or personal attacks. We want users to share genuine experiences while maintaining respect for everyone's dignity and professional reputation.

HOW WE DELIVER ON THESE COMMITMENTS:

Amoria Connekyt is built on integrity, professionalism, and care. These aren't just values we espouse—they're principles embedded in our operational practices. We actively monitor, verify, and protect the experience of every user on our platform through comprehensive systems and dedicated teams.

Verified User and Photographer Onboarding with KYC Processes
Trust begins with knowing who you're dealing with. Our Know Your Customer (KYC) verification processes ensure that users are who they claim to be, reducing opportunities for fraud, impersonation, and abuse.

For photographers and creative professionals, verification includes identity document validation confirming legal identity, professional credential verification where applicable, portfolio review ensuring authentic representation of capabilities, contact information verification enabling reliable communication, and background screening for professionals working in sensitive contexts. Verified photographers display trust badges that help clients identify accountable professionals.

For clients, verification includes identity confirmation preventing fake accounts, contact verification ensuring reachability for booking communications, and payment method validation enabling secure transactions.

Our verification processes balance thoroughness with user experience—we want robust trust signals without creating unnecessary friction for legitimate users joining the platform.

Secure Payment and Content Delivery Systems (Hold & Release Model)
Our payment infrastructure is designed to protect both parties while facilitating smooth transactions.

The Hold & Release model works as follows: clients submit payment when booking is confirmed, funds are held securely in escrow (not released to photographers immediately), photographers complete work and deliver through our platform, clients review deliverables and confirm satisfaction, and upon confirmation (or after reasonable review period), funds are released to photographers. This model protects clients from paying for undelivered work while ensuring photographers are compensated for completed projects.

Secure payment processing uses PCI-compliant payment providers, encrypted transaction data, fraud detection systems, and multiple payment method support accommodating user preferences across regions.

Content delivery systems ensure that creative work is transferred securely, with access controls preventing unauthorized viewing, download tracking maintaining accountability, and delivery confirmation documenting successful transfer.

Active Moderation and User Support for Conflict Resolution
Technology alone cannot ensure safety—human judgment is essential for complex situations. We maintain dedicated teams for moderation, support, and dispute resolution.

Content moderation reviews reported content and communications for policy violations. We use a combination of automated detection for obvious violations and human review for nuanced situations. Moderators are trained to apply policies consistently while considering context.

User support provides assistance with platform usage, answers questions, addresses concerns, and escalates issues requiring specialized attention. Support is available through multiple channels with response time targets ensuring timely assistance.

Conflict resolution handles disputes between users—disagreements over service quality, payment, delivery, reviews, or other matters. Our dispute resolution process gathers information from all parties, investigates facts objectively, applies consistent standards, and reaches fair outcomes. We aim to resolve disputes efficiently while ensuring thoroughness.

Strict Data Protection Aligned with Rwanda's Data Protection and Privacy Law No. 058/2021
Legal compliance is the floor, not the ceiling, of our data protection commitment. We comply fully with Rwanda's comprehensive data protection framework while implementing additional safeguards that exceed minimum requirements.

Our data protection program includes documented policies and procedures governing data handling, designated personnel responsible for privacy compliance, regular training ensuring all team members understand their obligations, technical measures implementing privacy by design principles, incident response procedures for potential data breaches, and regular audits verifying compliance and identifying improvement opportunities.

We also comply with international standards including GDPR for European users, providing consistent high-quality data protection regardless of user location.

Compliance with AML/CTF Regulations and International Standards
As a platform facilitating financial transactions, we take seriously our obligations to prevent money laundering, terrorist financing, and other financial crimes. Our compliance program aligns with Rwanda's Law No. 69/2018 on Prevention and Punishment of Money Laundering and Terrorist Financing.

AML/CTF measures include customer due diligence verifying user identities, transaction monitoring detecting suspicious patterns, reporting obligations to relevant authorities when required, record-keeping maintaining required documentation, and ongoing training ensuring staff understand compliance requirements.

These measures protect not only regulatory compliance but also platform integrity—financial crime prevention helps ensure that Amoria Connekyt remains a legitimate marketplace serving genuine creative professionals and clients.

Our Commitment in Action:
Safety commitments are meaningful only when they translate into real-world protection. We measure our success not by the policies we've written but by the experiences of our users. We track safety metrics, investigate every serious incident, learn from failures, and continuously improve our systems and processes. When we fall short—and we recognize that no platform achieves perfect safety—we acknowledge problems honestly, take responsibility, and work to prevent recurrence. Our commitment to safety is ongoing, evolving, and central to everything Amoria Connekyt aspires to be.`
    },
    {
      id: 'verification-authenticity',
      title: 'User Responsibilities',
      content: `A safe, trustworthy, and thriving creative community requires active participation from every member. While Amoria Connekyt provides the infrastructure, policies, and support systems that enable trust, the daily reality of our platform is shaped by the choices and behaviors of our users. Every photographer who delivers excellent work on time, every client who communicates clearly and pays fairly, every user who treats others with respect—these individual actions collectively create the community we all want to be part of.

User responsibilities aren't arbitrary rules imposed from above; they're the shared commitments that make Amoria Connekyt work for everyone. When users fulfill these responsibilities, photographers can build sustainable businesses, clients can capture their important moments with confidence, and the platform can continue investing in features and protections that benefit the entire community. When users neglect these responsibilities, trust erodes, disputes increase, and the collaborative spirit that makes creative work meaningful suffers.

This section outlines what we expect from every user of Amoria Connekyt. These aren't suggestions or aspirational guidelines—they're requirements for participation in our community. Users who consistently meet these standards help build something valuable; users who violate them risk losing access to the platform and the opportunities it provides.

1. Registration and Information - The Foundation of Trust
Accurate information is the bedrock of trust on any platform. When users provide false, misleading, or incomplete information, they undermine the verification systems that protect everyone and create risks that ripple throughout the community.

Provide accurate information during registration and bookings. This means using your real legal name (or legitimate business name), providing genuine contact information, accurately representing your location, and truthfully describing your services, experience, and capabilities. For photographers, this includes honest portfolio representation—showing work you actually created, not images from other photographers or stock sources. For clients, this includes accurate event details, realistic expectations, and truthful descriptions of project requirements.

Misrepresentation isn't just a policy violation—it's a form of fraud that harms other users. A photographer who exaggerates their experience may secure bookings they can't fulfill properly. A client who misrepresents project scope may receive quotes that don't reflect actual requirements. These misrepresentations waste time, create disappointments, and damage trust that's difficult to rebuild.

Maintain up-to-date contact and profile information throughout your time on the platform. If your phone number changes, update it. If you relocate, reflect that in your profile. If your service offerings evolve, keep your listings current. Outdated information creates friction—missed communications, booking confusion, and frustrated users who can't reach you when they need to.

Complete identity verification (KYC) when required promptly and honestly. Verification protects you as much as it protects others. Verified users are more trustworthy in the eyes of potential clients or service providers, have access to features unavailable to unverified accounts, and benefit from the accountability systems that require knowing who participants are. Attempting to circumvent verification or providing fraudulent documents is grounds for immediate permanent removal from the platform.

Keep account credentials secure and confidential. Your account is your responsibility. Use strong, unique passwords. Enable two-factor authentication when available. Never share your login credentials with others—not friends, not family, not anyone claiming to be from Amoria Connekyt support. If you suspect your account has been compromised, contact us immediately. You are responsible for actions taken through your account, so protecting access protects you.

2. Professional Communication - Respect in Every Interaction
How users communicate with each other defines the character of our community. Professional, respectful communication creates an environment where creativity flourishes; hostile, disrespectful communication drives away talented professionals and discerning clients alike.

Communicate respectfully and avoid harassment, discrimination, or hate speech in all interactions. This applies to booking inquiries, project discussions, feedback exchanges, review content, and any other communication on or related to the platform. Respect means addressing others politely, considering how your words will be received, and maintaining professional tone even when frustrated or disappointed.

Harassment includes repeated unwanted contact, threatening language, intimidation tactics, sexually inappropriate messages, stalking behavior, and any communication designed to frighten, demean, or distress another user. Harassment is never acceptable, regardless of provocation or context.

Discrimination based on race, ethnicity, nationality, religion, gender, sexual orientation, age, disability, or any other protected characteristic violates our community standards and, in many jurisdictions, the law. Every user deserves equal treatment based on their professional qualifications and conduct, not their personal characteristics.

Hate speech—content that attacks, demeans, or incites violence against individuals or groups based on protected characteristics—has no place on Amoria Connekyt. This includes slurs, dehumanizing language, calls for exclusion or harm, and content promoting hateful ideologies.

Treat all users with dignity and professionalism regardless of transaction size, user tenure, or any other factor. The client booking a small portrait session deserves the same respect as the corporate client booking a major event. The new photographer just starting out deserves the same courtesy as the established professional with hundreds of bookings. Professional dignity is universal, not earned through status.

Respond promptly to messages and requests within reasonable timeframes. While we understand that users have lives outside the platform, timely communication is essential for successful collaborations. Photographers should respond to booking inquiries within 24-48 hours. Clients should provide feedback on deliverables within agreed timeframes. Both parties should communicate proactively about delays, changes, or issues rather than leaving others wondering.

Maintain positive and constructive interactions even when things go wrong. Projects sometimes face challenges—schedule conflicts, creative disagreements, quality concerns, or unforeseen circumstances. How users handle these challenges matters as much as how they handle smooth transactions. Approach problems with solution-oriented mindsets, express concerns constructively, and seek resolution rather than escalation.

3. Service Delivery and Integrity - Honoring Commitments
The core purpose of Amoria Connekyt is facilitating successful creative service transactions. This requires both parties to approach their commitments with integrity, professionalism, and genuine intent to fulfill their obligations.

Deliver or receive services with integrity and professionalism. For photographers and creators, this means providing work that meets or exceeds the quality represented in your portfolio and promised in your communications. It means showing up prepared, treating clients' events and projects with appropriate seriousness, and applying your skills conscientiously. For clients, this means providing accurate project information, being available and cooperative during sessions, and approaching the creative process as a collaboration.

Honor commitments and agreed terms without exception unless circumstances make fulfillment genuinely impossible. When you commit to a delivery date, meet it. When you agree to specific inclusions, provide them. When you confirm a booking, honor it. If you must deviate from commitments, communicate immediately, explain honestly, and work collaboratively to find solutions. Broken commitments without adequate explanation or remedy damage your reputation and harm users who relied on your word.

Complete projects according to specifications agreed upon at booking. This means understanding what was promised, tracking deliverables throughout the project, and ensuring final delivery matches expectations. If specifications change mid-project—which sometimes happens legitimately—document the changes with explicit agreement from both parties before proceeding.

Act in good faith during all transactions. Good faith means honest dealing, reasonable interpretation of ambiguous terms, genuine effort to fulfill obligations, and cooperative approach to resolving issues. Bad faith—attempting to exploit loopholes, deliberately misunderstanding terms, or gaming systems for unfair advantage—violates the spirit of our community even when it doesn't technically break specific rules.

4. Platform Compliance - Using Amoria Connekyt Properly
Our platform systems exist to protect users, facilitate transactions, and maintain the trust infrastructure that makes the marketplace function. Circumventing these systems undermines protections for everyone.

Refrain from sharing personal payment details or attempting to bypass the platform for transactions that originated on Amoria Connekyt. When you take transactions off-platform, you lose the protections our systems provide—escrow security, dispute resolution, payment guarantees, and documented transaction history. You also violate the terms that make the platform sustainable—we rely on transaction fees to fund the services, support, and safety measures that benefit all users.

We understand the temptation to avoid fees by transacting directly, but consider the risks: no payment protection if things go wrong, no dispute resolution support, no verified transaction history for future reference, and potential account termination if discovered. The platform protections are worth the fees, and violating this policy isn't worth the consequences.

Use Amoria Connekyt's payment system for all transactions conducted through the platform. This isn't just a business requirement—it's a safety measure. Our payment systems provide fraud protection, escrow security, dispute resolution, and financial accountability that direct payments can't match. For photographers, platform payments ensure you're dealing with serious clients with verified payment methods. For clients, platform payments ensure your money is protected until work is delivered.

Follow platform guidelines and community standards as published and updated. Our policies exist for reasons—usually because we've seen the problems that occur without them. When we prohibit certain behaviors, it's because those behaviors have harmed users in the past. When we require certain processes, it's because those processes prevent common issues. Compliance isn't just rule-following; it's participating in systems designed to protect you.

Respect intellectual property and privacy laws both on and off the platform. Don't use others' creative work without permission. Don't share private information about other users. Don't violate copyright, trademark, or other intellectual property rights. Don't collect or use data in ways that violate privacy laws or platform policies. These aren't just legal requirements—they're ethical obligations that creative professionals especially should understand and honor.

5. Content Standards - What You Share Matters
The content users upload, share, and create on Amoria Connekyt shapes the platform experience for everyone. Content standards ensure that what users encounter is appropriate, legal, and consistent with the professional creative community we're building.

Upload only original content or properly licensed materials to your portfolio, project deliverables, and other platform areas. For photographers, this means showing work you actually created. Using others' images in your portfolio is fraud—it misrepresents your capabilities to potential clients. If you collaborate with other creatives, credit them appropriately and obtain permission before displaying collaborative work.

For all users, respect licensing restrictions on any materials you use. Stock images, music, graphics, and other licensed content come with usage restrictions that must be honored. Violating licenses exposes you to legal liability and reflects poorly on the professional standards of our community.

Respect copyright and creative ownership in all your platform activities. Photographers retain copyright to their work unless explicitly transferred. Clients receive usage rights as agreed in their contracts. Neither party should exceed the rights they've been granted—photographers shouldn't use client-specific images in ways that weren't authorized, and clients shouldn't reproduce or distribute images beyond agreed terms.

Do not share inappropriate, illegal, or harmful content on the platform. This includes content that is sexually explicit or pornographic (unless specifically permitted in designated adult sections, which currently don't exist on our platform), violent, gory, or depicting harm to humans or animals, promoting illegal activities or providing instructions for illegal acts, harassing, threatening, or designed to harm specific individuals, fraudulent, deceptive, or designed to mislead users, malicious content including malware, phishing attempts, or security threats, or spam, excessive self-promotion, or content that degrades platform usability.

Report violations through proper channels when you encounter content or behavior that violates our standards. The "Report" feature is available throughout the platform for flagging concerns. For serious or urgent issues, contact our Trust & Safety team directly. Reporting isn't "snitching"—it's community stewardship that helps keep the platform safe for everyone.

CONSEQUENCES OF VIOLATIONS:
We don't publish these responsibilities to ignore them. Violations have real consequences, proportional to severity and frequency.

Minor first-time violations typically result in warnings, education about correct behavior, and opportunities to remedy the situation. We recognize that people make mistakes and deserve chances to improve.

Repeated violations or more serious first offenses may result in temporary suspension—loss of platform access for a defined period while we investigate and while you demonstrate understanding of the violated policies.

Severe violations or patterns of problematic behavior may result in permanent removal from the platform. This includes fraud, harassment, discrimination, safety threats, repeated policy violations after warnings, and any behavior that makes the platform unsafe for others.

Violations involving illegal activity may be reported to law enforcement in addition to platform consequences. We cooperate with legal authorities investigating crimes committed through or related to our platform.

Our goal isn't punishment for its own sake—it's maintaining a community where users can trust each other and focus on creative collaboration. Users who demonstrate through their actions that they can't or won't participate constructively lose the privilege of access to our community and the opportunities it provides.

Your Role in Building This Community:
These responsibilities might seem extensive, but they reflect something simple: treating others as you'd want to be treated, fulfilling your commitments, and participating honestly in a community built on trust. Most users meet these standards naturally because they're fundamentally decent people who understand that creative collaboration requires mutual respect and reliability. For those users, these policies are just documentation of what they already do. For everyone, they're the foundation of the trusted creative marketplace we're building together.`
    },
    {
      id: 'secure-transactions',
      title: 'Safety Measures',
      content: `Amoria Connekyt implements comprehensive, multi-layered safety measures designed to protect all users from fraud, abuse, and security threats. Our approach combines advanced technology, human oversight, and proven security practices to create a trusted environment where creativity can flourish.

1. Identity Verification (KYC)
Identity verification is the foundation of trust on our platform. Before users can access key features—especially financial transactions—they must complete our Know Your Customer (KYC) verification process. This isn't merely bureaucratic requirement; it's a critical security measure that protects everyone in our community from fraud, identity theft, money laundering, and other financial crimes.

For individual users, verification requires providing valid, government-issued identification such as a national ID card, international passport, or driving license. We examine these documents carefully, checking for authenticity markers, expiration dates, photo consistency, and data accuracy. Businesses seeking to operate on our platform must provide additional documentation including business registration certificates, Tax Identification Number (TIN) certificates, and proof of physical business address. This extra scrutiny ensures that business accounts are legitimate operations, not fronts for fraudulent activities.

Your identity documents are cross-checked using secure verification systems and trusted third-party verification partners who specialize in document authentication and fraud detection. These partners use advanced techniques including optical character recognition (OCR), biometric analysis, document forensics, and database cross-referencing to validate submitted documents. The entire verification process is conducted over encrypted connections, and your documents are stored securely with access limited to authorized verification personnel only.

Creators cannot receive any payouts until their identity is fully verified. This requirement protects clients from fake profiles, ensures proper tax reporting, creates accountability for service quality, and enables effective dispute resolution when needed. While we understand verification can feel intrusive, it's essential for maintaining the high trust standards that make Amoria Connekyt a safe platform for both clients and creators.

2. Secure Payments
Financial security is non-negotiable at Amoria Connekyt. Every payment transaction is processed through our licensed, regulated payment gateway partners: Pesapal, Flutterwave, and JengaPay. These aren't just any payment processors—they're industry leaders chosen for their exceptional security credentials, regulatory compliance, and proven reliability in handling millions of transactions across Africa and beyond.

Our innovative Hold & Release payment system provides unprecedented protection for both parties. When a client makes a payment, 50% is immediately placed in a secure escrow account where it cannot be accessed by the creator, the client, or even Amoria Connekyt until specific conditions are met. This escrow arrangement ensures clients don't lose money to creators who fail to deliver, while simultaneously guaranteeing creators that funds are secured and awaiting them upon successful project completion.

The remaining 50% is released only after clients confirm their satisfaction with the delivered work. This two-stage release mechanism balances the interests of both parties fairly. All payment transactions are encrypted using SSL/TLS protocols during transmission and are processed through PCI DSS Level 1 compliant systems—the highest security standard in the payment industry. We never store complete credit card numbers, CVV codes, or other sensitive payment credentials on our servers, minimizing the risk of data breaches affecting your financial information.

Refunds, when necessary, are handled fairly and transparently according to our published policies. Our support team reviews refund requests objectively, considering evidence from both parties, and processes approved refunds typically within 7-14 business days back to the original payment method.

3. Data Protection
Your personal data, creative work, and transaction history deserve the highest levels of protection, and we deliver precisely that. All data stored on our systems is encrypted both in transit (when moving between your device and our servers) and at rest (when stored on our servers). We use industry-standard encryption algorithms that would take centuries to crack using current technology, ensuring your information remains secure even in the unlikely event of unauthorized access to our storage systems.

We comply fully with Rwanda's Data Protection and Privacy Law (No. 058/2021), which grants you specific rights regarding your personal information and imposes strict obligations on how we collect, process, store, and share your data. For international users, we also comply with GDPR requirements and other applicable privacy regulations. Your data may be stored within Rwanda or in other jurisdictions offering equivalent or superior data-protection standards, including the European Union, Kenya, and South Africa. All storage locations are selected based on their legal protections, physical security, and technical capabilities.

Every communication on our platform—messages between users, support conversations, booking details—is transmitted over SSL/TLS encrypted connections. This means that even if someone intercepts the data transmission, they cannot read its contents. We conduct regular security audits performed by independent third-party security experts who probe our systems for vulnerabilities, test our incident response procedures, and verify compliance with international security standards including ISO 27001 (Information Security Management) and ISO 27701 (Privacy Information Management).

4. Moderation & Monitoring
Trust and safety require constant vigilance. Our platform actively monitors all activity for signs of fraudulent behavior, impersonation attempts, harmful content, and policy violations. We employ a hybrid approach that combines automated threat detection systems with experienced human moderators, leveraging the speed and pattern-recognition capabilities of technology while maintaining the nuanced judgment that only humans can provide.

Our automated systems use machine learning algorithms trained on millions of data points to identify suspicious patterns such as unusual transaction sequences, multiple accounts from the same device, sudden changes in user behavior, messaging that contains scam indicators, and content that violates our community guidelines. When the system flags potentially problematic activity, it's escalated to our Trust & Safety team for manual review.

Our human moderators are trained professionals who understand the creative industry, cultural contexts, and the balance between protecting users and respecting legitimate diverse perspectives. They review flagged content and accounts, investigate reported incidents, make enforcement decisions based on our policies, and provide feedback to improve our automated detection systems. This combination of technology and human oversight enables us to respond quickly to threats while minimizing false positives that could unfairly impact innocent users.

5. Emergency Support
We recognize that safety concerns can't always wait for standard business-hour responses. When you encounter threats, fraud attempts, harassment, or other serious safety issues, you need immediate support. Our emergency reporting systems are designed for rapid response to protect you and prevent harm to others.

You can report urgent safety concerns through multiple channels including our in-app "Trust & Safety" form accessible from any page, direct email to support@amoriaconnect.com for general safety issues, or legal@amoriaglobal.com for serious violations requiring legal attention. When you submit an urgent report, it's prioritized for review within 72 hours—often much faster for high-severity issues involving imminent threats, active fraud, or ongoing harassment.

We maintain 24/7 monitoring for critical issues including active security breaches, payment fraud in progress, threats of violence or self-harm, and child safety concerns. While not all issues require immediate action, having round-the-clock monitoring ensures that truly urgent situations receive appropriate attention regardless of when they occur. Our goal is not just reactive response but proactive protection—identifying and addressing threats before they can cause harm to our community members.`
    },
    {
      id: 'content-safety-ip',
      title: 'Content Protection',
      content: `Content protection is fundamental to creative industries. The photographs, videos, and other media created through Amoria Connekyt represent significant artistic effort, technical skill, and personal moments that deserve robust protection. Our content protection policies clearly define ownership rights, usage permissions, and enforcement mechanisms that respect both creators' intellectual property and clients' interests in commissioned works.

Understanding content ownership and usage rights prevents disputes, ensures fair treatment of creative professionals, and protects clients' investments in photography and videography services. Below is a comprehensive explanation of how we protect content on our platform.

1. Creator Ownership and Copyright Protection
Creative works are intellectual property protected by copyright law from the moment of creation. Creators—photographers and videographers—retain full ownership of their photos, videos, and creative works produced through Amoria Connekyt. This ownership means you hold the copyright in your original creative expression, granting you exclusive rights to reproduce, distribute, display, create derivative works, and license your creations to others.

Photographers and videographers own the content they create even when commissioned by clients. This is the standard arrangement in the creative industry unless specifically negotiated otherwise through "work-for-hire" agreements or full buyouts (which command significantly higher fees). Your ownership applies to both the final edited images/videos delivered to clients and the raw unedited files, outtakes, and other materials created during shoots.

Creators maintain the right to display work in portfolios with client consent. While you own the copyright, professional ethics and contractual obligations typically require client permission before publicly displaying commissioned work. You should obtain written permission before adding client projects to your portfolio, posting to social media for promotional purposes, entering into competitions or exhibitions, or selling as stock photography or art prints. Respect for client privacy builds trust and professional reputation.

Your creative ownership is protected through Rwanda's intellectual property laws, international copyright conventions including the Berne Convention, platform policies that respect and enforce creator rights, and mechanisms for reporting and addressing copyright infringement.

2. Client Rights and Usage Licenses
When clients commission photography or videography through Amoria Connekyt, they don't typically receive copyright ownership—instead, they receive usage rights as specified in service agreements negotiated with creators. Understanding this distinction is essential for both clients and creators.

Clients retain ownership of their photos and videos in the sense that they can use the delivered works according to agreed terms, though the underlying copyright usually remains with the creator unless a full buyout is negotiated. Usage rights depend entirely on the specific contract established between client and creator at the time of booking. Common arrangements include personal use only where clients can display, share, and enjoy images for personal purposes (family albums, personal social media, home décor) but cannot use them commercially; limited commercial use specifying particular commercial applications (website images, specific advertising campaign, social media marketing) with defined scope and duration; broad commercial licenses granting extensive rights while creator retains copyright; or full buyouts/work-for-hire where clients purchase complete copyright ownership and unlimited usage rights (very expensive, typically reserved for major commercial projects).

Clients receive content according to agreed terms including the specific deliverables (number of edited images, video length and format), delivery timeline and method, file formats and resolution, and any usage restrictions or attribution requirements. Service agreements should clearly document these terms to prevent misunderstandings. Clients should review and understand their usage rights before using images commercially, redistributing to third parties, creating derivative works, or licensing to others.

3. Platform License and Our Commitments
When creators upload content to Amoria Connekyt or clients receive deliverables through our platform, certain limited licenses are necessary for platform operation. However, we're committed to respecting ownership and never overreaching.

Amoria Connekyt will never share or sell user content without explicit consent. Your photos, videos, and creative works are yours—we don't claim ownership, we don't sell them to stock agencies, we don't use them in ways you haven't approved, and we don't share them with third parties except as necessary for platform operation (like cloud storage providers bound by strict confidentiality).

We require a limited license for operational and promotional purposes only, and only with appropriate consent. For operational purposes, you grant us permission to host and store content on secure servers, display portfolio images to potential clients browsing the platform, optimize files for web performance (resizing, compression, format conversion), back up content for disaster recovery, and transmit files during delivery to clients. For promotional purposes with your explicit consent, we may feature your work in platform marketing materials (social media, website banners, advertisements), showcase successful projects in case studies or testimonials, include images in press releases or media coverage, or use content in educational materials about platform use.

The platform does not claim ownership of user content. You retain full copyright and all ownership rights. Our license is non-exclusive (you can use content anywhere else), limited in scope (only for specified purposes), and revocable (terminates when you delete content or close your account, subject to legal retention requirements).

4. Unauthorized Sharing Prohibited - Protecting Everyone's Rights
Unauthorized use of creative content harms creators financially and professionally while potentially violating clients' privacy and contractual rights. Amoria Connekyt strictly prohibits any unauthorized sharing, resale, or misuse of client or photographer content.

Do not redistribute or misuse creative works beyond your authorized rights. For creators, this means not using client-commissioned work beyond agreed portfolio/promotional use without additional permission, not reselling client images to stock agencies or third parties without consent, and not using commissioned work in ways that violate client privacy or confidentiality. For clients, this means not using images beyond licensed scope (using personal-use images commercially), not redistributing images to others who don't have usage rights, not removing creator watermarks, copyright notices, or metadata, and not reselling or sublicensing content to third parties.

Respect intellectual property rights of all parties involved. Creators' copyright ownership must be honored even by clients who commissioned and paid for work. Clients' usage rights must be respected by creators who retain copyright. Third-party intellectual property (music, graphics, fonts used in creative works) must be properly licensed. Platform terms and content policies must be followed by all users.

Violations can result in serious consequences including account warnings or suspension, removal of infringing content, legal action by copyright holders (potential statutory damages, attorney fees), loss of payment privileges or earnings, and permanent account termination for repeated violations.

5. Copyright Disputes and Takedown Policy
Despite our best efforts to prevent infringement, disputes occasionally arise about content ownership, usage rights, or unauthorized use. We maintain clear, fair processes for addressing copyright concerns.

We respond promptly to any copyright or privacy complaints under Rwanda's data and intellectual property laws, GDPR and international privacy regulations, DMCA and international copyright frameworks, and platform policies protecting user content. Copyright holders can report suspected infringement by submitting detailed takedown notices to legal@amoriaglobal.com including identification of the copyrighted work allegedly infringed, identification of the infringing material on our platform (URLs, usernames, specific content), contact information and authorization to act on behalf of copyright owner, good-faith statement that use is unauthorized, statement of accuracy and ownership authorization, and physical or electronic signature.

In case of copyright disputes, Amoria Connekyt will mediate fairly between parties involved by reviewing evidence from both copyright claimant and accused infringer, assessing ownership documentation and usage agreements, considering context and intent, facilitating communication and potential resolution, and making enforcement decisions based on evidence and policies. Our mediation is impartial—we don't automatically favor creators or clients but objectively evaluate each dispute.

Infringing materials are removed immediately upon confirmation of valid copyright claims. When takedown notices meet legal requirements and appear valid, we remove or disable access to allegedly infringing content typically within 24-48 hours, notify the user who posted content of the removal and the claim, provide opportunity for counter-notice if user believes removal was mistaken, and document all copyright claims and responses for legal compliance.

Users may submit counter-notices if they believe content was wrongfully removed, asserting they have rights to use the content, the copyright claim was mistaken or improper, or removal violated their legitimate rights. We forward counter-notices to original complainants, who may pursue legal action or allow content restoration.

Report violations through proper channels including in-platform "Report" buttons on content, profiles, or portfolios; email to legal@amoriaglobal.com for copyright infringement; email to privacy@amoriaglobal.com for privacy violations related to content; or our Trust & Safety contact form for other content policy violations. Provide detailed information to facilitate prompt investigation and resolution.

Our Commitment to Content Protection:
Creative work is valuable intellectual property deserving robust protection. We're committed to maintaining a platform where creators' rights are respected, clients' investments are protected, and all content is used ethically and legally. By clearly defining ownership, requiring proper licensing, and enforcing content policies fairly, we build a creative marketplace based on respect, trust, and legal compliance.`
    },
    {
      id: 'respectful-behavior',
      title: 'Mental Health and Emotional Wellbeing',
      content: `Safety isn't just about preventing fraud, protecting data, or securing payments—it's also about creating an environment where people feel emotionally safe, respected, and supported. We believe that true safety extends beyond technology and legal compliance to encompass emotional security, mental wellbeing, and the quality of human interactions on our platform.

Creative professionals and clients alike deserve to engage in collaborations that are not only productive but also emotionally healthy. Photography and videography often involve intimate moments, personal celebrations, and vulnerable situations. The relationships formed through these services should be characterized by respect, empathy, professionalism, and mutual support—not stress, pressure, or negative experiences that harm mental health.

Our commitment to mental health and emotional wellbeing reflects our understanding that platform success isn't measured solely by transaction volume or revenue—it's measured by the quality of experiences we facilitate and the wellbeing of the people in our community.

What Amoria Connekyt Encourages - Building Positive Interactions

We actively encourage and promote behaviors and attitudes that contribute to emotional wellbeing and positive community culture.

Respectful collaboration and empathy in communication form the foundation of healthy professional relationships. When you communicate with other users—whether discussing project details, negotiating terms, providing feedback, or resolving issues—approach conversations with empathy and respect. Remember that behind every profile is a real person with feelings, pressures, and challenges. Empathetic communication means listening to understand, not just to respond; considering how your words might be received; acknowledging others' perspectives even when you disagree; and treating people how you'd want to be treated in similar situations.

Professional and supportive interactions maintain appropriate boundaries while still being warm and human. Professionalism doesn't mean being cold or distant—it means being reliable, respectful, competent, and ethical in all dealings. Support means offering encouragement, being flexible when genuine challenges arise, celebrating others' successes, and helping fellow community members when appropriate. The photographers and videographers on our platform are creative professionals who deserve to be treated with the same respect as any other professional service provider.

Positive feedback and constructive criticism help everyone grow and improve. When providing feedback on work, focus on being constructive rather than merely critical. Identify specific aspects that work well and those that could be improved. Explain why certain elements don't meet your expectations rather than making vague complaints. Offer solutions or suggestions for improvement where appropriate. And balance criticism with recognition of effort and positive elements. Destructive criticism that attacks the person rather than addressing the work harms emotional wellbeing and creates hostile environments.

Understanding and flexibility during challenges recognize that life doesn't always go according to plan. Unexpected situations arise—illness, family emergencies, technical problems, weather disruptions, or other unforeseen circumstances. When collaborators face genuine challenges, respond with understanding rather than immediate anger or threats. Flexibility in rescheduling, adjusting timelines, or adapting to changed circumstances demonstrates emotional maturity and builds goodwill. Of course, understanding has limits—repeated unreliability or pattern of excuses aren't acceptable—but genuine empathy for occasional difficulties benefits everyone.

Zero Tolerance Policies - Protecting Emotional Safety

While we encourage positive behaviors, we must also enforce clear boundaries against behaviors that harm emotional wellbeing and create unsafe environments.

Harassment, discrimination, or offensive conduct will not be tolerated under any circumstances. Harassment includes unwelcome contact or communication after being asked to stop, persistent negative behavior targeting specific individuals, threats or intimidation, sexual harassment or unwanted advances, and cyberbullying or coordinated harassment. Discrimination based on protected characteristics (race, gender, religion, disability, sexual orientation, age, national origin, etc.) violates both our policies and fundamental human dignity. Offensive conduct including hate speech, slurs, derogatory comments, or deliberately provocative behavior designed to upset others is strictly prohibited.

No pressure, emotional manipulation, or coercion is acceptable in any business dealing or personal interaction on our platform. Emotional manipulation includes guilt-tripping to extract concessions ("If you really cared about your reputation, you'd do this for free"), using fear or threats to influence decisions ("I'll leave a terrible review unless you give me a refund"), exploiting power dynamics or vulnerability, creating artificial urgency or pressure to prevent thoughtful decision-making, or gaslighting—making people question their own perceptions or memory. Professional disagreements are natural, but manipulation crosses the line into emotional abuse.

Users may not request or share inappropriate, explicit, or illegal content. Our platform facilitates professional photography and videography services—not venues for sexual content, exploitation, or illegal materials. Requesting or sharing sexually explicit content, content involving minors in inappropriate contexts, graphic violence or disturbing imagery for shock value, or illegal content (pirated materials, stolen content, content facilitating crimes) results in immediate account termination and potential reporting to law enforcement.

Any form of fraud, impersonation, or exploitation will lead to account suspension or permanent removal. Beyond financial fraud, exploitation includes emotional exploitation (manipulating vulnerable users for personal gain), exploiting personal information or private moments, impersonating others to gain trust or access, catfishing or creating fake personas to deceive others, or any behavior that takes unfair advantage of others' trust, vulnerability, or inexperience.

Support for Creators - Addressing Unique Challenges

Creative professionals face unique pressures and challenges that can affect mental health and emotional wellbeing. We recognize these challenges and provide support systems.

Support for creators managing digital burnout or work stress acknowledges that running a creative business can be exhausting. Constant client acquisition, project management, creative demands, technical skill development, business administration, and financial pressures accumulate into significant stress. Digital burnout—exhaustion from constant online presence, social media marketing, message responses, and portfolio updates—is increasingly common. We support healthy boundaries by not penalizing slower response times during off-hours, encouraging sustainable booking schedules rather than constant overwork, and providing resources about work-life balance and business sustainability.

Access to wellness resources and community connections helps creators feel less isolated. Creative entrepreneurship can be lonely—many photographers and videographers work independently without colleagues for support, advice, or camaraderie. We facilitate community connections through creator forums and discussion groups, mentorship programs pairing experienced creators with newcomers, networking events and collaborative opportunities, and sharing wellness resources including articles, guides, and links to mental health services when appropriate.

Encouragement for healthy work-life balance reminds creators that their worth isn't determined solely by productivity or earnings. It's okay to take breaks, turn down projects that don't align with your values or capacity, set boundaries with demanding clients, and prioritize personal wellbeing over platform metrics. Sustainable creative careers require rest, recovery, and life outside work. We don't push creators toward unhealthy overwork but instead celebrate balanced approaches to creative business.

Mental health awareness and resources recognize that mental health challenges affect many creative professionals. Depression, anxiety, imposter syndrome, perfectionism, and other mental health issues are common in creative fields. We reduce stigma by normalizing conversations about mental health, sharing resources about mental health support and professional services, accommodating users experiencing mental health challenges when they communicate needs, and creating an environment where seeking help is seen as strength, not weakness.

Creating a Positive Community - Everyone's Responsibility

Emotional wellbeing isn't just the platform's responsibility—it requires active participation from every community member.

Treat all users with respect and dignity regardless of their role, experience level, background, or any other characteristic. Every person on Amoria Connekyt deserves basic human respect. Whether you're working with established professionals or newcomers, wealthy clients or budget-conscious individuals, people from familiar cultures or different backgrounds—everyone warrants respectful treatment.

Celebrate creativity and meaningful connections that make this work worthwhile. Photography and videography preserve memories, document important life events, tell stories, and create art that touches hearts. Recognize the value of creative work beyond mere transactions. Celebrate when projects succeed, when beautiful work is created, when meaningful client-creator relationships form, and when creative visions come to life through collaboration.

Support visual storytelling that strengthens families and communities by understanding that the work facilitated through Amoria Connekyt has real social value. Wedding photos preserve the start of families. Family portraits document children's growth. Event photography captures community celebrations. Commercial work supports businesses that provide livelihoods. This isn't frivolous work—it's meaningful contribution to social fabric and cultural memory.

Promote emotional wellbeing through safe, positive interactions in everything you do on the platform. Your choice to communicate respectfully, provide constructive feedback, show understanding during challenges, celebrate others' successes, and approach conflicts with good faith affects the emotional environment for everyone you interact with. Positive ripple effects spread through communities—your kindness and professionalism make the platform better for everyone.

Our Commitment to Emotional Safety:
We're building more than a marketplace—we're cultivating a community where creativity flourishes, professional relationships thrive, and people feel emotionally safe and supported. This requires ongoing commitment from us and from every community member to prioritize respect, empathy, and mental wellbeing alongside business success and creative excellence.`
    },
    {
      id: 'live-streaming-safety',
      title: 'Live Streaming & Event Coverage Safety',
      content: `Live streaming and real-time event coverage present unique safety, privacy, and content moderation challenges that differ from traditional photography and videography services. When events are broadcast live or captured in real-time, there's less opportunity for careful review, editing, or consent verification before content reaches audiences. These unique characteristics require specialized safety measures to protect everyone involved.

Amoria Connekyt's live streaming and event coverage features enable photographers and videographers to provide immersive, real-time experiences for clients who cannot attend events in person or want to share moments as they happen. However, these powerful features must be balanced with robust protections for privacy, consent, content appropriateness, and platform integrity.

Understanding live streaming safety helps creators deliver innovative services responsibly while protecting clients, event attendees, and themselves from privacy violations, inappropriate content exposure, and legal liabilities.

1. Privacy Controls and Audience Management
Privacy is paramount in live streaming because once content is broadcast publicly, it's difficult or impossible to fully retract. Unlike edited photo galleries delivered privately to clients, live streams potentially reach unlimited audiences instantaneously.

Clients have comprehensive control over who can view or interact with their live streams. Before any live stream begins, clients configure privacy settings determining audience access. Options include private streams accessible only to specific individuals via unique, secure links (ideal for weddings or family events where only invited guests should view); unlisted streams not publicly discoverable but accessible to anyone with the link (useful for semi-private events); password-protected streams requiring authentication before viewing (additional security layer for sensitive events); or public streams openly accessible to anyone (appropriate for public events, performances, or promotional content).

Creators and clients must collaborate to establish appropriate privacy settings before live streaming begins. Discuss who should have access, what level of privacy the event requires, whether attendees have been notified about streaming and consented, and what restrictions should apply to viewer interactions (commenting, sharing, etc.). Once configured, these settings cannot be loosened during the stream without explicit client authorization, though they can be tightened if privacy concerns arise.

Geographic restrictions and viewer limits may be implemented for highly sensitive events. For example, corporate events might restrict viewing to specific countries, family events might limit total simultaneous viewers, and private ceremonies might block recording or screenshot capabilities where technically feasible.

Attendee privacy must be respected during live event coverage. Before streaming events with multiple attendees (weddings, parties, corporate events), obtain necessary consents and permissions. Event hosts should inform attendees that live streaming will occur, giving them opportunity to opt out or remain off-camera. Photographers should avoid focusing on individuals who've requested not to be filmed, respect private or sensitive moments that shouldn't be broadcast, and have clear agreements with event organizers about privacy expectations.

2. Recording Transparency and Consent Requirements
Live streams are often recorded for later viewing, creating permanent records that require additional consent and transparency.

All recorded sessions must comply with comprehensive consent requirements established before streaming begins. Consent requirements vary by context and jurisdiction but generally include informing all parties that recording will occur, explaining how recordings will be used and stored, obtaining explicit consent from event hosts and key participants, providing opportunity to opt out or request deletion, and documenting consent appropriately.

For public events or performances where attendees have no reasonable expectation of privacy, implied consent through attendance may suffice if proper notice is provided. However, private events (weddings, family gatherings, corporate meetings) require more explicit consent. Event hosts must inform attendees about recording, photographers must honor opt-out requests, and recordings must be stored and shared according to agreed terms.

Recordings must be clearly labeled and managed according to privacy and consent agreements. This includes clearly indicating whether streams are being recorded, providing clients access to recordings through secure, private channels (not public platforms without permission), allowing clients to request editing or deletion of recorded content if consent issues arise, maintaining recordings only for agreed duration (delete after specified period if required), and protecting recorded content with appropriate security measures (encryption, access controls, secure storage).

Children and minors require special consent considerations. Parental or guardian consent is required for recording minors in most contexts, even at public events. When photographing events with children, obtain explicit consent from parents/guardians, avoid focusing extensively on minors without permission, comply with child protection regulations including COPPA and Rwanda's laws, and never create, store, or distribute inappropriate content involving minors under any circumstances.

3. Content Moderation and Real-Time Safety
Live content presents unique moderation challenges because harmful material can reach audiences before moderators can review and remove it. Proactive measures prevent problems before they occur.

Offensive or harmful live content will be immediately terminated and reviewed to protect viewers and maintain platform integrity. Our content moderation for live streams combines automated detection systems scanning for prohibited content patterns (nudity, violence, hate speech keywords, etc.), human moderators monitoring flagged streams or high-risk events, user reporting mechanisms allowing viewers to flag inappropriate content instantly, and immediate takedown protocols enabling quick stream termination when violations occur.

Content that triggers immediate stream termination includes sexually explicit or pornographic material, graphic violence or disturbing content, hate speech or harassment targeting individuals or groups, illegal activities being broadcast in real-time, significant privacy violations (streaming without consent, exposing private information), and dangerous or harmful behavior that could inspire imitation.

When streams are terminated for policy violations, the creator receives immediate notification of termination and the policy violated, the stream recording is reviewed by human moderators, account status is evaluated for potential suspension or termination, and the client and affected parties are notified if privacy violations occurred. Creators have opportunity to appeal if they believe termination was erroneous, but egregious violations result in permanent account removal.

Viewer interactions must be moderated to prevent harassment, spam, or inappropriate behavior in stream chats and comments. Clients and creators can enable moderation tools including comment filtering for offensive language, viewer blocking for problematic users, chat disabling if interactions become unmanageable, and moderator assignment for large events requiring dedicated moderation.

4. Technical Safety and Reliability
Live streaming depends on reliable technology and secure connections. Technical failures or security vulnerabilities can ruin events and expose sensitive content.

Creators must ensure adequate technical preparation for live streams including testing equipment and internet connectivity before events, having backup systems (secondary cameras, backup internet connections) ready, using secure, encrypted connections to prevent unauthorized interception, protecting stream keys and access credentials from exposure, and monitoring stream quality and connectivity throughout events.

Clients should understand technical limitations and risks including potential for connectivity issues or stream interruptions, quality variations based on network conditions, latency (delay) between live action and stream viewing, limited ability to edit or control content in real-time, and risk of technical failures affecting event coverage. Setting realistic expectations prevents disappointment and disputes.

Platform security measures protect live streams from unauthorized access or hijacking including encrypted transmission protocols (RTMPS, HLS with encryption), secure credential management preventing stream key theft, DDoS protection ensuring streams aren't disrupted by attacks, access logging and monitoring for unauthorized viewing attempts, and immediate invalidation of credentials if security breaches are suspected.

5. Copyright and Content Rights in Live Streaming
Live streaming introduces complex copyright considerations, especially when events include copyrighted music, performances, or presentations.

Creators must respect copyright in all live-streamed content by ensuring music played during events is properly licensed for streaming (ASCAP, BMI, or other performance rights), obtaining permissions for broadcasting performances or presentations, avoiding streaming copyrighted video or audio without authorization, and warning clients about copyright risks if their events include protected material.

Platform DMCA protections apply to live streams just as they do to static content. Copyright holders can issue takedown notices for streams using their material without permission, potentially resulting in immediate stream termination. Repeated copyright violations lead to account suspension under our three-strike policy.

Event content created by photographers belongs to them as described in our Intellectual Property policies, but clients receive usage rights to recordings according to service agreements. Live stream recordings should be treated like any other commissioned video work, with clear agreements about usage rights, distribution permissions, and commercial use restrictions.

Our Commitment to Safe Live Streaming:
Live streaming offers incredible opportunities for real-time connection and immersive event experiences, but these benefits must be balanced with rigorous safety, privacy, and content protections. By implementing strong privacy controls, ensuring consent compliance, moderating content proactively, maintaining technical security, and respecting copyright, we enable creators to deliver innovative live services while protecting everyone involved.`
    },
    {
      id: 'data-protection-confidentiality',
      title: 'Data Protection & Confidentiality',
      content: `Data protection and confidentiality are fundamental rights and legal obligations that underpin trust in digital platforms. At Amoria Connekyt, we handle significant amounts of personal data, financial information, creative content, and business communications—all of which require rigorous protection from unauthorized access, misuse, or disclosure.

Our data protection practices are governed by comprehensive legal frameworks, industry best practices, and our own commitment to exceeding minimum compliance requirements. We don't view data protection as a checkbox exercise but as an ongoing responsibility central to our platform's integrity and our users' trust.

Legal Compliance - Rwanda's Data Protection Framework

Amoria Connekyt complies fully with Rwanda's Law No. 058/2021 on the Protection of Personal Data and Privacy, the comprehensive legislation that establishes data protection rights and obligations in Rwanda. This law, enacted on October 13, 2021, represents Rwanda's commitment to protecting personal information in the digital age while fostering innovation and economic development.

Under this law, we ensure that your personal data is used only for specified, explicit, and legitimate platform operations. We don't collect data arbitrarily or use it for purposes beyond what we've disclosed. Every data processing activity has a lawful basis—typically contractual necessity (data needed to provide services you've requested), consent (you've explicitly agreed to specific processing), legal obligation (required by law), or legitimate interest (necessary for our operations but balanced against your rights and interests).

Your personal data is processed fairly and transparently with clear information about what we collect, why we collect it, how we use it, who we share it with, and how long we retain it. Our Privacy Policy provides comprehensive details, and we're always available to answer questions or clarify our practices.

We collect only data that's adequate, relevant, and limited to what's necessary for specified purposes—a principle called data minimization. We don't collect excessive information "just in case" or harvest data for undefined future uses. Each data element serves a specific, documented purpose.

Personal data is kept accurate and up-to-date through mechanisms allowing you to update your information, regular data quality reviews, and prompt correction of inaccuracies when identified. You can access and correct your data through your account settings or by contacting our privacy team.

Data is retained only as long as necessary for legitimate purposes or as required by law, then securely deleted. We maintain documented retention schedules specifying how long different data types are kept and ensuring timely deletion when retention is no longer justified.

Cross-Border Data Transfers and International Safeguards

Modern cloud infrastructure and global service providers mean that data often crosses international borders. Cross-border data transfers occur only under legally approved safeguards that ensure your data receives equivalent protection regardless of where it's physically processed.

Rwanda's Law No. 058/2021 permits international data transfers only when adequate protections exist. We comply with these requirements through multiple mechanisms including Standard Contractual Clauses (SCCs) with international service providers that bind them to data protection obligations equivalent to Rwandan law, adequacy determinations where data is transferred to jurisdictions recognized as providing adequate protection (like EU member states under GDPR), specific authorizations from Rwanda's National Cyber Security Authority (NCSA) for transfers requiring regulatory approval, and supplementary security measures beyond contractual obligations including encryption, access controls, and technical safeguards.

We transfer data internationally only to jurisdictions and service providers meeting strict criteria including strong data protection laws and enforcement, political and legal stability respecting rule of law, absence of laws that would undermine data protection (like overbroad government surveillance), and service providers with proven security credentials and compliance certifications.

Our international service providers include cloud hosting in EU, Kenya, and South Africa (jurisdictions with strong data protection frameworks), payment processors operating under PCI DSS standards globally, analytics services with GDPR and privacy shield compliance, and identity verification partners specializing in secure document authentication.

All international transfers are documented and subject to transfer impact assessments evaluating risks and necessary safeguards. We maintain comprehensive records available for NCSA review and update transfer mechanisms as legal frameworks evolve (like implementing new SCCs when updated versions are released).

Confidentiality of Sensitive Information

Sensitive information requires heightened protection beyond general personal data. Sensitive information includes payment data (credit card numbers, bank account details, financial records), identity documents (passports, national IDs, driver's licenses), business confidential information (pricing strategies, client lists, proprietary processes), private communications (messages between users, support conversations), and creative works not yet publicly released.

Payment data is never disclosed to unauthorized third parties and is handled exclusively by our PCI DSS Level 1 compliant payment processors. We never store complete credit card numbers, CVV codes, or other highly sensitive payment credentials on our servers. Only tokenized references that cannot be used for fraudulent transactions are retained. Financial transaction records are protected with encryption, access controls limiting who can view them, audit logging tracking all access, and retention only for legally required periods (typically 7 years for tax compliance).

Identity verification documents submitted for KYC compliance are treated with utmost confidentiality. These documents are accessed only by authorized verification personnel,transmitted and stored using encryption, retained only as long as legally required (5 years under AML/CTF regulations), and never shared with unauthorized parties including other users, marketers, or third parties beyond verification partners bound by strict confidentiality.

Business confidential information shared through our platform (pricing discussions, project specifications, proprietary creative concepts) is protected through platform security measures, user confidentiality obligations in our Terms of Service, and mechanisms for reporting unauthorized disclosure. While we cannot control what users do with information outside our platform, we provide tools and policies that promote confidentiality.

Private communications between users are transmitted over encrypted connections, stored securely with access limited to authorized support personnel only when necessary for dispute resolution or abuse investigations, never sold or shared with advertisers or data brokers, and subject to user control (you can delete your message history).

Creative works uploaded to our platform receive confidentiality protections including access controls ensuring only authorized parties can view unpublished work, encryption protecting files during storage and transmission, no unauthorized use of your creative content by the platform or third parties, and respect for copyright and intellectual property rights.

Data Security Measures

Confidentiality is meaningless without robust security. We implement comprehensive security measures detailed in our Privacy Policy and Trust & Safety sections including encryption of data in transit (SSL/TLS) and at rest (AES-256), access controls limiting who can access what data based on role and necessity, multi-factor authentication for administrative access, 24/7 security monitoring and intrusion detection, regular security audits by independent third parties, incident response protocols for breaches or security events, and employee training on data protection and confidentiality obligations.

Security is not just about technology—it's also about processes, policies, and people. Our security program addresses all these dimensions through regular risk assessments, security awareness training, vendor security due diligence, and continuous improvement based on emerging threats and best practices.

Your Confidentiality Rights and Responsibilities

You have rights regarding confidentiality of your personal data including the right to know what data we hold and how it's protected, the right to access your data and verify its security, the right to request deletion when retention is no longer necessary, the right to object to processing or sharing you find inappropriate, and the right to file complaints if you believe confidentiality has been breached.

You also have responsibilities to protect confidentiality including securing your account credentials, not sharing passwords or access with unauthorized parties, protecting sensitive information you receive through the platform (client contact details, project specifications), respecting confidentiality of others' data you access, and reporting security concerns or breaches promptly.

Breach Notification and Response

Despite our best efforts, no system is completely immune to security breaches. If a data breach occurs that affects your personal information, we will notify you within 72 hours as required by Rwanda's Law No. 058/2021, explaining what happened, what data was affected, what we're doing to address it, what steps you should take to protect yourself, and how to contact us with questions or concerns.

We'll also notify Rwanda's National Cyber Security Authority (NCSA) and other relevant authorities as required, cooperate fully with investigations, and implement corrective measures to prevent recurrence. Breach notification is not just legal compliance—it's ethical obligation to empower you to protect yourself when your data may be at risk.

For Full Details - Comprehensive Privacy Information

This Data Protection & Confidentiality section provides essential information about our legal compliance and confidentiality practices. For comprehensive details about all aspects of data protection, your rights, security measures, international transfers, and contact information for privacy requests, please refer to our complete Privacy Policy sections above or visit www.amoriaconnect.com/privacy-policy.

Our Commitment:
Data protection and confidentiality aren't just legal requirements—they're fundamental to the trust that makes our platform possible. We're committed to exceeding minimum compliance standards, implementing industry-leading security, respecting your privacy rights, and maintaining transparency about our practices. Your data is yours, and we're privileged custodians responsible for protecting it with the utmost care.`
    },
    {
      id: 'reporting-issues',
      title: 'Reporting & Resolution',
      content: `A safe community depends on members who speak up when they see problems. No matter how sophisticated our automated detection systems become, human observers—users who notice something wrong, experience inappropriate behavior, or identify potential threats—remain our most valuable safety resource. When you report misconduct, safety risks, or policy violations, you're not just protecting yourself; you're protecting every other user who might encounter the same problem. We've built comprehensive reporting systems to make this community stewardship as easy and effective as possible.

We understand that reporting can feel uncomfortable. You might worry about retaliation, doubt whether your concern is serious enough to warrant attention, or simply not want to get involved in someone else's problems. We've designed our reporting processes to address these concerns: reports are confidential, reporters are protected from retaliation, every report is taken seriously regardless of apparent severity, and you can report anonymously if you prefer. Our goal is to remove every barrier that might prevent you from sharing information that could keep our community safe.

This section explains how to report concerns, what information helps us investigate effectively, how we handle reports, what outcomes you can expect, and how we protect reporters throughout the process.

1. Report Directly Through the Platform - Your Primary Reporting Channel
The most efficient way to report concerns is through our built-in reporting tools, which are designed for quick access, comprehensive information capture, and seamless routing to the appropriate team members.

Use the in-app "Report a Concern" or "Trust & Safety" feature available throughout the platform. You'll find report options on user profiles (to report problematic users), on content (to report inappropriate images, messages, or other materials), within booking and transaction interfaces (to report service or payment issues), and in your account settings (for general concerns or issues not tied to specific content).

Our in-platform reporting process walks you through providing relevant information, allows you to attach screenshots or evidence directly, automatically captures context (such as which user or content you're reporting), and routes your report to the appropriate team based on the issue type. Reports submitted through the platform are typically processed faster than other channels because they arrive with contextual information already attached.

The reporting process is confidential and secure. Your identity as a reporter is not shared with the reported party. Report data is encrypted and accessible only to Trust & Safety team members. We maintain audit trails ensuring accountability in how reports are handled. And you can track your report's status through your account.

For users who prefer not to create a record associated with their account, anonymous reporting options are available for certain issue types. Anonymous reports are investigated with the same seriousness as identified reports, though our ability to follow up with additional questions or provide resolution updates may be limited.

2. Email Reporting - Alternative Channels for Detailed Concerns
While in-platform reporting is preferred for most situations, email reporting provides an alternative channel for users who need to provide extensive documentation, prefer to communicate outside the platform, or are reporting issues that prevent them from accessing their accounts.

General Support for platform-related concerns: support@amoriaconnect.com
This channel handles service quality issues, booking disputes, general policy questions, and concerns that don't rise to the level of safety emergencies. Response times are typically within 24-48 hours for initial acknowledgment.

Legal & Safety for serious violations and legal matters: legal@amoriaglobal.com
This channel handles reports of fraud, harassment, threats, illegal activity, severe policy violations, legal notices, and issues requiring urgent attention. Reports to this channel receive priority handling with initial response typically within 24 hours.

Trust & Safety emergencies for immediate safety threats: safety@amoriaconnekyt.com
For situations involving imminent physical danger, active harassment campaigns, ongoing fraud, or other time-sensitive safety concerns, this dedicated channel ensures rapid response from senior Trust & Safety personnel.

When reporting via email, include your name and account email (or indicate if you wish to remain anonymous), the specific issue you're reporting with as much detail as possible, user accounts or content involved (usernames, URLs, booking IDs, etc.), relevant dates and times, any evidence you can attach (screenshots, message exports, documents), and the impact on you or others and any immediate concerns.

3. Information to Include - Helping Us Help You
The quality of information you provide directly affects our ability to investigate effectively and reach appropriate resolutions. While we investigate every report regardless of completeness, detailed reports lead to faster, more accurate outcomes.

Essential information for effective reporting includes a clear description of the incident or concern explaining what happened in your own words. Be specific: instead of "this user was rude," describe what was said or done. Instead of "the photos were bad," explain specifically what was wrong with them. Context matters—help us understand not just what happened, but why it concerns you.

Include user accounts involved if applicable. Provide usernames, profile URLs, or any identifying information for users involved in the reported behavior. If you're reporting content, provide links or descriptions that help us locate it. If you're reporting a transaction issue, include booking IDs or transaction references.

Attach screenshots or evidence if available. Visual evidence significantly strengthens investigations—screenshots of problematic messages, photos of substandard deliverables, records of missed communications, or any other documentation supporting your report. If you have extensive evidence, organize it chronologically and label files clearly.

Note the date and time of occurrence as precisely as possible. Timestamps help us locate relevant system logs, correlate events across multiple reports, and establish patterns of behavior. If the issue involved multiple incidents, provide a timeline.

Describe the impact on you or other users. Understanding harm helps us prioritize appropriately and determine suitable responses. How did this affect you emotionally, financially, professionally, or otherwise? Are other users potentially affected? Is the issue ongoing or resolved?

Even if you can't provide all this information, submit your report anyway. Partial information is better than no report, and we may be able to gather additional details through investigation.

4. Response and Resolution - What Happens After You Report
When you submit a report, it enters a structured process designed to ensure thorough investigation, fair treatment of all parties, and appropriate resolution.

Initial acknowledgment confirms receipt of your report, typically within 24 hours for email reports and immediately for in-platform reports. Acknowledgment includes a reference number for tracking, confirmation of what was reported, estimated timeline for investigation, and any immediate actions taken (such as content removal for obviously violating material).

All reports are reviewed confidentially by our Trust & Safety team. Trained specialists assess each report, determining severity, gathering additional information if needed, and coordinating investigation. Your identity as a reporter remains confidential throughout—we never reveal who reported to the reported party.

Our team investigates and responds within 72 hours for standard reports. Investigation depth varies based on complexity—straightforward content violations may be resolved within hours, while complex disputes involving multiple parties and conflicting accounts may require longer investigation. We keep reporters informed of progress, especially if investigation extends beyond initial estimates.

Urgent matters receive immediate priority handling. Reports involving abuse, harassment, fraud, safety threats, or other serious concerns jump the queue for immediate attention. Our Trust & Safety team includes members available outside business hours for true emergencies. Don't hesitate to mark reports as urgent if circumstances warrant—we'd rather assess urgency ourselves than have you hesitate to flag genuine emergencies.

5. Possible Outcomes - How We Address Violations
Depending on the nature and severity of reported issues, our responses may include a range of actions from educational interventions to permanent removal and legal reporting.

Warnings and education address minor first-time violations where users may not have understood our policies or the impact of their actions. We explain what went wrong, what behavior is expected, and what consequences will follow if violations continue. Warnings are documented and considered in evaluating any future reports.

Temporary account holds or suspensions remove problematic users from the platform while investigations proceed or as a consequence for moderate violations. Holds may restrict specific features (messaging, payouts, booking) or full account access depending on the situation. Users are notified of holds and given opportunity to respond before final decisions.

Mediation between parties helps resolve disputes where both parties share some responsibility or where misunderstandings created conflict. Our mediation process facilitates communication, helps parties understand each other's perspectives, and works toward mutually acceptable resolutions. Mediation is voluntary—we don't force parties to accept outcomes they find unfair.

Permanent suspension for severe violations removes users who have demonstrated through their actions that they cannot participate safely in our community. Permanent suspension applies to fraud, serious harassment, discrimination, repeated violations after warnings, and any behavior that poses unacceptable risk to other users. Permanently suspended users cannot create new accounts; if discovered doing so, new accounts are also removed.

Financial remedies may include refund orders, payment holds, or damage compensation depending on the nature of disputes. Our payment protection systems (escrow, Hold & Release) provide mechanisms for fair financial resolution when service or payment issues arise.

Reporting to authorities occurs when violations involve potential criminal activity or regulatory concerns under applicable Rwandan laws. We cooperate with the National Bank of Rwanda (BNR) for financial crimes, Rwanda Investigation Bureau (RIB) for criminal matters, and National Cyber Security Authority (NCSA) for data protection and cybercrime issues. We notify affected users when legally permitted to do so and provide assistance to users who wish to file their own reports with authorities.

6. Your Safety as a Reporter - Protection and Confidentiality
We recognize that reporting requires courage, and we're committed to ensuring that reporters are protected, respected, and kept informed throughout the process.

We take all reports seriously and investigate thoroughly regardless of how minor concerns might initially appear. What seems like a small issue might be part of a larger pattern visible only when multiple reports are combined. Even if investigation determines no violation occurred, your report contributed to our understanding of community dynamics and potential risk areas.

Reporters are protected from retaliation. Any attempt by reported parties to retaliate against reporters—through harassment, negative reviews, booking interference, or any other means—is itself a serious policy violation resulting in escalated consequences. If you experience any negative treatment that you believe is connected to a report you made, report the retaliation immediately for priority handling.

Confidentiality is maintained throughout the process. We don't reveal reporter identities to reported parties. Investigation communications are secured. Only Trust & Safety team members with direct involvement access report details. We don't discuss reports publicly or share information beyond what's necessary for resolution.

Follow-up communication keeps you informed. We notify reporters of investigation outcomes, actions taken, and resolution status. If you reported a safety concern that affected you personally, we check in to ensure the issue has been fully resolved and you feel safe continuing to use the platform.

Your feedback on the reporting experience helps us improve. After reports are resolved, we may ask about your experience—whether the process was accessible, whether you felt heard, whether the outcome seemed fair. This feedback directly shapes improvements to our Trust & Safety systems.

Our Commitment to Effective Reporting and Resolution:
The reporting system is only as good as the trust users place in it. If users don't believe reports will be taken seriously, they won't report. If reporters face retaliation, others will stay silent. If investigations are biased or outcomes are arbitrary, the system loses legitimacy. We're committed to earning and maintaining your trust in our reporting processes through consistent, fair, and transparent handling of every concern raised. When you report, you're partnering with us to keep Amoria Connekyt safe—and we take that partnership seriously.`
    },
    {
      id: 'enforcement-accountability',
      title: 'Platform Moderation & Enforcement',
      content: `Effective moderation and consistent enforcement are the operational backbone of our Trust & Safety commitment. Policies without enforcement are merely suggestions; enforcement without fair process becomes arbitrary punishment. Amoria Connekyt has developed comprehensive moderation systems and enforcement procedures that protect our community while respecting the rights and dignity of all users—including those who violate our policies and face consequences.

Our approach balances multiple objectives that can sometimes tension with each other: swift action to prevent ongoing harm versus thorough investigation to ensure accuracy; consistent enforcement to maintain fairness versus contextual judgment to avoid rigid injustice; transparency about our processes versus confidentiality protecting reporters and investigation integrity; user autonomy and second chances versus community safety requiring removal of dangerous actors. Navigating these tensions requires sophisticated systems, trained personnel, and clear principles guiding every decision.

This section explains how our moderation systems work, what enforcement actions we take and when, how we collaborate with legal authorities, the legal foundations of our enforcement authority, and the fair process protections that ensure enforcement serves justice rather than mere punishment.

1. Content Moderation - Keeping the Platform Safe and Professional
Content moderation is the first line of defense against policy violations. Our moderation team uses a hybrid system combining AI detection tools and human review to ensure that content on Amoria Connekyt remains safe, professional, and consistent with our community standards.

Automated detection systems continuously scan platform content for obvious policy violations. Machine learning models trained on millions of examples identify potentially problematic content including images that may contain explicit, violent, or otherwise prohibited visual content, text that may contain harassment, hate speech, spam, or other prohibited language, patterns suggesting fraudulent activity, fake profiles, or coordinated abuse, and technical threats such as malware links, phishing attempts, or security exploits. Automated systems flag suspicious content for human review rather than taking immediate action on borderline cases—we'd rather have humans make nuanced decisions than have algorithms make mistakes that harm innocent users.

Human moderators review flagged content, user reports, and random samples to ensure quality and catch issues that automated systems might miss. Our moderation team is trained in our policies, cultural context, and the specific challenges of creative service platforms. They understand that photography involves images of people, artistic expression can push boundaries, and professional disputes require nuanced assessment. Human moderators make final decisions on content removal, understand context that algorithms cannot grasp, handle appeals and edge cases with appropriate judgment, and continuously provide feedback that improves our automated systems.

Safe and relevant content uploads are ensured through pre-publication review for certain content types (particularly portfolio images for new photographers), post-publication monitoring for policy violations, and responsive review when content is reported by users. We balance thoroughness with efficiency—most legitimate content flows through without delay while problematic content is caught and addressed.

Prevention of illegal, explicit, or abusive materials protects users from content that violates laws, platform policies, or basic decency standards. This includes child sexual abuse material (CSAM), which triggers immediate removal and law enforcement reporting, explicit sexual content not appropriate for our professional platform, violent or gory imagery, content promoting illegal activities, harassment or threats directed at individuals or groups, fraudulent content designed to deceive users, and intellectual property violations including unauthorized use of others' creative work.

Quick resolution of user conflicts or inappropriate behavior addresses interpersonal issues before they escalate. When users report conflicts—whether booking disputes, communication problems, or behavioral concerns—moderators assess the situation, gather relevant information, and work toward resolution. Early intervention often prevents minor disagreements from becoming major disputes.

2. Enforcement Actions - Proportional Response to Violations
When policy violations are confirmed, we take enforcement actions proportional to the severity and nature of the violation, the user's history on the platform, the impact on other users and the community, and the user's response and apparent intent. Our enforcement philosophy emphasizes education and rehabilitation for minor issues while prioritizing community protection for serious threats.

Account warnings or initial notifications address first-time minor violations where users may not have understood our policies or the impact of their actions. Warnings explain what policy was violated, what behavior is expected going forward, and what consequences will follow if violations continue. Warnings are documented in user records and considered in evaluating any future issues—they're not "free passes" but rather opportunities to correct course before more serious consequences apply.

Temporary suspension for investigation removes users from the platform while we gather information about serious allegations. Suspension may also serve as a standalone consequence for moderate violations—a "time out" that demonstrates seriousness while allowing users to return after demonstrating understanding of violated policies. During suspension, users cannot access their accounts, conduct transactions, or communicate through the platform. Suspension length varies based on circumstances, typically ranging from 24 hours to 30 days.

Termination of access for serious violations permanently removes users who have committed severe policy violations or demonstrated inability to participate safely in our community. Termination is appropriate for fraud, serious harassment or threats, discrimination, child safety violations, repeated violations after warnings, and any behavior posing unacceptable risk to others. Terminated users are prohibited from creating new accounts; circumvention attempts result in immediate termination of new accounts discovered.

Withholding of payments in dispute cases protects financial interests while issues are resolved. When disputes arise involving payment—service quality concerns, non-delivery, unauthorized charges, or other financial issues—we may hold relevant funds in escrow pending investigation and resolution. Holds protect both parties: clients aren't forced to pay for disputed services, and creators' earnings aren't released prematurely only to be clawed back later. Funds are released according to dispute outcomes once investigations conclude.

Permanent account removal for serious or repeated offenses is our most severe enforcement action. Permanent removal applies when users have demonstrated through their actions that they cannot or will not participate appropriately in our community. This includes all cases of fraud, child safety violations, or violent threats, as well as users who accumulate multiple violations despite warnings and opportunities to improve. Permanent removal includes prohibition from future account creation—this is a lifetime ban from our platform.

Legal reporting when required under Rwandan law occurs when violations involve potential criminal activity. We don't take this step lightly, but we also don't hesitate when safety, legal compliance, or justice requires involving authorities. Legal reporting may occur with or without platform enforcement actions depending on circumstances—some issues require law enforcement even if they don't warrant account termination, while serious platform violations may warrant termination without rising to criminal thresholds.

3. Collaboration with Authorities - Partnership for Serious Matters
Some violations transcend platform policy—they're potential crimes requiring law enforcement involvement. Amoria Connekyt maintains cooperative relationships with Rwandan authorities and fulfills our legal obligations to report and assist investigation of serious matters.

We cooperate with Rwanda Investigation Bureau (RIB) for criminal matters including fraud, threats, harassment rising to criminal levels, and other offenses investigated by this national law enforcement agency. Cooperation includes responding to lawful information requests, preserving evidence when notified of investigations, and proactively reporting serious crimes we discover through platform operations.

We cooperate with National Cyber Security Authority (NCSA) for data protection, cybersecurity, and cybercrime matters. This includes reporting data breaches as required by law, cooperating with investigations of cyber offenses, and seeking guidance on complex data protection questions.

We cooperate with Bank of National Rwanda (BNR) for financial crimes including suspected money laundering, terrorism financing, fraud, and other financial offenses within their regulatory purview. As a platform facilitating financial transactions, we have specific obligations under anti-money laundering laws that require suspicious activity reporting and cooperation with regulatory investigations.

Categories of matters we report or cooperate on include fraud or financial abuse involving deception for financial gain, scams, or systematic exploitation of users or the platform. Identity theft or impersonation including fake profiles, stolen credentials, or fraudulent representation of identity. Harassment or threats that rise to criminal levels, particularly those involving violence, stalking, or systematic intimidation. Misuse of digital content including copyright infringement at commercial scale, CSAM, or other content-related crimes. Money laundering or terrorism financing including any transactions appearing designed to disguise illegal funds or support prohibited activities. And other criminal activities discovered through platform operations that legal obligations or ethical responsibilities require us to report.

When we report matters to authorities, we notify affected users when legally permitted to do so. Some situations—particularly active criminal investigations—may require us to maintain confidentiality about reports to avoid compromising investigations. We provide affected users with available information about their rights and options.

4. Legal Basis for Enforcement - Authority and Accountability
Our enforcement authority isn't arbitrary—it derives from legal frameworks, contractual agreements with users, and legitimate platform governance responsibilities. Understanding this legal basis helps users recognize that enforcement isn't mere corporate overreach but rather exercise of responsibilities recognized and supported by law.

This Policy is enforceable under multiple legal frameworks:

Law No. 18/2010 on Electronic Transactions (Rwanda) establishes the legal framework for electronic commerce in Rwanda, including provisions for terms of service, user agreements, and platform governance. Our Terms of Service and Trust & Safety Policy constitute binding agreements under this law, and enforcement actions taken pursuant to these policies are legally supported.

Law No. 69/2018 on Prevention and Suppression of Money Laundering and Terrorism Financing imposes specific obligations on financial service providers—including platforms like ours that facilitate payments. This law requires us to implement customer due diligence, monitor transactions for suspicious activity, and report concerns to authorities. Enforcement actions related to financial crimes are not just platform policy but legal compliance.

Law No. 058/2021 on Data Protection and Privacy governs how we collect, process, and protect personal data. This law both empowers and constrains our enforcement activities—empowering us to take action against data misuse while constraining how we handle personal information during investigations. Enforcement related to privacy violations serves legal compliance as well as community protection.

International standards complement Rwandan law in guiding our practices. ISO 27001 (Information Security Management) provides frameworks for protecting user data during enforcement activities. FATF Guidelines on anti-money laundering inform our financial crime prevention and reporting practices. Industry best practices for trust and safety, developed through organizations like the Trust & Safety Professional Association, shape our procedures and training.

5. Fair Process - Justice in Enforcement
Enforcement without fairness becomes arbitrary punishment that erodes trust and fails to serve justice. We're committed to fair process principles ensuring that enforcement actions are accurate, proportional, and respectful of user rights.

Users are notified of violations when appropriate, including clear explanation of what policy was violated, what evidence supports the finding, what enforcement action is being taken, what options are available for response or appeal, and what steps can lead to reinstatement (for temporary actions). Notification may be delayed or limited when doing so would compromise ongoing investigations, endanger other users, or violate legal requirements—but we default to transparency when circumstances permit.

Opportunity to respond or appeal decisions ensures that users aren't condemned without being heard. Before final enforcement decisions on serious matters, users have opportunity to provide their perspective, submit evidence, and explain circumstances that might affect our assessment. For decisions already made, appeal processes allow users to request reconsideration with new information or arguments that prior review didn't consider.

Transparent enforcement based on clear policies means users can understand what's expected and predict consequences of violations. We don't enforce secret rules or apply undisclosed standards. Our policies are published, explained, and applied consistently. When we take enforcement action, we cite specific policies violated so users understand the basis for our decisions.

Protection of platform integrity and user safety remains the ultimate purpose of enforcement. Fair process doesn't mean tolerating ongoing harm while procedures unfold—when immediate action is needed to protect users or platform integrity, we act first and address due process through post-action review. But even in urgent situations, we ensure that decisions are reviewed, users have opportunity to respond, and errors are corrected when identified.

Our Commitment to Principled Enforcement:
Moderation and enforcement are among the most challenging aspects of platform governance. Every decision affects real people—reporters seeking protection, accused users facing consequences, and community members whose safety depends on effective enforcement. We approach these responsibilities with humility, recognizing that we'll sometimes make mistakes, and with commitment to continuous improvement. Our goal isn't perfect enforcement—an impossible standard—but principled enforcement that's fair, consistent, transparent, and effective at protecting the creative community we're privileged to serve.`
    },
    {
      id: 'continuous-improvement',
      title: 'Policy Updates & Continuous Improvement',
      content: `Trust and safety are not destinations to be reached but ongoing journeys requiring constant attention, adaptation, and improvement. The threat landscape evolves as bad actors develop new techniques; technology creates new capabilities and new risks; user expectations shift as digital literacy increases; and legal frameworks advance as regulators respond to emerging challenges. A static Trust & Safety Policy would quickly become obsolete, failing to protect users from new threats or leverage new protective technologies. Amoria Connekyt is committed to continuous evolution of our safety practices, policies, and systems.

This commitment to continuous improvement reflects a fundamental truth about platform governance: we will never be "done" with trust and safety work. Every resolved incident teaches us something about vulnerabilities we hadn't fully appreciated. Every user complaint reveals friction points we should address. Every regulatory update clarifies expectations we should meet. Every technological advancement offers tools we should consider adopting. Our goal isn't a perfect policy that never needs revision—such a thing doesn't exist—but rather a living framework that grows stronger and more effective over time through systematic learning and improvement.

This section explains how we approach policy updates, how we gather and incorporate feedback, how we stay current with regulatory requirements, how we communicate changes to users, and how we invest in the people, technology, and partnerships that make effective trust and safety possible.

1. Regular Reviews - Systematic Policy Assessment
Our Trust & Safety Policy undergoes regular, systematic review to ensure it remains effective, relevant, and aligned with current challenges and best practices. We don't wait for problems to force reactive updates—we proactively assess our policies and procedures on established schedules.

This Policy may be updated as technology, user needs, or legal requirements evolve. Updates aren't arbitrary changes but responses to genuine shifts in the environment we operate in. Technology changes create both new threats (sophisticated fraud techniques, AI-generated fake content, novel attack vectors) and new defenses (better detection algorithms, improved verification tools, enhanced encryption). User needs shift as our community grows, diversifies, and develops new expectations for platform safety and fairness. Legal requirements change as Rwanda continues developing its digital economy regulatory framework and as international standards evolve.

Annual comprehensive review of safety measures and procedures ensures that nothing becomes stale through neglect. Each year, our Trust & Safety team conducts systematic assessment of all policies, evaluating whether stated policies match actual practices, identifying gaps where policies should exist but don't, assessing whether current policies effectively address the threats they were designed to counter, reviewing enforcement data to identify patterns suggesting policy improvements, and benchmarking our practices against industry peers and best practice frameworks.

Adaptation to new threats and challenges occurs continuously as we identify emerging risks. Our monitoring systems track threat intelligence from industry sources, law enforcement advisories, and our own incident data. When new threat patterns emerge—whether novel fraud schemes, new harassment techniques, or previously unseen attack methods—we assess whether current policies and systems provide adequate protection and update as needed.

Integration of user feedback ensures that policy development isn't purely top-down but incorporates perspectives from the community we serve. Users often identify issues before they appear in our metrics, suggest improvements based on their direct experience, and help us understand whether our policies work as intended in practice. Feedback integration is discussed in detail below.

Quarterly focused reviews complement annual comprehensive assessments. Each quarter, we conduct targeted reviews of specific policy areas or emerging concerns, allowing more agile response to developments that can't wait for annual cycles. These reviews examine recent incident trends, user feedback themes, regulatory developments, and competitive landscape changes.

2. Community Feedback - Learning from Our Users
Our users are our most valuable source of insight into how our policies and systems actually work in practice. Feedback from photographers, clients, and other community members helps us identify problems we might miss, understand user experiences, and develop improvements that genuinely serve user needs.

We listen to user concerns and suggestions through multiple channels. Direct feedback through support contacts often reveals friction points, confusing policies, or unmet needs. Social media monitoring surfaces public discussions about our platform and policies. In-platform feedback mechanisms allow users to share thoughts without leaving the platform. Community forums (when available) facilitate peer discussion that often generates valuable insights. And direct outreach to active users provides deeper understanding of experienced perspectives.

Regular surveys and feedback collection provide structured data complementing unstructured feedback. We conduct periodic surveys covering user satisfaction with safety features and policies, experiences with reporting and resolution processes, perceptions of platform safety and trustworthiness, suggestions for improvements or new features, and concerns about emerging issues or trends. Survey design emphasizes actionable insights—we ask questions whose answers can inform specific improvements, not just general satisfaction metrics.

Implementation of safety improvements based on community input demonstrates that feedback matters. When users identify legitimate issues, we investigate and, where appropriate, make changes. We track feedback-driven improvements and communicate them to the community, showing that user input leads to real results. This closes the feedback loop, encouraging continued engagement from users who see their contributions valued.

Transparency in policy changes acknowledges when user feedback drives updates. When we modify policies based on community input, we note this in change communications, credit the community for contributions (without identifying specific individuals unless they wish to be recognized), and explain how feedback influenced our decisions. This transparency builds trust and encourages ongoing engagement.

User advisory input provides deeper engagement with particularly active or experienced community members. Selected users may be invited to participate in advisory discussions, beta testing of new safety features, or early review of proposed policy changes. These engaged users provide valuable perspectives while serving as ambassadors helping the broader community understand our safety commitment.

3. Compliance Updates - Staying Current with Legal Requirements
Operating a platform in Rwanda while serving users across Africa and beyond requires ongoing attention to evolving legal and regulatory frameworks. We're committed to full compliance with applicable laws and proactive alignment with emerging standards.

Staying current with Rwanda's evolving regulations is foundational to our compliance commitment. Rwanda continues developing its digital economy legal framework, with ongoing evolution in data protection implementation, e-commerce regulation, financial services oversight, and cybersecurity requirements. We monitor regulatory developments through official channels (Rwanda Development Board, NCSA, BNR, and other relevant authorities), industry associations, and legal advisors. When regulations change, we assess impacts on our policies and operations, implement necessary changes promptly, and communicate relevant updates to users.

Alignment with international best practices ensures our standards meet global expectations even when local requirements might permit lesser protections. We reference frameworks including GDPR as the gold standard for data protection, ISO 27001 for information security management, FATF guidelines for anti-money laundering compliance, industry-specific standards from organizations like the Trust & Safety Professional Association, and emerging frameworks for AI governance, content moderation, and platform accountability.

Regular compliance audits verify that our practices match our policies and that both meet regulatory requirements. Internal audits conducted by our compliance team assess ongoing adherence to established standards. External audits by independent assessors provide objective verification and identify blind spots internal review might miss. Regulatory examinations when conducted by authorities receive our full cooperation, with findings driving improvements. Certification maintenance ensures we continue meeting requirements for certifications we hold.

Gap analysis and remediation address any compliance shortfalls identified through monitoring or audits. When we identify gaps between requirements and current practices, we develop remediation plans with clear timelines, allocate resources for implementation, track progress to completion, and verify effectiveness of remediation efforts. We don't treat compliance as a checkbox exercise but as genuine commitment to meeting the standards we're held to.

4. Notification of Changes - Keeping Users Informed
Policy changes only protect users if users know about them. We're committed to clear, timely communication about updates to our Trust & Safety Policy and related practices.

Major updates will be announced via email or in-app notification to ensure users are aware of significant changes. Major updates include new prohibited behaviors or content categories, changes to enforcement procedures or consequences, modifications to user rights or responsibilities, updates responding to significant regulatory changes, and any changes materially affecting user experience or protections. For major updates, we provide advance notice (typically 30 days) before changes take effect, allowing users to understand and prepare for new requirements.

Continued use of the platform signifies acceptance of any updates, consistent with standard platform practices. This doesn't mean we make changes without user awareness—we communicate proactively and provide time to review changes. But requiring affirmative consent for every policy update would create friction that harms user experience without proportionate benefit. Users who disagree with updates have the option to discontinue use rather than accept terms they find objectionable.

Users can review policy history and changes through our policy archive, which maintains previous versions for comparison. This transparency allows users to understand how our policies have evolved, compare current and previous versions, reference historical policies relevant to past events, and verify that changes have been communicated as stated. Policy archives are available upon request for users seeking historical documentation.

Clear communication of material changes emphasizes updates that most significantly affect users. While we communicate all notable changes, material changes—those affecting user rights, creating new obligations, or substantially modifying protections—receive enhanced communication including summary explanations, highlighted changes, and extended review periods. Our goal is ensuring users understand what's changing and why, not burying significant updates in routine notifications.

Minor updates are documented but may not trigger proactive notification. Clarifications, formatting changes, corrections of errors, and other non-material updates are reflected in policy version history but don't require the same communication treatment as material changes. Users can always access current policies and version history to review any updates.

5. Commitment to Excellence - Investing in Trust & Safety
Continuous improvement requires ongoing investment—in technology, in people, and in partnerships that advance our capabilities. We're committed to the resources and attention necessary for trust and safety excellence.

Continuous investment in safety technology ensures our technical capabilities keep pace with evolving threats and opportunities. This includes automated detection systems using machine learning to identify policy violations, fraud patterns, and security threats. Verification technology for identity confirmation, document authentication, and credential validation. Security infrastructure protecting user data, preventing unauthorized access, and ensuring platform integrity. Monitoring and analytics systems providing visibility into platform health, threat trends, and enforcement effectiveness. And user-facing safety tools empowering users to protect themselves and report concerns.

Training for moderation and support teams ensures our human capabilities match our technical investments. Technology alone cannot handle the nuanced judgments trust and safety work requires—trained people make final decisions on complex cases, handle sensitive situations with appropriate care, and provide the human touch that automated systems cannot replicate. Our training programs cover policy knowledge ensuring team members understand and can apply our standards consistently. Cultural competence helping team members navigate the diverse contexts of our global user base. Trauma-informed practices preparing team members to handle disturbing content and distressed users appropriately. Investigation techniques enabling thorough, fair assessment of reported concerns. And communication skills ensuring users receive clear, empathetic responses.

Partnership with industry leaders in trust and safety extends our capabilities beyond what we could develop alone. We engage with industry associations and working groups sharing best practices and threat intelligence. Technology partners providing specialized capabilities we integrate into our systems. Academic researchers studying platform safety, content moderation, and related topics. Civil society organizations advocating for user rights and platform accountability. And peer platforms facing similar challenges, where appropriate information sharing benefits all parties' users.

Dedication to protecting our community ultimately drives everything else. Investments in technology, training, and partnerships serve the fundamental goal of keeping Amoria Connekyt safe for the photographers, clients, and creative professionals who trust us with their businesses, their important moments, and their personal information. This dedication isn't a marketing message—it's the animating purpose behind every policy we write, every system we build, and every decision we make about trust and safety.

Our Commitment to Continuous Evolution:
Trust and safety work is never finished. As long as Amoria Connekyt serves users, we will continue learning, improving, and adapting our protections to meet new challenges. We're committed to humility—recognizing we don't have all the answers and can always do better. We're committed to responsiveness—acting on feedback, incidents, and regulatory guidance rather than defending the status quo. We're committed to transparency—explaining what we're doing and why, including when we make mistakes and how we're addressing them. And we're committed to our users—the photographers and clients whose trust we're privileged to hold and determined to honor through continuous improvement in how we protect them.`
    },
    {
      id: 'trust-safety-contact',
      title: 'Contact Our Trust & Safety Team',
      content: (
        <div>
          Effective trust and safety depends on open communication between our platform and the community we serve. Whether you're reporting a concern, seeking clarification about our policies, requesting assistance with a safety issue, or providing feedback on how we can better protect our users, we want to hear from you. Our Trust & Safety team exists to help—and we can only help if you reach out.
          <br /><br />
          We've established multiple contact channels to ensure you can reach the right team for your specific needs. Different situations call for different expertise, and routing your inquiry appropriately ensures faster, more effective responses. This section provides comprehensive contact information for all Trust & Safety matters, along with guidance on which channel to use for different types of concerns.
          <br /><br />
          <strong>Amoria Global Tech Ltd. (Rwanda)</strong><br />
          Amoria Connekyt is operated by Amoria Global Tech Ltd., a company registered and headquartered in Kigali, Rwanda. As a Rwandan company, we operate under Rwandan law and regulatory oversight, while serving users across Africa and beyond with consistent high standards of trust, safety, and user protection.
          <br /><br />
          <strong>1. General Support - Platform Assistance and User Help</strong><br />
          <a href="mailto:support@amoriaconnect.com" style={{ color: '#083A85', textDecoration: 'underline' }}>support@amoriaconnect.com</a>
          <br /><br />
          Our general support team handles the broadest range of inquiries and serves as your first point of contact for most platform-related matters. This channel is appropriate for account access issues and authentication problems, platform functionality questions and technical troubleshooting, booking and transaction inquiries, general questions about our services and features, user experience feedback and suggestions, initial reports of concerns that may require Trust & Safety review, and questions about policies or procedures.
          <br /><br />
          Response times for general support inquiries are typically within 24-48 hours for initial acknowledgment, with most issues resolved within 3-5 business days depending on complexity. If your inquiry requires specialized Trust & Safety attention, our support team will route it appropriately and inform you of the transfer.
          <br /><br />
          For urgent matters requiring immediate attention—such as active safety threats, ongoing harassment, or time-sensitive security concerns—please indicate "URGENT" in your subject line for expedited handling. Truly urgent matters may also be reported through our Legal & Safety channel below.
          <br /><br />
          <strong>2. Legal & Compliance - Serious Matters and Regulatory Issues</strong><br />
          <a href="mailto:legal@amoriaglobal.com" style={{ color: '#083A85', textDecoration: 'underline' }}>legal@amoriaglobal.com</a>
          <br /><br />
          Our Legal & Compliance team handles matters requiring specialized legal expertise, regulatory knowledge, or escalated attention. This channel is appropriate for reports of fraud, financial crimes, or serious policy violations, harassment, threats, or safety concerns requiring urgent intervention, legal notices, subpoenas, or law enforcement inquiries, regulatory compliance questions or concerns, intellectual property disputes and DMCA/copyright matters, formal complaints about Trust & Safety decisions or enforcement actions, data protection requests requiring legal assessment, and reports of illegal content or activity on the platform.
          <br /><br />
          The Legal & Compliance team operates with heightened confidentiality and security protocols appropriate for sensitive matters. Response times are typically within 24 hours for initial acknowledgment, with urgent safety matters receiving same-day attention when reported during business hours.
          <br /><br />
          When contacting Legal & Compliance, please provide as much relevant detail as possible, including your account information (if applicable), a clear description of the matter, any supporting documentation or evidence, and the outcome you're seeking or the assistance you need. Detailed initial communications help us respond more effectively and avoid delays from back-and-forth clarification requests.
          <br /><br />
          <strong>3. Trust & Safety Emergencies - Immediate Threats and Urgent Concerns</strong><br />
          <a href="mailto:safety@amoriaconnekyt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>safety@amoriaconnekyt.com</a>
          <br /><br />
          For situations requiring immediate Trust & Safety intervention, our emergency channel provides direct access to senior Trust & Safety personnel. Use this channel for imminent physical safety threats to yourself or others, active harassment campaigns or coordinated abuse, ongoing fraud or scams affecting multiple users, discovery of child safety concerns or CSAM, security breaches or compromised accounts with active unauthorized access, and any situation where delay could result in serious harm.
          <br /><br />
          This channel is monitored with extended hours and prioritized handling. For true emergencies involving immediate physical danger, please also contact local emergency services (police) in your jurisdiction—platform response cannot replace emergency services for immediate safety threats.
          <br /><br />
          <strong>4. General Inquiries - Business and Partnership Matters</strong><br />
          <a href="mailto:info@amoriaglobal.com" style={{ color: '#083A85', textDecoration: 'underline' }}>info@amoriaglobal.com</a>
          <br /><br />
          For general business inquiries not related to specific Trust & Safety concerns, our general inquiries channel handles media and press inquiries, partnership and business development discussions, general questions about Amoria Global Tech Ltd., speaking engagement and event participation requests, and research collaboration inquiries.
          <br /><br />
          This channel is not appropriate for user support issues, safety reports, or urgent matters—please use the appropriate specialized channels above for those needs.
          <br /><br />
          <strong>5. In-Platform Reporting - Quick Access While Using Amoria Connekyt</strong><br />
          Beyond email channels, our platform includes built-in reporting tools accessible throughout your Amoria Connekyt experience. Look for "Report" options on user profiles to report problematic users, on content (images, messages, reviews) to report policy violations, within booking interfaces to report transaction or service issues, and in your account settings for general concerns or feedback.
          <br /><br />
          In-platform reports automatically capture relevant context (which user or content you're reporting, your account information, timestamps) and route directly to appropriate team members. For many concerns, in-platform reporting is the fastest and most efficient option.
          <br /><br />
          <strong>6. Website and Online Resources</strong><br />
          <a href="https://www.amoriaconnect.com" target="_blank" rel="noopener noreferrer" style={{ color: '#083A85', textDecoration: 'underline' }}>www.amoriaconnect.com</a>
          <br /><br />
          Our website provides access to this Trust & Safety Policy and all related documentation, help center articles answering common questions, account management and self-service tools, community guidelines and policy explanations, and contact forms for various inquiry types.
          <br /><br />
          Before contacting support, you may find answers to common questions in our help center. However, don't hesitate to reach out directly if you can't find what you need or prefer personalized assistance.
          <br /><br />
          <strong>7. Physical Address - Formal Correspondence</strong><br />
          Amoria Global Tech Ltd.<br />
          Kigali, Rwanda
          <br /><br />
          For formal written correspondence, legal notices, or situations requiring physical mail, you may reach us at our registered business address. Please note that physical mail takes longer to process than electronic communications. For time-sensitive matters, email is strongly recommended, with physical copies sent only when legally required or specifically preferred.
          <br /><br />
          <strong>8. Response Expectations and Escalation</strong><br />
          We're committed to responsive, helpful communication on all Trust & Safety matters. Here's what you can expect:
          <br /><br />
          Initial acknowledgment confirms receipt of your inquiry, typically within 24-48 hours for standard matters and faster for urgent concerns. Acknowledgment includes a reference number for tracking and estimated timeline for substantive response.
          <br /><br />
          Investigation and resolution timelines vary based on complexity. Simple questions may be answered immediately. Standard concerns typically receive substantive responses within 3-5 business days. Complex investigations involving multiple parties or extensive evidence review may take longer, with proactive updates on progress.
          <br /><br />
          If you're not satisfied with a response or believe your concern hasn't been adequately addressed, escalation options are available. You may request supervisory review by replying to indicate you'd like escalation. You may contact Legal & Compliance directly for independent assessment. For data protection matters, you may contact our Data Protection Officer at dpo@amoriaconnekyt.com. And you may lodge complaints with relevant regulatory authorities if you believe your rights have been violated.
          <br /><br />
          <strong>9. Language and Accessibility</strong><br />
          Our primary communication languages are English and French. If you need to communicate in another language, please let us know and we'll make reasonable efforts to accommodate your needs.
          <br /><br />
          If you have accessibility requirements affecting how you communicate with us, please inform us and we'll work to accommodate your needs through alternative formats, communication methods, or other appropriate adjustments.
          <br /><br />
          <strong>Our Commitment to Accessible Trust & Safety Communication:</strong><br />
          We measure our Trust & Safety effectiveness not just by the policies we write or the systems we build, but by whether users feel comfortable reaching out when they need help. Every barrier to communication—confusing contact information, slow responses, dismissive treatment—undermines the safety we're trying to create. We're committed to being accessible, responsive, and genuinely helpful to everyone who contacts us. Your safety concerns, questions, and feedback aren't interruptions to our work; they are our work. Don't hesitate to reach out—we're here to help.
          <br /><br />
          © 2026 Amoria Global Tech Ltd. | All Rights Reserved | Trust & Safety Policy
        </div>
      )
    }
  ];

  const currentSection = sections.find(section => section.id === selectedSection) || sections[0];

  // Auto-scroll selected section into view (desktop) and scroll content to top (mobile)
  useEffect(() => {
    if (selectedSection && sectionRefs.current[selectedSection]) {
      sectionRefs.current[selectedSection]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
    // Scroll content to top on section change
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
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

          /* Mobile Menu Toggle Button */
          .mobile-menu-toggle {
            display: none;
            position: fixed;
            top: 80px;
            left: 1rem;
            z-index: 1000;
            background-color: #083A85;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.75rem;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: background-color 0.2s ease;
          }

          .mobile-menu-toggle:hover {
            background-color: #062d6b;
          }

          .mobile-menu-toggle:active {
            transform: scale(0.95);
          }

          /* Hamburger Icon */
          .hamburger {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 24px;
          }

          .hamburger span {
            display: block;
            width: 100%;
            height: 3px;
            background-color: white;
            border-radius: 2px;
            transition: all 0.3s ease;
          }

          .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(7px, 7px);
          }

          .hamburger.active span:nth-child(2) {
            opacity: 0;
          }

          .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
          }

          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            * {
              -webkit-tap-highlight-color: transparent;
              -webkit-touch-callout: none;
            }

            .mobile-menu-toggle {
              display: block !important;
            }

            .main-content-container {
              flex-direction: column !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100% !important;
            }

            .left-sidebar {
              position: fixed !important;
              top: 80px !important;
              left: 0 !important;
              width: 80% !important;
              max-width: 300px !important;
              height: calc(100vh - 80px) !important;
              z-index: 999 !important;
              transform: translateX(-100%) !important;
              transition: transform 0.3s ease !important;
              box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1) !important;
              pointer-events: none !important;
              touch-action: pan-y !important;
            }

            .left-sidebar.open {
              transform: translateX(0) !important;
              pointer-events: auto !important;
            }

            .right-content {
              width: 100% !important;
              padding: 1.5rem 1rem !important;
              margin-top: 60px !important;
            }

            .trust-header {
              padding: 1rem 0 !important;
            }

            .trust-header h1 {
              font-size: 1.5rem !important;
            }

            .content-header h2 {
              font-size: 1.4rem !important;
            }

            .content-header p {
              font-size: 14px !important;
            }

            .content-text {
              font-size: 0.95rem !important;
              line-height: 1.6 !important;
            }

            /* Mobile Overlay */
            .mobile-overlay {
              display: none;
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(0, 0, 0, 0.5);
              z-index: 998;
            }

            .mobile-overlay.active {
              display: block;
            }
          }

          /* Tablet Responsive Styles */
          @media (max-width: 1024px) and (min-width: 769px) {
            .main-content-container {
              margin-left: 0.5rem !important;
              margin-right: 0.5rem !important;
            }

            .left-sidebar {
              width: 35% !important;
            }

            .right-content {
              width: 65% !important;
              padding: 2rem 1.5rem !important;
            }

            .content-header h2 {
              font-size: 1.5rem !important;
            }

            .content-text {
              font-size: 1rem !important;
            }
          }

          /* Small Mobile Devices */
          @media (max-width: 480px) {
            .left-sidebar {
              width: 90% !important;
            }

            .right-content {
              padding: 1rem 0.75rem !important;
            }

            .content-header h2 {
              font-size: 1.25rem !important;
            }

            .content-text {
              font-size: 0.9rem !important;
            }

            .mobile-menu-toggle {
              top: 70px;
              left: 0.5rem;
              padding: 0.6rem;
            }
          }
        `}
      </style>
      <Navbar />

      {/* Mobile Menu Toggle Button */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
        style={{ transition: 'all 0.3s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Mobile Overlay */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsMobileMenuOpen(false);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsMobileMenuOpen(false);
        }}
      />

      {/* Header */}
      <div
        className="trust-header"
        style={{
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
      <div className="main-content-container" style={{ display: 'flex', width: 'calc(100% - 2rem)', minHeight: 'calc(100vh - 120px)', overflow: 'hidden', marginLeft: '1rem', marginRight: '1rem', marginBottom: '0' }}>

        {/* Left Sidebar Navigation */}
        <div
          className={`left-nav-scrollbar left-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSection(section.id);
                    setIsMobileMenuOpen(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSection(section.id);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    cursor: 'pointer',
                    padding: '0.75rem 1rem',
                    fontSize: '16px',
                    lineHeight: '1.4',
                    color: selectedSection === section.id ? '#ffffff' : '#000000',
                    fontWeight: '600',
                    backgroundColor: selectedSection === section.id ? '#083A85' : 'transparent',
                    transition: 'all 0.2s ease',
                    WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (window.innerWidth > 768) {
                      e.currentTarget.style.backgroundColor = '#083A85';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (window.innerWidth > 768) {
                      if (selectedSection === section.id) {
                        e.currentTarget.style.backgroundColor = '#083A85';
                        e.currentTarget.style.color = '#ffffff';
                      } else {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#000000';
                      }
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
        <div
          ref={contentRef}
          className="right-content"
          key={selectedSection}
          style={{
            width: '70%',
            backgroundColor: '#F2FFDD',
            padding: '2.5rem',
            overflowY: 'auto',
            minHeight: '100%',
            maxHeight: '100%'
          }}>
          {/* Static Header */}
          <div className="content-header" style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.7rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '0.5rem',
              marginTop: 0
            }}>
              {currentSection.title} - Amoria connekyt
            </h2>

            {/* Effective Date */}
            <p style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '1.5rem',
              marginTop: 0
            }}>
              {currentSection.id?.includes('trust') || currentSection.id?.includes('safety') ?
                'Last Updated: 01 February 2026' :
                'Last Updated: 01 March 2026'}
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
          <div className="content-text" style={{
            fontSize: '1.06rem',
            color: '#000000',
            lineHeight: '1.625',
            whiteSpace: 'pre-wrap',
            paddingBottom: '2rem'
          }}>
            {currentSection.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSafetyPage;