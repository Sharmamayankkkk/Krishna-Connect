"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppContext } from "@/providers/app-provider";
import { ChatList } from "@/components/features/chat/chat-list";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Search, Users, Sparkles, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Clock } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAvatarUrl, createClient } from "@/lib/utils";
import type { CallRecord } from "@/lib/types";
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

// ========== Call History Components ==========

function formatCallDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatCallDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function getCallStatusIcon(call: CallRecord, userId: string) {
  const isOutgoing = call.caller_id === userId;
  switch (call.status) {
    case "missed":
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    case "declined":
      return <PhoneOff className="h-4 w-4 text-red-500" />;
    case "ended":
    case "answered":
      return isOutgoing
        ? <PhoneOutgoing className="h-4 w-4 text-green-500" />
        : <PhoneIncoming className="h-4 w-4 text-green-500" />;
    case "busy":
      return <PhoneOff className="h-4 w-4 text-orange-500" />;
    case "failed":
      return <PhoneOff className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getCallStatusText(call: CallRecord, userId: string): string {
  const isOutgoing = call.caller_id === userId;
  switch (call.status) {
    case "missed":
      return isOutgoing ? "No answer" : "Missed";
    case "declined":
      return "Declined";
    case "ended":
      return formatCallDuration(call.duration_seconds) || (isOutgoing ? "Outgoing" : "Incoming");
    case "answered":
      return "In progress";
    case "busy":
      return "Busy";
    case "failed":
      return "Failed";
    case "ringing":
      return "Ringing";
    default:
      return call.status;
  }
}

function CallsTab() {
  const { loggedInUser, isReady } = useAppContext();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    if (!loggedInUser) return;
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_call_history", {
      p_user_id: loggedInUser.id,
      p_limit: 50,
      p_offset: 0,
    });
    if (error) {
      console.warn("Failed to fetch call history:", error.message);
    } else {
      setCalls((data as CallRecord[]) || []);
    }
    setIsLoading(false);
  }, [loggedInUser]);

  useEffect(() => {
    if (isReady && loggedInUser) fetchCalls();
  }, [isReady, loggedInUser, fetchCalls]);

  useEffect(() => {
    if (!loggedInUser) return;
    const supabase = createClient();
    const channel = supabase
      .channel("call-history-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "calls" }, () => fetchCalls())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loggedInUser, fetchCalls]);

  if (isLoading) return <ChatListSkeleton />;

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Phone className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">No calls yet</h3>
          <p className="text-sm text-muted-foreground">Start a voice or video call from any chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 space-y-1">
      {calls.map((call) => {
        const isOutgoing = call.caller_id === loggedInUser?.id;
        const otherName = isOutgoing ? call.callee_name : call.caller_name;
        const otherAvatar = isOutgoing ? call.callee_avatar : call.caller_avatar;
        const isMissed = call.status === "missed" || call.status === "declined";

        return (
          <div key={call.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={getAvatarUrl(otherAvatar || undefined)} alt={otherName || ""} />
              <AvatarFallback>{otherName?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <p className={`font-medium truncate max-w-[150px] ${isMissed ? "text-red-500" : ""}`}>
                  {otherName || "Unknown"}
                </p>
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {call.call_type === "video" ? <Video className="h-3 w-3 mr-1" /> : <Phone className="h-3 w-3 mr-1" />}
                  {call.call_type}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {getCallStatusIcon(call, loggedInUser?.id || "")}
                <span>{getCallStatusText(call, loggedInUser?.id || "")}</span>
                <span>·</span>
                <span>{formatCallDate(call.created_at)}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="flex-shrink-0" aria-label={`Call ${otherName}`}>
              {call.call_type === "video" ? <Video className="h-5 w-5 text-primary" /> : <Phone className="h-5 w-5 text-primary" />}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ========== Groups Tab ==========

function GroupsTab() {
  const { loggedInUser } = useAppContext();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!loggedInUser) return;
      const supabase = createClient();
      const { data } = await supabase.rpc("get_user_groups", { p_user_id: loggedInUser.id });
      setGroups(data || []);
      setIsLoading(false);
    };
    fetchGroups();
  }, [loggedInUser]);

  if (isLoading) return <ChatListSkeleton />;

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">No groups yet</h3>
          <p className="text-sm text-muted-foreground">Create or join a group to chat with multiple people.</p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/groups"><Plus className="h-4 w-4" /> Discover Groups</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 space-y-1">
      {groups.map((group: any) => (
        <Link
          key={group.id}
          href={`/group/${group.id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={group.image_url} alt={group.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-500/30">
              <Users className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{group.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {group.member_count || 0} members
            </p>
          </div>
        </Link>
      ))}
      <div className="pt-4 text-center">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/groups"><Search className="h-3.5 w-3.5" /> Discover More Groups</Link>
        </Button>
      </div>
    </div>
  );
}

// ========== Main Chat Page ==========

export default function ChatPage() {
  const { chats, isReady, loggedInUser } = useAppContext();

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Mobile Header */}
      <header className="flex items-center p-3 border-b gap-3 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="font-bold text-lg">Messages</h1>
          {isReady && totalUnread > 0 && (
            <p className="text-xs text-primary font-medium">{totalUnread} unread</p>
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

      {/* Tabs: Chats / Calls / Groups */}
      <Tabs defaultValue="chats" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0 shrink-0">
          <TabsTrigger
            value="chats"
            className="flex-1 py-3 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chats
            {totalUnread > 0 && (
              <Badge className="ml-2 h-5 min-w-[20px] px-1.5 text-[10px]">{totalUnread}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="calls"
            className="flex-1 py-3 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Phone className="h-4 w-4 mr-2" />
            Calls
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="flex-1 py-3 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Users className="h-4 w-4 mr-2" />
            Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-1 flex flex-col overflow-hidden mt-0">
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
        </TabsContent>

        <TabsContent value="calls" className="flex-1 overflow-auto mt-0">
          <CallsTab />
        </TabsContent>

        <TabsContent value="groups" className="flex-1 overflow-auto mt-0">
          <GroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}