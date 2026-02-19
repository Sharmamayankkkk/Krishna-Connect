'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewsItem } from "../types";
import { formatDistanceToNow } from "date-fns";
import { Calendar, ExternalLink, ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link"; // Import Link

interface NewsCardProps {
    item: NewsItem;
    // remote onClick as we use Link now
    className?: string;
}

export function NewsCard({ item, className }: NewsCardProps) {
    return (
        <Link href={`/news/${encodeURIComponent(item.id)}`} passHref className={cn("block h-full", className)}>
            <Card
                className={cn(
                    "group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-none bg-card/50 hover:bg-card h-full flex flex-col"
                )}
            >
                {/* Image Section */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    {item.imageUrl ? (
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                            <ImageIcon className="h-10 w-10 text-primary/20" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="backdrop-blur-md bg-black/50 text-white border-none hover:bg-black/60">
                            {item.source === 'Prabhupadanugas' ? 'Prabhupada' : 'Sun'}
                        </Badge>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        {/* Safe date formatting */}
                        {(() => {
                            try {
                                return item.pubDate ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true }) : 'Recently';
                            } catch (e) {
                                return 'Recently';
                            }
                        })()}
                    </div>

                    <h3 className="font-bold text-lg leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {item.description || "Click to read full article..."}
                    </p>

                    <div className="mt-auto pt-3 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                        Read Article <ExternalLink className="ml-1 h-3 w-3" />
                    </div>
                </div>
            </Card>
        </Link>
    );
}
