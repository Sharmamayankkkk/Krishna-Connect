"use client"

import { Suspense } from 'react';
import Feed from './explore/feed';

export default function FeedPage() {
  return (
    <Suspense>
      <Feed />
    </Suspense>
  );
}
