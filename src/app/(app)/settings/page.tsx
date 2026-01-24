"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // On large screens, redirect to first tab
    if (window.innerWidth >= 1024) {
      router.push("/settings/appearance")
    }
  }, [router])

  return (
    <div className="lg:hidden space-y-4">
      <p className="text-sm text-muted-foreground">Select a category to customize.</p>
    </div>
  )
}
