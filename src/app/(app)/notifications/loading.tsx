"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background border-b p-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
                <div className="flex gap-2 mt-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-8 w-20 rounded-full" />
                    ))}
                </div>
            </header>

            {/* Notification items skeleton */}
            <div className="flex-1 divide-y">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex gap-3 p-4">
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
