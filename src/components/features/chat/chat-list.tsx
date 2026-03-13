'use client';

import { getAvatarUrl } from '@/lib/utils';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  MessageSquarePlus,
  PlusCircle,
  MoreVertical,
  Pin,
  PinOff,
  User,
  Users,
  Phone,
  Video,
  PhoneMissed,
  PhoneOff,
  ImageIcon,
  Mic,
  FileText,
} from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatListProps {
  chats: Chat[];
}

interface ParsedCall {
  type: 'voice' | 'video';
  status: 'missed' | 'declined' | 'ended' | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChatTime(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function parseCallMessage(raw: string): ParsedCall | null {
  if (!raw.startsWith('[[CALL:')) return null;
  const inner = raw.replace('[[CALL:', '').replace(']]', '');
  const [type, status] = inner.split('|');
  return { type: (type || 'voice') as 'voice' | 'video', status: status || 'ended' };
}

// ─── Last Message Preview Component ──────────────────────────────────────────
// Renders icons instead of emojis for call/media messages

function LastMessagePreview({
  content,
  hasUnread,
}: {
  content: string | null | undefined;
  hasUnread: boolean;
}) {
  const baseClass = cn(
    'flex items-center gap-1.5 text-xs truncate',
    hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
  );

  if (!content || typeof content !== 'string') {
    return <span className={baseClass}>{t('chat.noMessagesYet')}</span>;
  }

  // Call message
  const call = parseCallMessage(content);
  if (call) {
    const isVideo = call.type === 'video';
    const isMissed = call.status === 'missed';
    const isDeclined = call.status === 'declined';

    let Icon = isVideo ? Video : Phone;
    let label = isVideo ? 'Video call' : 'Voice call';
    let iconClass = 'text-muted-foreground';

    if (isMissed) {
      Icon = PhoneMissed;
      label = 'Missed call';
      iconClass = 'text-red-500';
    } else if (isDeclined) {
      Icon = PhoneOff;
      label = 'Declined';
      iconClass = 'text-red-500';
    }

    return (
      <span className={baseClass}>
        <Icon className={cn('h-3 w-3 shrink-0', iconClass)} />
        {label}
      </span>
    );
  }

  // Plain text — truncate
  const preview = content.length > 45 ? content.slice(0, 45) + '…' : content;
  return <span className={baseClass}>{preview}</span>;
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-1 pt-3 pb-1.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

// ─── ChatList ─────────────────────────────────────────────────────────────────

export function ChatList({ chats }: ChatListProps) {
  const { t } = useTranslation();

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

  // ── Fetch pinned chats ──
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

  // ── Handlers ──

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleTogglePin = async (chatId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const supabase = createClient();
    const { data, error } = await supabase.rpc('toggle_pin_chat', { p_chat_id: chatId });

    if (error) {
      toast({ title: 'Error', description: 'Failed to toggle pin', variant: 'destructive' });
      return;
    }

    if (data?.success) {
      setPinnedChatIds((prev) =>
        data.is_pinned ? [...prev, chatId] : prev.filter((id) => id !== chatId)
      );
      toast({
        title: data.is_pinned ? 'Chat pinned' : 'Chat unpinned',
        description: data.message,
      });
    }
  };

  const getChatPartner = (chat: Chat) => {
    if (!loggedInUser || chat.type !== 'dm') return null;
    return chat.participants?.find((p) => p.user_id !== loggedInUser.id)?.profiles ?? null;
  };

  const getChatDisplayInfo = (chat: Chat) => {
    if (chat.type === 'dm') {
      const partner = getChatPartner(chat);
      return {
        name: partner?.name || 'DM Chat',
        avatar: getAvatarUrl(partner?.avatar_url) || 'https://placehold.co/100x100.png',
        partnerId: partner?.id ?? null,
      };
    }
    return {
      name: chat.name || 'Group Chat',
      avatar: getAvatarUrl(chat.avatar_url) || 'https://placehold.co/100x100.png',
      partnerId: null,
    };
  };

  const handleViewProfile = (chat: Chat, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const partner = getChatPartner(chat);
    if (partner?.id) {
      router.push(`/profile/${partner.id}`);
      if (isMobile) setOpenMobile(false);
    }
  };

  // ── Filtered + sorted chats ──

  const filteredChats = React.useMemo(() => {
    if (!searchQuery) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((chat) => getChatDisplayInfo(chat).name.toLowerCase().includes(q));
  }, [chats, searchQuery, loggedInUser]);

  const sortedChats = React.useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      const aPinned = pinnedChatIds.includes(a.id);
      const bPinned = pinnedChatIds.includes(b.id);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      const aTime = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0;
      const bTime = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0;
      return bTime - aTime || b.id - a.id;
    });
  }, [filteredChats, pinnedChatIds]);

  const hasPinned = sortedChats.some((c) => pinnedChatIds.includes(c.id));

  // ── Render ──

  return (
    <div className="flex h-full flex-col gap-3">
      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} />
      <NewChatDialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />

      {/* Search + Actions */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search conversations…"
            className="pl-9 h-9 rounded-full bg-muted/50 border-0 text-sm focus-visible:ring-1 focus-visible:ring-primary/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full hover:bg-muted"
                onClick={() => setIsNewChatOpen(true)}
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span className="sr-only">{t('chat.newChat')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t('chat.newChat')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full hover:bg-muted"
                onClick={() => setIsCreateGroupOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only">{t('chat.createGroup')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t('chat.createGroup')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 -mx-1">
        <div className="px-1 space-y-0.5">

          {sortedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No chats match your search' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <>
              {hasPinned && <SectionLabel label={t('profile.pinned')} />}

              {sortedChats.map((chat, index) => {
                const { name, avatar, partnerId } = getChatDisplayInfo(chat);
                const isPinned = pinnedChatIds.includes(chat.id);
                const isActive = pathname === `/chat/${chat.id}`;
                const hasUnread = (chat.unreadCount || 0) > 0;
                const timeStr = formatChatTime(chat.last_message_timestamp);
                const isGroup = chat.type === 'group';

                // Divider between pinned and unpinned sections
                const prevChat = index > 0 ? sortedChats[index - 1] : null;
                const showAllHeader =
                  prevChat && pinnedChatIds.includes(prevChat.id) && !isPinned;

                return (
                  <React.Fragment key={chat.id}>
                    {showAllHeader && <SectionLabel label={t('chat.allMessages')} />}

                    <Link
                      href={`/chat/${chat.id}`}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-100 group relative',
                        isActive
                          ? 'bg-primary/10 border border-primary/15 shadow-sm'
                          : 'hover:bg-muted/70',
                        hasUnread && !isActive && 'bg-muted/40'
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary" />
                      )}

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar
                          className={cn(
                            'h-11 w-11 transition-transform group-hover:scale-[1.03]',
                            isGroup && 'rounded-xl'
                          )}
                          onClick={(e) => (partnerId ? handleViewProfile(chat, e) : undefined)}
                        >
                          <AvatarImage src={avatar} alt={name} />
                          <AvatarFallback
                            className={cn(
                              'text-sm font-semibold',
                              isGroup
                                ? 'rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600'
                                : 'bg-gradient-to-br from-primary/20 to-violet-500/20'
                            )}
                          >
                            {isGroup ? (
                              <Users className="h-4.5 w-4.5" />
                            ) : (
                              name?.charAt(0).toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>

                        {/* Pin badge */}
                        {isPinned && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center shadow-sm">
                            <Pin className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Chat info */}
                      <div className="flex-1 min-w-0">
                        {/* Name + time */}
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={cn(
                              'truncate text-sm leading-snug',
                              hasUnread ? 'font-bold text-foreground' : 'font-medium'
                            )}
                          >
                            {name}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] shrink-0 tabular-nums',
                              hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'
                            )}
                          >
                            {timeStr}
                          </span>
                        </div>

                        {/* Preview + unread badge */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <LastMessagePreview
                            content={chat.last_message_content}
                            hasUnread={hasUnread}
                          />
                          {hasUnread && (
                            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
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
                            className="h-7 w-7 shrink-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                            aria-label={t('chat.chatOptions')}
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => handleTogglePin(chat.id, e)}>
                            {isPinned ? (
                              <>
                                <PinOff className="h-3.5 w-3.5 mr-2 text-muted-foreground" />{t('chat.unpin')}</>
                            ) : (
                              <>
                                <Pin className="h-3.5 w-3.5 mr-2 text-muted-foreground" />{t('chat.pinChat')}</>
                            )}
                          </DropdownMenuItem>
                          {partnerId && (
                            <DropdownMenuItem onClick={(e) => handleViewProfile(chat, e)}>
                              <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />{t('chat.viewProfile')}</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Link>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}