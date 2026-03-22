/**
 * @file auth-provider.tsx
 * Owns: session, loggedInUser, isReady, fetchInitialData, refreshProfile
 *
 * Performance fixes applied:
 * - Removed full `profiles.select("*")` call that was blocking app startup
 * - Initial data fetch is focused: only profile + chats + dm_requests + blocked
 */

"use client"

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import type { User, Chat, DmRequest } from "@/lib/types"
import { createClient } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import type { Session, User as AuthUser } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { PhoneCollectionDialog } from "@/components/auth/phone-collection-dialog"
import { PrivacySetupModal } from "@/components/privacy-setup-modal"
import { AuthContext } from "./auth-context"

// ─── Loading Splash ────────────────────────────────────────────────────────────

function AppLoading() {
    return (
        <div className="fixed inset-0 z-[9999] flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Icons.logo className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Connecting to Krishna...</p>
            </div>
        </div>
    )
}

// ─── Sort Chats Helper ─────────────────────────────────────────────────────────

const sortChats = (chatArray: Chat[]) =>
    [...(chatArray || [])].sort((a, b) => {
        const dateA = a.last_message_timestamp ? new Date(a.last_message_timestamp) : new Date(0)
        const dateB = b.last_message_timestamp ? new Date(b.last_message_timestamp) : new Date(0)
        return dateB.getTime() - dateA.getTime()
    })

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
    const [chats, setChats] = useState<Chat[]>([])
    const [dmRequests, setDmRequests] = useState<DmRequest[]>([])
    const [blockedUsers, setBlockedUsers] = useState<string[]>([])
    const [isReady, setIsReady] = useState(false)
    const [showPrivacyModal, setShowPrivacyModal] = useState(false)
    const [showPhoneCollectionModal, setShowPhoneCollectionModal] = useState(false)

    const supabaseRef = useRef(createClient())
    const { toast } = useToast()
    const router = useRouter()

    // ── fetchInitialData ────────────────────────────────────────────────────────
    // Note: We no longer fetch all users here. allUsers is removed.
    const fetchInitialData = useCallback(async (user: AuthUser) => {
        try {
            const { data: profile, error: profileError } = await supabaseRef.current
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            if (profileError || !profile) {
                console.error("Failed to fetch profile:", profileError)
                toast({ variant: "destructive", title: "Authentication Error", description: "Could not fetch your profile. Please log in again." })
                await supabaseRef.current.auth.signOut()
                return
            }

            const fullUserProfile = {
                ...profile,
                email: user.email,
                is_verified: profile.verified ?? "none",
            } as User

            const savedTheme = localStorage.getItem("themeSettings")
            if (savedTheme) {
                try { JSON.parse(savedTheme) } catch (e) { /* ignore */ }
            }

            setLoggedInUser(fullUserProfile)

            // Parallel: dm_requests + blocked + chat participants (no full user table scan)
            const [{ data: dmRequestsData }, { data: blockedData }, { data: participantRecords }] = await Promise.all([
                supabaseRef.current
                    .from("dm_requests")
                    .select("*, from:profiles!from_user_id(*), to:profiles!to_user_id(*)")
                    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`),
                supabaseRef.current.from("blocked_users").select("blocked_id").eq("blocker_id", user.id),
                supabaseRef.current.from("participants").select("chat_id").eq("user_id", user.id),
            ])

            setDmRequests((dmRequestsData as DmRequest[]) || [])
            setBlockedUsers(blockedData?.map((b) => b.blocked_id) || [])

            const chatIds = participantRecords?.map((p) => p.chat_id) || []
            if (chatIds.length > 0) {
                const [{ data: chatsData }, { data: lastMessages }, { data: unreadData }] = await Promise.all([
                    supabaseRef.current
                        .from("chats")
                        .select("*, participants:participants!chat_id(*, profiles!user_id(*))")
                        .in("id", chatIds),
                    supabaseRef.current.rpc("get_last_messages_for_chats", { p_chat_ids: chatIds }),
                    supabaseRef.current
                        .from("messages")
                        .select("chat_id, read_by")
                        .in("chat_id", chatIds)
                        .neq("user_id", user.id)
                        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                ])

                const unreadCounts = new Map<number, number>()
                if (unreadData) {
                    unreadData.forEach((msg: any) => {
                        if (!msg.read_by || !msg.read_by.includes(user.id)) {
                            unreadCounts.set(msg.chat_id, (unreadCounts.get(msg.chat_id) || 0) + 1)
                        }
                    })
                }

                const initialChats = (chatsData || []).map((c) => ({ 
                    ...c, 
                    messages: [], 
                    unreadCount: unreadCounts.get(c.id) || 0 
                })) as Chat[]

                if (lastMessages) {
                    const chatsMap = new Map(initialChats.map((c) => [c.id, c]))
                        ; (lastMessages as any[]).forEach((msg) => {
                            const chat = chatsMap.get(msg.chat_id)
                            if (chat) {
                                chat.last_message_content = (typeof msg.content === 'string' ? msg.content : null) || msg.attachment_metadata?.name || "No messages yet"
                                chat.last_message_timestamp = msg.created_at
                            }
                        })
                    setChats(sortChats(Array.from(chatsMap.values())))
                } else {
                    setChats(sortChats(initialChats))
                }
            }

            if ("Notification" in window && Notification.permission === "default") {
                await Notification.requestPermission()
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error Loading Data", description: error.message || "Failed to load data." })
            await supabaseRef.current.auth.signOut()
        }
    }, [toast])

    const resetState = useCallback(() => {
        setSession(null)
        setLoggedInUser(null)
        setChats([])
        setDmRequests([])
        setBlockedUsers([])
    }, [])

    const refreshProfile = useCallback(async () => {
        if (session?.user) await fetchInitialData(session.user)
    }, [session, fetchInitialData])

    // ── Auth Lifecycle ──────────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            const { data: { session: currentSession } } = await supabaseRef.current.auth.getSession()
            if (currentSession) {
                setSession(currentSession)
                await fetchInitialData(currentSession.user)
            }
            setIsReady(true)
        }
        init()

        const { data: authListener } = supabaseRef.current.auth.onAuthStateChange((event, newSession) => {
            if (event === "SIGNED_OUT") {
                resetState()
                router.push("/login")
            } else if (event === "SIGNED_IN") {
                setSession(newSession)
                if (newSession?.user) fetchInitialData(newSession.user)
            }
        })

        return () => { authListener.subscription.unsubscribe() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Modals ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (loggedInUser) {
            setShowPrivacyModal(!loggedInUser.has_set_privacy)
            const isPhoneCollectionEnabled = process.env.NEXT_PUBLIC_ENABLE_PHONE_COLLECTION === "true"
            setShowPhoneCollectionModal(isPhoneCollectionEnabled && !loggedInUser.phone)
        } else {
            setShowPrivacyModal(false)
            setShowPhoneCollectionModal(false)
        }
    }, [loggedInUser])

    return (
        <AuthContext.Provider value={{
            session, loggedInUser, setLoggedInUser,
            chats, setChats, sortChats,
            dmRequests, setDmRequests,
            blockedUsers, setBlockedUsers,
            supabaseRef, isReady, refreshProfile, fetchInitialData,
        }}>
            {!isReady && <AppLoading />}
            {children}
            <PrivacySetupModal open={showPrivacyModal} onOpenChange={setShowPrivacyModal} />
            <PhoneCollectionDialog
                open={showPhoneCollectionModal}
                onOpenChange={setShowPhoneCollectionModal}
                forceRequired={false}
                title="Add Your Phone Number"
                description="Please add a phone number to your account to recover access if you lose your password."
            />
        </AuthContext.Provider>
    )
}
