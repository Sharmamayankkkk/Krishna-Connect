import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Space",
  description: "Join live audio spaces and discussions.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
