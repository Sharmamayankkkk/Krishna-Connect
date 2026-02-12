import { Metadata } from "next";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | Krishna Connect",
  description: "Get in touch with the Krishna Connect team.",
};

const ContactUsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Get in Touch</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Have questions, suggestions, or just want to say Hare Krishna? We'd love to hear from you.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Support Card */}
        <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Email Support</h2>
          <p className="text-muted-foreground mb-6 flex-1">
            For general inquiries, account support, or feedback. We usually respond within 24 hours.
          </p>
          <Button asChild className="rounded-full">
            <a href="mailto:226mayankkle@gmail.com">Send Email</a>
          </Button>
        </div>

        {/* Community Card */}
        <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Join the Community</h2>
          <p className="text-muted-foreground mb-6 flex-1">
            Connect with other devotees directly on the platform. Share your thoughts and experiences.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/explore">Go to Feed</Link>
          </Button>
        </div>
      </div>

      <div className="mt-12 text-center pt-8 border-t border-border/40">
        <p className="text-muted-foreground text-sm">
          Powered by the <strong>Krishna Consciousness Society</strong>
        </p>
      </div>
    </div>
  );
};

export default ContactUsPage;
