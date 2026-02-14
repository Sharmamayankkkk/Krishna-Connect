
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Calendar, Compass, Bell, Trophy, Sparkles } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { useAppContext } from '@/providers/app-provider'
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
      href: '/',
      label: 'Feed',
      icon: Sparkles,
      isActive: pathname === '/' || pathname.startsWith('/feed'),
      mobileHidden: true, // In bottom nav
    },
    {
      href: '/explore',
      label: 'Explore',
      icon: Compass,
      isActive: pathname.startsWith('/explore'),
      mobileHidden: true, // In bottom nav
    },
    {
      href: '/leela',
      label: 'Leela',
      icon: null, // Custom image icon
      customIcon: '/icons/leela.png',
      isActive: pathname.startsWith('/leela'),
      mobileHidden: true, // In bottom nav
    },
    {
      href: '/chat',
      label: 'Chat',
      icon: MessageSquare,
      isActive: pathname.startsWith('/chat') || pathname.startsWith('/calls'),
      mobileHidden: true, // In bottom nav
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: Bell,
      isActive: pathname.startsWith('/notifications'),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      href: '/challenges',
      label: 'Challenges',
      icon: Trophy,
      isActive: pathname.startsWith('/challenges'),
    },
    {
      href: '/events',
      label: 'Events',
      icon: Calendar,
      isActive: pathname.startsWith('/events'),
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

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    // Public routes that guests can access
    const publicRoutes = ['/', '/explore', '/get-verified', '/leela'];
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
          <SidebarMenuItem key={item.href} className={item.mobileHidden ? 'hidden md:block' : ''}>
            <SidebarMenuButton
              asChild
              isActive={item.isActive}
              className="w-full justify-start text-sm font-medium h-11"
            >
              <Link
                href={item.href}
                className="flex items-center"
                onClick={(e) => handleLinkClick(e, item.href)}
              >
                {item.customIcon ? (
                  <Image
                    src={item.customIcon}
                    alt={item.label}
                    width={20}
                    height={20}
                    className="mr-3"
                  />
                ) : item.icon ? (
                  <item.icon className="h-5 w-5 mr-3" />
                ) : null}
                <span>{item.label}</span>
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
