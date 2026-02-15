import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore",
  description: "Discover trending posts, people, and topics on Krishna Connect.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
