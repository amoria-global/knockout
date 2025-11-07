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
      content: `Depending on your country or region, you may have specific legal rights regarding how your personal data is collected, used, and managed. At Amoria Connekt, we are committed to ensuring that all users can exercise these rights easily and transparently.

1. Access Rights
You have the right to request access to any personal data that Amoria Connekt holds about you. This includes:
The right to view all personal data associated with your account or profile.
The right to request a copy of your personal data in a structured, commonly used, and machine-readable format (data portability).
The right to review the history of how your data has been processed and shared, including third-party integrations or automated systems involved.
We aim to respond to all access requests within a reasonable timeframe and in accordance with applicable data protection laws.

2. Correction Rights
You have the right to ensure that any personal information we hold is accurate and up to date. You may:
Update or modify your personal information directly through your account dashboard or profile settings.
Request correction of inaccurate, outdated, or incomplete data stored in our systems.
Verify the accuracy of any data before further processing, especially in cases where data accuracy is disputed.

3. Deletion Rights ("Right to be Forgotten")
You may request that Amoria Connekt permanently delete your personal data. Upon receiving a verified request, we will:
Remove your personal data from our active systems and archives.
Inform relevant third-party service providers (if applicable) to also delete associated data.
Retain only minimal information necessary for compliance with legal obligations, fraud prevention, or dispute resolution purposes.
Please note that certain data may be retained where required by law, regulatory requirements, or legitimate business interests (e.g., accounting, security audits, or transaction verification).

4. Objection Rights
You have the right to object, at any time, to the processing of your personal data. This includes:
Marketing purposes — you can refuse personalized marketing, targeted advertising, or promotional communication.
Automated decision-making or profiling — you can request human review of any automated processes affecting you.
Legitimate interest processing — you may object where processing relies on Amoria Connekt’s legitimate business interests instead of your consent.
If you object, we will stop processing your data unless there are compelling legitimate grounds to continue, or where processing is necessary for legal claims.

5. Restriction Rights
In certain situations, you may request that the processing of your personal data be restricted. This right applies when:
You contest the accuracy of the data, allowing time for verification.
The processing is unlawful, but you prefer restriction instead of deletion.
The data is no longer needed by Amoria Connekt but required by you for legal claims.
You have objected to processing pending resolution of the objection.
During restriction, your data will remain stored but will not be processed except under specific, legally permitted circumstances.`
    },
    {
      id: 'cookies-tracking',
      title: 'Cookies and Tracking',
      content: `At Amoria Connekyt, we use cookies and similar technologies to improve your browsing experience, optimize platform performance, analyze usage trends, and ensure the platform operates securely and efficiently. These technologies help us tailor our content and services to better match your preferences and enhance how you interact with the platform.

1. What Are Cookies
Cookies are small text files or data fragments that are placed on your computer, tablet, or mobile device when you visit a website or use an online service. They contain information such as your browser type, session duration, preferences, and interaction history.
Cookies serve as digital memory — allowing the platform to recognize your device, remember your login sessions, and deliver a seamless experience across visits. For example, they may keep you signed in, save your preferred language, and help pages load faster.
In addition to cookies, we may use similar tracking technologies such as web beacons, pixels, and local storage to gather analytical or functional data that helps improve our services.

2. Types of Cookies We Use
To make your experience efficient, Amoria Connekt uses different categories of cookies, each serving a distinct purpose:

• Essential Cookies

These cookies are fundamental to the operation of our platform. Without them, the site and its core features—like account login, payment processing, or navigation—would not function properly.
They enable secure access to user accounts, prevent fraudulent activity, and ensure that platform sessions remain stable and safe during use.

• Analytics Cookies

Analytics cookies collect anonymous data about how users interact with the platform—such as pages visited, features used, session duration, and navigation paths.
We use this information to analyze platform performance, identify technical issues, and understand what users enjoy most. This helps us continually refine our user interface, load times, and feature efficiency for a smoother experience.

• Preference Cookies

Preference cookies remember choices you make during your visits, like your selected language, region, display settings, or login preferences.
By storing these preferences, the platform can automatically adjust your interface and personalize your experience each time you return, reducing the need to reconfigure settings.

• Marketing Cookies

Marketing cookies are used to deliver relevant advertisements and promotional content based on your interests and prior interactions with our platform.
They help us and our advertising partners measure the effectiveness of campaigns and ensure you see offers that align with your needs—such as photography deals, event packages, or featured photographers.
While these cookies enhance personalization, you have the full right to disable or opt out of them if you prefer not to receive targeted content.

3. Third-Party Cookies
In addition to our own cookies, Amoria Connekt integrates trusted third-party services that may set cookies on your device for their respective purposes. These partners help us maintain analytics, process secure transactions, and improve sharing capabilities.
Examples include:

Google Analytics — to monitor overall site traffic, usage trends, and performance insights.
Payment processors (such as Stripe or PayPal) — to ensure secure financial transactions and fraud prevention.
Social media platforms — for sharing content directly from Amoria Connekt to your social accounts or to authenticate logins through social sign-ins.
Advertising partners — to manage, deliver, and track promotional campaigns relevant to users.
All third-party cookies are governed by their respective privacy policies, and Amoria Connekt ensures that only reputable and compliant providers are integrated into the platform.

4. Managing Cookies
You have full control over how cookies are used on your device. You can manage or delete cookies at any time through:
Browser settings — Most browsers allow you to block or delete cookies under “Privacy” or “Security” settings.
Our cookie preference center — A dedicated in-platform tool (if enabled) that lets you selectively enable or disable certain cookie categories.
Third-party opt-out tools — Such as those provided by advertising networks or analytics platforms.
Be aware that disabling essential cookies may limit certain functionalities—such as login persistence, checkout processes, or personalized content display—and could reduce overall platform performance.

5. Do Not Track
Amoria Connekt respects Do Not Track (DNT) signals where technically feasible. If your browser sends a DNT request, we make every reasonable effort to honor that preference and restrict unnecessary data collection, though full implementation may depend on third-party integrations that have their own data practices.

6. Cookie Duration
Cookies on Amoria Connekt have varying lifespans depending on their purpose:

Session Cookies — Temporary cookies that remain active only during your browsing session. They are automatically deleted when you close your browser.
Persistent Cookies — Remain stored on your device for a defined period or until manually deleted. They help remember login states or preferences between sessions. The typical duration ranges from 1 to 2 years, depending on the service or cookie type.
Persistent cookies may be refreshed each time you revisit the platform to maintain your personalized experience.

7. Updates
Our cookie usage practices may evolve as we introduce new features or technologies. When significant updates occur—such as adding new cookie categories, integrating new analytics tools, or modifying consent processes—we will notify users via platform banners, updated policy links, or email communications.
We encourage all users to periodically review this Cookie Policy to stay informed about how their data is being used to improve Amoria Connekt’s performance and security.`
    },
    {
      id: 'third-party-links',
      title: 'Third-Party Links',
      content: `Amoria Connekyt may include links or integrations that direct you to external websites, tools, or online services not operated or controlled by us. These links are often provided to enhance your experience — such as allowing photographers to display their personal portfolios or letting users make secure payments through verified gateways. However, once you leave our platform, your interaction is governed by the terms and policies of those external providers.

1. External Websites
Our platform may feature or redirect users to external sites, including but not limited to:
Photographer personal websites and portfolios that showcase their work beyond Amoria Connekyt.
Social media profiles to help users engage with creative communities or share published content.
Payment processor sites for completing transactions securely, such as booking sessions or purchasing services.
Partner platforms and services that collaborate with Amoria Connekyt to provide extended functionalities, such as AI-based editing tools, print-on-demand services, or booking extensions.

These links are provided for convenience and user experience enhancement. However, their inclusion does not imply endorsement, monitoring, or control by Amoria Connekyt.

2. No Responsibility
While we strive to connect you only with trusted and reputable partners, Amoria Connekyt does not assume responsibility for any external websites or services linked through our platform. This includes, but is not limited to:
The privacy practices or data protection measures employed by external sites.
The accuracy, relevance, or reliability of content displayed on linked pages.
The security or stability of third-party platforms, including how they manage user information.
The terms, conditions, and policies that govern the operation or service usage of these external providers.

By following a link to an external website, you acknowledge that Amoria Connekyt has no control over how those sites collect, use, or store your information.

3. User Discretion
We encourage all users to exercise caution and good judgment when engaging with third-party websites or services.
When you visit any external link or platform through Amoria Connekyt:
Review their privacy policy to understand how your personal data will be handled.
Read their terms and conditions to know your rights and responsibilities when using their services.
Be mindful of personal information — avoid sharing sensitive data unless you trust the platform’s security.
Ensure secure connections (look for “https://” in the URL and a padlock symbol in your browser).
Amoria Connekyt cannot guarantee that third-party links are free from malicious or misleading content, so your vigilance is key to maintaining online safety.

4. Social Media Integration
Amoria Connekyt may integrate with social media platforms to provide users with enhanced connectivity and accessibility features, including:
Profile authentication, allowing users to sign in or create accounts using their existing social media profiles.

Content sharing, enabling users to share their photos, portfolio updates, or achievements directly on platforms such as Instagram, Facebook, or LinkedIn.

Social login features, which streamline the registration process and improve user experience.
While these integrations make using our platform more convenient, your use of these features is subject to the privacy policies and data practices of the respective social media platforms. We recommend reviewing them carefully to understand how your data may be processed outside Amoria Connekyt’s environment.
These integrations are subject to the privacy policies of respective platforms.

5. Photographer External Content
Photographers or creative professionals on Amoria Connekyt may share external links to showcase additional content — such as their personal websites, third-party galleries, or hosted portfolios.
These links are entirely under the photographer’s control and are shared at their discretion. Amoria Connekyt does not monitor, verify, or endorse the accuracy, legality, or appropriateness of external content linked by users.
If you choose to access a photographer’s external portfolio, you do so at your own discretion and assume responsibility for any interactions that occur on those external platforms.

6. Reporting Concerns
The safety and trust of our community are top priorities. If you encounter inappropriate, misleading, or suspicious external links while browsing Amoria Connekyt — whether posted by users, embedded in content, or appearing within messages — please report them immediately to our Support Team.

Our team will review reported cases promptly, and where necessary, take action such as removing harmful links, disabling associated accounts, or notifying affected users.
You can report such issues by:

Using the in-platform “Report” feature where available.
Contacting our support desk directly via the Help Center or support@amoriaconnekyt.com`
    },
    {
      id: 'childrens-privacy',
      title: "Children's Privacy",
      content: `Amoria connekyt is committed to protecting the privacy of children and complying with applicable children's privacy laws.

1. Age Requirements
• Amoria connekyt is not intended for users under 18 years old
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
• Email: privacy@amoriaconnekyt.com
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
      content: `Amoria connekyt operates globally and may transfer data across international borders.

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
By using Amoria connekyt, you consent to international data transfers as described in this policy.`
    },
    {
      id: 'rwanda-privacy',
      title: 'Rwanda Data Protection and Privacy Rights',
      content: (
        <div>
          Rwanda's Data Protection and Privacy Law No. 058/2021 of 13/10/2021 provides individuals (data subjects) with rights concerning how their personal data is collected, processed, and used. Amoria connekyt respects and complies with this law to ensure that your personal information is protected, processed fairly, and used only for legitimate purposes.
          <br /><br />
          <strong>1. Right to Be Informed</strong><br />
          You have the right to be informed about how and why Amoria connekyt collects and uses your personal data. This includes knowing the purpose, legal basis, data retention period, and your rights regarding such data.
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
          You may object to the processing of your personal data for marketing, profiling, or other legitimate interests pursued by Amoria connekyt.
          <br /><br />
          <strong>8. Rights in Automated Decision-Making</strong><br />
          You have the right not to be subject to decisions based solely on automated processing, including profiling, that significantly affects you.
          <br /><br />
          <strong>9. Data Protection and Security</strong><br />
          Amoria connekyt implements strict technical and organizational measures to secure your data, including:
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
          Email: <a href="mailto:privacy@amoriaconnekyt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>privacy@amoriaconnekyt.com</a><br />
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
Continued use of Amoria connekyt after policy updates indicates acceptance of the revised terms. If you do not agree, you should discontinue use and may request account deletion.

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
          Amoria connekyt Privacy Office<br />
          Email: <a href="mailto:privacy@amoriaconnekyt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>privacy@amoriaconnekyt.com</a><br />
          Phone: <a href="tel:+250788437347" style={{ color: '#083A85', textDecoration: 'underline' }}>+250 788 437 347</a><br />
          Website: <a href="https://www.amoriaconnekyt.com" target="_blank" rel="noopener noreferrer" style={{ color: '#083A85', textDecoration: 'underline' }}>www.amoriaconnekyt.com</a>
          <br /><br />
          <strong>2. General Support</strong><br />
          For general inquiries:<br />
          Email: <a href="mailto:support@amoriaconnekyt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>support@amoriaconnekyt.com</a><br />
          Response time: Within 24-48 hours
          <br /><br />
          <strong>3. Data Protection Officer</strong><br />
          For specific privacy and data protection matters:<br />
          Email: <a href="mailto:dpo@amoriaconnekyt.com" style={{ color: '#083A85', textDecoration: 'underline' }}>dpo@amoriaconnekyt.com</a><br />
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
      content: `The Amoria Connekyt Trust & Safety Policy outlines how we create and maintain a secure, respectful, and transparent environment for all users — photographers, videographers, and clients across our platform.

Our goal is to protect creativity, promote fairness, and ensure emotional and digital wellbeing for everyone who uses Amoria Connekyt.

SCOPE:
This Policy applies to:
• All registered users, including Clients, Creators, and Organizers
• All services, including bookings, messaging, file sharing, live sessions, and payments
• All data and interactions taking place on or through the Amoria Connekyt platform, website, or mobile app

At Amoria Connekyt, we believe that trust is the foundation of every creative collaboration. Whether you are a client seeking to preserve your story or a photographer capturing it, we are committed to maintaining a safe, transparent, and respectful community.`
    },
    {
      id: 'commitment-safety',
      title: 'Our Commitment to Safety',
      content: `Amoria Connekyt is committed to:

• Providing a safe digital space for both creators and clients
• Ensuring transparency in payments and fair treatment of all parties
• Protecting users' personal data and creative content through encryption and privacy safeguards
• Promoting mental health and emotional respect through positive communication

Amoria Connekyt is built on integrity, professionalism, and care. We actively monitor, verify, and protect the experience of every user on our platform through:

• Verified user and photographer onboarding with KYC processes
• Secure payment and content delivery systems (Hold & Release model)
• Active moderation and user support for conflict resolution
• Strict data protection aligned with Rwanda's Data Protection and Privacy Law No. 058/2021
• Compliance with AML/CTF regulations and international standards`
    },
    {
      id: 'verification-authenticity',
      title: 'User Responsibilities',
      content: `Every user of Amoria Connekyt must:

1. Registration and Information
• Provide accurate information during registration and bookings
• Maintain up-to-date contact and profile information
• Complete identity verification (KYC) when required
• Keep account credentials secure and confidential

2. Professional Communication
• Communicate respectfully and avoid harassment, discrimination, or hate speech
• Treat all users with dignity and professionalism
• Respond promptly to messages and requests
• Maintain positive and constructive interactions

3. Service Delivery and Integrity
• Deliver or receive services with integrity and professionalism
• Honor commitments and agreed terms
• Complete projects according to specifications
• Act in good faith during all transactions

4. Platform Compliance
• Refrain from sharing personal payment details or attempting to bypass the platform
• Use Amoria Connekyt's payment system for all transactions
• Follow platform guidelines and community standards
• Respect intellectual property and privacy laws

5. Content Standards
• Upload only original content or properly licensed materials
• Respect copyright and creative ownership
• Do not share inappropriate, illegal, or harmful content
• Report violations through proper channels

Violations of these standards may lead to suspension or permanent removal from the platform.`
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
      content: `Users can report misconduct, safety risks, or policy violations through multiple channels:

1. Report Directly
• Use the in-app "Report a Concern" or "Trust & Safety" feature
• Quick access to reporting tools within the platform
• Confidential and secure reporting process

2. Email Reporting
• Support: support@amoriaconnect.com
• Legal & Safety: legal@amoriaglobal.com
• Include: Your name, email, description of the issue, and any supporting evidence

3. Information to Include
• Clear description of the incident or concern
• User accounts involved (if applicable)
• Screenshots or evidence (if available)
• Date and time of occurrence
• Impact on you or other users

Response and Resolution:

• All reports are reviewed confidentially by our Trust & Safety team
• Our team investigates and responds within 72 hours
• Urgent matters such as abuse, harassment, or fraud are prioritized immediately

Depending on the issue, responses may include:

• Temporary account holds or warnings
• Mediation between parties
• Permanent suspension for severe violations
• Reporting to authorities under applicable Rwandan laws (BNR, RIB, NCSA)

Your Safety Matters:

• We take all reports seriously and investigate thoroughly
• Reporters are protected from retaliation
• Confidentiality maintained throughout the process
• Follow-up communication provided`
    },
    {
      id: 'enforcement-accountability',
      title: 'Platform Moderation & Enforcement',
      content: `Our moderation team uses a hybrid system combining AI detection tools and human review to ensure:

1. Content Moderation
• Safe and relevant content uploads
• Prevention of illegal, explicit, or abusive materials
• Quick resolution of user conflicts or inappropriate behavior
• Automated and manual review processes

2. Enforcement Actions
Violations of this Policy may result in:

• Account warnings or initial notifications
• Temporary suspension for investigation
• Termination of access for serious violations
• Withholding of payments in dispute cases
• Permanent account removal for serious or repeated offenses
• Legal reporting when required under Rwandan law

3. Collaboration with Authorities
Amoria Connekyt cooperates with Rwanda Investigation Bureau (RIB), NCSA, and BNR to report and resolve cases of:

• Fraud or financial abuse
• Identity theft or impersonation
• Harassment or threats
• Misuse of digital content
• Money laundering or terrorism financing
• Other criminal activities

4. Legal Basis for Enforcement
This Policy is enforceable under:

• Law No. 18/2010 on Electronic Transactions (Rwanda)
• Law No. 69/2018 on Prevention and Suppression of Money Laundering and Terrorism Financing
• Law No. 058/2021 on Data Protection and Privacy
• International standards including ISO 27001 (Information Security) and FATF Guidelines

5. Fair Process
• Users are notified of violations when appropriate
• Opportunity to respond or appeal decisions
• Transparent enforcement based on clear policies
• Protection of platform integrity and user safety`
    },
    {
      id: 'continuous-improvement',
      title: 'Policy Updates & Continuous Improvement',
      content: `Trust and safety are ongoing responsibilities. Amoria Connekyt continuously reviews community feedback, local regulations, and best practices to strengthen user safety, data protection, and professional integrity across our platform.

1. Regular Reviews
• This Policy may be updated as technology, user needs, or legal requirements evolve
• Annual review of safety measures and procedures
• Adaptation to new threats and challenges
• Integration of user feedback

2. Community Feedback
• We listen to user concerns and suggestions
• Regular surveys and feedback collection
• Implementation of safety improvements based on community input
• Transparency in policy changes

3. Compliance Updates
• Staying current with Rwanda's evolving regulations
• Alignment with international best practices
• GDPR, ISO 27001, and FATF compliance
• Regular compliance audits

4. Notification of Changes
• Major updates will be announced via email or in-app notification
• Continued use of the platform signifies acceptance of any updates
• Users can review policy history and changes
• Clear communication of material changes

5. Commitment to Excellence
• Continuous investment in safety technology
• Training for moderation and support teams
• Partnership with industry leaders in trust and safety
• Dedication to protecting our community`
    },
    {
      id: 'trust-safety-contact',
      title: 'Contact Our Trust & Safety Team',
      content: (
        <div>
          For Trust & Safety matters, contact:
          <br /><br />
          <strong>Amoria Global Tech Ltd. (Rwanda)</strong>
          <br /><br />
          <strong>Support:</strong><br />
          <a href="mailto:support@amoriaconnect.com" style={{ color: '#083A85', textDecoration: 'underline' }}>support@amoriaconnect.com</a>
          <br /><br />
          <strong>Legal & Compliance:</strong><br />
          <a href="mailto:legal@amoriaglobal.com" style={{ color: '#083A85', textDecoration: 'underline' }}>legal@amoriaglobal.com</a>
          <br /><br />
          <strong>General Inquiries:</strong><br />
          <a href="mailto:info@amoriaglobal.com" style={{ color: '#083A85', textDecoration: 'underline' }}>info@amoriaglobal.com</a>
          <br /><br />
          <strong>Website:</strong><br />
          <a href="https://www.amoriaconnect.com" target="_blank" rel="noopener noreferrer" style={{ color: '#083A85', textDecoration: 'underline' }}>www.amoriaconnect.com</a>
          <br /><br />
          <strong>Location:</strong><br />
          Kigali, Rwanda
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