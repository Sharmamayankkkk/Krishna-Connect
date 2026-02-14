import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed",
  description: "Your personalized feed of posts from people you follow.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
