'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    // For login page, render without layout wrapper
    return <>{children}</>;
  }

  // For other auth pages (signup, forgot-password, etc.), use the centered layout
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      {children}
    </div>
  );
}