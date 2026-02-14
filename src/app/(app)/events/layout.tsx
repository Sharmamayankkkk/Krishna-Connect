import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "Discover and join community events.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
