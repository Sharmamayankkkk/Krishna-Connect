import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="space-y-6 max-w-md">
                <div className="flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                        <Wrench className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight">
                    Under Maintenance
                </h1>

                <p className="text-muted-foreground text-lg">
                    We are currently performing scheduled maintenance to improve your experience. We'll be back shortly.
                </p>

                <div className="pt-8 text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Krishna Connect. All rights reserved.
                </div>
            </div>
        </div>
    );
}
