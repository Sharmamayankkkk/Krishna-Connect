
'use client';

import { getAvatarUrl } from '@/lib/utils';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, PlusCircle, MessageSquarePlus, MoreVertical, Pin, PinOff, User } from 'lucide-react';
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
import { CreateGroupDialog } from './create-group-dialog';
import { NewChatDialog } from './new-chat-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatListProps {
  chats: Chat[];
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

      // Otherwise sort by ID (most recent)
      return b.id - a.id;
    });
  }, [filteredChats, pinnedChatIds]);

  return (
    <div className="flex h-full flex-col">
      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} />
      <NewChatDialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
      <div className="relative flex items-center gap-2 mb-2">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setIsNewChatOpen(true)}>
                <MessageSquarePlus className="h-5 w-5" />
                <span className="sr-only">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Chat</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setIsCreateGroupOpen(true)}>
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Create Group</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Create Group</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="flex-1 -mx-2">
        <SidebarMenu className="px-2">
          {sortedChats.length > 0 ? (
            sortedChats.map((chat) => {
              const { name, avatar, partnerId } = getChatDisplayInfo(chat);
              const isPinned = pinnedChatIds.includes(chat.id);

              return (
                <SidebarMenuItem key={chat.id}>
                  <div className="flex items-center gap-1 w-full group">
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/chat/${chat.id}`}
                      className="flex-1 justify-start h-14 py-2 gap-3"
                    >
                      <Link
                        href={`/chat/${chat.id}`}
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 flex-1"
                      >
                        <Avatar
                          className="h-10 w-10 cursor-pointer"
                          onClick={(e) => partnerId ? handleViewProfile(chat, e) : undefined}
                        >
                          <AvatarImage
                            src={avatar}
                            alt={name}
                            data-ai-hint="avatar"
                          />
                          <AvatarFallback>
                            {name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="truncate font-medium">{name}</span>
                          {isPinned && (
                            <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        {chat.unreadCount && chat.unreadCount > 0 ? (
                          <SidebarMenuBadge>{chat.unreadCount}</SidebarMenuBadge>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
                  </div>
                </SidebarMenuItem>
              )
            })
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No chats found.
            </div>
          )}
        </SidebarMenu>
      </ScrollArea>
    </div>
  );
}
