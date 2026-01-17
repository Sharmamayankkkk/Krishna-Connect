import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, use, and protect your data.",
};

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6">
        {/* Introduction */}
        <section>
          <p className="leading-relaxed">
            Welcome to <strong>[Your App Name]</strong> ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that data.
          </p>
        </section>

        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="mb-2">We collect information that helps us provide the best messaging experience:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Information:</strong> When you sign up, we collect your email address, username, and profile picture.</li>
            <li><strong>Messages & Content:</strong> We process the messages, images, and files you send to deliver them to the intended recipient. [Optional: Messages are end-to-end encrypted and we cannot read them.]</li>
            <li><strong>Device Information:</strong> We may collect data about your device type, operating system, and IP address for security and debugging purposes.</li>
            <li><strong>Usage Data:</strong> We track interactions within the app (e.g., time spent, features used) to improve app performance.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p className="leading-relaxed">
            We use the collected data for the following purposes:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>To create and manage your account.</li>
            <li>To deliver messages and facilitate real-time communication.</li>
            <li>To send important notifications (e.g., new message alerts, security updates).</li>
            <li>To detect and prevent fraud, spam, or abuse.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">3. Data Sharing & Third Parties</h2>
          <p className="leading-relaxed">
            We do not sell your personal data. However, we may share data with:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Service Providers:</strong> Cloud hosting services (e.g., AWS, Firebase, Supabase) that help us run the app infrastructure.</li>
            <li><strong>Legal Obligations:</strong> If required by law, court order, or government authority.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
          <p className="leading-relaxed">
            We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. You can request the deletion of your account and associated data at any time inside the app settings.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">5. Security</h2>
          <p className="leading-relaxed">
            We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">6. Children's Privacy</h2>
          <p className="leading-relaxed">
            Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child has provided us with personal information, we will take steps to delete such information.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
          <p className="leading-relaxed">
            If you have questions or concerns about this Privacy Policy, please contact us at: <br />
            <strong>Email:</strong> 226mayankkle@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;