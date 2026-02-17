'use client'

import { AppProvider } from './app-provider'
import { CallProvider } from './call-provider'
import { StreamVideoProvider } from './stream-video-provider'
import { StreamCallProvider } from './stream-call-provider'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from './query-provider'
import { LoginModalProvider } from './login-modal-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { CallOverlay } from '@/components/features/calls/call-overlay'
import { ActiveStreamCallOverlay } from '@/components/features/calls/active-stream-call-overlay'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AppProvider>
          <StreamVideoProvider>
            <StreamCallProvider>
              <CallProvider>
                <LoginModalProvider>
                  {children}
                  <CallOverlay />
                  <ActiveStreamCallOverlay />
                  <Toaster />
                </LoginModalProvider>
              </CallProvider>
            </StreamCallProvider>
          </StreamVideoProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
