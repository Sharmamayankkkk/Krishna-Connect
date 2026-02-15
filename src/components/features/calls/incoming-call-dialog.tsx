"use client"

import { useCallContext } from "@/providers/call-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Phone, Video, PhoneOff } from "lucide-react"
import { getAvatarUrl } from "@/lib/utils"

export function IncomingCallDialog() {
  const { incomingCall, acceptCall, declineCall } = useCallContext()

  if (!incomingCall) return null

  const { remoteUser, callType } = incomingCall

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
            Incoming {callType === "video" ? "Video" : "Voice"} Call
          </p>
          <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/20">
            <AvatarImage src={getAvatarUrl(remoteUser.avatar_url)} alt={remoteUser.name} />
            <AvatarFallback className="text-2xl">{remoteUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{remoteUser.name}</h3>
            <p className="text-sm text-muted-foreground">@{remoteUser.username}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full h-16 w-16 p-0"
            onClick={declineCall}
            aria-label="Decline call"
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
          <Button
            size="lg"
            className="rounded-full h-16 w-16 p-0 bg-green-500 hover:bg-green-600 text-white"
            onClick={acceptCall}
            aria-label="Accept call"
          >
            {callType === "video" ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
