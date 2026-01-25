
'use client';

import { ChatLayout } from '../features/chat/chat-layout';
import { useAppContext } from '@/providers/app-context';
import React from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { chats } = useAppContext();

  return (
    <ChatLayout chats={chats}>
      {children}
    </ChatLayout>
  );
}
