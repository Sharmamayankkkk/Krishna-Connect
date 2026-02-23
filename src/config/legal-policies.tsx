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
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>
                        Welcome to the Krishna Connect community! Our mission is to foster a safe, respectful, and spiritually enriching environment for all users. These guidelines outline what is expected of you and what you can expect from others.
                    </p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Respect and Kindness</h2>
                    <p className="mb-3">
                        Treat everyone with respect. Do not engage in harassment, bullying, or hate speech. We celebrate diversity and encourage constructive dialogue.
                    </p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Content Moderation</h2>
                    <p className="mb-3">
                        Inappropriate content, including explicit material, graphic violence, and spam, is strictly prohibited. Violations may result in content removal or account suspension.
                    </p>
                </section>
            </>
        ),
    },
    'cookie-policy': {
        title: 'Cookie Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>This Cookie Policy explains how Krishna Connect uses cookies and similar technologies to recognize you when you visit our platform.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">What are Cookies?</h2>
                    <p className="mb-3">Cookies are small data files placed on your computer or mobile device. They are widely used to make websites work more efficiently and to provide reporting information.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">How We Use Cookies</h2>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li><strong>Essential Cookies:</strong> strictly necessary to provide you with services available through our platform and to use some of its features, such as secure login.</li>
                        <li><strong>Performance and Functionality Cookies:</strong> used to enhance the performance and functionality of our platform but are non-essential to their use.</li>
                        <li><strong>Analytics and Customization Cookies:</strong> collect information that is used either in aggregate form to help us understand how our platform is being used or how effective our marketing campaigns are.</li>
                    </ul>
                </section>
            </>
        ),
    },
    'copyright-policy': {
        title: 'Copyright Policy (DMCA)',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Krishna Connect respects the intellectual property rights of others and expects users to do the same. We will respond to notices of alleged copyright infringement that comply with applicable law and are properly provided to us.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Filing a DMCA Notice</h2>
                    <p className="mb-3">If you believe your copyrighted work has been infringed, please submit a written notification to our Copyright Agent containing: a physical or electronic signature, identification of the work, identification of the material claimed to be infringing, contact information, a statement of good faith belief, and a statement of accuracy under penalty of perjury.</p>
                    <a href="mailto:madanmohandas@krishnaconnect.in" className="text-primary hover:underline font-medium">madanmohandas@krishnaconnect.in</a>
                </section>
            </>
        ),
    },
    'content-moderation': {
        title: 'Content Moderation Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>To ensure Krishna Connect remains a safe and respectful community, we employ both automated tools and human reviewers to moderate content.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Our Approach</h2>
                    <p className="mb-3">We monitor public posts, comments, and media. Content violating our Community Guidelines or Acceptable Use Policy will be restricted, hidden, or deleted. Repeat offenders may face account suspension or a permanent ban.</p>
                </section>
            </>
        ),
    },
    'user-generated-content': {
        title: 'User Generated Content (UGC) Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Ownership and License</h2>
                    <p className="mb-3">You retain all rights and ownership to the content you create and share on Krishna Connect. However, by posting UGC, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display the content in connection with providing our services.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Responsibilities</h2>
                    <p className="mb-3">You are solely responsible for your UGC. You represent and warrant that you own or have the necessary rights to the content you post and that it does not infringe the rights of any third party.</p>
                </section>
            </>
        ),
    },
    'acceptable-use-policy': {
        title: 'Acceptable Use Policy (AUP)',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>This Acceptable Use Policy outlines the acceptable use of the Krishna Connect platform. All users must comply with this policy.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Prohibited Activities</h2>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li>Engaging in illegal activities.</li>
                        <li>Distributing malware or scraping our services without authorization.</li>
                        <li>Harassing, threatening, or impersonating others.</li>
                        <li>Posting sexually explicit, violent, or hateful content.</li>
                    </ul>
                </section>
            </>
        ),
    },
    'data-retention': {
        title: 'Data Retention & Deletion Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>We retain your personal data only as long as necessary to provide our services and fulfill the purposes outlined in our Privacy Policy.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Deletion</h2>
                    <p className="mb-3">You may request the deletion of your account at any time via your account settings. Upon request, we will delete or anonymize your personal data within 30 days, unless retention is required by law.</p>
                </section>
            </>
        ),
    },
    'child-safety': {
        title: 'Child Safety Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Zero Tolerance</h2>
                    <p className="mb-3">Krishna Connect has a zero-tolerance policy against child sexual abuse material (CSAM) and any form of child exploitation. Any such content will be removed immediately, the violating user permanently banned, and the incident reported to the National Center for Missing & Exploited Children (NCMEC) and relevant authorities.</p>
                </section>
            </>
        ),
    },
    'grievance-redressal': {
        title: 'Grievance Redressal Policy (India – DPDP)',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>In compliance with the Digital Personal Data Protection (DPDP) Act, India, and the Information Technology Rules, we have established a grievance redressal mechanism.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Grievance Officer</h2>
                    <p className="mb-3">If you have technical issues, complaints regarding content, or concerns regarding your data processing, please contact our Grievance Officer at:</p>
                    <a href="mailto:grievance@krishnaconnect.in" className="text-primary hover:underline font-medium">grievance@krishnaconnect.in</a>
                    <p className="mt-2">We aim to acknowledge complaints within 24 hours and resolve them within 15 days.</p>
                </section>
            </>
        ),
    },
    'gdpr-compliance': {
        title: 'GDPR Compliance Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>For users in the European Economic Area (EEA) and the UK, this policy outlines your rights under the General Data Protection Regulation (GDPR).</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Rights</h2>
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                        <li>The right to access, update, or delete your personal information.</li>
                        <li>The right of rectification for inaccurate data.</li>
                        <li>The right to object to our processing of your personal data.</li>
                        <li>The right to data portability.</li>
                    </ul>
                </section>
            </>
        ),
    },
    'advertising': {
        title: 'Advertising Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Krishna Connect strives to provide ad content that is relevant, high-quality, and non-intrusive.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Ad Standards</h2>
                    <p className="mb-3">Advertisements must not be misleading, deceptive, or promote illegal products. We reserve the right to review and reject any ad that does not align with our brand values or Community Guidelines.</p>
                </section>
            </>
        ),
    },
    'sponsored-content': {
        title: 'Sponsored Content Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Creators on Krishna Connect must disclose when their content is sponsored, endorsed, or otherwise incentivized by a third party.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Disclosure Requirements</h2>
                    <p className="mb-3">Sponsored content must be clearly labeled using platform tools or clear text designations like "#Sponsored" or "#Ad" visible immediately without clicking "read more".</p>
                </section>
            </>
        ),
    },
    'payments-refund': {
        title: 'Payments & Refund Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Purchases</h2>
                    <p className="mb-3">Any purchases made on Krishna Connect, including virtual goods or subscriptions, are processed securely through trusted payment gateways.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Refunds</h2>
                    <p className="mb-3">Generally, all charges for in-app purchases are non-refundable, and there are no refunds or credits for partially used periods. Exceptions may be made in cases of technical errors at our sole discretion.</p>
                </section>
            </>
        ),
    },
    'subscription-terms': {
        title: 'Subscription Terms',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Auto-Renewal</h2>
                    <p className="mb-3">If you purchase a recurring subscription, your payment method will automatically be charged at the start of each billing period unless cancelled.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Cancellation</h2>
                    <p className="mb-3">You can cancel your subscription at any time through your account settings. You will continue to have access to the premium features until the end of your current billing cycle.</p>
                </section>
            </>
        ),
    },
    'security-policy': {
        title: 'Security Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Protecting user data is a top priority for Krishna Connect. We employ robust security protocols including encryption in transit and at rest, regular vulnerability scanning, and secure software development practices.</p>
                </section>
            </>
        ),
    },
    'vulnerability-disclosure': {
        title: 'Vulnerability Disclosure Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>We welcome reports from security researchers. If you discover a vulnerability in our systems, please report it to us safely.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Reporting</h2>
                    <p className="mb-3">Please submit your findings to our security team. We ask that you give us reasonable time to remedy the vulnerability before public disclosure.</p>
                    <a href="mailto:security@krishnaconnect.in" className="text-primary hover:underline font-medium">security@krishnaconnect.in</a>
                </section>
            </>
        ),
    },
    'transparency-report': {
        title: 'Transparency Report Page',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>At Krishna Connect, we believe in being open about how we enforce our policies and handle data requests. We will publish annual reports summarizing government requests for data and content moderation enforcement stats.</p>
                </section>
            </>
        ),
    },
    'law-enforcement': {
        title: 'Law Enforcement Request Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>This policy outlines the procedure for law enforcement authorities seeking user data from Krishna Connect.</p>
                </section>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Requests</h2>
                    <p className="mb-3">We will only release non-public user data to law enforcement when authorized by valid legal process such as a subpoena, court order, or search warrant.</p>
                </section>
            </>
        ),
    },
    'anonymity-disclaimer': {
        title: 'Anonymity Disclaimer',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>While Krishna Connect supports pseudonymous use of the platform, we cannot guarantee absolute anonymity. IP addresses, device information, and connectivity data may still link to your identity and can be disclosed under valid legal process.</p>
                </section>
            </>
        ),
    },
    'emergency-use': {
        title: 'Emergency Use Disclaimer',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Krishna Connect is not an emergency services provider. You should not rely on this platform for managing emergency situations or contacting emergency services (like 911 in the US or 112 in India). In an emergency, please contact local authorities directly.</p>
                </section>
            </>
        ),
    },
    'accessibility': {
        title: 'Accessibility Statement',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>We are committed to making Krishna Connect accessible to everyone, including users with disabilities. We continually work to improve the user experience for everyone and apply relevant accessibility standards.</p>
                </section>
            </>
        ),
    },
    'code-of-conduct': {
        title: 'Code of Conduct',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Our Code of Conduct represents our fundamental commitment to fostering a healthy community. Be kind, be considerate, and help us maintain an inclusive spiritual environment.</p>
                </section>
            </>
        ),
    },
    'press-media': {
        title: 'Press / Media Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Members of the press requesting information about Krishna Connect, its users, or operations must direct inquiries to our press team. Using the platform to source unverified user data for reporting without consent is prohibited.</p>
                </section>
            </>
        ),
    },
    'intellectual-property': {
        title: 'Intellectual Property Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>Krishna Connect defends its own intellectual property and the UI/UX designs of our platform. Users may not scrape our visual assets and proprietary code without written consent.</p>
                </section>
            </>
        ),
    },
    'trademark-usage': {
        title: 'Trademark Usage Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>The Krishna Connect logo, name, and brand assets are protected trademarks. They may only be used with our permission or as expressly permitted by fair use principles. You must not use our branding in a way that implies endorsement or affiliation where none exists.</p>
                </section>
            </>
        ),
    },
    'api-terms': {
        title: 'API Terms of Use',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">API Usage</h2>
                    <p className="mb-3">Use of the Krishna Connect API is subject to rate limiting and compliance with our Developer Policy. We reserve the right to revoke API access if your integration harms the platform or violates our Terms.</p>
                </section>
            </>
        ),
    },
    'dpa': {
        title: 'Data Processing Agreement (DPA)',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>This DPA governs the processing of personal data on behalf of our enterprise customers and partners in compliance with applicable data protection laws.</p>
                </section>
            </>
        ),
    },
    'e-sign': {
        title: 'E-Sign Consent Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>By using Krishna Connect, you consent to receive electronic communications from us and agree that electronic signatures, contracts, and other records have the same legal effect as if they were in writing.</p>
                </section>
            </>
        ),
    },
    'eula': {
        title: 'End User License Agreement (EULA)',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <p>This EULA is a legal agreement between you and Krishna Connect governing your use of our mobile applications. We grant you a limited, non-exclusive, non-transferable license to use our app on mobile devices you own.</p>
                </section>
            </>
        ),
    },
    'arbitration-dispute': {
        title: 'Arbitration & Dispute Resolution Policy',
        effectiveDate: 'January 1, 2026',
        content: (
            <>
                <section className="bg-card p-6 rounded-xl border border-border/50 shadow-sm mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Mandatory Arbitration</h2>
                    <p className="mb-3">Any dispute or claim arising out of or relating to your use of Krishna Connect shall be settled by binding arbitration, rather than in court, except that you may assert claims in small claims court if your claims qualify.</p>
                </section>
            </>
        ),
    },
};
