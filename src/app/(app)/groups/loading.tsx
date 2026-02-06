"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function GroupsLoading() {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background border-b p-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="flex gap-2 mt-4">
                    <Skeleton className="h-10 flex-1 rounded-full" />
                </div>
            </header>

            {/* Groups list */}
            <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Skeleton className="h-14 w-14 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-9 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
