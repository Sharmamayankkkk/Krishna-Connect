"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import type { CallRecord, CallSignal, CallType, ActiveCall, User } from "@/lib/types"
import { createClient } from "@/lib/utils"
import { useWebRTC } from "@/hooks/use-webrtc"
import { useAppContext } from "./app-provider"
import { useToast } from "@/hooks/use-toast"

const RING_TIMEOUT_MS = 45000 // 45 seconds ring timeout

export type CallContextType = {
  // State
  activeCall: ActiveCall | null
  incomingCall: ActiveCall | null
  callStatus: CallRecord["status"] | null
  isInCall: boolean

  // WebRTC state
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isAudioMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  connectionState: string

  // Actions
  startCall: (userId: string, callType: CallType) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleAudio: () => void
  toggleVideo: () => void
  toggleScreenShare: () => Promise<void>
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function useCallContext() {
  const context = useContext(CallContext)
  if (context === undefined) {
    throw new Error("useCallContext must be used within a CallProvider")
  }
  return context
}

export function CallProvider({ children }: { children: ReactNode }) {
  const supabaseRef = useRef(createClient())
  const { loggedInUser, allUsers } = useAppContext()
  const { toast } = useToast()
  const webrtc = useWebRTC()

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null)
  const [callStatus, setCallStatus] = useState<CallRecord["status"] | null>(null)

  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callRecordRef = useRef<CallRecord | null>(null)
  const signalChannelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null)
  const callsChannelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)

  const isInCall = activeCall !== null

  // Helper to find a user by ID
  const findUser = useCallback(
    (userId: string): User | null => {
      return allUsers.find((u) => u.id === userId) || null
    },
    [allUsers]
  )

  // Send a WebRTC signal via Supabase
  const sendSignal = useCallback(
    async (callId: string, receiverId: string, signalType: CallSignal["signal_type"], payload: Record<string, unknown>) => {
      if (!loggedInUser) return
      const { error } = await supabaseRef.current.from("call_signals").insert({
        call_id: callId,
        sender_id: loggedInUser.id,
        receiver_id: receiverId,
        signal_type: signalType,
        payload,
      })
      if (error) console.error("Failed to send signal:", error)
    },
    [loggedInUser]
  )

  // Cleanup everything
  const cleanupCall = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current)
      ringTimeoutRef.current = null
    }
    if (signalChannelRef.current) {
      supabaseRef.current.removeChannel(signalChannelRef.current)
      signalChannelRef.current = null
    }
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
    webrtc.cleanup()
    setActiveCall(null)
    setIncomingCall(null)
    setCallStatus(null)
    callRecordRef.current = null
  }, [webrtc])

  // Update call status in DB
  const updateCallInDb = useCallback(
    async (callId: string, updates: Partial<CallRecord>) => {
      const { error } = await supabaseRef.current.from("calls").update(updates).eq("id", callId)
      if (error) console.error("Failed to update call:", error)
    },
    []
  )

  // Handle incoming signals
  const handleSignal = useCallback(
    async (signal: CallSignal) => {
      if (!loggedInUser || signal.sender_id === loggedInUser.id) return

      const payload = signal.payload as Record<string, unknown>

      switch (signal.signal_type) {
        case "offer": {
          // Received an SDP offer - set remote description and create answer
          if (webrtc.state.connectionState === "new" || !activeCall) return
          await webrtc.setRemoteDescription(payload as unknown as RTCSessionDescriptionInit)
          const answer = await webrtc.createAnswer()
          await sendSignal(signal.call_id, signal.sender_id, "answer", answer as unknown as Record<string, unknown>)
          break
        }
        case "answer": {
          // Received an SDP answer
          await webrtc.setRemoteDescription(payload as unknown as RTCSessionDescriptionInit)
          break
        }
        case "ice-candidate": {
          // Received an ICE candidate
          await webrtc.addIceCandidate(payload as unknown as RTCIceCandidateInit)
          break
        }
        case "hangup": {
          // Remote peer hung up
          cleanupCall()
          toast({ title: "Call ended", description: "The other person ended the call." })
          break
        }
        case "busy": {
          // Remote peer is busy
          setCallStatus("busy")
          cleanupCall()
          toast({ title: "User Busy", description: "The person you're calling is on another call." })
          break
        }
        case "decline": {
          // Remote peer declined
          setCallStatus("declined")
          cleanupCall()
          toast({ title: "Call Declined", description: "The call was declined." })
          break
        }
        case "renegotiate": {
          // Handle renegotiation (screen share changes)
          await webrtc.setRemoteDescription(payload as unknown as RTCSessionDescriptionInit)
          if ((payload as RTCSessionDescriptionInit).type === "offer") {
            const answer = await webrtc.createAnswer()
            await sendSignal(signal.call_id, signal.sender_id, "renegotiate", answer as unknown as Record<string, unknown>)
          }
          break
        }
      }
    },
    [loggedInUser, webrtc, activeCall, sendSignal, cleanupCall, toast]
  )

  // Subscribe to signals for a call
  const subscribeToSignals = useCallback(
    (callId: string) => {
      if (!loggedInUser) return

      // Clean up any existing subscription
      if (signalChannelRef.current) {
        supabaseRef.current.removeChannel(signalChannelRef.current)
      }

      const channel = supabaseRef.current
        .channel(`call-signals-${callId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_signals",
            filter: `call_id=eq.${callId}`,
          },
          (payload) => {
            const signal = payload.new as CallSignal
            if (signal.receiver_id === loggedInUser.id) {
              handleSignal(signal)
            }
          }
        )
        .subscribe()

      signalChannelRef.current = channel
    },
    [loggedInUser, handleSignal]
  )

  // ==================== PUBLIC ACTIONS ====================

  // Start a call
  const startCall = useCallback(
    async (userId: string, callType: CallType) => {
      if (!loggedInUser) return

      // Check if already in a call
      if (isInCall) {
        toast({ variant: "destructive", title: "Already in a call", description: "Please end the current call first." })
        return
      }

      const remoteUser = findUser(userId)
      if (!remoteUser) {
        toast({ variant: "destructive", title: "User not found" })
        return
      }

      try {
        // Check if callee is busy
        const { data: isBusy } = await supabaseRef.current.rpc("check_user_busy", { p_user_id: userId })
        if (isBusy) {
          toast({ title: "User Busy", description: `${remoteUser.name} is currently on another call.` })
          return
        }

        // Initialize media
        await webrtc.initializeMedia(callType === "video")

        // Create call record in DB
        const { data: callData, error: callError } = await supabaseRef.current
          .from("calls")
          .insert({
            caller_id: loggedInUser.id,
            callee_id: userId,
            call_type: callType,
            status: "ringing",
          })
          .select()
          .single()

        if (callError || !callData) {
          throw new Error(callError?.message || "Failed to create call")
        }

        const callRecord = callData as CallRecord
        callRecordRef.current = callRecord

        // Set up call state
        const call: ActiveCall = {
          callRecord,
          isOutgoing: true,
          remoteUser,
          callType,
        }
        setActiveCall(call)
        setCallStatus("ringing")

        // Subscribe to signaling channel
        subscribeToSignals(callRecord.id)

        // Create peer connection and SDP offer
        const pc = webrtc.createPeerConnection(
          (candidate) => sendSignal(callRecord.id, userId, "ice-candidate", candidate.toJSON()),
          async () => {
            // Handle renegotiation
            const offer = await webrtc.createOffer()
            await sendSignal(callRecord.id, userId, "renegotiate", offer as unknown as Record<string, unknown>)
          }
        )

        const offer = await webrtc.createOffer()
        await sendSignal(callRecord.id, userId, "offer", offer as unknown as Record<string, unknown>)

        // Set ring timeout
        ringTimeoutRef.current = setTimeout(async () => {
          if (callRecordRef.current?.status === "ringing") {
            await updateCallInDb(callRecord.id, { status: "missed", ended_at: new Date().toISOString() })
            cleanupCall()
            toast({ title: "No Answer", description: `${remoteUser.name} didn't answer.` })
          }
        }, RING_TIMEOUT_MS)

        // Send push notification for incoming call
        try {
          await fetch("/api/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              title: `${callType === "video" ? "Video" : "Voice"} Call`,
              body: `${loggedInUser.name} is calling you...`,
              data: { type: "incoming_call", callId: callRecord.id },
            }),
          })
        } catch {
          // Push notification is best-effort
        }
      } catch (error: unknown) {
        console.error("Failed to start call:", error)
        cleanupCall()
        toast({
          variant: "destructive",
          title: "Call Failed",
          description: error instanceof Error ? error.message : "Could not start the call. Check your microphone/camera permissions.",
        })
      }
    },
    [loggedInUser, isInCall, findUser, webrtc, subscribeToSignals, sendSignal, updateCallInDb, cleanupCall, toast]
  )

  // Accept an incoming call
  const acceptCall = useCallback(async () => {
    if (!loggedInUser || !incomingCall) return

    const { callRecord, callType, remoteUser } = incomingCall

    try {
      // Initialize media
      await webrtc.initializeMedia(callType === "video")

      // Update call status to answered
      await updateCallInDb(callRecord.id, {
        status: "answered",
        started_at: new Date().toISOString(),
      })

      // Move from incoming to active
      setActiveCall(incomingCall)
      setIncomingCall(null)
      setCallStatus("answered")
      callRecordRef.current = callRecord

      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }

      // Subscribe to signals
      subscribeToSignals(callRecord.id)

      // Create peer connection
      const pc = webrtc.createPeerConnection(
        (candidate) => sendSignal(callRecord.id, remoteUser.id, "ice-candidate", candidate.toJSON()),
        async () => {
          const offer = await webrtc.createOffer()
          await sendSignal(callRecord.id, remoteUser.id, "renegotiate", offer as unknown as Record<string, unknown>)
        }
      )

      // Get and process the pending offer from signals
      const { data: signals } = await supabaseRef.current
        .from("call_signals")
        .select("*")
        .eq("call_id", callRecord.id)
        .eq("signal_type", "offer")
        .order("created_at", { ascending: false })
        .limit(1)

      if (signals && signals.length > 0) {
        const offerSignal = signals[0] as CallSignal
        await webrtc.setRemoteDescription(offerSignal.payload as unknown as RTCSessionDescriptionInit)
        const answer = await webrtc.createAnswer()
        await sendSignal(callRecord.id, remoteUser.id, "answer", answer as unknown as Record<string, unknown>)
      }

      // Process any pending ICE candidates
      const { data: iceCandidates } = await supabaseRef.current
        .from("call_signals")
        .select("*")
        .eq("call_id", callRecord.id)
        .eq("signal_type", "ice-candidate")
        .eq("sender_id", remoteUser.id)

      if (iceCandidates) {
        for (const sig of iceCandidates as CallSignal[]) {
          await webrtc.addIceCandidate(sig.payload as unknown as RTCIceCandidateInit)
        }
      }
    } catch (error: unknown) {
      console.error("Failed to accept call:", error)
      cleanupCall()
      toast({
        variant: "destructive",
        title: "Call Failed",
        description: "Could not connect the call. Check your microphone/camera permissions.",
      })
    }
  }, [loggedInUser, incomingCall, webrtc, subscribeToSignals, sendSignal, updateCallInDb, cleanupCall, toast])

  // Decline an incoming call
  const declineCall = useCallback(async () => {
    if (!incomingCall) return

    const { callRecord, remoteUser } = incomingCall

    await sendSignal(callRecord.id, remoteUser.id, "decline", {})
    await updateCallInDb(callRecord.id, {
      status: "declined",
      ended_at: new Date().toISOString(),
    })

    setIncomingCall(null)
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
  }, [incomingCall, sendSignal, updateCallInDb])

  // End the active call
  const endCall = useCallback(async () => {
    if (!activeCall) return

    const { callRecord, remoteUser } = activeCall

    await sendSignal(callRecord.id, remoteUser.id, "hangup", {})
    await updateCallInDb(callRecord.id, {
      status: "ended",
      ended_at: new Date().toISOString(),
    })

    cleanupCall()
  }, [activeCall, sendSignal, updateCallInDb, cleanupCall])

  // ==================== LISTENERS ====================

  // Listen for incoming calls via Supabase Realtime
  useEffect(() => {
    if (!loggedInUser) return

    const channel = supabaseRef.current
      .channel(`incoming-calls-${loggedInUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calls",
          filter: `callee_id=eq.${loggedInUser.id}`,
        },
        (payload) => {
          const callRecord = payload.new as CallRecord
          if (callRecord.status !== "ringing") return

          // Check if we're already in a call
          if (activeCall) {
            // Send busy signal
            sendSignal(callRecord.id, callRecord.caller_id, "busy", {})
            supabaseRef.current
              .from("calls")
              .update({ status: "busy", ended_at: new Date().toISOString() })
              .eq("id", callRecord.id)
            return
          }

          const callerUser = findUser(callRecord.caller_id)
          if (!callerUser) return

          const incoming: ActiveCall = {
            callRecord,
            isOutgoing: false,
            remoteUser: callerUser,
            callType: callRecord.call_type,
          }
          setIncomingCall(incoming)

          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            navigator.serviceWorker?.getRegistration().then((reg) => {
              if (reg) {
                reg.showNotification(`Incoming ${callRecord.call_type} call`, {
                  body: `${callerUser.name} is calling you`,
                  icon: callerUser.avatar_url || "/logo/light_KCS.png",
                  tag: `call-${callRecord.id}`,
                  requireInteraction: true,
                })
              }
            })
          }
        }
      )
      .subscribe()

    callsChannelRef.current = channel

    return () => {
      supabaseRef.current.removeChannel(channel)
      callsChannelRef.current = null
    }
  }, [loggedInUser, activeCall, findUser, sendSignal])

  // Listen for call status changes (to detect when the other person ends/declines)
  useEffect(() => {
    if (!activeCall && !incomingCall) return

    const callId = activeCall?.callRecord.id || incomingCall?.callRecord.id
    if (!callId) return

    const channel = supabaseRef.current
      .channel(`call-status-${callId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          const updated = payload.new as CallRecord
          setCallStatus(updated.status)

          if (updated.status === "ended" || updated.status === "missed" || updated.status === "failed") {
            cleanupCall()
          }
          if (updated.status === "answered" && activeCall?.isOutgoing) {
            // The callee answered - clear ring timeout
            if (ringTimeoutRef.current) {
              clearTimeout(ringTimeoutRef.current)
              ringTimeoutRef.current = null
            }
            setCallStatus("answered")
          }
        }
      )
      .subscribe()

    return () => {
      supabaseRef.current.removeChannel(channel)
    }
  }, [activeCall, incomingCall, cleanupCall])

  const value: CallContextType = {
    activeCall,
    incomingCall,
    callStatus,
    isInCall,
    localStream: webrtc.state.localStream,
    remoteStream: webrtc.state.remoteStream,
    isAudioMuted: webrtc.state.isAudioMuted,
    isVideoOff: webrtc.state.isVideoOff,
    isScreenSharing: webrtc.state.isScreenSharing,
    connectionState: webrtc.state.connectionState,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleAudio: webrtc.toggleAudio,
    toggleVideo: webrtc.toggleVideo,
    toggleScreenShare: webrtc.toggleScreenShare,
  }

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>
}
