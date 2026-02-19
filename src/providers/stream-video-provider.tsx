import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk'
import { useAppContext } from './app-provider'
import { createStreamClient, disconnectStreamClient } from '@/lib/stream-config'
import '@stream-io/video-react-sdk/dist/css/styles.css'

type StreamVideoContextType = {
  client: StreamVideoClient | null
  isLoading: boolean
}

const StreamVideoContext = createContext<StreamVideoContextType | undefined>(undefined)

export function useStreamVideo() {
  const context = useContext(StreamVideoContext)
  if (context === undefined) {
    throw new Error('useStreamVideo must be used within a StreamVideoProvider')
  }
  return context
}

export function StreamVideoProvider({ children }: { children: ReactNode }) {
  const { loggedInUser } = useAppContext()
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loggedInUser) {
      setClient(null)
      setIsLoading(false)
      return
    }

    let mounted = true

    const initializeClient = async () => {
      try {
        setIsLoading(true)

        // Fetch token from our API endpoint
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: loggedInUser.id }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch Stream token')
        }

        const { token } = await response.json()

        // Create Stream client (uses singleton pattern internally)
        const streamClient = createStreamClient(
          loggedInUser.id,
          loggedInUser.name || loggedInUser.username,
          loggedInUser.avatar_url || undefined,
          token
        )

        if (streamClient && mounted) {
          setClient(streamClient)
        }
      } catch (error) {
        console.error('Failed to initialize Stream client:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeClient()

    // Cleanup on unmount
    return () => {
      mounted = false
      if (loggedInUser) {
        disconnectStreamClient(loggedInUser.id).catch(console.error)
        setClient(null)
      }
    }
  }, [loggedInUser?.id]) // Only re-run if user ID changes

  const value: StreamVideoContextType = {
    client,
    isLoading,
  }

  return (
    <StreamVideoContext.Provider value={value}>
      {children}
    </StreamVideoContext.Provider>
  )
}
