'use client';

import { Palette } from 'lucide-react';

export default function MoodboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4 text-center">
      <Palette className="h-20 w-20 text-muted-foreground/50 mb-6" />
      <h1 className="text-3xl font-bold mb-4">Feature Coming Soon</h1>
      <p className="text-muted-foreground max-w-md">
        The Moodboard feature is under development. Create and organize your visual inspirations here soon!
      </p>
    </div>
  );
}
