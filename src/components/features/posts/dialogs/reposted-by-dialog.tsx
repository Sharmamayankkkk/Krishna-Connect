'use client';

import * as React from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getAvatarUrl } from '@/lib/utils';
import Image from 'next/image';

interface RepostUser {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    verified: boolean;
}

interface RepostedByDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId: string;
    initialCount?: number;
}

export function RepostedByDialog({ open, onOpenChange, postId, initialCount = 0 }: RepostedByDialogProps) {
    const [users, setUsers] = React.useState<RepostUser[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open && postId) {
            fetchReposters();
        }
    }, [open, postId]);

    const fetchReposters = async () => {
        setLoading(true);
        setError(null);
        const supabase = createClient();

        try {
            const { data, error: fetchError } = await supabase
                .from('post_reposts')
                .select(`
                    user_id,
                    created_at,
                    profiles:user_id (
                        id,
                        name,
                        username,
                        avatar_url,
                        verified
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const reposters: RepostUser[] = (data || [])
                .filter((r: any) => r.profiles)
                .map((r: any) => ({
                    id: r.profiles.id,
                    name: r.profiles.name || 'Unknown User',
                    username: r.profiles.username || 'unknown',
                    avatar_url: r.profiles.avatar_url || '',
                    verified: r.profiles.verified || false
                }));

            setUsers(reposters);
        } catch (err) {
            console.error('Error fetching reposters:', err);
            setError('Failed to load reposters');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Reposted by</DialogTitle>
                </DialogHeader>

                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {error}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No reposts yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/profile/${user.username}`}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={getAvatarUrl(user.avatar_url)} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold truncate">{user.name}</span>
                                            {user.verified && (
                                                <Image
                                                    src="/user_Avatar/verified.png"
                                                    alt="Verified"
                                                    width={14}
                                                    height={14}
                                                    className="inline-block flex-shrink-0"
                                                />
                                            )}
                                        </div>
                                        <span className="text-sm text-muted-foreground">@{user.username}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
