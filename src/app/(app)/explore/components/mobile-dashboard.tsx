'use client';

import * as React from 'react';
import Link from 'next/link';
import { Users, Flame, ChevronRight, Newspaper } from 'lucide-react';
import { SuggestedUsersWidget } from './suggested-users-widget';
import { TrendingTopicsList } from './trending-topics-list';
import { NewsWidget } from './news-widget';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export function MobileDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState<'trending' | 'news'>('trending');

    return (
        <div className="md:hidden space-y-2 mb-6">
            {/* Suggested Users - Always Visible (Horizontal Scroll) */}
            <div className="bg-background border-y border-border/50 py-3">
                <div className="px-4 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Who to follow</h3>
                    </div>
                    <Link href="/explore" className="text-xs text-muted-foreground flex items-center">
                        View all <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="px-4">
                    <SuggestedUsersWidget showHeader={false} />
                </div>
            </div>

            {/* Tabbed Widget Area (Trending / News) */}
            <div className="bg-background border-y border-border/50 py-3">
                <div className="px-4 flex gap-4 border-b mb-3">
                    <button
                        onClick={() => setActiveTab('trending')}
                        className={cn(
                            "pb-2 text-sm font-medium transition-colors relative",
                            activeTab === 'trending' ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Flame className={cn("h-4 w-4", activeTab === 'trending' && "text-orange-500")} />
                            Trending
                        </div>
                        {activeTab === 'trending' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('news')}
                        className={cn(
                            "pb-2 text-sm font-medium transition-colors relative",
                            activeTab === 'news' ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Newspaper className={cn("h-4 w-4", activeTab === 'news' && "text-blue-500")} />
                            News
                        </div>
                        {activeTab === 'news' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                </div>

                <div className="px-4 min-h-[200px]">
                    {activeTab === 'trending' ? (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <TrendingTopicsList onHashtagClick={(tag) => router.push(`/hashtag/${tag}`)} />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <NewsWidget limit={3} showFooter />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
