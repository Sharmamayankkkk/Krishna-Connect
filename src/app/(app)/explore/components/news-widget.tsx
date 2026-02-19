'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, ChevronRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchNewsFeed } from '@/app/(app)/news/actions';
import { NewsItem } from '@/app/(app)/news/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NewsWidgetProps {
    className?: string;
    limit?: number;
    showFooter?: boolean;
}

export function NewsWidget({ className, limit = 4, showFooter = true }: NewsWidgetProps) {
    const [news, setNews] = React.useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const loadNews = async () => {
            try {
                const items = await fetchNewsFeed();
                setNews(items.slice(0, limit));
            } catch (error) {
                console.error('Failed to load news widget:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadNews();
    }, [limit]);

    if (isLoading) {
        return (
            <Card className={cn("border-none shadow-none bg-transparent", className)}>
                <CardHeader className="p-0 mb-3">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
                            <div className="space-y-1 flex-1">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (news.length === 0) return null;

    return (
        <Card className={cn("border-none shadow-none bg-transparent", className)}>
            <CardHeader className="p-0 mb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-orange-500" />
                        <h3 className="font-semibold text-sm">Latest News</h3>
                    </div>
                    {showFooter && (
                        <Link
                            href="/news"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                        >
                            View All <ChevronRight className="h-3 w-3" />
                        </Link>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0 grid gap-4">
                {news.map((item) => (
                    <Link
                        key={item.id}
                        href={`/news/${encodeURIComponent(item.id)}`}
                        className="group flex gap-3 items-start"
                    >
                        <div className="relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden bg-muted border">
                            {item.imageUrl ? (
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-muted/50">
                                    <Newspaper className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                            <h4 className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                {item.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="px-1 py-0 text-[9px] h-3.5 font-normal rounded-sm">
                                    {item.source}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                    {item.pubDate ? new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}
