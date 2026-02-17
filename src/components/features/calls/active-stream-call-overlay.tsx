"use client"

import { useStreamCallContext } from '@/providers/stream-call-provider'
import { StreamCallScreen } from './stream-call-screen'

export function ActiveStreamCallOverlay() {
    const { activeStreamCall, endStreamCall } = useStreamCallContext()

    if (!activeStreamCall) return null

    return (
        <StreamCallScreen
            callId={activeStreamCall.callId}
            callType={activeStreamCall.callType}
            onCallEnd={endStreamCall}
            remoteUserName={activeStreamCall.remoteUserName}
            remoteUserAvatar={activeStreamCall.remoteUserAvatar}
        />
    )
}
