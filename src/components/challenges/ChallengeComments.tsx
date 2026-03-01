'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BadgeCheck, MessageSquare, Send, MoreVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/providers/app-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VerificationBadge } from '@/components/shared/verification-badge';
import { getAvatarUrl } from '@/lib/utils';

interface Comment {
    id: string;
    challenge_id: number;
    user_id: string;
    body: string;
    created_at: string;
    user_name: string;
    user_avatar: string | null;
    user_username: string | null;
    user_verified: boolean;
}

export function ChallengeComments({ challengeId }: { challengeId: number }) {
    const supabase = createClient();
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [challengeId]);

    const fetchComments = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_challenge_comments', { p_challenge_id: challengeId });

        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            setComments(data || []);
        }
        setLoading(false);
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !loggedInUser) return;
        setSubmitting(true);

        const { error } = await supabase.from('challenge_comments').insert({
            challenge_id: challengeId,
            user_id: loggedInUser.id,
            body: newComment.trim()
        });

        if (error) {
            toast({ title: 'Failed to post comment', description: error.message, variant: 'destructive' });
        } else {
            setNewComment('');
            fetchComments();
            toast({ title: 'Comment posted!' });
        }
        setSubmitting(false);
    };

    const handleDelete = async (commentId: string) => {
        if (!loggedInUser) return;
        const { error } = await supabase.rpc('delete_challenge_comment', {
            p_comment_id: commentId
        });

        if (error) {
            toast({ title: 'Failed to delete', variant: 'destructive' });
        } else {
            setComments(comments.filter(c => c.id !== commentId));
            toast({ title: 'Comment deleted' });
        }
    };

    return (
        <div className="bg-card border rounded-2xl p-6 md:p-8 space-y-8 animate-in fade-in">
            <div className="flex items-center gap-3 border-b pb-4">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                    <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Discussion</h3>
                <span className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-bold text-muted-foreground ml-auto">{comments.length}</span>
            </div>

            {/* Post Area */}
            {loggedInUser ? (
                <div className="flex gap-4">
                    <Avatar className="h-10 w-10 shrink-0 border">
                        <AvatarImage src={getAvatarUrl(loggedInUser.avatar_url || undefined) || getAvatarUrl('male.png')} />
                        <AvatarFallback>{loggedInUser.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                        <Textarea
                            placeholder="Share your thoughts, ask questions, or encourage others..."
                            className="resize-none h-24 bg-muted/30 focus-visible:bg-background border-muted"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button
                                onClick={handlePostComment}
                                disabled={submitting || !newComment.trim()}
                                className="gap-2 font-bold px-6 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {submitting ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Post
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-muted/30 border border-muted p-6 rounded-xl text-center">
                    <p className="text-muted-foreground text-sm">Please log in to join the discussion.</p>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-6 pt-4">
                {loading ? (
                    <div className="flex justify-center py-10 opacity-50">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>No comments yet. Start the conversation!</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-4 group">
                            <Avatar className="h-10 w-10 shrink-0 border">
                                <AvatarImage src={getAvatarUrl(comment.user_avatar || undefined) || getAvatarUrl('male.png')} />
                                <AvatarFallback>{comment.user_username?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm hover:underline cursor-pointer">
                                            {comment.user_name || comment.user_username}
                                        </span>
                                        <VerificationBadge verified={comment.user_verified ? 'verified' : 'none'} size={14} className="shrink-0" />
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.created_at))} ago
                                        </span>
                                    </div>

                                    {(loggedInUser?.id === comment.user_id) && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 text-muted-foreground hover:text-foreground">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 border shadow-md rounded-xl">
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer font-medium"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                                <div className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                                    {comment.body}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
