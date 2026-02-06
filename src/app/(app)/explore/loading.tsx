"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
    return (
        <div className="flex flex-col h-full">
            {/* Header skeleton */}
            <header className="sticky top-0 z-20 bg-background border-b">
                <div className="flex items-center gap-4 p-4">
                    <Skeleton className="h-8 w-8 rounded md:hidden" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <div className="flex-1 max-w-2xl">
                        <Skeleton className="h-10 w-full rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="flex justify-center border-t py-2">
                    <Skeleton className="h-8 w-32 mx-2" />
                    <Skeleton className="h-8 w-32 mx-2" />
                </div>
            </header>

            {/* Stories bar skeleton */}
            <div className="flex gap-3 p-4 border-b overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="container max-w-2xl mx-auto p-4 space-y-4">
                {/* Create post skeleton */}
                <Skeleton className="h-24 w-full rounded-lg" />

                {/* Post skeletons */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <div className="flex justify-between pt-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
