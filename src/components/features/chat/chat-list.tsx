
'use client';

import { getAvatarUrl } from '@/lib/utils';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, PlusCircle, MessageSquarePlus, MoreVertical, Pin, PinOff, User, Users, Image as ImageIcon, Mic } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Chat } from '@/lib/types';
import { useAppContext } from '@/providers/app-provider';
import { CreateGroupDialog } from './dialogs/create-group-dialog';
import { NewChatDialog } from './dialogs/new-chat-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatListProps {
  chats: Chat[];
}

function formatChatTime(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getLastMessagePreview(chat: Chat): string {
  const lastMsg = chat.last_message_content;
  if (!lastMsg) return 'No messages yet';
  if (lastMsg.length > 40) return lastMsg.substring(0, 40) + '...';
  return lastMsg;
}

export function ChatList({ chats }: ChatListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { loggedInUser } = useAppContext();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = React.useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);
  const [pinnedChatIds, setPinnedChatIds] = React.useState<number[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);


  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Fetch pinned chats on mount
  React.useEffect(() => {
    const fetchPinnedChats = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_pinned_chat_ids');

      if (!error && data) {
        setPinnedChatIds(data.map((row: any) => row.chat_id));
      }
      setIsLoading(false);
    };

    fetchPinnedChats();
  }, []);

  const handleTogglePin = async (chatId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const supabase = createClient();
    const { data, error } = await supabase.rpc('toggle_pin_chat', {
      p_chat_id: chatId
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to toggle pin",
        variant: "destructive"
      });
      return;
    }

    if (data?.success) {
      // Update local state
      if (data.is_pinned) {
        setPinnedChatIds([...pinnedChatIds, chatId]);
      } else {
        setPinnedChatIds(pinnedChatIds.filter(id => id !== chatId));
      }

      toast({
        title: data.is_pinned ? "📌 Chat pinned" : "Chat unpinned",
        description: data.message
      });
    }
  };

  const handleViewProfile = (chat: Chat, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (chat.type === 'dm') {
      const partner = getChatPartner(chat);
      if (partner?.id) {
        router.push(`/profile/${partner.id}`);
        if (isMobile) setOpenMobile(false);
      }
    }
  };

  const getChatPartner = (chat: Chat) => {
    if (!loggedInUser || chat.type !== 'dm') return null;
    const partner = chat.participants?.find(p => p.user_id !== loggedInUser.id);
    return partner?.profiles ?? null;
  }

  const getChatDisplayInfo = (chat: Chat) => {
    if (chat.type === 'dm') {
      const partner = getChatPartner(chat);
      return {
        name: partner?.name || "DM Chat",
        avatar: getAvatarUrl(partner?.avatar_url) || "https://placehold.co/100x100.png",
        partnerId: partner?.id
      };
    }
    return {
      name: chat.name || "Group Chat",
      avatar: chat.avatar_url || "https://placehold.co/100x100.png",
      partnerId: null
    };
  }

  const filteredChats = React.useMemo(() => {
    if (!searchQuery) return chats;

    const lowercasedQuery = searchQuery.toLowerCase();
    return chats.filter(chat => {
      const info = getChatDisplayInfo(chat);
      return info.name.toLowerCase().includes(lowercasedQuery);
    });
  }, [chats, searchQuery, loggedInUser]);

  // Sort chats: pinned first, then by most recent
  const sortedChats = React.useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      const aIsPinned = pinnedChatIds.includes(a.id);
      const bIsPinned = pinnedChatIds.includes(b.id);

      // Pinned chats come first
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;

      // Sort by last message timestamp, then by ID
      const aTime = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0;
      const bTime = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return b.id - a.id;
    });
  }, [filteredChats, pinnedChatIds]);

  return (
    <div className="flex h-full flex-col">
      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} />
      <NewChatDialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
      <div className="relative flex items-center gap-2 mb-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 rounded-full" onClick={() => setIsNewChatOpen(true)}>
                <MessageSquarePlus className="h-5 w-5" />
                <span className="sr-only">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Chat</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 rounded-full" onClick={() => setIsCreateGroupOpen(true)}>
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Create Group</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Create Group</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Pinned section header */}
      {sortedChats.some(c => pinnedChatIds.includes(c.id)) && (
        <div className="px-2 mb-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pinned</p>
        </div>
      )}

      <ScrollArea className="flex-1 -mx-2">
        <div className="px-2 space-y-0.5">
          {sortedChats.length > 0 ? (
            <>
              {sortedChats.map((chat, index) => {
                const { name, avatar, partnerId } = getChatDisplayInfo(chat);
                const isPinned = pinnedChatIds.includes(chat.id);
                const isActive = pathname === `/chat/${chat.id}`;
                const hasUnread = (chat.unreadCount || 0) > 0;
                const lastMessage = getLastMessagePreview(chat);
                const timeStr = formatChatTime(chat.last_message_timestamp);
                const isGroup = chat.type === 'group';

                // Show "All Messages" divider after pinned section
                const prevChat = index > 0 ? sortedChats[index - 1] : null;
                const showAllMessagesHeader = prevChat && pinnedChatIds.includes(prevChat.id) && !isPinned;

                return (
                  <React.Fragment key={chat.id}>
                    {showAllMessagesHeader && (
                      <div className="px-2 pt-3 pb-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">All Messages</p>
                      </div>
                    )}
                    <Link
                      href={`/chat/${chat.id}`}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group",
                        isActive
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/60",
                        hasUnread && !isActive && "bg-muted/30"
                      )}
                    >
                      {/* Avatar with online indicator */}
                      <div className="relative flex-shrink-0">
                        <Avatar
                          className={cn(
                            "h-12 w-12 cursor-pointer transition-transform group-hover:scale-105",
                            isGroup && "rounded-xl"
                          )}
                          onClick={(e) => partnerId ? handleViewProfile(chat, e) : undefined}
                        >
                          <AvatarImage src={avatar} alt={name} />
                          <AvatarFallback className={cn(
                            "font-medium",
                            isGroup ? "rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20" : "bg-gradient-to-br from-primary/20 to-purple-500/20"
                          )}>
                            {isGroup ? <Users className="h-5 w-5" /> : name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isPinned && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
                            <Pin className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Chat info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "truncate text-sm",
                            hasUnread ? "font-bold" : "font-medium"
                          )}>
                            {name}
                          </span>
                          <span className={cn(
                            "text-[11px] flex-shrink-0",
                            hasUnread ? "text-primary font-semibold" : "text-muted-foreground"
                          )}>
                            {timeStr}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={cn(
                            "text-xs truncate",
                            hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {lastMessage}
                          </p>
                          {hasUnread && (
                            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Context menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Chat options"
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleTogglePin(chat.id, e)}>
                            {isPinned ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" />
                                Unpin Chat
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" />
                                Pin Chat
                              </>
                            )}
                          </DropdownMenuItem>
                          {partnerId && (
                            <DropdownMenuItem onClick={(e) => handleViewProfile(chat, e)}>
                              <User className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Link>
                  </React.Fragment>
                )
              })}
            </>
          ) : (
            <div className="p-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No chats match your search' : 'No conversations yet'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
