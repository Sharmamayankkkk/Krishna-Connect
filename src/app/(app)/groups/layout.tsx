import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups",
  description: "Browse and join community groups.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
