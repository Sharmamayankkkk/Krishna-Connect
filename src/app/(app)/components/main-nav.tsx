
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
              <Link href={item.href} className="flex items-center">
                <item.icon className="h-5 w-5 mr-3" />
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
