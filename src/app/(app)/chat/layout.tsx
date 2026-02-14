import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description: "Chat with your connections on Krishna Connect.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
