'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock } from "lucide-react";

export function LoginWall() {
    return (
        <div className="w-full p-8 my-8 border rounded-xl bg-muted/20 text-center">
            <div className="bg-background p-3 rounded-full inline-flex mb-4 shadow-sm border">
                <Lock className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Login to see more</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Enjoying the content? Log in to see more, interact with posts, and follow your favorite creators.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="font-semibold px-8">
                    <Link href="/login?next=/explore">
                        Log in
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="font-semibold px-8">
                    <Link href="/signup?next=/explore">
                        Sign up
                    </Link>
                </Button>
            </div>
        </div>
    );
}
