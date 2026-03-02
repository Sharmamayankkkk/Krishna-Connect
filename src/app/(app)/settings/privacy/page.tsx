"use client"

import { useState, useEffect } from "react"
import { useAppContext } from "@/providers/app-provider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/utils"

export default function PrivacyPage() {
  const { loggedInUser, blockedUsers, unblockUser, updateUser } = useAppContext()
  const supabase = createClient()

  const isPrivate = loggedInUser?.is_private || false
  const [loading, setLoading] = useState(false)

  // Fetch only the profiles of blocked users by ID (no global users list needed)
  const [blockedProfiles, setBlockedProfiles] = useState<Array<{ id: string; name: string; username: string; avatar_url: string }>>([])

  useEffect(() => {
    if (!blockedUsers.length) {
      setBlockedProfiles([])
      return
    }
    supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', blockedUsers)
      .then(({ data }) => setBlockedProfiles(data || []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockedUsers.join(',')])

  const handlePrivacyToggle = async (checked: boolean) => {
    setLoading(true)
    try {
      await updateUser({ is_private: checked })
      await supabase.from('profiles').update({ is_private: checked }).eq('id', loggedInUser?.id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Privacy</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account privacy and blocked users.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Private Account</Label>
            <p className="text-sm text-muted-foreground block">
              Only people you approve can see your photos and videos. Your existing followers won't be affected.
            </p>
          </div>
          <Switch
            checked={isPrivate}
            onCheckedChange={handlePrivacyToggle}
            disabled={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="mb-4 text-sm font-medium">Blocked Users</h4>
          {blockedProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't blocked anyone yet.</p>
          ) : (
            <div className="space-y-4">
              {blockedProfiles.map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => unblockUser(user.id)}>
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
