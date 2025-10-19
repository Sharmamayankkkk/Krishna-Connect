
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MessageCircle,
    Repeat2,
    Heart,
    BarChart2,
    Share,
    MoreHorizontal,
    Pin,
    Bookmark,
    X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Simple types (add your actual types file back later)
interface PostType {
    id: string;
    author: { name: string; username: string; avatar: string; };
    createdAt: string;
    content: string;
    media?: { url: string; type: string; }[];
    stats: { comments: number; reshares: number; likes: number; views: number; };
    comments: CommentType[];
}

interface CommentType {
    id: string;
    user: { name: string; username: string; avatar: string; };
    text: string;
    likes: number;
    isPinned?: boolean;
}

interface PostCardProps {
    post: PostType;
    onComment: (postId: string, commentText: string, parentCommentId?: string) => void;
}

// Fullscreen video modal component
const HareKrishnaVideoModal = ({ isOpen, onClose, videoUrl }: { isOpen: boolean; onClose: () => void; videoUrl: string }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [videoError, setVideoError] = React.useState(false);

    React.useEffect(() => {
        if (isOpen && videoRef.current) {
            setVideoError(false);
            const video = videoRef.current;

            // Disable controls explicitly
            video.controls = false;

            // Play video
            video.play().catch((error) => {
                console.error('Video play error:', error);
                setVideoError(true);
            });

            // Request fullscreen
            if (video.requestFullscreen) {
                video.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
            } else if ((video as any).webkitRequestFullscreen) {
                (video as any).webkitRequestFullscreen();
            } else if ((video as any).mozRequestFullScreen) {
                (video as any).mozRequestFullScreen();
            } else if ((video as any).msRequestFullscreen) {
                (video as any).msRequestFullscreen();
            }
        }
    }, [isOpen]);

    const handleVideoEnd = () => {
        exitFullscreen();
        onClose();
    };

    const handleVideoError = () => {
        setVideoError(true);
    };

    const exitFullscreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => { });
        } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
        }
    };

    React.useEffect(() => {
        // Listen for fullscreen change events
        const handleFullscreenChange = () => {
            const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);

            // If user exits fullscreen manually, close the modal
            if (!isFullscreen && isOpen) {
                onClose();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
            {videoError ? (
                <div className="text-white text-center p-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/20"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <p className="text-xl mb-4">Video not found</p>
                    <p className="text-sm text-gray-400 mb-2">Please add your video to:</p>
                    <p className="text-sm text-blue-400 font-mono">public/text/krishna.mp4</p>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    src={videoUrl}
                    onEnded={handleVideoEnd}
                    onError={handleVideoError}
                    playsInline
                    style={{ visibility: 'visible', zIndex: 1000 }}
                />
            )}
        </div>
    );
};

const parseContent = (content: string, onHareKrishnaClick: () => void) => {
    const elements: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Extended regex to find hashtags, links, and all variations of "Hare Krishna"
    // Matches: Hare/HARE/hare, optional é, Krishna/KRISHNA/krishna with optional diacritics (ṛ, ṣ, ṇ, Ṛ, Ṣ, Ṇ)
    const regex = /(#\w+)|(https?:\/\/[^\s]+)|((?:Hare|HARE|hare|Haré|HARÉ|haré)\s+(?:Krishna|KRISHNA|krishna|Kṛṣṇa|KṚṢṆA|kṛṣṇa|Krsna|KRSNA|krsna|KṚSNA|Kṛsna))/gi;

    let match;
    while ((match = regex.exec(content)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            elements.push(content.substring(lastIndex, match.index));
        }

        const matchedText = match[0];

        if (matchedText.startsWith('#')) {
            elements.push(
                <Link
                    key={`link-${keyCounter++}`}
                    href={`/explore/tags/${matchedText.substring(1)}`}
                    className="text-primary hover:underline"
                >
                    {matchedText}
                </Link>
            );
        } else if (matchedText.startsWith('http')) {
            elements.push(
                <a
                    key={`link-${keyCounter++}`}
                    href={matchedText}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                >
                    {matchedText}
                </a>
            );
        } else if (/^(?:Hare|HARE|hare|Haré|HARÉ|haré)\s+(?:Krishna|KRISHNA|krishna|Kṛṣṇa|KṚṢṆA|kṛṣṇa|Krsna|KRSNA|krsna|KṚSNA|Kṛsna)/i.test(matchedText)) {
            elements.push(
                <span
                    key={`hk-${keyCounter++}`}
                    onClick={(e) => {
                        e.preventDefault();
                        onHareKrishnaClick();
                    }}
                    className="inline-block cursor-pointer transition-transform hover:scale-105 font-semibold"
                    style={{
                        background: 'linear-gradient(135deg, #0a4d68 0%, #1e8bc3 20%, #16c79a 40%, #11d3bc 60%, #7ee8fa 80%, #eaf9ff 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    {matchedText}
                </span>
            );
        }

        lastIndex = regex.lastIndex;
    }

    // Add any remaining text after the last match
    if (lastIndex < content.length) {
        elements.push(content.substring(lastIndex));
    }

    return elements;
};

const MediaGrid = ({ media, onMediaClick }: { media: PostType['media'], onMediaClick: (index: number) => void }) => {
    if (!media || media.length === 0) {
        return null;
    }

    if (media.length > 0 && media[0].type === 'video') {
        return (
            <div className="mt-3 aspect-video rounded-2xl overflow-hidden border cursor-pointer" onClick={() => onMediaClick(0)}>
                <video src={media[0].url} className="w-full h-full object-cover" />
            </div>
        );
    }

    // New layout for 3 images
    if (media.length === 3) {
        return (
            <div className="mt-3 grid grid-cols-2 grid-rows-2 gap-0.5 rounded-2xl overflow-hidden border aspect-[4/3]">
                <div className="row-span-2 relative cursor-pointer overflow-hidden" onClick={() => onMediaClick(0)}>
                    <img src={media[0].url} alt="Post media 1" className="w-full h-full object-cover" />
                </div>
                <div className="relative cursor-pointer overflow-hidden" onClick={() => onMediaClick(1)}>
                    <img src={media[1].url} alt="Post media 2" className="w-full h-full object-cover" />
                </div>
                <div className="relative cursor-pointer overflow-hidden" onClick={() => onMediaClick(2)}>
                    <img src={media[2].url} alt="Post media 3" className="w-full h-full object-cover" />
                </div>
            </div>
        );
    }

    const gridClasses: { [key: number]: string } = {
        1: 'grid-cols-1 grid-rows-1',
        2: 'grid-cols-2 grid-rows-1',
        4: 'grid-cols-2 grid-rows-2',
    };

    return (
        <div className={cn(
            "mt-3 grid gap-0.5 rounded-2xl overflow-hidden border",
            gridClasses[media.length] || 'grid-cols-2'
        )}>
            {media.map((item, index) => {
                return (
                    <div key={index} className={cn("relative bg-muted w-full cursor-pointer overflow-hidden", media.length === 1 ? 'aspect-video' : 'aspect-square')} onClick={() => onMediaClick(index)}>
                        <img src={item.url} alt={`Post media ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                );
            })}
        </div>
    );
};

const CommentInput = ({ onCommentSubmit, placeholder = "Write a comment...", buttonText = "Comment", onCancel, autoFocus = false, loggedInUser }: { onCommentSubmit: (commentText: string) => void; placeholder?: string; buttonText?: string; onCancel?: () => void; autoFocus?: boolean; loggedInUser: any }) => {
    const [commentText, setCommentText] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (autoFocus) {
            inputRef.current?.focus();
        }
    }, [autoFocus]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        onCommentSubmit(commentText);
        setCommentText('');
        if (onCancel) onCancel();
    };

    if (!loggedInUser) return null;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-start gap-3 mt-4 pt-4 border-t">
            <div className="flex items-start gap-3 w-full">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={loggedInUser.avatar_url} />
                    <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Input
                    ref={inputRef}
                    placeholder={placeholder}
                    className="flex-1 rounded-full bg-muted"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2 w-full pl-12">
                {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
                <Button type="submit" size="sm" disabled={!commentText.trim()}>{buttonText}</Button>
            </div>
        </form>
    );
}

const CommentsSection = ({ post, onCommentSubmit, isCommentsOpen, loggedInUser }: { post: PostType; onCommentSubmit: (postId: string, commentText: string, parentCommentId?: string) => void, isCommentsOpen: boolean; loggedInUser: any }) => {
    const [replyingToCommentId, setReplyingToCommentId] = React.useState<string | null>(null);

    const pinnedComment = post.comments.find(c => c.isPinned);
    const regularComments = post.comments.filter(c => !c.isPinned);

    const sortedRegularComments = regularComments.sort((a, b) => new Date(b.id.split('_')[1]).getTime() - new Date(a.id.split('_')[1]).getTime());

    const sortedComments = pinnedComment ? [pinnedComment, ...sortedRegularComments] : sortedRegularComments;

    const handleReply = (commentId: string) => {
        setReplyingToCommentId(commentId);
    }

    const handleCancelReply = () => {
        setReplyingToCommentId(null);
    }

    const handleReplySubmit = (commentText: string) => {
        onCommentSubmit(post.id, commentText, replyingToCommentId!);
        setReplyingToCommentId(null);
    }

    if (!isCommentsOpen) return null;

    return (
        <div className="mt-4 space-y-4 pt-4 border-t">
            {sortedComments.map(comment => (
                <div key={comment.id}>
                    <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Link href={`/profile/${comment.user.username}`} className="font-semibold hover:underline">{comment.user.name}</Link>
                                    <span className="text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                                    {comment.isPinned && <Pin className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Heart className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs font-semibold">{comment.likes > 0 ? comment.likes : ''}</span>
                                </div>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                            <div className="flex items-center gap-4 mt-1">
                                <button className="text-xs text-muted-foreground font-semibold" onClick={() => handleReply(comment.id)}>Reply</button>
                                <button className="text-xs text-muted-foreground font-semibold">See translation</button>
                            </div>
                        </div>
                    </div>
                    {replyingToCommentId === comment.id && (
                        <div className="pl-12">
                            <CommentInput
                                onCommentSubmit={handleReplySubmit}
                                placeholder={`Replying to ${comment.user.name}...`}
                                buttonText="Reply"
                                onCancel={handleCancelReply}
                                autoFocus={true}
                                loggedInUser={loggedInUser}
                            />
                        </div>
                    )}
                </div>
            ))}

            {replyingToCommentId === null && <CommentInput onCommentSubmit={(commentText) => onCommentSubmit(post.id, commentText)} loggedInUser={loggedInUser} />}
        </div>
    );
};

export function PostCard({ post, onComment }: PostCardProps) {
    const { author, createdAt, content, media, stats } = post;
    const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
    const [isHareKrishnaVideoOpen, setIsHareKrishnaVideoOpen] = React.useState(false);

    // Mock logged in user - replace with your actual user context
    const loggedInUser = { name: "User", avatar_url: "" };

    const handleMediaClick = (index: number) => {
        console.log('Media clicked:', index);
    };

    const handleHareKrishnaClick = () => {
        setIsHareKrishnaVideoOpen(true);
    };

    return (
        <>
            <HareKrishnaVideoModal
                isOpen={isHareKrishnaVideoOpen}
                onClose={() => setIsHareKrishnaVideoOpen(false)}
                videoUrl="/text/krishna.mp4"
            />
            <article className="p-4 transition-colors hover:bg-muted/50">
                <div className="flex gap-3 sm:gap-4">
                    <Link href={`/profile/${author.username}`}>
                        <Avatar className="h-10 w-10 sm:h-11 sm:w-11">
                            <AvatarImage src={author.avatar} alt={author.name} />
                            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                <Link href={`/profile/${author.username}`} className="font-bold hover:underline">{author.name}</Link>
                                <span className="text-muted-foreground hidden sm:inline">@{author.username}</span>
                                <span className="text-muted-foreground">·</span>
                                <time dateTime={createdAt} className="text-muted-foreground hover:underline">
                                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                                </time>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <Bookmark className="mr-2 h-4 w-4" />
                                        <span>Save Post</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="whitespace-pre-wrap text-base">
                            {parseContent(content, handleHareKrishnaClick)}
                        </div>

                        <MediaGrid media={media} onMediaClick={handleMediaClick} />

                        <div className="mt-4 flex items-center justify-between text-muted-foreground max-w-sm">
                            <ActionButton
                                icon={MessageCircle}
                                value={stats.comments}
                                hoverColor="hover:text-primary"
                                onClick={() => setIsCommentsOpen(prev => !prev)}
                                isActive={isCommentsOpen}
                            />
                            <ActionButton icon={Repeat2} value={stats.reshares} hoverColor="hover:text-green-500" />
                            <ActionButton icon={Heart} value={stats.likes} hoverColor="hover:text-red-500" />
                            <ActionButton icon={BarChart2} value={stats.views} hoverColor="hover:text-primary" />
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary"><Share className="h-5 w-5" /></Button>
                        </div>

                        <CommentsSection post={post} onCommentSubmit={onComment} isCommentsOpen={isCommentsOpen} loggedInUser={loggedInUser} />

                    </div>
                </div>
            </article>
        </>
    );
}

const ActionButton = ({ icon: Icon, value, hoverColor, onClick, isActive }: { icon: React.ElementType, value: number, hoverColor: string, onClick?: () => void, isActive?: boolean }) => (
    <Button variant="ghost" size="sm" onClick={onClick} className={cn("flex items-center gap-1.5 p-1.5 sm:p-2 sm:gap-2 text-muted-foreground", hoverColor, isActive && "text-primary")}>
        <Icon className="h-5 w-5" />
        <span className="text-xs sm:text-sm">{value > 0 ? value : ''}</span>
    </Button>
)
