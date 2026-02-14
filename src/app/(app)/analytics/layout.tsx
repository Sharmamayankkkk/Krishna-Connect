import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View your post performance, engagement metrics, and audience insights.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
