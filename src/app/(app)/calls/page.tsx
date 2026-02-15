"use client"

import { useEffect, useState, useCallback } from "react"
import { useAppContext } from "@/providers/app-provider"
import { useCallContext } from "@/providers/call-provider"
import { createClient } from "@/lib/utils"
import type { CallRecord } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Clock,
} from "lucide-react"
import { getAvatarUrl } from "@/lib/utils"
import { format, isToday, isYesterday } from "date-fns"

function CallHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function formatCallDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, "h:mm a")
  if (isYesterday(date)) return "Yesterday"
  return format(date, "MMM d")
}

function formatCallDuration(seconds: number): string {
  if (!seconds || seconds === 0) return ""
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function getCallStatusIcon(call: CallRecord, userId: string) {
  const isOutgoing = call.caller_id === userId

  switch (call.status) {
    case "missed":
      return <PhoneMissed className="h-4 w-4 text-red-500" />
    case "declined":
      return <PhoneOff className="h-4 w-4 text-red-500" />
    case "ended":
    case "answered":
      return isOutgoing ? (
        <PhoneOutgoing className="h-4 w-4 text-green-500" />
      ) : (
        <PhoneIncoming className="h-4 w-4 text-green-500" />
      )
    case "busy":
      return <PhoneOff className="h-4 w-4 text-orange-500" />
    case "failed":
      return <PhoneOff className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function getCallStatusText(call: CallRecord, userId: string): string {
  const isOutgoing = call.caller_id === userId

  switch (call.status) {
    case "missed":
      return isOutgoing ? "No answer" : "Missed"
    case "declined":
      return isOutgoing ? "Declined" : "Declined"
    case "ended":
      return formatCallDuration(call.duration_seconds) || (isOutgoing ? "Outgoing" : "Incoming")
    case "answered":
      return "In progress"
    case "busy":
      return "Busy"
    case "failed":
      return "Failed"
    case "ringing":
      return "Ringing"
    default:
      return call.status
  }
}

export default function CallsPage() {
  const { loggedInUser, isReady } = useAppContext()
  const { startCall } = useCallContext()
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCalls = useCallback(async () => {
    if (!loggedInUser) return
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc("get_call_history", {
      p_user_id: loggedInUser.id,
      p_limit: 50,
      p_offset: 0,
    })
    if (error) {
      console.error("Failed to fetch call history:", error)
    } else {
      setCalls((data as CallRecord[]) || [])
    }
    setIsLoading(false)
  }, [loggedInUser])

  useEffect(() => {
    if (isReady && loggedInUser) {
      fetchCalls()
    }
  }, [isReady, loggedInUser, fetchCalls])

  // Real-time updates for call history
  useEffect(() => {
    if (!loggedInUser) return
    const supabase = createClient()
    const channel = supabase
      .channel("call-history-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calls" },
        () => {
          // Refetch on any change
          fetchCalls()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loggedInUser, fetchCalls])

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Mobile Header */}
      <header className="flex items-center p-2 border-b gap-2 md:hidden">
        <SidebarTrigger />
        <h1 className="font-semibold text-lg">Calls</h1>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Calls</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${calls.length} ${calls.length === 1 ? "call" : "calls"}`}
          </p>
        </div>
      </div>

      {/* Call History List */}
      <div className="flex-1 overflow-auto p-4 space-y-1">
        {isLoading ? (
          <CallHistorySkeleton />
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No calls yet</h3>
              <p className="text-sm text-muted-foreground">
                Start a voice or video call from any chat.
              </p>
            </div>
          </div>
        ) : (
          calls.map((call) => {
            const isOutgoing = call.caller_id === loggedInUser?.id
            const otherName = isOutgoing ? call.callee_name : call.caller_name
            const otherUsername = isOutgoing ? call.callee_username : call.caller_username
            const otherAvatar = isOutgoing ? call.callee_avatar : call.caller_avatar
            const otherUserId = isOutgoing ? call.callee_id : call.caller_id
            const isMissed = call.status === "missed" || call.status === "declined"

            return (
              <div
                key={call.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={getAvatarUrl(otherAvatar || undefined)} alt={otherName || ""} />
                  <AvatarFallback>{otherName?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate ${isMissed ? "text-red-500" : ""}`}>
                      {otherName || "Unknown"}
                    </p>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {call.call_type === "video" ? (
                        <Video className="h-3 w-3 mr-1" />
                      ) : (
                        <Phone className="h-3 w-3 mr-1" />
                      )}
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

                {/* Callback button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => startCall(otherUserId, call.call_type)}
                  aria-label={`Call ${otherName}`}
                >
                  {call.call_type === "video" ? (
                    <Video className="h-5 w-5 text-primary" />
                  ) : (
                    <Phone className="h-5 w-5 text-primary" />
                  )}
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
