import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promotions",
  description: "Manage your post promotions on Krishna Connect.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
