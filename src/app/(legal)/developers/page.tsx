import { Metadata } from "next";
import DevelopersContent from "./developers-content";

export const metadata: Metadata = {
  title: "Our Team | Krishna Connect",
  description: "Meet the inspiration behind Krishna Connect.",
};

export default function DevelopersPage() {
  return <DevelopersContent />;
}