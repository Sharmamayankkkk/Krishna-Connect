"use client";

import { useAppContext } from "@/providers/app-provider";
import { ChatList } from "../components/chat-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ChatPage() {
  const { chats } = useAppContext();

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
            {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List with built-in search */}
      <div className="flex-1 overflow-hidden p-4">
        <ChatList chats={chats} />
      </div>
    </div>
  );
}