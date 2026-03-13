'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppContext } from '@/providers/app-provider'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { ToastAction } from '@/components/ui/toast'
import { Radio } from 'lucide-react'

import { useTranslation } from 'react-i18next';

export function LivestreamInviteListener() {
  const { t } = useTranslation();

    const { loggedInUser } = useAppContext()
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (!loggedInUser) return

        // Channel for real-time invites
        const channel = supabase
            .channel(`livestream_invites:${loggedInUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'livestream_guests',
                    filter: `user_id=eq.${loggedInUser.id}`,
                },
                async (payload) => {
                    if (payload.new.status === 'invited') {
                        // Fetch stream details to show who invited
                        const { data: stream } = await supabase
                            .from('livestreams')
                            .select(`
                                id,
                                title,
                                host:profiles!livestreams_host_id_fkey(name, username)
                            `)
                            .eq('id', payload.new.livestream_id)
                            .single()

                        if (stream) {
                            const hostData = stream.host as any
                            const hostProfile = Array.isArray(hostData) ? hostData[0] : hostData
                            const hostName = hostProfile?.name || hostProfile?.username || 'A Host'

                            toast({
                                title: "Incoming Livestream Invite",
                                description: `${hostName} invited you to join their stream: "${stream.title}"`,
                                duration: 10000,
                                action: (
                                    <ToastAction
                                        altText="Join"
                                        onClick={() => router.push(`/live/${stream.id}?guest=true`)}
                                        className="bg-red-600 text-white hover:bg-red-700 border-none"
                                    >
                                        <Radio className="h-4 w-4 mr-2" />{t('live.joinLive')}</ToastAction>
                                ),
                            })
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loggedInUser, supabase, router, toast])

    return null
}
