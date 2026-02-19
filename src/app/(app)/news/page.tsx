import { fetchNewsFeed } from "./actions";
import { NewsFeed } from "./components/news-feed";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "News | Krishna Connect",
    description: "Latest spiritual news and updates.",
};

export const revalidate = 3600; // Revalidate every hour

export default async function NewsPage() {
    const newsItems = await fetchNewsFeed();

    return (
        <div className="min-h-screen bg-background">
            <NewsFeed initialItems={newsItems} />
        </div>
    );
}
