import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Status",
  description: "Share and view status updates.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
