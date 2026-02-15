import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live",
  description: "Watch and join live streams on Krishna Connect.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
