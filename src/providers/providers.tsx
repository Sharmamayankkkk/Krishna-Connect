'use client'

import { AppProvider } from './app-provider'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from './query-provider'
import { LoginModalProvider } from './login-modal-provider'
import { ThemeProvider } from '@/components/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AppProvider>
          <LoginModalProvider>
            {children}
            <Toaster />
          </LoginModalProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
