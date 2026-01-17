import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and usage guidelines for our chat application.",
};

const TermsAndConditionsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6">
        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By downloading, installing, or using <strong>[Your App Name]</strong> ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the App.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">2. User Eligibility</h2>
          <p className="leading-relaxed">
            You must be at least 13 years old (or the minimum legal age in your country) to use this App. By using the App, you represent and warrant that you meet this age requirement.
          </p>
        </section>

        {/* Section 3 - Critical for Chat Apps */}
        <section>
          <h2 className="text-xl font-semibold mb-3">3. Acceptable Use & Conduct</h2>
          <p className="mb-2">You agree not to use the App to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Harass, threaten, or intimidate other users.</li>
            <li>Send spam, unsolicited advertisements, or malware.</li>
            <li>Share illegal content or content that promotes violence and hate speech.</li>
            <li>Impersonate others or provide false information.</li>
          </ul>
          <p className="mt-2 text-sm italic">
            We reserve the right to ban users who violate these guidelines immediately.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">4. User-Generated Content</h2>
          <p className="leading-relaxed">
            You retain ownership of the messages and media you send ("User Content"). However, by sending content, you grant us a non-exclusive license to transmit and store that content as necessary to provide the messaging service. We do not claim ownership of your data.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">5. Privacy</h2>
          <p className="leading-relaxed">
            Your privacy is important to us. Please refer to our <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a> to understand how we collect, use, and store your data.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">6. Termination</h2>
          <p className="leading-relaxed">
            We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">7. Disclaimers & Limitation of Liability</h2>
          <p className="leading-relaxed">
            The App is provided on an "AS IS" and "AS AVAILABLE" basis. We do not guarantee that the service will be uninterrupted or error-free. To the fullest extent permitted by law, [Your Company/Name] shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.
          </p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
          <p className="leading-relaxed">
            If you have any questions about these Terms, please contact us at: <br />
            <strong>Email:</strong> 226mayankkle@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;