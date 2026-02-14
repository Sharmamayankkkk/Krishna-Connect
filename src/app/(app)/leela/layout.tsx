import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leela",
  description: "Play the divine game of self-discovery.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
