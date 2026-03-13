'use client'

import { ParticipantView, StreamVideoParticipant } from '@stream-io/video-react-sdk'
import { cn } from '@/lib/utils'

import { useTranslation } from 'react-i18next';

interface LivestreamVideoGridProps {
    participants: StreamVideoParticipant[]
}

export function LivestreamVideoGrid({ participants }: LivestreamVideoGridProps) {
  const { t } = useTranslation();

    const count = participants.length

    return (
        <div className="absolute inset-0 z-0 bg-black flex flex-wrap content-start [&_.str-video__participant-view]:w-full [&_.str-video__participant-view]:h-full [&_.str-video__participant-view]:max-w-none [&_.str-video__participant-view]:max-h-none [&_.str-video__participant-details]:hidden [&_.str-video__participant-view]:!m-0 [&_.str-video__participant-view]:!p-0 [&_.str-video__participant-view]:absolute [&_.str-video__participant-view]:inset-0 [&_video]:!absolute [&_video]:!inset-0 [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover">
            {count === 0 && (
                <div className="h-full w-full flex items-center justify-center bg-gray-900">
                    <div className="animate-pulse text-white/50 font-medium">{t('live.connectingVideo')}</div>
                </div>
            )}

            {count === 1 && (
                <div className="w-full h-full relative overflow-hidden">
                    <ParticipantView
                        participant={participants[0]}
                        className="w-full h-full absolute inset-0 object-cover"
                    />
                </div>
            )}

            {count === 2 && (
                <>
                    <div className="w-full h-1/2 relative border-b border-black overflow-hidden">
                        <ParticipantView
                            participant={participants[0]}
                            className="w-full h-full absolute inset-0 object-cover"
                        />
                    </div>
                    <div className="w-full h-1/2 relative bg-gray-900 border-t border-black overflow-hidden">
                        <ParticipantView
                            participant={participants[1]}
                            className="w-full h-full absolute inset-0 object-cover"
                        />
                    </div>
                </>
            )}

            {count > 2 && (
                participants.slice(0, 4).map((p, index) => (
                    <div
                        key={p.sessionId}
                        className={cn(
                            "relative border-[0.5px] border-black overflow-hidden bg-gray-900",
                            count === 3 && index === 0 ? "w-full h-1/2" : "w-1/2 h-1/2"
                        )}
                    >
                        <ParticipantView
                            participant={p}
                            className="w-full h-full absolute inset-0 object-cover"
                        />
                    </div>
                ))
            )}
        </div>
    )
}
