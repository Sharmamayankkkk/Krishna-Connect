import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Settings",
  description: "Manage your account security settings.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
