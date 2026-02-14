"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useCallContext } from "@/providers/call-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CallControls } from "./call-controls"
import { getAvatarUrl } from "@/lib/utils"
import { Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function ActiveCallScreen() {
  const {
    activeCall,
    callStatus,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    connectionState,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endCall,
  } = useCallContext()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
      // iOS Safari compatibility
      localVideoRef.current.setAttribute("webkit-playsinline", "true")
    }
  }, [localStream])

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      // iOS Safari compatibility
      remoteVideoRef.current.setAttribute("webkit-playsinline", "true")
    }
  }, [remoteStream])

  // Call duration timer
  useEffect(() => {
    if (callStatus === "answered") {
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [callStatus])

  // Reset duration when call changes
  useEffect(() => {
    setCallDuration(0)
  }, [activeCall?.callRecord.id])

  const handleEndCall = useCallback(() => {
    endCall()
  }, [endCall])

  if (!activeCall) return null

  const { remoteUser, callType, isOutgoing } = activeCall
  const isVideoCall = callType === "video"
  const isConnecting = callStatus === "ringing"

  // Minimized floating view
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-[90] w-72 bg-card border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getAvatarUrl(remoteUser.avatar_url)} alt={remoteUser.name} />
            <AvatarFallback>{remoteUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{remoteUser.name}</p>
            <p className="text-xs text-muted-foreground">
              {isConnecting ? "Calling..." : formatDuration(callDuration)}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(false)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 p-2 border-t">
          <CallControls
            isAudioMuted={isAudioMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            isVideoCall={isVideoCall}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={toggleScreenShare}
            onEndCall={handleEndCall}
          />
        </div>
      </div>
    )
  }

  // Full-screen call view
  return (
    <div className="fixed inset-0 z-[90] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            <AvatarImage src={getAvatarUrl(remoteUser.avatar_url)} alt={remoteUser.name} />
            <AvatarFallback>{remoteUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">{remoteUser.name}</p>
            <p className="text-white/70 text-sm">
              {isConnecting
                ? isOutgoing
                  ? "Calling..."
                  : "Connecting..."
                : formatDuration(callDuration)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => setIsMinimized(true)}
        >
          <Minimize2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Video Area */}
      {isVideoCall ? (
        <div className="flex-1 relative">
          {/* Remote video (full screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Connecting state overlay */}
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center space-y-4">
                <Avatar className="h-32 w-32 mx-auto ring-4 ring-white/20 animate-pulse">
                  <AvatarImage src={getAvatarUrl(remoteUser.avatar_url)} alt={remoteUser.name} />
                  <AvatarFallback className="text-4xl">{remoteUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-white text-lg">{isOutgoing ? "Ringing..." : "Connecting..."}</p>
              </div>
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-28 right-4 w-32 h-44 md:w-48 md:h-64 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-black">
            {!isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Voice call - show avatar centered */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <Avatar className="h-40 w-40 mx-auto ring-4 ring-white/10">
              <AvatarImage src={getAvatarUrl(remoteUser.avatar_url)} alt={remoteUser.name} />
              <AvatarFallback className="text-5xl">{remoteUser.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-white text-2xl font-bold">{remoteUser.name}</h2>
              <p className="text-white/60">@{remoteUser.username}</p>
            </div>
            <p className="text-white/80 text-lg">
              {isConnecting
                ? isOutgoing
                  ? "Ringing..."
                  : "Connecting..."
                : formatDuration(callDuration)}
            </p>
            {connectionState === "connecting" && (
              <p className="text-yellow-200 text-sm">Establishing connection...</p>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-6">
        <CallControls
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          isVideoCall={isVideoCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
  )
}
