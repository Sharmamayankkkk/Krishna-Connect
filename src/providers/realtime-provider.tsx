/**
 * @file realtime-provider.tsx
 * Owns: all Supabase channel subscriptions
 *
 * Performance fix applied:
 * - Realtime change handlers now do targeted partial refetches instead of
 *   calling the full fetchInitialData (which previously re-fetched everything).
 */

"use client"

import { useEffect, useRef, useCallback, type ReactNode } from "react"
import type { Message } from "@/lib/types"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { usePathname } from "next/navigation"
import { useAuthContext } from "./auth-context"

export function RealtimeProvider({ children }: { children: ReactNode }) {
    const {
        loggedInUser, session,
        chats, setChats, sortChats,
        setDmRequests, setBlockedUsers,
        supabaseRef, fetchInitialData,
    } = useAuthContext()

    const pathname = usePathname()
    const subscriptionsRef = useRef<any[]>([])

    // ── New message handler ────────────────────────────────────────────────────
    const handleNewMessage = useCallback(
        async (payload: RealtimePostgresChangesPayload<Message>) => {
            if (!loggedInUser) return
            const newMessage = payload.new as Message
            const isMyMessage = newMessage.user_id === loggedInUser.id
            const currentChatId = pathname.split("/chat/")[1]
            const isChatOpen = String(newMessage.chat_id) === currentChatId
            const isWindowFocused = document.hasFocus()

            setChats((currentChats) => {
                const newChats = currentChats.map((c) => {
                    if (c.id === newMessage.chat_id) {
                        const shouldIncreaseUnread = !isMyMessage && (!isChatOpen || !isWindowFocused)
                        return {
                            ...c,
                            last_message_content: newMessage.attachment_url
                                ? (newMessage.attachment_metadata?.name || "Sent an attachment")
                                : (typeof newMessage.content === 'string' ? newMessage.content : (newMessage.content ? String(newMessage.content) : null)),
                            last_message_timestamp: newMessage.created_at,
                            unreadCount: shouldIncreaseUnread ? (c.unreadCount || 0) + 1 : (c.unreadCount || 0),
                        }
                    }
                    return c
                })
                return sortChats(newChats)
            })

            // Push notification (no allUsers lookup needed — use payload directly)
            const shouldShowNotification =
                !isMyMessage && Notification.permission === "granted" && (!isChatOpen || !isWindowFocused)

            if (shouldShowNotification) {
                // Fetch just the sender's profile on demand (no global allUsers needed)
                const { data: senderProfile } = await supabaseRef.current
                    .from("profiles")
                    .select("name, avatar_url")
                    .eq("id", newMessage.user_id)
                    .single()

                if (senderProfile && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
                    const reg = await navigator.serviceWorker.getRegistration()
                    if (reg) {
                        reg.showNotification(senderProfile.name, {
                            body: newMessage.content || (newMessage.attachment_metadata?.name ? `Sent: ${newMessage.attachment_metadata.name}` : "Sent an attachment"),
                            icon: senderProfile.avatar_url || "/logo/light_KCS.png",
                            tag: `chat-${newMessage.chat_id}`,
                            data: { chatId: newMessage.chat_id },
                        })
                    }
                }
            }
        },
        [loggedInUser, pathname, setChats, sortChats, supabaseRef]
    )

    const handleNewMessageRef = useRef(handleNewMessage)
    useEffect(() => { handleNewMessageRef.current = handleNewMessage }, [handleNewMessage])

    // ── Targeted refetch helpers (replaces full fetchInitialData calls) ─────────
    const refetchDmRequests = useCallback(async () => {
        if (!loggedInUser) return
        const { data } = await supabaseRef.current
            .from("dm_requests")
            .select("*, from:profiles!from_user_id(*), to:profiles!to_user_id(*)")
            .or(`from_user_id.eq.${loggedInUser.id},to_user_id.eq.${loggedInUser.id}`)
        if (data) setDmRequests(data as any)
    }, [loggedInUser, supabaseRef, setDmRequests])

    const refetchBlockedUsers = useCallback(async () => {
        if (!loggedInUser) return
        const { data } = await supabaseRef.current
            .from("blocked_users")
            .select("blocked_id")
            .eq("blocker_id", loggedInUser.id)
        if (data) setBlockedUsers(data.map((b) => b.blocked_id))
    }, [loggedInUser, supabaseRef, setBlockedUsers])

    const refetchChats = useCallback(async () => {
        if (!loggedInUser || !session) return
        // For participant changes we need to know new chat list, so full fetchInitialData is OK here
        // but only fires on actual participant add/remove (rare)
        await fetchInitialData(session.user)
    }, [loggedInUser, session, fetchInitialData])

    // ── Subscribe ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!loggedInUser || subscriptionsRef.current.length > 0) return

        const channels = [
            supabaseRef.current
                .channel("public-messages-notifications")
                .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) =>
                    handleNewMessageRef.current(payload as any)
                ),

            supabaseRef.current
                .channel("participants-changes")
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "participants", filter: `user_id=eq.${loggedInUser.id}` },
                    refetchChats // full reload only on group join/leave (rare)
                ),

            supabaseRef.current
                .channel("dm-requests-changes")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "dm_requests",
                        filter: `or(from_user_id.eq.${loggedInUser.id},to_user_id.eq.${loggedInUser.id})`,
                    },
                    refetchDmRequests // targeted: only reload DM requests
                ),

            supabaseRef.current
                .channel("blocked-users-changes")
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "blocked_users", filter: `blocker_id=eq.${loggedInUser.id}` },
                    refetchBlockedUsers // targeted: only reload blocked list
                ),

            supabaseRef.current
                .channel("public:chats")
                .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chats" }, (payload) => {
                    setChats((current) => current.map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } : c)))
                }),
        ]

        channels.forEach((c) => c.subscribe())
        subscriptionsRef.current = channels

        return () => {
            channels.forEach((c) => c.unsubscribe())
            subscriptionsRef.current = []
        }
    }, [loggedInUser, refetchDmRequests, refetchBlockedUsers, refetchChats, setChats, supabaseRef])

    return <>{children}</>
}
