
import type { Session } from "@supabase/auth-helpers-nextjs";

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  post_count?: number;
  is_following: boolean;
  follow_status?: 'none' | 'pending' | 'approved';
  verified?: boolean;
  is_private?: boolean;
}

export interface Post {
  id: number;
  content: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

// We can create a more specific type for the session prop
// to avoid importing the full Session object in every client component.
export type UserSession = Session | null;
