import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Group",
  description: "View group details and discussions.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
