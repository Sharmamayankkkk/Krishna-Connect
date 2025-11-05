'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/providers/app-provider';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QuotedPostCard } from './quoted-post-card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function QuotePostDialog() {
  const { loggedInUser, postToQuote, closeQuoteDialog, createQuotePost } = useAppContext();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  const handlePost = async () => {
    if (!postToQuote) return;

    setIsPosting(true);
    try {
      await createQuotePost(content, postToQuote);
      setContent('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error creating quote post',
        description: error.message,
      });
    } finally {
      setIsPosting(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setContent('');
      setIsPosting(false);
      closeQuoteDialog();
    }
  }

  if (!loggedInUser || !postToQuote) {
    return null;
  }

  return (
    <Dialog open={!!postToQuote} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Quote Post</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
          <div className="flex gap-3 pt-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={loggedInUser.avatar_url} alt={loggedInUser.name} />
              <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Add your own thoughts..."
                className="border-none focus-visible:ring-0 shadow-none p-0 text-lg resize-none"
                minRows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPosting}
              />
              
              <QuotedPostCard post={postToQuote} />
            
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-1 text-primary">
              {/* Icons can be added later */}
            </div>
            <Button onClick={handlePost} disabled={isPosting}>
              {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}