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
        <h1 className="text-4xl font-bold mb-4 tracking-tight">
          Terms and Conditions
        </h1>
        <p className="text-muted-foreground">Effective: March 10, 2026</p>
      </div>

      <div className="space-y-8 text-lg leading-relaxed text-muted-foreground/90">
        {/* Introduction */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <p>
            By accessing or using <strong>Krishna Connect</strong> (&quot;the
            Platform&quot;), you agree to be bound by these Terms and
            Conditions. If you do not agree to these terms, you must not use the
            Platform. Krishna Connect reserves the right to update these terms
            at any time, and your continued use constitutes acceptance of any
            changes.
          </p>
        </section>

        {/* Section 1 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            1. User Eligibility
          </h2>
          <p>
            You must be at least 13 years old (or the minimum legal age in your
            country) to use this Platform. By using Krishna Connect, you
            represent and warrant that you meet this age requirement. Users
            between the ages of 13 and 18 must have the consent of a parent or
            legal guardian. We reserve the right to terminate accounts that we
            reasonably believe belong to underage users.
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            2. Account Responsibilities
          </h2>
          <p className="mb-3">
            You are responsible for maintaining the security of your account.
            This includes:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>
              Keeping your password confidential and not sharing it with others.
            </li>
            <li>
              Providing accurate and truthful information during registration.
            </li>
            <li>
              Notifying us immediately if you suspect unauthorized access to your
              account.
            </li>
            <li>
              Being solely responsible for all activity that occurs under your
              account.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            3. Acceptable Use and Prohibited Content
          </h2>
          <p className="mb-3">
            You agree not to use the Platform to create, upload, share,
            distribute, or promote any of the following:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>
              <strong>Nudity and Pornography:</strong> Any form of nudity,
              pornographic material, sexually explicit content, or sexual
              solicitation.
            </li>
            <li>
              <strong>Sexual Exploitation:</strong> Content that depicts,
              promotes, or facilitates sexual exploitation of any person,
              including minors. This includes child sexual abuse material (CSAM) and child sexual abuse and exploitation (CSAE),
              grooming, or any content sexualizing minors.
            </li>
            <li>
              <strong>Self-Harm and Suicide:</strong> Content that promotes,
              glorifies, or provides instructions for self-harm or suicide.
            </li>
            <li>
              <strong>Violence and Graphic Content:</strong> Content that
              depicts, promotes, or glorifies violence, gore, torture, or
              physical harm against people or animals.
            </li>
            <li>
              <strong>Hate Speech:</strong> Content that attacks, demeans, or
              incites hatred against individuals or groups based on race,
              ethnicity, religion, gender, sexual orientation, disability, or
              national origin.
            </li>
            <li>
              <strong>Harassment and Bullying:</strong> Targeted harassment,
              bullying, intimidation, or repeated unwanted contact directed at
              any user.
            </li>
            <li>
              <strong>Stalking:</strong> Monitoring, tracking, or surveilling
              another user without their consent, including repeated attempts to
              contact someone who has blocked you.
            </li>
            <li>
              <strong>Threats:</strong> Direct or indirect threats of violence,
              harm, or destruction against any person, group, or property.
            </li>
            <li>
              <strong>Illegal Activities:</strong> Content that promotes,
              facilitates, or depicts illegal activities including drug
              trafficking, weapons sales, fraud, or money laundering.
            </li>
            <li>
              <strong>Spam and Manipulation:</strong> Unsolicited advertisements,
              chain messages, phishing attempts, malware distribution, or
              platform manipulation.
            </li>
            <li>
              <strong>Impersonation:</strong> Pretending to be another person,
              organization, or entity, or misrepresenting your identity or
              affiliation.
            </li>
            <li>
              <strong>Copyright Infringement:</strong> Sharing content that
              infringes on the intellectual property rights of others without
              proper authorization.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            4. Content Moderation and Enforcement
          </h2>
          <p className="mb-3">
            Krishna Connect actively moderates content to maintain a safe
            community. Violations of our policies will result in enforcement
            actions proportional to the severity of the offense:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>
              <strong>Warning:</strong> A formal notice for minor or first-time
              violations, along with removal of the offending content.
            </li>
            <li>
              <strong>Temporary Suspension:</strong> Suspension of account access
              for a defined period for repeated or moderate violations.
            </li>
            <li>
              <strong>Permanent Ban:</strong> Permanent removal from the platform
              for severe violations or repeated offenses after prior warnings.
            </li>
            <li>
              <strong>Law Enforcement Reporting:</strong> For content involving
              child exploitation, credible threats of violence, or other criminal
              activity, we will report to the appropriate law enforcement
              agencies and cooperate fully with investigations.
            </li>
          </ul>
          <p className="mt-3 font-semibold text-foreground">
            Krishna Connect reserves the right to take legal action against users
            who violate these policies, particularly in cases involving
            harassment, exploitation, threats, stalking, or any criminal conduct
            facilitated through the Platform.
          </p>
        </section>

        {/* Section 5 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            5. User-Generated Content
          </h2>
          <p>
            You retain ownership of the content you create and share on Krishna
            Connect (&quot;User Content&quot;). By posting content, you grant
            Krishna Connect a non-exclusive, worldwide, royalty-free license to
            use, display, reproduce, distribute, and store that content as
            necessary to operate and provide the Platform. This license ends when
            you delete your content or your account, except where your content
            has been shared by others or is retained as required by law. We do
            not claim ownership of your User Content.
          </p>
        </section>

        {/* Section 6 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            6. Privacy
          </h2>
          <p>
            Your privacy is important to us. Please refer to our{" "}
            <Link
              href="/privacy-policy"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            to understand how we collect, use, store, and protect your data.
            By using the Platform, you consent to the data practices described
            in our Privacy Policy.
          </p>
        </section>

        {/* Section 7 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            7. Intellectual Property and DMCA
          </h2>
          <p className="mb-3">
            All intellectual property rights in the Platform, including its
            design, logos, trademarks, and software, belong to Krishna Connect
            or its licensors. You may not copy, modify, distribute, or create
            derivative works from any part of the Platform without prior written
            consent.
          </p>
          <p>
            If you believe your copyrighted work has been infringed upon, you
            may submit a DMCA takedown notice to{" "}
            <a
              href="mailto:madanmohandas@krishnaconnect.in"
              className="text-primary hover:underline font-medium"
            >
              madanmohandas@krishnaconnect.in
            </a>
            . Your notice must include identification of the copyrighted work,
            the infringing material and its location on the Platform, your
            contact information, a good faith statement, and a statement under
            penalty of perjury that the information provided is accurate.
          </p>
        </section>

        {/* Section 8 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            8. Reporting Violations
          </h2>
          <p>
            If you encounter content or behavior that violates these Terms, we
            encourage you to report it immediately using the in-app reporting
            tools or by contacting us at{" "}
            <a
              href="mailto:madanmohandas@krishnaconnect.in"
              className="text-primary hover:underline font-medium"
            >
              madanmohandas@krishnaconnect.in
            </a>
            . All reports are reviewed and handled confidentially. We will not
            retaliate against users who make good-faith reports of violations.
          </p>
        </section>

        {/* Section 9 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            9. Termination
          </h2>
          <p>
            We reserve the right to terminate or suspend your account at our
            sole discretion, with or without notice, for conduct that we believe
            violates these Terms, is harmful to other users, us, or third
            parties, or for any other reason. Upon termination, your right to
            use the Platform ceases immediately. Provisions of these Terms that
            by their nature should survive termination shall remain in effect,
            including ownership provisions, warranty disclaimers, and
            limitations of liability.
          </p>
        </section>

        {/* Section 10 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            10. Disclaimer and Limitation of Liability
          </h2>
          <p className="mb-3">
            The Platform is provided on an &quot;AS IS&quot; and &quot;AS
            AVAILABLE&quot; basis without warranties of any kind, either express
            or implied. We do not guarantee that the service will be
            uninterrupted, secure, or error-free.
          </p>
          <p>
            To the fullest extent permitted by applicable law, Krishna Connect,
            its officers, directors, employees, and agents shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages, including but not limited to loss of profits, data, or
            goodwill, arising from your use of or inability to use the Platform,
            any unauthorized access to your data, or any conduct or content of
            any third party on the Platform.
          </p>
        </section>

        {/* Section 11 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            11. Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of India, without regard to its conflict of law provisions.
            Any disputes arising under or in connection with these Terms shall be
            subject to the exclusive jurisdiction of the courts located in India.
            You agree to submit to the personal jurisdiction of such courts.
          </p>
        </section>

        {/* Section 12 */}
        <section className="bg-muted/30 p-6 rounded-xl border border-border">
          <h2 className="text-xl font-semibold mb-3 text-foreground">
            12. Contact Us
          </h2>
          <p className="mb-2">
            If you have any questions about these Terms, wish to report a
            violation, or need to reach our legal team, please contact us at:
          </p>
          <a
            href="mailto:madanmohandas@krishnaconnect.in"
            className="text-primary hover:underline font-medium"
          >
            madanmohandas@krishnaconnect.in
          </a>
        </section>

        <p className="text-center text-sm text-muted-foreground pt-4">
          Copyright 2026 Krishna Connect. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;