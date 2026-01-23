'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
    const pathname = usePathname();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">Log in to Krishna Connect</DialogTitle>
                    <DialogDescription className="text-center">
                        Join the community to like, comment, share, and connect with others.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button asChild size="lg" className="w-full font-semibold">
                        <Link href={`/login?next=${encodeURIComponent(pathname || '/explore')}`}>
                            Log in
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full font-semibold">
                        <Link href={`/signup?next=${encodeURIComponent(pathname || '/explore')}`}>
                            Sign up
                        </Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
