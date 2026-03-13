"use client";

import { Mail, MessageSquare, Shield, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useTranslation } from 'react-i18next';

const ContactUsContent = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">{t('legal.getInTouch')}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Have questions, suggestions, or just want to say Hare Krishna?
          We&apos;d love to hear from you. We typically respond within 48 hours.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Support Card */}
        <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('legal.emailSupport')}</h2>
          <p className="text-muted-foreground mb-6 flex-1">
            For general inquiries, account support, or feedback. We typically
            respond within 48 hours.
          </p>
          <Button asChild className="rounded-full">
            <a href="mailto:madanmohandas@krishnaconnect.in">{t('legal.sendEmail')}</a>
          </Button>
        </div>

        {/* Community Card */}
        <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('legal.joinTheCommunity')}</h2>
          <p className="text-muted-foreground mb-6 flex-1">
            Connect with other devotees directly on the platform. Share your
            thoughts and experiences.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/explore">{t('post.goToFeed')}</Link>
          </Button>
        </div>

        {/* Report Abuse Card */}
        <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-destructive/10 rounded-full flex items-center justify-center mb-4 text-destructive">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('legal.reportAbuseOrViolation')}</h2>
          <p className="text-muted-foreground mb-6 flex-1">
            Report harassment, inappropriate content, or any violation of our
            community guidelines. All reports are handled confidentially.
          </p>
          <Button asChild variant="destructive" className="rounded-full">
            <a href="mailto:madanmohandas@krishnaconnect.in?subject=Abuse%20Report">{t('legal.reportNow')}</a>
          </Button>
        </div>

        {/* Legal Inquiries Card */}
        <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Scale className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('legal.legalInquiries')}</h2>
          <p className="text-muted-foreground mb-6 flex-1">
            For DMCA takedown notices, law enforcement requests, data privacy
            inquiries, or other legal matters.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <a href="mailto:madanmohandas@krishnaconnect.in?subject=Legal%20Inquiry">{t('legal.contactLegal')}</a>
          </Button>
        </div>
      </div>

      <div className="mt-12 text-center pt-8 border-t border-border/40">
        <p className="text-muted-foreground text-sm">
          Copyright 2026 <strong>Krishna Connect</strong>. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ContactUsContent;
