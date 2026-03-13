"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Key,
  LogOut,
  Monitor,
  Smartphone,
  Shield,

  Trash2,
  Globe,
  Clock,
  AlertTriangle,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

import { PhoneCollectionDialog } from "@/components/auth/phone-collection-dialog"
import { useTranslation } from "react-i18next"

interface SessionInfo {
  id: string
  device: string
  browser: string
  location: string
  lastActive: string
  isCurrent: boolean
  icon: typeof Monitor
}

export default function SecurityPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const { t } = useTranslation()

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      if (data) {
        setUserPhone(data.phone);
      }
    }
  }

  useEffect(() => {
    fetchProfile();

    // Detect current session info from browser
    const ua = navigator.userAgent
    const isMobile = /Mobile|Android|iPhone/.test(ua)

    let browser = "Browser"
    if (/Edg/.test(ua)) browser = "Edge"
    else if (/Chrome/.test(ua)) browser = "Chrome"
    else if (/Firefox/.test(ua)) browser = "Firefox"
    else if (/Safari/.test(ua)) browser = "Safari"

    setSessions([
      {
        id: "current",
        device: isMobile ? "Mobile Device" : "Desktop",
        browser,
        location: "Current Location",
        lastActive: "Active now",
        isCurrent: true,
        icon: isMobile ? Smartphone : Monitor,
      },
    ])
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }



  const handleDeleteAccount = async () => {
    toast({
      title: t("account.deletionRequested"),
      description: t("account.deletionContact"),
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.security.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.security.pageDescription')}
        </p>
      </div>

      <div className="space-y-4">
        {/* Password */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-medium">{t('settings.security.password')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('settings.security.passwordDescription')}
              </p>
            </div>
          </div>
          <Link href="/update-password">
            <Button variant="outline" size="sm">{t('settings.security.change')}</Button>
          </Link>
        </div>

        {/* Phone Number */}
        <div className="flex items-center justify-between rounded-lg border p-4 opacity-70">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/10 p-2">
              <Smartphone className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">{t('settings.security.phoneNumber')}</h4>
                <Badge variant="secondary" className="text-[10px]">{t('common.temporarilyUnavailable')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings.security.phoneDisabled')}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled title="Phone number updates are temporarily disabled">
            {userPhone ? t('settings.security.change') : t('settings.security.add')}
          </Button>
        </div>

        <PhoneCollectionDialog
          open={isPhoneDialogOpen}
          onOpenChange={setIsPhoneDialogOpen}
          onSuccess={() => fetchProfile()}
          currentPhone={userPhone}
        />

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/10 p-2">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">{t('settings.security.twoFactor')}</h4>
                <Badge variant="secondary" className="text-[10px]">{t('common.comingSoon')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings.security.twoFactorDescription')}
              </p>
            </div>
          </div>
          <Switch
            checked={false}
            disabled
            aria-label="Toggle two-factor authentication"
          />
        </div>

        {/* Login Alerts */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">{t('settings.security.loginAlerts')}</h4>
                <Badge variant="secondary" className="text-[10px]">{t('common.comingSoon')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings.security.loginAlertsDescription')}
              </p>
            </div>
          </div>
          <Switch
            checked={false}
            disabled
            aria-label="Toggle login alerts"
          />
        </div>
      </div>

      {/* Active Sessions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('settings.security.activeSessions')}</h4>
        <div className="space-y-2">
          {sessions.map((session) => {
            const SessionIcon = session.icon
            return (
              <div key={session.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <SessionIcon className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{session.device}</h4>
                      {session.isCurrent && (
                        <Badge variant="default" className="text-[10px] bg-green-500">{t('settings.security.thisDevice')}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span>{session.browser}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{session.lastActive}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Data & Account */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('settings.security.dataAccount')}</h4>
        <div className="space-y-2">


          {/* Sign Out All */}
          <div className="flex items-center justify-between rounded-lg border p-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-500/10 p-2">
                <LogOut className="h-4 w-4 text-orange-500" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-medium text-orange-900 dark:text-orange-200">{t('settings.security.signOutAll')}</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {t('settings.security.signOutAllDescription')}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950" onClick={handleSignOut}>
              {t('settings.security.signOut')}
            </Button>
          </div>

          {/* Delete Account */}
          <AlertDialog>
            <div className="flex items-center justify-between rounded-lg border p-4 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-500/10 p-2">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium text-red-900 dark:text-red-200">{t('settings.security.deleteAccount')}</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {t('settings.security.deleteAccountDescription')}
                  </p>
                </div>
              </div>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">{t('common.delete')}</Button>
              </AlertDialogTrigger>
            </div>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('settings.security.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settings.security.deleteConfirmDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteAccount}
                >
                  {t('dialogs.yesDelete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
