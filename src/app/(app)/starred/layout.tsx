import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starred",
  description: "Your starred and favorite content.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
