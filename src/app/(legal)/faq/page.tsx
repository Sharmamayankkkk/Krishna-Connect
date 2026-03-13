"use client";

import { Metadata } from "next";
import { useTranslation } from 'react-i18next';

import {
  Rocket,
  Sparkles,
  BadgeCheck,
  ShieldCheck,
  User,
  Monitor,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ | Krishna Connect",
  description:
    "Frequently asked questions about Krishna Connect - your spiritual social platform.",
};

const faqCategories = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      {
        question: "What is Krishna Connect?",
        answer:
          "Krishna Connect is a spiritual social platform designed for devotees and seekers of Krishna Consciousness. It provides a safe space to share devotional content, connect with like-minded individuals, participate in discussions, and grow spiritually together.",
      },
      {
        question: "How do I create an account?",
        answer:
          'You can create an account by visiting the Krishna Connect homepage and clicking the "Sign Up" button. You can register using your email address. Once registered, you will receive a verification email to confirm your account.',
      },
      {
        question: "How do I set up my profile?",
        answer:
          "After creating your account, navigate to your profile settings to add a display name, profile picture, bio, and other personal details. A complete profile helps other devotees connect with you more easily.",
      },
    ],
  },
  {
    title: "Features",
    icon: Sparkles,
    items: [
      {
        question: "How do I post content?",
        answer:
          "You can create posts from the home feed by clicking the compose button. Posts can include text, images, and links. You can also add tags to help others discover your content through the Explore page.",
      },
      {
        question: "How do bookmarks work?",
        answer:
          "Bookmarks allow you to save posts that you want to revisit later. Click the bookmark icon on any post to save it. You can access all your bookmarked posts from your profile under the Bookmarks tab.",
      },
      {
        question: "What is Leela and how do I use it?",
        answer:
          "Leela is a unique feature on Krishna Connect that provides an interactive spiritual experience. You can access Leela from the main navigation menu to explore spiritual teachings and engage with devotional content in a guided format.",
      },
      {
        question: "How do calls work on Krishna Connect?",
        answer:
          "Krishna Connect supports voice and video calls between connected users. You can initiate a call from a conversation or from a user's profile. Both parties need to be online and have granted microphone and camera permissions for the call to work.",
      },
      {
        question: "How do I use the Explore page?",
        answer:
          "The Explore page helps you discover new content and users on the platform. You can browse trending posts, search for specific topics or users, and find content organized by categories. Use the search bar and filters to refine your discoveries.",
      },
    ],
  },
  {
    title: "Verification",
    icon: BadgeCheck,
    items: [
      {
        question: "What is verification on Krishna Connect?",
        answer:
          "Verification is a way to confirm the authenticity of notable accounts on Krishna Connect. Verified accounts display a badge next to their name, indicating that the account has been confirmed as authentic by our team.",
      },
      {
        question: "How do I get verified?",
        answer:
          "To apply for verification, go to your account settings and look for the verification request option. You will need to provide identification and demonstrate that your account represents a real person or organization. Our team reviews all applications manually.",
      },
      {
        question: "What benefits do verified users get?",
        answer:
          "Verified users receive a visible badge on their profile and posts, which helps build trust within the community. Verified accounts may also receive priority support and access to certain features as they become available.",
      },
    ],
  },
  {
    title: "Privacy and Safety",
    icon: ShieldCheck,
    items: [
      {
        question: "How is my data protected?",
        answer:
          "We implement industry-standard security measures including encryption in transit (TLS/SSL), secure authentication, regular security audits, and strict access controls. For full details, please review our Privacy Policy.",
      },
      {
        question: "How do I report abuse or inappropriate content?",
        answer:
          "You can report abuse directly from any post, comment, or profile by clicking the report option (usually accessible via a menu icon). You can also email us at madanmohandas@krishnaconnect.in with details of the violation. All reports are reviewed confidentially.",
      },
      {
        question: "How do I block a user?",
        answer:
          "To block a user, visit their profile and select the block option from the menu. Blocked users will not be able to see your profile, send you messages, or interact with your content. You can manage your blocked users list from your account settings.",
      },
    ],
  },
  {
    title: "Account",
    icon: User,
    items: [
      {
        question: "How do I delete my account?",
        answer:
          "You can request account deletion from your account settings. Once confirmed, your account and all associated data will be permanently removed within 30 days. Please note that this action is irreversible. Some data may be retained as required by law.",
      },
      {
        question: "How do I change my password?",
        answer:
          "Navigate to your account settings and select the password or security section. You will need to enter your current password and then set a new one. If you have forgotten your password, use the \"Forgot Password\" link on the sign-in page to reset it via email.",
      },
    ],
  },
  {
    title: "Technical",
    icon: Monitor,
    items: [
      {
        question: "What browsers are supported?",
        answer:
          "Krishna Connect supports all modern browsers including Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge. We recommend keeping your browser updated to the latest version for the best experience.",
      },
      {
        question: "Is there a mobile app available?",
        answer:
          "Krishna Connect is built as a progressive web application (PWA), which means you can use it on any device through your web browser. You can also add it to your home screen on mobile devices for an app-like experience. Native mobile apps may be released in the future.",
      },
    ],
  },
];

const FAQPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-foreground">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">{t('legal.frequentlyAskedQuestions')}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Find answers to common questions about Krishna Connect. Can&apos;t
          find what you&apos;re looking for? Contact us at{" "}
          <a
            href="mailto:madanmohandas@krishnaconnect.in"
            className="text-primary hover:underline"
          >
            madanmohandas@krishnaconnect.in
          </a>
          .
        </p>
      </div>

      <div className="space-y-8">
        {faqCategories.map((category) => {
          const Icon = category.icon;
          return (
            <section
              key={category.title}
              className="bg-card p-6 rounded-xl border border-border/50 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold">{category.title}</h2>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${category.title}-${index}`}
                  >
                    <AccordionTrigger className="text-left text-base">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          );
        })}
      </div>

      <div className="mt-12 text-center pt-8 border-t border-border/40">
        <p className="text-muted-foreground text-sm">
          Copyright 2026 <strong>Krishna Connect</strong>. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default FAQPage;
