import React from 'react';
import Link from 'next/link';

export interface LegalPolicy {
    title: string;
    effectiveDate: string;
    content: React.ReactNode;
}

export const legalPolicies: Record<string, LegalPolicy> = {
    'community-guidelines': {
        title: 'Community Guidelines',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>
                        Welcome to the <strong>Krishna Connect</strong> community! Our mission is to foster a safe, respectful, and spiritually enriching environment for all users. These guidelines outline what is expected of you and what you can expect from others. Violations of these guidelines may result in content removal, account suspension, or permanent ban.
                    </p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Respect and Kindness</h2>
                    <p className="mb-3">
                        Treat everyone with respect. Do not engage in harassment, bullying, or hate speech. We celebrate diversity and encourage constructive dialogue. Personal attacks, name-calling, and derogatory remarks are not tolerated on Krishna Connect.
                    </p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Child Safety and Protection Against CSAE</h2>
                    <p className="mb-3">
                        <strong>Krishna Connect</strong> maintains a strict zero-tolerance policy regarding child sexual abuse and exploitation (CSAE). The following are absolutely prohibited on our platform:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li>Child sexual abuse material (CSAM) of any kind, including AI-generated or illustrated material depicting minors in sexual situations.</li>
                        <li>Grooming behavior — building relationships with minors for the purpose of sexual exploitation.</li>
                        <li>Sextortion — threatening to share intimate images of minors to coerce them.</li>
                        <li>Soliciting sexual content from or involving minors.</li>
                        <li>Any content that sexualizes, objectifies, or endangers children in any way.</li>
                        <li>Sharing or requesting personally identifiable information of minors for exploitative purposes.</li>
                    </ul>
                    <p className="mt-3">
                        Any content or account found to be involved in CSAE will be immediately removed and permanently banned. Krishna Connect reports all instances of CSAM to the National Center for Missing &amp; Exploited Children (NCMEC) and cooperates with law enforcement worldwide.
                    </p>
                    <p className="mt-3">
                        If you encounter any child safety concerns, please report them immediately using the in-app reporting tools or by contacting our dedicated child safety team at{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.
                    </p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Content Standards</h2>
                    <p className="mb-3">
                        Inappropriate content is strictly prohibited on Krishna Connect. This includes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li>Nudity, pornography, or sexually explicit material.</li>
                        <li>Graphic violence, gore, or content glorifying harm.</li>
                        <li>Hate speech or content that incites hatred based on race, religion, gender, sexual orientation, disability, or national origin.</li>
                        <li>Spam, scams, phishing, or misleading content.</li>
                        <li>Content that promotes illegal activities including drug use, weapons sales, or fraud.</li>
                        <li>Misinformation that could cause real-world harm.</li>
                    </ul>
                    <p className="mt-3">Violations may result in content removal, account suspension, or permanent ban.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Authenticity and Integrity</h2>
                    <p className="mb-3">
                        Be genuine on Krishna Connect. Do not impersonate other people, organizations, or entities. Do not create fake accounts or use bots to artificially inflate engagement. Misleading profiles or content will be removed.
                    </p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Reporting Violations</h2>
                    <p className="mb-3">
                        If you see content or behavior that violates these guidelines, please report it immediately using the in-app reporting feature available on every post, comment, and profile. You can also contact us directly at{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.
                        All reports are reviewed confidentially and we do not retaliate against good-faith reporters.
                    </p>
                </section>
            </>
        ),
    },
    'cookie-policy': {
        title: 'Cookie Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>This Cookie Policy explains how <strong>Krishna Connect</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) uses cookies and similar technologies to recognize you when you visit our platform. It explains what these technologies are and why we use them, as well as your rights to control our use of them.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">What Are Cookies?</h2>
                    <p className="mb-3">Cookies are small data files placed on your computer or mobile device when you visit a website. They are widely used by website owners to make their websites work, or work more efficiently, and to provide reporting information. Cookies set by the website owner (in this case, Krishna Connect) are called &quot;first-party cookies.&quot; Cookies set by parties other than the website owner are called &quot;third-party cookies.&quot;</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">How We Use Cookies</h2>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Essential Cookies:</strong> Strictly necessary to provide you with services available through our platform and to use some of its features, such as secure login and session management.</li>
                        <li><strong>Performance and Functionality Cookies:</strong> Used to enhance the performance and functionality of our platform, such as remembering your preferences and settings.</li>
                        <li><strong>Analytics and Customization Cookies:</strong> Collect information that is used either in aggregate form to help us understand how our platform is being used, which pages are most popular, and how effective our features are.</li>
                    </ul>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Managing Cookies</h2>
                    <p className="mb-3">You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of Krishna Connect may become inaccessible or not function properly. For more information about how to manage cookies, visit your browser&apos;s help pages.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact Us</h2>
                    <p className="mb-3">If you have questions about our use of cookies, please contact us at{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.
                    </p>
                </section>
            </>
        ),
    },
    'copyright-policy': {
        title: 'Copyright Policy (DMCA)',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> respects the intellectual property rights of others and expects users to do the same. We will respond to notices of alleged copyright infringement that comply with applicable law and are properly provided to us.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Filing a DMCA Notice</h2>
                    <p className="mb-3">If you believe your copyrighted work has been infringed, please submit a written notification to our Copyright Agent. Your notice must include:</p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.</li>
                        <li>Identification of the copyrighted work claimed to have been infringed.</li>
                        <li>Identification of the material that is claimed to be infringing and its location on the platform.</li>
                        <li>Your contact information, including address, telephone number, and email address.</li>
                        <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner.</li>
                        <li>A statement, made under penalty of perjury, that the information in the notice is accurate.</li>
                    </ul>
                    <p className="mt-3">Send your DMCA notices to:{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>
                    </p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Counter-Notification</h2>
                    <p className="mb-3">If you believe your content was wrongly removed due to a DMCA notice, you may submit a counter-notification. The counter-notification must include your signature, identification of the removed material, a statement under penalty of perjury that the material was removed by mistake, and your consent to jurisdiction. We will forward counter-notifications to the original complainant.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Repeat Infringers</h2>
                    <p className="mb-3">Krishna Connect will terminate the accounts of users who are repeat infringers of copyright in appropriate circumstances.</p>
                </section>
            </>
        ),
    },
    'content-moderation': {
        title: 'Content Moderation Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>To ensure <strong>Krishna Connect</strong> remains a safe and respectful community, we employ both automated tools and human reviewers to moderate content. This policy outlines how we detect, review, and take action on content that violates our policies.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Our Approach</h2>
                    <p className="mb-3">We use a combination of automated detection systems, machine learning models, and trained human moderators to review content on Krishna Connect. Content violating our Community Guidelines, Acceptable Use Policy, or any other Krishna Connect policy will be restricted, hidden, or deleted. Repeat offenders may face account suspension or a permanent ban.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Child Sexual Abuse and Exploitation (CSAE)</h2>
                    <p className="mb-3">Krishna Connect employs dedicated measures to detect, remove, and report child sexual abuse and exploitation (CSAE) content:</p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Detection:</strong> We use hash-matching technology and automated scanning to proactively detect known CSAM (child sexual abuse material) before it can be distributed on our platform.</li>
                        <li><strong>Immediate Removal:</strong> Any content identified as CSAM or CSAE is immediately removed from the platform without notice to the uploader.</li>
                        <li><strong>Account Action:</strong> Accounts found to be involved in CSAE are permanently banned with no option for appeal.</li>
                        <li><strong>NCMEC Reporting:</strong> All confirmed instances of CSAM are reported to the National Center for Missing &amp; Exploited Children (NCMEC) in compliance with U.S. federal law (18 U.S.C. &sect; 2258A).</li>
                        <li><strong>Law Enforcement Cooperation:</strong> We cooperate fully with law enforcement agencies worldwide investigating CSAE cases, including providing relevant user data pursuant to valid legal process.</li>
                        <li><strong>Grooming Prevention:</strong> We monitor for patterns of grooming behavior and take proactive action to protect minors on our platform.</li>
                    </ul>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Enforcement Actions</h2>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Warning:</strong> Content removal with a notice for minor or first-time violations.</li>
                        <li><strong>Temporary Suspension:</strong> Account access suspended for a defined period for repeated or moderate violations.</li>
                        <li><strong>Permanent Ban:</strong> Permanent removal from the platform for severe violations, especially CSAE, credible threats, or repeated offenses.</li>
                        <li><strong>Law Enforcement Reporting:</strong> Reporting to appropriate authorities for criminal content including CSAE, credible threats of violence, terrorism, or other illegal activity.</li>
                    </ul>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Appeals</h2>
                    <p className="mb-3">Users may appeal content moderation decisions by contacting us at{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.
                        Appeals are reviewed by a different moderator than the one who made the original decision. Note: Appeals are not available for CSAE-related enforcement actions.
                    </p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">User Reporting</h2>
                    <p className="mb-3">Krishna Connect provides in-app reporting mechanisms on every post, comment, message, and user profile. Users can report content that violates our policies, and all reports are reviewed by our moderation team. We also accept reports via email at{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.
                    </p>
                </section>
            </>
        ),
    },
    'user-generated-content': {
        title: 'User Generated Content (UGC) Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Ownership and License</h2>
                    <p className="mb-3">You retain all rights and ownership to the content you create and share on <strong>Krishna Connect</strong>. However, by posting user-generated content (UGC), you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display the content in connection with providing our services. This license ends when you delete your content or account, except where your content has been shared by others or retention is required by law.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Responsibilities</h2>
                    <p className="mb-3">You are solely responsible for your UGC. You represent and warrant that you own or have the necessary rights to the content you post and that it does not infringe the rights of any third party. You agree that your UGC will comply with our Community Guidelines, Terms and Conditions, and all applicable laws.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Prohibited UGC</h2>
                    <p className="mb-3">Content that violates our Community Guidelines or any applicable law is strictly prohibited on Krishna Connect. This includes but is not limited to content involving child sexual abuse and exploitation (CSAE), hate speech, harassment, violence, nudity, spam, and copyright infringement. Such content will be removed and may result in account suspension or termination.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Content Removal</h2>
                    <p className="mb-3">Krishna Connect reserves the right to remove any UGC that violates our policies, at our sole discretion, with or without notice. We may also be required to remove content in response to valid legal requests or DMCA takedown notices.</p>
                </section>
            </>
        ),
    },
    'acceptable-use-policy': {
        title: 'Acceptable Use Policy (AUP)',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>This Acceptable Use Policy outlines the acceptable use of the <strong>Krishna Connect</strong> platform. All users must comply with this policy at all times. Failure to comply may result in content removal, account suspension, or permanent ban, and may be reported to law enforcement where applicable.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Prohibited Activities</h2>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Child Sexual Abuse and Exploitation (CSAE):</strong> Any content, conduct, or activity that sexually exploits or endangers children, including sharing CSAM, grooming, sextortion, or soliciting minors for sexual purposes. This is reported to NCMEC and law enforcement.</li>
                        <li><strong>Illegal Activities:</strong> Engaging in or promoting illegal activities including drug trafficking, weapons sales, fraud, or money laundering.</li>
                        <li><strong>Harassment and Threats:</strong> Harassing, threatening, bullying, stalking, or intimidating others.</li>
                        <li><strong>Hate Speech:</strong> Content that attacks individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin.</li>
                        <li><strong>Sexually Explicit Content:</strong> Posting nudity, pornography, or sexually explicit material.</li>
                        <li><strong>Violence:</strong> Content that promotes or glorifies violence, self-harm, or terrorism.</li>
                        <li><strong>Impersonation:</strong> Pretending to be another person, organization, or entity.</li>
                        <li><strong>Malware and Hacking:</strong> Distributing malware, viruses, or attempting to gain unauthorized access to accounts or systems.</li>
                        <li><strong>Spam and Manipulation:</strong> Unsolicited advertisements, chain messages, phishing attempts, or platform manipulation.</li>
                        <li><strong>Copyright Infringement:</strong> Sharing content that infringes on the intellectual property rights of others.</li>
                    </ul>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Reporting Violations</h2>
                    <p className="mb-3">If you witness a violation of this policy, please report it using the in-app reporting tools or by contacting us at{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.
                        All reports are treated confidentially.
                    </p>
                </section>
            </>
        ),
    },
    'data-retention': {
        title: 'Data Retention & Deletion Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> retains your personal data only as long as necessary to provide our services and fulfill the purposes outlined in our Privacy Policy, or as required by applicable law.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Retention Periods</h2>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Account Data:</strong> Retained for the duration of your active account.</li>
                        <li><strong>Content Backups:</strong> Content you post may be retained in backups for up to 90 days after deletion.</li>
                        <li><strong>Usage and Analytics Data:</strong> Aggregated and anonymized usage data may be retained indefinitely for analytics purposes.</li>
                        <li><strong>Policy Violation Records:</strong> Data related to policy violations may be retained as required for legal proceedings or to prevent repeat abuse.</li>
                        <li><strong>CSAE-Related Data:</strong> Data related to child sexual abuse and exploitation reports is retained as required by law and for cooperation with law enforcement investigations.</li>
                    </ul>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Deletion</h2>
                    <p className="mb-3">You may request the deletion of your account at any time via your account settings. Upon request, we will delete or anonymize your personal data within 30 days, unless retention is required by law or for legitimate safety purposes (such as preventing re-registration by banned users).</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact Us</h2>
                    <p className="mb-3">For data deletion requests or questions about data retention, contact us at{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.
                    </p>
                </section>
            </>
        ),
    },
    'child-safety': {
        title: 'Child Safety Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>
                        <strong>Krishna Connect</strong> (the &quot;App&quot;), developed and published on Google Play, is deeply committed to the safety and protection of children. This Child Safety Policy sets out our standards for preventing, detecting, and responding to child sexual abuse and exploitation (CSAE) on our platform. Krishna Connect complies with all applicable child safety laws and regulations worldwide, including but not limited to U.S. federal law (18 U.S.C. &sect; 2258A), the EU Child Sexual Abuse Regulation, and India&apos;s Protection of Children from Sexual Offences (POCSO) Act.
                    </p>
                </section>

                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Zero-Tolerance Policy on CSAE</h2>
                    <p className="mb-3">
                        Krishna Connect maintains an absolute zero-tolerance policy against child sexual abuse and exploitation (CSAE). We explicitly prohibit any and all forms of CSAE on our platform, including but not limited to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Child Sexual Abuse Material (CSAM):</strong> Any visual, audio, or written content that depicts, describes, or represents child sexual abuse, including AI-generated, digitally manipulated, or illustrated material.</li>
                        <li><strong>Grooming:</strong> Any attempt to build a relationship, trust, or emotional connection with a minor for the purpose of sexual exploitation, abuse, or manipulation.</li>
                        <li><strong>Sextortion:</strong> Threatening, coercing, or blackmailing a minor using intimate images or information to obtain sexual content, favors, or compliance.</li>
                        <li><strong>Child Sex Trafficking:</strong> Any activity that recruits, harbors, transports, or solicits a minor for commercial sexual exploitation.</li>
                        <li><strong>Sexual Solicitation of Minors:</strong> Requesting, offering, or exchanging sexual content with or about minors, or attempting to arrange sexual encounters with minors.</li>
                        <li><strong>Sexualization of Minors:</strong> Any content that sexualizes, objectifies, or depicts minors in a sexual context, including inappropriate comments, emojis, or imagery directed at minors.</li>
                        <li><strong>Sharing Personally Identifiable Information (PII) of Minors:</strong> Sharing a minor&apos;s personal information (name, address, school, photos) for the purpose of exploitation, harassment, or endangerment.</li>
                    </ul>
                </section>

                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Age Requirements</h2>
                    <p className="mb-3">
                        Krishna Connect requires all users to be at least 13 years of age (or the minimum age required by the laws of their jurisdiction, whichever is higher). Users between the ages of 13 and 18 must have the consent of a parent or legal guardian. We reserve the right to terminate accounts that we reasonably believe belong to users under the minimum required age.
                    </p>
                </section>

                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Detection and Prevention</h2>
                    <p className="mb-3">Krishna Connect employs multiple layers of detection and prevention to combat CSAE:</p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Hash-Matching Technology:</strong> We use PhotoDNA and similar hash-matching technologies to detect known CSAM before it can be distributed on our platform.</li>
                        <li><strong>Automated Content Scanning:</strong> Machine learning models scan uploaded images, videos, and text for potential CSAE indicators.</li>
                        <li><strong>Behavioral Analysis:</strong> Our systems monitor for grooming patterns, suspicious messaging behavior, and other indicators of exploitation attempts.</li>
                        <li><strong>Human Review:</strong> Trained moderators review flagged content and user reports to ensure accurate assessment and appropriate action.</li>
                        <li><strong>Age Verification:</strong> We implement age-gating mechanisms during registration and may request additional verification when suspicious activity is detected.</li>
                    </ul>
                </section>

                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Addressing CSAM</h2>
                    <p className="mb-3">When CSAM or any CSAE content is identified on Krishna Connect, we take the following immediate actions:</p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Immediate Removal:</strong> The content is removed from the platform immediately upon detection, without notice to the uploader.</li>
                        <li><strong>Permanent Account Ban:</strong> The user account associated with the content is permanently banned with no option for appeal.</li>
                        <li><strong>Evidence Preservation:</strong> Relevant data and content are preserved as required by law for law enforcement investigations.</li>
                        <li><strong>NCMEC Report:</strong> A CyberTipline report is filed with the National Center for Missing &amp; Exploited Children (NCMEC) in compliance with 18 U.S.C. &sect; 2258A.</li>
                        <li><strong>Law Enforcement Notification:</strong> We cooperate with and report to relevant local, national, and international law enforcement agencies as required by applicable law.</li>
                    </ul>
                </section>

                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">In-App User Feedback and Reporting</h2>
                    <p className="mb-3">Krishna Connect provides multiple in-app mechanisms for users to report child safety concerns:</p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Report Button:</strong> Every post, comment, message, and user profile includes a report option that allows users to flag content for child safety concerns.</li>
                        <li><strong>Dedicated Reporting Categories:</strong> Our reporting system includes specific categories for CSAE, grooming, and child endangerment to ensure accurate triage and rapid response.</li>
                        <li><strong>Anonymous Reporting:</strong> Users can report child safety concerns without revealing their identity to the reported user.</li>
                        <li><strong>Priority Review:</strong> All reports categorized as child safety concerns are reviewed with the highest priority by our moderation team.</li>
                    </ul>
                </section>

                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Child Safety Point of Contact</h2>
                    <p className="mb-3">
                        Krishna Connect has designated a child safety-specific point of contact for all child safety concerns, inquiries, and reports. You can reach our child safety team at:
                    </p>
                    <p className="mb-3">
                        <strong>Email:</strong>{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>
                    </p>
                    <p className="mb-3">
                        <strong>Subject Line:</strong> &quot;Child Safety Report&quot; for fastest response.
                    </p>
                    <p className="mb-3">
                        We aim to acknowledge all child safety reports within 24 hours and take action within 48 hours. Reports involving imminent danger to a child are treated as emergencies and escalated immediately.
                    </p>
                </section>

                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Legal Compliance</h2>
                    <p className="mb-3">Krishna Connect complies with all applicable child safety laws and regulations, including:</p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li>United States: 18 U.S.C. &sect; 2258A (mandatory reporting to NCMEC), COPPA (Children&apos;s Online Privacy Protection Act).</li>
                        <li>European Union: EU Child Sexual Abuse Regulation, General Data Protection Regulation (GDPR) provisions for minors.</li>
                        <li>India: Protection of Children from Sexual Offences (POCSO) Act 2012, Information Technology Act 2000 (Section 67B).</li>
                        <li>International: UN Convention on the Rights of the Child, and applicable child protection laws in all jurisdictions where Krishna Connect operates.</li>
                    </ul>
                </section>

                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Employee and Moderator Training</h2>
                    <p className="mb-3">All Krishna Connect employees and moderators with access to user content receive mandatory training on:</p>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li>Identifying CSAM and CSAE indicators.</li>
                        <li>Recognizing grooming patterns and predatory behavior.</li>
                        <li>Proper handling and reporting procedures for child safety incidents.</li>
                        <li>Applicable child safety laws and mandatory reporting obligations.</li>
                        <li>Trauma-informed approaches to content review.</li>
                    </ul>
                </section>

                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Updates to This Policy</h2>
                    <p className="mb-3">
                        Krishna Connect regularly reviews and updates this Child Safety Policy to reflect changes in laws, technology, and best practices. We are committed to continuous improvement in our child safety measures. Material changes to this policy will be communicated through the app and on our website.
                    </p>
                    <p className="mt-3">
                        For questions or concerns about this policy, contact us at{' '}
                        <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.
                    </p>
                </section>
            </>
        ),
    },
    'grievance-redressal': {
        title: 'Grievance Redressal Policy (India – DPDP)',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>In compliance with the Digital Personal Data Protection (DPDP) Act, India, <strong>Krishna Connect</strong> has established a grievance redressal mechanism.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Grievance Officer</h2>
                    <p className="mb-3">Contact our Grievance Officer at:</p>
                    <a href="mailto:grievance@krishnaconnect.in" className="text-primary hover:underline font-medium">grievance@krishnaconnect.in</a>
                    <p className="mt-2">We aim to acknowledge complaints within 24 hours and resolve them within 15 days.</p>
                </section>
            </>
        ),
    },
    'gdpr-compliance': {
        title: 'GDPR Compliance Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>For users in the EEA and UK, this policy outlines your rights under the GDPR as they apply to <strong>Krishna Connect</strong>.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Rights</h2>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li>Right of access, rectification, erasure, restriction, data portability, and objection.</li>
                    </ul>
                    <p className="mt-3">Contact <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a> to exercise your rights.</p>
                </section>
            </>
        ),
    },
    'advertising': {
        title: 'Advertising Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> strives to provide relevant, high-quality, non-intrusive ads. Ads must not be misleading or promote illegal products. We reserve the right to reject ads not aligned with our values.</p>
                </section>
            </>
        ),
    },
    'sponsored-content': {
        title: 'Sponsored Content Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Creators on <strong>Krishna Connect</strong> must disclose sponsored content using "#Sponsored" or "#Ad" visible immediately. Failure to disclose may result in content removal.</p>
                </section>
            </>
        ),
    },
    'payments-refund': {
        title: 'Payments & Refund Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Purchases on <strong>Krishna Connect</strong> are processed securely. In-app purchases are generally non-refundable. Exceptions may be made for technical errors at our discretion. Contact <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.</p>
                </section>
            </>
        ),
    },
    'subscription-terms': {
        title: 'Subscription Terms',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Recurring subscriptions on <strong>Krishna Connect</strong> auto-renew unless cancelled. Cancel anytime via account settings. Verification badges expire when the subscription ends and are automatically removed.</p>
                </section>
            </>
        ),
    },
    'security-policy': {
        title: 'Security Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Protecting user data is a top priority for <strong>Krishna Connect</strong>. We employ encryption in transit (TLS/SSL) and at rest, regular vulnerability scanning, secure development practices, and access controls. Report security issues to <a href="mailto:security@krishnaconnect.in" className="text-primary hover:underline font-medium">security@krishnaconnect.in</a>.</p>
                </section>
            </>
        ),
    },
    'vulnerability-disclosure': {
        title: 'Vulnerability Disclosure Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> welcomes security reports. Submit findings to <a href="mailto:security@krishnaconnect.in" className="text-primary hover:underline font-medium">security@krishnaconnect.in</a>. We will acknowledge within 48 hours and will not pursue legal action against responsible disclosers.</p>
                </section>
            </>
        ),
    },
    'transparency-report': {
        title: 'Transparency Report Page',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> publishes annual transparency reports covering government data requests, content moderation stats, CSAE/CSAM reports filed with NCMEC, and IP takedown requests.</p>
                </section>
            </>
        ),
    },
    'law-enforcement': {
        title: 'Law Enforcement Request Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> releases non-public user data to law enforcement only under valid legal process. Emergency exceptions apply for imminent danger to children or risk of serious harm. Contact <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.</p>
                </section>
            </>
        ),
    },
    'anonymity-disclaimer': {
        title: 'Anonymity Disclaimer',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> supports pseudonymous use but cannot guarantee absolute anonymity. IP addresses, device info, and connectivity data may link to your identity and can be disclosed under valid legal process.</p>
                </section>
            </>
        ),
    },
    'emergency-use': {
        title: 'Emergency Use Disclaimer',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> is not an emergency services provider. In an emergency, contact local authorities directly (112 in India, 911 in the US). For child safety emergencies, contact local law enforcement or India Child Helpline 1098.</p>
                </section>
            </>
        ),
    },
    'accessibility': {
        title: 'Accessibility Statement',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> is committed to accessibility for all users, including those with disabilities. We strive to conform to WCAG 2.1 Level AA. Contact <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a> for accessibility feedback.</p>
                </section>
            </>
        ),
    },
    'code-of-conduct': {
        title: 'Code of Conduct',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect&apos;s</strong> Code of Conduct represents our commitment to a healthy, safe, inclusive community. Be kind, considerate, and help maintain an inclusive spiritual environment.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Child Safety Commitment</h2>
                    <p className="mb-3">Krishna Connect maintains a zero-tolerance policy against child sexual abuse and exploitation (CSAE). All users must commit to never posting content that exploits minors, reporting any CSAE content immediately, and not engaging in grooming or predatory behavior. Violations result in permanent ban and law enforcement reporting.</p>
                </section>
            </>
        ),
    },
    'press-media': {
        title: 'Press / Media Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Press inquiries about <strong>Krishna Connect</strong> should be directed to <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>. Using the platform to source unverified user data without consent is prohibited.</p>
                </section>
            </>
        ),
    },
    'intellectual-property': {
        title: 'Intellectual Property Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p><strong>Krishna Connect</strong> protects its intellectual property including design, logos, trademarks, and code. Users may not scrape visual assets or proprietary code without written consent. Report IP violations to <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.</p>
                </section>
            </>
        ),
    },
    'trademark-usage': {
        title: 'Trademark Usage Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>The <strong>Krishna Connect</strong> logo, name, and brand assets are protected trademarks. Use only with permission or as permitted by fair use. Do not use our branding to imply endorsement where none exists.</p>
                </section>
            </>
        ),
    },
    'api-terms': {
        title: 'API Terms of Use',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Use of the <strong>Krishna Connect</strong> API is subject to rate limiting and compliance with our Developer Policy. We reserve the right to revoke access for harmful integrations or Terms violations.</p>
                </section>
            </>
        ),
    },
    'dpa': {
        title: 'Data Processing Agreement (DPA)',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>This DPA governs personal data processing for <strong>Krishna Connect</strong> enterprise customers and partners, in compliance with GDPR and Indian DPDP Act. Contact <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>.</p>
                </section>
            </>
        ),
    },
    'e-sign': {
        title: 'E-Sign Consent Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>By using <strong>Krishna Connect</strong>, you consent to electronic communications and agree that electronic signatures and contracts have the same legal effect as written ones.</p>
                </section>
            </>
        ),
    },
    'eula': {
        title: 'End User License Agreement (EULA)',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>This EULA governs your use of the <strong>Krishna Connect</strong> mobile application available on Google Play Store. We grant you a limited, non-exclusive, non-transferable license to use our app. You may not reverse engineer, copy, or use the app for illegal purposes including CSAE.</p>
                </section>
            </>
        ),
    },
    'arbitration-dispute': {
        title: 'Arbitration & Dispute Resolution Policy',
        effectiveDate: 'March 10, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Disputes arising from use of <strong>Krishna Connect</strong> shall be settled by binding arbitration except for small claims. Contact <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a> to attempt informal resolution first. Governed by laws of India.</p>
                </section>
            </>
        ),
    },
};
