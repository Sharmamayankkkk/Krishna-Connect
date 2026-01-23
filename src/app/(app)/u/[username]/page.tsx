"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function UserRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    useEffect(() => {
        const resolveUser = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('profiles')
                .select('id')
                .ilike('username', username)
                .single();

            if (data) {
                router.replace(`/profile/${data.id}`);
            } else {
                // handle 404 or show error
                // for now redirect to home or show toast
                router.replace('/explore');
            }
        };

        if (username) {
            resolveUser();
        }
    }, [username, router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="sr-only">Redirecting...</span>
        </div>
    );
}
