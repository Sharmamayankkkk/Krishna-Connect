"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Palette,
  Shield,
  Lock,
  TrendingUp,
  Globe,
  ChevronRight
} from "lucide-react"
import { useTranslation } from "react-i18next"

export default function SettingsPage() {
  const router = useRouter()
  const { t } = useTranslation()

  const settingsCategories = [
    {
      name: t("settings.appearance.title"),
      description: t("settings.appearance.description"),
      href: "/settings/appearance",
      icon: Palette
    },
    {
      name: t("settings.language.title"),
      description: t("settings.language.description"),
      href: "/settings/language",
      icon: Globe
    },
    {
      name: t("settings.privacy.title"),
      description: t("settings.privacy.description"),
      href: "/settings/privacy",
      icon: Shield
    },
    {
      name: t("settings.security.title"),
      description: t("settings.security.description"),
      href: "/settings/security",
      icon: Lock
    },
    {
      name: t("settings.promotions.title"),
      description: t("settings.promotions.description"),
      href: "/settings/promotions",
      icon: TrendingUp
    }
  ]

  useEffect(() => {
    // On large screens, redirect to first tab
    if (window.innerWidth >= 1024) {
      router.push("/settings/appearance")
    }
  }, [router])

  return (
    <div className="lg:hidden space-y-2 p-4">
      <h1 className="text-xl font-semibold mb-4">{t('settings.title')}</h1>
      <nav className="space-y-2" aria-label="Settings categories">
        {settingsCategories.map((category) => {
          const Icon = category.icon
          return (
            <Link key={category.href} href={category.href}>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-4 px-4"
              >
                <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {category.description}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
