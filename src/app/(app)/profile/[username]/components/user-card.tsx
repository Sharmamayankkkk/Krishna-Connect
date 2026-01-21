
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from '@/types';

interface UserCardProps {
  user: User;
}

import { getAvatarUrl } from '@/lib/utils'; // Assuming absolute import path works here too

export function UserCard({ user }: UserCardProps) {
  return (
    <Link href={`/profile/${encodeURIComponent(user.username)}`} prefetch={false}>
      <div className="flex items-center space-x-4 p-2 hover:bg-muted rounded-lg">
        <Avatar>
          <AvatarImage src={getAvatarUrl(user.avatar_url)} alt={`${user.username}'s avatar`} />
          <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{user.full_name || user.username}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>
    </Link>
  );
}
