
'use client';

import Link from "next/link";
import { MoreHorizontal, BarChart3, Bookmark } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppContext } from "@/providers/app-provider";
import { createClient } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import UserIdentity from "@/components/shared/user-identity";

function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-4" />
    </div>
  );
}

export function UserMenu() {
  const { loggedInUser, isReady } = useAppContext();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const { requireAuth } = useAuthGuard(); // Use for modal trigger if needed, or just link to login

  if (!isReady) {
    return <UserMenuSkeleton />;
  }

  if (!loggedInUser) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <Link href="/login" className="w-full">
          <Button variant="default" className="w-full justify-start">
            Log in
          </Button>
        </Link>
        <Link href="/signup" className="w-full">
          <Button variant="outline" className="w-full justify-start">
            Sign up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 p-2 h-auto">
          <UserIdentity user={loggedInUser} size="sm" className="flex-1 min-w-0" />
          <MoreHorizontal className="ml-auto h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/profile">
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </Link>
        <Link href="/bookmarks">
          <DropdownMenuItem>
            <Bookmark className="mr-2 h-4 w-4" />
            <span>Bookmarks</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/analytics">
          <DropdownMenuItem>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Analytics</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="p-1">
          <ThemeToggle />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
