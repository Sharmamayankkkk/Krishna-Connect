"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
    return (
        <div className="flex flex-col h-full w-full bg-background">
            {/* Mobile Header */}
            <header className="flex items-center p-2 border-b gap-2 md:hidden">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-6 w-16" />
            </header>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between border-b px-6 py-4">
                <div>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-28" />
            </div>

            {/* Chat List skeleton */}
            <div className="flex-1 p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                        <Skeleton className="h-3 w-12" />
                    </div>
                ))}
            </div>
        </div>
    );
}
