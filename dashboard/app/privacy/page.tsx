import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | WatchLLM',
  description: 'Privacy policy for WatchLLM - AI API cost optimization platform',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl font-sans text-white">
      <div className="max-w-none text-white">
        <h1 className="text-4xl font-bold mb-8">PRIVACY POLICY</h1>

        <p className="text-sm text-muted-foreground mb-8">
          <strong>Last updated:</strong> December 16, 2025
        </p>

        <div className="mb-8">
          <p className="mb-4">
            This Privacy Notice for <strong>WatchLLM</strong> (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), describes how and why we might access, collect, store, use, and/or share (&quot;process&quot;) your personal information when you use our services (&quot;Services&quot;).
          </p>
          <p className="mb-4">
            Visit our website at{' '}
            <a href="https://watchllm.dev" className="text-primary hover:underline">
              https://watchllm.dev
            </a>{' '}
            or any website of ours that links to this Privacy Notice.
          </p>
          <p className="mb-4">
            <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at{' '}
            <a href="mailto:kiwi092020@gmail.com" className="text-primary hover:underline">
              kiwi092020@gmail.com
            </a>.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SUMMARY OF KEY POINTS</h2>

          <p className="mb-4">
            <strong><em>This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.</em></strong>
          </p>

          <div className="space-y-4">
            <div>
              <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about{' '}
              <a href="#personalinfo" className="text-primary hover:underline">personal information you disclose to us</a>.
            </div>

            <div>
              <strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.
            </div>

            <div>
              <strong>Do we receive any information from third parties?</strong> We do not receive any information from third parties.
            </div>

            <div>
              <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. Learn more about{' '}
              <a href="#infouse" className="text-primary hover:underline">how we process your information</a>.
            </div>

            <div>
              <strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties. Learn more about{' '}
              <a href="#whoshare" className="text-primary hover:underline">when and with whom we share your personal information</a>.
            </div>

            <div>
              <strong>How do we keep your information safe?</strong> We have organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Learn more about{' '}
              <a href="#infosafe" className="text-primary hover:underline">how we keep your information safe</a>.
            </div>

            <div>
              <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Learn more about{' '}
              <a href="#privacyrights" className="text-primary hover:underline">your privacy rights</a>.
            </div>

            <div>
              <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a{' '}
              <a href="https://app.termly.io/dsar/28c10cd6-940d-46f4-8145-df2ea69ce8ae" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                data subject access request
              </a>, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.
            </div>

            <div>
              Want to learn more about what we do with any information we collect?{' '}
              <a href="#toc" className="text-primary hover:underline">Review the Privacy Notice in full</a>.
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 id="toc" className="text-2xl font-semibold mb-4">TABLE OF CONTENTS</h2>

          <ol className="list-decimal list-inside space-y-2">
            <li><a href="#infocollect" className="text-primary hover:underline">WHAT INFORMATION DO WE COLLECT?</a></li>
            <li><a href="#infouse" className="text-primary hover:underline">HOW DO WE PROCESS YOUR INFORMATION?</a></li>
            <li><a href="#legalbases" className="text-primary hover:underline">WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</a></li>
            <li><a href="#whoshare" className="text-primary hover:underline">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></li>
            <li><a href="#cookies" className="text-primary hover:underline">DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</a></li>
            <li><a href="#sociallogins" className="text-primary hover:underline">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a></li>
            <li><a href="#inforetain" className="text-primary hover:underline">HOW LONG DO WE KEEP YOUR INFORMATION?</a></li>
            <li><a href="#infosafe" className="text-primary hover:underline">HOW DO WE KEEP YOUR INFORMATION SAFE?</a></li>
            <li><a href="#infominors" className="text-primary hover:underline">DO WE COLLECT INFORMATION FROM MINORS?</a></li>
            <li><a href="#privacyrights" className="text-primary hover:underline">WHAT ARE YOUR PRIVACY RIGHTS?</a></li>
            <li><a href="#DNT" className="text-primary hover:underline">CONTROLS FOR DO-NOT-TRACK FEATURES</a></li>
            <li><a href="#uslaws" className="text-primary hover:underline">DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</a></li>
            <li><a href="#policyupdates" className="text-primary hover:underline">DO WE MAKE UPDATES TO THIS NOTICE?</a></li>
            <li><a href="#contact" className="text-primary hover:underline">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></li>
            <li><a href="#request" className="text-primary hover:underline">HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 id="infocollect" className="text-2xl font-semibold mb-4">1. WHAT INFORMATION DO WE COLLECT?</h2>

          <h3 className="text-xl font-semibold mb-3">Personal information you disclose to us</h3>
          <p className="mb-4">
            <strong><em>In Short:</em></strong> We collect personal information that you provide to us.
          </p>
          <p className="mb-4">
            We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
          </p>

          <h4 className="text-lg font-semibold mb-2">Personal Information Provided by You.</h4>
          <p className="mb-4">
            The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>names</li>
            <li>email addresses</li>
            <li>usernames</li>
            <li>passwords</li>
            <li>contact preferences</li>
            <li>contact or authentication data</li>
            <li>billing addresses</li>
            <li>debit/credit card numbers</li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">Sensitive Information.</h4>
          <p className="mb-4">
            We do not process sensitive information.
          </p>

          <h4 className="text-lg font-semibold mb-2">Social Media Login Data.</h4>
          <p className="mb-4">
            We may provide you with the option to register with us using social media account details, like your Facebook, Twitter, or other social media account. If you choose to register in this way, we will collect information described in the section called &quot;<a href="#sociallogins" className="text-primary hover:underline">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a>&quot; below.
          </p>

          <h4 className="text-lg font-semibold mb-2">Application Data.</h4>
          <p className="mb-4">
            If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>Geolocation information. We may request access or permission to track location-based information from your mobile device, either continuously or while you are using our mobile application(s), to provide certain location-based services. If you wish to change our access or permissions, you may do so in your device&apos;s settings.</li>
            <li>Mobile device access. We may request access or permission to certain features from your mobile device, including your mobile device&apos;s storage, and other features. If you wish to change our access or permissions, you may do so in your device&apos;s settings.</li>
            <li>Mobile device data. We automatically collect device information (such as your mobile device ID, model, and manufacturer), operating system, version information and system configuration information, device and application identification numbers, browser type and version, hardware model, Internet service provider and/or mobile carrier, and Internet Protocol (IP) address (or proxy server). If you are using our application(s), we may also collect information about the phone network associated with your mobile device, your mobile device&apos;s operating system or platform, the type of mobile device you use, your mobile device&apos;s unique device ID, and information about the features of our application(s) you accessed.</li>
            <li>Push notifications. We may request to send you push notifications regarding your account or certain features of the application(s). If you wish to opt out from receiving these types of communications, you may turn them off in your device&apos;s settings.</li>
          </ul>
          <p className="mb-4">
            This information is primarily needed to maintain the security and operation of our application(s), for troubleshooting, and for our internal analytics and reporting purposes.
          </p>

          <p className="mb-4">
            All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="infouse" className="text-2xl font-semibold mb-4">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
          </p>

          <p className="mb-4">
            We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
          </p>

          <ul className="list-disc list-inside mb-4">
            <li><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.</li>
            <li><strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service.</li>
            <li><strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your questions and solve any potential issues you might have with the requested service.</li>
            <li><strong>To send administrative information to you.</strong> We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.</li>
            <li><strong>To fulfill and manage your orders.</strong> We may process your information to fulfill and manage your orders, payments, returns, and exchanges made through the Services.</li>
            <li><strong>To enable user-to-user communications.</strong> We may process your information if you choose to use any of our offerings that allow for communication with another user.</li>
            <li><strong>To request feedback.</strong> We may process your information when necessary to request feedback and to contact you about your use of our Services.</li>
            <li><strong>To send you marketing and promotional communications.</strong> We may process the personal information you send to us for our marketing purposes, if this is in accordance with your marketing preferences. You can opt out of our marketing emails at any time. For more information, see &quot;<a href="#privacyrights" className="text-primary hover:underline">WHAT ARE YOUR PRIVACY RIGHTS?</a>&quot; below.</li>
            <li><strong>To deliver targeted advertising to you.</strong> We may process your information to develop and display personalized content and advertising tailored to your interests, location, and more.</li>
            <li><strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.</li>
            <li><strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how they are being used so we can improve them.</li>
            <li><strong>To determine the effectiveness of our marketing and promotional campaigns.</strong> We may process your information to better understand how to provide marketing and promotional campaigns that are most relevant to you.</li>
            <li><strong>To save or protect an individual&apos;s vital interest.</strong> We may process your information when necessary to save or protect an individual&apos;s vital interest, such as to prevent harm.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="legalbases" className="text-2xl font-semibold mb-4">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.
          </p>

          <p className="mb-4">
            If you are located in the EU or UK, this section applies to you.
          </p>

          <p className="mb-4">
            The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases to process your personal information:
          </p>

          <ul className="list-disc list-inside mb-4">
            <li><strong>Consent.</strong> We may process your information if you have given us permission (i.e., consent) to use your personal information for a specific purpose. You can withdraw your consent at any time. Learn more about withdrawing your consent.</li>
            <li><strong>Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to fulfill our contractual obligations to you, including providing our Services or at your request prior to entering into a contract with you.</li>
            <li><strong>Legitimate Interests.</strong> We may process your information when we believe it is reasonably necessary to achieve our legitimate business interests and those interests do not outweigh your interests and fundamental rights and freedoms. For example, we may process your personal information for some of the purposes described in order to:</li>
            <ul className="list-disc list-inside ml-6 mb-4">
              <li>Send users information about special offers and discounts on our products and services</li>
              <li>Develop and display personalized and relevant advertising content for our users</li>
              <li>Analyze how our Services are used so we can improve them to engage and retain users</li>
              <li>Support our marketing activities</li>
              <li>Diagnose problems and/or prevent fraudulent activities</li>
              <li>Understand how our users use our products and services so we can improve user experience</li>
            </ul>
            <li><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in which we are involved.</li>
            <li><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party, such as situations involving potential threats to the safety of any person.</li>
          </ul>

          <p className="mb-4">
            If you are located in Canada, this section applies to you.
          </p>

          <p className="mb-4">
            We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can withdraw your consent at any time.
          </p>

          <p className="mb-4">
            In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent, including, for example:
          </p>

          <ul className="list-disc list-inside mb-4">
            <li>If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way</li>
            <li>For investigations and fraud detection and prevention</li>
            <li>For business transactions provided certain conditions are met</li>
            <li>If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim</li>
            <li>For identifying injured, ill, or deceased persons and communicating with next of kin</li>
            <li>If we have reasonable grounds to believe an individual has been, is, or may be victim of financial abuse</li>
            <li>If it is reasonable to expect collection and use with consent would compromise the availability or the accuracy of the information and the collection is reasonable for purposes related to investigating a breach of an agreement or a contravention of the laws of Canada or a province</li>
            <li>If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of records</li>
            <li>If it was produced by an individual in the course of their employment, business, or profession and the collection is consistent with the purposes for which the information was produced</li>
            <li>If the collection is solely for journalistic, artistic, or literary purposes</li>
            <li>If the information is publicly available and is specified by the regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="whoshare" className="text-2xl font-semibold mb-4">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> We may share information in specific situations described in this section and/or with the following third parties.
          </p>

          <p className="mb-4">
            We may need to share your personal information in the following situations:
          </p>

          <ul className="list-disc list-inside mb-4">
            <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
            <li><strong>When we use Google Maps Platform APIs.</strong> We may share your information with certain Google Maps Platform APIs (e.g., Google Maps API, Places API). To find out more about Google&apos;s Privacy Policy, please refer to this <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">link</a>. We use certain Google Maps Platform APIs to retrieve certain information when you make location-specific requests. This may include: and other similar information. A full list of what we use information for can be found in this section and in the previous section titled &quot;<a href="#infouse" className="text-primary hover:underline">HOW DO WE PROCESS YOUR INFORMATION?</a>&quot;. You may revoke your consent anytime by contacting us using the contact details provided in the section below titled &quot;<a href="#contact" className="text-primary hover:underline">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a>&quot;.</li>
            <li><strong>Business Partners.</strong> We may share your information with our business partners to offer you certain products, services, or promotions.</li>
            <li><strong>Offer Wall.</strong> Our application(s) may display a third-party hosted &quot;offer wall.&quot; Such an offer wall allows third-party advertisers to offer virtual currency, gifts, or other items to users in return for the acceptance and completion of an advertisement offer. Such an offer wall may appear in our application(s) and be displayed to you based on certain data, such as your geographic area or demographic information. When you click on an offer wall, you will be brought to an external website belonging to other persons and will leave our application(s). A unique identifier, such as your user ID, will be shared with the offer wall provider in order to prevent fraud and properly credit your account with the relevant reward.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Third-Party Service Providers</h3>
          <p className="mb-4">
            We may share your data with third-party vendors, service providers, contractors, or agents (&quot;third parties&quot;) who perform services for us or on our behalf and require access to such information to do that work. We have contracts in place with our third parties, which are designed to help safeguard your personal information. This means that they cannot do anything with your personal information unless we have instructed them to do it. They will also not share your personal information with any organization apart from us. They also commit to protect the data they hold on our behalf and to retain it for the period we instruct. The third parties we may share personal information with are as follows:
          </p>

          <ul className="list-disc list-inside mb-4">
            <li><strong>Allow Users to Connect to Their Third-Party Accounts</strong></li>
            <li><strong>Ad Networks</strong></li>
            <li><strong>Affiliate Marketing Programs</strong></li>
            <li><strong>Cloud Computing Services</strong></li>
            <li><strong>Communication & Collaboration Tools</strong></li>
            <li><strong>Data Analytics Services</strong></li>
            <li><strong>Data Storage Service Providers</strong></li>
            <li><strong>Finance & Accounting Tools</strong></li>
            <li><strong>Government Entities</strong></li>
            <li><strong>Order Fulfillment Service Providers</strong></li>
            <li><strong>Payment Processors</strong></li>
            <li><strong>Performance Monitoring Tools</strong></li>
            <li><strong>Product Engineering & Design Tools</strong></li>
            <li><strong>Retargeting Platforms</strong></li>
            <li><strong>Sales & Marketing Tools</strong></li>
            <li><strong>Social Networks</strong></li>
            <li><strong>Testing Tools</strong></li>
            <li><strong>User Account Registration & Authentication Services</strong></li>
            <li><strong>Website Hosting Service Providers</strong></li>
            <li><strong>Other Product & Service Providers</strong></li>
          </ul>

          <p className="mb-4">
            You may find their privacy notice link(s) here:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>
              <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                https://stripe.com/privacy
              </a>
            </li>
            <li>
              <a href="https://whop.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                https://whop.com/privacy
              </a>
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Google API</h3>
          <p className="mb-4">
            Our use of information received from Google APIs will adhere to{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Google API Services User Data Policy
            </a>, including the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Limited Use requirements
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="cookies" className="text-2xl font-semibold mb-4">5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> We may use cookies and other tracking technologies to collect and store your information.
          </p>

          <p className="mb-4">
            We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="sociallogins" className="text-2xl font-semibold mb-4">6. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.
          </p>

          <p className="mb-4">
            Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or Twitter logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.
          </p>

          <p className="mb-4">
            We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="inforetain" className="text-2xl font-semibold mb-4">7. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.
          </p>

          <p className="mb-4">
            We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.
          </p>

          <p className="mb-4">
            When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="infosafe" className="text-2xl font-semibold mb-4">8. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> We aim to protect your personal information through a system of organizational and technical security measures.
          </p>

          <p className="mb-4">
            We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="infominors" className="text-2xl font-semibold mb-4">9. DO WE COLLECT INFORMATION FROM MINORS?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> We do not knowingly collect data from or market to children under 18 years of age.
          </p>

          <p className="mb-4">
            We do not knowingly solicit data from or market to children under 18 years of age. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent&apos;s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at kiwi092020@gmail.com.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="privacyrights" className="text-2xl font-semibold mb-4">10. WHAT ARE YOUR PRIVACY RIGHTS?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> In some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.
          </p>

          <p className="mb-4">
            In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. In certain circumstances, you may also have the right to object to the processing of your personal information. You can make such a request by contacting us by using the contact details provided in the section &quot;<a href="#contact" className="text-primary hover:underline">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a>&quot; below.
          </p>

          <p className="mb-4">
            We will consider and act upon any request in accordance with applicable data protection laws.
          </p>

          <p className="mb-4">
            If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the right to complain to your <a href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Member State data protection authority</a> or <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">UK data protection authority</a>.
          </p>

          <p className="mb-4">
            If you are located in Switzerland, you may contact the <a href="https://www.edoeb.admin.ch/edoeb/en/home.html" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Federal Data Protection and Information Commissioner</a>.
          </p>

          <p className="mb-4">
            <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section &quot;<a href="#contact" className="text-primary hover:underline">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a>&quot; below or updating your preferences.
          </p>

          <p className="mb-4">
            However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.
          </p>

          <h3 className="text-xl font-semibold mb-3">Account Information</h3>
          <p className="mb-4">
            If you would at any time like to review or change the information in your account or terminate your account, you can:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>Contact us using the contact information provided.</li>
            <li>Log in to your account settings and update your user account.</li>
          </ul>
          <p className="mb-4">
            Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
          </p>

          <p className="mb-4">
            If you have questions or comments about your privacy rights, you may email us at kiwi092020@gmail.com.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="DNT" className="text-2xl font-semibold mb-4">11. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>

          <p className="mb-4">
            Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&quot;DNT&quot;) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="uslaws" className="text-2xl font-semibold mb-4">12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> If you are a resident of California, Colorado, Connecticut, Utah, or Virginia, you are granted specific rights regarding access to your personal information.
          </p>

          <h3 className="text-xl font-semibold mb-3">What categories of personal information do we collect?</h3>
          <p className="mb-4">
            We have collected the following categories of personal information in the past twelve (12) months:
          </p>

          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Category</th>
                <th className="border border-gray-300 p-2 text-left">Examples</th>
                <th className="border border-gray-300 p-2 text-left">Collected</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">A. Identifiers</td>
                <td className="border border-gray-300 p-2">Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name</td>
                <td className="border border-gray-300 p-2">YES</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">B. Personal information as defined in the California Customer Records statute</td>
                <td className="border border-gray-300 p-2">Name, contact information, education, employment, employment history, and financial information</td>
                <td className="border border-gray-300 p-2">YES</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">C. Protected classification characteristics under state or federal law</td>
                <td className="border border-gray-300 p-2">Gender, age, date of birth, race and ethnicity, national origin, citizenship, immigration status, disability, medical condition, genetic information, marital status, military or veteran status, and other protected classifications</td>
                <td className="border border-gray-300 p-2">NO</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">D. Commercial information</td>
                <td className="border border-gray-300 p-2">Transaction information, purchase history, financial details, and payment information</td>
                <td className="border border-gray-300 p-2">YES</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">E. Biometric information</td>
                <td className="border border-gray-300 p-2">Fingerprints and voiceprints</td>
                <td className="border border-gray-300 p-2">NO</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">F. Internet or other similar network activity</td>
                <td className="border border-gray-300 p-2">Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements</td>
                <td className="border border-gray-300 p-2">YES</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">G. Geolocation data</td>
                <td className="border border-gray-300 p-2">Device location</td>
                <td className="border border-gray-300 p-2">YES</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">H. Audio, electronic, sensory, or similar information</td>
                <td className="border border-gray-300 p-2">Images and audio, video or call recordings created in connection with our business activities</td>
                <td className="border border-gray-300 p-2">NO</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">I. Professional or employment-related information</td>
                <td className="border border-gray-300 p-2">Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us</td>
                <td className="border border-gray-300 p-2">NO</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">J. Education Information</td>
                <td className="border border-gray-300 p-2">Student records and directory information</td>
                <td className="border border-gray-300 p-2">NO</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">K. Inferences drawn from collected personal information</td>
                <td className="border border-gray-300 p-2">Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual&apos;s preferences and characteristics</td>
                <td className="border border-gray-300 p-2">YES</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">L. Sensitive personal Information</td>
                <td className="border border-gray-300 p-2"></td>
                <td className="border border-gray-300 p-2">NO</td>
              </tr>
            </tbody>
          </table>

          <p className="mb-4">
            We will use and retain the collected personal information as needed to provide the Services or for:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>Category A - As long as the user has an account with us</li>
            <li>Category B - As long as the user has an account with us</li>
            <li>Category D - As long as the user has an account with us</li>
            <li>Category F - As long as the user has an account with us</li>
            <li>Category G - As long as the user has an account with us</li>
            <li>Category K - As long as the user has an account with us</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">What are your privacy rights?</h3>
          <p className="mb-4">
            You may request to know:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>whether we collect and use your personal information;</li>
            <li>the categories and specific pieces of personal information we collect;</li>
            <li>the categories of sources for the personal information we collect;</li>
            <li>our business or commercial purpose for collecting or selling that personal information;</li>
            <li>the categories of third parties with whom we share that personal information;</li>
            <li>if we sold, shared, or disclosed your personal information for a business purpose, the categories of third parties to whom we sold, shared, or disclosed personal information;</li>
            <li>the specific pieces of personal information we collected about you;</li>
            <li>if we disclosed your personal information for a business purpose, a list of the personal information categories that each category of recipient received;</li>
          </ul>

          <p className="mb-4">
            You may request to delete personal information we collected from you.
          </p>

          <p className="mb-4">
            You may request to correct your personal information.
          </p>

          <h3 className="text-xl font-semibold mb-3">How to make a request</h3>
          <p className="mb-4">
            To request to exercise these rights described above, please submit a{' '}
            <a href="https://app.termly.io/dsar/28c10cd6-940d-46f4-8145-df2ea69ce8ae" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              data subject access request
            </a>.
          </p>

          <p className="mb-4">
            Once we receive and confirm your request, we will delete (and direct our service providers to delete) your personal information from our records, unless an exception applies.
          </p>

          <p className="mb-4">
            We will not discriminate against you for exercising any of your CCPA or CPRA rights. Unless permitted by the CCPA or CPRA, we also will not:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>Deny you goods or services.</li>
            <li>Charge you different prices or rates for goods or services, including through granting discounts or other benefits, or imposing penalties.</li>
            <li>Provide you a different level or quality of goods or services.</li>
            <li>Suggest that you may receive a different price or rate for goods or services or a different level or quality of goods or services.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="policyupdates" className="text-2xl font-semibold mb-4">13. DO WE MAKE UPDATES TO THIS NOTICE?</h2>

          <p className="mb-4">
            <strong><em>In Short:</em></strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.
          </p>

          <p className="mb-4">
            We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date and the updated version will be effective as soon as it is accessible. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="contact" className="text-2xl font-semibold mb-4">14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>

          <p className="mb-4">
            If you have questions or comments about this notice, you may email us at{' '}
            <a href="mailto:kiwi092020@gmail.com" className="text-primary hover:underline">
              kiwi092020@gmail.com
            </a> or by post to:
          </p>

          <address className="mb-4 not-italic">
            WatchLLM<br />
            __________
          </address>
        </section>

        <section className="mb-8">
          <h2 id="request" className="text-2xl font-semibold mb-4">15. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>

          <p className="mb-4">
            Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, change that information, or delete it. To request to review, update, or delete your personal information, please submit a request form by clicking{' '}
            <a href="https://app.termly.io/dsar/28c10cd6-940d-46f4-8145-df2ea69ce8ae" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              here
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
