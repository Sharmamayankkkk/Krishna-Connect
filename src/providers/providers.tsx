'use client'

import { AppProvider } from './app-provider'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from './query-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppProvider>
        {children}
        <Toaster />
      </AppProvider>
    </QueryProvider>
  )
}
