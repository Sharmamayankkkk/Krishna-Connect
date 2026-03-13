"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { useTranslation } from 'react-i18next';

interface CallControlsProps {
  isAudioMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  isVideoCall: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onEndCall: () => void
}

export function CallControls({
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  isVideoCall,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}: CallControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-3 p-4">
      <TooltipProvider>
        {/* Mute/Unmute Audio */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="lg"
              className={cn(
                "rounded-full h-14 w-14 p-0",
                isAudioMuted && "bg-red-500/20 text-red-500 hover:bg-red-500/30"
              )}
              onClick={onToggleAudio}
            >
              {isAudioMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isAudioMuted ? "Unmute" : "Mute"}</TooltipContent>
        </Tooltip>

        {/* Video On/Off (only for video calls) */}
        {isVideoCall && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className={cn(
                  "rounded-full h-14 w-14 p-0",
                  isVideoOff && "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                )}
                onClick={onToggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isVideoOff ? "Turn on camera" : "Turn off camera"}</TooltipContent>
          </Tooltip>
        )}

        {/* Screen Share */}
        {isVideoCall && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className={cn(
                  "rounded-full h-14 w-14 p-0",
                  isScreenSharing && "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                )}
                onClick={onToggleScreenShare}
              >
                {isScreenSharing ? <MonitorOff className="h-6 w-6" /> : <MonitorUp className="h-6 w-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isScreenSharing ? "Stop sharing" : "Share screen"}</TooltipContent>
          </Tooltip>
        )}

        {/* End Call */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-14 w-14 p-0"
              onClick={onEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('calls.endCall')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
