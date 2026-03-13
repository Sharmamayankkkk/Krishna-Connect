'use client'

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, X } from 'lucide-react';
import type { Message } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { getAvatarUrl } from '@/lib/utils';

import { useTranslation } from 'react-i18next';

interface StarredMessagesDialogProps {
  messages: Message[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJumpToMessage: (messageId: number) => void;
  onUnstarMessage: (messageId: number) => void;
}

export function StarredMessagesDialog({
    messages,
    open,
    onOpenChange,
    onJumpToMessage,
    onUnstarMessage,
}: StarredMessagesDialogProps) {
  const { t } = useTranslation();


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />{t('starred.title')}</DialogTitle>
          <DialogDescription>{t('chat.messagesYouHaveStarredInThis')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full mt-4">
          <div className="space-y-4 pr-4">
             {messages.length > 0 ? (
                messages.map(message => (
                    <div key={message.id} className="group relative text-sm p-3 rounded-lg border bg-muted/50 cursor-pointer hover:bg-muted" onClick={() => onJumpToMessage(message.id as number)}>
                        <div className="flex justify-between items-start">
                             <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={getAvatarUrl(message.profiles?.avatar_url)} />
                                    <AvatarFallback>{message.profiles?.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{message.profiles?.name || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUnstarMessage(message.id as number);
                                }}
                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="mt-2 text-foreground/80 line-clamp-3">
                            {typeof message.content === 'string' ? message.content : 'Attachment'}
                        </p>
                    </div>
                ))
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t('chat.noStarredMessagesYet')}</p>
                    <p className="text-xs mt-1">{t('chat.starImportantMessagesToFindThem')}</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
