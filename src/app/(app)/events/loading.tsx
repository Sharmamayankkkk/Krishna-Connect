"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background border-b p-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </header>

            {/* Events grid */}
            <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                        <Skeleton className="aspect-video w-full" />
                        <div className="p-4 space-y-3">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <div className="flex gap-2 pt-2">
                                <Skeleton className="h-9 flex-1" />
                                <Skeleton className="h-9 flex-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
