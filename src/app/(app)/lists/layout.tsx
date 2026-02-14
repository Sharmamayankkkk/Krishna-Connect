import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lists",
  description: "Curate and manage your custom lists.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
