/**
 * @file user-actions-provider.tsx
 * Owns: updateUser, blockUser, unblockUser, reportUser, sendDmRequest
 */

"use client"

import { useCallback, type ReactNode } from "react"
import type { User } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "./auth-context"
import { UserActionsContext } from "./user-actions-context"

export function UserActionsProvider({ children }: { children: ReactNode }) {
    const { loggedInUser, setLoggedInUser, setBlockedUsers, supabaseRef } = useAuthContext()
    const { toast } = useToast()

    const updateUser = useCallback(async (updates: Partial<User>) => {
        if (!loggedInUser) return
        const { error } = await supabaseRef.current
            .from("profiles")
            .update({ name: updates.name, username: updates.username, bio: updates.bio, avatar_url: updates.avatar_url })
            .eq("id", loggedInUser.id)
        if (error) {
            toast({ variant: "destructive", title: "Error updating profile", description: error.message })
        } else {
            setLoggedInUser((current) => ({ ...current!, ...updates }))
        }
    }, [loggedInUser, supabaseRef, setLoggedInUser, toast])

    const blockUser = useCallback(async (userId: string) => {
        if (!loggedInUser) return
        const { error } = await supabaseRef.current
            .from("blocked_users")
            .insert({ blocker_id: loggedInUser.id, blocked_id: userId })
        if (error) {
            toast({ variant: "destructive", title: "Error blocking user", description: error.message })
        } else {
            toast({ title: "User Blocked" })
            setBlockedUsers((current) => [...current, userId])
        }
    }, [loggedInUser, supabaseRef, setBlockedUsers, toast])

    const unblockUser = useCallback(async (userId: string) => {
        if (!loggedInUser) return
        const { error } = await supabaseRef.current
            .from("blocked_users")
            .delete()
            .match({ blocker_id: loggedInUser.id, blocked_id: userId })
        if (error) {
            toast({ variant: "destructive", title: "Error unblocking user", description: error.message })
        } else {
            toast({ title: "User Unblocked" })
            setBlockedUsers((current) => current.filter((id) => id !== userId))
        }
    }, [loggedInUser, supabaseRef, setBlockedUsers, toast])

    const reportUser = useCallback(async (reportedUserId: string, reason: string, messageId?: number) => {
        if (!loggedInUser) return
        const { error } = await supabaseRef.current
            .from("reports")
            .insert({ reported_by: loggedInUser.id, reported_user_id: reportedUserId, reason, message_id: messageId })
        if (error) {
            toast({ variant: "destructive", title: "Error submitting report", description: error.message })
        } else {
            toast({ title: "Report Submitted" })
        }
    }, [loggedInUser, supabaseRef, toast])

    const sendDmRequest = useCallback(async (toUserId: string, reason: string) => {
        if (!loggedInUser) return
        const { error } = await supabaseRef.current
            .from("dm_requests")
            .insert({ from_user_id: loggedInUser.id, to_user_id: toUserId, reason })
        if (error) {
            toast({ variant: "destructive", title: "Error sending request", description: error.message })
        } else {
            toast({ title: "Request Sent!" })
        }
    }, [loggedInUser, supabaseRef, toast])

    return (
        <UserActionsContext.Provider value={{ updateUser, blockUser, unblockUser, reportUser, sendDmRequest }}>
            {children}
        </UserActionsContext.Provider>
    )
}
