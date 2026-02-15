import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memories",
  description: "Relive your past moments and posts.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
