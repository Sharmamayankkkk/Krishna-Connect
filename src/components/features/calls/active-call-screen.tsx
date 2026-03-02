"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useCallContext } from "@/providers/call-provider"
import { useAppContext } from "@/providers/app-provider"
import { createClient } from "@/lib/utils"
import type { User } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CallControls } from "./call-controls"
import { getAvatarUrl, cn } from "@/lib/utils"
import { Maximize2, Minimize2, LayoutGrid, Square, Pin, PinOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function StreamVideo({ stream, isMirrored = false, className }: { stream: MediaStream; isMirrored?: boolean; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMirrored} // Mute local video to prevent echo locally
      className={cn("w-full h-full object-cover rounded-lg bg-black", isMirrored && "mirror scale-x-[-1]", className)}
    />
  )
}

function RemoteParticipant({
  peerId,
  stream,
  userName,
  userAvatar,
  isVideoCall,
  isPinned,
  onPin,
  className
}: {
  peerId: string;
  stream: MediaStream;
  userName?: string;
  userAvatar?: string | null;
  isVideoCall: boolean;
  isPinned?: boolean;
  onPin?: () => void;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [hasVideoTrack, setHasVideoTrack] = useState(false)

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream
    }

    // Check if stream has active video track
    const videoTracks = stream.getVideoTracks()
    setHasVideoTrack(videoTracks.length > 0 && videoTracks[0].enabled)

    // Listen for track changes
    const handleTrackChange = () => {
      const vTracks = stream.getVideoTracks()
      setHasVideoTrack(vTracks.length > 0 && vTracks[0].enabled)
    }

    videoTracks.forEach(track => {
      track.addEventListener('ended', handleTrackChange)
      track.addEventListener('mute', handleTrackChange)
      track.addEventListener('unmute', handleTrackChange)
    })

    return () => {
      videoTracks.forEach(track => {
        track.removeEventListener('ended', handleTrackChange)
        track.removeEventListener('mute', handleTrackChange)
        track.removeEventListener('unmute', handleTrackChange)
      })
    }
  }, [stream])

  const displayName = userName || "Participant"
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className={cn("relative group w-full h-full bg-zinc-900 rounded-xl overflow-hidden border border-white/10 flex flex-col items-center justify-center transition-all", className)}>
      {isVideoCall && hasVideoTrack ? (
        <>
          <StreamVideo stream={stream} className="absolute inset-0 z-0" />
          <audio ref={audioRef} autoPlay />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center z-10 gap-3">
          <audio ref={audioRef} autoPlay />
          <Avatar className="h-20 w-20 md:h-24 md:w-24 ring-4 ring-white/10">
            <AvatarImage src={userAvatar ? getAvatarUrl(userAvatar) : undefined} alt={displayName} />
            <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-primary/80 to-purple-600/80 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="text-white/90 text-sm md:text-base font-medium">{displayName}</p>
        </div>
      )}

      {/* Name Label Overlay (when video is on) */}
      {isVideoCall && hasVideoTrack && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md z-20">
          <p className="text-white text-xs md:text-sm font-medium">{displayName}</p>
        </div>
      )}

      {/* Pin Overlay */}
      {onPin && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-none"
            onClick={(e) => { e.stopPropagation(); onPin(); }}
          >
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}

export function ActiveCallScreen() {
  const {
    activeCall,
    callStatus,
    localStream,
    remoteStreams, // Map<string, MediaStream>
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    connectionState,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endCall,
  } = useCallContext()

  const { loggedInUser } = useAppContext()

  const [callDuration, setCallDuration] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  // Layout State
  const [layoutMode, setLayoutMode] = useState<'grid' | 'speaker'>('grid');
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

  // On-demand profile cache for group call participants
  const [peerProfiles, setPeerProfiles] = useState<Map<string, User>>(new Map());

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch and cache a peer's profile on first encounter
  useEffect(() => {
    const supabase = createClient();
    const peerIds = Array.from(remoteStreams.keys());
    peerIds.forEach(async (userId) => {
      if (peerProfiles.has(userId)) return;
      if (activeCall?.remoteUser.id === userId) {
        setPeerProfiles(prev => new Map(prev).set(userId, activeCall.remoteUser));
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) setPeerProfiles(prev => new Map(prev).set(userId, data as User));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteStreams.size]);

  // Helper to get user info by ID (from local cache)
  const getUserInfo = useCallback((userId: string) => {
    return peerProfiles.get(userId) ?? activeCall?.remoteUser;
  }, [peerProfiles, activeCall?.remoteUser])


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

  if (!activeCall) return null

  const { remoteUser, callType, isOutgoing } = activeCall
  const isVideoCall = callType === "video"
  const isConnecting = callStatus === "ringing"

  const streams = Array.from(remoteStreams.entries())
  const participantCount = streams.length + 1 // +1 for local user

  // Handle Pinning
  const handlePin = (peerId: string) => {
    if (pinnedPeerId === peerId) {
      setPinnedPeerId(null);
      setLayoutMode('grid');
    } else {
      setPinnedPeerId(peerId);
      setLayoutMode('speaker');
    }
  }

  // Handle minimized view (floating widget)
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-[90] w-72 bg-card border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getAvatarUrl(remoteUser.avatar_url)} alt={remoteUser.name} />
            <AvatarFallback>{remoteUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{remoteUser.name} {participantCount > 2 && `+${participantCount - 2}`}</p>
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
            onEndCall={endCall}
          />
        </div>
      </div>
    )
  }

  // Layout Logic
  const renderContent = () => {
    // connecting state
    if (isConnecting && streams.length === 0) {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4">
            <Avatar className="h-32 w-32 mx-auto ring-4 ring-white/20 animate-pulse">
              <AvatarImage src={getAvatarUrl(remoteUser.avatar_url)} alt={remoteUser.name} />
              <AvatarFallback className="text-4xl">{remoteUser.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-white text-lg">{isOutgoing ? "Ringing..." : "Connecting..."}</p>
          </div>
        </div>
      )
    }

    // --- SPEAKER MODE ---
    if (layoutMode === 'speaker') {
      // Identify main speaker (pinned or first remote)
      const mainPeerEntry = pinnedPeerId
        ? streams.find(([id]) => id === pinnedPeerId)
        : streams[0]; // Fallback to first remote

      const [mainPeerId, mainStream] = mainPeerEntry || [null, null];

      // Determine filmstrip participants (everyone else + local)
      const filmstripPeers = streams.filter(([id]) => id !== mainPeerId);

      return (
        <div className="flex flex-col h-full pt-16 pb-24 px-4 gap-4">
          {/* Main Stage */}
          <div className="flex-1 relative bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            {mainStream ? (
              <RemoteParticipant
                peerId={mainPeerId!}
                stream={mainStream}
                userName={getUserInfo(mainPeerId!)?.name}
                userAvatar={getUserInfo(mainPeerId!)?.avatar_url}
                isVideoCall={isVideoCall}
                isPinned={true}
                onPin={() => handlePin(mainPeerId!)}
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              // Should not happen if logic is correct, but fallback
              <div className="flex items-center justify-center h-full text-white/50">Select a participant</div>
            )}
          </div>

          {/* Filmstrip (Horizontal Scroll) */}
          <div className="h-24 md:h-32 flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
            {/* Local User in Filmstrip */}
            <div className="relative aspect-video h-full bg-zinc-800 rounded-lg overflow-hidden border border-white/10 shrink-0">
              {localStream && !isVideoOff ? (
                <StreamVideo stream={localStream} isMirrored={true} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-700">
                  <span className="text-xs text-white/50">You</span>
                </div>
              )}
              <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 rounded text-[10px] text-white">You</div>
            </div>

            {/* Other Remotes */}
            {filmstripPeers.map(([peerId, stream]) => (
              <div key={peerId} className="relative aspect-video h-full shrink-0 cursor-pointer" onClick={() => handlePin(peerId)}>
                <RemoteParticipant
                  peerId={peerId}
                  stream={stream}
                  userName={getUserInfo(peerId)?.name}
                  userAvatar={getUserInfo(peerId)?.avatar_url}
                  isVideoCall={isVideoCall}
                  isPinned={false}
                  // do not show pin button in filmstrip, clicking whole item pins it
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    // --- GRID MODE ---
    // Determine grid columns
    const gridClass = (() => {
      // If just 1 remote, it's basically full screen
      if (streams.length === 1) return "grid-cols-1";
      if (streams.length === 2) return "grid-cols-1 md:grid-cols-2";
      if (streams.length <= 4) return "grid-cols-2";
      return "grid-cols-2 md:grid-cols-3";
    })();

    return (
      <div className={cn("fixed inset-0 pt-20 pb-32 px-4 z-0 overflow-y-auto grid gap-4 place-content-center h-full", gridClass)}>
        {streams.map(([peerId, stream]) => (
          <div key={peerId} className="w-full h-full min-h-[200px] max-h-[80vh]">
            <RemoteParticipant
              peerId={peerId}
              stream={stream}
              userName={getUserInfo(peerId)?.name}
              userAvatar={getUserInfo(peerId)?.avatar_url}
              isVideoCall={isVideoCall}
              isPinned={pinnedPeerId === peerId}
              onPin={() => handlePin(peerId)}
            />
          </div>
        ))}

        {/* Local User PiP in Grid Mode (or separate?) */}
        {/* Keeping Local User separate in Grid Mode for now to match familiar UI, 
                  but we could integrate into grid if we wanted to enforce equality. 
                  Let's stick to PiP for Grid Mode as per previous implementation logic. */}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            <AvatarImage src={getAvatarUrl(remoteUser.avatar_url)} alt={remoteUser.name} />
            <AvatarFallback>{remoteUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">{remoteUser.name} {streams.length > 1 && <span className="text-xs opacity-70">(+{streams.length - 1} others)</span>}</p>
            <p className="text-white/70 text-sm">
              {isConnecting
                ? isOutgoing
                  ? "Calling..."
                  : "Connecting..."
                : formatDuration(callDuration)}
            </p>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Layout Toggle */}
          {streams.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => setLayoutMode(m => m === 'grid' ? 'speaker' : 'grid')}
                  >
                    {layoutMode === 'grid' ? <Square className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{layoutMode === 'grid' ? "Switch to Speaker View" : "Switch to Grid View"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {renderContent()}

      {/* Local Video PIP - Only verify logic:
          In Speaker Mode: Local video is in Filmstrip.
          In Grid Mode: Local video is PiP.
       */}
      {layoutMode === 'grid' && (
        <div className="fixed bottom-28 right-4 w-32 h-44 md:w-48 md:h-64 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-black z-20 transition-all">
          {localStream && !isVideoOff ? (
            <StreamVideo stream={localStream} isMirrored={true} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <Avatar className="h-12 w-12">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      )}


      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-8 flex justify-center z-30 pointer-events-auto">
        <CallControls
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          isVideoCall={isVideoCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onEndCall={endCall}
        />
      </div>
    </div>
  )
}
