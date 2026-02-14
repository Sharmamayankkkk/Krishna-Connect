import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leela",
  description: "Watch and share short-form videos on Krishna Connect.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
