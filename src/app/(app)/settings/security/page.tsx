"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/providers/app-provider"
import { createClient } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function SecurityPage() {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security settings.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium">Password</h4>
            <p className="text-sm text-muted-foreground">
              Change your password to keep your account secure.
            </p>
          </div>
          <Link href="/auth/update-password">
            <Button variant="outline">Change Password</Button>
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium text-red-900 dark:text-red-200">Log out of all sessions</h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              This will sign you out from all devices.
            </p>
          </div>
          <Button variant="destructive" onClick={handleSignOut}>
            Log Out All
          </Button>
        </div>
      </div>
    </div>
  )
}
