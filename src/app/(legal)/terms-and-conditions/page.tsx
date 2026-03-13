import { Metadata } from "next";
import TermsAndConditionsContent from "./terms-and-conditions-content";

export const metadata: Metadata = {
  title: "Terms and Conditions | Krishna Connect",
  description: "Terms and usage guidelines for Krishna Connect.",
};

export default function TermsAndConditionsPage() {
  return <TermsAndConditionsContent />;
}