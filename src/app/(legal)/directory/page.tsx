import { Metadata } from "next";
import DirectoryContent from "./directory-content";

export const metadata: Metadata = {
    title: "Legal Directory | Krishna Connect",
    description: "Directory of all legal policies, terms, and guidelines for Krishna Connect.",
};

export default function LegalDirectoryPage() {
  return <DirectoryContent />;
}
