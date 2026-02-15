import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calls",
  description: "Voice and video calls with your connections.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
