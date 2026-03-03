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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
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
    CheckCircle,
    XCircle,
    TrendingUp,
    Users,
    Loader2,
    Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn, getAvatarUrl, formatNumber, getOptimizedImageUrl } from '@/lib/utils';
import { PollType, PostType, CommentType, ReplyType, MediaType } from '@/lib/types';
import { VideoPlayer } from '../media/video-player';
import { ImageViewerDialog } from '../media/image-viewer';
import { EditPostDialog } from './dialogs/edit-post-dialog';
import { RepostedByDialog } from './dialogs/reposted-by-dialog';
import { useAppContext } from '@/providers/app-provider';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { CommentSheet as CommentsSheet } from '@/app/(app)/explore/components/comment-sheet';
import { PromotePostDialog } from './dialogs/promote-post-dialog';
import { SharePostDialog } from './dialogs/share-post-dialog';
import { LikedByDialog } from './dialogs/liked-by-dialog';
import { VerificationBadge } from "@/components/shared/verification-badge";
import { AutoLinkPreview } from './auto-link-preview';
import { QrCodeOverlay } from '../media/qr-code-overlay';
import { LikeAnimation } from '@/components/shared/like-animation';

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
    onView?: (postId: string | number) => void;
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

// --- ADD TO COLLECTION DIALOG ---
import { useCollections, useAddToCollection, useCreateCollection } from '@/app/(app)/bookmarks/hooks/useCollections';
import { Label } from "@/components/ui/label";
import { Check } from 'lucide-react';

const AddToCollectionDialog = ({ post, open, onOpenChange }: { post: PostType; open: boolean; onOpenChange: (open: boolean) => void }) => {
    const { data: collections, isLoading } = useCollections();
    const { mutate: addToCollection } = useAddToCollection();
    const { mutate: createCollection } = useCreateCollection();
    const [newCollectionName, setNewCollectionName] = React.useState('');
    const [isCreating, setIsCreating] = React.useState(false);

    const handleCreate = () => {
        if (!newCollectionName.trim()) return;
        createCollection({ name: newCollectionName, isPrivate: true }, {
            onSuccess: (newId) => {
                addToCollection({ collectionId: newId.toString(), postId: post.id });
                setNewCollectionName('');
                setIsCreating(false);
                onOpenChange(false);
                // Toast handled by mutation or global? adding one here just in case
            }
        });
    };

    const handleAddToCollection = (collectionId: string) => {
        addToCollection({ collectionId, postId: post.id }, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add to Collection</DialogTitle>
                    <DialogDescription>
                        Save this post to one of your collections.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {collections && collections.length > 0 ? (
                                collections.map(collection => (
                                    <Button
                                        key={collection.id}
                                        variant="outline"
                                        className="w-full justify-between font-normal"
                                        onClick={() => handleAddToCollection(collection.id)}
                                    >
                                        <span>{collection.name}</span>
                                        <span className="text-xs text-muted-foreground">{collection.post_count} posts</span>
                                    </Button>
                                ))
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-2">No collections yet.</p>
                            )}
                        </div>
                    )}

                    <div className="border-t pt-4">
                        {isCreating ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Collection Name"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    className="h-9"
                                />
                                <Button size="sm" onClick={handleCreate} disabled={!newCollectionName.trim()}>Add</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                            </div>
                        ) : (
                            <Button variant="ghost" className="w-full justify-start text-primary" onClick={() => setIsCreating(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Collection
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};



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
                            className="w-full h-full cursor-pointer overflow-hidden group/image relative"
                            onClick={(e) => { e.stopPropagation(); onMediaClick(index); }}
                        >
                            <Image
                                src={getOptimizedImageUrl(m.url, { width: 1080, quality: 75 }) || m.url}
                                alt={m.alt || 'Post media'}
                                fill
                                className="object-cover transition-transform duration-500 group-hover/image:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <QrCodeOverlay imageUrl={m.url} />
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
const PollDisplay = ({ poll, postId, onVote, hasVoted, userId }: { poll: PollType, postId: string, onVote: (optId: string) => void, hasVoted: boolean, userId?: string }) => {
    const [showVoters, setShowVoters] = React.useState<string | null>(null);
    if (!poll) return null;
    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
    const isQuiz = poll.isQuiz === true;
    const correctAnswerId = poll.correctAnswerId;
    const userVotedOptionId = poll.options.find(opt => opt.votedBy?.includes(userId || ''))?.id;

    return (
        <div className="mt-3 space-y-2">
            {poll.question && (
                <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-sm">{poll.question}</p>
                    {isQuiz && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">Quiz</span>}
                </div>
            )}
            {poll.options.map((option) => {
                const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                const isSelected = option.id === userVotedOptionId;
                const isCorrect = isQuiz && correctAnswerId === option.id;
                const isWrong = isQuiz && hasVoted && isSelected && !isCorrect;

                return (
                    <div key={option.id} className="space-y-1">
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); onVote(option.id); }}
                                disabled={hasVoted}
                                className={cn(
                                    "relative w-full text-left p-3 rounded-lg border-2 transition-all overflow-hidden",
                                    hasVoted
                                        ? isCorrect
                                            ? "border-green-500 bg-green-500/5"
                                            : isWrong
                                                ? "border-red-500 bg-red-500/5"
                                                : isSelected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border"
                                        : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                                )}
                            >
                                {/* Progress bar background */}
                                {hasVoted && (
                                    <div
                                        className={cn(
                                            "absolute top-0 left-0 h-full rounded-lg transition-all duration-700 ease-out",
                                            isCorrect ? "bg-green-500/15" : isWrong ? "bg-red-500/15" : isSelected ? "bg-primary/15" : "bg-muted/50"
                                        )}
                                        style={{ width: `${percentage}%` }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {/* Selection indicator */}
                                        <div className={cn(
                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                            hasVoted && isSelected
                                                ? isCorrect ? "border-green-500 bg-green-500" : isWrong ? "border-red-500 bg-red-500" : "border-primary bg-primary"
                                                : hasVoted && isCorrect
                                                    ? "border-green-500 bg-green-500"
                                                    : "border-muted-foreground/30"
                                        )}>
                                            {((hasVoted && isSelected) || (hasVoted && isCorrect)) && (
                                                <CheckCircle2 className="h-3 w-3 text-white" />
                                            )}
                                        </div>
                                        <span className={cn("font-medium text-sm", isSelected && "font-semibold")}>{option.text}</span>
                                    </div>
                                    {hasVoted && (
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={cn(
                                                "text-sm font-bold tabular-nums",
                                                isCorrect ? "text-green-600" : isWrong ? "text-red-500" : isSelected ? "text-primary" : "text-muted-foreground"
                                            )}>
                                                {percentage}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Voters for this option - clickable count */}
                        {hasVoted && option.votes > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowVoters(showVoters === option.id ? null : option.id); }}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors pl-7"
                            >
                                {option.votes} vote{option.votes !== 1 ? 's' : ''} {showVoters === option.id ? '▾' : '▸'}
                            </button>
                        )}

                        {/* Voter avatars (expanded) */}
                        {showVoters === option.id && option.votedBy && option.votedBy.length > 0 && (
                            <VotersList voterIds={option.votedBy} />
                        )}
                    </div>
                );
            })}

            {/* Quiz result feedback */}
            {isQuiz && hasVoted && (
                <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                    userVotedOptionId === correctAnswerId
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : "bg-red-500/10 text-red-700 dark:text-red-400"
                )}>
                    {userVotedOptionId === correctAnswerId
                        ? <><CheckCircle className="h-4 w-4 inline mr-1" />Correct!</>
                        : <><XCircle className="h-4 w-4 inline mr-1" />Wrong answer</>
                    }
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 px-1">
                <span className="font-medium">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                <span>{formatDistanceToNow(new Date(poll.endsAt)) === 'less than a minute' ? 'Ends soon' : `${formatDistanceToNow(new Date(poll.endsAt))} left`}</span>
            </div>
        </div>
    );
};

// Mini component to show voters for a poll option
const VotersList = ({ voterIds }: { voterIds: string[] }) => {
    const [voters, setVoters] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchVoters = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('profiles')
                .select('id, name, username, avatar_url, verified')
                .in('id', voterIds.slice(0, 20));
            setVoters(data || []);
            setLoading(false);
        };
        fetchVoters();
    }, [voterIds]);

    if (loading) return <div className="pl-7 text-xs text-muted-foreground">Loading...</div>;

    return (
        <div className="pl-7 space-y-1.5 py-1 animate-in slide-in-from-top-2 duration-200">
            {voters.map(voter => (
                <Link key={voter.id} href={`/profile/${voter.username}`} className="flex items-center gap-2 hover:bg-muted/50 rounded-md px-2 py-1 transition-colors">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={getAvatarUrl(voter.avatar_url)} />
                        <AvatarFallback className="text-[10px]">{voter.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate">{voter.name}</span>
                    <span className="text-xs text-muted-foreground truncate">@{voter.username}</span>
                </Link>
            ))}
            {voterIds.length > 20 && (
                <p className="text-xs text-muted-foreground pl-2">+{voterIds.length - 20} more</p>
            )}
        </div>
    );
};


// --- MAIN POST CARD COMPONENT ---
export const PostCard = React.memo(function PostCard({
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
    onPin,
    onView
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
    const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);

    const [isLikedByDialogOpen, setIsLikedByDialogOpen] = React.useState(false);
    const [isAddToCollectionOpen, setIsAddToCollectionOpen] = React.useState(false);
    const [showLikeAnimation, setShowLikeAnimation] = React.useState(false);
    const lastTapRef = React.useRef(0);

    // Truncation settings for Read More feature
    const MAX_CONTENT_LENGTH = 280;

    // ... (rest of the state and hooks)

    // Handlers
    // ...

    // Computed states
    const isPostAuthor = loggedInUser?.id === author.id;
    const isLiked = loggedInUser && post.likedBy ? post.likedBy.includes(loggedInUser.id) : false;
    const isSaved = loggedInUser && post.savedBy ? post.savedBy.includes(loggedInUser.id) : false;
    const isReposted = loggedInUser && post.repostedBy ? post.repostedBy.includes(loggedInUser.id) : false;

    // View Counting Logic
    const hasLoggedView = React.useRef(false);
    const cardRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        if (hasLoggedView.current || !post.id || !onView) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    hasLoggedView.current = true;
                    onView(post.id);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 } // 50% of the card must be visible
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [post.id, onView]);

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

    const DOUBLE_TAP_THRESHOLD_MS = 300;
    const LIKE_ANIMATION_DURATION_MS = 800;

    const handleLike = () => {
        requireAuth(() => {
            onLikeToggle(post.id);
            if (!isLiked) {
                setShowLikeAnimation(true);
                setTimeout(() => setShowLikeAnimation(false), LIKE_ANIMATION_DURATION_MS);
            }
        }, "Log in to like");
    };

    const handleDoubleTapLike = () => {
        const now = Date.now();
        if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD_MS) {
            if (!isLiked) {
                handleLike();
            }
            setShowLikeAnimation(true);
            setTimeout(() => setShowLikeAnimation(false), LIKE_ANIMATION_DURATION_MS);
        }
        lastTapRef.current = now;
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
            <LikedByDialog
                open={isLikedByDialogOpen}
                onOpenChange={setIsLikedByDialogOpen}
                postId={post.id}
            />
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
            <AddToCollectionDialog
                post={post}
                open={isAddToCollectionOpen}
                onOpenChange={setIsAddToCollectionOpen}
            />

            {/* Post Card */}
            <article ref={cardRef} className="p-4 sm:p-5 transition-all duration-200 hover:bg-muted/30">
                {/* Pinned Post Header */}
                {post.isPinned && (
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1 ml-12">
                        <Pin className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-primary">Pinned</span>
                    </div>
                )}
                {/* Promoted Post Header */}
                {isPromoted && (
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1 ml-12">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">Promoted</span>
                    </div>
                )}
                {/* Repost Header */}
                {isRepost && (
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1 ml-12">
                        <Repeat2 className="h-3 w-3" />
                        <span>{author.name} reposted</span>
                    </div>
                )}

                <div className="block sm:flex gap-4">
                    {/* Avatar Column */}
                    <div className="hidden sm:flex flex-col items-center">
                        {/* Avatar Stack logic... */}
                        <div className="flex flex-shrink-0 -space-x-3 isolate"> {/* added isolate for z-index stacking context */}
                            {[post.author, ...(Array.isArray(post.collaborators) ? post.collaborators : [])]
                                .filter(user => user && user.username)
                                .slice(0, 3)
                                .map((user, index) => (
                                    <Link href={`/profile/${encodeURIComponent(user.username)}`} key={user.id || index} prefetch={false} className="relative transition-transform hover:scale-110 hover:z-10">
                                        <Avatar className="h-10 w-10 border-2 border-background ring-1 ring-border/20" style={{ zIndex: 3 - index }}>
                                            <AvatarImage src={getAvatarUrl((user as any)?.avatar || (user as any)?.avatar_url)} alt={user.name || 'User'} />
                                            <AvatarFallback>{(user.name?.charAt(0) || '?').toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                ))}
                        </div>
                        {/* Thread line could go here if we want a threaded look */}
                    </div>


                    <div className="flex-1 min-w-0">
                        {/* Header Row */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-baseline gap-x-2 text-sm flex-wrap min-w-0 leading-tight">
                                {/* Mobile Avatar */}
                                <div className="sm:hidden mr-2 self-center">
                                    {[post.author, ...(Array.isArray(post.collaborators) ? post.collaborators : [])]
                                        .filter(user => user && user.username)
                                        .slice(0, 1) // Only show primary author/first collaborator on mobile to save space
                                        .map((user, index) => (
                                            <Link href={`/profile/${encodeURIComponent(user.username)}`} key={user.id || index} prefetch={false}>
                                                <Avatar className="h-8 w-8 border border-border/50">
                                                    <AvatarImage src={getAvatarUrl((user as any)?.avatar || (user as any)?.avatar_url)} alt={user.name || 'User'} />
                                                    <AvatarFallback>{(user.name?.charAt(0) || '?').toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                        ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-1 font-bold text-base text-foreground">
                                    {[post.author, ...(Array.isArray(post.collaborators) ? post.collaborators : [])]
                                        .filter(user => user && user.username)
                                        .map((user, index, arr) => (
                                            <React.Fragment key={user.id || index}>
                                                <Link href={`/profile/${encodeURIComponent(user.username)}`} className="hover:underline decoration-2 decoration-primary/50" prefetch={false}>
                                                    {user.name || 'Unknown'}
                                                </Link>
                                                {index === 0 && arr.length > 1 && <span className="font-normal text-muted-foreground text-sm mx-1">with</span>}
                                                {index > 0 && index < arr.length - 1 && <span className="font-normal text-muted-foreground">,</span>}
                                            </React.Fragment>
                                        ))}
                                    <VerificationBadge verified={post.author.verified} size={16} className="ml-0.5 inline-block align-middle" />
                                    {post.isPromoted && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary ring-1 ring-inset ring-primary/20 uppercase tracking-wide">
                                            Ad
                                        </span>
                                    )}
                                </div>


                                <Link href={`/profile/${author.username}`} className="text-muted-foreground text-sm hover:text-foreground transition-colors truncate hidden sm:inline">
                                    @{author.username}
                                </Link>
                                <span className="text-muted-foreground/50 text-xs flex-shrink-0">•</span>
                                <Link href={`/profile/${author.username}/post/${post.id}`} className="text-muted-foreground text-sm hover:underline flex-shrink-0 whitespace-nowrap hover:text-primary transition-colors">
                                    <time dateTime={createdAt}>
                                        {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                                    </time>
                                </Link>
                                {editedAt && (
                                    <>
                                        <span className="text-muted-foreground/50 text-xs flex-shrink-0">•</span>
                                        <span className="text-muted-foreground text-xs flex-shrink-0 italic">Edited</span>
                                    </>
                                )}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground/50 hover:text-foreground transition-colors">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="animate-in fade-in zoom-in-95 duration-200">
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            {isSaved ? (
                                                <>
                                                    <BookmarkCheck className="mr-2 h-4 w-4 text-primary" />
                                                    <span className="text-primary font-medium">Saved</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Bookmark className="mr-2 h-4 w-4" />
                                                    <span>Save Post</span>
                                                </>
                                            )}
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={handleSave}>
                                                    {isSaved ? (
                                                        <span>Remove from Bookmarks</span>
                                                    ) : (
                                                        <span>Save to Bookmarks</span>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Add to Collection</DropdownMenuLabel>
                                                {/* We need to fetch collections here. Since PostCard is a dumb component, 
                                                    we should probably lift this up or use a hook inside PostCard. 
                                                    Given existing restrictions, I'll add a 'AddToCollectionDialog' triggered here.
                                                 */}
                                                <DropdownMenuItem onSelect={(e) => {
                                                    e.preventDefault();
                                                    // Trigger a new dialog state for adding to collection
                                                    // For now, let's just make the parent handle it by adding a new prop? 
                                                    // No, let's use the hook directly in a new Dialog component inside PostCard.
                                                    setIsAddToCollectionOpen(true);
                                                }}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add to Collection...
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>

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
                                                    <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                                                    <span className="text-green-500 font-medium">Promote Post</span>
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

                        {/* Post Content + Media (with double-tap to like) */}
                        <div className="relative" onClick={handleDoubleTapLike}>
                        <LikeAnimation show={showLikeAnimation} />

                        {/* Post Content */}
                        <div className="mt-1 text-[15px] sm:text-base text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                            {content && content.length > MAX_CONTENT_LENGTH && !isExpanded ? (
                                <>
                                    <RichTextRenderer
                                        content={content.substring(0, MAX_CONTENT_LENGTH) + '...'}
                                        onHareKrishnaClick={() => setIsHareKrishnaVideoOpen(true)}
                                    />
                                    <button
                                        onClick={() => setIsExpanded(true)}
                                        className="text-primary hover:underline font-medium ml-1 text-sm"
                                    >
                                        Read more
                                    </button>
                                </>
                            ) : (
                                <>
                                    <RichTextRenderer
                                        content={content || ''}
                                        onHareKrishnaClick={() => setIsHareKrishnaVideoOpen(true)}
                                    />
                                    {content && content.length > MAX_CONTENT_LENGTH && (
                                        <button
                                            onClick={() => setIsExpanded(false)}
                                            className="text-primary hover:underline font-medium ml-1 text-sm"
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
                                hasVoted={post.poll.options.some(opt => opt.votedBy?.includes(loggedInUser?.id || ''))}
                                userId={loggedInUser?.id}
                            />
                        )}

                        {/* Media Grid */}
                        <div className="mt-3">
                            <MediaGrid media={media || []} onMediaClick={handleMediaClick} />
                        </div>
                        </div>

                        {/* Embedded Post */}
                        {originalPost && <EmbeddedPost post={originalPost} />}

                        {/* Link Preview */}
                        {content && !post.poll && <AutoLinkPreview content={content} />}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between mt-4">
                            {/* Comment */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="group flex items-center gap-1 sm:gap-1.5 hover:bg-blue-500/10 hover:text-blue-500 transition-colors rounded-full px-2 sm:px-3"
                                onClick={() => setIsCommentsOpen(true)}
                                aria-label={`${stats.comments || 0} comments. Click to view comments`}
                            >
                                <div className="p-1 sm:p-1.5 rounded-full group-hover:bg-blue-500/20 transition-colors">
                                    <MessageCircle className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-medium tabular-nums">{formatNumber(stats.comments || 0)}</span>
                            </Button>

                            {/* Repost */}
                            <DropdownMenu open={showRepostMenu} onOpenChange={setShowRepostMenu}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "group flex items-center gap-1 sm:gap-1.5 transition-colors rounded-full px-2 sm:px-3",
                                            isReposted ? "text-green-500 bg-green-500/10" : "hover:bg-green-500/10 hover:text-green-500"
                                        )}
                                        aria-label={isReposted ? "Undo repost" : "Repost options"}
                                    >
                                        <div className={cn("p-1 sm:p-1.5 rounded-full transition-colors", isReposted ? "bg-green-500/20" : "group-hover:bg-green-500/20")}>
                                            <Repeat2 className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-medium tabular-nums">{formatNumber((stats.reshares || 0) + (stats.reposts || 0))}</span>
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
                            <div className="flex items-center group">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 transition-colors",
                                        isLiked ? "text-pink-600 bg-pink-50 dark:bg-pink-950" : "hover:bg-pink-500/10 hover:text-pink-500"
                                    )}
                                    onClick={handleLike}
                                    aria-label={isLiked ? `Unlike. ${stats.likes || 0} likes` : `Like. ${stats.likes || 0} likes`}
                                >
                                    <div className={cn("p-1 sm:p-1.5 rounded-full transition-colors", isLiked ? "bg-pink-100 dark:bg-pink-900" : "group-hover:bg-pink-500/20")}>
                                        <Heart className={cn(
                                            "h-4 w-4 transition-all duration-300",
                                            isLiked ? "fill-current scale-110" : "group-hover:scale-110"
                                        )} />
                                    </div>
                                    {(stats.likes || 0) > 0 && (
                                        <span
                                            onClick={(e) => { e.stopPropagation(); setIsLikedByDialogOpen(true); }}
                                            className={cn(
                                                "text-xs font-medium tabular-nums hover:underline",
                                                isLiked ? "font-bold" : ""
                                            )}
                                        >
                                            {formatNumber(stats.likes)}
                                        </span>
                                    )}
                                </Button>
                            </div>

                            {/* Views */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="group flex items-center gap-1 sm:gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors rounded-full px-2 sm:px-3"
                                aria-label={`${stats.views?.toLocaleString() || 0} views`}
                            >
                                <div className="p-1 sm:p-1.5 rounded-full group-hover:bg-primary/20 transition-colors">
                                    <BarChart2 className="h-4 w-4" />
                                </div>
                                {(stats.views || 0) > 0 && (
                                    <span className="text-xs font-medium tabular-nums">{formatNumber(stats.views!)}</span>
                                )}
                            </Button>

                            {/* Share */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="group flex items-center gap-1 sm:gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors rounded-full px-2 sm:px-3 -mr-2"
                                aria-label="Share post"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsShareDialogOpen(true);
                                }}
                            >
                                <div className="p-1 sm:p-1.5 rounded-full group-hover:bg-primary/20 transition-colors">
                                    <Share className="h-4 w-4" />
                                </div>
                            </Button>
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

            <PromotePostDialog
                post={post}
                open={isPromoteOpen}
                onOpenChange={setIsPromoteOpen}
            />

            <SharePostDialog
                post={post}
                open={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
            />
        </>
    );
});

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