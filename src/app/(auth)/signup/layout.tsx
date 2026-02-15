import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Krishna Connect account and join the community.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
