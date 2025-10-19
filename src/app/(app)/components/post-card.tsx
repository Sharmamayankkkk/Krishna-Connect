
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Repeat2,
  Heart,
  BarChart2,
  Share,
  MoreHorizontal,
  Pin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { PostType } from '../data';
import { cn } from '@/lib/utils';
import { VideoPlayer } from './video-player';

interface PostCardProps {
  post: PostType;
}

const parseContent = (content: string) => {
    const parts = content.split(/(#\w+)/g);
    return parts.map((part, index) => {
        if (part.startsWith('#')) {
            return <Link key={index} href={`/explore/tags/${part.substring(1)}`} className="text-primary hover:underline">{part}</Link>;
        }
        return part;
    });
};

const MediaGrid = ({ media }: { media: PostType['media'] }) => {
    if (!media || media.length === 0) {
        return null;
    }

    if (media.length > 0 && media[0].type === 'video') {
        return (
            <div className="mt-3 aspect-video rounded-2xl overflow-hidden border">
                <VideoPlayer src={media[0].url} />
            </div>
        );
    }

    const gridClasses: { [key: number]: string } = {
        1: 'grid-cols-1 grid-rows-1',
        2: 'grid-cols-2 grid-rows-1',
        3: 'grid-cols-2 grid-rows-2',
        4: 'grid-cols-2 grid-rows-2',
    };

    return (
        <div className={cn(
            "mt-3 grid gap-0.5 rounded-2xl overflow-hidden border",
            gridClasses[media.length] || 'grid-cols-2'
        )}>
            {media.map((item, index) => {
                let itemClass = '';
                 if (media.length === 3 && index === 0) {
                    itemClass = 'row-span-2';
                }
                
                return (
                    <div key={index} className={cn("relative bg-muted w-full", itemClass, media.length === 1 ? 'aspect-video' : 'aspect-square')}>
                         <Image src={item.url} alt={`Post media ${index + 1}`} fill className="object-cover" />
                    </div>
                );
            })}
        </div>
    );
};

const CommentsSection = ({ comments, stats }: { comments: PostType['comments'], stats: PostType['stats'] }) => {
    if (!comments || comments.length === 0) {
        return null;
    }

    const pinnedComment = comments.find(c => c.isPinned);
    const otherComments = comments.filter(c => !c.isPinned).slice(0, 2);
    const commentsToShow = pinnedComment ? [pinnedComment, ...comments.filter(c => c.id !== pinnedComment.id).slice(0, 1)] : otherComments;

    return (
        <div className="mt-4 space-y-4 pt-4 border-t">
            {commentsToShow.map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="bg-muted rounded-xl px-3 py-2">
                           <div className="flex items-center justify-between">
                                <Link href={`/profile/${comment.user.username}`} className="font-semibold text-sm hover:underline">{comment.user.name}</Link>
                                {comment.isPinned && (
                                     <div className="flex items-center gap-1.5 text-yellow-500">
                                        <Pin className="h-3.5 w-3.5" />
                                        <span className="text-xs font-semibold">Pinned</span>
                                    </div>
                                )}
                           </div>
                            <p className="text-sm">{comment.text}</p>
                        </div>
                         <div className="flex items-center gap-4 px-3 pt-1">
                            <Button variant="link" size="sm" className="text-xs text-muted-foreground p-0 h-auto">Reply</Button>
                            <Button variant="link" size="sm" className="text-xs text-muted-foreground p-0 h-auto flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5" />
                                {comment.likes > 0 && <span>{comment.likes}</span>}
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
            {stats.comments > commentsToShow.length && (
                 <Button variant="link" size="sm" className="text-muted-foreground">View all {stats.comments} comments</Button>
            )}
        </div>
    );
};


export function PostCard({ post }: PostCardProps) {
  const { author, createdAt, content, media, stats, comments } = post;
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);

  return (
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
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          <div className="whitespace-pre-wrap text-base">
            {parseContent(content)}
          </div>
          
          <MediaGrid media={media} />

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

          {isCommentsOpen && <CommentsSection comments={comments} stats={stats} />}

        </div>
      </div>
    </article>
  );
}

const ActionButton = ({ icon: Icon, value, hoverColor, onClick, isActive }: { icon: React.ElementType, value: number, hoverColor: string, onClick?: () => void, isActive?: boolean }) => (
    <Button variant="ghost" size="sm" onClick={onClick} className={cn("flex items-center gap-1.5 p-1.5 sm:p-2 sm:gap-2 text-muted-foreground", hoverColor, isActive && "text-primary")}>
        <Icon className="h-5 w-5" />
        <span className="text-xs sm:text-sm">{value > 0 ? value : ''}</span>
    </Button>
)
