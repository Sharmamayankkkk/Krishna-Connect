"use client";

import * as React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Hash } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HashtagCard } from './hashtag-card';

export function TrendingTopicsList({ onHashtagClick }: { onHashtagClick: (tag: string) => void }) {
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
            <div className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (topics.length === 0) {
        return (
            <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed text-muted-foreground">
                <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No trending topics yet</p>
                <p className="text-xs">Be the first to start a trend!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {topics.map(topic => (
                <div key={topic.id} onClick={() => onHashtagClick(topic.hashtag)}>
                    <HashtagCard
                        hashtag={topic.hashtag}
                        posts={topic.posts_count}
                        category={topic.category}
                    />
                </div>
            ))}
        </div>
    );
}
