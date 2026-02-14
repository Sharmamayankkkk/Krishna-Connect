import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Krishna Connect",
  description:
    "How we collect, use, and protect your data at Krishna Connect.",
};

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-foreground">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground">Effective: January 1, 2026</p>
      </div>

      <div className="space-y-8 text-lg leading-relaxed text-muted-foreground/90">
        {/* Introduction */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <p>
            Welcome to <strong>Krishna Connect</strong> (&quot;we,&quot;
            &quot;our,&quot; or &quot;us&quot;). We are committed to protecting
            your personal information and your right to privacy. This Privacy
            Policy explains what information we collect, how we use it, how we
            share it, and your rights regarding that data. By using Krishna
            Connect, you consent to the practices described in this policy.
          </p>
        </section>

        {/* Section 1 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            1. Information We Collect
          </h2>
          <p className="mb-3">
            We collect information to provide and improve our services:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>
              <strong>Account Information:</strong> When you sign up, we collect
              your email address, username, display name, profile picture, and
              any biographical information you choose to provide.
            </li>
            <li>
              <strong>Content You Create:</strong> Posts, comments, messages,
              images, videos, audio recordings, and any other content you upload
              or share on the platform.
            </li>
            <li>
              <strong>Device Information:</strong> We collect data about your
              device type, operating system, browser type, unique device
              identifiers, and IP address for security and diagnostic purposes.
            </li>
            <li>
              <strong>Usage Data:</strong> We track interactions within the
              platform (e.g., pages visited, features used, time spent, search
              queries) to improve performance and user experience.
            </li>
            <li>
              <strong>Cookies and Similar Technologies:</strong> We use cookies,
              local storage, and similar technologies to maintain your session,
              remember your preferences, and analyze usage patterns.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            2. How We Use Your Information
          </h2>
          <p className="mb-3">
            We use the collected data for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>To create, manage, and authenticate your account.</li>
            <li>
              To deliver messages and facilitate real-time communication
              including calls.
            </li>
            <li>
              To personalize your experience, including content
              recommendations and feed curation.
            </li>
            <li>
              To send important notifications such as security alerts, account
              updates, and community announcements.
            </li>
            <li>
              To detect, investigate, and prevent fraud, spam, abuse, and
              violations of our Terms and Conditions.
            </li>
            <li>
              To enforce our community guidelines and content moderation
              policies.
            </li>
            <li>
              To analyze usage trends and improve platform features and
              performance.
            </li>
            <li>To comply with legal obligations and respond to lawful requests.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            3. Data Sharing and Third Parties
          </h2>
          <p className="mb-3">
            We do not sell your personal data. However, we may share data with:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>
              <strong>Service Providers:</strong> Trusted third-party services
              that help us operate the platform, including cloud hosting
              (Supabase, Vercel), analytics, and content delivery networks.
              These providers are contractually obligated to protect your data.
            </li>
            <li>
              <strong>Legal Obligations:</strong> If required by law, court
              order, subpoena, or government authority, we may disclose your
              information to comply with legal processes.
            </li>
            <li>
              <strong>Safety and Enforcement:</strong> We may share information
              with law enforcement agencies when we believe in good faith that
              disclosure is necessary to protect the safety of any person,
              prevent illegal activity, or enforce our policies.
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger,
              acquisition, or sale of assets, your data may be transferred as
              part of that transaction.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            4. Content Moderation
          </h2>
          <p className="mb-3">
            To maintain a safe and respectful community, we actively moderate
            content on the platform. The following types of content are
            strictly prohibited and will be removed immediately:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>
              <strong>Nudity and Sexual Content:</strong> Any form of nudity,
              pornography, sexually explicit material, or sexual solicitation
              is strictly forbidden.
            </li>
            <li>
              <strong>Child Sexual Abuse Material (CSAM):</strong> Any content
              depicting or promoting the sexual exploitation of minors. We
              report all such content to the National Center for Missing &
              Exploited Children (NCMEC) and relevant law enforcement
              authorities.
            </li>
            <li>
              <strong>Non-Consensual Intimate Images:</strong> Sharing intimate
              images of any person without their explicit consent.
            </li>
          </ul>
          <p className="mt-3">
            We use a combination of automated systems and human review to
            detect and remove prohibited content.
          </p>
        </section>

        {/* Section 5 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            5. Harassment and Abuse
          </h2>
          <p className="mb-3">
            Krishna Connect maintains a zero-tolerance policy toward
            harassment and abuse. This includes but is not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>Bullying, intimidation, or targeted harassment of any user.</li>
            <li>Stalking or unwanted persistent contact.</li>
            <li>
              Threats of violence, doxxing, or sharing personal information
              without consent.
            </li>
            <li>Hate speech targeting race, religion, gender, sexuality, or disability.</li>
          </ul>
          <p className="mt-3">
            Users who engage in harassment may face immediate account
            suspension or permanent ban. Krishna Connect reserves the right to
            pursue legal action against individuals who engage in severe or
            repeated harassment, threats, or exploitation on the platform.
          </p>
        </section>

        {/* Section 6 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            6. DMCA and Intellectual Property
          </h2>
          <p>
            We respect the intellectual property rights of others. If you
            believe that your copyrighted work has been copied or used in a way
            that constitutes copyright infringement, please submit a DMCA
            takedown notice to{" "}
            <a
              href="mailto:madanmohandas@krishnaconnect.in"
              className="text-primary hover:underline font-medium"
            >
              madanmohandas@krishnaconnect.in
            </a>
            . Your notice must include: identification of the copyrighted work,
            the infringing material and its location, your contact information,
            a statement of good faith, and a statement under penalty of perjury
            that the information is accurate.
          </p>
        </section>

        {/* Section 7 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            7. Data Retention and Deletion
          </h2>
          <p className="mb-3">
            We retain your personal information only for as long as is
            necessary to fulfill the purposes described in this policy or as
            required by law. Specifically:
          </p>
          <ul className="list-disc pl-6 space-y-2 marker:text-primary">
            <li>
              Account data is retained for the duration of your active account.
            </li>
            <li>
              Content you post may be retained in backups for up to 90 days
              after deletion.
            </li>
            <li>
              Data related to policy violations may be retained as required for
              legal proceedings.
            </li>
          </ul>
          <p className="mt-3">
            You can request the deletion of your account and all associated
            data at any time through the app settings. Upon deletion, we will
            remove your personal data within 30 days, except where retention is
            required by law.
          </p>
        </section>

        {/* Section 8 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            8. Security Measures
          </h2>
          <p>
            We implement industry-standard security measures to protect your
            data, including encryption in transit (TLS/SSL), secure
            authentication mechanisms, regular security audits, and access
            controls. However, no method of transmission over the Internet or
            electronic storage is 100% secure, and we cannot guarantee absolute
            security. We encourage you to use strong, unique passwords and
            enable any available security features on your account.
          </p>
        </section>

        {/* Section 9 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            9. Children&apos;s Privacy
          </h2>
          <p>
            Our services are not directed to individuals under the age of 13.
            We do not knowingly collect personal information from children under
            13. If we become aware that a child under 13 has provided us with
            personal information, we will take immediate steps to delete such
            information and terminate the associated account. If you are a
            parent or guardian and believe your child has provided personal
            information to us, please contact us at{" "}
            <a
              href="mailto:madanmohandas@krishnaconnect.in"
              className="text-primary hover:underline font-medium"
            >
              madanmohandas@krishnaconnect.in
            </a>
            .
          </p>
        </section>

        {/* Section 10 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            10. International Data Transfers
          </h2>
          <p>
            Krishna Connect operates globally, and your data may be transferred
            to and processed in countries other than your country of residence.
            These countries may have data protection laws that are different from
            the laws of your country. By using our services, you consent to the
            transfer of your information to these countries. We take appropriate
            safeguards to ensure that your personal data remains protected in
            accordance with this Privacy Policy.
          </p>
        </section>

        {/* Section 11 */}
        <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            11. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices, technology, legal requirements, or other
            factors. We will notify you of any material changes by posting the
            updated policy on this page and updating the effective date. Your
            continued use of Krishna Connect after any changes constitutes your
            acceptance of the updated policy. We encourage you to review this
            page periodically.
          </p>
        </section>

        {/* Section 12 */}
        <section className="bg-muted/30 p-6 rounded-xl border border-border">
          <h2 className="text-xl font-semibold mb-3 text-foreground">
            12. Contact Us
          </h2>
          <p className="mb-2">
            If you have questions, concerns, or requests regarding this Privacy
            Policy or your personal data, please contact us at:
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

export default PrivacyPolicyPage;