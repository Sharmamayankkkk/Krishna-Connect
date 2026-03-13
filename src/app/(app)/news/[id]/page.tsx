import { fetchArticleContent, fetchNewsFeed } from "../actions";
import { NewsItem } from "../types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Calendar, ChevronLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function NewsArticlePage({ params }: PageProps) {
    const { id } = await params;

    // We need to decode the ID and find logic to get the link back
    // However, our fetchNewsFeed returns everything. 
    // Ideally we would have a 'getArticleById' but since we don't have a DB, 
    // we can either (A) Re-fetch the feed to find the item metadata (Title, Date, Link)
    // or (B) Pass encoded link as ID and trust it.
    // Let's assume ID is base64 encoded link.

    let link = '';
    try {
        link = Buffer.from(decodeURIComponent(id), 'base64').toString('ascii');
    } catch (e) {
        notFound();
    }

    if (!link || !link.startsWith('http')) {
        notFound();
    }

    // Double check: We might want the metadata (Title, Image) which is NOT in the article content usually
    // So usually we'd pass it in query params OR re-fetch the feed.
    // Re-fetching feed is safer for clean URLs but slower.
    // For now, let's fetch the feed to get metadata to display a nice header.
    const feed = await fetchNewsFeed();
    const item = feed.find(i => i.id === id) || {
        id,
        title: "News Article",
        link,
        source: link.includes('prabhupadanugas') ? 'Prabhupadanugas' : 'External Source',
        pubDate: new Date().toISOString(),
        imageUrl: undefined
    } as NewsItem;

    const content = await fetchArticleContent(link);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header / Nav */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden" />
                        <Button variant="ghost" size="sm" asChild className="-ml-2">
                            <Link href="/news">
                                <ChevronLeft className="mr-1 h-4 w-4" />Back to News</Link>
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <a href={link} target="_blank" rel="noopener noreferrer" title="Open original">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
                <article className="prose dark:prose-invert prose-lg max-w-none">

                    {/* Hero Metadata */}
                    <div className="not-prose mb-8 border-b pb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                {item.source}
                            </span>
                            <span className="text-muted-foreground text-sm flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {item.pubDate ? format(new Date(item.pubDate), 'PP') : 'Recent'}
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
                            {item.title}
                        </h1>

                        {item.imageUrl && (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    priority
                                />
                            </div>
                        )}
                    </div>

                    {/* Article Body */}
                    {content ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: content }}
                            className="article-content"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground not-prose">
                            <p className="text-lg">Could not load reader view for this article.</p>
                            <Button variant="outline" className="mt-4" asChild>
                                <a href={link} target="_blank" rel="noopener noreferrer">
                                    Read on {item.source} <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    )}
                </article>
            </main>
        </div>
    );
}
