import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authorization",
  description: "Authorize access to your Krishna Connect account.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
