'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Calendar, User } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchArticleContent } from "../actions";
import { NewsItem } from "../types";
import { format } from "date-fns";
import Image from "next/image";

import { useTranslation } from 'react-i18next';

interface NewsReaderDialogProps {
    item: NewsItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewsReaderDialog({ item, open, onOpenChange }: NewsReaderDialogProps) {
  const { t } = useTranslation();

    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && item) {
            setLoading(true);
            setContent(null);
            fetchArticleContent(item.link)
                .then((html) => {
                    setContent(html);
                })
                .catch((err) => {
                    console.error("Failed to load article", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, item]);

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {item.source}
                        </span>
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.pubDate ? format(new Date(item.pubDate), 'PP') : 'Recent'}
                        </span>
                    </div>
                    <DialogTitle className="text-2xl font-bold leading-tight">
                        {item.title}
                    </DialogTitle>
                    <DialogDescription className="hidden">
                        Reading article from {item.source}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative bg-muted/30">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <div className="p-6 pt-2 max-w-none prose dark:prose-invert prose-sm sm:prose-base prose-img:rounded-lg prose-img:shadow-md prose-headings:text-foreground prose-p:text-foreground/90 leading-relaxed">
                                {item.imageUrl && (
                                    <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden not-prose">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                            unoptimized // External images
                                        />
                                    </div>
                                )}

                                {content ? (
                                    <div dangerouslySetInnerHTML={{ __html: content }} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                                        <p>{t('news.couldNotLoadStandardReaderView')}</p>
                                        <Button variant="outline" className="mt-4" asChild>
                                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                Open in Browser <ExternalLink className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <div className="p-4 border-t bg-background shrink-0 flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
                    <Button size="sm" asChild>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                            Original Article <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
