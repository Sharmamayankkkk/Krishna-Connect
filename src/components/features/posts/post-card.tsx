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
    PinOff,
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
    TrendingUp,
    Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn, getAvatarUrl } from '@/lib/utils';
import { PollType, PostType, CommentType, ReplyType, MediaType } from '@/lib/types';
import { VideoPlayer } from '../media/video-player';
import { ImageViewerDialog } from '../media/image-viewer';
import { EditPostDialog } from './dialogs/edit-post-dialog';
import { RepostedByDialog } from './dialogs/reposted-by-dialog';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { CommentSheet as CommentsSheet } from '@/app/(app)/explore/components/comment-sheet';
import { PromotePostDialog } from './dialogs/promote-post-dialog';

interface PostCardProps {
    post: PostType;
    isDetailView?: boolean;
    onComment: (postId: string, commentText: string, parentCommentId?: string) => void;
    onDelete: (postId: string) => void;
    onEdit: (updatedPost: PostType) => void;
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
    onPin?: (postId: string) => void;
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

const ReportDialog = ({ open, onOpenChange, onReport }: { open: boolean; onOpenChange: (open: boolean) => void; onReport: () => void }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report Post</DialogTitle>
                    <DialogDescription>
                        Why are you reporting this post?
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">Select a reason:</p>
                    <div className="grid gap-2">
                        {['Spam', 'Inappropriate Content', 'Harassment', 'Misinformation'].map((reason) => (
                            <Button key={reason} variant="outline" className="justify-start" onClick={onReport}>
                                {reason}
                            </Button>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const QuotePostDialog = ({ post, open, onOpenChange, onQuote }: { post: PostType; open: boolean; onOpenChange: (open: boolean) => void; onQuote: (text: string) => void }) => {
    const [text, setText] = React.useState('');
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Quote Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="border rounded-md p-3 bg-muted/50 text-sm text-muted-foreground">
                        <p className="font-semibold">{post.author.name}</p>
                        <p className="line-clamp-2">{post.content}</p>
                    </div>
                    <Textarea
                        placeholder="Add a comment..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => { onQuote(text); setText(''); }}>Post Quote</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Simplified QuoteDialog alias to match likely usage
const QuoteDialog = QuotePostDialog;


// --- MEDIA COMPONENTS ---
const MediaGrid = ({ media, onMediaClick }: { media: MediaType[], onMediaClick: (index: number) => void }) => {
    if (!media || media.length === 0) return null;

    return (
        <div className={cn(
            "grid gap-1 mt-3 rounded-lg overflow-hidden border",
            media.length === 1 ? "grid-cols-1" : "grid-cols-2",
            media.length >= 3 && "grid-rows-2"
        )}>
            {media.map((m, index) => (
                <div
                    key={index}
                    className={cn(
                        "relative bg-muted",
                        media.length === 3 && index === 0 ? "row-span-2" : "",
                        "aspect-video"
                    )}
                >
                    {m.type === 'image' ? (
                        <div
                            className="w-full h-full cursor-pointer overflow-hidden group/image"
                            onClick={(e) => { e.stopPropagation(); onMediaClick(index); }}
                        >
                            <Image
                                src={m.url}
                                alt={m.alt || 'Post media'}
                                fill
                                className="object-cover transition-transform duration-500 group-hover/image:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    ) : (
                        <VideoPlayer src={m.url} poster={m.thumbnailUrl} />
                    )}
                </div>
            ))}
        </div>
    );
};

const EmbeddedPost = ({ post }: { post: Pick<PostType, 'author' | 'createdAt' | 'content' | 'media'> }) => {
    if (!post) return null;
    return (
        <div className="mt-3 border rounded-xl overflow-hidden bg-card/50 hover:bg-card transition-colors cursor-pointer group/embedded">
            <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={getAvatarUrl(post.author.avatar)} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 text-sm">
                        <span className="font-semibold hover:underline">{post.author.name}</span>
                        <span className="text-muted-foreground">@{post.author.username}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(post.createdAt))}</span>
                    </div>
                </div>
                <div className="text-sm line-clamp-3">
                    <RichTextRenderer content={post.content} />
                </div>
                {post.media && post.media.length > 0 && (
                    <div className="mt-2 h-32 relative rounded-md overflow-hidden bg-muted">
                        {post.media[0].type === 'image' ? (
                            <Image src={post.media[0].url} alt="" fill className="object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                                <div className="bg-black/50 p-2 rounded-full"><div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" /></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


// --- POLL COMPONENT ---
const PollDisplay = ({ poll, postId, onVote, hasVoted }: { poll: PollType, postId: string, onVote: (optId: string) => void, hasVoted: boolean }) => {
    if (!poll) return null;
    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);

    return (
        <div className="mt-3 space-y-2">
            {poll.options.map((option) => {
                const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                return (
                    <div key={option.id} className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); onVote(option.id); }}
                            disabled={hasVoted}
                            className={cn(
                                "relative w-full text-left p-3 rounded-md border transition-all overflow-hidden z-10",
                                hasVoted ? "cursor-default" : "hover:bg-muted/50"
                            )}
                        >
                            <span className="relative z-10 font-medium">{option.text}</span>
                            {hasVoted && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 z-10 font-bold">
                                    {percentage}%
                                </span>
                            )}
                        </button>
                        {hasVoted && (
                            <div
                                className="absolute top-0 left-0 h-full bg-primary/10 rounded-md z-0 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            />
                        )}
                    </div>
                );
            })}
            <div className="text-xs text-muted-foreground mt-1 px-1">
                {totalVotes} votes · {formatDistanceToNow(new Date(poll.endsAt)) === 'less than a minute' ? 'Ends soon' : `${formatDistanceToNow(new Date(poll.endsAt))} left`}
            </div>
        </div>
    );
};


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
    onPromote,
    onPin
}: PostCardProps) {
    const { author, createdAt, content, media, stats = { likes: 0, comments: 0, reposts: 0, reshares: 0, views: 0, bookmarks: 0 }, originalPost, editedAt, poll, isRepost, isPromoted } = post;
    const { loggedInUser } = useAppContext();
    const { requireAuth } = useAuthGuard();
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
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isRepostedByOpen, setIsRepostedByOpen] = React.useState(false);
    const [isPromoteOpen, setIsPromoteOpen] = React.useState(false);

    // Truncation settings for Read More feature
    const MAX_CONTENT_LENGTH = 280;

    // Computed states
    const isPostAuthor = loggedInUser?.id === author.id;
    const isLiked = loggedInUser && post.likedBy ? post.likedBy.includes(loggedInUser.id) : false;
    const isSaved = loggedInUser && post.savedBy ? post.savedBy.includes(loggedInUser.id) : false;
    const isReposted = loggedInUser && post.repostedBy ? post.repostedBy.includes(loggedInUser.id) : false;

    // Handlers
    const handlePromote = () => {
        setIsPromoteOpen(true);
    };

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

    const handleSave = () => {
        requireAuth(() => onSaveToggle(post.id), "Log in to bookmark");
    };

    const handleLike = () => {
        requireAuth(() => onLikeToggle(post.id), "Log in to like");
    };

    const handleRepost = () => {
        requireAuth(() => {
            onRepost(post.id);
            setShowRepostMenu(false);
        }, "Log in to repost");
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
            <QuoteDialog
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

            <PromotePostDialog
                post={post}
                open={isPromoteOpen}
                onOpenChange={setIsPromoteOpen}
            />
            <CommentsSheet
                post={post}
                open={isCommentsOpen}
                onOpenChange={setIsCommentsOpen}
                onComment={onComment}
            />

            {/* Post Card */}
            <article className="p-3 sm:p-4 border-b transition-colors hover:bg-muted/50">
                {/* Pinned Post Header */}
                {post.isPinned && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 ml-12">
                        <Pin className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">Pinned</span>
                    </div>
                )}
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
                        {[post.author, ...(Array.isArray(post.collaborators) ? post.collaborators : [])]
                            .filter(user => user && user.username) // Only show users with valid data
                            .slice(0, 3)
                            .map((user, index) => (
                                <Link href={`/profile/${encodeURIComponent(user.username)}`} key={user.id || index} prefetch={false}>
                                    <Avatar className="h-10 w-10 border-2 border-background" style={{ zIndex: 3 - index }}>
                                        <AvatarImage src={getAvatarUrl((user as any)?.avatar || (user as any)?.avatar_url)} alt={user.name || 'User'} />
                                        <AvatarFallback>{(user.name?.charAt(0) || '?').toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Link>
                            ))}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="flex items-baseline gap-x-2 text-sm flex-wrap min-w-0">

                                <div className="flex flex-wrap items-center gap-x-1.5 font-bold">
                                    {[post.author, ...(Array.isArray(post.collaborators) ? post.collaborators : [])]
                                        .filter(user => user && user.username) // Only show users with valid data
                                        .map((user, index, arr) => (
                                            <React.Fragment key={user.id || index}>
                                                <Link href={`/profile/${encodeURIComponent(user.username)}`} className="hover:underline" prefetch={false}>
                                                    {user.name || 'Unknown'}
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
                                        />
                                    )}
                                    {post.isPromoted && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                            Promoted
                                        </span>
                                    )}
                                </div>


                                <Link href={`/profile/${author.username}`} className="text-muted-foreground truncate hidden sm:inline">
                                    @{author.username}
                                </Link>
                                <span className="text-muted-foreground flex-shrink-0">·</span>
                                <Link href={`/profile/${author.username}/post/${post.id}`} className="text-muted-foreground hover:underline flex-shrink-0 whitespace-nowrap">
                                    <time dateTime={createdAt}>
                                        {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                                    </time>
                                </Link>
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
                                            {onPin && (
                                                <DropdownMenuItem onClick={() => onPin(post.id)}>
                                                    {post.isPinned ? (
                                                        <>
                                                            <PinOff className="mr-2 h-4 w-4" />
                                                            <span>Unpin from Profile</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Pin className="mr-2 h-4 w-4" />
                                                            <span>Pin to Profile</span>
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                            )}
                                            {/* Add the new Promote button logic here */}
                                            {!post.isPromoted && (
                                                <DropdownMenuItem onClick={handlePromote}>
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
                                            <DropdownMenuItem onClick={() => setIsReportOpen(true)}>
                                                <Flag className="mr-2 h-4 w-4" />
                                                <span>Report Post</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Post Content */}
                        <div className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap break-words">
                            {content.length > MAX_CONTENT_LENGTH && !isExpanded ? (
                                <>
                                    <RichTextRenderer
                                        content={content.substring(0, MAX_CONTENT_LENGTH) + '...'}
                                        onHareKrishnaClick={() => setIsHareKrishnaVideoOpen(true)}
                                    />
                                    <button
                                        onClick={() => setIsExpanded(true)}
                                        className="text-primary hover:underline font-medium ml-1"
                                    >
                                        Read more
                                    </button>
                                </>
                            ) : (
                                <>
                                    <RichTextRenderer
                                        content={content}
                                        onHareKrishnaClick={() => setIsHareKrishnaVideoOpen(true)}
                                    />
                                    {content.length > MAX_CONTENT_LENGTH && (
                                        <button
                                            onClick={() => setIsExpanded(false)}
                                            className="text-primary hover:underline font-medium ml-1"
                                        >
                                            Show less
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Polls */}
                        {post.poll && (
                            <PollDisplay
                                poll={post.poll}
                                postId={post.id}
                                onVote={(optId) => onPollVote(post.id, optId)}
                                hasVoted={false}
                            />
                        )}

                        {/* Media Grid */}
                        <MediaGrid media={media || []} onMediaClick={handleMediaClick} />

                        {/* Embedded Post */}
                        {originalPost && <EmbeddedPost post={originalPost} />}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between mt-4 -ml-2 text-muted-foreground">
                            {/* Comment */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hover:text-blue-500 rounded-full group"
                                onClick={() => setIsCommentsOpen(true)}
                                aria-label={`${stats.comments || 0} comments. Click to view comments`}
                            >
                                <MessageCircle className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                                <span className="text-xs">{stats.comments || 0}</span>
                            </Button>

                            {/* Repost */}
                            <DropdownMenu open={showRepostMenu} onOpenChange={setShowRepostMenu}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "rounded-full group",
                                            isReposted ? "text-green-500" : "hover:text-green-500"
                                        )}
                                        aria-label={isReposted ? "Undo repost" : "Repost options"}
                                    >
                                        <Repeat2 className="h-4 w-4 mr-1.5 group-hover:rotate-180 transition-transform" />
                                        <span className="text-xs">{(stats.reshares || 0) + (stats.reposts || 0)}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleRepost}>
                                        <Repeat2 className="mr-2 h-4 w-4" />
                                        Repost
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleRepostWithQuote}>
                                        <Quote className="mr-2 h-4 w-4" />
                                        Quote Post
                                    </DropdownMenuItem>
                                    {(stats.reposts || 0) > 0 && (
                                        <DropdownMenuItem onClick={() => { setShowRepostMenu(false); setIsRepostedByOpen(true); }}>
                                            <Users className="mr-2 h-4 w-4" />
                                            See who reposted
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Like */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-full group",
                                    isLiked ? "text-red-500" : "hover:text-red-500"
                                )}
                                onClick={handleLike}
                                aria-label={isLiked ? `Unlike. ${stats.likes || 0} likes` : `Like. ${stats.likes || 0} likes`}
                            >
                                <Heart className={cn(
                                    "h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform",
                                    isLiked && "fill-current"
                                )} />
                                <span className="text-xs">{stats.likes || 0}</span>
                            </Button>

                            {/* Views */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hover:text-primary rounded-full group hidden sm:flex"
                                aria-label={`${stats.views?.toLocaleString() || 0} views`}
                            >
                                <BarChart2 className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                                <span className="text-xs">{stats.views?.toLocaleString() || 0}</span>
                            </Button>

                            {/* Share */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full h-8 w-8 group/action"
                                        aria-label="Share post"
                                    >
                                        <Share className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                        const postUrl = `${window.location.origin}/profile/${author.username}/post/${post.id}`;
                                        navigator.clipboard.writeText(postUrl);
                                        toast({ title: "Link copied to clipboard!" });
                                    }}>
                                        Copy Link
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </article>

            {/* Dialogs */}
            <DeleteConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
            />

            <EditPostDialog
                post={post}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onPostUpdated={onEdit}
            />

            <ReportDialog
                open={isReportOpen}
                onOpenChange={setIsReportOpen}
                onReport={handleReport}
            />

            <HareKrishnaVideoModal
                isOpen={isHareKrishnaVideoOpen}
                onClose={() => setIsHareKrishnaVideoOpen(false)}
            />

            <ImageViewerDialog
                open={isImageViewerOpen}
                onOpenChange={setIsImageViewerOpen}
                media={media || []}
                startIndex={imageViewerStartIndex}
            />

            <RepostedByDialog
                open={isRepostedByOpen}
                onOpenChange={setIsRepostedByOpen}
                postId={post.id}
                initialCount={(stats.reposts || 0)}
            />

            <QuoteDialog
                post={post}
                open={isQuoteOpen}
                onOpenChange={setIsQuoteOpen}
                onQuote={handleQuote}
            />
        </>
    );
}

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

const ActionButton = ({ icon: Icon, value = 0, hoverColor, onClick, isActive }: any) => {
    return (
        <div
            onClick={(e) => {
                e.preventDefault();
                onClick?.();
            }}
            className={cn(
                "flex items-center gap-1.5 text-sm transition-colors cursor-pointer group p-2 -ml-2 rounded-full hover:bg-muted/50",
                isActive && hoverColor,
                !isActive && `hover:${hoverColor}`
            )}
        >
            <Icon className={cn("h-4 w-4", isActive && "fill-current")} />
            <span className={cn(
                "font-medium tabular-nums",
                isActive && hoverColor.replace('hover:', '')
            )}>
                {value > 0 ? value.toLocaleString() : ''}
            </span>
        </div>
    );
};