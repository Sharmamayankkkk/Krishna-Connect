import { Metadata } from "next";
import FAQContent from "./faq-content";

export const metadata: Metadata = {
  title: "FAQ | Krishna Connect",
  description:
    "Frequently asked questions about Krishna Connect - your spiritual social platform.",
};

export default function FAQPage() {
  return <FAQContent />;
}
