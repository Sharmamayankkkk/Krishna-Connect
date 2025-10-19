
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
    const gridClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-2 grid-rows-2',
        4: 'grid-cols-2 grid-rows-2',
    };

    if (media.length > 0 && media[0].type === 'video') {
        return (
            <div className="mt-3 aspect-video rounded-2xl overflow-hidden border">
                <VideoPlayer src={media[0].url} />
            </div>
        );
    }

    return (
        <div className={cn("mt-3 grid gap-0.5 rounded-2xl overflow-hidden border", gridClasses[media.length as keyof typeof gridClasses] || 'grid-cols-2')}>
            {media.map((item, index) => {
                let itemClass = '';
                if (media.length === 3 && index === 0) itemClass = 'row-span-2';
                
                return (
                    <div key={index} className={cn("relative aspect-video bg-muted", itemClass)}>
                         <Image src={item.url} alt={`Post media ${index + 1}`} fill className="object-cover" />
                    </div>
                );
            })}
        </div>
    );
};

export function PostCard({ post }: PostCardProps) {
  const { author, createdAt, content, media, stats } = post;

  return (
    <article className="p-4 transition-colors hover:bg-muted/50">
      <div className="flex gap-4">
        <Link href={`/profile/${author.username}`}>
            <Avatar className="h-11 w-11">
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
          
          {media.length > 0 && <MediaGrid media={media} />}

          <div className="mt-4 flex items-center justify-between text-muted-foreground max-w-sm">
            <ActionButton icon={MessageCircle} value={stats.comments} hoverColor="hover:text-primary" />
            <ActionButton icon={Repeat2} value={stats.reshares} hoverColor="hover:text-green-500" />
            <ActionButton icon={Heart} value={stats.likes} hoverColor="hover:text-red-500" />
            <ActionButton icon={BarChart2} value={stats.views} hoverColor="hover:text-primary" />
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary"><Share className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>
    </article>
  );
}

const ActionButton = ({ icon: Icon, value, hoverColor }: { icon: React.ElementType, value: number, hoverColor: string }) => (
    <Button variant="ghost" size="sm" className={cn("flex items-center gap-2 text-muted-foreground", hoverColor)}>
        <Icon className="h-5 w-5" />
        <span className="text-sm">{value > 0 ? value : ''}</span>
    </Button>
)
