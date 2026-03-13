"use client";

import * as React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Hash, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';

export function TrendingTopicsList({ onHashtagClick }: { onHashtagClick: (tag: string) => void }) {
    const { t } = useTranslation();
    const [topics, setTopics] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchTopics = async () => {

            const supabase = createClient();
            const { data, error } = await supabase.rpc('get_trending_topics');
            if (!error && data) {
                setTopics(data);
            }
            setLoading(false);
        };
        fetchTopics();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
            </div>
        );
    }

    if (topics.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground text-sm">
                <Hash className="h-5 w-5 mx-auto mb-1 opacity-50" />
                <p>{t('explore.noTrending')}</p>
            </div>
        );
    }

    const maxPosts = Math.max(...topics.map((t: any) => t.posts_count || 1), 1);

    return (
        <div className="flex flex-wrap gap-2">
            {topics.slice(0, 12).map((topic: any, idx: number) => {
                const popularity = (topic.posts_count || 1) / maxPosts;
                const isHot = popularity > 0.7;
                const isWarm = popularity > 0.4;
                return (
                    <button
                        key={topic.id || idx}
                        onClick={() => onHashtagClick(topic.hashtag)}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border transition-all duration-200",
                            "hover:scale-105 hover:shadow-md active:scale-95",
                            isHot
                                ? "px-4 py-2 bg-primary/10 border-primary/30 text-primary font-semibold text-sm"
                                : isWarm
                                    ? "px-3 py-1.5 bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400 font-medium text-sm"
                                    : "px-3 py-1.5 bg-muted/50 border-border text-muted-foreground text-xs"
                        )}
                    >
                        {isHot && <TrendingUp className="h-3 w-3" />}
                        <span>#{topic.hashtag}</span>
                        <span className={cn(
                            "text-[10px] ml-0.5",
                            isHot ? "text-primary/60" : "text-muted-foreground/60"
                        )}>
                            {topic.posts_count >= 1000
                                ? `${(topic.posts_count / 1000).toFixed(1)}k`
                                : topic.posts_count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
