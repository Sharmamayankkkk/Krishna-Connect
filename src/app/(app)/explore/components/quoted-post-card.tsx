'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Post } from '@/lib';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface QuotedPostCardProps {
  post?: Post | null;
}

export function QuotedPostCard({ post }: QuotedPostCardProps) {
  if (!post) {
    return (
      <div className="border rounded-xl p-3 mt-2 text-sm text-muted-foreground">
        This post is no longer available.
      </div>
    );
  }

  const postDate = new Date(post.created_at);
  const formattedDate = format(postDate, "MMM d, yyyy");
  const firstMedia = post.media_urls?.[0];

  return (
    <Link 
      href={`/post/${post.id}`} // <-- UPDATE THIS LINE
      onClick={(e) => e.stopPropagation()} 
      className="block border rounded-xl mt-2 overflow-hidden hover:bg-accent/30 transition-colors"
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={post.author.avatar_url} alt={post.author.name} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm truncate">{post.author.name}</span>
          <span className="text-sm text-muted-foreground truncate">@{post.author.username}</span>
          <span className="text-sm text-muted-foreground">· {formattedDate}</span>
        </div>
        {post.content && (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-3">
            {post.content}
          </p>
        )}
      </div>
      {firstMedia && firstMedia.type === 'image' && (
        <div className="relative aspect-video w-full border-t">
          <Image
            src={firstMedia.url}
            alt="Quoted post media"
            fill
            className="object-cover"
          />
        </div>
      )}
    </Link>
  );
}