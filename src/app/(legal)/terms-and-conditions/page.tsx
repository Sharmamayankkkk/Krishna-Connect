import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | Krishna Connect",
  description: "Terms and usage guidelines for Krishna Connect.",
};

const TermsAndConditionsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-foreground">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Terms and Conditions</h1>
        <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-8 text-lg leading-relaxed text-muted-foreground/90">

        {/* Introduction */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <p>
            By downloading, installing, or using <strong>Krishna Connect</strong> ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the App.
          </p>
        </section>

        {/* Section 1 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. User Eligibility</h2>
          <p>
            You must be at least 13 years old (or the minimum legal age in your country) to use this App. By using the App, you represent and warrant that you meet this age requirement.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Acceptable Use & Conduct</h2>
          <p className="mb-3">You agree not to use the App to:</p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>Harass, threaten, or intimidate other users.</li>
            <li>Send spam, unsolicited advertisements, or malware.</li>
            <li>Share illegal content or content that promotes violence and hate speech.</li>
            <li>Impersonate others or provide false information.</li>
          </ul>
          <p className="mt-3 text-base italic text-muted-foreground">
            We reserve the right to ban users who violate these guidelines immediately.
          </p>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User-Generated Content</h2>
          <p>
            You retain ownership of the messages and media you send ("User Content"). However, by sending content, you grant us a non-exclusive license to transmit and store that content as necessary to provide the messaging service. We do not claim ownership of your data.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Privacy</h2>
          <p>
            Your privacy is important to us. Please refer to our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> to understand how we collect, use, and store your data.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Disclaimers & Limitation of Liability</h2>
          <p>
            The App is provided on an "AS IS" and "AS AVAILABLE" basis. We do not guarantee that the service will be uninterrupted or error-free. To the fullest extent permitted by law, Krishna Connect shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.
          </p>
        </section>

        {/* Section 7 */}
        <section className="bg-muted/30 p-6 rounded-xl border border-border">
          <h2 className="text-xl font-semibold mb-3 text-foreground">7. Contact Us</h2>
          <p className="mb-2">If you have any questions about these Terms, please contact us at:</p>
          <a href="mailto:226mayankkle@gmail.com" className="text-primary hover:underline font-medium">226mayankkle@gmail.com</a>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;