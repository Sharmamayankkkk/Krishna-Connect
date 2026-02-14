import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NFT Gallery",
  description: "Explore and collect digital art and NFTs.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
