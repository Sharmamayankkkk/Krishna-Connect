import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Challenges",
  description: "Participate in community challenges and activities.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
