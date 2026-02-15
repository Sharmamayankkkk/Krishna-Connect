import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Settings",
  description: "Manage your privacy preferences on Krishna Connect.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
