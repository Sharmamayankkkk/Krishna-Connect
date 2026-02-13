'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import { UserCard } from '@/app/(app)/explore/components/user-card';

interface SuggestedUsersSectionProps {
    users: any[];
}

export function SuggestedUsersSection({ users }: SuggestedUsersSectionProps) {
    if (!users || users.length === 0) return null;

    return (
        <div className="w-full max-w-2xl mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Who to follow</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
                {users.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onFollow={() => { }} // Internal state handles UI update
                        isFollowing={false}
                    />
                ))}
            </div>
        </div>
    );
}
