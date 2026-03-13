import { Metadata } from "next";
import PrivacyPolicyContent from "./privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | Krishna Connect",
  description:
    "How we collect, use, and protect your data at Krishna Connect.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}