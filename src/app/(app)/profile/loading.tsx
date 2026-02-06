"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
    return (
        <div className="flex flex-col h-full">
            {/* Header with back button */}
            <header className="sticky top-0 z-20 bg-background border-b p-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            </header>

            {/* Banner */}
            <Skeleton className="h-32 md:h-48 w-full" />

            {/* Profile info */}
            <div className="px-4 pb-4 -mt-12 relative">
                <div className="flex justify-between items-end mb-4">
                    <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
                    <Skeleton className="h-10 w-28" />
                </div>

                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-28 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />

                <div className="flex gap-4 mb-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 flex-1 mx-1" />
                ))}
            </div>

            {/* Posts */}
            <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                ))}
            </div>
        </div>
    );
}
