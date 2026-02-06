"use client";

import { useAppContext } from "@/providers/app-provider";
import { ChatList } from "@/components/features/chat/chat-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

function ChatListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const { chats, isReady } = useAppContext();

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Mobile Header */}
      <header className="flex items-center p-2 border-b gap-2 md:hidden">
        <SidebarTrigger />
        <h1 className="font-semibold text-lg">Chats</h1>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Chats</h1>
          <p className="text-sm text-muted-foreground">
            {isReady ? `${chats.length} ${chats.length === 1 ? 'conversation' : 'conversations'}` : 'Loading...'}
          </p>
        </div>
        <Button aria-label="Start new chat">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List with built-in search */}
      <div className="flex-1 overflow-hidden p-4">
        {!isReady ? <ChatListSkeleton /> : <ChatList chats={chats} />}
      </div>
    </div>
  );
}