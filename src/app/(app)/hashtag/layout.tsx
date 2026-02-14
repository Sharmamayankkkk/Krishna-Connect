import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hashtag",
  description: "Explore posts by hashtag on Krishna Connect.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
