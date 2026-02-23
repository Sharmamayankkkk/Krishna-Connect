import { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalPolicies } from "@/config/legal-policies";

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}): Promise<Metadata> {
    const policy = legalPolicies[params.slug];

    if (!policy) {
        return {
            title: "Policy Not Found | Krishna Connect",
        };
    }

    return {
        title: `${policy.title} | Krishna Connect`,
        description: `Read our ${policy.title} to understand our platform guidelines.`,
    };
}

export default function DynamicLegalPage({
    params,
}: {
    params: { slug: string };
}) {
    const policy = legalPolicies[params.slug];

    if (!policy) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl text-foreground">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold mb-4 tracking-tight">
                    {policy.title}
                </h1>
                <p className="text-muted-foreground">Effective: {policy.effectiveDate}</p>
            </div>

            <div className="space-y-8 text-lg leading-relaxed text-muted-foreground/90">
                {policy.content}

                <p className="text-center text-sm text-muted-foreground pt-4 border-t border-border/50">
                    Copyright 2026 Krishna Connect. All rights reserved.
                </p>
            </div>
        </div>
    );
}
