import { Metadata } from "next";
import { LivestreamInviteListener } from "@/components/features/live/livestream-invite-listener";


export const metadata: Metadata = {
  title: "Live",
  description: "Watch and join live streams on Krishna Connect.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LivestreamInviteListener />
      {children}
    </>
  );
}
