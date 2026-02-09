'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/navbar';

const TermsAndConditionsPage = () => {
  const [selectedSection, setSelectedSection] = useState('terms-of-use');
  const [isAgreed, setIsAgreed] = useState(false);
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set(['terms-of-use']));
  const [showWarning, setShowWarning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top when section changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [selectedSection]);
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
To create an account on Amoria Connekyt, you must be at least 18 years old. This age requirement is not arbitrary—it's mandated by legal regulations protecting minors and ensuring that all users can enter into legally binding agreements. During registration, you must provide accurate, complete, and up-to-date information including your full legal name, valid email address, phone number, and location. This information forms the foundation of trust on our platform and enables us to verify identities, prevent fraud, and facilitate secure transactions.

You must maintain a valid, actively monitored email address as this is our primary channel for important communications including booking confirmations, payment notifications, security alerts, and policy updates. For users who wish to engage in financial transactions—whether receiving payments as a creator or booking services as a client—you must complete our Know Your Customer (KYC) identity verification process. This involves providing government-issued identification documents and, for business accounts, relevant business registration documents. KYC verification is not just a formality; it's a critical security measure that protects everyone on the platform from fraud, money laundering, and identity theft.

2. Account Responsibility
When you create an account on Amoria Connekyt, you accept full responsibility for all activities conducted under that account. This means that whether you perform an action or someone else uses your credentials, you are accountable. You must maintain the security of your login credentials by choosing strong, unique passwords that combine letters, numbers, and special characters. Do not use the same password you've used on other platforms, as this creates vulnerability if those other services are compromised.

Never share your account credentials with others, even trusted friends, family members, or colleagues. Each person should have their own account to ensure proper attribution of actions, maintain security integrity, and comply with our terms of service. If you operate a business and need multiple team members to access bookings or portfolio management, contact our support team about multi-user business account options.

If you suspect that your account has been accessed without authorization—perhaps you notice unfamiliar login locations, unexpected bookings, or changes you didn't make—notify us immediately through our support channels. Quick reporting enables us to secure your account, investigate the breach, prevent further unauthorized access, and potentially recover any compromised data or funds.

3. Account Suspension
Amoria Connekyt reserves the right to suspend accounts when we detect activities that violate our terms of service or pose risks to other users. Suspension may occur for various reasons including fraudulent activities, misuse of platform features, or attempts to manipulate our systems. If you engage in policy violations such as harassment, discrimination, hate speech, or abusive behavior toward other users, your account may be suspended immediately to protect the community.

We take particularly serious view of attempts to bypass platform fees by conducting transactions outside our system after connections are made through our platform. Such behavior undermines our business model, deprives us of revenue needed to maintain and improve the service, and removes the protections our payment system provides to both parties. Providing false information during registration or verification processes is grounds for immediate suspension, as it indicates deceptive intent and compromises platform integrity.

During suspension, you will receive notification explaining the reason and, where appropriate, steps you can take to resolve the issue. Some suspensions are temporary pending investigation, while others may lead to permanent termination depending on the severity and nature of the violation.

4. Account Termination
You have the right to close your account at any time by accessing your account settings or contacting our support team. Upon voluntary account closure, we will deactivate your profile, remove you from search results, and cease sending promotional communications. However, certain information may be retained as required by law or legitimate business interests, such as transaction records needed for tax compliance or dispute resolution.

We also reserve the right to terminate accounts that repeatedly or seriously violate our terms of service, engage in illegal activities, or pose safety risks to other users. When we terminate an account, all access to platform services is immediately revoked. You will be notified of the termination and the reasons for it, though in cases involving fraud or illegal activity, we may limit details to protect ongoing investigations.

Data retention following account termination is governed by our Privacy Policy. Generally, we retain transaction records for 5-7 years to comply with tax laws and financial regulations, while other personal data may be deleted within 30 days unless legal retention requirements apply.`
    },
    {
      id: 'photographer-membership',
      title: 'Creator Responsibilities',
      content: `As a creator on Amoria Connekyt—whether you're a photographer, videographer, or other media professional—you represent the heartbeat of our platform. Clients trust you to capture their most meaningful moments, and the platform exists to support your success while protecting that trust. With this opportunity comes responsibility to uphold professional standards, legal compliance, and ethical practices that benefit the entire community.

Your role extends beyond simply taking beautiful photos or videos. You're building a professional reputation, creating lasting memories for clients, and contributing to a marketplace built on trust, quality, and accountability. The responsibilities outlined below aren't arbitrary restrictions—they're the foundation of a thriving creative ecosystem where talent is rewarded fairly, clients receive value, and everyone operates with confidence.

1. Professional Standards and Service Quality
Professionalism is the cornerstone of your success on Amoria Connekyt. Clients book creators based on portfolios, reviews, and service descriptions, so it's essential that you represent yourself accurately and deliver consistently high-quality work.

Provide clear, accurate service descriptions and pricing that honestly reflect what you offer. When creating your profile and service listings, describe your offerings in detail—specify what's included (number of edited images, duration of coverage, deliverables), what's not included (travel fees, additional editing, rush delivery), pricing tiers and package options, your creative style and approach, equipment you use, and turnaround times for delivery. Avoid vague descriptions like "professional photography services"—be specific about what makes your services unique and what clients can expect.

Maintain high-quality work and professional conduct throughout every engagement. Quality isn't just about technical excellence in photography or videography; it encompasses your entire client experience. Arrive on time and prepared with all necessary equipment, dress appropriately for the event or shoot, communicate clearly and respectfully, adapt professionally to unexpected challenges, and deliver work that meets or exceeds the standards demonstrated in your portfolio. Remember that your conduct reflects not just on you but on the entire Amoria Connekyt community.

Deliver services according to agreed timelines and specifications. When you accept a booking, you're making a commitment. Honor the creative brief and project requirements discussed with the client, meet agreed deadlines for both the shoot and delivery of final edited work, provide the number and type of deliverables specified in the agreement, communicate proactively if circumstances threaten deadlines, and seek client input when interpretation of requirements is unclear. Deadlines matter—clients often have their own timelines for events, publications, or marketing campaigns that depend on your timely delivery.

Respond promptly to client communications before, during, and after projects. Clients may have questions, concerns, or need to discuss project details. Aim to respond to messages within 24 hours, even if only to acknowledge receipt and indicate when you'll provide a full response. Prompt communication demonstrates professionalism, prevents misunderstandings, builds client confidence, and enables smooth project execution.

Honor all bookings and commitments made through the platform. When you accept a booking, you're entering into a contract. Canceling at the last minute can cause significant problems for clients who may have no time to find alternatives. Only accept bookings you're confident you can fulfill, maintain an updated availability calendar, provide advance notice if unforeseen circumstances require cancellation, and understand that repeated cancellations may result in account suspension or termination.

2. Legal Compliance and Ethical Obligations
Operating as a professional creator involves navigating various legal requirements and ethical considerations. Compliance protects you, your clients, and the platform from legal risks and reputational harm.

Respect copyright and intellectual property laws governing creative works. As a creator, you understand the value of intellectual property. You must only upload original work you created yourself, properly licensed stock content or resources, client work you have permission to display, and collaborative work where you have rights or attribution. Never use copyrighted music, graphics, or other elements in client deliverables without proper licenses. Violating copyright can result in legal action against you and damage to your professional reputation.

Comply with privacy laws and client confidentiality obligations. Many photography and videography projects involve personal information, private events, or sensitive situations. You must respect client privacy by not sharing client content publicly without explicit written permission, obtaining necessary model releases and permissions for people photographed, handling personal data (names, addresses, contact information) securely and in accordance with data protection laws, honoring confidentiality agreements for private events or commercial work, and being particularly careful with images of children or sensitive situations. Rwanda's Data Protection and Privacy Law No. 058/2021 and other applicable privacy regulations govern how you collect, use, and store personal information related to clients and their projects.

Obtain necessary licenses, permits, and insurance for your services. Depending on your location and the nature of your work, you may need business licenses or registration to operate legally, permits for commercial photography in certain locations (parks, government buildings, commercial properties), liability insurance to protect against equipment damage, injuries, or other incidents, drone operator licenses if you provide aerial photography services, and specific credentials or memberships in professional photography organizations. While Amoria Connekyt facilitates connections, you remain an independent professional responsible for your own legal compliance.

Follow all applicable local, national, and international laws governing your professional activities. Beyond specific photography regulations, you must comply with general business laws including tax obligations and income reporting, employment laws if you hire assistants or second shooters, consumer protection regulations, anti-discrimination laws, and any industry-specific regulations applicable to your specialties (wedding photography, journalism, commercial work, etc.).

3. Portfolio and Profile Management
Your portfolio is your most powerful marketing tool on Amoria Connekyt. It's often the deciding factor in whether clients choose to book you, so maintaining an accurate, impressive, and up-to-date portfolio is crucial.

Maintain an up-to-date portfolio showcasing your best work that accurately represents your current capabilities and style. Your portfolio should feature a curated selection of your strongest images or videos, demonstrate the range of your capabilities and services, represent your current skill level and equipment (not outdated work from years ago unless it's still representative), showcase different types of projects you're offering (weddings, portraits, commercial, events, etc.), and be updated regularly as your skills develop and you complete notable projects.

Upload only original work you created or properly licensed content you have legal rights to use. Every image or video in your portfolio should be something you personally captured and edited, stock content or resources you've licensed with rights to display, collaborative work where you have attribution rights and permission, or client work where you have permission to showcase (always obtain client consent before displaying their projects). Never use work created by others, AI-generated content falsely represented as your own, or heavily edited stock photos that misrepresent your actual creative abilities.

Ensure portfolio images accurately represent your capabilities and don't mislead potential clients about what you can deliver. While it's tempting to showcase only your absolute best work from perfect conditions, be honest about your typical results. Don't heavily manipulate portfolio images in ways you won't apply to client work, showcase work from collaborations without clarifying your specific role, use professional models or ideal conditions if you primarily shoot real clients in typical settings, or include work that required expensive rentals or equipment you don't normally use. Misleading portfolios lead to disappointed clients and negative reviews.

Update availability and service offerings regularly to reflect your current schedule and capabilities. If you're booked solid for three months, update your availability so clients don't waste time inquiring about dates you can't accommodate. If you've added new services (drone photography, 360-degree video, photo booth services) or discontinued others, update your profile accordingly. Keep pricing current to avoid awkward negotiations when quoted prices don't match listed rates.

4. Content Rights and Licensing
Understanding and respecting content rights protects both you and your clients from legal disputes and ensures fair treatment of creative work.

Creators retain ownership of their original works created through Amoria Connekyt engagements. This is a fundamental principle—you remain the copyright holder of photographs and videos you create, even when commissioned by clients. Copyright ownership means you control reproduction, distribution, display, and creation of derivative works. However, ownership doesn't mean you can do whatever you want with client-commissioned work; clients have usage rights as specified in your agreements.

Grant Amoria Connekyt a limited, royalty-free license to host and display your content for operational and promotional purposes. When you upload portfolio images or project work to the platform, you give us permission to store and display content on our platform, showcase portfolios to potential clients browsing the platform, use content in platform marketing materials (with your consent), optimize and resize images for web display, and back up content for disaster recovery. This license is non-exclusive (you retain all rights and can use your work elsewhere), limited in scope (only for platform operations and promotion), and revocable (if you delete content or close your account, subject to legal retention requirements).

Respect client rights and usage agreements established in your service contracts. While you own the copyright, clients typically receive usage rights for the images or videos they commissioned. Common usage models include full buyout (rare, expensive—client gets all rights), limited usage rights (client can use images for specific purposes like personal use, social media, or specific marketing), and exclusive rights for a period (client has sole usage for a defined time, then rights may revert or be shared). Always clarify usage rights before beginning work, document agreements in writing, honor the restrictions you've agreed to, and don't resell or relicense client-commissioned work without permission.

Do not share client content publicly without explicit permission. Even though you own the copyright, professional ethics and contractual obligations typically require client consent before publicly displaying their images. Always obtain written permission before adding client work to your portfolio, posting to social media for promotional purposes, entering into competitions or exhibitions, or selling as stock photography or prints. Be especially careful with sensitive content like private events, personal portraits, or commercial work where clients may have confidentiality concerns.

5. Payment and Project Completion
Amoria Connekyt's Hold & Release payment system protects both you and clients, but it requires you to fulfill certain obligations to receive payment.

Complete all projects according to agreed terms before payment release. The final 50% of your payment is held in escrow until the client confirms satisfaction with your deliverables. To trigger payment release, you must deliver all agreed-upon photos or videos in the specified quantity and quality, complete editing and post-production to professional standards, provide files in the agreed formats (JPEG, RAW, MP4, etc.) and resolution, meet the delivery deadline specified in your agreement, and address any reasonable revision requests included in your service package.

Deliver final work in agreed formats and quality standards. Clients have expectations based on what you promised. If you agreed to deliver 100 edited high-resolution images, don't provide 75 images or deliver only web-resolution files. If you promised both color and black-and-white versions, include both. If you offered RAW files as part of premium packages, don't substitute JPEGs. Meeting specifications is essential for professional reputation and payment release.

Address client feedback and revision requests professionally and constructively. Most service agreements include one or more revision rounds. When clients request changes, respond promptly and professionally, clarify exactly what changes they're requesting, assess whether requests fall within agreed revision scope, complete reasonable revisions in a timely manner, and communicate clearly if requests exceed agreement scope (potentially offering to accommodate for additional fees). Professionalism during the revision process often determines whether clients become repeat customers or refer others.

Follow the Hold & Release payment process properly to ensure smooth transactions. Upload deliverables through the platform when complete, notify the client that work is ready for review, provide clear delivery documentation (file counts, formats, download instructions), give clients reasonable time to review (typically 7-14 days), respond to any questions or concerns promptly, and understand that payment releases automatically if clients don't respond within the review period and no disputes are raised.

6. Identity Verification (KYC) Requirements
Know Your Customer (KYC) verification is a legal requirement for financial transactions on Amoria Connekyt, protecting against fraud, money laundering, and identity theft.

Provide valid identification documents to verify your identity. Before receiving any payouts, you must complete KYC verification by submitting a clear, legible copy of government-issued identification such as national ID card, passport, or driving license. For individual creators, this typically involves a photo ID and proof of address (utility bill, bank statement, government correspondence). For business accounts, you'll also need business registration documents, Tax Identification Number (TIN) certificate, and potentially beneficial ownership information identifying the people behind the business.

Complete verification before receiving any payouts from the platform. You can create a profile, showcase your portfolio, and even accept bookings before completing KYC, but funds cannot be released to you until verification is complete. We recommend completing KYC immediately upon creating your account to avoid delays in receiving your first payments.

Update credentials if your information changes to maintain accurate records and ensure continuous access to payments. If you move and your address changes, renew your ID and the document details change, legally change your name, or transition from individual to business status, update your KYC information promptly. Outdated information can cause payment delays or account suspension.

Businesses must provide comprehensive registration documents and TIN certificates. If you operate as a registered business entity rather than an individual creator, you'll need to provide company registration certificates, TIN or VAT registration documents, beneficial ownership information (who owns and controls the business), and potentially operating licenses or industry-specific registrations. Business verification may take slightly longer than individual verification due to additional documentation requirements.

Your Commitment to Excellence:
As a creator on Amoria Connekyt, you're not just running a business—you're capturing memories, telling stories, and creating art that matters to people. These responsibilities ensure that you can do that work in an environment that protects your rights, rewards your talent fairly, and builds lasting client relationships based on trust and professionalism. By honoring these commitments, you contribute to a creative marketplace that elevates the entire photography and videography community.`
    },
    {
      id: 'cost-and-fees',
      title: 'Client Responsibilities',
      content: `As a client on Amoria Connekyt, you're seeking talented photographers and videographers to capture important moments, create marketing content, or produce creative works that matter to you. The platform exists to connect you with verified, professional creators while protecting your interests through secure payments, quality assurance, and dispute resolution. With these benefits come responsibilities to ensure fair treatment of creators, honest communication, and ethical use of the platform.

Your role as a client extends beyond simply paying for services. You're a partner in the creative process, a custodian of the work you commission, and a member of a community built on mutual respect and trust. The responsibilities outlined below help ensure positive experiences for everyone involved and contribute to a marketplace where creative professionals can thrive.

1. Booking Responsibilities and Clear Communication
Successful creative projects begin with clear communication and accurate information. Your responsibility starts before you even book a creator.

Provide accurate and detailed project requirements when requesting quotes or booking services. The more specific you are about your needs, the better creators can serve you and the fewer misunderstandings will arise. Include essential details such as the type of event or project (wedding, corporate event, product photography, promotional video, etc.), date, time, and location of the shoot, duration of coverage needed (hours, full day, multiple days), specific shots or moments that must be captured (family portraits, key speeches, product angles, etc.), intended use of the final content (personal use, social media, commercial advertising, print publication), number of edited images or video length expected, preferred style or aesthetic (candid vs. posed, bright vs. moody, cinematic vs. documentary), delivery format and timeline (digital files, prints, video editing style), and any special requirements or constraints (venue restrictions, branding guidelines, accessibility needs).

Communicate clearly with creators about expectations before, during, and after the project. Don't assume creators will read your mind or know unspoken preferences. If you have specific vision for your project, share examples or mood boards. If certain shots are absolutely critical, emphasize their importance. If you have concerns or questions, ask them early rather than discovering problems after the shoot. Clear communication prevents disappointment and enables creators to deliver exactly what you want.

Make timely payments according to agreed terms to respect creators' time and professional services. Payment is due when you book services, not after you receive deliverables—this is how our Hold & Release system works. Prompt payment demonstrates your commitment, allows work to proceed without delays, protects you through our escrow system, and maintains your reputation as a reliable client for future bookings.

Respond promptly to creator communications and requests for clarification, access, or materials they need. Creators may contact you with questions about project details, requests for access to venues or locations, needs for brand assets or specific materials, clarifications about revisions or preferences, or scheduling confirmations and logistics. Aim to respond within 24-48 hours. Delayed responses can derail timelines, create unnecessary stress, and ultimately affect the quality or delivery of your project.

2. Payment Obligations and Platform Integrity
Amoria Connekyt's payment system protects both you and creators through secure processing, escrow protection, and documented transactions. Respecting payment obligations is essential for platform integrity.

Pay the full booking amount through Amoria Connekyt using our licensed payment gateways. All payments must flow through our platform—this is non-negotiable. Using our payment system provides you with escrow protection (funds held until you're satisfied), formal transaction records for business expenses or tax purposes, access to dispute resolution if problems arise, verification that creators are KYC-verified professionals, and platform support and mediation services. The convenience and protection provided by our payment system far outweigh any perceived savings from direct payment.

Do not attempt to bypass the platform or make direct payments to creators outside our system. Bypassing the platform is a serious violation that harms everyone. It deprives creators of platform protection and dispute resolution, removes your escrow protection and recourse if problems arise, violates our terms of service and may result in account termination, undermines the platform's sustainability and ability to provide services, and potentially exposes you to fraud or unverified service providers. If a creator suggests direct payment to avoid platform fees, report this to us immediately—it's a violation of their terms as well.

Understand and accept the Hold & Release payment system that protects both parties. When you pay for services, 50% is held in secure escrow while 50% goes to the creator. The escrow amount releases when you approve the final deliverables, giving you leverage to ensure satisfaction before full payment. This system is designed for fairness—creators receive immediate partial payment as security for their time, while you maintain control over final payment until you've verified the work meets agreed specifications. Don't abuse this system by withholding approval unreasonably for work that meets contracted specifications.

Pay any applicable fees or charges transparently disclosed during booking. Amoria Connekyt charges platform fees to support operations, security, customer support, and ongoing development. These fees are clearly shown before you confirm any booking, so there are no surprises. Additional charges might include payment processing fees (typically 2-5% depending on payment method), rush delivery fees if you request expedited turnaround, revision fees beyond what's included in the base package, travel or accommodation expenses for remote shoots, or equipment rental costs for specialized gear. All charges should be agreed upon before work begins.

3. Content Usage and Intellectual Property Rights
Understanding your rights and limitations regarding commissioned content prevents legal issues and respects creators' intellectual property.

Respect creator intellectual property rights and recognize that creators typically retain copyright ownership. When you commission photography or videography, you're purchasing usage rights, not usually full copyright ownership (unless you specifically negotiate a full buyout, which commands premium pricing). This means creators own the images or videos they create, but you have rights to use them as specified in your service agreement. Respect these boundaries and don't assume unlimited rights unless explicitly granted.

Use delivered content only as agreed in the service contract and within the scope of licensed usage rights. Common usage scenarios include personal use (family photos, personal social media, private displays), limited commercial use (specific marketing campaign, website images, social media promotion), editorial use (news, education, commentary), or full buyout (unlimited rights, exclusive ownership—very expensive). If you want to use content beyond what was originally agreed—for example, using wedding photos in a commercial advertisement or republishing personal portraits in a book—you must contact the creator and negotiate additional licensing rights, typically with additional compensation.

Do not misuse, resell, or redistribute creator content without explicit permission. Prohibited uses without proper licensing include reselling images to third parties or stock photo agencies, providing content to others for commercial use, creating derivative works (heavily modifying, incorporating into artwork) without permission, removing creator watermarks or copyright notices, claiming the work as your own creation, or using content in ways that could damage the creator's reputation. These violations can result in copyright infringement claims, financial penalties, account termination, and potential legal action.

Honor usage rights and licensing agreements specified in your service contracts. If your agreement grants personal use only, don't use images commercially. If you have exclusive rights for six months, respect that timeframe. If you're allowed to use images on social media but not in print advertising, honor that distinction. When in doubt, ask the creator for clarification or negotiate expanded rights rather than assuming permission.

4. Cancellation and Refunds
Life is unpredictable, and sometimes you need to cancel or modify bookings. Understanding and following cancellation policies protects everyone involved.

Follow the cancellation and refund policies outlined in these terms and in your specific service agreements. Cancellation policies exist to balance your flexibility with creators' need for income security. Our standard policy provides full refunds (minus processing fees) within 24 hours of booking, partial refunds (up to 50%) after 24 hours but before project start, and limited or no refunds after project commencement. These policies are fair compromises—creators invest time in preparation, turn down other opportunities, and arrange their schedules around your booking.

Provide reasonable advance notice for cancellations to give creators time to fill the slot or adjust their schedule. Last-minute cancellations can be financially devastating for creators who've blocked out time, turned down other work, and prepared for your project. If you must cancel, do so as early as possible—ideally weeks in advance for major events like weddings, or at least several days for smaller projects. Greater notice often results in more generous refund considerations.

Understand that refunds depend on timing and work completed by the creator. If a creator has already invested significant time in pre-production (scouting locations, creating shot lists, coordinating with other vendors, purchasing specific materials), partial payment compensation is fair even if the shoot doesn't occur. If work has commenced, you're generally not entitled to refunds unless the creator fails to deliver. Our dispute resolution process considers all circumstances fairly.

Act in good faith during dispute resolution and provide honest, complete information. If problems arise, don't immediately demand refunds or leave negative reviews. First, communicate directly with the creator to resolve issues. If that fails, use our mediation services. During disputes, provide complete, accurate information, share relevant communications and documentation, respond promptly to mediator requests, consider reasonable compromise solutions, and accept fair resolutions based on evidence and contracted terms.

5. Professional Conduct and Community Standards
Amoria Connekyt is a community built on respect, professionalism, and mutual support. Your conduct affects not just individual creators but the entire platform atmosphere.

Treat creators with respect and professionalism throughout all interactions. Remember that creators are skilled professionals providing valuable services, not servants or vendors to be ordered around. Respectful behavior includes communicating politely and professionally, respecting creators' expertise and creative input, being punctual for shoots and meetings, preparing venues and subjects as agreed, not making unreasonable demands or last-minute changes, and acknowledging that creators are partners in achieving your vision, not just button-pushers executing orders.

Provide constructive feedback on deliverables that helps creators understand your preferences while remaining respectful. When reviewing work, be specific about what you like and what you'd like changed. Instead of "These are terrible, do them over," try "I prefer brighter, more vibrant colors—could you adjust the editing to be less moody?" Constructive feedback leads to better final results and maintains positive working relationships. Remember that creative work involves subjective judgment, and what you perceive as problems may be intentional artistic choices that can be discussed and adjusted.

Do not harass, discriminate, or abuse creators in any way. This includes verbal abuse or aggressive language, discriminatory comments based on race, gender, religion, disability, or other protected characteristics, sexual harassment or inappropriate advances, threats or intimidation, unreasonable demands or pressure, or retaliation against creators who assert their rights. Such behavior results in immediate account review and potential termination, and may expose you to legal liability.

Follow platform guidelines and community standards that promote positive, productive interactions. Our community guidelines prohibit harassment, hate speech, discrimination, fraud, manipulation, abuse of platform features, and violations of other users' rights. Familiarize yourself with these guidelines and commit to upholding them in all your platform interactions.

6. Project Completion and Review Process
The final stages of projects—reviewing deliverables, requesting revisions, and approving work—are critical for fair completion and payment release.

Review and approve deliverables in a timely manner once creators notify you that work is ready. Creators can't receive their final payment until you approve their work or the review period expires. Prompt review respects creators' cash flow needs and allows both parties to move forward. Typically, you have 7-14 days to review deliverables (depending on project size), during which you should examine all files for quality and completeness, verify that deliverables match contracted specifications, identify any issues or needed revisions, and either approve the work or request revisions with specific, detailed feedback.

Request revisions clearly and professionally with specific, actionable feedback. Most service packages include one or more revision rounds. When requesting revisions, be specific about what changes you want ("Please brighten images 5, 12, and 27; they're too dark" rather than "These need work"), reference contracted specifications if applicable ("The agreement specified 100 edited images, but I only received 87"), request revisions within the scope of your agreement (don't ask for entirely new editing styles or additional shoot days), and allow reasonable time for creators to complete revisions (typically 3-7 days depending on complexity).

Confirm satisfaction before final payment release to ensure you're happy with deliverables. Once you approve work, the final 50% of payment releases to the creator. This approval should be intentional and final—don't approve work you're not satisfied with just to be nice, then complain later. However, don't withhold approval unreasonably for work that meets contracted specifications just because you have buyer's remorse or changed your mind about what you wanted. If work genuinely fails to meet agreed standards, use our dispute resolution process rather than simply withholding approval indefinitely.

Leave honest reviews to help the community and future clients make informed decisions. After project completion, you'll be invited to review the creator. Honest, thoughtful reviews are invaluable for the community. Your review should be fair and balanced (mention both strengths and weaknesses), specific about your experience (quality of work, professionalism, communication, value), honest without being cruel or retaliatory, and focused on facts and your experience rather than personal attacks. Reviews help creators improve, assist future clients in choosing the right creative professionals, and contribute to platform quality and accountability.

Your Partnership in Creativity:
As a client on Amoria Connekyt, you're not just purchasing a service—you're partnering with creative professionals to capture moments, tell stories, and create content that matters. These responsibilities ensure that your partnerships are built on fairness, respect, and clear communication, resulting in better outcomes for everyone and a thriving creative marketplace where talent is valued and clients are protected.`
    },
    {
      id: 'client-initiated',
      title: 'Payments & Fees (Hold & Release Model)',
      content: `Amoria Connekyt's payment system is designed with one core principle: fairness for all parties. Our Secure Hold & Release Payment Model protects both clients and creators by ensuring that clients receive the services they paid for before funds are fully released, while creators are guaranteed payment for completed work. This balanced approach eliminates common freelance payment disputes and builds trust throughout our community.

1. Payment Collection
When a client books a service through Amoria Connekyt, they pay the full booking amount upfront through our platform. This requirement serves multiple purposes: it demonstrates the client's serious intent and financial commitment, provides creators with confidence that funds are secured, and enables our escrow protection system to function effectively. All payments are processed exclusively through our licensed, regulated payment gateway partners: Pesapal, Flutterwave, and JengaPay.

These payment processors are carefully selected based on their security credentials, regulatory compliance, and reliability. They handle sensitive payment information using industry-standard encryption and security protocols (PCI DSS Level 1 compliance). When you enter payment details, that information goes directly to these trusted processors—we never see or store your complete credit card numbers on our servers. This arrangement protects your financial data while enabling smooth, secure transactions.

2. Escrow Hold System
Upon receiving your payment, Amoria Connekyt immediately places 50% of the total amount into a secure escrow account. This isn't just a bookkeeping entry—these funds are actually held separately and cannot be accessed by either party or Amoria Connekyt until specific conditions are met. The escrow system protects clients by ensuring they don't pay in full until they're satisfied with the work delivered. Simultaneously, it protects creators by guaranteeing that funds are secured and available once they complete the project successfully.

The remaining 50% stays in our system but isn't released to the creator immediately either. Before this balance is released, the client must confirm their satisfaction with the deliverables. This confirmation process might involve reviewing photos or videos, verifying that all agreed-upon shots were captured, checking image quality and editing standards, and ensuring that deadlines and project specifications were met. Only after the client provides this confirmation does the remaining 50% get released to the creator's account.

3. Balance Release Process
The release of the remaining funds follows a careful verification and approval process. Once the creator uploads final deliverables or completes the service as agreed, they notify the client through our platform. The client then has a reasonable period (typically 7-14 days depending on project scope) to review the work and either approve it or request reasonable revisions as specified in the original agreement.

Upon client approval, Amoria Connekyt processes the balance release to the creator's account. Payments are typically released within 3-5 business days, though the exact timing may vary depending on the payment method chosen by the creator (bank transfer, PayPal, mobile money, etc.). Creators can track their payment status in real-time through their dashboard, seeing exactly where funds are in the process from booking to escrow to release.

If a client doesn't respond within the review period and no disputes have been raised, we may automatically approve the release to prevent indefinite holds on creator payments. This default approval protects creators from clients who simply don't respond after receiving satisfactory work.

4. Platform Fees
Amoria Connekyt deducts a small commission or service fee from transactions to support our platform operations, infrastructure maintenance, payment processing costs, customer support, dispute resolution services, and ongoing feature development. Our fee structure is completely transparent—you'll see exactly what fees apply before confirming any booking. These fees are competitive with industry standards and are essential for maintaining a high-quality, secure platform that benefits the entire community.

The specific fee percentage may vary based on transaction size, user status (new vs. established), service type, or promotional periods. However, all applicable fees are clearly disclosed during the booking process, and you'll never encounter surprise charges or hidden fees.

5. Dispute Hold and Resolution
If a dispute arises between client and creator regarding deliverables, timelines, or service quality, the disputed funds are held securely until the issue is resolved. Neither party can access these funds during the dispute process, ensuring that resolution is based on merits rather than financial pressure. Our Support Desk team mediates disputes fairly by reviewing communications, contract terms, delivered work, and both parties' perspectives.

Dispute resolution aims to find equitable solutions—this might mean partial refunds, additional revision rounds, deadline extensions, or other compromises depending on the specific situation. Funds are released based on the outcome of this mediation, whether that means full payment to the creator, partial or full refund to the client, or a split arrangement. Our goal is always fair resolution based on evidence and the terms originally agreed upon.

6. Transparency and Tracking
Both clients and creators have full transparency into the payment process through their dashboards. You can see real-time status of all payments, view detailed transaction histories, access receipts and invoices, track escrow holds and releases, and monitor dispute statuses if applicable. This transparency builds trust and reduces anxiety about payment status for both parties.

All transactions are thoroughly documented with timestamps, amounts, parties involved, project details, and payment gateway confirmation numbers. These records serve as proof of payment, support tax reporting, assist in dispute resolution, and provide audit trails for financial compliance.

7. Tax Compliance and Reporting
All payments processed through Amoria Connekyt are routed through licensed, regulated payment gateways that maintain proper financial records. We retain comprehensive transaction records for 5-7 years to comply with Rwandan tax laws and international financial regulations. However, it's important to understand that as a creator receiving income through our platform, you are responsible for reporting this income to relevant tax authorities in your jurisdiction and paying applicable taxes according to your local laws.

We provide detailed transaction histories and annual earnings summaries to assist with your tax reporting obligations, but we are not tax advisors. We recommend consulting with qualified tax professionals in your region to ensure proper compliance with all tax obligations. Similarly, clients should maintain records of payments for business expense documentation or other tax purposes as applicable to their situations.`
    },
    {
      id: 'credentials-privacy',
      title: 'Cancellations & Refunds (Trust-Based Policy)',
      content: `Life doesn't always go according to plan. Events get postponed, circumstances change, and sometimes bookings need to be cancelled. Amoria Connekyt's cancellation and refund policies are designed to balance the legitimate needs of both clients and creators—protecting clients from paying for services they don't receive while also protecting creators from the financial harm of last-minute cancellations that leave them without income or alternative bookings.

Our trust-based approach recognizes that most cancellations aren't malicious—they're the result of genuine changes in circumstances. We aim for policies that are fair, transparent, and considerate of everyone involved. The specific refund amount depends on timing, work completed, and the circumstances of cancellation. Below is a comprehensive explanation of how cancellations and refunds work on our platform.

CLIENT CANCELLATIONS - Understanding Your Options

As a client, you may need to cancel a booking for various reasons. Your refund eligibility depends primarily on when you cancel relative to the project timeline and how much work the creator has already invested.

1. Within 24 Hours of Booking - Quick Change of Heart
If you cancel within 24 hours of making the booking, you're entitled to a full refund minus payment processing fees. This 24-hour window recognizes that people sometimes book impulsively or discover conflicts shortly after committing. It's similar to a "cooling-off period" that gives you a brief opportunity to reconsider without major financial consequences.

Full refund means you receive back everything except non-recoverable payment processing fees. These processing fees, typically 2-5% depending on the payment method used (credit card, mobile money, bank transfer, etc.), are charged by our payment gateway partners (Pesapal, Flutterwave, JengaPay) and cannot be refunded because they've already been paid to payment processors. Quick cancellation ensures minimal impact on creators, who likely haven't yet invested significant time in preparation and can still book the date with another client.

To request a cancellation within 24 hours, simply access your booking through your dashboard, click the "Cancel Booking" option, confirm your cancellation request, and you'll receive refund confirmation within 1-2 business days. The refund will be processed to your original payment method within 7-14 business days depending on your bank or payment provider.

2. After 24 Hours but Before Project Start - Partial Refund Consideration
If you cancel after the initial 24-hour period but before the scheduled project start date, you may receive a partial refund up to 50% of the total booking amount, depending on how much preparation work the creator has already completed.

Creators often begin preparing immediately after a booking is confirmed. Preparation work might include blocking out time on their calendar and turning down other potential bookings for that date, conducting pre-production planning such as scouting locations, creating shot lists, or developing creative concepts, coordinating with other vendors or team members (second shooters, assistants, equipment rentals), purchasing or arranging specific materials needed for your project, communicating with you to finalize details and requirements, or traveling to scout venues or attend planning meetings.

The creator may retain compensation for time and resources already invested in preparation. The specific refund amount is determined by documenting and evaluating the work completed up to the point of cancellation. For example, if a wedding photographer has spent 10 hours on pre-production (meeting with you, scouting the venue, creating a detailed shot list, coordinating with your wedding planner), compensation for that time is fair even though the shoot doesn't occur.

To request a cancellation after 24 hours but before project start, contact the creator directly through the platform to explain the situation and discuss potential refunds or rescheduling, or contact our Support Desk if you cannot reach an agreement with the creator. Our mediation team will review the booking details, assess work completed by the creator, communicate with both parties to understand the situation, and determine a fair refund amount based on the circumstances.

This process encourages good-faith communication. Often, creators are willing to reschedule rather than cancel outright, which benefits both parties—you still get your project completed, and they retain the full booking revenue.

3. After Project Commencement - Limited Refund Eligibility
Once work has begun—the shoot has started, deliverables are being created, or services are being rendered—refunds are generally not available unless the creator fails to deliver on their obligations or breaches the service agreement.

After project commencement, creators have invested significant time, effort, and resources into your project. They've performed the shoot, begun editing, or delivered partial work. At this stage, you've received value even if the final deliverables aren't yet complete. No refund is provided if you simply change your mind about wanting the project, decide you don't like the creator's style (which should have been evaluated before booking), experience buyer's remorse, or cancel for reasons unrelated to the creator's performance.

However, clients are protected if creators fail to fulfill their obligations. You may be entitled to partial or full refunds if the creator fails to appear for scheduled shoots without valid emergency reason, delivers significantly fewer deliverables than agreed (providing only 50 photos when 100 were promised), misses agreed deadlines without reasonable explanation or communication, delivers work that's objectively deficient in quality (out of focus, improperly exposed, unprofessional editing), or otherwise materially breaches the service agreement.

Dispute resolution is available through our Support Desk for these situations. Contact us immediately if you believe a creator has failed to meet their obligations, provide detailed evidence (communications, contract terms, examples of deficient work), and allow our mediation team to investigate and determine appropriate remedies (partial refunds, completion by another creator, or other solutions).

CREATOR CANCELLATIONS - When Creators Need to Cancel

Creators are expected to honor all bookings they accept, but sometimes legitimate emergencies or unforeseen circumstances make it impossible for them to fulfill commitments.

1. Creator Cancellation Policy and Client Protection
If a creator cancels after you've made payment, you receive a full refund without exception. There are no processing fee deductions when creators cancel—you get back 100% of what you paid. This policy protects clients from the significant inconvenience and potential alternative costs of finding last-minute replacement creators.

Creator cancellations are taken seriously. Repeated cancellations may result in account suspension or termination. Our platform monitors cancellation patterns, and creators who frequently cancel demonstrate unreliability that harms clients and damages platform reputation. Legitimate emergencies (illness, family emergencies, accidents) are understood and don't trigger penalties, but patterns of cancellation for less serious reasons (double-booking, finding higher-paying work elsewhere, simply changing their mind) will result in account restrictions.

Creators must act in good faith and honor commitments they've made. When you accept a booking, you're entering a binding agreement. If circumstances beyond your control make fulfillment impossible, communicate immediately with the client, provide honest explanations, assist in finding alternative creators if possible, and process refunds promptly without dispute. Professional handling of unavoidable cancellations maintains reputation and client relationships even in difficult circumstances.

GENERAL POLICIES - Flexibility and Fairness

Beyond specific client and creator cancellation scenarios, several general policies provide flexibility while maintaining fairness.

1. Reschedules and Emergencies - Flexibility First
Before requesting cancellations and refunds, both parties should explore rescheduling options. Life events (weddings, corporate events, family gatherings) can often be photographed on different dates if both parties are flexible. Rescheduling preserves the business relationship, avoids cancellation fees or refund disputes, enables creators to retain income they've planned for, and ensures clients still receive the services they want.

Both parties should act in good faith to find mutually acceptable alternatives. If a client needs to postpone due to illness or vendor conflicts, propose alternative dates rather than immediately canceling. If a creator has a scheduling conflict, suggest another qualified creator from their network or propose dates that work for both parties. Reasonable accommodation for genuine emergencies is expected and appreciated on both sides.

Communication and flexibility are encouraged throughout the relationship. Be honest about constraints, propose creative solutions, compromise where possible, and document any rescheduling agreements in writing through the platform to avoid future misunderstandings.

2. Force Majeure - Events Beyond Control
Neither party is liable for cancellations, delays, or performance failures caused by events beyond their reasonable control. Force majeure circumstances include natural disasters (earthquakes, floods, hurricanes, wildfires), illness or medical emergencies (COVID-19, hospitalization, serious injury), pandemics or public health emergencies requiring quarantine or restricting gatherings, government actions (lockdowns, travel bans, venue closures, emergency declarations), war, civil unrest, or terrorism affecting safety or travel, or major technical or system failures making service delivery impossible.

When force majeure events occur, parties should work together to find alternative solutions rather than immediately pursuing refunds. This might involve rescheduling to a later date when circumstances permit, transferring bookings to another creator if the original cannot fulfill, partial delivery of services that remain feasible, or mutually agreeable contract modifications. Good-faith cooperation during crises builds lasting professional relationships and often results in better outcomes than rigid enforcement of policies.

Documentation of force majeure events is important if disputes arise. Keep records of government orders, medical documentation, news reports of disasters, or other evidence demonstrating that the event was genuine and unavoidable.

3. Refund Processing - Timelines and Methods
Once a refund is approved—whether through agreement between the parties, mediation by our Support Desk, or automatic qualification under our policies—processing follows a standard timeline to ensure consistency and reliability.

Approved refunds are processed within 7-14 business days from the approval date. This timeframe accounts for administrative processing, coordination with payment gateways, and banking system delays. Refunds are always issued to the original payment method used for the booking (the same credit card, mobile money account, or bank account). We cannot issue refunds to different accounts or payment methods to prevent fraud.

Processing time depends on your payment gateway and financial institution. Credit card refunds typically appear within 5-10 business days, mobile money refunds within 1-3 business days, and bank transfer refunds within 3-7 business days. International transactions may take slightly longer. You'll receive email confirmation when the refund is initiated and can track its status through your dashboard.

If you don't receive your refund within the expected timeframe, contact our Support Desk at support@amoriaconnect.com with your transaction reference number. We'll investigate with the payment gateway and resolve any processing issues.

4. Dispute Resolution - Fair Mediation Process
When cancellation or refund disputes arise that parties cannot resolve directly, our Support Desk provides professional mediation services to reach fair resolutions.

The Support Desk will mediate refund issues before any formal arbitration or legal action. Our mediation process is fair and transparent, giving both parties equal opportunity to present their perspectives. You have the right to present your case with supporting evidence (communications, photos of work delivered, contract terms, timeline documentation), respond to the other party's claims and provide context, access mediation findings and reasoning, and appeal decisions you believe are unfair or based on incomplete information.

Our mediators review all evidence objectively, considering the specific terms of the service agreement, platform policies and standard practices, actions taken by both parties, reasonableness and good faith of all involved, industry standards for similar services, and fairness to both sides. Mediation decisions are typically provided within 5-7 business days of receiving all necessary information from both parties.

Most disputes are resolved through mediation without requiring formal arbitration. However, if mediation doesn't produce acceptable resolution, parties may pursue binding arbitration under the laws of the Republic of Rwanda as specified in our Legal Terms and Jurisdiction section.

Our Commitment to Fairness:
Cancellations are unfortunate but sometimes necessary. Our policies strive to protect everyone involved—clients shouldn't pay for services they don't receive, and creators shouldn't lose income due to client changes of heart after they've invested time and turned down other opportunities. By acting in good faith, communicating clearly, and approaching cancellations with flexibility and understanding, we can minimize negative impacts and maintain the trust that makes our creative marketplace thrive.`
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      content: `Privacy is a fundamental right, and protecting your personal information is one of our highest priorities at Amoria Connekyt. As you use our platform to connect with creative professionals or showcase your talents, we collect, process, and store various types of personal data to facilitate these services. Understanding how we handle your information empowers you to make informed decisions and exercise control over your data.

This Privacy Policy summary provides an overview of our data practices within the context of our Terms of Service. For comprehensive details about privacy rights, data protection measures, international transfers, and all aspects of how we handle personal information, please refer to our complete Privacy Policy available at www.amoriaconnect.com/privacy-policy.

1. Information Collection - What We Gather and Why
We collect information necessary to operate our platform, facilitate connections between clients and creators, process transactions securely, and continuously improve our services. Our data collection is guided by principles of transparency, necessity, and purpose limitation—we only collect what we need and use it only for specified, legitimate purposes.

Information you provide directly forms the foundation of your platform experience. When you create an account, we collect your name, email address, phone number, location, and password to establish your identity and enable secure access. For creators, we also collect professional information including biography, service descriptions, portfolio images and videos, pricing information, specialties, and availability calendars. This information helps clients discover and evaluate creators who match their needs.

Booking and project information is collected when you engage in transactions. This includes detailed project requirements, event dates and locations, communication between clients and creators, agreed terms and specifications, revision requests, and feedback. This data ensures clear documentation of agreements, facilitates smooth project execution, and provides evidence for dispute resolution if needed.

Payment and financial information is processed through our licensed payment gateway partners (Pesapal, Flutterwave, JengaPay). We collect billing addresses, payment method information (tokenized for security), transaction amounts and dates, and invoice details. Importantly, we never store complete credit card numbers on our servers—this sensitive information is handled exclusively by our PCI DSS-compliant payment processors.

Identity verification documents are required for KYC (Know Your Customer) compliance. Creators receiving payments must provide government-issued identification (national ID, passport, or driver's license), proof of address, and for businesses, registration documents and Tax Identification Numbers (TIN). This verification prevents fraud, ensures regulatory compliance with Rwanda's AML/CTF laws, and builds platform trust.

Technical and usage data is automatically collected to improve platform performance and user experience. This includes IP addresses, device information (browser type, operating system, screen resolution), pages viewed and features accessed, search queries and navigation patterns, session duration and interaction data, and error logs for troubleshooting. This information helps us identify technical issues, optimize platform design, prevent fraud and security threats, and develop features that serve users better.

2. Information Use - How We Apply Your Data
Every piece of information we collect serves specific, legitimate purposes that directly benefit your platform experience or fulfill legal obligations. We don't use your data arbitrarily or for purposes unrelated to operating and improving Amoria Connekyt.

We use your information to provide and improve our services by maintaining your account and profile, processing bookings and transactions, facilitating communication between users, delivering customer support, resolving disputes fairly, and personalizing your experience based on preferences and behavior. For creators, this means showcasing portfolios to relevant clients; for clients, this means receiving recommendations matched to project requirements.

Matching clients with appropriate photographers and videographers relies heavily on the information you provide. Our platform uses location data, project requirements, service specialties, pricing ranges, availability calendars, past reviews and ratings, and creator portfolios to connect clients with creators who can best serve their needs. This intelligent matching improves outcomes for both parties and reduces time spent searching.

Processing payments and transactions securely requires using your financial and identity information. We verify payment methods, collect funds from clients and hold them in escrow, release payments to creators upon project completion, maintain transaction records for accounting and tax compliance, detect and prevent fraudulent transactions, and comply with Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) regulations as required by Rwanda's Law No. 69/2018.

Sending relevant communications keeps you informed about your bookings, account activities, and platform updates. We send booking confirmations and reminders, payment receipts and notifications, messages from other platform users, account security alerts, policy updates and changes, and with your consent, promotional materials about new features, special offers, or platform news. You can opt out of promotional communications while continuing to receive essential service notifications.

3. Data Retention - How Long We Keep Information
We don't retain your data indefinitely. Our retention practices balance operational needs, legal requirements, and privacy principles. Data is kept only as long as necessary to fulfill the purposes for which it was collected or as required by applicable laws.

Active account data remains accessible while your account is active. This includes your profile information, portfolio content, transaction history, communications, and settings. You need this information readily available to use the platform effectively, and we maintain it to provide continuous service.

Specific retention periods apply to different data types after account closure or inactivity. Transaction records and financial data are retained for 7 years as required by Rwandan tax law and international financial regulations. This extended retention supports tax audits, financial investigations, and regulatory compliance. KYC verification documents are retained for 5 years following your last transaction to comply with AML/CTF requirements under Rwanda's Law No. 69/2018.

Communication logs and technical data are typically retained for 12 months for security auditing, fraud investigation, and platform debugging purposes. After this period, they're deleted or anonymized into statistical summaries that don't identify individuals. Analytics data may be retained longer in anonymized form to inform long-term platform strategy and improvement.

Upon account deletion, we delete personal information from active systems within 30 days, though some data must be retained longer due to legal requirements. Backups are deleted as backup cycles naturally expire (typically 30-90 days). We document all deletion requests and ensure that data isn't reintroduced if old backups are restored.

4. Third-Party Sharing - When and Why We Share Data
Your privacy and trust are fundamental. We do not sell, rent, or trade your personal data to third parties for marketing purposes. We only share information when necessary to deliver services, comply with legal obligations, or with your explicit consent.

Other platform users see certain information to enable connections and transactions. Your public profile (name, photo, biography, portfolio for creators) is visible to users browsing the platform. When you book a creator or accept a client booking, relevant contact information and project details are shared to facilitate the collaboration. However, sensitive information like full contact details, payment information, and private messages remain protected.

Payment processors (Pesapal, Flutterwave, JengaPay) receive necessary transaction information to process payments securely. This includes billing addresses, transaction amounts, and tokenized payment methods. All payment data is encrypted during transmission using SSL/TLS protocols. We never share complete credit card numbers—these are handled exclusively by our PCI DSS-compliant payment partners.

Service providers and technology partners assist with various operational functions. Cloud hosting providers store data in encrypted servers located in Rwanda, EU, Kenya, or South Africa. Analytics services help us understand platform usage patterns. Identity verification partners assist with KYC compliance. Email and communication tools enable notifications and support. All service providers are bound by strict confidentiality agreements and process data only for specified purposes.

Legal or government bodies may receive information when required by law or necessary to protect rights and safety. We comply with valid legal processes (court orders, subpoenas, warrants), cooperate with law enforcement investigations, report suspicious activities for AML/CTF compliance as required by Rwandan law, and may disclose information to prevent fraud, investigate security threats, or respond to illegal activities.

5. User Rights - Your Control Over Personal Data
You have significant rights regarding your personal information under Rwanda's Data Protection and Privacy Law No. 058/2021, GDPR (for EU users), and our own commitment to privacy. These rights give you meaningful control over your data.

Users have the right to access, modify, or delete their personal information at any time. You can view and update most information through your account settings, including profile details, service offerings, portfolio content, communication preferences, and payment information. For data you cannot edit directly, contact privacy@amoriaglobal.com to request access to all data we hold about you, correction of inaccurate information, deletion of data (subject to legal retention requirements), restriction of processing for certain purposes, data portability in machine-readable formats, or objection to processing based on legitimate interests.

We respond to rights requests within 30 days as required by Rwandan law, though we typically respond much faster for straightforward requests. Complex requests may take up to 60 days with notification of the extension. Most requests are handled free of charge, though we may charge reasonable fees for manifestly excessive or repetitive requests.

If you believe your privacy rights have been violated, you can file a complaint with Rwanda's National Cyber Security Authority (NCSA) at www.ncsa.gov.rw. EU residents can contact their local data protection authority. We encourage you to contact us directly first, as we're committed to resolving issues cooperatively.

6. Compliance and International Standards
We comply with all applicable data protection regulations to ensure your information receives the highest level of protection regardless of where you're located or where data is processed.

Rwanda's Data Protection and Privacy Law No. 058/2021 governs our operations and grants you specific rights regarding personal data. As a Rwandan-based company, we're registered with and overseen by the National Cyber Security Authority (NCSA). We implement technical and organizational measures required by the law, honor data subject rights, and maintain comprehensive documentation of our data processing activities.

GDPR (General Data Protection Regulation) protections apply to users located in the European Union. We implement GDPR requirements including lawful bases for processing, enhanced consent mechanisms, data protection by design and default, privacy impact assessments for high-risk processing, and data breach notification within 72 hours. EU users have additional rights and protections under GDPR beyond those provided by Rwandan law.

International data transfers are protected through Standard Contractual Clauses (SCCs), adequacy decisions for transfers within the EU, the EU-US Data Privacy Framework for certified US service providers, and transfer impact assessments ensuring your rights remain protected. We only transfer data internationally when adequate safeguards are in place and we maintain documentation of all cross-border data flows.

ISO 27001 and ISO 27701 compliance demonstrates our commitment to information security and privacy management. We implement these international standards throughout our operations, undergo regular audits by independent assessors, and continuously improve our security and privacy practices.

Security measures protecting your data include SSL/TLS encryption for all data in transit, AES-256 encryption for data at rest, multi-factor authentication for administrative access, role-based access controls limiting who can access what data, 24/7 security monitoring and intrusion detection, regular security audits and vulnerability assessments, and incident response protocols for data breaches.

For Complete Privacy Information:
This summary covers the essential aspects of our privacy practices, but for comprehensive details about all privacy rights, data protection measures, cookie policies, international transfers, children's privacy, and contact information for privacy requests, please review our complete Privacy Policy at www.amoriaconnect.com/privacy-policy or contact our privacy team at privacy@amoriaglobal.com.

Your privacy matters to us. We're committed to handling your personal information with care, transparency, and respect for your rights at every stage of our relationship.`
    },
    {
      id: 'cookie-policy',
      title: 'Cookie Policy',
      content: `Cookies are an essential part of how modern websites and applications function, enabling personalized experiences, maintaining security, and helping us improve our services. This Cookie Policy explains what cookies are, how Amoria Connekyt uses them, what types of cookies we deploy, and how you can control cookie settings to match your privacy preferences.

Understanding cookies empowers you to make informed decisions about which technologies you're comfortable accepting. While some cookies are absolutely necessary for our platform to function, others are optional and exist to enhance your experience or help us understand how users interact with our services.

1. What Are Cookies and Why We Use Them
Cookies are small text files—typically just a few kilobytes—stored on your device (computer, smartphone, or tablet) when you visit our platform. Despite their somewhat ominous-sounding name, cookies are simply data storage mechanisms that help websites remember information about your visit and preferences.

Think of cookies as digital sticky notes that remind our servers about you when you navigate between pages or return to our platform. Without cookies, you'd have to log in again every time you clicked a link, re-enter your preferences with each visit, and lose your place in multi-step processes like booking services or building your portfolio.

Cookies help us provide a better user experience in numerous ways. They keep you logged in as you navigate between pages, eliminating the frustrating need to repeatedly enter credentials. They remember your preferences and settings such as language choice, display options, notification preferences, and search filters, so you don't have to configure them repeatedly. They enable essential platform functionality like shopping cart features, booking workflows, and session management.

Beyond functionality, cookies help us analyze platform usage to understand what's working well and what needs improvement. They provide insights into which features are most popular, where users encounter difficulties, how people navigate through the platform, and what content or services generate the most interest. This intelligence guides our development priorities and helps us build features users actually want.

Cookies also support security measures by detecting suspicious login patterns or preventing certain types of attacks like Cross-Site Request Forgery (CSRF). They help us identify potential fraud attempts and protect your account from unauthorized access.

2. Types of Cookies We Use on Amoria Connekyt
Not all cookies serve the same purpose. We categorize cookies based on their function, which helps you understand what each type does and decide which you're comfortable accepting.

Essential Cookies (Strictly Necessary) are absolutely required for our platform to function properly. Without them, core features simply wouldn't work. These cookies handle authentication by keeping you logged in, verifying your identity, and managing your active session. They provide security protections by preventing cross-site request forgery attacks, detecting suspicious activity, and protecting against unauthorized access. They enable basic platform operations including page navigation, form submission, error handling, and state management across multi-step processes.

Essential cookies also support critical account management functions like accessing your profile, viewing your dashboard, managing bookings, and adjusting settings. We cannot provide our service without these essential cookies, which is why they're typically exempt from cookie consent requirements under privacy laws—they're necessary to fulfill our contract with you. You cannot disable essential cookies while actively using our platform, though you can delete them after closing your session through your browser settings (though you'll need to log in again when you return).

Analytics and Performance Cookies help us understand how users interact with our platform so we can identify areas for improvement and measure the effectiveness of changes. These cookies track usage patterns including which pages are most visited, how long users spend on different sections, where users encounter difficulties or drop off, what features are most popular, and how users navigate through the platform.

This information is typically collected in aggregate form, meaning we see overall trends rather than tracking specific individuals in detail. For example, we might learn that "65% of clients browse at least 5 photographer portfolios before booking" rather than "Jane Smith from Kigali viewed 7 profiles at 3:42 PM." These insights are invaluable for product development—they help us prioritize features that users actually want, fix issues that cause frustration, optimize page layouts and navigation, and measure whether new features improve or harm user experience.

We use analytics services like Google Analytics for these purposes. You can opt out of analytics cookies through our cookie preference center or browser settings without losing access to core platform features.

Preference and Functionality Cookies remember your choices and settings to provide a personalized experience tailored to your preferences. They store information about your language preferences (English, French, Kinyarwanda, etc.), display settings and customization options, notification preferences determining how and when you want to be contacted, recently viewed photographers or portfolios for easy reference, saved searches or bookmarked profiles for quick access, and communication preferences for platform interactions.

These cookies enhance your experience by eliminating the need to repeatedly configure settings every time you visit. If you disable preference cookies, you'll still be able to use the platform, but it will reset to default settings with each visit, which can be inconvenient and time-consuming.

Marketing and Advertising Cookies track your interests and browsing behavior to deliver targeted advertising and promotional content that's relevant to you. They're used to display personalized ads on our platform and other websites you visit, limit how many times you see the same advertisement (frequency capping), measure advertising campaign effectiveness and return on investment, and create audience segments for targeted marketing based on behavior and interests.

Marketing cookies are the most privacy-sensitive category because they track behavior across sessions and sometimes across websites. We only deploy marketing cookies with your explicit consent—they're not activated unless you specifically agree to them through our cookie banner or preference center. You can withdraw consent at any time, and we'll stop collecting data through these cookies going forward. Withdrawing consent doesn't delete data previously collected, but it prevents future collection.

Social Media Cookies enable social sharing features and social login functionality. If you interact with social media features on our platform—such as sharing a photographer's portfolio on Facebook or using social login to create your account—cookies from those social networks may be placed on your device. These cookies enable social sharing functionality, facilitate social login options without separate password creation, track social media engagement (likes, shares, comments), and may be used by the social networks for their own purposes including targeted advertising.

Social media cookies are controlled by the respective social networks (Facebook, Instagram, LinkedIn, Twitter/X, etc.), and their privacy policies govern how they use this data. You can control social media cookies through your accounts on those platforms or by avoiding social features on our site.

3. Managing and Controlling Cookies - Your Choices
We believe you should have meaningful control over cookies and tracking technologies. We provide multiple ways to manage cookie settings according to your privacy preferences.

Browser Settings provide the most universal control over cookies. All modern web browsers (Chrome, Firefox, Safari, Edge, Opera) allow you to control cookies through built-in privacy or security settings. Through your browser, you can block all cookies (though this may break website functionality), block only third-party cookies while allowing first-party cookies, delete cookies after each browsing session automatically, set exceptions for specific websites you trust, or view and delete individual cookies currently stored.

Access cookie settings through your browser's privacy or security menu—specific instructions vary by browser, but all provide similar controls. Blocking all cookies may prevent you from using Amoria Connekyt or other websites effectively, as essential functionality will break. Blocking third-party cookies is a reasonable compromise that maintains functionality while reducing tracking.

Our Cookie Preference Center provides granular control specifically for Amoria Connekyt cookies. Access it through your account settings or the cookie banner that appears when you first visit our platform. Through the preference center, you can view all cookie categories we use with detailed descriptions, enable or disable non-essential cookies by category (analytics, marketing, social media), see details about specific cookies including their purpose, duration, and provider, update your choices at any time as your preferences change, and export your cookie preferences for your records.

Changes made in our cookie preference center are applied immediately and respected across all future sessions. Your preferences are stored (using a cookie, ironically) so we remember your choices. If you clear all cookies or switch devices, you'll need to set your preferences again.

Third-Party Opt-Out Tools provide additional control over advertising and tracking cookies from third parties. For third-party advertising cookies, you can use industry opt-out tools like the Digital Advertising Alliance's opt-out page (optout.aboutads.info), Network Advertising Initiative's opt-out page (optout.networkadvertising.org), or European Interactive Digital Advertising Alliance (EDAA) for EU users. Browser extensions that block tracking cookies, such as Privacy Badger, uBlock Origin, or Ghostery, can also prevent third-party tracking.

Note that opting out of advertising cookies typically means you'll still see ads, but they won't be personalized based on your interests. You'll see generic ads instead of ones tailored to your browsing behavior and preferences.

You may disable non-essential cookies via browser settings or our preference center without losing access to core platform functionality. However, some features may not work optimally—for example, we won't remember your language preference, your portfolio search filters will reset with each visit, and you'll need to log in more frequently as session cookies expire faster.

4. Cookie Consent and Your Choices
When you first visit Amoria Connekyt, you'll see a cookie banner explaining our cookie usage and requesting your consent for non-essential cookies. This banner complies with privacy regulations by providing clear information about cookies, offering granular choices for different cookie categories, enabling you to accept all, reject non-essential, or customize preferences, and allowing you to change your mind later through our preference center.

By clicking "Accept All," you consent to our use of all cookies described in this policy, including analytics and marketing cookies. By clicking "Reject Non-Essential," you consent only to essential cookies necessary for platform functionality—analytics, marketing, and optional functionality cookies are disabled. By clicking "Customize," you can review each cookie category and enable or disable specific types according to your preferences.

Essential cookies are activated by default because they're necessary for the platform to function. You cannot opt out of essential cookies while using our services, but you can delete them after your session through browser settings.

Your consent is stored so we don't repeatedly ask you with every visit. This consent record itself requires a cookie (an essential one). If you clear cookies from your browser, you'll see the cookie banner again on your next visit since we've forgotten your previous choice.

5. Cookie Duration and Expiration
Cookies have limited lifespans, after which they automatically expire and are deleted. Understanding cookie duration helps you know how long information is retained in these small files.

Session Cookies exist only during your browsing session and are automatically deleted when you close your browser. These temporary cookies are typically used for authentication (maintaining your login while you navigate), shopping cart or booking functionality (remembering selections during multi-step processes), security tokens for CSRF protection, and maintaining temporary state during your visit.

Session cookies are the most privacy-friendly type because they don't persist after you leave. Once you close your browser, all session cookies are automatically removed.

Persistent Cookies remain on your device for a specified period, even after you close your browser. They're used to remember preferences across sessions so you don't reconfigure settings each visit, enable "remember me" login functionality that keeps you logged in between visits, track analytics over time to understand user behavior patterns, and maintain advertising profiles for personalized marketing.

Persistent cookies we use typically expire within 1-2 years, though some may have shorter or longer lifespans depending on their purpose. For example, a preference cookie might last 1 year, an analytics cookie 2 years, and a marketing cookie 90 days. You can manually delete persistent cookies through your browser settings at any time, regardless of their set expiration date.

Cookie expiration is an important privacy protection—even if you never manually clear cookies, they eventually expire and are removed automatically. This prevents indefinite tracking and ensures that old data doesn't accumulate endlessly on your device.

6. Third-Party Cookies and Services
In addition to cookies we set directly (first-party cookies), our platform uses cookies from trusted third-party services (third-party cookies). These external services provide specialized functionality that enhances your experience.

Google Analytics is the world's most widely used web analytics service, and we use it for detailed usage analysis and performance monitoring. Google Analytics cookies track page views, bounce rates, user demographics, traffic sources, conversion rates, and user flow through the platform. This data helps us understand which features are succeeding, where users struggle, and how to improve the overall experience. Google Analytics data is typically aggregated and anonymized after a certain period. You can opt out of Google Analytics through browser extensions like the Google Analytics Opt-out Browser Add-on or through our cookie preference center.

Payment Processor Cookies from our payment partners (Pesapal, Flutterwave, JengaPay) are used for transaction security and fraud prevention. These cookies help verify that you're the legitimate account holder, detect potentially fraudulent transaction patterns, maintain payment session security during checkout, and enable seamless payment experiences. Payment security cookies are typically categorized as essential because they're necessary for secure financial transactions.

Social Media Platform Cookies are set when you use social features on our platform or log in via social media accounts. Cookies from platforms like Facebook, Instagram, LinkedIn, and Twitter/X enable social login without separate password creation, allow sharing content to your social feeds, display social engagement metrics (likes, shares), and may personalize social media ads based on your platform activity. You can control social media cookies through your accounts on those platforms, through privacy settings on each social network, or by avoiding social features on our site.

Video Hosting Services may set cookies if we embed videos showcasing photographer portfolios or platform tutorials. Cookies from video hosting services (YouTube, Vimeo) enable video playback functionality, remember playback preferences (volume, quality, playback position), track viewing statistics, and may personalize video recommendations.

All third-party services we integrate with are carefully selected based on their privacy practices, security credentials, and compliance with data protection regulations. However, third-party cookies are governed by those services' own privacy policies, not just ours.

7. Updates to This Cookie Policy
Technology evolves, and so do our cookie practices. As we adopt new tools, respond to changing regulations, or improve our platform, we may update our cookie usage. When we make significant changes to our cookie practices, we'll communicate these updates through email notifications to registered users, prominent notices on our website or app when you first visit after the change, and updates to this Cookie Policy with revised "last updated" dates.

We'll also provide updated consent options if we introduce new cookie categories or purposes that weren't previously covered by your consent. You'll have the opportunity to review and approve (or decline) these new uses before they're activated.

Our Commitment to Transparency:
Cookies are powerful tools that enhance your experience and help us improve our platform, but that power must be balanced with respect for your privacy and choices. We're committed to being transparent about what cookies we use, why we use them, and how to control them. If you have questions about our cookie practices, contact privacy@amoriaglobal.com.

For more detailed information about our broader privacy practices, please review our complete Privacy Policy at www.amoriaconnect.com/privacy-policy.`
    },
    {
      id: 'client-payment',
      title: 'Client Payment Agreement',
      content: `As a client booking photography or videography services through Amoria Connekyt, you enter into a payment agreement that governs how funds are collected, held, and released. This agreement protects your interests while ensuring creators receive fair compensation for their work. Understanding these payment terms helps you navigate bookings confidently and avoid surprises.

This Client Payment Agreement works in conjunction with our broader Hold & Release payment system but focuses specifically on your obligations and protections as a client. By booking services through our platform, you agree to these payment terms.

1. Payment Terms and Obligations
When you book a creator's services through Amoria Connekyt, you agree to pay all fees as outlined in the service agreement established between you and the creator. This agreement includes the total service cost (the amount the creator charges for their work), platform fees (Amoria Connekyt's commission for facilitating the connection and providing platform services), payment processing fees (charged by our payment gateway partners - typically 2-5% depending on payment method), and any additional agreed charges such as travel expenses, rush delivery fees, extra revision rounds, or specialized equipment rental.

Payment is due according to the agreed schedule, which for most bookings means full payment upfront when you confirm the booking. This upfront payment doesn't mean the creator receives all funds immediately—remember our Hold & Release system holds 50% in escrow until you approve deliverables. The upfront requirement demonstrates your commitment, secures the creator's time (they turn down other opportunities for your date), and enables our escrow protection system to function.

For larger projects, creators may offer milestone-based payment schedules where you pay in installments as certain milestones are reached. These custom arrangements must be agreed upon before booking and documented through our platform.  All payment terms are clearly displayed before you confirm any booking, so review them carefully and ask questions if anything is unclear.

2. Accepted Payment Methods
We accept a wide range of payment methods to accommodate users across different regions and preferences. Through our licensed payment gateway partners (Pesapal, Flutterwave, and JengaPay), you can pay using major credit cards including Visa, Mastercard, and American Express; debit cards linked to your bank account; mobile money services popular in Rwanda and across Africa (MTN Mobile Money, Airtel Money, Tigo Cash); bank transfers for users who prefer direct banking; and digital wallets including PayPal where available.

All payments are processed securely through our payment partners using industry-standard encryption and security protocols (PCI DSS Level 1 compliance). When you enter payment details, that information goes directly to these trusted processors—we never see or store your complete credit card numbers on our servers. This arrangement protects your financial data while enabling smooth, secure transactions.

Payment method fees vary slightly. Credit cards typically incur 2-5% processing fees, mobile money 1-3%, and bank transfers minimal fees. These processing fees are disclosed before you complete payment, and they're non-refundable even if you cancel and receive a refund for the service itself (as explained in our Cancellations & Refunds policy).

3. Late Payment Consequences
Payment is required upfront for most bookings—you must pay before the creator begins work or blocks time on their calendar. However, for milestone-based projects with installment payments, late payment of scheduled installments can cause problems.

Late payments may incur additional fees as specified in your service agreement. More significantly, late payment may result in service suspension—the creator can pause work until payment is received, which could delay your project timeline. If payment remains outstanding for an extended period, the booking may be cancelled and the creator released from obligations. For projects where work has already commenced, you'll still owe payment for completed milestones even if the overall project is cancelled due to late payment.

We strongly recommend setting up payment reminders, enabling autopay for installment plans if available, communicating with creators promptly if you anticipate payment difficulties, and honoring your payment commitments as agreed.

4. Payment Disputes and Resolution
Disputes about payments should be rare if terms are clearly established upfront, but occasionally disagreements arise about charges, deliverables, or billing.

Any payment disputes must be reported within 14 days of the transaction through our platform's dispute resolution system. Prompt reporting enables us to investigate while memories are fresh and evidence is readily available. After 14 days, resolving disputes becomes much more difficult, and we may not be able to assist.

Valid reasons for payment disputes include unauthorized charges you didn't approve, incorrect billing amounts that don't match agreed terms, double-charging or duplicate transactions, services not rendered where the creator failed to deliver agreed work, or significant quality issues where deliverables fall materially short of contracted specifications.

To dispute a payment, access your transaction history through your dashboard, select the transaction in question, click "Dispute Payment" or "Report Issue," provide a detailed explanation of the problem with supporting evidence (communications, contracts, examples of work), and submit your dispute. Our Support Desk will review the evidence, contact both parties for their perspectives, mediate to find fair resolution, and make a determination typically within 5-7 business days.

Possible dispute resolutions include full or partial refunds if evidence shows you didn't receive agreed services, payment release to creator if work meets contracted specifications and your dispute is deemed invalid, compromise solutions where both parties share costs, or additional work/revisions from the creator to meet specifications.

5. Deposits and Booking Security
Many creators require deposits to secure bookings, particularly for high-value events like weddings or projects requiring significant advance preparation. Deposit amounts and terms are set by individual creators within our platform guidelines (typically 25-50% of total cost).

Deposits serve important purposes: they demonstrate your serious commitment to the booking, compensate creators for time spent on preparation and planning, protect creators from last-minute cancellations that leave them unable to book alternative work, and secure your preferred date on the creator's calendar.

Deposit refund eligibility follows the same policies as full payments—full refund if you cancel within 24 hours of booking, partial refund if you cancel after 24 hours but before project start (depending on work completed), and limited or no refund if you cancel after project commencement. Creator cancellations result in full deposit refunds with no deductions.

Deposits are applied toward your total balance. For example, if you pay a $500 deposit on a $2,000 project, you'll owe $1,500 when final payment is due.  Deposit terms (amount, due date, refund conditions) are clearly stated in booking agreements. Review them carefully before confirming.

6. Payment Confirmation and Records
Transparency and documentation are essential for smooth transactions. All successful payments receive immediate confirmation providing you with clear records of your financial commitments.

Upon payment completion, you receive immediate email confirmation sent to your registered email address containing transaction details including transaction ID (unique identifier for the payment), amount paid (including breakdowns of service cost, platform fees, and processing fees), payment date and time, payment method used, booking details (which creator, which service, which date), and receipt or invoice for your records.

Additionally, comprehensive transaction history is accessible through your dashboard showing all payments made, deposits and balances, escrow status (funds held vs. released), refunds processed, and invoices available for download. This history supports expense tracking for personal budgeting, tax documentation for business expense claims, proof of payment if questions arise, and financial planning for future projects.

We recommend downloading and saving receipts for your records, particularly for business bookings where you may need documentation for expense reporting or tax purposes. If you need duplicate receipts or official invoices, access your transaction history or contact support@amoriaconnect.com.

Your Financial Protection:
This payment agreement is designed to protect your interests while facilitating fair transactions with creators. Our Hold & Release system ensures you don't pay in full until you're satisfied with deliverables. Our dispute resolution process provides recourse if problems arise. And our transparent fee structure ensures you know exactly what you're paying for. By understanding and honoring these payment terms, you contribute to a thriving marketplace where clients receive quality services and creators are compensated fairly for their talents.`
    },
    {
      id: 'photographer-payment',
      title: 'Photographer Payment Agreement',
      content: `As a creator (photographer, videographer, or media professional) earning income through Amoria Connekyt, you enter into a payment agreement that governs when and how you receive compensation for your work. This agreement is designed to ensure fair, timely payments while protecting against fraud and maintaining compliance with financial regulations.

Understanding these payment terms helps you manage cash flow, plan your finances, and know exactly what to expect as you complete projects and deliver exceptional work to clients. By offering your services through our platform, you agree to these creator payment terms.

1. Payment Processing Timeline and Procedures
The timing of when you receive payment depends on our Hold & Release system and client approval of your deliverables. Here's exactly how the process works from booking to payout.

When a client books your services, they pay the full amount upfront. Immediately upon payment, 50% of the booking amount is released to your account as an initial payment. This immediate partial payment recognizes that you're committing your time and turning down other opportunities for this client's date. It provides you with cash flow security before you even begin work. The remaining 50% is held in secure escrow and will be released when the client approves your final deliverables.

After you complete the project and upload deliverables to the platform, you notify the client that work is ready for review. The client then has a review period (typically 7-14 days depending on project scope) to examine your work and either approve it, request revisions as specified in your service agreement, or raise concerns about quality or completeness. Upon client approval of deliverables, Amoria Connekyt processes the balance release from escrow to your account.

Photographers and videographers will receive final payments within 3-5 business days after client approval. This processing window accounts for payment gateway processing times, banking system transfers, and anti-fraud verification checks. The exact timing depends on your chosen payout method—bank transfers typically take 3-5 business days, PayPal or digital wallet transfers 1-3 business days, and mobile money transfers 1-2 business days.

If the client doesn't respond within the review period and hasn't raised any disputes, we automatically approve the release to prevent indefinite holds on your payment. This automatic approval protects you from clients who simply don't respond after receiving satisfactory work. However, if a client raises legitimate concerns about deliverables not meeting agreed specifications, the funds remain in escrow until the dispute is resolved through our mediation process.

2. Payment Schedules for Different Project Types
Different types of projects may have different payment structures to accommodate varying workflows and timelines.

Milestone-based projects involve payment upon completion of each defined milestone. For larger, complex projects that span weeks or months, you and the client can establish milestones—specific stages of completion that trigger payment releases. For example, a commercial videography project might have milestones like 25% upon filming completion, 25% upon rough cut delivery, and 50% upon final edited video approval. Each milestone must be clearly defined in your service agreement with specific deliverables and approval criteria. Upon completing and delivering a milestone, the associated payment releases following client approval.

Event photography follows a straightforward timeline: payment release within 5 business days of event completion and final delivery. Since event photography typically involves a single shoot followed by editing and delivery, the payment process is simple—50% upon booking, 50% when you deliver final edited images and the client approves them.

Ongoing projects or retainer relationships may use monthly payment cycles where work performed during each calendar month is reviewed and paid at month-end. This structure works well for creators who provide regular, recurring services to clients (such as monthly product photography for e-commerce businesses or regular event coverage). Monthly payments are processed within 5 business days after the client approves that month's deliverables.

All payment schedules must be documented in your service agreement established through our platform. Clear documentation prevents disputes and ensures both you and clients understand expectations.

3. Tax Responsibilities and Financial Compliance
While Amoria Connekyt facilitates payments and maintains transaction records, you remain responsible for your own tax obligations as an independent professional or business entity.

Creators are responsible for reporting all income earned through Amoria Connekyt to relevant tax authorities in their jurisdiction and paying applicable taxes according to local laws. This includes income tax on your earnings, Value Added Tax (VAT) or sales tax if applicable in your region, social security or self-employment taxes, and any business taxes if you operate as a registered company.

You should maintain appropriate financial records to support tax compliance and business management. Keep detailed records of all transactions, bookings, and payments; save receipts for business expenses (equipment, travel, software subscriptions, etc.); track income by client and project for accurate reporting; and maintain records for at least 7 years as required by most tax authorities.

Amoria Connekyt provides tools to assist with your tax reporting obligations. Your creator dashboard includes comprehensive transaction histories showing all earnings by date, project, and client; annual earnings summaries for tax filing purposes; downloadable invoices and receipts for each transaction; and export functionality to integrate with accounting software. However, we are not tax advisors, and we cannot provide tax advice specific to your situation.

We strongly recommend consulting with qualified tax professionals or accountants in your region to ensure proper compliance with all tax obligations, understand what business expenses you can deduct, determine whether you should register as a business entity, and establish bookkeeping systems appropriate for your circumstances.

For Rwandan creators, remember that you may need a Tax Identification Number (TIN) and potentially VAT registration depending on your income level. International creators should understand tax treaty implications and reporting requirements in their home countries.

4. Payout Methods and Options
We offer multiple payout methods to accommodate creators across different regions and preferences, ensuring you can receive earnings in the way that works best for you.

Payments can be issued via bank transfer (direct deposit) to your bank account—this is the most common and often most cost-effective method. Provide your complete bank details including bank name, account number, routing/SWIFT code for international transfers, and account holder name exactly as it appears on your bank account. Bank transfers typically take 3-5 business days and may incur minimal fees depending on your bank.

PayPal or digital wallet options are available where supported. These transfers are typically faster (1-3 business days) and convenient for creators who actively use these platforms. However, PayPal and similar services charge their own fees (typically 2-5% of the transaction amount), which are deducted before you receive funds.

Mobile money services popular in Rwanda and across Africa (MTN Mobile Money, Airtel Money, Tigo Cash) provide fast, convenient payouts especially for creators without traditional bank accounts. Mobile money transfers typically complete within 1-2 business days and have low fees. This option is particularly valuable for creators in regions where mobile money is more accessible than banking.

Other approved payment methods may be available depending on your location. Contact our support team if you need alternative payout options not listed above.

To set up or change your payout method, access your account settings, navigate to "Payment Information" or "Payout Methods," enter and verify your payment details, and save your preferences. We recommend setting up and verifying your payout method before completing your first project to avoid delays in receiving payment.

5. Minimum Payout Threshold and Balance Accumulation
To minimize transaction fees and processing overhead, we implement a minimum payout threshold before releasing payments to your external accounts.

The minimum payout threshold is $100 (or equivalent in your local currency). This means that we accumulate your earnings until they reach at least $100 before processing a payout to your bank account, PayPal, or mobile money account. Amounts below this threshold remain in your Amoria Connekyt account balance and accumulate until the threshold is reached.

For example, if you complete a project earning $60, that amount is credited to your platform balance but not immediately paid out. When you complete another project earning $75, your total balance becomes $135, which exceeds the threshold, and we process a payout for the full $135.

This threshold policy benefits you by reducing transaction fees (many payment methods charge per-transaction fees, so fewer larger transactions mean lower overall fees), minimizing banking fees that accumulate with many small transfers, and simplifying accounting with consolidated payouts rather than dozens of small transactions.

However, you have options if you need funds before reaching the threshold. Manual payout requests can be submitted for amounts below $100, though these may incur higher processing fees (typically a flat fee of $5-10 or percentage fee of 5-10%). To request early payout, contact support@amoriaconnect.com with your request and reason, and we'll process it within 5-7 business days, disclosing any applicable fees before you confirm.

Your platform balance is always visible in your dashboard. You can track accumulated earnings, see how close you are to the payout threshold, view pending amounts still in escrow, and access complete transaction history showing every deposit, payout, and fee.

6. Payment History and Financial Documentation
Transparency and comprehensive record-keeping are essential for managing your creative business professionally.

Complete payment history and transaction records are available in your creator dashboard, providing detailed information about every aspect of your earnings. Your dashboard shows all payments received from clients broken down by project and date, platform fees deducted (our commission for facilitating transactions), payment processing fees, payout history showing transfers to your bank or payment account, pending balances in escrow awaiting client approval, current available balance ready for payout, and cumulative earnings over various time periods (monthly, quarterly, annually).

For each transaction, you can access detailed information including client name and project details, service provided and booking date, total amount paid by client, your earnings after platform and processing fees, payment status (pending, completed, disputed), approval dates and payout dates, and associated invoices or receipts.

These records serve multiple important purposes. They provide proof of income for tax filing and financial planning, support expense tracking and profitability analysis by project or client type, enable cash flow forecasting to predict future earnings, assist in business planning and growth strategies, and provide documentation for loans, mortgages, or other financial applications requiring proof of income.

You can export transaction data in various formats including CSV for spreadsheets and accounting software, PDF for reports and formal documentation, or JSON for integration with custom systems. Export options allow you to filter by date range, client, project type, or other criteria, making it easy to generate exactly the reports you need.

We recommend downloading and archiving your transaction records at least quarterly to maintain backups independent of our platform, support tax preparation and filing, track business performance over time, and have records available even if you later close your account.

Your Earnings, Secured and Supported:
This payment agreement ensures you receive fair, timely compensation for your creative work. Our Hold & Release system provides immediate partial payment upon booking, full payment upon client approval, and escrow protection against non-payment. Our transparent fee structure, comprehensive transaction records, and multiple payout options give you control and flexibility over your earnings. By understanding and working within these payment terms, you build a sustainable creative business supported by reliable, professional payment infrastructure.`
    },
    {
      id: 'connekyt-team',
      title: "'connekyt Team' Software Licence Agreement",
      content: `Connekyt Team is specialized software designed to help photography and videography businesses manage teams, coordinate projects, and streamline operations through the Amoria Connekyt platform. If you use Connekyt Team software—whether as a creator managing assistants and second shooters or as a business coordinating multiple photographers—this Software License Agreement governs your rights and obligations.

Software licenses define what you can and cannot do with proprietary technology. Understanding these terms ensures you use Connekyt Team legally and appropriately while protecting both your interests and our intellectual property rights.

1. License Grant and Scope
Subject to your compliance with this agreement and our Terms of Service, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Connekyt Team software for legitimate business purposes related to the Amoria Connekyt platform.

This license is limited in important ways. It's non-exclusive, meaning we can license the same software to other users—you don't have exclusive rights. It's non-transferable, meaning you cannot sell, give away, or transfer your license to another person or entity without our written permission. It's revocable, meaning we can terminate it if you violate the terms or upon account closure. The license permits access and use for business purposes related to photography, videography, and media services offered through Amoria Connekyt.

Authorized uses under this license include managing team members, assistants, and second shooters; coordinating bookings and project assignments across your team; collaborating on portfolio management and client communications; organizing schedules, calendars, and availability; tracking team performance and project completion; accessing analytics and reporting features; and communicating with clients and team members through the platform.

This license grants you the right to use the software as provided through our platform or app, but it does not grant ownership of the software itself, source code, or underlying technology. Amoria Global Tech Ltd. retains full ownership of all software, technology, and related intellectual property.

2. Usage Restrictions and Prohibited Activities
To protect our technology, maintain security, and ensure fair use across all users, this license includes important restrictions on how you may use Connekyt Team software.

You may not reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code or underlying algorithms of the software. This restriction protects our proprietary technology and trade secrets. Reverse engineering would allow copying our innovation without the investment we've made in developing it. Violating this restriction may result in legal action beyond simple license termination.

You may not modify, adapt, translate, or create derivative works based on the software. The software is provided as-is through our platform, and you must use it in its unmodified form. Custom modifications could introduce security vulnerabilities, break functionality, or create compatibility problems. If you need features or functionality not currently available, contact us with feature requests rather than attempting to modify the software yourself.

You may not sublicense, redistribute, rent, lease, or loan the software to third parties. Your license is for your use only (or your business entity's use). You cannot act as a reseller or intermediary providing access to others. If you want to provide platform access to team members, they should be added through proper team management features within the software, not through sharing or redistributing your license.

You may not use the software for competitive purposes, including creating competing platforms, reverse engineering features to copy in competing products, extracting data or features to build alternative services, or benchmarking without written permission for purposes of competitive analysis.

You may not use the software for any illegal activities, fraud, harassment, spam, or malicious purposes; to infringe intellectual property rights of others; to transmit viruses, malware, or harmful code; to bypass security measures or access restrictions; or in ways that violate our Terms of Service or community guidelines.

3. Updates, Maintenance, and Support
Your license includes certain benefits related to keeping the software current and functional, as well as assistance when you need help.

Software updates and improvements are included in your license at no additional charge. We regularly release updates that add new features and capabilities, fix bugs and technical issues, improve performance and user experience, enhance security and fix vulnerabilities, and ensure compatibility with new devices and operating systems. Updates are typically deployed automatically through our web platform or via app updates through your device's app store. You should keep your software current to benefit from the latest features and security improvements.

Basic technical support is included with your Connekyt Team license. Basic support includes access to help documentation, FAQs, and knowledge base; email support with responses typically within 24-48 hours; troubleshooting assistance for technical problems; guidance on using features and functionality; and assistance with account and billing questions. Basic support is provided during business hours (Kigali time, UTC+2) on weekdays.

Premium support is available with additional subscription fees for users who need faster response times or dedicated assistance. Premium support includes priority email and phone support with faster response times (typically within 4-8 hours), dedicated account manager for businesses with multiple team members, proactive monitoring and issue detection, customized training and onboarding assistance, and extended support hours including evenings and weekends. Contact sales@amoriaconnect.com for premium support pricing and options.

Maintenance and uptime commitments reflect our goal of providing reliable service. We target 99.5% uptime for the platform, though some downtime may occur for scheduled maintenance, emergency repairs, or factors beyond our control. Scheduled maintenance is typically performed during off-peak hours with advance notice whenever possible. For unplanned outages, we work to restore service as quickly as possible and communicate status updates through our status page and social media.

4. License Termination and Consequences
This software license may be terminated under various circumstances, ending your right to access and use Connekyt Team software.

You may terminate this license voluntarily at any time by discontinuing use of Connekyt Team software and closing your account. Account closure instructions are available in your settings or through our support team. Upon voluntary termination, you lose access to software features immediately, your data may be deleted according to our data retention policies, and any subscription fees are handled according to our refund policies.

We may terminate your license if you violate this agreement, our Terms of Service, or applicable laws; engage in fraudulent, abusive, or illegal activities; fail to pay applicable subscription fees; pose security risks to other users or our systems; or for other material breaches of our agreements.

We'll typically provide notice before termination when possible, giving you opportunity to cure violations if appropriate. However, serious violations (fraud, security breaches, illegal activity) may result in immediate termination without prior notice.

Upon termination for violation, you lose all access to Connekyt Team software immediately, your account may be suspended or permanently deleted, any pending payments or balances may be forfeited, and you may be prohibited from creating new accounts. We reserve the right to pursue legal remedies for serious violations including intellectual property infringement, fraud, or illegal activities.

5. Intellectual Property Rights and Ownership
Clarity about ownership prevents disputes and protects everyone's rights. All software, trademarks, logos, brand assets, documentation, and intellectual property related to Connekyt Team and Amoria Connekyt remain the exclusive property of Amoria Global Tech Ltd.

Specifically, we own the software code, architecture, and algorithms that power Connekyt Team; user interfaces, designs, and user experience elements; databases, data structures, and system infrastructure; trademarks including "Amoria Connekyt," "Connekyt Team," logos, and brand assets; documentation, manuals, tutorials, and training materials; patents, trade secrets, and proprietary methods; and all updates, modifications, and derivative works we create.

You own content you create and upload such as photos, videos, portfolios, and original creative works; your business data including client lists, booking information, and business records; and communications you compose and send through the platform. However, you grant us a limited license to host, display, and process this content as necessary to provide our services (as described in our main Terms of Service).

You do not acquire any ownership rights in the software itself, nor do you acquire rights to use our trademarks, logos, or brand assets outside of normal platform use. Any use of our intellectual property beyond the scope of this license requires explicit written permission.

6. Warranty Disclaimer and Limitation of Liability
Like most software services, Connekyt Team is provided "as is" without warranties of any kind, express or implied.

This means we do not warrant that the software will be error-free or uninterrupted, will meet your specific requirements or expectations, will be compatible with all devices or operating systems, will be free from bugs, viruses, or security vulnerabilities, or will produce any particular business results or outcomes.

We disclaim implied warranties of merchantability (fitness for sale), fitness for a particular purpose (suitability for your specific needs), non-infringement (that it doesn't violate others' rights), and title (that we have the right to license it).

Our liability to you is limited to the maximum extent permitted by law. We are not liable for indirect, incidental, consequential, special, or punitive damages including lost profits, lost revenue, lost business opportunities, lost data, or reputational harm. To the extent liability cannot be excluded by law, our total liability to you shall not exceed the amount you paid for Connekyt Team services in the 12 months preceding the claim, or $100 USD, whichever is greater.

These limitations are fundamental to our business model—they allow us to offer services at reasonable prices by limiting risk exposure. If you need different warranty or liability terms, contact us to discuss enterprise agreements with different terms and pricing.

Your Responsibilities:
You're responsible for maintaining appropriate backups of your business data, using the software in accordance with this agreement and our Terms of Service, protecting your account credentials and access, reporting bugs, security issues, or problems promptly, and ensuring your use complies with applicable laws.

Innovation Protected, Service Delivered:
This Software License Agreement protects our investment in creating innovative tools while granting you the rights you need to use Connekyt Team effectively for your creative business. By respecting these terms, you help us maintain and improve software that benefits the entire community of photographers and videographers using our platform.`
    },
    {
      id: 'non-discrimination',
      title: 'Non-discrimination Statement',
      content: `Diversity strengthens communities, and inclusion creates opportunities. Amoria Connekyt is built on the fundamental principle that every person deserves equal access to opportunities, fair treatment, and respect—regardless of who they are or where they come from. This Non-Discrimination Statement reflects our unwavering commitment to creating a platform where talent is recognized, creativity flourishes, and connections are made based on merit, not prejudice.

We categorically do not discriminate based on race, color, ethnicity, national origin, ancestry, religion or religious beliefs, gender, gender identity, gender expression, sexual orientation, age, disability (physical or mental), veteran or military status, genetic information, pregnancy or parental status, marital or family status, socioeconomic background, political affiliation, or any other protected status under applicable laws including Rwanda's Constitution, international human rights conventions, and laws in jurisdictions where our users are located.

This commitment extends to every aspect of our platform—from who can create accounts and access features to how we review content, mediate disputes, and enforce policies. Discrimination has no place in our community, and we take active steps to prevent, detect, and respond to it.

1. Equal Access to Platform Features and Opportunities
Equal access is not just a policy—it's a design principle embedded in how we build and operate Amoria Connekyt. All users have equal access to platform features and opportunities regardless of their background, identity, or characteristics.

Every person who meets our basic eligibility requirements (being at least 18 years old and agreeing to our Terms of Service) can create an account as a client seeking creative services, register as a creator offering photography or videography services, access all platform features including search, booking, messaging, payment processing, and dispute resolution, showcase portfolios and promote services, receive equal visibility in search results and recommendations based on objective criteria (location, specialty, reviews, pricing), and participate fully in our community.

Our algorithms and systems are designed to eliminate bias in matching clients with creators. Recommendations are based on objective, job-relevant criteria such as location proximity, specialty match (wedding, corporate, portrait, etc.), pricing alignment with client budgets, availability on requested dates, past reviews and ratings from previous clients, and portfolio quality and style match. We do not factor race, gender, religion, national origin, disability, or other protected characteristics into matching algorithms, search rankings, or feature access.

Platform features are accessible to all users including creators from diverse backgrounds, underrepresented communities, and marginalized groups; clients of all identities seeking services; users with disabilities (we're committed to accessibility and continually improving); international users from all countries and regions; and users of all experience levels from beginners to established professionals.

2. Reporting Discrimination and Harassment
Despite our best efforts to prevent discrimination, we recognize that bias and harassment can occur in any community. Users who experience or witness discrimination should report it through our dedicated reporting system so we can investigate and take appropriate action.

You can report discrimination in several ways. Through your account dashboard, access the "Report Issue" or "Safety & Support" section, select "Discrimination or Harassment" as the issue type, provide detailed information about the incident, and submit your report. For in-platform harassment, use the "Report" button available on user profiles, messages, reviews, or other content to flag discriminatory behavior directly. For urgent safety concerns or severe harassment, email support@amoriaconnect.com with "URGENT: Discrimination Report" in the subject line for priority handling.

When reporting discrimination, provide as much detail as possible including what happened (specific discriminatory statements, actions, or behaviors), when it occurred (dates and times), who was involved (usernames or names of individuals), where it happened (specific platform features, messages, reviews, booking interactions), any evidence you can provide (screenshots, message logs, booking records), and how it affected you (impact on your experience, opportunities, or wellbeing).

All discrimination reports are treated confidentially. We do not share your identity with the reported party unless necessary for investigation or required by law. You will not face retaliation for making good-faith reports of discrimination. Retaliation itself is a policy violation that results in account termination. We investigate all reports thoroughly, reviewing evidence, interviewing involved parties if necessary, consulting with our trust and safety team, and determining appropriate action based on our policies and applicable laws.

3. Enforcement and Consequences
Our commitment to non-discrimination is meaningless without strong enforcement. Violations of our non-discrimination policy result in immediate action to protect our community and hold violators accountable.

Violations of our non-discrimination policy will result in immediate account review and potential consequences including warning for first-time minor violations with educational intervention, temporary suspension (typically 7-30 days) for moderate violations or repeated minor violations, permanent account termination for severe violations or patterns of discriminatory behavior, removal of discriminatory content (reviews, messages, portfolio descriptions), loss of booking privileges or earnings if discrimination occurred in business contexts, and reporting to law enforcement when discrimination involves threats, hate crimes, or illegal activities.

Severe violations warranting immediate termination include hate speech or explicit discriminatory statements attacking protected groups, refusal to serve clients or work with creators based on protected characteristics, harassment or threats based on identity, posting discriminatory content in portfolios, profiles, or reviews, and systematic patterns of discrimination in bookings, cancellations, or reviews.

During account reviews, we consider context and severity of the violation, impact on affected users, user's history and previous violations, intent and whether violation appears willful or based on misunderstanding, and opportunities for education and rehabilitation for less severe violations. We believe in proportional responses—education and warnings for minor violations, escalating consequences for repeated or severe violations, and zero tolerance for hate speech, threats, or systematic discrimination.

4. Our Commitment to Diversity and Inclusion
We don't just prohibit discrimination—we actively promote diversity and inclusion because diverse communities are stronger, more creative, and more successful.

We actively promote diversity and inclusion in our platform community through several initiatives. We feature creators from diverse backgrounds in platform marketing and promotional materials, ensuring representation matters in how we showcase our community. We partner with organizations supporting underrepresented creatives, including photography associations serving women, LGBTQ+ photographers, creators with disabilities, and photographers from developing regions. We provide resources and support for creators from underrepresented communities, including mentorship programs, featured portfolio opportunities, and reduced platform fees for qualifying creators in underserved regions.

We design platform features with accessibility in mind, including screen reader compatibility for visually impaired users, keyboard navigation for users with mobility limitations, captioning and visual alternatives for audio content, and clear, simple language for users with cognitive disabilities or non-native language speakers. We celebrate cultural diversity through highlighting photographers specializing in multicultural events, supporting content in multiple languages (English, French, Kinyarwanda, and expanding), and recognizing diverse cultural practices in photography and videography.

Our team reflects the diversity we champion. We build diverse teams internally to inform better product decisions, conduct regular bias training for all employees, review platform data for disparities or bias in outcomes, and engage with diverse user communities to understand their needs and experiences.

5. Training, Education, and Resources
Creating an inclusive community requires not just rules but also education. We provide resources and training to all users to promote inclusive and respectful interactions.

Educational resources available to all users include guidelines on inclusive language and respectful communication, best practices for working across cultural differences, understanding unconscious bias and its impacts, creating accessible content (alt text for images, captions for videos, etc.), and legal requirements around discrimination and equal treatment in creative services. These resources are available through our Help Center, blog, webinars, and in-platform prompts.

For creators, we provide specific guidance on serving diverse clients respectfully, adapting to different cultural practices and preferences in events and sessions, handling accessibility requests for clients with disabilities, pricing services fairly without discrimination, and managing bookings professionally regardless of client identity. For clients, we offer education on communicating respectfully with creators from diverse backgrounds, understanding cultural competency in creative services, providing constructive feedback without bias, and recognizing and reporting discrimination when encountered.

We continuously update our educational resources based on user feedback, evolving best practices, legal developments, and insights from diversity and inclusion experts. Education is a journey, not a destination, and we're committed to growing alongside our community.

6. Zero Tolerance Policy and Accountability
We maintain a zero-tolerance policy for discriminatory behavior and take all reports seriously. Zero tolerance doesn't mean instant termination for every report—it means that discrimination is never acceptable, every report receives thorough investigation, and appropriate consequences always follow substantiated violations.

Zero tolerance applies to all forms of discrimination including overt and explicit discrimination (clear statements or actions rejecting people based on protected characteristics), subtle and implicit bias (patterns suggesting discrimination even without explicit statements), systemic discrimination (policies or practices that disproportionately harm protected groups), harassment based on protected characteristics, and retaliation against those who report discrimination or assert their rights.

We're accountable to our community for enforcing these policies consistently, transparently (within privacy constraints), and fairly. We publish periodic transparency reports about discrimination reports received, investigation outcomes, enforcement actions taken, and ongoing efforts to promote inclusion. We welcome feedback about our policies and enforcement through support@amoriaconnect.com or our user forums.

Building Community Together:
An inclusive platform doesn't happen by accident—it requires commitment, vigilance, and active participation from everyone. We're committed to creating space where everyone feels welcome, safe, and valued. We ask you to join us in this commitment by treating all users with respect, reporting discrimination when you witness it, educating yourself about bias and inclusion, and holding us accountable to our values. Together, we can build a creative marketplace where talent is recognized, diversity is celebrated, and everyone has equal opportunity to thrive.`
    },
    {
      id: 'referral-program',
      title: 'Intellectual Property',
      content: `Intellectual property rights are the foundation of creative industries. Photographers and videographers create value through their artistic vision, technical skills, and creative expression—and protecting these rights ensures they can earn fair compensation for their work. Simultaneously, the technology and brand assets that power Amoria Connekyt represent significant investment and innovation that must be protected.

This Intellectual Property section clarifies who owns what on our platform, what rights you retain, what rights you grant to us, and how we protect everyone's creative and technological assets. Understanding these rights prevents disputes, encourages fair dealings, and supports a thriving creative marketplace.

1. Platform Ownership and Our Intellectual Property
Amoria Connekyt exists as a sophisticated technology platform backed by significant investment in software development, design, branding, and infrastructure. All platform technology, software, trademarks, and related intellectual property are owned exclusively by Amoria Global Tech Ltd., our Rwandan-registered parent company.

Specifically, we own all rights, title, and interest in the website, mobile applications, and web-based platform including all source code, databases, algorithms, and technical architecture; user interfaces, visual designs, graphics, layouts, and user experience elements; logos, trademarks, service marks, and brand names including "Amoria Connekyt," "Connekyt Team," "Hold & Release," and associated branding; proprietary systems and methods including our matching algorithms, payment escrow system, dispute resolution processes, and rating mechanisms; documentation, help materials, tutorials, and educational content; APIs, integrations, and software development tools; and all updates, modifications, improvements, and derivative works we create.

These assets are protected by comprehensive intellectual property laws including copyright protecting creative and literary works (code, documentation, designs), trademarks protecting brand identities and commercial symbols, patents potentially protecting novel technical innovations and business methods, trade secrets protecting confidential algorithms, processes, and business information, and database rights protecting the structure and compilation of data.

Users may not copy, reproduce, distribute, modify, or create derivative works from platform technology without our explicit written permission. This means you cannot scrape our website or extract data systematically, reverse engineer our algorithms or technical systems, copy our user interface designs or visual elements, use our trademarks or logos outside normal platform use, create competing platforms based on our features or methods, or redistribute our software, documentation, or proprietary materials.

Authorized uses of platform assets include using the platform as intended through our website and apps, displaying our logos when legitimately representing your account (like "Find me on Amoria Connekyt" with proper logo usage), referencing our platform in ordinary business contexts, and sharing links to platform content through social media or websites. Any use beyond these ordinary activities requires written permission from legal@amoriaglobal.com.

2. Creator Content Ownership and Copyright
The creative works you produce—photographs, videos, edited images, and other media—are your intellectual property. Creators retain full ownership of their original works created before, during, or after their time on Amoria Connekyt, regardless of whether those works were commissioned by clients through our platform.

As a creator, you own the copyright in your original photographs and videos from the moment you create them (no registration required, though registration provides additional legal benefits). Copyright ownership grants you exclusive rights to reproduce the work (make copies), create derivative works (edit, modify, remix), distribute copies to the public, publicly display the work, and authorize others to do these things through licenses. This ownership applies to your personal portfolio work created independently, client-commissioned work where you retain copyright (the typical arrangement unless you negotiate full buyout), collaborative works where you contributed creative expression, and any other original creative content you produce.

However, ownership doesn't mean unlimited control over client-commissioned work. When clients hire you, they typically receive usage rights as specified in your service agreements even though you retain the underlying copyright. Common arrangements include limited usage licenses where clients can use images for specific purposes (personal use, specific marketing campaign, editorial use) while you retain copyright and can use the work in your portfolio, full buyouts where clients purchase all rights and you cannot use the work elsewhere (typically commands premium pricing), or exclusive licenses for a period where clients have sole usage rights for a defined time, after which rights revert or are shared.

You must honor the intellectual property rights of others as well. Only upload original work you created, properly licensed stock content or resources, client work where you have permission to display, or collaborative work where you have rights and proper attribution. Never use copyrighted music, graphics, fonts, or other elements without proper licenses. Copyright infringement can result in legal action against you, including statutory damages and attorney fees.

3. Limited License You Grant to Amoria Connekyt
To operate our platform and showcase your work to potential clients, you must grant us certain limited rights to use your content. When you upload photos, videos, or other content to Amoria Connekyt, you grant us a limited, non-exclusive, royalty-free, worldwide license to use your content for specific platform purposes.

This license authorizes us to host and store your content on our servers and cloud infrastructure, display content in your portfolio and profile visible to users browsing our platform, showcase portfolios to potential clients searching for photographers or videographers, optimize images and videos for web display (resizing, compressing, format conversion for performance), back up content for disaster recovery and service continuity, and use content in platform marketing and promotional materials with your explicit consent (we'll always ask permission before using your work in ads, social media, or promotional campaigns).

Important limitations on this license protect your rights. The license is non-exclusive—you retain all rights to use your work elsewhere, license it to others, or do whatever you want with your content. It's royalty-free—we don't pay licensing fees because the value exchange is the platform service we provide (client connections, payment processing, marketing exposure). It's limited in scope—we can only use content for the specific purposes listed above, not for unrelated commercial purposes. It's revocable—if you delete content or close your account, this license terminates (though some content may remain in backups temporarily per our data retention policies).

This license does not transfer ownership—you always remain the copyright holder. We're simply authorized to perform specific actions necessary to operate the platform and promote your work. If we want to use your content in ways beyond this license (like featuring your photo on billboards or using it in a different product), we'll contact you for explicit permission and potentially compensation.

4. Client Rights and Usage Licenses
When you commission photography or videography through Amoria Connekyt, you don't automatically receive copyright ownership—you receive usage rights as specified in your service agreement with the creator.

Clients receive usage rights as specified in service agreements negotiated with creators. Rights depend on the specific contract, pricing, and negotiated terms. Common usage arrangements include personal use only (family photos, personal social media, private displays—no commercial use), limited commercial use (specific marketing campaigns, website images, social media promotion with defined scope), editorial use (news, education, commentary—not commercial advertising), and full buyout or work-for-hire (unlimited rights, exclusive ownership—typically very expensive).

Your service agreement should clearly specify what you can do with delivered photos or videos (display on your website, use in print advertising, share on social media, create derivative works), what you cannot do (resell to stock agencies, license to third parties, remove photographer watermarks or attribution), duration of rights (perpetual, limited term, exclusive period), and geographic scope (worldwide, specific countries, local use only).

Clients may not resell or redistribute content without explicit permission beyond what's granted in their usage license. Prohibited activities without proper licensing include reselling images to third parties or stock photo agencies, sublicensing content to others for their commercial use, creating derivative works beyond what's authorized (heavily modifying, incorporating into other artwork), removing creator watermarks, copyright notices, or metadata, claiming the work as your own creation, or using content in ways that could damage the creator's reputation (controversial contexts, inappropriate associations).

If you want to use commissioned content beyond your original agreement—for example, using wedding photos in a commercial advertisement or republishing personal portraits in a book—contact the creator to negotiate expanded licensing rights. Most creators are happy to grant additional rights for appropriate compensation.

5. Prohibited Uses and Intellectual Property Violations
Respecting intellectual property is essential for a fair, legal creative marketplace. Users must not engage in activities that violate our intellectual property or others' rights.

Users may not copy, modify, or reverse engineer platform technology including scraping website data or systematically extracting content, decompiling or reverse engineering our software or algorithms, copying our user interface designs or feature implementations, creating competing platforms based on our innovations, or using our proprietary methods or business processes.

Users must not use platform content for unauthorized purposes beyond what your role and licenses permit. Creators cannot use client-commissioned work beyond agreed terms without permission. Clients cannot use delivered content beyond licensed rights. Third parties cannot scrape or harvest creator portfolios for commercial purposes.

Everyone must respect copyright and trademark protections including not infringing on creators' copyrights by using their work without permission, not violating our trademarks by misrepresenting affiliation or creating confusion, not using others' trademarked terms in ways that suggest endorsement, and not posting content that infringes third-party intellectual property.

Report intellectual property violations through our reporting system. If you discover infringing content, copyright violations, trademark misuse, or unauthorized use of your creative work, report it immediately through your dashboard's "Report Issue" feature or by emailing legal@amoriaglobal.com. We investigate all intellectual property complaints and take appropriate action.

6. DMCA and Copyright Infringement Claims
The Digital Millennium Copyright Act (DMCA) and similar international laws provide mechanisms for copyright holders to report infringement and for platforms to respond appropriately.

We respond to valid copyright infringement claims promptly and in accordance with applicable laws. If you're a copyright holder and believe your work has been infringed on our platform, you can submit a DMCA takedown notice to legal@amoriaglobal.com including identification of the copyrighted work being infringed (description, registration number if applicable, URL or location), identification of the infringing material on our platform (URLs, usernames, specific photos or videos), your contact information (name, address, phone, email), a statement that you have a good faith belief the use is not authorized, a statement that the information is accurate and you're authorized to act on behalf of the copyright owner, and your physical or electronic signature.

Upon receiving valid DMCA notices, we will investigate the claim promptly, remove or disable access to allegedly infringing content, notify the user who posted the content of the removal and the reason, and document the complaint for our records. Users may submit counter-notices if they believe content was wrongfully removed, asserting they have rights to use the content or that the claim is mistaken. We'll provide the counter-notice to the original complainant, who may pursue legal action or allow the content to be restored.

Copyright holders can report violations through our dedicated copyright infringement reporting system or by emailing legal@amoriaglobal.com with "Copyright Infringement" in the subject line. We take all reports seriously and investigate thoroughly.

Infringing content will be removed promptly upon confirmation of valid claims, typically within 24-48 hours of receiving complete DMCA notices. We aim for quick resolution to protect copyright holders while allowing accused users to respond.

Repeat offenders face escalating consequences. Users who repeatedly post infringing content will receive warnings for first offenses, temporary suspension for second offenses, and permanent account termination for persistent infringement. We maintain a three-strike policy for copyright violations—three substantiated infringement claims result in permanent account termination.

Protecting Creativity and Innovation:
Intellectual property rights enable creators to earn livings from their talents and enable technology companies to invest in innovation. By respecting these rights—both ours and yours—we build a sustainable creative ecosystem where photographers and videographers are compensated fairly, clients receive clear usage rights, and the platform continues innovating to serve everyone better. If you have questions about intellectual property rights, licensing, or infringement, contact legal@amoriaglobal.com for guidance.`
    },
    {
      id: 'policies-compliance',
      title: 'Policies and Compliance',
      content: `Operating on Amoria Connekyt means joining a community governed by policies designed to protect everyone, ensure legal compliance, and maintain a safe, trustworthy environment. These aren't arbitrary rules—they're essential frameworks that enable fair transactions, protect personal information, prevent fraud, and create a marketplace where creative professionals and clients can connect with confidence.

All users must comply with our Community Conduct, Privacy, Intellectual Property, and Anti-Fraud Policies. These policies work together to address different aspects of platform safety and legality. Violations may lead to consequences ranging from warnings and educational interventions to temporary suspension or permanent account removal, depending on severity and frequency.

Understanding these policies helps you use the platform successfully while avoiding inadvertent violations that could jeopardize your account. Below is a comprehensive explanation of each major policy area and your compliance obligations.

1. Community Conduct Policy and Standards of Behavior
Respectful, professional interactions are the foundation of any successful community. Our Community Conduct Policy establishes behavioral standards that promote positive experiences for everyone.

All users must maintain professional and respectful behavior in all interactions. This includes communicating politely and courteously in messages, reviews, and public forums; respecting others' time by responding promptly to booking inquiries and project communications; honoring commitments and agreements made through the platform; providing constructive feedback rather than personal attacks; and acknowledging that disagreements happen but handling them maturely and professionally.

There is absolutely no tolerance for harassment, discrimination, or hate speech on our platform. Prohibited behaviors include verbal abuse, threats, or intimidation of other users; discriminatory statements or actions based on protected characteristics (race, gender, religion, disability, sexual orientation, etc.); hate speech targeting individuals or groups; sexual harassment or unwanted sexual advances; stalking, doxxing, or sharing private information without consent; and coordinated harassment campaigns or brigading.

Treat all users with dignity and respect regardless of their role (client or creator), experience level, background, or identity. Remember that behind every profile is a real person with feelings, aspirations, and rights. The Golden Rule applies: treat others as you'd want to be treated.

Follow platform guidelines and community standards outlined throughout our Terms of Service, Privacy Policy, and Help Center. These guidelines cover content standards (what you can post in portfolios, profiles, messages), transaction standards (how bookings and payments should be handled), review standards (honest, constructive feedback without personal attacks or bias), and communication standards (responsive, professional, respectful).

Violations of community conduct standards result in progressive discipline starting with warnings and educational outreach for minor first offenses, temporary suspension (7-30 days) for moderate violations or repeated minor issues, and permanent termination for severe violations like threats, hate speech, or systematic harassment. We investigate all reports thoroughly and consider context, but safety and respect are non-negotiable.

2. Privacy Policy and Data Protection Compliance
Protecting personal information isn't optional—it's a legal requirement under Rwanda's Data Protection and Privacy Law No. 058/2021 and international privacy regulations like GDPR. All users must comply with privacy laws and respect data protection rights.

Compliance with Rwanda's Data Protection and Privacy Law No. 058/2021 is mandatory for all users, whether you're based in Rwanda or internationally. This law establishes data protection principles, grants data subjects specific rights, requires secure processing of personal information, mandates data breach notification, and regulates international data transfers. Amoria Connekyt complies with this law comprehensively, and you must comply in how you handle data accessed through our platform.

Respect user privacy and data protection rights in all your interactions. If you're a creator, respect client privacy by not sharing client information, project details, or photos without explicit permission; handling client contact information securely and only for legitimate project purposes; honoring client requests to exercise privacy rights (deletion, restriction, portability); and complying with confidentiality expectations for private events. If you're a client, respect creator privacy by not sharing creator contact information or business details inappropriately, not using creator portfolios or content in unauthorized ways, and honoring confidentiality agreements if applicable.

See our detailed Privacy Policy for comprehensive information about how we collect, use, protect, and share personal information; your privacy rights under Rwandan and international law; cookie usage and tracking technologies; data retention and deletion practices; international data transfers; and contact information for privacy requests and concerns. Our Privacy Policy is available at www.amoriaconnect.com/privacy-policy and within your account dashboard.

Report privacy violations or data breaches immediately. If you discover that your personal data has been compromised, accessed without authorization, or used in violation of privacy laws, report it through support@amoriaconnect.com or our in-platform reporting system. If you witness other users violating privacy policies—sharing others' personal information, using data inappropriately, or failing to honor data protection obligations—report these violations as well. We investigate all privacy complaints seriously and take corrective action when violations are confirmed.

3. Intellectual Property Policy and Creative Rights
Respect for intellectual property is essential in creative industries. All users must honor copyrights, trademarks, and creative rights of photographers, videographers, clients, and the platform itself.

Respect copyrights, trademarks, and creative rights means acknowledging that creative works are owned by their creators and cannot be used without permission. Photographers and videographers own the copyright in their original works. Clients receive usage rights as specified in service agreements but typically don't receive copyright ownership unless they negotiate full buyouts. The platform owns intellectual property in our technology, brand assets, and proprietary systems.

Only upload content you own or have explicit permission to use. For creators, this means uploading only original photography and videography you personally created, properly licensed stock content or resources, client work where you have written permission to display, or collaborative work where you have rights and proper attribution. Never upload work created by others, AI-generated content falsely represented as your own, or heavily edited stock photos misrepresenting your capabilities.

Do not infringe on others' intellectual property through unauthorized use of copyrighted photographs, videos, music, or graphics; using others' trademarked names or logos in ways suggesting false endorsement; plagiarizing written content, descriptions, or educational materials; or reverse engineering, copying, or redistributing platform technology.

Report copyright violations through proper channels. If you discover your work being used without permission, someone else's work being infringed, or other intellectual property violations, report them through our DMCA/copyright infringement reporting system at legal@amoriaglobal.com or through your dashboard's reporting feature. We investigate all intellectual property complaints, remove infringing content when claims are substantiated, and may terminate accounts of repeat offenders.

4. Anti-Fraud Policy and Financial Crime Prevention (AML/CTF)
Financial integrity and fraud prevention are critical for platform trust and legal compliance. We maintain strict Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) policies as required by law.

Comply with Rwanda's Law No. 69/2018 on Prevention and Suppression of Money Laundering and Terrorism Financing. This law requires financial service providers and certain businesses to implement measures preventing money laundering and terrorism financing including customer due diligence and Know Your Customer (KYC) verification, transaction monitoring for suspicious patterns, reporting suspicious activities to authorities, and maintaining records for regulatory review.

Complete KYC verification before engaging in financial transactions. All creators who receive payments must complete identity verification by submitting government-issued identification (national ID, passport, driver's license), proof of address, and for businesses, registration documents and TIN certificates. Clients making payments may need to verify identity for large transactions or when suspicious patterns are detected. KYC protects everyone by ensuring users are who they claim to be, reducing fraud and identity theft, complying with financial regulations, and enabling fund recovery if disputes or fraud occur.

Do not engage in fraudulent activities or money laundering including creating fake accounts or using false identities, payment fraud (stolen cards, unauthorized transactions, chargebacks schemes), money laundering (using the platform to disguise illicit funds), structuring transactions to avoid detection or reporting thresholds, colluding with others to manipulate ratings, reviews, or bookings, or any other deceptive practices.

The platform monitors transactions for suspicious activity automatically and manually. Our AML/CTF program includes transaction monitoring algorithms flagging unusual patterns, manual review of flagged transactions by compliance specialists, verification of high-value or high-risk transactions, screening against sanctions lists and PEP databases, and periodic audits of user accounts and transaction histories.

Suspicious activities that trigger investigation include unusual transaction volumes or patterns inconsistent with your profile, rapid movement of funds in and out of accounts, transactions involving high-risk jurisdictions, structuring (breaking large transactions into smaller amounts), multiple accounts controlled by the same person, and other red flags indicating potential fraud or money laundering.

Cooperation with authorities is required when law enforcement or financial regulators request information. We comply with valid legal processes including subpoenas, court orders, and regulatory inquiries. While we protect user privacy to the fullest extent permitted by law, we cannot and will not obstruct legitimate investigations into fraud, money laundering, terrorism financing, or other serious crimes. By using our platform, you consent to our cooperation with authorities when legally required.

5. Non-Discrimination and Equal Treatment
Discrimination has no place on our platform. Equal access and fair treatment are fundamental rights we protect vigorously.

Equal access for all users regardless of background is a core principle. Every user meeting basic eligibility requirements can create accounts, access features, book services, offer services, and participate fully in our community without discrimination based on protected characteristics including race, color, ethnicity, gender, religion, sexual orientation, disability, age, or other protected status.

No discrimination based on race, gender, religion, disability, or other protected status is tolerated. You cannot refuse bookings, cancel services, provide different pricing, offer inferior service quality, or otherwise discriminate against users based on protected characteristics. Creators must serve all clients professionally regardless of their identities. Clients must treat all creators respectfully regardless of their backgrounds.

Amoria Connekyt actively promotes diversity and inclusion through featuring diverse creators in marketing, partnering with organizations supporting underrepresented creatives, providing accessibility features for users with disabilities, and celebrating cultural diversity in our community. See our complete Non-Discrimination Statement for comprehensive information about our commitment, enforcement, and reporting procedures.

Zero tolerance for discriminatory behavior means all reports are investigated, substantiated violations result in immediate consequences, and severe violations like hate speech or systematic discrimination lead to permanent account termination. We're committed to maintaining an inclusive, welcoming environment for everyone.

6. Account Security and Cybersecurity Hygiene
Account security protects not just you but the entire community from fraud, unauthorized access, and cyber threats. All users share responsibility for maintaining secure accounts.

Follow password and security best practices including using strong, unique passwords combining letters, numbers, and special characters; not reusing passwords from other websites or services; changing passwords periodically and immediately if you suspect compromise; not sharing passwords or account credentials with anyone, even trusted friends or colleagues; and logging out from shared or public devices.

Enable two-factor authentication (2FA) when available for enhanced account protection. 2FA requires two forms of verification—your password plus a code sent to your phone or generated by an authenticator app. This prevents unauthorized access even if someone obtains your password. We strongly recommend enabling 2FA for all accounts, and we may require it for high-value accounts or accounts with concerning activity patterns.

Report suspicious activity immediately including unauthorized access or login attempts from unfamiliar locations, unexpected booking requests or payments, messages or communications you didn't send, profile changes you didn't make, or any other anomalies suggesting your account has been compromised. Quick reporting enables us to secure your account, investigate the breach, prevent further unauthorized activity, and potentially recover compromised funds or data.

Protect your account credentials by never sharing your password, not falling for phishing emails or fake login pages requesting credentials, being cautious about clicking links in unsolicited emails or messages, keeping your registered email account secure (as it can be used to reset your Amoria Connekyt password), and reporting suspected phishing or impersonation attempts.

Security is a shared responsibility. We provide secure infrastructure, encryption, monitoring, and incident response, but you must practice good security hygiene with your own account. Together, we maintain a trustworthy platform resistant to fraud and cyber threats.

Our Commitment to Policies and Compliance:
These policies aren't obstacles—they're protections that enable fair, safe, legal operations benefiting everyone. By complying with these policies, you contribute to a thriving creative marketplace built on trust, respect, and mutual benefit. If you have questions about any policy, need clarification about compliance requirements, or want to report violations, contact support@amoriaconnect.com or legal@amoriaglobal.com. We're here to help you succeed while maintaining the standards that make our community strong.`
    },
    {
      id: 'legal-terms',
      title: 'Legal Terms and Jurisdiction',
      content: `Legal terms define the framework within which our platform operates, your legal relationship with us, how disputes are resolved, and the limitations on liability that protect both parties. These aren't just formalities—they're essential protections that enable us to provide services at reasonable cost while clarifying everyone's rights and responsibilities.

These Terms of Service are governed by and construed in accordance with the laws of the Republic of Rwanda. By using Amoria Connekyt, you agree to these legal terms regardless of where you're physically located. Understanding these terms helps you know your rights, obligations, and remedies if problems arise.

1. Indemnification and Hold Harmless
Indemnification is a legal principle where you agree to protect us from liability for certain claims arising from your actions. This protects the platform from being held responsible for users' misconduct, violations, or illegal activities.

Users agree to indemnify, defend, and hold harmless Amoria Connekyt, Amoria Global Tech Ltd., our affiliates, subsidiaries, partners, officers, directors, employees, agents, and contractors from any claims, losses, damages, liabilities, costs, or expenses (including reasonable attorney fees) arising from or related to your use or misuse of the platform, your violation of these Terms of Service or any applicable laws, your violation of others' rights including intellectual property, privacy, or publicity rights, your user-generated content uploaded to the platform, your interactions and transactions with other users, or your fraudulent, negligent, or willful misconduct.

This means that if you violate these Terms and someone sues us as a result, you're responsible for defending us and covering any damages, legal fees, or costs we incur. For example, if you post copyrighted content without permission and the copyright holder sues Amoria Connekyt, you agree to cover our defense costs and any judgment or settlement. If you harass another user who then sues us, you're liable for those costs.

Users are responsible for their actions on the platform. We provide the infrastructure and facilitate connections, but we don't control or endorse user behavior, content, or transactions. You bear full responsibility for how you use the platform, what content you post, how you interact with others, and whether you comply with laws and our policies.

This indemnification obligation survives even after you close your account or stop using the platform. Past violations can result in future claims, and you remain responsible for indemnifying us for those claims.

2. Limitation of Liability and Disclaimer of Warranties
Like most online platforms, we provide services "as is" with limited liability for problems that may arise. These limitations are essential to our business model and enable us to offer affordable services.

Amoria Connekyt is not liable for indirect, incidental, consequential, special, exemplary, or punitive damages resulting from platform use. This includes lost profits or revenue from business interruptions or canceled bookings, lost business opportunities or damaged professional reputation, lost data or corruption of content, costs of substitute services or replacement creators/clients, emotional distress or personal injury (except where prohibited by law), or any other indirect or consequential harm.

Our total liability to you shall not exceed the amount you paid to Amoria Connekyt for services in the 12 months preceding the claim, or $100 USD, whichever is greater. This cap applies to all claims collectively, not per incident. For example, if you've paid $500 in platform fees over the past year, our maximum liability to you for any and all claims is $500. For free users, our maximum liability is $100.

The platform is provided "as is" and "as available" without warranties of any kind, express or implied. We specifically disclaim warranties of merchantability (fitness for sale or use), fitness for a particular purpose (suitability for your specific needs), non-infringement (that it doesn't violate others' rights), title (that we have rights to provide it), accuracy or reliability (that information is correct), availability or uptime (that service will be uninterrupted), security (that the platform is completely secure from breaches), and quality of work or services (that creators will meet your expectations).

We do not guarantee that the platform will be error-free, uninterrupted, or free from viruses or security vulnerabilities; that any defects or bugs will be corrected promptly; that the platform will meet your requirements or expectations; that creators or clients will perform satisfactorily; or that transactions will be successful or dispute-free.

These limitations apply to the fullest extent permitted by applicable law. Some jurisdictions don't allow exclusion of certain warranties or limitation of liability for incidental or consequential damages, so these limitations may not fully apply to you. In such cases, our liability is limited to the minimum extent permitted by law.

3. Dispute Resolution Process and Mediation
When disputes arise between users or between users and Amoria Connekyt, we prefer to resolve them through dialogue and mediation rather than expensive, time-consuming litigation.

Disputes will first be resolved through good-faith mediation before pursuing arbitration or litigation. Our Support Desk provides initial mediation services for user-to-user disputes at no additional cost. This informal mediation involves reviewing evidence from both parties (messages, contracts, deliverables, payment records), facilitating communication and negotiation between disputing parties, proposing fair compromises based on our policies and industry standards, and issuing non-binding recommendations for resolution.

Most disputes are resolved through this mediation process. Common dispute types include disagreements about work quality or deliverables, cancellation and refund disputes, payment release disputes, intellectual property conflicts, and service agreement interpretations.

If mediation doesn't produce acceptable resolution within 30 days, disputes may be escalated to binding arbitration under the laws of the Republic of Rwanda. Arbitration is a formal process where a neutral third-party arbitrator hears evidence and makes a binding decision that both parties must accept.

Arbitration must be conducted in Kigali, Rwanda, unless both parties agree to another location or remote arbitration. The arbitration shall be administered by a recognized arbitration body operating in Rwanda, conducted in accordance with their rules and procedures, and governed by Rwandan arbitration law. Each party bears their own attorney fees and costs unless the arbitrator awards fees to the prevailing party. Arbitrator's decisions are final and binding with very limited grounds for appeal. The decision may be enforced in any court with proper jurisdiction.

By agreeing to these Terms, you consent to arbitration as the primary dispute resolution mechanism and waive your right to trial by jury for most disputes (some jurisdictions may prohibit this waiver for certain claims). You also waive your right to participate in class action lawsuits against Amoria Connekyt—disputes must be brought individually, not as part of consolidated class actions.

Small claims court remains available for disputes within small claims jurisdiction limits (typically under $5,000-$10,000 depending on jurisdiction). You may pursue claims in small claims court in your local jurisdiction without first attempting mediation or arbitration.

4. Governing Law and Legal Jurisdiction
Legal jurisdiction determines which country's laws apply to our agreement and where legal disputes must be resolved. This clarity prevents confusion and ensures consistency.

These Terms of Service are governed by and construed in accordance with the laws of the Republic of Rwanda, without regard to conflict of law principles that might apply laws of other jurisdictions. This means Rwandan contract law, tort law, commercial law, and other applicable legal frameworks govern our agreement.

All legal matters, disputes, and claims arising from or related to these Terms or your use of Amoria Connekyt are subject to Rwandan jurisdiction. Courts in Kigali, Rwanda, have exclusive jurisdiction over any litigation (to the extent arbitration doesn't apply), and Rwandan law governs all interpretations and enforcement.

International users, regardless of where you're located, consent to Rwandan law application and Rwandan jurisdiction by using our platform. This might differ from your local laws, and you should understand Rwandan legal principles may apply to your disputes. We chose Rwandan jurisdiction because we're based in Rwanda, operate under Rwandan business licenses and regulations, and are most familiar with Rwandan legal frameworks.

If you're located in a jurisdiction with consumer protection laws that cannot be waived by contract (like the European Union), those mandatory protections may still apply alongside Rwandan law. We comply with all applicable consumer protection regulations regardless of jurisdiction.

5. Governing Language and Translation
Clear communication requires a definitive version of our Terms when translations exist in multiple languages.

The official governing language of these Terms of Service is English. This English version is the legally binding document that governs our agreement. We may provide translations in other languages (French, Kinyarwanda, and potentially others) for convenience and accessibility, enabling more users to understand our terms. However, translations are provided for convenience only and are not legally binding.

In case of any conflict, ambiguity, or inconsistency between the English version and any translated version, the English version prevails and controls. If you're reviewing these Terms in a translated version, we encourage you to also review the English version if you have any questions about specific terms or provisions.

By agreeing to these Terms in any language, you acknowledge that you've had the opportunity to review the English version and that the English version governs our agreement.

6. Global Compliance and International Legal Standards
While governed by Rwandan law, we also comply with international legal standards applicable to our global user base and cross-border operations.

Amoria Connekyt complies with Rwanda's Data Protection and Privacy Law No. 058/2021 as our primary data protection framework. This law grants data subjects strong rights and imposes strict obligations on data controllers and processors similar to international standards like GDPR.

We provide GDPR compliance for EU users through standard contractual clauses, data protection by design and default, privacy impact assessments for high-risk processing, data breach notification within 72 hours, and honoring all GDPR rights for EU data subjects. EU users benefit from both Rwandan and GDPR protections—whichever is more protective applies.

Users consent to secure collection, processing, storage, and international transfer of personal data in accordance with these standards. Our Privacy Policy provides comprehensive details about data protection practices and international transfers.

We also comply with other international legal frameworks applicable to our operations including Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) regulations, payment card industry security standards (PCI DSS), intellectual property treaties and conventions, consumer protection laws in jurisdictions where we operate, and accessibility standards promoting inclusive platform access.

7. Force Majeure and Excused Performance
Force majeure refers to extraordinary events beyond our reasonable control that may prevent us from performing our obligations. These provisions protect both parties from liability for unavoidable circumstances.

Amoria Connekyt is not liable for delays, interruptions, or failures in performance caused by factors beyond our reasonable control. Force majeure events include natural disasters (earthquakes, floods, hurricanes, wildfires, volcanic eruptions), pandemics and public health emergencies (like COVID-19), war, civil unrest, terrorism, or political instability, government actions (lockdowns, emergency declarations, nationalization, regulatory changes), strikes, labor disputes, or supply chain disruptions, cyber attacks, hacking, or other security events beyond normal risk, telecommunications or internet infrastructure failures, third-party service failures (payment gateways, cloud hosting, CDNs), or other acts of God or extraordinary circumstances.

During force majeure events, our obligations may be suspended for the duration of the event, we'll make reasonable efforts to restore service as quickly as possible, we'll communicate with users about the situation and expected recovery, and we may implement temporary workarounds or alternative solutions.

Users are similarly excused from performance obligations during force majeure events affecting their ability to deliver services or make payments. Creators who cannot fulfill bookings due to force majeure should communicate immediately with clients to reschedule or arrange refunds. Clients facing force majeure events preventing use of booked services should communicate with creators to find alternative solutions.

Force majeure doesn't excuse all obligations indefinitely. If force majeure persists for extended periods (typically 60-90 days), either party may terminate the affected agreement without penalty. Obligations not affected by force majeure remain in effect.

8. Third-Party Services and External Integrations
Our platform integrates with various third-party services to provide comprehensive functionality. It's important to understand the boundaries of our responsibility.

The platform may link to or integrate with external tools, services, and websites including payment processors (Pesapal, Flutterwave, JengaPay), cloud storage and hosting providers, analytics services (Google Analytics), social media platforms (Facebook, Instagram, LinkedIn), video hosting services (YouTube, Vimeo), and other APIs or services enhancing platform functionality.

Amoria Connekyt is not responsible for third-party services' policies, performance, security, or availability. Each third-party service has its own terms of service, privacy policy, and operating practices that we don't control. When you use integrated third-party services, you're also subject to their terms and policies.

Users access third-party services at their own risk. We make no warranties about third-party services' reliability, accuracy, security, or suitability. Third-party service failures, data breaches, policy changes, or discontinuation are beyond our control and not our responsibility.

However, we do carefully select third-party partners based on reputation, security credentials, regulatory compliance, and service quality. We monitor third-party integrations and replace partners when performance or security concerns arise. If you experience problems with third-party services accessed through our platform, contact us and we'll assist where possible, though ultimate resolution depends on the third-party provider.

9. Accessibility Commitment and Inclusive Design
We're committed to making Amoria Connekyt accessible to all users, including those with disabilities, consistent with international accessibility standards and Rwanda's commitment to inclusion.

Amoria Connekyt actively promotes accessibility and inclusion through implementing WCAG (Web Content Accessibility Guidelines) standards for web accessibility, providing screen reader compatibility for visually impaired users, enabling keyboard navigation for users unable to use mice or touchscreens, offering text alternatives for images and visual content, designing with sufficient color contrast for users with visual impairments, and supporting assistive technologies commonly used by people with disabilities.

We work continuously to improve platform accessibility through regular accessibility audits identifying barriers, user testing with people with diverse abilities, training development teams on accessible design principles, and prioritizing accessibility fixes in our development roadmap.

Report accessibility issues or barriers you encounter so we can address them. Contact support@amoriaconnect.com with details about the accessibility problem, the assistive technology you're using if applicable, what you were trying to accomplish, and any suggestions for improvement. We take accessibility feedback seriously and prioritize fixes that improve access for users with disabilities.

Accessibility is an ongoing journey, not a destination. While we strive for full compliance with accessibility standards, some barriers may exist. We commit to addressing reported issues promptly and improving accessibility with each platform update.

10. Digital Acceptance and Electronic Signatures
In our digital age, agreements are often formed electronically without physical signatures. This section clarifies that your electronic acceptance is legally binding.

By clicking "Agree," checking the acceptance checkbox, creating an account, making a booking, uploading content, or using any Amoria Connekyt service, you confirm that you have read, understood, and accepted these Terms of Service electronically. Electronic acceptance has the same legal effect as physical signature under electronic signature laws including Rwanda's electronic transaction legislation, the ESIGN Act (US), eIDAS (EU), and other international frameworks.

Your electronic acceptance indicates your intent to be bound by these Terms, your capacity to enter into binding agreements (you're at least 18 years old and legally competent), your understanding of the obligations you're accepting, and your consent to conduct business electronically.

Continued use of the platform after we update these Terms constitutes acceptance of the revised terms. We'll notify you of material changes as described in our update procedures, but your ongoing use demonstrates acceptance. If you don't agree with updated Terms, discontinue use and close your account.

11. Entire Agreement and Supersession
Legal agreements often evolve through multiple communications, negotiations, or prior versions. This section clarifies what constitutes our complete agreement.

These Terms of Service, together with our Privacy Policy and any other policies or agreements expressly incorporated by reference, constitute the entire agreement between you and Amoria Connekyt regarding your use of the platform. This comprehensive agreement replaces and supersedes all previous versions of our Terms of Service, any prior agreements or understandings (written or oral), pre-launch beta agreements or NDAs (except where explicitly stated to survive), promotional materials or marketing communications, and any representations or promises not included in these written Terms.

No other agreements, whether written or oral, modify these Terms unless explicitly agreed to in writing and signed by authorized representatives of both parties. Our employees, support staff, or contractors cannot modify these Terms verbally or through informal communications. If you believe you have a separate agreement with us, it must be documented in writing and signed by authorized corporate officers to be enforceable.

If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court or arbitrator, the remaining provisions continue in full force and effect. The invalid provision will be modified to the minimum extent necessary to make it valid and enforceable while preserving its intended purpose, or if modification isn't possible, it will be severed without affecting other provisions.

12. Legal Notice, Contact Information, and Jurisdiction
For official legal correspondence, notices, and inquiries about these Terms, contact us through the appropriate channels.

Amoria Connekyt is owned and operated by Amoria Global Tech Ltd., a company duly registered and operating under the laws of the Republic of Rwanda. Our registered office is located in Kigali, Rwanda. We operate under Rwandan business licenses, comply with Rwandan regulatory requirements, and are subject to oversight by relevant Rwandan authorities including the National Cyber Security Authority (NCSA), Rwanda Revenue Authority, and other regulatory bodies.

For legal notices, inquiries, or official correspondence, contact us at:
• General Inquiries: info@amoriaglobal.com (for general questions about services, features, or accounts)
• Legal Correspondence: legal@amoriaglobal.com (for legal notices, disputes, intellectual property matters, law enforcement requests, or formal legal communications)
• Privacy Matters: privacy@amoriaglobal.com (for privacy rights requests, data protection inquiries, or GDPR matters)
• Support Issues: support@amoriaconnect.com (for technical support, account assistance, or customer service)

Legal notices must be sent in writing to legal@amoriaglobal.com or to our registered office address. Notices are deemed effective upon receipt (for email) or three business days after mailing (for postal mail). We'll acknowledge receipt of legal notices and respond within reasonable timeframes.

All legal matters arising from these Terms are governed by Rwandan law and subject to jurisdiction of Rwandan courts or arbitration in Kigali, Rwanda, as specified in the dispute resolution provisions above.

Severability and Modification:
If any provision of these Legal Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary while preserving the intent of these Terms. The remaining provisions will remain in full force and effect. We may modify these Terms as described in our update procedures, and your continued use indicates acceptance of modifications.

Thank you for taking the time to understand these legal terms. While legal language can be complex, these provisions protect both you and Amoria Connekyt, enabling fair, transparent, and legally compliant operations that benefit our entire creative community.`
    }
  ];

  const currentSection = sections.find(section => section.id === selectedSection) || sections[0];

  // Check if all sections have been viewed
  const allSectionsViewed = viewedSections.size === sections.length;

  // Handle section selection and track viewed sections
  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
    setViewedSections(prev => new Set(prev).add(sectionId));
    setIsMobileMenuOpen(false);
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

            .terms-header {
              padding: 1rem 0 !important;
            }

            .terms-header h1 {
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

            .agree-section {
              padding-top: 0.5rem !important;
              padding-bottom: 1rem !important;
            }

            .agree-section label {
              font-size: 14px !important;
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
        className="terms-header"
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
          Terms and Conditions
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
            {sections.map((section) => (
              <div
                key={section.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSectionClick(section.id);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSectionClick(section.id);
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
            ))}
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
            paddingRight: '3rem',
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
              Last Updated: 01 February 2026
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

          {/* Agree Checkbox */}
          <div className="agree-section" style={{
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
                By clicking the checkbox I confirm that I have read the Amoria connekyt Terms of Use
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;