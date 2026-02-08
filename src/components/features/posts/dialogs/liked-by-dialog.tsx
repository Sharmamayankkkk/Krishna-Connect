'use client';

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { FollowButton } from "@/app/(app)/profile/[username]/components/follow-button";
import { useAppContext } from "@/providers/app-provider";

interface LikedByDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId: string;
}

interface LikedUser {
    user_id: string; // RPC returns user_id, mapped to id
    username: string;
    name: string;
    avatar_url: string;
    verified: boolean;
    bio: string;
}

export function LikedByDialog({ open, onOpenChange, postId }: LikedByDialogProps) {
    const [users, setUsers] = useState<LikedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { loggedInUser } = useAppContext();

    useEffect(() => {
        if (open && postId) {
            fetchLikes();
        }
    }, [open, postId]);

    const fetchLikes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_post_likes_users', { p_post_id: parseInt(postId) });
            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching likes:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Likes</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full pr-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No likes yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {users.map((user) => (
                                <div key={user.user_id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Link href={`/profile/${user.username}`}>
                                            <Avatar>
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div>
                                            <Link href={`/profile/${user.username}`} className="font-semibold hover:underline">
                                                <span>{user.name || user.username}</span>
                                                {user.verified && (
                                                    <span className="ml-1 text-blue-500">✓</span>
                                                )}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                                        </div>
                                    </div>
                                    {loggedInUser?.id !== user.user_id && (
                                        <FollowButton
                                            profileId={user.user_id}
                                            currentUserId={loggedInUser?.id || ''}
                                            initialStatus="none" // Optimistic, ideally we fetch this
                                            variant="sm"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
