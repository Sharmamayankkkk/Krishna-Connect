
'use client';

import { AppLayout } from './app-layout';
import React from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
