"use client";

import * as React from 'react';
import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserCard } from './user-card';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';

export function SuggestedUsersWidget() {
    const [suggestedUsers, setSuggestedUsers] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchUsers = async () => {
            const supabase = createClient();
            const { data } = await supabase.rpc('get_who_to_follow', { limit_count: 3 });

            if (data) {
                const enhanced = data.map((u: any) => ({
                    ...u,
                    followers: u.followers_count,
                    avatar: u.avatar_url || '/placeholder-user.jpg'
                }));
                setSuggestedUsers(enhanced);
            }
            setIsLoading(false);
        };
        fetchUsers();
    }, []);

    const handleFollowUser = () => {
        toast({
            title: "Following",
            description: "You are now following this user"
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-5 w-32 rounded" />
                </div>
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (suggestedUsers.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 px-1">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Who to Follow</h3>
            </div>
            <div className="space-y-3">
                {suggestedUsers.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onFollow={handleFollowUser}
                        isFollowing={false}
                    />
                ))}
            </div>
        </div>
    );
}
