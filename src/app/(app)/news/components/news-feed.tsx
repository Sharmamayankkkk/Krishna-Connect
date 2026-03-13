'use client';

import { NewsItem } from "../types";
import { NewsCard } from "./news-card";
import { Newspaper } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { useTranslation } from 'react-i18next';

interface NewsFeedProps {
    initialItems: NewsItem[];
}

export function NewsFeed({ initialItems }: NewsFeedProps) {
  const { t } = useTranslation();

    // No state needed anymore as navigation is handled by Link in NewsCard

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden mr-2" />
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Newspaper className="h-8 w-8 text-primary" />{t('news.spiritualNews')}</h1>
                    </div>
                    <p className="text-muted-foreground text-lg">{t('news.latestUpdatesFromPrabhupadanugasAndThe')}</p>
                </div>
            </div>

            {/* Grid Layout */}
            {initialItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {initialItems.map((item) => (
                        <NewsCard
                            key={item.id}
                            item={item}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="p-6 rounded-full bg-muted">
                        <Newspaper className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-semibold">{t('news.noNewsFound')}</h3>
                    <p className="text-muted-foreground">{t('news.checkBackLaterForUpdates')}</p>
                </div>
            )}
        </div>
    );
}
