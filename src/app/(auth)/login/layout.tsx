import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your Krishna Connect account.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
