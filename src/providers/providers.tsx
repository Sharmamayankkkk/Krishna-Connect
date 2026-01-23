'use client'

import { AppProvider } from './app-provider'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from './query-provider'
import { LoginModalProvider } from './login-modal-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppProvider>
        <LoginModalProvider>
          {children}
          <Toaster />
        </LoginModalProvider>
      </AppProvider>
    </QueryProvider>
  )
}
