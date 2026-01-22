'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserCard } from './user-card';

interface ConnectionsViewProps {
    users: any[];
    profile: any;
    initialType: 'followers' | 'following';
    currentUserId: string;
    isOwnProfile: boolean;
}

export function ConnectionsView({ users, profile, initialType, currentUserId, isOwnProfile }: ConnectionsViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(initialType);
    const [userList, setUserList] = useState(users); // Local state for optimistic updates (e.g. remove follower)

    const handleTabChange = (value: string) => {
        setActiveTab(value as 'followers' | 'following');
        const params = new URLSearchParams(searchParams.toString());
        params.set('type', value);
        router.replace(`/profile/${profile.username}/connections?${params.toString()}`);
        router.refresh(); // Fetch new data for the tab
    };

    const displayName = profile.name || profile.full_name || profile.username;

    const handleRemoveUser = (userId: string) => {
        setUserList(prev => prev.filter(u => u.id !== userId));
    };

    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
                <div className="flex items-center gap-4 px-4 h-14">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/profile/${profile.username}`)} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">{displayName}</h1>
                        <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="w-full h-12 bg-transparent p-0 border-b rounded-none justify-evenly">
                        <TabsTrigger
                            value="followers"
                            className="flex-1 h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-muted/50 transition-colors"
                        >
                            Followers ({profile.follower_count || 0})
                        </TabsTrigger>
                        <TabsTrigger
                            value="following"
                            className="flex-1 h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-muted/50 transition-colors"
                        >
                            Following ({profile.following_count || 0})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Content */}
            <div className="divide-y">
                {userList.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <div className="text-xl font-bold mb-2">
                            {activeTab === 'followers' ? 'Looking for followers?' : 'Not following anyone yet?'}
                        </div>
                        <p>
                            {activeTab === 'followers'
                                ? (isOwnProfile ? "You don't have any followers yet." : `@${profile.username} doesn't have any followers yet.`)
                                : (isOwnProfile ? "When you follow people, they'll show up here." : `@${profile.username} isn't following anyone yet.`)
                            }
                        </p>
                    </div>
                ) : (
                    userList.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            currentUserId={currentUserId}
                            isOwnProfile={isOwnProfile}
                            listType={activeTab}
                            onRemove={handleRemoveUser}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
