'use client';

import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4 text-center">
            <BarChart3 className="h-20 w-20 text-muted-foreground/50 mb-6" />
            <h1 className="text-3xl font-bold mb-4">Feature Coming Soon</h1>
            <p className="text-muted-foreground max-w-md">
                Analytics and insights for your posts will be available here soon. Track your engagement and growth!
            </p>
        </div>
    );
}