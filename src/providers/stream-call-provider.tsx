"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useStreamVideo } from './stream-video-provider'
import { useAppContext } from './app-provider'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/utils'
import type { CallType } from '@/lib/types'

interface StreamCallContextType {
    activeStreamCall: {
        callId: string
        callType: CallType
        isGroup: boolean
        remoteUserId?: string
        remoteUserName?: string
        remoteUserAvatar?: string
        chatId?: string
    } | null
    startStreamCall: (userId: string, callType: CallType) => Promise<void>
    startGroupStreamCall: (chatId: string, callType: CallType) => Promise<void>
    endStreamCall: () => void
}

const StreamCallContext = createContext<StreamCallContextType | undefined>(undefined)

export function useStreamCallContext() {
    const context = useContext(StreamCallContext)
    if (!context) {
        throw new Error('useStreamCallContext must be used within StreamCallProvider')
    }
    return context
}

export function StreamCallProvider({ children }: { children: ReactNode }) {
    const { client } = useStreamVideo()
    const { loggedInUser, allUsers } = useAppContext()
    const { toast } = useToast()
    const supabase = createClient()

    const [activeStreamCall, setActiveStreamCall] = useState<StreamCallContextType['activeStreamCall']>(null)

    const startStreamCall = useCallback(async (userId: string, callType: CallType) => {
        if (!client || !loggedInUser) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Not ready to make calls',
            })
            return
        }

        try {
            // Find the remote user
            const remoteUser = allUsers.find(u => u.id === userId)
            if (!remoteUser) {
                throw new Error('User not found')
            }

            // Generate unique call ID
            const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Create call record in database
            const { data: callRecord, error: dbError } = await supabase
                .from('calls')
                .insert({
                    caller_id: loggedInUser.id,
                    callee_id: userId,
                    call_type: callType,
                    status: 'ringing',
                    stream_call_id: callId,
                })
                .select()
                .single()

            if (dbError) throw dbError

            // Create Stream call
            const streamCall = client.call(callType === 'video' ? 'default' : 'audio_room', callId)

            // Join the call
            await streamCall.join({ create: true })

            // Enable camera/mic
            if (callType === 'video') {
                await streamCall.camera.enable()
            }
            await streamCall.microphone.enable()

            // Set active call state
            setActiveStreamCall({
                callId,
                callType,
                isGroup: false,
                remoteUserId: userId,
                remoteUserName: remoteUser.name || remoteUser.username,
                remoteUserAvatar: remoteUser.avatar_url,
            })

            // Update call status to answered when remote joins
            streamCall.on('call.session_participant_joined', async () => {
                await supabase
                    .from('calls')
                    .update({
                        status: 'answered',
                        started_at: new Date().toISOString(),
                    })
                    .eq('id', callRecord.id)
            })

            toast({
                title: 'Calling...',
                description: `Calling ${remoteUser.name || remoteUser.username}`,
            })
        } catch (error) {
            console.error('Failed to start call:', error)
            toast({
                variant: 'destructive',
                title: 'Call Failed',
                description: error instanceof Error ? error.message : 'Could not start call',
            })
        }
    }, [client, loggedInUser, allUsers, supabase, toast])

    const startGroupStreamCall = useCallback(async (chatId: string, callType: CallType) => {
        if (!client || !loggedInUser) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Not ready to make calls',
            })
            return
        }

        try {
            // Generate unique call ID
            const callId = `group_call_${chatId}_${Date.now()}`

            // Create call record in database
            await supabase
                .from('calls')
                .insert({
                    caller_id: loggedInUser.id,
                    chat_id: parseInt(chatId),
                    is_group: true,
                    call_type: callType,
                    status: 'ringing',
                    stream_call_id: callId,
                })

            // Create Stream call
            const streamCall = client.call(callType === 'video' ? 'default' : 'audio_room', callId)

            // Join the call
            await streamCall.join({ create: true })

            // Enable camera/mic
            if (callType === 'video') {
                await streamCall.camera.enable()
            }
            await streamCall.microphone.enable()

            // Set active call state
            setActiveStreamCall({
                callId,
                callType,
                isGroup: true,
                chatId,
            })

            toast({
                title: 'Group Call Started',
                description: 'Waiting for others to join...',
            })
        } catch (error) {
            console.error('Failed to start group call:', error)
            toast({
                variant: 'destructive',
                title: 'Call Failed',
                description: error instanceof Error ? error.message : 'Could not start group call',
            })
        }
    }, [client, loggedInUser, supabase, toast])

    const endStreamCall = useCallback(() => {
        setActiveStreamCall(null)
    }, [])

    return (
        <StreamCallContext.Provider
            value={{
                activeStreamCall,
                startStreamCall,
                startGroupStreamCall,
                endStreamCall,
            }}
        >
            {children}
        </StreamCallContext.Provider>
    )
}
