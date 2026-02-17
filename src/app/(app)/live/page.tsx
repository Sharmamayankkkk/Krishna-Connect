import { Metadata } from 'next';
import { LivestreamDiscovery } from './livestream-discovery';

export const metadata: Metadata = {
    title: "Live Streams",
    description: "Watch live streams on Krishna Connect.",
};

export default function LivePage() {
    return <LivestreamDiscovery />;
}
