import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Your saved posts and bookmark collections.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
