import { Metadata } from "next";
import Link from "next/link";
import { legalPolicies } from "@/config/legal-policies";

export const metadata: Metadata = {
    title: "Legal Directory | Krishna Connect",
    description: "Directory of all legal policies, terms, and guidelines for Krishna Connect.",
};

export default function LegalDirectoryPage() {
    const customSlugs = [
        { slug: '/terms-and-conditions', title: 'Terms and Conditions' },
        { slug: '/privacy-policy', title: 'Privacy Policy' },
        { slug: '/developers', title: 'Developer Policy' },
        { slug: '/contact-us', title: 'Contact Us' },
        { slug: '/faq', title: 'Frequently Asked Questions' },
    ];

    const dynamicPolicies = Object.entries(legalPolicies).map(([slug, policy]) => ({
        slug: `/p/${slug}`,
        title: policy.title,
    }));

    // Combine and sort alphabetically
    const allLinks = [...customSlugs, ...dynamicPolicies].sort((a, b) =>
        a.title.localeCompare(b.title)
    );

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl text-foreground">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold mb-4 tracking-tight">
                    Legal Directory
                </h1>
                <p className="text-muted-foreground">Comprehensive list of all platform policies and guidelines.</p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allLinks.map((link) => (
                        <li key={link.slug}>
                            <Link
                                href={link.slug}
                                className="text-lg text-primary hover:underline hover:text-primary/80 transition-colors flex items-center group"
                            >
                                <span className="w-2 h-2 rounded-full bg-primary/50 mr-3 group-hover:bg-primary transition-colors" />
                                {link.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
