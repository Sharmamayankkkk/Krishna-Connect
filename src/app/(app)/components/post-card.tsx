'use client';

import * as React from 'react';
import Image from 'next/image';
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
  Bookmark
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { PostType, CommentType } from '../data';
import { cn } from '@/lib/utils';
import { VideoPlayer } from './video-player';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ImageViewerDialog } from './image-viewer';
import { useAppContext } from '@/providers/app-provider';
import { HareKrishnaTrigger } from './hare-krishna-trigger';

interface PostCardProps {
  post: PostType;
  onComment: (postId: string, commentText: string, parentCommentId?: string) => void;
}

const parseContent = (content: string) => {
    const elements: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    // Regex to find "Hare Krishna", hashtags, and links
    const regex = /(Hare Krishna)|(#\w+)|(https?:\/\/[^\s]+)/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            elements.push(content.substring(lastIndex, match.index));
        }

        const matchedText = match[0];

        if (matchedText === "Hare Krishna") {
            elements.push(<HareKrishnaTrigger key={lastIndex} />);
        } else if (matchedText.startsWith('#')) {
            elements.push(<Link key={lastIndex} href={`/explore/tags/${matchedText.substring(1)}`} className="text-primary hover:underline">{matchedText}</Link>);
        } else if (matchedText.startsWith('http')) {
            elements.push(<a key={lastIndex} href={matchedText} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{matchedText}</a>);
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
                <VideoPlayer src={media[0].url} />
            </div>
        );
    }
    
    // New layout for 3 images
    if (media.length === 3) {
      return (
        <div className="mt-3 grid grid-cols-2 grid-rows-2 gap-0.5 rounded-2xl overflow-hidden border aspect-[4/3]">
          <div className="row-span-2 relative cursor-pointer" onClick={() => onMediaClick(0)}>
            <Image src={media[0].url} alt="Post media 1" fill className="object-cover" />
          </div>
          <div className="relative cursor-pointer" onClick={() => onMediaClick(1)}>
            <Image src={media[1].url} alt="Post media 2" fill className="object-cover" />
          </div>
          <div className="relative cursor-pointer" onClick={() => onMediaClick(2)}>
            <Image src={media[2].url} alt="Post media 3" fill className="object-cover" />
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
                    <div key={index} className={cn("relative bg-muted w-full cursor-pointer", media.length === 1 ? 'aspect-video' : 'aspect-square')} onClick={() => onMediaClick(index)}>
                         <Image src={item.url} alt={`Post media ${index + 1}`} fill className="object-cover" />
                    </div>
                );
            })}
        </div>
    );
};

const CommentInput = ({ onCommentSubmit, placeholder = "Write a comment...", buttonText = "Comment", onCancel, autoFocus = false }: { onCommentSubmit: (commentText: string) => void; placeholder?: string; buttonText?: string; onCancel?: () => void; autoFocus?: boolean }) => {
    const { loggedInUser } = useAppContext();
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

const CommentsSection = ({ post, onCommentSubmit, isCommentsOpen }: { post: PostType; onCommentSubmit: (postId: string, commentText: string, parentCommentId?: string) => void, isCommentsOpen: boolean }) => {
    const [replyingToCommentId, setReplyingToCommentId] = React.useState<string | null>(null);

    const pinnedComment = post.comments.find(c => c.isPinned);
    const regularComments = post.comments.filter(c => !c.isPinned);
    
    // Sort regular comments with newest first
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
                            />
                        </div>
                    )}
                </div>
            ))}
            
            {replyingToCommentId === null && <CommentInput onCommentSubmit={(commentText) => onCommentSubmit(post.id, commentText)} />}
        </div>
    );
};

export function PostCard({ post, onComment }: PostCardProps) {
  const { author, createdAt, content, media, stats } = post;
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);
  const [imageViewerStartIndex, setImageViewerStartIndex] = React.useState(0);
  const { toast } = useToast();

  const handleSavePost = () => {
    // In a real app, this would save to a DB. For now, just a toast.
    toast({
        title: "Post Saved!",
        description: "You can view your saved posts in a future update."
    });
  };

  const handleMediaClick = (index: number) => {
    setImageViewerStartIndex(index);
    setIsImageViewerOpen(true);
  };

  return (
    <>
    <ImageViewerDialog
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
        media={media}
        startIndex={imageViewerStartIndex}
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
                <DropdownMenuItem onClick={handleSavePost}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>Save Post</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="whitespace-pre-wrap text-base">
            {parseContent(content)}
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

          <CommentsSection post={post} onCommentSubmit={onComment} isCommentsOpen={isCommentsOpen} />

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
