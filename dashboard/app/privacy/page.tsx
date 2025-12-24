"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

export default function PrivacyPage() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <div className="min-h-screen bg-[hsl(222_47%_4%)] text-premium-text-primary px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-premium-text-muted hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 text-white">
            Privacy Policy
          </h1>
          <p className="text-premium-text-muted text-sm mb-12">
            Last updated: December 16, 2025
          </p>
          <div className="prose prose-invert max-w-none space-y-4 text-premium-text-secondary leading-relaxed text-sm sm:text-base">
            <div>
              This Privacy Notice for WatchLLM (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), describes how and why we might access, collect, store, use, and/or share (&quot;process&quot;) your personal information when you use our services (&quot;Services&quot;), including when you:
            </div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Visit our website at <a href="https://watchllm.dev" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">https://watchllm.dev</a> or any website of ours that links to this Privacy Notice</li>
              <li>Engage with us in other related ways, including any marketing or events</li>
            </ul>

            <div>
              <strong className="font-bold text-white">Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:support@watchllm.dev" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">support@watchllm.dev</a>.
            </div>

            <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">SUMMARY OF KEY POINTS</h2>

            <div>
              <strong className="font-bold text-white"><em>This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our </em></strong><button onClick={() => scrollToSection('toc')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer"><strong className="font-bold text-white"><em>table of contents</em></strong></button><strong className="font-bold text-white"><em> below to find the section you are looking for.</em></strong>
            </div>

            <div><strong className="font-bold text-white">What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about <button onClick={() => scrollToSection('infocollect')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">personal information you disclose to us</button>.</div>
            <div><strong className="font-bold text-white">Do we process any sensitive personal information?</strong> Some of the information may be considered &quot;special&quot; or &quot;sensitive&quot; in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We do not process sensitive personal information.</div>
            <div><strong className="font-bold text-white">Do we collect any information from third parties?</strong> We do not collect any information from third parties.</div>
            <div><strong className="font-bold text-white">How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. Learn more about <button onClick={() => scrollToSection('infouse')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">how we process your information</button>.</div>
            <div><strong className="font-bold text-white">In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties. Learn more about <button onClick={() => scrollToSection('whoshare')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">when and with whom we share your personal information</button>.</div>
            <div><strong className="font-bold text-white">How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Learn more about <button onClick={() => scrollToSection('infosafe')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">how we keep your information safe</button>.</div>
            <div><strong className="font-bold text-white">What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Learn more about <button onClick={() => scrollToSection('privacyrights')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">your privacy rights</button>.</div>
            <div><strong className="font-bold text-white">How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a <a href="https://app.termly.io/dsar/28c10cd6-940d-46f4-8145-df2ea69ce8ae" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">data subject access request</a>, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</div>
            <div>Want to learn more about what we do with any information we collect? <button onClick={() => scrollToSection('toc')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">Review the Privacy Notice in full</button>.</div>
            <div id="toc">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">TABLE OF CONTENTS</h2>
            </div>

            <div><button onClick={() => scrollToSection('infocollect')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">1. WHAT INFORMATION DO WE COLLECT?</button></div>
            <div><button onClick={() => scrollToSection('infouse')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">2. HOW DO WE PROCESS YOUR INFORMATION?</button></div>
            <div><button onClick={() => scrollToSection('legalbases')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</button></div>
            <div><button onClick={() => scrollToSection('whoshare')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</button></div>
            <div><button onClick={() => scrollToSection('cookies')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</button></div>
            <div><button onClick={() => scrollToSection('ai')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</button></div>
            <div><button onClick={() => scrollToSection('sociallogins')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">7. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</button></div>
            <div><button onClick={() => scrollToSection('intltransfers')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">8. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</button></div>
            <div><button onClick={() => scrollToSection('inforetain')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">9. HOW LONG DO WE KEEP YOUR INFORMATION?</button></div>
            <div><button onClick={() => scrollToSection('infosafe')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">10. HOW DO WE KEEP YOUR INFORMATION SAFE?</button></div>
            <div><button onClick={() => scrollToSection('infominors')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">11. DO WE COLLECT INFORMATION FROM MINORS?</button></div>
            <div><button onClick={() => scrollToSection('privacyrights')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">12. WHAT ARE YOUR PRIVACY RIGHTS?</button></div>
            <div><button onClick={() => scrollToSection('DNT')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">13. CONTROLS FOR DO-NOT-TRACK FEATURES</button></div>
            <div><button onClick={() => scrollToSection('uslaws')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">14. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</button></div>
            <div><button onClick={() => scrollToSection('policyupdates')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">15. DO WE MAKE UPDATES TO THIS NOTICE?</button></div>
            <div><button onClick={() => scrollToSection('contact')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">16. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</button></div>
            <div><button onClick={() => scrollToSection('request')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">17. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</button></div>
            <div id="infocollect">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">1. WHAT INFORMATION DO WE COLLECT?</h2>
            </div>

            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Personal information you disclose to us</h3>

            <div><strong className="font-bold text-white"><em>In Short:</em></strong><strong className="font-bold text-white"><em> </em></strong><em>We collect personal information that you provide to us.</em></div>
            <div>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</div>
            <div><strong className="font-bold text-white">Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>names</li>
              <li>email addresses</li>
              <li>passwords</li>
              <li>contact or authentication data</li>
            </ul>

            <div id="sensitiveinfo"><strong className="font-bold text-white">Sensitive Information.</strong> We do not process sensitive information.</div>
            <div><strong className="font-bold text-white">Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by Stripe and Whop. You may find their privacy notice link(s) here: <a href="https://stripe.com/privacy" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a> and <a href="https://whop.com/privacy" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">https://whop.com/privacy</a>.</div>
            <div><strong className="font-bold text-white">Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook, X, or other social media account. If you choose to register in this way, we will collect certain profile information about you from the social media provider, as described in the section called &quot;<button onClick={() => scrollToSection('sociallogins')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</button>&quot; below.</div>
            <div>All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</div>
            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Information automatically collected</h3>

            <div><strong className="font-bold text-white"><em>In Short:</em></strong><strong className="font-bold text-white"><em> </em></strong><em>Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</em></div>
            <div>We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.</div>
            <div>Like many businesses, we also collect information through cookies and similar technologies. You can find out more about this in our Cookie Notice: watchllm.dev/cookies.</div>
            <div>The information we collect includes:</div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><em>Log and Usage Data.</em> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. Depending on how you interact with us, this log data may include your IP address, device information, browser type, and settings and information about your activity in the Services (such as the date/time stamps associated with your usage, pages and files viewed, searches, and other actions you take such as which features you use), device event information (such as system activity, error reports (sometimes called &quot;crash dumps&quot;), and hardware settings).</li>
              <li><em>Device Data.</em> We collect device data such as information about your computer, phone, tablet, or other device you use to access the Services. Depending on the device used, this device data may include information such as your IP address (or proxy server), device and application identification numbers, location, browser type, hardware model, Internet service provider and/or mobile carrier, operating system, and system configuration information.</li>
              <li><em>Location Data.</em> We collect location data such as information about your device&apos;s location, which can be either precise or imprecise. How much information we collect depends on the type and settings of the device you use to access the Services. For example, we may use GPS and other technologies to collect geolocation data that tells us your current location (based on your IP address). You can opt out of allowing us to collect this information either by refusing access to the information or by disabling your Location setting on your device. However, if you choose to opt out, you may not be able to use certain aspects of the Services.</li>
            </ul>

            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Google API</h3>

            <div>Our use of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Limited Use requirements</a>.</div>
            <div id="infouse">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short: </em></strong><em>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We process the personal information for the following purposes listed below. We may also process your information for other purposes only with your prior explicit consent.</em></div>
            <div><strong className="font-bold text-white">We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</strong></div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">To facilitate account creation and authentication and otherwise manage user accounts. </strong>We may process your information so you can create and log in to your account.</li>
              <li><strong className="font-bold text-white">To deliver and facilitate delivery of services to the user. </strong>We may process your information to provide you with the requested service.</li>
              <li><strong className="font-bold text-white">To respond to user inquiries/offer support to users. </strong>We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.</li>
              <li><strong className="font-bold text-white">To send administrative information to you. </strong>We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.</li>
              <li><strong className="font-bold text-white">To save or protect an individual&apos;s vital interest.</strong> We may process your information when necessary to save or protect an individual&apos;s vital interest, such as to prevent harm.</li>
            </ul>

            <div id="legalbases">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</h2>
            </div>

            <div><em><strong className="font-bold text-white"><u>If you are located in the EU or UK, this section applies to you.</u></strong></em></div>
            <div>The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases to process your personal information:</div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">Consent. </strong>We may process your information if you have given us permission (i.e., consent) to use your personal information for a specific purpose. You can withdraw your consent at any time. Learn more about <button onClick={() => scrollToSection('withdrawconsent')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">withdrawing your consent</button>.</li>
              <li><strong className="font-bold text-white">Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to fulfill our contractual obligations to you, including providing our Services or at your request prior to entering into a contract with you.</li>
              <li><strong className="font-bold text-white">Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in which we are involved.</li>
              <li><strong className="font-bold text-white">Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party, such as situations involving potential threats to the safety of any person.</li>
            </ul>

            <div><em><strong className="font-bold text-white"><u>If you are located in Canada, this section applies to you.</u></strong></em></div>
            <div>We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can <button onClick={() => scrollToSection('withdrawconsent')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">withdraw your consent</button> at any time.</div>
            <div>In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent, including, for example:</div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way</li>
              <li>For investigations and fraud detection and prevention</li>
              <li>For business transactions provided certain conditions are met</li>
              <li>If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim</li>
              <li>For identifying injured, ill, or deceased persons and communicating with next of kin</li>
              <li>If we have reasonable grounds to believe an individual has been, is, or may be victim of financial abuse</li>
              <li>If it is reasonable to expect collection and use with consent would compromise the availability or the accuracy of the information and the collection is reasonable for investigating a breach of an agreement or a contravention of the laws of Canada or a province</li>
              <li>If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of records</li>
              <li>If it was produced by an individual in the course of their employment, business, or profession and the collection is consistent with the purposes for which the information was produced</li>
              <li>If the collection is solely for journalistic, artistic, or literary purposes</li>
              <li>If the information is publicly available and is specified by the regulations</li>
              <li>We may disclose de-identified information for approved research or statistics projects, subject to ethics oversight and confidentiality commitments</li>
              <li>If the collection is solely for journalistic, artistic, or literary purposes</li>
              <li>If the information is publicly available and is specified by the regulations</li>
              <li>We may disclose de-identified information for approved research or statistics projects, subject to ethics oversight and confidentiality commitments</li>
            </ul>

            <div id="whoshare">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short:</em></strong><em> We may share information in specific situations described in this section and/or with the following third parties.</em></div>
            <div><strong className="font-bold text-white">Vendors, Consultants, and Other Third-Party Service Providers.</strong> We may share your data with third-party vendors, service providers, contractors, or agents (&quot;<strong className="font-bold text-white">third parties</strong>&quot;) who perform services for us or on our behalf and require access to such information to do that work. We have contracts in place with our third parties, which are designed to help safeguard your personal information. This means that they cannot do anything with your personal information unless we have instructed them to do it. They will also not share your personal information with any organization apart from us. They also commit to protect the data they hold on our behalf and to retain it for the period we instruct. </div>
            <div>The third parties we may share personal information with are as follows:</div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">AI Service Providers</strong></li>
            </ul>

            <div>OpenAI, Anthropic and Groq</div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">Allow Users to Connect to Their Third-Party Accounts</strong></li>
            </ul>

            <div>Google account and Github account</div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">Cloud Computing Services</strong></li>
            </ul>

            <div>Supabase and Upstash</div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">Functionality and Infrastructure Optimization</strong></li>
            </ul>

            <div>Vercel and Cloudflare</div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">Invoice and Billing</strong></li>
            </ul>

            <div>Stripe and Whop</div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">Web and Mobile Analytics</strong></li>
            </ul>

            <div>Simple Analytics and Google Analytics</div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">Website Performance Monitoring</strong></li>
            </ul>

            <div>Sentry</div>

            <div>We also may need to share your personal information in the following situations:</div>

            <div id="cookies">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short:</em></strong><em> We may use cookies and other tracking technologies to collect and store your information.</em></div>
            <div>We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.</div>
            <div>We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.</div>
            <div>To the extent these online tracking technologies are deemed to be a &quot;sale&quot;/&quot;sharing&quot; (which includes targeted advertising, as defined under the applicable laws) under applicable US state laws, you can opt out of these online tracking technologies by submitting a request as described below under section &quot;<button onClick={() => scrollToSection('uslaws')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</button>&quot;</div>
            <div>Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice: watchllm.dev/cookies.</div>
            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Google Analytics</h3>

            <div>We may share your information with Google Analytics to track and analyze the use of the Services. To opt out of being tracked by Google Analytics across the Services, visit <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a>. For more information on the privacy practices of Google, please visit the <a href="https://policies.google.com/privacy" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Google Privacy & Terms page</a>.</div>
            <div id="ai">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short:</em></strong><em> We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</em></div>
            <div>As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, &quot;AI Products&quot;). These tools are designed to enhance your experience and provide you with innovative solutions. The terms in this Privacy Notice govern your use of the AI Products within our Services.</div>
            <div><strong className="font-bold text-white">Use of AI Technologies</strong></div>

            <div>We provide the AI Products through third-party service providers (&quot;AI Service Providers&quot;), including OpenAI, Groq, Anthropic, Supabase, Upstash, Vercel, Cloudflare workers, Stripe, Whop, Simple Analytics, Sentry and Resend. As outlined in this Privacy Notice, your input, output, and personal information will be shared with and processed by these AI Service Providers to enable your use of our AI Products for purposes outlined in &quot;<button onClick={() => scrollToSection('legalbases')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</button>&quot; You must not use the AI Products in any way that violates the terms or policies of any AI Service Provider.</div>
            <div><strong className="font-bold text-white">Our AI Products</strong></div>

            <div>Our AI Products are designed for the following functions:</div>

            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>AI bots</li>
              <li>Machine learning models</li>
              <li>Natural language processing</li>
              <li>Text analysis</li>
              <li>AI search</li>
              <li>AI translation</li>
            </ul>

            <div><strong className="font-bold text-white">How We Process Your Data Using AI</strong></div>

            <div>All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties. This ensures high security and safeguards your personal information throughout the process, giving you peace of mind about your data&apos;s safety.</div>
            <div id="sociallogins">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">7. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short: </em></strong><em>If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</em></div>
            <div>Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.</div>
            <div>We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.</div>
            <div id="intltransfers">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">8. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short: </em></strong><em>We may transfer, store, and process your information in countries other than your own.</em></div>
            <div>Our servers are located in Germany, Switzerland and United States. Regardless of your location, please be aware that your information may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties with whom we may share your personal information (see &quot;<button onClick={() => scrollToSection('whoshare')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</button>&quot; above), including facilities in and other countries.</div>
            <div>If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this Privacy Notice and applicable law.</div>
            <div>European Commission&apos;s Standard Contractual Clauses:</div>

            <div>We have implemented measures to protect your personal information, including by using the European Commission&apos;s Standard Contractual Clauses for transfers of personal information between our group companies and between us and our third-party providers. These clauses require all recipients to protect all personal information that they process originating from the EEA or UK in accordance with European data protection laws and regulations. Our Standard Contractual Clauses can be provided upon request. We have implemented similar appropriate safeguards with our third-party service providers and partners and further details can be provided upon request.</div>
            <div id="inforetain">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">9. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short: </em></strong><em>We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</em></div>
            <div>We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</div>
            <div>When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.</div>
            <div id="infosafe">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">10. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short: </em></strong><em>We aim to protect your personal information through a system of organizational and technical security measures.</em></div>
            <div>We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.</div>
            <div id="infominors">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">11. DO WE COLLECT INFORMATION FROM MINORS?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short:</em></strong><em> We do not knowingly collect data from or market to children under 18 years of age or the equivalent age as specified by law in your jurisdiction.</em></div>
            <div>We do not knowingly collect, solicit data from, or market to children under 18 years of age or the equivalent age as specified by law in your jurisdiction, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or the equivalent age as specified by law in your jurisdiction or that you are the parent or guardian of such a minor and consent to such minor dependent&apos;s use of the Services. If we learn that personal information from users less than 18 years of age or the equivalent age as specified by law in your jurisdiction has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18 or the equivalent age as specified by law in your jurisdiction, please contact us at <a href="mailto:support@watchllm.dev" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">support@watchllm.dev</a>.</div>
            <div id="privacyrights">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">12. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short:</em></strong><em> <em></em>Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information.<em></em> You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</em></div>
            <div>In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. If a decision that produces legal or similarly significant effects is made solely by automated means, we will inform you, explain the main factors, and offer a simple way to request human review. In certain circumstances, you may also have the right to object to the processing of your personal information. You can make such a request by contacting us by using the contact details provided in the section &quot;<button onClick={() => scrollToSection('contact')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</button>&quot; below.</div>
            <div>We will consider and act upon any request in accordance with applicable data protection laws.</div>

            <div>If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the right to complain to your <a href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Member State data protection authority</a> or <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">UK data protection authority</a>.</div>
            <div>If you are located in Switzerland, you may contact the <a href="https://www.edoeb.admin.ch/edoeb/en/home.html" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Federal Data Protection and Information Commissioner</a>.</div>
            <div id="withdrawconsent"><strong className="font-bold text-white"><u>Withdrawing your consent:</u></strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section &quot;<button onClick={() => scrollToSection('contact')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</button>&quot; below.</div>
            <div>However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.</div>
            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Account Information</h3>

            <div>If you would at any time like to review or change the information in your account or terminate your account, you can:</div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Log in to your account settings and update your user account.</li>
            </ul>

            <div>Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</div>
            <div><strong className="font-bold text-white"><u>Cookies and similar technologies:</u></strong> Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services. For further information, please see our Cookie Notice: watchllm.dev/cookies.</div>
            <div>If you have questions or comments about your privacy rights, you may email us at <a href="mailto:support@watchllm.dev" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">support@watchllm.dev</a>.</div>
            <div id="DNT">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">13. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
            </div>

            <div>Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&quot;DNT&quot;) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.</div>
            <div>California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.</div>
            <div id="uslaws">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">14. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
            </div>

            <div><strong className="font-bold text-white"><em>In Short: </em></strong><em>If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. More information is provided below.</em></div>
            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Categories of Personal Information We Collect</h3>

            <div>The table below shows the categories of personal information we have collected in the past twelve (12) months. The table includes illustrative examples of each category and does not reflect the personal information we collect from you. For a comprehensive inventory of all personal information we process, please refer to the section &quot;<button onClick={() => scrollToSection('infocollect')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">WHAT INFORMATION DO WE COLLECT?</button>&quot;</div>
            <div className="overflow-x-auto my-8 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse border border-white/20 bg-white/5 rounded-lg overflow-hidden shadow-lg">
                <thead className="bg-white/10">
                  <tr>
                    <th className="p-4 border-b border-white/10 text-white font-semibold">Category</th>
                    <th className="p-4 border-b border-white/10 text-white font-semibold">Examples</th>
                    <th className="p-4 border-b border-white/10 text-white font-semibold">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">A. Identifiers</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">B. Personal information as defined in the California Customer Records statute</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Name, contact information, education, employment, employment history, and financial information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">YES</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">C. Protected classification characteristics under state or federal law</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">D. Commercial information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Transaction information, purchase history, financial details, and payment information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">E. Biometric information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Fingerprints and voiceprints</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">F. Internet or other similar network activity</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">G. Geolocation data</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Device location</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">H. Audio, electronic, sensory, or similar information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Images and audio, video or call recordings created in connection with our business activities</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">I. Professional or employment-related information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">J. Education Information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Student records and directory information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">K. Inferences drawn from collected personal information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual&apos;s preferences and characteristics</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">L. Sensitive personal Information</td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary"></td>
                    <td className="p-4 border-b border-white/10 text-premium-text-secondary">NO</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>We may also collect other personal information outside of these categories through instances where you interact with us in person, online, or by phone or mail in the context of:</div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Receiving help through our customer support channels;</li>
              <li>Participation in customer surveys or contests; and</li>
              <li>Facilitation in the delivery of our Services and to respond to your inquiries.</li>
            </ul>

            <div>We will use and retain the collected personal information as needed to provide the Services or for:</div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Category B - As long as the user has an account with us</li>
            </ul>

            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Sources of Personal Information</h3>

            <div>Learn more about the sources of personal information we collect in &quot;<button onClick={() => scrollToSection('infocollect')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">WHAT INFORMATION DO WE COLLECT?</button>&quot;</div>
            <h3 className="text-white text-xl font-semibold mb-4 mt-6">How We Use and Share Personal Information</h3>

            <div>Learn more about how we use your personal information in the section, &quot;<button onClick={() => scrollToSection('infouse')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">HOW DO WE PROCESS YOUR INFORMATION?</button>&quot;</div>
            <div><strong className="font-bold text-white">Will your information be shared with anyone else?</strong></div>

            <div>We may disclose your personal information with our service providers pursuant to a written contract between us and each service provider. Learn more about how we disclose personal information to in the section, &quot;<button onClick={() => scrollToSection('whoshare')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</button>&quot;</div>
            <div>We may use your personal information for our own business purposes, such as for undertaking internal research for technological development and demonstration. This is not considered to be &quot;selling&quot; of your personal information.</div>
            <div>We have not sold or shared any personal information to third parties for a business or commercial purpose in the preceding twelve (12) months. We have disclosed the following categories of personal information to third parties for a business or commercial purpose in the preceding twelve (12) months:</div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Category B. Personal information as defined in the California Customer Records law</li>
            </ul>

            <div>The categories of third parties to whom we disclosed personal information for a business or commercial purpose can be found under &quot;<button onClick={() => scrollToSection('whoshare')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</button>&quot;</div>
            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Your Rights</h3>

            <div>You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we may decline your request as permitted by law. These rights include:</div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong className="font-bold text-white">Right to know</strong> whether or not we are processing your personal data</li>
              <li><strong className="font-bold text-white">Right to access </strong>your personal data</li>
              <li><strong className="font-bold text-white">Right to correct </strong>inaccuracies in your personal data</li>
              <li><strong className="font-bold text-white">Right to request</strong> the deletion of your personal data</li>
              <li><strong className="font-bold text-white">Right to obtain a copy </strong>of the personal data you previously shared with us</li>
              <li><strong className="font-bold text-white">Right to non-discrimination</strong> for exercising your rights</li>
              <li><strong className="font-bold text-white">Right to opt out</strong> of the processing of your personal data if it is used for targeted advertising (or sharing as defined under California&apos;s privacy law), the sale of personal data, or profiling in furtherance of decisions that produce legal or similarly significant effects (&quot;profiling&quot;)</li>
            </ul>

            <div>Depending upon the state where you live, you may also have the following rights:</div>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Right to access the categories of personal data being processed (as permitted by applicable law, including the privacy law in Minnesota)</li>
              <li>Right to obtain a list of the categories of third parties to which we have disclosed personal data (as permitted by applicable law, including the privacy law in California, Delaware, and Maryland)</li>
              <li>Right to obtain a list of specific third parties to which we have disclosed personal data (as permitted by applicable law, including the privacy law in Minnesota and Oregon)</li>
              <li>Right to obtain a list of third parties to which we have sold personal data (as permitted by applicable law, including the privacy law in Connecticut)</li>
              <li>Right to review, understand, question, and depending on where you live, correct how personal data has been profiled (as permitted by applicable law, including the privacy law in Connecticut and Minnesota)</li>
              <li>Right to limit use and disclosure of sensitive personal data (as permitted by applicable law, including the privacy law in California)</li>
              <li>Right to opt out of the collection of sensitive data and personal data collected through the operation of a voice or facial recognition feature (as permitted by applicable law, including the privacy law in Florida)</li>
            </ul>

            <h3 className="text-white text-xl font-semibold mb-4 mt-6">How to Exercise Your Rights</h3>

            <div>To exercise these rights, you can contact us by submitting a <a href="https://app.termly.io/dsar/28c10cd6-940d-46f4-8145-df2ea69ce8ae" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">data subject access request</a>, by emailing us at <a href="mailto:support@watchllm.dev" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">support@watchllm.dev</a>, or by referring to the contact details at the bottom of this document.</div>
            <div>Under certain US state data protection laws, you can designate an authorized agent to make a request on your behalf. We may deny a request from an authorized agent that does not submit proof that they have been validly authorized to act on your behalf in accordance with applicable laws.</div>
            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Request Verification</h3>

            <div>Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request. However, if we cannot verify your identity from the information already maintained by us, we may request that you provide additional information for the purposes of verifying your identity and for security or fraud-prevention purposes.</div>
            <div>If you submit the request through an authorized agent, we may need to collect additional information to verify your identity before processing your request and the agent will need to provide a written and signed permission from you to submit such request on your behalf.</div>
            <h3 className="text-white text-xl font-semibold mb-4 mt-6">Appeals</h3>

            <div>Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at <a href="mailto:support@watchllm.dev" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">support@watchllm.dev</a>. We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions. If your appeal is denied, you may submit a complaint to your state attorney general.</div>
            <h3 className="text-white text-xl font-semibold mb-4 mt-6">California &quot;Shine The Light&quot; Law</h3>

            <div>California Civil Code Section 1798.83, also known as the &quot;Shine The Light&quot; law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us by using the contact details provided in the section &quot;<button onClick={() => scrollToSection('contact')} className="text-blue-400 hover:text-blue-300 underline cursor-pointer">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</button>&quot;</div>
            <div id="policyupdates">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">15. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
            </div>

            <div><em><strong className="font-bold text-white">In Short: </strong>Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></div>
            <div>We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</div>
            <div id="contact">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">16. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
            </div>

            <div>If you have questions or comments about this notice, you may email us at <a href="mailto:support@watchllm.dev" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">support@watchllm.dev</a> or contact us by post at:</div>
            <div>WatchLLM</div>
            <div>Tamil Nadu, India</div>

            <div id="request">
              <h2 className="text-white text-2xl font-semibold mb-6 mt-10 border-b border-white/20 pb-2">17. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
            </div>

            <div>Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a <a href="https://app.termly.io/dsar/28c10cd6-940d-46f4-8145-df2ea69ce8ae" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">data subject access request</a>.</div>
          </div>

          {/* Back to Top Button */}
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollToSection('top')}
              className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50"
              aria-label="Back to top"
            >
              <ArrowUp className="w-6 h-6" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

