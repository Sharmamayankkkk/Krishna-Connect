import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moodboard",
  description: "Create and share your mood and inspiration boards.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
