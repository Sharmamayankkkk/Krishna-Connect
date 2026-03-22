"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppContext } from "@/providers/app-provider";
import { ChatList } from "@/components/features/chat/chat-list";
import { Button } from "@/components/ui/button";
import {
  Plus, MessageSquare, Search, Users, Sparkles, Phone, Video,
  PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Clock, ChevronRight
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatarUrl, createClient } from "@/lib/utils";
import type { CallRecord } from "@/lib/types";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

// ─── Skeleton ───────────────────────────────────────────────────────────────

function ChatListSkeleton() {
  return (
    <div className="space-y-1 p-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
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

// ─── Empty States ────────────────────────────────────────────────────────────

function EmptyChatState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <MessageSquare className="h-10 w-10 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2">{t('chat.noConversations')}</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        {t('chat.noConversationsDesc')}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          {t('chat.createGroup')}
        </Button>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('chat.newChat')}
        </Button>
      </div>
    </div>
  );
}

function EmptyCallsState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 px-6">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <Phone className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">{t('chat.noCalls')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('chat.noCallsDesc')}</p>
      </div>
    </div>
  );
}

function EmptyGroupsState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 px-6">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">{t('chat.noGroups')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('chat.noGroupsDesc')}</p>
      </div>
      <Button className="gap-2" asChild>
        <Link href="/groups">
          <Plus className="h-4 w-4" /> {t('chat.discoverGroups')}
        </Link>
      </Button>
    </div>
  );
}

// ─── Quick Contacts ───────────────────────────────────────────────────────────

function QuickContacts({ chats }: { chats: any[] }) {
  const { t } = useTranslation();
  const recentPartners = chats
    .filter((c) => c.type === "dm")
    .slice(0, 8)
    .map((chat) => chat.participants?.find((p: any) => p.profiles)?.profiles)
    .filter(Boolean);

  if (recentPartners.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b shrink-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{t('chat.quickAccess')}</p>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {recentPartners.map((user: any, i: number) => (
          <Link
            key={user.id || i}
            href={`/chat/${chats.find((c) =>
              c.participants?.some((p: any) => p.profiles?.id === user.id)
            )?.id}`}
            className="flex flex-col items-center gap-1.5 min-w-[52px] group"
          >
            <div className="relative">
              <Avatar className="h-11 w-11 ring-2 ring-background transition-transform group-hover:scale-105">
                <AvatarImage src={getAvatarUrl(user.avatar_url)} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/40 to-purple-500/40 text-sm font-medium">
                  {user.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[52px] group-hover:text-foreground transition-colors">
              {user.name?.split(" ")[0]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Call History Helpers ─────────────────────────────────────────────────────

function formatCallDate(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days === 0) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (days === 1) return t("calls.yesterday");
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatCallDuration(seconds: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins === 0 ? `${secs}s` : `${mins}m ${secs}s`;
}

function CallStatusIcon({ call, userId }: { call: CallRecord; userId: string }) {
  const isOutgoing = call.caller_id === userId;
  switch (call.status) {
    case "missed": return <PhoneMissed className="h-3.5 w-3.5 text-red-500 shrink-0" />;
    case "declined": return <PhoneOff className="h-3.5 w-3.5 text-red-500 shrink-0" />;
    case "busy": return <PhoneOff className="h-3.5 w-3.5 text-orange-500 shrink-0" />;
    case "failed": return <PhoneOff className="h-3.5 w-3.5 text-red-500 shrink-0" />;
    case "ended":
    case "answered":
      return isOutgoing
        ? <PhoneOutgoing className="h-3.5 w-3.5 text-green-500 shrink-0" />
        : <PhoneIncoming className="h-3.5 w-3.5 text-green-500 shrink-0" />;
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  }
}

function callStatusText(call: CallRecord, userId: string, t: (key: string) => string): string {
  const isOutgoing = call.caller_id === userId;
  switch (call.status) {
    case "missed": return isOutgoing ? t("calls.noAnswer") : t("calls.missed");
    case "declined": return t("calls.declined");
    case "busy": return t("calls.busy");
    case "failed": return t("calls.failed");
    case "ringing": return t("calls.ringing");
    case "answered": return t("calls.inProgress");
    case "ended": return formatCallDuration(call.duration_seconds) || (isOutgoing ? t("calls.outgoing") : t("calls.incoming"));
    default: return call.status;
  }
}

// ─── Calls Tab ────────────────────────────────────────────────────────────────

function CallsTab() {
  const { loggedInUser, isReady } = useAppContext();
  const { t } = useTranslation();
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
    if (error) console.warn("Failed to fetch call history:", error.message);
    else setCalls((data as CallRecord[]) || []);
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
  if (calls.length === 0) return <EmptyCallsState />;

  return (
    <div className="p-3 space-y-0.5 max-w-3xl mx-auto">
      {calls.map((call) => {
        const isOutgoing = call.caller_id === loggedInUser?.id;
        const otherName = isOutgoing ? call.callee_name : call.caller_name;
        const otherAvatar = isOutgoing ? call.callee_avatar : call.caller_avatar;
        const isMissed = call.status === "missed" || call.status === "declined";

        return (
          <div
            key={call.id}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-colors group cursor-pointer"
          >
            {/* Avatar */}
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={getAvatarUrl(otherAvatar || undefined)} alt={otherName || ""} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-base font-medium">
                {otherName?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-[15px] truncate leading-snug ${isMissed ? "text-destructive" : ""}`}>
                {otherName || "Unknown"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                <CallStatusIcon call={call} userId={loggedInUser?.id ?? ""} />
                <span className="truncate">{callStatusText(call, loggedInUser?.id ?? "", t)}</span>
              </div>
            </div>

            {/* Date + call button */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{formatCallDate(call.created_at, t)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                aria-label={`Call ${otherName}`}
              >
                {call.call_type === "video"
                  ? <Video className="h-4 w-4" />
                  : <Phone className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Groups Tab ───────────────────────────────────────────────────────────────

function GroupsTab() {
  const { loggedInUser } = useAppContext();
  const { t } = useTranslation();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!loggedInUser) return;
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_user_groups", { p_limit: 50, p_offset: 0 });
      if (error) console.error("Error fetching groups:", error);
      setGroups(data || []);
      setIsLoading(false);
    };
    fetchGroups();
  }, [loggedInUser]);

  if (isLoading) return <ChatListSkeleton />;
  if (groups.length === 0) return <EmptyGroupsState />;

  return (
    <div className="p-3 space-y-0.5 max-w-3xl mx-auto">
      {groups.map((group: any) => (
        <Link
          key={group.id}
          href={`/group/${group.id}`}
          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-colors group cursor-pointer"
        >
          {/* Avatar */}
          <Avatar className="h-12 w-12 rounded-2xl shrink-0">
            <AvatarImage src={getAvatarUrl(group.avatar_url || undefined)} alt={group.name} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl">
              <Users className="h-5 w-5 text-primary" />
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[15px] truncate leading-snug group-hover:text-primary transition-colors">
              {group.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Users className="h-3 w-3 shrink-0" />
              {group.member_count || 1} {(group.member_count || 1) !== 1 ? t('chat.members') : t('chat.member')}
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </Link>
      ))}

      <div className="pt-4 pb-6 text-center">
        <Button variant="outline" size="sm" className="gap-2 rounded-full" asChild>
          <Link href="/groups">
            <Search className="h-3.5 w-3.5" /> {t('chat.discoverMoreGroups')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TABS = [
  { value: "chats", labelKey: "chat.chats", Icon: MessageSquare },
  { value: "calls", labelKey: "chat.calls", Icon: Phone },
  { value: "groups", labelKey: "chat.groups", Icon: Users },
] as const;

type TabValue = (typeof TABS)[number]["value"];

// ─── Main Page ────────────────────────────────────────────────────────────────

function ChatPageContent() {
  const { chats, isReady, loggedInUser } = useAppContext();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") || "chats") as TabValue;
  
  const unreadDMs = chats.filter(c => c.type === "dm").reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const unreadGroups = chats.filter(c => c.type === "group" || c.type === "channel").reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const totalUnread = unreadDMs + unreadGroups;

  const [unreadCalls, setUnreadCalls] = useState(0);

  useEffect(() => {
    if (!loggedInUser) return;
    const fetchMissedCalls = async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('callee_id', loggedInUser.id)
        .in('status', ['missed', 'declined'])
        .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()); // Last 3 days
      
      setUnreadCalls(count || 0);
    };
    fetchMissedCalls();
  }, [loggedInUser]);

  const handleTabChange = (value: TabValue) => {
    router.replace(`${pathname}?tab=${value}`, { scroll: false });
  };

  return (
    /* Full-height column – no overflow here so children can scroll independently */
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">

      {/* ── Mobile Header ── */}
      <header className="flex items-center px-3 py-2.5 border-b gap-3 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <SidebarTrigger />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg leading-tight">{t('chat.messages')}</h1>
          {isReady && totalUnread > 0 && (
            <p className="text-xs text-primary font-medium">{t('chat.unread', { count: totalUnread })}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 shrink-0">
          <Search className="h-4 w-4" />
        </Button>
        <Button size="icon" className="rounded-full h-9 w-9 shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </header>

      {/* ── Desktop Header ── */}
      <div className="hidden md:flex items-center justify-between px-6 py-5 border-b shrink-0">
        <div>
          <h1 className="text-2xl font-bold leading-tight">{t('chat.messages')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isReady ? (
              <>
                {t(chats.length !== 1 ? 'chat.conversations' : 'chat.conversation', { count: chats.length })}
                {totalUnread > 0 && (
                  <span className="text-primary font-medium"> · {t('chat.unread', { count: totalUnread })}</span>
                )}
              </>
            ) : t('common.loading')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <Users className="h-4 w-4" />
            {t('chat.newGroup')}
          </Button>
          <Button size="sm" className="gap-2 rounded-full">
            <Plus className="h-4 w-4" />
            {t('chat.newChat')}
          </Button>
        </div>
      </div>

      {/* ── Custom Tab Bar ── */}
      <div className="flex border-b shrink-0 bg-background">
        {TABS.map(({ value, labelKey, Icon }) => (
          <button
            key={value}
            onClick={() => handleTabChange(value)}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {t(labelKey)}
            {value === "chats" && unreadDMs > 0 && (
              <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-primary">{unreadDMs}</Badge>
            )}
            {value === "groups" && unreadGroups > 0 && (
              <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-primary">{unreadGroups}</Badge>
            )}
            {value === "calls" && unreadCalls > 0 && (
              <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-destructive hover:bg-destructive/90 text-destructive-foreground">{unreadCalls}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content – each panel owns its own scroll ── */}
      <div className="flex-1 overflow-hidden">

        {/* Chats */}
        {activeTab === "chats" && (
          <div className="flex flex-col h-full overflow-hidden">
            {isReady && chats.length > 0 && <QuickContacts chats={chats} />}
            <div className="flex-1 overflow-y-auto">
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
        )}

        {/* Calls */}
        {activeTab === "calls" && (
          <div className="h-full overflow-y-auto">
            <CallsTab />
          </div>
        )}

        {/* Groups */}
        {activeTab === "groups" && (
          <div className="h-full overflow-y-auto">
            <GroupsTab />
          </div>
        )}

      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-start justify-center p-8">
          <ChatListSkeleton />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}