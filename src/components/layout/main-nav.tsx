
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Calendar, Users, Compass, Bell, LayoutDashboard, Trophy, Sparkles } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { useAppContext } from '@/providers/app-provider'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

export function MainNav() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const supabase = createClient()

      const { data, error } = await supabase.rpc('get_unread_notification_count')

      if (!error && data !== null) {
        setUnreadCount(data)
      }
    }

    fetchUnreadCount()

    // Set up realtime subscription for notification changes
    const supabase = createClient()
    const channel = supabase
      .channel('notification_count_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        // Refresh count when notifications change
        fetchUnreadCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const menuItems = [
    {
      href: '/explore',
      label: 'Explore',
      icon: Users,
      isActive: pathname.startsWith('/explore') || pathname === '/',
    },
    {
      href: '/feed',
      label: 'Feed',
      icon: Sparkles,
      isActive: pathname.startsWith('/feed'),
    },
    {
      href: '/leela',
      label: 'Leela',
      icon: null, // Custom image icon
      customIcon: '/icons/leela.png',
      isActive: pathname.startsWith('/leela'),
      isComingSoon: true,
    },
    {
      href: '/chat',
      label: 'Chats',
      icon: MessageSquare,
      isActive: pathname.startsWith('/chat'),
    },
    {
      href: '/moodboard',
      label: 'Moodboard',
      icon: LayoutDashboard,
      isActive: pathname.startsWith('/moodboard'),
    },
    {
      href: '/challenges',
      label: 'Challenges',
      icon: Trophy,
      isActive: pathname.startsWith('/challenges'),
    },
    {
      href: '/status',
      label: 'Status',
      icon: Compass,
      isActive: pathname.startsWith('/status'),
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: Bell,
      isActive: pathname.startsWith('/notifications'),
    },
    {
      href: '/events',
      label: 'Events',
      icon: Calendar,
      isActive: pathname.startsWith('/events'),
    },
    {
      href: '/groups',
      label: 'Groups',
      icon: Users,
      isActive: pathname.startsWith('/groups'),
    },
    {
      href: '/get-verified',
      label: 'Get Verified',
      icon: Sparkles,
      isActive: pathname.startsWith('/get-verified'),
    }
  ]

  const { loggedInUser } = useAppContext()
  const { requireAuth } = useAuthGuard()
  const { toast } = useToast()

  const handleLinkClick = (e: React.MouseEvent, href: string, isComingSoon?: boolean) => {
    // Show info toast for coming soon features (but still allow navigation)
    if (isComingSoon) {
      toast({
        title: "🎁 Win a Verified Badge!",
        description: "Guess what Leela is and tag @krishnaConnect to win!",
        duration: 4000,
      });
    }

    // Public routes that guests can access
    const publicRoutes = ['/', '/explore', '/get-verified'];
    if (publicRoutes.some(route => href === route || href.startsWith(route + '/'))) return;

    // Check auth for everything else
    if (!loggedInUser) {
      e.preventDefault();
      requireAuth(() => { }, "Log in to access this feature");
    }
  };

  return (
    <nav>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={item.isActive}
              className="w-full justify-start text-sm font-medium h-11"
            >
              <Link
                href={item.href}
                className="flex items-center"
                onClick={(e) => handleLinkClick(e, item.href, item.isComingSoon)}
              >
                {item.customIcon ? (
                  <Image
                    src={item.customIcon}
                    alt={item.label}
                    width={20}
                    height={20}
                    className={cn("mr-3", item.isComingSoon && "opacity-50")}
                  />
                ) : item.icon ? (
                  <item.icon className="h-5 w-5 mr-3" />
                ) : null}
                <span>{item.label}</span>
                {item.isComingSoon && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">SOON</Badge>
                )}
                {item.href === '/notifications' && unreadCount > 0 && (
                  <Badge className="ml-auto">{unreadCount}</Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
        )}
      </SidebarMenu>
    </nav>
  )
}
