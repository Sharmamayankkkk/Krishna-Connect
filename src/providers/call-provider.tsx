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
  remoteStream: MediaStream | null // Deprecated, use remoteStreams
  remoteStreams: Map<string, MediaStream>
  isAudioMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  connectionState: string

  // Actions
  startCall: (userId: string, callType: CallType) => Promise<void>
  startGroupCall: (chatId: string, callType: CallType) => Promise<void>
  joinCall: (callId: string) => Promise<void>
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
  const participantsChannelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null)
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
    async (callId: string, receiverId: string, signalType: CallSignal["signal_type"], payload: unknown) => {
      if (!loggedInUser) return
      const { error } = await supabaseRef.current.from("call_signals").insert({
        call_id: callId,
        sender_id: loggedInUser.id,
        receiver_id: receiverId,
        signal_type: signalType,
        payload: payload as Record<string, unknown>,
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
    if (participantsChannelRef.current) {
      supabaseRef.current.removeChannel(participantsChannelRef.current)
      participantsChannelRef.current = null
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

  // Insert a call history message into the chat between caller and callee
  const insertCallHistoryMessage = useCallback(
    async (callRecord: CallRecord, status: string, durationSeconds: number) => {
      if (!loggedInUser) return
      try {
        let chatToInsert = null;
        if (callRecord.is_group && callRecord.chat_id) {
          chatToInsert = callRecord.chat_id;
        } else {
          const otherUserId = callRecord.caller_id === loggedInUser.id ? callRecord.callee_id : callRecord.caller_id
          const { data: chats } = await supabaseRef.current
            .from("chats")
            .select("id, participants:chat_participants(user_id)")
            .eq("is_group", false)

          if (chats) {
            const dmChat = chats.find((c: { id: number; participants: { user_id: string }[] }) =>
              c.participants?.length === 2 &&
              c.participants.some((p: { user_id: string }) => p.user_id === loggedInUser.id) &&
              c.participants.some((p: { user_id: string }) => p.user_id === otherUserId)
            )
            if (dmChat) chatToInsert = dmChat.id;
          }
        }

        if (!chatToInsert) return

        // Insert call history message: [[CALL:type|status|duration|caller_id|call_id]]
        const content = `[[CALL:${callRecord.call_type}|${status}|${durationSeconds}|${callRecord.caller_id}|${callRecord.id}]]`
        await supabaseRef.current.from("messages").insert({
          chat_id: chatToInsert,
          user_id: loggedInUser.id,
          content,
        })
      } catch (err) {
        console.warn("Could not insert call history message:", err)
      }
    },
    [loggedInUser]
  )

  // Handle incoming signals
  const handleSignal = useCallback(
    async (signal: CallSignal) => {
      if (!loggedInUser || signal.sender_id === loggedInUser.id) return

      const payload = signal.payload as Record<string, unknown>
      const senderId = signal.sender_id

      switch (signal.signal_type) {
        case "offer": {
          // Received an SDP offer - set remote description and create answer
          if (!activeCall) return

          // Ensure PC exists for this peer
          webrtc.createPeerConnection(senderId, (candidate) =>
            sendSignal(signal.call_id, senderId, "ice-candidate", candidate.toJSON())
          )

          await webrtc.setRemoteDescription(senderId, payload as unknown as RTCSessionDescriptionInit)
          const answer = await webrtc.createAnswer(senderId)
          await sendSignal(signal.call_id, senderId, "answer", answer as unknown as Record<string, unknown>)
          break
        }
        case "answer": {
          // Received an SDP answer
          await webrtc.setRemoteDescription(senderId, payload as unknown as RTCSessionDescriptionInit)
          break
        }
        case "ice-candidate": {
          // Received an ICE candidate
          await webrtc.addIceCandidate(senderId, payload as unknown as RTCIceCandidateInit)
          break
        }
        case "hangup": {
          // Remote peer hung up
          if (activeCall?.callRecord.is_group) {
            webrtc.removePeer(senderId)
            toast({ title: "User Left", description: "A participant left the call." })
          } else {
            cleanupCall()
            toast({ title: "Call ended", description: "The other person ended the call." })
          }
          break
        }
        case "busy": {
          setCallStatus("busy")
          cleanupCall()
          toast({ title: "User Busy", description: "The person you're calling is on another call." })
          break
        }
        case "decline": {
          setCallStatus("declined")
          cleanupCall()
          toast({ title: "Call Declined", description: "The call was declined." })
          break
        }
        case "renegotiate": {
          await webrtc.setRemoteDescription(senderId, payload as unknown as RTCSessionDescriptionInit)
          if ((payload as unknown as RTCSessionDescriptionInit).type === "offer") {
            const answer = await webrtc.createAnswer(senderId)
            await sendSignal(signal.call_id, senderId, "renegotiate", answer as unknown as Record<string, unknown>)
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

  // Subscribe to participants for a group call
  const subscribeToParticipants = useCallback(
    (callId: string) => {
      if (!loggedInUser) return

      if (participantsChannelRef.current) {
        supabaseRef.current.removeChannel(participantsChannelRef.current)
      }

      const channel = supabaseRef.current
        .channel(`call-participants-${callId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_participants",
            filter: `call_id=eq.${callId}`,
          },
          (payload) => {
            const newParticipantUserId = payload.new.user_id;
            if (newParticipantUserId !== loggedInUser.id && payload.new.status === 'joined') {
              // New user joined group call -> initiate connection
              // In Mesh, everyone connects to everyone. 
              // Simplest: Every existing participant initiates to the new joiner.
              // OR the joiner initiates to everyone.
              // Let's have EXISTING participants initiate to the NEW joiner to avoid race conditions.

              webrtc.createPeerConnection(newParticipantUserId, (candidate) =>
                sendSignal(callId, newParticipantUserId, "ice-candidate", candidate.toJSON())
              )
              webrtc.createOffer(newParticipantUserId).then((offer) => {
                sendSignal(callId, newParticipantUserId, "offer", offer as unknown as Record<string, unknown>)
              })
              toast({ title: "User Joined", description: "A new participant joined the call." })
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "call_participants",
            filter: `call_id=eq.${callId}`,
          },
          (payload) => {
            if (payload.new.status === 'left' || payload.new.status === 'declined') {
              webrtc.removePeer(payload.new.user_id);
              toast({ title: "User Left", description: "A participant left the call." })
            }
          }
        )
        .subscribe()

      participantsChannelRef.current = channel
    },
    [loggedInUser, webrtc, sendSignal]
  )


  // ==================== PUBLIC ACTIONS ====================

  // Start 1-on-1 Call
  const startCall = useCallback(
    async (userId: string, callType: CallType) => {
      if (!loggedInUser) return
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
        await webrtc.initializeMedia(callType === "video")

        const { data: callData, error: callError } = await supabaseRef.current
          .from("calls")
          .insert({
            caller_id: loggedInUser.id,
            callee_id: userId, // Specific callee
            call_type: callType,
            status: "ringing",
            is_group: false // Default
          })
          .select()
          .single()

        if (callError || !callData) {
          throw new Error(callError?.message || "Failed to create call")
        }

        const callRecord = callData as CallRecord // Type assertion might need update for new fields
        callRecordRef.current = callRecord

        const call: ActiveCall = {
          callRecord,
          isOutgoing: true,
          remoteUser,
          callType,
        }
        setActiveCall(call)
        setCallStatus("ringing")

        subscribeToSignals(callRecord.id)

        webrtc.createPeerConnection(
          userId,
          (candidate) => sendSignal(callRecord.id, userId, "ice-candidate", candidate.toJSON())
        )

        const offer = await webrtc.createOffer(userId)
        await sendSignal(callRecord.id, userId, "offer", offer as unknown as Record<string, unknown>)

        ringTimeoutRef.current = setTimeout(async () => {
          if (callRecordRef.current?.status === "ringing") {
            await updateCallInDb(callRecord.id, { status: "missed", ended_at: new Date().toISOString() })
            await insertCallHistoryMessage(callRecord, "missed", 0)
            cleanupCall()
            toast({ title: "No Answer", description: `${remoteUser.name} didn't answer.` })
          }
        }, RING_TIMEOUT_MS)

        // Push notification logic...
      } catch (error: unknown) {
        console.error("Failed to start call:", error)
        cleanupCall()
        toast({ variant: "destructive", title: "Call Failed", description: "Could not start call." })
      }
    },
    [loggedInUser, isInCall, findUser, webrtc, subscribeToSignals, sendSignal, updateCallInDb, cleanupCall, toast]
  )

  // Start Group Call
  const startGroupCall = useCallback(
    async (chatId: string, callType: CallType) => {
      if (!loggedInUser) return;
      if (isInCall) {
        toast({ variant: "destructive", title: "Already in a call" });
        return;
      }

      try {
        await webrtc.initializeMedia(callType === "video");

        // Create Group Call Record
        const { data: callData, error: callError } = await supabaseRef.current
          .from("calls")
          .insert({
            caller_id: loggedInUser.id,
            chat_id: chatId, // Link to group chat
            call_type: callType,
            status: "answered", // Group calls are 'live' immediately
            is_group: true,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (callError || !callData) throw new Error(callError?.message || "Failed to create group call");

        const callRecord = callData as CallRecord;
        callRecordRef.current = callRecord;

        // Add self as participant
        await supabaseRef.current.from("call_participants").insert({
          call_id: callRecord.id,
          user_id: loggedInUser.id,
          status: 'joined',
          tracks: { audio: true, video: callType === 'video' }
        })

        // Setup Context
        const call: ActiveCall = {
          callRecord,
          isOutgoing: true, // Started it
          remoteUser: loggedInUser, // Placeholder
          callType,
        }
        setActiveCall(call)
        setCallStatus("answered")

        subscribeToSignals(callRecord.id)
        subscribeToParticipants(callRecord.id)

        // Notify Group
        await insertCallHistoryMessage(callRecord, "started", 0);

      } catch (error) {
        console.error("Failed to start group call:", error)
        cleanupCall()
        toast({ variant: "destructive", description: "Failed to start group call." })
      }
    },
    [loggedInUser, isInCall, webrtc, subscribeToSignals, subscribeToParticipants, insertCallHistoryMessage, cleanupCall, toast]
  )

  // Join Existing Call
  const joinCall = useCallback(
    async (callId: string) => {
      if (!loggedInUser) return;
      if (isInCall) return;

      try {
        // Fetch call details
        const { data: callRecord, error } = await supabaseRef.current
          .from("calls")
          .select("*")
          .eq("id", callId)
          .single();

        if (error || !callRecord) throw new Error("Call not found");
        if (callRecord.status === 'ended') throw new Error("Call has ended");

        await webrtc.initializeMedia(callRecord.call_type === "video");

        // Add self as participant
        await supabaseRef.current.from("call_participants").insert({
          call_id: callRecord.id,
          user_id: loggedInUser.id,
          status: 'joined'
        });

        // Setup Context
        const call: ActiveCall = {
          callRecord,
          isOutgoing: false,
          remoteUser: findUser(callRecord.caller_id) || loggedInUser, // Provide caller as "remote" context initally
          callType: callRecord.call_type,
        }
        setActiveCall(call)
        setCallStatus("answered")
        callRecordRef.current = callRecord

        subscribeToSignals(callRecord.id)
        subscribeToParticipants(callRecord.id)

        // Fetch existing participants and connect to them
        const { data: participants } = await supabaseRef.current
          .from("call_participants")
          .select("user_id")
          .eq("call_id", callId)
          .eq("status", "joined")
          .neq("user_id", loggedInUser.id); // Don't connect to self

        if (participants) {
          for (const p of participants) {
            // Create PC for each existing participant
            // IMPORTANT: In Mesh, usually logic is simpler if joiner initiates OR existing initiates.
            // We set existing participants to initiate to NEW joiners in subscribeToParticipants.
            // So here, DO NOT initiate. Wait for offers from them?
            // Actually, if we rely on existing participants (who are online) to initiate, that's safer.
            // Because joiner might not know who is actually online vs just in DB.

            // Wait for offers from them (since they get the INSERT event).
            // BUT, if they joined before us, they are already there.
            // Let's rely on the INSERT event we just triggered (step 1 above).
            // Existing participants will see US join, and initiate connection TO US.
            // So we just need to be ready to accept offers (which handleSignal does).
          }
        }

      } catch (error) {
        console.error("Failed to join call:", error)
        cleanupCall()
        toast({ variant: "destructive", description: "Failed to join call." })
      }
    },
    [loggedInUser, isInCall, findUser, webrtc, subscribeToSignals, subscribeToParticipants, cleanupCall, toast]
  )

  // Accept an incoming call (1-on-1)
  const acceptCall = useCallback(async () => {
    if (!loggedInUser || !incomingCall) return

    const { callRecord, callType, remoteUser } = incomingCall

    try {
      await webrtc.initializeMedia(callType === "video")

      await updateCallInDb(callRecord.id, {
        status: "answered",
        started_at: new Date().toISOString(),
      })

      setActiveCall(incomingCall)
      setIncomingCall(null)
      setCallStatus("answered")
      callRecordRef.current = callRecord

      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }

      subscribeToSignals(callRecord.id)

      webrtc.createPeerConnection(
        remoteUser.id,
        (candidate) => sendSignal(callRecord.id, remoteUser.id, "ice-candidate", candidate.toJSON())
      )

      const { data: signals } = await supabaseRef.current
        .from("call_signals")
        .select("*")
        .eq("call_id", callRecord.id)
        .eq("signal_type", "offer")
        .order("created_at", { ascending: false })
        .limit(1)

      if (signals && signals.length > 0) {
        const offerSignal = signals[0] as CallSignal
        const senderId = offerSignal.sender_id

        await webrtc.setRemoteDescription(senderId, offerSignal.payload as unknown as RTCSessionDescriptionInit)
        const answer = await webrtc.createAnswer(senderId)
        await sendSignal(callRecord.id, senderId, "answer", answer as unknown as Record<string, unknown>)
      }

      const { data: iceCandidates } = await supabaseRef.current
        .from("call_signals")
        .select("*")
        .eq("call_id", callRecord.id)
        .eq("signal_type", "ice-candidate")
        .eq("sender_id", remoteUser.id)

      if (iceCandidates) {
        for (const sig of iceCandidates as CallSignal[]) {
          await webrtc.addIceCandidate(sig.sender_id, sig.payload as unknown as RTCIceCandidateInit)
        }
      }
    } catch (error: unknown) {
      console.error("Failed to accept call:", error)
      cleanupCall()
      toast({ variant: "destructive", title: "Call Failed", description: "Could not connect." })
    }
  }, [loggedInUser, incomingCall, webrtc, subscribeToSignals, sendSignal, updateCallInDb, cleanupCall, toast])

  // Decline an incoming call
  const declineCall = useCallback(async () => {
    if (!incomingCall) return
    const { callRecord, remoteUser } = incomingCall

    await sendSignal(callRecord.id, remoteUser.id, "decline", {})
    await updateCallInDb(callRecord.id, {
      status: "declined", // Update status but keep record
      ended_at: new Date().toISOString(),
    })
    await insertCallHistoryMessage(callRecord, "declined", 0)

    setIncomingCall(null)
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
  }, [incomingCall, sendSignal, updateCallInDb, insertCallHistoryMessage])

  // End the active call
  const endCall = useCallback(async () => {
    if (!activeCall) return

    const { callRecord, remoteUser } = activeCall

    if (callRecord.is_group) {
      // Just leave the call
      await supabaseRef.current.from("call_participants")
        .update({ status: 'left', left_at: new Date().toISOString() })
        .eq("call_id", callRecord.id)
        .eq("user_id", loggedInUser?.id);

      // Notify others
      // We rely on postgres_changes triggers for others to removePeer(me)
    } else {
      // End 1-on-1 call entire
      await sendSignal(callRecord.id, remoteUser.id, "hangup", {})
      await updateCallInDb(callRecord.id, {
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      const startedAt = callRecord.started_at ? new Date(callRecord.started_at).getTime() : Date.now()
      const durationSec = Math.round((Date.now() - startedAt) / 1000)
      await insertCallHistoryMessage(callRecord, "ended", durationSec)
    }

    cleanupCall()
  }, [activeCall, sendSignal, updateCallInDb, cleanupCall, insertCallHistoryMessage, loggedInUser])

  // Listen for incoming calls (1-on-1)
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

          if (activeCall) {
            sendSignal(callRecord.id, callRecord.caller_id, "busy", {})
            supabaseRef.current.from("calls").update({ status: "busy", ended_at: new Date().toISOString() }).eq("id", callRecord.id)
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

          // Browser Notification logic...
        }
      )
      .subscribe()

    callsChannelRef.current = channel

    return () => {
      supabaseRef.current.removeChannel(channel)
      callsChannelRef.current = null
    }
  }, [loggedInUser, activeCall, findUser, sendSignal])

  // Listen for call status changes
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
          setCallStatus(updated.status) // Might not be relevant for group calls where status is always 'answered' or 'ended'

          if (!updated.is_group) {
            if (updated.status === "ended" || updated.status === "missed" || updated.status === "failed") {
              cleanupCall()
            }
            if (updated.status === "answered" && activeCall?.isOutgoing) {
              if (ringTimeoutRef.current) {
                clearTimeout(ringTimeoutRef.current)
                ringTimeoutRef.current = null
              }
              setCallStatus("answered")
            }
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
    remoteStream: webrtc.state.remoteStreams.values().next().value || null,
    remoteStreams: webrtc.state.remoteStreams,
    isAudioMuted: webrtc.state.isAudioMuted,
    isVideoOff: webrtc.state.isVideoOff,
    isScreenSharing: webrtc.state.isScreenSharing,
    connectionState: webrtc.state.connectionState,
    startCall,
    startGroupCall,
    joinCall,
    acceptCall,
    declineCall,
    endCall,
    toggleAudio: webrtc.toggleAudio,
    toggleVideo: webrtc.toggleVideo,
    toggleScreenShare: webrtc.toggleScreenShare,
  }

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>
}
