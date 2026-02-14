import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appearance",
  description: "Customize the look and feel of Krishna Connect.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
