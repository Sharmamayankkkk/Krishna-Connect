import { Metadata } from "next";
import ContactUsContent from "./contact-us-content";

export const metadata: Metadata = {
  title: "Contact Us | Krishna Connect",
  description: "Get in touch with the Krishna Connect team.",
};

export default function ContactUsPage() {
  return <ContactUsContent />;
}
