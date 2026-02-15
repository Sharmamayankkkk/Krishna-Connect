'use client'

import { AppProvider } from './app-provider'
import { CallProvider } from './call-provider'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from './query-provider'
import { LoginModalProvider } from './login-modal-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { CallOverlay } from '@/components/features/calls/call-overlay'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AppProvider>
          <CallProvider>
            <LoginModalProvider>
              {children}
              <CallOverlay />
              <Toaster />
            </LoginModalProvider>
          </CallProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
