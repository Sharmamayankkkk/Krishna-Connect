"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("App error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
            <div className="bg-destructive/10 rounded-full p-4 mb-4">
                <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                We encountered an unexpected error. Please try again or refresh the page.
            </p>
            <div className="flex gap-3">
                <Button onClick={() => reset()} variant="default">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try again
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Refresh page
                </Button>
            </div>
            {error.digest && (
                <p className="text-xs text-muted-foreground mt-4">
                    Error ID: {error.digest}
                </p>
            )}
        </div>
    );
}
