"use client";

import { useAppContext } from "@/providers/app-provider";
import { ChatList } from "@/components/features/chat/chat-list";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Search, Users, Sparkles, ArrowRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";
import Link from "next/link";

function ChatListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChatState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <MessageSquare className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2">No conversations yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        Start a conversation with your friends or create a group to get started!
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Create Group
        </Button>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
    </div>
  );
}

function QuickContacts({ chats }: { chats: any[] }) {
  // Show unique recent chat partners as quick access circles
  const recentPartners = chats
    .filter(c => c.type === 'dm')
    .slice(0, 8)
    .map(chat => {
      const partner = chat.participants?.find((p: any) => p.profiles);
      return partner?.profiles;
    })
    .filter(Boolean);

  if (recentPartners.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Access</p>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {recentPartners.map((user: any, i: number) => (
          <Link
            key={user.id || i}
            href={`/chat/${chats.find(c => c.participants?.some((p: any) => p.profiles?.id === user.id))?.id}`}
            className="flex flex-col items-center gap-1.5 min-w-[56px] group"
          >
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-background transition-transform group-hover:scale-110">
                <AvatarImage src={getAvatarUrl(user.avatar_url)} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/40 to-purple-500/40 text-sm font-medium">
                  {user.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator dot - randomly show some as online for visual effect */}
              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <span className="text-[11px] text-muted-foreground truncate max-w-[56px] group-hover:text-foreground transition-colors">
              {user.name?.split(' ')[0]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { chats, isReady, loggedInUser } = useAppContext();

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Mobile Header */}
      <header className="flex items-center p-3 border-b gap-3 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="font-bold text-lg">Chats</h1>
          {isReady && totalUnread > 0 && (
            <p className="text-xs text-primary font-medium">{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Search className="h-5 w-5" />
        </Button>
        <Button size="icon" className="rounded-full h-9 w-9">
          <Plus className="h-4 w-4" />
        </Button>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block border-b">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isReady ? (
                  <>
                    {chats.length} conversation{chats.length !== 1 ? 's' : ''}
                    {totalUnread > 0 && (
                      <span className="text-primary font-medium"> · {totalUnread} unread</span>
                    )}
                  </>
                ) : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                <Users className="h-4 w-4" />
                New Group
              </Button>
              <Button size="sm" className="gap-2 rounded-full">
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Contacts Row */}
      {isReady && chats.length > 0 && <QuickContacts chats={chats} />}

      {/* Chat List */}
      <div className="flex-1 overflow-hidden">
        {!isReady ? (
          <ChatListSkeleton />
        ) : chats.length === 0 ? (
          <EmptyChatState />
        ) : (
          <div className="p-2 md:p-4 h-full">
            <ChatList chats={chats} />
          </div>
        )}
      </div>
    </div>
  );
}