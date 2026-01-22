'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
    MessageCircle,
    Heart,
    BarChart2,
    Share,
    MoreHorizontal,
    Pin,
    Bookmark,
    BookmarkCheck,
    X,
    Flag,
    Trash2,
    Quote,
    SendHorizonal,
    Edit,
    EyeOff,
    Eye,
    Repeat2,
    Clock,
    CheckCircle2,
    TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn, getAvatarUrl } from '@/lib/utils';
import { PollType, PostType, CommentType, ReplyType, MediaType } from '../types';
import { VideoPlayer } from './video-player';
import { ImageViewerDialog } from './image-viewer';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";

interface PostCardProps {
    post: PostType;
    onComment: (postId: string, commentText: string, parentCommentId?: string) => void;
    onDelete: (postId: string) => void;
    onEdit: (postId: string, newContent: string) => void;
    onLikeToggle: (postId: string) => void;
    onSaveToggle: (postId: string) => void;
    onCommentLikeToggle: (postId: string, commentId: string, isReply?: boolean) => void;
    onCommentPinToggle: (postId: string, commentId: string) => void;
    onCommentHideToggle: (postId: string, commentId: string, isReply?: boolean) => void;
    onCommentDelete: (postId: string, commentId: string, isReply?: boolean, parentCommentId?: string) => void;
    onQuotePost: (originalPostId: string, quoteText: string) => void;
    onRepost: (postId: string) => void;
    onPollVote: (postId: string, optionId: string) => void;
    onPromote: (post: PostType) => void;
}

// --- CHILD COMPONENTS & DIALOGS ---

const HareKrishnaVideoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-white/20 hover:text-white" onClick={onClose}>
                    <X className="h-6 w-6" />
                </Button>
                <video className="w-full h-full" src="/text/krishna.mp4" controls autoPlay playsInline>
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>
    );
};

const DeleteConfirmDialog = ({ open, onOpenChange, onConfirm, itemType = "post" }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void; itemType?: string }) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {itemType}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your {itemType}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const EditPostDialog = ({ post, open, onOpenChange, onSave }: { post: PostType; open: boolean; onOpenChange: (open: boolean) => void; onSave: (newContent: string) => void }) => {
    const [editedContent, setEditedContent] = React.useState(post.content);

    React.useEffect(() => {
        if (open) setEditedContent(post.content);
    }, [open, post.content]);

    const handleSave = () => {
        if (editedContent.trim()) {
            onSave(editedContent.trim());
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Edit Post</DialogTitle>
                </DialogHeader>
                <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[150px]"
                    placeholder="What's on your mind?"
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={!editedContent.trim()}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ReportDialog = ({ open, onOpenChange, onReport }: { open: boolean; onOpenChange: (open: boolean) => void; onReport: () => void }) => {
    const [reportReason, setReportReason] = React.useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report Content</DialogTitle>
                    <DialogDescription>
                        Please select a reason for your report. Your feedback helps keep our community safe.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Textarea
                        placeholder="Provide additional details (optional)..."
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={onReport}>
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const EmbeddedPost = ({ post }: { post: NonNullable<PostType['originalPost']> }) => {
    return (
        <div className="mt-2 border rounded-xl p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 text-sm">
                <Avatar className="h-5 w-5">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Link href={`/profile/${post.author.username}`} className="font-bold hover:underline truncate">
                    {post.author.name}
                </Link>
                <span className="text-muted-foreground">@{post.author.username}</span>
                <span className="text-muted-foreground">·</span>
                <time dateTime={post.createdAt} className="text-muted-foreground text-xs flex-shrink-0">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </time>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap break-words line-clamp-3">{post.content}</p>
        </div>
    );
};

const QuotePostDialog = ({ post, open, onOpenChange, onQuote }: { post: PostType; open: boolean; onOpenChange: (open: boolean) => void; onQuote: (text: string) => void }) => {
    const [quoteText, setQuoteText] = React.useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Quote Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Textarea
                        placeholder="Add your thoughts..."
                        value={quoteText}
                        onChange={(e) => setQuoteText(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <EmbeddedPost post={post} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => onQuote(quoteText)} disabled={!quoteText.trim()}>
                        Post
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- POLL COMPONENT ---
const PollDisplay = ({ poll, postId, onVote, hasVoted }: { poll: PollType; postId: string; onVote: (optionId: string) => void; hasVoted: boolean }) => {
    const { loggedInUser } = useAppContext();
    const [selectedOption, setSelectedOption] = React.useState<string | null>(null);

    const userVotedOptions = poll.options.filter(opt =>
        loggedInUser && opt.votedBy.includes(loggedInUser.id)
    ).map(opt => opt.id);

    const hasUserVoted = userVotedOptions.length > 0;
    const isPollEnded = new Date(poll.endsAt) < new Date();
    const showResults = hasUserVoted || isPollEnded;

    const handleVote = (optionId: string) => {
        if (!hasUserVoted && !isPollEnded) {
            if (poll.allowMultipleChoices) {
                onVote(optionId);
            } else {
                setSelectedOption(optionId);
            }
        }
    };

    const submitVote = () => {
        if (selectedOption) {
            onVote(selectedOption);
            setSelectedOption(null);
        }
    };

    const winningVotes = Math.max(...poll.options.map(opt => opt.votes));

    return (
        <div className="mt-3 border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
                <h4 className="font-semibold text-sm">{poll.question}</h4>
                {isPollEnded && (
                    <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Ended
                    </Badge>
                )}
            </div>

            <div className="space-y-2">
                {poll.options.map((option) => {
                    const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
                    const isWinning = option.votes === winningVotes && winningVotes > 0;
                    const isSelected = selectedOption === option.id;
                    const isVotedByUser = userVotedOptions.includes(option.id);

                    return (
                        <div key={option.id} className="relative">
                            {showResults ? (
                                <div
                                    className={cn(
                                        "relative border rounded-lg p-3 overflow-hidden",
                                        isVotedByUser && "border-primary"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "absolute inset-0 transition-all",
                                            isWinning ? "bg-primary/20" : "bg-muted"
                                        )}
                                        style={{ width: `${percentage}%` }}
                                    />
                                    <div className="relative flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-medium",
                                                isVotedByUser && "text-primary"
                                            )}>
                                                {option.text}
                                            </span>
                                            {isVotedByUser && (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            )}
                                            {isWinning && !isPollEnded && (
                                                <TrendingUp className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{percentage.toFixed(1)}%</span>
                                            <span className="text-muted-foreground text-xs">
                                                {option.votes.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleVote(option.id)}
                                    className={cn(
                                        "w-full border rounded-lg p-3 text-left text-sm font-medium transition-all hover:bg-muted",
                                        isSelected && "border-primary bg-primary/10"
                                    )}
                                    disabled={isPollEnded}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option.text}</span>
                                        {isSelected && (
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {!showResults && selectedOption && !poll.allowMultipleChoices && (
                <Button onClick={submitVote} className="w-full" size="sm">
                    Vote
                </Button>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{poll.totalVotes.toLocaleString()} votes</span>
                <span>
                    {isPollEnded
                        ? 'Poll ended'
                        : `Ends ${formatDistanceToNow(new Date(poll.endsAt), { addSuffix: true })}`
                    }
                </span>
            </div>
        </div>
    );
};

// --- ENHANCED COMMENTS SHEET ---

const CommentsSheet = ({
    post,
    open,
    onOpenChange,
    onCommentSubmit,
    onCommentLikeToggle,
    onCommentPinToggle,
    onCommentHideToggle,
    onCommentDelete,
    isPostAuthor
}: {
    post: PostType;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCommentSubmit: (postId: string, text: string, parentId?: string) => void;
    onCommentLikeToggle: (postId: string, commentId: string, isReply?: boolean) => void;
    onCommentPinToggle: (postId: string, commentId: string) => void;
    onCommentHideToggle: (postId: string, commentId: string, isReply?: boolean) => void;
    onCommentDelete: (postId: string, commentId: string, isReply?: boolean, parentCommentId?: string) => void;
    isPostAuthor: boolean;
}) => {
    const { loggedInUser } = useAppContext();
    const [commentText, setCommentText] = React.useState('');
    const [replyingTo, setReplyingTo] = React.useState<CommentType | ReplyType | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [itemToDelete, setItemToDelete] = React.useState<{ id: string; isReply: boolean; parentId?: string } | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (replyingTo && inputRef.current) {
            setCommentText(`@${replyingTo.user.username} `);
            inputRef.current.focus();
        }
    }, [replyingTo]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedComment = commentText.replace(`@${replyingTo?.user.username} `, '').trim();
        if (!trimmedComment) return;

        onCommentSubmit(post.id, trimmedComment, replyingTo ? replyingTo.id : undefined);
        setCommentText('');
        setReplyingTo(null);
    };

    const handleDeleteClick = (commentId: string, isReply: boolean, parentId?: string) => {
        setItemToDelete({ id: commentId, isReply, parentId });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            onCommentDelete(post.id, itemToDelete.id, itemToDelete.isReply, itemToDelete.parentId);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const CommentItem = ({
        comment,
        onReply,
        isReply = false,
        parentCommentId
    }: {
        comment: CommentType | ReplyType;
        onReply: (c: CommentType | ReplyType) => void;
        isReply?: boolean;
        parentCommentId?: string;
    }) => {
        const isLiked = loggedInUser ? comment.likedBy.includes(loggedInUser.id) : false;
        const isCommentAuthor = loggedInUser?.id === comment.user.id;
        const canManage = isPostAuthor || isCommentAuthor;

        if (comment.isHidden && !isPostAuthor) {
            return null;
        }

        return (
            <div className="flex items-start gap-3 w-full group">
                <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={comment.user.avatar} />
                    <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm">
                                <Link href={`/profile/${encodeURIComponent(comment.user.username)}`} className="font-semibold hover:underline" prefetch={false}>
                                    {comment.user.username}
                                </Link>
                                <span className="ml-1.5">{comment.text}</span>
                            </p>
                            {comment.isHidden && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <EyeOff className="h-3 w-3" />
                                    Hidden from others
                                </span>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                {comment.likes > 0 && <span>{comment.likes} likes</span>}
                                <button onClick={() => onReply(comment)} className="font-semibold hover:text-foreground">
                                    Reply
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", isLiked && "text-red-500")}
                                onClick={() => onCommentLikeToggle(post.id, comment.id, isReply)}
                            >
                                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                            </Button>
                            {canManage && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {isPostAuthor && !isReply && (
                                            <>
                                                <DropdownMenuItem onClick={() => onCommentPinToggle(post.id, comment.id)}>
                                                    <Pin className="mr-2 h-4 w-4" />
                                                    {comment.isPinned ? 'Unpin' : 'Pin'} Comment
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onCommentHideToggle(post.id, comment.id, isReply)}>
                                                    {comment.isHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                                                    {comment.isHidden ? 'Unhide' : 'Hide'} Comment
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        <DropdownMenuItem
                                            className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                            onClick={() => handleDeleteClick(comment.id, isReply, parentCommentId)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const sortedComments = [...post.comments].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <>
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                itemType="comment"
            />
            <Sheet open={open} onOpenChange={(isOpen) => {
                if (!isOpen) setReplyingTo(null);
                onOpenChange(isOpen);
            }}>
                <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
                    <SheetHeader className="text-center p-4 border-b">
                        <SheetTitle>Comments</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {sortedComments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No comments yet</p>
                                <p className="text-sm">Be the first to comment!</p>
                            </div>
                        ) : (
                            sortedComments.map((comment: CommentType) => (
                                <div key={comment.id}>
                                    {comment.isPinned && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                            <Pin className="h-3 w-3" />
                                            <span>Pinned by {post.author.username}</span>
                                        </div>
                                    )}
                                    <CommentItem comment={comment} onReply={setReplyingTo} />
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="pl-12 mt-4 space-y-4 border-l-2 ml-4">
                                            {comment.replies.map((reply: ReplyType) => (
                                                <CommentItem
                                                    key={reply.id}
                                                    comment={reply}
                                                    onReply={setReplyingTo}
                                                    isReply={true}
                                                    parentCommentId={comment.id}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 border-t bg-background">
                        {replyingTo && (
                            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                                <span>Replying to @{replyingTo.user.username}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setCommentText('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                                <AvatarImage src={loggedInUser?.avatar_url} />
                                <AvatarFallback>{loggedInUser?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Input
                                ref={inputRef}
                                placeholder={replyingTo ? `Replying to ${replyingTo.user.username}...` : `Add a comment...`}
                                className="flex-1 rounded-full"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="rounded-full flex-shrink-0"
                                disabled={!commentText.trim()}
                            >
                                <SendHorizonal className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};

// --- CONTENT PARSING & MEDIA GRID ---

const parseContent = (content: string, onHareKrishnaClick: () => void) => {
    const regex = /(#\w+)|(https?:\/\/[^\s]+)|((?:Hare|HARE|hare)\s+(?:Krishna|KRISHNA|krishna|Kṛṣṇa))/gi;
    const elements: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            elements.push(content.substring(lastIndex, match.index));
        }

        const matchedText = match[0];
        const key = `${match.index}-${matchedText}`;

        if (matchedText.startsWith('#')) {
            elements.push(
                <Link key={key} href={`/explore/tags/${matchedText.substring(1)}`} className="text-primary hover:underline">
                    {matchedText}
                </Link>
            );
        } else if (matchedText.startsWith('http')) {
            elements.push(
                <a key={key} href={matchedText} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                    {matchedText}
                </a>
            );
        } else {
            elements.push(
                <span
                    key={key}
                    onClick={onHareKrishnaClick}
                    className="inline-block cursor-pointer transition-transform hover:scale-105 font-semibold"
                    style={{
                        background: 'linear-gradient(135deg, #0a4d68 0%, #1e8bc3 20%, #16c79a 40%, #11d3bc 60%, #7ee8fa 80%, #eaf9ff 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}
                >
                    {matchedText}
                </span>
            );
        }
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
        elements.push(content.substring(lastIndex));
    }

    return elements;
};

const MediaGrid = ({ media, onMediaClick }: { media: PostType['media'], onMediaClick: (index: number) => void }) => {
    if (!media || media.length === 0) return null;

    // Handle single video
    if (media.length === 1 && media[0].type === 'video') {
        return (
            <div className="mt-3 aspect-video rounded-2xl overflow-hidden border">
                <VideoPlayer src={media[0].url} />
            </div>
        );
    }

    // Handle single GIF
    if (media.length === 1 && media[0].type === 'gif') {
        return (
            <div className="mt-3 relative rounded-2xl overflow-hidden border cursor-pointer group" onClick={() => onMediaClick(0)}>
                <Image
                    src={media[0].url}
                    alt={media[0].alt || 'GIF'}
                    width={media[0].width || 500}
                    height={media[0].height || 300}
                    className="w-full h-auto object-cover"
                    unoptimized
                />
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-semibold">
                    GIF
                </div>
            </div>
        );
    }

    const images = media.filter(m => m.type === 'image' || m.type === 'gif');
    if (images.length === 0) return null;

    const renderImage = (item: MediaType, index: number, className = '') => (
        <div
            key={index}
            className={cn("relative bg-muted cursor-pointer overflow-hidden", className)}
            onClick={() => onMediaClick(index)}
        >
            <Image
                src={item.url}
                alt={item.alt || `Post media ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 50vw"
                unoptimized={item.type === 'gif'}
            />
            {item.type === 'gif' && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-semibold">
                    GIF
                </div>
            )}
        </div>
    );

    const containerClasses = "mt-3 rounded-2xl overflow-hidden border grid gap-0.5 group";

    switch (images.length) {
        case 1:
            return <div className={cn(containerClasses, "aspect-video")}>{renderImage(images[0], 0)}</div>;
        case 2:
            return <div className={cn(containerClasses, "grid-cols-2 aspect-video")}>{images.map((img, i) => renderImage(img, i))}</div>;
        case 3:
            return (
                <div className={cn(containerClasses, "grid-cols-2 grid-rows-2 aspect-video")}>
                    {renderImage(images[0], 0, "row-span-2")}
                    {renderImage(images[1], 1)}
                    {renderImage(images[2], 2)}
                </div>
            );
        default:
            const remainingCount = images.length - 4;
            return (
                <div className={cn(containerClasses, "grid-cols-2 grid-rows-2 aspect-video")}>
                    {images.slice(0, 3).map((img, i) => renderImage(img, i))}
                    <div className="relative bg-muted cursor-pointer overflow-hidden" onClick={() => onMediaClick(3)}>
                        <Image
                            src={images[3].url}
                            alt={images[3].alt || "Post media 4"}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, 50vw"
                            unoptimized={images[3].type === 'gif'}
                        />
                        {remainingCount > 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">+{remainingCount}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
    }
};

const ActionButton = ({
    icon: Icon,
    value,
    hoverColor,
    onClick,
    isActive
}: {
    icon: React.ElementType;
    value: number;
    hoverColor: string;
    onClick?: () => void;
    isActive?: boolean
}) => {
    return (
        <div className="flex items-center text-muted-foreground group">
            <Button
                variant="ghost"
                size="icon"
                onClick={onClick}
                className={cn(
                    "h-8 w-8 transition-colors",
                    `group-hover:${hoverColor}`,
                    isActive && hoverColor.replace('hover:', '')
                )}
            >
                <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
            </Button>
            <span className={cn(
                "text-xs pr-3 transition-colors",
                `group-hover:${hoverColor}`,
                isActive && hoverColor.replace('hover:', '')
            )}>
                {value > 0 ? value.toLocaleString() : ''}
            </span>
        </div>
    );
};

// --- POST SKELETON ---
export function PostSkeleton() {
    return (
        <div className="p-3 sm:p-4 border-b">
            <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <div className="flex gap-8">
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-8 w-12" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- MAIN POST CARD COMPONENT ---
export function PostCard({
    post,
    onComment,
    onDelete,
    onEdit,
    onLikeToggle,
    onSaveToggle,
    onCommentLikeToggle,
    onCommentPinToggle,
    onCommentHideToggle,
    onCommentDelete,
    onQuotePost,
    onRepost,
    onPollVote,
    onPromote
}: PostCardProps) {
    const { author, createdAt, content, media, stats, originalPost, editedAt, poll, isRepost, isPromoted } = post;
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();

    // State for all modals and dialogs
    const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
    const [isHareKrishnaVideoOpen, setIsHareKrishnaVideoOpen] = React.useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);
    const [imageViewerStartIndex, setImageViewerStartIndex] = React.useState(0);
    const [isReportOpen, setIsReportOpen] = React.useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = React.useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [showRepostMenu, setShowRepostMenu] = React.useState(false);

    // Computed states
    const isPostAuthor = loggedInUser?.id === author.id;
    const isLiked = loggedInUser ? post.likedBy.includes(loggedInUser.id) : false;
    const isSaved = loggedInUser ? post.savedBy.includes(loggedInUser.id) : false;
    const isReposted = loggedInUser ? post.repostedBy.includes(loggedInUser.id) : false;

    // Handlers
    const handleMediaClick = (index: number) => {
        setImageViewerStartIndex(index);
        setIsImageViewerOpen(true);
    };

    const handleReport = () => {
        setIsReportOpen(false);
        toast({
            title: "Report Submitted",
            description: "Thank you for helping keep our community safe."
        });
    };

    const handleQuote = (text: string) => {
        setIsQuoteOpen(false);
        onQuotePost(post.id, text);
    };

    const handleDelete = () => {
        setIsDeleteOpen(false);
        onDelete(post.id);
    };

    const handleEdit = (newContent: string) => {
        onEdit(post.id, newContent);
    };

    const handleSave = () => {
        onSaveToggle(post.id);
    };

    const handleLike = () => {
        onLikeToggle(post.id);
    };

    const handleRepost = () => {
        onRepost(post.id);
        setShowRepostMenu(false);
    };

    const handleRepostWithQuote = () => {
        setShowRepostMenu(false);
        setIsQuoteOpen(true);
    };

    return (
        <>
            {/* All Dialogs and Modals */}
            <ImageViewerDialog
                open={isImageViewerOpen}
                onOpenChange={setIsImageViewerOpen}
                media={media || []}
                startIndex={imageViewerStartIndex}
            />
            <HareKrishnaVideoModal
                isOpen={isHareKrishnaVideoOpen}
                onClose={() => setIsHareKrishnaVideoOpen(false)}
            />
            <ReportDialog
                open={isReportOpen}
                onOpenChange={setIsReportOpen}
                onReport={handleReport}
            />
            <QuotePostDialog
                post={post}
                open={isQuoteOpen}
                onOpenChange={setIsQuoteOpen}
                onQuote={handleQuote}
            />
            <DeleteConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                itemType="post"
            />
            <EditPostDialog
                post={post}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSave={handleEdit}
            />
            <CommentsSheet
                post={post}
                open={isCommentsOpen}
                onOpenChange={setIsCommentsOpen}
                onCommentSubmit={onComment}
                onCommentLikeToggle={onCommentLikeToggle}
                onCommentPinToggle={onCommentPinToggle}
                onCommentHideToggle={onCommentHideToggle}
                onCommentDelete={onCommentDelete}
                isPostAuthor={isPostAuthor}
            />

            {/* Post Card */}
            <article className="p-3 sm:p-4 border-b transition-colors hover:bg-muted/50">
                {/* Promoted Post Header */}
                {isPromoted && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 ml-12">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-green-500">Promoted</span>
                    </div>
                )}
                {/* Repost Header */}
                {isRepost && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 ml-12">
                        <Repeat2 className="h-4 w-4" />
                        <span className="font-semibold">{author.name} reposted</span>
                    </div>
                )}

                <div className="flex gap-3">
                    {/* START: Add this block for avatar stack */}
                    <div className="flex flex-shrink-0 -space-x-3">
                        {[post.author, ...(post.collaborators || [])].slice(0, 3).map((user, index) => (
                            <Link href={`/profile/${encodeURIComponent(user.username)}`} key={user.id} prefetch={false}>
                                <Avatar className="h-10 w-10 border-2 border-background" style={{ zIndex: 3 - index }}>
                                    <AvatarImage src={getAvatarUrl((user as any).avatar || (user as any).avatar_url)} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                        ))}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="flex items-baseline gap-x-2 text-sm flex-wrap min-w-0">

                                <div className="flex flex-wrap items-center gap-x-1.5 font-bold">
                                    {[post.author, ...(post.collaborators || [])].map((user, index, arr) => (
                                        <React.Fragment key={user.id}>
                                            <Link href={`/profile/${encodeURIComponent(user.username)}`} className="hover:underline" prefetch={false}>
                                                {user.name}
                                            </Link>
                                            {index === 0 && arr.length > 1 && <span className="font-medium text-muted-foreground">with</span>}
                                            {index > 0 && index < arr.length - 1 && <span className="font-medium text-muted-foreground">,</span>}
                                        </React.Fragment>
                                    ))}
                                    {post.author.verified && (
                                        <Image
                                            src="/user_Avatar/verified.png"
                                            alt="Verified User"
                                            width={16}
                                            height={16}
                                            className="inline-block"
                                            title="Verified"
                                            onContextMenu={(e) => e.preventDefault()}
                                            unoptimized
                                        />
                                    )}
                                </div>


                                <Link href={`/profile/${author.username}`} className="text-muted-foreground truncate hidden sm:inline">
                                    @{author.username}
                                </Link>
                                <span className="text-muted-foreground flex-shrink-0">·</span>
                                <time dateTime={createdAt} className="text-muted-foreground hover:underline flex-shrink-0 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                                </time>
                                {editedAt && (
                                    <>
                                        <span className="text-muted-foreground flex-shrink-0">·</span>
                                        <span className="text-muted-foreground text-xs flex-shrink-0">Edited</span>
                                    </>
                                )}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 flex-shrink-0">
                                        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleSave}>
                                        {isSaved ? (
                                            <>
                                                <BookmarkCheck className="mr-2 h-4 w-4" />
                                                <span>Unsave Post</span>
                                            </>
                                        ) : (
                                            <>
                                                <Bookmark className="mr-2 h-4 w-4" />
                                                <span>Save Post</span>
                                            </>
                                        )}
                                    </DropdownMenuItem>

                                    {isPostAuthor ? (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Edit Post</span>
                                            </DropdownMenuItem>
                                            {/* Add the new Promote button logic here */}
                                            {!post.isPromoted && (
                                                <DropdownMenuItem onClick={() => onPromote(post)}>
                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                    <span>Promote Post</span>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                                onClick={() => setIsDeleteOpen(true)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Delete Post</span>
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                                onClick={() => setIsReportOpen(true)}
                                            >
                                                <Flag className="mr-2 h-4 w-4" />
                                                <span>Report Post</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {content && (
                            <div className="whitespace-pre-wrap text-sm sm:text-base break-words mt-1">
                                {parseContent(content, () => setIsHareKrishnaVideoOpen(true))}
                            </div>
                        )}

                        {originalPost && <EmbeddedPost post={originalPost} />}

                        <MediaGrid media={media || []} onMediaClick={handleMediaClick} />

                        {poll && <PollDisplay poll={poll} postId={post.id} onVote={(optionId) => onPollVote(post.id, optionId)} hasVoted={false} />}
                        <div className="mt-3 -ml-2 flex items-center justify-between text-muted-foreground">
                            <ActionButton
                                icon={MessageCircle}
                                value={stats.comments}
                                hoverColor="text-primary"
                                onClick={() => setIsCommentsOpen(true)}
                            />

                            <DropdownMenu open={showRepostMenu} onOpenChange={setShowRepostMenu}>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center text-muted-foreground group">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 transition-colors group-hover:text-green-500",
                                                isReposted && "text-green-500"
                                            )}
                                        >
                                            <Repeat2 className="h-5 w-5" />
                                        </Button>
                                        <span className={cn(
                                            "text-xs pr-3 transition-colors group-hover:text-green-500",
                                            isReposted && "text-green-500"
                                        )}>
                                            {stats.reposts + stats.reshares > 0 ? (stats.reposts + stats.reshares).toLocaleString() : ''}
                                        </span>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={handleRepost}>
                                        <Repeat2 className="mr-2 h-4 w-4" />
                                        Repost
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleRepostWithQuote}>
                                        <Quote className="mr-2 h-4 w-4" />
                                        Quote
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <ActionButton
                                icon={Heart}
                                value={stats.likes}
                                hoverColor="text-red-500"
                                onClick={handleLike}
                                isActive={isLiked}
                            />
                            <ActionButton
                                icon={BarChart2}
                                value={stats.views}
                                hoverColor="text-sky-500"
                            />
                            <div className="flex items-center group">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary">
                                            <Share className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            const postUrl = `${window.location.origin}/${post.author.username}/post/${post.id}`;
                                            navigator.clipboard.writeText(postUrl);
                                            toast({ title: "Link copied to clipboard!" });
                                        }}>
                                            Copy link to post
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleSave}>
                                            {isSaved ? 'Remove from saved' : 'Save post'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </>
    );
}