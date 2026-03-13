'use client'

import '@/lib/i18n'
import { AppProvider } from './app-provider'
import { CallProvider } from './call-provider'
import { StreamVideoProvider } from './stream-video-provider'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from './query-provider'
import { LoginModalProvider } from './login-modal-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { CallOverlay } from '@/components/features/calls/call-overlay'
import { I18nProvider } from './i18n-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <I18nProvider>
          <AppProvider>
            <StreamVideoProvider>
              <CallProvider>
                <LoginModalProvider>
                  {children}
                  <CallOverlay />
                  <Toaster />
                </LoginModalProvider>
              </CallProvider>
            </StreamVideoProvider>
          </AppProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
